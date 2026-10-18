/* ═══════════════════════════════════════════════════════════
   Closed Caption — MULLIGAN executions (fx.js)
   Self-contained. No images, no libraries, no network.

   window.Executions.play(kind, imageSrc, stage) -> ms until the main hit is done
   kinds: punch, tear, fire, flush, stomp, shred (unknown -> random)

   Uses host globals when present: tone(), noise(), buzz(), soundEnabled(),
   window._gameAudio (AudioContext). Everything is try/catch guarded.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Reduce Motion, for every script-driven moment in the app (heists, the steal, face gags, confetti,
     flashes, the Poobah, the framing, the press show). One check, read live — so flipping the phone's
     setting mid-game takes effect at the next moment. CSS animations are already calmed by the
     media query in index.html; Web Animations and canvas confetti are not, so they ask this. */
  window.ccReducedMotion = function () {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };

  var INK = '#1F1A17', YELLOW = '#FFD23F', RED = '#E8453A', BLUE = '#2F6FE0', PAPER = '#FFF8EA';
  var DISPLAY = "'Fredoka','Nunito',system-ui,sans-serif";
  var EMOJI = "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  var KINDS = ['punch', 'tear', 'fire', 'flush', 'stomp', 'shred'];

  var CSS = [
    '.fx-root{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;}',
    '.fx-abs{position:absolute;left:0;top:0;}',
    '.fx-card{position:absolute;left:0;top:0;box-sizing:border-box;border:4px solid ' + INK + ';border-radius:10px;background:#fff;padding:5px;box-shadow:7px 7px 0 ' + INK + ';will-change:transform;}',
    '.fx-card img,.fx-card svg.fx-scribble{display:block;width:100%;aspect-ratio:0.64;object-fit:contain;background:#fff;border-radius:4px;-webkit-user-drag:none;user-select:none;}',
    '.fx-emoji{position:absolute;left:0;top:0;line-height:1;font-family:' + EMOJI + ';white-space:nowrap;will-change:transform;}',
    '.fx-burn{position:absolute;inset:0;border-radius:6px;background-image:linear-gradient(to top,' + INK + ' 0%,#2b2019 38%,#7a2a10 42%,' + RED + ' 44.5%,' + YELLOW + ' 46.5%,rgba(255,210,63,0) 50%,rgba(255,255,255,0) 100%);background-size:100% 300%;background-position:0 0%;}',
    '.fx-pow{position:absolute;left:0;top:0;will-change:transform;}',
    '.fx-pow text{font-family:' + DISPLAY + ';font-weight:700;}',
    '.fx-dot{position:absolute;left:0;top:0;border-radius:50%;}',
    '.fx-scrap{position:absolute;left:0;top:0;background:#fff;border:2.5px solid ' + INK + ';}',
    '.fx-shredder{position:absolute;left:0;top:0;box-sizing:border-box;background:#3A332E;border:4px solid ' + INK + ';border-radius:14px;box-shadow:7px 7px 0 ' + INK + ';}',
    '.fx-shredder .fx-slot{position:absolute;left:14px;right:14px;top:10px;height:10px;border-radius:6px;background:#0d0a09;box-shadow:inset 0 2px 0 #000;}',
    '.fx-shredder .fx-led{position:absolute;right:14px;top:34px;width:16px;height:16px;border-radius:50%;background:' + RED + ';border:2.5px solid ' + INK + ';box-sizing:border-box;box-shadow:0 0 10px 2px rgba(232,69,58,.8);}',
    '.fx-shredder .fx-label{position:absolute;left:16px;top:32px;font-family:' + DISPLAY + ';font-weight:700;font-size:17px;letter-spacing:1px;color:' + YELLOW + ';}',
    '.fx-shredder .fx-teeth{position:absolute;left:10px;right:10px;bottom:-4px;height:12px;background:repeating-linear-gradient(90deg,#9a9089 0 7px,#0d0a09 7px 10px);border:2.5px solid ' + INK + ';border-radius:3px;}',
    '.fx-clip{position:absolute;overflow:hidden;}'
  ].join('\n');

  function injectCss() {
    try {
      if (document.getElementById('fx-style')) return;
      var s = document.createElement('style');
      s.id = 'fx-style';
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }

  /* ── tiny helpers ── */
  var gen = 0, timers = [];
  function later(ms, fn) {
    var g = gen;
    timers.push(setTimeout(function () { if (g !== gen) return; try { fn(); } catch (e) {} }, ms));
  }
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }
  function el(tag, cls, parent, css, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function anim(e, frames, opts) {
    try {
      var o = { fill: 'forwards', easing: 'linear' };
      for (var k in opts) o[k] = opts[k];
      if (typeof o.delay === 'number' && o.delay > 0 && !('fill' in opts)) o.fill = 'both';
      return e.animate(frames, o);
    } catch (err) { return null; }
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function at(x, y) { return 'left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;'; }

  /* ── sound / haptics (host globals, all guarded) ── */
  function canSound() {
    // The execution is a big moment: only the table's speaker phone plays it (see moments.js)
    try { return (typeof window.soundEnabled === 'function' ? !!window.soundEnabled() : false) && (!window.ccBigSound || window.ccBigSound()); } catch (e) { return false; }
  }
  function T(f, d, delay, type, vol, glide) { try { if (typeof window.tone === 'function') window.tone(f, d, delay, type, vol, glide); } catch (e) {} }
  function N(d, delay, vol, ff, ft) { try { if (typeof window.noise === 'function') window.noise(d, delay, vol, ff, ft); } catch (e) {} }
  function vib(ms, pattern) { later(ms, function () { try { if (typeof window.buzz === 'function') window.buzz(pattern); } catch (e) {} }); }
  function ctx() {
    try {
      var c = window._gameAudio;
      if (!c) return null;
      if (c.state === 'suspended') c.resume();
      return c;
    } catch (e) { return null; }
  }
  function noiseBuf(c, dur) {
    var len = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  // Noise with a filter sweep (f0 -> f1). Falls back to plain noise().
  function sweepNoise(dur, delay, vol, f0, f1, type) {
    var c = ctx();
    if (!c) { N(dur, delay, vol, (f0 + f1) / 2, type); return; }
    try {
      var t0 = c.currentTime + delay / 1000, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = noiseBuf(c, dur);
      f.type = type; f.Q.value = 1.2;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.08, dur / 4)); g.gain.setValueAtTime(vol, t0 + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t0); src.stop(t0 + dur + 0.05);
    } catch (e) {}
  }
  // Wobbling sawtooth motor. Falls back to tone().
  function motor(dur, delay, vol) {
    dur = Math.min(Math.max(Number(dur) || 0, 0.05), 4);   // seconds; never a runaway hum
    var c = ctx();
    if (!c) { T(90, dur, delay, 'sawtooth', vol, 70); return; }
    try {
      var t0 = c.currentTime + delay / 1000, o = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t0); o.frequency.linearRampToValueAtTime(95, t0 + 0.25);
      lfo.type = 'sine'; lfo.frequency.value = 9; lg.gain.value = 14;
      lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.08); g.gain.setValueAtTime(vol, t0 + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(f); f.connect(g); g.connect(c.destination);
      o.start(t0); lfo.start(t0); o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
    } catch (e) {}
  }

  /* ── the cartoon card ── */
  var SCRIBBLE = '<svg class="fx-scribble" viewBox="0 0 160 250" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="250" fill="#fff"/>' +
    '<path d="M28 70 C 50 30, 90 110, 120 60 S 60 150, 40 120 S 130 140, 128 180 S 40 200, 60 215" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="62" cy="48" r="6" fill="' + INK + '"/><circle cx="100" cy="48" r="6" fill="' + INK + '"/></svg>';

  function cardHtml(src) {
    if (!src) return SCRIBBLE;
    return '<img alt="" draggable="false" src="' + String(src).replace(/"/g, '&quot;') + '">';
  }
  function makeCard(parent, src, W, x, y, extraCss) {
    var c = el('div', 'fx-card', parent, 'width:' + W + 'px;' + at(x, y) + (extraCss || ''), cardHtml(src));
    return c;
  }
  function cardH(W) { return Math.round((W - 18) / 0.64 + 18); }

  function shake(root, amp, dur) {
    var f = [];
    for (var i = 0; i <= 6; i++) f.push({ transform: 'translate(' + (i === 6 ? 0 : rnd(-amp, amp)) + 'px,' + (i === 6 ? 0 : rnd(-amp, amp)) + 'px)' });
    anim(root, f, { duration: dur, fill: 'none' });
  }

  function starburst(size, word, fill, stroke) {
    var pts = [], n = 14, cx = 100, cy = 100;
    for (var i = 0; i < n * 2; i++) {
      var a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 58 : (88 + (i % 4 === 0 ? 8 : 0));
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="' + pts.join(' ') + '" fill="' + INK + '" transform="translate(7 7)"/>' +
      '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
      (word ? '<text x="100" y="114" text-anchor="middle" font-size="44" fill="' + stroke + '" stroke="' + INK + '" stroke-width="5" paint-order="stroke" transform="rotate(-10 100 100)">' + word + '</text>' : '') +
      '</svg>';
  }

  /* ════════════════ 1. PUNCH ════════════════ */
  function punch(src, L) {
    var root = L.root, W = L.W, H = L.H, x = L.x, y = L.y, SW = L.SW;
    var card = makeCard(root, src, W, x, y);
    var fs = 160, cy = y + H * 0.42;
    var fist = el('div', 'fx-emoji', root, 'font-size:' + fs + 'px;' + at(x - fs * 0.78, cy - fs / 2) + 'z-index:3;', '🤜');
    var IMPACT = 720;
    // nervous tremble while the fist winds up
    var tf = [];
    for (var i = 0; i < 10; i++) tf.push({ transform: 'rotate(' + (i % 2 ? 1.5 : -1.5) + 'deg)' });
    tf.push({ transform: 'none' });
    anim(card, tf, { duration: IMPACT, fill: 'none' });
    // fist: slide in from left, wind back, slam
    var off = -(x + 40);
    anim(fist, [
      { transform: 'translateX(' + off + 'px) scale(.9)', offset: 0 },
      { transform: 'translateX(-14px) scale(1)', offset: 0.4, easing: 'ease-out' },
      { transform: 'translateX(-70px) rotate(-14deg) scale(1.05)', offset: 0.74, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: 'translateX(85px) rotate(4deg) scale(1.3)', offset: 0.93 },
      { transform: 'translateX(70px) scale(1.2)', offset: 1 }
    ], { duration: IMPACT + 40 });
    later(IMPACT + 380, function () {
      anim(fist, [{ transform: 'translateX(70px) scale(1.2)' }, { transform: 'translateX(' + (off - 120) + 'px) scale(1)' }], { duration: 420, easing: 'ease-in' });
    });
    // card flies off right, spinning
    anim(card, [
      { transform: 'none', offset: 0 },
      { transform: 'translate(-6px,0) scale(.86,1.05) rotate(-4deg)', offset: 0.08 },
      { transform: 'translate(' + (SW * 0.45) + 'px,-90px) rotate(260deg) scale(.85)', offset: 0.55 },
      { transform: 'translate(' + (SW * 1.1) + 'px,-60px) rotate(560deg) scale(.7)', offset: 1 }
    ], { duration: 820, delay: IMPACT + 40, fill: 'forwards', easing: 'cubic-bezier(.3,.1,.6,1)' });
    // POW, behind the fist at the point of contact
    var ps = 230, px = x + W * 0.32 - ps / 2, py = cy - ps / 2 - 20;
    var pow = el('div', 'fx-pow', root, at(px, py) + 'opacity:0;z-index:2;', starburst(ps, 'POW!', YELLOW, '#fff'));
    anim(pow, [
      { transform: 'scale(.2) rotate(-20deg)', opacity: 0 },
      { transform: 'scale(.4) rotate(-14deg)', opacity: 1, offset: 0.04 },
      { transform: 'scale(1.18) rotate(4deg)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 1100, delay: IMPACT, easing: 'ease-out' });
    // impact sparks
    later(IMPACT, function () {
      shake(root, 10, 260);
      for (var k = 0; k < 8; k++) {
        var a = rnd(-Math.PI * 0.7, Math.PI * 0.7), d = rnd(110, 190);
        var s = el('div', 'fx-emoji', root, 'font-size:' + Math.round(rnd(26, 38)) + 'px;' + at(x + W * 0.3, cy - 16) + 'z-index:2;', pick(['⭐', '💫', '✨', '💥']));
        anim(s, [{ transform: 'translate(0,0) scale(.3)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(1.1) rotate(' + rnd(-90, 90) + 'deg)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
    if (canSound()) {
      sweepNoise(0.32, IMPACT - 300, 0.22, 600, 2600, 'bandpass');
      T(500, 0.28, IMPACT - 280, 'sine', 0.05, 1200);
      T(95, 0.38, IMPACT, 'sine', 0.5, 38);
      N(0.22, IMPACT, 0.45, 500, 'lowpass');
      N(0.07, IMPACT, 0.4, 3200, 'highpass');
      N(0.05, IMPACT + 20, 0.3, 1800, 'bandpass');
      T(900, 0.4, IMPACT + 80, 'sine', 0.05, 300);
    }
    vib(IMPACT, [70]);
    return 1550;
  }

  /* ════════════════ 2. TEAR ════════════════ */
  function tear(src, L) {
    var root = L.root, W = L.W, H = L.H, x = L.x, y = L.y, SW = L.SW, SH = L.SH;
    // zig-zag seam, shared by both halves
    var seam = [], steps = 13;
    for (var i = 0; i <= steps; i++) {
      var yy = -6 + (112 * i) / steps;
      var xx = 50 + (i % 2 ? 5 : -5) + (i % 3 === 0 ? 2 : 0);
      seam.push(xx.toFixed(1) + '% ' + yy.toFixed(1) + '%');
    }
    var left = ['-10% -6%'].concat(seam).concat(['-10% 106%']).join(',');
    var right = ['110% -6%'].concat(seam).concat(['110% 106%']).join(',');
    var Lh = makeCard(root, src, W, x, y, 'clip-path:polygon(' + left + ');-webkit-clip-path:polygon(' + left + ');transform-origin:20% 10%;');
    var Rh = makeCard(root, src, W, x, y, 'clip-path:polygon(' + right + ');-webkit-clip-path:polygon(' + right + ');transform-origin:80% 10%;');
    var RIP = 980;
    // tug-of-war tension
    var lf = [], rf = [];
    var n = 12;
    for (var k = 0; k <= n; k++) {
      var p = k / n, j = (k % 2 ? 1 : -1) * (1 + p * 3), gap = p * p * 9;
      lf.push({ transform: 'translate(' + (-gap + j) + 'px,' + (j * 0.5) + 'px) rotate(' + (-p * 4 + j * 0.4) + 'deg)' });
      rf.push({ transform: 'translate(' + (gap - j) + 'px,' + (-j * 0.5) + 'px) rotate(' + (p * 4 - j * 0.4) + 'deg)' });
    }
    anim(Lh, lf, { duration: RIP - 280, delay: 280 });
    anim(Rh, rf, { duration: RIP - 280, delay: 280 });
    // RIP!
    later(RIP, function () {
      anim(Lh, [
        { transform: 'translate(-9px,0) rotate(-4deg)' },
        { transform: 'translate(-60px,-28px) rotate(-16deg)', offset: 0.18, easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translate(' + (-SW * 0.55) + 'px,' + (SH * 0.75) + 'px) rotate(-62deg)' }
      ], { duration: 820 });
      anim(Rh, [
        { transform: 'translate(9px,0) rotate(4deg)' },
        { transform: 'translate(60px,-34px) rotate(18deg)', offset: 0.18, easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translate(' + (SW * 0.55) + 'px,' + (SH * 0.75) + 'px) rotate(70deg)' }
      ], { duration: 860 });
      shake(root, 6, 200);
      // paper scraps from the seam
      for (var s = 0; s < 12; s++) {
        var sz = Math.round(rnd(8, 16));
        var sy = y + rnd(0.05, 0.95) * H;
        var b = el('div', 'fx-scrap', root, 'width:' + sz + 'px;height:' + Math.round(sz * rnd(0.6, 1.3)) + 'px;' + at(x + W / 2 - sz / 2, sy));
        var dx = rnd(-140, 140), dy = rnd(-160, 40);
        anim(b, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rnd(-300, 300) + 'deg)', opacity: 1, offset: 0.6 }, { transform: 'translate(' + dx * 1.3 + 'px,' + (dy + 160) + 'px) rotate(' + rnd(-500, 500) + 'deg)', opacity: 0 }], { duration: 1000, easing: 'cubic-bezier(.2,.7,.4,1)' });
      }
      // "RRRIP" label
      var w = el('div', 'fx-abs', root, at(x + W / 2 - 90, y - 30) + 'width:180px;text-align:center;font-family:' + DISPLAY + ';font-weight:700;font-size:44px;color:#fff;-webkit-text-stroke:3px ' + INK + ';paint-order:stroke fill;text-shadow:4px 4px 0 ' + INK + ';opacity:0;', 'RIIIP!');
      anim(w, [{ transform: 'scale(.3) rotate(-8deg)', opacity: 1 }, { transform: 'scale(1.1) rotate(-8deg)', opacity: 1, offset: 0.25 }, { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.8 }, { transform: 'scale(1) rotate(-8deg) translateY(-20px)', opacity: 0 }], { duration: 900, easing: 'ease-out' });
    });
    if (canSound()) {
      for (var r = 0; r < 8; r++) N(0.045 + r * 0.006, 300 + r * 80, 0.18 + r * 0.02, 1200 + r * 380, 'bandpass');
      sweepNoise(0.34, RIP - 20, 0.42, 1400, 5200, 'bandpass');
      N(0.16, RIP, 0.3, 3500, 'highpass');
    }
    vib(300, [70]);
    return 1550;
  }

  /* ════════════════ 3. FIRE ════════════════ */
  function fire(src, L) {
    var root = L.root, W = L.W, H = L.H, x = L.x, y = L.y;
    var card = makeCard(root, src, W, x, y, 'transform-origin:50% 100%;');
    var burn = el('div', 'fx-burn', card);
    var IGN = 250, CHAR_END = 1350, CRUMBLE = 1380;
    anim(burn, [{ backgroundPosition: '0 0%' }, { backgroundPosition: '0 100%' }], { duration: CHAR_END - IGN, delay: IGN, easing: 'cubic-bezier(.4,0,.7,1)' });
    anim(card, [
      { filter: 'none', borderColor: INK },
      { filter: 'sepia(.7) saturate(1.4) brightness(.95)', offset: 0.35 },
      { filter: 'sepia(1) brightness(.45) contrast(1.4)', offset: 0.75 },
      { filter: 'sepia(1) brightness(.15) contrast(1.6)' }
    ], { duration: CHAR_END - IGN, delay: IGN });
    // curl + shrink while burning, then crumble to a heap
    anim(card, [
      { transform: 'none' },
      { transform: 'scale(.97) rotate(-1.5deg) skewX(2deg)', offset: 0.35 },
      { transform: 'scale(.9,.94) rotate(2deg) skewX(-3deg)', offset: 0.7 },
      { transform: 'scale(.82,.86) rotate(-2deg) skewX(4deg)' }
    ], { duration: CRUMBLE - 500, delay: 500, composite: 'replace' });
    later(CRUMBLE, function () {
      anim(card, [
        { transform: 'scale(.82,.86) rotate(-2deg) skewX(4deg)', opacity: 1 },
        { transform: 'scale(.7,.35) rotate(0deg) skewX(10deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.5,.04)', opacity: 0 }
      ], { duration: 420, easing: 'ease-in' });
      // ash + smoke
      for (var a = 0; a < 26; a++) {
        var sz = rnd(5, 13), ax = x + rnd(0.05, 0.95) * W, ay = y + rnd(0.35, 1) * H;
        var d = el('div', 'fx-dot', root, 'width:' + sz + 'px;height:' + sz + 'px;background:' + pick([INK, '#3b322c', '#5a4f47', '#7a2a10']) + ';' + at(ax, ay));
        var dy = -rnd(200, 420), dx = rnd(-60, 60);
        anim(d, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + (dx * 0.5 + rnd(-20, 20)) + 'px,' + dy * 0.5 + 'px)', opacity: 0.9, offset: 0.5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(180deg)', opacity: 0 }], { duration: rnd(1200, 1900), easing: 'ease-out' });
      }
      for (var m = 0; m < 9; m++) {
        var ss = rnd(70, 120), sx = x + W / 2 - ss / 2 + rnd(-W * 0.4, W * 0.4), sy = y + H * rnd(0.55, 0.95) - ss / 2;
        var sm = el('div', 'fx-dot', root, 'width:' + ss + 'px;height:' + ss + 'px;background:radial-gradient(circle, rgba(70,62,56,.7) 0%, rgba(70,62,56,.45) 50%, rgba(70,62,56,0) 72%);' + at(sx, sy));
        anim(sm, [{ transform: 'translate(0,0) scale(.3)', opacity: 0.9 }, { transform: 'translate(' + rnd(-50, 50) + 'px,' + -rnd(220, 380) + 'px) scale(1.7)', opacity: 0 }], { duration: rnd(1300, 1900), delay: m * 40, easing: 'ease-out' });
      }
    });
    // flames: a base row that stays + a rising row that follows the burn front
    function flameRow(count, top, rise, sizeA, sizeB, z) {
      var row = el('div', 'fx-abs', root, at(x - 24, top) + 'width:' + (W + 48) + 'px;height:1px;z-index:' + z + ';');
      for (var f = 0; f < count; f++) {
        var fs = Math.round(rnd(sizeA, sizeB));
        var fx = (f + 0.5) / count * (W + 48) - fs / 2 + rnd(-8, 8);
        var fl = el('div', 'fx-emoji', row, 'font-size:' + fs + 'px;' + at(fx, -fs * 0.9) + 'transform-origin:50% 100%;opacity:0;');
        fl.textContent = '🔥';
        var dl = IGN + rnd(0, 260);
        anim(fl, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220, delay: dl, easing: 'ease-out' });
        var inner = fl.animate ? fl : null;
        if (inner) {
          try {
            fl.animate([
              { transform: 'scale(1,1) translateX(0)' },
              { transform: 'scale(.92,1.22) translateX(' + rnd(-3, 3) + 'px)' },
              { transform: 'scale(1.05,.95) translateX(0)' }
            ], { duration: rnd(160, 260), iterations: Infinity, direction: 'alternate', delay: dl + 220, composite: 'add' });
          } catch (e) {}
        }
      }
      later(CRUMBLE, function () { anim(row, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, delay: z === 3 ? 0 : 200, composite: 'replace' }); });
      if (rise) anim(row, [{ transform: 'translateY(0)' }, { transform: 'translateY(' + rise + 'px)' }], { duration: CHAR_END - IGN, delay: IGN, easing: 'cubic-bezier(.4,0,.7,1)' });
      return row;
    }
    flameRow(6, y + H * 0.95, -H * 0.82, 44, 62, 3);
    flameRow(7, y + H + 14, 0, 58, 80, 4);
    // warm glow behind
    var glow = el('div', 'fx-dot', root, 'width:' + (W * 1.8) + 'px;height:' + (W * 1.8) + 'px;' + at(x + W / 2 - W * 0.9, y + H * 0.6 - W * 0.9) + 'background:radial-gradient(circle, rgba(232,69,58,.45) 0%, rgba(255,140,40,.25) 40%, rgba(255,210,63,0) 70%);z-index:-1;opacity:0;');
    root.insertBefore(glow, root.firstChild);
    anim(glow, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: 0.2 }, { opacity: 1, transform: 'scale(1.1)', offset: 0.8 }, { opacity: 0, transform: 'scale(1.2)' }], { duration: CRUMBLE + 300 - IGN, delay: IGN });
    if (canSound()) {
      N(0.55, IGN, 0.45, 320, 'lowpass');
      T(70, 0.5, IGN, 'sine', 0.35, 38);
      sweepNoise(0.5, IGN, 0.18, 300, 1500, 'bandpass');
      for (var c = 0; c < 46; c++) {
        var t = IGN + 60 + Math.random() * 1300;
        N(rnd(0.008, 0.03), t, rnd(0.12, 0.32), rnd(1800, 5200), Math.random() < 0.6 ? 'highpass' : 'bandpass');
      }
      N(0.45, CRUMBLE, 0.22, 900, 'lowpass');
    }
    vib(IGN, [70]);
    return 1650;
  }

  /* ════════════════ 4. FLUSH ════════════════ */
  function flush(src, L) {
    var root = L.root, W = L.W, H = L.H, x = L.x, SW = L.SW, SH = L.SH;
    // Card sits higher to leave room for the toilet
    var y = Math.max(16, SH * 0.36 - H / 2);
    var card = makeCard(root, src, W, x, y, 'z-index:2;');
    var ts = Math.round(Math.min(230, SW * 0.6)), k = ts / 200, th = Math.round(220 * k);
    var tx = Math.round(SW / 2 - ts / 2), ty = Math.round(SH - th - 18);
    var toilet = el('div', 'fx-abs', root, at(tx, ty) + 'width:' + ts + 'px;height:' + th + 'px;z-index:1;',
      '<svg viewBox="-8 -8 216 236" width="' + ts + '" height="' + th + '" style="overflow:visible" xmlns="http://www.w3.org/2000/svg"><g stroke="' + INK + '" stroke-width="5" stroke-linejoin="round">' +
      '<g transform="translate(7 7)" fill="' + INK + '" stroke="none"><rect x="52" y="8" width="96" height="76" rx="10"/><path d="M14 108 C 14 160, 50 190, 70 196 L 64 216 L 136 216 L 130 196 C 150 190, 186 160, 186 108 Z"/></g>' +
      '<rect x="56" y="14" width="88" height="72" rx="10" fill="#fff"/>' +
      '<rect x="46" y="4" width="108" height="16" rx="6" fill="#fff"/>' +
      '<rect x="62" y="34" width="22" height="9" rx="4" fill="#C9D3DC"/>' +
      '<path d="M14 108 C 14 160, 50 190, 70 196 L 64 216 L 136 216 L 130 196 C 150 190, 186 160, 186 108 Z" fill="#fff"/>' +
      '<ellipse cx="100" cy="106" rx="88" ry="34" fill="#fff"/>' +
      '<ellipse cx="100" cy="108" rx="66" ry="22" fill="#8EC5FF" stroke-width="4"/>' +
      '<path d="M40 150 C 60 175, 140 175, 160 150" fill="none" stroke="#C9D3DC" stroke-width="5" stroke-linecap="round"/>' +
      '</g></svg>');
    anim(toilet, [{ transform: 'translateY(' + (th + 40) + 'px)' }, { transform: 'translateY(-12px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    // swirl drawn over the bowl water
    var bx = tx + (100 + 8) * k * 200 / 216, by = ty + (108 + 8) * k * 220 / 236;
    var sw = 132 * k * 200 / 216;
    var swirlHolder = el('div', 'fx-abs', root, at(bx - sw / 2, by - sw / 2) + 'width:' + sw + 'px;height:' + sw + 'px;z-index:3;transform:scaleY(.33);opacity:0;');
    var swirl = el('div', 'fx-abs', swirlHolder, 'width:100%;height:100%;',
      '<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="48" fill="#8EC5FF"/>' +
      '<path d="M50 50 m0 -38 a38 38 0 0 1 38 38" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M50 50 m0 38 a38 38 0 0 1 -38 -38" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M50 50 m24 0 a24 24 0 0 1 -24 24" fill="none" stroke="' + BLUE + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M50 50 m-24 0 a24 24 0 0 1 24 -24" fill="none" stroke="' + BLUE + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="50" cy="50" r="9" fill="' + BLUE + '" stroke="' + INK + '" stroke-width="3"/></svg>');
    var START = 420, DUR = 1150;
    anim(swirlHolder, [{ opacity: 0, transform: 'scaleY(.33) scale(.2)' }, { opacity: 1, transform: 'scaleY(.33) scale(1)' }], { duration: 260, delay: START - 80, easing: 'ease-out' });
    try { swirl.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: 420, iterations: Infinity }); } catch (e) {}
    later(START + DUR + 350, function () { anim(swirlHolder, [{ opacity: 1 }, { opacity: 0, transform: 'scaleY(.33) scale(.5)' }], { duration: 400 }); });
    // spiral down into the bowl
    var cx0 = x + W / 2, cy0 = y + H / 2, dx = bx - cx0, dy = by - cy0;
    var frames = [], n = 24;
    for (var i = 0; i <= n; i++) {
      var p = i / n, e = p * p * (3 - 2 * p) * 0.4 + p * 0.6;
      var r = (1 - e) * 40, ang = p * Math.PI * 2 * 2.5;
      var px = dx * e + Math.sin(ang) * r, py = dy * e - (1 - Math.cos(ang)) * r * 0.3;
      var sc = Math.max(0.03, 1 - Math.pow(e, 0.6) * 0.97);
      frames.push({ transform: 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) rotate(' + (-p * 1080).toFixed(0) + 'deg) scale(' + sc.toFixed(3) + ')', opacity: p > 0.96 ? 0 : 1 });
    }
    anim(card, frames, { duration: DUR, delay: START, easing: 'cubic-bezier(.3,0,.7,1)' });
    // little splash
    later(START + DUR - 40, function () {
      for (var d = 0; d < 6; d++) {
        var drop = el('div', 'fx-emoji', root, 'font-size:' + Math.round(rnd(22, 32)) + 'px;' + at(bx - 14, by - 26) + 'z-index:4;');
        drop.textContent = '💧';
        var a = -Math.PI / 2 + rnd(-0.9, 0.9), dd = rnd(70, 120);
        anim(drop, [{ transform: 'translate(0,0) scale(.4)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * dd + 'px,' + Math.sin(a) * dd + 'px) scale(1)', opacity: 1, offset: 0.55 }, { transform: 'translate(' + Math.cos(a) * dd * 1.3 + 'px,' + (Math.sin(a) * dd + 70) + 'px) scale(.8)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
      }
    });
    if (canSound()) {
      T(1200, 0.06, START - 120, 'square', 0.05, 900); // handle clunk
      N(0.05, START - 120, 0.25, 1500, 'bandpass');
      sweepNoise(1.25, START, 0.4, 3800, 220, 'lowpass');
      sweepNoise(0.9, START + 150, 0.15, 1800, 500, 'bandpass');
      [0, 90, 170, 260, 330].forEach(function (t, k) { T(320 + k * 60, 0.09, START + DUR - 120 + t, 'sine', 0.13, 900 + k * 120); });
    }
    vib(START, [70]);
    return 1650;
  }

  /* ════════════════ 5. STOMP ════════════════ */
  function stomp(src, L) {
    var root = L.root, W = L.W, H = L.H, x = L.x, y = L.y, SW = L.SW;
    var B = y + H; // card bottom
    var card = makeCard(root, src, W, x, y, 'transform-origin:50% 100%;');
    var bs = Math.min(230, SW * 0.6);
    // boot's sole sits at its `top` + bs*0.92 (glyph padding); we pin sole to card bottom and translate up.
    var SOLE = 0.9;
    var boot = el('div', 'fx-emoji', root, 'font-size:' + bs + 'px;' + at(SW / 2 - bs * 0.5, B - bs * SOLE) + 'z-index:3;');
    boot.textContent = '🥾';
    var HIT1 = 520, HIT2 = 1160, TOTAL = 1500;
    var sq1 = 0.48, sq2 = 0.06;
    function ty(h) { return 'translateY(' + (-h).toFixed(0) + 'px)'; }
    var hi = B + 60; // fully off the top
    anim(boot, [
      { transform: ty(hi), offset: 0 },
      { transform: ty(H), offset: HIT1 / TOTAL, easing: 'linear' },
      { transform: ty(H * sq1), offset: (HIT1 + 70) / TOTAL, easing: 'ease-out' },
      { transform: ty(H * sq1), offset: (HIT1 + 200) / TOTAL, easing: 'ease-in-out' },
      { transform: ty(H * sq1 + 230) + ' rotate(-8deg)', offset: (HIT2 - 220) / TOTAL, easing: 'cubic-bezier(.7,0,1,.7)' },
      { transform: ty(H * sq1), offset: HIT2 / TOTAL, easing: 'linear' },
      { transform: ty(H * sq2), offset: (HIT2 + 60) / TOTAL },
      { transform: ty(H * sq2), offset: 1 }
    ], { duration: TOTAL, easing: 'cubic-bezier(.55,0,1,.45)' });
    later(TOTAL + 250, function () { anim(boot, [{ transform: ty(H * sq2) }, { transform: ty(hi + bs) }], { duration: 500, easing: 'ease-in' }); });
    anim(card, [
      { transform: 'none', offset: 0 },
      { transform: 'none', offset: HIT1 / TOTAL },
      { transform: 'scale(1.16,' + sq1 + ')', offset: (HIT1 + 70) / TOTAL },
      { transform: 'scale(1.12,' + sq1 + ')', offset: HIT2 / TOTAL },
      { transform: 'scale(1.62,' + sq2 + ')', offset: (HIT2 + 60) / TOTAL },
      { transform: 'scale(1.55,' + sq2 + ')', offset: 1 }
    ], { duration: TOTAL });
    function impact(t, power) {
      later(t, function () {
        shake(root, 8 * power, 280);
        var spread = W * (0.5 + power * 0.2);
        for (var s = 0; s < 2; s++) {
          var dir = s ? 1 : -1;
          for (var k = 0; k < 2 + power; k++) {
            var fs = Math.round(rnd(40, 58) * (0.8 + power * 0.25));
            var p = el('div', 'fx-emoji', root, 'font-size:' + fs + 'px;' + at(SW / 2 - fs / 2 + dir * spread * 0.55, B - fs * 0.85 - k * 12) + 'z-index:4;');
            p.textContent = '💨';
            var flip = dir > 0 ? 'scaleX(-1)' : 'scaleX(1)';
            anim(p, [{ transform: 'translateX(0) ' + flip + ' scale(.4)', opacity: 1 }, { transform: 'translateX(' + dir * rnd(80, 140) * power + 'px) translateY(' + rnd(-30, 0) + 'px) ' + flip + ' scale(1.2)', opacity: 0 }], { duration: 650, delay: k * 50, easing: 'ease-out' });
          }
        }
        // impact lines
        var star = el('div', 'fx-pow', root, at(SW / 2 - 110, B - 120) + 'z-index:0;opacity:0;', starburst(220, '', '#fff', INK));
        anim(star, [{ transform: 'scale(.3,.15)', opacity: 1 }, { transform: 'scale(' + (1 + power * 0.4) + ',' + (0.55 + power * 0.1) + ')', opacity: 1, offset: 0.4 }, { transform: 'scale(' + (1.2 + power * 0.4) + ',.6)', opacity: 0 }], { duration: 450, easing: 'ease-out' });
        root.insertBefore(star, root.firstChild);
      });
    }
    impact(HIT1, 1);
    impact(HIT2, 2);
    later(HIT2 + 80, function () {
      var w = el('div', 'fx-abs', root, at(SW / 2 - 110, B - 150) + 'width:220px;text-align:center;font-family:' + DISPLAY + ';font-weight:700;font-size:52px;color:#fff;-webkit-text-stroke:3px ' + INK + ';paint-order:stroke fill;text-shadow:5px 5px 0 ' + INK + ';z-index:5;opacity:0;', 'SPLAT!');
      anim(w, [{ transform: 'scale(.3) rotate(6deg)', opacity: 1 }, { transform: 'scale(1.1) rotate(6deg)', opacity: 1, offset: 0.2 }, { transform: 'scale(1) rotate(6deg)', opacity: 1, offset: 0.75 }, { transform: 'scale(1) rotate(6deg) translateY(-30px)', opacity: 0 }], { duration: 900, easing: 'ease-out' });
    });
    if (canSound()) {
      sweepNoise(0.4, HIT1 - 380, 0.12, 400, 1400, 'bandpass');
      T(75, 0.42, HIT1, 'sine', 0.45, 34); N(0.28, HIT1, 0.42, 260, 'lowpass');
      sweepNoise(0.2, HIT2 - 210, 0.1, 500, 1600, 'bandpass');
      T(62, 0.6, HIT2, 'sine', 0.5, 28); N(0.4, HIT2, 0.5, 220, 'lowpass'); N(0.1, HIT2, 0.25, 2200, 'bandpass');
    }
    vib(HIT1, [70]);
    return 1550;
  }

  /* ════════════════ 6. SHRED ════════════════ */
  function shred(src, L) {
    var root = L.root, SW = L.SW, SH = L.SH;
    var W = Math.round(L.W * 0.78), H = cardH(W);
    var x = Math.round((SW - W) / 2);
    var BOXH = 96, BOXW = W + 64;
    var slotY = Math.round(Math.min(SH * 0.5, Math.max(H + 70, SH * 0.44)));
    var cardTop = slotY - H - 26;
    // feed: everything above the slot
    var feed = el('div', 'fx-clip', root, at(x - 20, 0) + 'width:' + (W + 40) + 'px;height:' + (slotY + 12) + 'px;z-index:1;');
    var card = makeCard(feed, src, W, 20, cardTop);
    // output: everything below the shredder
    var outTop = slotY + BOXH - 18;
    var out = el('div', 'fx-clip', root, at(0, outTop) + 'width:' + SW + 'px;height:' + (SH - outTop) + 'px;z-index:1;');
    var box = el('div', 'fx-shredder', root, at(SW / 2 - BOXW / 2, slotY - 2) + 'width:' + BOXW + 'px;height:' + BOXH + 'px;z-index:2;',
      '<div class="fx-slot"></div><div class="fx-label">SHRED-O-MATIC</div><div class="fx-led"></div><div class="fx-teeth"></div>');
    var led = box.querySelector('.fx-led');
    anim(box, [{ transform: 'translateY(' + (SH - slotY + 20) + 'px)' }, { transform: 'translateY(-10px)', offset: 0.75 }, { transform: 'translateY(0)' }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    try { led.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 140, iterations: 14, direction: 'alternate', delay: 300 }); } catch (e) {}
    var FEED = 360, FDUR = 1100, N_STRIPS = 10;
    // jiggle the machine while it chews
    var bj = [];
    for (var b = 0; b < 16; b++) bj.push({ transform: 'translate(' + (b % 2 ? 2 : -2) + 'px,' + (b % 3 ? 1 : -1) + 'px)' });
    bj.push({ transform: 'none' });
    anim(box, bj, { duration: FDUR + 100, delay: FEED, fill: 'none', composite: 'add' });
    // card goes in
    var cf = [], n = 10;
    for (var i = 0; i <= n; i++) {
      var p = i / n;
      cf.push({ transform: 'translate(' + (i === 0 || i === n ? 0 : (i % 2 ? 2.5 : -2.5)) + 'px,' + (p * (H + 40)).toFixed(0) + 'px)' });
    }
    anim(card, cf, { duration: FDUR, delay: FEED, easing: 'cubic-bezier(.4,.1,.8,.9)' });
    // strips come out the bottom
    var travel = H + 30, strips = [];
    for (var s = 0; s < N_STRIPS; s++) {
      var l = (s * 100 / N_STRIPS), r = 100 - (s + 1) * 100 / N_STRIPS;
      var lCss = s === 0 ? '-12px' : l.toFixed(2) + '%';
      var rCss = s === N_STRIPS - 1 ? '-12px' : r.toFixed(2) + '%';
      var spreadX = (s - (N_STRIPS - 1) / 2) * 3.4;
      var st = makeCard(out, src, W, x + spreadX, -travel, 'clip-path:inset(-12px ' + rCss + ' -12px ' + lCss + ');-webkit-clip-path:inset(-12px ' + rCss + ' -12px ' + lCss + ');transform-origin:' + ((s + 0.5) * 100 / N_STRIPS).toFixed(1) + '% 0%;');
      var lag = rnd(-40, 40);
      anim(st, [{ transform: 'translateY(0)' }, { transform: 'translateY(' + travel * 0.55 + 'px) rotate(' + rnd(-1.5, 1.5) + 'deg)', offset: 0.5 }, { transform: 'translateY(' + travel + 'px) rotate(' + rnd(-3, 3) + 'deg)' }], { duration: FDUR, delay: FEED + 170 + lag, easing: 'cubic-bezier(.4,.1,.8,.9)' });
      strips.push(st);
    }
    var DROP = FEED + FDUR + 200;
    later(DROP, function () {
      out.style.overflow = 'visible';
      strips.forEach(function (st, k) {
        var dx = rnd(-90, 90), rot = rnd(-35, 35), sway = rnd(20, 45) * (Math.random() < 0.5 ? -1 : 1);
        anim(st, [
          { transform: 'translateY(' + travel + 'px)' },
          { transform: 'translate(' + (dx * 0.3 + sway) + 'px,' + (travel + 120) + 'px) rotate(' + rot * 0.5 + 'deg)', offset: 0.35 },
          { transform: 'translate(' + (dx * 0.6 - sway) + 'px,' + (travel + 300) + 'px) rotate(' + -rot * 0.4 + 'deg)', offset: 0.65 },
          { transform: 'translate(' + dx + 'px,' + (travel + SH) + 'px) rotate(' + rot + 'deg)' }
        ], { duration: rnd(1100, 1500), delay: k * 25 + rnd(0, 120), easing: 'cubic-bezier(.45,0,.9,.6)' });
      });
    });
    if (canSound()) {
      motor((FDUR + 500) / 1000, FEED - 120, 0.09);   // seconds, not milliseconds (it once hummed for 26 minutes)
      for (var t = FEED; t < FEED + FDUR; t += 85) N(rnd(0.03, 0.06), t + rnd(-15, 15), rnd(0.15, 0.28), rnd(500, 1100), 'bandpass');
      T(1500, 0.06, FEED - 160, 'square', 0.04);
      N(0.15, FEED + FDUR, 0.25, 700, 'lowpass');
    }
    var pat = [];
    for (var v = 0; v < 14; v++) pat.push(v % 2 ? 25 : 60);
    vib(FEED, [70]);
    return FEED + FDUR + 150;
  }

  /* ════════════════ reduced motion ════════════════ */
  function gentle(src, L) {
    var card = makeCard(L.root, src, L.W, L.x, L.y);
    anim(card, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 450, delay: 150, easing: 'ease-in' });
    if (canSound()) { N(0.25, 100, 0.15, 1500, 'bandpass'); }
    vib(150, [70]);
    return 600;
  }

  var IMPL = { punch: punch, tear: tear, fire: fire, flush: flush, stomp: stomp, shred: shred };

  function play(kind, imageSrc, stage) {
    try {
      injectCss();
      gen++; clearTimers();
      if (!stage) return 0;
      try { if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative'; } catch (e) {}
      var old = stage.querySelector(':scope > .fx-root');
      if (old) old.remove();
      if (!IMPL[kind]) kind = pick(KINDS);
      var SW = stage.clientWidth || window.innerWidth || 390;
      var SH = stage.clientHeight || window.innerHeight || 844;
      var W = Math.round(Math.min(SW * 0.62, 280));
      var H = cardH(W);
      var root = el('div', 'fx-root fx-' + kind, stage);
      var L = { root: root, SW: SW, SH: SH, W: W, H: H, x: Math.round((SW - W) / 2), y: Math.round(Math.max(12, SH * 0.45 - H / 2)) };
      var reduce = window.ccReducedMotion();
      var ms = reduce ? gentle(imageSrc, L) : IMPL[kind](imageSrc, L);
      later(4000, function () { try { root.remove(); } catch (e) {} });
      return ms;
    } catch (e) {
      try { console.warn('[fx] execution failed', e); } catch (e2) {}
      return 1500;
    }
  }

  window.Executions = { kinds: KINDS.slice(), play: play };
})();
