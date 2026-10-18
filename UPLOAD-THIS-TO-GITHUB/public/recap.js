/* Closed Caption — Night recap image (1080×1350 portrait, for the family group chat).
 * Self-contained (injected CSS, `rc-` prefix). Exposes window.Recap = { open, make, data }.
 * Reads the game's globals at call time: state, gamePoobah, computeAwards, roundVotes,
 * playerById, nameOf, playerColor, getPlayerIndex, poobahHat. Shares via window.HallCard.share.
 */
(function () {
  var W = 1080, H = 1350, M = 60;
  var C = { paper: '#FFF8EA', paper2: '#FFF1D6', ink: '#1F1A17', ink2: '#4A433D', muted: '#6E655C', line: '#E6DCC8',
    yellow: '#FFD23F', yellowD: '#C99A08', yellowBg: '#FFF4C7', violet: '#6E4CF5', night: '#2A2160', lilac: '#D7CBFF', lilac2: '#E9E2FF', teal: '#12A587', red: '#E8453A' };
  var DISPLAY = "'Fredoka', 'Nunito', system-ui, sans-serif", SANS = "'Nunito', -apple-system, system-ui, sans-serif";

  var CSS = [
    '.rc-wrap{position:relative;}',
    '.rc-img{width:100%;display:block;border:2.5px solid var(--ink,#1F1A17);border-radius:12px;box-shadow:4px 4px 0 var(--ink,#1F1A17);background:#FFF8EA;}',
    '.rc-load{aspect-ratio:1080/1350;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border:2.5px dashed var(--line,#E6DCC8);border-radius:12px;}',
    '.rc-hint{text-align:center;font-size:12.5px;font-weight:800;color:var(--muted,#6E655C);margin:10px 0 0;}',
    '.rc-btn{margin-top:14px;}'
  ].join('\n');
  function injectCss() { if (document.getElementById('rc-style')) return; var s = document.createElement('style'); s.id = 'rc-style'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }
  injectCss();

  function g(name) { try { return typeof window[name] === 'function' ? window[name] : null; } catch (e) { return null; } }
  function st() { try { return typeof state !== 'undefined' ? state : null; } catch (e) { return null; } }
  function nm(id) { var f = g('nameOf'); return f ? f(id) : '?'; }
  function color(id) { try { return playerColor(getPlayerIndex(id)); } catch (e) { return C.violet; } }
  function joinNames(a) { a = a.filter(Boolean); return a.length <= 1 ? (a[0] || '') : a.length === 2 ? a[0] + ' & ' + a[1] : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1]; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function initialsOf(name) {
    var parts = String(name || '?').trim().split(/\s+/);
    var s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 1);
    return s.toUpperCase();
  }

  /* ── What goes on the card ── */
  function data() {
    var s = st(); if (!s) return null;
    var players = (s.players || []).slice().sort(function (a, b) { return b.score - a.score; });
    var top = players.length ? players[0].score : 0;
    var winners = players.filter(function (p) { return p.score === top; });
    var poobah = null; try { poobah = g('gamePoobah') ? gamePoobah() : null; } catch (e) {}
    var hist = s.history || [];
    // The night's framed captions (up to 3), else the night's best bluffs
    var framed = (s.hallOfFame || []).slice(0, 3).map(function (e) {
      return { image: e.image, caption: e.caption, credit: e.isReal || !e.writerName ? 'the real caption' : e.writerName, note: (e.flaggers && e.flaggers.length) ? 'framed by ' + joinNames(e.flaggers) : '' };
    });
    var capsTitle = 'Framed tonight';
    if (!framed.length) {
      var bluffs = [];
      hist.forEach(function (r) {
        var v = {}, real = function (t) { return t === 'closed' ? !!r.closedIsCorrect : !!(r.openCaptions[t] || {}).isCorrect; };
        var author = function (t) { return t === 'closed' ? r.closedPlayerId : (r.openCaptions[t] || {}).playerId; };
        (r.bets || []).forEach(function (b) {
          if (b.target === 'pass' || real(b.target)) return;
          var a = author(b.target), n = b.count + (b.stolen || 0);
          if (a && a !== b.playerId && n > 0) v[b.target] = (v[b.target] || 0) + n;
        });
        Object.keys(v).forEach(function (t) {
          var c = t === 'closed' ? { caption: r.closedCaption, playerId: r.closedPlayerId } : r.openCaptions[Number(t)] || {};
          if (c.caption) bluffs.push({ image: r.cartoon && r.cartoon.image, caption: c.caption, credit: c.playerName || r.closedPlayerName || nm(c.playerId), note: 'fooled ' + plural(v[t], 'chip'), n: v[t] });
        });
      });
      bluffs.sort(function (a, b) { return b.n - a.n; });
      framed = bluffs.slice(0, 3);
      capsTitle = 'Best bluffs of the night';
    }
    // Fun stats: moon landings + most robbed, then fallbacks
    var moons = 0, moonBy = {}, robbed = {}, sharp = {};
    hist.forEach(function (r) {
      var right = function (t) { return t === 'closed' ? !!r.closedIsCorrect : !!(r.openCaptions[t] || {}).isCorrect; };
      (r.bets || []).forEach(function (b) {
        if (b.target === 'pass') return;
        var n = b.count + (b.stolen || 0);
        if (b.stage === 1 && n === 2 && right(b.target)) { moons++; moonBy[b.playerId] = (moonBy[b.playerId] || 0) + 1; }
        if (n > 0 && right(b.target)) sharp[b.playerId] = (sharp[b.playerId] || 0) + n;
      });
      if (r.steal && r.steal.victimId) robbed[r.steal.victimId] = (robbed[r.steal.victimId] || 0) + 1;
    });
    var best = function (o) { var m = 0, ids = []; Object.keys(o).forEach(function (k) { if (o[k] > m) { m = o[k]; ids = [k]; } else if (o[k] === m && m > 0) ids.push(k); }); return m ? { ids: ids, n: m } : null; };
    var stats = [], t;
    if (moons) { t = best(moonBy); stats.push({ kind: 'moon', big: String(moons), label: moons === 1 ? 'moon landing' : 'moon landings', sub: t ? 'Led by ' + joinNames(t.ids.map(nm)) + (t.n > 1 ? ' (' + t.n + (t.ids.length > 1 ? ' each)' : ')') : '') : '' }); }
    if ((t = best(robbed))) stats.push({ kind: 'robbed', ids: t.ids, big: joinNames(t.ids.map(nm)), label: 'most robbed', sub: 'Lost ' + plural(t.n, 'chip') + ' to the dealer' });
    if (stats.length < 2 && (t = best(sharp))) stats.push({ kind: 'sharp', ids: t.ids, big: joinNames(t.ids.map(nm)), label: 'sharpest eye', sub: plural(t.n, 'chip') + ' on the real caption' });
    if (stats.length < 2 && !moons) stats.push({ kind: 'moon', big: '0', label: 'moon landings', sub: 'Nobody shot the moon tonight' });
    if (stats.length < 2) stats.push({ kind: 'rounds', big: String(hist.length || s.round || 0), label: hist.length === 1 ? 'round played' : 'rounds played', sub: plural(players.length, 'player') + ' at the table' });
    return {
      date: new Date(),
      code: s.code, rounds: hist.length || s.round || 0, nPlayers: players.length,
      winners: winners.map(function (p) { return { id: p.id, name: p.name }; }), winScore: top,
      poobah: poobah ? { ids: poobah.ids, names: poobah.ids.map(nm), n: poobah.n, crowns: poobah.crowns } : null,
      caps: framed, capsTitle: capsTitle, stats: stats.slice(0, 2)
    };
  }

  /* ── Drawing helpers ── */
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function panel(ctx, x, y, w, h, r, fill, shadow) {
    ctx.save();
    rr(ctx, x + shadow, y + shadow, w, h, r); ctx.fillStyle = C.ink; ctx.fill();
    rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.restore();
  }
  function font(weight, size, fam) { return weight + ' ' + size + 'px ' + (fam || SANS); }
  function tracked(ctx, text, x, y, track, align) {
    var w = 0, i; for (i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + (i < text.length - 1 ? track : 0);
    var sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.save(); ctx.textAlign = 'left';
    for (i = 0; i < text.length; i++) { ctx.fillText(text[i], sx, y); sx += ctx.measureText(text[i]).width + track; }
    ctx.restore(); return w;
  }
  function wrap(ctx, text, maxW) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW || !line) line = t; else { lines.push(line); line = w; }
    });
    if (line) lines.push(line);
    if (lines.length < 2) return lines;
    // Balance: the narrowest width that still needs no more lines (no lonely last word)
    var lo = maxW * 0.5, hi = maxW, best = lines;
    for (var i = 0; i < 12; i++) {
      var mid = (lo + hi) / 2, t = greedy(ctx, words, mid);
      if (t.length <= lines.length && t.every(function (l) { return ctx.measureText(l).width <= maxW; })) { best = t; hi = mid; } else lo = mid;
    }
    return best;
  }
  function greedy(ctx, words, maxW) {
    var lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width <= maxW || !line) line = t; else { lines.push(line); line = w; } });
    if (line) lines.push(line);
    return lines;
  }
  // Fit text into maxLines by shrinking, then ellipsize
  function fitLines(ctx, text, maxW, maxLines, weight, size, minSize, fam) {
    var s = size, lines;
    for (; s >= minSize; s -= 2) { ctx.font = font(weight, s, fam); lines = wrap(ctx, text, maxW); if (lines.length <= maxLines) return { lines: lines, size: s }; }
    s = minSize; ctx.font = font(weight, s, fam); lines = wrap(ctx, text, maxW);
    var out = lines.slice(0, maxLines), last = out[maxLines - 1];
    while (last.length && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1).trim();
    out[maxLines - 1] = last.replace(/[,.;:!?-]+$/, '') + '…';
    return { lines: out, size: s };
  }
  function fitOne(ctx, text, maxW, weight, size, minSize, fam) {
    var s = size; for (; s > minSize; s -= 2) { ctx.font = font(weight, s, fam); if (ctx.measureText(text).width <= maxW) return s; }
    ctx.font = font(weight, minSize, fam); return minSize;
  }
  function clip(ctx, t, maxW) { if (ctx.measureText(t).width <= maxW) return t; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t.trim() + '…'; }
  function chip(ctx, cx, cy, r, col, label) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.09, r, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    for (var k = 0; k < 6; k++) {   // edge spots, like the in-game poker chips
      var a0 = (8 + k * 60 - 90) * Math.PI / 180, a1 = a0 + 28 * Math.PI / 180;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.045); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = Math.max(3, r * 0.08); ctx.strokeStyle = C.ink; ctx.stroke();
    if (label) {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(700, Math.round(r * (label.length > 1 ? 0.62 : 0.78)), DISPLAY);
      ctx.fillText(label, cx, cy + r * 0.04);
    }
    ctx.restore();
  }
  function moonIcon(ctx, cx, cy, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = C.yellow; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(201,154,8,.45)';
    [[-.35, -.25, .2], [.3, .15, .26], [-.1, .45, .14]].forEach(function (c) { ctx.beginPath(); ctx.arc(cx + c[0] * r, cy + c[1] * r, c[2] * r, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.restore();
  }
  function containImage(ctx, img, x, y, w, h) {
    ctx.save(); rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
    if (img) {
      var s = Math.min((w - 12) / img.naturalWidth, (h - 12) / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = C.paper2; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
  }
  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var img = new Image(), done = false, fin = function (v) { if (!done) { done = true; resolve(v); } };
      img.onload = function () { fin(img.naturalWidth ? img : null); };
      img.onerror = function () { fin(null); };
      setTimeout(function () { fin(img.complete && img.naturalWidth ? img : null); }, 6000);
      img.src = src;
    });
  }
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var all = Promise.all(['700 64px Fredoka', '600 40px Fredoka', '800 36px Nunito', '900 24px Nunito', '700 30px Nunito'].map(function (f) { return document.fonts.load(f, 'AaBb “’…'); })).catch(function () {});
    return Promise.race([all, new Promise(function (r) { setTimeout(r, 2500); })]);
  }
  function hatImage() {
    try {
      if (typeof poobahHat !== 'function') return Promise.resolve(null);
      var svg = poobahHat(240).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    } catch (e) { return Promise.resolve(null); }
  }

  /* ── The card ── */
  function draw(canvas, d, imgs) {
    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    // Paper + dots
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(31,26,23,.075)';
    for (var yy = 14; yy < H; yy += 28) for (var xx = 14 + ((yy / 28) % 2) * 14; xx < W; xx += 28) { ctx.beginPath(); ctx.arc(xx, yy, 2.2, 0, Math.PI * 2); ctx.fill(); }

    // Header: CC badge + wordmark, date sticker
    var y = 64;
    rr(ctx, M, y, 76, 50, 10); ctx.fillStyle = C.ink; ctx.fill();
    ctx.fillStyle = C.yellow; ctx.font = font(700, 32, DISPLAY); ctx.textAlign = 'center'; ctx.fillText('CC', M + 38, y + 37);
    ctx.fillStyle = C.ink; ctx.font = font(700, 36, DISPLAY); ctx.textAlign = 'left';
    tracked(ctx, 'CLOSED CAPTION', M + 94, y + 38, 2.5);
    var ds = d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    ctx.font = font(900, 25); var dw = ctx.measureText(ds).width + 44;
    ctx.save(); ctx.translate(W - M - dw / 2, y + 25); ctx.rotate(2 * Math.PI / 180);
    rr(ctx, -dw / 2 + 4, -24 + 4, dw, 48, 24); ctx.fillStyle = C.ink; ctx.fill();
    rr(ctx, -dw / 2, -24, dw, 48, 24); ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(ds, 0, 9); ctx.restore();

    y = 196;
    ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = font(700, 82, DISPLAY);
    ctx.fillText('Game night recap', M - 3, y);
    ctx.fillStyle = C.muted; ctx.font = font(800, 28);
    ctx.fillText(plural(d.nPlayers, 'player') + ' · ' + plural(d.rounds, 'round') + ' · bluffing, betting and at least one bad decision', M, y + 46);
    // (keep the subline on one line)
    // Hero cards
    var hy = 272, hh = 296, gap = 30, hw = (W - 2 * M - gap) / 2;
    // Winner
    var wx = M;
    panel(ctx, wx, hy, hw, hh, 30, C.yellow, 9);
    ctx.textAlign = 'center'; ctx.fillStyle = C.ink2; ctx.font = font(900, 23);
    tracked(ctx, d.winners.length > 1 ? 'BEST BETTORS · A TIE' : 'BEST BETTOR', wx + hw / 2, hy + 52, 3, 'center');
    var wn = d.winners.slice(0, 3), cr = wn.length > 1 ? 44 : 50, ICY = hy + 126, NAMEY = hy + 234;
    wn.forEach(function (p, i) { chip(ctx, wx + hw / 2 + (i - (wn.length - 1) / 2) * (cr * 2 + 14), ICY, cr, color(p.id), initialsOf(p.name)); });
    ctx.fillStyle = C.ink;
    var wname = joinNames(wn.map(function (p) { return p.name; }));
    fitOne(ctx, wname, hw - 50, 700, 58, 32, DISPLAY);
    ctx.fillText(wname, wx + hw / 2, NAMEY);
    ctx.fillStyle = C.ink2; ctx.font = font(800, 28);
    ctx.fillText(plural(d.winScore, 'point') + ' · won the night', wx + hw / 2, hy + hh - 28);

    // Grand Poobah
    var px = M + hw + gap;
    panel(ctx, px, hy, hw, hh, 30, C.night, 9);
    ctx.save(); rr(ctx, px, hy, hw, hh, 30); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    for (var sy = hy + 12; sy < hy + hh; sy += 26) for (var sx = px + 12 + (((sy - hy) / 26) % 2) * 13; sx < px + hw; sx += 26) { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    rr(ctx, px, hy, hw, hh, 30); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = C.lilac; ctx.font = font(900, 23);
    tracked(ctx, 'THE GRAND POOBAH', px + hw / 2, hy + 52, 3, 'center');
    if (imgs.hat) { var hh2 = 104, hw2 = hh2 / 1.15; ctx.drawImage(imgs.hat, px + hw / 2 - hw2 / 2, ICY - hh2 / 2 - 4, hw2, hh2); }
    if (d.poobah) {
      var pname = joinNames(d.poobah.names);
      ctx.fillStyle = C.yellow; fitOne(ctx, pname, hw - 50, 700, 58, 32, DISPLAY);
      ctx.fillText(pname, px + hw / 2, NAMEY);
      ctx.fillStyle = C.lilac2; ctx.font = font(800, 28);
      ctx.fillText(plural(d.poobah.n, 'vote') + ' on fake captions', px + hw / 2, hy + hh - 28);
    } else {
      ctx.fillStyle = C.yellow; ctx.font = font(700, 48, DISPLAY); ctx.fillText('Unclaimed', px + hw / 2, NAMEY);
      ctx.fillStyle = C.lilac2; ctx.font = font(800, 26); ctx.fillText('Nobody fooled anybody', px + hw / 2, hy + hh - 28);
    }

    // Captions
    var cy0 = 626, statsY = 1118, n = d.caps.length;
    ctx.textAlign = 'left'; ctx.fillStyle = C.yellowD; ctx.font = font(900, 24);
    tracked(ctx, d.capsTitle.toUpperCase(), M, cy0 - 4, 3);
    var areaTop = cy0 + 24, areaH = statsY - 36 - areaTop;
    if (!n) {
      panel(ctx, M, areaTop, W - 2 * M, 150, 26, '#fff', 7);
      ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = font(800, 32);
      ctx.fillText('Nothing framed tonight. Tough room.', W / 2, areaTop + 86);
    } else {
      var cg = 22, ch = Math.min(n === 1 ? 380 : 220, (areaH - cg * (n - 1)) / n), cw = W - 2 * M;
      var top0 = areaTop + (areaH - (ch * n + cg * (n - 1))) / 2;
      d.caps.forEach(function (c, i) {
        var y0 = top0 + i * (ch + cg), rot = (i % 2 ? 0.5 : -0.5) * Math.PI / 180;
        ctx.save(); ctx.translate(M + cw / 2, y0 + ch / 2); ctx.rotate(rot); ctx.translate(-(M + cw / 2), -(y0 + ch / 2));
        panel(ctx, M, y0, cw, ch, 24, '#FFFDF6', 7);
        var pad = 16, th = ch - pad * 2, im = imgs.caps[i], asp = im ? im.naturalWidth / im.naturalHeight : 1.25;
        var tw = Math.round(Math.min(Math.max(th * asp + 12, th * 0.72), n === 1 ? 360 : 250));
        containImage(ctx, imgs.caps[i], M + pad, y0 + pad, tw, th);
        var tx = M + pad + tw + 26, tmax = M + cw - 28 - tx;
        var big = n === 1 ? 50 : n === 2 ? 42 : 34, lines = n === 1 ? 5 : n === 2 ? 3 : 2;
        var f = fitLines(ctx, '“' + c.caption + '”', tmax, lines, 800, big, big - 8);
        var lh = Math.round(f.size * 1.2), creditS = n === 3 ? 25 : n === 2 ? 27 : 30, blockH = f.lines.length * lh + 12 + creditS;
        var ty = y0 + (ch - blockH) / 2 + f.size * 0.85;
        ctx.fillStyle = C.ink; ctx.font = font(800, f.size); ctx.textAlign = 'left';
        f.lines.forEach(function (l, k) { ctx.fillText(l, tx - (k === 0 ? ctx.measureText('“').width * 0.0 : 0), ty + k * lh); });
        var credY = ty + (f.lines.length - 1) * lh + 12 + creditS + 2;
        ctx.font = font(900, creditS); ctx.fillStyle = C.ink2;
        var credit = '— ' + c.credit; ctx.fillText(credit, tx, credY);
        if (c.note) {
          var cwid = ctx.measureText(credit).width; ctx.font = font(700, creditS); ctx.fillStyle = C.muted;
          var note = ' · ' + c.note; while (note.length > 4 && ctx.measureText(note).width > tmax - cwid) note = note.slice(0, -2).replace(/\s+$/, '') + '…';
          if (ctx.measureText(note).width <= tmax - cwid) ctx.fillText(note, tx + cwid, credY);
        }
        ctx.restore();
      });
    }

    // Fun stats
    var sw = (W - 2 * M - gap) / 2, sh = 132;
    d.stats.forEach(function (s, i) {
      var x0 = M + i * (sw + gap);
      panel(ctx, x0, statsY, sw, sh, 24, i === 0 ? C.yellowBg : '#fff', 7);
      var icx = x0 + 70, icy = statsY + sh / 2;
      if (s.kind === 'moon') moonIcon(ctx, icx, icy, 38);
      else if (s.ids && s.ids.length) chip(ctx, icx, icy - 3, 38, color(s.ids[0]), initialsOf(nm(s.ids[0])));
      else { ctx.save(); ctx.beginPath(); ctx.arc(icx, icy, 38, 0, Math.PI * 2); ctx.fillStyle = C.teal; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = font(700, 36, DISPLAY); ctx.textAlign = 'center'; ctx.fillText('#', icx, icy + 13); ctx.restore(); }
      var tx = x0 + 128, tmax = x0 + sw - 22 - tx;
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted; ctx.font = font(900, 21); tracked(ctx, s.label.toUpperCase(), tx, statsY + 36, 2);
      ctx.fillStyle = C.ink; fitOne(ctx, s.big, tmax, 700, 44, 26, DISPLAY); ctx.fillText(clip(ctx, s.big, tmax), tx, statsY + 82);
      if (s.sub) { ctx.fillStyle = C.ink2; fitOne(ctx, s.sub, tmax, 800, 24, 18); ctx.fillText(clip(ctx, s.sub, tmax), tx, statsY + sh - 16); }
    });

    // Footer
    ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = font(800, 23);
    var foot = 'Closed Caption · the caption-bluffing party game';
    ctx.fillText(foot, W / 2, H - 46);
    var fw = ctx.measureText(foot).width;
    ctx.strokeStyle = C.line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(M, H - 54); ctx.lineTo(W / 2 - fw / 2 - 22, H - 54); ctx.moveTo(W / 2 + fw / 2 + 22, H - 54); ctx.lineTo(W - M, H - 54); ctx.stroke();
  }

  function toBlob(canvas) { return new Promise(function (res, rej) { try { canvas.toBlob(function (b) { b ? res(b) : rej(new Error('toBlob null')); }, 'image/png'); } catch (e) { rej(e); } }); }

  function make() {
    var d = data(); if (!d) return Promise.reject(new Error('no game'));
    return Promise.all([loadFonts(), hatImage(), Promise.all(d.caps.map(function (c) { return loadImage(c.image ? '/images/' + c.image : null); }))]).then(function (r) {
      var imgs = { hat: r[1], caps: r[2] };
      var canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      try { draw(canvas, d, imgs); } catch (e) { console.warn('Recap draw', e); }
      return toBlob(canvas).catch(function () {   // tainted (e.g. SVG on an old Safari): draw again without the pictures
        var c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
        draw(c2, d, { hat: null, caps: [] }); return toBlob(c2);
      });
    });
  }

  var blob = null, url = null;
  function filename() { var t = new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return 'closed-caption-night-' + t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + '.png'; }
  function sheet(html) { var b = document.getElementById('sheet-body'), s = document.getElementById('sheet'); if (!b || !s) return false; b.innerHTML = html; s.classList.add('on'); return true; }
  function close() { try { closeMenu(); } catch (e) { var s = document.getElementById('sheet'); if (s) s.classList.remove('on'); } }
  function open() {
    if (!sheet('<div class="grip"></div><p class="eyebrow center" style="margin-bottom:10px;">📸 Night recap</p><div class="rc-load"><span class="spin"></span><p class="small">Developing the picture…</p></div>')) return;
    make().then(function (b) {
      blob = b; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b);
      sheet('<div class="grip"></div><p class="eyebrow center" style="margin-bottom:10px;">📸 Night recap</p>'
        + '<div class="rc-wrap"><img class="rc-img" id="rc-img" src="' + url + '" alt="Game night recap picture"></div>'
        + '<p class="rc-hint">For the group chat. Share it, or it saves to your phone.</p>'
        + '<div class="stack rc-btn"><button class="btn btn-yellow" id="rc-share">📤 Share</button><button class="btn btn-sm" id="rc-close">Close</button></div>');
      document.getElementById('rc-share').onclick = share;
      document.getElementById('rc-close').onclick = close;
    }).catch(function (e) {
      console.warn('Recap', e); close();
      try { showToast('Couldn’t make the recap — try again'); } catch (e2) {}
    });
  }
  function share() {
    if (!blob) return;
    var opts = { title: 'Closed Caption — game night', text: 'Closed Caption, tonight.', filename: filename() };
    var p = window.HallCard && window.HallCard.share ? window.HallCard.share(blob, opts) : Promise.resolve('cancelled');
    p.then(function (r) { if (r === 'downloaded') { try { showToast('Saved to your downloads', 'ok'); } catch (e) {} } });
  }

  window.Recap = { open: open, make: make, data: data, share: share };
})();
