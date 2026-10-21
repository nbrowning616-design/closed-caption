/* Closed Caption — THE SKIP gags (skips.js): 50 hand-drawn "Mulligan" gags (CCMulligan). Nick: "Those are perfect.
   Just need 50 of those." (Oct 21 2026; scratchpad anim/mulligan_all50.html). ~440 KB, so a phone only fetches it
   once it has a seat at a table (index.html loadSkips). The server picks the gag (game.js SKIP_GAGS, dealt per night) so
   every phone plays the same one at the same moment. Built by scratchpad rb/build_anim.py from anim/mull_tools. */
/* ═══════════════════════════════════════════════════════════════════════
   Closed Caption — MULLIGAN skip gags  (CCMulligan)
   Self-contained: inline SVG + vanilla JS. No libraries, no network.

   CCMulligan.play(container, opts) -> Promise<{kind}>
     container : positioned element the gag plays inside (an overlay is added, then removed)
     opts.kind : 'golf' | 'goat' | 'demo' | 'critic' | 'magic' | 'free'   (omit = next from shuffle bag)
     opts.target : the cartoon card element to replace (its rect + <img> are used; it is hidden and
                   left hidden so the caller can swap in the next cartoon)
     opts.src / opts.rect : alternative to target ({x,y,w,h} in container px)
     opts.frame : card frame geometry {border:4, pad:5, radius:10, shadow:7} (the game's .cartoon card)
     opts.line : closing line (default 'Mulligan.'; null = none)
     opts.onCue(name, kind) : sound cue hook — names listed in each gag's `cues`
     opts.speed, opts.seed, opts.reducedMotion (default: the OS setting)
   CCMulligan.next() -> kind   shuffle bag; never the same gag twice in a row, all six before a repeat
   CCMulligan.still(container, opts, t) -> stage   renders one frame at time t (for tests / thumbnails)
   ═══════════════════════════════════════════════════════════════════════ */
const CCMulligan = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1F1A17', HALO = '#FFFFFF';
  const WASH = 'rgba(31,26,23,0.12)', WASH2 = 'rgba(31,26,23,0.22)';
  const FRAME = { border: 4, pad: 5, radius: 10, shadow: 7 };
  let UID = 0;

  /* ── math ── */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const E = {
    lin: t => t, in: t => t * t, out: t => 1 - (1 - t) * (1 - t),
    io: t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t),
    in3: t => t * t * t, out3: t => 1 - Math.pow(1 - t, 3),
    back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    hold: t => t < 1 ? 0 : 1,
  };
  function hash(n) { n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  const rnd = (s, i) => hash(Math.imul(s | 0, 7919) + Math.imul(i | 0, 104729) + 12345);
  const rot = (pt, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = pt[0] - c[0], y = pt[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
  const rotv = (v, a) => rot(v, [0, 0], a);
  const qb = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  const mixPt = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

  function mix(a, b, k) {
    if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, k);
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mix(v, b[i], k));
    if (a && b && typeof a === 'object' && typeof b === 'object') { const o = {}; for (const key in b) o[key] = key in a ? mix(a[key], b[key], k) : b[key]; for (const key in a) if (!(key in o)) o[key] = a[key]; return o; }
    return k < 1 ? a : b;
  }
  /* keyframes: [[t, {partial values}, ease?], ...]; missing values carry over from the previous key */
  function track(keys) {
    const K = []; let prev = {};
    for (const [t, v, e] of keys) { const full = Object.assign({}, prev, v); K.push([t, full, e || 'io']); prev = full; }
    return t => {
      if (t <= K[0][0]) return Object.assign({}, K[0][1]);
      for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
        const [t0, v0] = K[i - 1], [t1, v1, e] = K[i];
        return mix(v0, v1, E[e]((t - t0) / (t1 - t0 || 1)));
      }
      return Object.assign({}, K[K.length - 1][1]);
    };
  }

  /* ── the pen: wobbly hand-drawn lines with a paper halo, re-jittered per boil state ── */
  function catmull(P, closed) {
    const n = P.length, f = v => Math.round(v * 10) / 10;
    if (n < 2) return '';
    let d = `M${f(P[0][0])},${f(P[0][1])}`;
    if (n === 2 && !closed) return d + `L${f(P[1][0])},${f(P[1][1])}`;
    const get = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
  }
  class Pen {
    constructor(boil, U, seed) {
      this.b = boil; this.U = U; this.k = 0; this.s = seed | 0;
      this.lw = Math.max(1.6, U * 0.02);
      this.amp = Math.max(0.65, U * 0.0085);
      this.gs = []; this.g();
    }
    g(o) { this.cur = { h: [], i: [], halo: !(o && o.halo === false), op: o && o.op != null ? o.op : null }; this.gs.push(this.cur); return this; }
    wob(pts, closed, amp) {
      const s = (this.k++) * 31 + this.b * 977 + this.s * 13 + 7;
      if (amp == null) amp = this.amp;
      const step = Math.max(7, this.U * 0.085), n = pts.length, P = [];
      const segs = closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
        for (let j = 0; j < m; j++) P.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]);
      }
      if (!closed) P.push([pts[n - 1][0], pts[n - 1][1]]);
      if (amp > 0) {
        const gx = (rnd(s, 901) - .5) * amp, gy = (rnd(s, 902) - .5) * amp;
        for (let i = 0; i < P.length; i++) { P[i][0] += gx + (rnd(s, i * 2) - .5) * 2 * amp; P[i][1] += gy + (rnd(s, i * 2 + 1) - .5) * 2 * amp; }
      }
      return catmull(P, closed);
    }
    put(d, o) {
      const w = (o.w || 1) * this.lw, fill = o.fill || 'none', ns = o.stroke === false;
      if (this.cur.halo && o.halo !== false && !ns) this.cur.h.push(`<path d="${d}" stroke-width="${(w + this.lw * 2.4).toFixed(1)}"${fill !== 'none' && !/rgba/.test(fill) ? ` fill="${HALO}"` : ''}/>`);
      this.cur.i.push(`<path d="${d}" fill="${fill}"${ns ? ' stroke="none"' : ` stroke="${o.color || INK}" stroke-width="${w.toFixed(2)}"`}${o.op != null ? ` opacity="${(+o.op).toFixed(3)}"` : ''}/>`);
      return this;
    }
    line(pts, o = {}) { return this.put(this.wob(pts, false, o.amp), o); }
    shape(pts, o = {}) { return this.put(this.wob(pts, true, o.amp), o); }
    circ(cx, cy, r, o = {}) {
      const n = o.n || clamp(Math.round(r / 2), 8, 16), pts = [];
      for (let i = 0; i < n; i++) { const a = (o.a0 || 0) + i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r * (o.sx || 1), cy + Math.sin(a) * r * (o.sy || 1)]); }
      const oo = Object.assign({}, o); if (oo.amp == null) oo.amp = Math.min(this.amp * 0.8, r * 0.06);
      return this.shape(pts, oo);
    }
    dot(x, y, r, color) { this.cur.i.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color || INK}"/>`); return this; }
    raw(s) { this.cur.i.push(s); return this; }
    svg() {
      return this.gs.map(g => (!g.h.length && !g.i.length) ? '' :
        `<g${g.op != null ? ` opacity="${(+g.op).toFixed(3)}"` : ''}>` +
        (g.h.length ? `<g fill="none" stroke="${HALO}" stroke-linecap="round" stroke-linejoin="round">${g.h.join('')}</g>` : '') +
        `<g stroke-linecap="round" stroke-linejoin="round">${g.i.join('')}</g></g>`).join('');
    }
  }

  /* ── stick-figure rig: hip + feet + hands targets, two-bone IK for knees/elbows ── */
  function ik(a, t, l1, l2, bend) {
    let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy) || 0.001;
    const mx = (l1 + l2) * 0.999; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    const base = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const ang = base + bend * Math.acos(c);
    return [[a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1], [a[0] + dx, a[1] + dy]];
  }
  const sgnOf = f => f > 0.35 ? 1 : f < -0.35 ? -1 : 0;

  function faceDraw(p, P, hc, hr, st) {
    const f = P.face || 0, look = P.look || 0;
    const ey = hc[1] - hr * 0.08 + look * hr * 0.22, ex = hc[0] + f * hr * 0.46;
    const sp = hr * 0.33 * (1 - Math.abs(f) * 0.5);
    const xs = Math.abs(f) > 0.88 ? [ex + f * hr * 0.06] : [ex - sp, ex + sp];
    xs.forEach(x => P.blink ? p.line([[x - hr * .14, ey], [x + hr * .14, ey]], { w: .7, amp: .2, halo: false }) : p.dot(x, ey, Math.max(1.15, hr * 0.088)));
    if (P.brow) xs.forEach(x => p.line([[x - hr * .17, ey - hr * .28], [x + hr * .17, ey - hr * .25]], { w: .62, amp: .15, halo: false }));
    if (st.glasses) {
      const gr = hr * 0.21;
      xs.forEach(x => p.circ(x, ey, gr, { w: .6, halo: false, n: 8, amp: .2 }));
      if (xs.length === 2) p.line([[xs[0] + gr, ey], [xs[1] - gr, ey]], { w: .6, halo: false, amp: .1 });
      else { const s = Math.sign(f); p.line([[xs[0] - s * gr, ey], [hc[0] - s * hr * .55, ey - hr * .05]], { w: .6, halo: false, amp: .1 }); }
    }
    if (Math.abs(f) > 0.35) { const s = Math.sign(f); p.line([[hc[0] + s * hr * .9, hc[1] - hr * .04 + look * hr * .1], [hc[0] + s * hr * 1.24, hc[1] + hr * .2], [hc[0] + s * hr * .93, hc[1] + hr * .28]], { w: .8, amp: .25, halo: false }); }
    if (st.mustache) {
      const mx = hc[0] + f * hr * 0.58, my = hc[1] + hr * 0.4 + look * hr * .08, mw = hr * (0.44 - Math.abs(f) * 0.14);
      p.line([[mx - mw, my + hr * .1], [mx - mw * .45, my - hr * .03], [mx, my + hr * .05], [mx + mw * .45, my - hr * .03], [mx + mw, my + hr * .1]], { w: 1.15, amp: .3, halo: false });
    }
    if (P.mouth === 'o') p.circ(hc[0] + f * hr * .62, hc[1] + hr * .44, hr * .13, { w: .7, halo: false, n: 8, amp: .15 });
  }

  function hatDraw(p, P, hc, hr, st) {
    const s = sgnOf(P.face || 0), tilt = P.tilt || 0, back = !!P.back;
    const T = pts => pts.map(([x, y]) => rot([hc[0] + x * hr, hc[1] + y * hr], hc, tilt));
    const fillHat = P.dusted ? '#E4DED6' : '#fff';
    if (st.hat === 'cap') {
      if (s) {
        p.shape(T([[-1.04, -.25], [-.98, -.7], [-.55, -1.08], [.15, -1.17], [.78, -1.0], [1.12, -.6], [1.1, -.3], [.6, -.3]].map(([x, y]) => [x * s, y])), { fill: '#fff' });
        p.shape(T([[.6, -.32], [1.52, -.22], [1.48, -.12], [.66, -.2]].map(([x, y]) => [x * s, y])), { fill: INK, w: .8 });
      } else {
        p.shape(T([[-1.08, -.28], [-1.0, -.72], [-.55, -1.1], [.1, -1.17], [.62, -1.05], [1.02, -.74], [1.08, -.28], [0, -.4]]), { fill: '#fff' });
        if (!back) p.shape(T([[-.82, -.32], [0, -.44], [.82, -.32], [.6, -.2], [0, -.17], [-.6, -.2]]), { fill: INK, w: .8 });
      }
    } else if (st.hat === 'hard') {
      p.shape(T([[-.98, -.24], [-.9, -.74], [-.45, -1.12], [.45, -1.12], [.9, -.74], [.98, -.24]]), { fill: fillHat });
      p.line(T(s ? [[-1.08 * s, -.24], [1.5 * s, -.24]] : [[-1.32, -.24], [1.32, -.24]]), { w: 1.5 });
      if (!s) p.line(T([[0, -1.1], [0, -.3]]), { w: .8, halo: false });
      else p.line(T([[-.15 * s, -1.08], [.55 * s, -.85]]), { w: .8, halo: false });
    } else if (st.hat === 'top') {
      p.shape(T([[-.6, -.72], [-.64, -2.02], [.64, -2.02], [.6, -.72]]), { fill: INK });
      p.shape(T([[-1.22, -.74], [-1.12, -.86], [1.12, -.86], [1.22, -.74], [0, -.64]]), { fill: INK });
      p.line(T([[-.6, -.98], [.6, -.98]]), { color: '#fff', w: 1.1, halo: false, amp: .15 });
    } else if (st.hat === 'beret') {
      const pts = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pts.push(rotv([Math.cos(a) * 1.1 + .12 * (s || .4), Math.sin(a) * .36 - .84], -.12)); }
      p.shape(T(pts), { fill: INK });
      p.line(T([[.05, -1.18], [.12, -1.34]]), { w: 1.2 });
    } else if (st.hat === 'hair') {
      let pts;
      if (back) pts = [[-1.03, 0], [-1.0, -.6], [-.6, -.98], [0, -1.08], [.6, -.98], [1.0, -.6], [1.03, 0], [.6, .14], [0, .17], [-.6, .14]];
      else if (s) pts = [[-1.03, -.05], [-1.0, -.6], [-.62, -.98], [0, -1.08], [.6, -.97], [.94, -.6], [.7, -.55], [.2, -.62], [-.2, -.46], [-.5, -.3], [-.62, -.04]].map(([x, y]) => [x * s, y]);
      else pts = [[-1.02, -.2], [-.98, -.62], [-.62, -.97], [0, -1.08], [.62, -.97], [.98, -.62], [1.02, -.2], [.84, -.44], [.36, -.56], [.14, -.45], [-.04, -.6], [-.55, -.53], [-.88, -.38]];
      p.shape(T(pts), { fill: INK, w: .8 });
    }
  }

  function figure(p, S, P, st = {}) {
    const U = S.U, f = P.face || 0, back = !!P.back, sg = sgnOf(f);
    const hip = P.hip, lean = P.lean || 0, T = U * 0.31, hr = U * 0.1;
    const neck = [hip[0] + Math.sin(lean) * T, hip[1] - Math.cos(lean) * T];
    const hd = P.hd || [0, 0];
    const hc = [neck[0] + Math.sin(lean) * hr * 1.1 + hd[0], neck[1] - Math.cos(lean) * hr * 1.1 + hd[1]];
    const sh = [lerp(neck[0], hip[0], 0.08), lerp(neck[1], hip[1], 0.08)];
    const kb = P.kb || (sg ? [-sg, -sg] : [1, -1]);
    const eb = P.eb || (sg ? [sg, sg] : [1, -1]);
    const J = { hip, neck, hc, hr, sh };
    p.g();
    [['fL', 0], ['fR', 1]].forEach(([k, i]) => {
      const [kn, ft] = ik(hip, P[k], U * 0.235, U * 0.235, kb[i]);
      p.line([hip, kn]); p.line([kn, ft]);
      const fd = P.fdir ? P.fdir[i] : (sg || (i ? 1 : -1));
      p.line([ft, [ft[0] + fd * U * 0.055, ft[1]]]);
      J[k] = ft;
    });
    if (st.belly && sg && !back) { const m = [lerp(hip[0], neck[0], .42) + sg * U * .075, lerp(hip[1], neck[1], .42)]; p.line([hip, m, neck]); }
    else p.line([hip, neck]);
    if (st.tie && !back) {
      const kx = lerp(neck[0], hip[0], .07) + sg * U * .022, ky = lerp(neck[1], hip[1], .07), tw = sg ? U * .011 : U * .02;
      const sw = P.tieSwing || 0;
      p.shape([[kx, ky], [kx - tw, ky + U * .035], [kx + sw * U, ky + U * .16], [kx + tw, ky + U * .035]], { fill: INK, w: .6, amp: .25 });
    }
    if (st.bow && !back) {
      const bx = lerp(neck[0], hip[0], .06) + sg * U * .02, by = lerp(neck[1], hip[1], .06), bw = sg ? U * .025 : U * .045;
      p.shape([[bx, by], [bx - bw, by - U * .024], [bx - bw, by + U * .024]], { fill: INK, w: .6, amp: .2 });
      p.shape([[bx, by], [bx + bw, by - U * .024], [bx + bw, by + U * .024]], { fill: INK, w: .6, amp: .2 });
    }
    const arms = () => [['hL', 0], ['hR', 1]].forEach(([k, i]) => {
      const [el, hn] = ik(sh, P[k], U * 0.17, U * 0.17, eb[i]);
      p.line([sh, el]); p.line([el, hn]);
      J[k] = hn;
    });
    if (!P.armsFront) arms();
    p.circ(hc[0], hc[1], hr, { fill: P.headFill || '#fff' });
    if (!back) faceDraw(p, P, hc, hr, st);
    hatDraw(p, P, hc, hr, st);
    if (P.armsFront) arms();
    return J;
  }

  /* walking: feet plant/swing on a stride, hip bobs, arms counter-swing; settles into a stance */
  function walk(S, P, t, t0, t1, x0, x1, o = {}) {
    const U = S.U, G = S.G, dir = x1 >= x0 ? 1 : -1;
    const k = clamp((t - t0) / (t1 - t0), 0, 1), x = o.x != null ? o.x : lerp(x0, x1, o.ease ? E.out(k) : k);
    const L = U * (o.stride || 0.62), u = Math.abs(x - x0) / L;
    const w = o.x != null ? 0 : k > 0.8 ? E.io((k - 0.8) / 0.2) : 0;
    const lift = o.lift != null ? o.lift : 0.065;
    const feet = [0, 0.5].map(off => {
      const v = u + off, n = Math.floor(v), ph = v - n;
      let fx = (n - off) * L + L / 4, lf = 0;
      if (ph >= 0.5) { const s = (ph - 0.5) * 2; fx += L * E.io(s); lf = Math.sin(Math.PI * s) * U * lift; }
      return [x0 + dir * fx, G - lf];
    });
    const fs = feet[0][0] < feet[1][0] ? feet : [feet[1], feet[0]];
    const sp = o.spread != null ? o.spread : 0.07;
    const out = Object.assign({}, P);
    out.fL = [lerp(fs[0][0], x1 - U * sp, w), lerp(fs[0][1], G, w)];
    out.fR = [lerp(fs[1][0], x1 + U * sp, w), lerp(fs[1][1], G, w)];
    const bob = U * 0.012 * Math.cos(4 * Math.PI * (u - 0.25)) * (1 - w);
    out.hip = [x, G - U * (o.hipH || 0.415) - bob];
    if (!o.carry) {
      out.hL = [x - (feet[1][0] - x) * 0.55 * (1 - w), G - U * 0.44];
      out.hR = [x - (feet[0][0] - x) * 0.55 * (1 - w), G - U * 0.44];
    }
    out.face = o.face != null ? o.face : dir;
    out.lean = (o.lean != null ? o.lean : dir * 0.05) * (1 - w) + (P.lean || 0) * w;
    return out;
  }

  function shadow(p, x, G, rx, op) { p.g({ halo: false, op: op }); p.circ(x, G + 1, rx, { sy: 0.13, fill: WASH, stroke: false, amp: .3, n: 12 }); }
  function burst(p, c, r0, r1, n, a0, w) {
    p.g({ halo: false });
    for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI * 2; p.line([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1]], { w: w || .8, amp: .3 }); }
  }
  function star(p, c, r, n, seed, fill) {
    const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + seed; const rr = i % 2 ? r * .45 : r * (.8 + rnd(seed * 100, i) * .4); pts.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]); }
    p.g(); p.shape(pts, { fill: fill || '#fff', w: .8, amp: .4 });
  }
  /* path helpers for scribbles: cumulative lengths + point at fraction */
  function pathLen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
  function along(pts, L, q) {
    const tot = L[L.length - 1], d = clamp(q, 0, 1) * tot;
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const k = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    const pt = mixPt(pts[i - 1], pts[i], clamp(k, 0, 1));
    return { pt, upto: pts.slice(0, i).concat([pt]), dir: [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]] };
  }
  const polyD = pts => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');

  const GAGS = {};

  /* ═════════ 1. THE MULLIGAN — a golfer's full pre-shot routine, a slice, and a fresh ball ═════════ */
  GAGS.golf = {
    name: 'The Mulligan', dur: 3.85, ones: [[1.84, 2.3]],
    cues: [[0.05, 'footsteps'], [1.0, 'waggle'], [1.62, 'swish-back'], [1.93, 'thwack'], [2.0, 'whistle-away'], [2.95, 'distant-plink'], [3.5, 'ball-bounce']],
    setup(S) {
      const { U, G, c } = S;
      const ax = S.ax = c.x + c.w * 0.3;
      S.x0 = -U * 0.55;
      const A = (dx, dy) => [ax + dx * U, G - dy * U];
      S.trk = track([
        [0.62, { hip: A(0, .415), lean: .04, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hand: A(.08, .66), hand2: A(.05, .62), club: -2.45 }],
        [0.86, { hip: A(0, .395), lean: 0, face: 0, look: 1, fL: A(-.13, 0), fR: A(.13, 0), hand: A(.0, .345), hand2: A(.0, .345), club: 1.29, hd: [0, U * .012] }],
        [0.96, {}],
        [1.02, { club: 1.12, hand: A(.02, .35) }],
        [1.08, { club: 1.45, hand: A(-.01, .34) }],
        [1.14, { club: 1.29, hand: A(.0, .345), face: .75, look: 0, hd: [U * .01, 0] }],
        [1.30, {}],
        [1.38, { face: 0, look: 1, hd: [0, U * .012] }],
        [1.58, { hand: A(-.16, .47), club: 3.2, hip: A(-.015, .395), lean: -.03 }],
        [1.80, { hand: A(-.16, .8), club: 5.25, hip: A(-.03, .4), lean: -.07, fR: A(.115, 0) }, 'out'],
        [1.86, {}],
        [1.91, { hand: A(-.12, .5), club: 3.75, hip: A(-.01, .395), lean: -.02 }, 'in'],
        [1.95, { hand: A(.01, .345), club: 1.33, hip: A(0, .395), lean: 0, fR: A(.13, 0) }, 'lin'],
        [2.02, { hand: A(.19, .47), club: 0.05, face: .6, look: -.4, hip: A(.03, .4), hd: [U * .01, 0] }, 'out'],
        [2.14, { hand: A(.12, .8), club: -2.3, face: 1, look: -.9, hip: A(.05, .41), lean: .08, fL: A(-.06, 0), hd: [U * .015, -U * .005] }, 'out'],
        [2.62, {}],
        [2.82, { hand: A(.15, .36), club: 1.22, hand2: A(.19, .9), face: 1, look: -.35, hip: A(.03, .415), lean: .02, fL: A(-.1, 0), fR: A(.1, 0), hd: [0, 0] }],
        [3.12, { look: -.15 }],
        [3.28, { hand2: A(-.08, .42), face: 0, look: 0 }],
        [3.40, { hand2: A(.0, .5), look: .7 }],
        [3.62, { look: 1, hd: [0, U * .01] }],
      ]);
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      let P = S.trk(t);
      if (t < 0.62) {
        P = walk(S, P, t, 0, 0.62, S.x0, S.ax, { carry: true });
        P.hand = [P.hip[0] + U * .09, P.hip[1] - U * .25]; P.hand2 = [P.hip[0] + U * .05, P.hip[1] - U * .2]; P.club = -2.45;
      }
      const sep = t >= 2.62, cl = [Math.cos(P.club), Math.sin(P.club)];
      if (t < 0.62 || sep) { P.hL = P.hand2; P.hR = P.hand; }
      else { P.hL = P.hand; P.hR = [P.hand[0] + cl[0] * U * .035, P.hand[1] + cl[1] * U * .035]; }
      P.armsFront = sep && t < 3.24;
      shadow(p, P.hip[0], G, U * .2);
      const headAt = Q => [Q.hand[0] + Math.cos(Q.club) * U * .36, Q.hand[1] + Math.sin(Q.club) * U * .36];
      if (t > 1.865 && t < 1.99) {   // swing smear
        const pts = [-.07, -.05, -.035, -.02, -.008, 0].map(d => headAt(S.trk(t + d)));
        p.g({ halo: false }); p.line(pts, { w: .7, color: 'rgba(31,26,23,.4)', amp: .2 });
        p.line(pts.map(q => [q[0], q[1] + U * .025]), { w: .5, color: 'rgba(31,26,23,.25)', amp: .2 });
      }
      const club = () => {
        p.g();
        const grip = P.hand, hd = headAt(P), pr = [Math.cos(P.club - Math.PI / 2), Math.sin(P.club - Math.PI / 2)];
        p.line([[grip[0] - cl[0] * U * .03, grip[1] - cl[1] * U * .03], hd], { w: .75, amp: .3 });
        p.line([[hd[0] - pr[0] * U * .012, hd[1] - pr[1] * U * .012], [hd[0] + pr[0] * U * .05, hd[1] + pr[1] * U * .05]], { w: 2, amp: .2 });
      };
      const behind = t < .62 || (t >= 1.62 && t < 1.9) || (t >= 2.06 && t < 2.66);   // club behind his head at the top and the finish
      if (behind) club();
      figure(p, S, P, { hat: 'cap', mustache: true });
      if (!behind) club();
      if (t >= 1.95 && t < 2.07) burst(p, [S.ax + U * .1, G - U * .03], U * .06, U * .13, 6, -.3, .9);
      // the cartoon: struck, it tumbles away into the distance and slices right
      if (t >= 1.95) {
        const k = seg(t, 1.99, 2.95);
        const P0 = [c.x + c.w / 2, c.y + c.h / 2], P1 = [c.x + c.w * .64, c.y - c.h * .4], P2 = S.vanish = [c.x + c.w * .92, c.y + c.h * .16];
        if (t < 1.99) S.setCard({ sx: 1.04, sy: .95, rot: -1.5, py: c.h });
        else {
          const u = E.out(k), s = 1 / (1 + 24 * Math.pow(k, .8)), fl = Math.cos(k * Math.PI * 5);
          S.setCard({ tx: qb(P0[0], P1[0], P2[0], u) - P0[0], ty: qb(P0[1], P1[1], P2[1], u) - P0[1], rot: -k * 400, sx: s * (Math.abs(fl) < .15 ? .15 * (fl < 0 ? -1 : 1) : fl), sy: s, op: k > .9 ? 1 - (k - .9) / .1 : 1, hide: k >= 1 });
          if (k < .35) { p.g({ halo: false }); const cc = [qb(P0[0], P1[0], P2[0], u), qb(P0[1], P1[1], P2[1], u)]; for (let i = 0; i < 3; i++) p.line([[cc[0] - U * (.25 + i * .06), cc[1] + U * (.25 - i * .1)], [cc[0] - U * (.12 + i * .04), cc[1] + U * (.12 - i * .06)]], { w: .6, color: 'rgba(31,26,23,.45)', amp: .2 }); }
        }
      }
      if (t >= 2.93 && t < 3.06) burst(p, S.vanish, U * .015, U * .045, 5, .4, .6);
      if (t >= 3.36) {   // he drops another ball
        const r = U * .03; let x, y;
        if (t < 3.46) { x = P.hand2[0]; y = P.hand2[1] + U * .035; }
        else {
          const Q = S.trk(3.46), tb = t - 3.46, y0 = Q.hand2[1] + U * .035;
          x = Q.hand2[0] + Math.min(tb, .45) * U * .09;
          if (tb < .16) y = lerp(y0, G - r, (tb / .16) * (tb / .16));
          else if (tb < .32) { const q = (tb - .16) / .16; y = G - r - U * .08 * 4 * q * (1 - q); }
          else if (tb < .42) { const q = (tb - .32) / .1; y = G - r - U * .025 * 4 * q * (1 - q); }
          else y = G - r;
        }
        p.g(); p.circ(x, y, r, { fill: '#fff', w: .8, n: 8 });
      }
    }
  };

  /* ═════════ 2. THE GOAT — grazes the bottom edge, eats the rest, makes eye contact ═════════ */
  function goatDraw(p, S, o) {
    const g = S.g, G = S.G, bx = o.bx;
    const B = (x, y) => [bx + x * g, G - y * g];
    const H = (x, y) => { const q = rotv([x * g, y * g], o.hr || 0); return [o.hx + q[0], o.hy + q[1]]; };
    const legs = [[-.21, 0, 1], [.15, Math.PI, 1], [-.15, Math.PI, 0], [.21, 0, 0]];   // x, phase, far?
    const leg = ([lx, ph]) => {
      const sw = o.moving ? Math.sin(o.phase * Math.PI * 2 + ph) : 0;
      const top = B(lx, .36), ft = [top[0] + sw * .06 * g, G - (o.moving ? Math.max(0, Math.cos(o.phase * Math.PI * 2 + ph)) * .035 * g : 0)];
      p.line([top, ft]); p.line([[ft[0] - .015 * g, ft[1]], [ft[0] + .012 * g, ft[1]]], { w: 1.4, amp: .2 });
    };
    shadow(p, bx, G, .34 * g);
    p.g();
    legs.filter(l => l[2]).forEach(leg);
    const ta = o.tail || 0;   // tail flick
    p.line([B(.27, .5), [B(.27, .5)[0] + Math.cos(-1.1 - ta) * .08 * g, B(.27, .5)[1] + Math.sin(-1.1 - ta) * .08 * g]], { w: 1.1 });
    const bl = o.belly || 1;
    p.shape([[-.28, .45], [-.22, .55], [0, .565], [.2, .55], [.29, .5], [.3, .42], [.24, .345 - (bl - 1) * .5], [0, .335 - (bl - 1) * .7], [-.2, .345 - (bl - 1) * .5], [-.29, .4]].map(([x, y]) => B(x, y)), { fill: '#fff' });
    p.line([B(-.08, .52), B(.12, .52)], { w: .5, halo: false, color: 'rgba(31,26,23,.35)' });
    legs.filter(l => !l[2]).forEach(leg);
    const front = o.view >= .5;
    const hb = front ? H(.04, -.02) : H(.065, -.03), ht = front ? H(.02, .07) : H(.04, .065);
    const n1 = B(-.15, .555), n2 = B(-.29, .43);
    p.shape([n1, hb, ht, n2], { fill: '#fff', stroke: false });
    p.line([n1, hb]); p.line([n2, ht]);
    if (!front) {
      const jw = (o.jaw || 0) * .018;
      p.shape([[.07, -.045], [.02, -.075], [-.05, -.066], [-.12, -.026], [-.165, .02], [-.16, .045], [-.13, .055 + jw], [-.06, .072 + jw * .7], [.02, .07], [.075, .025]].map(([x, y]) => H(x, y)), { fill: '#fff' });
      p.line([H(-.16, .044), H(-.11, .05)], { w: .7, halo: false });
      p.circ(...H(-.035, -.03), .023 * g, { fill: '#fff', w: .7, halo: false, n: 8 });
      if (o.blink) p.line([H(-.052, -.03), H(-.018, -.03)], { w: .8, halo: false, amp: .1 });
      else p.line([H(-.046, -.03), H(-.024, -.03)], { w: 1.2, halo: false, amp: .1 });
      p.shape([[.045, -.035], [.11, -.03], [.158, 0], [.11, .006], [.05, -.01]].map(([x, y]) => H(x, y)), { fill: '#fff', w: .8 });
      p.line([[.025, -.07], [.06, -.13], [.11, -.155], [.142, -.14]].map(([x, y]) => H(x, y)), { w: 1.2 });
      p.line([[.048, -.064], [.088, -.115], [.128, -.128]].map(([x, y]) => H(x, y)), { w: 1 });
      p.line([[-.105, .068 + jw], [-.118, .108 + jw], [-.1, .125 + jw], [-.114, .158 + jw]].map(([x, y]) => H(x, y)), { w: .8 });
      p.dot(...H(-.152, .008), Math.max(1, .007 * g));
      if (o.scrap) { p.shape([[-.165, .035], [-.235, .005], [-.25, .06], [-.19, .085]].map(([x, y]) => H(x, y)), { fill: '#fff', w: .75 }); p.line([H(-.2, .03), H(-.225, .055)], { w: .5, halo: false }); }
    } else {
      const ch = (o.chew || 0) * .013;
      p.shape([[-.05, -.045], [-.12, -.04], [-.15, -.008], [-.1, -.004], [-.05, -.02]].map(([x, y]) => H(x, y)), { fill: '#fff', w: .8 });
      p.shape([[.05, -.045], [.12, -.04], [.15, -.008], [.1, -.004], [.05, -.02]].map(([x, y]) => H(x, y)), { fill: '#fff', w: .8 });
      p.line([[-.022, -.08], [-.05, -.14], [-.092, -.166]].map(([x, y]) => H(x, y)), { w: 1.2 });
      p.line([[.022, -.08], [.05, -.14], [.092, -.166]].map(([x, y]) => H(x, y)), { w: 1.2 });
      p.shape([[0, -.086], [.05, -.07], [.062, -.02], [.05, .04], [.03 + ch, .09], [ch, .106], [-.03 + ch, .09], [-.05, .04], [-.062, -.02], [-.05, -.07]].map(([x, y]) => H(x, y)), { fill: '#fff' });
      [-1, 1].forEach(s => {
        p.circ(...H(s * .036, -.028), .019 * g, { fill: '#fff', w: .7, halo: false, n: 8 });
        if (o.blink) p.line([H(s * .036 - .016, -.028), H(s * .036 + .016, -.028)], { w: .8, halo: false, amp: .1 });
        else p.line([H(s * .036 - .01, -.028), H(s * .036 + .01, -.028)], { w: 1.15, halo: false, amp: .1 });
        p.dot(...H(s * .012 + ch, .074), Math.max(1, .006 * g));
      });
      p.line([H(-.014 + ch, .092), H(.014 + ch, .092)], { w: .7, halo: false, amp: .1 });
      p.line([[ch, .106], [ch - .008, .14], [ch + .007, .156], [ch - .004, .178]].map(([x, y]) => H(x, y)), { w: .8 });
      if (o.scrap) { p.shape([[.012 + ch, .09], [.065 + ch, .072], [.072 + ch, .112], [.03 + ch, .118]].map(([x, y]) => H(x, y)), { fill: '#fff', w: .65 }); p.line([H(.04 + ch, .088), H(.05 + ch, .106)], { w: .5, halo: false }); }
    }
    return { mouth: H(-.165, .03) };
  }
  GAGS.goat = {
    name: 'The Goat', dur: 3.5, ones: [[0.92, 1.08], [1.68, 2.08]],
    cues: [[0.05, 'hooves'], [0.98, 'crunch'], [1.2, 'chew'], [1.72, 'slurp'], [1.86, 'slurp'], [2.0, 'gulp'], [2.42, 'chew-loop'], [3.15, 'tiny-bleat']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 0.98;
      S.bite = [c.x + c.w * .40, c.y + c.h - 3];
      const gr = S.gripRot = -0.95, mo = rotv([-.165 * g, .03 * g], gr);
      const gh = [S.bite[0] - mo[0], S.bite[1] - mo[1]];
      const bx1 = S.bx1 = gh[0] + .40 * g;
      const rest = [-.36 * g, -.70 * g], grip = [gh[0] - bx1, gh[1] - G], back = [grip[0] + .07 * g, grip[1] - .05 * g];
      S.gx0 = W + .75 * g;
      S.trk = track([
        [0, { bx: S.gx0, h: rest, hr: 0, view: 0 }],
        [.72, { bx: bx1 }, 'lin'],
        [.82, { h: [rest[0] - .02 * g, rest[1] + .1 * g], hr: -.35 }],
        [.96, { h: grip, hr: gr }, 'in'],
        [1.04, {}],
        [1.18, { h: [rest[0] + .01 * g, rest[1] + .03 * g], hr: .06 }, 'out'],
        [1.50, {}],
        [1.62, { h: grip, hr: gr }],
        [1.70, {}],
        [1.76, { h: back, hr: -.7 }, 'out'],
        [1.84, { h: grip, hr: gr }, 'in'],
        [1.90, { h: back, hr: -.7 }, 'out'],
        [1.98, { h: grip, hr: gr }, 'in'],
        [2.04, { h: [back[0], back[1] - .02 * g], hr: -.6 }, 'out'],
        [2.22, { h: rest, hr: 0 }],
        [2.30, { view: 0 }],
        [2.38, { view: 1, h: [rest[0] + .01 * g, rest[1] - .01 * g] }],
        [3.5, {}],
      ]);
      // bite marks: a scalloped notch cut out of the bottom edge (card-local coords)
      const bxl = S.bite[0] - c.x, byl = c.h + 2;
      const circles = [[-.14, .01], [-.1, -.075], [-.025, -.11], [.055, -.088], [.115, -.015]].map(([x, y], i) => `<circle cx="${(bxl + x * g).toFixed(1)}" cy="${(byl + y * g).toFixed(1)}" r="${(.068 * g * (1 + (i % 2) * .12)).toFixed(1)}"/>`).join('');
      S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}m" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}"><rect x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}" fill="#fff"/><g class="bites" fill="#000" style="display:none">${circles}</g></mask>`);
      S.cardIn.setAttribute('mask', `url(#${S.id}m)`);
      S.bites = S.defs.querySelector('.bites');
    },
    draw(S, t, p) {
      const { g, G, c } = S;
      const Q = S.trk(t);
      S.bites.style.display = t >= 0.98 ? '' : 'none';
      const k = t < 1.70 ? 1 : t < 1.76 ? lerp(1, .62, E.out(seg(t, 1.70, 1.76))) : t < 1.84 ? .62 : t < 1.90 ? lerp(.62, .3, E.out(seg(t, 1.84, 1.90))) : t < 1.98 ? .3 : t < 2.04 ? lerp(.3, 0, E.in(seg(t, 1.98, 2.04))) : 0;
      const moving = t < .72;
      const o = {
        bx: Q.bx, hx: Q.bx + Q.h[0], hy: G + Q.h[1], hr: Q.hr, view: Q.view, moving, phase: (S.gx0 - Q.bx) / (.36 * g),
        jaw: (t > 1.18 && t < 1.5) || (t > 2.06 && t < 2.3) ? .5 + .5 * Math.sin((t - 1.18) * Math.PI * 2 * 3.4) : 0,
        chew: t >= 2.4 ? Math.sin((t - 2.4) * Math.PI * 2 * 2.1) : 0,
        blink: t >= 2.98 && t < 3.06, belly: t >= 2.06 ? 1.12 : 1, scrap: (t >= 1.04 && t < 1.55) || t >= 2.38,
        tail: t >= 3.1 && t < 3.3 ? Math.sin(seg(t, 3.1, 3.3) * Math.PI) * .9 : 0,
      };
      if (moving) { o.hy += Math.sin(o.phase * Math.PI * 4) * .008 * g; }
      const mouth = rotv([-.165 * g, .03 * g], o.hr);
      if (t >= 1.70) {
        const M = [o.hx + mouth[0], o.hy + mouth[1]];
        S.setCard({ px: S.bite[0] - c.x, py: S.bite[1] - c.y, tx: M[0] - S.bite[0], ty: M[1] - S.bite[1], sx: k, sy: k * (1 + (1 - k) * .15), rot: (1 - k) * -14, kx: (1 - k) * ((Math.floor(t * 24) % 2) ? 6 : -6), hide: k <= 0.001 });
      }
      goatDraw(p, S, o);
    }
  };

  /* ═════════ 3. CONTROLLED DEMOLITION — plunger down. Nothing. Then everything. ═════════ */
  GAGS.demo = {
    name: 'Controlled Demolition', dur: 3.6, ones: [[1.86, 2.2]],
    cues: [[0.05, 'footsteps'], [0.8, 'box-set'], [1.2, 'plunger-clunk'], [1.76, 'finger-tap'], [1.88, 'pop-pop-pop'], [1.96, 'rumble'], [3.04, 'blink']],
    setup(S) {
      const { U, G, c } = S;
      const xs = S.xs = Math.max(c.x + c.w * .13, U * .3);
      S.x0 = -U * .6; S.bxX = xs + U * .28; S.bw = U * .3; S.bh = U * .18;
      S.wireEnd = [c.x + c.w * .58, G - 1];
      const A = (dx, dy) => [xs + dx * U, G - dy * U], bx = S.bxX, top = G - S.bh;
      S.trk = track([
        [.62, { hip: A(0, .415), lean: .02, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.11, .42), hR: A(.21, .42), rod: .17, boxTop: A(.16, .42) }],
        [.80, { hip: A(0, .33), lean: .3, hL: [bx - U * .1, top], hR: [bx + U * .08, top], boxTop: [bx, top], fL: A(-.1, 0), fR: A(.08, 0), look: .6 }],
        [.94, { hip: A(0, .36), lean: .22, hL: [bx - U * .065, top - U * .17], hR: [bx + U * .065, top - U * .17], look: 0 }],
        [1.04, { face: 0, brow: 1 }],
        [1.18, {}],
        [1.26, { rod: .04, hL: [bx - U * .065, top - U * .04], hR: [bx + U * .065, top - U * .04], hip: A(0, .31), lean: .38 }, 'in'],
        [1.44, {}],
        [1.52, { face: 1, brow: 0, look: -.3 }],
        [1.62, { look: .9, hd: [U * .03, U * .02], lean: .5 }],
        [1.70, { hR: [bx - U * .03, top + U * .03] }],
        [1.74, { hR: [bx - U * .06, top + U * .015] }],
        [1.78, { hR: [bx - U * .03, top + U * .03] }],
        [2.9, {}],
        [3.2, { face: 0, look: 0, hd: [0, 0], lean: .28, brow: 1 }],
      ]);
      S.puffs = Array.from({ length: 16 }, (_, i) => ({
        x: c.x + c.w * (-.04 + i * 1.08 / 15) + (rnd(S.seed + 3, i) - .5) * c.w * .05,
        t0: 1.95 + rnd(S.seed + 5, i) * .22, r: U * (.2 + rnd(S.seed + 7, i) * .17),
        rise: U * (.06 + rnd(S.seed + 9, i) * .32), drift: i < 3 ? -U * (.3 + i * .14) : (rnd(S.seed + 11, i) - .5) * U * .12,
      }));
      S.cardWrap.setAttribute('clip-path', `url(#${S.id}gc)`);
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}gc"><rect x="-2000" y="-2000" width="${S.W + 4000}" height="${c.y + c.h + 9 + 2000}"/></clipPath>`);
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      let P = S.trk(t);
      if (t < .62) {
        P = walk(S, P, t, 0, .62, S.x0, S.xs, { carry: true });
        P.hL = [P.hip[0] + U * .11, G - U * .42]; P.hR = [P.hip[0] + U * .21, G - U * .42]; P.boxTop = [P.hip[0] + U * .16, G - U * .42];
      }
      const dusted = t >= 2.75;
      P.headFill = dusted ? '#E4DED6' : null; P.dusted = dusted; P.blink = t >= 3.02 && t < 3.1;
      shadow(p, P.hip[0], G, U * .2);
      // the box and its wire
      const bt = P.boxTop, bw = S.bw, bh = S.bh;
      const ws = [bt[0] + bw / 2, bt[1] + bh * .7], we = S.wireEnd;
      p.g(); p.line([ws, [ws[0] + U * .05, Math.min(G - 1, ws[1] + U * .06)], [lerp(ws[0], we[0], .35), G - 2], [lerp(ws[0], we[0], .6), G - U * .02], [lerp(ws[0], we[0], .82), G - 1], we], { w: .55, amp: .4 });
      p.shape([[we[0] - U * .02, we[1] - U * .03], [we[0] + U * .02, we[1] - U * .03], [we[0] + U * .02, we[1]], [we[0] - U * .02, we[1]]], { fill: INK, w: .5, amp: .2 });
      figure(p, S, P, { hat: 'hard', belly: true });
      p.g();
      const rodTop = bt[1] - P.rod * U;
      p.line([[bt[0], bt[1]], [bt[0], rodTop]], { w: .9 });
      p.line([[bt[0] - U * .075, rodTop], [bt[0] + U * .075, rodTop]], { w: 1.8 });
      p.shape([[bt[0] - bw / 2, bt[1]], [bt[0] + bw / 2, bt[1]], [bt[0] + bw / 2, bt[1] + bh], [bt[0] - bw / 2, bt[1] + bh]], { fill: '#fff' });
      p.shape([[bt[0] - bw / 2 + 2, bt[1] + bh * .55], [bt[0] + bw / 2 - 2, bt[1] + bh * .55], [bt[0] + bw / 2 - 2, bt[1] + bh - 2], [bt[0] - bw / 2 + 2, bt[1] + bh - 2]], { fill: WASH, stroke: false, halo: false });
      p.circ(bt[0] - bw * .22, bt[1] + bh * .3, bh * .12, { w: .6, halo: false, n: 8 });
      p.line([[bt[0] + bw * .02, bt[1] + bh * .3], [bt[0] + bw * .32, bt[1] + bh * .3]], { w: .6, halo: false });
      // hands over the bar (drawn on top of the box)
      if (t >= .9 && t < 1.66) { p.g(); p.dot(P.hL[0], P.hL[1], U * .014); p.dot(P.hR[0], P.hR[1], U * .014); }
      if (t >= 1.77 && t < 1.82) burst(p, [S.bxX - U * .05, G - S.bh + U * .02], U * .03, U * .055, 3, -2.4, .5);
      // charges
      for (let i = 0; i < 3; i++) { const ti = 1.88 + i * .035; if (t >= ti && t < ti + .1) star(p, [c.x + c.w * (.22 + .29 * i), G - U * .03], U * .07, 6, i + 1); }
      // collapse straight down into the floor
      if (t >= 1.9 && t < 1.96) S.setCard({ tx: (Math.floor(t * 48) % 2) ? 1.6 : -1.6 });
      if (t >= 1.96) { const k = seg(t, 1.96, 2.56); S.setCard({ ty: E.in(k) * (c.h + 16), rot: Math.sin(k * Math.PI) * 1.8, kx: -Math.sin(k * Math.PI) * 3, py: c.h, hide: k >= 1 }); }
      // dust: billows, rolls over him, settles
      if (t >= 1.95) {
        const op = 1 - seg(t, 2.85, 3.35);
        if (op > 0) {
          const pf = S.puffs.filter(q => t >= q.t0).map(q => { const k = E.out(seg(t, q.t0, q.t0 + .85)); const r = lerp(U * .1, q.r, k); return [q.x + q.drift * k, G - r * .72 - q.rise * k, r]; });
          p.g({ halo: false, op });
          pf.forEach(([x, y, r]) => p.circ(x, y, r, { w: 2.1, n: 12, amp: r * .05 }));
          pf.forEach(([x, y, r]) => p.circ(x, y, r, { fill: '#F3F0EB', stroke: false, n: 12, amp: r * .05 }));
          pf.forEach(([x, y, r], i) => { if (i % 3 === 0) p.line([[x - r * .4, y + r * .1], [x - r * .1, y + r * .25], [x + r * .3, y + r * .15]], { w: .5, color: 'rgba(31,26,23,.3)' }); });
        }
      }
      if (dusted && t < 3.5) { p.g({ halo: false, op: .55 }); const h = [P.hip[0] + Math.sin(P.lean) * U * .41, P.hip[1] - U * .4]; [[-.12, -.06], [.13, -.1], [.08, .05], [-.06, .14]].forEach(([x, y], i) => p.dot(h[0] + x * U, h[1] + y * U + seg(t, 2.75, 3.5) * U * .05 * (i + 1), 1.1)); }
    }
  };

  /* ═════════ 4. THE CRITIC — sizes it up, erases it (the top half falls down), blows off the crumbs ═════════ */
  GAGS.critic = {
    name: 'The Critic', dur: 3.8, ones: [[1.1, 1.86], [2.14, 2.9]],
    cues: [[0.05, 'footsteps'], [0.7, 'hmm'], [1.12, 'scrub-loop'], [1.84, 'scrub-stop'], [1.97, 'clunk'], [2.16, 'scrub-loop'], [2.88, 'scrub-stop'], [3.02, 'blow'], [3.4, 'glasses-push']],
    setup(S) {
      const { U, G, c, F, W } = S;
      const ix = F.border + F.pad, iw = c.w - 2 * ix, ih = c.h - 2 * ix;
      S.I = { ix, iw, ih };
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}ct"><rect x="${ix}" y="${ix}" width="${iw}" height="${ih / 2 + .6}"/></clipPath><clipPath id="${S.id}cb"><rect x="${ix}" y="${ix + ih / 2}" width="${iw}" height="${ih / 2}"/></clipPath>`);
      const im = `<image x="${ix}" y="${ix}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid slice" href="${S.src}"/>`;
      const er = cls => `<path class="${cls}" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" opacity=".965" stroke-width="${(U * .3).toFixed(1)}"/>`;
      S.img.innerHTML = `<g clip-path="url(#${S.id}cb)">${im}${er('er1')}</g><g class="topw"><g clip-path="url(#${S.id}ct)">${im}${er('er2')}</g></g>`;
      S.er1 = S.img.querySelector('.er1'); S.er2 = S.img.querySelector('.er2'); S.topw = S.img.querySelector('.topw');
      const ew = S.ew = U * .3;
      const mk = (y0, y1, rtl, sd) => { const n = Math.ceil((iw - ew * .6) / (ew * .55)), pts = []; for (let i = 0; i <= n; i++) { const k = i / n, x = rtl ? ix + iw - ew * .3 - k * (iw - ew * .6) : ix + ew * .3 + k * (iw - ew * .6); pts.push([x + (rnd(sd, i) - .5) * 5, i % 2 ? y0 - 5 : y1 + 5]); } return pts; };
      S.p1 = mk(ix + ih / 2, ix + ih, true, 11); S.L1 = pathLen(S.p1);
      S.p2 = mk(ix, ix + ih / 2, false, 23); S.L2 = pathLen(S.p2);
      S.xs = c.x + c.w * .62; S.x0 = W + U * .45;
      S.ledge = c.y + c.h - F.border - 1;
      const A = (dx, dy) => [S.xs + dx * U, G - dy * U];
      S.trk = track([
        [.52, { hip: A(0, .415), face: -1, lean: 0, back: 0, tilt: 0, hd: [0, 0], look: 0, fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.12, .44), hR: A(.08, .43) }],
        [.58, { face: 0 }],
        [.62, { back: 1 }],
        [.74, { hR: A(-.2, .97), tilt: -.16, hd: [-U * .012, 0] }, 'out'],
        [.84, {}],
        [.92, { tilt: .16, hd: [U * .012, 0] }],
        [1.0, {}],
      ]);
      // crumbs: shed from the eraser while scrubbing, they fall to the frame's bottom ledge
      S.crumbs = [];
      for (let ph = 0; ph < 2; ph++) for (let i = 0; i < 13; i++) {
        const t0 = (ph ? 2.16 : 1.12) + i * .055;
        S.crumbs.push({ t0, ph, dx: (rnd(S.seed + 31, i + ph * 50) - .5) * ew * .9, fall: .18 + rnd(S.seed + 33, i + ph * 50) * .14, a: rnd(S.seed + 35, i + ph * 50) * 6, fly: .6 + rnd(S.seed + 37, i + ph * 50) * .7 });
      }
    },
    eraser(S, t) {   // eraser centre in stage coords + phase info
      const { c, I } = S, drop = S.dropAt(t);
      if (t < 1.12) { const q = seg(t, 1.0, 1.12), st = S.p1[0]; return { pt: mixPt(S.hand0, [c.x + st[0], c.y + st[1]], E.io(q)), dir: [0, -1], ph: 0 }; }
      if (t < 1.86) { const a = along(S.p1, S.L1, seg(t, 1.12, 1.84)); return { pt: [c.x + a.pt[0], c.y + a.pt[1]], dir: a.dir, ph: 1, a }; }
      if (t < 2.16) { const e1 = S.p1[S.p1.length - 1], s2 = S.p2[0], q = E.io(seg(t, 2.04, 2.16)); return { pt: mixPt([c.x + e1[0], c.y + e1[1]], [c.x + s2[0], c.y + s2[1] + drop], q), dir: [0, 1], ph: 1.5 }; }
      const a = along(S.p2, S.L2, seg(t, 2.16, 2.86));
      return { pt: [c.x + a.pt[0], c.y + a.pt[1] + drop], dir: a.dir, ph: 2, a };
    },
    draw(S, t, p) {
      const { U, G, c, I } = S, ew = S.ew;
      if (!S.dropAt) S.dropAt = t => { const h = I.ih / 2; if (t < 1.86) return 0; if (t < 1.98) return E.in(seg(t, 1.86, 1.98)) * h; if (t < 2.08) return h - Math.sin(seg(t, 1.98, 2.08) * Math.PI) * U * .035; return h; };
      if (!S.hand0) S.hand0 = S.trk(1.0).hL;
      const drop = S.dropAt(t);
      S.topw.setAttribute('transform', `translate(0 ${drop.toFixed(1)})`);
      S.er1.setAttribute('d', t >= 1.12 ? polyD(along(S.p1, S.L1, seg(t, 1.12, 1.84)).upto) : '');
      S.er2.setAttribute('d', t >= 2.16 ? polyD(along(S.p2, S.L2, seg(t, 2.16, 2.86)).upto) : '');
      let P = S.trk(t);
      if (t < .52) P = walk(S, P, t, 0, .52, S.x0, S.xs, { carry: true }), P.hL = [P.hip[0] - U * .12, G - U * .44], P.hR = [P.hip[0] + U * .06, G - U * .43];
      let Er = null;
      if (t >= 1.0 && t < 2.9) {
        Er = this.eraser(S, t);
        const e = Er.pt, side = 1;
        const hx = e[0] + side * U * .17, x0 = Er.ph < 1.5 ? S.xs : (c.x + S.p2[0][0] + U * .17);
        const hy = clamp(e[1] + U * .64, G - U * .47, G - U * .3);
        const L = U * .3, u = Math.abs(hx - x0) / L;
        const fA = x0 + Math.sign(hx - x0 || 1) * (Math.floor(u) * L), fB = fA + Math.sign(hx - x0 || 1) * L * .5;
        P = Object.assign({}, P, { hip: [hx, hy], back: 1, face: 0, tilt: 0, hd: [0, 0], fL: [Math.min(fA, fB) - U * .02, G], fR: [Math.max(fA, fB) + U * .02, G], hL: [e[0] - ew * .4, e[1] + U * .01], hR: [e[0] + ew * .4, e[1] + U * .01] });
        if (t >= 1.86 && t < 2.1) P.hd = [0, -U * .02], P.hip = [P.hip[0] + U * .03, P.hip[1]];
      }
      if (t >= 2.9) {
        const xe = Math.min(c.x + S.p2[S.p2.length - 1][0] + U * .17, S.W - U * .14);
        const A = (dx, dy) => [xe + dx * U, G - dy * U];
        P = track([
          [2.9, { hip: A(0, .42), back: 0, face: -1, lean: 0, look: 0, fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .44), hR: A(.09, .43), mouth: '', hd: [0, 0] }],
          [3.0, { hip: A(.04, .34), lean: -.55, look: .8, hd: [-U * .02, U * .02], fL: A(-.1, 0), fR: A(.1, 0), hL: A(-.12, .3), hR: A(.08, .3), mouth: 'o' }],
          [3.2, {}],
          [3.3, { hip: A(0, .415), lean: 0, face: 0, look: 0, hd: [0, 0], mouth: '', fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.12, .44), hR: A(.1, .43) }],
          [3.42, { hR: A(.0, .87) }],
          [3.56, {}],
          [3.7, { hR: A(.1, .43) }],
        ])(t);
        P.armsFront = t >= 3.34 && t < 3.66;
        P.brow = t >= 3.34 ? 1 : 0;
      }
      shadow(p, P.hip[0], G, U * .19);
      // crumbs
      const blowT = 3.02;
      p.g({ halo: false });
      S.crumbs.forEach(q => {
        if (t < q.t0) return;
        const e = this.eraser(S, q.t0).pt, k = seg(t, q.t0, q.t0 + q.fall);
        let x = e[0] + q.dx, y = lerp(e[1] + U * .06, S.ledge, E.in(k)), op = 1;
        if (t > blowT) { const d = Math.max(0, (t - blowT - Math.abs(x - P.hip[0]) / (U * 6))); x -= d * U * 3 * q.fly; y -= d * U * (.5 + q.fly * .4) - d * d * U * 1.5; op = clamp(1 - d * 3, 0, 1); }
        if (op <= 0) return;
        const r = U * .014;
        p.line([[x - r, y], [x, y - r * .8], [x + r, y - r * .2]].map(pt => rot(pt, [x, y], q.a)), { w: .7, amp: .2, op });
      });
      if (t >= 3.0 && t < 3.22) { p.g({ halo: false }); const m = [P.hip[0] - U * .32, P.hip[1] - U * .05]; for (let i = 0; i < 3; i++) p.line([[m[0] - U * .02, m[1] + (i - 1) * U * .03], [m[0] - U * (.1 + i * .02), m[1] + (i - 1) * U * .05 + U * .02]], { w: .55, color: 'rgba(31,26,23,.5)' }); }
      // the eraser (held against the paper, behind him), then him
      const drawEraser = (e, ang) => {
        const hw = ew * .45, hh = U * .085;
        const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => rot([e[0] + x, e[1] + y], e, ang));
        p.g(); p.shape(pts, { fill: '#fff', amp: .4 });
        p.shape([[-hw + 2, hh * .25], [hw - 2, hh * .25], [hw - 2, hh - 2], [-hw + 2, hh - 2]].map(([x, y]) => rot([e[0] + x, e[1] + y], e, ang)), { fill: WASH2, stroke: false, halo: false });
        p.line([[-hw + 3, hh * .25], [hw - 3, hh * .25]].map(([x, y]) => rot([e[0] + x, e[1] + y], e, ang)), { w: .5, halo: false });
      };
      if (Er) drawEraser(Er.pt, (Er.dir[1] > 0 ? 1 : -1) * .14 * (Er.ph === 1 || Er.ph === 2 ? 1 : 0));
      figure(p, S, P, { hat: 'beret', glasses: true });
      if (!Er) {   // eraser in hand when not scrubbing
        const h = t >= 2.9 ? P.hL : P.hL;
        drawEraser([h[0] - U * .02, h[1] + U * .05], .1);
      }
      if (t >= .74 && t < 1.0) { p.g(); p.line([[P.hR[0], P.hR[1]], [P.hR[0] + U * .006, P.hR[1] - U * .065]], { w: 1.35 }); }
    }
  };

  /* ═════════ 5. THE MAGICIAN — the trick doesn't work; the cartoon leaves anyway ═════════ */
  function clothPts(q, wave, sag) {
    const [tl, tr, br, bl] = q, P = [];
    for (let i = 0; i < 5; i++) { const k = i / 4; P.push([lerp(tl[0], tr[0], k), lerp(tl[1], tr[1], k) + Math.sin(k * Math.PI) * sag]); }
    for (let i = 1; i < 3; i++) P.push(mixPt(tr, br, i / 3));
    for (let i = 0; i < 5; i++) { const k = i / 4, b = mixPt(br, bl, k); P.push([b[0], b[1] + (i % 2 ? -wave : wave * .3)]); }
    for (let i = 1; i < 3; i++) P.push(mixPt(bl, tl, i / 3));
    return P;
  }
  GAGS.magic = {
    name: 'The Magician', dur: 3.85, lineAt: 3.72, ones: [[1.46, 1.66]],
    cues: [[0.05, 'footsteps'], [0.6, 'cloth-whoosh'], [1.0, 'tap'], [1.18, 'tap'], [1.36, 'tap'], [1.52, 'cloth-whip'], [1.64, 'ta-da-sting'], [2.0, 'silence'], [2.84, 'scrape-loop']],
    setup(S) {
      const { U, G, c, W } = S;
      const xm = S.xm = c.x + c.w * .74; S.x0 = W + U * .5;
      const A = (dx, dy) => [xm + dx * U, G - dy * U];
      S.grip = [c.w - c.w * .025, c.h - U * .2];   // card-local: right edge, low
      S.trk = track([
        [.5, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.13, .5), hR: A(.08, .43), wa: 2.2 }],
        [.58, { hL: A(.02, .36), lean: .05 }],
        [.66, { hL: A(-.26, 1.0), lean: -.12 }, 'out'],
        [.78, { hL: A(-.12, .5), lean: 0 }],
        [.88, { hR: A(-.2, .86), wa: 3.6, look: -.4 }],
        [1.44, { hL: A(-.08, .75) }],
        [1.52, { hL: A(.3, 1.06), lean: .06 }, 'out'],
        [1.62, { hR: A(-.28, 1.02), hL: A(.28, 1.06), face: 0, look: 0, lean: -.04, wa: 4.3, fL: A(-.15, 0), fR: A(.08, 0) }, 'out'],
        [1.96, {}],
        [2.2, { hL: A(.12, .45), hR: A(-.11, .44), wa: 2.0, lean: 0, fL: A(-.07, 0), fR: A(.07, 0) }],
        [2.32, { face: -.8, look: -.45, hd: [-U * .01, 0] }],
        [2.48, { face: 0, look: 0, brow: 1, hd: [0, 0] }],
        [2.64, {}],
      ]);
      S.dragX = W - c.x + U * .5;
    },
    draw(S, t, p) {
      const { U, G, c } = S, xm = S.xm;
      let P = S.trk(t);
      if (t < .5) { P = walk(S, P, t, 0, .5, S.x0, xm, { carry: true }); P.hL = [P.hip[0] - U * .13, G - U * .5]; P.hR = [P.hip[0] + U * .08, G - U * .43]; }
      // the drag: grabs the right edge low, crouches, hauls it off backwards
      let drag = null;
      if (t >= 2.64) {
        const k = seg(t, 2.86, 3.76), tx = E.in(k) * S.dragX, ang = -2.6 * E.out(seg(t, 2.86, 3.1));
        S.setCard({ tx, rot: ang, px: 0, py: c.h });
        const g = S.cardPt(S.grip[0], S.grip[1], { tx, rot: ang, px: 0, py: c.h });
        const k0 = seg(t, 2.64, 2.86);
        const hx = lerp(xm, g[0] + U * .2, E.io(k0));
        const gx0 = g[0] + U * .2 - tx, w = walk(S, P, t, 2.86, 3.76, gx0, gx0 + S.dragX, { x: g[0] + U * .2, carry: true, face: -1, lean: -.3, stride: .42, hipH: .36 });
        P = Object.assign({}, P, t < 2.86 ? { hip: [hx, G - U * lerp(.415, .36, k0)], lean: -.3 * k0, fL: [hx - U * .1, G], fR: [hx + U * .06, G] } : w, { face: -1, brow: 0, look: .2 });
        P.hL = [g[0], g[1]]; P.hR = [g[0] + U * .01, g[1] - U * .1];
        if (t < 2.86) { P.hL = mixPt([xm + U * .12, G - U * .45], g, E.io(k0)); P.hR = mixPt([xm - U * .11, G - U * .44], [g[0] + U * .01, g[1] - U * .1], E.io(k0)); }
        drag = { tx, k };
      }
      // the cloth: on his arm → flung → draped → whipped off → hanging → dropped
      const hand = P.hL;
      const hang = h => [[h[0] - U * .07, h[1]], [h[0] + U * .07, h[1] - U * .01], [h[0] + U * .08, h[1] + U * .27], [h[0] - U * .06, h[1] + U * .25]];
      const B_ = [[c.x + c.w * .18, c.y - c.h * .04], [c.x + c.w * 1.0, c.y + c.h * .02], [c.x + c.w * .98, c.y + c.h * .62], [c.x + c.w * .1, c.y + c.h * .5]];
      const C_ = [[c.x - c.w * .025, c.y - c.h * .022], [c.x + c.w * 1.025 + 7, c.y - c.h * .022], [c.x + c.w * 1.05 + 7, G], [c.x - c.w * .05, G]];
      const D_ = h => [[c.x + c.w * .45, c.y + c.h * .2], h, [h[0] + U * .06, h[1] + U * .12], [c.x + c.w * .52, G - c.h * .12]];
      const hx0 = xm + U * .2, F_ = [[hx0 - U * .17, G - U * .045], [hx0 + U * .1, G - U * .065], [hx0 + U * .15, G], [hx0 - U * .2, G]];
      let cq, wv, sg = 0;
      const L = (a, b, k) => a.map((q, i) => mixPt(q, b[i], k));
      if (t < .56) { cq = hang(hand); wv = .012; }
      else if (t < .66) { cq = L(hang(hand), B_, E.out(seg(t, .56, .66))); wv = .04; sg = -U * .06 * seg(t, .56, .66); }
      else if (t < .78) { cq = L(B_, C_, E.in(seg(t, .66, .78))); wv = .03; sg = -U * .06 * (1 - seg(t, .66, .78)); }
      else if (t < 1.48) { cq = C_; wv = .02 + (t < .9 ? .015 * Math.sin(seg(t, .78, .9) * Math.PI) : 0); }
      else if (t < 1.56) { cq = L(C_, D_(hand), E.in(seg(t, 1.48, 1.56))); wv = .03; }
      else if (t < 1.64) { cq = L(D_(hand), hang(hand), E.out(seg(t, 1.56, 1.64))); wv = .03; }
      else if (t < 2.64) { cq = hang(hand); wv = .012; }
      else if (t < 2.76) { const h0 = S.trk(2.64).hL; cq = L(hang(h0), F_, E.in(seg(t, 2.64, 2.76))); wv = .02; }
      else { cq = F_; wv = .01; }
      const cp = clothPts(cq, wv * U, sg);
      shadow(p, P.hip[0], G, U * .2);
      p.g(); p.shape(cp, { fill: '#fff' });
      [[1, 10], [2, 9], [3, 8]].forEach(([i, j]) => { const a = mixPt(cp[i], cp[j], .14), b = mixPt(cp[i], cp[j], .94); p.line([a, mixPt(a, b, .5), b], { w: .55, halo: false }); p.shape([a, b, [b[0] + U * .035, b[1]], [a[0] + U * .01, a[1]]], { fill: WASH, stroke: false, halo: false }); });
      // scrape marks behind the dragged card's dragging corner
      if (drag && drag.k > 0 && drag.k < 1) { p.g({ halo: false }); const x = c.x + drag.tx; for (let i = 0; i < 3; i++) p.line([[x - U * (.04 + i * .07), G - U * (.01 + (i % 2) * .02)], [x - U * (.08 + i * .07), G - U * (.005 + (i % 2) * .02)]], { w: .6, color: 'rgba(31,26,23,.5)' }); }
      const J = figure(p, S, P, { hat: 'top', bow: true });
      // the wand (pocketed once he gives up)
      if (t < 2.7) {
        let wa = P.wa;
        let wh = P.hR;
        [1.0, 1.18, 1.36].forEach(tt => { if (t >= tt - .04 && t < tt + .04) { wh = [wh[0] - U * .03, wh[1] + U * .03]; } });
        if (t >= 2.6) wh = mixPt(P.hR, [J.neck[0] - U * .03, J.neck[1] + U * .06], seg(t, 2.6, 2.7));
        const tip = [wh[0] + Math.cos(wa) * U * .2, wh[1] + Math.sin(wa) * U * .2];
        p.g(); p.line([[wh[0] - Math.cos(wa) * U * .02, wh[1] - Math.sin(wa) * U * .02], tip], { w: 1.6, amp: .2 });
        p.line([mixPt(wh, tip, .82), tip], { w: .9, color: '#fff', halo: false, amp: .1 });
        [1.0, 1.18, 1.36].forEach(tt => { if (t >= tt && t < tt + .07) burst(p, tip, U * .03, U * .06, 3, wa - .9, .6); });
      }
    }
  };

  /* ═════════ 6. FREE THROW — crumpled, shot, rimmed out, placed in by hand ═════════ */
  function paperBall(p, x, y, r, a) {
    p.g(); p.circ(x, y, r, { fill: '#fff', n: 9, amp: r * .1 });
    p.shape([[.1, .55], [.55, .35], [.72, -.1], [.45, .1], [.05, .3]].map(([u, v]) => rot([x + u * r, y + v * r], [x, y], a)), { fill: WASH2, stroke: false, halo: false });
    [[[-.55, -.2], [-.05, -.45], [.3, -.1]], [[-.3, .35], [.1, .12], [.45, .3]], [[-.6, .18], [-.2, .05]]].forEach(l => p.line(l.map(([u, v]) => rot([x + u * r, y + v * r], [x, y], a)), { w: .55, halo: false, amp: .2 }));
  }
  GAGS.free = {
    name: 'Free Throw', dur: 3.9, ones: [[1.44, 2.66]],
    cues: [[0.05, 'footsteps'], [0.62, 'crumple'], [1.44, 'shot'], [1.92, 'rim-clank'], [2.0, 'rim-roll'], [2.3, 'paper-drop'], [2.84, 'footsteps'], [3.64, 'basket-thunk'], [3.74, 'tie-tug']],
    setup(S) {
      const { U, G, c } = S;
      const xo = S.xo = c.x + c.w * .22, bk = S.bk = c.x + c.w * .8;
      S.x0 = -U * .55; S.x1 = bk + U * .2; S.rb = U * .072;
      S.rim = { x: bk, y: G - U * .34, rx: U * .16, ry: U * .038 };
      const A = (dx, dy) => [xo + dx * U, G - dy * U];
      S.trk = track([
        [.42, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .44), hR: A(.1, .44), tieSwing: 0 }],
        [.54, { hL: A(.02, .99), hR: A(.1, .97), face: .5, look: -1, hip: A(0, .44) }],
        [.62, {}],
        [1.04, { hL: A(.07, .64), hR: A(.15, .64), hip: A(0, .415), look: .3 }],
        [1.12, { face: 1, look: 0 }],
        [1.34, { hip: A(-.01, .38), hL: A(.07, .87), hR: A(.13, .84), lean: .02, fL: A(-.08, 0), fR: A(.09, 0) }],
        [1.42, { hip: A(.01, .44), hR: A(.27, 1.0), hL: A(.15, .86), lean: .06 }, 'out'],
        [2.42, {}],
        [2.56, { hR: A(.1, .44), hL: A(-.1, .44), lean: 0, hip: A(0, .415) }],
        [2.66, { face: 0, brow: 1 }],
        [2.84, {}],
      ]);
    },
    ball(S, t) {   // {x, y, behind, hidden, a}
      const { U, G } = S, r = S.rb, R = S.rim;
      if (t < 1.08) return null;
      const H = S.trk(Math.min(t, 1.46));
      const inHand = [(H.hL[0] + H.hR[0]) / 2, Math.min(H.hL[1], H.hR[1]) - r * .6];
      if (t < 1.46) return { x: inHand[0], y: inHand[1], a: 0 };
      const rel = inHand, rimL = [R.x - R.rx + r * .2, R.y - r * .9];
      if (t < 1.92) { const k = seg(t, 1.46, 1.92); return { x: lerp(rel[0], rimL[0], k), y: lerp(rel[1], rimL[1], k) - U * .62 * 4 * k * (1 - k), a: k * 4 }; }
      if (t < 2.24) { const k = E.out(seg(t, 1.92, 2.24)), a = Math.PI + k * (Math.PI + .35); return { x: R.x + Math.cos(a) * (R.rx - r * .2), y: R.y + Math.sin(a) * R.ry - r * .9, behind: Math.sin(a) < 0, a: 4 + k * 5 }; }
      const a1 = 2 * Math.PI + .35, p0 = [R.x + Math.cos(a1) * (R.rx - r * .2), R.y + Math.sin(a1) * R.ry - r * .9], land = [R.x + U * .36, G - r];
      if (t < 2.5) { const k = seg(t, 2.24, 2.5); return { x: lerp(p0[0], land[0], k), y: lerp(p0[1], land[1], E.in(k)) - U * .1 * Math.sin(k * Math.PI), a: 9 + k * 3 }; }
      if (t < 2.62) { const k = seg(t, 2.5, 2.62); return { x: land[0] + k * U * .03, y: land[1] - U * .03 * Math.sin(k * Math.PI), a: 12 }; }
      if (t < 3.38) return { x: land[0] + U * .03, y: land[1], a: 12 };
      const P = this.pose(S, t);
      if (t < 3.62) return { x: P.hR[0] + r * .2, y: P.hR[1] + r * .7, a: 12 };
      const k = seg(t, 3.62, 3.74), h = this.pose(S, 3.62).hR;
      return { x: h[0], y: lerp(h[1] + r * .7, R.y + U * .12, E.in(k)), behind: true, hidden: k >= 1, a: 12 };
    },
    pose(S, t) {
      const { U, G } = S, x1 = S.x1;
      let P = S.trk(t);
      if (t < .42) return walk(S, P, t, 0, .42, S.x0, S.xo);
      if (t >= 2.84 && t < 3.28) return walk(S, P, t, 2.84, 3.28, S.xo, x1, { stride: .7 });
      if (t >= 3.28) {
        const A = (dx, dy) => [x1 + dx * U, G - dy * U], land = S.rim.x + U * .39;
        P = track([
          [3.28, { hip: A(0, .415), face: 1, lean: 0, look: .3, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.08, .44), hR: A(.1, .44), tieSwing: 0 }],
          [3.38, { hip: A(.02, .3), lean: .6, look: 1, hR: [land, G - S.rb * 1.4], hL: A(-.02, .3), fL: A(-.09, 0), fR: A(.1, 0), tieSwing: .02 }],
          [3.46, { hip: A(0, .415), lean: 0, look: 0, hR: A(.08, .55), hL: A(-.1, .44), fL: A(-.07, 0), fR: A(.07, 0), tieSwing: 0 }],
          [3.56, { face: -1, hR: [S.rim.x + U * .02, G - U * .54], hL: A(.06, .44) }],
          [3.64, {}],
          [3.72, { face: 0, brow: 1, hR: A(-.08, .44) }],
          [3.78, { hR: A(.0, .66), tieSwing: .03 }],
          [3.84, { tieSwing: -.02 }],
          [3.9, { tieSwing: 0 }],
        ])(t);
        P.armsFront = t >= 3.74;
      }
      return P;
    },
    draw(S, t, p) {
      const { U, G, c } = S, R = S.rim, r = S.rb;
      const P = this.pose(S, t);
      // crumple: the cartoon is squeezed into his hands in jerky stages
      if (t >= .62 && t < 1.08) {
        const k = seg(t, .62, 1.06), f = Math.floor(t * 12), s = Math.max(.06, 1 - E.out(k) * .94);
        const hp = [(P.hL[0] + P.hR[0]) / 2, (P.hL[1] + P.hR[1]) / 2], p0 = S.trk(.62), piv = [(p0.hL[0] + p0.hR[0]) / 2, (p0.hL[1] + p0.hR[1]) / 2];
        S.setCard({ px: piv[0] - c.x, py: piv[1] - c.y, tx: hp[0] - piv[0], ty: hp[1] - piv[1], sx: s * (1 + (rnd(f, 1) - .5) * .3 * k), sy: s * (1 + (rnd(f, 2) - .5) * .3 * k), rot: (rnd(f, 3) - .5) * 40 * k, kx: (rnd(f, 4) - .5) * 26 * k });
        const n = Math.floor(k * 9) + 1; let h = '';
        for (let i = 0; i < n; i++) { const a = [rnd(i, 5) * c.w, rnd(i, 6) * c.h], b = [rnd(i, 7) * c.w, rnd(i, 8) * c.h], m = [(a[0] + b[0]) / 2 + (rnd(i, 9) - .5) * c.w * .3, (a[1] + b[1]) / 2 + (rnd(i, 10) - .5) * c.h * .3]; h += `<path d="M${a[0].toFixed(0)},${a[1].toFixed(0)}L${m[0].toFixed(0)},${m[1].toFixed(0)}L${b[0].toFixed(0)},${b[1].toFixed(0)}" fill="none" stroke="${INK}" stroke-width="${(1.3 / s).toFixed(1)}"/><path d="M${a[0].toFixed(0)},${a[1].toFixed(0)}L${m[0].toFixed(0)},${m[1].toFixed(0)}L${(m[0] + c.w * .12).toFixed(0)},${(m[1] + c.h * .06).toFixed(0)}Z" fill="${WASH2}"/>`; }
        S.over.innerHTML = h;
      } else S.over.innerHTML = '';
      if (t >= 1.08) S.setCard({ hide: true });
      const B = this.ball(S, t);
      // wastebasket (drawn in, then holds the scene)
      const dk = seg(t, 0, .3);
      const arc = (a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([R.x + Math.cos(a) * R.rx, R.y + Math.sin(a) * R.ry]); } return o; };
      const bw = U * .12;
      p.g({ halo: false }); p.circ(R.x, G + 1, R.rx * 1.1, { sy: .13, fill: WASH, stroke: false });
      if (dk > 0) {
        p.g();
        const ell = arc(0, Math.PI * 2, 16).slice(0, 16);
        p.shape(ell, { fill: '#fff', op: dk });
        p.circ(R.x, R.y + R.ry * .25, R.rx * .9, { sy: .2, fill: WASH2, stroke: false, halo: false });
        if (B && B.behind && !B.hidden) paperBall(p, B.x, B.y, r, B.a), p.g();
        const body = [[R.x - R.rx, R.y], [R.x - bw, G], [R.x, G + U * .008], [R.x + bw, G], [R.x + R.rx, R.y]].concat(arc(.12, Math.PI - .12, 8));
        const cut = Math.max(2, Math.ceil(body.length * dk));
        p.g(); p.shape(body.slice(0, cut), { fill: '#fff' });
        [-.6, -.2, .2, .6].forEach(k => p.line([[R.x + k * R.rx, R.y + R.ry * Math.sqrt(1 - k * k)], [R.x + k * bw, G - 1]], { w: .55, halo: false }));
        p.line(arc(.15, Math.PI - .15, 8).map(([x, y]) => [x, y + U * .03]), { w: .5, halo: false });
      }
      if (B && !B.behind && !B.hidden) paperBall(p, B.x, B.y, r, B.a);
      shadow(p, P.hip[0], G, U * .2);
      const J = figure(p, S, P, { hat: 'hair', tie: true });
      if (t >= 1.44 && t < 2.5) { p.g(); p.line([J.hR, [J.hR[0] + U * .035, J.hR[1] + U * .045]], { w: 1 }); }   // the held gooseneck follow-through
    }
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TEAM A · SLAPSTICK — classic cartoon violence, played dry.
     Cartoon physics only: nobody is hurt, nothing bleeds, the cartoon always loses.
     Gag keys and helpers are all prefixed A_ so nothing collides with other files.
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── A helpers ── */
  function A_layer(S, where) {   // 'back' = under the card, 'mid' = over the card and under the figures
    const g = document.createElementNS(NS, 'g');
    S.svg.insertBefore(g, where === 'back' ? S.cardWrap : S.figs);
    return g;
  }
  const A_pen = p => new Pen(p.b, p.U, p.s);
  function A_above(S, y, key) {  // clip-path id that keeps everything above stage-y
    const id = S.id + 'Aab' + key;
    if (!S.defs.querySelector('#' + id)) S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${id}"><rect x="-4000" y="-4000" width="${S.W + 8000}" height="${(y + 4000).toFixed(1)}"/></clipPath>`);
    return id;
  }
  function A_clipped(p, q, id) { p.g(); p.raw(`<g clip-path="url(#${id})">${q.svg()}</g>`); }
  function A_spray(p, c, r0, r1, a0, a1, n, w) {
    p.g({ halo: false });
    for (let i = 0; i < n; i++) { const a = n > 1 ? lerp(a0, a1, i / (n - 1)) : (a0 + a1) / 2; p.line([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1]], { w: w || .8, amp: .3 }); }
  }
  function A_speed(p, pts, op) { p.g({ halo: false }); pts.forEach(l => p.line(l, { w: .6, color: `rgba(31,26,23,${op || .45})`, amp: .2 })); }

  /* hats and hair that figure() doesn't have. hc/hr = head centre/radius, s = facing sign */
  function A_hat(p, kind, hc, hr, tilt, s) {
    const T = pts => pts.map(([x, y]) => rot([hc[0] + x * hr, hc[1] + y * hr], hc, tilt || 0));
    p.g();
    if (kind === 'bowler') {
      p.shape(T([[-.78, -.5], [-.76, -.95], [-.5, -1.3], [0, -1.42], [.5, -1.3], [.76, -.95], [.78, -.5]].map(([x, y]) => [x + s * .06, y])), { fill: INK });
      p.line(T([[-1.24, -.38], [-1.04, -.54], [0, -.6], [1.04, -.54], [1.24, -.38]]), { w: 1.25 });
    } else if (kind === 'boater') {
      p.shape(T([[-.74, -.52], [-.72, -1.2], [.72, -1.2], [.74, -.52]]), { fill: '#fff' });
      p.shape(T([[-.74, -.52], [-.73, -.78], [.73, -.78], [.74, -.52]]), { fill: INK, w: .7 });
      p.line(T([[-1.42, -.5], [1.42, -.5]]), { w: 1.4 });
    } else if (kind === 'fedora') {
      p.shape(T([[-.74, -.5], [-.66, -1.08], [-.3, -1.3], [0, -1.16], [.3, -1.3], [.66, -1.08], [.74, -.5]]), { fill: INK });
      p.line(T([[-.7, -.66], [.7, -.66]]), { w: .8, color: '#fff', halo: false, amp: .15 });
      p.line(T([[-1.32, -.38], [-1.0, -.52], [0, -.56], [1.0, -.52], [1.32, -.6]].map(([x, y]) => [x * (s || 1), y])), { w: 1.3 });
    } else if (kind === 'pork') {
      p.shape(T([[-.68, -.5], [-.66, -1.02], [.66, -1.02], [.68, -.5]]), { fill: INK });
      p.line(T([[-.66, -.66], [.66, -.66]]), { w: .8, color: '#fff', halo: false, amp: .15 });
      p.line(T([[-1.14, -.4], [-.95, -.5], [.95, -.5], [1.14, -.4]]), { w: 1.3 });
    } else if (kind === 'beanie') {
      p.shape(T([[-1.0, -.3], [-.96, -.78], [-.56, -1.14], [0, -1.24], [.56, -1.14], [.96, -.78], [1.0, -.3]]), { fill: '#fff' });
      p.shape(T([[-1.03, -.28], [-1.0, -.6], [1.0, -.6], [1.03, -.28]]), { fill: '#E9E6E2', w: .8 });
      [-.6, -.2, .2, .6].forEach(x => p.line(T([[x, -.32], [x, -.56]]), { w: .5, halo: false, amp: .1 }));
      const pc = T([[0, -1.42]])[0]; p.circ(pc[0], pc[1], hr * .26, { fill: '#fff', w: .8, n: 9 });
    } else if (kind === 'bald') {
      p.line(T([[-.88, -.4], [-.4, -.88], [.3, -.94], [.72, -.68]]), { w: .55, halo: false, amp: .15 });
      p.line(T([[-.86, -.28], [-.3, -.74], [.42, -.78]]), { w: .55, halo: false, amp: .15 });
    } else if (kind === 'mop') {
      p.shape(T([[-1.08, .05], [-1.05, -.6], [-.66, -1.03], [0, -1.13], [.66, -1.03], [1.05, -.6], [1.08, .05], [.86, .05], [.84, -.32], [-.84, -.32], [-.86, .05]]), { fill: INK, w: .8 });
    } else if (kind === 'curly') {
      for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i / 8), q = T([[Math.cos(a) * .9, Math.sin(a) * .9 - .06]])[0]; p.circ(q[0], q[1], hr * .32, { fill: INK, w: .6, n: 8 }); }
    } else if (kind === 'frazzle') {   // hair after an explosion
      for (let i = 0; i < 9; i++) { const a = Math.PI * (1.06 + i / 8 * .88), r0 = .9, r1 = 1.5 + (i % 2) * .25; p.line(T([[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a + .08) * (r0 + r1) / 2, Math.sin(a + .08) * (r0 + r1) / 2], [Math.cos(a - .04) * r1, Math.sin(a - .04) * r1]]), { w: .8, amp: .3 }); }
    }
  }
  function A_fig(p, S, P, st, hat) {
    const J = figure(p, S, P, st || {});
    if (hat && !P.noHat) { const ho = P.hatOff || [0, 0]; A_hat(p, hat, [J.hc[0] + ho[0] * J.hr, J.hc[1] + ho[1] * J.hr], J.hr, (P.tilt || 0) + (P.hatTilt || 0), sgnOf(P.face || 0)); }
    return J;
  }
  function A_figXf(p, S, P, st, hat, xf) {   // a figure inside an SVG transform (a man in flight)
    const q = A_pen(p), J = A_fig(q, S, P, st, hat);
    p.g(); p.raw(`<g transform="${xf}">${q.svg()}</g>`);
    return J;
  }
  function A_sootEyes(p, J, P) {   // white eyes on a blackened face
    const hc = J.hc, hr = J.hr, f = P.face || 0, look = P.look || 0;
    const ey = hc[1] - hr * .08 + look * hr * .22, ex = hc[0] + f * hr * .46, sp = hr * .36 * (1 - Math.abs(f) * .5);
    const xs = Math.abs(f) > .88 ? [ex + f * hr * .06] : [ex - sp, ex + sp];
    p.g({ halo: false });
    xs.forEach(x => {
      if (P.blink) p.line([[x - hr * .22, ey], [x + hr * .22, ey]], { w: 1.0, color: '#fff', amp: .12 });
      else { p.circ(x, ey, hr * .27, { fill: '#fff', stroke: false, n: 8, amp: .1 }); p.dot(x + f * hr * .06, ey + hr * .03, Math.max(1.1, hr * .1)); }
    });
  }
  /* dust puffs in the demolition style: ink-outlined, merged into one cloud */
  function A_puffs(S, n, x0, x1, y, t0, o = {}) {
    const U = S.U, sd = (o.seed || 1) * 97 + S.seed;
    return Array.from({ length: n }, (_, i) => ({
      x: lerp(x0, x1, n > 1 ? i / (n - 1) : .5) + (rnd(sd, i) - .5) * U * (o.jit != null ? o.jit : .1),
      y, t0: t0 + rnd(sd + 1, i) * (o.spread != null ? o.spread : .1), r: U * ((o.r || .13) + rnd(sd + 2, i) * (o.rv != null ? o.rv : .08)),
      rise: U * ((o.rise != null ? o.rise : .06) + rnd(sd + 3, i) * .1), dx: U * (o.dx || 0) * (lerp(x0, x1, n > 1 ? i / (n - 1) : .5) < (x0 + x1) / 2 ? -1 : 1) * (.5 + rnd(sd + 4, i)), life: o.life || .65,
    }));
  }
  function A_dust(p, list, t, op) {
    if (op <= 0) return;
    const pf = list.filter(q => t >= q.t0).map(q => { const k = E.out(seg(t, q.t0, q.t0 + q.life)); const r = lerp(q.r * .3, q.r, k); return [q.x + q.dx * k, q.y - r * .7 - q.rise * k, r]; });
    if (!pf.length) return;
    p.g({ halo: false, op });
    pf.forEach(([x, y, r]) => p.circ(x, y, r, { w: 2.1, n: 12, amp: r * .05 }));
    pf.forEach(([x, y, r]) => p.circ(x, y, r, { fill: '#F3F0EB', stroke: false, n: 12, amp: r * .05 }));
    pf.forEach(([x, y, r], i) => { if (i % 3 === 0) p.line([[x - r * .4, y + r * .1], [x - r * .1, y + r * .25], [x + r * .3, y + r * .15]], { w: .5, color: 'rgba(31,26,23,.3)' }); });
  }
  /* soft grey smoke: puffs that swell, rise and thin out */
  function A_smoke(p, list, t) {
    list.forEach(q => {
      if (t < q.t0 || t > q.t0 + q.life) return;
      const k = (t - q.t0) / q.life, r = lerp(q.r * .35, q.r, E.out(k));
      p.g({ halo: false, op: (1 - E.in(k)) * (q.op || .9) });
      p.circ(q.x + q.dx * E.out(k), q.y - q.rise * E.out(k), r, { fill: '#EEEAE4', w: .6, n: 11, amp: r * .07, color: 'rgba(31,26,23,.5)' });
    });
  }
  /* small paper scraps that fly and flutter down */
  function A_bits(p, S, list, t, floor) {
    const U = S.U, G = floor != null ? floor : S.G;
    p.g();
    list.forEach(q => {
      if (t < q.t0) return;
      const d = t - q.t0, k = (1 - Math.exp(-3 * d)) / 3;
      let x = q.x + q.vx * k + Math.sin(d * 6 + q.ph) * U * .05 * Math.min(1, d * 1.5);
      let y = q.y + q.vy * k + U * .75 * Math.max(0, d - (1 - Math.exp(-3 * d)) / 3) * 1.4;
      const landed = y >= G - U * .012; if (landed) y = G - U * .012;
      const a = landed ? q.ph : q.ph + d * q.spin, r = U * (q.r || .035), sy = landed ? .35 : 1;
      p.shape([[-r, -r * .7 * sy], [r * .9, -r * .8 * sy], [r, r * .6 * sy], [-r * .8, r * .8 * sy]].map(([u, v]) => rot([x + u, y + v], [x, y], landed ? 0 : a)), { fill: '#fff', w: .6, amp: .2 });
    });
  }
  function A_mkBits(S, n, x, y, t0, sd, o = {}) {
    const U = S.U;
    return Array.from({ length: n }, (_, i) => {
      const a = (o.a0 != null ? lerp(o.a0, o.a1, rnd(sd, i)) : rnd(sd, i) * Math.PI * 2), v = U * ((o.v || 1.6) + rnd(sd + 1, i) * (o.vv || 1.2));
      return { x: x + (rnd(sd + 2, i) - .5) * U * (o.jx || .2), y: y + (rnd(sd + 3, i) - .5) * U * (o.jy || .1), t0: t0 + rnd(sd + 4, i) * (o.spread || .04), vx: Math.cos(a) * v, vy: Math.sin(a) * v, spin: (rnd(sd + 5, i) - .5) * 14, ph: rnd(sd + 6, i) * 6, r: (o.r || .035) * (.7 + rnd(sd + 7, i) * .6) };
    });
  }
  /* the card frame + picture, card-local, for drawing pieces of it */
  function A_cardMarkup(S) {
    const { c, F } = S, b = F.border, ip = b + F.pad;
    return `<rect x="${b / 2}" y="${b / 2}" width="${c.w - b}" height="${c.h - b}" rx="${F.radius - b / 2}" fill="#fff" stroke="${INK}" stroke-width="${b}"/>` +
      (S.src ? `<image x="${ip}" y="${ip}" width="${c.w - 2 * ip}" height="${c.h - 2 * ip}" preserveAspectRatio="xMidYMid slice" href="${S.src}"/>` : '');
  }
  /* a jittered grid of card-local polygons (some quads split into triangles) */
  function A_grid(S, nx, ny, jit, seed) {
    const { c } = S, P = [];
    for (let j = 0; j <= ny; j++) {
      P.push([]);
      for (let i = 0; i <= nx; i++) {
        const ex = i === 0 || i === nx, ey = j === 0 || j === ny;
        P[j].push([c.w * i / nx + (ex ? 0 : (rnd(seed, j * 31 + i) - .5) * jit * c.w / nx), c.h * j / ny + (ey ? 0 : (rnd(seed + 1, j * 31 + i) - .5) * jit * c.h / ny)]);
      }
    }
    const out = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
      if (rnd(seed + 2, j * 7 + i) > .45) { if (rnd(seed + 3, j * 7 + i) > .5) { out.push([q[0], q[1], q[2]]); out.push([q[0], q[2], q[3]]); } else { out.push([q[0], q[1], q[3]]); out.push([q[1], q[2], q[3]]); } }
      else out.push(q);
    }
    return out;
  }
  /* card pieces as real SVG copies of the card, each clipped to its polygon; broken edges are inked */
  function A_shards(S, polys, layer, key, o = {}) {
    const { c } = S, mk = A_cardMarkup(S), out = [];
    const onEdge = (a, b) => (Math.abs(a[0]) < .5 && Math.abs(b[0]) < .5) || (Math.abs(a[0] - c.w) < .5 && Math.abs(b[0] - c.w) < .5) || (Math.abs(a[1]) < .5 && Math.abs(b[1]) < .5) || (Math.abs(a[1] - c.h) < .5 && Math.abs(b[1] - c.h) < .5);
    let defs = '', html = '';
    polys.forEach((poly, i) => {
      const id = `${S.id}A${key}${i}`, d = polyD(poly) + 'Z';
      let e = '';
      poly.forEach((a, k) => { const b = poly[(k + 1) % poly.length]; if (!onEdge(a, b)) e += `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`; });
      defs += `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
      html += `<g style="display:none"><g clip-path="url(#${id})">${mk}${o.soot ? `<path d="${d}" fill="rgba(31,26,23,${o.soot})"/>` : ''}</g><path d="${e}" fill="none" stroke="${INK}" stroke-width="${o.edge || 2.4}" stroke-linecap="round"/></g>`;
      const cx = poly.reduce((a, q) => a + q[0], 0) / poly.length, cy = poly.reduce((a, q) => a + q[1], 0) / poly.length;
      let h = 0; poly.forEach(q => { h = Math.max(h, Math.abs(q[1] - cy)); });
      out.push({ poly, cx, cy, h });
    });
    S.defs.insertAdjacentHTML('beforeend', defs);
    layer.innerHTML = html;
    [...layer.children].forEach((g, i) => { out[i].g = g; });
    return out;
  }
  function A_place(sh, x, y, deg, sx, sy, op) {
    if (op != null && op <= 0) { sh.g.style.display = 'none'; return; }
    sh.g.style.display = '';
    sh.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${(sx || 1).toFixed(3)} ${(sy || 1).toFixed(3)}) translate(${(-sh.cx).toFixed(1)} ${(-sh.cy).toFixed(1)})`);
    sh.g.setAttribute('opacity', op == null ? 1 : op.toFixed(2));
  }
  /* accordion folds across a card squashed onto its bottom edge */
  function A_pleats(p, S, sy, sx, tx) {
    const { c, U } = S, h = c.h * sy, bot = c.y + c.h, top = bot - h, w = c.w * sx, l = c.x + (tx || 0) + c.w / 2 - w / 2, r = l + w, n = 4, e = U * .05;
    p.g({ halo: false });
    for (let i = 0; i < n; i++) if (i % 2) p.shape([[l + 2, top + h * i / n], [r - 2, top + h * i / n], [r - 2, top + h * (i + 1) / n], [l + 2, top + h * (i + 1) / n]], { fill: 'rgba(31,26,23,.2)', stroke: false });
    for (let i = 1; i < n; i++) p.line([[l + 1, top + h * i / n], [r - 1, top + h * i / n]], { w: .6 });
    p.g();
    [[l, -1], [r, 1]].forEach(([x, s]) => { const pts = []; for (let i = 0; i <= n; i++) pts.push([x + (i % 2 ? s * e : 0), top + h * i / n]); p.line(pts, { w: .9 }); });
  }

  /* ═════════ A1. THE ANVIL — lines it up to the inch, then lets go of the rope ═════════ */
  function A_anvilDraw(p, x, yb, U, a) {   // x = centre of the base, yb = bottom
    const C = [x, yb], T = pts => pts.map(([u, v]) => rot([x + u * U, yb + v * U], C, a || 0));
    p.g();
    p.shape(T([[-.48, -.37], [-.22, -.44], [.33, -.44], [.34, -.31], [.17, -.28], [.1, -.15], [.21, -.05], [.25, 0], [-.21, 0], [-.18, -.05], [-.07, -.15], [-.13, -.27], [-.3, -.3]]), { fill: INK });
    p.line(T([[-.2, -.4], [.28, -.4]]), { w: .7, color: '#fff', halo: false, amp: .2 });
  }
  GAGS.A_anvil = {
    name: 'The Anvil', dur: 3.75, ones: [[1.5, 2.14]],
    cues: [[0.05, 'footsteps'], [0.8, 'scoot'], [1.16, 'scoot-small'], [1.56, 'finger-snap'], [1.6, 'falling-whistle'], [1.88, 'anvil-clang'], [1.92, 'crunch'], [2.0, 'hat-hop'], [3.04, 'hat-tip']],
    setup(S) {
      const { U, G, c } = S;
      const xs = S.xs = c.x + c.w * .1; S.x0 = -U * .6;
      const A = S.A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.nudge = track([[.78, { x: 0 }], [.92, { x: U * .15 }, 'out'], [1.14, {}], [1.28, { x: U * .1 }, 'out']]);
      S.trk = track([
        [.55, { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .44), hR: A(.1, .44), hat: 0, hatTilt: 0 }],
        [.62, { look: 1, hd: [U * .01, U * .02] }],
        [.7, { look: -.2, hd: [0, 0] }],
        [.78, { hR: A(.33, .62), lean: .08 }],
        [.92, { hR: A(.48, .62), lean: .26, fR: A(.12, 0) }, 'out'],
        [1.0, { hR: A(.12, .45), lean: 0 }],
        [1.06, { look: 1, hd: [U * .01, U * .02], brow: 1 }],
        [1.14, { look: -.2, hd: [0, 0], hR: A(.46, .62), lean: .2 }],
        [1.28, { hR: A(.41, .62), lean: .14 }, 'out'],
        [1.34, { hR: A(.1, .44), lean: 0, fR: A(.07, 0), look: 1, hd: [U * .01, U * .025], brow: 0 }],
        [1.4, { hd: [0, 0], look: 0 }],
        [1.48, { hR: A(.3, 1.02), face: .7, look: -1, hd: [0, -U * .01] }, 'out'],
        [1.54, {}],
        [1.58, { hR: A(.33, .52) }, 'in'],
        [1.66, { hR: A(.1, .44) }],
        [1.88, {}],
        [1.96, { look: .35, face: 1, hd: [0, U * .01] }],
        [2.72, {}],
        [2.84, { face: 0, look: 0, hd: [0, 0] }],
        [2.98, { hR: A(.06, .98) }],
        [3.06, { hat: 1, hatTilt: -.3 }],
        [3.18, { hat: 0, hatTilt: 0 }],
        [3.3, { hR: A(.1, .44) }],
      ]);
      const xa = S.xa = c.x + c.w / 2 + U * .1, bot = c.y + c.h;
      S.puffs = A_puffs(S, 4, xa - c.w * .62, xa - c.w * .4, bot + 2, 1.92, { r: .12, rv: .07, dx: .22, seed: 2 }).concat(A_puffs(S, 4, xa + c.w * .4, xa + c.w * .62, bot + 2, 1.92, { r: .12, rv: .07, dx: .22, seed: 3 }));
      S.bits = A_mkBits(S, 5, xa, bot - U * .1, 1.92, 41, { a0: -2.9, a1: -.25, v: 1.4, jx: 1.4 });
    },
    draw(S, t, p) {
      const { U, G, c } = S, xa = S.xa, bot = c.y + c.h;
      let P = S.trk(t);
      if (t < .55) { P = walk(S, P, t, 0, .55, S.x0, S.xs); }
      const nx = S.nudge(t).x, kq = seg(t, 1.86, 1.93), sx = 1 + .07 * E.out(kq);
      let sy = 1;
      if (t >= 1.86) { sy = lerp(1, .1, E.in(kq)) + (t < 2.12 ? Math.sin(seg(t, 1.93, 2.12) * Math.PI) * .035 : 0); S.setCard({ tx: nx, sy, sx, px: c.w / 2, py: c.h }); }
      else S.setCard({ tx: nx });
      shadow(p, P.hip[0], G, U * .2);
      // the mark on the floor
      p.g(); const X = [xa, G + U * .035], xw = U * .1, xh = U * .03;
      p.line([[X[0] - xw, X[1] - xh], [X[0] + xw, X[1] + xh]], { w: 1.3 }); p.line([[X[0] - xw, X[1] + xh], [X[0] + xw, X[1] - xh]], { w: 1.3 });
      if (t >= 1.5) { const k = t < 1.86 ? E.in(seg(t, 1.5, 1.86)) : 1; p.g({ halo: false }); p.circ(xa, G + 1, U * lerp(.06, .38, k), { sy: .13, fill: k < 1 ? WASH : WASH2, stroke: false, n: 12 }); }
      if (t >= 1.93) A_pleats(p, S, sy, sx, nx);
      if (t >= 1.92) A_bits(p, S, S.bits, t, bot);
      // the anvil
      if (t >= 1.6) {
        const ay = t < 1.86 ? lerp(-U * .1, c.y, E.in(seg(t, 1.6, 1.86))) : bot - c.h * sy;
        if (t < 1.86) A_speed(p, [-.22, 0, .22].map(dx => [[xa + dx * U, ay - U * .52], [xa + dx * U, ay - U * (.6 + .6 * seg(t, 1.6, 1.76))]]));
        A_anvilDraw(p, xa, ay, U, t >= 1.93 && t < 2.04 ? .04 : 0);
      }
      const hop = t >= 1.91 && t < 2.13 ? Math.sin(seg(t, 1.91, 2.13) * Math.PI) * .7 : 0;
      P.hatOff = [0, -(P.hat * .45 + hop)];
      A_fig(p, S, P, { mustache: true, bow: true }, 'boater');
      if (t >= 1.93 && t < 2.06) { A_spray(p, [xa - c.w * .54, bot - U * .06], U * .05, U * .16, 2.7, 3.6, 3, .8); A_spray(p, [xa + c.w * .54, bot - U * .06], U * .05, U * .16, -.46, .44, 3, .8); }
      if (t >= 1.92) A_dust(p, S.puffs, t, 1 - seg(t, 2.35, 2.75));
    }
  };

  /* ═════════ A2. THE PIANO — checks his watch, steps aside, and the universe gets him anyway ═════════ */
  function A_pianoDraw(p, U, x, yb, a, wreck) {   // grand piano in side elevation; (x, yb) = floor under it, centred. wreck 0..1 = legs splayed, lid slammed
    const w = wreck || 0, spl = .95 * w, legH = .4 * Math.cos(spl), cb = -legH;   // cb = case bottom
    const C = [x, yb], T = pts => pts.map(([u, v]) => rot([x + u * U, yb + v * U], C, a || 0));
    p.g();
    [[-.62, 1], [.6, -1]].forEach(([u, s]) => {
      const top = [u, cb], dir = [Math.sin(s * spl) * -1 * (s > 0 ? 1 : 1), Math.cos(spl)], d2 = [s > 0 ? -Math.sin(spl) : Math.sin(spl), Math.cos(spl)];
      const e = [top[0] + d2[0] * .4, top[1] + d2[1] * .4], n = [-d2[1], d2[0]];
      p.shape(T([[top[0] + n[0] * .05, top[1] + n[1] * .05], [top[0] - n[0] * .05, top[1] - n[1] * .05], [e[0] - n[0] * .03, e[1] - n[1] * .03], [e[0] + n[0] * .03, e[1] + n[1] * .03]]), { fill: INK, w: .7 });
      p.circ(...T([[e[0], e[1] - .01]])[0], U * .022, { fill: '#fff', w: .6, n: 7 });
    });
    if (w < .5) {
      p.line(T([[.34, cb - .24], [.44, cb - .62]]), { w: .8 });
      p.shape(T([[-.5, cb - .25], [.84, cb - .25], [.66, cb - .82], [.3, cb - .77]]), { fill: INK });
    }
    p.shape(T([[-.78, cb], [.72, cb], [.82, cb - .06], [.82, cb - .2], [.74, cb - .26], [-.78, cb - .26]]), { fill: INK });
    p.line(T([[-.72, cb - .06], [.72, cb - .06]]), { w: .6, color: '#fff', halo: false, amp: .2 });
    if (w >= .5) {   // the lid, slammed and knocked askew; the prop stick snapped
      const L = [[-.62, cb - .26], [.92, cb - .26], [.92, cb - .33], [-.62, cb - .33]].map(q => rot(q, [.2, cb - .3], .1));
      p.shape(T(L), { fill: INK });
    }
    p.shape(T([[-.98, cb - .06], [-.78, cb - .06], [-.78, cb - .16], [-.98, cb - .16]]), { fill: '#fff', w: .8 });
    for (let i = 0; i < 4; i++) { if (w >= .5 && i % 2) continue; p.line(T([[-.95 + i * .05, cb - .16], [-.95 + i * .05, cb - .11]]), { w: .5, halo: false, amp: .05 }); }
    if (w < .5) p.line(T([[-.8, cb - .26], [-.86, cb - .46], [-.7, cb - .48]]), { w: .8 });
  }
  function A_metronome(p, U, x, y, a, swing) {   // (x, y) = bottom centre
    const T = pts => pts.map(([u, v]) => rot([x + u * U, y + v * U], [x, y], a || 0));
    p.g();
    p.shape(T([[-.085, 0], [.085, 0], [.035, -.26], [-.035, -.26]]), { fill: '#fff' });
    p.shape(T([[-.085, 0], [.085, 0], [.076, -.045], [-.076, -.045]]), { fill: INK, w: .6 });
    const tip = [Math.sin(swing) * .22, -.05 - Math.cos(swing) * .22], wt = [Math.sin(swing) * .14, -.05 - Math.cos(swing) * .14];
    p.line(T([[0, -.05], tip]), { w: .75 });
    p.shape(T([[wt[0] - .025, wt[1] - .014], [wt[0] + .025, wt[1] - .014], [wt[0] + .025, wt[1] + .014], [wt[0] - .025, wt[1] + .014]]), { fill: INK, w: .5 });
  }
  GAGS.A_piano = {
    name: 'The Piano', dur: 3.85, ones: [[1.58, 2.06], [2.58, 2.92]],
    cues: [[0.05, 'footsteps'], [0.62, 'watch-click'], [0.7, 'tick-tock'], [1.5, 'falling-whistle'], [1.52, 'two-steps'], [1.88, 'piano-crash'], [1.92, 'chord-jangle'], [1.96, 'keys-scatter'], [2.6, 'small-whistle'], [2.84, 'bonk'], [2.92, 'metronome-tick-loop'], [3.3, 'watch-close']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .48, x2 = S.x2 = c.x + c.w * .95; S.x0 = W + U * .5;
      S.px = c.x + c.w * .42;
      const A = (dx, dy) => [xs + dx * U, G - dy * U], B = (dx, dy) => [x2 + dx * U, G - dy * U];
      S.trk = track([
        [.52, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .44), hR: A(.1, .44) }],
        [.62, { face: 0, hR: A(.03, .6), hL: A(-.1, .44), look: 1, hd: [0, U * .015] }],
        [1.18, {}],
        [1.28, { look: -1, hd: [0, -U * .01] }],
        [1.42, {}],
        [1.5, { look: 1, hd: [0, U * .015] }],
        [1.78, { hip: B(0, .415), fL: B(-.07, 0), fR: B(.07, 0), hR: B(.03, .6), hL: B(-.1, .44) }, 'io'],
        [1.86, {}],
        [1.98, { look: .5, face: -.7, hd: [0, U * .01] }],
        [2.3, {}],
        [2.42, { face: 0, look: 1, hd: [0, U * .015] }],
        [2.82, {}],
        [2.88, { hip: B(0, .37), hd: [0, U * .03] }, 'out'],
        [3.0, { hip: B(0, .415), hd: [0, U * .015] }],
        [3.12, { look: 0, hd: [0, 0] }],
        [3.3, { hR: B(.04, .5) }],
        [3.42, { hR: B(.1, .44) }],
      ]);
      S.puffs = A_puffs(S, 9, S.px - U * 1.05, S.px + U * 1.05, G + 2, 1.88, { r: .16, rv: .1, dx: .3, seed: 4, rise: .1 });
      S.bits = A_mkBits(S, 6, S.px, G - U * .3, 1.88, 52, { a0: -3.0, a1: -.15, v: 1.8, jx: 1.6 });
      S.keys = A_mkBits(S, 4, S.px - U * .85, G - U * .2, 1.9, 77, { a0: -2.6, a1: -1.6, v: 1.5, r: .03 });
    },
    draw(S, t, p) {
      const { U, G, c } = S, bot = c.y + c.h, px = S.px;
      let P = S.trk(t);
      if (t < .52) { P = walk(S, P, t, 0, .52, S.x0, S.xs); }
      if (t >= 1.5 && t < 1.78) { const w = walk(S, P, t, 1.5, 1.78, S.xs, S.x2, { carry: true, stride: .5 }); P.hip = w.hip; P.fL = w.fL; P.fR = w.fR; P.lean = 0; }
      // the piano: falls, meets the top of the card, drives it into the floor, collapses
      const yHit = 1.8, yLand = 1.88;
      let sy = 1;
      if (t >= yHit) sy = Math.max(.03, 1 - E.in(seg(t, yHit, yLand)) * .97);
      if (t >= yLand) S.setCard({ hide: true }); else S.setCard({ sy, px: c.w / 2, py: c.h });
      shadow(p, P.hip[0], G, U * .2);
      if (t >= 1.45 && t < yLand) { const k = E.in(seg(t, 1.45, yLand)); p.g({ halo: false }); p.circ(px, G + 1, U * lerp(.15, .95, k), { sy: .12, fill: WASH, stroke: false, n: 14 }); }
      if (t >= 1.58 && t < yLand) {
        const legs = t < yHit ? lerp(-U * .3, c.y, E.in(seg(t, 1.58, yHit))) : bot - c.h * sy;
        A_speed(p, [-.6, -.1, .5].map(dx => [[px + dx * U, legs - U * 1.25], [px + dx * U, legs - U * 1.9]]));
        A_pianoDraw(p, U, px, legs, -.06, 0);
      }
      if (t >= yLand) {
        p.g({ halo: false }); p.circ(px, G + 1, U * 1.05, { sy: .1, fill: WASH2, stroke: false, n: 14 });
        // a corner of the card sticking out from under it
        p.g(); p.shape([[px + U * .5, G - U * .02], [px + U * .98, G - U * .04], [px + U * 1.02, G + U * .015], [px + U * .52, G + U * .03]], { fill: '#fff', w: 1.6 });
        const k = seg(t, yLand, yLand + .1);
        A_pianoDraw(p, U, px, G + (k < 1 ? -Math.sin(k * Math.PI) * U * .05 : 0), -.03, 1);
        A_bits(p, S, S.keys, t);
        A_dust(p, S.puffs, t, 1 - seg(t, 2.3, 2.7));
        if (t < yLand + .1) { A_spray(p, [px - U * 1.1, G - U * .1], U * .06, U * .2, 2.6, 3.7, 3, .9); A_spray(p, [px + U * 1.05, G - U * .1], U * .06, U * .2, -.55, .55, 3, .9); }
      }
      // him, with his watch
      if (t >= 3.04 && t < 3.12) P.blink = 1;
      const J = A_fig(p, S, P, { glasses: true }, 'fedora');
      if (t >= .58 && t < 3.34) { p.g(); const w = [P.hR[0] - U * .02, P.hR[1] - U * .03]; p.line([w, [J.hip[0] + U * .02, J.hip[1] - U * .06]], { w: .45, halo: false, amp: .3 }); p.circ(w[0], w[1], U * .04, { fill: '#fff', w: .8, n: 8 }); p.line([[w[0], w[1]], [w[0], w[1] - U * .025]], { w: .5, halo: false, amp: .05 }); }
      // the metronome, last of all — lands on his hat and keeps time
      if (t >= 2.6) {
        const top = [J.hc[0], J.hc[1] - J.hr * 1.22];
        let x = top[0], y, a, sw;
        if (t < 2.84) { const k = seg(t, 2.6, 2.84); y = lerp(-U * .4, top[1], E.in(k)); a = (1 - E.in(k)) * 2.4; sw = .3; }
        else { y = top[1]; a = t < 2.98 ? Math.sin(seg(t, 2.84, 2.98) * Math.PI * 2) * .15 : 0; sw = Math.sin((t - 2.84) * Math.PI * 2 * 1.6) * .45; }
        if (t < 2.84) A_speed(p, [[[x - U * .06, y - U * .45], [x - U * .06, y - U * .3]], [[x + U * .06, y - U * .45], [x + U * .06, y - U * .3]]]);
        A_metronome(p, U, x, y, a, sw);
        if (t >= 2.84 && t < 2.96) A_spray(p, [x, y - U * .1], U * .18, U * .28, -2.7, -.45, 5, .7);
      }
    }
  };

  /* ═════════ A3. SHORT FUSE — lights it, winds up to throw, and the fuse is shorter than advertised ═════════ */
  function A_tntDraw(p, U, x, y, fuse, a) {   // stick of dynamite, (x,y) = bottom, fuse 0..1 remaining
    const T = pts => pts.map(([u, v]) => rot([x + u * U, y + v * U], [x, y], a || 0));
    p.g();
    p.shape(T([[-.045, 0], [.045, 0], [.045, -.3], [-.045, -.3]]), { fill: '#fff', w: .9 });
    p.shape(T([[-.04, -.12], [.04, -.12], [.04, -.19], [-.04, -.19]]), { fill: WASH2, stroke: false, halo: false });
    p.line(T([[-.045, -.12], [.045, -.12]]), { w: .5, halo: false }); p.line(T([[-.045, -.19], [.045, -.19]]), { w: .5, halo: false });
    if (fuse > 0) {
      const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8 * fuse; pts.push([Math.sin(u * 5) * .03, -.3 - u * .16]); }
      p.line(T(pts), { w: .55, amp: .1 });
      return T([pts[pts.length - 1]])[0];
    }
    return T([[0, -.3]])[0];
  }
  GAGS.A_tnt = {
    name: 'Short Fuse', dur: 3.8, ones: [[1.1, 1.62]],
    cues: [[0.05, 'footsteps'], [0.8, 'match-strike'], [0.98, 'fuse-light'], [1.1, 'fuse-zip'], [1.2, 'kaboom'], [1.3, 'paper-flutter-loop'], [1.92, 'blink'], [2.4, 'blink'], [3.0, 'smoke-puff'], [3.2, 'blink']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .36; S.x0 = W + U * .5;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.trk = track([
        [.46, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.12, .44), hR: A(.15, .62) }],
        [.56, { face: 0, hR: A(.17, .8) }],
        [.7, { hL: A(-.1, .5) }],
        [.78, { hL: A(-.22, .82), face: -.6 }],
        [.86, { hL: A(-.4, .74) }, 'out'],
        [.98, { hL: A(.06, 1.02), face: .3, look: -.4 }],
        [1.04, { hL: A(-.14, .46), look: 0 }],
        [1.12, { hR: A(-.06, 1.04), lean: -.12, face: -.4, look: -.6, fR: A(.1, 0) }, 'out'],
        [1.18, { face: .1, look: -.9 }],
        [2.55, {}],
        [2.95, { hR: A(.12, .44), lean: 0, face: 0, look: 0 }],
      ]);
      const B = S.B = A(-.02, 1.2);
      S.cloud = Array.from({ length: 11 }, (_, i) => { const a = i / 11 * Math.PI * 2 + .3; const d = U * (.32 + rnd(S.seed + 61, i) * .3); return { x: B[0] + Math.cos(a) * d, y: B[1] + Math.sin(a) * d * .8 + U * .35, t0: 1.2 + rnd(S.seed + 62, i) * .06, r: U * (.28 + rnd(S.seed + 63, i) * .14), rise: U * (.1 + rnd(S.seed + 64, i) * .15), dx: Math.cos(a) * U * .12, life: .45 }; });
      S.smk = Array.from({ length: 9 }, (_, i) => ({ x: B[0] + (rnd(S.seed + 70, i) - .5) * U * .9, y: B[1] + U * .3 + (rnd(S.seed + 71, i) - .5) * U * .4, t0: 1.45 + rnd(S.seed + 72, i) * .2, r: U * (.18 + rnd(S.seed + 73, i) * .14), rise: U * .5, dx: (rnd(S.seed + 74, i) - .5) * U * .3, life: .7, op: .8 }));
      S.lay = A_layer(S, 'mid');
      S.sh = A_shards(S, A_grid(S, 5, 5, .6, 11), S.lay, 'tnt', { soot: .12, edge: 2.4 });
      S.sh.forEach((q, i) => { const cx = c.x + q.cx, cy = c.y + q.cy, d = [cx - B[0], cy - B[1]], L = Math.hypot(d[0], d[1]) || 1; q.dir = [d[0] / L, d[1] / L]; q.v = U * (9 + rnd(S.seed + 80, i) * 7); q.spin = (rnd(S.seed + 81, i) - .5) * 1100; q.ph = rnd(S.seed + 82, i) * 6; q.sx = cx; q.sy0 = cy; });
      S.bits = A_mkBits(S, 7, B[0], B[1] - U * .3, 1.36, 91, { a0: -2.6, a1: -.5, v: .9, vv: .8, jx: 1.4, jy: .5, spread: .25 });
    },
    draw(S, t, p) {
      const { U, G, c } = S, B = S.B, boom = 1.2;
      let P = S.trk(t);
      if (t < .46) { P = walk(S, P, t, 0, .46, S.x0, S.xs, { carry: true }); P.hR = [P.hip[0] + U * .15, G - U * .62]; P.hL = [P.hip[0] - U * .12, G - U * .44]; }
      // the card: whole until the bang, then pieces everywhere
      if (t < boom) { S.setCard({}); S.sh.forEach(q => A_place(q, 0, 0, 0, 1, 1, 0)); }
      else {
        S.setCard({ hide: true });
        const d = t - boom;
        S.sh.forEach(q => {
          const k = (1 - Math.exp(-1.6 * d)) / 1.6;
          const x = q.sx + q.dir[0] * q.v * k, y = q.sy0 + q.dir[1] * q.v * k + U * 2 * d * d;
          A_place(q, x, y, q.spin * k, .9, .9, 1 - seg(t, 1.42, 1.6));
        });
      }
      shadow(p, P.hip[0], G, U * .2);
      const soot = t >= 1.24;
      if (soot) { P.headFill = INK; P.blink = (t >= 1.9 && t < 1.98) || (t >= 2.38 && t < 2.46) || (t >= 3.18 && t < 3.26); }
      const J = A_fig(p, S, P, { tie: true, hat: soot ? undefined : 'hair' }, soot ? 'frazzle' : null);
      if (soot) A_sootEyes(p, J, P);
      // the stick, the match
      if (t < boom) {
        const fuse = t < 1.1 ? 1 : 1 - E.lin(seg(t, 1.1, 1.17));
        const hold = P.hR, a = t < 1.04 ? .1 : -.5;
        const tip = A_tntDraw(p, U, hold[0] - U * .01, hold[1] + U * .06, fuse, a);
        if (t >= .98) { star(p, tip, U * (.05 + (Math.floor(t * 24) % 2) * .02), 5, Math.floor(t * 24)); }
        if (t >= .7 && t < 1.04) {
          const m = P.hL; p.g(); p.line([m, [m[0] + U * .07, m[1] - U * .07]], { w: .7 });
          if (t >= .84) star(p, [m[0] + U * .08, m[1] - U * .08], U * (t < .92 ? .08 : .04), 5, 3);
        }
      }
      // the bang: flash, cloud, then smoke rolling off him
      if (t >= boom && t < boom + .1) { star(p, B, U * (t < boom + .05 ? .9 : 1.2), 11, 2); }
      if (t >= boom + .04 && t < 1.75) A_dust(p, S.cloud, t, 1 - seg(t, 1.5, 1.75));
      if (t >= 1.45) A_smoke(p, S.smk, t);
      if (t >= 1.36) A_bits(p, S, S.bits, t);
      if (t >= 2.98 && t < 3.6) { p.g({ halo: false }); [[-.5, 0], [.5, .12]].forEach(([s, dt]) => { const k = seg(t, 2.98 + dt, 3.5 + dt); if (k <= 0 || k >= 1) return; p.circ(J.hc[0] + s * J.hr * (1.3 + k), J.hc[1] - J.hr * (.4 + k * 3), J.hr * (.25 + k * .35), { fill: '#EEEAE4', w: .6, color: 'rgba(31,26,23,.5)', op: 1 - k }); }); }
    }
  };

  /* ═════════ A4. THE CANNON — a clean hole, a face in the hole, and a push ═════════ */
  function A_cannonDraw(p, S, x, el, wheel) {   // x = wheel centre; el = barrel angle (rad, negative = up)
    const U = S.U, G = S.G, R = U * .17, ax = [x, G - R];
    const d = [Math.cos(el), Math.sin(el)], n = [-d[1], d[0]];
    const b0 = [ax[0] - d[0] * U * .22, ax[1] - d[1] * U * .22], b1 = [ax[0] + d[0] * U * .52, ax[1] + d[1] * U * .52], r0 = U * .1, r1 = U * .07;
    p.g();
    p.shape([[ax[0] - U * .36, G - U * .02], [ax[0] - U * .36, G - U * .07], [ax[0] + U * .04, G - R - U * .07], [ax[0] + U * .1, G - R + U * .02], [ax[0] - U * .2, G - U * .02]], { fill: '#E9E6E2' });
    p.shape([[b0[0] + n[0] * r0, b0[1] + n[1] * r0], [b1[0] + n[0] * r1, b1[1] + n[1] * r1], [b1[0] - n[0] * r1, b1[1] - n[1] * r1], [b0[0] - n[0] * r0, b0[1] - n[1] * r0]], { fill: INK });
    p.circ(b0[0] - d[0] * U * .04, b0[1] - d[1] * U * .04, U * .055, { fill: INK, n: 8 });
    p.line([[b1[0] + n[0] * r1 * 1.3, b1[1] + n[1] * r1 * 1.3], [b1[0] - n[0] * r1 * 1.3, b1[1] - n[1] * r1 * 1.3]], { w: 1.9 });
    p.line([[ax[0] - d[0] * U * .06 + n[0] * r0 * .5, ax[1] - d[1] * U * .06 + n[1] * r0 * .5], [ax[0] + d[0] * U * .3 + n[0] * r1 * .55, ax[1] + d[1] * U * .3 + n[1] * r1 * .55]], { w: .6, color: '#fff', halo: false, amp: .15 });
    p.circ(ax[0], ax[1], R, { fill: '#fff' });
    for (let i = 0; i < 3; i++) { const a = wheel + i / 3 * Math.PI; p.line([[ax[0] + Math.cos(a) * R * .9, ax[1] + Math.sin(a) * R * .9], [ax[0] - Math.cos(a) * R * .9, ax[1] - Math.sin(a) * R * .9]], { w: .6, halo: false }); }
    p.circ(ax[0], ax[1], R * .2, { fill: INK, n: 7 });
    return { breech: b0, muzzle: b1, d };
  }
  GAGS.A_cannon = {
    name: 'The Cannon', dur: 4.0, ones: [[1.5, 1.72], [3.16, 3.42]],
    cues: [[0.05, 'wheels-creak'], [0.68, 'crank'], [1.1, 'match-strike'], [1.18, 'fuse-sizzle'], [1.52, 'cannon-boom'], [1.56, 'paper-punch'], [1.95, 'distant-crash'], [2.06, 'footsteps'], [2.94, 'blink'], [3.18, 'push'], [3.36, 'slap-flat']],
    setup(S) {
      const { U, G, c, W } = S;
      const xc = S.xc = c.x + c.w * .36; S.cx0 = -U * .5;
      S.hole = [c.w * .62, c.h * .615]; S.rh = U * .3;
      const hs = [c.x + S.hole[0], c.y + S.hole[1]];
      S.aim = Math.atan2(hs[1] - (G - U * .17), hs[0] - xc);
      const A = (dx, dy) => [xc + dx * U, G - dy * U];
      S.trk = track([
        [.6, { hip: A(-.42, .4), lean: .3, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.52, 0), fR: A(-.34, 0), hL: A(-.24, .3), hR: A(-.2, .34), el: -.08 }],
        [.66, { lean: .15, hip: A(-.4, .415), fL: A(-.47, 0), fR: A(-.33, 0) }],
        [.96, { el: S.aim, hL: A(-.15, .4), hR: A(-.12, .44) }],
        [1.02, { hip: A(-.36, .3), lean: .45, look: .5, hL: A(-.24, .3), hR: A(-.2, .32) }],
        [1.08, {}],
        [1.14, { hip: A(-.4, .415), lean: .05, look: 0, hR: A(-.14, .42), hL: A(-.5, .44) }],
        [1.22, {}],
        [1.36, { hip: A(-.62, .415), lean: -.12, face: 0, fL: A(-.7, 0), fR: A(-.55, 0), hL: A(-.73, .8), hR: A(-.5, .8), blink: 1, brow: 1 }],
        [1.8, {}],
        [1.9, { hL: A(-.75, .44), hR: A(-.5, .44), lean: 0, face: .7, look: -.5, blink: 0, brow: 0 }],
        [2.04, {}],
      ]);
      S.recoil = track([[1.52, { x: 0, el: 0 }], [1.58, { x: -U * .2, el: -.25 }, 'out'], [1.74, { el: 0 }], [1.9, {}]]);
      S.smk = Array.from({ length: 8 }, (_, i) => ({ t0: 1.52 + i * .03, r: U * (.16 + rnd(S.seed + 20, i) * .12), rise: U * (.25 + rnd(S.seed + 21, i) * .3), dx: (rnd(S.seed + 22, i) - .5) * U * .4, life: .7 + rnd(S.seed + 23, i) * .3, k: .3 + i * .12, op: .9 }));
      S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}Ah" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${c.w + 120}" height="${c.h + 120}"><rect x="-60" y="-60" width="${c.w + 120}" height="${c.h + 120}" fill="#fff"/><circle class="Ahole" cx="${S.hole[0]}" cy="${S.hole[1]}" r="${S.rh}" fill="#000" style="display:none"/></mask>`);
      S.cardIn.setAttribute('mask', `url(#${S.id}Ah)`);
      S.holeEl = S.defs.querySelector('.Ahole');
      S.back = A_layer(S, 'back');
      S.bits = A_mkBits(S, 7, hs[0], hs[1], 1.56, 33, { v: 1.2, vv: 1.0, jx: .4, jy: .4 });
      S.puffs = A_puffs(S, 9, c.x - U * .1, c.x + c.w + U * .1, G + 2, 3.36, { r: .1, rv: .07, dx: .2, seed: 9, rise: .03, life: .5 });
      S.xb = c.x + S.hole[0];
    },
    draw(S, t, p) {
      const { U, G, c, W } = S;
      let P = S.trk(t);
      const rc = S.recoil(t);
      let xc = S.xc + rc.x;
      if (t < .6) { const k = seg(t, 0, .6); xc = lerp(S.cx0, S.xc, k); P = walk(S, P, t, 0, .6, S.cx0 - U * .42, S.xc - U * .42, { carry: true, lean: .3 }); P.hL = [xc - U * .24, G - U * .3]; P.hR = [xc - U * .2, G - U * .34]; P.el = -.08; }
      const el = P.el + rc.el;
      // the card: a clean round hole, then it falls flat
      S.holeEl.style.display = t >= 1.56 ? '' : 'none';
      let cardSy = 1;
      if (t >= 3.18) { cardSy = Math.cos(E.in(seg(t, 3.18, 3.36)) * Math.PI / 2); }
      if (t >= 3.36) S.setCard({ hide: true });
      else if (t >= 3.18) S.setCard({ sy: Math.max(cardSy, .02), sx: 1 + (1 - cardSy) * .08, px: c.w / 2, py: c.h });
      else if (t >= 1.56 && t < 1.7) S.setCard({ tx: (Math.floor(t * 48) % 2 ? 1.8 : -1.8) * (1 - seg(t, 1.56, 1.7)) });
      else S.setCard({});
      S.over.innerHTML = t >= 1.56 ? `<circle cx="${S.hole[0]}" cy="${S.hole[1]}" r="${(S.rh + 1.2).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="2.6"/>` : '';
      // him, behind the card: through the hole, then in the open
      const back = A_pen(p);
      if (t >= 2.36) {
        const xb = S.xb, B = (dx, dy) => [xb + dx * U, G - dy * U];
        let Q = track([
          [2.66, { hip: B(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: B(-.07, 0), fR: B(.07, 0), hL: B(-.12, .44), hR: B(.1, .44) }],
          [2.76, { face: 0 }],
          [3.12, {}],
          [3.18, { hL: B(-.14, .74), hR: B(.14, .74), lean: .04 }],
          [3.3, { hL: B(-.12, .8), hR: B(.16, .8), lean: .1, hd: [0, 0] }, 'out'],
          [3.5, {}],
          [3.66, { hL: B(-.12, .44), hR: B(.1, .44), lean: 0, look: .5 }],
          [3.8, { look: 0 }],
        ])(t);
        if (t < 2.66) Q = walk(S, Q, t, 2.34, 2.66, -U * .6, xb, { ease: true });
        Q.blink = t >= 2.94 && t < 3.02;
        shadow(back, Q.hip[0], G, U * .2);
        A_fig(back, S, Q, {}, 'beanie');
      }
      S.back.innerHTML = back.svg();
      // the cannon
      shadow(p, xc - U * .05, G, U * .3);
      const fuseLit = t >= 1.16 && t < 1.52;
      {
        let Pm = P;
        if (t >= 2.04 && t < 2.36) Pm = walk(S, P, t, 2.04, 2.32, S.trk(2.04).hip[0], -U * .7);
        if (t < 2.36) { shadow(p, Pm.hip[0], G, U * .2); }
        const Cn = A_cannonDraw(p, S, xc, el, (xc - S.cx0) / (U * .17));
        if (fuseLit) { const b = [Cn.breech[0] - Cn.d[0] * U * .02, Cn.breech[1] - U * .08]; star(p, b, U * (.035 + (Math.floor(t * 24) % 2) * .02), 5, Math.floor(t * 24)); }
        if (t < 2.36) A_fig(p, S, Pm, {}, 'beanie');
        if (t >= 1.06 && t < 1.18) { const m = P.hR; p.g(); p.line([m, [m[0] + U * .06, m[1] - U * .07]], { w: .7 }); star(p, [m[0] + U * .07, m[1] - U * .08], U * .04, 5, 4); }
        // shot: muzzle flash, the ball along the line, the hole
        if (t >= 1.52 && t < 1.6) star(p, [Cn.muzzle[0] + Cn.d[0] * U * .1, Cn.muzzle[1] + Cn.d[1] * U * .1], U * (t < 1.56 ? .22 : .3), 8, 5);
        if (t >= 1.52 && t < 1.57) { const k = seg(t, 1.52, 1.57), a = Cn.muzzle, b = [c.x + S.hole[0], c.y + S.hole[1]], q = mixPt(a, b, k); A_speed(p, [[mixPt(a, b, Math.max(0, k - .4)), q]], .6); p.g(); p.circ(q[0], q[1], U * .1 * (1 - k * .4), { fill: INK }); }
        if (t >= 1.56 && t < 1.66) burst(p, [c.x + S.hole[0], c.y + S.hole[1]], S.rh + U * .04, S.rh + U * .16, 10, .2, .8);
        S.smk.forEach(q => { q.x = Cn.muzzle[0] + Cn.d[0] * U * q.k * .6; q.y = Cn.muzzle[1] + Cn.d[1] * U * q.k * .6 + U * .1; });
        A_smoke(p, S.smk, t);
      }
      if (t >= 1.56) A_bits(p, S, S.bits, t);
      if (t >= 3.36) A_dust(p, S.puffs, t, 1 - seg(t, 3.6, 3.95));
    }
  };

  /* ═════════ A5. THE STEAMROLLER — rolls it flat and leaves; then backs over it again, to be sure ═════════ */
  function A_rollerDraw(p, S, x, spin) {   // facing right; x = centre of the front roller
    const U = S.U, G = S.G, Rd = U * .36, Rr = U * .37, rw = [x - U * 1.16, G - Rr];
    p.g();
    // canopy
    p.line([[x - U * 1.36, G - U * .66], [x - U * 1.36, G - U * 1.5]], { w: .9 });
    p.line([[x - U * .74, G - U * .74], [x - U * .74, G - U * 1.5]], { w: .9 });
    p.shape([[x - U * 1.5, G - U * 1.48], [x - U * .62, G - U * 1.48], [x - U * .68, G - U * 1.58], [x - U * 1.44, G - U * 1.58]], { fill: INK });
    // boiler + firebox
    p.shape([[x - U * 1.42, G - U * .38], [x - U * .24, G - U * .38], [x - U * .14, G - U * .46], [x - U * .14, G - U * .7], [x - U * .24, G - U * .78], [x - U * 1.02, G - U * .78], [x - U * 1.42, G - U * .66]], { fill: '#fff' });
    p.shape([[x - U * 1.4, G - U * .42], [x - U * .26, G - U * .42], [x - U * .18, G - U * .5], [x - U * .18, G - U * .54], [x - U * 1.4, G - U * .54]], { fill: WASH, stroke: false, halo: false });
    [-.86, -.56].forEach(u => p.dot(x + u * U, G - U * .64, U * .015));
    // chimney
    p.shape([[x - U * .38, G - U * .78], [x - U * .38, G - U * 1.12], [x - U * .45, G - U * 1.18], [x - U * .2, G - U * 1.18], [x - U * .27, G - U * 1.12], [x - U * .27, G - U * .78]], { fill: INK });
    // fork over the roller
    p.shape([[x - U * .05, G - Rd], [x - U * .22, G - U * .74], [x - U * .1, G - U * .74], [x + U * .06, G - Rd]], { fill: INK });
    // the big roller: a heavy drum
    p.circ(x, G - Rd, Rd, { fill: '#fff', w: 1.3 });
    p.circ(x, G - Rd, Rd * .8, { fill: 'none', w: .5, halo: false });
    p.circ(x, G - Rd + Rd * .35, Rd * .55, { sy: .45, fill: WASH, stroke: false, halo: false });
    for (let i = 0; i < 4; i++) { const a = spin + i / 4 * Math.PI * 2; p.line([[x + Math.cos(a) * Rd * .36, G - Rd + Math.sin(a) * Rd * .36], [x + Math.cos(a) * Rd * .7, G - Rd + Math.sin(a) * Rd * .7]], { w: .55, halo: false }); }
    p.circ(x, G - Rd, Rd * .2, { fill: INK, n: 8 });
    // rear wheel
    p.circ(rw[0], rw[1], Rr, { fill: '#fff', w: 1.3 });
    for (let i = 0; i < 4; i++) { const a = spin * Rd / Rr + i / 4 * Math.PI; p.line([[rw[0] + Math.cos(a) * Rr * .9, rw[1] + Math.sin(a) * Rr * .9], [rw[0] - Math.cos(a) * Rr * .9, rw[1] - Math.sin(a) * Rr * .9]], { w: .55, halo: false }); }
    p.circ(rw[0], rw[1], Rr * .16, { fill: INK, n: 8 });
    return { stack: [x - U * .33, G - U * 1.2], seat: [x - U * 1.04, G - U * .82], wheel: [x - U * .66, G - U * .98], rear: x - U * 1.56 };
  }
  GAGS.A_roller = {
    name: 'The Steamroller', dur: 4.0, ones: [],
    cues: [[0.0, 'chuff-loop'], [0.3, 'paper-crunch-loop'], [1.3, 'paper-crunch-stop'], [1.55, 'chuff-fade'], [1.6, 'silence'], [1.98, 'reverse-beep'], [2.23, 'reverse-beep'], [2.48, 'reverse-beep'], [2.73, 'reverse-beep'], [2.98, 'reverse-beep'], [3.23, 'reverse-beep'], [3.48, 'reverse-beep']],
    setup(S) {
      const { U, G, c, W } = S;
      S.xA = c.x - U * .55; S.xF = W + U * 1.8; S.xE = c.x - U * .5;
      S.xt = track([[0, { x: S.xA }], [1.55, { x: S.xF }, 'lin'], [1.98, {}], [3.55, { x: S.xE }, 'lin']]);
      S.dt = track([
        [0, { face: 1, look: 0, brow: 0, hd: [0, 0], lean: -.05, hat: 0, hatTilt: 0 }],
        [1.9, { face: -1, look: .3, hd: [-U * .02, U * .005] }],
        [2.62, {}],
        [2.72, { face: 0, look: 0, hd: [0, 0], brow: 1 }],
        [2.82, { hat: 1, hatTilt: -.25 }],
        [2.94, { hat: 0, hatTilt: 0 }],
        [3.02, { brow: 0 }],
        [3.12, { face: -1, look: .3, hd: [-U * .02, U * .005] }],
      ]);
      S.cut = document.createElementNS(NS, 'clipPath'); S.cut.id = S.id + 'Arc';
      S.cutR = document.createElementNS(NS, 'rect');
      S.cutR.setAttribute('y', -4000); S.cutR.setAttribute('height', 8000); S.cutR.setAttribute('width', 8000); S.cutR.setAttribute('x', -4000);
      S.cut.appendChild(S.cutR); S.defs.appendChild(S.cut);
      S.cardWrap.setAttribute('clip-path', `url(#${S.id}Arc)`);
      // scraps kicked up at the roller's front edge as it crushes
      S.bits = [];
      for (let i = 0; i < 8; i++) { const t0 = .2 + i * .14, xf = S.xt(t0).x + U * .3; if (xf < c.x || xf > c.x + c.w) continue; S.bits.push(...A_mkBits(S, 1, xf, c.y + c.h - U * .5, t0, 300 + i, { a0: -2.2, a1: -1.4, v: 1.0, vv: .6, r: .03 })); }
    },
    draw(S, t, p) {
      const { U, G, c, W } = S, bot = c.y + c.h;
      const x = S.xt(t).x, front = x + U * .3;
      // the card: everything the roller has passed is pressed into the floor
      const passed = S.xt(Math.min(t, 1.55)).x + U * .3, farthest = Math.max(c.x, Math.min(c.x + c.w, passed));
      S.cutR.setAttribute('x', (passed >= c.x + c.w ? c.x + c.w + 40 : farthest).toFixed(1));
      S.setCard({});
      if (farthest > c.x) {
        // first pass leaves a flat strip; the second (reversing) pass leaves it flatter still
        const thin = t >= 1.98 ? Math.max(c.x, x - U * .3) : 1e9, a0 = c.x - U * .03, a1 = farthest + U * .03;
        const strip = (l, r, h) => { if (r - l < 1) return; p.g(); p.shape([[l, bot - h], [r, bot - h], [r, bot + 1], [l, bot + 1]], { fill: '#fff', w: 1.1, amp: .3 }); p.g({ halo: false }); const n = Math.max(1, Math.round((r - l) / (U * .2))); for (let i = 0; i < n; i++) { const q = l + (r - l) * (i + .3) / n; p.line([[q, bot - h * .55], [q + U * .05, bot - h * .25]], { w: .45, amp: .1 }); } };
        strip(a0, Math.min(a1, thin), U * .06);
        strip(Math.max(a0, thin), a1, U * .018);
        if (t < 1.55 && front > c.x && front < c.x + c.w) { p.g({ halo: false }); p.shape([[front, bot], [front, c.y + 4], [front + U * .08, c.y + 4], [front + U * .08, bot]], { fill: WASH, stroke: false }); p.line([[front + U * .02, bot - U * .05], [front + U * .07, c.y + c.h * .55], [front + U * .03, c.y + c.h * .3], [front + U * .05, c.y + 4]], { w: .6, color: 'rgba(31,26,23,.5)' }); }
      }
      A_bits(p, S, S.bits, t);
      // smoke from the stack
      const moving = t < 1.55 || t >= 1.98, dir = t < 1.75 ? 1 : -1;
      for (let i = 0; i < 6; i++) {
        const t0 = Math.floor(t / .26) * .26 - i * .26; if (t0 < 0) continue;
        const k = (t - t0) / 1.3; if (k >= 1) continue;
        const xs = S.xt(t0).x;
        p.g({ halo: false, op: 1 - k }); p.circ(xs - U * .33 - dir * k * U * (moving ? .6 : .1), G - U * 1.22 - k * U * .55, U * (.06 + k * .12), { fill: '#EEEAE4', w: .6, color: 'rgba(31,26,23,.5)', n: 9 });
      }
      if (x - U * 1.6 < W && x + U * .4 > 0) {
        shadow(p, x - U * .6, G, U * .95);
        const R = A_rollerDraw(p, S, x, (x - S.xA) / (U * .36));
        // the driver
        const D = S.dt(t), st = R.seat;
        const P = Object.assign({}, D, { hip: st, fL: [st[0] + U * .3, st[1] + U * .28], fR: [st[0] + U * .36, st[1] + U * .28], hL: [R.wheel[0] - U * .04, R.wheel[1]], hR: [R.wheel[0] + U * .03, R.wheel[1] + U * .01], kb: [-1, -1] });
        if (D.hat > 0) P.hR = [st[0] + U * .08, st[1] - U * .5];
        P.hatOff = [0, -D.hat * .45];
        A_fig(p, S, P, { mustache: true }, 'pork');
        p.g(); p.line([[R.wheel[0] + U * .06, R.wheel[1] + U * .02], [R.wheel[0] + U * .14, st[1] + U * .12]], { w: .8 }); p.circ(R.wheel[0], R.wheel[1], U * .07, { sy: .4, w: .8 });
        if (t >= 1.98 && t < 3.55 && (t - 1.98) % .25 < .1) A_spray(p, [R.rear - U * .04, G - U * .9], U * .05, U * .13, Math.PI - .5, Math.PI + .5, 3, .65);
      }
    }
  };

  /* ═════════ A6. BOWLING — the slowest strike in history ═════════ */
  function A_ballDraw(p, x, y, r, a) {
    p.g(); p.circ(x, y, r, { fill: INK, n: 12 });
    [[0, -.42], [.3, -.12], [-.28, -.1]].forEach(([u, v]) => { const q = rot([x + u * r, y + v * r], [x, y], a); p.circ(q[0], q[1], r * .13, { fill: '#fff', stroke: false, n: 6, amp: .1 }); });
  }
  GAGS.A_bowl = {
    name: 'Bowling', dur: 3.95, ones: [[.82, 1.0], [2.98, 3.24]],
    cues: [[0.05, 'footsteps'], [0.94, 'ball-drop'], [1.0, 'slow-roll-loop'], [2.4, 'tik'], [2.48, 'wobble'], [3.2, 'crash'], [3.24, 'strike-bell'], [3.4, 'fist-pump']],
    setup(S) {
      const { U, G, c } = S;
      const x1 = S.x1 = c.x + c.w * .04, xr = S.xr = c.x + c.w * .22; S.x0 = -U * .6;
      S.rb = U * .1; S.bx0 = xr + U * .26; S.bx1 = c.x + c.w * .6;
      const A = (dx, dy) => [x1 + dx * U, G - dy * U], R = (dx, dy) => [xr + dx * U, G - dy * U];
      S.trk = track([
        [.42, { hip: A(0, .415), face: 1, lean: 0, look: .3, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.08, .62), hR: A(.14, .62), ball: A(.12, .66) }],
        [.56, { look: .2 }],
        [.7, { hip: A(.2, .41), fL: A(.07, 0), fR: A(.24, .03), hR: A(.2, .2), ball: A(.23, .15), hL: A(.1, .5), lean: .05 }],
        [.84, { hip: R(-.12, .38), fL: R(-.18, .04), fR: R(-.05, 0), hR: R(-.36, .62), ball: R(-.4, .66), hL: R(.05, .52), lean: .18 }, 'io'],
        [.96, { hip: R(.02, .27), fL: R(-.3, .02), fR: R(.12, 0), hR: R(.3, .14), ball: R(.32, .1), hL: R(-.32, .55), lean: .45, look: .4 }, 'out'],
        [1.08, { hR: R(.34, .62), hip: R(.03, .27) }, 'out'],
        [1.5, {}],
        [2.3, { lean: .62, hip: R(.07, .28), fL: R(-.3, .12), hR: R(.38, .72), hL: R(-.28, .64), hd: [U * .015, 0], look: .5 }, 'io'],
        [2.95, {}],
        [3.18, { look: .2 }],
        [3.28, { hip: R(.04, .415), lean: 0, fL: R(-.04, 0), fR: R(.1, 0), hR: R(.22, .8), hL: R(-.1, .44), face: 0, look: 0, hd: [0, 0] }],
        [3.36, { hR: R(.26, .9) }],
        [3.44, { hR: R(.17, .47), brow: 1, hd: [0, U * .01] }, 'in'],
        [3.6, { hd: [0, 0] }],
      ]);
      S.puffs = A_puffs(S, 5, c.x + c.w * .95, c.x + c.w * 1.25, G + 2, 3.2, { r: .14, rv: .08, dx: .2, seed: 5 });
    },
    ballX(S, t) {
      const k = seg(t, .96, 2.4);
      return lerp(S.bx0, S.bx1, 1 - Math.pow(1 - k, 2.2));
    },
    draw(S, t, p) {
      const { U, G, c } = S, r = S.rb;
      let P = S.trk(t);
      if (t < .42) { const w = walk(S, P, t, 0, .42, S.x0, S.x1, { carry: true }); Object.assign(P, { hip: w.hip, fL: w.fL, fR: w.fR, lean: w.lean }); P.hL = [P.hip[0] + U * .08, G - U * .62]; P.hR = [P.hip[0] + U * .14, G - U * .62]; P.ball = [P.hip[0] + U * .12, G - U * .66]; }
      // the card: a tap, a wobble that grows, and over it goes
      let ang = 0;
      if (t >= 2.42) {
        const wob = track([[2.42, { a: 0 }], [2.54, { a: 1.6 }], [2.68, { a: -2.3 }], [2.84, { a: 3.6 }], [2.94, { a: 2.4 }], [3.2, { a: 90 }, 'in']]);
        ang = wob(t).a;
      }
      if (t >= 3.22) S.setCard({ hide: true });
      else S.setCard({ rot: ang, px: ang >= 0 ? c.w : 0, py: c.h });
      shadow(p, P.hip[0], G, U * .2);
      // the ball
      let bx, by, ba;
      if (t < .96) { bx = P.ball[0]; by = P.ball[1]; ba = 0; }
      else { bx = this.ballX(S, t); by = G - r; ba = (bx - S.bx0) / r; }
      p.g({ halo: false }); p.circ(bx, G + 1, r * 1.1, { sy: .15, fill: WASH, stroke: false });
      A_ballDraw(p, bx, by, r, ba);
      if (t >= .96 && t < 1.3) A_speed(p, [[[bx - r * 1.4, by - r * .3], [bx - r * 3, by - r * .3]], [[bx - r * 1.4, by + r * .3], [bx - r * 2.6, by + r * .3]]], .4 * (1 - seg(t, .96, 1.3)));
      if (t >= 2.4 && t < 2.5) A_spray(p, [bx + r * 1.1, by - r * .3], U * .03, U * .08, -1.0, .4, 3, .55);
      A_fig(p, S, P, {}, 'mop');
      if (t < .96) A_ballDraw(p, P.ball[0], P.ball[1], r, 0);
      if (t >= 3.2) A_dust(p, S.puffs, t, 1 - seg(t, 3.45, 3.8));
      if (t >= 3.18 && t < 3.3) A_spray(p, [c.x + c.w + U * .08, G - U * .1], U * .05, U * .15, -2.0, -.6, 3, .7);
    }
  };

  /* ═════════ A7. THE SPRING — a crank, a boxing glove, and one peek too many ═════════ */
  function A_gloveDraw(p, U, x, y, a, s) {   // boxing glove, fist at (x,y), pointing along angle a
    const T = pts => pts.map(([u, v]) => rot([x + u * U * s, y + v * U * s], [x, y], a));
    p.g();
    p.shape(T([[-.2, -.06], [-.12, -.07], [-.12, .07], [-.2, .06]]), { fill: '#fff', w: .8 });
    p.shape(T([[-.12, -.1], [.0, -.14], [.1, -.12], [.15, -.04], [.14, .06], [.06, .12], [-.06, .12], [-.12, .1]]), { fill: '#fff' });
    p.shape(T([[-.06, .11], [-.02, .17], [.06, .17], [.08, .11]]), { fill: '#fff', w: .8 });
    p.line(T([[.0, -.13], [.03, -.02], [.0, .1]]), { w: .5, halo: false });
    p.shape(T([[-.12, -.04], [.12, -.06], [.14, .05], [.0, .11], [-.12, .09]]), { fill: WASH, stroke: false, halo: false });
  }
  function A_springDraw(p, a, b, n, w) {
    const d = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(d[0], d[1]) || 1, nn = [-d[1] / L, d[0] / L], pts = [a];
    for (let i = 1; i < n * 2; i++) { const u = i / (n * 2), s = (i % 2 ? 1 : -1) * w; pts.push([a[0] + d[0] * u + nn[0] * s, a[1] + d[1] * u + nn[1] * s]); }
    pts.push(b); p.g(); p.line(pts, { w: .75, amp: .15 });
  }
  function A_boxDraw(p, U, x, G, lid, crank) {   // crate on the floor, centred at x; lid angle (0 shut); crank angle
    const s = U * .34, l = x - s / 2, r = x + s / 2, top = G - s;
    p.g();
    p.shape([[l, G], [r, G], [r, top], [l, top]], { fill: '#fff' });
    p.line([[l + 2, top + s * .33], [r - 2, top + s * .33]], { w: .5, halo: false }); p.line([[l + 2, top + s * .66], [r - 2, top + s * .66]], { w: .5, halo: false });
    p.shape([[l + 2, top + s * .7], [r - 2, top + s * .7], [r - 2, G - 2], [l + 2, G - 2]], { fill: WASH, stroke: false, halo: false });
    const hc = [l - U * .02, top + s * .45];
    p.line([[hc[0], hc[1]], [hc[0] + Math.cos(crank) * U * .09, hc[1] + Math.sin(crank) * U * .09]], { w: .9 });
    p.line([[hc[0] + Math.cos(crank) * U * .09, hc[1] + Math.sin(crank) * U * .09], [hc[0] + Math.cos(crank) * U * .09 - U * .05, hc[1] + Math.sin(crank) * U * .09]], { w: 1.3 });
    p.dot(hc[0], hc[1], U * .015);
    const hinge = [l, top], e = rot([r + U * .01, top], hinge, -lid);
    p.line([hinge, e], { w: 1.4 });
    return { top: [x, top], crank: [hc[0] + Math.cos(crank) * U * .09 - U * .05, hc[1] + Math.sin(crank) * U * .09] };
  }
  GAGS.A_glove = {
    name: 'The Spring', dur: 3.95, ones: [[1.38, 1.6], [2.94, 3.1]],
    cues: [[0.05, 'footsteps'], [0.56, 'box-set'], [0.66, 'crank-tune'], [1.4, 'pop'], [1.46, 'punch'], [1.5, 'boing-loop'], [2.3, 'lid-clack'], [2.96, 'pop'], [3.0, 'bop'], [3.02, 'boing'], [3.44, 'hat-land']],
    setup(S) {
      const { U, G, c } = S;
      const xm = S.xm = c.x + c.w * .1; S.x0 = -U * .6; S.xb = xm + U * .42;
      const A = (dx, dy) => [xm + dx * U, G - dy * U], X = (dx, dy) => [S.xb + dx * U, G - dy * U];
      S.tgt = [c.x + c.w * .62, c.y + c.h * .46];
      S.trk = track([
        [.46, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.22, .5), hR: A(.36, .5), box: A(.29, .5), hat: 0, tilt: 0 }],
        [.6, { hip: A(-.03, .3), lean: .32, hL: A(.25, .2), hR: A(.33, .2), box: [S.xb, G - U * .17], fL: A(-.1, 0), fR: A(.08, 0) }],
        [.66, { hip: A(-.05, .3), lean: .18, hL: A(.08, .3), look: .3 }],
        [.94, { face: .3, look: 0 }],
        [1.12, {}],
        [1.24, { face: 1, look: .3 }],
        [1.4, {}],
        [1.48, { hip: A(-.1, .38), lean: -.1, look: -.2, hL: A(-.05, .44) }, 'out'],
        [2.36, {}],
        [2.48, { hip: A(0, .415), lean: 0, fL: A(-.07, 0), fR: A(.07, 0), face: 0, look: 0, hL: A(-.1, .44), hR: A(.1, .44), brow: 1 }],
        [2.6, { brow: 0 }],
        [2.66, { face: 1 }],
        [2.88, { hip: X(-.28, .38), fL: X(-.38, 0), fR: X(-.2, 0), lean: .95, look: 1, hL: X(-.16, .38), hR: X(-.08, .37), hd: [U * .02, U * .02] }],
        [2.98, {}],
        [3.06, { hip: X(-.36, .42), lean: -.2, look: -.9, face: .4, fL: X(-.46, 0), fR: X(-.3, 0), hL: X(-.5, .5), hR: X(-.22, .55), hd: [-U * .02, -U * .02] }, 'out'],
        [3.2, {}],
        [3.34, { lean: 0, look: 0, face: 0, hd: [0, 0], hL: X(-.45, .44), hR: X(-.27, .44), brow: 1 }],
      ]);
      S.bits = A_mkBits(S, 5, S.tgt[0], S.tgt[1], 1.47, 61, { a0: -1.2, a1: .6, v: 1.6 });
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      let P = S.trk(t);
      if (t < .46) { const w = walk(S, P, t, 0, .46, S.x0, S.xm, { carry: true }); Object.assign(P, { hip: w.hip, fL: w.fL, fR: w.fR, lean: w.lean }); P.hL = [P.hip[0] + U * .22, G - U * .5]; P.hR = [P.hip[0] + U * .36, G - U * .5]; P.box = [P.hip[0] + U * .29, G - U * .5]; }
      // the crank turns
      const cranking = t >= .66 && t < 1.38, ca = cranking ? (t - .66) * Math.PI * 2 * 2.1 : 0;
      // the card: punched clean off the screen
      if (t >= 1.46) { const k = seg(t, 1.46, 1.9); S.setCard({ tx: E.out(k) * U * 2.6, ty: -E.out(k) * U * 1.5 + k * k * U * .3, rot: 260 * E.out(k), sx: 1 - k * .5, sy: 1 - k * .5, hide: k >= 1 }); }
      else S.setCard({});
      shadow(p, P.hip[0], G, U * .2);
      // the box
      const onFloor = t >= .6, bx = onFloor ? S.xb : P.box[0], G2 = onFloor ? G : P.box[1] + U * .17;
      const lid = t >= 1.38 && t < 2.3 ? Math.min(1.9, seg(t, 1.38, 1.42) * 1.9) : t >= 2.94 ? Math.min(1.9, seg(t, 2.94, 2.97) * 1.9) : 0;
      if (onFloor) shadow(p, bx, G, U * .2);
      const Bx = A_boxDraw(p, U, bx, G2, lid, ca);
      if (cranking) { P.hR = Bx.crank; }
      // the spring and glove
      const top = Bx.top;
      let tip = null, ga = 0;
      if (t >= 1.38 && t < 2.36) {
        const d = [S.tgt[0] - top[0], S.tgt[1] - top[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], nn = [-u[1], u[0]];
        let ext;
        if (t < 1.46) ext = E.out(seg(t, 1.4, 1.46)) * 1.06;
        else if (t < 2.16) { const w = t - 1.46; ext = 1 + Math.sin(w * 22) * .14 * Math.exp(-w * 3.5); }
        else ext = 1 - E.in(seg(t, 2.16, 2.3));
        const sw = t >= 1.46 && t < 2.16 ? Math.sin((t - 1.46) * 15) * U * .22 * Math.exp(-(t - 1.46) * 3) : 0;
        tip = [top[0] + d[0] * ext + nn[0] * sw, top[1] + d[1] * ext + nn[1] * sw];
        ga = Math.atan2(tip[1] - top[1], tip[0] - top[0]);
      } else if (t >= 2.95) {
        const H = S.trk(2.95), aim = [S.xb, G - U * .86];
        let ext; if (t < 3.0) ext = E.out(seg(t, 2.95, 3.0)); else { const w = t - 3.0; ext = 1 + Math.sin(w * 20) * .12 * Math.exp(-w * 3.5); }
        const sw = t >= 3.0 ? Math.sin((t - 3.0) * 13) * U * .18 * Math.exp(-(t - 3.0) * 2.6) : 0;
        tip = [top[0] + sw, top[1] + (aim[1] - top[1]) * ext];
        ga = Math.atan2(tip[1] - top[1], tip[0] - top[0]);
      }
      if (tip) {
        const L = Math.hypot(tip[0] - top[0], tip[1] - top[1]);
        if (L > U * .05) A_springDraw(p, top, [tip[0] - Math.cos(ga) * U * .18, tip[1] - Math.sin(ga) * U * .18], Math.max(3, Math.round(L / (U * .09))), U * .045);
        A_gloveDraw(p, U, tip[0], tip[1], ga, 1);
        if (t >= 1.46 && t < 1.56) burst(p, [tip[0] + Math.cos(ga) * U * .12, tip[1] + Math.sin(ga) * U * .12], U * .1, U * .22, 8, .3, .8);
      }
      // him; his cap pops off and comes back down askew
      let hatOff = [0, 0], hatTilt = 0;
      if (t >= 3.0) { const k = seg(t, 3.0, 3.44); hatOff = [Math.sin(k * Math.PI) * -.6, -Math.sin(k * Math.PI) * 2.6]; hatTilt = k < 1 ? -k * Math.PI * 2 : .3; }
      P.armsFront = t >= 1.38 && t < 2.4 || t >= 2.82;
      const J = figure(p, S, P, { glasses: true });
      const hcx = [J.hc[0] + hatOff[0] * J.hr, J.hc[1] + hatOff[1] * J.hr];
      hatDraw(p, Object.assign({}, P, { tilt: (P.tilt || 0) + hatTilt }), hcx, J.hr, { hat: 'cap' });
      if (t >= 3.0 && t < 3.1) burst(p, [J.hc[0] + J.hr * .4, J.hc[1] + J.hr * .4], J.hr * 1.4, J.hr * 2.2, 7, .2, .7);
      if (t >= 3.1 && t < 3.6) { const k = t - 3.1; for (let i = 0; i < 3; i++) { const a = k * 7 + i * 2.1; star(p, [J.hc[0] + Math.cos(a) * J.hr * 1.5, J.hc[1] - J.hr * 1.3 + Math.sin(a) * J.hr * .4], J.hr * .32, 5, i + 1); } }
    }
  };

  /* ═════════ A8. THE WRECKING BALL — smashes it, then comes back for the man admiring the mess ═════════ */
  GAGS.A_wreck = {
    name: 'The Wrecking Ball', dur: 3.9, ones: [[.84, 1.16], [2.4, 2.78]],
    cues: [[0.05, 'footsteps'], [0.62, 'hmm'], [0.78, 'chain-whoosh'], [1.0, 'smash'], [1.04, 'shards-tinkle'], [1.6, 'shards-settle'], [2.3, 'chain-whoosh'], [2.55, 'wham'], [2.62, 'whistle-away'], [3.24, 'hat-land']],
    setup(S) {
      const { U, G, c, W } = S;
      const xm = S.xm = c.x + c.w * .8; S.x0 = W + U * .5;
      const A = (dx, dy) => [xm + dx * U, G - dy * U];
      S.rB = U * .3;
      S.piv = [xm - U * .1, G - U * .5 - U * 3.5]; S.Lc = U * 3.5;
      S.th = x => Math.asin(clamp((x - S.piv[0]) / S.Lc, -1, 1));
      S.ix = c.x + c.w * .28;
      const thI = S.th(S.ix), thO = S.th(-U * 1.0);
      S.bt = track([[0, { a: thO }], [.78, { a: thO }], [1.0, { a: thI }, 'in'], [1.5, { a: thO - .05 }, 'out'], [2.25, { a: thO - .05 }], [2.55, { a: S.th(xm - U * .08) }, 'in'], [2.75, { a: S.th(W + U * 1.4) }, 'out']]);
      S.trk = track([
        [.55, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.07, .45), hR: A(.11, .46) }],
        [.68, { hL: A(-.05, .8), look: -.3 }],
        [1.0, {}],
        [1.08, { look: .2, brow: 1 }],
        [1.7, { look: .7 }],
        [1.92, { hL: A(.07, .45), lean: -.65, hip: A(.08, .41), look: .9, hd: [-U * .02, U * .03], fL: A(-.05, 0), fR: A(.1, 0), brow: 0 }],
        [2.2, {}],
        [2.3, { look: 1 }],
      ]);
      const bot = c.y + c.h;
      S.lay = A_layer(S, 'mid');
      S.sh = A_shards(S, A_grid(S, 3, 3, .55, 7), S.lay, 'wr');
      S.sh.forEach((q, i) => {
        const cx = c.x + q.cx, cy = c.y + q.cy;
        q.x0 = cx; q.y0 = cy;
        const away = (cx - S.ix) / (c.w * .7);
        q.vx = U * (.3 + away * 1.0 + (rnd(S.seed + 40, i) - .5) * .6); q.vy = -U * (.4 + rnd(S.seed + 41, i) * .8) * (1 - Math.min(1, Math.abs(away)) * .5);
        q.spin = (rnd(S.seed + 42, i) - .5) * 500;
        q.rot1 = (rnd(S.seed + 43, i) - .5) * 70;
        q.t0 = 1.0 + Math.abs(cx - S.ix) / c.w * .06;
      });
      // land as a heap: later (higher) pieces stack on earlier ones
      S.sh.forEach(q => { const g = U * 9; const H = (G - U * .02) - q.y0; q.tl = q.t0 + (q.vy + Math.sqrt(q.vy * q.vy + 2 * g * Math.max(1, H))) / g; q.xl = clamp(q.x0 + q.vx * (q.tl - q.t0), c.x - U * .1, xm - U * .32); });
      S.sh.slice().sort((a, b) => a.tl - b.tl).forEach((q, i) => { q.yl = G - U * .02 - q.h * .35 - i * U * .025; });
      S.puffs = A_puffs(S, 7, c.x + c.w * .05, xm - U * .3, G + 2, 1.2, { r: .1, rv: .07, dx: .15, seed: 13, rise: .03, life: .55, spread: .35 });
    },
    draw(S, t, p) {
      const { U, G, c, W } = S;
      let P = S.trk(t);
      if (t < .55) { P = walk(S, P, t, 0, .55, S.x0, S.xm, { carry: true }); P.hL = [P.hip[0] + U * .07, G - U * .45]; P.hR = [P.hip[0] + U * .11, G - U * .46]; }
      P.armsFront = false;
      // the card, then the pieces
      if (t < 1.0) { S.setCard({}); S.sh.forEach(q => A_place(q, 0, 0, 0, 1, 1, 0)); }
      else {
        S.setCard({ hide: true });
        const g = U * 9;
        S.sh.forEach(q => {
          if (t < q.tl) { const d = Math.max(0, t - q.t0); A_place(q, q.x0 + q.vx * d, q.y0 + q.vy * d + g * d * d / 2, q.spin * d, 1, 1, 1); }
          else { const k = seg(t, q.tl, q.tl + .12), b = Math.sin(k * Math.PI) * U * .03; A_place(q, q.xl, q.yl - b, lerp(q.spin * (q.tl - q.t0), q.rot1, E.out(k)), 1, lerp(1, .42, E.out(k)), 1); }
        });
      }
      // the ball and chain
      const th = S.bt(t).a, bc = [S.piv[0] + Math.sin(th) * S.Lc, S.piv[1] + Math.cos(th) * S.Lc];
      shadow(p, P.hip[0], G, U * .2);
      if (bc[0] > -U && bc[0] < W + U) { p.g({ halo: false, op: .8 }); p.circ(bc[0], G + 1, S.rB * .9, { sy: .14, fill: WASH, stroke: false }); }
      // him: in flight after the second swing
      const hit = 2.55;
      if (t < hit) A_fig(p, S, P, {}, 'bowler');
      else if (t < 2.8) {
        const k = seg(t, hit, 2.8), Q = Object.assign({}, S.trk(hit), { lean: 0, hd: [0, 0], blink: 1, noHat: true, hL: null, hR: null, fL: null, fR: null });
        const hip0 = S.trk(hit).hip, h = [hip0[0] + E.out(k) * U * 3.2, hip0[1] - Math.sin(k * Math.PI) * U * .6];
        Q.hip = h; Q.fL = [h[0] - U * .2, h[1] + U * .3]; Q.fR = [h[0] - U * .12, h[1] + U * .38]; Q.hL = [h[0] - U * .3, h[1] - U * .25]; Q.hR = [h[0] - U * .25, h[1] - U * .4];
        A_figXf(p, S, Q, {}, null, `rotate(${(k * 300).toFixed(1)} ${h[0].toFixed(1)} ${(h[1] - U * .2).toFixed(1)})`);
        A_speed(p, [[[h[0] - U * .55, h[1] - U * .3], [h[0] - U * 1.1, h[1] - U * .3]], [[h[0] - U * .6, h[1]], [h[0] - U * 1.2, h[1]]]], .5);
      }
      // his hat, left behind
      if (t >= hit) {
        const J0 = S.hatAt || (S.hatAt = (() => { const q = A_pen(p); const Q = S.trk(hit); const J = figure(q, S, Q, {}); return { hc: J.hc, hr: J.hr, tilt: Q.tilt || 0, s: sgnOf(Q.face) }; })());
        let y = J0.hc[1], x = J0.hc[0], tl = 0;
        if (t >= 3.0) { const k = seg(t, 3.0, 3.24); y = lerp(J0.hc[1], G - J0.hr * .25, E.in(k)); tl = k * .5; if (t >= 3.24) { const b = seg(t, 3.24, 3.36); y -= Math.sin(b * Math.PI) * U * .04; tl = .5 - b * .5; } }
        A_hat(p, 'bowler', [x, y], J0.hr, tl, J0.s);
      }
      p.g();
      const top = Math.max(-20, S.piv[1]), u = [Math.sin(th), Math.cos(th)], startL = (top - S.piv[1]) / u[1];
      for (let L = Math.max(0, startL); L < S.Lc - S.rB * .9; L += U * .085) { const q = [S.piv[0] + u[0] * L, S.piv[1] + u[1] * L]; p.circ(q[0], q[1], U * .03, { sx: Math.abs(Math.round(L / (U * .085))) % 2 ? .45 : 1, sy: Math.abs(Math.round(L / (U * .085))) % 2 ? 1 : .55, w: .75, n: 6, amp: .15 }); }
      p.circ(bc[0], bc[1], S.rB, { fill: INK, n: 14 });
      p.line([[bc[0] - S.rB * .5, bc[1] - S.rB * .45], [bc[0] - S.rB * .2, bc[1] - S.rB * .68]], { w: .9, color: '#fff', halo: false, amp: .1 });
      if (t >= 1.0 && t < 1.12) burst(p, [S.ix - S.rB * .2, bc[1]], S.rB * 1.15, S.rB * 1.7, 9, .3, .9);
      if (t >= hit && t < hit + .1) burst(p, [S.trk(hit).hip[0], S.trk(hit).hip[1] - U * .2], U * .3, U * .5, 8, .1, .9);
      if (t >= .8 && t < 1.0) A_speed(p, [-.4, 0, .4].map(o => [[bc[0] - u[1] * S.rB * 1.4, bc[1] + o * S.rB + u[0] * S.rB], [bc[0] - u[1] * S.rB * 2.6, bc[1] + o * S.rB + u[0] * S.rB * .5]]));
      if (t >= 2.35 && t < 2.55) A_speed(p, [-.4, 0, .4].map(o => [[bc[0] - S.rB * 1.3, bc[1] + o * S.rB], [bc[0] - S.rB * 2.6, bc[1] + o * S.rB]]));
      if (t >= 1.2) A_dust(p, S.puffs, t, 1 - seg(t, 1.7, 2.0));
    }
  };

  /* ═════════ A9. THE WRONG LEVER — two levers, one guess ═════════ */
  GAGS.A_trap = {
    name: 'The Wrong Lever', dur: 3.95, ones: [[1.46, 1.62], [2.6, 2.86]],
    cues: [[0.05, 'footsteps'], [0.6, 'hand-rub'], [0.98, 'lever-clunk'], [1.0, 'trapdoor-drop'], [1.5, 'whistle-down'], [1.86, 'distant-thud'], [2.0, 'hat-land'], [2.62, 'lever-clunk'], [2.66, 'trapdoor-drop'], [2.7, 'whoosh-down'], [3.2, 'hat-grab'], [3.34, 'trapdoor-shut']],
    setup(S) {
      const { U, G, c } = S;
      const xs = S.xs = c.x + c.w * .3; S.x0 = -U * .6; S.xl = xs + U * .44;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.trk = track([
        [.5, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .44), hR: A(.1, .44) }],
        [.56, { look: -.6, face: .6 }],
        [.62, { hL: A(.02, .6), hR: A(.1, .6), look: 0, face: 1 }],
        [.68, { hL: A(.06, .62), hR: A(.06, .58) }],
        [.74, { hL: A(.02, .6), hR: A(.1, .62) }],
        [.8, { hL: A(.06, .62), hR: A(.06, .58) }],
        [.88, { hR: A(.33, .44), hL: A(-.1, .44), lean: .12 }],
        [.98, { hR: A(.2, .42), lean: -.05 }, 'out'],
        [1.04, { look: 1, hR: A(.12, .44), lean: 0 }],
        [1.2, {}],
        [1.28, { face: 0, look: 0, brow: 1 }],
        [1.46, {}],
      ]);
      S.lev = track([[.88, { a: .5, b: .5 }], [.98, { a: -.55 }, 'out'], [2.5, {}], [2.62, { b: -.55 }, 'out']]);
      S.clip = A_above(S, G + 1, 'f');
      S.cardWrap.setAttribute('clip-path', `url(#${S.id}Atc)`);
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}Atc"><rect x="-2000" y="-2000" width="${S.W + 4000}" height="${c.y + c.h + 9 + 2000}"/></clipPath>`);
      S.puffs = A_puffs(S, 7, c.x, c.x + c.w, G + 2, 2.7, { r: .1, rv: .06, dx: .15, seed: 31, rise: .05, life: .5 });
    },
    draw(S, t, p) {
      const { U, G, c } = S, xs = S.xs;
      let P = S.trk(t);
      if (t < .5) P = walk(S, P, t, 0, .5, S.x0, xs);
      // the card goes when the right lever goes
      if (t >= 2.64) { const k = seg(t, 2.64, 2.84); S.setCard({ ty: E.in(k) * (c.h + 20), hide: k >= 1 }); } else S.setCard({});
      // his trapdoor
      const open = t >= .98 && t < 3.34 ? E.out(seg(t, .98, 1.03)) : t >= 3.34 ? 1 - E.in(seg(t, 3.34, 3.4)) : 0;
      if (open > 0) {
        p.g(); p.circ(xs, G + U * .035, U * .36 * open, { sy: .26, fill: INK, w: .9, n: 16 });
        p.g({ halo: false }); p.circ(xs, G + U * .05, U * .3 * open, { sy: .18, fill: 'none', w: .5, color: 'rgba(255,255,255,.35)', n: 14 });
      }
      if (t >= 2.64 && t < 2.9) { p.g({ halo: false }); p.circ(c.x + c.w / 2, G + 1, c.w * .52 * (1 - seg(t, 2.84, 2.9)), { sy: .05, fill: INK, stroke: false, n: 16 }); }
      // the lever stand
      const L = S.lev(t), lx = S.xl;
      p.g();
      [['a', -U * .045], ['b', U * .045]].forEach(([k, dx]) => { const pv = [lx + dx, G - U * .17], e = [pv[0] + Math.sin(L[k]) * U * .3, pv[1] - Math.cos(L[k]) * U * .3]; p.line([pv, e], { w: .9 }); p.circ(e[0], e[1], U * .032, { fill: k === 'a' ? INK : '#fff', w: .8, n: 7 }); });
      p.shape([[lx - U * .12, G], [lx + U * .12, G], [lx + U * .12, G - U * .18], [lx - U * .12, G - U * .18]], { fill: '#fff' });
      p.shape([[lx - U * .1, G - U * .08], [lx + U * .1, G - U * .08], [lx + U * .1, G - 2], [lx - U * .1, G - 2]], { fill: WASH, stroke: false, halo: false });
      if (t >= .98 && t < 1.06) A_spray(p, [lx - U * .2, G - U * .45], U * .03, U * .09, -2.6, -1.4, 3, .6);
      // him: stands on nothing, looks at us, and goes
      const q = A_pen(p);
      const drop = t >= 1.46 ? E.in(seg(t, 1.46, 1.62)) * U * 1.6 : 0;
      if (t < 1.62) {
        const Q = Object.assign({}, P);
        ['hip', 'fL', 'fR', 'hL', 'hR'].forEach(k => { Q[k] = [P[k][0], P[k][1] + drop]; });
        if (t >= 1.46) { Q.hL = [Q.hip[0] - U * .2, Q.hip[1] - U * .55]; Q.hR = [Q.hip[0] + U * .2, Q.hip[1] - U * .55]; }
        shadow(p, P.hip[0], G, U * .2 * (1 - open));
        A_fig(q, S, Object.assign(Q, { noHat: true }), { glasses: true });
        A_clipped(p, q, S.clip);
      }
      // his hat stays a beat, drops, misses the hole
      const H0 = S.H0 || (S.H0 = (() => { const z = A_pen(p), J = figure(z, S, S.trk(1.3), {}); return J; })());
      let hx = H0.hc[0], hy = H0.hc[1], ht = 0;
      if (t < 1.46) { const J = figure(A_pen(p), S, P, {}); hx = J.hc[0]; hy = J.hc[1]; }
      else if (t < 1.78) { hy = H0.hc[1] + (t >= 1.62 ? 0 : 0); }
      else if (t < 2.0) { const k = seg(t, 1.78, 2.0); hy = lerp(H0.hc[1], G - H0.hr * .45, E.in(k)); hx = H0.hc[0] + E.out(k) * U * .36; ht = k * .3; }
      else if (t < 3.08) { hy = G - H0.hr * .45 - (t < 2.12 ? Math.sin(seg(t, 2.0, 2.12) * Math.PI) * U * .04 : 0); hx = H0.hc[0] + U * .36; ht = .3 + (t < 2.2 ? Math.sin(seg(t, 2.0, 2.2) * Math.PI * 2) * .15 : 0); }
      else { const k = seg(t, 3.08, 3.26); hx = lerp(H0.hc[0] + U * .36, xs, E.io(k)); hy = G - H0.hr * .45 + E.in(seg(t, 3.16, 3.3)) * U * .5; ht = .3; }
      if (t < 3.3) { const z = A_pen(p); A_hat(z, 'pork', [hx, hy], H0.hr, ht, t < 1.46 ? sgnOf(P.face) : 0); A_clipped(p, z, S.clip); }
      // a hand comes up, finds the other lever, then finds the hat
      if (t >= 2.24 && t < 3.34) {
        const z = A_pen(p), lv = [lx + U * .045 + Math.sin(L.b) * U * .3, G - U * .17 - Math.cos(L.b) * U * .3];
        const hp = track([[2.24, { h: [xs, G + U * .2] }], [2.36, { h: [xs + U * .04, G - U * .3] }, 'out'], [2.42, { h: [xs + U * .1, G - U * .34] }], [2.48, { h: [xs + U * .02, G - U * .36] }], [2.58, { h: [lx + U * .045 + Math.sin(.5) * U * .3, G - U * .17 - Math.cos(.5) * U * .3] }], [2.62, { h: lv }], [2.8, {}], [2.94, { h: [xs + U * .1, G - U * .3] }], [3.08, { h: [xs + U * .36, G - U * .06] }], [3.26, { h: [xs, G - U * .02] }], [3.34, { h: [xs, G + U * .4] }, 'in']])(t).h;
        const base = [xs, G + U * .35], el = [lerp(base[0], hp[0], .5) - U * .08, lerp(base[1], hp[1], .5)];
        z.g(); z.line([base, el, hp], { w: 1 }); z.circ(hp[0], hp[1], U * .03, { fill: '#fff', w: .8, n: 7 });
        z.line([[hp[0], hp[1] - U * .02], [hp[0] + U * .01, hp[1] - U * .06]], { w: .7 });
        A_clipped(p, z, S.clip);
        if (t < 2.62 && t >= 2.36) { const L2 = S.lev(2.62); }
      }
      if (t >= 2.7) A_dust(p, S.puffs, t, 1 - seg(t, 3.0, 3.3));
      if (t >= 3.34 && t < 3.44) A_spray(p, [xs, G - U * .02], U * .05, U * .14, -2.7, -.45, 4, .6);
    }
  };

  /* ═════════ A10. THE SUMO — two stomps, one sit, and it leaves with him ═════════ */
  function A_limb(p, pts, w) { p.line(pts, { w: w + 1.3 }); p.line(pts, { w: w - .2, color: '#fff', halo: false }); }
  function A_sumoDraw(p, S, o) {   // o: x, base (y of the belly bottom), fL, fR, hL, hR, face, look, blink, lean, closed
    const U = S.U, Rb = U * .36, bc = [o.x + Math.sin(o.lean || 0) * Rb * .3, o.base - Rb], lean = o.lean || 0;
    const hipL = [bc[0] - Rb * .45, bc[1] + Rb * .7], hipR = [bc[0] + Rb * .45, bc[1] + Rb * .7];
    p.g();
    [[hipL, o.fL, 1], [hipR, o.fR, -1]].forEach(([hp, ft, s]) => { const kn = ik(hp, ft, U * .2, U * .2, s)[0]; A_limb(p, [hp, kn, ft], 2.4); p.line([ft, [ft[0] + (ft[0] < bc[0] ? -1 : 1) * U * .07, ft[1]]], { w: 2.2 }); });
    const shL = [bc[0] - Rb * .78, bc[1] - Rb * .45], shR = [bc[0] + Rb * .78, bc[1] - Rb * .45];
    [[shL, o.hL, 1], [shR, o.hR, -1]].forEach(([sh, h, s]) => { const el = ik(sh, h, U * .17, U * .17, s)[0]; A_limb(p, [sh, el, h], 2.0); p.circ(h[0], h[1], U * .035, { fill: '#fff', w: .8, n: 7 }); });
    p.circ(bc[0], bc[1], Rb, { fill: '#fff', n: 16 });
    p.line([[bc[0] - Rb * .2, bc[1] + Rb * .05], [bc[0], bc[1] + Rb * .12], [bc[0] + Rb * .2, bc[1] + Rb * .05]], { w: .5, halo: false, amp: .1 });
    const chord = yy => Math.sqrt(Math.max(0, Rb * Rb - (yy - bc[1]) * (yy - bc[1])));
    const y1 = bc[1] + Rb * .45, y2 = bc[1] + Rb * .82, x1 = chord(y1), x2 = chord(y2);
    p.shape([[bc[0] - x1, y1], [bc[0], y1 + Rb * .1], [bc[0] + x1, y1], [bc[0] + x2, y2], [bc[0], y2 + Rb * .08], [bc[0] - x2, y2]], { fill: INK, w: .8 });
    for (let i = -2; i <= 2; i++) p.line([[bc[0] + i * Rb * .1, y2 + Rb * .1], [bc[0] + i * Rb * .1 + (o.sway || 0) * U * .02, y2 + Rb * .38]], { w: .6 });
    const hr = U * .1, hc = [bc[0] + Math.sin(lean) * Rb * .2, bc[1] - Rb - hr * .55];
    p.circ(hc[0], hc[1], hr, { fill: '#fff' });
    p.shape([[hc[0] - hr * 1.0, hc[1] - hr * .1], [hc[0] - hr * .9, hc[1] - hr * .7], [hc[0] - hr * .4, hc[1] - hr * 1.02], [hc[0] + hr * .4, hc[1] - hr * 1.02], [hc[0] + hr * .9, hc[1] - hr * .7], [hc[0] + hr * 1.0, hc[1] - hr * .1], [hc[0] + hr * .7, hc[1] - hr * .5], [hc[0] - hr * .7, hc[1] - hr * .5]], { fill: INK, w: .8 });
    p.circ(hc[0] + (o.face || 0) * -hr * .2, hc[1] - hr * 1.15, hr * .3, { sx: 1.3, fill: INK, n: 8 });
    const f = o.face || 0, ey = hc[1] + hr * .02 + (o.look || 0) * hr * .2, ex = hc[0] + f * hr * .45, sp = hr * .32 * (1 - Math.abs(f) * .5);
    const xs = Math.abs(f) > .88 ? [ex + f * hr * .06] : [ex - sp, ex + sp];
    xs.forEach(x => (o.blink || o.closed) ? p.line([[x - hr * .14, ey + (o.closed ? hr * .03 : 0)], [x, ey + (o.closed ? hr * .08 : 0)], [x + hr * .14, ey + (o.closed ? hr * .03 : 0)]], { w: .7, amp: .1, halo: false }) : p.dot(x, ey, Math.max(1.15, hr * .088)));
    return { bc, Rb, hc };
  }
  GAGS.A_sumo = {
    name: 'The Sumo', dur: 4.0, ones: [[.96, 1.06], [1.36, 1.46], [1.5, 1.96]],
    cues: [[0.05, 'heavy-footsteps'], [1.0, 'stomp'], [1.4, 'stomp'], [1.52, 'whoosh-up'], [1.74, 'crunch'], [1.86, 'thump'], [2.3, 'contented-sigh'], [2.66, 'peel'], [2.86, 'heavy-footsteps']],
    setup(S) {
      const { U, G, c, W } = S;
      const xc = S.xc = c.x + c.w * .52; S.x0 = W + U * .6;
      S.k = track([
        [.62, { x: xc, base: G - U * .3, fL: [xc - U * .22, G], fR: [xc + U * .22, G], hL: [xc - U * .34, G - U * .5], hR: [xc + U * .34, G - U * .5], lean: 0, face: -1, look: 0 }],
        [.7, { face: 0, fL: [xc - U * .3, G], fR: [xc + U * .3, G], base: G - U * .26 }],
        [.86, { x: xc - U * .1, lean: -.25, fR: [xc + U * .5, G - U * .5], hL: [xc - U * .42, G - U * .42], hR: [xc + U * .1, G - U * .38], look: -.4 }, 'out'],
        [.92, {}],
        [1.0, { x: xc, lean: 0, fR: [xc + U * .3, G], base: G - U * .22, hR: [xc + U * .3, G - U * .38], hL: [xc - U * .3, G - U * .38], look: .2 }, 'in'],
        [1.08, { base: G - U * .26 }],
        [1.24, { x: xc + U * .1, lean: .25, fL: [xc - U * .5, G - U * .5], hR: [xc + U * .42, G - U * .42], hL: [xc - U * .1, G - U * .38], look: -.4 }, 'out'],
        [1.32, {}],
        [1.4, { x: xc, lean: 0, fL: [xc - U * .3, G], base: G - U * .2, hR: [xc + U * .3, G - U * .38], hL: [xc - U * .3, G - U * .38], look: .3 }, 'in'],
        [1.5, { base: G - U * .14, fL: [xc - U * .32, G], fR: [xc + U * .32, G] }],
      ]);
    },
    draw(S, t, p) {
      const { U, G, c } = S, bot = c.y + c.h;
      let o;
      if (t < .62) {
        const k = seg(t, 0, .62), x = lerp(S.x0, S.xc, k), ph = (S.x0 - x) / (U * .32);
        const lift = i => Math.max(0, Math.sin(ph * Math.PI + i * Math.PI)) * U * .05;
        o = { x, base: G - U * .3 - Math.abs(Math.sin(ph * Math.PI)) * U * .02, fL: [x - U * .18 + Math.sin(ph * Math.PI) * U * .06, G - lift(0)], fR: [x + U * .18 + Math.sin(ph * Math.PI) * U * .06, G - lift(1)], hL: [x - U * .34, G - U * .52], hR: [x + U * .34, G - U * .52], lean: Math.sin(ph * Math.PI) * .08, face: -1, sway: Math.sin(ph * Math.PI) };
      } else o = S.k(t);
      // the leap, the sit, the stand, the exit
      const top = c.y, sitBase = bot - c.h * .1;
      let card = { sy: 1, tx: 0, ty: 0, rot: 0 }, stuck = false;
      if (t >= 1.5 && t < 1.74) {
        const k = seg(t, 1.5, 1.74), xx = S.xc;
        o = Object.assign({}, o, { x: xx, base: lerp(G - U * .14, top, E.out(k)), fL: [xx - U * .3, lerp(G, top + U * .18, E.out(k))], fR: [xx + U * .3, lerp(G, top + U * .18, E.out(k))], hL: [xx - U * .45, lerp(G - U * .45, top - U * .55, E.out(k))], hR: [xx + U * .45, lerp(G - U * .45, top - U * .55, E.out(k))], face: 0, look: .5, lean: 0 });
      } else if (t >= 1.74) {
        const kq = seg(t, 1.74, 1.86), yb = lerp(top, sitBase, E.in(kq)), xx = S.xc;
        const sy = t < 1.86 ? lerp(1, .1, E.in(kq)) : .1 + (t < 2.0 ? Math.sin(seg(t, 1.86, 2.0) * Math.PI) * .02 : 0);
        card.sy = sy; card.sx = t < 1.86 ? lerp(1, .42, E.in(kq)) : .42;
        let base = t < 1.86 ? yb : sitBase - (t < 2.0 ? Math.sin(seg(t, 1.86, 2.0) * Math.PI) * U * .03 : 0);
        o = { x: xx, base, fL: [xx - U * .42, G], fR: [xx + U * .42, G], hL: [xx - U * .3, base - U * .1], hR: [xx + U * .3, base - U * .1], face: 0, look: .2, lean: 0, closed: t >= 2.05 && t < 2.6 };
        if (t < 1.86) { o.fL = [xx - U * .36, Math.min(G, base + U * .3)]; o.fR = [xx + U * .36, Math.min(G, base + U * .3)]; }
        if (t >= 2.62) {
          const k = seg(t, 2.62, 2.86);
          o.base = lerp(sitBase, G - U * .3, E.io(k)); o.fL = [xx - U * .3, G]; o.fR = [xx + U * .3, G]; o.hL = [xx - U * .34, o.base - U * .2]; o.hR = [xx + U * .34, o.base - U * .2]; o.closed = false; o.look = 0;
          stuck = true;
        }
        if (t >= 2.86) {
          const k = seg(t, 2.92, 3.62), x = lerp(xx, c.x - U * 1.8, k), ph = (xx - x) / (U * .32);
          const lift = i => Math.max(0, Math.sin(ph * Math.PI + i * Math.PI)) * U * .05;
          o = { x, base: G - U * .3 - Math.abs(Math.sin(ph * Math.PI)) * U * .02, fL: [x - U * .18 - Math.sin(ph * Math.PI) * U * .06, G - lift(0)], fR: [x + U * .18 - Math.sin(ph * Math.PI) * U * .06, G - lift(1)], hL: [x - U * .34, G - U * .52], hR: [x + U * .34, G - U * .52], lean: -Math.sin(ph * Math.PI) * .08, face: t < 2.92 ? -.6 : -1, sway: Math.sin(ph * Math.PI) };
          stuck = true;
        }
      }
      if (t >= 1.86 && t < 2.62) { o.blink = false; }
      // card hops on each stomp
      if (t >= 1.0 && t < 1.14) { const k = seg(t, 1.0, 1.14); card.ty = -Math.sin(k * Math.PI) * U * .12; card.rot = Math.sin(k * Math.PI) * 1.2; }
      if (t >= 1.4 && t < 1.56) { const k = seg(t, 1.4, 1.56); card.ty = -Math.sin(k * Math.PI) * U * .2; card.rot = -Math.sin(k * Math.PI) * 2.2; }
      if (stuck) {
        const turn = seg(t, 2.86, 2.98), rear = [o.x + turn * U * .3, o.base - U * .04 - turn * U * .1];
        const ang = turn * 78 + (t >= 2.98 ? Math.sin((t - 2.98) * 16) * 5 : 0);
        S.setCard({ sy: .1, sx: .42, px: c.w / 2, py: c.h * .95, tx: rear[0] - (c.x + c.w / 2), ty: rear[1] - (c.y + c.h * .95), rot: ang });
      } else S.setCard({ ty: card.ty, rot: card.rot, sy: card.sy, sx: card.sx || 1, px: c.w / 2, py: c.h });
      // folds on the squashed card, drawn in the card's own space so they travel with it
      if (card.sy < 1 || stuck) { let h = ''; [1, 3].forEach(i => { h += `<rect x="0" y="${(c.h * i / 4).toFixed(1)}" width="${c.w}" height="${(c.h / 4).toFixed(1)}" fill="rgba(31,26,23,.22)"/>`; }); [1, 2, 3].forEach(i => { h += `<line x1="0" y1="${(c.h * i / 4).toFixed(1)}" x2="${c.w}" y2="${(c.h * i / 4).toFixed(1)}" stroke="${INK}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`; }); S.over.innerHTML = h; } else S.over.innerHTML = '';
      shadow(p, o.x, G, U * .38);
      A_sumoDraw(p, S, o);
      [1.0, 1.4].forEach((ts, i) => { if (t >= ts && t < ts + .1) { const f = i ? S.k(ts).fL : S.k(ts).fR; A_spray(p, [f[0], G - U * .02], U * .06, U * .18, -2.9, -.25, 5, .8); } });
      if (t >= 1.86 && t < 1.98) { A_spray(p, [c.x - U * .05, bot - U * .1], U * .04, U * .14, 2.7, 3.6, 3, .8); A_spray(p, [c.x + c.w + U * .05, bot - U * .1], U * .04, U * .14, -.46, .44, 3, .8); }
    }
  };

  /* ═════════ A11. THE TUBA — one note blows it away; it comes back down into the bell ═════════ */
  function A_tubaDraw(p, S, J, puff) {   // sousaphone worn over the left shoulder; bell above his head facing right
    const U = S.U, hip = J.hip, neck = J.neck;
    const lc = [lerp(hip[0], neck[0], .45) - U * .02, lerp(hip[1], neck[1], .45) + U * .02];
    const bellC = [J.hc[0] + U * .18, J.hc[1] - U * .32], mouth = [bellC[0] + U * .14, bellC[1]];
    p.g();
    const loop = []; for (let i = 0; i <= 18; i++) { const a = -Math.PI * .1 + i / 18 * Math.PI * 1.85; loop.push([lc[0] + Math.cos(a) * U * .2, lc[1] + Math.sin(a) * U * .16]); }
    const neckTube = [loop[loop.length - 1], [neck[0] - U * .16, neck[1] - U * .02], [J.hc[0] - U * .16, J.hc[1] - U * .12], [bellC[0] - U * .14, bellC[1] + U * .06]];
    A_limb(p, loop, 2.6); A_limb(p, neckTube, 2.6);
    p.shape([[bellC[0] - U * .16, bellC[1] - U * .03], [mouth[0], bellC[1] - U * .25], [mouth[0] + U * .02, bellC[1] + U * .25], [bellC[0] - U * .16, bellC[1] + U * .09]], { fill: '#fff' });
    p.circ(mouth[0], mouth[1], U * .25, { sx: .3, fill: '#fff', n: 14 });
    p.circ(mouth[0], mouth[1], U * .19, { sx: .22, fill: WASH2, stroke: false, n: 12, halo: false });
    p.line([[lc[0] + U * .12, lc[1] - U * .1], [J.hc[0] + U * .08, J.hc[1] + U * .04]], { w: .9 });
    return { mouth };
  }
  GAGS.A_tuba = {
    name: 'The Tuba', dur: 4.0, ones: [[.98, 1.6]],
    cues: [[0.05, 'footsteps'], [0.56, 'big-inhale'], [1.0, 'tuba-blast'], [1.06, 'paper-flap'], [1.55, 'blast-end'], [2.2, 'paper-flutter'], [3.04, 'plunk'], [3.3, 'muffled-toot']],
    setup(S) {
      const { U, G, c } = S;
      const xt = S.xt = c.x + c.w * .12; S.x0 = -U * .6;
      const A = (dx, dy) => [xt + dx * U, G - dy * U];
      S.trk = track([
        [.5, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.1, .58), hR: A(.2, .6) }],
        [.56, { lean: -.18, hd: [-U * .01, -U * .02], hip: A(-.02, .43), look: -.4 }],
        [.9, { lean: -.22 }],
        [1.0, { lean: .14, hd: [U * .02, 0], hip: A(.02, .4), look: 0, fR: A(.1, 0), brow: 1 }, 'out'],
        [1.55, { lean: .2 }],
        [1.66, { lean: 0, hd: [0, 0], hip: A(0, .415), brow: 0 }],
        [1.8, { face: 0 }],
        [2.24, {}],
        [2.36, { face: .7, look: -.9, hd: [0, -U * .015] }],
        [2.8, { look: -.5 }],
        [3.04, { look: -.3 }],
        [3.12, { face: 1, look: -.2 }],
        [3.26, { lean: -.12, look: -.3 }],
        [3.32, { lean: .06, brow: 1 }, 'out'],
        [3.5, { face: 0, look: 0, lean: 0, hd: [0, 0] }],
      ]);
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      let P = S.trk(t);
      if (t < .5) { const w = walk(S, P, t, 0, .5, S.x0, S.xt, { carry: true }); Object.assign(P, { hip: w.hip, fL: w.fL, fR: w.fR, lean: w.lean }); P.hL = [P.hip[0] + U * .1, G - U * .58]; P.hR = [P.hip[0] + U * .2, G - U * .6]; }
      shadow(p, P.hip[0], G, U * .2);
      const z = A_pen(p), J = figure(z, S, P, { hat: 'hair' });
      const mouth = [J.hc[0] + U * .32, J.hc[1] - U * .32];
      // the card: flaps in the blast, peels away and tumbles off; later drifts back down, small
      if (t >= 1.02 && t < 1.62) {
        const k = seg(t, 1.12, 1.6), fl = Math.sin((t - 1.02) * 40);
        if (t < 1.12) S.setCard({ kx: -4 + fl * 4, sx: 1 - .03 * (1 + fl), px: c.w, py: c.h });
        else S.setCard({ tx: E.in(k) * U * 2.8, ty: -E.in(k) * U * 1.6 - Math.sin(k * Math.PI) * U * .3, rot: E.in(k) * 220, sx: Math.cos(k * 9) * (1 - k * .5), sy: 1 - k * .5, kx: fl * 8 * (1 - k), px: c.w, py: c.h, hide: k >= 1 });
      } else if (t >= 2.2 && t < 3.06) {
        const k = seg(t, 2.2, 3.0), s = .2 * (1 - E.in(seg(t, 2.94, 3.06)) * .85), sw = Math.sin(k * Math.PI * 3.2);
        const x = lerp(c.x + c.w * .7, mouth[0] + U * .04, E.io(k)) + sw * U * .32 * (1 - k), y = lerp(-U * .3, mouth[1], E.lin(k));
        S.setCard({ tx: x - (c.x + c.w / 2), ty: y - (c.y + c.h / 2), sx: s * (.6 + .4 * Math.abs(Math.cos(k * 7))), sy: s, rot: sw * 30 * (1 - k) + 70 * E.in(seg(t, 2.9, 3.0)) });
      } else S.setCard({ hide: t >= 1.6 });
      // waves from the bell
      if (t >= 1.0 && t < 1.62) {
        p.g({ halo: false });
        for (let i = 0; i < 5; i++) { const age = ((t - 1.0) * 3 + i / 5) % 1, r = U * (.2 + age * 2.2); if (t - 1.0 < i * .06) continue; const pts = []; for (let j = 0; j <= 8; j++) { const a = -.55 + j / 8 * 1.1; pts.push([mouth[0] + Math.cos(a) * r, mouth[1] + Math.sin(a) * r]); } p.line(pts, { w: 1.0 - age * .5, color: `rgba(31,26,23,${(.75 * (1 - age)).toFixed(2)})`, amp: .3 }); }
      }
      if (t >= 3.3 && t < 3.55) { p.g({ halo: false }); const k = seg(t, 3.3, 3.55); const pts = []; for (let j = 0; j <= 5; j++) { const a = -.4 + j / 5 * .8; pts.push([mouth[0] + Math.cos(a) * U * (.12 + k * .2), mouth[1] + Math.sin(a) * U * (.12 + k * .2)]); } p.line(pts, { w: .6, color: `rgba(31,26,23,${(.6 * (1 - k)).toFixed(2)})` }); }
      if (t >= 3.3 && t < 3.6) { const k = seg(t, 3.3, 3.6); p.g(); p.shape([[-1, -.7], [.9, -.8], [1, .6], [-.8, .8]].map(([u, v]) => rot([mouth[0] + U * (.08 + k * .25) + u * U * .03, mouth[1] - k * U * .1 + Math.sin(k * 9) * U * .02 + v * U * .03], [mouth[0], mouth[1]], k * 3)), { fill: '#fff', w: .6, op: 1 - E.in(k) }); }
      p.g(); p.raw(z.svg());
      A_tubaDraw(p, S, J);
      if (t >= 3.04 && t < 3.12) A_spray(p, [mouth[0] - U * .02, mouth[1] - U * .2], U * .03, U * .08, -2.2, -1.0, 3, .55);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     SET B — WORKERS & PROFESSIONS: someone with a job deals with the cartoon, deadpan.
     Everything lives in this block so helper names can't collide with other sets.
     ═══════════════════════════════════════════════════════════════════════ */
  {
    const bRect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const bEll = (cx, cy, rx, ry, n, a0 = 0, a1 = Math.PI * 2) => { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
    const bump = (t, a, b) => (t <= a || t >= b) ? 0 : Math.sin(Math.PI * (t - a) / (b - a));
    const stand = (S, xs) => (dx, dy) => [xs + dx * S.U, S.G - dy * S.U];
    /* the background the card sits on (for paint that matches the wall) */
    function bWall(S) {
      let el = S.root && S.root.parentNode;
      while (el && el.nodeType === 1) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)|transparent/.test(bg)) return bg;
        el = el.parentElement;
      }
      return '#FFF8EA';
    }

    /* figure() with hooks for costumes: under (before legs), body (after torso, before arms), faceFn, hatFn, front */
    function bFig(p, S, P, st = {}) {
      const U = S.U, f = P.face || 0, back = !!P.back, sg = sgnOf(f);
      const hip = P.hip, lean = P.lean || 0, T = U * 0.31, hr = U * 0.1;
      const neck = [hip[0] + Math.sin(lean) * T, hip[1] - Math.cos(lean) * T];
      const hd = P.hd || [0, 0];
      const hc = [neck[0] + Math.sin(lean) * hr * 1.1 + hd[0], neck[1] - Math.cos(lean) * hr * 1.1 + hd[1]];
      const sh = [lerp(neck[0], hip[0], 0.08), lerp(neck[1], hip[1], 0.08)];
      const kb = P.kb || (sg ? [-sg, -sg] : [1, -1]);
      const eb = P.eb || (sg ? [sg, sg] : [1, -1]);
      const J = { hip, neck, hc, hr, sh, sg, back, U, lean };
      J.legs = [P.fL, P.fR].map((ft, i) => ik(hip, ft, U * 0.235, U * 0.235, kb[i]));
      J.arms = [P.hL, P.hR].map((hn, i) => ik(sh, hn, U * 0.17, U * 0.17, eb[i]));
      J.fL = J.legs[0][1]; J.fR = J.legs[1][1]; J.hL = J.arms[0][1]; J.hR = J.arms[1][1];
      p.g();
      if (st.under) st.under(p, J, P);
      J.legs.forEach(([kn, ft], i) => {
        p.line([hip, kn]); p.line([kn, ft]);
        const fd = P.fdir ? P.fdir[i] : (sg || (i ? 1 : -1));
        p.line([ft, [ft[0] + fd * U * 0.055, ft[1]]]);
      });
      if (st.belly && sg && !back) { const m = [lerp(hip[0], neck[0], .42) + sg * U * .075, lerp(hip[1], neck[1], .42)]; p.line([hip, m, neck]); }
      else p.line([hip, neck]);
      if (st.body) st.body(p, J, P);
      const arms = () => J.arms.forEach(([el, hn]) => {
        p.line([sh, el]); p.line([el, hn]);
        if (st.gloves) p.circ(hn[0], hn[1], U * .026, { fill: '#fff', w: .75, n: 8 });
      });
      if (!P.armsFront) arms();
      p.circ(hc[0], hc[1], hr, { fill: P.headFill || '#fff' });
      if (!back) faceDraw(p, P, hc, hr, st);
      if (st.faceFn && !back) st.faceFn(p, J, P);
      if (st.hat) hatDraw(p, P, hc, hr, st);
      if (st.hatFn) st.hatFn(p, J, P);
      if (P.armsFront) arms();
      if (st.front) st.front(p, J, P);
      return J;
    }
    /* head-space transform: x,y in head radii, follows the head's tilt */
    const HT = (J, P) => pts => pts.map(([x, y]) => rot([J.hc[0] + x * J.hr, J.hc[1] + y * J.hr], J.hc, P.tilt || 0));
    const mir = (pts, s) => pts.map(([x, y]) => [x * s, y]);

    /* ── costume pieces ── */
    const COS = {
      capBack(p, J, P) {   // a ball cap worn backwards
        const Q = Object.assign({}, P, { face: -(P.face || 0), back: P.back ? 0 : 1 });
        if (!sgnOf(P.face || 0)) Q.back = 1;
        hatDraw(p, Q, J.hc, J.hr, { hat: 'cap' });
      },
      beanie(p, J, P) {
        const T = HT(J, P);
        const dome = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; dome.push([Math.cos(a) * 1.06, -.36 + Math.sin(a) * .78]); }
        p.shape(T(dome.concat([[1.08, -.28], [-1.08, -.28]])), { fill: '#fff' });
        p.shape(T([[-1.1, -.24], [1.1, -.24], [1.08, -.52], [-1.08, -.52]]), { fill: '#fff', w: .9 });
        [-.6, -.2, .2, .6].forEach(x => p.line(T([[x, -.29], [x, -.48]]), { w: .5, halo: false, amp: .1 }));
        p.circ(...T([[0, -1.28]])[0], J.hr * .22, { fill: INK, w: .7, n: 8 });
      },
      paperHat(p, J, P) {   // folded newspaper hat: a flared brim band and a peak
        const T = HT(J, P), s = sgnOf(P.face || 0) || 1;
        p.shape(T([[-.96, -.84], [.96, -.84], [.1 * s, -1.78]]), { fill: '#fff' });
        [[-1.05, -.42, .36], [-1.22, -.28, .22], [-1.39, -.14, .1]].forEach(([y, x0, x1]) => p.line(T([[x0 + .08 * s, y], [x1 + .08 * s, y]]), { w: .5, halo: false, color: 'rgba(31,26,23,.45)', amp: .1 }));
        p.shape(T([[-1.04, -.46], [1.04, -.46], [1.3, -.9], [-1.3, -.9]]), { fill: '#fff' });
        p.line(T([[-.7, -.68], [-.2, -.68]]), { w: .45, halo: false, color: 'rgba(31,26,23,.45)', amp: .1 });
        p.line(T([[.15, -.68], [.75, -.68]]), { w: .45, halo: false, color: 'rgba(31,26,23,.45)', amp: .1 });
      },
      postal(p, J, P) {
        const T = HT(J, P), s = sgnOf(P.face || 0);
        p.shape(T([[-1.0, -.4], [-1.08, -1.05], [1.08, -1.05], [1.0, -.4]]), { fill: '#fff' });
        p.line(T([[-1.0, -.56], [1.0, -.56]]), { w: .6, halo: false });
        if (s && !P.back) p.shape(T(mir([[.7, -.44], [1.62, -.34], [1.58, -.24], [.74, -.32]], s)), { fill: INK, w: .8 });
        else if (!P.back) p.shape(T([[-.86, -.42], [0, -.5], [.86, -.42], [.62, -.28], [0, -.24], [-.62, -.28]]), { fill: INK, w: .8 });
        if (!P.back) p.circ(...T([[s * .55, -.8]])[0], J.hr * .13, { fill: INK, w: .5, n: 8, halo: false });
      },
      toque(p, J, P) {
        const T = HT(J, P);
        p.shape(T([[-.95, -1.0], [-1.3, -1.45], [-1.18, -2.0], [-.62, -2.36], [0, -2.18], [.62, -2.42], [1.2, -2.05], [1.32, -1.46], [.95, -1.0]]), { fill: '#fff' });
        p.line(T([[-.35, -1.15], [-.45, -1.8]]), { w: .5, halo: false }); p.line(T([[.35, -1.15], [.42, -1.85]]), { w: .5, halo: false });
        p.shape(T([[-.9, -.5], [.9, -.5], [.95, -1.02], [-.95, -1.02]]), { fill: '#fff' });
      },
      mirror(p, J, P) {   // a doctor's head mirror on a band
        const T = HT(J, P), s = sgnOf(P.face || 0);
        p.line(T([[-1.0, -.42], [-.5, -.58], [.5, -.58], [1.0, -.42]]), { w: 1.1 });
        const c0 = T([[s * .55, -.78]])[0];
        p.circ(c0[0], c0[1], J.hr * .44, { fill: '#fff', sx: s ? .55 : 1, w: 1 });
        p.dot(c0[0], c0[1], J.hr * .1);
      },
      mask(p, J, P) {   // surgical mask
        const T = HT(J, P), s = sgnOf(P.face || 0);
        if (s) {
          p.shape(T(mir([[.0, .02], [1.06, .08], [1.02, .56], [.42, .78], [.0, .6]], s)), { fill: '#fff', w: .8 });
          p.line(T(mir([[.05, .1], [-.8, -.1]], s)), { w: .5, halo: false }); p.line(T(mir([[.05, .5], [-.8, .2]], s)), { w: .5, halo: false });
          p.line(T(mir([[.3, .3], [.95, .32]], s)), { w: .45, halo: false, color: 'rgba(31,26,23,.5)' });
        } else {
          p.shape(T([[-.72, .06], [.72, .06], [.64, .6], [0, .74], [-.64, .6]]), { fill: '#fff', w: .8 });
          [.28, .45].forEach(y => p.line(T([[-.55, y], [.55, y]]), { w: .45, halo: false, color: 'rgba(31,26,23,.5)' }));
        }
      },
      goggles(p, J, P) {
        const T = HT(J, P), f = P.face || 0, look = P.look || 0;
        const ey = -.08 + look * .22, ex = f * .46, sp = .33 * (1 - Math.abs(f) * .5);
        const xs = Math.abs(f) > .88 ? [ex + f * .06] : [ex - sp, ex + sp];
        p.line(T([[-1.0, ey - .05], [1.0, ey - .05]]), { w: 1.6 });
        xs.forEach(x => { const c0 = T([[x, ey]])[0]; p.circ(c0[0], c0[1], J.hr * .3, { fill: 'rgba(255,255,255,.35)', w: 1.2, n: 9 }); });
      },
      resp(p, J, P) {   // respirator: snout + filter canister
        const T = HT(J, P), s = sgnOf(P.face || 0);
        if (s) {
          const m = T([[s * .78, .42]])[0], k = T([[s * 1.12, .56]])[0];
          p.line(T(mir([[.5, .12], [-.85, -.25]], s)), { w: .6, halo: false });
          p.circ(m[0], m[1], J.hr * .36, { fill: '#fff', w: .9, n: 9 });
          p.circ(k[0], k[1], J.hr * .28, { fill: INK, w: .8, n: 9 });
        } else {
          const m = T([[0, .45]])[0];
          p.line(T([[-.5, .2], [-1.0, -.1]]), { w: .6, halo: false }); p.line(T([[.5, .2], [1.0, -.1]]), { w: .6, halo: false });
          p.circ(m[0], m[1], J.hr * .4, { fill: '#fff', w: .9, n: 9 });
          [-1, 1].forEach(q => { const k = T([[q * .52, .62]])[0]; p.circ(k[0], k[1], J.hr * .26, { fill: INK, w: .8, n: 9 }); });
        }
      },
      coat(p, J, P) {   // lab coat over the torso, open at the front
        const U = J.U, n = J.neck, h = J.hip, s = J.sg;
        const sw = s ? .06 : .085, hw = s ? .13 : .16;
        p.shape([[n[0] - sw * U, n[1] + U * .015], [n[0] + sw * U, n[1] + U * .015], [h[0] + hw * U, h[1] + U * .19], [h[0] - hw * U, h[1] + U * .19]], { fill: '#fff' });
        if (!J.back) {
          const o = s * U * .03;
          p.line([[n[0] + o, n[1] + U * .02], [h[0] + o + s * U * .02, h[1] + U * .19]], { w: .6, halo: false });
          p.line([[n[0] - U * .04 + o, n[1] + U * .015], [n[0] + o, n[1] + U * .09], [n[0] + U * .04 + o, n[1] + U * .015]], { w: .6, halo: false });
          p.line([[h[0] - s * U * .07 - U * .03, h[1] - U * .02], [h[0] - s * U * .07 + U * .03, h[1] - U * .02]], { w: .5, halo: false });
        } else p.line([[n[0], n[1] + U * .1], [h[0], h[1] + U * .19]], { w: .5, halo: false, color: 'rgba(31,26,23,.4)' });
      },
      stripes(p, J, P) {   // a mime's striped top
        const U = J.U, n = J.neck, h = J.hip, w = U * .055;
        const L = (k, d) => [lerp(n[0], h[0], k) + d, lerp(n[1], h[1], k)];
        p.shape([L(.02, -w), L(.02, w), L(.86, w * .9), L(.86, -w * .9)], { fill: '#fff' });
        [.2, .38, .56, .74].forEach(k => p.shape([L(k - .06, -w), L(k - .06, w), L(k + .03, w), L(k + .03, -w)], { fill: INK, w: .3, amp: .15, halo: false }));
      },
      bib(p, J, P) {   // painter's overalls bib + straps
        const U = J.U, n = J.neck, h = J.hip, w = U * .06;
        const L = (k, d) => [lerp(n[0], h[0], k) + d, lerp(n[1], h[1], k)];
        p.shape([L(.32, -w), L(.32, w), L(1.04, w * 1.25), L(1.04, -w * 1.25)], { fill: '#fff', w: .9 });
        p.line([L(.32, -w * .8), L(.04, -w * .5)], { w: .7 }); p.line([L(.32, w * .8), L(.04, w * .5)], { w: .7 });
        p.circ(...L(.62, w * .3), U * .012, { fill: WASH2, stroke: false, halo: false, n: 6 });
        p.circ(...L(.86, -w * .5), U * .009, { fill: WASH2, stroke: false, halo: false, n: 6 });
      },
      apron(p, J, P) {
        const U = J.U, h = J.hip, s = J.sg, w = s ? U * .07 : U * .1;
        const x = h[0] + s * U * .025;
        p.shape([[x - w, h[1] - U * .03], [x + w, h[1] - U * .03], [x + w * 1.15, h[1] + U * .22], [x - w * 1.15, h[1] + U * .22]], { fill: '#fff', w: .9 });
        p.line([[x - w, h[1] - U * .03], [x - w - s * U * .03, h[1] + U * .05]], { w: .5, halo: false });
      },
      kerchief(p, J, P) {
        const U = J.U, n = J.neck, s = J.sg;
        p.shape([[n[0] - U * .045, n[1] + U * .01], [n[0] + U * .045, n[1] + U * .01], [n[0] + s * U * .015, n[1] + U * .075]], { fill: '#fff', w: .8 });
      },
      belt(p, J, P) {   // electrician's tool belt
        const U = J.U, h = J.hip, s = J.sg || 1;
        p.shape([[h[0] - U * .075, h[1] - U * .035], [h[0] + U * .075, h[1] - U * .035], [h[0] + U * .075, h[1] + U * .005], [h[0] - U * .075, h[1] + U * .005]], { fill: INK, w: .6 });
        const px = h[0] - s * U * .085;
        p.line([[px - U * .01, h[1] - U * .02], [px - U * .02, h[1] - U * .09]], { w: .8 });
        p.line([[px + U * .012, h[1] - U * .02], [px + U * .03, h[1] - U * .08]], { w: .6 });
        p.shape([[px - U * .035, h[1] - U * .02], [px + U * .035, h[1] - U * .02], [px + U * .03, h[1] + U * .07], [px - U * .03, h[1] + U * .07]], { fill: '#fff', w: .8 });
      },
      satchel(p, J, P) {
        const U = J.U, n = J.neck, h = J.hip, s = J.sg || 1;
        const bx = h[0] - s * U * .1, by = h[1] - U * .02;
        p.line([[n[0] + s * U * .03, n[1] + U * .02], [bx, by]], { w: .8 });
        p.shape(bRect(bx - U * .075, by, U * .15, U * .12), { fill: '#fff', w: .9 });
        p.shape([[bx - U * .075, by], [bx + U * .075, by], [bx + U * .07, by + U * .055], [bx - U * .07, by + U * .055]], { fill: WASH2, w: .6, halo: false });
      },
    };
    const costume = (...fns) => (p, J, P) => fns.forEach(f => f(p, J, P));

    /* ═════════ B1. THE PLUMBER — two plunges, then the drain takes the cartoon. And the plunger. ═════════ */
    GAGS.B_plumber = {
      name: 'The Plumber', dur: 4.0, ones: [[1.6, 1.96], [2.1, 2.24]],
      cues: [[0.05, 'footsteps'], [0.62, 'plunger-squelch'], [0.8, 'plunge'], [1.07, 'plunge'], [1.42, 'plunge-big'], [1.64, 'drain-shloop'], [2.12, 'plunger-gulp'], [2.4, 'blorp'], [3.32, 'belt-hitch']],
      setup(S) {
        const { U, G, c } = S;
        const xd = S.xd = c.x + c.w * .6, xs = S.xs = xd - U * .29;
        S.x0 = -U * .6; S.hl = U * .5; S.cupH = U * .11; S.cupW = U * .125;
        const A = stand(S, xs), gy = dy => [xd, G - dy * U];
        S.trk = track([
          [.5, { hip: A(0, .415), face: 1, lean: .02, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), g: A(.12, .7), ang: -2.25, hL: A(-.12, .44) }],
          [.64, { g: gy(.62), ang: Math.PI / 2, lean: .1, look: .5, hip: A(.01, .405) }, 'in'],
          [.8, { g: gy(.53), hip: A(.02, .37), lean: .2 }, 'in'],
          [.95, { g: gy(.63), hip: A(.01, .405), lean: .1 }, 'out'],
          [1.07, { g: gy(.53), hip: A(.02, .37), lean: .2 }, 'in'],
          [1.22, { g: gy(.63), hip: A(.01, .405), lean: .1 }, 'out'],
          [1.34, { g: gy(.74), hip: A(-.01, .44), lean: -.04, look: .2, fL: A(-.07, .03), fR: A(.07, .03), brow: 1 }],
          [1.42, { g: gy(.52), hip: A(.03, .34), lean: .3, look: .6, fL: A(-.09, 0), fR: A(.09, 0) }, 'in'],
          [1.58, {}],
          [1.66, { g: gy(.65), hip: A(0, .41), lean: .04, look: 0, brow: 0 }, 'out'],
          [1.92, {}],
          [2.02, { look: .9, lean: .12, hd: [U * .01, U * .01] }],
          [2.12, {}],
          [2.18, { g: [xd + U * .01, G - U * .4], hip: A(.07, .34), lean: .4, look: 1 }, 'in'],
          [2.34, { g: [xd - U * .02, G - U * .52], hip: A(.02, .41), lean: .08, look: .3, hd: [0, 0] }, 'out'],
          [2.58, { face: .55, look: .9, hd: [U * .012, U * .012] }],
          [2.9, {}],
          [3.02, { face: 0, look: 0, brow: 1, hd: [0, 0] }],
          [3.3, { g: [xd - U * .03, G - U * .5] }],
          [3.4, { hip: A(.02, .445) }],
          [3.52, { hip: A(.02, .415) }],
        ]);
      },
      draw(S, t, p) {
        const { U, G, c } = S, xd = S.xd;
        let P = S.trk(t);
        if (t < .5) P = walk(S, P, t, 0, .5, S.x0, S.xs, { carry: true }), P.g = [P.hip[0] + U * .12, G - U * .7], P.ang = -2.25, P.hL = [P.hip[0] - U * .1, G - U * .44];
        const g = P.g;
        P.hR = g;
        if (t >= .5) P.hL = t < .64 ? mixPt(P.hL, [g[0], g[1] + U * .08], seg(t, .5, .64)) : [g[0], g[1] + U * .08];
        if (t >= 3.3) { const k = E.io(seg(t, 3.3, 3.4)); P.hL = mixPt(P.hL, [P.hip[0] - U * .07, P.hip[1] + U * .01], k); P.hR = mixPt(P.hR, [P.hip[0] + U * .08, P.hip[1] + U * .01], k); }
        // the drain
        p.g({ halo: false });
        p.circ(xd, G, U * .12, { sy: .26, fill: WASH2, w: .9, n: 14 });
        [-.5, 0, .5].forEach(k => p.line([[xd + k * U * .1 - U * .014, G - U * .014], [xd + k * U * .1 + U * .014, G + U * .014]], { w: .55, amp: .1 }));
        // the card: dips on each pull, then circles the drain and goes down it
        const pv = { px: xd - c.x, py: G - c.y };
        const dip = bump(t, .9, 1.06) * .03 + bump(t, 1.17, 1.36) * .06;
        if (t < 1.64) S.setCard(Object.assign({}, pv, { sy: 1 - dip, sx: 1 + dip * .3, kx: t > 1.42 && t < 1.56 ? ((Math.floor(t * 24) % 2) ? 1.2 : -1.2) : 0 }));
        else if (t < 1.94) {
          const k = seg(t, 1.64, 1.92), s = Math.max(.001, 1 - E.in(k)), th = Math.pow(k, 1.4) * Math.PI * 5, cs = Math.cos(th);
          S.setCard(Object.assign({}, pv, { sx: s * (Math.abs(cs) < .1 ? .1 * Math.sign(cs || 1) : cs), sy: s * (1 + .12 * Math.sin(k * Math.PI)), rot: Math.sin(t * 50) * 3 * (1 - k), hide: k >= 1 }));
        } else S.setCard({ hide: true });
        // swirl lines while it goes
        if (t >= 1.6 && t < 2.02) {
          p.g({ halo: false });
          const fade = 1 - seg(t, 1.9, 2.02);
          for (let j = 0; j < 3; j++) {
            const pts = []; for (let i = 0; i < 9; i++) { const a = -t * 16 + j * 2.1 + i * .42, r = U * (.42 - i * .04); pts.push([xd + Math.cos(a) * r, G - U * .04 + Math.sin(a) * r * .3]); }
            p.line(pts, { w: .8, color: `rgba(31,26,23,${(.7 * fade).toFixed(2)})`, amp: .2 });
          }
        }
        shadow(p, P.hip[0], G, U * .2);
        // the plunger (until the drain takes it too)
        if (t < 2.22) {
          let gg = g, dir = [Math.cos(P.ang), Math.sin(P.ang)];
          if (t >= 2.12) { const g0 = S.trk(2.12).g; gg = [xd, g0[1] + E.in(seg(t, 2.12, 2.2)) * U * .9]; dir = [0, 1]; }
          const onDrain = t >= .64;
          const top = [gg[0] - dir[0] * U * .03, gg[1] - dir[1] * U * .03];
          const cupTop = [gg[0] + dir[0] * S.hl, gg[1] + dir[1] * S.hl];
          let ch = S.cupH, cw = S.cupW;
          if (onDrain) { ch = clamp(G - cupTop[1], U * .035, S.cupH); cw = S.cupW * (1 + (S.cupH - ch) / S.cupH * .55); }
          p.g();
          if (top[1] < G) p.line(onDrain ? [top, [gg[0], Math.min(cupTop[1], G)]] : [top, cupTop], { w: 1.6, amp: .3 });
          if (!onDrain || cupTop[1] < G - 1) {
            const ax = dir, pr = [-dir[1], dir[0]], hgt = onDrain ? Math.min(ch, G - cupTop[1]) : ch, pts = [];
            for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; pts.push([cupTop[0] + pr[0] * Math.cos(a) * cw + ax[0] * (1 - Math.sin(a) * .9) * hgt, cupTop[1] + pr[1] * Math.cos(a) * cw + ax[1] * (1 - Math.sin(a) * .9) * hgt]); }
            p.shape(pts, { fill: INK, w: .8 });
          }
        }
        if (t >= 2.14 && t < 2.24) burst(p, [xd, G - U * .06], U * .05, U * .1, 5, -2.6, .6);
        // the bubble
        if (t >= 2.36 && t < 2.56) { const k = seg(t, 2.36, 2.54); p.g(); p.circ(xd + Math.sin(k * 9) * U * .01, G - U * (.03 + k * .22), U * (.028 + k * .015), { fill: '#fff', w: .8, n: 9 }); }
        if (t >= 2.54 && t < 2.64) burst(p, [xd, G - U * .27], U * .02, U * .06, 6, .3, .6);
        bFig(p, S, P, { hatFn: COS.capBack, belly: true });
      }
    };

    /* ═════════ B2. WINDOW WASHER — lowered in on a plank, squeegees it clean off; it's just very clean glass ═════════ */
    GAGS.B_washer = {
      name: 'Window Washer', dur: 4.1, ones: [[.6, 1.98]],
      cues: [[0.0, 'pulley-creak'], [0.46, 'plank-bump'], [0.62, 'squeegee'], [0.82, 'squeegee'], [1.02, 'squeegee'], [1.22, 'squeegee'], [1.42, 'squeegee'], [1.62, 'squeegee'], [1.9, 'flick-drips'], [2.16, 'huff'], [2.4, 'sleeve-squeak'], [2.8, 'ting'], [3.36, 'pulley-zip']],
      setup(S) {
        const { U, G, c } = S, n = 6, bh = c.h / n;
        S.bh = bh; S.hw = U * .7; S.pole = U * .26;
        S.bands = [];
        for (let i = 0; i < n; i++) S.bands.push({ y0: i ? i * bh - 1.5 : -14, y1: i === n - 1 ? c.h + 16 : (i + 1) * bh + 1.5, yc: (i + .5) * bh, dir: i % 2 ? -1 : 1, t0: .62 + i * .2, t1: .62 + i * .2 + .17 });
        S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}w" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}"><rect x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}" fill="#fff"/><g class="wb" fill="#000">${S.bands.map(() => '<rect/>').join('')}</g></mask>`);
        S.cardIn.setAttribute('mask', `url(#${S.id}w)`);
        S.wb = [...S.defs.querySelectorAll('.wb rect')];
        S.xc = c.x + c.w / 2;
        S.py = i => c.y + S.bands[Math.min(i, 3)].yc + U * .62;   // the plank stops dropping after band 3; he crouches for the rest
        S.fog = null;
      },
      blade(S, t) {
        const { c } = S;
        for (let i = 0; i < S.bands.length; i++) {
          const b = S.bands[i];
          if (t >= b.t0 - .03 && t < b.t1 + .03) {
            const k = E.io(seg(t, b.t0, b.t1)), xa = -16, xb = c.w + 16;
            return { i, b, x: b.dir > 0 ? lerp(xa, xb, k) : lerp(xb, xa, k), y: b.yc };
          }
        }
        return null;
      },
      plankY(S, t) {
        const { U } = S, B = S.bands, last = B.length - 1;
        if (t < .46) return lerp(-U * .4, S.py(0), E.out(seg(t, 0, .46)));
        if (t < .58) return S.py(0) + bump(t, .46, .58) * U * .035;
        for (let i = 0; i < last; i++) if (t < B[i + 1].t0) return t < B[i].t1 ? S.py(i) : lerp(S.py(i), S.py(i + 1), E.io(seg(t, B[i].t1, B[i + 1].t0)));
        if (t < 3.36) return S.py(last);
        return S.py(last) - E.in(seg(t, 3.36, 3.86)) * (S.py(last) + U * .5);
      },
      draw(S, t, p) {
        const { U, c } = S, hw = S.hw, py = this.plankY(S, t), Bl = this.blade(S, t), xc = S.xc;
        S.bands.forEach((b, i) => {
          const r = S.wb[i]; let x0 = 0, x1 = 0;
          if (t >= b.t1) { x0 = -16; x1 = c.w + 16; }
          else if (Bl && Bl.i === i) { if (b.dir > 0) { x0 = -16; x1 = Bl.x; } else { x0 = Bl.x; x1 = c.w + 16; } }
          r.setAttribute('x', Math.min(x0, x1).toFixed(1)); r.setAttribute('width', Math.abs(x1 - x0).toFixed(1));
          r.setAttribute('y', b.y0.toFixed(1)); r.setAttribute('height', (b.y1 - b.y0).toFixed(1));
        });
        const pl = xc - hw, pr = xc + hw;
        let P = { back: 1, face: 0, look: 0, lean: 0, brow: 0, mouth: '', hd: [0, 0] }, B = null, sqAng = -1.25, hx = xc;
        const crouchFor = hy => clamp((hy - (py - U * .62)) / (U * .7), 0, 1);   // 0 = standing, 1 = kneeling at the plank edge
        if (Bl) {
          B = [c.x + Bl.x, c.y + Bl.y];
          const d = Bl.b.dir, hand = [B[0] - d * S.pole, B[1]];
          hx = clamp(hand[0] - d * U * .22, pl + U * .14, pr - U * .14);
          const cr = crouchFor(hand[1]);
          P.hip = [hx, py - U * lerp(.415, .2, cr)]; P.lean = d * (.14 + cr * .25);
          P.hR = hand; P.hL = [hx - d * U * .14, P.hip[1] - U * .05];
          const sw = Math.sin(seg(t, Bl.b.t0, Bl.b.t1) * Math.PI * 2) * U * .025;
          P.fL = [hx - U * (.08 + cr * .06) + sw, py]; P.fR = [hx + U * (.08 + cr * .06) - sw, py];
          if (cr > .5) P.kb = [-1, 1];
          sqAng = d > 0 ? 0 : Math.PI;
        } else {
          const A = (dx, dy) => [hx + dx * U, py - dy * U];
          let K;
          if (t < .62) K = { hip: A(0, .415), fL: A(-.08, 0), fR: A(.08, 0), hR: A(.14, .62), hL: A(-.14, .45) };
          else {
            hx = clamp(c.x + c.w + 16 - S.pole - U * .22, pl + U * .14, pr - U * .14);
            const A2 = (dx, dy) => [hx + dx * U, py - dy * U];
            K = track([
              [1.8, { hip: A2(0, .2), lean: .35, fL: A2(-.14, 0), fR: A2(.14, 0), hR: A2(.42, -.1), hL: A2(-.15, .15), face: 0, back: 1, look: 0, mouth: '', brow: 0 }],
              [1.9, { hip: A2(0, .415), lean: 0, fL: A2(-.08, 0), fR: A2(.08, 0), hR: A2(.2, .9), hL: A2(-.14, .45) }, 'out'],
              [1.98, { hR: A2(.24, .6) }],
              [2.08, { hip: A2(-.25, .415), fL: A2(-.33, 0), fR: A2(-.17, 0), hR: A2(-.12, .42), hL: A2(-.38, .45), face: 1, back: 0 }],
              [2.16, { lean: .16, hd: [U * .02, 0], mouth: 'o' }],
              [2.3, { mouth: '' }],
              [2.38, { hL: A2(.05, .78), lean: .1 }],
              [2.78, {}],
              [2.86, { hL: A2(-.38, .45), lean: 0, hd: [0, 0] }],
              [2.98, { face: 0, brow: 1 }],
              [3.36, { hR: A2(-.15, .75), hL: A2(-.38, .45) }],
            ])(t);
          }
          Object.assign(P, K);
          if (t >= 2.38 && t < 2.78) { const a = (t - 2.38) * Math.PI * 2 * 4.5, f0 = this.fogAt(S, hx, py); P.hL = [f0[0] - U * .03 + Math.cos(a) * U * .07, f0[1] + U * .04 + Math.sin(a) * U * .05]; }
        }
        // ropes, stirrups, plank, bucket
        p.g();
        p.line([[pl + U * .06, -20], [pl + U * .06, py - U * .09]], { w: .6, amp: .3 }); p.line([[pr - U * .06, -20], [pr - U * .06, py - U * .09]], { w: .6, amp: .3 });
        p.line([[pl + U * .02, py], [pl + U * .06, py - U * .09], [pl + U * .1, py]], { w: .7 });
        p.line([[pr - U * .1, py], [pr - U * .06, py - U * .09], [pr - U * .02, py]], { w: .7 });
        const bk = pr - U * .2;
        p.shape([[bk - U * .065, py - U * .12], [bk + U * .065, py - U * .12], [bk + U * .05, py], [bk - U * .05, py]], { fill: '#fff', w: .9 });
        p.shape([[bk - U * .06, py - U * .1], [bk + U * .06, py - U * .1], [bk + U * .05, py - U * .02], [bk - U * .05, py - U * .02]], { fill: WASH, stroke: false, halo: false });
        p.line(bEll(bk, py - U * .12, U * .065, U * .07, 6, Math.PI, Math.PI * 2), { w: .6 });
        // fog on the invisible glass, then the glint that proves it's there
        const f0 = this.fogAt(S, hx, py);
        if (t >= 2.16 && t < 2.82) {
          const k = E.out(seg(t, 2.16, 2.28)), fade = 1 - seg(t, 2.46, 2.8);
          p.g({ halo: false, op: fade });
          p.circ(f0[0], f0[1], U * .22 * (.35 + .65 * k), { sy: .8, fill: 'rgba(31,26,23,.11)', stroke: false, n: 14 });
          p.circ(f0[0], f0[1], U * .15 * (.35 + .65 * k), { sy: .8, fill: 'rgba(31,26,23,.1)', stroke: false, n: 12 });
          p.circ(f0[0], f0[1], U * .22 * (.35 + .65 * k), { sy: .8, w: .5, color: 'rgba(31,26,23,.25)', n: 14 });
        }
        if (t >= 2.78) {
          const k = t < 3.3 ? E.out(seg(t, 2.78, 2.9)) : 1 - seg(t, 3.3, 3.45);
          if (k > 0) {
            p.g({ halo: false, op: k });
            [[-.06, .05, .08, -.09], [.03, .08, .13, -.03]].forEach(([x0, y0, x1, y1]) => p.line([[f0[0] + x0 * U, f0[1] + y0 * U], [f0[0] + x1 * U, f0[1] + y1 * U]], { w: .9, color: 'rgba(31,26,23,.35)', amp: .1 }));
            const g0 = [f0[0] + U * .16, f0[1] - U * .12], r = U * .075 * (t < 3.0 ? .6 + bump(t, 2.78, 3.0) * .6 : .6);
            p.shape([[g0[0], g0[1] - r], [g0[0] + r * .18, g0[1] - r * .18], [g0[0] + r, g0[1]], [g0[0] + r * .18, g0[1] + r * .18], [g0[0], g0[1] + r], [g0[0] - r * .18, g0[1] + r * .18], [g0[0] - r, g0[1]], [g0[0] - r * .18, g0[1] - r * .18]], { fill: INK, w: .4, amp: 0 });
          }
        }
        if (t >= 1.88 && t < 2.2) { p.g({ halo: false }); for (let i = 0; i < 5; i++) { const k = seg(t, 1.88 + i * .015, 2.2), x = hx + U * (.3 + i * .05) + k * U * .35, y = py - U * .85 - k * U * .25 + k * k * U * 1.0; p.circ(x, y, U * .011, { fill: INK, stroke: false, n: 6 }); } }
        const J = bFig(p, S, P, { hatFn: COS.beanie });
        // the squeegee (a short pole, blade across the stroke)
        p.g();
        const hand = J.hR;
        if (!B) B = [hand[0] + Math.cos(sqAng) * S.pole, hand[1] + Math.sin(sqAng) * S.pole];
        const dv = [B[0] - hand[0], B[1] - hand[1]], dl = Math.hypot(dv[0], dv[1]) || 1, pr2 = [-dv[1] / dl, dv[0] / dl];
        const L = Bl ? S.bh * .86 : U * .26, tilt = Bl ? Bl.b.dir * .14 : 0;
        const ax = rotv(pr2, tilt), e1 = [B[0] - ax[0] * L / 2, B[1] - ax[1] * L / 2], e2 = [B[0] + ax[0] * L / 2, B[1] + ax[1] * L / 2], o = [dv[0] / dl * U * .03, dv[1] / dl * U * .03];
        p.line([hand, B], { w: 1.1 });
        p.shape([e1, e2, [e2[0] + o[0], e2[1] + o[1]], [e1[0] + o[0], e1[1] + o[1]]], { fill: '#fff', w: .9, amp: .2 });
        p.line([[e1[0] + o[0], e1[1] + o[1]], [e2[0] + o[0], e2[1] + o[1]]], { w: 1.8, amp: .15 });
        p.g(); p.shape(bRect(pl, py, pr - pl, U * .04), { fill: '#fff', w: 1 });
      },
      fogAt(S, hx, py) { return [hx + S.U * .14, py - S.U * .8]; },
    };

    /* ═════════ B3. THE PAINTER — rolls it out in wall colour; then notices the shadow ═════════ */
    GAGS.B_painter = {
      name: 'The Painter', dur: 4.0, ones: [[.5, 1.8], [2.34, 3.1]],
      cues: [[0.05, 'footsteps'], [0.56, 'roller-loop'], [1.78, 'roller-stop'], [2.02, 'satisfied-hm'], [2.28, 'double-take'], [2.36, 'roller-loop'], [2.62, 'roller-stop'], [2.7, 'roller-floor'], [3.08, 'roller-stop'], [3.22, 'pole-plant']],
      setup(S) {
        const { U, c, W } = S;
        S.paint = bWall(S);
        S.n = 4; S.cw = c.w / 4; S.rw = S.cw + 6; S.rr = U * .05;
        S.cols = []; for (let i = 0; i < S.n; i++) S.cols.push({ x: c.x + (i + .5) * S.cw, t0: .5 + i * .32 });
        S.x0 = -U * .55; S.L = U * 1.85;
        S.rx = c.x + c.w + 3.5;
        S.maxX = W - U * .16;
      },
      roller(S, t) {   // roller centre + whether it's painting
        const { U, c, G } = S, top = c.y + S.rr + 2, bot = c.y + c.h - S.rr;
        if (t < .5) return null;
        for (let i = 0; i < S.n; i++) {
          const C = S.cols[i];
          if (t < C.t0 + .32) {
            const prevX = i ? S.cols[i - 1].x : C.x;
            if (t < C.t0 + .06) { const k = E.io(seg(t, C.t0 - (i ? 0 : .06), C.t0 + .06)); return { x: lerp(prevX, C.x, k), y: lerp(i ? bot : c.y + c.h * .45, top, k), paint: false, i }; }
            if (t < C.t0 + .27) return { x: C.x, y: lerp(top, bot, E.io(seg(t, C.t0 + .06, C.t0 + .27))), paint: true, i };
            return { x: C.x, y: bot, paint: false, i };
          }
        }
        if (t < 2.34) return null;
        if (t < 2.64) { const k = E.io(seg(t, 2.34, 2.4)); return { x: lerp(S.cols[S.n - 1].x - U * .58, S.rx, k), y: t < 2.4 ? lerp(c.y + c.h * .4, top, k) : lerp(top, bot + S.rr, E.io(seg(t, 2.4, 2.62))), paint: t >= 2.4, i: 10 }; }
        if (t < 3.1) { const k = E.io(seg(t, 2.7, 3.06)); return { x: lerp(S.rx, c.x + 7, k), y: G - S.rr * .9, paint: t >= 2.7, i: 11, floor: true }; }
        return null;
      },
      draw(S, t, p) {
        const { U, G, c } = S, R = this.roller(S, t), top = c.y - 2;
        // paint on the wall
        p.g({ halo: false });
        const fillR = (x, y, w, h) => p.raw(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" fill="${S.paint}"/>`);
        S.cols.forEach((C, i) => {
          if (t < C.t0 + .06) return;
          const yb = (R && R.i === i && R.paint) ? R.y + S.rr : c.y + c.h + 1;
          fillR(C.x - S.cw / 2 - .8, top, S.cw + 1.6, yb - top);
          if (yb < c.y + c.h) for (let k = 0; k < 3; k++) p.line([[C.x - S.cw / 2 + 3 + k * S.cw * .33, yb - 1], [C.x - S.cw / 2 + 8 + k * S.cw * .33, yb + 1.5]], { w: .4, color: 'rgba(31,26,23,.12)', amp: .2 });
        });
        if (t >= 2.4) { const yb = R && R.i === 10 ? R.y + S.rr : c.y + c.h + 9; fillR(S.rx - S.rw / 2, top, S.rw, yb - top); }
        if (t >= 2.7) { const xl = R && R.i === 11 ? R.x - S.rr * .2 : c.x; fillR(xl, c.y + c.h - 2, c.x + c.w + 12 - xl, 12); }
        if (t >= .56) { p.g({ halo: false }); S.cols.forEach(C => { if (t >= C.t0 + .27) p.line([[C.x + S.cw / 2, c.y + 4], [C.x + S.cw / 2 + 1, c.y + c.h - 4]], { w: .45, color: 'rgba(31,26,23,.06)', amp: .4 }); }); }
        // him
        const base = { face: 1, look: 0, lean: 0, brow: 0, hd: [0, 0] };
        let P, hold = null;   // hold: where the pole is gripped / roller centre when not painting
        if (t < .5) {
          P = walk(S, Object.assign({}, base), t, 0, .5, S.x0, S.cols[0].x - U * .2, { carry: true });
          P.hR = [P.hip[0] + U * .12, G - U * .62]; P.hL = [P.hip[0] + U * .1, G - U * .42];
        } else if (R && !R.floor) {
          const hy = clamp(R.y + U * .95, G - U * 1.0, G - U * .42), cr = clamp((hy - (G - U * 1.0)) / (U * .58), 0, 1);
          const sx = Math.min(R.x - U * .2, S.maxX), A = stand(S, sx);
          P = Object.assign({}, base, { hip: A(0, .415 - cr * .1), fL: A(-.09, 0), fR: A(.09, 0), lean: .03, hR: [R.x - U * .02, hy], hL: [R.x - U * .02, hy + U * .14] });
        } else if (R && R.floor) {
          // sweeps the floor strip like a broom; the long pole pivots in his hands
          const sx = c.x + c.w * .55, A = stand(S, sx), k = seg(t, 2.62, 2.7), f = R.x < sx ? -1 : 1;
          P = Object.assign({}, base, { hip: A(0, lerp(.415, .37, k)), face: f, lean: f * .12 * k, fL: A(-.1, 0), fR: A(.1, 0), hR: [sx + f * U * .12, G - U * .5], hL: [sx + f * U * .03, G - U * .58], look: .6 });
        } else if (t < 2.34) {
          // steps back, nods at a job well done, turns to go… double take at the shadow
          const last = S.cols[S.n - 1], x1 = last.x - U * .2, x2 = x1 - U * .4;
          if (t < 2.0) { P = walk(S, Object.assign({}, base), t, 1.78, 2.0, x1, x2, { carry: true, face: 1 }); P.lean = -.04; }
          else { const A = stand(S, x2); P = Object.assign({}, base, { hip: A(0, .415), fL: A(-.07, 0), fR: A(.07, 0) }); }
          P.hR = [P.hip[0] + U * .1, G - U * .55]; P.hL = [P.hip[0] + U * .06, G - U * .42];
          if (t >= 2.0 && t < 2.12) P.hd = [0, U * .012 * bump(t, 2.0, 2.12) * 2], P.look = .3 * bump(t, 2.0, 2.12);
          if (t >= 2.14) P.face = -.9, P.hd = [-U * .01, 0];
          if (t >= 2.26) P.face = 1, P.brow = 1, P.hd = [U * .02, -U * .02], P.look = -.3;
          hold = 'up';
        } else {
          const ex = c.x + c.w * .55, A = stand(S, ex);
          P = Object.assign({}, base, track([
            [3.06, { hip: A(0, .37), face: -1, lean: -.12, fL: A(-.1, 0), fR: A(.1, 0), hR: A(-.12, .5), hL: A(-.03, .58), look: .6, brow: 0 }],
            [3.24, { hip: A(.03, .415), lean: 0, hR: A(-.14, .6), hL: A(-.14, .46), face: -.4, look: -.2 }, 'out'],
            [3.42, { face: 0, look: 0, brow: 1 }],
          ])(t));
          hold = 'plant';
        }
        // the roller on its pole (the pole's tail tucks behind the floor)
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hatFn: COS.paperHat, body: COS.bib });
        if (t >= 2.26 && t < 2.42) { p.g({ halo: false }); const h = J.hc; [[-.5, -1], [0, -1.2], [.5, -1]].forEach(([dx, dy], i) => p.line([[h[0] + U * .1 * dx + U * .04 * dx, h[1] + U * .1 * dy - U * .03], [h[0] + U * .1 * dx * 1.7 + U * .04 * dx, h[1] + U * .1 * dy * 1.55 - U * .03]], { w: .7 })); }
        p.g();
        if (R && R.floor) {
          const h = J.hR, rc = [R.x, R.y], dv = [h[0] - rc[0], h[1] - rc[1]], dl = Math.hypot(dv[0], dv[1]) || 1;
          p.line([rc, [rc[0] + dv[0] / dl * S.L, rc[1] + dv[1] / dl * S.L]], { w: 1.25 });
          p.circ(rc[0], rc[1], S.rr, { fill: '#fff', w: 1, n: 10 });
          p.line([[rc[0] - S.rr * .4, rc[1] - S.rr * .4], [rc[0] + S.rr * .4, rc[1] + S.rr * .4]], { w: .5, halo: false });
        } else {
          let rc;
          if (R) rc = [R.x, R.y];
          else if (hold === 'plant') { const h = J.hR, k = seg(t, 3.06, 3.24); rc = mixPt([c.x + 7, G - S.rr], [h[0] + U * .01, h[1] - S.L * .8], E.io(k)); }
          else rc = [J.hR[0] + U * .02, J.hR[1] - S.L * .8];
          const bot = Math.min(rc[1] + S.L, G);
          if (hold === 'plant' && t < 3.24) {
            const h = J.hR; p.line([[rc[0] + S.rr * .5, rc[1]], [h[0] + (h[0] - rc[0]) * .3, h[1] + (h[1] - rc[1]) * .3]], { w: 1.25 });
            p.circ(rc[0], rc[1], S.rr, { fill: '#fff', w: 1, n: 10 });
          } else {
            p.line([[rc[0] + S.rw * .32, rc[1] + S.rr], [rc[0] + S.rw * .32, rc[1] + S.rr * 2.4], [rc[0], rc[1] + S.rr * 3.2]], { w: .8 });
            p.line([[rc[0], rc[1] + S.rr * 3.2], [rc[0], bot]], { w: 1.25 });
            p.shape(bRect(rc[0] - S.rw / 2, rc[1] - S.rr, S.rw, S.rr * 2), { fill: '#fff', w: 1 });
            p.line([[rc[0] - S.rw / 2 + 4, rc[1] + S.rr * .35], [rc[0] + S.rw / 2 - 4, rc[1] + S.rr * .35]], { w: .45, halo: false, color: 'rgba(31,26,23,.4)' });
          }
        }
      }
    };

    /* ═════════ B4. THE CHEMIST — one careful drop; a tiny hole. Then the whole flask. Then a note. ═════════ */
    function flask(p, U, h, ang, fill) {   // Erlenmeyer flask held by the neck at h, tipped by ang
      const T = pts => pts.map(([x, y]) => rot([h[0] + x * U, h[1] + y * U], h, ang));
      p.g();
      p.shape(T([[-.11, .24], [.11, .24], [.035, .04], [.035, -.04], [-.035, -.04], [-.035, .04]]), { fill: '#fff', w: .9 });
      if (fill > 0) { const y = lerp(.235, .1, fill), hw = .035 + (.24 - y) / .2 * .075; p.shape(T([[-.105, .23], [.105, .23], [hw + .0, y], [-hw, y]]), { fill: WASH2, stroke: false, halo: false }); }
      p.line(T([[-.05, -.04], [.05, -.04]]), { w: 1.1 });
      return { mouth: T([[0, -.05]])[0] };
    }
    GAGS.B_chemist = {
      name: 'The Chemist', dur: 4.0, ones: [[2.08, 2.96]],
      cues: [[0.05, 'footsteps'], [0.72, 'pipette-squeeze'], [0.88, 'drip'], [0.92, 'tiny-fizz'], [1.72, 'blink'], [2.08, 'glug-pour'], [2.24, 'big-fizz-loop'], [2.96, 'fizz-out'], [3.12, 'pencil-scratch']],
      setup(S) {
        const { U, G, c, W } = S;
        const xs = S.xs = c.x + c.w * .66; S.x0 = W + U * .5;
        S.drop = [c.x + c.w * .38, G - U * .7]; S.pour = [c.x + c.w * .42, G - U * .82]; S.pl = U * .24;
        const step = U * .2, holes = [];
        for (let y = -8; y < c.h + 22; y += step) for (let x = -8; x < c.w + 22; x += step) {
          const i = holes.length, jx = x + (rnd(S.seed + 41, i) - .5) * step * .5, jy = y + (rnd(S.seed + 43, i) - .5) * step * .5;
          const d = Math.hypot(jx - (S.pour[0] - c.x), jy - (S.pour[1] - c.y));
          holes.push({ x: jx, y: jy, t0: 2.22 + d / Math.hypot(c.w, c.h) * .58 + rnd(S.seed + 45, i) * .07, r: step * (.82 + rnd(S.seed + 47, i) * .2) });
        }
        S.holes = holes;
        S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}d" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}"><rect x="-40" y="-40" width="${c.w + 80}" height="${c.h + 80}" fill="#fff"/><g class="hz" fill="#000">${'<circle r="0"/>'.repeat(holes.length + 1)}</g></mask>`);
        S.cardIn.setAttribute('mask', `url(#${S.id}d)`);
        S.hz = [...S.defs.querySelectorAll('.hz circle')];
        S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}dc"><rect x="0" y="0" width="${c.w}" height="${c.h}" rx="${S.F.radius}"/><rect x="${S.F.shadow}" y="${S.F.shadow}" width="${c.w}" height="${c.h}" rx="${S.F.radius}"/></clipPath>`);
        S.over.innerHTML = `<g class="rims" fill="rgba(31,26,23,.42)" clip-path="url(#${S.id}dc)">${'<circle r="0"/>'.repeat(holes.length + 1)}</g>`;
        S.rims = [...S.over.querySelectorAll('.rims circle')];
        const A = stand(S, xs), dropHand = [S.drop[0], S.drop[1] - S.pl];
        S.trk = track([
          [.5, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hR: A(-.15, .5), hL: A(.1, .42), fa: 0, sq: 0 }],
          [.68, { hR: dropHand, lean: -.12, look: .3 }],
          [.76, { sq: 1 }], [.86, { sq: 0 }],
          [1.0, {}],
          [1.24, { hR: A(-.05, .6), lean: -.3, hd: [-U * .03, U * .03], look: .7 }],
          [1.56, {}],
          [1.66, { face: 0, lean: 0, look: 0, hd: [0, 0], brow: 1 }],
          [1.96, {}],
          [2.04, { face: -1, brow: 0, hL: [S.pour[0] + U * .34, S.pour[1] - U * .02], lean: -.06, fa: 0 }],
          [2.12, { fa: -2.15 }, 'out'],
          [2.3, {}],
          [2.38, { fa: 0, hL: A(.1, .45), lean: .06, hR: A(-.1, .45) }],
          [2.9, {}],
          [3.04, { hL: A(-.06, .58), hR: A(-.02, .66), look: .6, lean: -.04 }],
          [3.5, { face: 0, look: 0, brow: 1 }],
        ]);
      },
      draw(S, t, p) {
        const { U, G, c } = S, P = S.trk(t);
        if (t < .5) Object.assign(P, walk(S, P, t, 0, .5, S.x0, S.xs, { carry: true }), { hR: [0, 0], hL: [0, 0] }), P.hR = [P.hip[0] - U * .15, G - U * .5], P.hL = [P.hip[0] + U * .1, G - U * .42];
        // holes: the first tiny one, then the whole card
        const r0 = t < .88 ? 0 : U * .07 * E.out(seg(t, .88, 1.2)), dl = [S.drop[0] - c.x, S.drop[1] - c.y];
        const setC = (el, x, y, r) => { el.setAttribute('cx', x.toFixed(1)); el.setAttribute('cy', y.toFixed(1)); el.setAttribute('r', Math.max(0, r).toFixed(1)); };
        setC(S.hz[0], dl[0], dl[1], r0); setC(S.rims[0], dl[0], dl[1], r0 ? r0 + U * .028 : 0);
        S.holes.forEach((h, i) => { const r = t < h.t0 ? 0 : h.r * E.out(seg(t, h.t0, h.t0 + .2)); setC(S.hz[i + 1], h.x, h.y, r); setC(S.rims[i + 1], h.x, h.y, r ? r + U * .03 : 0); });
        if (t >= 3.0) S.setCard({ hide: true });
        // smoke and bubbles
        p.g({ halo: false });
        if (t >= .9 && t < 1.9) { const k = seg(t, .9, 1.9), x = S.drop[0], y = S.drop[1]; const pts = []; for (let i = 0; i < 6; i++) { const q = i / 5; pts.push([x + Math.sin(q * 5 + t * 6) * U * .03 * q, y - U * .04 - q * U * .3 * Math.min(1, k * 2.5)]); } p.line(pts, { w: .7, color: `rgba(31,26,23,${(.5 * (1 - k)).toFixed(2)})`, amp: .2 }); }
        if (t >= .9 && t < 1.3) [0, 1, 2].forEach(i => { const a = i * 2.1 + t * 9; p.circ(S.drop[0] + Math.cos(a) * U * .065, S.drop[1] + Math.sin(a) * U * .065, U * .012, { w: .5, n: 6 }); });
        if (t >= 2.2 && t < 3.3) {
          S.holes.forEach((h, i) => {
            if (i % 3 || t < h.t0 || t > h.t0 + .35) return;
            const k = seg(t, h.t0, h.t0 + .35), a = rnd(i, 5) * 6.3, rr = h.r * E.out(seg(t, h.t0, h.t0 + .2));
            p.circ(c.x + h.x + Math.cos(a) * rr, c.y + h.y + Math.sin(a) * rr - k * U * .05, U * (.012 + rnd(i, 6) * .012), { w: .55, n: 6, op: 1 - k });
          });
          for (let i = 0; i < 7; i++) {
            const t0 = 2.3 + i * .08, k = seg(t, t0, t0 + .75); if (k <= 0 || k >= 1) continue;
            const x = c.x + c.w * (.12 + rnd(S.seed + 61, i) * .76), y0 = c.y + c.h * (.35 + rnd(S.seed + 63, i) * .55), pts = [];
            for (let j = 0; j < 6; j++) { const q = j / 5; pts.push([x + Math.sin(q * 4.5 + t * 6 + i) * U * .045 * q, y0 - k * U * .55 - q * U * .32]); }
            p.line(pts, { w: .9, color: `rgba(31,26,23,${(.42 * (1 - k)).toFixed(2)})`, amp: .2 });
          }
        }
        // the pour
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hat: 'hair', body: COS.coat, faceFn: COS.goggles });
        // pipette (until it goes in the coat pocket) — notebook + pencil at the end
        if (t < 1.3) {
          const h = J.hR, tip = [h[0], h[1] + S.pl], sq = P.sq || 0;
          p.g(); p.line([[h[0], h[1] + U * .02], tip], { w: .8 });
          p.circ(h[0], h[1] - U * .01, U * .03, { sx: 1 - sq * .35, sy: 1.25, fill: INK, w: .6, n: 8 });
          if (t >= .74 && t < .9) { const k = seg(t, .74, .88); p.circ(tip[0], tip[1] + U * .012 * k, U * .014 * (.4 + k * .6), { fill: '#fff', w: .6, n: 7 }); }
        } else if (t >= 3.0) {
          const h = J.hL, nb = [h[0] - U * .02, h[1] - U * .04];
          p.g(); p.shape(bRect(nb[0] - U * .06, nb[1] - U * .07, U * .12, U * .14), { fill: '#fff', w: .8 });
          [0, 1, 2].forEach(i => p.line([[nb[0] - U * .04, nb[1] - U * .03 + i * U * .03], [nb[0] + (t > 3.12 + i * .1 ? U * .04 : -U * .04), nb[1] - U * .03 + i * U * .03]], { w: .45, halo: false }));
          const w = t > 3.08 && t < 3.44 ? Math.sin(t * 60) * U * .012 : 0, pt = [J.hR[0] + w, J.hR[1]];
          p.line([pt, [pt[0] + U * .05, pt[1] - U * .06]], { w: .9 });
        }
        if (t < 2.5) {
          const F = flask(p, U, J.hL, P.fa || 0, t < 2.12 ? 1 : 1 - seg(t, 2.12, 2.3));
          if (t >= 2.08 && t < 2.32) {
            const k1 = seg(t, 2.08, 2.18), k0 = seg(t, 2.2, 2.32), m = F.mouth, e = S.pour;
            const a = mixPt(m, e, k0), b = mixPt(m, e, k1), mid = [lerp(a[0], b[0], .5), Math.min(a[1], b[1]) - U * .06];
            p.g(); p.line([a, mid, b], { w: 3.6, color: 'rgba(31,26,23,.5)', amp: .3 });
            if (k1 >= 1) { p.g(); p.circ(e[0], e[1], U * .07, { sx: 1.3, sy: .9, fill: 'rgba(31,26,23,.3)', w: .7, n: 10, amp: U * .012 }); for (let i = 0; i < 5; i++) { const a = -Math.PI * (.1 + i * .2); p.circ(e[0] + Math.cos(a) * U * (.12 + .03 * Math.sin(t * 40 + i)), e[1] + Math.sin(a) * U * .1, U * .014, { fill: INK, stroke: false, n: 6 }); } }
          }
        }
      }
    };

    /* ═════════ B5. THE DENTIST — forceps, a foot on the frame, a wiggle. It had roots. ═════════ */
    GAGS.B_dentist = {
      name: 'The Dentist', dur: 3.9, ones: [[1.66, 1.86]],
      cues: [[0.05, 'footsteps'], [0.6, 'forceps-click'], [0.76, 'creak'], [1.02, 'creak'], [1.28, 'creak'], [1.56, 'strain'], [1.7, 'pop'], [1.74, 'stumble'], [2.42, 'satisfied-hm'], [2.66, 'footsteps']],
      setup(S) {
        const { U, G, c, W } = S;
        S.xs = c.x + c.w * .3; S.x0 = -U * .55;
        S.gp = [S.xs - c.x + U * .2, c.h + 5 - U * .6];   // grip point, card-local (just in front of him)
        S.cardWrap.setAttribute('clip-path', `url(#${S.id}fl)`);
        S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}fl"><rect x="-2000" y="-2000" width="${W + 4000}" height="${G + 2.5 + 2000}"/></clipPath>`);
        const rp = new Pen(0, U, S.seed), w = c.w, h = c.h;
        const root = (x0, x1, xt, len) => [[x0, h - 3], [x0 + (xt - x0) * .2, h + len * .35], [x0 + (xt - x0) * .6, h + len * .78], [xt, h + len], [x1 - (x1 - xt) * .55, h + len * .74], [x1 - (x1 - xt) * .2, h + len * .32], [x1, h - 3]];
        rp.g({ halo: false });
        rp.shape(root(w * .14, w * .44, w * .27, U * .52), { fill: '#fff', w: 2.2, amp: .6 });
        rp.shape(root(w * .56, w * .86, w * .74, U * .46), { fill: '#fff', w: 2.2, amp: .6 });
        rp.line([[w * .2, h + U * .05], [w * .27, h + U * .36]], { w: .7, color: 'rgba(31,26,23,.35)' });
        rp.line([[w * .62, h + U * .05], [w * .72, h + U * .3]], { w: .7, color: 'rgba(31,26,23,.35)' });
        S.over.innerHTML = `<g class="roots" style="display:none">${rp.svg()}</g>`;
        S.roots = S.over.querySelector('.roots');
        S.xw = c.x + c.w * .3 - U * .1;
      },
      card(S, t) {   // card transform at t
        const { U, c } = S, pv = { px: c.w / 2, py: c.h + U * .25 };
        if (t < .76) return pv;
        if (t < 1.56) { const k = seg(t, .76, 1.56), a = lerp(2.2, 5, k) * Math.sin((t - .76) / .26 * Math.PI * 2); return Object.assign({}, pv, { rot: a, ty: -k * U * .04 }); }
        if (t < 1.7) { const k = seg(t, 1.56, 1.7); return Object.assign({}, pv, { ty: -U * (.04 + .06 * k), sy: 1 + .02 * k }); }
        let ty = -U * .1, rot = 0, tx = 0;
        if (t < 1.84) { const k = E.out(seg(t, 1.7, 1.82)); ty = -lerp(U * .1, U * .66, k); rot = -5 * Math.sin(k * Math.PI); }
        else { ty = -U * .62 - Math.sin((t - 1.84) * 9) * U * .015 * (1 - seg(t, 1.84, 2.3)); rot = Math.sin((t - 1.84) * 5) * 1.5; }
        if (t >= 2.66) tx = this.walkX(S, t) - S.xw;
        return Object.assign({}, pv, { ty, rot, tx });
      },
      walkX(S, t) { const { U, W, c } = S; return lerp(S.xw, W + c.w * .55 + U * .4, E.in(seg(t, 2.66, 3.6)) * .4 + seg(t, 2.66, 3.6) * .6); },
      draw(S, t, p) {
        const { U, G, c } = S, cx = this.card(S, t);
        S.setCard(cx);
        S.roots.style.display = t >= .76 ? '' : 'none';
        const grip = S.cardPt(S.gp[0], S.gp[1], cx);
        const xs = S.xs, A = stand(S, xs);
        let P;
        if (t < .45) { P = walk(S, { face: 1, look: 0, brow: 0 }, t, 0, .45, S.x0, xs); }
        else {
          P = track([
            [.45, { hip: A(0, .415), face: 1, lean: .02, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0) }],
            [.62, { lean: .08, look: .2 }],
            [.76, { hip: A(-.1, .43), lean: -.12, fR: [xs + U * .2, G - U * .26], fL: A(-.14, 0), kb: null }],
            [1.56, {}],
            [1.68, { hip: A(-.16, .4), lean: -.32 }],
            [1.8, { hip: A(-.28, .38), lean: -.18, fR: A(-.12, 0), fL: A(-.4, 0) }, 'out'],
            [1.98, { hip: A(-.2, .415), lean: 0, fL: A(-.28, 0), fR: A(-.12, 0), look: -.9, hd: [0, -U * .02] }],
            [2.18, { tilt: .2, hd: [U * .01, -U * .02] }],
            [2.34, { tilt: 0, face: 0, look: 0, brow: 1, hd: [0, 0] }],
            [2.5, { hd: [0, U * .012] }], [2.58, { hd: [0, 0] }],
          ])(t);
          if (t >= .76 && t < 1.56) { const r = cx.rot || 0; P.hip = [P.hip[0] + r * U * .006, P.hip[1]]; P.lean = (P.lean || 0) + r * .01; }
          if (t >= 2.66) { const x = this.walkX(S, t), w = walk(S, P, t, 2.66, 3.6, S.xw - U * .1, S.xw - U * .1 + 600, { x: x - U * .1, carry: true, face: 1 }); P = Object.assign(P, w); P.brow = 0; P.tilt = 0; }
        }
        // hands on the forceps handles, forceps on the grip
        const fl = U * .17, hand0 = [grip[0] - fl, grip[1] + U * .05];
        P.hR = t < .45 ? [P.hip[0] + U * .1, G - U * .45] : t < .62 ? mixPt([xs + U * .1, G - U * .45], hand0, E.io(seg(t, .45, .62))) : hand0;
        P.hL = [P.hR[0] - U * .04, P.hR[1] + U * .03];
        if (t >= 1.7) { P.hR = [grip[0] - fl * .55, grip[1] + fl * .85]; P.hL = [P.hR[0] - U * .03, P.hR[1] + U * .04]; }
        // the socket left in the floor
        if (t >= 1.72) {
          const x0 = c.x + c.w / 2 + (t >= 2.66 ? 0 : 0);
          p.g({ halo: false });
          p.circ(x0, G + 1, c.w * .4, { sy: .06, fill: WASH2, w: .9, n: 16 });
          p.circ(x0 - c.w * .05, G + 1.5, c.w * .26, { sy: .045, fill: 'rgba(31,26,23,.3)', stroke: false, n: 14 });
          if (t < 2.0) for (let i = 0; i < 6; i++) { const k = seg(t, 1.72, 2.0), a = -Math.PI * (.15 + i * .14); p.circ(x0 + Math.cos(a) * c.w * .45 * (.6 + k * .5), G - Math.sin(-a) * U * .25 * Math.sin(k * Math.PI) - 2, U * .012, { fill: INK, stroke: false, n: 5 }); }
        }
        if (t >= 1.7 && t < 1.8) burst(p, [c.x + c.w / 2, G - U * .05], U * .12, U * .24, 8, -.2, .9);
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hat: 'hair', hatFn: COS.mirror, faceFn: COS.mask, body: COS.coat });
        // forceps
        if (t >= .45) {
          const h = J.hR, dv = [grip[0] - h[0], grip[1] - h[1]], d = Math.hypot(dv[0], dv[1]) || 1, u = [dv[0] / d, dv[1] / d], n = [-u[1], u[0]];
          const piv = [grip[0] - u[0] * U * .07, grip[1] - u[1] * U * .07], open = t < .58 ? .03 : .012;
          p.g();
          p.line([[h[0] + n[0] * U * .025, h[1] + n[1] * U * .025], piv, [grip[0] - n[0] * U * open, grip[1] - n[1] * U * open]], { w: 1.15 });
          p.line([[h[0] - n[0] * U * .025, h[1] - n[1] * U * .025], piv, [grip[0] + n[0] * U * open, grip[1] + n[1] * U * open]], { w: 1.15 });
          p.dot(piv[0], piv[1], U * .012);
        }
        if (t >= 1.56 && t < 1.7) { p.g({ halo: false }); const h = J.hc; for (let i = 0; i < 3; i++) p.line([[h[0] + U * (.14 + i * .02), h[1] - U * (.12 - i * .1)], [h[0] + U * (.2 + i * .02), h[1] - U * (.14 - i * .1)]], { w: .6 }); }
      }
    };

    /* ═════════ B6. THE MAIL CARRIER — postmarked, folded until it fits, posted, flag up ═════════ */
    GAGS.B_mail = {
      name: 'The Mail Carrier', dur: 4.0, ones: [[.74, 1.74]],
      cues: [[0.05, 'footsteps'], [0.62, 'stamp-thunk'], [0.76, 'fold'], [0.92, 'fold'], [1.08, 'fold'], [1.24, 'fold'], [1.4, 'fold'], [1.56, 'fold'], [1.84, 'paper-pickup'], [2.0, 'footsteps'], [2.36, 'mailbox-door'], [2.58, 'mailbox-shut'], [2.76, 'flag-ping'], [3.1, 'cap-tip']],
      setup(S) {
        const { U, G, c } = S;
        S.xs = c.x + c.w * .26; S.x0 = -U * .55;
        S.xm = c.x + c.w * .74;   // mailbox post
        S.post = G - U * .5;
        // fold plan: V = top half down, H = right half over to the left
        let R = { x: c.x, y: c.y, w: c.w, h: c.h };
        S.folds = [];
        ['V', 'H', 'V', 'H', 'V', 'H'].forEach((k, i) => {
          const after = k === 'V' ? { x: R.x, y: R.y + R.h / 2, w: R.w, h: R.h / 2 } : { x: R.x, y: R.y, w: R.w / 2, h: R.h };
          S.folds.push({ k, from: R, to: after, t0: .76 + i * .16, t1: .76 + i * .16 + .13 });
          R = after;
        });
        S.final = R;
        // the postmark (card-local), then a copy of the card for the first fold's flap
        const pm = new Pen(0, U, S.seed + 3), mx = S.mx = c.w * .26 + U * .3, my = S.my = c.h + 5 - U * .84;
        pm.g({ halo: false });
        pm.circ(mx, my, U * .1, { w: 1.1, color: 'rgba(31,26,23,.8)', n: 12 });
        pm.circ(mx, my, U * .065, { w: .6, color: 'rgba(31,26,23,.7)', n: 10 });
        for (let i = 0; i < 4; i++) { const y = my - U * .06 + i * U * .04, pts = []; for (let j = 0; j <= 10; j++) pts.push([mx + U * .14 + j * U * .045, y + Math.sin(j * 1.3) * U * .012]); pm.line(pts, { w: .9, color: 'rgba(31,26,23,.8)' }); }
        S.over.innerHTML = `<g class="pm" style="display:none">${pm.svg()}</g>`;
        S.pm = S.over.querySelector('.pm');
        S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}bot"><rect x="-20" y="${c.h / 2}" width="${c.w + 40}" height="${c.h}"/></clipPath><clipPath id="${S.id}top"><rect x="-20" y="-20" width="${c.w + 40}" height="${c.h / 2 + 20}"/></clipPath>`);
        S.flap = S.cardIn.cloneNode(true);
        S.flap.setAttribute('clip-path', `url(#${S.id}top)`);
        S.flap.style.display = 'none';
        S.card.appendChild(S.flap);
      },
      pose(S, t) {
        const { U, G } = S, xs = S.xs, A = stand(S, xs), F = S.final;
        if (t < .45) { const P = walk(S, { face: 1, look: 0, brow: 0 }, t, 0, .45, S.x0, xs); P.hR = [P.hip[0] + U * .1, G - U * .5]; P.hL = [P.hip[0] - U * .1, G - U * .44]; return P; }
        const pk = [F.x + F.w * .5, F.y + F.h * .5];
        const keys = [
          [.45, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hR: A(.12, .5), hL: A(-.1, .44) }],
          [.56, { hR: A(.24, .96), lean: .05 }],
          [.62, { hR: A(.3, .86), lean: .1 }, 'in'],
          [.7, { hR: A(.16, .56), lean: 0 }],
          [.76, { hR: A(-.12, .4) }],
        ];
        S.folds.forEach((f, i) => { const v = f.k === 'V'; keys.push([f.t0 + .02, { hR: v ? A(.2, .95 - i * .1) : A(.42, .55), hL: v ? A(.05, .9 - i * .1) : A(.32, .5), face: v ? 1 : .6, look: v ? -.2 + i * .2 : .4 }]); keys.push([f.t1, { hR: v ? A(.22, .5 - i * .04) : A(-.02, .5), hL: v ? A(.08, .45) : A(-.1, .48) }, 'in']); });
        keys.push([1.76, { hip: A(-.06, .3), lean: -.5, look: .7, face: -1, hR: [pk[0], pk[1]], hL: A(.02, .3), fL: A(-.14, 0), fR: A(.06, 0) }]);
        keys.push([1.88, {}]);
        keys.push([2.0, { hip: A(0, .415), lean: 0, look: 0, face: 1, hR: A(.12, .5), hL: A(-.1, .44), fL: A(-.07, 0), fR: A(.07, 0) }]);
        let P = track(keys)(t);
        const xb = S.xm - U * .48;
        if (t >= 2.0) {
          const B = stand(S, xb);
          P = walk(S, P, t, 2.0, 2.3, xs, xb, { carry: true });
          P = Object.assign(P, track([
            [2.0, { hR: A(.12, .5), hL: A(-.1, .44), look: 0, brow: 0, hd: [0, 0] }],
            [2.3, { hR: B(.18, .52), hL: B(-.1, .44) }],
            [2.36, { hL: B(.24, .5) }],
            [2.42, { hL: B(.12, .46), hR: B(.2, .62) }],
            [2.54, { hR: B(.36, .62) }],
            [2.6, { hR: B(.24, .58) }],
            [2.66, { hL: B(.27, .5) }],
            [2.7, { hL: B(.12, .46), hR: B(.62, .66) }],
            [2.82, { hR: B(.66, .9) }, 'out'],
            [2.94, { hR: B(.14, .5) }],
            [3.04, { face: 0, brow: 1 }],
            [3.12, { hR: B(.1, .98) }],
            [3.2, { hR: B(.16, 1.0) }],
            [3.34, { hR: B(.14, .5) }],
          ])(t));
          if (t >= 2.3) P.face = t < 3.04 ? 1 : 0;
        }
        return P;
      },
      draw(S, t, p) {
        const { U, G, c } = S, P = this.pose(S, t);
        S.pm.style.display = t >= .62 ? '' : 'none';
        // card: first fold uses the real card (top half flips down over the postmark), then it's a paper packet
        const f1 = S.folds[0];
        S.flap.style.display = 'none'; S.cardIn.removeAttribute('clip-path'); S.flap.removeAttribute('transform');
        let packet = null, flapR = null, shade = 0;
        if (t >= f1.t0 && t < f1.t1) {
          const u = seg(t, f1.t0, f1.t1), cs = Math.cos(Math.PI * E.io(u));
          S.cardIn.setAttribute('clip-path', `url(#${S.id}bot)`);
          if (cs > 0) { S.flap.style.display = ''; S.flap.setAttribute('transform', `translate(0 ${c.h / 2}) scale(1 ${Math.max(.02, cs).toFixed(3)}) translate(0 ${-c.h / 2})`); }
          else { flapR = { x: c.x, y: c.y + c.h / 2, w: c.w, h: c.h / 2 * -cs }; shade = 1 + cs; }
        } else if (t >= f1.t1) {
          S.setCard({ hide: true });
          let F = null; for (const f of S.folds) if (t >= f.t0) F = f;
          if (F === f1 || t >= F.t1) packet = F.to;
          else {
            const u = seg(t, F.t0, F.t1), cs = Math.cos(Math.PI * E.io(u)), R = F.from;
            packet = F.to; shade = 1 - Math.abs(cs);
            if (F.k === 'V') { const yf = R.y + R.h / 2, hh = R.h / 2 * cs; flapR = { x: R.x, y: Math.min(yf, yf - hh), w: R.w, h: Math.abs(hh) }; }
            else { const xf = R.x + R.w / 2, ww = R.w / 2 * cs; flapR = { x: Math.min(xf, xf + ww), y: R.y, w: Math.abs(ww), h: R.h }; }
            if (cs > 0) { p.g(); p.shape(bRect(packet.x, packet.y, packet.w, packet.h), { fill: '#fff', w: 1.1 }); }
          }
        }
        // carried packet
        const F = S.final;
        let carried = null;
        if (t >= 1.8) {
          if (t < 2.5) carried = [P.hR[0], P.hR[1] - F.h * .3];
          else if (t < 2.58) { const k = seg(t, 2.5, 2.58); carried = mixPt([P.hR[0], P.hR[1] - F.h * .3], [S.xm, S.post - U * .1], k); }
          if (carried) packet = { x: carried[0] - F.w / 2, y: carried[1] - F.h / 2, w: F.w, h: F.h };
          else packet = null;
        }
        // mailbox (the packet goes in behind its body)
        const xm = S.xm, by = S.post, L = U * .44, H = U * .21, x0 = xm - L / 2, x1 = xm + L / 2;
        p.g();
        p.line([[xm, G], [xm, by]], { w: 1.8 });
        const doorOpen = t >= 2.34 && t < 2.6 ? 1 : 0;
        p.shape([[x0, by], [x0, by - H * .62], [x0 + H * .1, by - H * .92], [x0 + H * .3, by - H], [x0 + H * .5, by - H * .92], [x0 + H * .6, by - H * .62], [x0 + H * .6, by]], { fill: doorOpen ? WASH2 : '#fff', w: 1 });
        if (packet && t >= 1.8) { p.g(); p.shape(bRect(packet.x, packet.y, packet.w, packet.h), { fill: '#fff', w: 1 }); p.line([[packet.x + 2, packet.y + packet.h * .5], [packet.x + packet.w - 2, packet.y + packet.h * .5]], { w: .45, halo: false, color: 'rgba(31,26,23,.4)' }); p.g(); }
        p.shape([[x0 + H * .6, by], [x0 + H * .6, by - H * .62], [x0 + H * .7, by - H * .92], [x0 + H * .9, by - H], [x1 - H * .1, by - H], [x1, by - H * .7], [x1, by]], { fill: '#fff', w: 1 });
        p.line([[x0 + H * .9, by - H * .78], [x1 - H * .2, by - H * .78]], { w: .45, halo: false, color: 'rgba(31,26,23,.35)' });
        if (doorOpen) p.shape([[x0, by], [x0 + H * .6, by], [x0 + H * .55, by + H * .55], [x0 - H * .05, by + H * .5]], { fill: '#fff', w: .9 });
        // the flag: down until he raises it
        const fk = E.back(seg(t, 2.7, 2.84)), fa = lerp(Math.PI * .5, Math.PI * 1.5, fk) + Math.PI * .0, fp = [x1 + U * .015, by - H * .55];
        // flag on the far side: hangs down beside the box, swings up to vertical
        const fe = [fp[0] + Math.cos(fa) * U * .24, fp[1] + Math.sin(fa) * U * .24], fn = [Math.cos(fa - Math.PI / 2), Math.sin(fa - Math.PI / 2)];
        p.line([fp, fe], { w: 1.1 });
        const fb = [fp[0] + Math.cos(fa) * U * .13, fp[1] + Math.sin(fa) * U * .13];
        p.shape([fb, fe, [fe[0] + fn[0] * U * .075, fe[1] + fn[1] * U * .075], [fb[0] + fn[0] * U * .075, fb[1] + fn[1] * U * .075]], { fill: INK, w: .7 });
        p.dot(fp[0], fp[1], U * .014);
        if (t >= 2.82 && t < 2.94) burst(p, fe, U * .05, U * .1, 5, -2.2, .6);
        // the packet on the floor + folding flap (drawn over the card area)
        if (packet && t < 1.8) { p.g(); p.shape(bRect(packet.x, packet.y, packet.w, packet.h), { fill: '#fff', w: 1.1 }); }
        if (flapR) { p.g(); p.shape(bRect(flapR.x, flapR.y, flapR.w, flapR.h), { fill: shade > .55 ? '#F1EEEA' : '#fff', w: 1.1 }); }
        if (t >= .62 && t < .72) burst(p, [c.x + S.mx, c.y + S.my], U * .14, U * .22, 7, .2, .7);
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hatFn: COS.postal, body: COS.satchel });
        // the rubber stamp until it goes in the bag
        if (t < .78) { const h = J.hR; p.g(); p.shape(bRect(h[0] - U * .035, h[1] - U * .005, U * .07, U * .035), { fill: INK, w: .6 }); p.line([[h[0], h[1] - U * .005], [h[0], h[1] - U * .05]], { w: 1.2 }); p.circ(h[0], h[1] - U * .06, U * .018, { fill: '#fff', w: .7, n: 7 }); }
      }
    };

    /* ═════════ B7. THE CHEF — a splash of brandy, one match, flambé. Garnish. ═════════ */
    const FLAME = [[-.5, 0], [-.6, -.2], [-.52, -.4], [-.34, -.56], [-.44, -.72], [-.2, -.66], [-.12, -.82], [.06, -1.0], [.1, -.82], [.26, -.64], [.38, -.74], [.4, -.5], [.58, -.26], [.5, 0]];
    function flameTongue(p, x, y, h, w, ph) {   // a licking cartoon flame: base at (x, y), height h, half-width w
      if (h < 2) return;
      const pts = FLAME.map(([u, v], i) => { const k = -v; return [x + (u + Math.sin(ph + k * 3.2) * .22 * k + (i % 3 === 1 ? Math.sin(ph * 1.9 + i) * .08 : 0)) * w * 2, y + v * h * (1 + (i % 4 === 2 ? Math.sin(ph * 2.3 + i) * .08 : 0))]; });
      p.shape(pts, { fill: '#fff', w: .95 });
      const inner = pts.map(([a, b]) => [x + (a - x) * .5, y - (y - b) * .55]);
      p.shape(inner, { fill: WASH2, stroke: false, halo: false });
    }
    GAGS.B_chef = {
      name: 'The Chef', dur: 4.0, ones: [[1.12, 1.46]],
      cues: [[0.05, 'footsteps'], [0.58, 'splash'], [0.72, 'splash'], [0.98, 'match-strike'], [1.16, 'whoomph'], [1.4, 'crackle-loop'], [2.38, 'fire-out'], [2.56, 'wave-smoke'], [3.04, 'garnish-plink'], [3.38, 'hm']],
      setup(S) {
        const { U, G, c } = S;
        S.xs = c.x + c.w * .28; S.x0 = -U * .55;
        S.touch = [c.x + c.w * .28 + U * .44, G - U * .5];
        S.pile = [c.x + c.w * .28 + U * .52, G];
        S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}b" maskUnits="userSpaceOnUse" x="-40" y="-60" width="${c.w + 80}" height="${c.h + 120}"><polygon class="bf" fill="#fff"/></mask>`);
        S.cardIn.setAttribute('mask', `url(#${S.id}b)`);
        S.bf = S.defs.querySelector('.bf');
        S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}bc"><rect x="0" y="0" width="${c.w}" height="${c.h}" rx="${S.F.radius}"/><rect x="${S.F.shadow}" y="${S.F.shadow}" width="${c.w}" height="${c.h}" rx="${S.F.radius}"/></clipPath>`);
        S.over.innerHTML = `<polyline class="char" clip-path="url(#${S.id}bc)" fill="none" stroke="rgba(31,26,23,.62)" stroke-width="${(U * .075).toFixed(1)}" stroke-linejoin="round"/>`;
        S.char = S.over.querySelector('.char');
        const A = stand(S, S.xs);
        S.trk = track([
          [.45, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(.12, .48), hR: A(-.1, .44), ba: 0 }],
          [.54, { hL: A(.4, .66), lean: .08 }],
          [.6, { ba: 2.1 }, 'out'], [.66, { ba: 1.1 }], [.74, { ba: 2.3 }, 'out'],
          [.84, { ba: 0, hL: A(.12, .48), lean: 0 }],
          [.92, { hR: A(-.1, .16), hip: A(-.01, .38), lean: -.06 }],
          [.99, { hR: A(-.02, .62), hip: A(0, .415), lean: 0 }, 'out'],
          [1.12, { hR: [S.touch[0] - U * .13, S.touch[1] + U * .03], lean: .1, look: .3 }],
          [1.16, {}],
          [1.26, { hip: A(-.07, .415), lean: -.2, hR: A(-.04, .5), brow: 1, look: -.4, hd: [-U * .02, 0] }, 'out'],
          [1.5, { lean: -.04, hd: [0, 0], look: -.6 }],
          [2.3, { look: .6 }],
          [2.42, { brow: 0 }],
          [2.5, { hR: A(.22, .78) }], [2.58, { hR: A(.16, .62) }], [2.66, { hR: A(.24, .8) }], [2.74, { hR: A(.16, .62) }],
          [2.84, { hR: A(-.05, .5), look: .5 }],
          [2.98, { hip: A(.06, .33), lean: .42, hR: [S.pile[0] - U * .01, G - U * .16], look: .9 }],
          [3.08, {}],
          [3.22, { hip: A(0, .415), lean: 0, hR: A(-.06, .46), look: .2 }],
          [3.36, { face: 0, look: 0, brow: 1 }],
        ]);
      },
      frontY(S, t) { const { c } = S; return t < 1.38 ? -40 : lerp(-14, c.h + 16, E.io(seg(t, 1.38, 2.36))); },
      frontPts(S, t) {
        const { U, c } = S, yb = this.frontY(S, t), pts = [];
        for (let x = -24; x <= c.w + 32; x += 11) pts.push([x, yb + Math.sin(x * .07 + t * 8) * U * .03 + Math.sin(x * .19 - t * 5) * U * .015]);
        return pts;
      },
      draw(S, t, p) {
        const { U, G, c } = S, P = S.trk(t);
        if (t < .45) Object.assign(P, walk(S, P, t, 0, .45, S.x0, S.xs)), P.hL = [P.hip[0] + U * .12, G - U * .48], P.hR = [P.hip[0] - U * .1, G - U * .44];
        // the burn: mask everything above the front; a char line rides it
        const fp = this.frontPts(S, t), str = q => q.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
        S.bf.setAttribute('points', str(fp.concat([[c.w + 32, c.h + 50], [-24, c.h + 50]])));
        S.char.setAttribute('points', t >= 1.38 ? str(fp.map(([x, y]) => [x, y + U * .015])) : '');
        if (t >= 2.4) S.setCard({ hide: true });
        // ash pile (grows as it burns), its garnish
        const ak = seg(t, 1.5, 2.4);
        if (ak > 0) {
          const [px, py] = S.pile, aw = U * .3 * Math.sqrt(ak), ah = U * .1 * ak;
          p.g();
          const dome = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; dome.push([px + Math.cos(a) * aw, py + Math.sin(a) * ah - (i % 2) * ah * .12]); }
          p.shape(dome, { fill: '#D9D3CB', w: .8 });
          [[-.4, .4], [.1, .6], [.35, .3]].forEach(([dx, dy]) => p.dot(px + dx * aw, py - dy * ah, 1));
          if (t >= 3.04) { const s0 = [px + U * .02, py - ah - 1]; p.g(); p.line([s0, [s0[0] + U * .02, s0[1] - U * .1]], { w: .9 }); [[-.04, -.06], [.055, -.075], [.0, -.115], [.05, -.03]].forEach(([dx, dy]) => p.circ(s0[0] + U * dx, s0[1] + U * dy, U * .026, { fill: '#fff', w: .8, n: 7 })); }
        }
        // smoke wisps
        if (t >= 1.45 && t < 3.3) {
          p.g({ halo: false });
          for (let i = 0; i < 7; i++) {
            const t0 = 1.45 + i * .15, k = seg(t, t0, t0 + .9); if (k <= 0 || k >= 1) continue;
            const x = c.x + c.w * (.1 + rnd(S.seed + 71, i) * .8), y0 = c.y + this.frontY(S, t0) - U * .1, pts = [];
            for (let j = 0; j < 6; j++) { const q = j / 5; pts.push([x + Math.sin(q * 4 + t * 5 + i) * U * .05 * q, y0 - k * U * .5 - q * U * .3]); }
            p.line(pts, { w: .8, color: `rgba(31,26,23,${(.4 * (1 - k)).toFixed(2)})`, amp: .2 });
          }
          if (t >= 2.36) for (let i = 0; i < 2; i++) { const k = seg(t, 2.36 + i * .25, 3.3), pts = []; for (let j = 0; j < 6; j++) { const q = j / 5; pts.push([S.pile[0] + Math.sin(q * 5 + t * 4 + i * 2) * U * .04 * q, S.pile[1] - U * .1 - k * U * .3 - q * U * .32]); } p.line(pts, { w: .7, color: `rgba(31,26,23,${(.4 * (1 - k)).toFixed(2)})`, amp: .2 }); }
        }
        // fire: a whoomph up the card, then flames riding the front down
        p.g();
        if (t >= 1.15 && t < 1.5) {
          const k = t < 1.24 ? E.out(seg(t, 1.15, 1.24)) : 1 - E.in(seg(t, 1.24, 1.5));
          [3, 0, 5, 1, 4, 2].forEach(i => flameTongue(p, c.x + c.w * (.1 + i * .16), G - 3, U * (1.25 + rnd(i, 3) * .95) * k, U * (.17 + rnd(i, 4) * .06), t * 13 + i * 1.7));
        }
        if (t >= 1.36 && t < 2.42) {
          const fade = t > 2.3 ? 1 - seg(t, 2.3, 2.42) : 1;
          fp.forEach(([x, y], i) => { if (i % 3 || x < 6 || x > c.w - 6 || y < -4 || y > c.h + 2) return; flameTongue(p, c.x + x, c.y + y + U * .03, U * (.2 + rnd(i, 7) * .2) * fade, U * (.07 + rnd(i, 8) * .03), t * 15 + i); });
        }
        // splashes
        if (t >= .58 && t < .86) { p.g({ halo: false }); [[.58, [c.x + c.w * .55, G - U * 1.05]], [.72, [c.x + c.w * .66, G - U * .78]]].forEach(([t0, e]) => { const k = seg(t, t0, t0 + .12); if (k <= 0 || k >= 1) return; const m = [P.hL[0] + U * .16, P.hL[1] + U * .06]; for (let i = 0; i < 4; i++) { const q = clamp(k * 1.2 - i * .08, 0, 1); p.circ(lerp(m[0], e[0] + i * U * .03, q), lerp(m[1], e[1], q) - Math.sin(q * Math.PI) * U * .18, U * .014, { fill: INK, stroke: false, n: 6 }); } }); }
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hatFn: COS.toque, mustache: true, body: costume(COS.apron, COS.kerchief) });
        // bottle by the neck
        { const h = J.hL, T = pts => pts.map(([x, y]) => rot([h[0] + x * U, h[1] + y * U], h, P.ba || 0));
          p.g(); p.shape(T([[-.025, -.17], [.025, -.17], [.025, -.09], [.05, -.05], [.05, .12], [-.05, .12], [-.05, -.05], [-.025, -.09]]), { fill: INK, w: .8 });
          p.shape(T([[-.04, -.02], [.04, -.02], [.04, .05], [-.04, .05]]), { fill: '#fff', w: .5, halo: false }); }
        // the match
        if (t >= .88 && t < 1.3) {
          const h = J.hR, a = t < 1.0 ? -1.2 : -.25, tip = [h[0] + Math.cos(a) * U * .12, h[1] + Math.sin(a) * U * .12];
          p.g(); p.line([h, tip], { w: .8 }); p.dot(tip[0], tip[1], U * .012);
          if (t >= .99) flameTongue(p, tip[0], tip[1] - U * .005, U * .07, U * .022, t * 30);
          if (t >= .97 && t < 1.04) burst(p, tip, U * .03, U * .07, 5, 0, .6);
        }
      }
    };

    /* ═════════ B8. THE MIME — an invisible rope. It pulls back. He wins, hand over hand. ═════════ */
    GAGS.B_mime = {
      name: 'The Mime', dur: 4.0, ones: [[.78, 1.16], [1.36, 2.34]],
      cues: [[0.05, 'tiptoe'], [0.6, 'silence'], [0.8, 'strain'], [1.0, 'rope-yank'], [1.4, 'heave'], [1.64, 'heave'], [1.88, 'heave'], [2.12, 'heave'], [2.42, 'coil-swish'], [3.1, 'bow']],
      setup(S) {
        const { U, G, c } = S;
        S.xm = c.x + c.w * .3; S.x0 = -U * .55; S.ry = G - U * .58;
        S.D = c.x + c.w + 16;
        S.pulls = [1.36, 1.6, 1.84, 2.08];
        const A = stand(S, S.xm), ry = S.ry, xm = S.xm;
        S.trk = track([
          [.55, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 1, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hR: A(.12, .45), hL: A(-.1, .45) }],
          [.68, { hR: [xm + U * .38, ry], hL: [xm + U * .26, ry + U * .01], lean: .1 }, 'out'],
          [.76, {}],
          [.94, { hip: A(-.08, .4), lean: -.32, hR: [xm + U * .14, ry + U * .02], hL: [xm + U * .03, ry + U * .03], fL: A(-.17, 0), fR: A(.06, 0) }],
          [1.0, {}],
          [1.1, { hip: A(.16, .41), lean: .34, hR: [xm + U * .52, ry - U * .01], hL: [xm + U * .42, ry], fL: A(.0, .04), fR: A(.27, 0) }, 'out'],
          [1.18, { fL: A(.04, 0) }],
          [1.32, { hip: A(.0, .38), lean: -.16, fL: A(-.15, 0), fR: A(.13, 0), hR: [xm + U * .32, ry], hL: [xm + U * .2, ry + U * .01] }],
        ]);
      },
      cardX(S, t) { let x = 0; S.pulls.forEach(t0 => { x -= S.D / 4 * E.out(seg(t, t0 + .06, t0 + .2)); }); return x; },
      draw(S, t, p) {
        const { U, G, c } = S, xm = S.xm, ry = S.ry, A = stand(S, xm);
        let P = S.trk(t);
        if (t < .55) { P = walk(S, P, t, 0, .55, S.x0, xm, { lift: .12, stride: .5 }); P.brow = 1; P.hR = [P.hip[0] + U * .1, G - U * .55 - Math.abs(Math.sin(t * 11)) * U * .05]; P.hL = [P.hip[0] - U * .12, G - U * .5]; }
        if (t >= .78 && t < 1.0) P.hip = [P.hip[0] + ((Math.floor(t * 24) % 2) ? 1 : -1) * U * .01, P.hip[1]];
        // hand over hand
        if (t >= 1.36 && t < 2.36) {
          const n = Math.min(3, Math.floor((t - 1.36) / .24)), u = (t - 1.36 - n * .24) / .24, lead = n % 2 ? 'hL' : 'hR', other = n % 2 ? 'hR' : 'hL';
          const front = [xm + U * .4, ry - U * .01], back = [xm - U * .02, ry + U * .04], mid = [xm + U * .14, ry + U * .02];
          P = Object.assign({}, P, { hip: A(-.02 - .04 * Math.sin(u * Math.PI), .39), lean: -.12 - .18 * Math.sin(u * Math.PI), fL: A(-.15, 0), fR: A(.13, 0) });
          P[lead] = u < .25 ? mixPt(mid, front, E.out(u / .25)) : mixPt(front, back, E.io((u - .25) / .75));
          P[other] = u < .25 ? mixPt(back, mid, E.io(u / .25)) : mid;
        }
        if (t >= 2.36) {
          P = Object.assign({}, P, track([
            [2.36, { hip: A(-.02, .41), lean: -.04, fL: A(-.1, 0), fR: A(.1, 0), hL: [xm + U * .08, ry - U * .02], hR: [xm + U * .14, ry + U * .02], face: 1, look: .4, brow: 1 }],
            [2.76, {}],
            [2.88, { hR: [xm - U * .02, ry - U * .2], hL: [xm + U * .04, ry - U * .16] }],
            [2.96, { hL: A(-.12, .45), hR: A(.12, .45), look: 0 }],
            [3.06, { face: 0 }],
            [3.22, { lean: .55, hip: A(-.06, .4), hR: [xm + U * .02, ry + U * .02], hL: A(-.3, .55) }],
            [3.4, {}],
            [3.52, { lean: 0, hip: A(-.02, .415), hR: A(.12, .45), hL: A(-.12, .45) }],
          ])(t));
          if (t < 2.76) { const a = (t - 2.36) / .4 * Math.PI * 4, cc = [xm + U * .14, ry + U * .1]; P.hR = [cc[0] + Math.cos(a) * U * .1, cc[1] + Math.sin(a) * U * .09]; }
        }
        S.setCard({ tx: this.cardX(S, t), rot: S.pulls.reduce((r, t0) => r - bump(t, t0 + .04, t0 + .26) * 1.6, 0), px: 0, py: c.h });
        shadow(p, P.hip[0], G, U * .2);
        bFig(p, S, P, { hat: 'hair', body: COS.stripes, gloves: true });
        if (t >= .96 && t < 1.12) { p.g({ halo: false }); for (let i = 0; i < 3; i++) p.line([[xm - U * (.24 + i * .05), G - U * (.3 + i * .14)], [xm - U * (.36 + i * .05), G - U * (.3 + i * .14)]], { w: .6, color: 'rgba(31,26,23,.5)' }); }
      }
    };

    /* ═════════ B9. THE ELECTRICIAN — pulls the plug; it switches off like an old set. Checks it. Pulls it again. ═════════ */
    GAGS.B_electric = {
      name: 'The Electrician', dur: 3.9, ones: [[.84, 1.28], [1.78, 2.3]],
      cues: [[0.05, 'footsteps'], [0.62, 'knees-creak'], [0.86, 'plug-pop'], [0.88, 'tv-off-zip'], [1.22, 'tv-off-pip'], [1.78, 'plug-in'], [1.8, 'tv-on-thunk'], [2.06, 'plug-pop'], [2.08, 'tv-off-zip'], [2.84, 'belt-pouch'], [3.2, 'nod']],
      setup(S) {
        const { U, G, c } = S;
        S.xs = c.x + c.w * .2; S.xp = S.xs + U * .5; S.sock = [S.xp - U * .17, G - U * .13];
        S.x0 = -U * .55;
        S.cordEnd = c.x + c.w * .74;
        const A = stand(S, S.xs), sk = [S.sock[0], S.sock[1] - U * .06];
        S.trk = track([
          [.45, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hR: A(.12, .45), hL: A(-.1, .44) }],
          [.62, { hip: A(.02, .26), lean: .22, fL: A(-.13, 0), fR: A(.1, 0), hR: sk, hL: A(.02, .24), look: .8, kb: [-1, -1] }],
          [.8, {}],
          [.88, { hR: A(.14, .4), lean: -.06, look: .2 }, 'out'],
          [1.04, { look: -.5, hd: [0, -U * .01] }],
          [1.34, {}],
          [1.44, { face: .6, look: .6, hd: [0, 0] }],
          [1.6, { face: 1, look: -.4 }],
          [1.74, { hR: sk, look: .6, lean: .22 }],
          [1.8, {}],
          [1.86, { look: -.7, brow: 1, hd: [0, -U * .02] }],
          [2.0, {}],
          [2.07, { hR: A(.14, .42), look: .1, brow: 0, hd: [0, 0], lean: -.04 }, 'out'],
          [2.3, { hip: A(0, .415), lean: 0, fL: A(-.07, 0), fR: A(.07, 0), look: 0 }],
          [2.48, { face: 0, brow: 1, hR: A(.1, .74), hL: A(-.1, .44) }],
          [2.72, {}],
          [2.86, { hR: A(-.06, .43), face: .3 }],
          [3.0, { hR: A(.1, .44), face: 0 }],
          [3.14, { hd: [0, U * .014] }], [3.24, { hd: [0, 0] }],
        ]);
      },
      tv(S, t) {   // the set's state: sx, sy, op
        const off = (t0, d) => { const a = seg(t, t0, t0 + d), b = seg(t, t0 + d, t0 + d * 2.1); return { sy: lerp(1, .025, E.in(a)), sx: b > 0 ? lerp(1.05, .03, E.in(b)) : lerp(1, 1.05, a) }; };
        if (t < .86) return { sx: 1, sy: 1, op: 1 };
        if (t < 1.8) { const o = off(.86, .1); o.op = t < 1.1 ? 1 : lerp(1, .35, seg(t, 1.1, 1.5)); return o; }
        if (t < 1.9) { const a = seg(t, 1.8, 1.84), b = seg(t, 1.84, 1.9); return { sx: lerp(.03, 1.05, E.out(a)), sy: lerp(.025, 1, E.out(b)), op: 1 }; }
        if (t < 2.06) return { sx: 1 + (Math.floor(t * 24) % 2) * .006, sy: 1, op: 1 };
        const o = off(2.06, .07); o.op = 1 - seg(t, 2.24, 2.5); if (t >= 2.5) o.hide = true; return o;
      },
      draw(S, t, p) {
        const { U, G, c } = S, P = S.trk(t);
        if (t < .45) Object.assign(P, walk(S, P, t, 0, .45, S.x0, S.xs)), P.hR = [P.hip[0] + U * .12, G - U * .45], P.hL = [P.hip[0] - U * .1, G - U * .44];
        const tv = this.tv(S, t), on = (t < .86) || (t >= 1.8 && t < 2.06);
        S.setCard({ sx: tv.sx, sy: tv.sy, op: tv.op, hide: tv.hide, px: c.w / 2, py: c.h / 2 });
        // once it's down to a dot, it's just a dot of ink that fades
        if (!on && !tv.hide && tv.sx <= .05) {
          S.setCard({ hide: true });
          const cc = [c.x + c.w / 2, c.y + c.h / 2], k = tv.op;
          p.g({ halo: false });
          p.circ(cc[0], cc[1], U * .11, { fill: `rgba(31,26,23,${(.07 * k).toFixed(3)})`, stroke: false, n: 12 });
          p.circ(cc[0], cc[1], U * (.012 + .02 * k), { fill: INK, stroke: false, n: 8, op: Math.min(1, k * 1.6) });
        }
        // power strip (its own lead runs off to the left)
        const xp = S.xp, sw = U * .3, sh = U * .1;
        p.g();
        p.line([[xp - sw, G - sh * .45], [xp - sw - U * .1, G - 1.5], [S.xs - U * .7, G - 1.5]], { w: .8 });
        p.shape(bRect(xp - sw, G - sh, sw * 2, sh), { fill: '#fff', w: 1.1 });
        [-.17, -.04, .09].forEach(dx => { const x = xp + dx * U; p.line([[x - U * .012, G - sh * .7], [x - U * .012, G - sh * .32]], { w: .8, halo: false }); p.line([[x + U * .012, G - sh * .7], [x + U * .012, G - sh * .32]], { w: .8, halo: false }); });
        p.shape(bRect(xp + sw - U * .085, G - sh * .78, U * .055, sh * .56), { fill: INK, w: .5 });
        // the plug and the cartoon's cord
        const plugIn = t < .86 || (t >= 1.78 && t < 2.06);
        let pl = plugIn ? [S.sock[0], G - sh - U * .03] : [P.hR[0], P.hR[1] + U * .02];
        if (t >= 2.86) pl = null;
        const ce = [S.cordEnd, (on || tv.sy > .5) ? G - 6 : G - 1.5];
        p.g();
        let path;
        if (pl && plugIn) { const o = [pl[0], pl[1] - U * .035]; path = [o, [o[0] + U * .02, o[1] - U * .07], [o[0] + U * .1, o[1] - U * .09], [o[0] + U * .2, o[1] - U * .04], [o[0] + U * .3, G - U * .02], [o[0] + U * .45, G - 1.5], [ce[0] - U * .05, G - 1.5], ce]; }
        else { const o = pl ? [pl[0], pl[1] - U * .035] : [P.hip[0] - U * .08, P.hip[1] + U * .03]; path = [o, [o[0] + U * .05, o[1] - U * .03], [o[0] + U * .1, o[1] + U * .08], [o[0] + U * .16, lerp(o[1], G, .6)], [o[0] + U * .28, G - 1.5], [ce[0] - U * .05, G - 1.5], ce]; }
        p.line(path, { w: .85, amp: .3 });
        if (pl) {
          p.shape(bRect(pl[0] - U * .04, pl[1] - U * .035, U * .08, U * .065), { fill: INK, w: .6 });
          if (!plugIn) { p.line([[pl[0] - U * .018, pl[1] + U * .03], [pl[0] - U * .018, pl[1] + U * .065]], { w: .8 }); p.line([[pl[0] + U * .018, pl[1] + U * .03], [pl[0] + U * .018, pl[1] + U * .065]], { w: .8 }); }
        }
        if ((t >= .86 && t < .96) || (t >= 2.06 && t < 2.16)) burst(p, [S.sock[0], G - U * .12], U * .03, U * .09, 6, -1.2, .7);
        shadow(p, P.hip[0], G, U * .2);
        bFig(p, S, P, { hat: 'cap', body: COS.belt });
      }
    };

    /* ═════════ B10. THE PHOTOGRAPHER — one flash and it's in the camera. Shakes the print. ═════════ */
    GAGS.B_photo = {
      name: 'The Photographer', dur: 3.9, ones: [[.98, 1.12], [1.48, 2.1]],
      cues: [[0.05, 'footsteps'], [0.62, 'lens-focus'], [1.0, 'shutter-flash'], [1.3, 'camera-whirr'], [1.48, 'print-shake-loop'], [2.1, 'shake-stop'], [2.5, 'hm'], [3.0, 'pocket-pat']],
      setup(S) {
        const { U, G, c } = S;
        S.xs = c.x + c.w * .3; S.x0 = -U * .55;
        const A = stand(S, S.xs), ey = G - U * .86;
        S.trk = track([
          [.45, { hip: A(0, .415), face: 1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hR: A(.1, .52), hL: A(-.1, .52) }],
          [.6, { hR: [S.xs + U * .19, ey + U * .06], hL: [S.xs + U * .12, ey + U * .1], lean: .05 }],
          [.76, { hip: A(-.06, .36), lean: .16, fL: A(-.17, 0), fR: A(.06, 0), hR: [S.xs + U * .19, ey + U * .12], hL: [S.xs + U * .12, ey + U * .16] }],
          [.88, { hip: A(-.03, .37), lean: .08, hR: [S.xs + U * .2, ey + U * .1], hL: [S.xs + U * .13, ey + U * .14] }],
          [1.12, {}],
          [1.26, { face: 0, hip: A(0, .415), lean: 0, fL: A(-.07, 0), fR: A(.07, 0), hR: A(.1, .56), hL: A(-.1, .56) }],
          [1.36, {}],
          [1.46, { hR: A(.3, .6) }],
          [2.1, { hR: A(.24, .62), look: .7, face: .4, tilt: .12 }],
          [2.36, {}],
          [2.5, { hR: A(.2, .78), face: 0, look: 0, brow: 1, tilt: 0 }],
          [2.86, {}],
          [3.0, { hR: A(-.03, .66), face: 0 }],
          [3.1, {}],
          [3.2, { hR: A(.1, .52) }],
        ]);
      },
      draw(S, t, p) {
        const { U, G, W, H } = S, P = S.trk(t);
        if (t < .45) Object.assign(P, walk(S, P, t, 0, .45, S.x0, S.xs)), P.hR = [P.hip[0] + U * .1, G - U * .52], P.hL = [P.hip[0] - U * .1, G - U * .52];
        if (t >= 1.48 && t < 2.1) P.hR = [P.hR[0] + Math.sin(t * 46) * U * .05, P.hR[1] + Math.cos(t * 46) * U * .015];
        if (t >= 1.0) S.setCard({ hide: true });
        const profile = t >= .54 && t < 1.2;
        const chestCam = J2 => [lerp(J2.hip[0], J2.neck[0], .55), lerp(J2.hip[1], J2.neck[1], .55)];
        // the print: slides out of the camera, gets shaken while it develops, then shown and pocketed
        const drawPrint = (J2) => {
          let pc, sz = U * .17, ang = 0;
          const cc = chestCam(J2);
          if (t < 1.44) { const k = seg(t, 1.3, 1.42); pc = [cc[0], cc[1] + U * .03 + sz * .55 * k]; }
          else { const h = J2.hR; pc = [h[0] + U * .05, h[1] - U * .04]; ang = t < 2.1 ? Math.sin(t * 46) * .25 : 0; }
          if (t >= 2.36) { const k = E.out(seg(t, 2.36, 2.5)) * (1 - E.io(seg(t, 2.86, 3.0))); sz = lerp(U * .17, U * .42, k); }
          if (t >= 2.86) sz *= 1 - seg(t, 2.96, 3.06);
          if (sz < 1) return;
          const dev = seg(t, 1.5, 2.1), ins = sz * .82, top = sz * .08;
          const T = (x, y) => rot([pc[0] + x, pc[1] + y], pc, ang);
          const tr = `translate(${pc[0].toFixed(1)} ${pc[1].toFixed(1)}) rotate(${(ang * 57.3).toFixed(1)})`;
          p.g();
          p.shape([T(-sz / 2, -sz / 2), T(sz / 2, -sz / 2), T(sz / 2, sz * .62), T(-sz / 2, sz * .62)], { fill: '#fff', w: .9, amp: .2 });
          p.raw(`<g transform="${tr}"><rect x="${(-ins / 2).toFixed(1)}" y="${(-sz / 2 + top).toFixed(1)}" width="${ins.toFixed(1)}" height="${ins.toFixed(1)}" fill="#3A3430"/>${S.src ? `<image x="${(-ins / 2).toFixed(1)}" y="${(-sz / 2 + top).toFixed(1)}" width="${ins.toFixed(1)}" height="${ins.toFixed(1)}" preserveAspectRatio="xMidYMid slice" href="${S.src}" opacity="${dev.toFixed(2)}"/>` : ''}<rect x="${(-ins / 2).toFixed(1)}" y="${(-sz / 2 + top).toFixed(1)}" width="${ins.toFixed(1)}" height="${ins.toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1"/></g>`);
        };
        shadow(p, P.hip[0], G, U * .2);
        const J = bFig(p, S, P, { hat: 'hair', front: (q, J2, P2) => {
          q.g();
          if (profile) {   // camera up at his eye, lens toward the cartoon
            const cc = [(J2.hR[0] + J2.hL[0]) / 2 + U * .03, (J2.hR[1] + J2.hL[1]) / 2 - U * .05];
            q.shape(bRect(cc[0] - U * .08, cc[1] - U * .065, U * .16, U * .13), { fill: '#fff', w: 1 });
            q.shape(bRect(cc[0] + U * .08, cc[1] - U * .04, U * .05, U * .08), { fill: INK, w: .7 });
            q.shape(bRect(cc[0] - U * .07, cc[1] - U * .1, U * .06, U * .035), { fill: WASH2, w: .6 });
            S.flashAt = [cc[0] - U * .04, cc[1] - U * .1];
            return;
          }
          const n = J2.neck, cc = chestCam(J2);
          if (t >= 1.3 && t < 1.44) drawPrint(J2);
          q.g();
          q.line([[n[0] - U * .04, n[1]], [cc[0] - U * .1, cc[1] - U * .05]], { w: .6 }); q.line([[n[0] + U * .04, n[1]], [cc[0] + U * .1, cc[1] - U * .05]], { w: .6 });
          q.shape(bRect(cc[0] - U * .13, cc[1] - U * .07, U * .26, U * .15), { fill: '#fff', w: 1 });
          q.circ(cc[0], cc[1] + U * .005, U * .05, { fill: '#fff', w: 1, n: 10 }); q.circ(cc[0], cc[1] + U * .005, U * .022, { fill: INK, w: .5, n: 8 });
          q.shape(bRect(cc[0] - U * .11, cc[1] - U * .055, U * .045, U * .03), { fill: WASH2, w: .5, halo: false });
          q.line([[cc[0] - U * .08, cc[1] + U * .075], [cc[0] + U * .08, cc[1] + U * .075]], { w: .6, halo: false });
        } });
        if (!profile && t >= 1.44 && t < 3.06) drawPrint(J);
        // the flash
        if (t >= .98 && t < 1.45) {
          const fa = S.flashAt || [J.hc[0] + U * .1, J.hc[1] - U * .1];
          if (t < 1.12) burst(p, fa, U * .05, U * .26, 10, .1, 1);
          const op = t < 1.04 ? 1 : 1 - E.out(seg(t, 1.04, 1.45));
          p.g({ halo: false }); p.raw(`<rect x="-10" y="-10" width="${W + 20}" height="${H + 20}" fill="#fff" opacity="${(op * .96).toFixed(3)}"/>`);
        }
      }
    };

    /* ═════════ B11. PEST CONTROL — one pump of the sprayer and the ink runs for it ═════════ */
    GAGS.B_pest = {
      name: 'Pest Control', dur: 3.95, ones: [[1.3, 2.3]],
      cues: [[0.05, 'footsteps'], [0.66, 'pump-pssht'], [0.9, 'pump-pssht'], [1.3, 'ink-skitter-loop'], [1.9, 'hop'], [2.3, 'skitter-stop'], [2.54, 'pump-pssht'], [2.62, 'tiny-squeak'], [3.2, 'cap-tip']],
      setup(S) {
        const { U, G, c, W } = S;
        S.xs = c.x + c.w * .72; S.x0 = W + U * .5;
        S.cc = [c.x + c.w / 2, c.y + c.h * .55];
        S.bugs = [];
        for (let i = 0; i < 38; i++) {
          const r = k => rnd(S.seed + 90 + k, i);
          const x = c.x + c.w * (.12 + r(1) * .76), y = c.y + c.h * (.36 + r(2) * .56);
          let a = Math.atan2(y - S.cc[1], x - S.cc[0]) + (r(3) - .5) * .9;
          if (Math.sin(a) < -.3 && r(9) < .6) a = Math.PI - a;   // most of them head down and out
          S.bugs.push({ x, y, a, ta: 1.26 + r(4) * .14, tg: 1.4 + r(5) * .5, v: U * (2.2 + r(6) * 1.6), kind: Math.floor(r(7) * 4), L: U * (.06 + r(8) * .06), ph: r(10) * 6 });
        }
        S.lone = { x0: c.x + c.w * .12, x1: S.xs - U * .4, y: G + U * .07 };
        const A = stand(S, S.xs);
        S.trk = track([
          [.45, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), aim: 0, pump: 0 }],
          [.58, { aim: -.18, lean: -.06 }],
          [.66, { pump: 1 }, 'in'], [.76, { pump: 0 }],
          [.9, { pump: 1 }, 'in'], [1.0, { pump: 0 }],
          [1.16, { aim: 0, lean: 0 }],
          [1.3, { look: -.3 }],
          [1.86, { look: .3 }],
          [1.92, { hip: A(.02, .5), fL: A(-.06, .1), fR: A(.08, .12) }, 'out'],
          [2.06, { hip: A(0, .415), fL: A(-.07, 0), fR: A(.07, 0) }, 'in'],
          [2.32, { look: .8, face: -1 }],
          [2.44, { aim: .95, lean: -.16 }],
          [2.52, { pump: 1 }, 'in'], [2.6, { pump: 0 }],
          [2.78, { aim: 0, lean: 0, look: .5 }],
          [2.96, { face: 0, look: 0, brow: 1 }],
          [3.12, { tip: 0 }],
          [3.22, { tip: 1 }], [3.4, { tip: 1 }], [3.52, { tip: 0 }],
        ]);
      },
      gun(S, P, J) {   // the sprayer: tank + pump cylinder, held at chest
        const U = S.U, f = P.face < 0 ? -1 : 1, aim = P.aim || 0;
        const base = [J.hip[0] + f * U * .16, J.hip[1] - U * .2];
        const T = (x, y) => rot([base[0] + f * x * U, base[1] + y * U], base, f * aim);
        return { base, T, f, nozzle: T(.24, -.02), handle: T(-.2 + (P.pump || 0) * .08, 0), tank: T(.05, .05) };
      },
      draw(S, t, p) {
        const { U, G, c, W, H } = S, P = S.trk(t);
        if (t < .45) Object.assign(P, walk(S, P, t, 0, .45, S.x0, S.xs));
        S.img.setAttribute('opacity', (1 - seg(t, 1.32, 1.82)).toFixed(3));
        // the ink, running
        p.g({ halo: false });
        const shape = (b, x, y, a, wig, op) => {
          const L = b.L, pts = b.kind === 0 ? [[-L / 2, 0], [0, -L * .32 + wig], [L / 2, 0]] : b.kind === 1 ? [[-L / 2, 0], [-L / 6, -L * .25 + wig], [L / 6, L * .25 - wig], [L / 2, 0]] : b.kind === 2 ? [[-L / 2, 0], [0, -L * .3], [L * .2, 0], [-L * .1, L * .12 + wig], [L / 2, 0]] : [[-L / 2, wig * .5], [L / 2, -wig * .5]];
          p.line(pts.map(q => rot([x + q[0], y + q[1]], [x, y], a)), { w: 1.45, amp: .25, op });
        };
        S.bugs.forEach((b, i) => {
          if (t < b.ta) return;
          const d = t < b.tg ? 0 : b.v * Math.pow(t - b.tg, 1.35), wig = Math.sin(t * 34 + b.ph) * b.L * .25;
          let x = b.x + Math.cos(b.a) * d + Math.cos(b.a + Math.PI / 2) * Math.sin(t * 22 + b.ph) * U * .012 * (d > 0);
          let y = b.y + Math.sin(b.a) * d, a = d > 0 ? b.a : b.ph;
          if (y > G - 3) { const over = y - (G - 3), sd = Math.cos(b.a) < -.05 ? -1 : Math.cos(b.a) > .05 ? 1 : (i % 2 ? 1 : -1); x += sd * over * 1.2; y = G - 3 - Math.abs(Math.sin(t * 26 + b.ph)) * U * .015; a = sd > 0 ? 0 : Math.PI; }
          if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
          shape(b, x, y, a, wig, Math.min(1, (t - b.ta) / .1));
        });
        // the straggler: wanders across the floor, gets one pump, curls up
        const L = S.lone;
        if (t >= 1.5) {
          const k = seg(t, 1.5, 2.4), x = lerp(L.x0, L.x1, E.out(k)), wig = t < 2.56 ? Math.sin(t * 30) * U * .012 : 0;
          if (t < 2.58) shape({ L: U * .14, kind: 1 }, x, L.y - U * .01 - Math.abs(Math.sin(t * 20)) * U * .015 * (t < 2.4), 0, t < 2.4 ? wig : wig * .4, 1);
          else { const pts = [], k = E.out(seg(t, 2.58, 2.7)); for (let i = 0; i < 11; i++) { const a = i * .85 * k, r = U * .06 * (1 - i / 12 * k); pts.push([L.x1 - U * .06 + i * U * .012 * (1 - k) + Math.cos(a) * r * k, L.y - U * .03 + Math.sin(a) * r * .8 * k]); } p.line(pts, { w: 1.6, amp: .15 }); if (t < 2.72) burst(p, [L.x1, L.y - U * .05], U * .08, U * .13, 5, -2.6, .55); }
        }
        shadow(p, P.hip[0], G, U * .2);
        // the sprayer and the man
        const J0 = { hip: P.hip };
        const g = this.gun(S, P, J0);
        P.hR = g.handle; P.hL = g.tank;
        if (P.tip > 0) { const hc = [P.hip[0], P.hip[1] - U * .42]; P.hR = mixPt(g.handle, [hc[0] + U * .07, hc[1] - U * .09], P.tip); P.armsFront = true; }
        if (t < .45) { P.hR = [P.hip[0] + U * .1, G - U * .5]; P.hL = [P.hip[0] - U * .1, G - U * .46]; }
        bFig(p, S, P, { hat: 'cap', faceFn: COS.resp });
        const G2 = t < .45 ? { T: (x, y) => [P.hL[0] + g.f * (x - .05) * U, P.hL[1] + (y - .05) * U], f: g.f } : g;
        const T = G2.T;
        p.g();
        p.shape([T(-.12, -.035), T(.2, -.035), T(.2, .035), T(-.12, .035)], { fill: '#fff', w: .9 });
        p.circ(...T(.06, .085), U * .055, { fill: '#fff', w: .9, n: 10 });
        p.line([T(.2, 0), T(.26, -.02)], { w: 1.4 });
        const pb = (P.pump || 0) * .08;
        p.line([T(-.12, 0), T(-.2 + pb, 0)], { w: .9 });
        p.line([T(-.2 + pb, -.045), T(-.2 + pb, .045)], { w: 1.6 });
        // mist
        p.g({ halo: false });
        [.66, .9, 2.52].forEach((t0, j) => {
          const k = seg(t, t0, t0 + .5); if (k <= 0 || k >= 1) return;
          const n0 = G2.T(.27, -.02), dir = rotv([g.f, 0], g.f * (P.aim || 0));
          const reach = j < 2 ? .8 : .45;
          for (let m = 0; m < 3; m++) { const q = clamp(k * 1.4 - m * .15, 0, 1); if (q <= 0) continue; const cc = [n0[0] + dir[0] * U * reach * q * (.5 + m * .25), n0[1] + dir[1] * U * reach * q * (.5 + m * .25) - q * U * .04]; p.circ(cc[0], cc[1], U * (.05 + q * .13), { fill: `rgba(31,26,23,${(.12 * (1 - q)).toFixed(3)})`, w: .6, color: `rgba(31,26,23,${(.3 * (1 - q)).toFixed(2)})`, n: 12, amp: U * .012 }); }
          for (let i = 0; i < 16; i++) {
            const q = clamp(k * 1.3 - rnd(j * 50 + i, 3) * .3, 0, 1); if (q <= 0) continue;
            const sp = (rnd(j * 50 + i, 1) - .5) * 1.0, dd = q * U * reach * (.6 + rnd(j * 50 + i, 2) * .6);
            const v = rotv(dir, sp);
            p.circ(n0[0] + v[0] * dd, n0[1] + v[1] * dd - q * U * .05, U * (.01 + q * .012), { fill: `rgba(31,26,23,${(.6 * (1 - q)).toFixed(2)})`, stroke: false, n: 6 });
          }
        });
      }
    };
  }

  /* ════════════════════════════════════════════════════════════════════
     C · ANIMALS — eleven animals who get rid of the cartoon.
     Every helper here is prefixed C_ so it can share a scope with other sets.
     ════════════════════════════════════════════════════════════════════ */
  /* local animal frame: x forward (mirrored by facing f), y up, in units of g */
  const C_frame = (bx, by, f, g, ang, piv) => (x, y) => {
    let X = x, Y = y;
    if (ang) { const q = rot([x, y], piv || [0, 0], ang); X = q[0]; Y = q[1]; }
    return [bx + f * X * g, by - Y * g];
  };
  const C_map = (F, pts) => pts.map(([x, y]) => F(x, y));
  /* a legged foot cycle: returns [dx, lift] for a leg with phase offset */
  const C_step = (ph, off, stride, lift) => { const a = (ph + off) * Math.PI * 2; return [Math.sin(a) * stride, Math.max(0, Math.cos(a)) * lift]; };
  /* dust puffs (grey cloud balls with an ink rim) */
  function C_puffs(p, list, op) {
    p.g({ halo: false, op: op == null ? 1 : op });
    list.forEach(([x, y, r, sy]) => p.circ(x, y, r, { w: 1.5, n: 12, amp: r * .06, sy: sy || 1 }));
    list.forEach(([x, y, r, sy]) => p.circ(x, y, r, { fill: '#F3F0EB', stroke: false, n: 12, amp: r * .06, sy: sy || 1 }));
  }
  /* speed / motion lines */
  function C_speed(p, pts, len, ang, op) {
    p.g({ halo: false });
    pts.forEach(([x, y], i) => p.line([[x, y], [x + Math.cos(ang) * len * (1 - i * .12), y + Math.sin(ang) * len * (1 - i * .12)]], { w: .6, color: `rgba(31,26,23,${op == null ? .5 : op})`, amp: .2 }));
  }

  /* ═════════ C1. THE CAT — sits, taps it, holds your eye, pushes it over ═════════ */
  function C_catHead(p, hc, g, f, front, o) {
    const H = (u, v) => { const q = rot([u, v], [0, 0], o.look || 0); return [hc[0] + f * q[0] * g, hc[1] - q[1] * g]; };
    if (!front) {
      p.g();
      p.shape(C_map(H, [[-.045, .058], [-.04, .128], [-.004, .07]]), { fill: '#fff', w: .8 });
      p.shape(C_map(H, [[-.078, .01], [-.064, .054], [-.015, .077], [.045, .064], [.082, .028], [.104, -.006], [.09, -.03], [.05, -.052], [-.005, -.062], [-.055, -.048]]), { fill: '#fff' });
      p.shape(C_map(H, [[.0, .07], [.026, .145], [.062, .056]]), { fill: '#fff', w: .85 });
      p.line(C_map(H, [[.018, .078], [.028, .118]]), { w: .5, halo: false });
      if (o.blink) p.line(C_map(H, [[.03, .012], [.062, .01]]), { w: .8, halo: false, amp: .1 });
      else { p.circ(...H(.048, .014), .018 * g, { fill: '#fff', w: .65, halo: false, n: 8, amp: .1 }); p.line(C_map(H, [[.05, .028], [.05, .0]]), { w: 1.3, halo: false, amp: .05 }); }
      p.dot(...H(.1, -.008), Math.max(1.1, .009 * g));
      p.line(C_map(H, [[.088, -.034], [.068, -.04]]), { w: .55, halo: false, amp: .1 });
      p.line(C_map(H, [[.072, -.022], [.17, .002]]), { w: .45, halo: false, amp: .15 });
      p.line(C_map(H, [[.072, -.03], [.165, -.042]]), { w: .45, halo: false, amp: .15 });
      return;
    }
    p.g();
    [-1, 1].forEach(s => p.shape(C_map(H, [[s * .086, .03], [s * .078, .136], [s * .024, .07]]), { fill: '#fff', w: .85 }));
    p.shape(C_map(H, [[-.094, .0], [-.08, .05], [-.032, .076], [.032, .076], [.08, .05], [.094, .0], [.084, -.038], [.04, -.062], [-.04, -.062], [-.084, -.038]]), { fill: '#fff' });
    [-1, 1].forEach(s => p.line(C_map(H, [[s * .07, .05], [s * .072, .1]]), { w: .5, halo: false }));
    [-1, 1].forEach(s => {
      const e = H(s * .036, .012);
      if (o.blink) { p.line(C_map(H, [[s * .036 - .019, .016], [s * .036, .006], [s * .036 + .019, .016]]), { w: .85, halo: false, amp: .1 }); return; }
      p.circ(e[0], e[1], .021 * g, { fill: '#fff', w: .65, halo: false, n: 9, amp: .1 });
      p.line([[e[0], e[1] - .015 * g], [e[0], e[1] + .015 * g]], { w: 1.6, halo: false, amp: .05 });
    });
    p.shape(C_map(H, [[-.012, -.016], [.012, -.016], [0, -.03]]), { fill: INK, w: .5, halo: false, amp: .05 });
    p.line(C_map(H, [[-.022, -.046], [-.01, -.04], [0, -.031], [.01, -.04], [.022, -.046]]), { w: .55, halo: false, amp: .08 });
    [-1, 1].forEach(s => { p.line(C_map(H, [[s * .05, -.024], [s * .15, -.01]]), { w: .45, halo: false, amp: .15 }); p.line(C_map(H, [[s * .05, -.034], [s * .145, -.05]]), { w: .45, halo: false, amp: .15 }); });
  }
  function C_catDraw(p, S, o) {
    const g = o.g, G = S.G, f = o.f, L = C_frame(o.bx, G, f, g);
    shadow(p, o.bx, G, .2 * g);
    p.g();
    let hc;
    if (o.pose === 'walk') {
      const ph = o.ph || 0, legs = [[.12, .0, 1], [-.13, .5, 1], [.15, .5, 0], [-.1, 0, 0]];
      const leg = ([lx, off]) => { const [dx, lf] = C_step(ph, off, .045, .03); const top = L(lx, .21), ft = L(lx + dx, lf), kn = L(lx + dx * .5 + (lx < 0 ? -.025 : .01), .1 + lf * .5); p.line([top, kn, ft]); p.line([ft, [ft[0] + f * .02 * g, ft[1]]], { w: 1.2, amp: .15 }); };
      legs.filter(l => l[2]).forEach(leg);
      const tw = Math.sin((o.t || 0) * 5) * .02;
      p.line(C_map(L, [[-.18, .27], [-.24, .35], [-.245 + tw, .45], [-.21 + tw * 1.5, .5]]), { w: 1.25 });
      p.shape(C_map(L, [[.17, .325], [.05, .315], [-.1, .32], [-.19, .305], [-.225, .245], [-.2, .175], [-.06, .155], [.1, .16], [.19, .19], [.215, .26]]), { fill: '#fff' });
      legs.filter(l => !l[2]).forEach(leg);
      hc = L(.25, .37 + Math.sin(ph * Math.PI * 4) * .006);
    } else {
      const tf = o.tail || 0;
      p.line(C_map(L, [[-.13, .02], [-.21, .016], [-.265, .04], [-.27 - tf * .02, .085 + tf * .03], [-.255 - tf * .03, .115 + tf * .02]]), { w: 1.25 });
      p.line(C_map(L, [[.075, .2], [.08, .0]]), { w: 1 });
      p.line(C_map(L, [[.075, .0], [.1, .0]]), { w: 1.1, amp: .1 });
      p.shape(C_map(L, [[.105, .06], [.128, .16], [.122, .26], [.085, .33], [-.02, .355], [-.095, .3], [-.155, .2], [-.19, .1], [-.18, .03], [-.13, .0], [.04, .0], [.08, .02]]), { fill: '#fff' });
      p.line(C_map(L, [[.0, .005], [-.035, .1], [-.1, .155], [-.155, .14]]), { w: .6, halo: false });
      p.line(C_map(L, [[-.02, .0], [.03, .0]]), { w: 1.1, amp: .1 });
      p.g();
      if (o.paw) {
        const sh = L(.09, .25), pw = o.paw, el = [lerp(sh[0], pw[0], .5) + f * .04 * g, lerp(sh[1], pw[1], .5) + .02 * g];
        p.line([sh, el, pw], { w: 1.1 });
        p.circ(pw[0], pw[1], .022 * g, { fill: '#fff', w: .8, n: 8 });
      } else { p.line(C_map(L, [[.1, .22], [.11, .0]]), { w: 1.1 }); p.line(C_map(L, [[.11, .0], [.135, .0]]), { w: 1.1, amp: .1 }); }
      hc = L(.06 + (o.front ? -.01 : 0), .43);
    }
    C_catHead(p, hc, g, f, o.front, o);
  }
  GAGS.C_cat = {
    name: 'The Cat', dur: 3.9, ones: [[2.46, 2.8]],
    cues: [[0.05, 'soft-paws'], [0.66, 'sit-fluff'], [1.2, 'tap'], [1.24, 'wobble-creak'], [1.5, 'head-turn'], [2.24, 'slow-creak'], [2.72, 'whap'], [3.18, 'slow-blink'], [3.5, 'tiny-mrrp']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.12;
      S.cx = c.x + c.w * .74; S.x0 = W + .4 * g;
      S.touch = [S.cx - .22 * g, G - .58 * g];
    },
    cardTilt(t) {   // card scaleY (pivot bottom): tap wobble, slow push, fall
      if (t < 1.2) return 1;
      if (t < 1.62) { const k = seg(t, 1.2, 1.62); return 1 - .07 * Math.sin(k * Math.PI * 2.2) * Math.exp(-k * 2.2); }
      if (t < 2.24) return 1;
      if (t < 2.5) return 1 - .1 * E.io(seg(t, 2.24, 2.5));
      if (t < 2.72) return lerp(.9, .02, E.in(seg(t, 2.5, 2.72)));
      return .02;
    },
    draw(S, t, p) {
      const { U, G, c, g } = S;
      const sy = this.cardTilt(t);
      if (sy < 1) S.setCard({ py: c.h, sy, sx: 1 - (1 - sy) * .06 });
      S.over.innerHTML = sy < 1 ? `<rect x="0" y="0" width="${c.w}" height="${c.h}" rx="${S.F.radius}" fill="${INK}" opacity="${((1 - sy) * .2).toFixed(3)}"/>` : '';
      // after the whap, the flattened card is a sliver; bounce once
      if (t >= 2.72 && t < 2.86) S.setCard({ py: c.h, sy: .02 + .03 * Math.sin(seg(t, 2.72, 2.86) * Math.PI), sx: .94 });
      let o = { g, f: -1, bx: S.cx, pose: 'sit', t };
      if (t < .62) { const k = seg(t, 0, .62); o.pose = 'walk'; o.bx = lerp(S.x0, S.cx, k); o.ph = (S.x0 - o.bx) / (.26 * g); }
      if (t >= .78 && t < 1.5) o.look = .32 * E.io(seg(t, .78, .92));
      const T = S.touch;
      // paw: up to the card, tap (rides the wobble), stays; push; hangs in the air; lowers
      if (t >= 1.0 && t < 3.1) {
        const tapAt = [T[0], G - (G - T[1]) * sy];
        let pw;
        if (t < 1.18) pw = mixPt(C_frame(S.cx, G, -1, g)(.11, .02), T, E.out(seg(t, 1.0, 1.18)));
        else if (t < 2.74) pw = [T[0] + (t >= 2.24 ? -.04 * g * E.io(seg(t, 2.24, 2.5)) : 0), tapAt[1]];
        else pw = [T[0] - .04 * g, T[1] + (t > 2.95 ? (G - .02 * g - T[1]) * E.io(seg(t, 2.95, 3.1)) : 0)];
        if (t >= 2.5 && t < 2.74) pw = [T[0] - .04 * g, lerp(T[1] + .02 * g * .9, T[1], seg(t, 2.5, 2.6))];
        o.paw = pw;
      }
      if (t >= 1.5) { o.front = t >= 1.56; o.look = t < 1.56 ? .1 : 0; }
      o.blink = (t >= 3.18 && t < 3.42) || (t >= 1.98 && t < 2.04);
      o.tail = t >= 3.5 ? Math.sin((t - 3.5) * 14) : (t > .7 && t < 1.0 ? Math.sin((t - .7) * 20) * .6 : 0);
      if (t >= 1.2 && t < 1.3) burst(p, [T[0] - .02 * g, T[1]], .03 * g, .065 * g, 4, -2.6, .55);
      // whap: a flat billow of dust out from under the whole edge (drawn behind the cat)
      if (t >= 2.72 && t < 3.4) {
        const k = E.out(seg(t, 2.72, 3.2)), op = 1 - seg(t, 3.0, 3.4);
        const pf = [];
        [[-1, c.x + c.w * .14], [1, c.x + c.w * .84]].forEach(([sd, x0], j) => { for (let i = 0; i < 7; i++) { const q = rnd(S.seed + 41 + j, i), q2 = rnd(S.seed + 45 + j, i), r = U * (.07 + q * .09) * (.4 + k * .6); pf.push([x0 + sd * (q2 * .28 + k * .12) * U, G - r * .5 - (q * .12 + k * .06) * U, r]); } });
        C_puffs(p, pf, op);
        if (t < 2.86) C_speed(p, [[c.x + c.w * .25, G - .2 * U], [c.x + c.w * .45, G - .24 * U], [c.x + c.w * .65, G - .2 * U]], .08 * U, -Math.PI / 2, .55);
      }
      C_catDraw(p, S, o);
    }
  };

  /* ═════════ C2. GOOD BOY — sniffs it, drags it off, digs (off), comes back very good ═════════ */
  function C_dogSide(p, S, o) {
    const g = o.g, G = S.G, f = o.f, L = C_frame(o.bx, G - (o.lift || 0), f, g);
    const ph = o.ph || 0, moving = o.moving;
    shadow(p, o.bx, G, .26 * g);
    p.g();
    const legs = [[.15, 0, 1], [-.17, .5, 1], [.11, .5, 0], [-.13, 0, 0]];
    const leg = ([lx, off]) => {
      const [dx, lf] = moving ? C_step(ph, off, .05, .035) : [0, 0];
      const brace = o.brace && lx < 0 ? -.04 : o.brace ? .03 : 0;
      const top = L(lx, .21), ft = L(lx + dx + brace, lf), kn = L(lx + (dx + brace) * .5 + (lx < 0 ? -.03 : .015), .1 + lf * .5);
      p.line([top, kn, ft], { w: 1.1 }); p.line([ft, [ft[0] + f * .025 * g, ft[1]]], { w: 1.4, amp: .15 });
    };
    legs.filter(l => l[2]).forEach(leg);
    const wag = o.wag || 0;
    p.line(C_map(L, [[-.22, .33], [-.29, .39 + wag * .02], [-.33 + wag * .03, .45 + wag * .03]]), { w: 1.3 });
    p.shape(C_map(L, [[.19, .37], [.0, .355], [-.2, .365], [-.255, .31], [-.24, .22], [-.15, .195], [.05, .19], [.18, .2], [.245, .27]]), { fill: '#fff' });
    p.shape(C_map(L, [[-.06, .355], [-.02, .34], [-.04, .29], [-.11, .285], [-.14, .32], [-.12, .357]]), { fill: INK, w: .6, amp: .3 });
    legs.filter(l => !l[2]).forEach(leg);
    const N = [.22, .42], hr = o.hr || 0;
    const H = (u, v) => { const q = rot([u, v], [0, 0], -hr); return L(N[0] + q[0], N[1] + q[1]); };
    p.g();
    p.shape([L(.13, .36), H(.0, .07), H(.05, -.01), L(.25, .25)], { fill: '#fff', stroke: false });
    p.line([L(.13, .36), H(.0, .07)], { w: 1 }); p.line([L(.25, .25), H(.05, -.01)], { w: 1 });
    p.line([H(-.01, .02), H(.06, -.025)], { w: 1.6, amp: .15 });
    p.shape(C_map(H, [[-.02, .04], [.01, .1], [.06, .125], [.12, .11], [.16, .075], [.215, .062], [.24, .035], [.232, .002], [.17, -.012], [.09, -.008], [.03, -.002]]), { fill: '#fff' });
    p.shape(C_map(H, [[.215, .055], [.243, .045], [.248, .022], [.226, .018]]), { fill: INK, w: .6, amp: .1 });
    if (o.dirt) p.shape(C_map(H, [[.15, .07], [.2, .068], [.235, .05], [.2, .02], [.16, .04]]), { fill: WASH2, stroke: false, halo: false });
    p.dot(...H(.115, .078), Math.max(1.2, .011 * g));
    p.line(C_map(H, [[.095, .1], [.135, .097]]), { w: .6, halo: false, amp: .1 });
    p.line(C_map(H, [[.22, .004], [.15, .005]]), { w: .6, halo: false, amp: .1 });
    p.shape(C_map(H, [[.03, .105], [.075, .115], [.07, .05], [.045, -.02], [.015, .0], [.01, .06]]), { fill: INK, w: .7, amp: .2 });
    return { mouth: H(.235, .0), nose: H(.25, .04) };
  }
  function C_dogFront(p, S, o) {
    const g = o.g, G = S.G, xc = o.bx, F = (u, v) => [xc + u * g, G - v * g];
    const tl = o.tilt || 0, HP = [0, .355], H = (u, v) => { const q = rot([u, v], HP, -tl); return F(q[0], q[1]); };
    shadow(p, xc, G, .22 * g);
    p.g();
    const wag = o.wag || 0;
    p.line(C_map(F, [[.12, .05], [.2, .06 + wag * .02], [.26 + wag * .01, .1 + wag * .07]]), { w: 1.3 });
    p.shape(C_map(F, [[-.15, .0], [-.175, .07], [-.14, .17], [-.1, .28], [-.06, .345], [.06, .345], [.1, .28], [.14, .17], [.175, .07], [.15, .0]]), { fill: '#fff' });
    [-1, 1].forEach(s => { p.circ(...F(s * .135, .018), .03 * g, { sy: .55, fill: '#fff', w: .8, n: 8 }); });
    [-1, 1].forEach(s => { p.line(C_map(F, [[s * .048, .24], [s * .052, .02]]), { w: 1 }); });
    [-1, 1].forEach(s => { p.circ(...F(s * .055, .018), .027 * g, { sy: .6, fill: '#fff', w: .8, n: 8 }); if (o.dirt) p.circ(...F(s * .055, .02), .02 * g, { sy: .5, fill: WASH2, stroke: false, halo: false, n: 8 }); });
    p.line(C_map(F, [[-.07, .335], [0, .325], [.07, .335]]), { w: 1.6, amp: .15 });
    p.g();
    [-1, 1].forEach(s => p.shape(C_map(H, [[s * .07, .535], [s * .12, .535], [s * .145, .47], [s * .13, .39], [s * .1, .395], [s * .085, .46]]), { fill: INK, w: .7, amp: .2 }));
    p.shape(C_map(H, [[-.095, .47], [-.078, .528], [0, .552], [.078, .528], [.095, .47], [.084, .395], [.042, .358], [-.042, .358], [-.084, .395]]), { fill: '#fff' });
    p.circ(...H(0, .403), .055 * g, { sy: .62, fill: '#fff', w: .7, halo: false, n: 10 });
    if (o.dirt) { p.shape(C_map(H, [[-.04, .445], [.025, .458], [.05, .43], [.015, .408], [-.035, .418]]), { fill: 'rgba(31,26,23,.3)', stroke: false, halo: false }); [[-.05, .5], [.04, .52], [.06, .47], [-.02, .53], [.0, .455]].forEach(([u, v]) => p.dot(...H(u, v), Math.max(1, .007 * g), 'rgba(31,26,23,.6)')); }
    p.shape(C_map(H, [[-.02, .427], [.02, .427], [.016, .41], [-.016, .41]]), { fill: INK, w: .7, halo: false, amp: .1 });
    [-1, 1].forEach(s => { p.dot(...H(s * .04, .47), Math.max(1.3, .012 * g)); p.line(C_map(H, [[s * .055, .5], [s * .025, .505]]), { w: .6, halo: false, amp: .1 }); });
    const tg = o.tongue || 0;
    p.line(C_map(H, [[-.032, .39], [0, .382], [.032, .39]]), { w: .65, halo: false, amp: .1 });
    p.shape(C_map(H, [[-.016, .386], [-.017, .35 - tg * .012], [0, .336 - tg * .015], [.017, .35 - tg * .012], [.016, .386]]), { fill: '#fff', w: .7, halo: false, amp: .1 });
    p.line(C_map(H, [[0, .382], [0, .356 - tg * .01]]), { w: .45, halo: false, amp: .05 });
    p.circ(...F(0, .315), .016 * g, { fill: '#fff', w: .7, halo: false, n: 8 });
    if (o.dirt) { p.g(); p.shape(C_map(H, [[-.05, .546], [-.035, .572], [-.01, .578], [.005, .595], [.03, .58], [.055, .55], [.0, .553]]), { fill: '#B9AFA4', w: .75, amp: .3 }); p.dot(...H(-.01, .575), 1, 'rgba(31,26,23,.5)'); p.dot(...H(.025, .565), 1, 'rgba(31,26,23,.5)'); }
  }
  function C_clump(p, x, y, r, a, op) {
    const pts = []; for (let i = 0; i < 6; i++) { const b = a + i / 6 * Math.PI * 2; const rr = r * (.75 + ((i * 37) % 5) * .08); pts.push([x + Math.cos(b) * rr, y + Math.sin(b) * rr * .8]); }
    p.shape(pts, { fill: '#B9AFA4', w: .7, amp: r * .08, op });
  }
  GAGS.C_dog = {
    name: 'Good Boy', dur: 4.1, ones: [[1.1, 1.9]],
    cues: [[0.05, 'trot'], [0.62, 'sniff-sniff'], [1.08, 'chomp'], [1.16, 'growl-tug'], [1.2, 'paper-drag-loop'], [1.96, 'dig'], [2.12, 'dig'], [2.28, 'dig'], [2.44, 'dig'], [2.72, 'trot'], [3.06, 'sit'], [3.16, 'pant-loop'], [3.4, 'head-tilt']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.12;
      S.xs = c.x + c.w * .36; S.x0 = -.5 * g;
      S.xc = c.x + c.w * .5;
      S.clumps = Array.from({ length: 16 }, (_, i) => ({ t0: 1.96 + Math.floor(i / 4) * .16 + (i % 4) * .025, x1: W * (.05 + rnd(S.seed + 61, i) * .5), h: U * (.4 + rnd(S.seed + 63, i) * .45), r: U * (i % 4 === 0 ? .065 : .028 + rnd(S.seed + 65, i) * .022), a: rnd(S.seed + 67, i) * 6 }));
    },
    pose(S, t) {
      const { g, G, U } = S;
      if (t < .55) { const x = lerp(S.x0, S.xs, t / .55); return { bx: x, moving: true, ph: (x - S.x0) / (.3 * g), wag: Math.sin(t * 30) }; }
      if (t < 1.12) {
        const o = { bx: S.xs, hr: 0, wag: Math.sin(t * 30) };
        if (t >= .6 && t < 1.0) o.hr = .22 + Math.sin((t - .6) * 40) * .03;
        if (t >= 1.0) o.hr = lerp(.22, .3, seg(t, 1.0, 1.08));
        return o;
      }
      if (t < 1.92) {
        const k = seg(t, 1.2, 1.92), x = lerp(S.xs, S.xs - (S.c.x + S.c.w + .35 * g), E.in(k));
        return { bx: x, moving: t >= 1.2, ph: -(S.xs - x) / (.24 * g), hr: .3 + Math.sin(t * 34) * .07, brace: true, wag: 0 };
      }
      if (t >= 2.72 && t < 3.06) { const x = lerp(S.x0, S.xc, E.out(seg(t, 2.72, 3.06))); return { bx: x, moving: true, ph: (x - S.x0) / (.3 * g), wag: Math.sin(t * 30), dirt: true }; }
      return null;
    },
    draw(S, t, p) {
      const { U, G, c, g } = S;
      // dirt flung in from off-screen left
      p.g();
      S.clumps.forEach(q => {
        if (t < q.t0) return;
        const k = seg(t, q.t0, q.t0 + .38), x = lerp(-U * .1, q.x1, k), y = lerp(G - U * .2, G - q.r * .7, k) - q.h * 4 * k * (1 - k) * .9;
        C_clump(p, x, y, q.r, q.a + k * 4, 1);
      });
      if (t >= 2.0) { p.g({ halo: false }); const k = seg(t, 2.0, 2.6), r = U * (.14 + .16 * k); p.shape([[-U * .1, G], [-U * .05, G - r * .42], [r * .2, G - r * .5], [r * .62, G - r * .25], [r * .95, G]], { fill: '#B9AFA4', w: .8 }); for (let i = 0; i < 9; i++) p.dot(-U * .02 + (rnd(5, i) - .3) * r * .9, G - rnd(6, i) * r * .4, 1, 'rgba(31,26,23,.5)'); }
      if (t >= 1.94) S.setCard({ hide: true });
      const P = this.pose(S, t);
      if (P) {
        const R = C_dogSide(p, S, Object.assign({ g, f: 1 }, P));
        if (t >= 1.08) {
          if (!S.grab0) { const Q = this.pose(S, 1.1); const tmp = new Pen(0, U, 1); S.grab0 = C_dogSide(tmp, S, Object.assign({ g, f: 1 }, Q)).mouth; }
          if (t < 1.94) {
            const m = R.mouth, wob = t >= 1.2 ? Math.sin(t * 34) * 1.6 : 0;
            S.setCard({ px: S.grab0[0] - c.x, py: S.grab0[1] - c.y, tx: m[0] - S.grab0[0], ty: m[1] - S.grab0[1], rot: -2.5 * seg(t, 1.12, 1.3) + wob });
          } else S.setCard({ hide: true });
        }
        if (t >= 1.08 && t < 1.18) burst(p, R.mouth, U * .04, U * .08, 5, -1.2, .6);
        if (t >= .62 && t < 1.0) { p.g({ halo: false }); const n = R.nose, s = Math.floor(t * 12) % 2; [[.03, -.02], [.05, .0], [.03, .02]].forEach(([a, b], i) => { if ((i + s) % 2 === 0) p.line([[n[0] + a * U * .6, n[1] + b * U], [n[0] + (a + .035) * U * .6, n[1] + b * U * 1.6]], { w: .6, amp: .1 }); }); }
        if (t >= 1.25 && t < 1.92) { p.g({ halo: false }); for (let i = 0; i < 3; i++) { const x = P.bx + g * (.62 + i * .14); p.line([[x, G - U * (.01 + (i % 2) * .015)], [x + U * .07, G - U * (.006 + (i % 2) * .015)]], { w: .6, color: 'rgba(31,26,23,.45)' }); } }
      } else if (t >= 3.06) {
        const tilt = t >= 3.4 && t < 3.66 ? .32 * Math.sin(seg(t, 3.4, 3.66) * Math.PI / 2) : t >= 3.66 ? .32 : 0;
        C_dogFront(p, S, { g, bx: S.xc, wag: Math.sin(t * 26), tongue: .5 + .5 * Math.sin(t * 18), dirt: true, tilt });
      } else if (t >= 1.94) S.setCard({ hide: true });
    }
  };

  /* ═════════ C3. THE SKUNK — tail up; the cartoon does not stay for the rest ═════════ */
  function C_plume(L, b0, c1, e1, w0, w1, n) {   // a bushy tail outline along a quadratic centreline (local coords)
    const C = u => [qb(b0[0], c1[0], e1[0], u), qb(b0[1], c1[1], e1[1], u)];
    const lft = [], rgt = [], mid = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, P = C(u), Q = C(Math.min(1, u + .02)), R = C(Math.max(0, u - .02));
      const tx = Q[0] - R[0], ty = Q[1] - R[1], d = Math.hypot(tx, ty) || 1, nx = -ty / d, ny = tx / d;
      const w = w0 + (w1 - w0) * Math.sin(Math.PI * Math.pow(u, .7)) * (u > .85 ? 1 - (u - .85) / .15 * .6 : 1);
      lft.push(L(P[0] + nx * w, P[1] + ny * w)); rgt.push(L(P[0] - nx * w, P[1] - ny * w)); mid.push(L(P[0], P[1]));
    }
    return { outline: lft.concat(rgt.reverse()), mid };
  }
  function C_skunkDraw(p, S, o) {
    const g = o.g, G = S.G, f = o.f, L = C_frame(o.bx, G, f, g), r = o.raise || 0, q = o.quiver || 0;
    shadow(p, o.bx, G, .2 * g);
    const tail = C_plume(L, [-.16, .19], [lerp(-.34, -.33, r), lerp(.16, .56, r)], [lerp(-.42, -.06 + q * .01, r), lerp(.3, .64, r)], .028, .085, 12);
    const ph = o.ph || 0, legs = [[.11, 0, 1], [-.12, .5, 1], [.14, .5, 0], [-.09, 0, 0]];
    const leg = ([lx, off]) => { const [dx, lf] = o.moving ? C_step(ph, off, .03, .025) : [0, 0]; p.line([L(lx, .1), L(lx + dx, lf)], { w: 2.2, amp: .2 }); };
    p.g();
    legs.filter(l => l[2]).forEach(leg);
    if (r < .5) { p.shape(tail.outline, { fill: INK, amp: 1.1, w: .8 }); p.line(tail.mid.slice(2, 11), { color: '#fff', w: 1.6, halo: false, amp: .3 }); }
    p.shape(C_map(L, [[.17, .225], [.05, .275], [-.1, .275], [-.185, .225], [-.205, .14], [-.15, .08], [0, .07], [.13, .085], [.19, .15]]), { fill: INK });
    p.line(C_map(L, [[.16, .24], [.05, .262], [-.08, .262], [-.17, .215]]), { color: '#fff', w: 2.3, halo: false, amp: .3 });
    legs.filter(l => !l[2]).forEach(leg);
    if (r >= .5) { p.g(); p.shape(tail.outline, { fill: INK, amp: 1.1, w: .8 }); p.line(tail.mid.slice(2, 11), { color: '#fff', w: 1.8, halo: false, amp: .3 }); }
    // head: side (facing f, or turned back with o.back) or front
    p.g();
    const hc = L(.24, .2);
    if (o.front) {
      const H = (u, v) => [hc[0] + u * g, hc[1] - v * g];
      p.circ(...H(-.055, .065), .025 * g, { fill: INK, w: .8, n: 8 }); p.circ(...H(.055, .065), .025 * g, { fill: INK, w: .8, n: 8 });
      p.shape(C_map(H, [[-.075, .02], [-.06, .065], [0, .08], [.06, .065], [.075, .02], [.04, -.04], [0, -.065], [-.04, -.04]]), { fill: INK });
      p.line(C_map(H, [[0, .075], [0, -.02]]), { color: '#fff', w: 1.9, halo: false, amp: .15 });
      [-1, 1].forEach(s => { const e = H(s * .033, .012); p.circ(e[0], e[1], .016 * g, { fill: '#fff', stroke: false, n: 8 }); if (o.lid) p.shape([[e[0] - .018 * g, e[1] - .019 * g], [e[0] + .018 * g, e[1] - .019 * g], [e[0] + .018 * g, e[1] + .001 * g], [e[0] - .018 * g, e[1] + .001 * g]], { fill: INK, stroke: false }); p.dot(e[0], e[1] + .004 * g, Math.max(1, .008 * g)); });
      p.dot(...H(0, -.055), Math.max(1.3, .011 * g), '#fff');
      return;
    }
    const hf = o.back ? -f : f, H = (u, v) => [hc[0] + hf * u * g, hc[1] - v * g];
    p.circ(...H(-.015, .07), .022 * g, { fill: INK, w: .8, n: 8 });
    p.shape(C_map(H, [[-.06, .02], [-.035, .065], [.02, .07], [.06, .04], [.11, .0], [.1, -.025], [.04, -.04], [-.03, -.035], [-.065, -.01]]), { fill: INK });
    p.line(C_map(H, [[-.02, .06], [.05, .035], [.085, .01]]), { color: '#fff', w: 1.6, halo: false, amp: .15 });
    const e = H(.03, .012);
    p.circ(e[0], e[1], .015 * g, { fill: '#fff', stroke: false, n: 8 });
    if (o.lid) p.shape([[e[0] - .017 * g, e[1] - .018 * g], [e[0] + .017 * g, e[1] - .018 * g], [e[0] + .017 * g, e[1] + .001 * g], [e[0] - .017 * g, e[1] + .001 * g]], { fill: INK, stroke: false });
    p.dot(e[0] + hf * .004 * g, e[1] + .002 * g, Math.max(1, .008 * g));
    p.dot(...H(.108, -.012), Math.max(1.2, .01 * g), '#fff');
    return { nose: H(.115, -.01), tip: tail.mid[tail.mid.length - 1], base: tail.mid[2] };
  }
  GAGS.C_skunk = {
    name: 'The Skunk', dur: 3.9, ones: [[1.98, 2.3]],
    cues: [[0.05, 'pitter-patter'], [0.74, 'glance'], [1.02, 'tail-fwump'], [1.3, 'pfffft'], [1.55, 'card-shiver'], [2.02, 'gulp-squeak'], [2.12, 'zip-away'], [2.86, 'glance'], [3.1, 'tail-flop']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.08;
      S.xs = c.x + c.w * .3; S.x0 = -.5 * g;
      S.puffs = Array.from({ length: 14 }, (_, i) => { const u = i / 13; return { t0: 1.28 + u * .45, dx: U * (.1 + u * 1.25 + (rnd(S.seed + 71, i) - .5) * .25), dy: U * (-.05 - Math.sin(u * Math.PI) * .25 + (rnd(S.seed + 73, i) - .5) * .35), r: U * (.15 + rnd(S.seed + 75, i) * .1) }; });
    },
    draw(S, t, p) {
      const { U, G, c, W, g } = S;
      const o = { g, f: 1, bx: S.xs };
      if (t < .6) { const k = t / .6; o.bx = lerp(S.x0, S.xs, k); o.moving = true; o.ph = (o.bx - S.x0) / (.2 * g); }
      o.raise = t < 1.0 ? 0 : t < 1.16 ? E.back(seg(t, 1.0, 1.16)) : t < 3.1 ? 1 : 1 - E.io(seg(t, 3.1, 3.4));
      o.quiver = t >= 1.2 && t < 1.45 ? Math.sin(t * 90) : 0;
      o.front = (t >= .74 && t < 1.0) || t >= 2.86;
      o.lid = t >= 3.0;
      // the card: shivers, gulps (squash, leans back), then bolts off right
      if (t >= 1.5 && t < 2.0) { const j = Math.floor(t * 24); S.setCard({ tx: (j % 2 ? 1.4 : -1.4), kx: (j % 2 ? .8 : -.8) }); }
      else if (t >= 2.0 && t < 2.1) { const k = E.out(seg(t, 2.0, 2.1)); S.setCard({ px: c.w / 2, py: c.h, tx: -6 * k, sx: 1 - .05 * k, sy: 1 + .03 * k, kx: 8 * k }); }
      else if (t >= 2.1 && t < 2.24) { const k = E.in(seg(t, 2.1, 2.24)); S.setCard({ px: c.w / 2, py: c.h, tx: -6 + k * (W + 40), sx: .95 + .1 * k, sy: 1.03 - .06 * k, kx: lerp(8, -14, Math.min(1, k * 3)), hide: k >= 1 }); }
      else if (t >= 2.24) S.setCard({ hide: true });
      // the zip: speed lines and dust where it stood
      if (t >= 2.14 && t < 2.6) {
        const k = seg(t, 2.14, 2.6), x0 = c.x + c.w * (.2 + k * .5);
        p.g({ halo: false, op: 1 - k });
        for (let i = 0; i < 6; i++) { const y = c.y + c.h * (.12 + i * .15); p.line([[x0 + (i % 2) * 20, y], [W + 10, y]], { w: .8, color: 'rgba(31,26,23,.55)', amp: .3 }); }
      }
      const R = C_skunkDraw(p, S, o) || {};
      // the cloud: rolls up out of the tail and across the cartoon, then thins
      if (t >= 1.3) {
        const op = 1 - seg(t, 2.5, 3.25), tip = S.tip || (S.tip = (() => { const T = new Pen(0, U, 1); return C_skunkDraw(T, S, Object.assign({}, o, { raise: 1, front: false, back: false, bx: S.xs })).tip; })());
        if (op > 0) {
          const pf = S.puffs.filter(q => t >= q.t0).map(q => { const k = E.out(seg(t, q.t0, q.t0 + .7)), dr = seg(t, 2.2, 3.4); return [tip[0] + q.dx * k + dr * U * .15, tip[1] + q.dy * k - dr * U * .2, q.r * (.25 + .75 * k) * (1 + dr * .2)]; });
          p.g({ halo: false, op: op * .92 });
          pf.forEach(([x, y, r]) => p.circ(x, y, r, { w: 1.3, color: 'rgba(31,26,23,.4)', n: 12, amp: r * .05 }));
          pf.forEach(([x, y, r]) => p.circ(x, y, r, { fill: 'rgba(228,222,213,.82)', stroke: false, n: 12, amp: r * .05 }));
          // stink lines, wavering upward
          p.g({ halo: false, op });
          for (let i = 0; i < 4; i++) {
            const k = seg(t, 1.4 + i * .08, 2.2 + i * .08); if (k <= 0) continue;
            const x = tip[0] + U * (.3 + i * .3), y0 = tip[1] + U * .15 - k * U * .3, pts = [];
            for (let j = 0; j <= 8; j++) pts.push([x + Math.sin(j * 1.3 + t * 14 + i) * U * .035, y0 - j * U * .055]);
            p.line(pts, { w: .9, color: 'rgba(31,26,23,.7)', amp: .3 });
          }
        }
      }
    }
  };

  /* ═════════ C4. TIMBER — a beaver gnaws it down to a point; it goes over ═════════ */
  function C_beaverDraw(p, S, o) {
    const g = o.g, G = S.G, f = o.f, L = C_frame(o.bx, G - (o.hop || 0), f, g);
    shadow(p, o.bx, G, .2 * g);
    p.g();
    const tb = [-.1, .03], ta = o.tail || 0, T = (x, y) => { const q = rot([x, y], tb, -ta); return L(q[0], q[1]); };
    p.shape(C_map(T, [[-.08, .052], [-.2, .07], [-.33, .066], [-.395, .038], [-.36, .0], [-.22, -.004], [-.09, .008]]), { fill: '#fff' });
    p.shape(C_map(T, [[-.1, .045], [-.2, .06], [-.32, .056], [-.37, .036], [-.34, .01], [-.22, .006], [-.11, .014]]), { fill: WASH2, stroke: false, halo: false });
    [[-.16, .065, -.13, .002], [-.23, .068, -.2, .0], [-.3, .062, -.27, .002], [-.14, .02, -.33, .05]].forEach(([a, b, c2, d]) => p.line([T(a, b), T(c2, d)], { w: .45, halo: false, amp: .1 }));
    const w = o.waddle || 0;
    p.shape(C_map(L, [[-.04, .0], [.13, .0], [.15, .018], [.02, .03]]), { fill: '#fff', w: .9 });
    p.shape(C_map(L, [[.1 + w * .01, .02], [.14, .12], [.13, .24], [.09, .33], [.03, .37], [-.06, .35], [-.12, .26], [-.14, .13], [-.11, .03], [-.03, .0]]), { fill: '#fff' });
    p.shape(C_map(L, [[.1, .06], [.125, .14], [.115, .23], [.075, .3], [.04, .24], [.05, .12]]), { fill: WASH, stroke: false, halo: false });
    [[-.09, .22], [-.1, .14], [-.06, .29]].forEach(([x, y]) => p.line([L(x, y), L(x - .02, y - .025)], { w: .5, halo: false, amp: .1 }));
    // head (chatters while gnawing)
    const ch = o.chew || 0, hr = (o.look || 0) + ch * .06, HP = [.06, .36];
    const H = (x, y) => { const q = rot([x, y], HP, hr); return L(q[0], q[1]); };
    p.g();
    p.circ(...H(.035, .49), .02 * g, { fill: '#fff', w: .8, n: 8 });
    p.shape(C_map(H, [[-.005, .42], [.02, .478], [.08, .5], [.14, .482], [.19, .445], [.212, .41], [.19, .384], [.13, .372], [.06, .378], [.012, .392]]), { fill: '#fff' });
    const tth = ch > 0 ? .006 : 0;
    p.shape(C_map(H, [[.148, .38], [.188, .382], [.186, .335 - tth], [.15, .336 - tth]]), { fill: '#fff', w: .8, amp: .1 });
    p.line([H(.168, .38), H(.168, .338 - tth)], { w: .5, halo: false, amp: .05 });
    p.dot(...H(.205, .418), Math.max(1.4, .014 * g));
    p.dot(...H(.125, .455), Math.max(1.2, .011 * g));
    p.line(C_map(H, [[.105, .475], [.145, .47]]), { w: .55, halo: false, amp: .1 });
    p.line(C_map(H, [[.18, .4], [.25, .412]]), { w: .4, halo: false, amp: .1 }); p.line(C_map(H, [[.18, .393], [.245, .385]]), { w: .4, halo: false, amp: .1 });
    const pw = o.paws ? [H(.15, .31), H(.17, .3)] : [L(.16, .22), L(.18, .21)];
    p.line([L(.08, .28), pw[0]], { w: 1 }); p.circ(pw[0][0], pw[0][1], .016 * g, { fill: '#fff', w: .7, n: 7 });
    return { mouth: H(.19, .36) };
  }
  GAGS.C_beaver = {
    name: 'Timber', dur: 3.95, ones: [[.78, 1.46], [1.6, 2.26], [2.8, 3.24]],
    cues: [[0.05, 'waddle'], [0.55, 'hmm'], [0.8, 'gnaw-loop'], [1.44, 'gnaw-stop'], [1.5, 'hop'], [1.62, 'gnaw-loop'], [2.24, 'gnaw-stop'], [2.4, 'creak'], [2.62, 'creak'], [2.8, 'whoosh'], [3.16, 'distant-crash'], [3.42, 'tail-slap'], [3.58, 'tail-slap']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.05;
      const H0 = S.H0 = c.h * .34, w = c.w, h = c.h;
      S.M = [[c.x + w * .25, c.y + h - H0 / 2], [c.x + w * .75, c.y + h - H0 / 2]];
      const T = new Pen(0, U, 1), m0 = C_beaverDraw(T, S, { g, f: 1, bx: 0, chew: 0, paws: true }).mouth;
      S.st = [S.M[0][0] - m0[0], S.M[1][0] + m0[0]];
      S.x0 = -.5 * g; S.xw = c.x + c.w * .3;
      S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}bv" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${w + 120}" height="${h + 120}"><rect x="-60" y="-60" width="${w + 120}" height="${h + 120}" fill="#fff"/><path class="cutL" fill="#000"/><path class="cutR" fill="#000"/></mask>`);
      S.cardIn.setAttribute('mask', `url(#${S.id}bv)`);
      S.cutL = S.defs.querySelector('.cutL'); S.cutR = S.defs.querySelector('.cutR');
      S.chips = [];
      for (let i = 0; i < 26; i++) { const side = i < 13 ? 0 : 1, t0 = (side ? 1.62 : .8) + (i % 13) * .048; S.chips.push({ side, t0, vx: (side ? -1 : 1) * (.2 + rnd(S.seed + 81, i) * .6) * (rnd(S.seed + 82, i) < .4 ? -1 : 1), vy: .5 + rnd(S.seed + 83, i) * .7, a: rnd(S.seed + 84, i) * 6, sz: .018 + rnd(S.seed + 85, i) * .016 }); }
    },
    cutPath(S, side, k, withCorner) {   // scalloped bite edge, card-local
      const { c, H0 } = S, w = c.w, h = c.h;
      if (k <= 0) return '';
      const sx = side ? -1 : 1, x0 = side ? w : 0;
      const A = [x0, h - H0 * k], B = [x0 + sx * w / 2 * k, h], d = [B[0] - A[0], B[1] - A[1]], len = Math.hypot(d[0], d[1]);
      let nx = H0 * sx, ny = -w / 2; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      const n = Math.max(2, Math.round(len / (S.U * .07)));
      let D = withCorner ? `M${x0 + sx * -8},${h + 12}L${x0 + sx * -8},${A[1].toFixed(1)}L${A[0]},${A[1].toFixed(1)}` : `M${A[0]},${A[1].toFixed(1)}`;
      for (let i = 1; i <= n; i++) {
        const P = [A[0] + d[0] * i / n, A[1] + d[1] * i / n], Q = [A[0] + d[0] * (i - .5) / n, A[1] + d[1] * (i - .5) / n], b = S.U * (.022 + ((i * 7) % 3) * .006);
        D += `Q${(Q[0] + nx * b).toFixed(1)},${(Q[1] + ny * b).toFixed(1)} ${P[0].toFixed(1)},${P[1].toFixed(1)}`;
      }
      if (withCorner) D += `L${B[0].toFixed(1)},${h + 12}Z`;
      return D;
    },
    draw(S, t, p) {
      const { U, G, c, W, g } = S, w = c.w, h = c.h;
      const kL = E.io(seg(t, .8, 1.44)), kR = E.io(seg(t, 1.62, 2.24));
      S.cutL.setAttribute('d', this.cutPath(S, 0, kL, true)); S.cutR.setAttribute('d', this.cutPath(S, 1, kR, true));
      S.over.innerHTML = [this.cutPath(S, 0, kL, false), this.cutPath(S, 1, kR, false)].filter(Boolean).map(d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      // the card: balances on its point, wobbles, goes over to the right and off
      if (t >= 2.3 && t < 2.8) { const k = seg(t, 2.3, 2.8); S.setCard({ px: w / 2, py: h, rot: Math.sin(k * Math.PI * 3) * (1.5 + k * 3.5) }); }
      else if (t >= 2.8) { const k = seg(t, 2.8, 3.16); S.setCard({ px: w / 2, py: h, rot: 3.5 + E.in(k) * 100, tx: E.in(k) * (W * .55), ty: E.in(k) * U * .15, hide: k >= 1 }); }
      // beaver
      const o = { g, f: 1, bx: S.st[0] };
      if (t < .5) { o.bx = lerp(S.x0, S.st[0], t / .5); o.hop = Math.abs(Math.sin(t / .5 * Math.PI * 3)) * U * .03; o.waddle = Math.sin(t * 30); }
      else if (t < .8) { o.look = t < .62 ? -.35 * E.io(seg(t, .5, .62)) : -.35 * (1 - E.io(seg(t, .66, .78))); o.paws = t >= .7; }
      else if (t < 1.46) { o.chew = Math.sin(t * 90); o.paws = true; }
      else if (t < 1.62) { const k = seg(t, 1.46, 1.6); o.bx = lerp(S.st[0], S.st[1], E.io(k)); o.hop = Math.sin(k * Math.PI) * U * .12; o.f = k < .5 ? 1 : -1; }
      else if (t < 2.26) { o.f = -1; o.bx = S.st[1]; o.chew = Math.sin(t * 90); o.paws = true; }
      else if (t < 2.4) { const k = seg(t, 2.26, 2.4); o.f = -1; o.bx = lerp(S.st[1], S.xw + U * .4, E.io(k)); o.hop = Math.sin(k * Math.PI) * U * .08; }
      else { o.f = t < 2.5 ? -1 : 1; o.bx = S.xw + U * .4 * (1 - E.io(seg(t, 2.4, 2.5))); o.look = t < 3.2 ? -.4 : -.4 * (1 - seg(t, 3.2, 3.3)); if (t >= 3.0) o.look = lerp(-.4, .1, seg(t, 3.0, 3.12)); }
      if (t >= 3.16 && t < 3.3) o.hop = Math.sin(seg(t, 3.16, 3.3) * Math.PI) * U * .05;
      if (t >= 3.3) { const a = (q0, q1) => Math.sin(seg(t, q0, q1) * Math.PI); o.tail = t < 3.46 ? a(3.3, 3.42) * 1.1 : a(3.46, 3.58) * 1.1; o.look = .05; }
      // chips fly while gnawing; they settle on the ground
      p.g();
      S.chips.forEach(q => {
        if (t < q.t0) return;
        const m = S.M[q.side], tt = Math.min(t - q.t0, 1.2), x = m[0] + q.vx * U * tt * 1.4, y0 = m[1] - U * .02, y = Math.min(G - 2, y0 - q.vy * U * tt * 2 + 4.5 * U * tt * tt);
        const r = q.sz * U, a = q.a + tt * 9 * (y < G - 2 ? 1 : 0);
        p.shape([[-1, -.5], [1, -.4], [.9, .5], [-1, .4]].map(([u, v]) => rot([x + u * r, y + v * r], [x, y], a)), { fill: '#fff', w: .6, amp: .1 });
      });
      // the crash, off right: dust coming back in from the edge
      if (t >= 3.14 && t < 3.8) {
        const k = E.out(seg(t, 3.14, 3.6)), op = 1 - seg(t, 3.45, 3.8);
        C_puffs(p, [[W + U * .05 - k * U * .2, G - U * .1 - k * U * .1, U * (.12 + .1 * k)], [W - k * U * .35, G - U * .05, U * (.08 + .06 * k)], [W + U * .02 - k * U * .1, G - U * .25 - k * U * .2, U * (.1 + .08 * k)]], op);
      }
      C_beaverDraw(p, S, o);
      [3.42, 3.58].forEach(ts => { if (t >= ts && t < ts + .08) { const tp = C_frame(o.bx, G, o.f, g)(-.36, 0); burst(p, [tp[0], G - 2], U * .04, U * .09, 5, -Math.PI * .9, .6); } });
      if (t >= .8 && t < 2.26 && !(t >= 1.46 && t < 1.62)) { const m = S.M[t < 1.5 ? 0 : 1]; burst(p, m, U * .03, U * .07, 4, t * 7, .55); }
    }
  };

  /* ═════════ C5. THE KANGAROO — checks left, checks right, pockets it, whistles, hops ═════════ */
  function C_note(p, x, y, s, op) {
    p.g({ op });
    p.circ(x, y, s * .32, { sx: 1.25, fill: INK, w: .6, n: 7, amp: .1, a0: -.4 });
    p.line([[x + s * .36, y - s * .05], [x + s * .38, y - s * 1.15], [x + s * .8, y - s * .85]], { w: .8, amp: .1 });
  }
  function C_roo(p, S, o) {
    const g = o.g, G = S.G, f = o.f, by = G - (o.y || 0), tilt = o.tilt || 0;
    const L = C_frame(o.bx, by, f, g, tilt, [0, .15]);
    shadow(p, o.bx, G, .25 * g, o.y ? clamp(1 - o.y / (g * .5), .3, 1) : 1);
    p.g();
    const air = o.air || 0, cr = o.crouch || 0;
    // tail
    p.shape(C_map(L, [[-.1, .26], [-.22, .16 + air * .05], [-.35, .075 + air * .09], [-.5, .025 + air * .12], [-.49, .0 + air * .12], [-.33, .008 + air * .07], [-.2, .04 + air * .03], [-.1, .1]]), { fill: '#fff' });
    // far foot, then body
    const ft = air ? [[-.06, .05], [.06, -.06], [.18, -.12]] : [[-.06, .0], [.06, .0], [.18, .0]];
    const fy = cr * .02;
    p.shape(C_map(L, [ft[0], ft[2], [ft[2][0] + .01, ft[2][1] + .02], [ft[0][0] + .04, ft[0][1] + .035]]), { fill: '#fff', w: .9 });
    const B = [[-.155, .2 - cr * .04], [-.16, .33 - cr * .05], [-.11, .46 - cr * .05], [-.035, .6 - cr * .05], [.04, .665 - cr * .05], [.1, .635 - cr * .05], [.105, .55 - cr * .05], [.15, .43 - cr * .05], [.165, .31 - cr * .04], [.13, .19 - cr * .02], [.06, .1 + fy], [.04, .04], [-.07, .045], [-.145, .11]];
    if (air) { B[10] = [-.02, .1]; B[11] = [-.05, .06]; B[12] = [-.1, .08]; }
    p.shape(C_map(L, B), { fill: '#fff' });
    p.line(C_map(L, [[.05, .12 + fy], [-.04, .2], [-.1, .32]]), { w: .6, halo: false });
    p.shape(C_map(L, [[-.06, .33], [-.1, .26], [-.135, .18], [-.12, .28]]), { fill: WASH, stroke: false, halo: false });
    // pouch, and the bulge once it is in
    const py = -cr * .04;
    if (o.bulge) { const bp = [[.15, .405 + py], [.225, .392 + py], [.232, .262 + py], [.155, .238 + py]]; p.shape(C_map(L, bp.concat([[.1, .3 + py]])), { fill: '#fff', stroke: false }); p.line(C_map(L, bp), { w: 1 }); p.line(C_map(L, [[.12, .37 + py], [.175, .382 + py], [.222, .378 + py]]), { w: .6, halo: false }); }
    else p.line(C_map(L, [[.16, .38 + py], [.12, .356 + py], [.065, .35 + py]]), { w: .75, halo: false });
    // arms
    const sh = L(.06, .56 - cr * .05), pw = o.paw || L(.17, .5 - cr * .05);
    const el = [lerp(sh[0], pw[0], .5) + f * .015 * g, lerp(sh[1], pw[1], .5) + .035 * g];
    p.g(); p.line([sh, el, pw], { w: 1.05 }); p.circ(pw[0], pw[1], .017 * g, { fill: '#fff', w: .7, n: 7 });
    // head (o.glance flips it to look back)
    const hc = L(.1, .74 - cr * .05), hf = (o.glance ? -1 : 1) * f, hl = o.look || 0;
    const H = (u, v) => { const q = rot([u, v], [0, 0], hl); return [hc[0] + hf * q[0] * g, hc[1] - q[1] * g]; };
    p.g();
    p.shape(C_map(H, [[-.05, .02], [-.075, .14], [-.03, .04]]), { fill: '#fff', w: .85 });
    p.shape(C_map(H, [[-.05, .01], [-.01, .045], [.04, .035], [.12, .0], [.14, -.025], [.12, -.045], [.04, -.05], [-.025, -.04], [-.055, -.015]]), { fill: '#fff' });
    p.shape(C_map(H, [[-.025, .035], [-.03, .155], [.005, .045]]), { fill: '#fff', w: .85 });
    p.line(C_map(H, [[-.02, .06], [-.022, .12]]), { w: .5, halo: false });
    if (o.whistle) p.circ(...H(.135, -.03), .012 * g, { w: .8, halo: false, n: 7 });
    else p.line(C_map(H, [[.12, -.035], [.07, -.038]]), { w: .55, halo: false, amp: .1 });
    p.dot(...H(.05, .005), Math.max(1.2, .011 * g));
    p.line(C_map(H, [[.03, .028], [.07, .022]]), { w: .55, halo: false, amp: .1 });
    p.dot(...H(.138, -.012), Math.max(1.3, .012 * g));
    return { pouch: L(.13, .36 + py), mouth: H(.15, -.03), paw: pw };
  }
  GAGS.C_kangaroo = {
    name: 'The Kangaroo', dur: 3.7, ones: [[1.18, 1.7], [2.5, 3.3]],
    cues: [[0.05, 'boing'], [0.3, 'boing'], [0.74, 'glance'], [0.9, 'glance'], [1.2, 'paper-fold'], [1.33, 'paper-fold'], [1.6, 'stuff'], [1.7, 'pat-pat'], [1.86, 'innocent-whistle'], [2.52, 'boing'], [2.88, 'boing']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.02;
      S.xs = c.x + c.w * .2; S.x0 = -.7 * g;
      S.hops = [[0, .3, S.x0, lerp(S.x0, S.xs, .5)], [.3, .58, lerp(S.x0, S.xs, .5), S.xs], [2.52, 2.88, S.xs, S.xs + U * 1.0], [2.88, 3.24, S.xs + U * 1.0, W + U * .9]];
    },
    draw(S, t, p) {
      const { U, G, c, W, g } = S, w = c.w, h = c.h;
      const o = { g, f: 1, bx: S.xs };
      const hop = S.hops.find(([a, b]) => t >= a && t < b);
      if (hop) { const [a, b, x0, x1] = hop, k = seg(t, a, b); o.bx = lerp(x0, x1, k); o.y = Math.sin(k * Math.PI) * U * .5; o.air = k > .12 && k < .88 ? 1 : 0; o.tilt = o.air ? .35 : 0; o.crouch = o.air ? 0 : .6; }
      else if (t >= 3.24) o.bx = W + U * 2;
      else if (t < .66 && t >= .58) o.crouch = 1 - seg(t, .58, .66);
      if (t >= 2.44 && t < 2.52) o.crouch = seg(t, 2.44, 2.52);
      if (t >= .74 && t < .9) o.glance = true;
      if (t >= .9 && t < 1.04) o.look = -.12;
      if (t >= 1.86 && t < 2.44) { o.look = .3; o.whistle = true; }
      // folding: squeeze to half (fold), then a plain folded sheet folds again, flies to his paws, into the pouch
      const R0 = C_roo(new Pen(0, U, 1), S, Object.assign({}, o, { bx: S.xs, y: 0, air: 0, crouch: 0, tilt: 0 }));
      const pouch = R0.pouch;
      const busy = Math.floor(t * 24) % 2, pwUp = C_frame(S.xs, G, 1, g)(.24, busy ? .64 : .58);
      if (t >= 1.1 && t < 1.18) o.paw = mixPt(R0.paw, pwUp, E.out(seg(t, 1.1, 1.18)));
      let sheet = null;
      if (t >= 1.2 && t < 1.3) { const k = E.in(seg(t, 1.2, 1.3)); S.setCard({ px: 0, py: h / 2, sx: 1 - .5 * k }); o.paw = pwUp; }
      else if (t >= 1.3) {
        S.setCard({ hide: true });
        if (t < 1.42) { const k = E.in(seg(t, 1.33, 1.42)); sheet = { x: c.x, y: c.y + h * .5 * k, w: w / 2, h: h * (1 - .5 * k), crease: 1 }; o.paw = pwUp; }
        else if (t < 1.58) { const k = E.io(seg(t, 1.44, 1.58)), s0 = { x: c.x, y: c.y + h * .5, w: w / 2, h: h / 2 }, sz = .1 * g; sheet = { x: lerp(s0.x, pouch[0] - sz * .5, k), y: lerp(s0.y, pouch[1] - sz * 1.2, k), w: lerp(s0.w, sz, k), h: lerp(s0.h, sz * .8, k), crease: 2, rot: Math.sin(k * Math.PI) * -12 }; o.paw = [sheet.x + sheet.w * .5, sheet.y + sheet.h * .3]; }
        else if (t < 1.66) { const k = seg(t, 1.58, 1.66), sz = .1 * g; sheet = { x: pouch[0] - sz * .5, y: pouch[1] - sz * 1.2 + k * sz * 1.1, w: sz, h: sz * .8 * (1 - k * .7), crease: 2 }; o.paw = [pouch[0], sheet.y]; }
        if (t >= 1.62) o.bulge = true;
        if (t >= 1.66 && t < 1.86) o.paw = [pouch[0] + g * .02, pouch[1] + (Math.floor(t * 12) % 2 ? .0 : .02) * g];
      }
      const drawSheet = () => {   // the folded sheet: plain back of the paper, frame edge and crease
        p.g();
        const { x, y, w: sw, h: sh, rot: rr = 0 } = sheet, cc = [x + sw / 2, y + sh / 2];
        const R = pt => rot(pt, cc, rr * Math.PI / 180);
        p.shape([[x, y], [x + sw, y], [x + sw, y + sh], [x, y + sh]].map(R), { fill: '#fff', w: sw > U * .5 ? 1.8 : 1, amp: .4 });
        if (sw > U * .3) p.line([[x + 6, y + sh * .5], [x + sw - 6, y + sh * .5]].map(R), { w: .5, color: 'rgba(31,26,23,.35)', halo: false });
        p.shape([[x + sw - 2, y + 2], [x + sw - 2, y + sh - 2], [x + sw - Math.min(sw * .12, 10), y + sh - 2], [x + sw - Math.min(sw * .12, 10), y + 2]].map(R), { fill: WASH, stroke: false, halo: false });
        if (t >= 1.58) { const R2 = C_roo(new Pen(0, U, 1), S, o); p.g(); p.line([[R2.pouch[0] - .05 * g, R2.pouch[1] + .015 * g], [R2.pouch[0] + .05 * g, R2.pouch[1] + .015 * g]], { w: .75 }); }
      };
      if (sheet && t < 1.5) drawSheet();
      C_roo(p, S, o);
      if (sheet && t >= 1.5) drawSheet();
      if (t >= 1.2 && t < 1.3) C_speed(p, [[c.x + w * .7, c.y + h * .3], [c.x + w * .75, c.y + h * .5], [c.x + w * .7, c.y + h * .7]], U * .25, 0, .45);
      if (t >= 1.33 && t < 1.42) C_speed(p, [[c.x + w * .12, c.y + h * .15], [c.x + w * .25, c.y + h * .1], [c.x + w * .38, c.y + h * .15]], U * .2, -Math.PI / 2, .45);
      // whistle: notes drift up from his mouth
      if (t >= 1.9 && t < 2.9) {
        const Rm = C_roo(new Pen(0, U, 1), S, Object.assign({}, o, { bx: S.xs, look: .3, whistle: true, y: 0, air: 0, crouch: 0, tilt: 0 })).mouth;
        [1.9, 2.1, 2.3].forEach((t0, i) => { const k = seg(t, t0, t0 + .6); if (k <= 0 || k >= 1) return; C_note(p, Rm[0] + U * (.06 + k * .22 + i * .02), Rm[1] - U * (.04 + k * .3) + Math.sin(k * 9 + i) * U * .02, U * .07, 1 - E.in(k)); });
      }
      if (t >= 2.5 && t < 2.6) { p.g({ halo: false }); for (let i = 0; i < 3; i++) p.line([[S.xs - U * (.1 + i * .08), G - U * .01], [S.xs - U * (.16 + i * .08), G - U * (.04 + i * .015)]], { w: .6, color: 'rgba(31,26,23,.5)' }); }
    }
  };

  /* ═════════ C6. THE SEAGULL — lands, side-eye, and then it is his ═════════ */
  function C_gull(p, S, o) {
    const g = o.g, f = o.f, L = C_frame(o.bx, o.by, f, g, o.tilt || 0, [0, .25]);
    if (o.shadow) shadow(p, o.bx, S.G, .17 * g, o.shadow);
    p.g();
    const fl = o.flap;   // null = folded; else wing phase (-1 down .. 1 up)
    const wing = a => { const Wr = [.0, .3 + a * .2], T = [-.21 + Math.abs(a) * .05, .3 + a * .36], tr = [-.15, .3 + a * .21];
      return { all: [[.06, .3], Wr, T, tr, [-.1, .285]], tip: [mixPt(Wr, T, .62), T, mixPt(tr, T, .45)], grey: [Wr, mixPt(Wr, T, .62), mixPt(tr, T, .45), tr, [-.06, .29]] }; };
    if (fl != null) { const W2 = wing(fl * .75); p.shape(C_map(L, W2.all), { fill: '#E4E0DA', w: .8 }); p.shape(C_map(L, W2.tip), { fill: INK, w: .5, amp: .1 }); }
    if (!o.air) { const ft = o.feet || 0; [[.02, 1], [-.03, 0]].forEach(([x, far]) => { p.line([L(x, .15), L(x + ft * .02, 0)], { w: .75 }); p.line([L(x + ft * .02 - .025, 0), L(x + ft * .02 + .03, 0)], { w: 1, amp: .1 }); }); }
    else { p.line([L(-.04, .17), L(-.12, .15)], { w: .8 }); }
    p.shape(C_map(L, [[.14, .27], [.12, .33], [.02, .345], [-.1, .325], [-.2, .285], [-.27, .262], [-.2, .225], [-.06, .155], [.06, .15], [.135, .195]]), { fill: '#fff' });
    if (fl == null) {
      p.shape(C_map(L, [[.08, .305], [-.04, .322], [-.17, .29], [-.29, .255], [-.2, .238], [-.05, .228], [.05, .248]]), { fill: '#fff', w: .8 });
      p.shape(C_map(L, [[.06, .295], [-.04, .31], [-.16, .282], [-.16, .244], [-.04, .238], [.04, .254]]), { fill: WASH2, stroke: false, halo: false });
      p.shape(C_map(L, [[-.17, .287], [-.29, .255], [-.2, .239], [-.165, .246]]), { fill: INK, w: .6, amp: .1 });
    } else {
      const W1 = wing(fl);
      p.g();
      p.shape(C_map(L, W1.all), { fill: '#fff' });
      p.shape(C_map(L, W1.grey), { fill: WASH2, stroke: false, halo: false });
      p.shape(C_map(L, W1.tip), { fill: INK, w: .6, amp: .1 });
    }
    // head
    const hd = o.head || 0, HP = [.11, .3];
    const H = (x, y) => { const q = rot([x, y], HP, hd); return L(q[0], q[1]); };
    p.g();
    p.shape(C_map(H, [[.05, .35], [.065, .415], [.125, .45], [.185, .43], [.21, .385], [.2, .34], [.15, .315]]), { fill: '#fff' });
    const op = o.open ? .03 : 0;
    p.shape(C_map(H, [[.2, .392], [.25, .384], [.29, .375], [.305, .358], [.29, .348], [.25, .36 - op * .4], [.2, .362]]), { fill: '#fff', w: .9, amp: .15 });
    if (op) p.shape(C_map(H, [[.2, .358], [.25, .352 - op], [.28, .33 - op], [.24, .333 - op], [.2, .345]]), { fill: '#fff', w: .8, amp: .15 });
    p.dot(...H(.268, .358), Math.max(1.1, .009 * g));
    p.dot(...H(.158, .395), Math.max(1.4, .014 * g));
    p.line(C_map(H, [[.13, .42], [.185, .405]].map(([x, y], i) => [x, y + (o.mean ? (i ? -.014 : .008) : 0)])), { w: .9, halo: false, amp: .05 });
    return { beak: H(.29, .355) };
  }
  function C_feather(p, x, y, s, a) {
    const R = pt => rot(pt, [x, y], a);
    p.g(); p.shape([[x - s, y], [x - s * .4, y - s * .3], [x + s * .6, y - s * .24], [x + s, y], [x + s * .5, y + s * .22], [x - s * .4, y + s * .24]].map(R), { fill: '#fff', w: .55, amp: .1 });
    p.line([[x - s * 1.3, y + s * .05], [x + s * .9, y]].map(R), { w: .45, halo: false, amp: .05 });
    [-.3, .1, .45].forEach(u => p.line([[x + u * s, y], [x + (u + .2) * s, y - s * .2]].map(R), { w: .35, halo: false, amp: .02 }));
  }
  GAGS.C_seagull = {
    name: 'The Seagull', dur: 3.75, ones: [[0, .55], [1.36, 2.5]],
    cues: [[0.05, 'wings-flap'], [0.5, 'land-skitter'], [0.86, 'head-cock'], [1.06, 'head-cock'], [1.24, 'side-eye'], [1.4, 'snap'], [1.46, 'frantic-flap-loop'], [1.86, 'MINE-squawk'], [2.4, 'flap-fade'], [2.5, 'feather-drift']],
    setup(S) {
      const { U, G, c, W } = S, g = S.g = U * 1.08;
      S.xs = c.x + c.w * .76; S.p0 = [W + .6 * g, c.y - .2 * g];
      const T = C_gull(new Pen(0, U, 1), S, { g, f: -1, bx: S.xs, by: G, head: .5 });
      S.grab = T.beak;
    },
    pose(S, t) {
      const { U, G, g, W, c } = S;
      const o = { g, f: -1, bx: S.xs, by: G, shadow: 1 };
      if (t < .5) { const k = E.out(seg(t, 0, .5)); o.bx = lerp(S.p0[0], S.xs, k); o.by = lerp(S.p0[1], G, k); o.flap = Math.sin(t * 34); o.air = k < .9; o.tilt = -.25 * (1 - k); o.shadow = k; return o; }
      if (t < .62) { o.flap = .9 - seg(t, .5, .62) * .6; o.feet = 1; return o; }
      if (t < .8) return o;
      if (t < 1.0) { o.head = .45 * E.io(seg(t, .8, .9)); return o; }
      if (t < 1.36) { o.head = t < 1.12 ? -.2 : t < 1.24 ? .15 : -.05; o.mean = t >= 1.24; return o; }
      if (t < 1.44) { o.head = lerp(-.05, .5, E.in(seg(t, 1.36, 1.42))); o.mean = true; return o; }
      if (t < 1.86) { o.head = .5; o.mean = true; o.flap = Math.sin(t * 60); o.by = G - Math.abs(Math.sin(t * 30)) * U * .04; o.feet = Math.sin(t * 45); return o; }
      const k = seg(t, 1.86, 2.55);
      o.flap = Math.sin(t * 48); o.air = true; o.head = .5 * (1 - k * .4); o.mean = true; o.shadow = 1 - k;
      o.bx = S.xs - E.in(k) * (W * .75); o.by = G - E.in(k) * (G + c.h * 1.1) - k * U * .3; o.tilt = .32 * Math.min(1, k * 3);
      return o;
    },
    draw(S, t, p) {
      const { U, G, c, W, g } = S, w = c.w, h = c.h;
      const o = this.pose(S, t);
      // the card: snapped at 1.4, strains, then hangs from the beak and swings away
      if (t >= 1.4) {
        const B = C_gull(new Pen(0, U, 1), S, o).beak, gr = S.grab;
        let ang = 0;
        if (t < 1.86) ang = Math.sin(t * 40) * .8;
        else { const k = seg(t, 1.86, 2.55); ang = 16 * E.out(Math.min(1, k * 2)) + Math.sin(k * 14) * 7; }
        S.setCard({ px: gr[0] - c.x, py: gr[1] - c.y, tx: B[0] - gr[0], ty: B[1] - gr[1], rot: ang, hide: t >= 2.6 });
      }
      if (t >= 1.4 && t < 1.48) burst(p, S.grab, U * .04, U * .08, 5, -.5, .6);
      if (t >= 1.46 && t < 1.86) { p.g({ halo: false }); for (let i = 0; i < 3; i++) { const a = -2.2 + i * .5 + (Math.floor(t * 24) % 2) * .1; const cc = [o.bx + U * .08, o.by - U * .35]; p.line([[cc[0] + Math.cos(a) * U * .28, cc[1] + Math.sin(a) * U * .2], [cc[0] + Math.cos(a) * U * .38, cc[1] + Math.sin(a) * U * .27]], { w: .7, amp: .1 }); } }
      if (t < 2.6) C_gull(p, S, Object.assign({ open: t >= 1.86 && t < 2.1 }, o));
      // a single feather comes down afterwards
      if (t >= 2.45) {
        const k = seg(t, 2.45, 3.45), x = c.x + c.w * .45 + Math.sin(k * Math.PI * 3) * U * .22, y = lerp(-U * .1, G - U * .02, E.out(k) * .3 + k * .7);
        C_feather(p, x, y, U * .12, Math.cos(k * Math.PI * 3) * .5 + (k >= 1 ? 0 : .1));
      }
    }
  };

  /* ═════════ C7. THE SNAKE — unhinges, swallows it whole; the lump is the shape you would expect ═════════ */
  function C_snakeHead(p, U, hb, f, o) {   // head base hb (back of the skull), facing f
    const H = (x, y) => [hb[0] + f * x * U, hb[1] - y * U];
    p.g();
    p.shape(C_map(H, [[-.02, .03], [.04, .062], [.12, .062], [.19, .042], [.225, .012], [.215, -.018], [.15, -.04], [.06, -.044], [-.015, -.028]]), { fill: '#fff' });
    const e = H(.11, .028);
    p.circ(e[0], e[1], .026 * U, { fill: '#fff', w: .65, halo: false, n: 9, amp: .1 });
    if (o.blink) p.line([[e[0] - .024 * U, e[1] + .004 * U], [e[0] + .024 * U, e[1] + .004 * U]], { w: 1, halo: false, amp: .05 });
    else if (o.look) p.dot(e[0], e[1] + .003 * U, Math.max(1.4, .013 * U));
    else p.line([[e[0] + f * .006 * U, e[1] - .018 * U], [e[0] + f * .006 * U, e[1] + .018 * U]], { w: 1.6, halo: false, amp: .05 });
    p.line(C_map(H, [[.075, .068], [.14, .058]]), { w: .7, halo: false, amp: .05 });
    p.dot(...H(.2, .022), 1.1);
    p.line(C_map(H, [[.215, -.008], [.17, -.014], [.11, -.008], [.085, .002]]), { w: .6, halo: false, amp: .05 });
    if (o.tongue) { p.line(C_map(H, [[.22, -.006], [.285, -.008], [.31, .01]]), { w: .85, halo: false, amp: .05 }); p.line(C_map(H, [[.285, -.008], [.31, -.026]]), { w: .85, halo: false, amp: .05 }); }
  }
  function C_snakeBody(p, U, pts, th, lump, G) {   // pts: neck→tail centreline; lump {s, size}
    const L = pathLen(pts), tot = L[L.length - 1], A = [], B = [], N = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      let nx = dy / d, ny = -dx / d; if (ny > 0) { nx = -nx; ny = -ny; }
      const s = L[i], w = th * (s > tot * .7 ? Math.max(.1, 1 - (s - tot * .7) / (tot * .3)) : 1);
      A.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); B.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); N.push([nx, ny, w]);
    }
    p.g(); p.shape(A.concat(B.slice().reverse()), { fill: '#fff', amp: .5 });
    const zz = []; for (let i = 1; i < pts.length - 2; i++) { const [nx, ny, w] = N[i], k = (i % 2 ? .55 : -.55); zz.push([pts[i][0] + nx * w * k, pts[i][1] + ny * w * k]); }
    p.line(zz, { w: .6, halo: false, amp: .15, color: 'rgba(31,26,23,.65)' });
    if (lump) {   // a square lump riding along the body
      let i = 1; while (i < L.length - 1 && L[i] < lump.s) i++;
      const P = pts[i], Q = pts[i - 1], ang = Math.atan2(P[1] - Q[1], P[0] - Q[0]), h = lump.size / 2;
      let cx = P[0], cy = P[1]; if (cy > G - th * 3) cy = G - h - 1;
      const R = pt => rot(pt, [cx, cy], cy > G - h - 2 ? 0 : ang);
      p.g();
      p.shape([[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]].map(R), { fill: '#fff', amp: .5 });
      p.shape([[cx - h * .62, cy - h * .62], [cx + h * .62, cy - h * .62], [cx + h * .62, cy + h * .62], [cx - h * .62, cy + h * .62]].map(R), { w: .6, halo: false, color: 'rgba(31,26,23,.28)', amp: .3 });
    }
  }
  GAGS.C_snake = {
    name: 'The Snake', dur: 3.95, ones: [[1.36, 2.3]],
    cues: [[0.05, 'slither-loop'], [0.78, 'hiss-rise'], [1.0, 'tongue-flick'], [1.16, 'tongue-flick'], [1.38, 'jaw-unhinge-creak'], [1.5, 'gulp'], [1.68, 'gulp'], [1.86, 'gulp'], [2.14, 'jaw-snap'], [2.3, 'lump-slide'], [3.14, 'tongue-flick'], [3.42, 'tiny-hic']],
    setup(S) {
      const { U, G, c, W } = S;
      S.th = U * .06; S.yg = G - S.th - 1;
      S.xn = c.x + c.w * .2; S.len = U * 2.0;
      S.HB = [c.x + c.w * .06, G - U * .6];
      S.hinge = [c.x + U * .06, c.y + c.h * .5];
      S.lumpSize = U * .34;
      S.cardWrap.setAttribute('clip-path', `url(#${S.id}sk)`);
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}sk"><rect x="${S.hinge[0] + U * .04}" y="-2000" width="4000" height="4000"/></clipPath>`);
    },
    centre(S, headX, neck) {   // neck curve then ground body; humps are fixed to the ground so it slithers through them
      const { U, yg, th } = S, pts = [];
      const hump = x => Math.max(0, Math.sin((x - S.c.x) / (U * .45) * Math.PI)) * th * 1.3;
      if (neck) { const [P0, P1, P2, P3] = neck; for (let i = 0; i <= 16; i++) { const u = i / 16, m = 1 - u; pts.push([m * m * m * P3[0] + 3 * m * m * u * P2[0] + 3 * m * u * u * P1[0] + u * u * u * P0[0], m * m * m * P3[1] + 3 * m * m * u * P2[1] + 3 * m * u * u * P1[1] + u * u * u * P0[1]]); } }
      const used = neck ? pathLen(pts).pop() : 0;
      for (let d = neck ? U * .06 : 0; d <= S.len - used; d += U * .055) { const x = headX + d; pts.push([x, yg - hump(x)]); }
      return pts;
    },
    jaws(S, open, adv) {   // the unhinged jaws around the cartoon; open 0..1, adv = which jaw is reaching
      const { U, G, c } = S, hg = S.hinge;
      const tipX = c.x + c.w * .34, topY = lerp(hg[1] - U * .06, c.y + U * .1, open), botY = lerp(hg[1] + U * .06, G - U * .02, open);
      const ux = tipX + (adv > 0 ? U * .06 : 0), lx = tipX - U * .03 + (adv < 0 ? U * .06 : 0);
      const upper = [[hg[0] - U * .08, hg[1]], [hg[0] - U * .1, lerp(hg[1], topY, .6)], [hg[0] - U * .04, topY - U * .14], [lerp(hg[0], ux, .45), topY - U * .19], [ux - U * .04, topY - U * .13], [ux + U * .05, topY - U * .07], [ux + U * .06, topY + U * .01], [ux - U * .02, topY + U * .04], [lerp(hg[0], ux, .45), topY + U * .05], [hg[0] + U * .07, lerp(hg[1], topY, .45)], [hg[0] + U * .05, hg[1]]];
      const lower = [[hg[0] + U * .05, hg[1]], [hg[0] + U * .07, lerp(hg[1], botY, .45)], [lerp(hg[0], lx, .45), botY - U * .04], [lx, botY - U * .03], [lx + U * .04, botY + U * .01], [lx, botY + U * .07], [lerp(hg[0], lx, .45), botY + U * .1], [hg[0] - U * .04, botY + U * .08], [hg[0] - U * .1, lerp(hg[1], botY, .6)], [hg[0] - U * .08, hg[1]]];
      return { upper, lower, eye: [lerp(hg[0], ux, .32), topY - U * .07], nostril: [ux + U * .02, topY - U * .04], fangs: [[ux - U * .03, topY + U * .035], [ux - U * .075, topY + U * .045]], topIn: topY + U * .045, botIn: botY - U * .035, tipX: Math.min(ux, lx) };
    },
    draw(S, t, p) {
      const { U, G, c, W, th, xn } = S, w = c.w, h = c.h;
      let headX = xn, hb = S.HB, hf = 1, ground = false;
      if (t < .76) { headX = lerp(W + U * .3, xn - U * .12, E.out(seg(t, 0, .76))); ground = true; hf = -1; }
      else if (t < .96) { const k = E.io(seg(t, .76, .96)); hb = [lerp(xn - U * .1, S.HB[0], k), lerp(S.yg - U * .01, S.HB[1], k)]; hf = k < .5 ? -1 : 1; }
      // the swallow: jaws snap open, the cartoon is pulled in, in three gulps, then they close
      let J = null, open = 0;
      if (t >= 1.36 && t < 2.2) {
        open = t < 1.48 ? E.back(seg(t, 1.36, 1.48)) : t < 2.04 ? 1 : 1 - E.in(seg(t, 2.04, 2.16));
        if (t < 2.16) J = this.jaws(S, Math.max(0, open), t >= 1.5 && t < 2.02 ? (Math.floor((t - 1.5) / .09) % 2 ? 1 : -1) : 0);
      }
      if (t >= 1.5 && t < 2.04) {
        const pulls = [[1.5, 1.66, .38], [1.68, 1.84, .7], [1.86, 2.02, 1]];
        let k = 0; for (const [a, b, v] of pulls) { if (t >= a) k = t < b ? lerp(k, v, E.io(seg(t, a, b))) : v; }
        S.setCard({ px: S.hinge[0] - c.x, py: h / 2, tx: -k * (w + U * .1), sx: 1 - k * .15, sy: 1 - k * .1 });
        S.cardR = S.hinge[0] + (c.x + w - S.hinge[0]) * (1 - k * .15) - k * (w + U * .1);
      } else if (t >= 2.02) { S.setCard({ hide: true }); S.cardR = -1e4; } else S.cardR = null;
      if (ground) {
        const pts = this.centre(S, headX + U * .02, null);
        C_snakeBody(p, U, pts, th, null, G);
        C_snakeHead(p, U, [headX + U * .04, S.yg + U * .005], -1, { tongue: t > .4 && Math.floor(t * 8) % 3 === 0 });
        return;
      }
      const top = J || (t >= 2.04 && t < 2.24) ? mixPt(S.HB, S.hinge, J ? 1 : 1 - seg(t, 2.04, 2.24)) : hb;
      const neckTop = J ? [S.hinge[0] - U * .02, S.hinge[1] + U * .02] : [top[0] + U * .01, top[1] + U * .035];
      const neck = [[xn, S.yg], [xn - U * .22, S.yg], [neckTop[0] - U * .1, neckTop[1] + U * .32], neckTop];
      const pts = this.centre(S, xn, neck);
      let lump = null;
      if (t >= 2.16) { const L = pathLen(pts), tot = L[L.length - 1], k = E.io(seg(t, 2.2, 3.2)); lump = { s: lerp(U * .06, tot * .8, k), size: S.lumpSize * Math.min(1, .45 + seg(t, 2.16, 2.3)) }; if (t >= 3.4 && t < 3.54) lump.s -= Math.sin(seg(t, 3.4, 3.54) * Math.PI) * U * .08; }
      C_snakeBody(p, U, pts, th, lump, G);
      if (J) {
        // dark mouth wherever the cartoon is not filling it
        const xr = S.cardR != null ? S.cardR : c.x + w;
        p.g({ halo: false });
        if (xr < J.tipX) p.shape([[Math.max(xr, S.hinge[0]), J.topIn], [J.tipX, J.topIn], [J.tipX, J.botIn], [Math.max(xr, S.hinge[0]), J.botIn]], { fill: INK, w: .5 });
        p.shape([J.upper[9], J.upper[10], J.lower[0], J.lower[1]], { fill: INK, w: .5 });
        p.g();
        p.shape(J.lower, { fill: '#fff', w: 1.15 });
        p.shape(J.upper, { fill: '#fff', w: 1.15 });
        { const hx = S.hinge[0] + U * .075, yt = lerp(S.hinge[1], J.topIn, .55), yb2 = lerp(S.hinge[1], J.botIn, .55); p.g({ halo: false }); p.shape([[hx, yt], [hx + U * .03, yt + U * .04], [hx + U * .035, yb2 - U * .04], [hx, yb2]], { fill: INK, w: .5 }); p.g(); }
        J.fangs.forEach(([x, y]) => p.shape([[x - U * .012, y - 2], [x + U * .012, y - 2], [x, y + U * .045]], { fill: '#fff', w: .7, amp: .1 }));
        const e = J.eye; p.circ(e[0], e[1], U * .045, { fill: '#fff', w: .8, n: 10 }); p.dot(e[0] + U * .012, e[1] + U * .004, Math.max(1.5, U * .014));
        p.line([[e[0] - U * .05, e[1] - U * .065], [e[0] + U * .05, e[1] - U * .05]], { w: .8, halo: false });
        p.dot(J.nostril[0], J.nostril[1], 1.3);
        const zz = []; for (let i = 0; i <= 8; i++) { const u = i / 8; zz.push([lerp(S.hinge[0] - U * .02, J.tipX - U * .08, u), lerp(J.topIn - U * .12, J.topIn - U * .1, u) + (i % 2 ? U * .025 : -U * .025)]); } p.line(zz, { w: .6, halo: false, amp: .15, color: 'rgba(31,26,23,.6)' });
        if (t >= 1.5 && t < 2.02) for (let i = 0; i < 3; i++) { const y = c.y + h * (.25 + i * .25); p.g({ halo: false }); p.line([[c.x + w * .42, y], [c.x + w * .58, y]], { w: .7, color: 'rgba(31,26,23,.45)' }); }
      } else {
        C_snakeHead(p, U, top, hf, { look: t >= 2.9, tongue: (t >= 1.0 && t < 1.08) || (t >= 1.16 && t < 1.24) || (t >= 3.14 && t < 3.26) || (t >= 3.62 && t < 3.72), blink: t >= 3.28 && t < 3.4 });
      }
      if (t >= 2.14 && t < 2.24) burst(p, S.hinge, U * .07, U * .13, 6, .3, .7);
    }
  };

  /* ═════════ C8. THE SPIDER — comes down on a thread, wraps it up, takes it home ═════════ */
  function C_spider(p, U, x, y, o) {
    const s = U * (o.size || 1), legPh = o.legs || 0, wave = o.wave || 0, R = pt => rot(pt, [x, y], o.rot || 0);
    p.g();
    for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 4; i++) {
      const a0 = (-.75 + i * .5) + Math.sin(legPh + i * 1.7 + side) * .18, base = [x + side * .03 * s, y - .01 * s + i * .012 * s];
      let kn = [base[0] + side * Math.cos(a0) * .085 * s, base[1] - Math.sin(-a0) * .085 * s - .035 * s], ft = [kn[0] + side * .05 * s, kn[1] + (.07 + i * .01) * s];
      if (wave && side === 1 && i === 0) { kn = [base[0] + .07 * s, base[1] - .07 * s]; ft = [kn[0] + .04 * s + Math.sin(wave * 12) * .02 * s, kn[1] - .07 * s]; }
      p.line([base, kn, ft].map(R), { w: .85, amp: .2 });
    }
    p.circ(...R([x, y + .03 * s]), .068 * s, { fill: INK, w: .8, n: 10 });
    p.circ(...R([x, y - .04 * s]), .042 * s, { fill: INK, w: .8, n: 9 });
    p.line([[x - .03 * s, y + .005 * s], [x - .012 * s, y - .005 * s]].map(R), { w: .9, color: '#fff', halo: false, amp: .05 });
    [-1, 1].forEach(sd => { const e = R([x + sd * .018 * s, y - .047 * s]); p.circ(e[0], e[1], .014 * s, { fill: '#fff', stroke: false, n: 7 }); p.dot(e[0], e[1] + .004 * s, Math.max(.8, .006 * s)); });
  }
  GAGS.C_spider = {
    name: 'The Spider', dur: 3.95, ones: [[1.0, 2.1], [2.3, 2.95], [3.3, 3.5]],
    cues: [[0.05, 'zip-down'], [0.48, 'boing'], [0.82, 'tiny-wave'], [1.02, 'whirr-loop'], [2.06, 'whirr-stop'], [2.2, 'tie-off'], [2.3, 'reel'], [2.5, 'reel'], [2.7, 'reel'], [3.02, 'zip-down'], [3.14, 'tiny-wave'], [3.36, 'zip-up']],
    setup(S) {
      const { U, G, c, W } = S;
      S.cx = c.x + c.w * .5; S.cy = c.y + c.h * .5;
      S.hang = [S.cx + c.w * .12, c.y + c.h * .24];
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}sp"><rect class="spr" x="-1" y="-1" width="${c.w + S.F.shadow + 2}" height="${c.h + S.F.shadow + 2}"/></clipPath>`);
      S.spr = S.defs.querySelector('.spr');
      S.cardIn.setAttribute('clip-path', `url(#${S.id}sp)`);
      S.revs = 3.25;
    },
    wrapK(t) { return seg(t, 1.0, 2.06); },
    draw(S, t, p) {
      const { U, G, c, W } = S, w = c.w, h = c.h;
      const kw = this.wrapK(t), ks = E.io(seg(t, 1.1, 2.06));
      // the card becomes a cocoon: shrinks, rounds off, goes white under the silk
      const sx = 1 - .56 * ks, sy = 1 - .36 * ks;
      const kr = Math.min(1, ks / .6), rr = lerp(S.F.radius, w * .5, kr), ry2 = lerp(S.F.radius, h * .5, kr);
      S.spr.setAttribute('rx', rr.toFixed(1)); S.spr.setAttribute('ry', ry2.toFixed(1));
      S.spr.setAttribute('width', (w + S.F.shadow * (1 - ks) + 2).toFixed(1)); S.spr.setAttribute('height', (h + S.F.shadow * (1 - ks) + 2).toFixed(1));
      // hoist: three reels up, swinging a little
      let hy = 0, swing = 0;
      if (t >= 2.3) { const pulls = [[2.3, 2.46, .3], [2.5, 2.66, .62], [2.7, 2.92, 1.15]]; let k = 0; for (const [a, b, v] of pulls) if (t >= a) k = t < b ? lerp(k, v, E.io(seg(t, a, b))) : v; hy = -k * (c.y + h * .5 + h * .4); swing = Math.sin(t * 13) * 4 * (t < 2.95 ? 1 : 0); }
      if (t >= 1.0) S.setCard({ sx, sy, ty: hy, rot: swing, hide: t >= 2.95 });
      // silk: bands accumulate on the front passes (card-local, so they shrink with it)
      const passes = Math.floor(kw * S.revs * 2 + .5), bands = [];
      for (let i = 0; i < Math.min(passes, 7); i++) { if (i % 2) continue; const y0 = h * (.1 + i * .12), sl = (i % 4 ? 1 : -1) * h * .12; bands.push(`M${-4},${(y0 - sl).toFixed(1)}C${w * .3},${(y0 + sl * .3).toFixed(1)} ${w * .7},${(y0 - sl * .3).toFixed(1)} ${w + 4},${(y0 + sl).toFixed(1)}`); }
      const extra = []; for (let i = 0; i < Math.max(0, Math.floor((ks - .3) * 16)); i++) { const y0 = h * (.08 + ((i * 37) % 11) / 12), sl = ((i * 13) % 5 - 2) * h * .06; extra.push(`M-4,${(y0 - sl).toFixed(1)}Q${w * .5},${(y0 + sl * .4).toFixed(1)} ${w + 4},${(y0 + sl).toFixed(1)}`); }
      const sw = 2.2 / Math.max(.4, sy);
      S.over.innerHTML = (ks > 0 ? `<rect x="-5" y="-5" width="${w + 10}" height="${h + 10}" fill="#fff" opacity="${(ks * .88).toFixed(3)}"/>` : '') +
        bands.concat(extra).map(d => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${(sw + 3).toFixed(1)}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${(sw * .55).toFixed(2)}" stroke-linecap="round" opacity=".75"/>`).join('');
      // cocoon outline once it has rounded off
      if (ks > .5 && t < 2.95) {
        const ctr = [S.cx, S.cy + hy], rx = w * sx * .5 + 1, ry = h * sy * .5 + 1, a = swing * Math.PI / 180, pts = [];
        for (let i = 0; i < 16; i++) { const b = i / 16 * Math.PI * 2; pts.push(rot([ctr[0] + Math.cos(b) * rx, ctr[1] + Math.sin(b) * ry], ctr, a)); }
        p.g({ op: clamp((ks - .5) * 5, 0, 1) }); p.shape(pts, { w: 1.1, amp: .6 });
        const tp = rot([ctr[0], ctr[1] - ry], ctr, a); p.line([[tp[0] - U * .03, tp[1] + U * .01], [tp[0], tp[1] - U * .02], [tp[0] + U * .03, tp[1] + U * .01]], { w: .8, amp: .2 });
      }
      // the spider
      const cocoonTop = [S.cx, S.cy - h * sy * .5 + hy];
      let sp = null, thread = true, sz = 1, legs = 0, wave = 0, rot0 = 0;
      if (t < .5) { const k = E.in(seg(t, 0, .5)); sp = [S.hang[0], lerp(-U * .2, S.hang[1], k)]; }
      else if (t < 1.0) { const k = seg(t, .5, 1.0); sp = [S.hang[0], S.hang[1] + Math.sin(k * Math.PI * 3) * Math.exp(-k * 3) * U * .12]; rot0 = Math.sin(t * 7) * .15; wave = t >= .78 && t < .98 ? t : 0; }
      else if (t < 2.1) {   // orbiting: in front on half the turns
        const th = kw * S.revs * Math.PI * 2, Rx = (w * .5 * sx + U * .05), Ry = h * .5 * sy;
        const front = Math.sin(th) > -.15, yy = S.cy + Math.cos(th * .5 + 1) * Ry * .7;
        sp = front ? [S.cx + Math.cos(th) * Rx, yy] : null; legs = t * 40; thread = false;
        if (front && sp) { p.g({ halo: false }); const pv = [S.cx + Math.cos(th - .5) * Rx, yy - Math.sin(.5) * 2]; p.line([pv, sp], { w: .6, color: 'rgba(31,26,23,.45)' }); }
      } else if (t < 2.3) { const k = E.io(seg(t, 2.1, 2.26)); sp = mixPt([S.cx + (w * .5 * sx + U * .05), S.cy], [cocoonTop[0], cocoonTop[1] - U * .1], k); legs = t * 30; thread = k > .9; }
      else if (t < 2.95) { sp = [cocoonTop[0], cocoonTop[1] - U * .1]; legs = t * 30; }
      else if (t >= 3.0 && t < 3.5) {   // pops back down to wave goodbye, then zips up
        const k = t < 3.12 ? E.out(seg(t, 3.0, 3.12)) : t < 3.34 ? 1 : 1 - E.in(seg(t, 3.34, 3.46));
        sp = [S.cx - c.w * .1, lerp(-U * .2, c.y + U * .55, k)]; wave = t >= 3.12 && t < 3.34 ? t : 0;
      }
      if (sp && thread) { p.g({ halo: false }); p.line([[sp[0], -4], [sp[0], sp[1] - U * .05]], { w: .55, amp: .15 }); }
      if (t >= 2.26 && t < 2.98) { p.g({ halo: false }); p.line([[cocoonTop[0], cocoonTop[1] - U * .1], [cocoonTop[0], cocoonTop[1]]], { w: .55, amp: .1 }); }
      if (sp) C_spider(p, U, sp[0], sp[1], { size: 1.15 * sz, legs, wave, rot: rot0 });
    }
  };

  /* ═════════ C9. THE MOTH — one hole; then a few more; then it is a doily ═════════ */
  function C_moth(p, U, x, y, o) {
    const s = U * (o.size || 1), fx = o.flap != null ? lerp(.22, 1, o.flap) : 1, fat = o.fat || 1, R = pt => rot(pt, [x, y], o.rot || 0);
    const P = (u, v) => R([x + u * s, y + v * s]);
    p.g();
    [-1, 1].forEach(sd => {
      p.shape([[-.02, .015], [-.115, .045], [-.115, .095], [-.05, .085]].map(([u, v]) => P(sd * (.02 + (-u - .02) * fx), v)), { fill: '#EDE9E3', w: .8, amp: .3 });
      p.shape([[-.02, -.025], [-.16, -.105], [-.19, -.035], [-.13, .025], [-.03, .02]].map(([u, v]) => P(sd * (.02 + (-u - .02) * fx), v)), { fill: '#EDE9E3', w: .85, amp: .3 });
      p.circ(...P(sd * (.02 + .09 * fx), -.035), .022 * s, { sx: Math.max(.3, fx), fill: WASH2, stroke: false, halo: false, n: 8 });
      p.line([P(sd * (.02 + .05 * fx), -.06), P(sd * (.02 + .12 * fx), -.08)], { w: .4, halo: false, amp: .1 });
    });
    p.circ(...P(0, .0), .03 * s * fat, { sy: 2.1 / Math.sqrt(fat), fill: '#D7D1C8', w: .8, n: 10 });
    p.line([P(-.022 * fat, .02), P(.022 * fat, .02)], { w: .45, halo: false }); p.line([P(-.02 * fat, .045), P(.02 * fat, .045)], { w: .45, halo: false });
    const hy = -.065 - (fat - 1) * .02;
    p.circ(...P(0, hy), .022 * s, { fill: '#fff', w: .8, n: 8 });
    p.dot(...P(-.009, hy - .002), Math.max(.9, .006 * s)); p.dot(...P(.009, hy - .002), Math.max(.9, .006 * s));
    const tw = o.twitch || 0;
    [-1, 1].forEach(sd => { const a = P(sd * .01, hy - .018), b = P(sd * (.06 + tw * .01), hy - .085 + (sd > 0 ? tw * .012 : 0)); p.line([a, b], { w: .6, amp: .1 }); for (let i = 1; i < 4; i++) { const q = mixPt(a, b, i / 4); p.line([q, [q[0] + sd * .012 * s, q[1] + .006 * s]], { w: .4, halo: false, amp: .02 }); } });
  }
  GAGS.C_moth = {
    name: 'The Moth', dur: 3.95, ones: [[0, .6], [1.36, 2.2]],
    cues: [[0.05, 'flutter-loop'], [0.62, 'tiny-land'], [0.84, 'nibble'], [1.12, 'antenna-twitch'], [1.36, 'munch-frenzy-loop'], [2.2, 'munch-stop'], [2.22, 'tiny-ta-da'], [2.5, 'paper-drift'], [2.86, 'heavy-flutter-loop'], [3.28, 'tiny-burp']],
    setup(S) {
      const { U, c } = S, w = c.w, h = c.h, C = [w / 2, h / 2];
      S.land = [w * .3, h * .5];
      // a doily, eaten ring by ring: centre, petals, holes, petals, corners, scalloped edge
      const H = [], add = (x, y, rx, ry, a, ring) => H.push({ x, y, rx, ry, a, ring });
      const ringA = [], ringB = [], ringC = [];
      for (let i = 0; i < 8; i++) { const a = Math.PI + i / 8 * Math.PI * 2; ringA.push([C[0] + Math.cos(a) * w * .18, C[1] + Math.sin(a) * w * .18, w * .07, w * .032, a]); }
      for (let i = 0; i < 12; i++) { const a = Math.PI + (i + .5) / 12 * Math.PI * 2; ringB.push([C[0] + Math.cos(a) * w * .3, C[1] + Math.sin(a) * w * .3, w * .036, w * .036, a]); }
      for (let i = 0; i < 16; i++) { const a = Math.PI + i / 16 * Math.PI * 2, x = C[0] + Math.cos(a) * w * .405, y = C[1] + Math.sin(a) * w * .405; ringC.push([x, y, w * .048, w * .022, a]); }
      ringA.forEach(q => add(...q, 1));
      add(C[0], C[1], w * .065, w * .065, 0, 0);
      ringB.forEach(q => add(...q, 2));
      ringC.forEach(q => add(...q, 3));
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => add(C[0] + sx * w * .385, C[1] + sy * h * .385, w * .04, w * .04, 0, 4));
      const sp = w * .072, rb = w * .028;
      for (let e = 0; e < 4; e++) for (let x = sp * .5; x < (e % 2 ? h : w); x += sp) { const P = e === 0 ? [x, 0] : e === 1 ? [w, x] : e === 2 ? [w - x, h] : [0, h - x]; add(P[0], P[1], rb, rb, 0, 5); }
      S.holes = H;
      S.defs.insertAdjacentHTML('beforeend', `<mask id="${S.id}mo" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${w + 80}" height="${h + 80}"><rect x="-40" y="-40" width="${w + 80}" height="${h + 80}" fill="#fff"/><g class="mh" fill="#000"></g></mask>`);
      S.cardIn.setAttribute('mask', `url(#${S.id}mo)`);
      S.mh = S.defs.querySelector('.mh');
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}moc"><rect x="0" y="0" width="${w}" height="${h}" rx="${S.F.radius}"/></clipPath>`);
      S.over.setAttribute('clip-path', `url(#${S.id}moc)`);
      const p0 = H[0]; S.land = [p0.x + U * .02, p0.y + U * .14];
    },
    shape(q, k) { const pts = []; for (let i = 0; i < 12; i++) { const b = i / 12 * Math.PI * 2; pts.push(rot([q.x + Math.cos(b) * q.rx * k, q.y + Math.sin(b) * q.ry * k], [q.x, q.y], q.a)); } return pts; },
    reveal(t) {   // [count, per-hole openness]
      const N = this._n;
      if (t < .84) return 0;
      if (t < 1.36) return 1;
      return 1 + Math.floor(E.io(seg(t, 1.36, 2.2)) * (N - 1) + .0001);
    },
    draw(S, t, p) {
      const { U, G, c, W } = S, w = c.w, h = c.h;
      this._n = S.holes.length;
      const n = this.reveal(t);
      const open = i => i === 0 ? E.out(seg(t, .84, 1.0)) : (i < n - 2 || t >= 2.2 ? 1 : .55);
      const fade = E.io(seg(t, 1.5, 2.25));
      const key = n + ':' + open(0).toFixed(2) + ':' + (t >= 2.2) + ':' + fade.toFixed(2);
      if (key !== S.mkey) {   // the lace only changes while it is being eaten
        S.mkey = key;
        const shp = S.holes.slice(0, n).map((q, i) => catmull(this.shape(q, open(i)), true));
        S.mh.innerHTML = shp.map(d => `<path d="${d}"/>`).join('');
        if (!S.shadowRect) S.shadowRect = S.cardIn.querySelector('rect');
        S.shadowRect.setAttribute('opacity', (1 - fade).toFixed(3));
        S.over.innerHTML = `<rect x="-2" y="-2" width="${w + S.F.shadow + 4}" height="${h + S.F.shadow + 4}" fill="#fff" opacity="${(fade * .94).toFixed(3)}"/>` +
          (fade > 0 ? `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${S.F.radius}" fill="none" stroke="${INK}" stroke-width="3" opacity="${fade.toFixed(3)}"/>` : '') +
          shp.map(d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`).join('') +
          (fade > .5 ? S.holes.filter(q => q.ring === 1).map(q => `<path d="M${(q.x + Math.cos(q.a) * q.rx * 1.25).toFixed(1)},${(q.y + Math.sin(q.a) * q.rx * 1.25).toFixed(1)}L${(q.x + Math.cos(q.a) * q.rx * 1.7).toFixed(1)},${(q.y + Math.sin(q.a) * q.rx * 1.7).toFixed(1)}" stroke="${INK}" stroke-width="1.6" opacity="${((fade - .5) * 2).toFixed(2)}"/>`).join('') : '');
      }
      // the doily comes loose and drifts down like a leaf, landing flat
      if (t >= 2.5) {
        const k = seg(t, 2.5, 3.2), dy = E.in(k) * (h * .5), rk = Math.sin(k * Math.PI * 2.2) * 9 * (1 - k);
        const flat = k < .75 ? 1 - .25 * E.in(k / .75) : lerp(.75, .03, E.out(seg(k, .75, 1)));
        S.setCard({ py: h, ty: dy * 0, rot: rk, sy: flat, sx: 1 - (1 - flat) * .05 });
      }
      // the moth
      const L0 = [c.x + S.land[0], c.y + S.land[1]];
      let x, y, o = { size: 1.12 };
      if (t < .62) { const k = seg(t, 0, .62), e = E.out(k); x = lerp(-U * .3, L0[0], e) + Math.sin(k * 9) * U * .2 * (1 - k); y = lerp(c.y + U * .3, L0[1], e) - Math.sin(k * Math.PI * 2.5) * U * .25 * (1 - k); o.flap = .5 + .5 * Math.sin(t * 60); o.rot = Math.sin(t * 13) * .2; }
      else if (t < 1.36) { x = L0[0]; y = L0[1] + (t >= 1.0 ? U * .11 * E.out(seg(t, 1.0, 1.1)) : 0); o.flap = t < .72 ? .5 + .5 * Math.sin(t * 60) : .9; o.twitch = t >= 1.12 && t < 1.32 ? Math.sin(t * 60) : 0; if (t >= .84 && t < 1.0) { y += Math.sin(t * 90) * 1.5; } }
      else if (t < 2.2) { const q = S.holes[Math.max(0, n - 1)]; x = c.x + q.x + Math.cos(q.a + 2) * U * .04; y = c.y + q.y + Math.sin(q.a + 2) * U * .04; o.flap = .9; o.rot = q.a + Math.PI / 2; o.fat = 1 + seg(t, 1.36, 2.2) * .8; }
      else if (t < 2.86) { x = c.x + w * .5; y = c.y + h * .5; o.flap = .9; o.fat = 1.8; o.twitch = t >= 2.24 && t < 2.4 ? Math.sin(t * 50) : 0; if (t >= 2.5) { const k = seg(t, 2.5, 2.86); o.flap = .5 + .5 * Math.sin(t * 46); y -= E.out(k) * U * .45; x += Math.sin(k * 6) * U * .05; } }
      else { const k = seg(t, 2.86, 3.85); x = c.x + w * .5 + E.in(k) * U * 1.7; y = c.y + h * .5 - U * .45 - k * U * .9 + Math.sin(k * Math.PI * 4) * U * .1; o.flap = .5 + .5 * Math.sin(t * 34); o.fat = 1.8; o.rot = Math.sin(t * 9) * .15; }
      C_moth(p, U, x, y, o);
      if (t >= 3.28 && t < 3.55) { const k = seg(t, 3.28, 3.55); p.g({ halo: false, op: 1 - k }); p.circ(x - U * .14, y - U * .08 - k * U * .1, U * (.025 + k * .03), { w: .7, n: 8 }); }
      if (t >= .84 && t < 1.0) burst(p, [c.x + S.holes[0].x, c.y + S.holes[0].y], U * .07, U * .11, 4, .4, .55);
      if (t >= 2.22 && t < 2.42) { p.g({ halo: false }); [[-.45, -.4], [.45, -.4], [-.45, .4], [.45, .4]].forEach(([u, v], i) => { const cx = c.x + w / 2 + u * w, cy = c.y + h / 2 + v * h; star(p, [cx, cy], U * .04 * (1 - seg(t, 2.22, 2.42) * .5), 4, i + 1); }); }
    }
  };

  /* ═════════ C10. THE ANTS — a line of ants walks in; the cartoon walks out ═════════ */
  function C_ant(p, x, y, a, f, ph, o) {   // tiny side-view ant, feet at y, facing f; a = px per unit
    const P = (u, v) => [x + f * u * a, y - v * a];
    o = o || {};
    p.g();
    p.circ(...P(-.24, .33), .13 * a, { sx: 1.3, fill: INK, w: .5, n: 9, amp: .05 });
    p.circ(...P(.03, .32), .06 * a, { sx: 1.5, fill: INK, w: .5, n: 8, amp: .05 });
    p.circ(...P(.23, .36), .075 * a, { fill: INK, w: .5, n: 8, amp: .05 });
    p.line([P(.27, .42), P(.36, .58), P(.46, .54)], { w: .55, amp: .03 });
    if (o.hup) p.line([P(.1, .36), P(.2, .6), P(.17, .72)], { w: .6, amp: .03 });
    [[-.12, 0], [.04, .33], [.2, .66]].forEach(([lx, off]) => {
      const s = Math.sin((ph + off) * Math.PI * 2) * .07, lf = Math.max(0, Math.cos((ph + off) * Math.PI * 2)) * .05;
      p.line([P(.03, .3), P(lx * .7 + .02 + s * .5, .2), P(lx + s, lf)], { w: .6, amp: .04, halo: false });
    });
  }
  GAGS.C_ants = {
    name: 'The Ants', dur: 3.9, ones: [[2.94, 3.6]],
    cues: [[0.05, 'tiny-march-loop'], [1.3, 'march-stop'], [1.42, 'tiny-hup'], [1.5, 'lift-creak'], [1.74, 'scuttle-loop'], [2.85, 'scuttle-fade'], [2.96, 'tiny-hurry'], [3.18, 'tiny-skid'], [3.42, 'tiny-hurry']],
    setup(S) {
      const { U, G, c, W } = S;
      S.a = U * .2; S.N = 12; S.ya = G + 3; S.lift = 7;
      S.fin = Array.from({ length: S.N }, (_, i) => c.x + c.w * (.95 - i * .9 / (S.N - 1)));
    },
    draw(S, t, p) {
      const { U, G, c, W, a } = S, w = c.w, h = c.h;
      // the column marches in along the floor and lines up under the cartoon
      let lift = 0, tx = 0, bob = 0, rk = 0;
      if (t >= 1.48) lift = S.lift * E.back(seg(t, 1.48, 1.62));
      if (t >= 1.74) { const k = seg(t, 1.74, 2.88); tx = (k < .25 ? E.in(k / .25) * .25 : k) * (W - c.x + U * .2); bob = Math.abs(Math.sin(t * 26)) * 1.6; rk = Math.sin(t * 13) * 1.0; }
      if (t >= 1.48) S.setCard({ tx, ty: -lift - bob, rot: rk, py: h, hide: t >= 2.88 });
      if (t < 2.88) {
        const lead = lerp(-U * .25, S.fin[0], seg(t, 0, 1.3));
        for (let i = 0; i < S.N; i++) {
          let x = t < 1.3 ? lead - (S.fin[0] - S.fin[i]) : S.fin[i];
          x += tx;
          if (x < -U * .3 || x > W + U * .3) continue;
          const moving = t < 1.3 || t >= 1.74, ph = moving ? t * (t < 1.3 ? 5 : 8) + i * .37 : 0;
          C_ant(p, x, S.ya, a, 1, ph, { hup: t >= 1.38 && t < 1.62 });
        }
      }
      // the late one
      if (t >= 2.94 && t < 3.75) {
        let x, f = 1, ph = t * 9;
        if (t < 3.16) x = lerp(-U * .2, W * .45, E.out(seg(t, 2.94, 3.16)));
        else if (t < 3.42) { x = W * .45; f = t >= 3.24 && t < 3.34 ? -1 : 1; ph = 0; }
        else x = lerp(W * .45, W + U * .3, E.in(seg(t, 3.42, 3.7)));
        C_ant(p, x, S.ya, a * 1.05, f, ph);
        if (t >= 3.16 && t < 3.22) C_speed(p, [[x - U * .06, S.ya - a * .2], [x - U * .07, S.ya - a * .4]], U * .08, Math.PI, .5);
        if (t >= 2.94 && t < 3.16) C_speed(p, [[x - U * .08, S.ya - a * .15], [x - U * .09, S.ya - a * .35]], U * .12, Math.PI, .4);
      }
    }
  };

  /* ═════════ C11. THE ELEPHANT — backs up (beep, beep), sits ═════════ */
  const C_SKIN = '#DDD7CF', C_SKIN2 = '#CBC4BA';
  GAGS.C_elephant = {
    name: 'The Elephant', dur: 4.15, ones: [[1.56, 1.96]],
    cues: [[0.05, 'reverse-beep'], [0.32, 'stomp'], [0.4, 'reverse-beep'], [0.66, 'stomp'], [0.75, 'reverse-beep'], [1.0, 'stomp'], [1.24, 'card-gulp'], [1.58, 'descend-whoosh'], [1.8, 'WHUMP'], [2.0, 'settle-creak'], [2.24, 'trunk-slide'], [2.46, 'tiny-toot'], [2.76, 'heave-up'], [3.24, 'stomp'], [3.5, 'stomp']],
    setup(S) {
      const { U, G, c, W } = S;
      S.X1 = c.x + c.w * .56; S.X0 = W + U * 1.15; S.yb0 = c.y - 4;
      S.steps = [[0, .34], [.34, .68], [.68, 1.02]];
    },
    body(S, X, yb) {
      const { U, W } = S;
      return [[W + 80, yb - 2.1 * U], [X + .5 * U, yb - 2.16 * U], [X - .25 * U, yb - 2.02 * U], [X - .7 * U, yb - 1.62 * U], [X - .9 * U, yb - 1.0 * U], [X - .84 * U, yb - .44 * U], [X - .62 * U, yb - .08 * U], [X - .3 * U, yb + .025 * U], [X + .25 * U, yb + .03 * U], [X + .62 * U, yb - .03 * U], [W + 80, yb - .12 * U]];
    },
    toes(p, U, x, y, n) { for (let i = 0; i < n; i++) p.circ(x + (i - (n - 1) / 2) * .1 * U, y - .035 * U, .045 * U, { sy: .7, fill: '#fff', w: .8, halo: false, n: 8 }); },
    leg(p, U, x, top, G, lift, far, fold) {
      if (fold) {   // folded hind leg: the knee forward, the foot flat on the floor facing us
        p.shape([[x - .1 * U, G - .62 * U], [x + .3 * U, G - .58 * U], [x + .52 * U, G - .4 * U], [x + .58 * U, G - .16 * U], [x + .5 * U, G], [x + .08 * U, G], [x - .1 * U, G - .2 * U]], { fill: far ? C_SKIN2 : C_SKIN });
        if (!far) { this.toes(p, U, x + .3 * U, G, 3); [[.15, -.4], [.3, -.3]].forEach(([dx, dy]) => p.line([[x + dx * U, G + dy * U], [x + (dx + .12) * U, G + (dy - .03) * U], [x + (dx + .22) * U, G + (dy + .02) * U]], { w: .55, halo: false, color: 'rgba(31,26,23,.55)' })); }
        return;
      }
      const g0 = G - lift, w0 = .22 * U, w1 = .27 * U;
      p.shape([[x - w0, top], [x + w0, top], [x + w1 * .97, g0 - .12 * U], [x + w1, g0], [x - w1, g0], [x - w1 * .97, g0 - .12 * U]], { fill: far ? C_SKIN2 : C_SKIN });
      if (!far) {
        this.toes(p, U, x, g0, 3);
        [.2, .35, .5, .65, .8].forEach((k, i) => { const y = lerp(top, g0, k); p.line([[x - w0 * .85, y], [x - w0 * .2, y + .03 * U], [x + w0 * (.3 + (i % 2) * .4), y - .005 * U]], { w: .55, halo: false, color: 'rgba(31,26,23,.5)' }); });
      }
    },
    trunk(p, U, S, k, toot) {   // reaches in from the right edge, curls up, toots
      const { W, c } = S, x0 = W + U * .1, y0 = c.y + U * .25;
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10, reach = k * U * 1.0; pts.push([x0 - Math.sin(u * Math.PI * .5) * reach, y0 + u * U * .9 * k - (u > .7 ? (u - .7) / .3 * U * .35 * toot * k : 0)]); }
      const A = [], B = [];
      for (let i = 0; i <= 10; i++) { const P = pts[i], Q = pts[Math.min(10, i + 1)], R = pts[Math.max(0, i - 1)], dx = Q[0] - R[0], dy = Q[1] - R[1], d = Math.hypot(dx, dy) || 1, wd = U * (.13 - i * .008); A.push([P[0] - dy / d * wd, P[1] + dx / d * wd]); B.push([P[0] + dy / d * wd, P[1] - dx / d * wd]); }
      p.g(); p.shape(A.concat(B.reverse()), { fill: C_SKIN, w: 1.1 });
      for (let i = 2; i < 10; i += 1.3) { const j = Math.floor(i); p.line([A[j], B[10 - j]], { w: .5, halo: false, color: 'rgba(31,26,23,.45)' }); }
      return pts[10];
    },
    draw(S, t, p) {
      const { U, G, c, W } = S, w = c.w, h = c.h;
      let X = S.X1, shake = 0, lifts = [0, 0];
      const stepAt = (t0, t1, x0, x1, steps) => { const k = seg(t, t0, t1); X = lerp(x0, x1, k); steps.forEach(([a, b], i) => { if (t >= a && t < b) lifts[i % 2] = Math.sin(seg(t, a, b) * Math.PI) * U * .09; if (t >= b - .02 && t < b + .06) shake = (Math.floor(t * 48) % 2 ? 2 : -2); }); };
      if (t < 1.02) stepAt(0, 1.02, S.X0, S.X1, S.steps);
      if (t >= 2.98) stepAt(2.98, 3.5, S.X1, W + U * 1.3, [[2.98, 3.24], [3.24, 3.5]]);
      // down (whump), settle, comfy wiggle ... then back up again
      const ks = t < 2.75 ? E.in(seg(t, 1.56, 1.8)) : 1 - E.io(seg(t, 2.75, 2.98));
      const settle = t >= 1.8 && t < 2.3 ? Math.sin(seg(t, 1.8, 2.25) * Math.PI * 3) * Math.exp(-seg(t, 1.8, 2.25) * 3) * U * .06 : 0;
      const wiggle = t >= 2.0 && t < 2.24 ? Math.sin(seg(t, 2.0, 2.24) * Math.PI * 4) * U * .03 : 0;
      const drop = (G - (S.yb0 + .03 * U)) * ks;
      if (t >= 1.8 && t < 1.92) shake = (Math.floor(t * 48) % 2 ? 4 : -4);
      const yb = S.yb0 + drop - settle + shake, Xs = X + wiggle;
      // the cartoon: trembles while it waits, goes flat under him, and stays flat
      const rumpBottom = yb + .03 * U;
      let sy = 1, sx = 1;
      if (t >= 1.56) { sy = t < 1.8 ? clamp((c.y + h - rumpBottom) / h, .045, 1) : .045; sx = 1 + (1 - sy) * .2; }
      const tr = t >= 1.2 && t < 1.56 ? (Math.floor(t * 24) % 2 ? 1 : -1) : 0;
      S.setCard({ py: h, sy, sx, tx: tr + (shake ? shake * .5 : 0) });
      if (t >= 1.8) {   // the pancake keeps a crisp edge
        const x0 = c.x + w / 2 - w * sx / 2, x1 = c.x + w / 2 + w * sx / 2, y1 = c.y + h + (shake ? shake * .3 : 0), y0 = y1 - h * sy;
        p.g(); p.shape([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { w: 1.1, amp: .3 });
      }
      if (t >= 1.24 && t < 1.5) {
        const k = seg(t, 1.24, 1.5); p.g(); const x = c.x + w * .08 - k * U * .12, y = c.y - U * .02 - Math.sin(k * Math.PI) * U * .12 + k * U * .1;
        p.shape([[x, y - U * .05], [x + U * .025, y], [x, y + U * .02], [x - U * .025, y]], { fill: '#fff', w: .8, amp: .1 });
      }
      if (t >= 1.8 && t < 2.5) {
        const k = E.out(seg(t, 1.8, 2.3)), op = 1 - seg(t, 2.15, 2.5), pf = [];
        [[-1, c.x + U * .15], [1, c.x + w - U * .1]].forEach(([sd, x0], j) => { for (let i = 0; i < 6; i++) { const q = rnd(S.seed + 120 + j, i), r = U * (.08 + q * .1) * (.4 + k * .6); pf.push([x0 + sd * (rnd(S.seed + 125 + j, i) * .3 + k * .15) * U, G - r * .5 - (q * .14 + k * .06) * U, r]); } });
        C_puffs(p, pf, op);
      }
      const sitting = ks > .02;
      if (Xs - 1.0 * U < W) {
        p.g();
        this.leg(p, U, Xs + .32 * U, yb - .05 * U, G, lifts[1], true, ks > .5);
        const B = this.body(S, Xs, yb);
        p.g(); p.shape(B, { fill: C_SKIN, w: 1.3 });
        p.shape([[Xs - .8 * U, yb - .3 * U], [Xs - .6 * U, yb - .06 * U], [Xs - .3 * U, yb + .02 * U], [Xs + .25 * U, yb + .025 * U], [Xs + .6 * U, yb - .03 * U], [Xs + .6 * U, yb - .2 * U], [Xs - .2 * U, yb - .18 * U]], { fill: WASH, stroke: false, halo: false });
        [[-.82, -1.3, -.6, -1.15], [-.86, -.95, -.62, -.84], [-.8, -.6, -.58, -.54], [-.35, -1.78, -.12, -1.66], [-.6, -1.6, -.42, -1.5], [-.5, -.3, -.3, -.28], [.1, -.5, .35, -.45], [.0, -1.1, .25, -1.02]].forEach(([a, b, c2, d]) => p.line([[Xs + a * U, yb + b * U], [Xs + (a + c2) / 2 * U + .03 * U, yb + (b + d) / 2 * U + .04 * U], [Xs + c2 * U, yb + d * U]], { w: .6, halo: false, color: 'rgba(31,26,23,.5)' }));
        const sw = t < 1.1 || t >= 2.98 ? Math.sin(t * 9) * .12 : t >= 1.8 && t < 2.2 ? Math.sin(seg(t, 1.8, 2.2) * Math.PI * 3) * .25 : 0;
        const tb = [Xs - .88 * U, yb - .85 * U], tl = sitting ? .75 * U : .95 * U;
        const te = [tb[0] - Math.sin(.15 + sw) * tl, tb[1] + Math.cos(.15 + sw) * tl];
        const tm = [lerp(tb[0], te[0], .5) - .08 * U, lerp(tb[1], te[1], .5)];
        if (te[1] > G - .05 * U) { te[1] = G - .05 * U; te[0] = tb[0] - Math.sqrt(Math.max(0, tl * tl - (te[1] - tb[1]) * (te[1] - tb[1]))); }
        p.g(); p.line([tb, tm, te], { w: 1.3 });
        for (let i = -2; i <= 2; i++) p.line([te, [te[0] + i * .025 * U - Math.sin(sw) * .05 * U, te[1] + .1 * U]], { w: .8, amp: .1 });
        p.g();
        this.leg(p, U, Xs, yb - .05 * U, G, lifts[0], false, ks > .5);
      }
      // the trunk reaches round from the head, off to the right, and gives a little toot
      if (t >= 2.22 && t < 2.8) {
        const k = t < 2.62 ? E.out(seg(t, 2.22, 2.4)) : 1 - E.in(seg(t, 2.62, 2.78)), toot = t >= 2.42 && t < 2.62 ? E.out(seg(t, 2.42, 2.5)) : 0;
        if (k > 0) { const tip = this.trunk(p, U, S, k, toot); if (t >= 2.46 && t < 2.62) burst(p, [tip[0] - U * .02, tip[1] - U * .05], U * .06, U * .12, 5, -2.4, .7); }
      }
      if (t >= 1.8 && t < 1.92) { C_speed(p, [[c.x + w * .15, G - U * .3], [c.x + w * .5, G - U * .4], [c.x + w * .85, G - U * .3]].map(([x, y]) => [x, y + shake]), U * .1, -Math.PI / 2, .6); }
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     SET D — sports, nature & household-odd. Eleven gags, keys prefixed D_.
     Helpers here are D-prefixed so they can sit beside the other sets.
     ═══════════════════════════════════════════════════════════════════════ */
  const Dk = (t, a, b, e) => E[e || 'io'](seg(t, a, b));
  const Dpulse = (t, a, b) => (t >= a && t < b) ? Math.sin(seg(t, a, b) * Math.PI) : 0;
  /* move the card above / below the figure layer */
  function DcardFront(S, on) {
    if (on) { if (S.cardWrap.nextSibling !== null) S.svg.appendChild(S.cardWrap); }
    else if (S.cardWrap.nextSibling !== S.figs) S.svg.insertBefore(S.cardWrap, S.figs);
  }
  /* headwear and hair the core rig doesn't have (drawn after figure(), using its joints) */
  function Dhat(p, P, J, kind) {
    const hc = J.hc, hr = J.hr, f = P.face || 0, s = sgnOf(f), back = !!P.back;
    const T = pts => pts.map(([x, y]) => rot([hc[0] + x * hr, hc[1] + y * hr], hc, P.tilt || 0));
    const M = pts => s ? pts.map(([x, y]) => [x * s, y]) : pts;
    p.g();
    if (kind === 'bun') {
      const b = s ? [-.66 * s, -.98] : [0, -1.2];
      p.circ(...T([b])[0], hr * .38, { fill: INK, w: .8 });
    } else if (kind === 'beanie') {
      p.shape(T([[-1.07, -.3], [-1.02, -.74], [-.62, -1.08], [0, -1.18], [.62, -1.08], [1.02, -.74], [1.07, -.3]]), { fill: '#fff' });
      p.shape(T([[-1.12, -.16], [1.12, -.16], [1.1, -.48], [-1.1, -.48]]), { fill: '#fff', w: .8 });
      [-.6, -.2, .2, .6].forEach(x => p.line(T([[x, -.2], [x, -.44]]), { w: .5, halo: false, amp: .1 }));
      p.circ(...T([[s ? -.2 * s : 0, -1.36]])[0], hr * .3, { fill: '#fff', w: .8 });
    } else if (kind === 'bucket') {
      p.shape(T([[-.82, -.5], [-.7, -1.1], [.7, -1.1], [.82, -.5]]), { fill: '#fff' });
      p.shape(T([[-1.42, -.2], [-.86, -.56], [.86, -.56], [1.42, -.2], [1.2, -.12], [0, -.3], [-1.2, -.12]]), { fill: '#fff', w: .9 });
      p.line(T([[-.8, -.66], [.8, -.66]]), { w: 1.1, halo: false });
    } else if (kind === 'helmet') {
      if (s) {
        p.shape(T(M([[-1.08, -.05], [-1.05, -.7], [-.6, -1.1], [.15, -1.18], [.78, -1.0], [1.1, -.55], [1.08, -.32], [.5, -.36], [-.1, -.3], [-.3, .12], [-.75, .2]])), { fill: INK });
        p.shape(T(M([[.62, -.38], [1.5, -.28], [1.46, -.17], [.66, -.24]])), { fill: INK, w: .8 });
        p.line(T(M([[-.55, -.88], [-.1, -1.02]])), { color: '#fff', w: 1, halo: false, amp: .1 });
      } else {
        p.shape(T([[-1.1, -.15], [-1.02, -.74], [-.55, -1.12], [.55, -1.12], [1.02, -.74], [1.1, -.15], [.8, -.32], [0, -.42], [-.8, -.32]]), { fill: INK });
        if (!back) p.shape(T([[-.8, -.34], [0, -.46], [.8, -.34], [.6, -.22], [0, -.2], [-.6, -.22]]), { fill: INK, w: .8 });
        p.line(T([[-.45, -.92], [0, -1.02]]), { color: '#fff', w: 1, halo: false, amp: .1 });
      }
    } else if (kind === 'sunhat') {
      p.shape(T([[-.72, -.55], [-.62, -1.12], [0, -1.24], [.62, -1.12], [.72, -.55]]), { fill: '#fff' });
      p.shape(T([[-1.75, -.42], [-1.1, -.66], [0, -.72], [1.1, -.66], [1.75, -.42], [1.1, -.5], [0, -.5], [-1.1, -.5]]), { fill: '#fff', w: .9 });
      p.line(T([[-.7, -.68], [.7, -.68]]), { w: 1.6, halo: false });
    } else if (kind === 'curly') {
      const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.02 + i / 14 * .96) + (s ? -s * .12 : 0), r = i % 2 ? 1.2 : 1.36; pts.push([Math.cos(a) * r, Math.sin(a) * r * .95 - .06]); }
      if (back) pts.push([1.05, .2], [0, .32], [-1.05, .2]); else pts.push(s ? [s * .6, -.45] : [.75, -.5], [0, -.62], s ? [-s * .95, -.1] : [-.75, -.5]);
      p.shape(T(pts), { fill: INK, w: .8 });
    } else if (kind === 'band' || kind === 'bandhair') {
      if (kind === 'bandhair') {
        const pts = s ? M([[-1.03, -.42], [-.98, -.72], [-.6, -1.02], [0, -1.12], [.6, -1.0], [.92, -.7], [.95, -.45]]) : [[-1.03, -.42], [-.98, -.74], [-.6, -1.02], [0, -1.12], [.6, -1.02], [.98, -.74], [1.03, -.42]];
        p.shape(T(pts), { fill: INK, w: .8 });
      }
      p.shape(T([[-1.06, -.3], [1.06, -.3], [1.04, -.52], [-1.04, -.52]]), { fill: '#fff', w: .8 });
      if (s) { p.line(T(M([[-1.0, -.4], [-1.32, -.2]])), { w: 1 }); p.line(T(M([[-1.0, -.4], [-1.28, -.02]])), { w: 1 }); }
    }
  }
  function Dmouth(p, P, J, kind) {
    if (P.back || !kind) return;
    const hc = J.hc, hr = J.hr, f = P.face || 0, look = P.look || 0;
    const mx = hc[0] + f * hr * .6, my = hc[1] + hr * .46 + look * hr * .1, w = hr * (.3 - Math.abs(f) * .12);
    const o = { w: .75, halo: false, amp: .12 };
    if (kind === 'grin') p.line([[mx - w, my - hr * .07], [mx, my + hr * .1], [mx + w, my - hr * .07]], o);
    else if (kind === 'flat') p.line([[mx - w * .75, my + hr * .02], [mx + w * .75, my]], o);
    else if (kind === 'frown') p.line([[mx - w * .8, my + hr * .1], [mx, my - hr * .02], [mx + w * .8, my + hr * .1]], o);
    else if (kind === 'open') p.circ(mx, my + hr * .04, hr * .17, { sy: 1.25, fill: INK, w: .6, halo: false, n: 8, amp: .1 });
    else if (kind === 'wide') p.circ(mx, my + hr * .06, hr * .24, { sy: 1.3, fill: INK, w: .6, halo: false, n: 10, amp: .1 });
    else if (kind === 'puff') { p.circ(mx, my, hr * .1, { w: .6, halo: false, n: 8, amp: .1 }); [-1, 1].forEach(k => p.line([[hc[0] + f * hr * .35 + k * hr * .62, hc[1] + hr * .2], [hc[0] + f * hr * .35 + k * hr * .7, hc[1] + hr * .42]], { w: .5, halo: false, amp: .1 })); }
  }
  /* a pen-drawn cloud: ink rims first, paper fills on top, so overlapping circles read as one billow */
  function Dcloud(p, pts, op, w) {
    p.g({ halo: false, op: op == null ? 1 : op });
    pts.forEach(([x, y, r]) => p.circ(x, y, r, { w: w || 1.7, n: 12, amp: r * .05 }));
    pts.forEach(([x, y, r]) => p.circ(x, y, r, { fill: '#F6F2EC', stroke: false, n: 12, amp: r * .05 }));
  }
  /* a puff of dust at floor level, k: 0..1 through its life */
  function Dpuff(p, x, y, r, k) {
    if (k <= 0 || k >= 1) return;
    const e = E.out(k), rr = r * (.45 + e * .75), q = r * (.32 + e * .22);
    Dcloud(p, [[x - rr, y - q * .5, q * .8], [x - rr * .35, y - q * .95, q], [x + rr * .35, y - q * .9, q * .95], [x + rr, y - q * .45, q * .75]], 1 - k * k, 1.3);
  }
  /* ═════════ D1. UNDER THE RUG — knocked flat, swept under, the lump won't stay put ═════════ */
  function DbroomDraw(p, U, hd, ang, G) {
    const d = [Math.sin(ang), -Math.cos(ang)], n = [-d[1], d[0]];
    const at = (u, v) => [hd[0] + d[0] * u * U + n[0] * v * U, hd[1] + d[1] * u * U + n[1] * v * U];
    p.g();
    p.line([at(.12, 0), at(.98, 0)], { w: .95 });
    p.shape([at(0, -.075), at(.1, -.034), at(.13, -.026), at(.13, .026), at(.1, .034), at(0, .075)], { fill: '#fff' });
    p.line([at(.1, -.034), at(.1, .034)], { w: .6, halo: false });
    [-.04, 0, .04].forEach(v => p.line([at(.015, v * 1.5), at(.085, v * .7)], { w: .45, halo: false, amp: .1 }));
    return at;
  }
  GAGS.D_rug = {
    name: 'Under the Rug', dur: 4.1, lineAt: 3.78, ones: [[0.6, 0.84], [2.3, 2.52], [2.86, 3.08]],
    cues: [[0.05, 'footsteps'], [0.6, 'broom-poke'], [0.8, 'whump'], [0.9, 'rug-flip'], [1.02, 'sweep'], [1.24, 'sweep'], [1.44, 'sweep'], [1.64, 'rug-flop'], [1.82, 'satisfied-hum'], [2.34, 'stomp'], [2.4, 'boing'], [2.9, 'stomp'], [2.98, 'boing'], [3.62, 'step-up']],
    setup(S) {
      const { U, G, c, W } = S;
      S.rL = c.x + c.w * .0; S.rR = c.x + c.w * .62; S.rt = U * .12; S.fl = U * .36; S.hinge = S.rR - S.fl;
      const xs = S.xs = c.x + c.w * .86; S.x0 = W + U * .5;
      S.xb = [c.x + c.w * .34, c.x + c.w * .1];
      S.lh = U * .13; S.lw = U * .58; S.sy0 = S.rt * .82 / c.h;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}rug"><rect x="${S.hinge.toFixed(1)}" y="-2000" width="${W + 4000}" height="4000"/></clipPath>`);
      // the cartoon: toppled flat by a poke, then dragged left under the lifted end of the rug in three strokes
      const sl = -(c.x + c.w - S.hinge + U * .1) / 3;
      S.ck = track([
        [0.62, { sy: 1, kx: 0, tx: 0, ty: 0 }],
        [0.8, { sy: S.sy0, kx: -4, ty: 4 }, 'in'],
        [0.84, { kx: 0 }],
        [1.0, {}],
        [1.12, { tx: sl }, 'io'],
        [1.22, {}],
        [1.34, { tx: sl * 2 }, 'io'],
        [1.42, {}],
        [1.54, { tx: sl * 3 }, 'io'],
      ]);
      // her + the broom (head point H in A-units, handle angle, hands at u1/u2 along the handle; u<0 = free hand)
      S.trk = track([
        [0.5, { hip: A(0, .415), face: -1, lean: 0, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), H: [-.24, .05], ang: .12, u1: -1, u2: .6, hfree: A(.06, .42), mouth: 0 }],
        [0.56, { H: [-.12, .5], ang: 1.36, u1: .2, u2: .38, lean: .06, look: -.3 }],
        [0.62, { H: [-.44, .48], ang: 1.4, lean: -.22, hip: A(-.06, .41), fL: A(-.14, 0) }, 'out'],
        [0.7, {}],
        [0.8, { H: [-.36, .3], ang: 1.0, lean: -.1, look: .5 }],
        [0.86, { H: [-.52, .02], ang: .95, u1: .32, u2: .58, lean: -.38, hip: A(-.08, .37), look: .7 }],
        [0.94, { H: [-.46, .3], ang: .7 }, 'out'],
        [1.0, { H: [-.36, .02], ang: .82, lean: -.3, hip: A(-.06, .38), look: .8, fL: A(-.16, 0), fR: A(.05, 0) }],
        [1.12, { H: [-.74, .02], ang: 1.0, lean: -.45, hip: A(-.2, .36), fL: A(-.3, 0) }, 'out'],
        [1.22, { H: [-.5, .02], ang: .82, lean: -.3, hip: A(-.2, .38), fR: A(-.1, 0) }],
        [1.34, { H: [-.88, .02], ang: 1.0, lean: -.45, hip: A(-.34, .36), fL: A(-.44, 0) }, 'out'],
        [1.42, { H: [-.64, .02], ang: .82, lean: -.3, hip: A(-.34, .38), fR: A(-.24, 0) }],
        [1.54, { H: [-.94, .03], ang: 1.0, lean: -.45, hip: A(-.42, .36), fL: A(-.56, 0) }, 'out'],
        [1.6, { H: [-.92, .36], ang: .62, lean: -.25 }, 'out'],
        [1.68, { H: [-.9, .05], ang: .8, lean: -.38 }, 'in'],
        [1.8, { H: [-.68, .02], ang: -.04, u1: -1, u2: .62, lean: 0, hip: A(-.4, .415), fL: A(-.48, 0), fR: A(-.33, 0), look: 0, hfree: A(-.3, .42) }],
        [1.86, { blink: 1, brow: 1, hd: [0, U * .01] }],
        [1.98, { blink: 0, brow: 0, hd: [0, 0] }],
        [2.06, { look: .9, hd: [-U * .01, U * .015] }],
        [2.2, { brow: 1 }],
      ]);
    },
    hgt(S, t) {   // lump heights at the two spots
      const pop = (a, b) => E.back(seg(t, a, b)), fall = (a, b) => 1 - seg(t, a, b);
      const hA = t < 1.66 ? 0 : t < 1.8 ? pop(1.66, 1.8) : t < 2.34 ? 1 : t < 2.4 ? fall(2.34, 2.4) : t < 2.96 ? 0 : t < 3.08 ? pop(2.96, 3.08) : t < 3.62 ? 1 : lerp(1, .42, Dk(t, 3.62, 3.7));
      const hB = t < 2.38 ? 0 : t < 2.5 ? pop(2.38, 2.5) : t < 2.9 ? 1 : t < 2.96 ? fall(2.9, 2.96) : 0;
      return [hA, hB];
    },
    bump(S, H, x) {
      let m = 0;
      S.xb.forEach((xb, i) => { const u = Math.abs(x - xb) / (S.lw / 2); if (u < 1) m += H[i] * S.lh * Math.pow(1 - Math.pow(u, 4), .55); });
      return m;
    },
    pose(S, t, H) {
      const { U, G } = S, A = S.A, x0 = S.A(-.4, 0)[0];
      let P = S.trk(t);
      if (t < .5) { P = walk(S, P, t, 0, .5, S.x0, S.xs, { carry: true }); P.H = [(P.hip[0] - S.xs) / U - .24, .05]; P.hfree = [P.hip[0] + U * .06, G - U * .42]; }
      const on = (x, lift) => [x, G - S.rt * .3 - this.bump(S, H, x) * .9 - (lift || 0)];
      if (t >= 2.2) {   // the stomping: walk to a lump, stamp on it; walk to the next; look; then stand on it
        const xa = S.xb[0], xbb = S.xb[1];
        const legs = (x, tt, t0, t1, xFrom, raise) => {
          let Q = Object.assign({}, P);
          if (tt < t1) Q = walk(S, Q, tt, t0, t1, xFrom, x, { carry: true, face: -1 * Math.sign(xFrom - x || 1) });
          else { Q.hip = [x, G - U * .415]; Q.fL = [x - U * .07, G]; Q.fR = [x + U * .07, G]; }
          return Q;
        };
        if (t < 2.62) {
          P = legs(xa + U * .06, t, 2.2, 2.3, x0);
          const r = Dpulse(t, 2.28, 2.36);   // stamp
          if (t >= 2.28) { P.fL = [xa, G - U * .12 * r]; P.hip = [P.hip[0], P.hip[1] - U * .03 * r]; }
          P.face = t < 2.5 ? -1 : -1; P.look = t < 2.5 ? .9 : .4; P.brow = 1;
        } else if (t < 3.24) {
          P = legs(xbb + U * .06, t, 2.62, 2.8, xa + U * .06);
          const r = Dpulse(t, 2.84, 2.92);
          if (t >= 2.84) { P.fL = [xbb, G - U * .12 * r]; P.hip = [P.hip[0], P.hip[1] - U * .03 * r]; }
          P.look = t < 2.98 ? .9 : .3; P.brow = 1;
          if (t >= 3.02) { P.face = t < 3.14 ? lerp(-1, 1, Dk(t, 3.02, 3.1)) : 1; P.look = .5; }
          if (t >= 3.16) { P.face = lerp(1, 0, Dk(t, 3.16, 3.24)); P.look = 0; }
        } else {
          P = legs(xa, t, 3.42, 3.62, xbb + U * .06);
          if (t < 3.42) { P.face = 0; P.look = 0; P.brow = 1; P.mouth = 'flat'; }
          else { P.face = t < 3.6 ? 1 : lerp(1, 0, Dk(t, 3.62, 3.72)); P.look = 0; P.brow = 1; P.mouth = 'flat'; }
        }
        // broom: carried upright, then planted like a staff
        const hp = P.hip;
        P.H = [(hp[0] - S.xs) / U - .27, .04]; P.ang = -.04; P.u1 = -1; P.u2 = .6; P.hfree = [hp[0] + U * .1, hp[1] - U * .02];
        if (t >= 3.62) { const k = Dk(t, 3.62, 3.76); P.H = [(hp[0] - S.xs) / U - lerp(.27, .3, k), .04]; P.hfree = [hp[0] + U * lerp(.1, .15, k), hp[1] - U * lerp(.02, .04, k)]; P.eb = [-1, -1]; }
      }
      // feet stand on the rug where they are over it
      ['fL', 'fR'].forEach(k => { const f = P[k]; if (f[0] > S.rL && f[0] < S.hinge && f[1] > G - U * .02) { const g = on(f[0]); P[k] = [f[0], Math.min(f[1], g[1])]; } });
      const lift = Math.max(G - P.fL[1], G - P.fR[1]);
      if (t >= 3.62) P.hip = [P.hip[0], G - U * .415 - Math.min(lift, S.rt * .3 + S.lh * .4)];
      return P;
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      const H = this.hgt(S, t);
      const P = this.pose(S, t, H);
      // the card
      const K = S.ck(t);
      if (t >= .62) S.setCard({ px: S.hinge - c.x + U * .1, py: c.h, sy: K.sy, kx: K.kx, tx: K.tx, ty: K.ty, hide: t >= 1.56 });
      S.cardWrap.setAttribute('clip-path', t >= .8 ? `url(#${S.id}rug)` : '');
      if (t >= .8 && t < 1.56) {   // crisp edge on the part of the fallen card still showing
        const xl = Math.max(S.hinge, c.x + K.tx), xr = c.x + c.w + K.tx, yt = G - 1 - S.sy0 * c.h;
        if (xr > xl + 2) { p.g(); p.shape([[xl, yt], [xr, yt], [xr, G - 1], [xl, G - 1]], { w: .7, amp: .2 }); p.line([[xl, yt + (G - 1 - yt) * .45], [xr - U * .03, yt + (G - 1 - yt) * .5]], { w: .4, halo: false, color: 'rgba(31,26,23,.4)' }); }
      }
      // the rug: flat part (with lumps) + the end flap that flips up
      const fa = t < .88 ? 0 : t < .96 ? 1.9 * E.back(seg(t, .88, .96)) : t < 1.6 ? 1.9 : t < 1.68 ? 1.9 * (1 - E.in(seg(t, 1.6, 1.68))) : t < 1.74 ? .12 * Math.sin(seg(t, 1.68, 1.74) * Math.PI) : 0;
      const rt = S.rt, L0 = S.rL - U * .02, Hx = S.hinge, top = [], ty = x => G - rt - this.bump(S, H, x);
      top.push([L0, ty(L0)], [L0 + 1.5, ty(L0 + 1.5)]);
      for (let x = L0 + U * .04; x < Hx; x += U * .04) top.push([x, ty(x)]);
      top.push([Hx, G - rt]);
      const n = 6, fc = [[Hx, G - rt / 2]];
      for (let i = 1; i <= n; i++) { const a = -fa * (.5 + .5 * i / n), q = fc[i - 1]; fc.push([q[0] + Math.cos(a) * S.fl / n, q[1] + Math.sin(a) * S.fl / n]); }
      const nrm = i => { const a = fc[Math.min(i + 1, n)], b = fc[Math.max(i - 1, 0)], dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1; return [dy / d, -dx / d]; };
      const off = (i, v) => { const m = nrm(i), q = fc[i]; return [q[0] + m[0] * v * rt, q[1] + m[1] * v * rt]; };
      const ft = fc.map((q, i) => off(i, .5)), fb = fc.map((q, i) => off(i, -.5));
      p.g({ halo: false }); p.circ((S.rL + S.rR) / 2, G + 1, (S.rR - S.rL) * .52, { sy: .05, fill: WASH, stroke: false });
      p.g();
      const end = ft[n], endB = fb[n];
      const outline = top.concat(ft.slice(1, n), [end, mixPt(end, endB, .02)], [mixPt(endB, end, .02), endB], fb.slice(1, n).reverse(), [[Hx, G], [L0 + 1.5, G], [L0, G - .5]]);
      p.shape(outline, { fill: '#fff', w: .9, amp: .15 });
      // border lines, the diamond row, the end bands, the fringe
      const io = { w: .45, halo: false, amp: .1 };
      p.line(top.map(([x, y]) => [x, y + rt * .2]).filter(q => q[0] > L0 + U * .08), io);
      p.line([[L0 + U * .08, G - rt * .2], [Hx, G - rt * .2]], io);
      p.line(fc.map((q, i) => off(i, .3)), io); p.line(fc.map((q, i) => off(i, -.3)), io);
      [U * .035, U * .065].forEach(d => p.line([[L0 + d, ty(L0 + d) + 1], [L0 + d, G - 1]], io));
      for (let x = L0 + U * .14; x < Hx - U * .03; x += U * .11) { const yc = (ty(x) + G) / 2, r = rt * .2; p.shape([[x - r * 1.3, yc], [x, yc - r], [x + r * 1.3, yc], [x, yc + r]], { fill: INK, w: .3, halo: false, amp: .05 }); }
      const fL = S.fl, fd = [0, .33, .66];
      fd.forEach(k => { const i = Math.min(n - 1, Math.floor(k * n)), q = mixPt(fc[i], fc[i + 1], k * n - i), m = nrm(i), d = [fc[i + 1][0] - fc[i][0], fc[i + 1][1] - fc[i][1]], dl = Math.hypot(...d) || 1, u = [d[0] / dl, d[1] / dl], r = rt * .2; p.shape([[q[0] - u[0] * r * 1.3, q[1] - u[1] * r * 1.3], [q[0] + m[0] * r, q[1] + m[1] * r], [q[0] + u[0] * r * 1.3, q[1] + u[1] * r * 1.3], [q[0] - m[0] * r, q[1] - m[1] * r]], { fill: INK, w: .3, halo: false, amp: .05 }); });
      const ed = [fc[n][0] - fc[n - 1][0], fc[n][1] - fc[n - 1][1]], el = Math.hypot(...ed) || 1, ud = [ed[0] / el, ed[1] / el], nn = nrm(n);
      [.06, .12].forEach(d => p.line([[end[0] - ud[0] * U * d, end[1] - ud[1] * U * d], [endB[0] - ud[0] * U * d, endB[1] - ud[1] * U * d]], io));
      [-.42, -.21, 0, .21, .42].forEach(v => { const q = [fc[n][0] + nn[0] * v * rt, fc[n][1] + nn[1] * v * rt]; p.line([q, [q[0] + ud[0] * U * .065 + nn[0] * v * rt * .5, q[1] + ud[1] * U * .065 + nn[1] * v * rt * .5]], { w: .5, amp: .15 }); });
      [.1, .3, .5, .7, .9].forEach(v => p.line([[L0, G - rt * v], [L0 - U * .065, G - rt * v + (v - .5) * U * .02]], { w: .5, amp: .15 }));
      // dust where it lands, where the flap flops, where she stamps
      Dpuff(p, c.x + c.w * .5, G - U * .03, U * .14, seg(t, .8, 1.15));
      Dpuff(p, S.hinge + U * .2, G - U * .03, U * .09, seg(t, 1.66, 1.95));
      Dpuff(p, S.xb[0], G - U * .03, U * .08, seg(t, 2.34, 2.56));
      Dpuff(p, S.xb[1], G - U * .03, U * .08, seg(t, 2.9, 3.12));
      // her, then the broom in front
      shadow(p, P.hip[0], G, U * .19);
      const hd = [S.xs + P.H[0] * U, G - P.H[1] * U];
      const d = [Math.sin(P.ang), -Math.cos(P.ang)], hp = u => [hd[0] + d[0] * u * U, hd[1] + d[1] * u * U];
      P.hR = hp(P.u2); P.hL = P.u1 >= 0 ? hp(P.u1) : P.hfree;
      const J = figure(p, S, P, { hat: 'hair' });
      Dhat(p, P, J, 'bun');
      Dmouth(p, P, J, P.mouth);
      DbroomDraw(p, U, hd, P.ang, G);
      p.g(); [P.hR].concat(P.u1 >= 0 ? [P.hL] : []).forEach(h => p.dot(h[0], h[1], U * .016));
      if (t >= 2.3 && t < 2.46) burst(p, [S.xb[0], G - U * .06], U * .08, U * .13, 5, -2.6, .7);
      if (t >= 2.86 && t < 3.02) burst(p, [S.xb[1], G - U * .06], U * .08, U * .13, 5, -2.6, .7);
    }
  };

  /* ═════════ D2. TIME-LAPSE — he waits for it to get funny; decades pass; it crumbles ═════════ */
  function Dfront(S, p, fn) {   // a layer above everything (the "glass")
    if (!S.Dfr) S.Dfr = document.createElementNS(NS, 'g');
    if (S.Dfr.parentNode !== S.svg || S.Dfr.nextSibling) S.svg.appendChild(S.Dfr);
    const pf = new Pen(p.b, S.U, S.seed + 9); if (fn) fn(pf); S.Dfr.innerHTML = pf.svg();
  }
  GAGS.D_lapse = {
    name: 'Time-Lapse', dur: 4.0, lineAt: 3.66, ones: [[2.92, 3.3]],
    cues: [[0.05, 'footsteps'], [0.5, 'chair-creak'], [0.74, 'watch-tick'], [1.1, 'tape-click'], [1.14, 'fast-forward-loop'], [2.76, 'tape-click'], [2.92, 'crumble'], [3.1, 'dust-settle'], [3.5, 'creak-neck']],
    setup(S) {
      const { U, G, c, W } = S;
      const xc = S.xc = c.x + c.w * .84; S.x0 = W + U * .5;
      const seat = G - U * .3, A = (dx, dy) => [xc + dx * U, G - dy * U];
      S.A = A; S.seat = seat;
      const sit = { hip: [xc, seat - U * .02], lean: -.05, face: -1, look: .1, brow: 0, hd: [0, 0], fL: A(-.3, 0), fR: A(-.24, 0), hL: A(-.16, .34), hR: A(-.1, .33), kb: [1, 1], blink: 0, mouth: '' };
      S.sit = sit;
      S.trk = track([
        [.46, { hip: A(.02, .415), lean: 0, face: -1, look: 0, brow: 0, hd: [0, 0], fL: A(-.05, 0), fR: A(.09, 0), hL: A(-.08, .42), hR: A(.12, .42), kb: [1, 1], blink: 0, mouth: '' }],
        [.62, sit],
        [.7, { hL: A(-.14, .6), hR: A(-.2, .52), look: .5, hd: [-U * .01, U * .01] }],
        [.9, {}],
        [.98, { hL: A(-.16, .34), hR: A(-.1, .33), look: .1, hd: [0, 0] }],
        [1.04, { face: -.4, look: 0 }],
        [1.1, { face: -1 }],
      ]);
      // time-lapse poses, cycled jerkily (sitting, facing the cartoon)
      S.lp = [
        { lean: -.05, hL: A(-.06, .5), hR: A(-.1, .48), look: .1 },                      // arms folded
        { lean: -.32, hL: A(-.24, .5), hR: A(-.18, .34), look: -.2, hd: [-U * .02, 0] }, // chin on hand
        { lean: .12, hL: A(-.12, .32), hR: A(-.06, .3), look: .6, blink: 1, hd: [U * .01, U * .02] }, // dozing
        { lean: -.1, hL: A(-.14, .58), hR: A(-.2, .5), look: .5 },                        // checks watch
        { lean: .05, hL: A(-.1, .36), hR: A(.04, .52), look: 0, face: -.3 },              // scratches head
        { lean: -.2, hL: A(-.2, .3), hR: A(-.14, .3), look: .3, blink: 1 },               // slumped
      ];
      S.defs.insertAdjacentHTML('beforeend', `<filter id="${S.id}sep" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter><clipPath id="${S.id}fold"><polygon points=""/></clipPath>`);
      S.fmat = S.defs.querySelector(`#${S.id}sep feColorMatrix`); S.fpoly = S.defs.querySelector(`#${S.id}fold polygon`);
      S.cardIn.setAttribute('filter', `url(#${S.id}sep)`); S.cardIn.setAttribute('clip-path', `url(#${S.id}fold)`);
      S.cardIn.id = S.id + 'ci';
      // spots + cracks (card-local)
      S.spots = Array.from({ length: 26 }, (_, i) => [rnd(S.seed + 41, i) * c.w, rnd(S.seed + 43, i) * c.h, 1.2 + rnd(S.seed + 45, i) * 3.4, 1.2 + rnd(S.seed + 47, i) * 1.2]);
      const crack = (x0, y0, dx, dy, n, sd) => { const pts = [[x0, y0]]; for (let i = 1; i <= n; i++) pts.push([x0 + dx * i / n + (rnd(sd, i) - .5) * c.w * .07, y0 + dy * i / n + (rnd(sd, i + 9) - .5) * c.h * .07]); return pts; };
      S.cracks = [crack(c.w * .5, 0, -c.w * .08, c.h * .55, 6, 3), crack(c.w * .42, c.h * .55, c.w * .5, c.h * .2, 5, 5), crack(0, c.h * .4, c.w * .45, c.h * .14, 5, 7), crack(c.w * .45, c.h * .6, -c.w * .1, c.h * .4, 4, 9)];
      // crumble pieces: a jittered 3×4 grid of the card, each a clipped copy of it
      const cols = 4, rows = 5, Wc = c.w + 8, Hc = c.h + 8, V = [];
      for (let j = 0; j <= rows; j++) { V.push([]); for (let i = 0; i <= cols; i++) { const ed = i === 0 || i === cols || j === 0 || j === rows; V[j].push([i / cols * Wc + (ed ? 0 : (rnd(S.seed + 51, i + j * 9) - .5) * Wc * .18) - (i === 0 ? 2 : 0), j / rows * Hc + (ed ? 0 : (rnd(S.seed + 53, i + j * 9) - .5) * Hc * .16) - (j === 0 ? 2 : 0)]); } }
      S.pieces = []; let h = '';
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const poly = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]], k = S.pieces.length;
        const cx = poly.reduce((a, q) => a + q[0], 0) / 4, cy = poly.reduce((a, q) => a + q[1], 0) / 4;
        S.pieces.push({ cx, cy, bot: Math.max(...poly.map(q => q[1])), d: (rows - 1 - j) * .045 + rnd(S.seed + 55, k) * .08, r: (rnd(S.seed + 57, k) - .5) * 30, dx: (rnd(S.seed + 59, k) - .5) * U * .12 });
        h += `<g class="pc"><clipPath id="${S.id}pc${k}"><polygon points="${poly.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}"/></clipPath><g clip-path="url(#${S.id}pc${k})"><use href="#${S.id}ci"/></g></g>`;
      }
      S.pg = document.createElementNS(NS, 'g'); S.pg.innerHTML = h; S.pg.style.display = 'none'; S.cardWrap.appendChild(S.pg);
      S.pcs = Array.from(S.pg.querySelectorAll('.pc'));
    },
    age(S, t) { return Dk(t, 1.2, 2.6, 'lin'); },
    pose(S, t) {
      const { U, G } = S;
      let P = S.trk(t);
      if (t < .46) P = walk(S, P, t, 0, .46, S.x0, S.xc + U * .02, { carry: true, face: -1 }), P.hL = [P.hip[0] - U * .08, G - U * .42], P.hR = [P.hip[0] + U * .12, G - U * .42];
      const ag = this.age(S, t);
      if (t >= 1.12 && t < 2.76) {   // fast-forward: a new pose every sixth of a second
        const i = Math.floor((t - 1.12) * 6), q = S.lp[(i * 5 + (i >> 1)) % S.lp.length];
        P = Object.assign({}, S.sit, q);
        P.hd = q.hd || [0, 0];
      }
      if (t >= 2.76) {   // old now: slumped, then the slow look at the camera
        P = Object.assign({}, S.sit, track([
          [2.76, { lean: -.24, look: .4, hd: [-U * .02, U * .03], hL: S.A(-.2, .3), hR: S.A(-.14, .3), face: -1, blink: 0 }],
          [3.3, {}],
          [3.44, { look: .6 }],
          [3.6, { face: -.3, look: .1, hd: [-U * .01, U * .02] }],
          [3.76, { face: 0, look: 0, lean: -.2 }],
          [3.82, { blink: 1 }],
          [3.88, { blink: 0 }],
        ])(t));
      }
      P.age = ag;
      return P;
    },
    draw(S, t, p) {
      const { U, G, c } = S, ag = this.age(S, t), ff = t >= 1.12 && t < 2.76;
      const P = this.pose(S, t);
      // the card ages: yellows, spots, curls at two corners, cracks
      const a = E.io(Dk(t, 1.25, 2.5, 'lin')), I = [1, 0, 0, 0, 1, 0, 0, 0, 1], Sp = [.393, .769, .189, .349, .686, .168, .272, .534, .131], tint = [.69, .69, .69, .71, .71, .71, .73, .73, .73];
      const m = I.map((v, i) => (lerp(v, Sp[i] * tint[i], a) * (1 - a * .05)).toFixed(3));
      S.fmat.setAttribute('values', `${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0`);
      const w = c.w, h = c.h, f1 = U * .32 * E.out(Dk(t, 1.8, 2.6, 'lin')), f2 = U * .22 * E.out(Dk(t, 2.0, 2.7, 'lin'));
      S.fpoly.setAttribute('points', [[-4, -4], [w - f1 - 1, -4], [w + 12, f1 + 12], [w + 12, h + 12], [f2 + 12, h + 12], [-4, h - f2 + 1]].map(q => q.map(v => v.toFixed(1)).join(',')).join(' '));
      let ov = '';
      const ns = Math.floor(Dk(t, 1.35, 2.5, 'lin') * S.spots.length);
      for (let i = 0; i < ns; i++) { const [x, y, r, sy] = S.spots[i]; ov += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r / sy).toFixed(1)}" fill="rgba(120,86,30,.2)"/>`; }
      if (f1 > 1) ov += `<path d="M${w - f1},0 L${w},${f1} L${w - f1 * .92},${f1 * .92} Z" fill="#E6D7A8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
      if (f2 > 1) ov += `<path d="M0,${h - f2} L${f2},${h} L${f2 * .92},${h - f2 * .92} Z" fill="#E6D7A8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
      const ck = Dk(t, 2.3, 2.74, 'lin');
      if (ck > 0) S.cracks.forEach((cr, i) => { const q = clamp(ck * 1.6 - i * .2, 0, 1); if (q <= 0) return; const L = pathLen(cr); ov += `<path d="${polyD(along(cr, L, q).upto)}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`; });
      S.over.innerHTML = ov;
      // the crumble
      const crum = t >= 2.92;
      S.card.style.visibility = crum ? 'hidden' : '';
      S.pg.style.display = crum ? '' : 'none';
      let dust = 0;
      if (crum) S.pieces.forEach((q, k) => {
        const tt = t - 2.92 - q.d, ex = c.y + 5;
        let ty = 0, r = 0, op = 1, dx = 0;
        if (tt > 0) { const fall = G - 2 - (c.y + q.bot); const u = Math.min(1, tt / .3); ty = fall * u * u; r = q.r * u; dx = q.dx * u; if (u >= 1) op = 0; else if (u > .75) op = 1 - (u - .75) / .25; dust += u >= .8 ? 1 : 0; }
        else { dx = (rnd(k, Math.floor(t * 24)) - .5) * 2; }
        const g = S.pcs[k]; g.setAttribute('transform', `translate(${(c.x + dx).toFixed(1)} ${(c.y + ty).toFixed(1)}) rotate(${r.toFixed(1)} ${q.cx.toFixed(1)} ${q.cy.toFixed(1)})`); g.setAttribute('opacity', op.toFixed(2));
      });
      // day / night drifting by while it's on fast-forward (low contrast, slow enough not to strobe)
      if (ff) { const k = .5 - .5 * Math.cos((t - 1.12) * Math.PI * 2 * 2.2); p.g({ halo: false }); p.raw(`<rect x="0" y="0" width="${S.W}" height="${S.H}" fill="rgba(31,26,23,${(k * .09).toFixed(3)})"/>`); }
      // the chair (drawn in), his shadow swinging with the sun
      const xc = S.xc, dk = seg(t, 0, .3);
      const sx = ff ? Math.sin((t - 1.12) * Math.PI * 2 * 2.2) * U * .14 : 0;
      p.g({ halo: false }); p.circ(xc + sx, G + 1, U * .24, { sy: .13, fill: WASH, stroke: false });
      if (dk > 0) {
        p.g({ op: dk });
        p.line([[xc - U * .14, S.seat], [xc + U * .12, S.seat]], { w: 1.4 });
        p.line([[xc + U * .12, G], [xc + U * .15, G - U * .8]], { w: 1.1 });
        p.line([[xc - U * .12, S.seat], [xc - U * .14, G]], { w: 1.1 });
        p.line([[xc + U * .1, S.seat], [xc + U * .02, G]], { w: .8 });
        p.line([[xc + U * .13, G - U * .56], [xc + U * .14, G - U * .72]], { w: 2.4 });
      }
      // dust pile from the crumble
      const dp = Dk(t, 3.04, 3.4, 'out');
      if (dp > 0) { const xm = c.x + c.w * .45, r = U * .09; Dcloud(p, [[xm - r * 2.4, G - r * .3, r * .55], [xm - r * 1.2, G - r * .6, r * .85], [xm, G - r * .75, r], [xm + r * 1.3, G - r * .55, r * .8], [xm + r * 2.5, G - r * .3, r * .55]].map(([x, y, rr]) => [x, y + (1 - dp) * r, rr * (.4 + .6 * dp)]), 1, 1.4); }
      if (t >= 3.0 && t < 3.56) Dpuff(p, c.x + c.w * .45, G - U * .1, U * .3, seg(t, 3.0, 3.56));
      // him
      const J = figure(p, S, P, { glasses: true });
      // the beard: grows down to the floor and pools toward the cartoon
      if (ag > 0) {
        const f = P.face, sd = f < -.3 ? -1 : f > .3 ? 1 : 0, hc = J.hc, hr = J.hr, dir = sd === 1 ? 1 : -1;
        const top = [hc[0] + sd * hr * .32, hc[1] + hr * .5];
        const L = ag * U * 1.2, down = G - 2 - top[1], n = 12, pts = [];
        for (let i = 0; i <= n; i++) {
          const d = L * i / n, wv = Math.sin(i * 1.1 + ag * 4) * hr * .1 * Math.min(1, i / 3);
          pts.push(d <= down ? [top[0] + sd * hr * .25 * (i / n) + wv, top[1] + d] : [top[0] + dir * (d - down), G - 2 - Math.abs(wv) * .3]);
        }
        const wid = i => hr * (1.15 - .9 * i / n) * Math.min(1, .45 + L / (U * .3));
        const Lf = [], Rt = [];
        pts.forEach((q, i) => { const a = pts[Math.min(i + 1, n)], b = pts[Math.max(i - 1, 0)], dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1, nx = dy / d, ny = -dx / d, w2 = wid(i) / 2, rip = Math.sin(i * 2.3) * hr * .06; Lf.push([q[0] + nx * (w2 + rip), q[1] + ny * (w2 + rip)]); Rt.push([q[0] - nx * (w2 - rip), q[1] - ny * (w2 - rip)]); });
        p.g(); p.shape(Lf.concat([pts[n]], Rt.slice().reverse()), { fill: '#fff', amp: .35 });
        [-.22, .2].forEach(o => p.line(pts.slice(1, -1).map((q, i) => { const k = Lf[i + 1], r = Rt[i + 1]; return mixPt(r, k, .5 + o); }), { w: .45, halo: false, amp: .3 }));
      }
      // cobweb between his arm and the chair back
      const cw = Dk(t, 1.7, 2.5, 'lin');
      if (cw > 0) {
        const o = [xc + U * .145, G - U * .74], R = U * .2 * cw;
        p.g({ halo: false, op: .7 });
        const rays = [Math.PI * .55, Math.PI * .75, Math.PI * .95].map(an => [o[0] + Math.cos(an) * R, o[1] + Math.sin(an) * R]);
        rays.forEach(q => p.line([o, q], { w: .4, amp: .2 }));
        [.4, .7, 1].forEach(k => p.line(rays.map(q => mixPt(o, q, k)), { w: .4, amp: .3 }));
      }
      // the fast-forward mark, VCR style
      if (ff && Math.floor(t * 4) % 2 === 0) {
        const x = c.x + U * .16, y = c.y + U * .2, s = U * .085;
        p.g({ halo: true }); p.shape([[x, y - s * .6], [x + s * .9, y], [x, y + s * .6]], { fill: INK, w: .6, amp: .2 }); p.shape([[x + s * .9, y - s * .6], [x + s * 1.8, y], [x + s * .9, y + s * .6]], { fill: INK, w: .6, amp: .2 });
      }
    }
  };

  /* ═════════ D3. THE DISCUS — two spins, a perfect release, straight into the glass ═════════ */
  GAGS.D_disc = {
    name: 'The Discus', dur: 3.9, lineAt: 3.6, ones: [[.84, 2.24]],
    cues: [[0.05, 'footsteps'], [0.5, 'grab'], [0.7, 'grunt'], [0.9, 'whoosh-loop'], [1.84, 'release-grunt'], [1.9, 'whoosh-close'], [2.08, 'glass-smack'], [2.56, 'squeak-slide'], [3.32, 'thud-offscreen'], [3.4, 'sheepish-wave']],
    setup(S) {
      const { U, G, c, W, H } = S;
      const xs = S.xs = c.x + c.w * .44; S.x0 = -U * .55;
      S.gy = c.h * .5; S.cs = .55;   // grip height on the card's left edge (card-local)
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.th = t => t < .84 ? (t < .6 ? 0 : -.55 * E.io(seg(t, .6, .84))) : t < 1.84 ? lerp(-.55, Math.PI * 4.5, E.in(seg(t, .84, 1.84)) * .55 + seg(t, .84, 1.84) * .45) : Math.PI * 4.5;
      // where the card ends up: centred, a little larger than the screen, as if pressed on the glass
      S.glass = { s: W / c.w * 1.14, cx: W * .5, cy: H * .38 };
    },
    draw(S, t, p) {
      const { U, G, c, W, H } = S, A = S.A, xs = S.xs;
      let P;
      const th = S.th(t);
      if (t < .42) { P = walk(S, { face: 1, look: 0, brow: 0 }, t, 0, .42, S.x0, xs, {}); }
      else {
        P = { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.09, 0), fR: A(.09, 0), hL: A(-.1, .43), hR: A(.1, .43) };
        if (t < 1.88) {
          const sp = t >= .6, cr = sp ? .05 * Dpulse(t, .6, 1.0) + (t > .84 ? .03 : 0) : 0;
          P.hip = A(0, .415 - cr); P.fL = A(-.12, 0); P.fR = A(.12, 0);
          const fc = Math.cos(th), bk = Math.sin(th) < -.35;
          P.face = sp ? fc : 1; P.back = sp && bk; P.lean = sp ? -.08 * Math.sin(th) : 0;
          // feet shuffle round as he turns
          if (t > .84) { const ph = th * 2; P.fL = [xs - Math.cos(ph) * U * .1, G - Math.max(0, Math.sin(ph)) * U * .04]; P.fR = [xs + Math.cos(ph) * U * .1, G - Math.max(0, -Math.sin(ph)) * U * .04]; }
        } else {   // follow-through, then watches it hit, hands to head, sheepish wave
          P = Object.assign(P, track([
            [1.88, { face: .3, lean: .12, hL: A(-.25, .7), hR: A(.32, .82), fL: A(-.14, 0), fR: A(.1, .06), look: -.2, mouth: '' }],
            [2.1, { face: 0, lean: 0, hL: A(-.28, .5), hR: A(.28, .55), fR: A(.12, 0), look: -.4 }, 'out'],
            [2.5, {}],
            [2.62, { hL: A(-.12, .98), hR: A(.12, .98), look: -.1, brow: 1, hd: [0, U * .015], mouth: 'wide' }, 'out'],
            [3.1, {}],
            [3.24, { hL: A(-.1, .43), hR: A(.1, .43), look: 0, hd: [0, 0], mouth: 'flat' }],
            [3.34, { hR: A(.2, .82) }],
            [3.42, { hR: A(.26, .86) }],
            [3.5, { hR: A(.2, .82) }],
            [3.58, { hR: A(.26, .86) }],
            [3.7, { hR: A(.1, .43), brow: 0 }],
          ])(t));
          P.eb = [1, -1];
          P.armsFront = t >= 2.6 && t < 3.2;
        }
      }
      // the grip hand orbits him; the card swings round it like a revolving door
      let front = false;
      if (t >= .42 && t < 1.88) {
        const k = seg(t, .42, .6), R = U * .26 * (t < .6 ? E.io(k) : 1);
        const hipY = P.hip[1], hy = hipY - U * .1;
        const hand = [lerp(c.x + 3, xs + Math.cos(th) * R, t < .6 ? E.io(k) : 1), lerp(c.y + S.gy, hy, t < .6 ? E.io(k) : 1)];
        const dep = Math.sin(th), g0 = t < .6 ? E.io(k) : 1, sc = lerp(1, S.cs, g0) * (1 + .22 * dep * seg(t, .84, 1.1));
        front = dep > .05;
        // card extends from the hand outward: card-local pivot = left edge at grip height
        const sxv = (t < .6 ? 1 : Math.cos(th)) * sc;
        S.setCard({ px: 0, py: S.gy, tx: hand[0] - c.x, ty: hand[1] - (c.y + S.gy), sx: Math.abs(sxv) < .03 ? .03 * Math.sign(sxv || 1) : sxv, sy: sc, rot: t < .6 ? -6 * Math.sin(g0 * Math.PI) : -4 * Math.sin(th * 2) });
        S.img.style.display = sxv < 0 ? 'none' : '';
        P.hR = hand; if (t >= .6) P.hL = [lerp(hand[0], P.hip[0], .45), hand[1] + U * .05];
        // motion smear behind the far edge
        if (t > 1.0) { p.g({ halo: false }); for (let i = 1; i <= 3; i++) { const t2 = S.th(t - i * .025), x = hand[0] + Math.cos(t2) * c.w * S.cs * (1 + .22 * Math.sin(t2)), hh = c.h * S.cs * .42; p.line([[x, hand[1] - hh], [x, hand[1] + hh]], { w: .6, color: `rgba(31,26,23,${.35 - i * .08})`, amp: .3 }); } }
      }
      // release: it turns face-on and flies at the camera
      const gl = S.glass;
      if (t >= 1.88) {
        front = true;
        S.img.style.display = '';
        const k = E.in(seg(t, 1.88, 2.08));
        const hand0 = [xs + Math.cos(Math.PI * 4.5) * U * .26, G - U * .5];
        let s, cx, cy, sx, rot, ty = 0;
        if (t < 2.08) { s = lerp(S.cs, gl.s, k); cx = lerp(hand0[0] + c.w * S.cs * .5, gl.cx, k); cy = lerp(G - U * .5, gl.cy, k); sx = lerp(.05, 1, E.out(seg(t, 1.88, 2.05))); rot = lerp(-25, -7, k); }
        else {
          const q = seg(t, 2.08, 2.2);
          s = gl.s; cx = gl.cx; cy = gl.cy; rot = -7;
          sx = 1 + .07 * Math.sin(q * Math.PI * 2) * (1 - q);
          const sl = seg(t, 2.52, 3.32); ty = E.in(sl) * (H * 1.25); rot = -7 + sl * 4;
        }
        const sy = t >= 2.08 ? 1 - .05 * Math.sin(seg(t, 2.08, 2.2) * Math.PI * 2) * (1 - seg(t, 2.08, 2.2)) : 1;
        S.setCard({ px: c.w / 2, py: c.h / 2, tx: cx - c.x - c.w / 2, ty: cy - c.y - c.h / 2 + ty, sx: s * sx, sy: s * sy, rot, hide: t >= 3.32 });
      }
      DcardFront(S, front);
      shadow(p, P.hip[0], G, U * .2);
      if (t >= .9 && t < 1.88) { p.g({ halo: false }); const r = U * .3; p.circ(xs, G - U * .02, r, { sy: .16, w: .6, color: 'rgba(31,26,23,.4)', n: 12 }); }
      const J = figure(p, S, P, {});
      Dhat(p, P, J, 'bandhair');
      Dmouth(p, P, J, P.mouth);
      // on the glass: impact ticks, then the smear it leaves as it slides
      Dfront(S, p, pf => {
        if (t >= 2.08 && t < 2.36) {   // smack lines round its edges
          const k = seg(t, 2.08, 2.36), hw = c.w * gl.s / 2, hh = c.h * gl.s / 2, R = d => rot([gl.cx + d[0], gl.cy + d[1]], [gl.cx, gl.cy], -7 * Math.PI / 180);
          pf.g({ halo: true, op: 1 - k * .6 });
          [[-1, -.6], [-1, .1], [-1, .7], [1, -.5], [1, .3], [1, .8], [-.5, 1], [.4, 1], [-.3, -1], [.6, -1]].forEach(([u, v], i) => {
            const side = Math.abs(u) === 1 ? [u, 0] : [0, v], base = [u * hw + side[0] * U * .06, v * hh + side[1] * U * .06];
            const o = U * (.06 + k * .06), l = U * .1;
            pf.line([R([base[0] + side[0] * o, base[1] + side[1] * o]), R([base[0] + side[0] * (o + l), base[1] + side[1] * (o + l)])], { w: .9 });
          });
        }
        if (t >= 2.52) {   // two faint squeak streaks where its corners dragged down the glass
          const sl = E.in(seg(t, 2.52, 3.32)), hw = c.w * gl.s / 2, top = gl.cy - c.h * gl.s / 2, y1 = top + sl * H * 1.25;
          pf.g({ halo: false, op: 1 - seg(t, 3.3, 3.85) * .6 });
          [[-hw + U * .1, -1], [hw - U * .14, 1], [-hw * .1, 0]].forEach(([dx, sd], i) => { const x = gl.cx + dx, ya = Math.max(4, top + (i === 2 ? U * .1 : U * .2)); if (y1 - ya > 4) { pf.line([[x, ya], [x + sd * 2, y1 - 6]], { w: i === 2 ? 1.6 : 2.6, color: 'rgba(31,26,23,.07)', amp: .5 }); pf.line([[x + 3, ya + 6], [x + 3 + sd * 2, y1 - 10]], { w: .6, color: 'rgba(31,26,23,.14)', amp: .5 }); } });
        }
      });
    }
  };

  /* torso points without drawing (to put clothes under figure()) */
  const Dhead = (S, P) => { const U = S.U, lean = P.lean || 0, hr = U * .1, neck = DneckOf(S, P), hd = P.hd || [0, 0]; return { neck, hip: P.hip, hr, hc: [neck[0] + Math.sin(lean) * hr * 1.1 + hd[0], neck[1] - Math.cos(lean) * hr * 1.1 + hd[1]] }; };
  const DneckOf = (S, P) => [P.hip[0] + Math.sin(P.lean || 0) * S.U * .31, P.hip[1] - Math.cos(P.lean || 0) * S.U * .31];
  function Djersey(p, S, P, stripes) {
    const U = S.U, nk = DneckOf(S, P), hp = P.hip, d = [nk[0] - hp[0], nk[1] - hp[1]], L = Math.hypot(...d), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
    const sg = sgnOf(P.face || 0), fw = sg ? .055 : .085, bw = sg ? .05 : .085, sh = .02 * sg;
    const at = (k, v) => [lerp(hp[0], nk[0], k) + n[0] * v * U, lerp(hp[1], nk[1], k) + n[1] * v * U];
    p.g(); p.shape([at(.02, -bw + sh), at(.02, fw + sh), at(.92, fw + .01 + sh), at(.98, .03), at(.98, -.03), at(.92, -bw - .01 + sh)], { fill: '#fff', w: .8 });
    if (stripes) [-.5, 0, .5].forEach(k => p.line([at(.06, k * (sg ? .05 : .075)), at(.9, k * (sg ? .05 : .075))], { w: 2.2, halo: false, amp: .15 }));
  }

  /* ═════════ D4. SENT OFF — whistle, card, and the cartoon takes the long walk ═════════ */
  GAGS.D_ref = {
    name: 'Sent Off', dur: 3.9, lineAt: 3.56, ones: [[.36, .56], [.86, 1.22]],
    cues: [[0.05, 'jog-steps'], [0.38, 'whistle-long'], [0.72, 'card-snap'], [0.9, 'protest-hop'], [1.06, 'protest-hop'], [1.3, 'whistle-short'], [1.5, 'deflate'], [1.66, 'shuffle-loop'], [2.22, 'pause'], [2.4, 'shuffle-loop'], [2.88, 'shuffle-stop'], [2.76, 'notebook'], [2.86, 'pencil-scratch'], [3.42, 'nod']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .82; S.x0 = W + U * .5;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.trk = track([
        [.36, { hip: A(0, .415), lean: -.04, face: -1, look: 0, brow: 1, hd: [0, 0], fL: A(-.09, 0), fR: A(.06, 0), hL: A(-.08, .45), hR: A(.1, .45), whistle: 1, cardUp: 0, book: 0, mouth: '' }],
        [.46, { hL: A(-.4, .66), lean: -.12 }, 'out'],
        [.56, {}],
        [.64, { hR: A(.16, .38), hL: A(-.12, .5), lean: 0, whistle: 0 }],
        [.76, { hR: A(.03, 1.2), hL: A(-.4, .8), look: -.3, hip: A(0, .44), fL: A(-.09, .03), fR: A(.06, .03), mouth: 'flat' }, 'out'],
        [1.2, {}],
        [1.3, { hip: A(-.02, .45), hR: A(.0, 1.26), hL: A(-.44, .84), look: -.5, lean: -.1, whistle: 1 }, 'out'],
        [1.5, { hip: A(0, .44), lean: -.04, whistle: 0 }],
        [2.3, { fL: A(-.09, 0), fR: A(.06, 0), hip: A(0, .415) }],
        [2.46, { hR: A(.14, .4), hL: A(-.36, .74), cardUp: 1, look: .2 }],
        [2.56, { hL: A(-.1, .45) }],
        [2.7, { hL: A(-.14, .64), hR: A(-.08, .6), book: 1, look: .7, lean: -.06 }],
        [3.2, {}],
        [3.3, { hL: A(-.08, .45), hR: A(.1, .44), book: 2, look: 0, lean: 0 }],
        [3.4, { face: 0, hd: [0, U * .015], brow: 0, mouth: 'flat' }],
        [3.48, { hd: [0, 0] }],
      ]);
      // the cartoon: protests, deflates, walks off left (pause to look back on the way)
      const off = -(c.x + c.w + U * .3);
      S.walkX = t => t < 1.66 ? 0 : t < 2.22 ? lerp(0, off * .42, (t - 1.66) / .56) : t < 2.42 ? off * .42 : lerp(off * .42, off, E.in(seg(t, 2.42, 2.92)) * .5 + seg(t, 2.42, 2.92) * .5);
    },
    draw(S, t, p) {
      const { U, G, c } = S, A = S.A;
      let P = S.trk(t);
      if (t < .36) { P = walk(S, P, t, 0, .36, S.x0, S.xs, { stride: .78, lift: .12, face: -1, lean: -.1 }); }
      // the cartoon
      let ct = { px: c.w / 2, py: c.h };
      if (t >= .86 && t < 1.66) {
        const pr = seg(t, .86, 1.24), hop = Math.abs(Math.sin(pr * Math.PI * 2)) * (t < 1.24 ? 1 : 0), dfl = Dk(t, 1.46, 1.64);
        ct = Object.assign(ct, { rot: lerp(4 * Dk(t, .86, .94), -2, dfl), tx: lerp(U * .06 * Dk(t, .86, .94), 0, dfl), ty: -hop * U * .07, sy: lerp(1, .93, dfl), kx: lerp(0, 4, dfl) });
        if (t >= 1.24 && t < 1.46) ct.rot = 4 - (t - 1.24) / .22 * 2, ct.tx = U * .06;
      } else if (t >= 1.66) {
        const x = S.walkX(t), ph = (t - 1.66) * 2.6, stp = t >= 2.22 && t < 2.42 ? 0 : 1;
        const look = Dpulse(t, 2.24, 2.42);
        ct = Object.assign(ct, { tx: x, ty: -Math.abs(Math.sin(ph * Math.PI)) * U * .035 * stp, rot: -2 + Math.sin(ph * Math.PI) * 2.4 * stp + look * 5, sy: .93 + look * .03, kx: 4 - look * 6, hide: t >= 2.92 });
      }
      S.setCard(ct);
      shadow(p, P.hip[0], G, U * .19);
      Djersey(p, S, P, true);
      const J = figure(p, S, P, { hat: 'hair' });
      Dmouth(p, P, J, P.whistle > .5 ? '' : P.mouth);
      // whistle + lanyard
      const hc = J.hc, hr = J.hr, f = P.face || 0;
      const wm = [hc[0] + f * hr * .95, hc[1] + hr * .45], wc = [J.neck[0] + f * U * .03, J.neck[1] + U * .09];
      const wp = P.whistle > .5 ? wm : wc;
      p.g(); p.line([[J.neck[0] - f * U * .02, J.neck[1] + U * .01], [lerp(J.neck[0], wp[0], .5), Math.max(J.neck[1], wp[1]) + U * .03], wp], { w: .45, halo: false, amp: .2 });
      p.shape([[wp[0] - U * .025, wp[1] - U * .012], [wp[0] + U * .025 * (f || 1), wp[1] - U * .016], [wp[0] + U * .025 * (f || 1), wp[1] + U * .014], [wp[0] - U * .025, wp[1] + U * .014]], { fill: INK, w: .6, amp: .15 });
      if ((t >= .38 && t < .58) || (t >= 1.3 && t < 1.42)) burst(p, [wm[0] + f * U * .05, wm[1]], U * .04, U * .1, 5, f < 0 ? Math.PI * .8 : -.4, .6);
      // the card he holds up
      if (t >= .66 && P.cardUp < .95) {
        const h = J.hR, w = U * .1, hh = U * .14, sh = (t < .76 ? Dk(t, .66, .76) : 1) * (1 - P.cardUp);
        if (sh > .05) { p.g(); p.shape([[h[0] - w / 2, h[1] - hh * sh], [h[0] + w / 2, h[1] - hh * sh * 1.03], [h[0] + w / 2, h[1] + U * .01], [h[0] - w / 2, h[1] + U * .012]], { fill: INK, w: .7, amp: .2 }); }
      }
      // the notebook and pencil
      if (P.book > .2 && P.book < 1.8) {
        const b = J.hL, w = U * .1, hh = U * .13;
        p.g(); p.shape([[b[0] - w * .1, b[1] - hh * .8], [b[0] + w, b[1] - hh * .82], [b[0] + w * .98, b[1] + hh * .2], [b[0] - w * .1, b[1] + hh * .22]], { fill: '#fff', w: .8 });
        p.line([[b[0] + w * .1, b[1] - hh * .5], [b[0] + w * .8, b[1] - hh * .5]], { w: .5, halo: false });
        const wr = t >= 2.78 && t < 3.2 ? Math.sin(t * 50) * U * .02 : 0, pr = [J.hR[0] + wr, J.hR[1]];
        p.line([[b[0] + w * .15, b[1] - hh * .25], [b[0] + w * .15 + clamp((t - 2.78) / .42, 0, 1) * w * .6, b[1] - hh * .25 + Math.sin(t * 40) * 1.2]], { w: .5, halo: false, amp: .4 });
        p.line([pr, [pr[0] - U * .04, pr[1] + U * .05]], { w: 1.2 });
      }
    }
  };

  /* ═════════ D5. SHRUNK IN THE WASH — hot wash, full spin, comes out a little smaller ═════════ */
  GAGS.D_wash = {
    name: 'Shrunk in the Wash', dur: 4.0, lineAt: 3.66, ones: [[.5, .98], [1.4, 1.56], [2.3, 2.9]],
    cues: [[0.05, 'footsteps'], [0.42, 'door-open'], [0.56, 'stuff-squelch'], [0.98, 'door-slam'], [1.08, 'dial-click'], [1.16, 'wash-loop'], [1.46, 'hop-up'], [1.7, 'spin-rattle'], [2.24, 'ding'], [2.34, 'hop-down'], [2.5, 'door-open'], [2.74, 'tiny-squeak'], [3.3, 'blink']],
    setup(S) {
      const { U, G, c } = S;
      const xw = S.xw = c.x + c.w * .74, ww = S.ww = U * .64, wh = S.wh = U * .74;
      S.pc = [xw + U * .04, G - U * .35]; S.pr = U * .19;
      const xs = S.xs = xw - U * .58; S.x0 = -U * .55;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      const pc = S.pc, top = G - wh;
      S.trk = track([
        [.4, { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .43), hR: A(.1, .43), mouth: '' }],
        [.48, { hR: [pc[0] + S.pr * 1.1, pc[1]], hL: A(.12, .5), lean: .1 }],
        [.56, { hR: A(.22, .62), hL: A(.2, .5), lean: .08 }],
        [.72, { hR: [pc[0] - U * .05, pc[1] - U * .03], hL: [pc[0] - U * .07, pc[1] + U * .04], lean: .25, hip: A(.04, .4) }, 'in'],
        [.8, { hR: [pc[0] - U * .1, pc[1] - U * .02], hL: [pc[0] - U * .12, pc[1] + U * .05], lean: .18 }],
        [.9, { hR: [pc[0] - U * .03, pc[1]], hL: [pc[0] - U * .05, pc[1] + U * .06], lean: .28 }, 'in'],
        [.98, { hR: [pc[0] + S.pr * 1.2, pc[1]], lean: .15, hL: A(-.1, .43) }],
        [1.04, { hR: [xw + ww * .34, top + U * .07], lean: .3, hip: A(.06, .4), look: .3 }],
        [1.14, { hR: [xw + ww * .34, top + U * .07] }],
        [1.22, { hR: A(.1, .43), lean: 0, hip: A(0, .415), look: 0 }],
        [1.32, { face: 0 }],
      ]);
    },
    door(S, t) { return t < .42 ? 0 : t < .5 ? Dk(t, .42, .5) : t < .94 ? 1 : t < 1.0 ? 1 - Dk(t, .94, 1.0, 'in') : t < 2.46 ? 0 : t < 2.54 ? Dk(t, 2.46, 2.54) : 1; },
    shake(S, t) {
      if (t < 1.16 || t >= 2.24) return [0, 0];
      const hop = t >= 1.7 && t < 2.2 ? Math.abs(Math.sin((t - 1.7) * Math.PI * 7)) * S.U * .045 : 0;
      return [Math.sin(t * 77) * S.U * .012 * (t > 1.6 ? 1.6 : 1), -hop];
    },
    draw(S, t, p) {
      const { U, G, c } = S, A = S.A, xw = S.xw, ww = S.ww, wh = S.wh, pr = S.pr;
      const sk = this.shake(S, t), pc = [S.pc[0] + sk[0], S.pc[1] + sk[1]];
      const dk = seg(t, 0, .3), door = this.door(S, t);
      let P = S.trk(t);
      if (t < .4) P = walk(S, P, t, 0, .4, S.x0, S.xs, {});
      // hops up and sits on it while it spins, bouncing; hops down at the ding
      if (t >= 1.32 && t < 2.42) {
        const top = G - wh + sk[1], sx = xw - U * .14 + sk[0];
        const up = Dk(t, 1.36, 1.52, 'out'), down = Dk(t, 2.26, 2.42);
        const sit = { hip: [sx, top - U * .03], lean: -.04, face: -1, look: .2, fL: [sx - U * .2, top + U * .4], fR: [sx - U * .14, top + U * .42], hL: [sx - U * .04, top - U * .2], hR: [sx + U * .02, top - U * .2], kb: [1, 1], armsFront: true, brow: 0 };
        const stand = Object.assign({}, P, { hip: A(0, .415), face: 1 });
        if (t < 1.52) { P = Object.assign({}, P, mix(stand, sit, up)); P.hip = [P.hip[0], P.hip[1] - Math.sin(up * Math.PI) * U * .12]; }
        else if (t < 2.26) { P = Object.assign({}, P, sit); const j = Math.floor(t * 24) % 2; P.hd = [0, j ? U * .012 : 0]; P.blink = t > 1.9 && t < 2.0; P.face = t < 1.62 ? -1 : t < 2.0 ? -.2 : -1; P.look = t >= 1.62 && t < 2.0 ? 0 : .2; }
        else { P = Object.assign({}, P, mix(sit, Object.assign({}, stand, { face: 1 }), down)); P.hip = [P.hip[0], P.hip[1] - Math.sin(down * Math.PI) * U * .08]; }
        if (t >= 1.62 && t < 2.0) P.mouth = 'flat';
      }
      if (t >= 2.42) {
        P = Object.assign({}, P, track([
          [2.42, { hip: A(0, .415), face: 1, lean: 0, look: 0, fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .43), hR: A(.1, .43), hd: [0, 0], brow: 0, mouth: '' }],
          [2.5, { hR: [pc[0] + pr * 1.2, pc[1]], lean: .12 }],
          [2.6, { hR: [pc[0], pc[1] + U * .02], lean: .3, hip: A(.06, .39), look: .5 }, 'out'],
          [2.68, {}],
          [2.86, { hR: A(.06, .88), hip: A(0, .415), lean: 0, look: -.1, hd: [U * .01, 0] }, 'out'],
          [2.96, { brow: 1, hR: A(.1, .86), hd: [U * .02, U * .005] }],
          [3.2, {}],
          [3.34, { face: 0, look: 0, hd: [0, 0], mouth: 'flat' }],
        ])(t));
      }
      // the card: squeezed through the door, tumbling inside, then out — tiny
      const cc = [c.x + c.w / 2, c.y + c.h / 2];
      let clip = false;
      if (t >= .5 && t < 1.0) {
        const k = E.in(seg(t, .5, .92)), f = Math.floor(t * 24);
        const s = lerp(1, .2, k), q = mixPt(cc, pc, E.io(seg(t, .5, .9)));
        S.setCard({ tx: q[0] - cc[0], ty: q[1] - cc[1], sx: s * (1 + (rnd(f, 1) - .5) * .25 * k), sy: s * (1 + (rnd(f, 2) - .5) * .25 * k), rot: (rnd(f, 3) - .5) * 30 * k, kx: (rnd(f, 4) - .5) * 20 * k });
        clip = t >= .86;
      } else if (t >= 1.0 && t < 2.62) {
        const sp = t < 1.16 ? 0 : (t - 1.16), a = Math.min(sp, 2.24 - 1.16) * 900, orb = pr * .35;
        const q = [pc[0] + Math.cos(sp * 9) * orb * (sp > 0 ? 1 : 0), pc[1] + Math.sin(sp * 9) * orb * .6 * (sp > 0 ? 1 : 0) + pr * .1];
        S.setCard({ tx: q[0] - cc[0], ty: q[1] - cc[1], sx: .2, sy: .2, rot: a });
        clip = true;
      } else if (t >= 2.62) {
        const h = P.hR, k = Dk(t, 2.62, 2.7);
        const from = [pc[0], pc[1] + pr * .1], at = [h[0] + U * .02, h[1] - U * .03];
        const q = t < 2.7 ? mixPt(from, at, k) : at;
        const s = t < 2.7 ? lerp(.2, .065, k) : .065;
        S.setCard({ tx: q[0] - cc[0], ty: q[1] - cc[1], sx: s, sy: s, rot: t < 2.7 ? lerp(30, -6, k) : -6 + Math.sin((t - 2.7) * 9) * 3 * (1 - seg(t, 2.7, 3.1)) });
      }
      S.cardWrap.setAttribute('clip-path', clip ? `url(#${S.id}wc)` : '');
      if (!S.wc) { S.defs.insertAdjacentHTML('beforeend', `<clipPath id="${S.id}wc"><circle cx="0" cy="0" r="${(pr * .98).toFixed(1)}"/></clipPath>`); S.wc = S.defs.querySelector(`#${S.id}wc circle`); }
      S.wc.setAttribute('cx', pc[0].toFixed(1)); S.wc.setAttribute('cy', pc[1].toFixed(1));
      // the washer (front with a hole for the porthole)
      const bx = xw + sk[0], by = G + sk[1], top = by - wh;
      p.g({ halo: false }); p.circ(xw, G + 1, ww * .6, { sy: .1, fill: WASH, stroke: false });
      if (dk > 0) {
        p.g({ op: dk });
        const body = p.wob([[bx - ww / 2, top], [bx + ww / 2, top], [bx + ww / 2, by], [bx - ww / 2, by]], true, p.amp * .8);
        const hole = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; hole.push([pc[0] + Math.cos(a) * pr, pc[1] + Math.sin(a) * pr]); }
        const hd = p.wob(hole, true, p.amp * .5);
        p.cur.h.push(`<path d="${body}" stroke-width="${(p.lw * 3.4).toFixed(1)}"/>`);
        p.raw(`<path d="${body} ${hd}" fill="#fff" fill-rule="evenodd" stroke="${INK}" stroke-width="${p.lw.toFixed(2)}"/>`);
        p.line([[bx - ww / 2, top + U * .13], [bx + ww / 2, top + U * .13]], { w: .8, halo: false });
        p.circ(bx + ww * .32, top + U * .065, U * .035, { fill: '#fff', w: .7, halo: false, n: 8 });
        p.line([[bx + ww * .32, top + U * .065], [bx + ww * .32 + U * .02, top + U * .04]], { w: .6, halo: false });
        p.line([[bx - ww * .4, top + U * .065], [bx - ww * .1, top + U * .065]], { w: 1.6, halo: false });
        if (t >= 2.24 && t < 2.5) { p.dot(bx + ww * .12, top + U * .065, U * .016); burst(p, [bx + ww * .12, top + U * .065], U * .04, U * .08, 6, 0, .5); }
        p.line([[bx - ww * .42, by - U * .05], [bx + ww * .42, by - U * .05]], { w: .5, halo: false });
        // water + suds behind the glass while it runs
        if (t >= 1.12 && t < 2.3) {
          p.g({ halo: false });
          const wl = [];
          for (let i = 0; i <= 10; i++) { const x = pc[0] - pr + i / 10 * pr * 2, y = pc[1] + pr * .1 + Math.sin(i * 1.2 + t * 18) * pr * .12; wl.push([x, y]); }
          const bot = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; bot.push([pc[0] + Math.cos(a) * pr, pc[1] + Math.sin(a) * pr]); }
          p.shape(wl.concat(bot), { fill: 'rgba(31,26,23,.1)', stroke: false });
          p.line(wl, { w: .6, color: 'rgba(31,26,23,.5)' });
          for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.7; p.circ(pc[0] + Math.cos(a) * pr * .5, pc[1] - Math.abs(Math.sin(a * 1.3)) * pr * .6, U * .015, { w: .5, n: 6 }); }
        }
        // the door: a ring on the glass, or swung open on its hinge
        p.g();
        if (door < .5) { p.circ(pc[0], pc[1], pr * 1.18, { w: 1.6 }); p.circ(pc[0], pc[1], pr * 1.0, { w: .7, halo: false }); p.line([[pc[0] - pr * .55, pc[1] - pr * .3], [pc[0] - pr * .25, pc[1] - pr * .62]], { w: .7, halo: false, color: 'rgba(31,26,23,.45)' }); }
        else { const ex = pc[0] + pr * 1.18 + pr * .42 * (door < 1 ? door : 1); p.circ(ex, pc[1], pr * 1.18, { sx: .38, fill: '#fff', w: 1.4 }); p.circ(ex, pc[1], pr * .95, { sx: .3, w: .6, halo: false }); p.circ(pc[0], pc[1], pr * 1.02, { w: 1.4 }); }
      }
      if (t >= .52 && t < .92) {   // squelch lines at the door while he stuffs it in
        const k = Math.floor(t * 12) % 2; burst(p, pc, pr * 1.3, pr * 1.6, 5, k * .6, .6);
      }
      shadow(p, P.hip[0], t >= 1.52 && t < 2.26 ? G - U * .0 : G, U * .19, t >= 1.52 && t < 2.26 ? 0 : 1);
      const J = figure(p, S, P, { hat: 'hair', glasses: true, belly: true });
      Dmouth(p, P, J, P.mouth);
    }
  };

  /* ═════════ D6. THE VACUUM — chokes on the corner, then the bag goes square ═════════ */
  function DvacDraw(p, S, bx, o) {   // upright vacuum; bx = front of the nozzle; returns handy points
    const U = S.U, G = S.G, a = o.a != null ? o.a : .42, jx = o.jx || 0;
    const X = x => x + jx;
    p.g();
    p.shape([[X(bx), G - U * .02], [X(bx + U * .01), G - U * .075], [X(bx + U * .05), G - U * .09], [X(bx + U * .24), G - U * .085], [X(bx + U * .27), G - U * .05], [X(bx + U * .26), G - U * .005], [X(bx + U * .02), G]], { fill: '#fff' });
    p.line([[X(bx + U * .02), G - U * .055], [X(bx + U * .16), G - U * .055]], { w: .5, halo: false });
    p.circ(X(bx + U * .21), G - U * .035, U * .035, { fill: '#fff', w: .8, n: 8 });
    const piv = [X(bx + U * .2), G - U * .075], d = [Math.sin(a), -Math.cos(a)], n = [-Math.cos(a), -Math.sin(a)];
    const at = (u, v) => [piv[0] + d[0] * u * U + n[0] * v * U, piv[1] + d[1] * u * U + n[1] * v * U];
    // the bag (drawn under the column): a slim sausage, or a square, or mid-inflation
    const bq = o.bag || 0, side = lerp(.1, .42, bq), len = lerp(.36, .42, bq), u0 = lerp(.2, .16, bq);
    const sq = [[u0, .015], [u0, side], [u0 + len, side], [u0 + len, .015]];
    const rnd4 = bq < .6 ? [[u0 + .02, .02], [u0 - .01, side * .55], [u0 + .04, side], [u0 + len * .5, side * 1.1], [u0 + len - .04, side], [u0 + len + .01, side * .55], [u0 + len - .02, .02]] : sq;
    const sqz = o.squeeze || 0;
    p.shape(rnd4.map(([u, v]) => at(u + (u > u0 + len / 2 ? -sqz * .03 : sqz * .03), v * (1 - sqz * .12))), { fill: '#fff', w: 1 });
    if (bq > .6) {   // the cartoon's shape showing through: a frame line and its heavy shadow edge
      const k = (bq - .6) / .4, i0 = .045, s2 = side - .045;
      p.shape([[u0 + i0, i0], [u0 + i0, s2], [u0 + len - i0, s2], [u0 + len - i0, i0]].map(([u, v]) => at(u, v)), { w: .6 * k, halo: false, amp: .2 });
      p.line([at(u0 + .01, side + .025), at(u0 + len + .02, side + .025), at(u0 + len + .02, .05)], { w: 2.2 * k, halo: false, amp: .2 });
    }
    p.line([at(.0, 0), at(.72, 0)], { w: 1.5 });
    p.line([at(.7, -.07), at(.7, .07)], { w: 2 });
    if (o.lump != null && o.lump >= 0) p.shape([[o.lump - .07, .0], [o.lump - .07, .1], [o.lump + .07, .1], [o.lump + .07, 0]].map(([u, v]) => at(u, v)), { fill: '#fff', w: .8 });
    return { at, grip: at(.7, .02), grip2: at(.6, 0), nozzle: [X(bx + U * .12), G - U * .01], bagTop: at(u0 + len, side * .5) };
  }
  GAGS.D_vac = {
    name: 'The Vacuum', dur: 3.75, lineAt: 3.42, ones: [[.74, .82], [1.26, 1.76], [2.24, 2.4]],
    cues: [[0.0, 'vacuum-drone'], [0.62, 'flutter'], [0.76, 'thup-stuck'], [0.8, 'motor-strain'], [1.28, 'shloop'], [1.44, 'clunk-clunk'], [1.62, 'bag-inflate'], [2.26, 'burp'], [2.56, 'vacuum-drone']],
    setup(S) {
      const { U, G, c, W } = S;
      S.bv = c.x + c.w * .56;           // where the nozzle stops, under the cartoon's lower right
      S.bxT = t => {
        const sw = (a, b) => Math.sin((t - a) * Math.PI * 2 * 2.6) * U * .09 * Math.min(1, (t - a) * 4, (b - t) * 4);
        if (t < .62) return lerp(W + U * .25, S.bv, E.out(seg(t, 0, .62))) + (t < .58 ? sw(0, .62) : 0);
        if (t < 1.28) return S.bv + (t >= .96 && t < 1.24 ? Math.sin((t - .96) * Math.PI * 2 * 3.6) * U * .05 : 0);
        if (t < 2.56) return S.bv;
        return lerp(S.bv, -U * .6, E.in(seg(t, 2.56, 3.75)) * .5 + seg(t, 2.56, 3.75) * .5) + sw(2.56, 3.9) * .8;
      };
      S.N = [S.bv + U * .12, G - U * .01];
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      const bx = S.bxT(t), strain = t >= .78 && t < 1.28;
      const jx = strain ? (Math.floor(t * 24) % 2 ? 1 : -1) * U * .008 : t >= 2.24 && t < 2.32 ? -U * .02 : 0;
      const bag = t < 1.6 ? 0 : E.back(seg(t, 1.6, 1.74)), lump = t >= 1.42 && t < 1.62 ? lerp(.04, .3, seg(t, 1.42, 1.6)) : -1;
      const sqz = Dpulse(t, 2.24, 2.36);
      // the cartoon: flutters toward the nozzle, catches, holds, then goes in all at once
      const N = S.N;
      if (t >= .5 && t < .76) S.setCard({ px: c.w / 2, py: 0, kx: Math.sin(t * 60) * 1.6 * seg(t, .5, .7), sy: 1 + .01 * seg(t, .5, .74) });
      else if (t >= .76 && t < 1.28) { const k = E.out(seg(t, .76, .82)), tr = strain ? Math.sin(t * 90) * .6 : 0; S.setCard({ px: c.w / 2, py: 0, kx: 9 * k + tr, sy: 1 + .03 * k, rot: -1.2 * k }); }
      else if (t >= 1.28) {
        const k = seg(t, 1.28, 1.42), px = N[0] - c.x, py = N[1] - c.y;
        S.setCard({ px, py, sx: Math.max(0, 1 - E.in(k) * 1.05) * (1 - k * .3), sy: Math.max(0, 1 - E.in(k * k)), kx: 9 * (1 - k) + 20 * k, rot: -1.2 + k * 8, hide: k >= 1 });
      }
      // her: walks the vacuum in, braces while it strains, looks at the bag, looks at us, carries on
      const xh = bx + U * .58;
      let P;
      const base = { lean: -.2, face: -1, look: .1, brow: 0, hd: [0, 0], mouth: '' };
      if (t < .62 || t >= 2.56) {
        const x0 = t < .62 ? S.bxT(0) + U * .58 : S.bv + U * .58;
        P = walk(S, Object.assign({}, base), t, t < .62 ? 0 : 2.56, t < .62 ? .62 : 3.75, x0, t < .62 ? S.bv + U * .58 : -U * .3, { x: xh, carry: true, face: -1, lean: -.2, stride: .5 });
        P.face = -1;
      } else {
        P = Object.assign({}, base, { hip: [xh, G - U * .41], fL: [xh - U * .12, G], fR: [xh + U * .07, G] });
        if (strain) { P.lean = -.32; P.hip = [xh - U * .03, G - U * .38]; P.fL = [xh - U * .18, G]; P.brow = 1; P.mouth = 'flat'; }
        if (t >= 1.28 && t < 1.42) { P.lean = -.42; P.hip = [xh - U * .06, G - U * .37]; }
        if (t >= 1.42) { const k = Dk(t, 1.42, 1.56); P.lean = lerp(-.32, -.1, k); P.hip = [xh, G - U * .41]; }
        if (t >= 1.62 && t < 2.0) { P.look = -.9; P.face = -1; P.brow = 1; P.hd = [-U * .01, -U * .005]; }
        if (t >= 2.0 && t < 2.5) { P.face = lerp(-1, 0, Dk(t, 2.0, 2.12)); P.look = 0; P.brow = 0; P.mouth = 'flat'; P.lean = -.05; }
        if (t >= 2.24 && t < 2.5) { P.blink = t >= 2.28 && t < 2.34; }
        if (t >= 2.42) { P.face = lerp(0, -1, Dk(t, 2.42, 2.54)); P.mouth = ''; }
      }
      const V0 = DvacDraw(new Pen(p.b, U, S.seed), S, bx, { jx, bag, lump, squeeze: sqz });   // geometry only
      P.hR = V0.grip; P.hL = V0.grip2;
      shadow(p, P.hip[0], G, U * .18);
      shadow(p, bx + U * .14, G, U * .16);
      if (t >= .5 && t < .78) { p.g({ halo: false }); for (let i = 0; i < 3; i++) { const k = ((t * 4 + i / 3) % 1); p.line([[c.x + c.w * (.3 + i * .12) + k * U * .3, G - U * (.14 - k * .1)], [c.x + c.w * (.3 + i * .12) + k * U * .3 + U * .06, G - U * (.12 - k * .1)]], { w: .5, color: 'rgba(31,26,23,.5)' }); } }
      const J = figure(p, S, P, { hat: 'hair' });
      Dhat(p, P, J, 'curly');
      Dmouth(p, P, J, P.mouth);
      const V = DvacDraw(p, S, bx, { jx, bag, lump, squeeze: sqz });
      p.g(); [P.hR, P.hL].forEach(h => p.dot(h[0], h[1], U * .015));
      if (strain) { p.g({ halo: false }); const q = V.at(.5, -.08); for (let i = 0; i < 3; i++) p.line([[q[0] + U * (.03 + i * .02), q[1] - U * .05 * i], [q[0] + U * (.07 + i * .02), q[1] - U * .05 * i - U * .02]], { w: .55, color: 'rgba(31,26,23,.55)' }); }
      if (t >= 1.3 && t < 1.42) burst(p, V.nozzle, U * .05, U * .1, 5, -2.8, .7);
      if (t >= 1.66 && t < 1.8) burst(p, V.bagTop, U * .2, U * .27, 7, .2, .6);
      if (t >= 2.26) Dpuff(p, V.at(.66, .48)[0], V.at(.66, .48)[1], U * .1, seg(t, 2.26, 2.7));
    }
  };

  /* ═════════ D7. BLESS YOU — false alarm, no tissue, the cartoon will have to do ═════════ */
  GAGS.D_sneeze = {
    name: 'Bless You', dur: 4.0, lineAt: 3.62, ones: [[1.6, 2.1], [2.42, 2.95]],
    cues: [[0.05, 'footsteps'], [0.46, 'sniff'], [0.6, 'ah'], [0.86, 'ahh'], [1.1, 'silence'], [1.24, 'relieved-sigh'], [1.38, 'ah-'], [1.46, 'pocket-pat-pat'], [1.64, 'paper-rip'], [1.84, 'ahhh'], [1.98, 'CHOO'], [2.16, 'honk'], [2.32, 'honk'], [2.46, 'fold'], [2.6, 'fold'], [2.82, 'pocket-tuck'], [2.98, 'pat-pat'], [3.2, 'sniff']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .6; S.x0 = W + U * .5;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.trk = track([
        [.42, { hip: A(0, .415), lean: 0, face: -1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.1, .43), hR: A(.1, .43), blink: 0, mouth: '' }],
        [.46, { hd: [0, -U * .01] }],
        [.52, { hd: [0, 0] }],
        [.74, { lean: .24, hd: [U * .02, -U * .02], look: -.6, blink: 1, mouth: 'open', hL: A(-.16, .6), hR: A(.1, .58), hip: A(.01, .43) }],
        [.82, {}],
        [1.02, { lean: .42, hd: [U * .04, -U * .04], hip: A(.03, .46), fL: A(-.07, .04), fR: A(.07, .04), mouth: 'wide', hL: A(-.22, .8), hR: A(.2, .78) }],
        [1.14, {}],
        [1.28, { lean: 0, hd: [0, 0], hip: A(0, .415), fL: A(-.07, 0), fR: A(.07, 0), look: 0, blink: 0, mouth: 'flat', hL: A(-.1, .43), hR: A(.1, .43) }],
        [1.36, { face: -.4 }],
        [1.4, { hd: [U * .01, 0], mouth: 'open' }],
        [1.44, { face: -1, hd: [-U * .01, 0], hL: A(-.06, .4), hR: A(.08, .38), look: .3 }],
        [1.5, { hL: A(-.04, .5), hR: A(.1, .48) }],
        [1.56, { hL: A(-.06, .4), hR: A(.08, .38), face: .6 }],
        [1.62, { face: -1, look: -.3 }],
      ]);
    },
    pose(S, t) {
      const { U, G } = S, A = S.A;
      let P = S.trk(t);
      if (t < .42) P = walk(S, P, t, 0, .42, S.x0, S.xs, { face: -1 });
      if (t >= 1.62) {
        P = Object.assign({}, P, track([
          [1.62, { hip: A(0, .415), lean: 0, face: -1, look: -.3, hd: [0, 0], blink: 0, mouth: 'open', fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.28, .78), hR: A(-.2, .9) }],
          [1.78, { hL: A(-.3, .76), hR: A(-.2, .76), look: 0 }],
          [1.92, { lean: .22, hd: [U * .02, -U * .02], blink: 1, mouth: 'wide' }],
          [1.98, { lean: -.34, hd: [-U * .03, U * .02], hip: A(-.04, .4), fL: A(-.12, 0) }, 'out'],
          [2.1, { lean: -.18, hd: [-U * .01, U * .01] }],
          [2.16, { hd: [-U * .02, U * .01] }], [2.22, { hd: [-U * .005, 0] }], [2.32, { hd: [-U * .02, U * .01] }], [2.38, { hd: [0, 0] }],
          [2.46, { lean: -.05, blink: 0, mouth: 'flat', hip: A(0, .415), fL: A(-.07, 0), hL: A(-.24, .66), hR: A(-.14, .66), look: .4 }],
          [2.72, {}],
          [2.84, { hL: A(-.04, .64), hR: A(.0, .66), look: .6 }],
          [2.92, { hL: A(-.1, .43), hR: A(-.02, .62) }],
          [2.98, { hR: A(-.01, .58) }], [3.04, { hR: A(-.02, .62) }], [3.1, { hR: A(-.01, .58) }],
          [3.2, { hR: A(.1, .43), look: 0, hd: [0, -U * .01] }],
          [3.26, { hd: [0, 0] }],
          [3.4, { face: 0, mouth: 'flat' }],
        ])(t));
        P.armsFront = t >= 2.84 && t < 3.2;
      }
      return P;
    },
    draw(S, t, p) {
      const { U, G, c } = S;
      const P = this.pose(S, t), f = P.face || 0, J0 = Dhead(S, P);
      const pk = [lerp(J0.neck[0], J0.hip[0], .35) + f * U * .035, lerp(J0.neck[1], J0.hip[1], .35)];
      // the cartoon: off the wall, under his nose, CHOO, honk, fold, fold, into the pocket
      let held = false;
      if (t >= 1.64) {
        const hc = J0.hc, hr = J0.hr, face = [hc[0] + f * hr * .8, hc[1] + hr * 1.3], S0 = .105;
        const cc = [c.x + c.w / 2, c.y + c.h / 2];
        let q, s, sx = 1, sy = 1, rot = 0, kx = 0, hide = false;
        if (t < 1.8) { const k = E.io(seg(t, 1.64, 1.8)); q = mixPt(cc, face, k); s = lerp(1, S0, k); rot = -10 * Math.sin(k * Math.PI); }
        else if (t < 2.46) {
          q = face; s = S0;
          const ch = Dpulse(t, 1.97, 2.12), h1 = Dpulse(t, 2.14, 2.26), h2 = Dpulse(t, 2.3, 2.42);
          sx = 1 + ch * .4 - (h1 + h2) * .2; sy = 1 + ch * .3 + (h1 + h2) * .06; kx = -ch * 12; rot = -3 + ch * 5;
          q = [q[0] + f * ch * U * .05, q[1]];
        } else if (t < 2.84) {
          const at = [J0.neck[0] + f * U * .1, J0.neck[1] + U * .14];
          q = mixPt(face, at, Dk(t, 2.46, 2.56)); s = S0;
          sx = 1 - .5 * Dk(t, 2.46, 2.58, 'in'); sy = 1 - .5 * Dk(t, 2.6, 2.72, 'in');
          rot = Math.sin(seg(t, 2.46, 2.72) * Math.PI * 2) * 4;
        } else {
          const k = Dk(t, 2.84, 2.92); q = [pk[0], pk[1] - U * .03 * (1 - k)]; s = S0 * .5; sy = .5 * (1 - k * .8); hide = t >= 2.92;
        }
        if (t >= 1.72 && t < 2.84) { const hw = c.w * s * sx / 2; P.hL = [q[0] - hw, q[1] + U * .01]; P.hR = [q[0] + hw, q[1] + U * .015]; held = true; }
        S.setCard({ px: c.w / 2, py: c.h / 2, tx: q[0] - cc[0], ty: q[1] - cc[1], sx: s * sx, sy: s * sy, rot, kx, hide });
        DcardFront(S, t < 2.84);
      }
      shadow(p, P.hip[0], G, U * .19);
      const J = figure(p, S, P, { hat: null });
      const nk = J.neck;
      // the scarf, the hat, the face
      p.g(); p.shape([[nk[0] - U * .06, nk[1] - U * .02], [nk[0] + U * .06, nk[1] - U * .025], [nk[0] + U * .065, nk[1] + U * .035], [nk[0] - U * .065, nk[1] + U * .04]], { fill: '#fff', w: .9 });
      [-.03, 0, .03].forEach(o => p.line([[nk[0] + o * U, nk[1] - U * .02], [nk[0] + o * U, nk[1] + U * .035]], { w: .5, halo: false }));
      const fl = Math.sin(t * 9) * U * .015, tx0 = nk[0] - (Math.abs(f) > .3 ? Math.sign(f) : -1.2) * U * .045;
      p.shape([[tx0 - U * .02, nk[1] + U * .03], [tx0 + U * .02, nk[1] + U * .03], [tx0 + U * .03 - f * U * .02 + fl, nk[1] + U * .14], [tx0 - U * .01 - f * U * .02 + fl, nk[1] + U * .15]], { fill: '#fff', w: .8 });
      [-.005, .01, .025].forEach(o => p.line([[tx0 + o * U - f * U * .02 + fl, nk[1] + U * .145], [tx0 + o * U - f * U * .02 + fl * 1.3, nk[1] + U * .18]], { w: .45, halo: false }));
      Dhat(p, P, J, 'beanie');
      Dmouth(p, P, J, P.mouth);
      p.g(); p.line([[pk[0] - U * .03, pk[1]], [pk[0] + U * .03, pk[1]]], { w: .7, halo: false });
      // sneeze spray, honks
      Dfront(S, p, pf => {
        if (held) { pf.g(); [P.hL, P.hR].forEach(h => pf.dot(h[0], h[1], U * .02)); }
        if (t >= 1.98 && t < 2.14) burst(pf, [J.hc[0] + f * J.hr * 1.2, J.hc[1] + J.hr * 1.6], U * .14, U * .26, 9, 0, .8);
        if ((t >= 2.16 && t < 2.24) || (t >= 2.32 && t < 2.4)) burst(pf, [J.hc[0] + f * J.hr * 1.0, J.hc[1] + J.hr * 1.5], U * .12, U * .18, 5, Math.PI * .7, .6);
      });
    }
  };

  /* ═════════ D8. CATCH AND RELEASE — a long fight, a trophy photo, then it swims away ═════════ */
  GAGS.D_fish = {
    name: 'Catch and Release', dur: 4.1, lineAt: 3.76, ones: [[.5, .84], [1.76, 2.02], [2.26, 2.36]],
    cues: [[0.05, 'footsteps'], [0.42, 'rod-whip-back'], [0.56, 'cast-whizz'], [0.82, 'plink'], [0.92, 'tug'], [1.0, 'reel-loop'], [1.4, 'thrash'], [1.78, 'yank'], [1.94, 'catch-thump'], [2.28, 'camera-snap'], [2.6, 'set-down'], [2.76, 'splish'], [2.9, 'swim-wiggle'], [3.44, 'wave']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .84; S.x0 = W + U * .5;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.hook0 = [c.x + c.w * .1, c.y + c.h * .08];   // card-local-ish target: the top-left corner area
      S.trk = track([
        [.38, { hip: A(0, .415), lean: 0, face: -1, look: 0, brow: 0, hd: [0, 0], fL: A(-.08, 0), fR: A(.08, 0), rb: A(-.06, .5), ra: -.5, mouth: '' }],
        [.5, { rb: A(.02, .66), ra: -2.2, lean: .12, look: -.4 }, 'out'],
        [.6, { rb: A(-.14, .58), ra: -.42, lean: -.12, fL: A(-.16, 0) }, 'in'],
        [.84, {}],
        [.92, { rb: A(-.1, .58), ra: -.62, lean: -.04, look: -.3, mouth: 'grin' }],
        [1.0, { rb: A(.02, .56), ra: -1.05, lean: .22, hip: A(.04, .4), fL: A(-.18, 0), fR: A(.06, 0), brow: 1, mouth: 'flat' }],
        [1.76, { rb: A(.06, .54), ra: -1.15, lean: .32, hip: A(.08, .39), fL: A(-.14, 0), fR: A(.12, 0) }],
        [1.84, { rb: A(.12, .7), ra: -1.6, lean: .4 }, 'out'],
      ]);
    },
    draw(S, t, p) {
      const { U, G, c } = S, A = S.A;
      let P = S.trk(t);
      if (t < .38) { P = walk(S, P, t, 0, .38, S.x0, S.xs, { carry: true, face: -1 }); P.rb = [P.hip[0] - U * .06, G - U * .5]; P.ra = -.5; }
      const cc = [c.x + c.w / 2, c.y + c.h / 2];
      // the cartoon: hooked, thrashing, yanked into his arms, held up, set down, swims off
      let card = null, front = false;
      const hold = A(-.3, .4), trophy = A(0, .3), floor = A(-.28, .34), CS = .3;
      if (t >= .9 && t < 1.8) {
        const k = seg(t, 1.0, 1.8), thr = t < 1.0 ? Math.sin(seg(t, .9, 1.0) * Math.PI) * 3 : (Math.sin(t * 23) * 5 + Math.sin(t * 37) * 3) * (.5 + k);
        card = { px: c.w / 2, py: c.h, rot: thr + k * 7, tx: k * U * .22, ty: -Math.abs(Math.sin(t * 17)) * U * .03 * (k > .1 ? 1 : 0) };
      } else if (t >= 1.8 && t < 2.02) {
        const k = E.in(seg(t, 1.8, 1.98)), q = [lerp(cc[0] + U * .22, hold[0], k), lerp(cc[1], hold[1], k) - Math.sin(k * Math.PI) * U * .4];
        card = { px: c.w / 2, py: c.h / 2, tx: q[0] - cc[0], ty: q[1] - cc[1], sx: lerp(1, CS, k), sy: lerp(1, CS, k), rot: lerp(10, -10, k) };
        front = k > .5;
      } else if (t >= 2.02 && t < 2.76) {
        const k1 = Dk(t, 2.06, 2.18), k2 = Dk(t, 2.52, 2.72);
        let q = mixPt(hold, trophy, k1); q = mixPt(q, floor, k2);
        const wr = t < 2.18 ? Math.sin(t * 40) * 9 * (1 - k1) : t > 2.4 && t < 2.52 ? Math.sin(t * 40) * 6 : 0;
        card = { px: c.w / 2, py: c.h / 2, tx: q[0] - cc[0], ty: q[1] - cc[1], sx: CS, sy: CS, rot: lerp(-10, 0, k1), kx: wr };
        front = true;
      } else if (t >= 2.76) {
        const k = seg(t, 2.8, 3.45), x = lerp(floor[0], -c.w * .3, E.in(k) * .5 + k * .5), ph = (t - 2.76) * 7;
        card = { px: c.w / 2, py: c.h / 2, tx: x - cc[0], ty: floor[1] - cc[1] - Math.abs(Math.sin(ph * 1.5)) * U * .02, sx: CS, sy: CS, kx: Math.sin(ph * Math.PI) * 14, rot: Math.sin(ph * Math.PI + 1) * 3, hide: k >= 1 };
        front = true;
      }
      if (card) S.setCard(card);
      DcardFront(S, front);
      // his poses once it's in his arms
      if (t >= 1.84) {
        P = Object.assign({}, P, track([
          [1.84, { rb: A(.12, .7), ra: -1.6, lean: .4, hip: A(.08, .39), face: -1, look: -.2, brow: 1, mouth: 'flat', fL: A(-.14, 0), fR: A(.12, 0) }],
          [1.98, { lean: .05, hip: A(0, .415), fL: A(-.09, 0), fR: A(.09, 0), look: .3, brow: 0, mouth: 'grin' }, 'out'],
          [2.08, {}],
          [2.18, { face: 0, look: 0, lean: 0, mouth: 'grin' }],
          [2.5, {}],
          [2.6, { face: -1, hip: A(-.06, .3), lean: -.3, look: .7, fL: A(-.16, 0), fR: A(.06, 0), mouth: 'flat' }],
          [2.76, {}],
          [2.86, { look: .5 }],
          [3.2, { hip: A(0, .415), lean: 0, fL: A(-.08, 0), fR: A(.08, 0), look: .2 }],
          [3.5, { face: -.6 }],
          [3.62, { face: 0, look: 0 }],
        ])(t));
        const C = card && !card.hide ? [cc[0] + card.tx, cc[1] + card.ty] : null, hw = c.w * CS / 2;
        if (t < 2.82 && C) { P.hL = [C[0] - hw * (t < 2.18 ? .9 : .95), C[1] + U * .02]; P.hR = [C[0] + hw * (t < 2.18 ? .55 : .95), C[1] + U * .04]; }
        else if (t >= 3.3) { const w = Math.sin((t - 3.3) * 22) * U * .05; P.hL = A(-.1, .43); P.hR = t < 3.62 ? A(-.22 + w / U, .86) : A(.1, .43); }
        else { P.hL = A(-.2, .3); P.hR = A(-.05, .3); }
      }
      shadow(p, P.hip[0], G, U * .19);
      // the rod: in hand, then dropped on the floor once he grabs the catch
      const rodLen = U * 1.05;
      let rb = P.rb, ra = P.ra, bend = 0, tip;
      const fight = t >= .9 && t < 1.84;
      if (t >= 1.84) { const k = Dk(t, 1.84, 1.96, 'in'); rb = mixPt(P.rb || A(.12, .7), A(.32, .02), k); ra = lerp(-1.6, -.12, k); }
      if (fight) bend = U * (.12 + .05 * Math.sin(t * 23));
      const dv = [Math.cos(ra + Math.PI), Math.sin(ra + Math.PI)];   // pointing left, ra rotates it up
      const dir = [-Math.cos(ra), Math.sin(ra)];
      tip = [rb[0] + dir[0] * rodLen, rb[1] + dir[1] * rodLen];
      const nrm = [dir[1], -dir[0]];
      const mid = [lerp(rb[0], tip[0], .55) - nrm[0] * bend, lerp(rb[1], tip[1], .55) - nrm[1] * bend];
      if (bend) tip = [tip[0] - nrm[0] * bend * 1.4, tip[1] - nrm[1] * bend * 1.4 + bend * .5];
      if (t < 1.84) { P.hR = [rb[0] + dir[0] * U * .06, rb[1] + dir[1] * U * .06]; P.hL = [rb[0] + dir[0] * U * .3, rb[1] + dir[1] * U * .3]; }
      // the line: whips out to the corner, goes taut, gets reeled
      const hk = this.hookAt(S, t, tip, card, cc);
      const drawRod = () => {
        p.g(); p.line([rb, [lerp(rb[0], mid[0], .5), lerp(rb[1], mid[1], .5)], mid, tip], { w: .85, amp: .2 });
        const rl = [rb[0] + dir[0] * U * .13 - nrm[0] * U * .035, rb[1] + dir[1] * U * .13 - nrm[1] * U * .035];
        p.circ(rl[0], rl[1], U * .03, { fill: '#fff', w: .7, n: 8 });
        if (fight) { const a = t * 30; p.line([rl, [rl[0] + Math.cos(a) * U * .04, rl[1] + Math.sin(a) * U * .04]], { w: .7, halo: false }); }
      };
      if (hk) {
        p.g({ halo: false });
        const sag = hk.taut ? 0 : U * .25;
        p.line([tip, [lerp(tip[0], hk.p[0], .5), lerp(tip[1], hk.p[1], .5) + sag], hk.p], { w: .45, amp: .15, color: INK });
        p.g(); p.line([[hk.p[0], hk.p[1] - U * .02], [hk.p[0], hk.p[1] + U * .015], [hk.p[0] + U * .015, hk.p[1] + U * .02]], { w: .6, amp: .1 });
      }
      if (t >= 1.84) drawRod();
      const J = figure(p, S, P, {});
      Dhat(p, P, J, 'bucket');
      Dmouth(p, P, J, P.mouth);
      if (t < 1.84) drawRod();
      if (t >= .8 && t < .9) burst(p, hk ? hk.p : tip, U * .03, U * .07, 5, 0, .6);
      Dfront(S, p, pf => { if (front && t >= 1.9 && t < 2.8) { pf.g(); [P.hL, P.hR].forEach(h => pf.dot(h[0], h[1], U * .02)); } });
      // the trophy photo: a flash, and its little corner marks
      if (t >= 2.28 && t < 2.44) {
        const k = seg(t, 2.28, 2.44);
        p.g({ halo: false }); p.raw(`<rect x="0" y="0" width="${S.W}" height="${S.H}" fill="#fff" opacity="${(.85 * (1 - k)).toFixed(2)}"/>`);
      }
      // it swims away: little wakes behind it
      if (t >= 2.8 && card && !card.hide) {
        const x = cc[0] + card.tx + c.w * CS * .55, y = cc[1] + card.ty + c.h * CS * .4;
        p.g({ halo: false }); for (let i = 0; i < 3; i++) { const o = ((t * 3 + i / 3) % 1); p.line([[x + o * U * .3, y + i * 2], [x + o * U * .3 + U * .05, y + i * 2 - 2], [x + o * U * .3 + U * .1, y + i * 2]], { w: .5, color: `rgba(31,26,23,${(.5 * (1 - o)).toFixed(2)})` }); }
      }
    },
    hookAt(S, t, tip, card, cc) {
      const { U, c } = S, h0 = S.hook0;
      if (t < .56) return null;
      if (t < .82) { const k = seg(t, .56, .82); return { p: [lerp(tip[0], h0[0], E.out(k)), lerp(tip[1], h0[1], k) - Math.sin(k * Math.PI) * U * .5], taut: false }; }
      if (t < 1.8) {
        const q = card ? S.cardPt(h0[0] - c.x, h0[1] - c.y, card) : h0;
        return { p: q, taut: t >= .9 };
      }
      if (t < 1.84 && card) { return { p: S.cardPt(h0[0] - c.x, h0[1] - c.y, card), taut: true }; }
      return null;
    }
  };

  /* ═════════ D9. THE CALLED SHOT — points to the bleachers, bunts, runs all the bases anyway ═════════ */
  function DbatDraw(p, U, knob, ang, len) {
    const d = [Math.cos(ang), Math.sin(ang)], n = [-d[1], d[0]], L = (len || .62) * U;
    const at = (u, v) => [knob[0] + d[0] * u * L + n[0] * v * U, knob[1] + d[1] * u * L + n[1] * v * U];
    p.g(); p.shape([at(-.04, -.016), at(.4, -.014), at(.75, -.03), at(1, -.034), at(1.02, 0), at(1, .034), at(.75, .03), at(.4, .014), at(-.04, .016)], { fill: '#fff', w: .85, amp: .25 });
    p.line([at(-.05, -.03), at(-.05, .03)], { w: 1.4, halo: false });
    return at;
  }
  GAGS.D_bat = {
    name: 'The Called Shot', dur: 4.0, lineAt: 3.62, ones: [[1.64, 2.26], [3.1, 3.3]],
    cues: [[0.05, 'cleats'], [0.46, 'bat-tap'], [0.56, 'bat-tap'], [0.7, 'crowd-ooh'], [1.12, 'bat-waggle'], [1.52, 'crowd-hush'], [1.7, 'tik'], [1.8, 'bat-clatter'], [1.84, 'sprint-off'], [1.9, 'wobble'], [2.08, 'topple'], [2.24, 'plap'], [2.66, 'sprint-in'], [3.14, 'plate-stomp'], [3.24, 'crowd-roar']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .3; S.x0 = -U * .55;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      S.trk = track([
        [.4, { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.08, 0), fR: A(.08, 0), kn: A(.06, .6), ang: -2.25, h2: A(.0, .44), mouth: '' }],
        [.46, { kn: A(.12, .64), ang: 1.85, hip: A(0, .4), lean: .12, look: .5 }],
        [.5, { ang: 1.62 }],
        [.56, { ang: 1.88 }],
        [.62, { ang: 1.7 }],
        [.74, { kn: A(.18, .78), ang: -.62, lean: 0, hip: A(0, .43), look: -.6, brow: 1, fR: A(.12, 0) }, 'out'],
        [1.06, {}],
        [1.16, { kn: A(-.04, .68), ang: -1.95, hip: A(-.02, .385), fL: A(-.15, 0), fR: A(.13, 0), look: 0, lean: -.05 }],
        [1.24, { ang: -2.2 }], [1.32, { ang: -1.8 }], [1.4, { ang: -2.15 }],
        [1.48, { ang: -1.95 }],
        [1.6, { kn: A(.04, .46), ang: -.08, face: .5, lean: .04, h2: A(.22, .47), fL: A(-.1, 0), fR: A(.14, 0), hip: A(0, .37), brow: 0, look: .2, mouth: 'flat' }, 'out'],
        [1.68, {}],
        [1.71, { kn: A(.08, .46) }, 'out'],
        [1.76, { kn: A(.05, .46) }],
      ]);
      S.cardT = t => t < 1.72 ? null : t < 2.04 ? { px: c.w / 2, py: c.h, rot: Math.sin((t - 1.72) * Math.PI * 2 * 3.2) * 3.2 * (1 - seg(t, 1.72, 2.04) * .4) } : { px: c.w / 2, py: c.h, sy: Math.max(.02, 1 - E.in(seg(t, 2.04, 2.24))), rot: 1.5 * (1 - seg(t, 2.04, 2.24)), kx: -3 * seg(t, 2.04, 2.24), hide: t >= 2.26 };
    },
    draw(S, t, p) {
      const { U, G, c, W } = S, A = S.A, xs = S.xs;
      let P = S.trk(t), batFree = null;
      if (t < .4) { P = walk(S, P, t, 0, .4, S.x0, xs, { carry: true }); P.kn = [P.hip[0] + U * .06, G - U * .6]; P.ang = -2.25; P.h2 = [P.hip[0], G - U * .44]; }
      if (t >= 1.78) {   // drops the bat and sprints off; comes round from the other side; touches home; arms up
        if (t < 2.18) P = walk(S, Object.assign({}, P, { face: 1 }), t, 1.8, 2.18, xs, W + U * .7, { stride: 1.0, lift: .14, lean: .3, face: 1 });
        else if (t < 2.62) P = Object.assign({}, P, { hip: [W + U * 2, G - U * .4], fL: [W + U * 2, G], fR: [W + U * 2, G] });
        else if (t < 3.1) P = walk(S, Object.assign({}, P, { face: 1 }), t, 2.62, 3.1, -U * .7, xs, { stride: 1.0, lift: .14, lean: .26, face: 1, ease: true });
        else P = Object.assign({}, P, track([
          [3.1, { hip: A(0, .415), lean: .1, face: 1, look: 0, fL: A(-.08, 0), fR: A(.1, .08), hd: [0, 0], brow: 0 }],
          [3.16, { fR: A(.06, 0), hip: A(0, .4), lean: .04 }, 'in'],
          [3.24, { face: 0, hip: A(0, .43), lean: 0, fL: A(-.1, 0), fR: A(.1, 0), mouth: 'grin', look: -.2 }],
        ])(t));
        if (t >= 2.62 && t < 3.24) { P.mouth = ''; P.brow = 1; }
        if (t >= 3.24) { const k = Dk(t, 3.18, 3.3, 'out'), pump = Math.max(0, Math.sin((t - 3.3) * Math.PI * 2 * 2.4)) * U * .04 * (t > 3.3 && t < 3.75 ? 1 : 0); P.hL = mixPt(A(-.1, .43), A(-.2, 1.08 - pump / U), k); P.hR = mixPt(A(.1, .43), A(.2, 1.08 - pump / U), k); P.mouth = 'grin'; }
        // the dropped bat: falls, bounces once, lies by the plate
        const k = seg(t, 1.78, 2.0), b = seg(t, 2.0, 2.12);
        const kn = mixPt(S.trk(1.76).kn, A(.02, .03), E.in(k)), ang = lerp(-.08, .12, k) + Math.sin(b * Math.PI) * -.2;
        batFree = { kn: [kn[0], kn[1] - Math.sin(b * Math.PI) * U * .05], ang };
      }
      // the cartoon: the tap, the wobble, the topple
      const ct = S.cardT(t); if (ct) S.setCard(ct);
      // home plate
      p.g(); p.shape([[xs - U * .1, G - U * .012], [xs + U * .1, G - U * .012], [xs + U * .12, G + U * .004], [xs - U * .12, G + U * .004]], { fill: '#fff', w: .7, amp: .2 });
      if (t >= 2.22) Dpuff(p, c.x + c.w * .5, G - U * .02, U * .2, seg(t, 2.22, 2.6));
      if (t >= 1.82) Dpuff(p, xs + U * .1, G - U * .02, U * .1, seg(t, 1.82, 2.1));
      if (t >= 3.06) Dpuff(p, xs - U * .1, G - U * .02, U * .09, seg(t, 3.06, 3.3));
      shadow(p, P.hip[0], G, U * .19);
      const hand2 = P.h2;
      let at = null;
      if (!batFree) {
        if (t >= 1.5) { P.hL = P.kn; P.hR = mixPt(P.kn, hand2, Dk(t, 1.5, 1.6)); }
        else { P.hR = P.kn; P.hL = [P.kn[0] + Math.cos(P.ang) * U * .04, P.kn[1] + Math.sin(P.ang) * U * .04]; }
      } else if (t < 2.62 || t >= 3.24) { if (t < 3.18) { const sw = Math.sin((t - 1.8) * Math.PI * 2 * 2.6); P.hL = [P.hip[0] + sw * U * .15, P.hip[1] - U * .1]; P.hR = [P.hip[0] - sw * U * .15, P.hip[1] - U * .12]; } }
      else { const sw = Math.sin((t - 2.62) * Math.PI * 2 * 2.6); P.hL = [P.hip[0] + sw * U * .15, P.hip[1] - U * .1]; P.hR = [P.hip[0] - sw * U * .15, P.hip[1] - U * .12]; }
      const behind = !batFree && ((t >= .4 && t < .44) || (t >= 1.12 && t < 1.5) || t < .4);
      if (batFree) DbatDraw(p, U, batFree.kn, batFree.ang);
      if (behind && !batFree) at = DbatDraw(p, U, P.kn, P.ang);
      const J = figure(p, S, P, {});
      Dhat(p, P, J, 'helmet');
      Dmouth(p, P, J, P.mouth);
      if (!behind && !batFree) at = DbatDraw(p, U, P.kn, P.ang);
      if (!batFree && at) { p.g(); p.dot(P.hR[0], P.hR[1], U * .016); p.dot(P.hL[0], P.hL[1], U * .016); }
      if (t >= 1.7 && t < 1.8 && at) burst(p, at(1.04, 0), U * .03, U * .08, 6, 0, .7);
      // the called shot: a dotted look-line out to the bleachers
      if (t >= .8 && t < 1.08) { p.g({ halo: false }); const o = at(1.05, 0); for (let i = 1; i <= 4; i++) p.dot(o[0] + i * U * .12 * Math.cos(-.62), o[1] + i * U * .12 * Math.sin(-.62), 1.3, `rgba(31,26,23,${(.6 - i * .1).toFixed(2)})`); }
    }
  };

  /* ═════════ D10. THE LIFT — chalk, breath, everything he has; it weighs nothing ═════════ */
  GAGS.D_lift = {
    name: 'The Lift', dur: 3.8, lineAt: 3.44, ones: [[1.46, 1.8]],
    cues: [[0.05, 'heavy-steps'], [0.56, 'clap-chalk'], [0.7, 'thigh-slap'], [0.84, 'neck-crack'], [1.0, 'grunt-low'], [1.2, 'deep-inhale'], [1.48, 'HUP'], [1.5, 'whoosh-up'], [1.62, 'stumble'], [2.56, 'distant-ting'], [3.22, 'clap-chalk']],
    setup(S) {
      const { U, G, c, W } = S;
      const xs = S.xs = c.x + c.w * .5; S.x0 = -U * .6;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A;
      const gy = c.h - 2;   // grip on the bottom edge
      S.grip = [[xs - U * .17, c.y + gy], [xs + U * .17, c.y + gy]];
      S.trk = track([
        [.42, { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.1, 0), fR: A(.1, 0), hL: A(-.14, .42), hR: A(.14, .42), mouth: '' }],
        [.5, { face: 0, fL: A(-.13, 0), fR: A(.13, 0) }],
        [.54, { hL: A(-.05, .62), hR: A(.05, .62) }, 'in'],
        [.57, { hL: A(-.012, .62), hR: A(.012, .62) }, 'in'],
        [.64, { hL: A(-.07, .64), hR: A(.07, .64) }],
        [.7, { hL: A(-.14, .3), hR: A(.14, .3), hip: A(0, .39) }, 'in'],
        [.76, {}],
        [.84, { hd: [-U * .02, U * .01], hL: A(-.14, .42), hR: A(.14, .42), hip: A(0, .415) }],
        [.9, { hd: [U * .02, U * .01] }],
        [.96, { hd: [0, 0] }],
        [1.14, { hip: A(0, .22), fL: A(-.17, 0), fR: A(.17, 0), hL: S.grip[0], hR: S.grip[1], look: .3, brow: 1, mouth: 'flat' }],
        [1.2, { mouth: 'puff', look: 0 }],
        [1.44, { hip: A(0, .25) }],
        [1.5, { hip: A(0, .56), fL: A(-.15, .1), fR: A(.15, .1), hL: A(-.15, 1.12), hR: A(.15, 1.12), mouth: 'wide', look: -.3, brow: 1 }, 'out'],
        [1.58, { hip: A(-.04, .44), fL: A(-.16, .0), fR: A(.14, 0), hd: [0, U * .01] }, 'in'],
        [1.66, { hip: A(-.12, .4), fL: A(-.26, 0), lean: -.06, hL: A(-.25, 1.08), hR: A(.05, 1.12) }, 'out'],
        [1.74, { hip: A(-.1, .415), fL: A(-.24, 0), fR: A(.04, 0), lean: 0, hL: A(-.24, 1.12), hR: A(.04, 1.12), mouth: 'flat' }],
        [1.9, { look: -1, hd: [0, -U * .01] }],
        [2.3, {}],
        [2.42, { look: -1, hd: [0, -U * .02], brow: 0 }],
        [2.8, {}],
        [3.0, { hL: A(-.22, .42), hR: A(.02, .42), look: 0, hd: [0, 0], brow: 0 }],
        [3.12, { hL: A(-.12, .55), hR: A(-.04, .55) }],
        [3.18, { hL: A(-.07, .56), hR: A(-.13, .54) }],
        [3.24, { hL: A(-.13, .55), hR: A(-.06, .56) }],
        [3.34, { hL: A(-.22, .42), hR: A(.02, .42) }],
      ]);
    },
    draw(S, t, p) {
      const { U, G, c } = S, A = S.A;
      let P = S.trk(t);
      if (t < .42) P = walk(S, P, t, 0, .42, S.x0, S.xs, { spread: .1, stride: .5, lean: .02 }), P.hL = [P.hip[0] - U * .14, G - U * .42], P.hR = [P.hip[0] + U * .14, G - U * .42];
      if (t >= 1.2 && t < 1.46) { const j = Math.floor(t * 24) % 2 ? 1 : -1; P.hd = [j * U * .006, 0]; P.hL = [P.hL[0] + j, P.hL[1]]; P.hR = [P.hR[0] - j, P.hR[1]]; }
      // the cartoon: a tremble while he strains, then gone straight up
      if (t >= 1.2 && t < 1.48) S.setCard({ tx: (Math.floor(t * 24) % 2 ? .6 : -.6) * seg(t, 1.3, 1.46) });
      if (t >= 1.48) { const k = seg(t, 1.48, 1.7); S.setCard({ ty: -E.in(k) * (c.y + c.h + U * .8) - k * U * .3, sy: 1 + k * .25, sx: 1 - k * .08, hide: k >= 1 }); }
      shadow(p, P.hip[0], G, U * .23);
      if (t >= 1.48 && t < 1.74) { p.g({ halo: false }); for (let i = 0; i < 5; i++) { const x = c.x + c.w * (.1 + i * .2), y0 = G - U * (.2 + (i % 2) * .15) - seg(t, 1.48, 1.74) * U * .6; p.line([[x, y0], [x, y0 - U * .35]], { w: .7, color: 'rgba(31,26,23,.45)', amp: .2 }); } }
      Djersey(p, S, P, false);
      const J = figure(p, S, P, { belly: true, mustache: true });
      Dhat(p, P, J, 'band');
      Dmouth(p, P, J, P.mouth);
      // chalk: clap puff, and again brushing off at the end
      if (t >= .56 && t < 1.0) { const h = A(0, .6); Dpuff(p, h[0], h[1] + U * .04, U * .13, seg(t, .56, 1.0)); }
      if (t >= 3.14 && t < 3.6) { const h = mixPt(J.hL, J.hR, .5); Dpuff(p, h[0], h[1] + U * .06, U * .09, seg(t, 3.14, 3.6)); }
      // strain: sweat drops
      if (t >= 1.24 && t < 1.48) { p.g(); [[-1.4, -.5], [1.35, -.7]].forEach(([u, v], i) => { const k = ((t * 3 + i * .5) % 1); const q = [J.hc[0] + u * J.hr, J.hc[1] + v * J.hr + k * J.hr * .8]; p.shape([[q[0], q[1] - U * .025], [q[0] + U * .012, q[1]], [q[0], q[1] + U * .01], [q[0] - U * .012, q[1]]], { fill: '#fff', w: .6, amp: .1 }); }); }
      // the twinkle, very far up
      if (t >= 2.54 && t < 2.84) { const k = Dpulse(t, 2.54, 2.84), q = [S.xs + U * .5, c.y + U * .12]; star(p, q, U * .1 * k + 1, 4, .3); burst(p, q, U * .13 * k + 2, U * .2 * k + 3, 8, .2, .5); }
    }
  };

  /* ═════════ D11. THE KITE — finds the wind; the wind finds her ═════════ */
  GAGS.D_kite = {
    name: 'The Kite', dur: 4.0, lineAt: 3.62, ones: [[2.56, 3.2]],
    cues: [[0.05, 'footsteps'], [0.5, 'knot-tie'], [0.8, 'string-unspool'], [1.0, 'finger-lick'], [1.3, 'gust'], [1.36, 'paper-flutter-loop'], [2.14, 'delighted-hum'], [2.42, 'gust'], [2.56, 'tug'], [2.68, 'whee'], [3.24, 'hat-flutter'], [3.68, 'hat-land']],
    setup(S) {
      const { U, G, c, W } = S;
      S.att = [c.w * .34, c.h];   // where the string is tied (card-local)
      const ax = c.x + S.att[0];
      const xs = S.xs = ax - U * .2; S.x0 = -U * .55;
      const A = (dx, dy) => [xs + dx * U, G - dy * U];
      S.A = A; S.xb = xs - U * .26;
      const B = (dx, dy) => [S.xb + dx * U, G - dy * U];
      S.trk = track([
        [.4, { hip: A(0, .415), lean: 0, face: 1, look: 0, brow: 0, hd: [0, 0], fL: A(-.07, 0), fR: A(.07, 0), hL: A(-.08, .44), hR: A(.1, .44), mouth: '' }],
        [.5, { hip: A(.02, .26), lean: .3, fL: A(-.1, 0), fR: A(.14, 0), hL: [ax - U * .04, G - U * .06], hR: [ax + U * .02, G - U * .05], look: .6 }],
        [.56, { hR: [ax + U * .04, G - U * .08] }], [.62, { hR: [ax, G - U * .04] }], [.68, { hR: [ax + U * .04, G - U * .08] }],
        [.74, { hR: [ax + U * .01, G - U * .05] }],
        [.9, { hip: B(0, .415), lean: 0, fL: B(-.07, 0), fR: B(.07, 0), hL: B(-.06, .44), hR: B(.12, .48), look: 0 }],
        [1.0, { hL: B(.09, .72), look: .2 }],
        [1.06, {}],
        [1.18, { hL: B(-.02, 1.08), look: -.6, brow: 1 }, 'out'],
        [1.3, {}],
        [1.42, { look: -.7, hL: B(-.06, .44), brow: 0, mouth: 'open' }],
        [2.06, { hR: B(.2, .62), look: -.8, mouth: 'grin' }],
        [2.2, { hip: B(0, .45), fL: B(-.07, .04), fR: B(.07, .04) }, 'out'],
        [2.3, { hip: B(0, .415), fL: B(-.07, 0), fR: B(.07, 0) }, 'in'],
        [2.4, { hip: B(0, .45), fL: B(-.07, .04), fR: B(.07, .04) }, 'out'],
        [2.5, { hip: B(0, .415), fL: B(-.07, 0), fR: B(.07, 0) }, 'in'],
        [2.6, { hip: B(.12, .43), lean: -.25, hR: B(.36, .82), hL: B(.3, .74), fL: B(.0, 0), fR: B(.16, .03), mouth: 'open', brow: 1, look: -.6 }],
      ]);
    },
    kite(S, t) {   // card transform for the kite + its position
      const { U, c, W } = S, cc = [c.x + c.w / 2, c.y + c.h / 2];
      if (t < 1.32) return null;
      const K1 = [W * .7, c.y + U * .5];
      let K, s, rot;
      if (t < 2.1) { const k = E.io(seg(t, 1.32, 2.1)); K = [lerp(cc[0], K1[0], k), lerp(cc[1], K1[1], E.out(seg(t, 1.32, 2.1)))]; s = lerp(1, .34, E.out(seg(t, 1.32, 2.0))); rot = lerp(0, -18, k) + Math.sin(t * 7) * 6 * k; K[1] -= Math.sin(k * Math.PI) * U * .25; }
      else if (t < 2.56) { K = [K1[0] + Math.sin(t * 5) * U * .06, K1[1] + Math.cos(t * 6) * U * .04]; s = .34; rot = -18 + Math.sin(t * 7) * 7; }
      else { const k = E.in(seg(t, 2.56, 3.2)); K = [K1[0] + Math.sin(t * 5) * U * .06 + k * (W * .55), K1[1] - k * (c.y + U * 1.6)]; s = .34; rot = -18 + Math.sin(t * 9) * 9; }
      return { K, s, rot, x: { px: c.w / 2, py: c.h / 2, tx: K[0] - cc[0], ty: K[1] - cc[1], sx: s, sy: s, rot, kx: t < 2.1 ? Math.sin(t * 13) * 5 * (1 - seg(t, 1.32, 2.1)) : 0, hide: t >= 3.2 } };
    },
    draw(S, t, p) {
      const { U, G, c, W } = S;
      let P = S.trk(t);
      if (t < .4) { P = walk(S, P, t, 0, .4, S.x0, S.xs, {}); }
      const kt = this.kite(S, t);
      if (kt) S.setCard(kt.x);
      const attach = kt ? S.cardPt(S.att[0], S.att[1], kt.x) : [c.x + S.att[0], c.y + S.att[1]];
      // lifted off her feet and carried up and away
      if (t >= 2.6) {
        const k0 = S.trk(2.6), d0 = [k0.hR[0] - this.kite(S, 2.6).K[0], k0.hR[1] - this.kite(S, 2.6).K[1]];
        const lift = E.in(seg(t, 2.6, 2.74)) * U * .12, hand = t < 2.74 ? [k0.hR[0], k0.hR[1] - lift] : [kt ? kt.K[0] + d0[0] * .8 : W + U, kt ? kt.K[1] + d0[1] * .8 : -U];
        const sway = Math.sin(t * 9) * .15;
        P = Object.assign({}, k0, { lean: .25 + sway * .5, look: -.6, mouth: 'open', brow: 1 });
        P.hR = hand; P.hL = [hand[0] - U * .05, hand[1] + U * .06];
        P.hip = [hand[0] - U * .1, hand[1] + U * .58]; P.hip = [P.hip[0], Math.min(P.hip[1], G - U * .43 - (t < 2.74 ? lift : U * .12))];
        if (t >= 2.74) P.hip = [hand[0] - U * .16, hand[1] + U * .62];
        P.fL = [P.hip[0] - U * .08 + sway * U * .1, P.hip[1] + U * .44]; P.fR = [P.hip[0] + U * .04 - sway * U * .1, P.hip[1] + U * .45];
        P.fdir = [1, 1];
        if (t < 2.74) { P.fL = [P.fL[0], Math.min(G, P.fL[1])]; P.fR = [P.fR[0], Math.min(G, P.fR[1])]; }
      }
      // wind lines
      [[1.26, 1.7], [2.42, 2.9]].forEach(([a, b]) => { if (t >= a && t < b) { p.g({ halo: false }); for (let i = 0; i < 4; i++) { const k = seg(t, a + i * .05, b - .1 + i * .03), x = lerp(-U * .4, W + U * .4, k), y = c.y + c.h * (.25 + i * .16); if (k > 0 && k < 1) p.line([[x - U * .45, y + U * .02], [x - U * .3, y - U * .02], [x - U * .15, y + U * .015], [x, y - U * .01], [x + U * .08, y - U * .04], [x + U * .06, y - U * .07]], { w: .6, color: 'rgba(31,26,23,.45)', amp: .2 }); } } });
      // the string (a ball of it in her hand) and the kite's tail
      const hand = P.hR;
      const tied = t >= .62;
      if (tied && t < 3.3) {
        p.g({ halo: false });
        const sag = t < 1.32 ? U * .05 : t < 2.0 ? U * .02 : 0;
        p.line([attach, [lerp(attach[0], hand[0], .5), lerp(attach[1], hand[1], .5) + sag], hand], { w: .45, amp: .15 });
      }
      if (kt && !kt.x.hide) {
        const s = kt.s, tl = [];
        for (let i = 0; i <= 8; i++) tl.push([attach[0] - i * U * .07 * (s / .34) * .9 + Math.sin(t * 9 + i) * U * .015, attach[1] + i * U * .035 + Math.sin(t * 8 + i * 1.3) * U * .02]);
        p.g(); p.line(tl, { w: .5, amp: .2 });
        [3, 6].forEach(i => { const q = tl[i]; p.shape([[q[0] - U * .025, q[1] - U * .015], [q[0], q[1]], [q[0] - U * .025, q[1] + U * .015]], { fill: '#fff', w: .5, amp: .1 }); p.shape([[q[0] + U * .025, q[1] - U * .015], [q[0], q[1]], [q[0] + U * .025, q[1] + U * .015]], { fill: '#fff', w: .5, amp: .1 }); });
      }
      if (t < 3.3) {
        shadow(p, P.hip[0], G, U * .18, t >= 2.6 ? clamp(1 - seg(t, 2.6, 2.9), 0, 1) : 1);
        const J = figure(p, S, P, {});
        if (t < 2.86) Dhat(p, P, J, 'sunhat');
        Dmouth(p, P, J, P.mouth);
        if (t < 2.6 && !(t >= .44 && t < .74)) { p.g(); p.circ(P.hR[0], P.hR[1] + U * .02, U * .035, { fill: '#fff', w: .7, n: 8 }); p.line([[P.hR[0] - U * .025, P.hR[1] + U * .01], [P.hR[0] + U * .025, P.hR[1] + U * .03]], { w: .4, halo: false }); }
      }
      // her hat, left behind, drifting down like a leaf
      if (t >= 2.86) {
        const k = seg(t, 2.86, 3.72), x = lerp(W * .66, W * .44, k) + Math.sin(k * Math.PI * 3.2) * U * .25, y = lerp(-U * .1, G - U * .06, k < 1 ? k * (.7 + .3 * k) : 1);
        const a = Math.sin(k * Math.PI * 3.2) * .5 * (1 - k);
        const fake = { face: 0, tilt: a }, Jh = { hc: [x, y + U * .07], hr: U * .1 };
        Dhat(p, fake, Jh, 'sunhat');
      }
    }
  };

  /* ═════════ stage: overlay SVG with a pixel-matched proxy of the cartoon card ═════════ */
  function makeStage(container, opts) {
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    const W = container.clientWidth, H = container.clientHeight;
    const cr = container.getBoundingClientRect(), ox = cr.left + container.clientLeft, oy = cr.top + container.clientTop;
    const target = opts.target || null;
    let rect = opts.rect;
    if (!rect && target) { const r = target.getBoundingClientRect(); rect = { x: r.left - ox, y: r.top - oy, w: r.width, h: r.height }; }
    if (!rect) { const s = Math.min(W * .8, H * .55); rect = { x: (W - s) / 2, y: (H - s) / 2 - H * .04, w: s, h: s }; }
    let src = opts.src;
    if (!src && target) { const im = target.tagName === 'IMG' ? target : target.querySelector('img'); if (im) src = im.currentSrc || im.src; }
    const F = Object.assign({}, FRAME, opts.frame || {});
    const c = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    const id = 'ccm' + (++UID);
    const root = document.createElement('div');
    root.className = 'ccm-root';
    root.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:5;';
    const b = F.border, ip = b + F.pad;
    root.innerHTML =
      `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible" aria-hidden="true">` +
      `<defs></defs><g class="ccm-wrap"><g class="ccm-card"><g class="ccm-in">` +
      `<rect x="${F.shadow}" y="${F.shadow}" width="${c.w}" height="${c.h}" rx="${F.radius}" fill="${INK}"/>` +
      `<rect x="${b / 2}" y="${b / 2}" width="${c.w - b}" height="${c.h - b}" rx="${F.radius - b / 2}" fill="#fff" stroke="${INK}" stroke-width="${b}"/>` +
      `<g class="ccm-img">${src ? `<image x="${ip}" y="${ip}" width="${c.w - 2 * ip}" height="${c.h - 2 * ip}" preserveAspectRatio="xMidYMid slice" href="${src}"/>` : ''}</g>` +
      `<g class="ccm-over"></g></g></g></g><g class="ccm-figs"></g></svg>` +
      `<div class="ccm-line" style="position:absolute;left:${c.x}px;width:${c.w}px;top:${c.y + c.h * .4}px;text-align:center;font-family:'Libre Caslon Text',Georgia,'Times New Roman',serif;font-style:italic;font-size:${clamp(Math.round(c.w * .078), 18, 28)}px;color:${INK};opacity:0;transform:translateY(6px);transition:opacity .35s ease,transform .35s ease;"></div>`;
    container.appendChild(root);
    const q = s => root.querySelector(s);
    const U = clamp(c.h * 0.46, 64, 210);
    const S = {
      W, H, c, F, U, G: c.y + c.h + 5, id, src: src || '', root, target, seed: opts.seed != null ? opts.seed | 0 : 7,
      svg: q('svg'), defs: q('defs'), cardWrap: q('.ccm-wrap'), card: q('.ccm-card'), cardIn: q('.ccm-in'), img: q('.ccm-img'), over: q('.ccm-over'), figs: q('.ccm-figs'), lineEl: q('.ccm-line'),
    };
    const xf = o => {
      const { tx = 0, ty = 0, rot: r = 0, sx = 1, sy = 1, kx = 0, px = c.w / 2, py = c.h / 2 } = o;
      return { tx, ty, r, sx, sy, kx, px, py };
    };
    S.setCard = (o = {}) => {
      const X = xf(o);
      S.card.setAttribute('transform', `translate(${(c.x + X.tx + X.px).toFixed(2)} ${(c.y + X.ty + X.py).toFixed(2)}) rotate(${X.r.toFixed(2)}) skewX(${X.kx.toFixed(2)}) scale(${X.sx.toFixed(4)} ${X.sy.toFixed(4)}) translate(${(-X.px).toFixed(2)} ${(-X.py).toFixed(2)})`);
      S.card.setAttribute('opacity', o.op != null ? o.op : 1);
      S.card.style.display = o.hide ? 'none' : '';
    };
    S.cardPt = (lx, ly, o = {}) => {   // card-local point → stage point under transform o
      const X = xf(o); let x = (lx - X.px) * X.sx, y = (ly - X.py) * X.sy;
      x += Math.tan(X.kx * Math.PI / 180) * y;
      const p = rot([x, y], [0, 0], X.r * Math.PI / 180);
      return [p[0] + c.x + X.tx + X.px, p[1] + c.y + X.ty + X.py];
    };
    S.showLine = text => { if (!text) return; S.lineOn = true; S.lineEl.textContent = text; requestAnimationFrame(() => { S.lineEl.style.opacity = '1'; S.lineEl.style.transform = 'none'; }); };
    S.destroy = () => {
      cancelAnimationFrame(S.raf); clearTimeout(S.safety);
      if (root.parentNode) root.parentNode.removeChild(root);
      if (target && opts.restore) target.style.visibility = S.prevVis || '';
    };
    if (target) { S.prevVis = target.style.visibility; target.style.visibility = 'hidden'; }
    S.setCard({});
    return S;
  }

  function build(container, opts, kind) {
    const S = makeStage(container, opts), gag = GAGS[kind];
    S.kind = kind; S.gag = gag;
    if (gag.setup) gag.setup(S);
    S.render = (t, boil) => {
      S.setCard({});
      const p = new Pen(boil, S.U, S.seed);
      gag.draw(S, t, p);
      S.figs.innerHTML = p.svg();
    };
    return S;
  }
  const onesAt = (gag, t) => (gag.ones || []).some(([a, b]) => t >= a && t < b);
  const prefersReduced = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };

  function play(container, opts = {}) {
    const kind = GAGS[opts.kind] ? opts.kind : next();
    const reduce = opts.reducedMotion != null ? !!opts.reducedMotion : prefersReduced();
    const line = opts.line === undefined ? 'Mulligan.' : opts.line;
    const speed = opts.speed || 1;
    return new Promise(resolve => {
      let S;
      try { S = build(container, opts, kind); } catch (e) { console.error(e); resolve({ kind, error: e }); return; }
      const cue = n => { try { if (opts.onCue) opts.onCue(n, kind); } catch (e) {} };
      const finish = () => {
        if (S.done) return; S.done = true; cancelAnimationFrame(S.raf);
        S.root.style.transition = 'opacity .26s ease'; S.root.style.opacity = '0';
        setTimeout(() => { S.destroy(); resolve({ kind }); }, 280);
      };
      if (reduce) {   // no figures: the cartoon fades, the closing line shows
        S.render(0, 0); S.figs.innerHTML = '';
        S.card.style.transition = 'opacity .35s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => { S.card.style.opacity = '0'; }));
        cue('reduced');
        setTimeout(() => S.showLine(line), 260);
        S.safety = setTimeout(finish, line ? 1350 : 500);
        return;
      }
      const gag = S.gag, dur = gag.dur, lineAt = gag.lineAt != null ? gag.lineAt : dur - .35;
      const end = dur + (line ? .42 : .15);
      const cues = (gag.cues || []).slice().sort((a, b) => a[0] - b[0]);
      let ci = 0, t0 = null, lastKey = '';
      const tick = now => {
        if (S.done) return;
        if (t0 === null) t0 = now;
        const t = (now - t0) / 1000 * speed;
        const fps = onesAt(gag, t) ? 24 : 12;           // on twos; on ones for fast action
        const tq = Math.min(dur, Math.floor(t * fps) / fps);
        const boil = Math.floor(t * 12) % 3;            // the line keeps boiling through holds
        const key = tq + ':' + boil;
        if (key !== lastKey) { lastKey = key; try { S.render(tq, boil); } catch (e) { console.error(e); finish(); return; } }
        while (ci < cues.length && cues[ci][0] <= t) cue(cues[ci++][1]);
        if (line && t >= lineAt && !S.lineOn) S.showLine(line);
        if (t >= end) finish(); else S.raf = requestAnimationFrame(tick);
      };
      S.raf = requestAnimationFrame(tick);
      S.safety = setTimeout(finish, (end / speed + 2) * 1000);
    });
  }

  /* shuffle bag: all six before any repeats, never the same one twice running */
  let bag = [], last = null;
  function next() {
    if (!bag.length) {
      bag = Object.keys(GAGS);
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag[0] === last && bag.length > 1) { const j = 1 + Math.floor(Math.random() * (bag.length - 1)); [bag[0], bag[j]] = [bag[j], bag[0]]; }
    }
    last = bag.shift();
    return last;
  }
  function still(container, opts, t) {
    const kind = GAGS[opts.kind] ? opts.kind : 'golf';
    const S = build(container, opts, kind);
    S.render(t, Math.floor(t * 12) % 3);
    if (opts.line && t >= (S.gag.lineAt != null ? S.gag.lineAt : S.gag.dur - .35)) { S.lineEl.textContent = opts.line; S.lineEl.style.transition = 'none'; S.lineEl.style.opacity = '1'; S.lineEl.style.transform = 'none'; }
    return S;
  }
  const info = k => GAGS[k] && { kind: k, name: GAGS[k].name, dur: GAGS[k].dur, cues: GAGS[k].cues.map(c => c[1]) };
  return { play, next, still, info, kinds: Object.keys(GAGS) };
})();

window.CCMulligan = CCMulligan;
