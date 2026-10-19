/* Closed Caption — BIG HEAD MODE, pack 1: eleven more round-winner acts (global act numbers 3-13).
   7 The Weather, 8 The Elevator and 11 The Stamp replaced Bubble Bath, Big Baby and Head Spin (Oct 2026).
   Crude cut-out paper gags starring the winner's own face. Uses the kit in heads.js (window.ccHeads). */
(function () {
  'use strict';
  if (!window.ccHeads) return;
  var add = window.ccHeads.add;
  var INK = '#1F1A17';
  var FONT = 'font-family:var(--display),\'Arial Black\',Arial,sans-serif;font-weight:700;';

  /* ── little helpers ── */
  function st(w) { return 'stroke="' + INK + '" stroke-width="' + (w || 4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  // feet → top of head for a puppet of head px and body width w
  function hTop(px, w) { var bh = w * 160 / 148; return bh + px * 1.08 - Math.round(bh * 0.25 + px * 0.12); }
  function place(el, x, y, r) { el.style.transform = 'translate(' + x + 'px,' + y + 'px)' + (r ? ' rotate(' + r + 'deg)' : ''); return el; }
  // the head on its own, centred on (0,0)
  function headAt(c, px, z, style) { return c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);' + (style || '') + '">' + c.head(px) + '</div>', z || 20); }
  // a small prop centred on (0,0), drawn in the house ink (ccHeads.icon; these used to be emoji)
  function emo(c, e, size, z) { return c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);line-height:1">' + window.ccHeads.icon(e, size) + '</div>', z || 25); }
  // puppet with an optional svg drawn BEHIND the body (same viewBox as the body)
  function rig(c, o) {
    var px = o.px || 100, w = o.w || 110, bh = w * 160 / 148, neck = Math.round(bh * 0.25 + px * 0.12);
    var html = '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">' +
      '<div class="bh-hd" style="position:relative;z-index:2;margin-bottom:' + (-neck) + 'px">' + c.head(px) + '</div>' +
      '<div style="position:relative;z-index:1;width:' + w + 'px">' +
      (o.behind ? '<svg viewBox="-24 -34 148 160" width="' + w + '" style="position:absolute;left:0;top:0;overflow:visible;z-index:0">' + o.behind + '</svg>' : '') +
      '<div style="position:relative;z-index:1">' + c.body(Object.assign({ shirt: c.color, w: w }, o)) + '</div></div></div>';
    return c.add(html, o.z || 20);
  }
  // a camera-style white flash on the stage
  // (photosensitivity: a stage flash is skipped if the act already flashed in the last 400ms)
  function flashW(c, at, a) { c._fl = c._fl || []; if (c._fl.some(function (t) { return Math.abs(t - at) < 400; })) return null; c._fl.push(at); var f = c.add('<div style="width:' + c.W + 'px;height:' + c.H + 'px;background:#fff"></div>', 48); c.anim(f, [{ opacity: 0 }, { opacity: a || 0.9, offset: 0.2 }, { opacity: 0 }], { dur: 240, at: at }); return f; }
  // visible only between from and to (at a fixed spot)
  function showAt(c, el, x, y, from, to, r) {
    var p = [{ t: 0, x: x, y: y, r: r, o: 0 }, { t: Math.max(0, from - 1), x: x, y: y, r: r, o: 0 }, { t: from, x: x, y: y, r: r, o: 1 }];
    if (to) p.push({ t: to - 1, x: x, y: y, r: r, o: 1 }, { t: to, x: x, y: y, r: r, o: 0 });
    return c.path(el, p, { jerky: 1 });
  }

  /* ════════ 3. Human Cannonball ════════ */
  add({ name: 'Human Cannonball', tag: 'Shot to the top. Landed in a bucket.', run: function (c) {
    c.sky('repeating-linear-gradient(90deg,#E8453A 0 48px,#FFF1DC 48px 96px)');
    var sc = ''; for (var i = 0; i < 12; i++) sc += '<path d="M' + (i * 40) + ' 0 Q' + (i * 40 + 20) + ' 38 ' + (i * 40 + 40) + ' 0 Z" fill="#FFD23F" ' + st(3) + '/>';
    c.add('<svg width="' + c.W + '" height="44" viewBox="0 0 ' + c.W + ' 44" style="display:block;overflow:visible">' + sc + '</svg>', 3);
    c.ground('#C98B4B', 160);
    var gy = c.H - 160, bx = c.W - 62;
    var cannon = c.add('<svg viewBox="0 0 200 160" width="200" style="position:absolute;left:-60px;top:-150px;overflow:visible">' +
      '<path d="M44 112 Q24 130 4 150" fill="none" stroke="' + INK + '" stroke-width="4" stroke-dasharray="6 5"/>' +
      '<g transform="rotate(-38 80 110)"><rect x="40" y="80" width="170" height="64" rx="12" fill="#2E5EAA" ' + st(5) + '/>' +
      '<path d="M76 82 V142 M122 82 V142 M166 82 V142" stroke="#FFD23F" stroke-width="9"/>' +
      '<rect x="198" y="70" width="26" height="84" rx="6" fill="#FFD23F" ' + st(5) + '/></g>' +
      '<circle cx="80" cy="128" r="32" fill="#B5651D" ' + st(5) + '/><path d="M80 98 V158 M50 128 H110" stroke="' + INK + '" stroke-width="4"/><circle cx="80" cy="128" r="7" fill="' + INK + '"/></svg>', 22);
    place(cannon, 70, gy);
    var bucket = c.add('<svg viewBox="0 0 70 56" width="70" style="position:absolute;left:-35px;top:-56px;overflow:visible">' +
      '<path d="M6 10 Q35 -36 64 10" fill="none" ' + st(3) + '/>' +
      '<path d="M4 8 L66 8 L58 54 L12 54 Z" fill="#9AA3AD" ' + st(4) + '/><ellipse cx="35" cy="8" rx="31" ry="6" fill="#5E6670" ' + st(3) + '/>' +
      '<text x="35" y="38" text-anchor="middle" font-size="11" font-weight="900" font-family="Arial" fill="' + INK + '">TARGET</text></svg>', 23);
    var sign = c.add('<div style="position:absolute;left:-40px;top:-96px;width:80px;' + FONT + 'font-size:12px;text-align:center;color:' + INK + '">' +
      '<div style="background:#FFF8EA;border:3px solid ' + INK + ';border-radius:6px;padding:3px 2px;transform:rotate(4deg)">LANDING<br>ZONE ↓</div><div style="width:5px;height:50px;background:' + INK + ';margin:0 auto"></div></div>', 4);
    place(sign, bx - 70, gy);
    // the head, peeking out of the barrel
    var hx = 219, hy = gy - 138;
    var hd = headAt(c, 92, 21);
    var pts = [{ t: 0, x: hx - 26, y: hy + 20, r: -20 }, { t: 300, x: hx - 26, y: hy + 20, r: -20 }, { t: 450, x: hx, y: hy, r: 0 },
      { t: 1200, x: hx, y: hy }, { t: 1300, x: hx - 3, y: hy + 2, r: -4 }, { t: 1400, x: hx + 3, y: hy, r: 4 }, { t: 1500, x: hx - 3, y: hy + 2, r: -4 }, { t: 1600, x: hx + 3, y: hy, r: 4 }, { t: 1700, x: hx - 3, y: hy + 2, r: -4 }, { t: 1800, x: hx, y: hy - 4 }, { t: 1990, x: hx, y: hy }];
    var ex = bx, ey = gy - 82;
    for (var k = 0; k <= 10; k++) {
      var u = k / 10, base = hy + (ey - hy) * u;
      pts.push({ t: 2000 + k * 100, x: hx + (ex - hx) * u, y: base - 4 * (hy + (ey - hy) / 2 - 150) * u * (1 - u), r: u * 720 });
    }
    pts.push({ t: 3080, x: ex, y: ey + 8, r: 728, sx: 1.15, sy: 0.75 }, { t: 3250, x: ex, y: ey - 6, r: 726, sy: 1.08 }, { t: 3400, x: ex, y: ey, r: 728 }, { t: 5200, x: ex, y: ey, r: 728 });
    c.path(hd, pts, { jerky: 1 });
    c.path(bucket, [{ t: 0, x: bx, y: gy }, { t: 3000, x: bx, y: gy }, { t: 3080, x: bx, y: gy + 4, sx: 1.2, sy: 0.8 }, { t: 3200, x: bx, y: gy, r: -6 }, { t: 3320, x: bx, y: gy, r: 5 }, { t: 3440, x: bx, y: gy, r: 0 }], { jerky: 2 });
    c.say('Is this thing… safe?', hx, hy - 58, 450, 1800, 30);
    c.talk(hd, 450, 1800);
    var spark = emo(c, '✨', 26, 24);
    c.path(spark, [{ t: 0, x: 14, y: gy, o: 0 }, { t: 899, x: 14, y: gy, o: 0 }, { t: 900, x: 14, y: gy, o: 1 }, { t: 1700, x: 54, y: gy - 38, o: 1, s: 1.3 }, { t: 1990, x: 66, y: gy - 44, o: 1 }, { t: 2000, x: 66, y: gy - 44, o: 0 }], { jerky: 8 });
    c.sfx(900, function () { noise(1.05, 0, 0.07, 6000, 'highpass'); });
    c.scream(hd, 2000, 3100);
    c.burst(['💨', '☁️', '💥'], 205, gy - 127, 14, 110, 2000, 900, 30);
    flashW(c, 2000, 0.7); c.shake(2000, 450); c.buzz(2000, [150, 50, 80]);
    c.sfx(2000, c.snd.boom);
    c.sfx(2150, function () { tone(500, 0.85, 0, 'sawtooth', 0.04, 1100); });
    c.sfx(3050, c.snd.splat); c.shake(3050, 300);
    c.burst(['💦', '💧'], ex, ey + 20, 10, 90, 3050, 800, 40);
    c.sfx(3300, c.snd.crowd);
    c.say('Ten out of ten.', ex, ey - 62, 3900, 5150, 78);
    c.talk(hd, 3900, 4900);
    c.sfx(3900, c.snd.ding);
  } });

  /* ════════ 4. The Statue ════════ */
  add({ name: 'The Statue', tag: 'Immortalized. Then decorated.', run: function (c) {
    c.sky('linear-gradient(#EADFC9,#D6C3A0)');
    var pic = c.add('<svg viewBox="0 0 90 70" width="90" style="display:block;overflow:visible"><rect x="2" y="2" width="86" height="66" fill="#8FC9E8" stroke="#B8860B" stroke-width="7"/><path d="M8 60 L30 30 L44 48 L56 36 L82 60 Z" fill="#5BAF4A" ' + st(2) + '/><circle cx="66" cy="18" r="7" fill="#FFD23F"/></svg>', 3);
    place(pic, 20, 110);
    var pic2 = c.add('<svg viewBox="0 0 70 90" width="64" style="display:block;overflow:visible"><rect x="2" y="2" width="66" height="86" fill="#F7E6C4" stroke="#B8860B" stroke-width="7"/><path d="M14 70 Q34 10 56 70" fill="none" ' + st(3) + '/><circle cx="35" cy="34" r="8" fill="#E8453A" ' + st(2) + '/></svg>', 3);
    place(pic2, c.W - 86, 130);
    c.ground('#7A5536', 160);
    var gy = c.H - 160, x = c.W / 2;
    var ped = c.add('<svg viewBox="0 0 170 150" width="170" style="position:absolute;left:-85px;top:-150px;overflow:visible">' +
      '<rect x="6" y="0" width="158" height="18" fill="#EEE8DC" ' + st(4) + '/><rect x="22" y="18" width="126" height="116" fill="#F7F2E8" ' + st(4) + '/><rect x="6" y="134" width="158" height="16" fill="#EEE8DC" ' + st(4) + '/>' +
      '<rect x="40" y="58" width="90" height="40" fill="#D4A017" ' + st(3) + '/><text x="85" y="76" text-anchor="middle" font-size="11" font-weight="900" font-family="Arial" fill="' + INK + '">THE WINNER</text><text x="85" y="90" text-anchor="middle" font-size="9" font-weight="700" font-family="Arial" fill="' + INK + '">(solid gold-ish)</text></svg>', 12);
    place(ped, x, gy);
    var neck = c.add('<svg viewBox="0 0 60 30" width="60" style="position:absolute;left:-30px;top:-30px;overflow:visible"><path d="M14 0 L46 0 L56 30 L4 30 Z" fill="#D4A017" ' + st(3) + '/></svg>', 13);
    place(neck, x, gy - 150);
    var sy = gy - 217, top = sy - 67;
    var statue = headAt(c, 124, 20, 'filter:sepia(1) saturate(3.4) hue-rotate(-14deg) brightness(1.08) contrast(1.15)');
    c.path(statue, [{ t: 0, x: x, y: sy }, { t: 3650, x: x, y: sy }, { t: 3700, x: x, y: sy + 4, sy: 0.95 }, { t: 3800, x: x, y: sy }], { jerky: 1 });
    // the sheet
    var sheet = c.add('<svg viewBox="0 0 200 190" width="200" style="position:absolute;left:-100px;top:-180px;overflow:visible">' +
      '<path d="M100 4 Q150 6 168 70 Q186 140 196 186 L4 186 Q14 140 32 70 Q50 6 100 4 Z" fill="#6B3FA0" ' + st(4) + '/>' +
      '<path d="M70 40 Q60 120 50 184 M130 40 Q140 120 150 184 M100 30 V184" fill="none" stroke="#4A2B73" stroke-width="4"/>' +
      '<circle cx="100" cy="6" r="8" fill="#FFD23F" ' + st(3) + '/></svg>', 24);
    c.path(sheet, [{ t: 0, x: x, y: gy - 142 }, { t: 1300, x: x, y: gy - 142 }, { t: 1420, x: x + 30, y: gy - 190, r: 10 }, { t: 1750, x: x + 280, y: gy - 520, r: 55, o: 1 }, { t: 1800, x: x + 300, y: gy - 540, r: 60, o: 0 }], { jerky: 3 });
    c.sfx(0, function () { c.snd.drum(1250); });
    c.sfx(1350, c.snd.whoosh); c.sfx(1400, c.snd.fanfare); c.sfx(1450, c.snd.crowd);
    c.burst(['✨', '⭐'], x, sy, 14, 150, 1400, 1000, 30);
    c.say('Behold: me. In gold.', x, top - 6, 1950, 2900, 50);
    c.talk(statue, 1950, 2800);
    // the pigeon
    var pig = c.add('<svg viewBox="0 0 84 64" width="84" style="position:absolute;left:-40px;top:-62px;overflow:visible">' +
      '<path d="M8 34 L-6 28 L-4 42 Z" fill="#6D7684" ' + st(3) + '/>' +
      '<ellipse cx="36" cy="38" rx="28" ry="17" fill="#8D96A3" ' + st(4) + '/>' +
      '<path d="M44 50 L42 62 M30 50 L28 62" stroke="#F2A33A" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="62" cy="22" r="12" fill="#7A8392" ' + st(3) + '/><path d="M54 30 Q60 36 68 30" fill="none" stroke="#5FB39A" stroke-width="4"/>' +
      '<circle cx="66" cy="18" r="3.4" fill="#fff"/><circle cx="67" cy="18" r="1.8" fill="' + INK + '"/>' +
      '<path d="M73 21 L84 25 L73 28 Z" fill="#F2A33A" ' + st(2) + '/>' +
      '<path class="pw" d="M18 34 Q34 2 52 32 Z" fill="#6D7684" ' + st(3) + ' style="transform-box:fill-box;transform-origin:50% 100%"/></svg>', 27);
    var lx = x + 16, ly = top + 6;
    c.path(pig, [{ t: 0, x: -90, y: 150 }, { t: 2700, x: -90, y: 150 }, { t: 3000, x: x - 90, y: 120 }, { t: 3250, x: lx - 10, y: ly - 40 }, { t: 3350, x: lx, y: ly },
      { t: 3460, x: lx, y: ly - 12 }, { t: 3540, x: lx, y: ly }, { t: 4150, x: lx, y: ly }, { t: 4250, x: lx + 20, y: ly - 30, r: -10 }, { t: 4800, x: c.W + 120, y: 70, r: -15 }], { jerky: 2 });
    var wing = pig.querySelector('.pw');
    c.anim(wing, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(-.6)' }], { dur: 110, at: 2700, iterations: 6, direction: 'alternate', ease: 'steps(1)', fill: 'none' });
    c.anim(wing, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(-.6)' }], { dur: 110, at: 4150, iterations: 6, direction: 'alternate', ease: 'steps(1)', fill: 'none' });
    c.sfx(2750, function () { noise(0.5, 0, 0.12, 900, 'bandpass'); });
    c.sfx(3400, function () { tone(430, 0.14, 0, 'sine', 0.08, 330); tone(430, 0.16, 190, 'sine', 0.08, 300); });
    // the plop
    var splat = c.add('<div class="sp" style="transform-origin:30px 0">' +
      '<svg viewBox="0 0 60 70" width="76" style="display:block;overflow:visible;transform:translate(-38px,-6px)"><path d="M8 10 Q14 0 30 4 Q50 0 54 12 Q58 22 48 24 L46 50 Q44 58 40 50 L38 28 L26 30 L24 62 Q21 70 18 62 L16 28 Q4 24 8 10 Z" fill="#fff" ' + st(3) + '/><circle cx="30" cy="13" r="4" fill="#E6E0CC"/></svg></div>', 26);
    place(splat, x - 4, top + 4);
    c.anim(splat.querySelector('.sp'), [{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'scaleY(.5)', offset: 0.3 }, { opacity: 1, transform: 'scaleY(1)' }], { dur: 900, at: 3650, ease: 'steps(4,end)' });
    c.sfx(3650, c.snd.splat);
    c.scream(statue, 3700, 4150);
    c.sfx(4250, c.snd.womp);
    c.say('…Every. Single. Time.', x, top - 6, 4300, 5150, 50);
    c.talk(statue, 4300, 5000);
  } });

  /* ════════ 5. Superhero ════════ */
  add({ name: 'Superhero', tag: 'Faster than a speeding caption.', run: function (c) {
    c.sky('linear-gradient(#22305E,#5E77C0 70%,#F2A97A)');
    c.add('<div style="width:56px;height:56px;border-radius:50%;background:#FFF3C4;border:3px solid ' + INK + ';box-shadow:inset -10px -6px 0 #E9D98F"></div>', 1).style.transform = 'translate(24px,92px)';
    var H = c.H, W = c.W, base = H - 330;
    var blds = [{ x: 0, w: 130, top: H - 300, col: '#3A3F5C' }, { x: 130, w: 72, top: H - 236, col: '#4C4F73' }, { x: 202, w: 90, top: H - 196, col: '#3A3F5C' }, { x: 292, w: W - 292 + 4, top: H - 262, col: '#4C4F73' }];
    var sk = '';
    blds.forEach(function (b) {
      sk += '<rect x="' + b.x + '" y="' + (b.top - base) + '" width="' + b.w + '" height="' + (H - b.top + 4) + '" fill="' + b.col + '" ' + st(3) + '/>';
      for (var yy = b.top + 18; yy < H - 120; yy += 26) for (var xx = b.x + 12; xx < b.x + b.w - 16; xx += 24) sk += '<rect x="' + xx + '" y="' + (yy - base) + '" width="10" height="13" fill="' + (c.rnd() < 0.65 ? '#FFE07A' : '#2A2D44') + '"/>';
    });
    c.add('<svg width="' + W + '" height="330" viewBox="0 0 ' + W + ' 330" style="display:block;overflow:visible">' + sk + '</svg>', 4).style.transform = 'translate(0,' + base + 'px)';
    // the billboard
    var bb = c.add('<div style="position:absolute;left:0;top:0;width:200px;">' +
      '<div style="height:128px;background:#FFF8EA;border:5px solid ' + INK + ';border-radius:4px;box-sizing:border-box;text-align:center;' + FONT + 'color:' + INK + ';padding-top:16px;line-height:1">' +
      '<div style="font-size:30px;color:#E8453A">GRAVITY:</div><div style="font-size:22px;margin-top:8px">IT’S THE LAW</div><div style="font-size:11px;margin-top:8px;color:#5a4f47">a public service message</div></div>' +
      '<div style="display:flex;justify-content:space-around"><i style="display:block;width:10px;height:' + (H - 262 - 358) + 'px;background:' + INK + '"></i><i style="display:block;width:10px;height:' + (H - 262 - 358) + 'px;background:' + INK + '"></i></div></div>', 14);
    place(bb, 176, 230);
    var crack = c.add('<svg viewBox="0 0 120 110" width="120" style="position:absolute;left:-60px;top:-55px;overflow:visible"><path d="M60 55 L20 10 M60 55 L110 18 M60 55 L8 80 M60 55 L104 100 M60 55 L56 4 M60 55 L64 108" stroke="' + INK + '" stroke-width="4" fill="none"/></svg>', 15);
    showAt(c, crack, 272, 296, 3200);
    // the hero
    var cape = '<g class="cape" style="transform-box:fill-box;transform-origin:50% 0"><path d="M20 8 Q50 18 80 8 L102 122 Q50 134 -2 122 Z" fill="#E8453A" ' + st(3) + '/></g>';
    var emblem = '<path d="M34 26 L66 26 L50 52 Z" fill="#FFD23F" ' + st(3) + '/><text x="50" y="40" text-anchor="middle" font-size="13" font-weight="900" font-family="Arial" fill="' + INK + '">W</text>';
    var hero = rig(c, { px: 96, w: 100, arms: 'up', shirt: '#2E5EAA', pants: '#E8453A', behind: cape, extra: emblem, z: 20 });
    c.anim(hero.querySelector('.cape'), [{ transform: 'skewX(-8deg) scaleY(1)' }, { transform: 'skewX(8deg) scaleY(.94)' }], { dur: 160, iterations: 32, direction: 'alternate', ease: 'steps(1)' });
    var sx = 78, sy = H - 300;
    c.path(hero, [{ t: 0, x: sx, y: sy }, { t: 1400, x: sx, y: sy }, { t: 1500, x: sx, y: sy + 6, sy: 0.86 }, { t: 1600, x: sx, y: sy, sy: 1.1 },
      { t: 1800, x: 140, y: 380, r: 45 }, { t: 2050, x: 300, y: 250, r: 80 }, { t: 2300, x: W + 260, y: 220, r: 90, e: 'steps(1,end)' },
      { t: 2400, x: -300, y: 296, r: 90 }, { t: 3200, x: 150, y: 296, r: 90 }, { t: 3800, x: 150, y: 296, r: 90 },
      { t: 4500, x: 150, y: 340, r: 93 }, { t: 5200, x: 120, y: 520, r: 135 }], { jerky: 3 });
    c.say('This is a job for… me.', sx, sy - hTop(96, 100) - 6, 200, 1400, 18);
    c.talk(hero, 200, 1300);
    c.sfx(1600, c.snd.whoosh); c.sfx(2400, c.snd.whoosh);
    c.scream(hero, 2900, 3250);
    c.sfx(3200, c.snd.boom); c.sfx(3200, c.snd.splat);
    c.shake(3200, 500); c.buzz(3200, [200, 60, 120]); flashW(c, 3200, 0.5);
    c.burst(['💥', '⭐'], 272, 296, 10, 110, 3200, 800, 0);
    c.sfx(4500, c.snd.fall);
    c.say('I meant to do that.', 272, 252, 3900, 5150, 50);
    c.talk(hero, 3900, 4800);
  } });

  /* ════════ 6. Ballerina ════════ */
  add({ name: 'Ballerina', tag: 'Graceful, until the landing.', run: function (c) {
    c.sky('linear-gradient(90deg,#7A0F1F 0 13%,#2B1830 13% 87%,#7A0F1F 87%)');
    var cur = ''; for (var i = 0; i < 4; i++) cur += '<path d="M' + (i * 13) + ' 0 V900" stroke="#4E0812" stroke-width="3"/>';
    c.add('<svg width="52" height="' + c.H + '" style="display:block">' + cur + '</svg>', 2);
    c.add('<svg width="52" height="' + c.H + '" style="display:block">' + cur + '</svg>', 2).style.transform = 'translate(' + (c.W - 52) + 'px,0)';
    c.add('<svg width="' + c.W + '" height="' + c.H + '" style="display:block"><path d="M' + (c.W / 2 - 30) + ' 0 L' + (c.W / 2 + 30) + ' 0 L' + (c.W / 2 + 150) + ' ' + (c.H - 150) + ' L' + (c.W / 2 - 150) + ' ' + (c.H - 150) + ' Z" fill="rgba(255,240,190,.13)"/></svg>', 3);
    c.ground('#6B4A2F', 160);
    var gy = c.H - 160, x = c.W / 2;
    var spot = c.add('<div style="position:absolute;left:-150px;top:-36px;width:300px;height:72px;border-radius:50%;background:rgba(255,240,190,.5)"></div>', 3);
    place(spot, x, gy + 6);
    var tutu = '<path d="M6 76 L94 76 L112 96 L98 92 L90 104 L78 94 L68 106 L56 94 L44 106 L32 94 L22 104 L12 92 L-12 96 Z" fill="#FF9CC7" ' + st(3) + '/>';
    var p1 = c.puppet({ px: 100, w: 110, arms: 'up', shirt: '#FF6FA8', pants: '#FFD6E6', extra: tutu });
    var split = '<rect x="-70" y="84" width="92" height="15" rx="7" fill="#FFD6E6" ' + st(3) + '/><rect x="78" y="84" width="92" height="15" rx="7" fill="#FFD6E6" ' + st(3) + '/>' +
      '<ellipse cx="-72" cy="91" rx="10" ry="8" fill="#FF6FA8" ' + st(3) + '/><ellipse cx="172" cy="91" rx="10" ry="8" fill="#FF6FA8" ' + st(3) + '/>' + tutu;
    var p2 = c.puppet({ px: 100, w: 110, arms: 'out', legs: 'none', shirt: '#FF6FA8', extra: split });
    var pts = [];
    for (var k = 0; k <= 8; k++) pts.push({ t: k * 125, x: -80 + (x + 80) * k / 8, y: gy - (k % 2 ? 14 : 0), r: k % 2 ? 4 : -4 });
    pts.push({ t: 1100, x: x, y: gy }, { t: 1500, x: x, y: gy, r: -3 }, { t: 1900, x: x, y: gy, r: 3 }, { t: 2000, x: x, y: gy });
    var cyc = [1, 0.3, -1, -0.3];
    for (var t = 2000, n = 0; t < 3150; t += 75, n++) { var wob = 3 + (t - 2000) / 1150 * 13; pts.push({ t: t, x: x + (n % 2 ? 4 : -4) * (t > 2700 ? 2 : 1), y: gy - (n % 4 === 0 ? 8 : 0), r: (n % 2 ? wob : -wob), sx: cyc[n % 4] }); }
    pts.push({ t: 3149, x: x, y: gy, r: 16, o: 1 }, { t: 3150, x: x, y: gy, o: 0 });
    c.path(p1, pts, { jerky: 1 });
    c.path(p2, [{ t: 0, x: x, y: gy + 20, o: 0 }, { t: 3149, x: x, y: gy + 20, o: 0 }, { t: 3150, x: x, y: gy + 26, o: 1, sx: 1.12, sy: 0.82 }, { t: 3300, x: x, y: gy + 20, sx: 1, sy: 1 }, { t: 3400, x: x, y: gy + 20, r: -2 }, { t: 3500, x: x, y: gy + 20 }], { jerky: 2 });
    var notes = [784, 988, 1175, 988, 784, 659, 784, 988, 1319, 1175, 988, 784];
    for (var m = 0; m < 12; m++) (function (f, dt) { c.sfx(dt, function () { tone(f, 0.22, 0, 'triangle', 0.05); }); })(notes[m], 100 + m * 250);
    c.say('Prepare to be moved.', x, gy - 196, 1050, 1950, 50);
    c.talk(p1, 1050, 1900);
    c.sfx(2000, function () { noise(1.1, 0, 0.12, 1500, 'bandpass'); });
    c.sfx(3150, function () { for (var j = 0; j < 4; j++) noise(0.06, j * 50, 0.55, 1800, 'bandpass'); tone(90, 0.3, 0, 'square', 0.08, 40); });
    c.shake(3150, 400); c.buzz(3150, [120, 40, 200]);
    c.burst(['💥'], x - 90, gy - 10, 3, 40, 3150, 600, 10); c.burst(['💥'], x + 90, gy - 10, 3, 40, 3150, 600, 10);
    c.scream(p2, 3150, 3800);
    c.say('I’m fine. Call a doctor.', x, gy - 176, 3950, 5150, 50);
    c.talk(p2, 3950, 4900);
    c.burst(['🌹'], x, 110, 8, 160, 4300, 900, -150);
    c.sfx(4300, c.snd.crowd);
  } });

  /* ════════ 7. The Weather ════════ */
  add({ name: 'The Weather', tag: 'Clear skies. Locally smug.', run: function (c) {
    c.sky('linear-gradient(#1E3A66,#2E5EAA)');
    c.ground('#16294A', 120);
    var W = c.W, gy = c.H - 120, mx = Math.round(W * 0.6), my = 300, mw = Math.min(280, W - 120), mh = 230;
    // the map: the table, seen from above, with a seat for everyone
    var seats = '', n = 6, cx = mw / 2, cy = mh / 2 + 14, rx = mw * 0.34, ry = mh * 0.27, win = 0;
    for (var i = 0; i < n; i++) { var a = -Math.PI / 2 + i / n * Math.PI * 2; seats += '<circle cx="' + (cx + Math.cos(a) * rx).toFixed(0) + '" cy="' + (cy + Math.sin(a) * ry).toFixed(0) + '" r="9" fill="' + (i === win ? c.color : '#E9E3D6') + '" ' + st(3) + '/>'; }
    var map = c.add('<svg viewBox="0 0 ' + mw + ' ' + mh + '" width="' + mw + '" style="position:absolute;left:' + (-mw / 2) + 'px;top:' + (-mh / 2) + 'px;overflow:visible">' +
      '<rect x="2" y="2" width="' + (mw - 4) + '" height="' + (mh - 4) + '" rx="8" fill="#7EC8E3" ' + st(4) + '/>' +
      '<rect x="2" y="2" width="' + (mw - 4) + '" height="26" rx="6" fill="#FFF8EA" ' + st(3) + '/>' +
      '<text x="' + (mw / 2) + '" y="20" text-anchor="middle" font-family="Libre Caslon Text,Georgia,serif" font-style="italic" font-size="14" fill="' + INK + '">The table, tonight</text>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 18) + '" ry="' + (ry - 14) + '" fill="#5BAF4A" ' + st(3) + '/>' + seats + '</svg>', 6);
    place(map, mx, my);
    var seat = function (k) { var a = -Math.PI / 2 + k / n * Math.PI * 2; return { x: mx - mw / 2 + cx + Math.cos(a) * rx, y: my - mh / 2 + cy + Math.sin(a) * ry }; };
    // a sun over the winner's seat; a small cloud over everyone else's
    var sun = c.add('<svg viewBox="0 0 60 60" width="56" style="position:absolute;left:-28px;top:-28px;overflow:visible"><path d="M30 2 V12 M30 48 V58 M2 30 H12 M48 30 H58 M10 10 L17 17 M43 43 L50 50 M50 10 L43 17 M10 50 L17 43" ' + st(3) + '/><circle cx="30" cy="30" r="13" fill="#FFD23F" ' + st(3) + '/></svg>', 9);
    var s0 = seat(win);
    c.path(sun, [{ t: 0, x: s0.x, y: s0.y - 30, o: 0, s: 0.3 }, { t: 1199, x: s0.x, y: s0.y - 30, o: 0, s: 0.3 }, { t: 1200, x: s0.x, y: s0.y - 30, o: 1, s: 1.1 }, { t: 1350, x: s0.x, y: s0.y - 30, s: 1 }], { jerky: 2 });
    c.sfx(1200, function () { tone(880, 0.2, 0, 'sine', 0.04); });
    for (var k = 1; k < n; k++) (function (k) {
      var p = seat(k), cl = c.add('<svg viewBox="0 0 60 40" width="48" style="position:absolute;left:-24px;top:-20px;overflow:visible"><path d="M12 32 C2 32 2 18 12 18 C12 6 30 4 34 14 C40 6 54 10 52 22 C60 24 58 34 50 34 Z" fill="#E9E3D6" ' + st(3) + '/><path d="M20 36 L18 42 M32 36 L30 42 M44 36 L42 42" ' + st(2.5) + '/></svg>', 9);
      var t0 = 2700 + k * 130;
      c.path(cl, [{ t: 0, x: p.x, y: p.y - 26, o: 0 }, { t: t0 - 1, x: p.x, y: p.y - 26, o: 0 }, { t: t0, x: p.x, y: p.y - 26, o: 1, s: 1.15 }, { t: t0 + 120, x: p.x, y: p.y - 26, s: 1 }], { jerky: 2 });
      c.sfx(t0, function () { noise(0.04, 0, 0.08, 1800, 'bandpass'); });
    })(k);
    // the forecaster, pointing
    var p = c.puppet({ px: 92, w: 96, arms: 'out', shirt: '#2A2522', pants: '#2A2522', extra: '<path d="M44 12 L50 40 L56 12 Z" fill="#fff" ' + st(2) + '/><path d="M48 16 L50 30 L52 16 Z" fill="' + c.color + '"/>' });
    var px = 70, top = gy - hTop(92, 96);
    c.path(p, [{ t: 0, x: px, y: gy }, { t: 1100, x: px, y: gy, r: 0 }, { t: 1200, x: px, y: gy, r: 3 }, { t: 2600, x: px, y: gy, r: 3 }, { t: 2700, x: px, y: gy, r: -2 }, { t: 5200, x: px, y: gy, r: -2 }], { jerky: 1 });
    c.say('Sunny where I’m sitting.', px + 40, top - 4, 1400, 2600, 20); c.talk(p, 1400, 2500);
    c.say('Scattered losses elsewhere.', px + 40, top - 4, 3500, 5150, 20); c.talk(p, 3500, 4800);
  } });

  /* ════════ 8. The Elevator ════════ */
  add({ name: 'The Elevator', tag: 'Going up. Alone.', run: function (c) {
    c.sky('linear-gradient(#E9E0CF,#D8CCB4)');
    c.ground('#6E655C', 120);
    var W = c.W, gy = c.H - 120, x = W / 2, dw = 220, dh = 360, dt = gy - dh;
    // the car: wood panels, a rail, and the winner, alone, with a plant
    var car = c.add('<div style="width:' + dw + 'px;height:' + dh + 'px;box-sizing:border-box;background:repeating-linear-gradient(90deg,#B07A44 0 54px,#9A6A3A 54px 56px);border:3px solid ' + INK + '"></div>', 3);
    place(car, x - dw / 2, dt);
    var p = c.puppet({ px: 96, w: 100, arms: 'down', shirt: c.color, z: 5 });
    place(p, x - 20, gy);
    var plant = c.add('<svg viewBox="0 0 60 110" width="60" style="position:absolute;left:-30px;top:-110px;overflow:visible"><path d="M30 70 C10 50 6 26 14 10 C24 24 28 44 30 70 C32 40 40 18 52 8 C56 30 48 52 30 70" fill="#2E9E6B" ' + st(3) + '/><path d="M14 70 H46 L42 108 H18 Z" fill="#C46A3A" ' + st(3) + '/></svg>', 5);
    place(plant, x + 70, gy);
    // the doors: closed, open on the ding, closed again (they slide into the wall: the shaft clips them)
    var shaft = c.add('<div style="position:relative;width:' + dw + 'px;height:' + dh + 'px;overflow:hidden"><div class="dl" style="position:absolute;left:0;top:0;width:' + (dw / 2) + 'px;height:' + dh + 'px;box-sizing:border-box;background:linear-gradient(90deg,#AAB4BE,#DCE2E8 45%,#AAB4BE);border:3px solid ' + INK + '"></div><div class="dr" style="position:absolute;left:' + (dw / 2) + 'px;top:0;width:' + (dw / 2) + 'px;height:' + dh + 'px;box-sizing:border-box;background:linear-gradient(90deg,#AAB4BE,#DCE2E8 45%,#AAB4BE);border:3px solid ' + INK + '"></div></div>', 8);
    place(shaft, x - dw / 2, dt);
    [['.dl', -1], ['.dr', 1]].forEach(function (d) {
      var el = shaft.querySelector(d[0]), o = d[1] * (dw / 2 - 8);
      c.anim(el, [{ transform: 'translateX(0)', offset: 0 }, { transform: 'translateX(0)', offset: 1500 / c.DUR }, { transform: 'translateX(' + o + 'px)', offset: 2000 / c.DUR, easing: 'ease-in' }, { transform: 'translateX(' + o + 'px)', offset: 3700 / c.DUR }, { transform: 'translateX(0)', offset: 4200 / c.DUR }, { transform: 'translateX(0)', offset: 1 }], { dur: c.DUR });
    });
    var frame = c.add('<div style="width:' + (dw + 36) + 'px;height:' + (dh + 30) + 'px;box-sizing:border-box;border:18px solid #C9A227;border-bottom:0;box-shadow:0 0 0 3px ' + INK + ',inset 0 0 0 3px ' + INK + '"></div>', 9);
    place(frame, x - dw / 2 - 18, dt - 30);
    // the floor dial over the door
    var dial = c.add('<svg viewBox="0 0 120 60" width="120" style="position:absolute;left:-60px;top:-60px;overflow:visible"><path d="M6 56 A54 54 0 0 1 114 56 Z" fill="#C9A227" ' + st(3) + '/>' +
      '<text x="18" y="50" font-family="Libre Caslon Text,Georgia,serif" font-size="11" fill="' + INK + '">1</text><text x="38" y="28" font-family="Libre Caslon Text,Georgia,serif" font-size="11" fill="' + INK + '">2</text><text x="74" y="28" font-family="Libre Caslon Text,Georgia,serif" font-size="11" fill="' + INK + '">3</text><text x="92" y="50" font-family="Libre Caslon Text,Georgia,serif" font-size="10" fill="' + INK + '">PH</text>' +
      '<g class="nd" style="transform-origin:60px 56px"><path d="M60 56 L60 16" ' + st(3) + '/></g><circle cx="60" cy="56" r="5" fill="' + INK + '"/></svg>', 10);
    place(dial, x, dt - 34);
    c.anim(dial.querySelector('.nd'), [{ transform: 'rotate(-70deg)' }, { transform: 'rotate(-70deg)', offset: 0.1 }, { transform: 'rotate(-35deg)', offset: 0.18 }, { transform: 'rotate(-35deg)', offset: 0.27 }, { transform: 'rotate(-70deg)', offset: 0.3 },
      { transform: 'rotate(-70deg)', offset: 0.82 }, { transform: 'rotate(-20deg)', offset: 0.88 }, { transform: 'rotate(25deg)', offset: 0.94 }, { transform: 'rotate(70deg)' }], { dur: c.DUR, ease: 'steps(1,end)' });
    c.sfx(1450, c.snd.ding);
    c.sfx(0, function () { [392, 494, 587, 494].forEach(function (f, i) { tone(f, 0.3, i * 360, 'sine', 0.025); }); });
    var top = gy - hTop(96, 100);
    c.say('Oh. This one’s full.', x - 20, top - 4, 2200, 3600, 40); c.talk(p, 2200, 3400);
    c.sfx(4200, function () { noise(0.1, 0, 0.08, 600, 'lowpass'); });
  } });

  /* ════════ 9. Rock God ════════ */
  add({ name: 'Rock God', tag: 'Turned it up to eleven.', run: function (c) {
    c.sky('radial-gradient(circle at 50% 28%,#6A3296,#1A0B2E 72%)');
    c.add('<svg width="' + c.W + '" height="' + c.H + '" style="display:block"><path d="M40 0 L80 0 L200 ' + (c.H - 160) + ' L60 ' + (c.H - 160) + ' Z" fill="rgba(255,90,200,.14)"/><path d="M' + (c.W - 80) + ' 0 L' + (c.W - 40) + ' 0 L' + (c.W - 60) + ' ' + (c.H - 160) + ' L' + (c.W - 220) + ' ' + (c.H - 160) + ' Z" fill="rgba(90,220,255,.14)"/></svg>', 2);
    c.ground('#2A2A2A', 160);
    var gy = c.H - 160, x = Math.round(c.W * 0.36), ax = c.W - 74;
    var ampSvg = function (burnt) {
      return '<svg viewBox="0 0 120 150" width="120" style="position:absolute;left:-60px;top:-150px;overflow:visible">' +
        '<rect x="0" y="0" width="120" height="150" rx="8" fill="' + (burnt ? '#141414' : '#2B2B2B') + '" ' + st(5) + '/>' +
        '<rect x="10" y="10" width="100" height="24" fill="' + (burnt ? '#3A2E1E' : '#C9A86A') + '" ' + st(3) + '/>' +
        '<circle cx="28" cy="22" r="6" fill="#eee" ' + st(2) + '/><circle cx="50" cy="22" r="6" fill="#eee" ' + st(2) + '/><text x="88" y="28" text-anchor="middle" font-size="14" font-weight="900" font-family="Arial" fill="' + INK + '">' + (burnt ? '∞' : '11') + '</text>' +
        '<circle cx="60" cy="92" r="40" fill="' + (burnt ? '#2a1a10' : '#555') + '" ' + st(4) + '/><circle cx="60" cy="92" r="14" fill="' + (burnt ? '#000' : '#333') + '" ' + st(3) + '/>' +
        (burnt ? '<path d="M20 50 L60 92 L100 40 M60 92 L30 140 M60 92 L104 128" stroke="#FF8A00" stroke-width="4" fill="none"/>' : '') + '</svg>';
    };
    var amp = c.add(ampSvg(false), 18), amp2 = c.add(ampSvg(true), 18);
    var ap = [{ t: 0, x: ax, y: gy }, { t: 2400, x: ax, y: gy }];
    for (var t = 2400, n = 0; t < 3100; t += 60, n++) ap.push({ t: t, x: ax + (n % 2 ? 3 + n / 3 : -3 - n / 3), y: gy - (n % 3 ? 0 : 4), r: n % 2 ? 2 : -2 });
    ap.push({ t: 3099, x: ax, y: gy, o: 1 }, { t: 3100, x: ax, y: gy, o: 0 });
    c.path(amp, ap, { jerky: 1 });
    c.path(amp2, [{ t: 0, x: ax, y: gy, o: 0 }, { t: 3099, x: ax, y: gy, o: 0 }, { t: 3100, x: ax + 6, y: gy, r: -8, s: 1.1, o: 1 }, { t: 3300, x: ax + 4, y: gy, r: -6, s: 1 }], { jerky: 2 });
    var fire = emo(c, '🔥', 34, 19); showAt(c, fire, ax - 20, gy - 160, 3150);
    var fire2 = emo(c, '🔥', 26, 19); showAt(c, fire2, ax + 26, gy - 156, 3300);
    // the rocker: guitar, a fixed fretting arm, and a windmill arm
    var sh = '#1F1F1F', sk = '#F2C9A0';
    var arm = function (d) { return '<path d="' + d + '" stroke="' + INK + '" stroke-width="11" stroke-linecap="round" fill="none"/><path d="' + d + '" stroke="' + sh + '" stroke-width="6" stroke-linecap="round" fill="none"/>'; };
    var gtr = '<path d="M60 74 L-30 30" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M60 74 L-30 30" stroke="#8B5A2B" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M-28 30 L-46 16 L-38 8 L-22 24 Z" fill="' + INK + '"/>' +
      '<path d="M44 56 L106 48 L84 76 L112 102 L48 96 Z" fill="#E8453A" ' + st(3) + '/><circle cx="62" cy="78" r="5" fill="' + INK + '"/><path d="M54 70 L76 82" stroke="#fff" stroke-width="2"/>';
    var larm = arm('M22 18 L-4 42') + '<circle cx="-6" cy="44" r="7" fill="' + sk + '" ' + st(3) + '/>';
    var rarm = '<g class="wind" style="transform-origin:78px 18px">' + arm('M78 18 L86 66') + '<circle cx="87" cy="70" r="7" fill="' + sk + '" ' + st(3) + '/></g>';
    var rock = c.puppet({ px: 100, w: 120, arms: 'none', shirt: sh, pants: '#3B3F8F', extra: gtr + larm + rarm, z: 22 });
    var top = gy - hTop(100, 120);
    c.anim(rock.querySelector('.wind'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { dur: 320, at: 1500, iterations: 5, ease: 'steps(6,end)' });
    var rp = [{ t: 0, x: x, y: gy }];
    for (t = 250, n = 0; t < 1500; t += 250, n++) rp.push({ t: t, x: x, y: gy - (n % 2 ? 0 : 6), r: n % 2 ? 2 : -2 });
    for (t = 1500, n = 0; t < 3100; t += 160, n++) rp.push({ t: t, x: x + (n % 4 < 2 ? -6 : 6), y: gy - (n % 2 ? 0 : 34), r: n % 2 ? -6 : 6 });
    rp.push({ t: 3100, x: x, y: gy }, { t: 3200, x: x - 34, y: gy, r: -16 }, { t: 3600, x: x - 20, y: gy, r: -6 }, { t: 5200, x: x - 20, y: gy, r: -6 });
    c.path(rock, rp, { jerky: 1 });
    c.anim(rock.querySelector('.bh-hd'), [{ filter: 'none' }, { filter: 'brightness(.42) sepia(.6)' }], { dur: 120, at: 3120, ease: 'steps(2,end)' });
    c.say('Hello, living room!', x, top - 4, 200, 1350, 30);
    c.talk(rock, 200, 1300);
    c.sfx(0, c.snd.crowd);
    c.sfx(1400, function () { tone(110, 0.4, 0, 'sawtooth', 0.07); tone(165, 0.4, 0, 'sawtooth', 0.05); });
    for (var k = 0; k < 5; k++) c.sfx(1500 + k * 320, function () { tone(98, 0.3, 0, 'sawtooth', 0.08); tone(147, 0.3, 0, 'sawtooth', 0.06); tone(196, 0.3, 0, 'square', 0.03); noise(0.2, 0, 0.08, 2500, 'bandpass'); });
    c.burst(['🎸', '🤘', '⚡', '🎵'], x + 40, top + 40, 12, 150, 1600, 1300, 60);
    c.sfx(2700, function () { tone(1400, 0.4, 0, 'sawtooth', 0.03, 2600); });
    c.sfx(3100, c.snd.boom); flashW(c, 3100, 0.95); c.shake(3100, 700); c.buzz(3100, [250, 80, 250]);
    c.burst(['💥', '🔥', '⚡'], ax, gy - 80, 14, 160, 3100, 900, 40);
    c.burst(['☁️', '💨'], ax, gy - 140, 10, 90, 3300, 1800, 220);
    c.burst(['💨'], x - 20, top + 10, 4, 40, 3400, 1500, 120);
    c.scream(rock, 3120, 3700);
    c.sfx(3500, function () { tone(3200, 1.3, 0, 'sine', 0.02); });
    c.say('…Encore?', x - 20, top - 4, 4100, 5150, 30);
    c.talk(rock, 4100, 4700);
    for (var cr = 0; cr < 4; cr++) c.sfx(4500 + cr * 160, function () { tone(4200, 0.05, 0, 'sine', 0.02); });
  } });

  /* ════════ 10. Sumo ════════ */
  add({ name: 'Sumo', tag: 'Pushed everyone out of the ring.', run: function (c) {
    c.sky('linear-gradient(#5C2E1F,#A65A35 60%,#D9A066)');
    for (var i = 0; i < 4; i++) {
      var tas = c.add('<svg viewBox="0 0 30 80" width="30" style="display:block;overflow:visible"><path d="M15 0 V40" stroke="' + INK + '" stroke-width="4"/><path d="M4 40 L26 40 L22 80 L8 80 Z" fill="' + ['#E8453A', '#FFFFFF', '#2E9E6B', '#2E5EAA'][i] + '" ' + st(3) + '/></svg>', 3);
      place(tas, 30 + i * (c.W - 90) / 3, 50);
    }
    c.ground('#E2C48A', 170);
    var gy = c.H - 170, x0 = Math.round(c.W * 0.34);
    var ring = c.add('<svg viewBox="0 0 400 60" width="' + (c.W - 20) + '" style="display:block;overflow:visible"><ellipse cx="200" cy="30" rx="196" ry="26" fill="none" stroke="#F7F0DC" stroke-width="7"/></svg>', 3);
    place(ring, 10, gy - 10);
    var belt = '<path d="M20 72 Q50 82 80 72 L80 90 Q50 98 20 90 Z" fill="#3B3F8F" ' + st(3) + '/><path d="M42 86 L58 86 L56 114 L44 114 Z" fill="#3B3F8F" ' + st(3) + '/>' +
      '<path d="M32 36 Q38 46 46 38 M54 38 Q62 46 68 36" fill="none" stroke="' + INK + '" stroke-width="2.5"/>';
    var o = { px: 92, w: 200, shirt: '#F2C9A0', pants: '#F2C9A0', extra: belt };
    var s1 = c.puppet(Object.assign({}, o, { arms: 'down' }));
    var s2 = c.puppet(Object.assign({}, o, { arms: 'out' }));
    var top = gy - hTop(92, 200);
    c.path(s1, [{ t: 0, x: x0, y: gy }, { t: 250, x: x0 - 8, y: gy - 30, r: -12 }, { t: 450, x: x0, y: gy, r: -2, sy: 0.94 }, { t: 600, x: x0, y: gy },
      { t: 800, x: x0 + 8, y: gy - 30, r: 12 }, { t: 1000, x: x0, y: gy, r: 2, sy: 0.94 }, { t: 1150, x: x0, y: gy },
      { t: 1500, x: x0, y: gy, sx: 1.08, sy: 0.96 }, { t: 1600, x: x0, y: gy }, { t: 1800, x: x0, y: gy, sx: 1.08, sy: 0.96 }, { t: 1900, x: x0, y: gy }, { t: 2100, x: x0, y: gy, sx: 1.1, sy: 0.95 }, { t: 2200, x: x0, y: gy },
      { t: 2599, x: x0, y: gy, o: 1 }, { t: 2600, x: x0, y: gy, o: 0 }], { jerky: 2 });
    c.path(s2, [{ t: 0, x: x0, y: gy, o: 0 }, { t: 2599, x: x0, y: gy, o: 0 }, { t: 2600, x: x0, y: gy, r: 8, o: 1 }, { t: 2750, x: x0 + 20, y: gy - 8, r: 10 }, { t: 2900, x: x0 + 40, y: gy, r: 12 }, { t: 3050, x: x0 + 70, y: gy - 6, r: 14 }, { t: 3300, x: x0 + 80, y: gy, r: 4 }, { t: 3600, x: x0 + 70, y: gy, r: 0 }], { jerky: 2 });
    var gx = c.W - 66;
    var ghost = c.add('<svg viewBox="0 0 100 180" width="90" style="position:absolute;left:-45px;top:-162px;overflow:visible"><g fill="rgba(255,255,255,.22)" stroke="#5a4f47" stroke-width="3" stroke-dasharray="7 6"><circle cx="50" cy="32" r="26"/><path d="M26 64 Q50 56 74 64 L80 130 L20 130 Z"/><path d="M34 130 V176 M66 130 V176"/><path d="M26 70 L8 118 M74 70 L92 118"/></g><text x="50" y="42" text-anchor="middle" font-size="26" font-weight="900" font-family="Arial" fill="#5a4f47">?</text></svg>', 15);
    var gp = [{ t: 0, x: gx, y: gy }];
    for (var t = 300, n = 0; t < 3000; t += 300, n++) gp.push({ t: t, x: gx + (n % 2 ? 3 : -3), y: gy, r: n % 2 ? 3 : -3 });
    gp.push({ t: 3050, x: gx + 20, y: gy - 30, r: 20 }, { t: 3500, x: c.W + 180, y: gy - 300, r: 160 });
    c.path(ghost, gp, { jerky: 2 });
    var lbl = c.add('<div style="position:absolute;left:-60px;top:0;width:120px;text-align:center;' + FONT + 'font-size:12px;color:#3a2a20">(imaginary<br>opponent)</div>', 15);
    c.path(lbl, [{ t: 0, x: gx, y: gy + 8 }, { t: 3000, x: gx, y: gy + 8, o: 1 }, { t: 3050, x: gx, y: gy + 8, o: 0 }], { jerky: 1 });
    var stomp = function () { tone(58, 0.35, 0, 'sine', 0.15, 34); noise(0.22, 0, 0.12, 300, 'lowpass'); };
    c.sfx(450, stomp); c.sfx(1000, stomp); c.shake(450, 250); c.shake(1000, 250); c.buzz(450, 80); c.buzz(1000, 80);
    [1500, 1800, 2100].forEach(function (s, n) {
      c.sfx(s, function () { noise(0.08, 0, 0.6, 3000, 'bandpass'); });
    });
    c.say('(I’m not even here.)', gx, gy - 168, 1600, 2500, 72);
    c.scream(s2, 2600, 3100);
    c.sfx(3050, c.snd.whoosh);
    c.sfx(3250, c.snd.crowd); c.sfx(3400, c.snd.fanfare);
    c.burst(['🧂', '✨'], x0 + 70, top - 40, 8, 110, 3600, 1000, 90);
    c.say('Undefeated.', x0 + 70, top - 4, 3950, 5150, 40);
    c.talk(s2, 3950, 4600);
  } });

  /* ════════ 11. The Stamp ════════ */
  add({ name: 'The Stamp', tag: 'Issued in a limited edition of one.', run: function (c) {
    c.sky('repeating-linear-gradient(-45deg,#E8453A 0 18px,#FFF8EA 18px 36px,#2E5EAA 36px 54px,#FFF8EA 54px 72px)');
    var W = c.W, H = c.H, x = W / 2, y = Math.round(H * 0.4);
    c.add('<div style="width:' + (W - 36) + 'px;height:' + (H - 200) + 'px;background:#FFF8EA;border:3px solid ' + INK + '"></div>', 2).style.transform = 'translate(18px,70px)';
    var sw = 220, sh = 266;
    // perforated edge: the stamp sits on a scalloped backing
    var perf = 'radial-gradient(circle at 50% 50%,transparent 6px,#F4EFE4 6.5px) -9px -9px/18px 18px';
    var stamp = c.add('<div style="position:absolute;left:' + (-sw / 2) + 'px;top:' + (-sh / 2) + 'px;width:' + sw + 'px;height:' + sh + 'px;box-sizing:border-box;padding:16px;background:' + perf + ';filter:drop-shadow(3px 4px 0 rgba(31,26,23,.35))">' +
      '<div style="position:relative;width:100%;height:100%;box-sizing:border-box;border:3px solid ' + INK + ';background:' + c.color + ';display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden">' +
      '<div style="filter:grayscale(.3) contrast(1.1)">' + c.head(120) + '</div>' +
      '<div style="position:absolute;right:8px;top:4px;' + FONT + 'font-size:24px;color:#FFF8EA;-webkit-text-stroke:1px ' + INK + '">1¢</div>' +
      '<div style="position:absolute;left:0;right:0;bottom:6px;text-align:center;font-family:var(--serif,Georgia,serif);font-style:italic;font-size:14px;color:#FFF8EA">Round Winner</div></div></div>', 10);
    c.path(stamp, [{ t: 0, x: x, y: y - 500, r: -10 }, { t: 250, x: x, y: y - 500, r: -10 }, { t: 600, x: x, y: y, r: -3, e: 'steps(3,end)' }, { t: 5200, x: x, y: y, r: -3 }], { jerky: false });
    c.sfx(600, function () { noise(0.06, 0, 0.12, 2000, 'bandpass'); });
    c.say('Commemorative.', x, y - sh / 2 + 10, 900, 2200, 50); c.talk(stamp, 900, 2000);
    // the postmark: a ring with tonight's date and wavy lines, thumped across a corner of the face
    var pm = c.add('<svg viewBox="0 0 260 110" width="260" style="position:absolute;left:-130px;top:-55px;overflow:visible;opacity:.85"><g fill="none" stroke="' + INK + '" stroke-width="4">' +
      '<circle cx="55" cy="55" r="44"/><circle cx="55" cy="55" r="34" stroke-width="2"/>' +
      '<path d="M108 30 q16 -10 32 0 t32 0 t32 0 t32 0 M108 55 q16 -10 32 0 t32 0 t32 0 t32 0 M108 80 q16 -10 32 0 t32 0 t32 0 t32 0"/></g>' +
      '<text x="55" y="52" text-anchor="middle" font-family="Libre Caslon Text,Georgia,serif" font-size="13" fill="' + INK + '">TONIGHT</text><text x="55" y="68" text-anchor="middle" font-family="Libre Caslon Text,Georgia,serif" font-size="10" fill="' + INK + '">GAME NIGHT</text></svg>', 12);
    c.path(pm, [{ t: 0, x: x + 30, y: y - 40, o: 0, s: 1.4, r: -12 }, { t: 2699, x: x + 30, y: y - 40, o: 0, s: 1.4, r: -12 }, { t: 2700, x: x + 30, y: y - 40, o: 1, s: 1, r: -12 }], { jerky: 1 });
    c.sfx(2700, function () { noise(0.12, 0, 0.15, 500, 'lowpass'); tone(110, 0.2, 0, 'sine', 0.06, 70); });
    c.shake(2700, 200); c.buzz(2700, 40);
    c.say('…Lightly used.', x, y - sh / 2 + 10, 3500, 5150, 50); c.talk(stamp, 3500, 4800);
  } });

  /* ════════ 12. Cover Star ════════ */
  add({ name: 'Cover Star', tag: 'Exclusive: “I did it for the points.”', run: function (c) {
    c.sky('radial-gradient(ellipse at 50% 42%,#F6F1E7,#B9B0A2 78%)');
    var W = c.W, H = c.H, x = W / 2, fy = H - 140;
    var L = 22, T = 66, CW = W - 44, CH = fy - T;
    // the studio, before the cover lands: two cameras
    var cam1 = emo(c, '📸', 46, 30), cam2 = emo(c, '📸', 46, 30);
    var flashes = [450, 850, 1250, 1650, 2050, 2450];   // >= 400ms apart: never more than 3 flashes a second
    var c1 = [{ t: 0, x: 34, y: 300 }], c2 = [{ t: 0, x: W - 34, y: 380, sx: -1 }];
    flashes.forEach(function (f) { c1.push({ t: f, x: 34, y: 300, s: 1.25 }, { t: f + 120, x: 34, y: 300 }); c2.push({ t: f, x: W - 34, y: 380, sx: -1.25, sy: 1.25 }, { t: f + 120, x: W - 34, y: 380, sx: -1 }); });
    c1.push({ t: 2599, x: 34, y: 300, o: 1 }, { t: 2600, x: 34, y: 300, o: 0 }); c2.push({ t: 2599, x: W - 34, y: 380, sx: -1, o: 1 }, { t: 2600, x: W - 34, y: 380, o: 0 });
    c.path(cam1, c1, { jerky: 1 }); c.path(cam2, c2, { jerky: 1 });
    // each flash is a burst of light at the camera that fired (alternating), not a full-screen strobe
    var burst = function (bx, by, at) { var b = c.add('<div style="position:absolute;left:-70px;top:-70px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,#fff 0,rgba(255,255,255,.85) 22%,rgba(255,255,255,0) 70%)"></div>', 31); place(b, bx, by); c.anim(b, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { dur: 260, at: at }); };
    flashes.forEach(function (f, n) { if (n % 2) burst(W - 34, 380, f); else burst(34, 300, f); c.sfx(f, function () { noise(0.04, 0, 0.3, 4000, 'highpass'); tone(2200, 0.03, 30, 'square', 0.03); }); });
    // the cover
    var bg = c.add('<div style="width:' + CW + 'px;height:' + CH + 'px;box-sizing:border-box;background:linear-gradient(160deg,#FF5E7E,#FFB14A);border:5px solid ' + INK + ';box-shadow:6px 6px 0 ' + INK + '"></div>', 8);
    c.path(bg, [{ t: 0, x: L, y: T, o: 0 }, { t: 2599, x: L, y: T, o: 0 }, { t: 2600, x: L - 20, y: T - 30, s: 1.12, o: 1 }, { t: 2720, x: L, y: T, s: 1 }], { jerky: 2 });
    var mast = c.text('CAPTION', x, T + 50, 64, 2650, 0, 0);
    mast.style.letterSpacing = '2px';
    var strip = c.add('<div style="width:' + CW + 'px;box-sizing:border-box;background:#E8453A;border-top:3px solid ' + INK + ';border-bottom:3px solid ' + INK + ';text-align:center;' + FONT + 'font-size:20px;color:#fff;padding:5px 0;letter-spacing:1px">PERSON OF THE ROUND</div>', 25);
    c.path(strip, [{ t: 0, x: -W, y: T + 92, o: 1 }, { t: 2750, x: -W, y: T + 92 }, { t: 2950, x: L, y: T + 92 }], { jerky: 3 });
    var line = function (html, lx, ly, at, r, w) {
      var el = c.add('<div style="width:' + (w || 150) + 'px;' + FONT + 'color:' + INK + ';line-height:1.05;text-transform:uppercase">' + html + '</div>', 25);
      c.path(el, [{ t: 0, x: lx, y: ly, r: r, o: 0, s: 0.3 }, { t: at - 1, x: lx, y: ly, r: r, o: 0, s: 0.3 }, { t: at, x: lx, y: ly, r: r, o: 1, s: 1.15 }, { t: at + 120, x: lx, y: ly, r: r, s: 1 }], { jerky: 2 });
      c.sfx(at, c.snd.pop);
    };
    line('<span style="font-size:25px;color:#fff;-webkit-text-stroke:1.5px ' + INK + '">10 secrets</span><br><span style="font-size:15px">to being this funny</span>', L + 14, T + 150, 3000, -3, 160);
    line('<span style="font-size:15px">World exclusive:</span><br><span style="font-size:22px;color:#fff;-webkit-text-stroke:1.2px ' + INK + '">“I did it for the points”</span>', W - L - 164, T + 150, 3200, 3);
    line('<span style="font-size:14px">+ why everyone else lost</span>', L + 14, T + 262, 3400, -2, 130);
    var stick = c.add('<div style="position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;background:#FFE14D;border:3px solid ' + INK + ';text-align:center;' + FONT + 'font-size:15px;line-height:1;color:' + INK + ';display:flex;align-items:center;justify-content:center">100%<br>FUNNY</div>', 26);
    c.path(stick, [{ t: 0, x: W - 70, y: T + 330, o: 0, s: 0.2 }, { t: 3599, x: W - 70, y: T + 330, o: 0, s: 0.2 }, { t: 3600, x: W - 70, y: T + 330, o: 1, s: 1.3, r: -30 }, { t: 3750, x: W - 70, y: T + 330, s: 1, r: 12 }], { jerky: 2 });
    var bar = '';
    for (var bI = 0; bI < 18; bI++) bar += '<i style="display:inline-block;height:34px;width:' + (bI % 3 ? 2 : 4) + 'px;margin-right:2px;background:' + INK + '"></i>';
    var code = c.add('<div style="background:#fff;border:2px solid ' + INK + ';padding:4px 5px 2px;' + FONT + 'font-size:10px;color:' + INK + '">' + bar + '<div>$0.00</div></div>', 25);
    showAt(c, code, L + 12, fy - 74, 3400);
    // the star
    var p1 = c.puppet({ px: 136, w: 170, arms: 'wave' });
    var p2 = c.puppet({ px: 136, w: 170, arms: 'flex' });
    var top = fy - hTop(136, 170);
    var poseR = [0, -8, 8, -12, 6, -4, 10], pp = [{ t: 0, x: x, y: fy }];
    flashes.forEach(function (f, n) { pp.push({ t: f, x: x + (n % 2 ? 8 : -8), y: fy, r: poseR[n], sx: n % 2 ? -1 : 1 }); });
    pp.push({ t: 2599, x: x, y: fy, o: 1 }, { t: 2600, x: x, y: fy, o: 0 });
    c.path(p1, pp, { jerky: 1 });
    c.path(p2, [{ t: 0, x: x, y: fy, o: 0 }, { t: 2599, x: x, y: fy, o: 0 }, { t: 2600, x: x, y: fy, o: 1, s: 1.08 }, { t: 2750, x: x, y: fy, s: 1 }], { jerky: 2 });
    c.say('Get my good side.', x, top - 4, 150, 1300, 40);
    c.talk(p1, 150, 1250);
    c.say('They’re all good sides.', x, top - 4, 1450, 2550, 60);
    c.talk(p1, 1450, 2450);
    c.sfx(2600, c.snd.fanfare); c.shake(2600, 250); c.buzz(2600, [100, 40, 100]);
    c.sfx(3650, c.snd.crowd);
    c.say('No autographs.', x, top - 4, 4000, 5150, 50);
    c.talk(p2, 4000, 4800);
  } });

  /* ════════ 13. Mermaid ════════ */
  add({ name: 'Mermaid', tag: 'Ruler of the seas. Robbed by a bird.', run: function (c) {
    var W = c.W, H = c.H, sea = Math.round(H * 0.5);
    c.sky('linear-gradient(#FF9E6B,#FFD59A ' + sea + 'px,#2F7FB8 ' + sea + 'px)');
    c.add('<div style="width:70px;height:70px;border-radius:50%;background:#FFE14D;border:3px solid ' + INK + '"></div>', 1).style.transform = 'translate(' + (W - 110) + 'px,' + (sea - 70) + 'px)';
    c.add('<div style="width:' + W + 'px;height:' + (H - sea) + 'px;background:linear-gradient(#2F7FB8,#1E5A8A)"></div>', 2).style.transform = 'translate(0,' + sea + 'px)';
    var wav = function (y, z, col) {
      var d = 'M0 20'; for (var i = 0; i < 12; i++) d += ' Q' + (i * 40 + 20) + ' 0 ' + (i * 40 + 40) + ' 20';
      var el = c.add('<svg viewBox="0 0 480 30" width="' + (W + 90) + '" style="display:block;overflow:visible"><path d="' + d + ' L480 30 L0 30 Z" fill="' + col + '" ' + st(3) + '/></svg>', z);
      var p = []; for (var t = 0, n = 0; t <= 5200; t += 400, n++) p.push({ t: t, x: n % 2 ? -40 : 0, y: y });
      c.path(el, p, { jerky: 1 });
    };
    wav(sea - 18, 3, '#4E9ED1');
    var seat = H - 270, x = W / 2;
    var rock = c.add('<svg viewBox="0 0 260 170" width="260" style="position:absolute;left:-130px;top:-10px;overflow:visible"><path d="M8 170 Q0 90 40 40 Q80 4 130 8 Q190 4 226 44 Q262 90 252 170 Z" fill="#8A8F96" ' + st(5) + '/><path d="M60 60 Q80 40 110 46 M170 70 Q196 80 204 110" fill="none" stroke="#6E737A" stroke-width="5"/></svg>', 10);
    place(rock, x, seat - 6);
    var tail = '<g class="tail" style="transform-origin:50px 88px"><path d="M20 84 L80 84 Q88 120 120 126 L138 104 L146 132 L172 140 L142 148 L130 170 L116 140 Q60 152 26 124 Q12 106 20 84 Z" fill="#2E9E6B" ' + st(3) + '/>' +
      '<path d="M34 100 q8 8 16 0 M56 108 q8 8 16 0 M80 120 q8 8 16 0 M44 120 q8 8 16 0" fill="none" stroke="#1C6B48" stroke-width="3"/></g>';
    var mer = c.puppet({ px: 104, w: 110, arms: 'down', legs: 'none', shirt: '#7FD1AE', extra: tail });
    var ay = seat + 27, top = ay - hTop(104, 110);
    var mp = [{ t: 0, x: x, y: ay }];
    for (var t = 1500, n = 0; t < 2700; t += 150, n++) mp.push({ t: t, x: x, y: ay - (n % 2 ? 6 : 0) });
    mp.push({ t: 2700, x: x, y: ay }, { t: 4000, x: x, y: ay });
    for (t = 4000, n = 0; t < 5100; t += 130, n++) mp.push({ t: t, x: x, y: ay - (n % 2 ? 8 : 0), r: n % 2 ? 3 : -3 });
    c.path(mer, mp, { jerky: 1 });
    var tl = mer.querySelector('.tail');
    c.anim(tl, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-16deg)' }], { dur: 150, at: 1500, iterations: 8, direction: 'alternate', ease: 'steps(1)', fill: 'none' });
    c.anim(tl, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-20deg)' }], { dur: 120, at: 4000, iterations: 9, direction: 'alternate', ease: 'steps(1)', fill: 'none' });
    var tipX = x + 86, tipY = ay - 10;
    [1600, 2000, 2400, 4100, 4600].forEach(function (s) { c.burst(['💦', '💧'], tipX, tipY, 6, 70, s, 700, 50); c.sfx(s, function () { noise(0.25, 0, 0.3, 1200, 'lowpass'); }); });
    var crown = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);line-height:1">' + window.ccHeads.icon('👑', 46) + '</div>', 26);
    var cy = top + 14;
    var gull = c.add('<svg viewBox="0 0 100 70" width="100" style="position:absolute;left:-50px;top:-62px;overflow:visible">' +
      '<path d="M76 34 L98 24 L92 46 Z" fill="#fff" ' + st(3) + '/><ellipse cx="52" cy="38" rx="30" ry="14" fill="#fff" ' + st(4) + '/>' +
      '<circle cx="22" cy="26" r="12" fill="#fff" ' + st(3) + '/><circle cx="18" cy="23" r="2.6" fill="' + INK + '"/><path d="M12 17 L24 21" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M11 27 L-6 31 L11 35 Z" fill="#F2C94C" ' + st(2) + '/><circle cx="-2" cy="32" r="2.5" fill="#E8453A"/>' +
      '<path d="M44 50 L42 62 M58 50 L60 62" stroke="#F2A33A" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="gw" d="M38 34 Q56 -18 92 4 Q72 22 64 34 Z" fill="#B8C0CC" ' + st(3) + ' style="transform-box:fill-box;transform-origin:30% 100%"/></svg>', 28);
    var gp = [{ t: 0, x: W + 90, y: 110 }, { t: 2500, x: W + 90, y: 110 }, { t: 2900, x: W * 0.75, y: 200 }, { t: 3200, x: x + 4, y: cy - 40 },
      { t: 3300, x: x - 20, y: cy - 62, r: -10 }, { t: 3800, x: W * 0.2, y: 170, r: -15 }, { t: 4300, x: -150, y: 80, r: -15 }];
    c.path(gull, gp, { jerky: 2 });
    c.path(crown, [{ t: 0, x: x, y: cy }, { t: 3200, x: x, y: cy }, { t: 3300, x: x - 20, y: cy - 22, r: -10 }, { t: 3800, x: W * 0.2, y: 210, r: -15 }, { t: 4300, x: -150, y: 120, r: -15 }], { jerky: 2 });
    c.anim(gull.querySelector('.gw'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(-.5)' }], { dur: 120, at: 2500, iterations: 16, direction: 'alternate', ease: 'steps(1)', fill: 'none' });
    c.sfx(0, function () { noise(1.6, 0, 0.1, 500, 'lowpass'); });
    c.sfx(300, c.snd.ding);
    c.burst(['✨'], x, cy - 24, 6, 60, 300, 800, 20);
    c.say('I rule the seven seas.', x, top - 34, 200, 1450, 50);
    c.talk(mer, 200, 1400);
    var caw = function () { tone(1100, 0.22, 0, 'sawtooth', 0.04, 650); tone(1050, 0.25, 280, 'sawtooth', 0.04, 600); };
    c.sfx(2600, caw); c.sfx(3300, caw);
    c.buzz(3200, [80, 40, 80]);
    c.scream(mer, 3250, 3850);
    c.say('Give it back, you sky rat.', x, top - 6, 4000, 5150, 50);
    c.talk(mer, 4000, 4900);
  } });
})();
