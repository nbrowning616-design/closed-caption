/* Closed Caption — THE FINALE (finale.js)
   After the winner and the Grand Poobah: tonight's Gallery.
     1. Every caption framed tonight is shown. Two or more: everyone votes for the best (never their own).
     2. Caption of the Night: the ribbon, then off to the presses for mass production…
     3. …where something always goes wrong: one of 20 misprints, ending with the author's face
        crudely pasted into the cartoon (a cut-out cartoon version of their selfie).
     4. Recalled. The corrected edition: the untouched cartoon and their caption, memorialized.
   The misprint is only a gag; the Gallery keeps the clean original.
   Server: state.finale = { entries, voters, decided, myVote, canVote, winner, counts, tie, act, pressAt, best }.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, playerById, chipHtml, listNames, plural,
   tone, noise, buzz, big, bsfx, confetti, canRun, send, clockOffset, makeCardFrom, galleryGet, ccSync, ccHeads.
   CSS prefix: fp-. */
(function () {
  'use strict';
  var INK = '#1F1A17';

  /* Where the heads are in each cartoon: [x, y, r] — x and r as a fraction of the width, y of the height. Main character first. */
  var SPOTS = window.ccSpots || {};   // heads-spots.js
  var DEFAULT_SPOT = [[0.5, 0.3, 0.09]];

  var CSS = [
    /* ── the vote / memorial screen (inside the final scores page) ── */
    '.fp-wall{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:4px 0 14px;}',
    '.fp-wall.one{grid-template-columns:1fr;max-width:300px;margin-left:auto;margin-right:auto;}',
    '.fp-card{position:relative;display:block;width:100%;text-align:left;background:#FBF6EA;border:0;padding:9px;border-radius:4px;cursor:pointer;font:inherit;color:' + INK + ';',
    'box-shadow:0 0 0 3px #7a5513,0 0 0 6px #e9c86d,0 0 0 8px #8a6418,0 6px 14px rgba(0,0,0,.25);margin:8px;width:calc(100% - 16px);transition:transform .15s;}',
    '.fp-card:active{transform:scale(.97);}',
    '.fp-card[disabled]{cursor:default;}',
    '.fp-card.on{box-shadow:0 0 0 3px #7a5513,0 0 0 6px #ffe48a,0 0 0 8px #8a6418,0 0 0 12px var(--yellow,#FFD23F),0 8px 18px rgba(0,0,0,.3);transform:rotate(-1deg) scale(1.02);}',
    '.fp-card.own{opacity:.78;}',
    '.fp-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border:1px solid #cfc3a8;}',
    '.fp-card .fp-c{display:block;font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:14px;line-height:1.25;margin:8px 2px 4px;text-align:center;}',
    '.fp-card .fp-by{display:block;font-size:11.5px;font-weight:800;color:#6b5f52;text-align:center;}',
    '.fp-card .fp-tick{position:absolute;top:-6px;right:-6px;background:var(--yellow,#FFD23F);border:2.5px solid ' + INK + ';border-radius:999px;font-weight:900;font-size:12px;padding:2px 8px;display:none;}',
    '.fp-card.on .fp-tick{display:block;}',
    '.fp-lead{font-family:Georgia,serif;font-style:italic;font-size:15.5px;line-height:1.35;text-align:center;margin:2px 6px 12px;color:#4a4038;}',
    '.fp-foot{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:4px;}',
    '.fp-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}',
    '.fp-chips .fp-ch{opacity:.35;transition:opacity .2s;}',
    '.fp-chips .fp-ch.done{opacity:1;}',
    '.fp-memo{background:#FBF6EA;border-radius:4px;padding:12px;max-width:320px;margin:10px auto 16px;box-shadow:0 0 0 4px #7a5513,0 0 0 8px #e9c86d,0 0 0 11px #8a6418,0 10px 22px rgba(0,0,0,.28);text-align:center;color:' + INK + ';position:relative;}',
    '.fp-memo img{display:block;width:100%;border:1px solid #cfc3a8;}',
    '.fp-memo .fp-mc{font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:17px;line-height:1.3;margin:10px 4px 6px;}',
    '.fp-memo .fp-mby{font-size:12px;font-weight:800;color:#6b5f52;letter-spacing:.02em;}',
    '.fp-memo .fp-rib{position:absolute;top:-18px;right:-14px;width:62px;height:62px;}',

    /* ── the show (full screen, every phone at once) ── */
    '#fpress{position:fixed;inset:0;z-index:790;display:none;overflow:hidden;background:#14100D;color:#fff;font-family:var(--display,system-ui);}',
    '#fpress.on{display:block;}',
    '#fpress.out{opacity:0;transition:opacity .4s;}',
    '#fpress .fp-it{position:absolute;will-change:transform,opacity;}',
    '.fp-spot{position:absolute;left:50%;top:-10%;width:140vmax;height:140vmax;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(255,236,170,.32),rgba(255,236,170,0) 70%);pointer-events:none;}',
    '.fp-top{position:absolute;left:0;right:0;top:calc(18px + var(--sat,0px));text-align:center;z-index:30;}',
    '.fp-eye{font-size:12px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:#E9C86D;margin:0;}',
    '.fp-h{font-size:34px;line-height:1.02;font-weight:700;margin:6px 12px 0;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.5);}',
    '.fp-h.gold{background:linear-gradient(100deg,#b8862b 0%,#f9e6a6 28%,#fffbe8 40%,#e2b955 56%,#a8761e 80%,#f1d27c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 2px 8px rgba(0,0,0,.6));}',
    '.fp-h.red{color:#FF4A3D;text-shadow:3px 3px 0 #000;font-size:38px;}',
    '.fp-sub{font-size:15px;font-weight:700;color:#d9cfc0;margin:6px 16px 0;}',
    '.fp-piece{left:50%;top:50%;width:min(76vw,300px);margin-left:calc(min(76vw,300px) / -2);background:#FBF6EA;color:' + INK + ';padding:10px;border-radius:3px;box-shadow:0 0 0 4px #6b4b10,0 0 0 9px #e4c167,0 0 0 12px #8f6820,0 18px 40px rgba(0,0,0,.6);z-index:10;}',
    '.fp-piece img{display:block;width:100%;border:1px solid #cfc3a8;}',
    '.fp-piece .fp-pc{font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:16px;line-height:1.28;text-align:center;margin:9px 4px 2px;}',
    '.fp-ros{position:absolute;width:86px;height:86px;right:-30px;top:-34px;z-index:12;opacity:0;}',
    '.fp-name{left:0;right:0;bottom:calc(64px + var(--sab,0px));text-align:center;z-index:30;opacity:0;}',
    '.fp-name b{display:block;font-size:30px;color:#fff;}',
    '.fp-name span{display:block;font-size:14px;font-weight:700;color:#E9C86D;margin-top:4px;}',
    /* the press */
    '.fp-press{left:50%;bottom:-6px;width:340px;height:330px;margin-left:-170px;z-index:5;}',
    '.fp-plat{left:45px;top:36px;width:250px;height:70px;z-index:6;}',
    '.fp-count{left:0;right:0;top:calc(108px + var(--sat,0px));text-align:center;z-index:30;font-size:15px;font-weight:800;color:#E9C86D;letter-spacing:.06em;opacity:0;}',
    '.fp-count b{font-size:28px;color:#fff;display:block;letter-spacing:0;}',
    '.fp-sheet{left:50%;top:52%;width:120px;height:150px;margin-left:-60px;background:#FBF6EA;border:2px solid #cbbd9e;border-radius:2px;z-index:4;opacity:0;}',
    '.fp-sheet::before{content:"";position:absolute;left:12px;right:12px;top:12px;height:80px;background:#d6ccb8;}',
    '.fp-sheet::after{content:"";position:absolute;left:18px;right:18px;top:102px;height:6px;background:#bfb39b;box-shadow:0 12px 0 #bfb39b;}',
    '.fp-prop{font-size:64px;line-height:1;z-index:20;opacity:0;}',
    '.fp-say{left:0;right:0;text-align:center;z-index:25;font-size:26px;font-weight:700;color:#fff;-webkit-text-stroke:1.5px #000;paint-order:stroke fill;text-shadow:3px 3px 0 #000;opacity:0;padding:0 14px;}',
    '.fp-alarm{position:absolute;inset:0;z-index:2;background:radial-gradient(circle at 50% 40%,rgba(255,40,30,.0),rgba(255,40,30,.45));opacity:0;pointer-events:none;}',
    '#fpress.siren .fp-alarm{animation:fpSiren .5s steps(2) infinite;}',   /* 2 pulses a second: well under 3 */
    '@keyframes fpSiren{0%{opacity:.9}50%{opacity:.1}}',
    '#fpress.shake{animation:fpShake .09s linear infinite;}',
    '@keyframes fpShake{0%{transform:translate(0,0)}25%{transform:translate(-3px,2px)}50%{transform:translate(3px,-2px)}75%{transform:translate(-2px,-3px)}}',
    /* the misprint */
    '.fp-print{left:50%;top:50%;width:min(86vw,340px);margin-left:calc(min(86vw,340px) / -2);background:#FBF6EA;color:' + INK + ';padding:10px 10px 12px;border-radius:2px;box-shadow:0 16px 40px rgba(0,0,0,.6);z-index:15;opacity:0;}',
    '.fp-toon{position:relative;overflow:hidden;border:1px solid #cfc3a8;}',
    '.fp-toon>img{display:block;width:100%;}',
    '.fp-f{position:absolute;aspect-ratio:1/1.1;transform:translate(-50%,-50%) rotate(var(--rot,0deg)) scale(var(--sx,1),var(--sy,1));transform-origin:50% 50%;z-index:3;}',
    '.fp-f>img{display:block;width:100%;height:100%;filter:drop-shadow(1.5px 2px 0 rgba(0,0,0,.35));}',
    '.fp-f.px>img{image-rendering:pixelated;}',
    '.fp-f .fp-on{position:absolute;inset:0;width:100%;height:100%;overflow:visible;}',
    '.fp-f.slide{animation:fpSlide 4s cubic-bezier(.5,0,.9,.6) .3s forwards;}',
    '@keyframes fpSlide{to{transform:translate(-50%,40%) rotate(calc(var(--rot,0deg) + 24deg)) scale(1,1.15);}}',
    '.fp-f.zap{animation:fpZap .12s steps(2) infinite;}',
    '@keyframes fpZap{0%{margin-left:-2px}50%{margin-left:2px}}',
    '.fp-f.ghost{opacity:.45;filter:blur(2px);z-index:2;}',
    '.fp-f.tape::before,.fp-f.tape::after{content:"";position:absolute;width:70%;height:18%;background:rgba(240,232,200,.82);border:1px solid rgba(160,150,120,.6);z-index:4;}',
    '.fp-f.tape::before{left:-22%;top:6%;transform:rotate(-32deg);}',
    '.fp-f.tape::after{right:-24%;bottom:8%;transform:rotate(-28deg);}',
    '.fp-hole{position:absolute;transform:translate(-50%,-50%);border-radius:46% 54% 50% 48%;background:#111;z-index:3;box-shadow:0 0 0 5px #FBF6EA,0 0 0 7px #cbbd9e;overflow:hidden;}',
    '.fp-emo{position:absolute;transform:translate(-50%,-50%) rotate(var(--rot,0deg));line-height:1;z-index:5;}',
    '.fp-rays{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:repeating-conic-gradient(#FFC400 0 10deg,transparent 10deg 22deg);z-index:2;animation:fpSpin 6s linear infinite;}',
    '@keyframes fpSpin{to{transform:translate(-50%,-50%) rotate(360deg);}}',
    '.fp-cap2{font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:16px;line-height:1.28;text-align:center;margin:10px 4px 0;}',
    '.fp-stamp{position:absolute;left:60%;top:82%;z-index:9;transform:translate(-50%,-50%) rotate(-14deg);font-size:38px;font-weight:900;letter-spacing:.06em;color:#D7261E;border:5px solid #D7261E;border-radius:8px;padding:2px 14px;background:rgba(251,246,234,.35);opacity:0;mix-blend-mode:multiply;}',
    '.fp-why{left:0;right:0;bottom:calc(84px + var(--sab,0px));text-align:center;z-index:30;padding:0 18px;opacity:0;}',
    '.fp-why b{display:block;font-size:22px;line-height:1.1;color:#fff;}',
    '.fp-why span{display:block;font-size:14px;font-weight:700;color:#d9cfc0;margin-top:5px;}',
    /* the corrected edition */
    '.fp-final{left:50%;top:46%;width:min(80vw,310px);margin-left:calc(min(80vw,310px) / -2);background:#FBF6EA;color:' + INK + ';padding:11px 11px 12px;border-radius:3px;box-shadow:0 0 0 4px #6b4b10,0 0 0 9px #e4c167,0 0 0 12px #8f6820,0 18px 40px rgba(0,0,0,.6);z-index:16;opacity:0;text-align:center;}',
    '.fp-final img.t{display:block;width:100%;border:1px solid #cfc3a8;}',
    '.fp-final .fp-fc{font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:17px;line-height:1.3;margin:10px 4px 6px;}',
    '.fp-final .fp-fby{font-size:12.5px;font-weight:800;color:#6b5f52;}',
    '.fp-final .fp-fbest{font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#a8761e;margin-top:3px;}',
    '.fp-btns{left:16px;right:16px;bottom:calc(16px + var(--sab,0px));z-index:40;display:flex;gap:10px;opacity:0;}',
    '.fp-btns button{flex:1;padding-left:6px;padding-right:6px;font-size:14px;}',
    '#fpress.reduce *{animation-duration:.01s!important;}',
  ].join('\n');
  try { var st = document.createElement('style'); st.id = 'cc-finale-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); } catch (e) {}

  /* ── small helpers ── */
  function E(s) { try { return esc(s); } catch (e) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); } }
  function nm(pid, fallback) { try { return nameOf(pid) || fallback || 'Somebody'; } catch (e) { return fallback || 'Somebody'; } }
  function vib(p) { try { buzz(p); } catch (e) {} }
  function snd(fn) { try { if (typeof big === 'function') big(fn); } catch (e) {} }
  function T(f, d, t, ty, v, g) { try { tone(f, d, t || 0, ty || 'sine', v || 0.06, g || null); } catch (e) {} }
  function N(d, t, v, f, ty) { try { noise(d, t || 0, v || 0.15, f || 2500, ty || 'bandpass'); } catch (e) {} }
  function now() { try { return Date.now() + (clockOffset || 0); } catch (e) { return Date.now(); } }
  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function reduced() { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function spotsFor(image) { var all = window.ccSpots || SPOTS; return (all[image] && all[image].length) ? all[image] : DEFAULT_SPOT; }
  function rosetteSvg() {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<path d="M36 58 L22 98 L36 90 L44 102 L52 64Z" fill="#B2201B" stroke="' + INK + '" stroke-width="2"/>' +
      '<path d="M64 58 L78 98 L64 90 L56 102 L48 64Z" fill="#D7261E" stroke="' + INK + '" stroke-width="2"/>' +
      '<g transform="translate(50 44)">' + Array.from({ length: 16 }, function (_, i) { return '<path d="M0 -40 L7 -30 L-7 -30Z" fill="#E9C86D" stroke="#8a6418" stroke-width="1" transform="rotate(' + (i * 22.5) + ')"/>'; }).join('') +
      '<circle r="31" fill="#F3D989" stroke="#8a6418" stroke-width="2"/><circle r="24" fill="#D4A94A" stroke="#8a6418" stroke-width="1.5"/>' +
      '<text y="-4" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" fill="' + INK + '">CAPTION</text>' +
      '<text y="6" text-anchor="middle" font-family="Georgia,serif" font-size="7" font-style="italic" fill="' + INK + '">of the</text>' +
      '<text y="16" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" fill="' + INK + '">NIGHT</text></g></svg>';
  }

  /* ── The author, cartoonized: their selfie turned into a crude cut-out (posterized, inked, scissor-cut) ── */
  var faceCache = {};
  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image(); im.decoding = 'async';
      im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function isGray(im) {
    try {
      var c = document.createElement('canvas'); c.width = 32; c.height = 32;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0, 32, 32);
      var d = x.getImageData(0, 0, 32, 32).data, s = 0;
      for (var i = 0; i < d.length; i += 4) { var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); s += mx ? (mx - mn) / mx : 0; }
      return s / (d.length / 4) < 0.09;
    } catch (e) { return false; }
  }
  function cutPath(x, cx, cy, rx, ry, rnd, jag) {
    x.beginPath();
    var n = 22;
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2, k = 1 + (rnd() - 0.5) * jag;
      var px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k;
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.closePath();
  }
  // Returns a PNG data URL (transparent outside the cut). gray: match a black-and-white cartoon.
  function cartoonFace(pid, gray) {
    var key = pid + '|' + (gray ? 'g' : 'c');
    if (faceCache[key]) return faceCache[key];
    var url = null;
    try { url = window.ccHeads && window.ccHeads.faceUrl ? window.ccHeads.faceUrl(pid) : null; } catch (e) {}
    var p = loadImg(url).then(function (im) {
      var S = 220, c = document.createElement('canvas'); c.width = S; c.height = Math.round(S * 1.1);
      var x = c.getContext('2d'), H = c.height, rnd = seeded(String(pid).split('').reduce(function (a, ch) { return a * 31 + ch.charCodeAt(0) | 0; }, 7));
      var colour = '#E8453A'; try { colour = playerColor(getPlayerIndex(pid)); } catch (e) {}
      // the paper edge first (a sloppy scissor cut, white border, ink line)
      x.save(); cutPath(x, S / 2, H / 2, S / 2 - 11, H / 2 - 3, rnd, 0.1); x.fillStyle = '#FFFDF6'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); x.restore();
      x.save(); cutPath(x, S / 2, H / 2, S / 2 - 22, H / 2 - 13, rnd, 0.07); x.clip();
      if (im) {
        // cover-crop, a little high (faces sit in the upper middle of a headshot)
        var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, sc = Math.max(S / iw, H / ih) * 1.2;
        var dw = iw * sc, dh = ih * sc;
        x.drawImage(im, (S - dw) / 2, (H - dh) * 0.42, dw, dh);
        try {
          var d = x.getImageData(0, 0, S, H), px = d.data, L = new Float32Array(S * H), i, j;
          for (i = 0, j = 0; i < px.length; i += 4, j++) L[j] = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
          var lv = gray ? 4 : 5, step = 255 / (lv - 1);
          for (i = 0, j = 0; i < px.length; i += 4, j++) {
            var yy = (j / S) | 0, xx = j % S, e = 0;
            if (xx > 0 && xx < S - 1 && yy > 0 && yy < H - 1) {
              var gx = L[j + 1] - L[j - 1], gy = L[j + S] - L[j - S];
              e = Math.abs(gx) + Math.abs(gy);
            }
            if (gray) { var g = Math.round(L[j] / step) * step; px[i] = px[i + 1] = px[i + 2] = g; }
            else {
              for (var k = 0; k < 3; k++) {
                var v = px[i + k], m = (px[i] + px[i + 1] + px[i + 2]) / 3;
                v = m + (v - m) * 1.35;                        // a bit louder, like a cheap print
                px[i + k] = Math.max(0, Math.min(255, Math.round(v / step) * step));
              }
            }
            if (e > 46) { px[i] = px[i + 1] = px[i + 2] = 28; }   // ink the edges
          }
          x.putImageData(d, 0, 0);
        } catch (e) { /* a tainted canvas just keeps the photo */ }
      } else {
        // no selfie: a crude drawn face in their chip colour
        x.fillStyle = colour; x.fillRect(0, 0, S, H);
        x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 4;
        [[S * 0.36, H * 0.42], [S * 0.64, H * 0.42]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 20, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(p[0] + 4, p[1] + 3, 8, 0, 7); x.fill(); x.fillStyle = '#fff'; });
        x.beginPath(); x.arc(S / 2, H * 0.66, 34, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      }
      x.restore();
      // the inner cut line, drawn over the photo so it reads as glued on
      x.save(); cutPath(x, S / 2, H / 2, S / 2 - 22, H / 2 - 13, seeded(3), 0.07); x.lineWidth = 2; x.strokeStyle = 'rgba(31,26,23,.55)'; x.stroke(); x.restore();
      return c.toDataURL('image/png');
    }).catch(function () { return null; });
    faceCache[key] = p;
    return p;
  }
  // The same face, run through a cheap 'Enhance' (big pixels)
  function pixelFace(src) {
    return loadImg(src).then(function (im) {
      if (!im) return src;
      var s = document.createElement('canvas'); s.width = 13; s.height = 14; var a = s.getContext('2d'); a.drawImage(im, 0, 0, 13, 14);
      var c = document.createElement('canvas'); c.width = 130; c.height = 140; var b = c.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(s, 0, 0, 130, 140);
      return c.toDataURL('image/png');
    });
  }

  /* ── The misprint: the cartoon with the face(s) on it. mode decides where and how. ── */
  var STACHE = '<svg class="fp-on" viewBox="0 0 100 110" aria-hidden="true"><path d="M22 36 Q36 26 50 34 Q64 26 78 36" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round"/><path d="M28 70 Q38 60 50 68 Q62 60 72 70 Q64 80 50 72 Q36 80 28 70Z" fill="#111"/><path d="M70 14 l6 -10 M78 18 l10 -6" stroke="#111" stroke-width="3"/></svg>';
  var SHADES = '<svg class="fp-on" viewBox="0 0 100 110" aria-hidden="true"><path d="M12 40 H88" stroke="#111" stroke-width="5"/><rect x="16" y="38" width="30" height="20" rx="8" fill="#111"/><rect x="54" y="38" width="30" height="20" rx="8" fill="#111"/><path d="M22 42 l8 0" stroke="#fff" stroke-width="3" opacity=".7"/></svg>';
  var HAT = '<svg class="fp-on" viewBox="0 0 100 110" aria-hidden="true" style="overflow:visible"><path d="M8 18 Q50 -22 92 18 Q50 10 8 18Z" fill="#fff" stroke="#111" stroke-width="3"/><rect x="10" y="14" width="80" height="10" rx="4" fill="#111"/><path d="M14 24 Q50 34 86 24 L84 30 Q50 40 16 30Z" fill="#111"/><circle cx="50" cy="2" r="7" fill="#E9C86D" stroke="#111" stroke-width="2"/></svg>';
  var SPIKES = '<svg class="fp-on" viewBox="0 0 100 110" aria-hidden="true" style="overflow:visible">' + [[-60, 12], [-40, 2], [-20, -6], [0, -10], [20, -6], [40, 2], [60, 12]].map(function (p) { var a = p[0] * Math.PI / 180; return '<path d="M' + (50 + Math.sin(a) * 40) + ' ' + (55 - Math.cos(a) * 46) + ' L' + (50 + Math.sin(a) * 72) + ' ' + (55 - Math.cos(a) * 82) + '" stroke="#111" stroke-width="4" stroke-linecap="round"/>'; }).join('') + '<path d="M86 10 l-8 14 h9 l-10 16" fill="none" stroke="#FFC400" stroke-width="4"/></svg>';
  function faceEl(sp, face, o) {
    o = o || {};
    var k = o.k || 1.35, w = sp[2] * 2 * k * 100;
    var style = 'left:' + ((o.x != null ? o.x : sp[0]) * 100) + '%;top:' + ((o.y != null ? o.y : sp[1]) * 100) + '%;width:' + w + '%;--rot:' + (o.rot || 0) + 'deg;' + (o.sx ? '--sx:' + o.sx + ';' : '') + (o.sy ? '--sy:' + o.sy + ';' : '') + (o.style || '');
    return '<div class="fp-f ' + (o.cls || '') + '" style="' + style + '"><img src="' + face + '" alt="" draggable="false">' + (o.over || '') + '</div>';
  }
  function emo(ch, x, y, size, rot) { return '<span class="fp-emo" style="left:' + (x * 100) + '%;top:' + (y * 100) + '%;font-size:' + size + 'px;--rot:' + (rot || 0) + 'deg">' + ch + '</span>'; }
  function overlayFor(mode, spots, face, pix, rnd) {
    var m = spots[0], h = '';
    var tilt = function () { return Math.round((rnd() - 0.5) * 24); };
    switch (mode) {
      case 'all': spots.forEach(function (s) { h += faceEl(s, face, { rot: tilt() }); }); break;
      case 'upside': h = faceEl(m, face, { rot: 180 + tilt() / 3 }); break;
      case 'slide': h = faceEl(m, face, { rot: tilt(), cls: 'slide' }); break;
      case 'smudge': h = faceEl(m, face, { cls: 'ghost', x: m[0] + m[2] * 0.5, y: m[1] + 0.02, rot: 8 }) + faceEl(m, face, { cls: 'ghost', x: m[0] - m[2] * 0.4, y: m[1] - 0.015, rot: -10 }) + faceEl(m, face, { rot: tilt() }); break;
      case 'tape': h = faceEl(m, face, { rot: tilt(), cls: 'tape' }); break;
      case 'mustache': h = faceEl(m, face, { rot: tilt(), over: STACHE }); break;
      case 'pixel': h = faceEl(m, pix || face, { k: 2.1, cls: 'px', rot: 0 }); break;
      case 'shades': h = faceEl(m, face, { rot: tilt(), over: SHADES }) + emo('✨', m[0] + m[2] * 1.6, m[1] - m[2] * 0.9, 26) + emo('✨', m[0] - m[2] * 1.7, m[1] + m[2] * 0.4, 18); break;
      case 'captain': h = faceEl(m, face, { rot: tilt(), over: HAT }); break;
      case 'static': h = faceEl(m, face, { rot: tilt(), over: SPIKES, cls: 'zap' }); break;
      case 'shoe': h = faceEl(m, face, { rot: 28 }) + '<span class="fp-emo" style="left:' + ((m[0] + 0.02) * 100) + '%;top:' + ((m[1] + 0.01) * 100) + '%;font-size:70px;--rot:-35deg;opacity:.55;filter:grayscale(1) contrast(2);">👟</span>'; break;
      case 'paws': h = faceEl(m, face, { rot: tilt() }); for (var i = 0; i < 7; i++) h += emo('🐾', 0.1 + i * 0.13, 0.85 - i * 0.1 + (i % 2) * 0.05, 26, 20 + i * 8); break;
      case 'twins': h = faceEl(m, face, { k: 1.15, x: m[0] - m[2] * 0.62, rot: -6 }) + faceEl(m, face, { k: 1.15, x: m[0] + m[2] * 0.62, rot: 6, sx: -1 }); break;
      case 'sun': h = '<div class="fp-rays" style="left:84%;top:13%;width:34%;aspect-ratio:1"></div>' + faceEl([0.84, 0.13, 0.085], face, { k: 1.1 }); break;
      case 'wallpaper':
        for (var r = 0; r < 6; r++) for (var c = 0; c < 5; c++) h += faceEl([0.1 + c * 0.2, 0.08 + r * 0.17, 0.035], face, { k: 1, rot: (r + c) % 2 ? 12 : -12, style: 'opacity:.85;' });
        h += faceEl(m, face, { rot: tilt() }); break;
      case 'huge': h = faceEl(m, face, { k: 3.4, rot: tilt() / 2 }); break;
      case 'tiny': h = faceEl(m, face, { k: 0.42, rot: tilt() }) + emo('🔍', m[0] + m[2] * 1.4, m[1] + m[2] * 1.2, 34, -20); break;
      case 'stretch': h = faceEl(m, face, { k: 1.25, sy: 1.9, rot: 0, y: m[1] + m[2] * 0.7 }); break;
      case 'hole': h = '<div class="fp-hole" style="left:' + (m[0] * 100) + '%;top:' + (m[1] * 100) + '%;width:' + (m[2] * 2.6 * 100) + '%;aspect-ratio:1/1.05">' + '<img src="' + face + '" alt="" style="width:100%;height:100%;object-fit:cover;transform:scale(1.15) translateY(8%)"></div>'; break;
      default: h = faceEl(m, face, { rot: tilt() }); break;
    }
    return h;
  }
  function misprintHtml(entry, mode, face, pix, seed) {
    return '<div class="fp-toon"><img src="/images/' + E(entry.image) + '" alt="">' + (face ? overlayFor(mode, spotsFor(entry.image), face, pix, seeded(seed || 1)) : '') + '</div>' +
      '<p class="fp-cap2">“' + E(entry.caption) + '”</p><div class="fp-stamp">MISPRINT</div>';
  }

  /* ── The misprint as a picture to save or text (1080×1350), drawn from the same overlay the show uses ── */
  function svgImg(svgEl) {
    try {
      var x = svgEl.cloneNode(true); x.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); x.removeAttribute('class');
      return loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(x)));
    } catch (e) { return Promise.resolve(null); }
  }
  function num(v, d) { var n = parseFloat(v); return isFinite(n) ? n : d; }
  function wrap(x, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
  function misprintBlob(entry, mode, face, pix, seed, act, who, best) {
    var W = 1080, H = 1350, SERIF = '"Libre Caslon Text", Georgia, serif';
    return Promise.all([loadImg('/images/' + entry.image), loadImg(face), loadImg(pix || face)]).then(function (r) {
      var toon = r[0], fImg = r[1], pImg = r[2];
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      x.fillStyle = '#FBF6EA'; x.fillRect(0, 0, W, H);
      // the cartoon box: as wide as fits, never taller than 860
      var bw = 940, ar = toon ? (toon.naturalHeight / toon.naturalWidth) : 1, bh = Math.round(bw * ar);
      if (bh > 860) { bh = 860; bw = Math.round(bh / ar); }
      var bx = Math.round((W - bw) / 2), by = 70;
      if (toon) x.drawImage(toon, bx, by, bw, bh);
      x.strokeStyle = '#cfc3a8'; x.lineWidth = 2; x.strokeRect(bx, by, bw, bh);
      var k = bw / 320;   // the show's print is ~320px wide: emoji sizes scale from it
      x.save(); x.beginPath(); x.rect(bx, by, bw, bh); x.clip();
      var holder = document.createElement('div');
      holder.innerHTML = fImg ? overlayFor(mode, spotsFor(entry.image), face, pix, seeded(seed || 1)) : '';
      var jobs = [];
      Array.prototype.forEach.call(holder.children, function (el) {
        var st = el.style, cx = bx + num(st.left, 50) / 100 * bw, cy = by + num(st.top, 30) / 100 * bh;
        var rot = num(st.getPropertyValue('--rot'), 0) * Math.PI / 180;
        if (el.classList.contains('fp-f')) {
          var w = num(st.width, 20) / 100 * bw, h = w * 1.1, sx = num(st.getPropertyValue('--sx'), 1), sy = num(st.getPropertyValue('--sy'), 1);
          var over = el.querySelector('svg');
          jobs.push((over ? svgImg(over) : Promise.resolve(null)).then(function (ov) {
            return function () {
              x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sx, sy);
              if (el.classList.contains('slide')) x.rotate(0.35);
              if (el.classList.contains('ghost')) { x.globalAlpha = 0.45; try { x.filter = 'blur(4px)'; } catch (e) {} }
              if (el.style.opacity) x.globalAlpha = num(el.style.opacity, 1);
              x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowOffsetX = 3; x.shadowOffsetY = 4;
              var src = el.classList.contains('px') ? pImg : fImg;
              if (el.classList.contains('px')) x.imageSmoothingEnabled = false;
              if (src) x.drawImage(src, -w / 2, -h / 2, w, h);
              x.shadowColor = 'transparent'; x.imageSmoothingEnabled = true;
              if (ov) x.drawImage(ov, -w / 2, -h / 2, w, h);
              if (el.classList.contains('tape')) { x.fillStyle = 'rgba(240,232,200,.85)'; x.save(); x.translate(-w * 0.3, -h * 0.38); x.rotate(-0.56); x.fillRect(-w * 0.35, -h * 0.09, w * 0.7, h * 0.18); x.restore(); x.save(); x.translate(w * 0.32, h * 0.33); x.rotate(-0.49); x.fillRect(-w * 0.35, -h * 0.09, w * 0.7, h * 0.18); x.restore(); }
              x.restore();
            };
          }));
        } else if (el.classList.contains('fp-emo')) {
          var fs = num(st.fontSize, 26) * k;
          jobs.push(Promise.resolve(function () { x.save(); x.translate(cx, cy); x.rotate(rot); if (st.opacity) x.globalAlpha = num(st.opacity, 1); if (/grayscale/.test(st.filter || '')) { try { x.filter = 'grayscale(1) contrast(2)'; } catch (e) {} } x.font = fs + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(el.textContent, 0, 0); x.restore(); }));
        } else if (el.classList.contains('fp-rays')) {
          var rr = num(st.width, 30) / 100 * bw / 2;
          jobs.push(Promise.resolve(function () { x.save(); x.translate(cx, cy); x.fillStyle = '#FFC400'; for (var i = 0; i < 16; i++) { x.rotate(Math.PI * 2 / 16); x.beginPath(); x.moveTo(0, 0); x.lineTo(rr * Math.cos(-0.1), rr * Math.sin(-0.1)); x.lineTo(rr * Math.cos(0.1), rr * Math.sin(0.1)); x.closePath(); x.fill(); } x.restore(); }));
        } else if (el.classList.contains('fp-hole')) {
          var hw = num(st.width, 20) / 100 * bw, hh = hw * 1.05;
          jobs.push(Promise.resolve(function () {
            x.save(); x.translate(cx, cy);
            x.beginPath(); x.ellipse(0, 0, hw / 2 + 9, hh / 2 + 9, 0, 0, 7); x.fillStyle = '#cbbd9e'; x.fill();
            x.beginPath(); x.ellipse(0, 0, hw / 2 + 6, hh / 2 + 6, 0, 0, 7); x.fillStyle = '#FBF6EA'; x.fill();
            x.beginPath(); x.ellipse(0, 0, hw / 2, hh / 2, 0, 0, 7); x.fillStyle = '#111'; x.fill(); x.clip();
            if (fImg) x.drawImage(fImg, -hw * 0.58, -hh * 0.5, hw * 1.16, hh * 1.27);
            x.restore();
          }));
        }
      });
      return Promise.all(jobs).then(function (draws) {
        draws.forEach(function (d) { try { d(); } catch (e) {} });
        x.restore();
        // MISPRINT, stamped across the cartoon
        x.save(); x.translate(W / 2 + bw * 0.12, by + bh * 0.84); x.rotate(-0.18); x.globalAlpha = 0.85;
        x.font = '900 92px "Fredoka", "Arial Black", Impact, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        var tw = x.measureText('MISPRINT').width; x.strokeStyle = '#D7261E'; x.lineWidth = 14; x.strokeRect(-tw / 2 - 24, -62, tw + 48, 124);
        x.fillStyle = '#D7261E'; x.fillText('MISPRINT', 0, 6); x.restore();
        // the caption, untouched, underneath
        var y = by + bh + 70;
        x.fillStyle = '#1C1A17'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
        var fsz = entry.caption.length > 110 ? 38 : entry.caption.length > 60 ? 44 : 50;
        x.font = 'italic ' + fsz + 'px ' + SERIF;
        wrap(x, '“' + entry.caption + '”', 900).slice(0, 4).forEach(function (ln) { x.fillText(ln, W / 2, y); y += fsz * 1.25; });
        x.font = '700 30px ' + SERIF; x.fillStyle = '#5E574C';
        x.fillText('Caption by ' + who + (best ? ' · ' + best : ''), W / 2, Math.min(H - 110, y + 20));
        x.font = 'italic 28px ' + SERIF; x.fillStyle = '#B2201B';
        x.fillText('Misprint: ' + act, W / 2, H - 60);
        return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); });
      });
    });
  }

  /* ── The 20 misprints. Each: what went wrong (scene, ~2.6s at the press), where the face ends up (mode),
     and the line under the misprint. {n} = the author's name. ── */
  var ACTS = [
    { mode: 'tape', line: 'The intern “fixed” the plate with a photo of {n}.', sub: 'And a lot of tape.', props: ['🧑‍💼', '📎'], say: 'I can fix this.' },
    { mode: 'main', line: 'A pigeon got into the pressroom.', sub: 'It had opinions about {n}.', props: ['🐦', '🐦'], say: 'COO.' },
    { mode: 'smudge', line: 'Somebody sneezed on the plate.', sub: 'Mid-print. Bless them.', props: ['🤧'], say: 'Ah… ah… AH-CHOO!' },
    { mode: 'upside', line: 'The plate went in upside down.', sub: 'Nobody noticed for 40,000 copies.', props: ['🙃'], say: 'Looks fine to me.' },
    { mode: 'slide', line: 'The ink was mostly glue.', sub: '{n} is still sliding.', props: ['🧴'], say: 'It’s “archival.”' },
    { mode: 'all', line: 'Budget cuts.', sub: 'The press can afford one face. It’s {n}’s.', props: ['💸', '✂️'], say: 'Everybody is {n} now.' },
    { mode: 'mustache', line: 'The art director had notes.', sub: 'In permanent marker.', props: ['🖍️'], say: 'Needs more… authority.' },
    { mode: 'pixel', line: 'Someone hit “Enhance” eleven times.', sub: 'It did not enhance.', props: ['🔍'], say: 'ENHANCE. ENHANCE. ENHANCE.' },
    { mode: 'shades', line: 'It printed as the Celebrity Edition.', sub: '{n} has a publicist now.', props: ['📸', '📸'], say: 'No photos! …okay one.' },
    { mode: 'captain', line: 'Spellcheck changed “caption” to “captain.”', sub: 'Permission to come aboard, {n}.', props: ['⚓'], say: 'Aye aye.' },
    { mode: 'static', line: 'Static electricity in the pressroom.', sub: '{n} has been through a lot.', props: ['⚡', '⚡'], say: 'Zzzzt.' },
    { mode: 'shoe', line: 'Paper jam. Somebody kicked it.', sub: 'The press kicked back.', props: ['🦶'], say: 'Come ON.' },
    { mode: 'paws', line: 'The office cat walked across the plate.', sub: 'Then sat on {n}.', props: ['🐈'], say: 'Mrrp.' },
    { mode: 'twins', line: 'Someone loaded the mirror plate.', sub: 'Two {n}s. Twice the genius.', props: ['🪞'], say: 'Double it.' },
    { mode: 'sun', line: 'The press mistook {n} for the sun.', sub: 'An easy mistake. Very bright.', props: ['☀️'], say: 'Good morning!' },
    { mode: 'wallpaper', line: 'The night shift fell asleep on the button.', sub: '1,000,000 copies. Of {n}.', props: ['😴'], say: 'Zzzz…' },
    { mode: 'huge', line: 'The camera was stuck in portrait mode.', sub: 'Very portrait. Mostly {n}.', props: ['📷'], say: 'Closer… closer…' },
    { mode: 'tiny', line: 'Someone set the face size to “conservative.”', sub: 'Squint. That’s {n}.', props: ['🔬'], say: 'Where’d they go?' },
    { mode: 'stretch', line: 'The press warped in the heat.', sub: '{n} grew a little.', props: ['🔥', '🌡️'], say: 'Is it hot in here?' },
    { mode: 'hole', line: 'There was a small hole in the paper.', sub: '{n} has been watching the whole time.', props: ['👀'], say: '…' },
  ];

  /* ── The show ── */
  var root = null, timers = [], playing = null, doneFor = null;
  function later(ms, fn) { timers.push(setTimeout(function () { try { fn(); } catch (e) { console.warn('finale', e); } }, Math.max(0, ms))); }
  function anim(el, kf, o) { try { if (el && el.animate) return el.animate(kf, o); } catch (e) {} return null; }
  function show(el, ms, kf) { if (!el) return; anim(el, kf || [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: ms || 300, fill: 'forwards', easing: 'cubic-bezier(.2,1.4,.4,1)' }); }
  function hide(el, ms) { if (!el) return; anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: ms || 250, fill: 'forwards' }); }
  function overlay() {
    root = document.getElementById('fpress');
    if (!root) { root = document.createElement('div'); root.id = 'fpress'; (document.body || document.documentElement).appendChild(root); }
    return root;
  }
  function close() {
    timers.forEach(clearTimeout); timers = []; playing = null;
    if (root) { root.className = ''; root.innerHTML = ''; }
  }
  var S = {   // sounds (the speaker phone only)
    fan: function () { snd(function () { [[523, 0, .16], [659, 160, .16], [784, 320, .16], [1047, 480, .7]].forEach(function (a) { T(a[0], a[2], a[1], 'square', 0.04); T(a[0], a[2] + .2, a[1], 'triangle', 0.06); }); [523, 659, 784, 1047].forEach(function (f) { T(f, 1.6, 480, 'triangle', 0.04); }); }); },
    thunk: function () { snd(function () { T(90, 0.25, 0, 'sine', 0.3, 50); N(0.12, 0, 0.25, 600, 'lowpass'); }); },
    kachunk: function () { snd(function () { N(0.08, 0, 0.35, 1800); T(70, 0.3, 30, 'square', 0.12, 40); N(0.2, 60, 0.2, 400, 'lowpass'); T(1200, 0.05, 220, 'square', 0.03); }); },
    whoosh: function () { snd(function () { N(0.35, 0, 0.12, 3000, 'highpass'); }); },
    siren: function () { snd(function () { for (var i = 0; i < 4; i++) { T(660, 0.19, i * 380, 'sawtooth', 0.05, 880); T(880, 0.19, i * 380 + 190, 'sawtooth', 0.05, 660); } }); },
    screech: function () { snd(function () { T(1400, 0.6, 0, 'sawtooth', 0.04, 300); N(0.5, 0, 0.15, 3500); }); },
    stamp: function () { snd(function () { T(110, 0.3, 0, 'sine', 0.35, 60); N(0.18, 0, 0.3, 900, 'lowpass'); }); },
    womp: function () { snd(function () { T(392, 0.35, 0, 'triangle', 0.08, 370); T(370, 0.35, 380, 'triangle', 0.08, 349); T(349, 0.35, 760, 'triangle', 0.08, 330); T(330, 0.9, 1140, 'triangle', 0.08, 300); }); },
    chime: function () { snd(function () { [1047, 1319, 1568, 2093].forEach(function (f, i) { T(f, 0.5, i * 110, 'sine', 0.05); }); }); },
    pop: function () { snd(function () { T(600, 0.08, 0, 'square', 0.05, 1200); }); },
  };
  function pressSvg() {
    return '<svg viewBox="0 0 340 330" width="340" height="330" aria-hidden="true">' +
      '<rect x="40" y="20" width="22" height="300" fill="#3a2f28" stroke="#000" stroke-width="3"/><rect x="278" y="20" width="22" height="300" fill="#3a2f28" stroke="#000" stroke-width="3"/>' +
      '<rect x="30" y="10" width="280" height="26" rx="6" fill="#4a3c33" stroke="#000" stroke-width="3"/>' +
      '<rect x="60" y="210" width="220" height="40" fill="#5c4a3e" stroke="#000" stroke-width="3"/><rect x="72" y="200" width="196" height="12" fill="#2a221d"/>' +
      '<rect x="20" y="300" width="300" height="30" fill="#2a221d" stroke="#000" stroke-width="3"/>' +
      '<g class="fp-wheel" style="transform-origin:318px 120px"><circle cx="318" cy="120" r="44" fill="none" stroke="#7a6252" stroke-width="8"/>' + [0, 45, 90, 135].map(function (a) { return '<line x1="318" y1="76" x2="318" y2="164" stroke="#7a6252" stroke-width="6" transform="rotate(' + a + ' 318 120)"/>'; }).join('') + '<circle cx="318" cy="120" r="8" fill="#E9C86D"/></g>' +
      '<text x="170" y="236" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="13" fill="#E9C86D" letter-spacing="3">THE GALLERY PRESS</text></svg>';
  }
  function platenSvg() { return '<svg viewBox="0 0 250 70" width="250" height="70" aria-hidden="true"><rect x="110" y="0" width="30" height="34" fill="#7a6252" stroke="#000" stroke-width="3"/><rect x="0" y="30" width="250" height="40" rx="4" fill="#6b574a" stroke="#000" stroke-width="3"/><rect x="10" y="60" width="230" height="8" fill="#111"/></svg>'; }

  // f = state.finale (with a winner). wait: ms until it starts on the server clock (0 if it's already going); late: how far in we are
  function play(f, wait, late) {
    if (!f || !f.winner) return;
    var entry = (f.entries || []).filter(function (e) { return e.key === f.winner; })[0];
    if (!entry) return;
    var tag = (state && state.code) + '|' + f.pressAt;
    if (playing === tag) return;
    close();
    playing = tag;
    var o = overlay();
    var act = ACTS[((f.act | 0) % ACTS.length + ACTS.length) % ACTS.length];
    var who = entry.writerName || nm(entry.writerId), mine = entry.writerId === (window.myPlayerId || (typeof myPlayerId !== 'undefined' ? myPlayerId : null));
    var fill = function (s) { return String(s).replace(/\{n\}/g, who); };
    var votes = f.counts ? (f.counts[entry.key] || 0) : 0, many = (f.entries || []).length > 1;
    var subLine = !many ? 'The only frame tonight — and it earned it.' : f.tie ? 'A tie on the votes. The press flipped a coin.' : (votes === 1 ? '1 vote' : votes + ' votes') + ' from the table';
    var seed = String(f.pressAt).split('').reduce(function (a, ch) { return a * 31 + ch.charCodeAt(0) | 0; }, 5);
    var imgUrl = '/images/' + E(entry.image);
    o.className = 'on' + (reduced() ? ' reduce' : '');
    o.innerHTML =
      '<div class="fp-spot"></div><div class="fp-alarm"></div>' +
      '<div class="fp-top"><p class="fp-eye" id="fp-eye">Tonight’s Gallery</p><div class="fp-h gold" id="fp-h">Caption of the Night</div><p class="fp-sub" id="fp-sub"></p></div>' +
      '<div class="fp-it fp-count" id="fp-count">COPIES PRINTED<b id="fp-n">0</b></div>' +
      '<div class="fp-it fp-press" id="fp-press" style="opacity:0">' + pressSvg() + '<div class="fp-it fp-plat" id="fp-plat">' + platenSvg() + '</div></div>' +
      '<div class="fp-it fp-sheet" id="fp-s1"></div><div class="fp-it fp-sheet" id="fp-s2"></div><div class="fp-it fp-sheet" id="fp-s3"></div>' +
      '<div class="fp-it fp-piece" id="fp-piece" style="transform:translateY(-50%);opacity:0"><img src="' + imgUrl + '" alt=""><p class="fp-pc">“' + E(entry.caption) + '”</p><div class="fp-ros" id="fp-ros">' + rosetteSvg() + '</div></div>' +
      '<div class="fp-it fp-name" id="fp-name"><b>' + E(who) + (mine ? ' (that’s you)' : '') + '</b><span>' + E(subLine) + '</span></div>' +
      '<div class="fp-it fp-say" id="fp-say" style="top:34%"></div>' +
      '<div class="fp-it fp-print" id="fp-print" style="transform:translateY(-54%)"></div>' +
      '<div class="fp-it fp-why" id="fp-why"><b>' + E(fill(act.line)) + '</b><span>' + E(fill(act.sub)) + '</span></div>' +
      '<div class="fp-it fp-final" id="fp-final" style="transform:translateY(-56%)"><img class="t" src="' + imgUrl + '" alt=""><p class="fp-fc">“' + E(entry.caption) + '”</p><p class="fp-fby">Caption by ' + E(who) + '</p><p class="fp-fbest">' + E(f.best || 'Caption of the Night') + '</p></div>' +
      '<div class="fp-it fp-btns" id="fp-btns"><button class="btn btn-sm" id="fp-card">🖼 Real one</button><button class="btn btn-sm" id="fp-mis">😂 Misprint</button><button class="btn btn-sm btn-yellow" id="fp-done">Done</button></div>' +
      '<p class="fp-it" id="fp-savehint" style="left:0;right:0;bottom:calc(66px + var(--sab,0px));text-align:center;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E9C86D;opacity:0;z-index:40;margin:0;">Save it · text it</p>';
    var $ = function (id) { return document.getElementById(id); };
    $('fp-done').onclick = function () { doneFor = tag; o.classList.add('out'); setTimeout(function () { close(); try { render(true); } catch (e) {} }, 380); };
    $('fp-card').onclick = function () { saveClean(f); };
    $('fp-mis').onclick = function () { saveMisprint(f); };

    // the author's cartoon face, ready before the misprint (grayscale when the cartoon is black-and-white)
    var faceP = loadImg('/images/' + entry.image).then(function (im) { return cartoonFace(entry.writerId, im ? isGray(im) : false); });
    var faceReady = null, pixReady = null;
    faceP.then(function (u) { faceReady = u; if (act.mode === 'pixel' && u) return pixelFace(u).then(function (p) { pixReady = p; }); });

    var t0 = wait || 0, skip = Math.max(0, late || 0);
    var at = function (ms, fn) { if (ms + t0 - skip >= -60) later(ms + t0 - skip, fn); };
    // a phone that arrives after the misprint just gets the corrected edition
    if (skip > 15500) { finalNow(); return; }
    // Reduce Motion: no press, no siren, no flying paper. Three cross-fades carry the same news —
    // Caption of the Night, the misprint (with its stamp and its excuse), the corrected edition — in ~6s.
    if (reduced()) {
      if (skip > 5600) { finalNow(); return; }
      var fade = function (el, ms) { if (el) anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: ms || 400, fill: 'forwards', easing: 'ease-out' }); };
      at(0, function () { $('fp-sub').textContent = ''; fade($('fp-piece')); fade($('fp-name')); var r = $('fp-ros'); if (r) r.style.opacity = 1; S.fan(); vib(mine ? [120, 40, 120] : [60]); });
      at(2400, function () {
        hide($('fp-piece'), 300); hide($('fp-name'), 300);
        var pr = $('fp-print'); pr.innerHTML = misprintHtml(entry, act.mode, faceReady, pixReady, seed);
        if (!faceReady) faceP.then(function () { later(act.mode === 'pixel' ? 80 : 0, function () { pr.innerHTML = misprintHtml(entry, act.mode, faceReady, pixReady, seed); var s2 = pr.querySelector('.fp-stamp'); if (s2) s2.style.opacity = 1; }); });
        var s = pr.querySelector('.fp-stamp'); if (s) s.style.opacity = 1;
        $('fp-eye').textContent = 'Hot off the press'; $('fp-h').className = 'fp-h'; $('fp-h').textContent = '50,000 copies of this:';
        fade(pr, 400); fade($('fp-why'), 400); S.womp();
      });
      at(5200, function () {
        hide($('fp-print'), 300); hide($('fp-why'), 300);
        $('fp-eye').textContent = 'All 50,000 recalled'; $('fp-h').className = 'fp-h gold'; $('fp-h').textContent = 'The corrected edition';
        $('fp-sub').textContent = 'Hanging in The Gallery for good.';
        fade($('fp-final'), 450); S.chime(); vib(mine ? [80, 40, 80] : [60]);
      });
      at(5700, function () { fade($('fp-btns'), 300); fade($('fp-savehint'), 300); });
      return;
    }

    /* 1. Caption of the Night (0 – 4.3s) */
    at(0, function () { $('fp-sub').textContent = ''; show($('fp-piece'), 700, [{ opacity: 0, transform: 'translateY(-50%) scale(.3) rotate(-8deg)' }, { opacity: 1, transform: 'translateY(-50%) scale(1) rotate(0)' }]); S.whoosh(); vib(40); });
    at(850, function () { var r = $('fp-ros'); anim(r, [{ opacity: 0, transform: 'scale(2.6) rotate(-40deg)' }, { opacity: 1, transform: 'scale(1) rotate(8deg)' }], { duration: 380, fill: 'forwards', easing: 'cubic-bezier(.3,1.6,.5,1)' }); S.thunk(); vib(mine ? [120, 40, 120] : [60]); });
    at(1150, function () { show($('fp-name'), 400, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }]); S.fan(); try { confetti.cannons(); } catch (e) {} });
    /* 2. To the presses! (4.3 – 7.0s) */
    at(4300, function () {
      $('fp-eye').textContent = 'Off it goes'; $('fp-h').textContent = 'To the presses!'; $('fp-h').className = 'fp-h';
      $('fp-sub').textContent = 'Mass production. Coffee mugs. Tote bags. The works.';
      hide($('fp-name'), 200);
      anim($('fp-piece'), [{ transform: 'translateY(-50%) scale(1)', opacity: 1 }, { transform: 'translateY(10%) scale(.35)', opacity: 1, offset: .75 }, { transform: 'translateY(30%) scale(.3)', opacity: 0 }], { duration: 900, fill: 'forwards', easing: 'ease-in' });
      show($('fp-press'), 400, [{ opacity: 0, transform: 'translateY(120px)' }, { opacity: 1, transform: 'none' }]);
      S.whoosh();
    });
    var wheel = function () { var w = o.querySelector('.fp-wheel'); anim(w, [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, iterations: 4 }); };
    [5100, 5650, 6200].forEach(function (ms, i) {
      at(ms, function () {
        if (i === 0) { wheel(); show($('fp-count'), 200, [{ opacity: 0 }, { opacity: 1 }]); }
        anim($('fp-plat'), [{ transform: 'translateY(0)' }, { transform: 'translateY(118px)', offset: .4 }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-in-out' });
        later(170, function () { S.kachunk(); vib(35); });
        var s = $('fp-s' + (i + 1));
        anim(s, [{ opacity: 1, transform: 'translate(0,0) rotate(0)' }, { opacity: 1, transform: 'translate(' + (i % 2 ? -150 : 150) + 'px,-230px) rotate(' + (i % 2 ? -40 : 40) + 'deg)', offset: .7 }, { opacity: 0, transform: 'translate(' + (i % 2 ? -220 : 220) + 'px,-320px) rotate(' + (i % 2 ? -60 : 60) + 'deg)' }], { duration: 900, delay: 200, fill: 'forwards', easing: 'ease-out' });
        $('fp-n').textContent = ['1', '1,000', '50,000'][i];
      });
    });
    /* 3. Something goes wrong (7.0 – 10.0s) */
    at(7000, function () {
      $('fp-eye').textContent = 'Uh-oh'; $('fp-h').textContent = 'Wait…'; $('fp-sub').textContent = '';
      var say = $('fp-say'); say.textContent = fill(act.say);
      show(say, 300, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }]);
      S.pop();
      (act.props || []).forEach(function (p, i) {
        var e = document.createElement('div'); e.className = 'fp-it fp-prop'; e.textContent = p;
        e.style.left = '0'; e.style.top = (46 + i * 10) + '%';
        o.appendChild(e);
        var dir = i % 2 ? -1 : 1, W = window.innerWidth || 390;
        anim(e, [{ opacity: 1, transform: 'translate(' + (dir > 0 ? -90 : W + 20) + 'px,0) rotate(0)' }, { opacity: 1, transform: 'translate(' + (W / 2 - 32) + 'px,-30px) rotate(' + (dir * 20) + 'deg)', offset: .45 }, { opacity: 1, transform: 'translate(' + (W / 2 - 32) + 'px,10px) rotate(' + (dir * -15) + 'deg)', offset: .7 }, { opacity: 0, transform: 'translate(' + (dir > 0 ? W + 20 : -90) + 'px,-60px) rotate(' + (dir * 40) + 'deg)' }], { duration: 2400, delay: i * 250, fill: 'forwards', easing: 'ease-in-out' });
      });
      anim($('fp-plat'), [{ transform: 'translateY(0)' }, { transform: 'translateY(60px) rotate(4deg)' }, { transform: 'translateY(20px) rotate(-6deg)' }, { transform: 'translateY(90px) rotate(2deg)' }], { duration: 2200, fill: 'forwards', easing: 'steps(6)' });
      later(900, function () { S.screech(); vib([30, 30, 30, 30, 30]); });
    });
    at(9200, function () {
      hide($('fp-say'), 150);
      $('fp-eye').textContent = 'Klaxon'; $('fp-h').className = 'fp-h red'; $('fp-h').textContent = 'STOP THE PRESSES!';
      o.classList.add('siren', 'shake'); S.siren(); vib([200, 80, 200, 80, 200]);
    });
    /* 4. The misprint (10.3 – 15.4s) */
    at(10300, function () {
      o.classList.remove('shake');
      var pr = $('fp-print');
      var put = function () { pr.innerHTML = misprintHtml(entry, act.mode, faceReady, pixReady, seed); };
      put();
      if (!faceReady) faceP.then(function () { later(act.mode === 'pixel' ? 80 : 0, put); });   // a slow phone: the face lands a beat late
      $('fp-eye').textContent = 'Hot off the press'; $('fp-h').className = 'fp-h'; $('fp-h').textContent = '50,000 copies of this:';
      hide($('fp-press'), 200); hide($('fp-count'), 200);
      anim(pr, [{ opacity: 0, transform: 'translateY(40%) scale(.4) rotate(-20deg)' }, { opacity: 1, transform: 'translateY(-54%) scale(1) rotate(-2deg)' }], { duration: 520, fill: 'forwards', easing: 'cubic-bezier(.2,1.3,.4,1)' });
      S.whoosh(); vib(40);
    });
    at(11200, function () { o.classList.remove('siren'); var s = o.querySelector('#fp-print .fp-stamp'); anim(s, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-14deg) scale(2.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-14deg) scale(1)' }], { duration: 260, fill: 'forwards', easing: 'ease-in' }); S.stamp(); vib([90, 40, 160]); });
    at(11700, function () { show($('fp-why'), 350, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }]); S.womp(); });
    /* 5. Recalled. The corrected edition (15.4s on) */
    at(15400, function () {
      hide($('fp-why'), 200);
      $('fp-eye').textContent = 'All 50,000 recalled'; $('fp-h').className = 'fp-h gold'; $('fp-h').textContent = 'The corrected edition';
      $('fp-sub').textContent = 'Hanging in The Gallery for good.';
      anim($('fp-print'), [{ opacity: 1, transform: 'translateY(-54%) rotate(-2deg)' }, { opacity: 0, transform: 'translate(-120%,-30%) rotate(-50deg) scale(.6)' }], { duration: 500, fill: 'forwards', easing: 'ease-in' });
      S.whoosh();
    });
    at(15800, function () { show($('fp-final'), 650, [{ opacity: 0, transform: 'translateY(-90%) scale(.9)' }, { opacity: 1, transform: 'translateY(-56%) scale(1)' }]); S.chime(); vib(mine ? [80, 40, 80, 40, 200] : [60]); try { confetti.rain(3000); } catch (e) {} });
    at(16800, function () { show($('fp-btns'), 300, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }]); show($('fp-savehint'), 300, [{ opacity: 0 }, { opacity: 1 }]); });

    function finalNow() {
      ['fp-piece', 'fp-name', 'fp-press', 'fp-count'].forEach(function (id) { var e = $(id); if (e) e.style.opacity = 0; });
      $('fp-eye').textContent = 'Caption of the Night'; $('fp-h').textContent = 'The corrected edition'; $('fp-sub').textContent = 'Hanging in The Gallery for good.';
      $('fp-final').style.opacity = 1; $('fp-btns').style.opacity = 1; $('fp-savehint').style.opacity = 1;
    }
  }

  /* ── The screen under it all (part of the final scores page) ── */
  var localVote = null;
  function vote(key) {
    var f = state && state.finale; if (!f || f.winner || !f.canVote) return;
    var e = f.entries.filter(function (x) { return x.key === key; })[0];
    if (!e || e.writerId === myPlayerId) return;
    if (send({ action: 'finale_vote', key: key })) { localVote = { tag: state.code + '|' + f.at, key: key }; vib(20); try { sfx.tap(); } catch (x) {} try { render(true); } catch (x) {} }
  }
  function myVote(f) { return localVote && localVote.tag === state.code + '|' + f.at && !f.winner ? localVote.key : f.myVote; }
  function cardHtml(e, on, own, clickable) {
    var by = (own ? 'Yours' : E(e.writerName || nm(e.writerId))) + ' · ' + (e.frames === 1 ? '1 frame' : e.frames + ' frames');
    return '<button class="fp-card' + (on ? ' on' : '') + (own ? ' own' : '') + '" ' + (clickable ? 'onclick="ccFinale.vote(\'' + E(e.key) + '\')"' : 'disabled') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="fp-tick">✓ Your vote</span><img src="/images/' + E(e.image) + '" alt="" loading="lazy"><span class="fp-c">“' + E(e.caption) + '”</span><span class="fp-by">' + by + '</span></button>';
  }
  function memoHtml(f) {
    var e = f.entries.filter(function (x) { return x.key === f.winner; })[0]; if (!e) return '';
    return '<div class="fp-memo"><div class="fp-rib">' + rosetteSvg() + '</div><img src="/images/' + E(e.image) + '" alt=""><p class="fp-mc">“' + E(e.caption) + '”</p><p class="fp-mby">Caption by ' + E(e.writerName || nm(e.writerId)) + ' · ' + E(f.best || 'Caption of the Night') + '</p></div>';
  }
  // The final page while the Gallery is open: the vote, or (once there's a winner) the memorial
  function screenHtml() {
    var f = state.finale; if (!f) return '';
    var run = false; try { run = canRun(); } catch (e) {}
    if (f.winner) {
      return '<p class="eyebrow center" style="margin:6px 0 2px;">Caption of the Night</p>' + memoHtml(f) +
        '<div class="fp-foot" style="margin-bottom:12px;"><div style="display:flex;gap:10px;width:100%;"><button class="btn btn-sm" style="flex:1" onclick="ccFinale.saveClean()">🖼 Save the real one</button><button class="btn btn-sm" style="flex:1" onclick="ccFinale.saveMisprint()">😂 Save the misprint</button></div>' +
        '<button class="btn-link" onclick="ccFinale.replay()">▶ Watch it go to the presses again</button></div>';
    }
    var mine = myVote(f), many = f.entries.length;
    var cards = f.entries.map(function (e) { var own = e.writerId === myPlayerId; return cardHtml(e, mine === e.key, own, f.canVote && !own); }).join('');
    var voters = (f.voters || []).filter(function (id) { try { return !!playerById(id); } catch (e) { return true; } }), decided = f.decided || [];
    var chips = voters.map(function (id) { var c = ''; try { c = chipHtml(id, 'sm'); } catch (e) {} return '<span class="fp-ch' + (decided.indexOf(id) >= 0 ? ' done' : '') + '">' + c + '</span>'; }).join('');
    var lead = f.canVote ? 'Every caption here beat the real one. Vote for the best of the night — not your own.' : 'They’re all yours. Sit back and look modest while the table votes.';
    return '<p class="eyebrow center" style="margin:6px 0 2px;">Tonight’s Gallery · ' + many + ' frames</p>' +
      '<div class="h-display center" style="font-size:30px;margin:2px 0 6px;">Caption of the Night?</div>' +
      '<p class="fp-lead">' + lead + '</p>' +
      '<div class="fp-wall' + (many === 1 ? ' one' : '') + '">' + cards + '</div>' +
      '<div class="fp-foot"><div class="fp-chips">' + chips + '</div><p class="small">' + decided.length + ' of ' + voters.filter(function (id) { return true; }).length + ' voted</p>' +
      (run ? '<button class="btn-link" onclick="send({action:\'finale_close\'})">Count the votes now</button>' : '') + '</div>';
  }
  // Called on every render of the final scores: plays the press show once, in sync, when the result is in
  function sync() {
    var f = state && state.finale;
    if (!f || !f.winner || !f.pressAt) return;
    var tag = state.code + '|' + f.pressAt;
    if (playing === tag || doneFor === tag) return;
    var t = now(), wait = f.pressAt - t;
    if (wait < -60000) return;   // long over: the memorial on the page does the honours
    try { if (typeof closeGrand === 'function' && document.getElementById('poobah') && document.getElementById('poobah').className) closeGrand(); } catch (e) {}
    play(f, Math.max(0, wait), Math.max(0, -wait));
  }
  // The two keepsakes: the real one (untouched cartoon, framed card) and the misprint (with the author's face)
  function winnerOf(f) { return f && (f.entries || []).filter(function (e) { return e.key === f.winner; })[0]; }
  function saveClean(f) {
    var e = winnerOf(f); if (!e) return;
    try { makeCardFrom({ image: e.image, caption: e.caption, writerName: e.writerName || nm(e.writerId), isReal: false, month: f.best, inducted: f.best, flaggers: e.flaggers || [], top: true }); } catch (x) {}
  }
  function saveMisprint(f) {
    var e = winnerOf(f); if (!e) return;
    var act = ACTS[((f.act | 0) % ACTS.length + ACTS.length) % ACTS.length], who = e.writerName || nm(e.writerId);
    var seed = String(f.pressAt).split('').reduce(function (a, ch) { return a * 31 + ch.charCodeAt(0) | 0; }, 5);
    try { if (typeof openCardSheet === 'function') openCardSheet(null, 'Misprint', true); } catch (x) {}
    loadImg('/images/' + e.image).then(function (im) { return cartoonFace(e.writerId, im ? isGray(im) : false); }).then(function (face) {
      return (act.mode === 'pixel' && face ? pixelFace(face) : Promise.resolve(null)).then(function (pix) {
        return misprintBlob(e, act.mode, face, pix, seed, act.line.replace(/\{n\}/g, who), who, f.best);
      });
    }).then(function (blob) {
      if (!blob) throw new Error('no picture');
      var name = 'closed-caption-misprint-' + String(who).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
      if (typeof openCardSheet === 'function') openCardSheet(blob, 'Misprint', true, name);
    }).catch(function () { try { closeMenu(); showToast('Couldn’t print that — try again'); } catch (x) {} });
  }
  function replay() { var f = state && state.finale; if (!f || !f.winner) return; doneFor = null; playing = null; play(f, 0, 0); }

  window.ccFinale = { saveClean: function () { saveClean(state && state.finale); }, saveMisprint: function () { saveMisprint(state && state.finale); }, misprintBlob: misprintBlob, SPOTS: SPOTS, ACTS: ACTS, play: play, close: close, sync: sync, replay: replay, vote: vote, screenHtml: screenHtml, misprintHtml: misprintHtml, cartoonFace: cartoonFace, spotsFor: spotsFor };
})();
