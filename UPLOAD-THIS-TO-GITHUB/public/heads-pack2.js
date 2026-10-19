/* Closed Caption — BIG HEAD MODE, pack 2: eleven more crude cut-out-paper round-winner gags.
   Registers with window.ccHeads (heads.js). Acts, in order: Bobblehead, Pop Out of the Cake, Nature Documentary,
   The Crossword, The Coin, Piñata, Snowman, Jack-in-the-Box, Magic Carpet, Bigfoot Footage, Parade Float.
   (Nature Documentary, The Crossword and The Coin replaced Hula, Disco Inferno and The Mummy, Oct 2026.) */
(function () {
  'use strict';
  if (!window.ccHeads) return;
  var add = window.ccHeads.add;
  var INK = '#1F1A17';

  /* ── little helpers ── */
  function ink(w) { return 'stroke="' + INK + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  // an inline svg placed at the element's (0,0) by an anchor: bc bottom-centre, c centre, tl top-left, tc, br, bl
  function svgA(w, vb, inner, anchor, style) {
    var tr = { bc: 'translate(-50%,-100%)', c: 'translate(-50%,-50%)', tl: 'none', tc: 'translate(-50%,0)', br: 'translate(-100%,-100%)', bl: 'translate(0,-100%)' }[anchor || 'bc'];
    return '<svg viewBox="' + vb + '" width="' + w + '" style="position:absolute;left:0;top:0;display:block;overflow:visible;transform:' + tr + ';' + (style || '') + '" aria-hidden="true">' + inner + '</svg>';
  }
  function at(el, x, y, r, s) { el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + (r || 0) + 'deg) scale(' + (s == null ? 1 : s) + ')'; return el; }
  // linear lookup in a [[t, v], ...] table
  function lerp(tab, t) {
    if (t <= tab[0][0]) return tab[0][1];
    for (var i = 1; i < tab.length; i++) if (t <= tab[i][0]) { var a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * ((t - a[0]) / Math.max(1, b[0] - a[0])); }
    return tab[tab.length - 1][1];
  }
  // sample fn(t) → {x,y,r,s...} every `step` ms across the show (pair with {jerky: 1} for stop-motion)
  function sample(c, fn, step) { var pts = []; for (var t = 0; t <= c.DUR; t += (step || 80)) pts.push(Object.assign({ t: t }, fn(t))); return pts; }
  // show an element only inside the given [from, to] windows (animates its first child's opacity)
  function vis(c, el, ranges) {
    var D = c.DUR, kf = [{ opacity: 0, offset: 0 }];
    ranges.forEach(function (r) {
      var a = Math.max(0, Math.min(1, r[0] / D));
      kf.push({ opacity: 0, offset: a }, { opacity: 1, offset: a });
      if (r[1] != null && r[1] < D) { var b = Math.max(a, r[1] / D); kf.push({ opacity: 1, offset: b }, { opacity: 0, offset: b }); }
    });
    if (kf[kf.length - 1].offset < 1) kf.push({ opacity: kf[kf.length - 1].opacity, offset: 1 });
    c.anim(el.firstElementChild, kf, { dur: D });
  }
  // a crude jagged blob path centred on 0,0
  function blob(rnd, r, n) { var d = ''; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = r * (0.7 + rnd() * 0.45); d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1) + ' '; } return d + 'Z'; }
  // a spiky ring (fur, piñata fringe, sun rays)
  function spikes(cx, cy, r1, r2, n, cols) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a0 = i / n * Math.PI * 2, a1 = (i + 0.5) / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2;
      s += '<path d="M' + (cx + Math.cos(a0) * r1).toFixed(1) + ' ' + (cy + Math.sin(a0) * r1).toFixed(1) + ' L' + (cx + Math.cos(a1) * r2).toFixed(1) + ' ' + (cy + Math.sin(a1) * r2).toFixed(1) + ' L' + (cx + Math.cos(a2) * r1).toFixed(1) + ' ' + (cy + Math.sin(a2) * r1).toFixed(1) + ' L' + cx + ' ' + cy + ' Z" fill="' + cols[i % cols.length] + '" ' + ink(2.5) + '/>';
    }
    return s;
  }
  // a puppet (head on a paper body) as HTML, feet at (0,0). Like ctx.puppet, plus: hat (sits on the head),
  // over (drawn on top of the face box), behind (centred behind the head). Body is .bh-bd, head wrapper .bh-hd.
  function pupHtml(c, o) {
    o = o || {}; var px = o.px || 100, w = o.w || 110;
    var neck = Math.round(w * 160 / 148 * 0.25 + px * 0.12), hh = Math.round(px * 1.08);
    return '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">' +
      '<div class="bh-hd" style="position:relative;z-index:2;margin-bottom:' + (-neck) + 'px">' +
        (o.behind ? '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:-1">' + o.behind + '</div>' : '') +
        c.head(px) +
        (o.over ? '<div style="position:absolute;inset:0;z-index:6;pointer-events:none">' + o.over + '</div>' : '') +
        (o.hat ? '<div style="position:absolute;left:50%;bottom:' + (hh - (o.hatSink == null ? 10 : o.hatSink)) + 'px;transform:translateX(-50%);z-index:7">' + o.hat + '</div>' : '') +
      '</div>' +
      '<div class="bh-bd" style="position:relative;z-index:1">' + c.body(Object.assign({ shirt: c.color, w: w }, o)) + '</div></div>';
  }
  function pup(c, o) { return c.add(pupHtml(c, o), (o && o.z) || 20); }
  function heightOf(o) { var px = o.px || 100, w = o.w || 110; return Math.round(px * 1.08 + w * 160 / 148 - (w * 160 / 148 * 0.25 + px * 0.12)); }

  /* ════════ 1. Bobblehead ════════ */
  add({ name: 'Bobblehead', tag: 'Agrees with everything.', run: function (c) {
    var W = c.W, H = c.H;
    var dashY = Math.round(H * 0.56), hz = Math.round(dashY * 0.42);
    c.sky('#8FD3F4');
    c.add(svgA(W, '0 0 ' + W + ' ' + dashY,
      '<ellipse cx="' + (W * 0.2) + '" cy="' + hz + '" rx="' + (W * 0.42) + '" ry="62" fill="#4E9A3C" ' + ink(3) + '/>' +
      '<ellipse cx="' + (W * 0.85) + '" cy="' + hz + '" rx="' + (W * 0.36) + '" ry="44" fill="#5DAA44" ' + ink(3) + '/>' +
      '<rect x="-4" y="' + hz + '" width="' + (W + 8) + '" height="' + (dashY - hz + 4) + '" fill="#79C257" ' + ink(3) + '/>' +
      '<path d="M' + (W * 0.47) + ' ' + hz + ' H' + (W * 0.53) + ' L' + (W * 1.2) + ' ' + dashY + ' H' + (-W * 0.2) + ' Z" fill="#5c5c5c" ' + ink(3) + '/>' +
      '<circle cx="' + (W * 0.8) + '" cy="60" r="26" fill="#FFE04A" ' + ink(3) + '/>', 'tl'), 2);
    // lane dashes and trees rushing at us
    for (var i = 0; i < 4; i++) {
      var d = c.add('<div style="position:absolute;left:-5px;top:-12px;width:10px;height:24px;background:#FFE04A;border:2px solid ' + INK + '"></div>', 3);
      c.anim(d, [{ transform: 'translate(' + (W / 2) + 'px,' + (hz + 4) + 'px) scale(.15)' }, { transform: 'translate(' + (W / 2) + 'px,' + (dashY + 40) + 'px) scale(3)' }], { dur: 800, at: i * 200, iterations: 6, ease: 'steps(5,end)' });
    }
    [-1, 1].forEach(function (side, k) {
      var tr = c.add('<div style="position:absolute;left:0;top:0;line-height:1;transform:translate(-50%,-100%)">' + window.ccHeads.icon('🌲', 40) + '</div>', 3);
      c.anim(tr, [{ transform: 'translate(' + (W / 2 + side * W * 0.1) + 'px,' + (hz + 8) + 'px) scale(.3)' }, { transform: 'translate(' + (W / 2 + side * W * 0.85) + 'px,' + (dashY + 30) + 'px) scale(3.2)' }], { dur: 1000, at: k * 500, iterations: 5, ease: 'steps(6,end)' });
    });
    // windshield frame + mirror
    c.add(svgA(W, '0 0 ' + W + ' ' + dashY,
      '<path d="M-4 -4 H' + (W + 4) + ' V40 Q' + (W / 2) + ' 56 -4 40 Z" fill="#2b2b2b" ' + ink(3) + '/>' +
      '<path d="M-4 30 L34 34 L-4 ' + dashY + ' Z" fill="#2b2b2b" ' + ink(3) + '/>' +
      '<path d="M' + (W + 4) + ' 30 L' + (W - 34) + ' 34 L' + (W + 4) + ' ' + dashY + ' Z" fill="#2b2b2b" ' + ink(3) + '/>' +
      '<path d="M' + (W / 2) + ' 44 V58" ' + ink(5) + '/>' +
      '<rect x="' + (W / 2 - 54) + '" y="56" width="108" height="28" rx="9" fill="#8f9aa3" ' + ink(3) + '/>' +
      '<rect x="' + (W / 2 - 46) + '" y="62" width="92" height="16" rx="5" fill="#cfe6f2"/>', 'tl'), 5);
    var dice = c.add('<div style="position:absolute;left:0;top:0"><div style="position:absolute;left:-1px;top:0;width:3px;height:44px;background:' + INK + '"></div><div style="position:absolute;left:-24px;top:38px;line-height:1;white-space:nowrap;display:flex">' + window.ccHeads.icon('🎲', 22) + window.ccHeads.icon('🎲', 22) + '</div></div>', 5);
    // dashboard (z6), bobble body (z7) and head (z8)
    var dH = H - dashY + 30;
    var dash = c.add(svgA(W, '0 0 ' + W + ' ' + dH,
      '<path d="M-4 30 Q' + (W / 2) + ' -10 ' + (W + 4) + ' 30 V' + (dH + 4) + ' H-4 Z" fill="#5B4636" ' + ink(4) + '/>' +
      '<path d="M10 40 Q' + (W / 2) + ' 6 ' + (W - 10) + ' 40" fill="none" stroke="#7a5f49" stroke-width="6"/>' +
      '<circle cx="' + (W * 0.2) + '" cy="96" r="40" fill="#FFF8EA" ' + ink(4) + '/><path d="M' + (W * 0.2) + ' 96 L' + (W * 0.2 + 26) + ' 76" ' + ink(4) + ' stroke="#E8453A"/>' +
      '<text x="' + (W * 0.2) + '" y="124" text-anchor="middle" font-family="Arial Black,Arial" font-size="11" fill="' + INK + '">MPH-ISH</text>' +
      '<rect x="' + (W * 0.66) + '" y="80" width="' + (W * 0.28) + '" height="58" rx="8" fill="#4a382b" ' + ink(3) + '/>' +
      '<circle cx="' + (W * 0.12) + '" cy="300" r="120" fill="none" stroke="' + INK + '" stroke-width="32"/><circle cx="' + (W * 0.12) + '" cy="300" r="120" fill="none" stroke="#3a3a3a" stroke-width="24"/>', 'tl'), 6);
    var bx = Math.round(W * 0.6), baseY = dashY - 16;
    var bod = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">' +
      c.body({ w: 76, shirt: c.color, arms: 'down' }) + '<div style="width:96px;height:16px;margin-top:-6px;background:#222;border:3px solid ' + INK + ';border-radius:6px"></div></div>', 7);
    var hy = baseY - 72;
    var hd = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">' +
      '<div style="position:relative;z-index:2">' + c.head(118) + '</div>' +
      '<svg viewBox="0 0 30 52" width="30" style="display:block;margin-top:-10px;overflow:visible"><path d="M15 0 L3 6 L27 13 L3 20 L27 27 L3 34 L27 41 L15 52" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round"/><path d="M15 0 L3 6 L27 13 L3 20 L27 27 L3 34 L27 41 L15 52" fill="none" stroke="#C9CDD2" stroke-width="3.5" stroke-linejoin="round"/></svg></div>', 8);
    var bumps = [700, 1400, 1800, 2400];
    function off(t) {
      var o = 0;
      bumps.forEach(function (b) { if (t >= b && t < b + 60) o = -10 * (t - b) / 60; else if (t >= b + 60 && t < b + 160) o = -10 * (1 - (t - b - 60) / 100); });
      if (t >= 3200 && t < 3270) o = -30 * (t - 3200) / 70; else if (t >= 3270 && t < 3420) o = -30 + 36 * (t - 3270) / 150; else if (t >= 3420 && t < 3520) o = 6 * (1 - (t - 3420) / 100);
      return o;
    }
    var R = [[0, 0], [700, 0], [760, -20], [900, 24], [1040, -17], [1180, 11], [1320, -6], [1400, 4], [1460, -26], [1600, 30], [1740, -22], [1800, 10], [1860, -34], [2000, 30],
      [2140, -26], [2280, 18], [2400, -8], [2460, -34], [2600, 32], [2740, -24], [2880, 16], [3020, -9], [3150, 4], [3200, 0], [3300, 160], [3420, 300], [3560, 400], [3640, 380],
      [3760, 345], [3880, 372], [4000, 352], [4120, 366], [4240, 356], [4400, 375], [5200, 375]];
    var Y = [[0, 0], [1700, 0], [1780, 8], [1860, -6], [1940, 8], [2020, -6], [2100, 8], [2180, -6], [2260, 8], [2340, 0], [3200, 0], [3300, -100], [3420, -130], [3560, -30], [3640, 0], [5200, 0]];
    var SY = [[0, 1], [3560, 1], [3640, 0.84], [3760, 1.06], [3880, 1], [5200, 1]];
    c.path(dash, sample(c, function (t) { return { x: 0, y: dashY - 30 + off(t) }; }, 40), { jerky: 1 });
    c.path(bod, sample(c, function (t) { return { x: bx, y: baseY + off(t) }; }, 40), { jerky: 1 });
    c.path(hd, sample(c, function (t) { return { x: bx, y: hy + off(t) + lerp(Y, t), r: lerp(R, t), sy: lerp(SY, t) }; }, 80), { jerky: 1 });
    c.path(dice, sample(c, function (t) { return { x: W / 2 - 34, y: 70, r: lerp(R, t < 3200 ? t : 3150) * 0.6 + (t > 3200 && t < 3900 ? Math.sin(t / 60) * 30 : 0) }; }, 80), { jerky: 1 });
    var topY = hy - 172;
    c.say('Road trip!', bx, topY, 250, 1350, 50); c.talk(hd, 250, 1350);
    c.say('Yes. Yes. Yes.', bx, topY, 1700, 3000, 50); c.talk(hd, 1700, 3000);
    c.scream(hd, 3200, 3800);
    c.say('Ask me anything. …Yes.', bx, topY, 3950, 5150, 60); c.talk(hd, 3950, 4900);
    c.sfx(0, function () { noise(5, 0, 0.05, 180, 'lowpass'); tone(55, 5, 0, 'sawtooth', 0.02, 62); });
    bumps.forEach(function (b) { c.sfx(b, function () { tone(70, 0.12, 0, 'sine', 0.25, 40); tone(200, 0.25, 40, 'sine', 0.09, 620); }); c.shake(b, 160); });
    c.sfx(3200, function () { c.snd.boom(); [0, 150, 300].forEach(function (d, i) { tone(240 - i * 40, 0.25, d, 'sine', 0.12, 700 - i * 120); }); });
    c.shake(3200, 450); c.buzz(3200, [120, 40, 120]);
    c.sfx(4550, function () { tone(392, 0.16, 0, 'square', 0.05); tone(330, 0.28, 190, 'square', 0.05); });
  } });

  /* ════════ 2. Pop Out of the Cake ════════ */
  add({ name: 'Pop Out of the Cake', tag: 'Patience, rewarded.', run: function (c) {
    var W = c.W, H = c.H, x = W / 2, gy = H - 120;
    c.sky('linear-gradient(#FF9BC2,#FFD1E3)');
    var bun = '<path d="M-10 40 Q' + (W / 2) + ' 80 ' + (W + 10) + ' 40" fill="none" ' + ink(3) + '/>';
    for (var b = 0; b < 9; b++) { var bx0 = 10 + b * (W - 20) / 9, bxm = bx0 + (W - 20) / 18, yy = 40 + 40 * Math.sin(Math.PI * (bxm / W)) * 0.95; bun += '<path d="M' + bx0.toFixed(0) + ' ' + (yy - 3).toFixed(0) + ' L' + (bx0 + 34).toFixed(0) + ' ' + (yy - 3).toFixed(0) + ' L' + (bx0 + 17).toFixed(0) + ' ' + (yy + 30).toFixed(0) + ' Z" fill="' + ['#FFD23F', '#3FB8AF', '#5B3FB5', '#E8453A'][b % 4] + '" ' + ink(2.5) + '/>'; }
    c.add(svgA(W, '0 0 ' + W + ' 120', bun, 'tl'), 2);
    c.ground('#C98B5A', 120);
    var drip = function (x0, w, y) { var s = '<path d="M' + x0 + ' ' + y + ' H' + (x0 + w) + ' V' + (y + 16); for (var xx = x0 + w; xx > x0; xx -= 24) s += ' Q' + (xx - 6) + ' ' + (y + 36) + ' ' + (xx - 12) + ' ' + (y + 16) + ' Q' + (xx - 18) + ' ' + (y + 6) + ' ' + (xx - 24) + ' ' + (y + 16); return s + ' Z" fill="#FFF8EA" ' + ink(3) + '/>'; };
    var sprinkles = function (x0, w, y0, h) { var s = ''; for (var k = 0; k < 18; k++) s += '<rect x="' + (x0 + c.rnd() * w).toFixed(0) + '" y="' + (y0 + c.rnd() * h).toFixed(0) + '" width="9" height="4" rx="2" fill="' + ['#FFD23F', '#3FB8AF', '#5B3FB5', '#fff'][k % 4] + '" transform="rotate(' + ((c.rnd() - .5) * 90).toFixed(0) + ' ' + (x0 + w / 2) + ' ' + (y0 + h / 2) + ')"/>'; return s; };
    var cakeB = c.add(svgA(300, '0 0 300 150', '<rect x="6" y="10" width="288" height="136" rx="8" fill="#F77FAE" ' + ink(4) + '/>' + sprinkles(20, 260, 60, 70) + drip(6, 288, 10)), 20);
    var cakeT = c.add(svgA(200, '0 -46 200 160', '<rect x="8" y="10" width="184" height="100" rx="8" fill="#FFB3D1" ' + ink(4) + '/>' + sprinkles(20, 160, 50, 50) + drip(8, 184, 10) +
      [50, 100, 150].map(function (cx) { return '<rect x="' + (cx - 6) + '" y="-26" width="12" height="38" fill="#3FB8AF" ' + ink(3) + '/><path d="M' + cx + ' -46 Q' + (cx + 9) + ' -34 ' + cx + ' -28 Q' + (cx - 9) + ' -34 ' + cx + ' -46 Z" fill="#FFB12A" ' + ink(2.5) + '/>'; }).join('')), 21);
    var P = { px: 108, w: 110, arms: 'up' };
    var p = pup(c, Object.assign({ z: 18 }, P));
    var ph = heightOf(P);
    c.path(cakeB, sample(c, function (t) { var j = t < 1600 ? (Math.floor(t / 120) % 2 ? 1 : -1) : 0; return { x: x, y: gy, sx: 1 + j * 0.015, sy: 1 - j * 0.02 }; }, 120), { jerky: 1 });
    c.path(cakeT, [{ t: 0, x: x, y: gy - 136 }, { t: 300, x: x - 3, y: gy - 140, r: -2 }, { t: 600, x: x + 3, y: gy - 136, r: 2 }, { t: 900, x: x - 4, y: gy - 142, r: -3 }, { t: 1200, x: x + 4, y: gy - 136, r: 3 }, { t: 1450, x: x, y: gy - 144, r: -4 },
      { t: 1600, x: x, y: gy - 136 }, { t: 1720, x: x + 50, y: gy - 360, r: -40 }, { t: 2000, x: x + 170, y: -260, r: -200 }, { t: 3000, x: x, y: -260, r: 0 },
      { t: 3300, x: x + 4, y: gy - 120 - ph - 4, r: 8, e: 'steps(1,end)' }, { t: 3360, x: x + 4, y: gy - 120 - ph + 12, r: 8, sy: 0.9 }, { t: 3460, x: x + 4, y: gy - 120 - ph - 4, r: 8 }, { t: 5200, x: x + 4, y: gy - 120 - ph - 4, r: 8 }], { jerky: 3 });
    c.path(p, [{ t: 0, x: x, y: gy - 8 }, { t: 1599, x: x, y: gy - 8 }, { t: 1700, x: x, y: gy - 190 }, { t: 1820, x: x, y: gy - 110, sy: 0.92 }, { t: 1940, x: x, y: gy - 128 }, { t: 2060, x: x, y: gy - 120 },
      { t: 3300, x: x, y: gy - 120 }, { t: 3360, x: x, y: gy - 104, sy: 0.84, sx: 1.08 }, { t: 3460, x: x, y: gy - 120 }, { t: 3800, x: x, y: gy - 120, r: -3 }, { t: 4300, x: x, y: gy - 120, r: 3 }, { t: 4800, x: x, y: gy - 120, r: -2 }], { jerky: 2 });
    // frosting splats on the "camera"
    for (var s = 0; s < 6; s++) {
      var sx = (s % 2 ? W * 0.76 : 14) + c.rnd() * W * 0.2, sy = 110 + c.rnd() * (H * 0.5), sz = 20 + c.rnd() * 18;
      var sp = c.add(svgA(sz * 2.4, '-60 -60 120 120', '<path d="' + blob(c.rnd, 50, 11) + '" fill="#FFF8EA" ' + ink(4) + '/><circle cx="-14" cy="-14" r="8" fill="#fff"/>', 'c'), 35);
      c.path(sp, [{ t: 0, x: sx, y: sy, s: 0.1, o: 0 }, { t: 1700 + s * 40, x: sx, y: sy, s: 0.1, o: 0 }, { t: 1800 + s * 40, x: sx, y: sy, s: 1.15, o: 1 }, { t: 1880 + s * 40, x: sx, y: sy, s: 1 }, { t: 5200, x: sx, y: sy + 50, s: 1, sy: 1.15 }], { jerky: 3 });
    }
    c.say('(mmph) Is it time yet?', x, gy - 300, 300, 1450, 50);
    c.scream(p, 1650, 2100);
    c.burst(['🍰', '🎉', '💥', '🍦'], x, gy - 250, 18, 210, 1620, 1200, 60);
    c.say('I’ve been in there since Tuesday.', x, gy - 128 - ph, 2150, 3150, 50); c.talk(p, 2150, 3150);
    c.burst(['🍰', '☁️'], x, gy - ph - 140, 10, 120, 3300, 800, 20);
    c.say('Happy whatever-this-is.', x, gy - ph - 290, 3750, 5150, 50); c.talk(p, 3750, 4800);
    c.shake(1620, 450); c.shake(3300, 250);
    c.sfx(300, function () { tone(140, 0.25, 0, 'triangle', 0.06, 110); tone(130, 0.25, 520, 'triangle', 0.06, 100); });
    c.sfx(1620, function () { c.snd.pop(); c.snd.boom(); tone(500, 0.5, 60, 'sawtooth', 0.05, 900); });
    c.sfx(1700, c.snd.crowd);
    c.sfx(3300, c.snd.splat);
    c.buzz(1620, [80, 40, 160]);
  } });

  /* ════════ 16. Nature Documentary ════════
     Tall grass. The winner's head comes up out of it, looks around, goes down. The subtitles narrate. */
  add({ name: 'Nature Documentary', tag: 'Observed in its natural habitat.', run: function (c) {
    var W = c.W, H = c.H, gy = H - 150;
    c.sky('linear-gradient(#F6C77A,#F2E2B0 55%,#E9D08A)');
    // an acacia on the horizon: a flat-topped silhouette
    c.add(svgA(200, '0 0 200 160', '<path d="M100 160 V96 M100 118 L70 86 M100 108 L132 80" fill="none" stroke="#3A2F28" stroke-width="9" stroke-linecap="round"/><path d="M18 78 C40 58 160 56 184 76 C170 88 34 90 18 78 Z" fill="#3A2F28"/>', 'bl'), 2).style.transform = 'translate(' + (W - 190) + 'px,' + (gy - 30) + 'px)';
    c.add('<div style="width:56px;height:56px;border-radius:50%;background:#FFE59A;border:3px solid ' + INK + '"></div>', 1).style.transform = 'translate(46px,110px)';
    c.ground('#C9A24A', 150);
    var grass = function (z, y, col) {
      var d = ''; for (var i = 0; i < 26; i++) { var gx = i * (W + 40) / 25 - 20; d += '<path d="M' + gx + ' 60 L' + (gx + 6) + ' ' + (4 + (i * 37 % 20)) + ' L' + (gx + 14) + ' 60 Z" fill="' + col + '" ' + ink(2.5) + '/>'; }
      return at(c.add('<svg viewBox="0 0 ' + (W + 40) + ' 60" width="' + (W + 40) + '" style="display:block;overflow:visible">' + d + '</svg>', z), -20, y);
    };
    grass(4, gy - 70, '#B8922E');
    // the head: up, a look left, a look right, down; up again somewhere else; it stares at the camera
    var hd = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%)">' + c.head(96) + '</div>', 8);
    var x1 = W * 0.34, x2 = W * 0.62, up = gy - 92, dn = gy + 10;
    c.path(hd, [{ t: 0, x: x1, y: dn }, { t: 500, x: x1, y: dn }, { t: 800, x: x1, y: up }, { t: 1300, x: x1, y: up, r: -10 }, { t: 1800, x: x1, y: up, r: 10 }, { t: 2200, x: x1, y: up, r: 0 }, { t: 2500, x: x1, y: dn },
      { t: 2800, x: x2, y: dn }, { t: 3100, x: x2, y: up }, { t: 5200, x: x2, y: up }], { jerky: 2 });
    grass(12, gy - 40, '#D4AE48');
    c.sfx(800, function () { noise(0.25, 0, 0.08, 1500, 'bandpass'); });
    c.sfx(3100, function () { noise(0.25, 0, 0.08, 1500, 'bandpass'); });
    // the subtitles: a closed caption, of course
    var sub = function (txt, from, to) {
      var s = c.add('<div style="width:' + (W - 40) + 'px;text-align:center"><span style="display:inline-block;background:rgba(20,15,12,.82);color:#FFF8EA;padding:5px 10px;font-family:var(--serif,Georgia,serif);font-style:italic;font-size:16px;line-height:1.3">' + txt + '</span></div>', 40);
      c.path(s, [{ t: 0, x: 20, y: gy - 250, o: 0 }, { t: from - 1, x: 20, y: gy - 250, o: 0 }, { t: from, x: 20, y: gy - 250, o: 1 }, { t: to - 1, x: 20, y: gy - 250, o: 1 }, { t: to, x: 20, y: gy - 250, o: 0 }], { jerky: 1 });
    };
    sub('[Narrator] The round winner. Rarely seen this close.', 400, 2600);
    sub('[Narrator] It has noticed us.', 3200, 4300);
    c.sfx(400, function () { tone(196, 1.4, 0, 'sine', 0.025); tone(247, 1.4, 0, 'sine', 0.02); });
    c.say('Are you narrating me?', x2, up - 56, 4300, 5150, 50); c.talk(hd, 4300, 5000);
  } });

  /* ════════ 17. The Crossword ════════
     The newspaper puzzle. A pen fills in 1 Across, one letter at a time. Their photo sits beside it. */
  add({ name: 'The Crossword', tag: 'Finished it before you started.', run: function (c) {
    var W = c.W, H = c.H;
    c.sky('#D9D2C3');
    var pw = W - 30, ph = H - 190;
    var lines = ''; for (var i = 0; i < 26; i++) lines += '<i style="display:block;height:3px;margin:7px 0;background:#B9B0A2;width:' + (60 + (i * 37 % 40)) + '%"></i>';
    at(c.add('<div style="width:' + pw + 'px;height:' + ph + 'px;box-sizing:border-box;background:#F4F0E6;border:3px solid ' + INK + ';padding:14px;font-family:var(--serif,Georgia,serif);color:' + INK + '"><div style="font-size:22px;font-weight:700;border-bottom:3px double ' + INK + ';padding-bottom:6px">The Puzzle Page</div><div style="width:44%;margin-top:270px">' + lines + '</div></div>', 2), 15, 60);
    // the grid: 6 white squares across, black ones around them
    var cell = Math.min(40, Math.floor((pw - 60) / 7)), gx = 30, gy = 120, word = 'WINNER', grid = '';
    for (var r = 0; r < 3; r++) for (var k = 0; k < 7; k++) {
      var white = r === 1 ? k < 6 : (k % 2 === 0 && k < 6);
      grid += '<rect x="' + (k * cell) + '" y="' + (r * cell) + '" width="' + cell + '" height="' + cell + '" fill="' + (white ? '#fff' : INK) + '" stroke="' + INK + '" stroke-width="2"/>';
    }
    grid += '<text x="3" y="' + (cell + 11) + '" font-size="9" font-family="Georgia,serif" fill="' + INK + '">1</text>';
    at(c.add('<svg viewBox="0 0 ' + (7 * cell) + ' ' + (3 * cell) + '" width="' + (7 * cell) + '" style="display:block;overflow:visible">' + grid + '</svg>', 4), gx, gy);
    var clue = c.add('<div style="width:' + (pw - 40) + 'px;font-family:var(--serif,Georgia,serif);font-size:16px;color:' + INK + '"><b>Across</b><br><i>1. Insufferable, tonight (6)</i></div>', 4);
    at(clue, gx, gy + 3 * cell + 14);
    // their photo, halftone-ish, captioned
    var photo = c.add('<div style="position:absolute;left:-66px;top:0;width:132px;box-sizing:border-box;background:#fff;border:2px solid ' + INK + ';padding:6px;text-align:center"><div style="height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;filter:grayscale(1) contrast(1.25)">' + c.head(104) + '</div><div style="font-family:var(--serif,Georgia,serif);font-style:italic;font-size:12px;margin-top:4px;color:' + INK + '">Hint.</div></div>', 6);
    at(photo, W - 98, gy + 3 * cell + 70);
    // the pen writes the letters
    var pen = c.add(svgA(70, '0 0 100 100', '<path d="M30 74 L74 20 L84 28 L40 82 Z" fill="#2A2522" ' + ink(3.5) + '/><path d="M30 74 L20 92 L40 82 Z" fill="#FFD23F" ' + ink(3.5) + '/>', 'bl', 'transform:translate(-14px,-92%)'), 14);
    var pp = [{ t: 0, x: W + 80, y: gy - 60 }, { t: 600, x: W + 80, y: gy - 60 }, { t: 900, x: gx + cell * 0.5, y: gy + cell * 1.6 }];
    for (var L = 0; L < 6; L++) (function (L) {
      var t0 = 1000 + L * 380, lx = gx + L * cell + cell / 2, ly = gy + cell * 1.5;
      pp.push({ t: t0, x: lx, y: ly + 4 }, { t: t0 + 150, x: lx + 5, y: ly - 4 }, { t: t0 + 300, x: lx - 3, y: ly + 6 });
      var ch = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);font-family:var(--serif,Georgia,serif);font-size:' + Math.round(cell * 0.62) + 'px;color:#2E5EAA">' + word[L] + '</div>', 5);
      c.path(ch, [{ t: 0, x: lx, y: ly, o: 0 }, { t: t0 + 199, x: lx, y: ly, o: 0 }, { t: t0 + 200, x: lx, y: ly, o: 1 }], { jerky: 1 });
      c.sfx(t0, function () { noise(0.22, 0, 0.06, 4000, 'bandpass'); });
    })(L);
    pp.push({ t: 3500, x: W + 90, y: gy - 80 });
    c.path(pen, pp, { jerky: 1 });
    c.say('In pen.', W - 98, gy + 3 * cell + 70, 3900, 5150, 60); c.talk(photo, 3900, 4700);
  } });

  /* ════════ 18. The Coin ════════
     Their face on a coin, flicked onto the felt. It spins, wobbles, and lands the obvious way up. */
  add({ name: 'The Coin', tag: 'Legal tender at this table only.', run: function (c) {
    var W = c.W, H = c.H, x = W / 2, y = Math.round(H * 0.44);
    c.sky('radial-gradient(ellipse at 50% 45%,#2F7D5C,#174A36 75%)');
    var D2 = 200;
    var coin = c.add('<div style="position:absolute;left:' + (-D2 / 2) + 'px;top:' + (-D2 / 2) + 'px;width:' + D2 + 'px;height:' + D2 + 'px;border-radius:50%;box-sizing:border-box;background:radial-gradient(circle at 40% 35%,#FFE38A,#D4A017 70%);border:4px solid ' + INK + ';box-shadow:inset 0 0 0 9px #C99A08,inset 0 0 0 12px ' + INK + ';display:flex;align-items:center;justify-content:center;overflow:hidden">' +
      '<div style="filter:sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.05) contrast(1.1)">' + c.head(118) + '</div></div>', 10);
    var shadow = c.add('<div style="position:absolute;left:-80px;top:-14px;width:160px;height:28px;border-radius:50%;background:rgba(0,0,0,.35)"></div>', 5);
    at(shadow, x, y + D2 / 2 + 24);
    // the spin: scaleX through edge-on, fast and then slower; a wobble; flat, face up
    var pts = [{ t: 0, x: x, y: -200, sx: 0.2 }, { t: 400, x: x, y: y - 60, sx: -0.6 }], t = 400, k = 0, gap = 70;
    while (t < 3000) { t += gap; k++; pts.push({ t: t, x: x + (k % 2 ? 4 : -4), y: y, sx: k % 2 ? 0.08 : (k % 4 === 0 ? 1 : -1) }); gap = Math.min(220, gap * 1.12); }
    pts.push({ t: 3150, x: x, y: y, sx: 0.85, r: -6 }, { t: 3300, x: x, y: y, sx: 1, r: 4 }, { t: 3420, x: x, y: y, sx: 0.96, r: -2 }, { t: 3520, x: x, y: y, sx: 1, r: 0 });
    c.path(coin, pts, { jerky: false });
    c.sfx(400, function () { tone(2400, 0.15, 0, 'sine', 0.04); });
    c.sfx(500, function () { for (var i = 0; i < 10; i++) noise(0.03, i * (60 + i * 18), 0.08, 3500, 'bandpass'); });
    c.sfx(3300, function () { tone(1800, 0.7, 0, 'sine', 0.03, 1700); });
    c.say('Heads. Obviously.', x, y - D2 / 2 + 6, 3800, 5150, 50); c.talk(coin, 3800, 4700);
  } });

  /* ════════ 6. Piñata ════════ */
  add({ name: 'Piñata', tag: 'Took a beating. Still won.', run: function (c) {
    var W = c.W, H = c.H, x = W / 2, ropeL = 150, hpx = 128;
    c.sky('#FFD86B');
    var dots = ''; for (var d = 0; d < 40; d++) dots += '<rect x="' + (c.rnd() * W).toFixed(0) + '" y="' + (c.rnd() * H * 0.8).toFixed(0) + '" width="8" height="8" fill="' + ['#E8453A', '#3FB8AF', '#5B3FB5', '#fff'][d % 4] + '" transform="rotate(' + (c.rnd() * 90).toFixed(0) + ')" opacity=".55"/>';
    c.add(svgA(W, '0 0 ' + W + ' ' + H, dots, 'tl'), 1);
    c.ground('#3FB8AF', 130);
    var pal = ['#E8453A', '#FFD23F', '#3FB8AF', '#5B3FB5', '#FF6FA8', '#7BC043'];
    var fringe = svgA(250, '-125 -125 250 250', spikes(0, 0, 80, 122, 26, pal), 'c');
    var bits = svgA(220, '-110 -110 220 220', spikes(0, 0, 70, 92, 9, ['#E8453A', '#5B3FB5', '#FFD23F']), 'c');
    var tass = '<svg viewBox="0 0 120 70" width="120" style="display:block;margin-top:-14px;overflow:visible">' + [10, 30, 50, 70, 90, 110].map(function (tx, i) { return '<path d="M' + tx + ' 0 L' + (tx + 4) + ' 66" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/><path d="M' + tx + ' 0 L' + (tx + 4) + ' 66" stroke="' + pal[i] + '" stroke-width="6" stroke-linecap="round"/>'; }).join('') + '</svg>';
    var pin = c.add('<div style="position:absolute;left:0;top:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center">' +
      '<div style="width:6px;height:' + ropeL + 'px;background:#8B6B3E;border:2px solid ' + INK + '"></div>' +
      '<div style="position:relative;margin-top:-4px">' +
        '<div class="p2fr" style="position:absolute;left:50%;top:50%">' + fringe + '</div>' +
        '<div class="p2bits" style="position:absolute;left:50%;top:50%;opacity:0">' + bits + '</div>' +
        '<div style="position:relative">' + c.head(hpx) + '</div></div>' +
      '<div class="p2tas">' + tass + '</div></div>', 20);
    var fr = pin.querySelector('.p2fr'), bt = pin.querySelector('.p2bits'), ts = pin.querySelector('.p2tas');
    c.anim(fr, [{ opacity: 1 }, { opacity: 0 }], { dur: 1, at: 2800 });
    c.anim(ts, [{ opacity: 1 }, { opacity: 0 }], { dur: 1, at: 2800 });
    c.anim(bt, [{ opacity: 0 }, { opacity: 1 }], { dur: 1, at: 2800 });
    var hc = ropeL + hpx * 0.54; // head centre below the pivot
    var R = [[0, 3], [400, -3], [800, 2], [1100, 0], [1150, 0], [1230, -24], [1380, 15], [1530, -9], [1680, 5], [1820, 0], [1900, 0], [1980, -30], [2130, 19], [2280, -11], [2430, 6], [2560, 0],
      [2800, 0], [2880, -42], [3040, 30], [3200, -18], [3360, 11], [3520, -6], [3680, 3], [3900, -2], [4200, 2], [4500, -2], [4800, 2], [5200, 0]];
    c.path(pin, sample(c, function (t) { return { x: x, y: 0, r: lerp(R, t) }; }, 80), { jerky: 1 });
    var stick = c.add('<div style="position:absolute;left:0;top:0">' + svgA(300, '0 -14 300 28', '<rect x="0" y="-9" width="292" height="18" rx="8" fill="#B07A44" ' + ink(4) + '/><path d="M60 -9 L74 9 M120 -9 L134 9 M180 -9 L194 9 M240 -9 L254 9" stroke="#E8453A" stroke-width="5"/><circle cx="14" cy="0" r="17" fill="#F2C9A0" ' + ink(4) + '/>', 'tl', 'transform:translate(0,-50%)') + '</div>', 25);
    var sx0 = -30, sy0 = Math.round(H * 0.5);
    c.path(stick, [{ t: 0, x: -340, y: sy0, r: 0 }, { t: 700, x: sx0, y: sy0, r: 0 }, { t: 950, x: sx0, y: sy0, r: 28 }, { t: 1150, x: sx0, y: sy0, r: -40 }, { t: 1350, x: sx0, y: sy0, r: 18 },
      { t: 1700, x: sx0, y: sy0, r: 32 }, { t: 1900, x: sx0, y: sy0, r: -40 }, { t: 2100, x: sx0, y: sy0, r: 22 }, { t: 2550, x: sx0, y: sy0, r: 60 }, { t: 2800, x: sx0, y: sy0, r: -42 }, { t: 2920, x: sx0, y: sy0, r: -75 },
      { t: 3300, x: -360, y: sy0 + 40, r: -30 }], { jerky: 2 });
    var hy = hc, topY = hc - hpx * 0.56;
    c.say('Don’t you dare.', x, topY - 4, 250, 1050, 50); c.talk(pin, 250, 1050);
    c.scream(pin, 1150, 1450); c.scream(pin, 1900, 2250); c.scream(pin, 2800, 3400);
    c.burst(['🍬', '🍭', '🍫', '🍬', '🎉', '🍬'], x, hy, 34, 230, 2800, 1500, -120);
    c.burst(['✨', '🎊'], x, hy, 10, 160, 2820, 900, 40);
    for (var k = 0; k < 16; k++) {
      var cy0 = H - 150 - (k % 3) * 8, cx0 = 24 + c.rnd() * (W - 48);
      var cd = c.add('<div style="position:absolute;left:0;top:0;font-size:' + (22 + (k % 3) * 4) + 'px;line-height:1;transform:translate(-50%,-50%)">' + window.ccHeads.icon('🍬', 24) + '</div>', 12);
      c.path(cd, [{ t: 0, x: cx0, y: cy0 - 400, o: 0 }, { t: 3200 + k * 30, x: cx0, y: cy0 - 400, o: 0 }, { t: 3500 + k * 30, x: cx0, y: cy0, o: 1, r: (k % 2 ? 40 : -40) }, { t: 5200, x: cx0, y: cy0, r: (k % 2 ? 40 : -40) }], { jerky: 3 });
    }
    c.say('…worth it.', x, topY - 4, 3750, 5150, 50); c.talk(pin, 3750, 4600);
    [950, 1700, 2550].forEach(function (t) { c.sfx(t, c.snd.whoosh); });
    [1150, 1900].forEach(function (t) { c.sfx(t, function () { noise(0.08, 0, 0.6, 900, 'bandpass'); tone(150, 0.1, 0, 'square', 0.1, 80); }); c.shake(t, 180); c.buzz(t, 50); });
    c.sfx(2800, function () { c.snd.boom(); c.snd.pop(); for (var i = 0; i < 10; i++) tone(1500 + (i * 397) % 1400, 0.06, 200 + i * 70, 'sine', 0.05); });
    c.sfx(2950, c.snd.crowd);
    c.flash(2800); c.shake(2800, 500); c.buzz(2800, [150, 50, 150]);
  } });

  /* ════════ 7. Snowman ════════ */
  add({ name: 'Snowman', tag: 'Won. Melted. In that order.', run: function (c) {
    var W = c.W, H = c.H, gy = H - 128, x = W / 2;
    c.sky('linear-gradient(#9DB8D6,#DDE8F3)');
    var warm = c.add('<div style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;background:linear-gradient(#FFB347,#FFE08A)"></div>', 1);
    c.anim(warm.firstElementChild, [{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 0.85, offset: 0.7 }, { opacity: 0.85 }], { dur: c.DUR, ease: 'steps(6,end)' });
    c.ground('#F4F8FF', 128);
    for (var f = 0; f < 22; f++) {
      var fx = c.rnd() * W, fl = c.add('<div style="position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:#fff;border:1.5px solid #9DB8D6"></div>', 3);
      var dur = 1800 + c.rnd() * 1400;
      c.anim(fl, [{ transform: 'translate(' + fx.toFixed(0) + 'px,-20px)' }, { transform: 'translate(' + (fx + 30).toFixed(0) + 'px,' + (H - 120) + 'px)' }], { dur: dur, at: -c.rnd() * dur, iterations: 3, ease: 'steps(12,end)' });
      c.anim(fl, [{ opacity: 1 }, { opacity: 0 }], { dur: 300, at: 1500 });
    }
    var sun = c.add(svgA(150, '-75 -75 150 150', '<g class="p2rays" style="transform-origin:0px 0px">' + spikes(0, 0, 44, 72, 14, ['#FFB12A', '#FFD23F']) + '</g><circle r="46" fill="#FFE04A" ' + ink(4) + '/>' +
      '<rect x="-34" y="-14" width="28" height="16" rx="5" fill="' + INK + '"/><rect x="6" y="-14" width="28" height="16" rx="5" fill="' + INK + '"/><path d="M-6 -8 H6" ' + ink(3) + '/><path d="M-18 16 Q0 32 18 16" fill="none" ' + ink(4) + '/>', 'c'), 4);
    c.path(sun, [{ t: 0, x: W - 76, y: -110 }, { t: 1400, x: W - 76, y: -110 }, { t: 1800, x: W - 76, y: 140 }, { t: 1900, x: W - 76, y: 128, s: 1.1 }, { t: 2000, x: W - 76, y: 132 }], { jerky: 3 });
    c.anim(sun.querySelector('.p2rays'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { dur: 3000, at: 1800, iterations: 2, ease: 'steps(14,end)' });
    var snow = '<circle cx="100" cy="195" r="75" fill="#fff" ' + ink(5) + '/><circle cx="100" cy="85" r="58" fill="#fff" ' + ink(5) + '/>' +
      '<path d="M48 80 L4 40 M18 52 L6 60 M152 80 L196 44 M182 56 L194 64" stroke="#6B4423" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="100" cy="72" r="6" fill="' + INK + '"/><circle cx="100" cy="98" r="6" fill="' + INK + '"/><circle cx="100" cy="170" r="7" fill="' + INK + '"/><circle cx="100" cy="200" r="7" fill="' + INK + '"/>' +
      '<path d="M54 36 Q100 54 146 36 L146 52 Q100 70 54 52 Z" fill="' + c.color + '" ' + ink(4) + '/><path d="M128 50 L136 100 L118 98 L114 54 Z" fill="' + c.color + '" ' + ink(4) + '/>';
    var body = c.add(svgA(200, '0 0 200 270', snow), 10);
    var hat = '<svg viewBox="0 0 80 58" width="80" style="display:block;overflow:visible"><rect x="16" y="2" width="48" height="44" fill="' + INK + '"/><rect x="16" y="32" width="48" height="9" fill="#E8453A"/><rect x="2" y="44" width="76" height="11" rx="4" fill="' + INK + '"/></svg>';
    var hpx = 110;
    var hd = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center"><div style="position:relative;z-index:3;margin-bottom:-14px">' + hat + '</div><div style="position:relative;z-index:2">' + c.head(hpx) + '</div></div>', 12);
    var pud = c.add(svgA(260, '-130 -26 260 52', '<ellipse rx="126" ry="22" fill="#9AD3F5" ' + ink(4) + '/><ellipse cx="-40" cy="-6" rx="30" ry="5" fill="#fff" opacity=".7"/>', 'c'), 9);
    var SY = [[0, 1], [1900, 1], [2200, 0.92], [2500, 0.8], [2800, 0.66], [3100, 0.5], [3400, 0.36], [3700, 0.22], [4000, 0.1], [4200, 0.06], [5200, 0.06]];
    var SX = [[0, 1], [1900, 1], [2200, 1.04], [2500, 1.1], [2800, 1.18], [3100, 1.28], [3400, 1.4], [3700, 1.55], [4000, 1.75], [4200, 1.85], [5200, 1.85]];
    var HR = [[0, 0], [1900, 0], [2200, -4], [2500, 5], [2800, -6], [3100, 8], [3400, -10], [3700, 6], [4000, -14], [4200, -18], [5200, -18]];
    c.path(body, sample(c, function (t) { return { x: x, y: gy, sx: lerp(SX, t), sy: lerp(SY, t) }; }, 150), { jerky: 1 });
    c.path(hd, sample(c, function (t) { var w = t < 1600 ? (Math.floor(t / 400) % 2 ? 2 : -2) : 0; return { x: x, y: gy - 236 * lerp(SY, t) + 12, r: lerp(HR, t) + w }; }, 150), { jerky: 1 });
    c.path(pud, sample(c, function (t) { var k = Math.max(0, Math.min(1, (t - 2000) / 2200)); return { x: x, y: gy - 4, sx: Math.max(0.02, k * 1.35), sy: Math.max(0.02, k), o: t < 2000 ? 0 : 1 }; }, 150), { jerky: 1 });
    c.burst(['💧'], x, gy - 150, 6, 110, 2400, 900, -40);
    c.burst(['💧'], x, gy - 80, 6, 120, 3200, 900, -40);
    var top0 = gy - 236 - hpx * 1.08 - 48;
    c.say('Uh… is that the sun?', x, top0, 1850, 2850, 40); c.talk(hd, 1850, 2850);
    c.scream(hd, 2950, 3850);
    c.say('Still counts.', x, gy - hpx * 1.08 - 40, 4000, 5150, 50); c.talk(hd, 4000, 4800);
    c.sfx(0, function () { [1318, 1318, 1318, 1318, 1318, 1568, 1046, 1175, 1318].forEach(function (f, i) { tone(f, 0.12, i * 130, 'triangle', 0.04); }); });
    c.sfx(1600, function () { [523, 659, 784].forEach(function (f) { tone(f, 1.0, 0, 'sine', 0.05); }); });
    c.sfx(2000, function () { noise(2.3, 0, 0.1, 5000, 'highpass'); });
    c.sfx(2900, c.snd.fall);
    c.sfx(4200, function () { tone(900, 0.08, 0, 'sine', 0.1, 1700); tone(700, 0.08, 220, 'sine', 0.08, 1300); });
  } });

  /* ════════ 8. Jack-in-the-Box ════════ */
  add({ name: 'Jack-in-the-Box', tag: 'Sprang into first place.', run: function (c) {
    var W = c.W, H = c.H, gy = H - 125, x = W / 2;
    c.sky('repeating-linear-gradient(90deg,#A8D8C8 0 28px,#93C9B8 28px 56px)');
    c.ground('#B9824A', 125);
    var box = c.add(svgA(240, '0 0 240 240',
      '<path d="M10 50 L60 10 L230 10 L190 50 Z" fill="#2a1a10" ' + ink(4) + '/>' +
      '<path d="M190 50 L230 10 L230 190 L190 230 Z" fill="#B3263A" ' + ink(4) + '/>' +
      '<rect x="10" y="50" width="180" height="180" fill="#E8453A" ' + ink(4) + '/>' +
      '<path d="M100 82 L111 112 L143 112 L117 131 L127 162 L100 143 L73 162 L83 131 L57 112 L89 112 Z" fill="#FFD23F" ' + ink(3) + '/>' +
      '<circle cx="34" cy="74" r="7" fill="#3FB8AF"/><circle cx="166" cy="206" r="7" fill="#3FB8AF"/><circle cx="34" cy="206" r="7" fill="#5B3FB5"/><circle cx="166" cy="74" r="7" fill="#5B3FB5"/>'), 20);
    var lid = c.add(svgA(240, '0 0 240 60', '<path d="M10 50 L60 10 L230 10 L190 50 Z" fill="#FFD23F" ' + ink(4) + '/><path d="M70 30 H170" stroke="#E8453A" stroke-width="6"/>', 'c'), 22);
    var crank = c.add(svgA(70, '-35 -35 70 70', '<circle r="8" fill="#8A8F96" ' + ink(3) + '/><path d="M0 0 L0 -28" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M0 0 L0 -28" stroke="#C9CDD2" stroke-width="5" stroke-linecap="round"/><path d="M0 -28 L18 -28" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M0 -28 L18 -28" stroke="#E8453A" stroke-width="7" stroke-linecap="round"/>', 'c'), 23);
    var cx = x + 90, cy = gy - 120;
    c.anim(crank, [{ transform: 'translate(' + cx + 'px,' + cy + 'px) rotate(0deg)' }, { transform: 'translate(' + cx + 'px,' + cy + 'px) rotate(360deg)' }], { dur: 560, at: 200, iterations: 4.2, ease: 'steps(8,end)' });
    var shake = sample(c, function (t) { var j = t > 2200 && t < 2700 ? (Math.floor(t / 60) % 2 ? 3 : -3) : 0; return { x: x + j, y: gy, r: j * 0.4 }; }, 60);
    c.path(box, shake, { jerky: 1 });
    c.path(lid, [{ t: 0, x: x, y: gy - 210 }, { t: 2200, x: x, y: gy - 210 }, { t: 2300, x: x, y: gy - 214 }, { t: 2400, x: x, y: gy - 208 }, { t: 2500, x: x, y: gy - 216 }, { t: 2600, x: x, y: gy - 207 }, { t: 2700, x: x, y: gy - 212 },
      { t: 2800, x: x - 30, y: gy - 420, r: -60 }, { t: 3000, x: x - 110, y: gy - 470, r: -170 }, { t: 3300, x: x - 120, y: gy - 22, r: -350 }, { t: 3380, x: x - 124, y: gy - 34, r: -356 }, { t: 3450, x: x - 126, y: gy - 22, r: -360 }], { jerky: 2 });
    var coil = '<svg viewBox="0 0 60 170" width="60" style="display:block;margin-top:-8px;overflow:visible"><path d="M30 0' + (function () { var s = ''; for (var y = 10; y < 170; y += 14) s += ' L' + ((y / 14) % 2 < 1 ? 6 : 54) + ' ' + y; return s; })() + ' L30 170" fill="none" stroke="' + INK + '" stroke-width="10" stroke-linejoin="round"/><path d="M30 0' + (function () { var s = ''; for (var y = 10; y < 170; y += 14) s += ' L' + ((y / 14) % 2 < 1 ? 6 : 54) + ' ' + y; return s; })() + ' L30 170" fill="none" stroke="#C9CDD2" stroke-width="5" stroke-linejoin="round"/></svg>';
    var ruff = '<svg viewBox="0 0 160 40" width="160" style="display:block;margin-top:-22px;position:relative;z-index:3;overflow:visible">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<circle cx="' + (14 + i * 22) + '" cy="20" r="16" fill="' + (i % 2 ? '#fff' : c.color) + '" ' + ink(3) + '/>'; }).join('') + '</svg>';
    var cone = '<svg viewBox="0 0 60 70" width="60" style="display:block;margin-bottom:-16px;position:relative;z-index:3;overflow:visible"><path d="M30 6 L54 66 L6 66 Z" fill="#5B3FB5" ' + ink(4) + '/><circle cx="22" cy="44" r="4" fill="#FFD23F"/><circle cx="36" cy="30" r="4" fill="#FFD23F"/><circle cx="30" cy="6" r="8" fill="#FF6FA8" ' + ink(3) + '/></svg>';
    var jack = c.add('<div style="position:absolute;left:0;top:0"><div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">' + cone + '<div style="position:relative;z-index:2">' + c.head(110) + '</div>' + ruff + coil + '</div></div>', 15);
    vis(c, jack, [[2700]]);
    var J = [{ t: 0, x: x, y: gy - 205, sy: 0.2 }, { t: 2700, x: x, y: gy - 205, sy: 0.25 }, { t: 2780, x: x, y: gy - 205, sy: 1.32 }, { t: 2880, x: x, y: gy - 205, sy: 0.8 }, { t: 2980, x: x, y: gy - 205, sy: 1.14 }, { t: 3080, x: x, y: gy - 205, sy: 0.92 }, { t: 3180, x: x, y: gy - 205, sy: 1.04 }, { t: 3280, x: x, y: gy - 205 }];
    [16, -13, 10, -7, 5, -3, 0, 4, -4, 3].forEach(function (r, i) { J.push({ t: 3380 + i * 140 + (i > 6 ? (i - 6) * 160 : 0), x: x, y: gy - 205, r: r }); });
    c.path(jack, J, { jerky: 2 });
    var top = gy - 205 - 300;
    c.say('Hmm hmm hmmm…', x, gy - 250, 450, 1700, 50);
    c.say('Wait for it…', x, gy - 250, 1850, 2650, 50);
    c.burst(['🎉', '✨', '🎊'], x, gy - 220, 14, 170, 2700, 900, 60);
    c.say('Ta-da.', x, top, 2950, 3850, 50); c.talk(jack, 2950, 3850);
    c.say('Okay. How do I get back in?', x, top, 4000, 5150, 50); c.talk(jack, 4000, 4900);
    c.sfx(200, function () { [262, 262, 294, 294, 330, 392, 330, 262, 262, 262, 294, 294, 330, 262].forEach(function (f, i) { tone(f * 2, 0.14, i * 160, 'triangle', 0.07); tone(f * 4, 0.05, i * 160, 'sine', 0.025); }); });
    c.sfx(2700, function () { c.snd.pop(); noise(0.15, 0, 0.4, 2000, 'bandpass'); tone(160, 0.5, 40, 'sine', 0.16, 620); });
    [3380, 3660, 3940].forEach(function (t, i) { c.sfx(t, function () { tone(200 - i * 30, 0.2, 0, 'sine', 0.08 - i * 0.02, 420 - i * 60); }); });
    c.sfx(3300, function () { noise(0.1, 0, 0.3, 700, 'lowpass'); tone(500, 0.06, 0, 'square', 0.04); });
    c.shake(2700, 300); c.buzz(2700, [100, 40, 100]);
  } });

  /* ════════ 9. Magic Carpet ════════ */
  add({ name: 'Magic Carpet', tag: 'Flying high. Parking low.', run: function (c) {
    var W = c.W, H = c.H, roof = H - 330, pole = Math.round(W * 0.76), poleTop = 150;
    c.sky('linear-gradient(#FF9E5E,#FFD08A 60%,#FFE9B8)');
    var city = '';
    [[0, 110, 220], [100, 70, 160], [160, 90, 250], [240, 60, 120]].forEach(function (b) { city += '<rect x="' + b[0] + '" y="' + (H - b[2]) + '" width="' + b[1] + '" height="' + b[2] + '" fill="#7A4F9E" ' + ink(3) + '/>'; });
    city += '<rect x="' + (W * 0.6) + '" y="' + roof + '" width="' + (W * 0.42) + '" height="340" fill="#5B3F7E" ' + ink(4) + '/>';
    for (var wy = roof + 24; wy < H - 120; wy += 46) for (var wx = W * 0.6 + 16; wx < W - 10; wx += 36) city += '<rect x="' + wx.toFixed(0) + '" y="' + wy + '" width="18" height="24" fill="' + ((wx + wy) % 3 < 1 ? '#FFE04A' : '#3a2a5a') + '" ' + ink(2) + '/>';
    c.add(svgA(W, '0 0 ' + W + ' ' + H, city, 'tl'), 2);
    for (var cl = 0; cl < 3; cl++) {
      var cloud = c.add(svgA(120, '-60 -26 120 52', '<path d="M-50 20 Q-60 -4 -30 -6 Q-24 -26 0 -18 Q20 -30 34 -8 Q60 -6 50 20 Z" fill="#fff" ' + ink(3) + '/>', 'c'), 1);
      var cy0 = 120 + cl * 110, cx0 = (cl * 150 + 60) % W;
      c.path(cloud, [{ t: 0, x: cx0, y: cy0 }, { t: 5200, x: cx0 - 60, y: cy0 }], { jerky: 8 });
    }
    var poleEl = c.add(svgA(14, '0 0 14 ' + (roof - poleTop), '<rect x="2" y="0" width="10" height="' + (roof - poleTop) + '" fill="#C9CDD2" ' + ink(3) + '/><circle cx="7" cy="0" r="8" fill="#FFD23F" ' + ink(3) + '/>'), 6);
    c.path(poleEl, [{ t: 0, x: pole, y: roof }, { t: 2700, x: pole, y: roof }, { t: 2800, x: pole, y: roof, r: 2.5 }, { t: 2950, x: pole, y: roof, r: -2 }, { t: 3100, x: pole, y: roof, r: 1 }, { t: 3250, x: pole, y: roof, r: 0 }], { jerky: 2 });
    var flag = c.add('<div style="position:absolute;left:0;top:0">' + svgA(84, '0 0 84 54', '<path d="M0 2 Q42 -6 84 6 L84 50 Q42 40 0 48 Z" fill="' + c.color + '" ' + ink(3) + '/><text x="40" y="34" text-anchor="middle" font-family="Arial Black,Arial" font-size="18" fill="#fff" stroke="' + INK + '" stroke-width="1">#1</text>', 'tl', 'transform-origin:0 50%') + '</div>', 6);
    at(flag, pole + 9, poleTop + 6);
    c.anim(flag.querySelector('svg'), [{ transform: 'skewY(0deg) scaleX(1)' }, { transform: 'skewY(6deg) scaleX(.9)' }], { dur: 300, iterations: 17, direction: 'alternate', ease: 'steps(1,end)' });
    var rug = function (w) { return '<rect x="0" y="0" width="' + w + '" height="26" rx="4" fill="#B3263A" ' + ink(4) + '/><path d="M10 13 H' + (w - 10) + '" stroke="#FFD23F" stroke-width="4" stroke-dasharray="10 8"/>' + [0, 1, 2, 3, 4].map(function (i) { return '<path d="M-2 ' + (3 + i * 5) + ' h-10 M' + (w + 2) + ' ' + (3 + i * 5) + ' h10" stroke="#FFD23F" stroke-width="3"/>'; }).join(''); };
    var S = { px: 100, w: 110, legs: 'sit', arms: 'out' };
    var fly = c.add('<div style="position:absolute;left:0;top:0">' + pupHtml(c, S) + '<svg class="p2rug" viewBox="-12 0 244 26" width="230" style="position:absolute;left:-115px;top:-14px;overflow:visible">' + rug(220) + '</svg></div>', 20);
    c.anim(fly.querySelector('.p2rug'), [{ transform: 'skewX(10deg) scaleY(1)' }, { transform: 'skewX(-10deg) scaleY(.8)' }], { dur: 200, iterations: 14, direction: 'alternate', ease: 'steps(1,end)' });
    vis(c, fly, [[0, 2700]]);
    var ty = 420;
    c.path(fly, [{ t: 0, x: -170, y: 450, r: -6 }, { t: 600, x: 80, y: 410, r: 5 }, { t: 1100, x: 190, y: 470, r: -5 }, { t: 1500, x: 110, y: 500, r: 7 }, { t: 1900, x: 60, y: 430, r: -6 }, { t: 2300, x: 170, y: 400, r: 4 }, { t: 2700, x: pole - 40, y: ty, r: -2 }], { jerky: 2 });
    var roll = c.add(svgA(54, '-27 -60 54 120', '<rect x="-24" y="-56" width="48" height="112" rx="16" fill="#B3263A" ' + ink(4) + '/><path d="M-24 -36 L24 -20 M-24 -6 L24 10 M-24 24 L24 40" stroke="#FFD23F" stroke-width="5"/><path d="M-20 56 v12 M-8 56 v12 M4 56 v12 M16 56 v12" stroke="#FFD23F" stroke-width="3"/>', 'c'), 24);
    c.path(roll, [{ t: 0, x: pole + 7, y: ty, o: 0 }, { t: 2699, x: pole + 7, y: ty, o: 0 }, { t: 2700, x: pole + 7, y: ty, o: 1, s: 1.2 }, { t: 2800, x: pole + 7, y: ty, s: 1 }], { jerky: 2 });
    var U = { px: 100, w: 110, legs: 'stand', arms: 'up', z: 22 };
    var hang = pup(c, U), uh = heightOf(U);
    vis(c, hang, [[2700]]);
    var spin = [{ t: 0, x: pole + 7, y: ty }, { t: 2700, x: pole + 7, y: ty, r: 0 }];
    [90, 180, 270, 360, 450, 540, 565, 525, 550, 535, 542, 538, 541].forEach(function (r, i) { spin.push({ t: 2800 + i * 110, x: pole + 7, y: ty, r: r }); });
    c.path(hang, spin, { jerky: 1 });
    c.say('Look Ma, no seatbelt!', W * 0.42, 280, 300, 1700, 40); c.talk(fly, 300, 1700);
    c.say('Is that a flag—', W * 0.42, 300, 1900, 2650, 60); c.talk(fly, 1900, 2650);
    c.scream(hang, 2700, 3700);
    c.say('I’ll walk from here.', pole - 50, ty + uh * 0.35, 3850, 5150, 82); c.talk(hang, 3850, 4900);
    c.sfx(0, c.snd.whoosh); c.sfx(1200, c.snd.whoosh); c.sfx(2200, c.snd.whoosh);
    c.sfx(2700, function () { tone(1200, 0.6, 0, 'square', 0.05, 1150); tone(1750, 0.5, 0, 'triangle', 0.06, 1700); noise(0.12, 0, 0.4, 3000, 'bandpass'); });
    for (var sp = 0; sp < 5; sp++) c.sfx(2800 + sp * 110, function () { tone(500, 0.1, 0, 'sine', 0.05, 900); });
    c.sfx(3500, c.snd.boing);
    c.shake(2700, 400); c.buzz(2700, [140, 40, 80]);
  } });

  /* ════════ 10. Bigfoot Footage ════════ */
  add({ name: 'Bigfoot Footage', tag: 'Blurry. Hairy. Victorious.', run: function (c) {
    var W = c.W, H = c.H, gy = H - 150;
    c.sky('linear-gradient(#B9C7B0,#8FA383)');
    // a cheap noise tile, drawn once (no live SVG filters: phones must stay smooth)
    var noiseUrl = '';
    try { var cv = document.createElement('canvas'); cv.width = cv.height = 96; var cx2 = cv.getContext('2d'), im = cx2.createImageData(96, 96); for (var n = 0; n < im.data.length; n += 4) { var v = Math.floor(c.rnd() * 255); im.data[n] = im.data[n + 1] = im.data[n + 2] = v; im.data[n + 3] = 255; } cx2.putImageData(im, 0, 0); noiseUrl = cv.toDataURL(); } catch (e) {}
    var trees = function (n, y0, h0, col, z) {
      var s = ''; for (var i = 0; i < n; i++) { var tx = (i + 0.3 * c.rnd()) * W / (n - 1) - 20, th = h0 * (0.75 + c.rnd() * 0.5); s += '<rect x="' + (tx - 6).toFixed(0) + '" y="' + (y0 - 30) + '" width="12" height="34" fill="#4a3424"/><path d="M' + tx.toFixed(0) + ' ' + (y0 - th).toFixed(0) + ' L' + (tx + th * 0.32).toFixed(0) + ' ' + (y0 - 24) + ' L' + (tx - th * 0.32).toFixed(0) + ' ' + (y0 - 24) + ' Z" fill="' + col + '" ' + ink(3) + '/>'; }
      return c.add(svgA(W, '0 0 ' + W + ' ' + H, s, 'tl'), z);
    };
    trees(7, H * 0.52, 220, '#4F6B3A', 1);
    c.ground('#5E5A32', 260);
    trees(5, H * 0.66, 260, '#3B5A2A', 3);
    var fur = ''; [16, 34, 52, 70].forEach(function (yy) { fur += '<path d="M26 ' + yy + ' l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" fill="none" stroke="#3E2A16" stroke-width="3"/>'; });
    fur += '<path d="M30 100 l4 5 l4 -5 l4 5 M56 100 l4 5 l4 -5 l4 5" fill="none" stroke="#3E2A16" stroke-width="3"/>';
    var mane = svgA(150, '-95 -95 190 190', spikes(0, 0, 66, 92, 22, ['#6B4A2B', '#5A3D22']), 'c', 'position:relative');
    var B = { px: 96, w: 150, shirt: '#6B4A2B', pants: '#5A3D22', skin: '#4A3220', extra: fur, behind: mane, z: 20 };
    var wA = pup(c, Object.assign({}, B, { legs: 'run', arms: 'down' }));
    var wB = pup(c, Object.assign({}, B, { legs: 'stand', arms: 'down' }));
    var wv = pup(c, Object.assign({}, B, { legs: 'stand', arms: 'wave' }));
    var bh = heightOf(B);
    var ra = [], rb = [];
    function steps(from, to) { for (var t = from, k = 0; t < to; t += 220, k++) (k % 2 ? rb : ra).push([t, Math.min(to, t + 220)]); }
    steps(0, 2300); steps(3600, 4700);
    vis(c, wA, ra); vis(c, wB, rb); vis(c, wv, [[2300, 3600]]);
    var walkPts = sample(c, function (t) {
      var k = Math.floor(t / 220), bob = k % 2 ? -8 : 0, xx;
      if (t < 2300) xx = -110 + (W * 0.5 + 110) * (t / 2300); else if (t < 3600) xx = W * 0.5; else xx = W * 0.5 + (W * 0.5 + 160) * Math.min(1, (t - 3600) / 1100);
      return { x: xx, y: gy + bob, r: k % 2 ? 3 : -3 };
    }, 110);
    c.path(wA, walkPts, { jerky: 1 }); c.path(wB, walkPts, { jerky: 1 });
    c.path(wv, [{ t: 0, x: W * 0.5, y: gy }, { t: 2300, x: W * 0.5, y: gy, s: 1 }, { t: 2420, x: W * 0.5, y: gy + 10, s: 1.22 }, { t: 3600, x: W * 0.5, y: gy + 10, s: 1.22 }], { jerky: 2 });
    var wg = wv.querySelector('.bh-wave'); if (wg) c.anim(wg, [{ transform: 'rotate(-14deg)' }, { transform: 'rotate(14deg)' }], { dur: 200, at: 2400, iterations: 6, direction: 'alternate', ease: 'steps(1,end)' });
    c.add(svgA(W, '0 0 ' + W + ' ' + H, [[-30, 330], [W + 30, 360]].map(function (tr) { return '<rect x="' + (tr[0] - 8) + '" y="' + (H - 170) + '" width="16" height="40" fill="#4a3424"/><path d="M' + tr[0] + ' ' + (H - 140 - tr[1]) + ' L' + (tr[0] + 100) + ' ' + (H - 160) + ' L' + (tr[0] - 100) + ' ' + (H - 160) + ' Z" fill="#2E4A20" ' + ink(3) + '/>'; }).join(''), 'tl'), 25);
    // grain, scanlines, vignette, HUD
    var grain = c.add('<div style="position:absolute;left:-40px;top:-40px;width:' + (W + 80) + 'px;height:' + (H + 80) + 'px;opacity:.16;background:url(' + noiseUrl + ') repeat;background-size:96px 96px;image-rendering:pixelated"></div>', 46);
    c.add('<div style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;background:rgba(140,100,40,.28)"></div>', 45);
    c.anim(grain, [{ transform: 'translate(0,0)' }, { transform: 'translate(-17px,11px)' }, { transform: 'translate(9px,-14px)' }, { transform: 'translate(-6px,-5px)' }], { dur: 240, iterations: 22, ease: 'steps(4,end)' });
    c.add('<div style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 2px,transparent 2px 5px),radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6))"></div>', 47);
    var hud = 'font:700 16px/1 ui-monospace,Menlo,Consolas,monospace;color:#FFE9C0;text-shadow:2px 2px 0 #000;white-space:nowrap';
    var rec = c.add('<div style="' + hud + '"><span class="p2dot" style="color:#ff3b30">●</span> REC</div>', 48); at(rec, 16, 44);
    c.anim(rec.querySelector('.p2dot'), [{ opacity: 1 }, { opacity: 0 }], { dur: 400, iterations: 13, direction: 'alternate', ease: 'steps(1,end)' });
    var tape = c.add('<div style="' + hud + '">TAPE 03 · SP</div>', 48); at(tape, W - 140, 44);
    var ts = c.add('<div style="' + hud + '">OCT 18 1987  03:12:00 AM</div>', 48); at(ts, 16, H - 156);
    [1, 2, 3, 4, 5].forEach(function (s) { c.T(function () { ts.firstChild.textContent = 'OCT 18 1987  03:12:0' + s + ' AM'; }, s * 1000); });
    c.anim(c.stage, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(-3px,2px) rotate(.4deg)' }, { transform: 'translate(2px,-2px) rotate(-.3deg)' }, { transform: 'translate(0,0) rotate(0deg)' }], { dur: 700, iterations: 7, ease: 'steps(3,end)', fill: 'none' });
    var stat = c.add('<div style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;background:#888 url(' + noiseUrl + ') repeat;background-size:48px 48px;image-rendering:pixelated"></div>', 44);
    vis(c, stat, [[4750]]);
    var top = gy + 10 - bh * 1.22 - 4;
    c.say('Oh hey! Don’t post this.', W / 2, top, 2450, 3550, 50); c.talk(wv, 2450, 3550);
    c.say('We were never here.', W * 0.72, top + 40, 3650, 4600, 30); c.talk(wA, 3650, 4600); c.talk(wB, 3650, 4600);
    c.text('NO SIGNAL', W / 2, H * 0.42, 44, 4800, 0, 0);
    c.sfx(0, function () { noise(4.8, 0, 0.05, 600, 'bandpass'); tone(48, 4.7, 0, 'sawtooth', 0.012); });
    for (var f = 0; f < 10; f++) { var ft = f < 6 ? f * 440 : 3600 + (f - 6) * 300; c.sfx(ft, function () { noise(0.08, 0, 0.25, 300, 'lowpass'); tone(60, 0.1, 0, 'sine', 0.15, 40); }); }
    c.sfx(2300, function () { tone(1200, 0.04, 0, 'square', 0.03); tone(900, 0.06, 60, 'square', 0.03); });
    c.sfx(4750, function () { noise(0.45, 0, 0.35, 4000, 'highpass'); });
    c.buzz(2400, [40, 30, 40]);
  } });

  /* ════════ 11. Parade Float ════════ */
  add({ name: 'Parade Float', tag: 'Waved the whole way down.', run: function (c) {
    var W = c.W, H = c.H, gy = H - 125, side = H - 300;
    c.sky('#8ED1F2');
    c.add(svgA(W, '0 0 ' + W + ' ' + H, '<rect x="-4" y="' + (side - 80) + '" width="' + (W + 8) + '" height="90" fill="#D9D2C3" ' + ink(3) + '/>', 'tl'), 1);
    var skins = ['#F2C9A0', '#C68B59', '#8D5524', '#FFDBAC', '#E0AC69'], shirts = ['#E8453A', '#3FB8AF', '#5B3FB5', '#FFD23F', '#2E5EAA', '#7BC043', '#FF6FA8', '#E89A2A'];
    for (var p = 0; p < 8; p++) {
      var px = 22 + p * (W - 44) / 7;
      var fan = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center"><svg viewBox="0 0 40 40" width="38" style="display:block;margin-bottom:-12px;position:relative;z-index:2;overflow:visible"><circle cx="20" cy="20" r="18" fill="' + skins[p % 5] + '" ' + ink(3) + '/><circle cx="14" cy="18" r="2.5" fill="' + INK + '"/><circle cx="26" cy="18" r="2.5" fill="' + INK + '"/><path d="M13 27 Q20 32 27 27" fill="none" ' + ink(2.5) + '/></svg>' + c.body({ w: 50, shirt: shirts[p], pants: '#333', arms: p % 2 ? 'up' : 'wave', skin: skins[p % 5] }) + '</div>', 3);
      c.anim(fan, [{ transform: 'translate(' + px.toFixed(0) + 'px,' + side + 'px)' }, { transform: 'translate(' + px.toFixed(0) + 'px,' + (side - 10) + 'px)' }], { dur: 260 + (p % 3) * 40, iterations: 20, direction: 'alternate', ease: 'steps(1,end)' });
    }
    c.ground('#7D7D7D', 300);
    c.add(svgA(W, '0 0 ' + W + ' 20', '<path d="M0 10 H' + W + '" stroke="#FFD23F" stroke-width="6" stroke-dasharray="30 24"/>', 'tl'), 2).style.transform = 'translate(0,' + (gy + 40) + 'px)';
    var flower = function (fx, fy, r, col) { var s = ''; for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; s += '<circle cx="' + (fx + Math.cos(a) * r * 0.7).toFixed(1) + '" cy="' + (fy + Math.sin(a) * r * 0.7).toFixed(1) + '" r="' + (r * 0.55).toFixed(1) + '" fill="' + col + '" ' + ink(2) + '/>'; } return s + '<circle cx="' + fx + '" cy="' + fy + '" r="' + (r * 0.4).toFixed(1) + '" fill="#FFD23F" ' + ink(2) + '/>'; };
    var fl = '<circle cx="60" cy="112" r="20" fill="#333" ' + ink(4) + '/><rect x="0" y="10" width="300" height="14" fill="#fff" ' + ink(4) + '/><rect x="4" y="22" width="292" height="86" rx="6" fill="#F7A8C8" ' + ink(4) + '/>';
    for (var fr = 0; fr < 3; fr++) for (var fc = 0; fc < 9; fc++) fl += flower(20 + fc * 33 + (fr % 2) * 14, 40 + fr * 26, 12, ['#FF6FA8', '#fff', '#B65CFF', '#FF8A3D'][(fr + fc) % 4]);
    fl += '<circle cx="240" cy="112" r="20" fill="#333" ' + ink(4) + '/><circle cx="240" cy="112" r="6" fill="#999"/>';
    var flt = c.add('<div style="position:absolute;left:0;top:-132px;width:300px">' + svgA(300, '0 0 300 132', fl, 'tl', 'position:relative') + '</div>', 18);
    var wheel = c.add(svgA(44, '-22 -22 44 44', '<circle r="20" fill="#333" ' + ink(4) + '/><circle r="6" fill="#999"/><path d="M0 -20 V20 M-20 0 H20" stroke="#555" stroke-width="3"/>', 'c'), 19);
    var crown = '<svg viewBox="0 0 70 44" width="66" style="display:block;overflow:visible"><path d="M4 40 L8 8 L22 24 L35 2 L48 24 L62 8 L66 40 Z" fill="#FFD23F" ' + ink(4) + '/><circle cx="35" cy="30" r="5" fill="#E8453A" ' + ink(2) + '/></svg>';
    var Q = { px: 104, w: 110, arms: 'wave', shirt: c.color, extra: '<path d="M24 12 L76 86" stroke="#FFD23F" stroke-width="8"/>', hat: crown, hatSink: 12, z: 21 };
    var q = pup(c, Q), qh = heightOf(Q);
    var g = q.querySelector('.bh-wave'); if (g) c.anim(g, [{ transform: 'rotate(-10deg)' }, { transform: 'rotate(12deg)' }], { dur: 330, iterations: 15, direction: 'alternate', ease: 'steps(2,end)' });
    var fx0 = 45, deck = gy - 120;
    var fpts = [], qpts = [];
    [[0, -340], [300, -250], [600, -170], [900, -90], [1200, -20], [1500, fx0]].forEach(function (a, i) { fpts.push({ t: a[0], x: a[1], y: gy - (i % 2 ? 5 : 0) }); qpts.push({ t: a[0], x: a[1] + 150, y: deck - (i % 2 ? 5 : 0) }); });
    for (var t = 1700; t <= 2800; t += 220) { var k = (t / 220) % 2 < 1; fpts.push({ t: t, x: fx0, y: gy - (k ? 4 : 0) }); qpts.push({ t: t, x: fx0 + 150, y: deck - (k ? 4 : 0), r: k ? -3 : 3 }); }
    fpts.push({ t: 2900, x: fx0, y: gy }, { t: 3000, x: fx0, y: gy + 6, r: -5 }, { t: 3100, x: fx0, y: gy + 4, r: -2 }, { t: 3220, x: fx0, y: gy, r: -16 }, { t: 3330, x: fx0, y: gy, r: -40 }, { t: 3420, x: fx0, y: gy, r: -76 }, { t: 3500, x: fx0, y: gy, r: -68 }, { t: 3580, x: fx0, y: gy, r: -74 });
    qpts.push({ t: 2900, x: fx0 + 150, y: deck }, { t: 3000, x: fx0 + 148, y: deck + 10, r: -5 }, { t: 3100, x: fx0 + 150, y: deck + 6, r: -2 }, { t: 3220, x: 220, y: deck - 120, r: 40 }, { t: 3350, x: 270, y: deck - 230, r: 130 }, { t: 3500, x: 300, y: gy - 150, r: 220 }, { t: 3620, x: 300, y: gy - 60, r: 276 }, { t: 3700, x: 300, y: gy - 66, r: 272 }, { t: 3780, x: 300, y: gy - 60, r: 276 });
    c.path(flt, fpts, { jerky: 2 }); c.path(q, qpts, { jerky: 2 });
    c.path(wheel, [{ t: 0, x: -400, y: gy - 20, o: 0 }, { t: 2950, x: fx0 + 60, y: gy - 20, o: 0 }, { t: 2960, x: fx0 + 60, y: gy - 20, o: 1 }, { t: 3200, x: fx0 + 10, y: gy - 60, r: -200 }, { t: 3500, x: -30, y: gy - 20, r: -500 }, { t: 3800, x: -80, y: gy - 20, r: -700 }], { jerky: 2 });
    var top = deck - qh - 40;
    c.say('Thank you, my adoring public.', W / 2, top, 1300, 2500, 50); c.talk(q, 1300, 2500);
    [2400, 2650, 2900].forEach(function (t, i) { c.burst(['🍬', '🍭', '🌸'], W / 2 + 60, top + 30, 7, 170, t, 900, 120); });
    c.burst(['🌸', '🌼', '💥', '🌺'], W * 0.3, gy - 120, 18, 200, 3420, 1100, 60);
    c.scream(q, 3200, 3800);
    c.say('Still waving!', 130, gy - 130, 3950, 5150, 30); c.talk(q, 3950, 4800);
    c.sfx(0, function () { for (var k = 0; k < 10; k++) { noise(0.05, k * 290, 0.18, 2500, 'bandpass'); if (k % 2 === 0) tone(98, 0.22, k * 290, 'triangle', 0.12); else tone(131, 0.22, k * 290, 'triangle', 0.1); } });
    c.sfx(1500, c.snd.fanfare);
    c.sfx(2400, c.snd.crowd);
    c.sfx(2950, c.snd.boing);
    c.sfx(3420, function () { c.snd.boom(); noise(0.4, 100, 0.3, 1500, 'bandpass'); });
    c.sfx(3700, function () { tone(260, 0.9, 0, 'sine', 0.06, 190); noise(0.9, 0, 0.1, 700, 'bandpass'); });
    c.shake(3420, 450); c.buzz(3420, [160, 40, 120]);
  } });
})();
