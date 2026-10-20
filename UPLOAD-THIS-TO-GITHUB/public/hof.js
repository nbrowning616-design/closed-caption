/* Closed Caption — Gallery share card generator (a framed caption, magazine style).
 * Self-contained. Exposes window.HallCard = { make, share, filenameFor }.
 * make({ imageSrc, caption, credit, inducted (e.g. 'Framed October 2026'), flaggers, qr: { url, label } }) -> Promise<Blob> (image/png, 1080x1350)
 *   qr (#24): prints "Play it: <label>" and a small QR code of url in the bottom corner, so a posted card leads back to the game
 * siteUrl(from) -> 'https://<this site>/?from=<from>'   siteLabel() -> '<this site's host>'   drawQr(ctx, text, x, y, size, ink, paper)
 * share(blob, { title, text, filename }) -> Promise<'shared'|'downloaded'|'cancelled'>
 */
(function () {
  'use strict';

  var W = 1080, H = 1350;
  var FONT_FAMILY = '"Libre Caslon Text"';
  var FALLBACK = 'Georgia, "Times New Roman", serif';
  var FONT_HREF = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap';

  var C = {
    paper: '#FAF6EC',
    ink: '#1C1A17',
    soft: '#5E574C',
    faint: '#8A8174',
    rule: '#2A2622',
    gold: '#B08A3E',
    goldLight: '#CDAA5F'
  };

  var fontPromise = null;
  var fontReady = false;

  function withTimeout(p, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve(false); } }, ms);
      Promise.resolve(p).then(function (v) {
        if (!done) { done = true; clearTimeout(t); resolve(v); }
      }, function () {
        if (!done) { done = true; clearTimeout(t); resolve(false); }
      });
    });
  }

  function loadFonts() {
    if (fontPromise) return fontPromise;
    fontPromise = (function () {
      try {
        if (!document.querySelector('link[data-hallcard-font]')) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = FONT_HREF;
          link.setAttribute('data-hallcard-font', '1');
          (document.head || document.documentElement).appendChild(link);
        }
        if (!document.fonts || !document.fonts.load) return Promise.resolve(false);
        var loads = Promise.all([
          document.fonts.load('italic 48px ' + FONT_FAMILY, '“Aa’”'),
          document.fonts.load('400 48px ' + FONT_FAMILY, 'AaBb'),
          document.fonts.load('700 48px ' + FONT_FAMILY, 'AaBb')
        ]).then(function (res) {
          // fonts.load resolves with [] if nothing matched; check really available
          var ok = document.fonts.check('italic 48px ' + FONT_FAMILY) && res[0] && res[0].length > 0;
          return !!ok;
        });
        return withTimeout(loads, 2500).then(function (ok) { fontReady = !!ok; return fontReady; });
      } catch (e) {
        return Promise.resolve(false);
      }
    })();
    // allow a retry on a later call if this attempt failed
    fontPromise.then(function (ok) { if (!ok) fontPromise = null; });
    return fontPromise;
  }

  function font(style, weight, size) {
    var fam = fontReady ? FONT_FAMILY + ', ' + FALLBACK : FALLBACK;
    return style + ' ' + weight + ' ' + size + 'px ' + fam;
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var img = new Image();
      var settled = false;
      function finish(v) { if (!settled) { settled = true; resolve(v); } }
      try {
        if (/^https?:/i.test(src)) {
          try {
            var u = new URL(src, location.href);
            if (u.origin !== location.origin) img.crossOrigin = 'anonymous';
          } catch (e) {}
        }
      } catch (e) {}
      img.onload = function () {
        if (img.decode) img.decode().then(function () { finish(img); }, function () { finish(img.naturalWidth ? img : null); });
        else finish(img);
      };
      img.onerror = function () { finish(null); };
      setTimeout(function () { finish(img.complete && img.naturalWidth ? img : null); }, 8000);
      img.src = src;
    });
  }

  // ---------- text helpers ----------

  function smarten(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    // strip any surrounding double quotes the caller may have included
    s = s.replace(/^["“”„]+\s*/, '').replace(/\s*["“”]+$/, '');
    // straight quotes -> curly
    s = s.replace(/(^|[\s(\[—-])'/g, '$1‘').replace(/'/g, '’');
    s = s.replace(/(^|[\s(\[—-])"/g, '$1“').replace(/"/g, '”');
    s = s.replace(/\.\.\./g, '…').replace(/ -- /g, '—').replace(/--/g, '—');
    return s;
  }

  function greedy(ctx, words, maxW) {
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (!cur || ctx.measureText(test).width <= maxW) cur = test;
      else { lines.push(cur); cur = words[i]; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // break any single word wider than maxW into pieces
  function splitLongWords(ctx, words, maxW) {
    var out = [];
    words.forEach(function (w) {
      if (ctx.measureText(w).width <= maxW) { out.push(w); return; }
      var piece = '';
      for (var i = 0; i < w.length; i++) {
        var t = piece + w[i];
        if (piece && ctx.measureText(t + '-').width > maxW) { out.push(piece + '-'); piece = w[i]; }
        else piece = t;
      }
      if (piece) out.push(piece);
    });
    return out;
  }

  // balanced wrap: fewest lines at maxW, then narrowest width that keeps that line count
  function balancedWrap(ctx, text, maxW) {
    var words = splitLongWords(ctx, text.split(' '), maxW);
    var base = greedy(ctx, words, maxW);
    var n = base.length;
    if (n <= 1) return base;
    var lo = maxW / n * 0.8, hi = maxW;
    for (var k = 0; k < 18; k++) {
      var mid = (lo + hi) / 2;
      if (greedy(ctx, words, mid).length <= n) hi = mid; else lo = mid;
    }
    var lines = greedy(ctx, words, hi);
    // avoid a lone short last word (widow) if possible by rebalancing
    return lines.length === n ? lines : base;
  }

  function trackedWidth(ctx, s, track) {
    var w = 0;
    for (var i = 0; i < s.length; i++) w += ctx.measureText(s[i]).width;
    return w + track * Math.max(0, s.length - 1);
  }

  function drawTracked(ctx, s, cx, y, track) {
    var total = trackedWidth(ctx, s, track);
    var x = cx - total / 2;
    var prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    for (var i = 0; i < s.length; i++) {
      ctx.fillText(s[i], x, y);
      x += ctx.measureText(s[i]).width + track;
    }
    ctx.textAlign = prevAlign;
  }

  // Small caps: capitals at `big`, lowercase rendered as uppercase at `small`.
  function smallCapsRuns(s) {
    var runs = [], cur = null;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      var isLower = ch !== ch.toUpperCase();
      var kind = isLower ? 's' : 'b';
      var c = isLower ? ch.toUpperCase() : ch;
      if (cur && cur.kind === kind) cur.text += c;
      else { cur = { kind: kind, text: c }; runs.push(cur); }
    }
    return runs;
  }

  function smallCapsWidth(ctx, s, big, small, track, style) {
    var w = 0, count = 0;
    smallCapsRuns(s).forEach(function (r) {
      ctx.font = font(style || 'normal', 400, r.kind === 'b' ? big : small);
      for (var i = 0; i < r.text.length; i++) { w += ctx.measureText(r.text[i]).width; count++; }
    });
    return w + track * Math.max(0, count - 1);
  }

  function drawSmallCaps(ctx, s, cx, y, big, small, track, style) {
    var total = smallCapsWidth(ctx, s, big, small, track, style);
    var x = cx - total / 2;
    ctx.textAlign = 'left';
    smallCapsRuns(s).forEach(function (r) {
      ctx.font = font(style || 'normal', 400, r.kind === 'b' ? big : small);
      for (var i = 0; i < r.text.length; i++) {
        ctx.fillText(r.text[i], x, y);
        x += ctx.measureText(r.text[i]).width + track;
      }
    });
    ctx.textAlign = 'center';
    return total;
  }

  // fit small-caps text within maxW by shrinking tracking, then size
  function fitSmallCaps(ctx, s, big, small, track, maxW) {
    var b = big, sm = small, t = track;
    for (var k = 0; k < 40; k++) {
      if (smallCapsWidth(ctx, s, b, sm, t) <= maxW) break;
      if (t > track * 0.4) t *= 0.9;
      else { b *= 0.95; sm *= 0.95; }
    }
    return { big: b, small: sm, track: t };
  }

  function joinNames(names) {
    names = (names || []).map(function (n) { return String(n || '').trim(); }).filter(Boolean);
    if (!names.length) return '';
    if (names.length === 1) return names[0];
    if (names.length > 5) {
      var extra = names.length - 4;
      return names.slice(0, 4).join(', ') + ' & ' + extra + ' more';
    }
    return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  }

  // ---------- ornaments ----------

  function star(ctx, cx, cy, rOuter, rInner) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? rOuter : rInner;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function leaf(ctx, x, y, len, wid, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -wid, len, 0);
    ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  // a laurel branch following an elliptical arc that cradles the star; dir = -1 left, +1 right
  function branch(ctx, cx, cy, dir) {
    var rx = 46, ry = 24, n = 6;
    var a0 = Math.PI / 2 + 0.28, a1 = Math.PI + 0.62;   // from just below centre, sweeping up the side
    function pt(t) {
      var a = a0 + (a1 - a0) * t;
      // offset x relative to cx (mirrored for the right side), absolute y
      return { x: -dir * Math.cos(a) * rx, y: cy - 2 + Math.sin(a) * ry };
    }
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var k = 0; k <= 24; k++) { var q = pt(k / 24); if (k === 0) ctx.moveTo(cx + q.x, q.y); else ctx.lineTo(cx + q.x, q.y); }
    ctx.stroke();
    for (var i = 0; i < n; i++) {
      var t = 0.12 + i * (0.86 / n);
      var p0 = pt(t), p1 = pt(t + 0.02);
      var ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);   // tangent toward the tip
      var len = 15 - i * 0.9, wid = 4.6 - i * 0.25;
      leaf(ctx, cx + p0.x, p0.y, len, wid, ang - 0.62);
      leaf(ctx, cx + p0.x, p0.y, len, wid, ang + 0.62);
    }
    var tip = pt(1), tq = pt(0.98);
    leaf(ctx, cx + tip.x, tip.y, 13, 4.2, Math.atan2(tip.y - tq.y, tip.x - tq.x));
    ctx.restore();
  }

  function ornament(ctx, cx, cy) {
    ctx.save();
    var g = ctx.createLinearGradient(cx - 60, cy - 30, cx + 60, cy + 30);
    g.addColorStop(0, C.gold); g.addColorStop(0.5, C.goldLight); g.addColorStop(1, C.gold);
    ctx.fillStyle = g;
    ctx.strokeStyle = C.gold;
    branch(ctx, cx, cy, -1);
    branch(ctx, cx, cy, 1);
    star(ctx, cx, cy - 4, 11, 4.6);
    ctx.restore();
  }

  function hrule(ctx, x1, x2, y, w, color) {
    ctx.save();
    ctx.fillStyle = color || C.rule;
    ctx.fillRect(x1, y, x2 - x1, w);
    ctx.restore();
  }

  function diamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.fill();
  }

  function paperTexture(ctx) {
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    // gentle vignette for a printed-page feel
    var g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.85);
    g.addColorStop(0, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(120,100,60,0.07)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- the way back in (#24): the site's address and a small QR code ----------

  // https://host/?from=gallery — the link printed on (and texted with) a shared picture
  function siteUrl(from) {
    var o = ''; try { o = location.origin; } catch (e) {}
    if (!/^https?:/.test(o)) o = 'https://closed-caption.onrender.com';
    return o + '/' + (from ? '?from=' + encodeURIComponent(from) : '');
  }
  function siteLabel() { try { return location.host || 'closed-caption.onrender.com'; } catch (e) { return 'closed-caption.onrender.com'; } }
  // Draw a QR code (qrcode.js, already on the page) as a square of ink on a white tile. Returns false if it can't.
  function drawQr(ctx, text, x, y, size, ink, paper) {
    try {
      if (typeof window.qrcode !== 'function') return false;
      var q = window.qrcode(0, 'M'); q.addData(String(text)); q.make();
      var n = q.getModuleCount(), quiet = 2, cell = size / (n + quiet * 2);
      ctx.save();
      ctx.fillStyle = paper || '#FFFFFF'; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = ink || '#1C1A17';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + (c + quiet) * cell), Math.floor(y + (r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
      }
      ctx.restore();
      return true;
    } catch (e) { return false; }
  }

  // ---------- main render ----------

  function render(canvas, opts, img) {
    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    paperTexture(ctx);

    var M = 76;                // outer margin for rules
    var L = M, R = W - M, CX = W / 2;
    var foot = opts.qr ? 128 : 0;   // #24: a band under the bottom rule for the address and the QR code

    // --- masthead ---
    hrule(ctx, L, R, 64, 2.2);
    hrule(ctx, L, R, 70, 0.8);
    ctx.fillStyle = C.ink;
    var mast = 'The Closed Caption Gallery';
    var mf = fitSmallCaps(ctx, mast, 34, 26, 5.5, R - L - 40);
    drawSmallCaps(ctx, mast, CX, 122, mf.big, mf.small, mf.track);
    hrule(ctx, L, R, 146, 0.8);
    // tiny diamonds at rule ends for a finished look
    ctx.fillStyle = C.rule;

    var topY = 146;            // content starts below this
    var bottomRuleY = H - 66 - foot;  // bottom double rule

    // --- caption metrics ---
    var caption = smarten(opts.caption);
    var capText = '“' + caption + '”';
    var capMaxW = 860;
    var sizes = [50, 47, 44, 42, 40, 38, 36, 34, 32, 30, 28];
    if (caption.length <= 40) sizes = [58, 54].concat(sizes);
    var capSize = sizes[sizes.length - 1], lines = null, lh;
    for (var i = 0; i < sizes.length; i++) {
      ctx.font = font('italic', 400, sizes[i]);
      var ls = balancedWrap(ctx, capText, capMaxW);
      var limit = caption.length > 120 ? 4 : 3;
      if (ls.length <= limit || i === sizes.length - 1) {
        if (ls.length <= 4 || i === sizes.length - 1) { capSize = sizes[i]; lines = ls; break; }
      }
    }
    if (!lines) { ctx.font = font('italic', 400, capSize); lines = balancedWrap(ctx, capText, capMaxW); }
    lh = Math.round(capSize * 1.32);
    var capBlockH = lines.length * lh;

    // --- credit metrics ---
    var credit = String(opts.credit || '').trim();
    var inducted = String(opts.inducted || '').trim();
    var creditParts = [credit, inducted].filter(Boolean);
    var flagText = joinNames(opts.flaggers);
    var creditLineH = 34;
    var creditBlockH = creditParts.length ? creditLineH : 0;
    var flagH = flagText ? 36 : 0;
    var ornH = 44;

    // --- image area ---
    var gapTopToImg = 52, gapImgToCap = 50, gapCapToOrn = 28, gapOrnToCredit = 30, gapBottom = 44;
    var below = gapImgToCap + capBlockH + gapCapToOrn + ornH + gapOrnToCredit + creditBlockH + flagH + gapBottom;
    var availH = bottomRuleY - topY - gapTopToImg - below;
    var maxImgW = 860;
    var maxImgH = Math.min(availH, 820);
    var iw = 4, ih = 3;
    if (img && img.naturalWidth) { iw = img.naturalWidth; ih = img.naturalHeight; }
    var scale = Math.min(maxImgW / iw, maxImgH / ih);
    var dw = Math.round(iw * scale), dh = Math.round(ih * scale);

    // distribute extra vertical space so the composition sits balanced
    var used = gapTopToImg + dh + below;
    var slack = Math.max(0, (bottomRuleY - topY) - used);
    var y = topY + gapTopToImg + Math.round(slack * 0.45);

    var ix = Math.round(CX - dw / 2), iy = y;

    // soft shadow + white mount
    ctx.save();
    ctx.shadowColor = 'rgba(60,45,20,0.16)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(ix, iy, dw, dh);
    ctx.restore();

    if (img && img.naturalWidth) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, ix, iy, dw, dh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = '#EFEADF';
      ctx.fillRect(ix, iy, dw, dh);
      ctx.fillStyle = C.faint;
      ctx.font = font('italic', 400, 30);
      ctx.fillText('cartoon unavailable', CX, iy + dh / 2 + 10);
      ctx.restore();
    }
    // hairline frame
    ctx.save();
    ctx.strokeStyle = 'rgba(28,26,23,0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ix + 0.75, iy + 0.75, dw - 1.5, dh - 1.5);
    ctx.restore();

    y = iy + dh + gapImgToCap;

    // --- caption ---
    ctx.fillStyle = C.ink;
    ctx.font = font('italic', 400, capSize);
    ctx.textAlign = 'center';
    var capAscent = Math.round(capSize * 0.78);
    for (var j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], CX, y + capAscent + j * lh);
    }
    y += capBlockH + gapCapToOrn;

    // --- ornament ---
    ornament(ctx, CX, y + ornH / 2);
    y += ornH + gapOrnToCredit;

    // --- credit ---
    if (creditParts.length) {
      ctx.fillStyle = C.soft;
      var creditStr = creditParts.join('  ·  ');
      var cf = fitSmallCaps(ctx, creditStr, 21, 17, 2.6, R - L);
      drawSmallCaps(ctx, creditStr, CX, y + 22, cf.big, cf.small, cf.track);
      y += creditLineH;
    }
    if (flagText) {
      ctx.fillStyle = C.faint;
      var fs = 22;
      var ft = 'Framed by ' + flagText;
      ctx.font = font('italic', 400, fs);
      while (ctx.measureText(ft).width > R - L && fs > 14) { fs -= 1; ctx.font = font('italic', 400, fs); }
      ctx.fillText(ft, CX, y + 28);
    }

    // --- footer rules ---
    hrule(ctx, L, R, bottomRuleY, 0.8);
    hrule(ctx, L, R, bottomRuleY + 6, 2.2);
    ctx.fillStyle = C.gold;
    diamond(ctx, CX, bottomRuleY + 3.6, 5);

    // --- #24: the way back in: the address (left) and a small QR code (right corner) ---
    if (opts.qr) {
      var qs = 112, qx = R - qs, qy = bottomRuleY + 22;
      var hasQr = drawQr(ctx, opts.qr.url, qx, qy, qs, C.ink, '#FFFFFF');
      if (hasQr) { ctx.save(); ctx.strokeStyle = 'rgba(28,26,23,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(qx - 0.75, qy - 0.75, qs + 1.5, qs + 1.5); ctx.restore(); }
      var tx = L, tw = (hasQr ? qx - 28 : R) - L;
      ctx.textAlign = 'left'; ctx.fillStyle = C.ink;
      var fs = 30; ctx.font = font('italic', 400, fs);
      var l1 = 'Play it: ' + (opts.qr.label || siteLabel());
      while (ctx.measureText(l1).width > tw && fs > 18) { fs -= 1; ctx.font = font('italic', 400, fs); }
      ctx.fillText(l1, tx, qy + 46);
      ctx.fillStyle = C.soft;
      var l2 = 'Closed Caption · a bluffing game with cartoons';
      var f2 = fitSmallCaps(ctx, l2, 21, 17, 2.2, tw);
      ctx.textAlign = 'center';
      drawSmallCaps(ctx, l2, tx + smallCapsWidth(ctx, l2, f2.big, f2.small, f2.track) / 2, qy + 88, f2.big, f2.small, f2.track);
      ctx.textAlign = 'center';
    }
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      try {
        canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob returned null')); }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  function make(opts) {
    opts = opts || {};
    return Promise.all([
      loadFonts().catch(function () { return false; }),
      loadImage(opts.imageSrc).catch(function () { return null; })
    ]).then(function (res) {
      var img = res[1];
      var canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      try { render(canvas, opts, img); }
      catch (e) {
        try { console.warn('HallCard render issue, retrying without image', e); render(canvas, opts, null); } catch (e2) {}
      }
      return toBlob(canvas).catch(function () {
        // tainted canvas (cross-origin image) or other failure: redraw with placeholder
        var c2 = document.createElement('canvas');
        c2.width = W; c2.height = H;
        try { render(c2, opts, null); } catch (e) {}
        return toBlob(c2);
      });
    });
  }

  function filenameFor(credit) {
    var who = String(credit || '').replace(/^caption by\s+/i, '').toLowerCase();
    try { who = who.normalize('NFKD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    who = who.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return 'closed-caption-gallery' + (who ? '-' + who : '') + '.png';
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} URL.revokeObjectURL(url); }, 4000);
  }

  function share(blob, o) {
    o = o || {};
    var filename = o.filename || 'closed-caption-gallery.png';
    if (!/\.png$/i.test(filename)) filename += '.png';
    return new Promise(function (resolve) {
      var file = null;
      try { file = new File([blob], filename, { type: 'image/png' }); } catch (e) {}
      var canShare = false;
      try { canShare = !!(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) {}
      function fallback() {
        try { download(blob, filename); resolve('downloaded'); } catch (e) { resolve('cancelled'); }
      }
      if (!canShare) return fallback();
      var data = { files: [file] };
      if (o.title) data.title = o.title;
      if (o.text) data.text = o.text;
      navigator.share(data).then(function () { resolve('shared'); }, function (err) {
        if (err && err.name === 'AbortError') resolve('cancelled');
        else fallback(); // e.g. NotAllowedError (lost user activation) -> download instead
      });
    });
  }

  window.HallCard = { make: make, share: share, filenameFor: filenameFor, siteUrl: siteUrl, siteLabel: siteLabel, drawQr: drawQr };
  // warm the font early
  try { loadFonts(); } catch (e) {}
})();
