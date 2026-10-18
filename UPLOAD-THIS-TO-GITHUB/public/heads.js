/* Closed Caption — BIG HEAD MODE. The round's winner gets a quick, crude, cut-out-paper gag starring
   their own face (the selfie they took in the lobby): head on a construction-paper body, jaw that flaps
   when they "talk", jerky stop-motion movement. Intentionally crude. ~5s, on every phone at once.
   Acts register with ccHeads.add({ name, tag, run(ctx) }); the server deals act numbers like a deck
   (game.js WIN_ACT_COUNT). Packs: heads.js (0-2), heads-pack1.js (3-13), heads-pack2.js (14-24).
   Also: ccHeads.poobah(ids) — the Grand Poobah finale's face-on-a-throne bit.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, playerColor,
   getPlayerIndex, big, buzz, tone, noise, clockOffset. CSS prefix: bh-. */
(function () {
  'use strict';
  var INK = '#1F1A17';
  var DUR = 5200;   // every act: 5.2s, then a short fade

  var CSS = [
    '#bighead{position:fixed;inset:0;z-index:760;display:none;overflow:hidden;background:#7EC8E3;cursor:pointer;}',
    '#bighead.on{display:block;animation:bhIn .18s steps(2) both;}',
    '#bighead.out{opacity:0;transition:opacity .35s;}',
    '@keyframes bhIn{from{opacity:0}to{opacity:1}}',
    '.bh-stage{position:absolute;inset:0;overflow:hidden;}',
    '.bh-ban{position:absolute;left:12px;right:12px;bottom:calc(18px + var(--sab,0px));z-index:50;text-align:center;background:#FFF8EA;color:' + INK + ';border:3px solid ' + INK + ';border-radius:14px;padding:10px 12px 9px;box-shadow:4px 4px 0 ' + INK + ';transform:rotate(-1.2deg);}',
    '.bh-ban b{display:block;font-family:var(--display);font-size:22px;line-height:1.05;}',
    '.bh-ban span{display:block;font-size:13px;font-weight:800;color:#5a4f47;margin-top:3px;}',
    '.bh-top{position:absolute;left:0;right:0;top:calc(14px + var(--sat,0px));z-index:50;text-align:center;font-family:var(--display);font-weight:700;font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:' + INK + ';}',
    '.bh-top span{display:inline-block;background:#FFF8EA;border:2px solid ' + INK + ';border-radius:999px;padding:3px 10px;}',
    /* a thing on the stage: absolutely placed at (0,0), moved by transform */
    '.bh-it{position:absolute;left:0;top:0;will-change:transform,opacity;}',
    /* the head: two layers of the same photo, the jaw below the mouth line drops when they talk */
    '.bh-head{position:relative;width:var(--hs,90px);height:calc(var(--hs,90px) * 1.08);}',
    '.bh-head::before{content:"";position:absolute;left:1%;right:1%;top:50%;height:30%;background:#d9a77e;border-radius:30%;z-index:0;}',
    '.bh-head .bh-skull,.bh-head .bh-jaw{position:absolute;inset:0;border-radius:50% 50% 47% 47%;border:3px solid ' + INK + ';background-size:cover;background-position:50% 42%;background-color:var(--hc,#F2C9A0);}',
    '.bh-head .bh-skull{clip-path:inset(0 0 38% 0);-webkit-clip-path:inset(0 0 38% 0);z-index:2;}',
    '.bh-head .bh-jaw{clip-path:inset(61% 0 0 0);-webkit-clip-path:inset(61% 0 0 0);z-index:1;}',
    '.bh-head .bh-mouth{position:absolute;left:27%;right:27%;top:57%;height:24%;background:#3a0f12;border-radius:20% 20% 50% 50%;z-index:0;}',   /* always behind the jaw: when it drops, you see mouth, not sky */
    '.bh-head.talk .bh-jaw{animation:bhJaw .22s steps(1) infinite;}',
    
    '@keyframes bhJaw{0%{transform:translateY(0)}50%{transform:translateY(calc(var(--hs,90px) * .09))}}',
    '.bh-head.scream .bh-jaw{transform:translateY(calc(var(--hs,90px) * .16));}',
    
    /* no selfie: a crude drawn face in their chip colour */
    '.bh-head.nf .bh-skull,.bh-head.nf .bh-jaw{background-image:none!important;background:var(--hc);}',
    '.bh-head.nf .bh-eyes{position:absolute;left:18%;right:18%;top:30%;height:22%;z-index:3;display:flex;justify-content:space-between;}',
    '.bh-head.nf .bh-eyes i{width:42%;height:100%;background:#fff;border:2.5px solid ' + INK + ';border-radius:50%;position:relative;}',
    '.bh-head.nf .bh-eyes i::after{content:"";position:absolute;width:30%;height:34%;background:' + INK + ';border-radius:50%;left:38%;top:36%;}',
    '.bh-head.nf .bh-ini{position:absolute;left:0;right:0;top:4%;z-index:3;text-align:center;font-family:var(--display);font-weight:700;font-size:calc(var(--hs,90px) * .2);color:#fff;text-shadow:0 1.5px 0 ' + INK + ';}',
    '.bh-heads{display:flex;justify-content:center;}',
    '.bh-heads>.bh-head+.bh-head{margin-left:calc(var(--hs,90px) * -.3);}',
    /* speech bubble */
    '.bh-say{position:absolute;z-index:40;max-width:220px;background:#fff;color:' + INK + ';border:3px solid ' + INK + ';border-radius:16px;padding:7px 11px;font-family:var(--display);font-weight:700;font-size:19px;line-height:1.1;text-align:center;opacity:0;white-space:normal;}',
    '.bh-say::after{content:"";position:absolute;left:var(--tx,30%);bottom:-13px;border:10px solid transparent;border-top-color:' + INK + ';border-bottom:0;}',
    '.bh-say::before{content:"";position:absolute;left:calc(var(--tx,30%) + 3px);bottom:-8px;border:7px solid transparent;border-top-color:#fff;border-bottom:0;z-index:1;}',
    '.bh-txt{position:absolute;z-index:45;font-family:var(--display);font-weight:700;color:#fff;-webkit-text-stroke:2px ' + INK + ';paint-order:stroke fill;text-shadow:3px 3px 0 ' + INK + ';white-space:nowrap;opacity:0;}',
    '.bh-emoji{position:absolute;line-height:1;opacity:0;}',
    /* the Poobah finale */
    '.bh-poo{position:relative;width:260px;height:300px;margin:0 auto;}',
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-heads-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  /* ── Bits ── */
  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function colourOf(pid) { try { var i = getPlayerIndex(pid); return i < 0 ? '#E8453A' : playerColor(i); } catch (e) { return '#E8453A'; } }
  function faceUrl(pid) {
    if (state && state.faceData && state.faceData[pid]) return state.faceData[pid];   // a phone's own copy (and tests)
    var v = state && state.faces && state.faces[pid];
    return v ? '/face/' + encodeURIComponent(state.code) + '/' + encodeURIComponent(pid) + '?v=' + v : null;
  }
  function initials(pid) { try { return String(nameOf(pid) || '?').trim().slice(0, 1).toUpperCase(); } catch (e) { return '?'; } }
  // One head (or a cluster of heads for a tie). px = head width.
  function headHtml(ids, px, cls) {
    ids = [].concat(ids || []);
    var one = function (pid) {
      var url = faceUrl(pid), c = colourOf(pid);
      var bg = url ? 'background-image:url(' + url + ');' : '';
      return '<div class="bh-head ' + (url ? '' : 'nf ') + (cls || '') + '" style="--hs:' + px + 'px;--hc:' + c + '">' +
        '<i class="bh-mouth"></i><i class="bh-skull" style="' + bg + '"></i><i class="bh-jaw" style="' + bg + '"></i>' +
        (url ? '' : '<span class="bh-eyes"><i></i><i></i></span><span class="bh-ini">' + esc(initials(pid)) + '</span>') + '</div>';
    };
    if (ids.length <= 1) return one(ids[0]);
    return '<div class="bh-heads">' + ids.slice(0, 3).map(one).join('') + '</div>';
  }
  // A crude construction-paper body (viewBox 100×130, neck at (50,6)). opts: shirt, pants, arms: 'down'|'up'|'out'|'flex'|'wave', legs: 'stand'|'run'|'sit'|'none', skin, extra (svg drawn on top)
  function bodySvg(o) {
    o = o || {};
    var sh = o.shirt || '#E8453A', pa = o.pants || '#2E5EAA', sk = o.skin || '#F2C9A0', st = 'stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"';
    var arms = {
      down: '<path d="M22 18 L12 62" ' + st + ' stroke-width="11" stroke-linecap="round" stroke="' + INK + '"/><path d="M22 18 L12 62" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="12" cy="66" r="7" fill="' + sk + '" ' + st + '/>' +
            '<path d="M78 18 L88 62" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M78 18 L88 62" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="88" cy="66" r="7" fill="' + sk + '" ' + st + '/>',
      up: '<path d="M22 18 L8 -22" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M22 18 L8 -22" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="7" cy="-26" r="7" fill="' + sk + '" ' + st + '/>' +
          '<path d="M78 18 L92 -22" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M78 18 L92 -22" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="93" cy="-26" r="7" fill="' + sk + '" ' + st + '/>',
      out: '<path d="M22 18 L-14 22" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M22 18 L-14 22" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="-18" cy="22" r="7" fill="' + sk + '" ' + st + '/>' +
           '<path d="M78 18 L114 22" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M78 18 L114 22" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="118" cy="22" r="7" fill="' + sk + '" ' + st + '/>',
      flex: '<path d="M22 18 L-6 22 L-2 -6" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 18 L-6 22 L-2 -6" fill="none" stroke="' + sk + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-4" cy="14" r="9" fill="' + sk + '" ' + st + '/><circle cx="-2" cy="-10" r="7" fill="' + sk + '" ' + st + '/>' +
            '<path d="M78 18 L106 22 L102 -6" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M78 18 L106 22 L102 -6" fill="none" stroke="' + sk + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="104" cy="14" r="9" fill="' + sk + '" ' + st + '/><circle cx="102" cy="-10" r="7" fill="' + sk + '" ' + st + '/>',
      wave: '<path d="M22 18 L12 62" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M22 18 L12 62" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="12" cy="66" r="7" fill="' + sk + '" ' + st + '/>' +
            '<g class="bh-wave" style="transform-origin:78px 18px"><path d="M78 18 L94 -20" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M78 18 L94 -20" stroke="' + sh + '" stroke-width="6" stroke-linecap="round"/><circle cx="95" cy="-24" r="7" fill="' + sk + '" ' + st + '/></g>',
    };
    var legs = {
      stand: '<rect x="30" y="88" width="16" height="26" fill="' + pa + '" ' + st + '/><rect x="54" y="88" width="16" height="26" fill="' + pa + '" ' + st + '/><ellipse cx="36" cy="118" rx="13" ry="6" fill="' + INK + '"/><ellipse cx="64" cy="118" rx="13" ry="6" fill="' + INK + '"/>',
      run: '<path d="M40 88 L26 112" stroke="' + INK + '" stroke-width="17" stroke-linecap="round"/><path d="M40 88 L26 112" stroke="' + pa + '" stroke-width="11" stroke-linecap="round"/><ellipse cx="20" cy="116" rx="12" ry="6" fill="' + INK + '"/>' +
           '<path d="M60 88 L76 108" stroke="' + INK + '" stroke-width="17" stroke-linecap="round"/><path d="M60 88 L76 108" stroke="' + pa + '" stroke-width="11" stroke-linecap="round"/><ellipse cx="82" cy="112" rx="12" ry="6" fill="' + INK + '"/>',
      sit: '<rect x="26" y="86" width="48" height="16" fill="' + pa + '" ' + st + '/><rect x="26" y="100" width="14" height="18" fill="' + pa + '" ' + st + '/><rect x="60" y="100" width="14" height="18" fill="' + pa + '" ' + st + '/><ellipse cx="32" cy="121" rx="11" ry="5" fill="' + INK + '"/><ellipse cx="68" cy="121" rx="11" ry="5" fill="' + INK + '"/>',
      none: '',
    };
    return '<svg class="bh-body" viewBox="-24 -34 148 160" width="' + (o.w || 110) + '" style="overflow:visible;display:block" aria-hidden="true">' +
      (legs[o.legs || 'stand'] || '') +
      '<path d="M24 10 Q50 2 76 10 L80 90 Q50 96 20 90 Z" fill="' + sh + '" ' + st + '/>' +
      '<path d="M50 12 V88" stroke="' + INK + '" stroke-width="1.6" stroke-opacity=".35"/><circle cx="50" cy="40" r="2.6" fill="' + INK + '"/><circle cx="50" cy="58" r="2.6" fill="' + INK + '"/>' +
      (arms[o.arms || 'down'] || '') + (o.extra || '') + '</svg>';
  }

  /* ── The stage ── */
  var root = null;
  function overlay() {
    if (!root) { root = document.createElement('div'); root.id = 'bighead'; document.body.appendChild(root); }
    return root;
  }
  var timers = [];
  function close() { timers.forEach(clearTimeout); timers = []; if (root) { root.className = ''; root.innerHTML = ''; root.onclick = null; } var sp = document.getElementById('bh-stamp'); if (sp) sp.remove(); }

  // ctx: everything an act needs. Times are ms from the shared start.
  function makeCtx(o, ids, startAt, seed) {
    var stage = o.querySelector('.bh-stage');
    var W = o.clientWidth || innerWidth, H = o.clientHeight || innerHeight;
    var lag = Math.max(0, performance.now() - startAt), rnd = seeded(seed || 7);
    var T = function (fn, ms) { timers.push(setTimeout(function () { try { fn(); } catch (e) { console.error(e); } }, Math.max(0, startAt + ms - performance.now()))); };
    var pin = function (a) { if (!a) return a; try { if (document.timeline && document.timeline.currentTime != null) a.startTime = startAt; } catch (e) { a.currentTime = lag; } return a; };
    var ctx = {
      stage: stage, W: W, H: H, ids: ids, rnd: rnd, DUR: DUR, INK: INK,
      names: listNamesSafe(ids), color: colourOf(ids[0]), colors: ids.map(colourOf),
      me: ids.indexOf(myPlayerId) >= 0,
      T: T,
      // add(html) → element on the stage (absolutely placed, move it with ctx.path/anim)
      add: function (html, z, parent) { var d = document.createElement('div'); d.className = 'bh-it'; d.style.zIndex = z || 10; d.innerHTML = html; (parent || stage).appendChild(d); return d; },
      head: function (px, cls) { return headHtml(ids, px || 90, cls); },
      body: bodySvg,
      // puppet: head on a body. opts as bodySvg plus px (head size), w (body width). The element's (0,0) is the puppet's feet, centred.
      puppet: function (opts) {
        opts = opts || {}; var px = opts.px || 100, w = opts.w || 110;
        // the body's viewBox starts 34 units above the shirt (room for raised arms): sink the head into that space so it sits on the neck
        var neck = Math.round(w * 160 / 148 * 0.25 + px * 0.12);
        var html = '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">' +
          '<div class="bh-hd" style="position:relative;z-index:2;margin-bottom:' + (-neck) + 'px">' + headHtml(ids, px, opts.headCls) + '</div>' +
          '<div style="position:relative;z-index:1">' + bodySvg(Object.assign({ shirt: colourOf(ids[0]), w: w }, opts)) + '</div></div>';
        return ctx.add(html, opts.z || 20);
      },
      // anim(el, keyframes, {dur, at, ease, iterations, fill}) — on the shared clock
      anim: function (el, kf, op) {
        op = op || {};
        try { return pin(el.animate(kf, { duration: op.dur || 400, delay: op.at || 0, easing: op.ease || 'linear', iterations: op.iterations || 1, fill: op.fill || 'both', direction: op.direction || 'normal' })); } catch (e) { return null; }
      },
      // path(el, [{t, x, y, r, s, sx, sy, o}], {jerky}) — keyframes across the whole show; jerky = stop-motion steps
      path: function (el, pts, op) {
        op = op || {};
        pts = pts.slice().sort(function (a, b) { return a.t - b.t; });
        var kf = pts.map(function (p) {
          var sx = (p.sx != null ? p.sx : (p.s != null ? p.s : 1)), sy = (p.sy != null ? p.sy : (p.s != null ? p.s : 1));
          var f = { transform: 'translate3d(' + (+p.x).toFixed(1) + 'px,' + (+p.y).toFixed(1) + 'px,0) rotate(' + (p.r || 0) + 'deg) scale(' + sx + ',' + sy + ')', opacity: p.o == null ? 1 : p.o, offset: Math.max(0, Math.min(1, p.t / DUR)) };
          f.easing = p.e || (op.jerky ? 'steps(' + (op.jerky === true ? 4 : op.jerky) + ',end)' : 'linear');
          return f;
        });
        for (var i = 1; i < kf.length; i++) if (kf[i].offset < kf[i - 1].offset) kf[i].offset = kf[i - 1].offset;
        if (kf[0].offset > 0) kf.unshift(Object.assign({}, kf[0], { offset: 0 }));
        if (kf[kf.length - 1].offset < 1) kf.push(Object.assign({}, kf[kf.length - 1], { offset: 1 }));
        try { return pin(el.animate(kf, { duration: DUR, fill: 'both' })); } catch (e) { return null; }
      },
      // the winner talks (jaw flaps) from..to; scream = mouth wide open
      talk: function (el, from, to) { T(function () { el.querySelectorAll('.bh-head').forEach(function (h) { h.classList.add('talk'); }); }, from); T(function () { el.querySelectorAll('.bh-head').forEach(function (h) { h.classList.remove('talk'); }); }, to); },
      scream: function (el, from, to) { T(function () { el.querySelectorAll('.bh-head').forEach(function (h) { h.classList.add('scream'); }); }, from); if (to) T(function () { el.querySelectorAll('.bh-head').forEach(function (h) { h.classList.remove('scream'); }); }, to); },
      // a speech bubble at (x, y) (its tail points down at that spot), from..to
      say: function (text, x, y, from, to, tail) {
        var b = document.createElement('div'); b.className = 'bh-say'; b.textContent = text; b.style.setProperty('--tx', (tail == null ? 30 : tail) + '%');
        stage.appendChild(b);
        var bw = Math.min(220, Math.max(90, text.length * 10 + 24));
        b.style.width = bw + 'px';
        var left = Math.max(8, Math.min(W - bw - 8, x - bw * (tail == null ? 0.3 : tail / 100)));
        b.style.left = left + 'px'; b.style.top = '0px';
        T(function () { b.style.top = (y - b.offsetHeight - 14) + 'px'; }, 0);
        ctx.anim(b, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.08)', offset: .6 }, { opacity: 1, transform: 'scale(1)' }], { dur: 220, at: from, ease: 'steps(3,end)' });
        if (to) ctx.anim(b, [{ opacity: 1 }, { opacity: 0 }], { dur: 120, at: to, fill: 'forwards' });
        return b;
      },
      // big outlined text (POW!, BLASTOFF, etc.)
      text: function (txt, x, y, size, from, to, rot) {
        var t = document.createElement('div'); t.className = 'bh-txt'; t.textContent = txt; t.style.fontSize = (size || 40) + 'px';
        t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.transform = 'translate(-50%,-50%) rotate(' + (rot || 0) + 'deg)';
        stage.appendChild(t);
        ctx.anim(t, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(' + (rot || 0) + 'deg) scale(.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(' + (rot || 0) + 'deg) scale(1.15)', offset: .6 }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(' + (rot || 0) + 'deg) scale(1)' }], { dur: 240, at: from, ease: 'steps(3,end)' });
        if (to) ctx.anim(t, [{ opacity: 1 }, { opacity: 0 }], { dur: 150, at: to, fill: 'forwards' });
        return t;
      },
      // a burst of emoji from (x, y)
      burst: function (list, x, y, n, spread, at, dur, rise) {
        for (var i = 0; i < (n || 10); i++) {
          var e = document.createElement('div'); e.className = 'bh-emoji'; e.textContent = list[i % list.length]; e.style.fontSize = (22 + rnd() * 18) + 'px';
          e.style.left = '0'; e.style.top = '0'; e.style.zIndex = 30; stage.appendChild(e);
          var a = rnd() * Math.PI * 2, d = (spread || 120) * (0.4 + rnd() * 0.8), dx = Math.cos(a) * d, dy = Math.sin(a) * d - (rise || 0);
          ctx.anim(e, [{ transform: 'translate(' + x + 'px,' + y + 'px) scale(.3)', opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .7 },
            { transform: 'translate(' + (x + dx).toFixed(0) + 'px,' + (y + dy).toFixed(0) + 'px) scale(1) rotate(' + ((rnd() - .5) * 160).toFixed(0) + 'deg)', opacity: 0 }], { dur: dur || 900, at: at || 0, ease: 'cubic-bezier(.2,.7,.3,1)' });
        }
      },
      // background: a flat colour or gradient, and optional crude ground
      sky: function (bg) { o.style.background = bg; },
      ground: function (color, h) { return ctx.add('<div style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + (h || 120) + 'px;background:' + (color || '#5BAF4A') + ';border-top:3px solid ' + INK + '"></div>', 2).style.cssText += 'transform:translate(0,' + (H - (h || 120)) + 'px)'; },
      shake: function (at, ms) { ctx.anim(stage, [{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-5px)' }, { transform: 'translate(-4px,-3px)' }, { transform: 'translate(0,0)' }], { dur: ms || 300, at: at, ease: 'steps(4,end)', fill: 'none' }); },
      flash: function (at) { T(function () { if (window.ccFlash) window.ccFlash(0.6); }, at); },
      sfx: function (at, fn) { T(function () { big(fn); }, at); },
      buzz: function (at, pat) { T(function () { buzz(pat || 40); }, at); },
      // ready-made sounds (call inside sfx)
      snd: {
        boing: function () { tone(160, 0.3, 0, 'sine', 0.14, 520); },
        pop: function () { tone(900, 0.06, 0, 'sine', 0.1, 1700); },
        boom: function () { noise(0.6, 0, 0.6, 300, 'lowpass'); tone(60, 0.6, 0, 'sine', 0.4, 30); },
        whoosh: function () { noise(0.5, 0, 0.25, 1200, 'bandpass'); },
        slide: function () { tone(300, 0.5, 0, 'sine', 0.08, 1200); },
        fall: function () { tone(1400, 0.9, 0, 'sine', 0.06, 200); },
        fart: function () { for (var i = 0; i < 9; i++) tone(70 + (i % 3) * 9, 0.07, i * 55, 'sawtooth', 0.12, 55); },
        crowd: function () { noise(1.6, 0, 0.18, 900, 'bandpass'); noise(1.2, 300, 0.12, 2400, 'bandpass'); },
        ding: function () { tone(1568, 0.5, 0, 'sine', 0.08); tone(2093, 0.6, 90, 'sine', 0.06); },
        fanfare: function () { [[523, 0], [659, 140], [784, 280], [1047, 430]].forEach(function (n) { tone(n[0], 0.3, n[1], 'square', 0.04); tone(n[0] / 2, 0.3, n[1], 'triangle', 0.06); }); },
        womp: function () { [392, 370, 349, 311].forEach(function (f, i) { tone(f, i === 3 ? 0.7 : 0.25, i * 260, 'sawtooth', 0.05, i === 3 ? 280 : null); }); },
        splat: function () { noise(0.25, 0, 0.5, 600, 'lowpass'); tone(180, 0.2, 0, 'sine', 0.2, 60); },
        zap: function () { noise(0.15, 0, 0.4, 5000, 'highpass'); tone(1800, 0.12, 0, 'sawtooth', 0.06, 200); },
        drum: function (ms) { var t = 0, g = 110; while (t < (ms || 900)) { tone(80, 0.07, t, 'sine', 0.2); noise(0.03, t, 0.2, 800, 'lowpass'); t += g; g = Math.max(40, g * 0.9); } },
      },
    };
    return ctx;
  }
  function listNamesSafe(ids) { try { return typeof listNames === 'function' ? listNames(ids.map(nameOf)) : ids.map(nameOf).join(' & '); } catch (e) { return ''; } }

  var acts = [];
  function add(a) { acts.push(a); return acts.length - 1; }

  // play(actIndex, ids, wait): wait = ms from now until the shared start
  function play(actIndex, ids, wait, seed) {
    ids = [].concat(ids || []).filter(Boolean);
    if (!ids.length || !acts.length) return 0;
    var act = acts[((actIndex % acts.length) + acts.length) % acts.length];
    close();
    var o = overlay();
    var startAt = performance.now() + Math.max(0, wait || 0);
    o.style.background = '#7EC8E3';
    var me = ids.indexOf(myPlayerId) >= 0, names = listNamesSafe(ids);
    o.innerHTML = '<div class="bh-stage"></div><p class="bh-top"><span>Round winner</span></p>' +
      '<div class="bh-ban"><b>' + esc(me ? (ids.length > 1 ? 'You (and friends) win the round' : 'YOU win the round') : names + (ids.length > 1 ? ' win the round' : ' wins the round')) + '</b><span>' + esc(act.tag || act.name || '') + '</span></div>';
    o.className = 'on';
    o.style.visibility = 'hidden';
    o.onclick = close;
    // Reduce Motion: no gag. The winner's face and the banner fade in, hold, and fade out — done in ~2.6s,
    // well before the next step (the server never waits on this).
    if (window.ccReducedMotion && window.ccReducedMotion()) {
      var RD = 2600, face = document.createElement('div');
      face.style.cssText = 'position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);';
      face.innerHTML = headHtml(ids, 150);
      o.querySelector('.bh-stage').appendChild(face);
      o.style.background = 'linear-gradient(#9BD3F0,#7EC8E3)';
      timers.push(setTimeout(function () {
        o.style.visibility = '';
        try { o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'both' }); } catch (e) {}
        buzz(me ? [60, 40, 120] : 30);
        big(function () { tone(784, 0.18, 0, 'triangle', 0.05); tone(1047, 0.3, 120, 'triangle', 0.05); });
      }, Math.max(0, startAt - performance.now())));
      timers.push(setTimeout(function () { o.classList.add('out'); }, Math.max(0, startAt + RD - performance.now())));
      timers.push(setTimeout(close, Math.max(0, startAt + RD + 380 - performance.now())));
      return Math.max(0, wait || 0) + RD + 400;
    }
    var ctx = makeCtx(o, ids, startAt, seed || 7);
    try { act.run(ctx); } catch (e) { console.error('bighead', act.name, e); }
    timers.push(setTimeout(function () { o.style.visibility = ''; buzz(me ? [60, 40, 120] : 30); }, Math.max(0, startAt - performance.now())));
    timers.push(setTimeout(function () { o.classList.add('out'); }, Math.max(0, startAt + DUR - performance.now())));
    timers.push(setTimeout(close, Math.max(0, startAt + DUR + 380 - performance.now())));
    return Math.max(0, wait || 0) + DUR + 400;
  }

  /* ════════ The first three acts (the rest are in heads-pack1.js and heads-pack2.js) ════════ */

  // 0. Blast-off: strapped to a crude rocket, countdown, launch, gone. A star twinkles where they were.
  add({ name: 'Blast-off', tag: 'Houston, we have a winner.', run: function (c) {
    c.sky('linear-gradient(#0b1a3a,#24427a 60%,#5a7fbf)');
    for (var i = 0; i < 26; i++) c.add('<div style="width:3px;height:3px;background:#fff;border-radius:50%;opacity:' + (0.4 + c.rnd() * 0.6).toFixed(2) + '"></div>', 1).style.transform = 'translate(' + (c.rnd() * c.W).toFixed(0) + 'px,' + (c.rnd() * c.H * 0.7).toFixed(0) + 'px)';
    c.ground('#3d3a36', 90);
    var x = c.W / 2, gy = c.H - 90;
    var rocket = c.add('<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);width:120px;">' +
      '<svg viewBox="0 0 120 260" width="120" style="display:block;overflow:visible">' +
      '<path d="M60 4 Q100 50 96 150 L24 150 Q20 50 60 4 Z" fill="#E9E5DC" stroke="' + c.INK + '" stroke-width="4"/>' +
      '<path d="M24 120 L2 176 L26 162 Z M96 120 L118 176 L94 162 Z" fill="#E8453A" stroke="' + c.INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="30" y="150" width="60" height="20" fill="#8A8F96" stroke="' + c.INK + '" stroke-width="4"/>' +
      '<text x="60" y="140" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="15" fill="' + c.INK + '">USA-ish</text>' +
      '<g class="bh-flame"><path d="M36 172 Q60 260 84 172 Z" fill="#FFB12A" stroke="' + c.INK + '" stroke-width="3"/><path d="M48 172 Q60 225 72 172 Z" fill="#FFF07A"/></g></svg>' +
      '<div style="position:absolute;left:50%;top:40px;transform:translateX(-50%)">' + c.head(72) + '</div></div>', 20);
    var flame = rocket.querySelector('.bh-flame');
    c.anim(flame, [{ opacity: 0 }, { opacity: 0 }], { dur: 1, at: 0 });
    c.anim(flame, [{ opacity: 1, transform: 'scaleY(.8)' }, { opacity: 1, transform: 'scaleY(1.25)' }], { dur: 90, at: 2350, iterations: 32, direction: 'alternate', ease: 'steps(1)' });
    flame.style.transformOrigin = '60px 172px';
    c.path(rocket, [{ t: 0, x: x, y: gy + 260 }, { t: 400, x: x, y: gy + 4, e: 'steps(3,end)' }, { t: 600, x: x, y: gy },
      { t: 2300, x: x, y: gy }, { t: 2500, x: x - 3, y: gy - 6 }, { t: 2700, x: x + 3, y: gy - 10, e: 'cubic-bezier(.6,0,1,.5)' }, { t: 3900, x: x + 40, y: -320, r: 8 }], { jerky: false });
    c.say('Ten, nine… eh, ONE!', x, gy - 230, 700, 2200, 50);
    c.talk(rocket, 700, 2200);
    c.scream(rocket, 2350, 0);
    ['3', '2', '1'].forEach(function (n, i) { c.text(n, x + 90, gy - 140, 54, 900 + i * 420, 1200 + i * 420, -8); c.sfx(900 + i * 420, function () { tone(880, 0.1, 0, 'square', 0.05); }); });
    c.text('BLASTOFF!', c.W / 2, c.H * 0.32, 46, 2500, 4400, -6);
    c.burst(['💨', '☁️', '🔥'], x, gy - 10, 16, 140, 2400, 1100, 20);
    c.shake(2400, 700);
    c.sfx(2350, function () { noise(1.8, 0, 0.5, 400, 'lowpass'); tone(90, 1.8, 0, 'sawtooth', 0.06, 600); });
    c.buzz(2400, [200, 60, 200]);
    var star = c.add('<div style="font-size:30px;transform:translate(-50%,-50%)">✨</div>', 30);
    c.path(star, [{ t: 0, x: x + 46, y: 70, o: 0, s: 0.2 }, { t: 4000, x: x + 46, y: 70, o: 0, s: 0.2 }, { t: 4200, x: x + 46, y: 70, o: 1, s: 1.4 }, { t: 4500, x: x + 46, y: 70, o: 1, s: 0.8 }, { t: 4800, x: x + 46, y: 70, o: 1, s: 1.3 }], { jerky: 2 });
    c.sfx(4200, c.snd.ding);
  } });

  // 1. The bodybuilder: tiny head, enormous paper body, flexes until the shirt rips.
  add({ name: 'Flex', tag: 'Do you even caption, bro?', run: function (c) {
    c.sky('linear-gradient(#FFE07A,#FFB84D)');
    c.ground('#B07A44', 110);
    var x = c.W / 2, gy = c.H - 110;
    var p = c.puppet({ px: 74, w: 190, arms: 'down', shirt: c.color, pants: '#222' });
    var p2 = c.puppet({ px: 74, w: 210, arms: 'flex', shirt: '#F2C9A0', pants: '#222' });
    c.path(p, [{ t: 0, x: x, y: gy }, { t: 600, x: x, y: gy, sy: 1.04 }, { t: 900, x: x, y: gy }, { t: 1300, x: x, y: gy, sy: 1.06, sx: 1.04 }, { t: 1700, x: x, y: gy }, { t: 1999, x: x, y: gy, o: 1 }, { t: 2000, x: x, y: gy, o: 0 }], { jerky: 3 });
    c.path(p2, [{ t: 0, x: x, y: gy, o: 0 }, { t: 1999, x: x, y: gy, o: 0 }, { t: 2000, x: x, y: gy, o: 1, s: 1.12 }, { t: 2200, x: x, y: gy, s: 1 }, { t: 2600, x: x, y: gy, sx: 1.06, sy: .97 }, { t: 3000, x: x, y: gy }, { t: 3400, x: x, y: gy, sx: 1.06, sy: .97 }, { t: 3800, x: x, y: gy }, { t: 4200, x: x, y: gy, sx: 1.08, sy: .96 }], { jerky: 3 });
    c.say('Hnnnngh…', x, gy - 250, 300, 1900, 50);
    c.talk(p, 300, 1900);
    c.text('RIIIIP!', x, gy - 150, 48, 2000, 3000, 8);
    c.burst(['👕', '🧵', '💥'], x, gy - 120, 14, 170, 2000, 900, 40);
    c.sfx(2000, function () { noise(0.4, 0, 0.6, 2500, 'bandpass'); });
    c.shake(2000, 400);
    c.say('Gains.', x, gy - 280, 2600, 4700, 50);
    c.talk(p2, 2600, 3400);
    c.sfx(2600, c.snd.crowd);
    c.burst(['💪', '✨'], x, gy - 160, 10, 160, 3200, 1100, 60);
  } });

  // 2. Victory lap: their head on a stick body running across the screen in a loop, pursued by a bewildered trophy.
  add({ name: 'Victory Lap', tag: 'Running up the score.', run: function (c) {
    c.sky('#9BD3F0');
    c.ground('#5BAF4A', 130);
    var gy = c.H - 120;
    var p = c.puppet({ px: 104, w: 110, arms: 'up', legs: 'run' });
    var cup = c.add('<div style="font-size:64px;transform:translate(-50%,-100%)">🏆</div>', 18);
    var pts = [], cpts = [];
    for (var t = 0, i = 0; t <= 4800; t += 160, i++) {
      var u = t / 4800, x = -80 + (c.W + 160) * ((u * 1.6) % 1);
      pts.push({ t: t, x: x, y: gy - (i % 2 ? 14 : 0), r: i % 2 ? 6 : -6 });
      cpts.push({ t: t, x: x - 130, y: gy - (i % 2 ? 0 : 18), r: i % 2 ? -10 : 10 });
    }
    c.path(p, pts, { jerky: 1 }); c.path(cup, cpts, { jerky: 1 });
    c.say('Can’t catch me!', c.W * 0.5, gy - 200, 700, 2200, 50);
    c.talk(p, 700, 2200);
    c.say('Come back! I’m YOURS!', c.W * 0.5, gy - 130, 2700, 4400, 30);
    for (var k = 0; k < 14; k++) c.sfx(k * 320, function () { tone(220, 0.05, 0, 'square', 0.04); });
    c.sfx(2700, c.snd.boing);
  } });

  /* ════════ The Grand Poobah finale: the face, under the hat, on a throne, carried by tiny bodies ════════ */
  // poobah(el, ids, landMs): fills el (a box in the ceremony) with the crude throne bit, then rests.
  // #22: landMs = when the hat must land (the gong). The ceremony starts this during the drumroll, so the
  // throne is carried in under the roll and the hat lands ON the gong. Without landMs: the old ~4.6s timing.
  function poobah(el, ids, landMs) {
    ids = [].concat(ids || []);
    if (!el || !ids.length) return;
    var DURP = Math.max(1200, (landMs || 4560) / 0.76);   // the hat lands at 76% of the bit
    var hat = typeof poobahHat === 'function' ? poobahHat(120) : '🎩';
    el.innerHTML = '<div class="bh-poo" id="bh-poo">' +
      '<div class="bh-it" id="bh-poo-throne" style="z-index:3"><svg viewBox="0 0 200 200" width="200" style="display:block;transform:translate(-50%,-100%);overflow:visible">' +
        '<path d="M30 70 Q30 10 100 6 Q170 10 170 70 L170 160 L30 160 Z" fill="#B3263A" stroke="' + INK + '" stroke-width="5"/>' +
        '<path d="M10 120 H190 V176 H10 Z" fill="#D4A017" stroke="' + INK + '" stroke-width="5"/>' +
        '<circle cx="100" cy="34" r="12" fill="#FFD23F" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M20 176 V196 M180 176 V196" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/></svg></div>' +
      '<div class="bh-it" id="bh-poo-who" style="z-index:5"></div>' +
      '<div class="bh-it" id="bh-poo-hat" style="z-index:7"><div style="transform:translate(-50%,-100%)">' + hat + '</div></div>' +
      '<div class="bh-it" id="bh-poo-carry" style="z-index:8"></div></div>';
    var box = el.querySelector('#bh-poo'), W = 260, H = 300;
    var whoHtml = '<div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">' +
      '<div style="position:relative;z-index:2;margin-bottom:-16px">' + headHtml(ids, 104) + '</div>' +
      '<div style="position:relative;z-index:1">' + bodySvg({ shirt: '#5B3FB5', pants: '#3A2A7A', arms: 'out', legs: 'sit', w: 120, extra: '<path d="M24 10 L50 60 L76 10" fill="none" stroke="#FFD23F" stroke-width="5"/>' }) + '</div></div>';
    el.querySelector('#bh-poo-who').innerHTML = whoHtml;
    // four tiny bodies, carrying the throne like a sedan chair
    var carry = el.querySelector('#bh-poo-carry'), mini = '';
    [-92, -40, 40, 92].forEach(function (dx, i) {
      mini += '<div style="position:absolute;left:' + dx + 'px;top:0;transform:translate(-50%,-100%)">' + bodySvg({ shirt: ['#E8453A', '#2E9E6B', '#2E5EAA', '#E89A2A'][i], pants: '#333', arms: 'up', legs: 'stand', w: 46 }) + '</div>';
    });
    carry.innerHTML = mini;
    var who = el.querySelector('#bh-poo-who'), throne = el.querySelector('#bh-poo-throne'), hatEl = el.querySelector('#bh-poo-hat');
    var cx = W / 2, base = H - 20;
    var RM = !!(window.ccReducedMotion && window.ccReducedMotion());
    var kf = function (el2, pts, dur) {
      if (RM) {   // Reduce Motion: no parade. Each piece fades in at its resting place.
        var p = pts[pts.length - 1], tr = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + (p.r || 0) + 'deg) scale(' + (p.s || 1) + ')';
        try { el2.animate([{ transform: tr, opacity: 0 }, { transform: tr, opacity: p.o == null ? 1 : p.o }], { duration: 450, easing: 'ease-out', fill: 'both' }); } catch (e) {}
        return;
      }
      try {
        el2.animate(pts.map(function (p) { return { transform: 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + (p.r || 0) + 'deg) scale(' + (p.s || 1) + ')', offset: p.t, opacity: p.o == null ? 1 : p.o, easing: p.e || 'steps(2,end)' }; }), { duration: dur, fill: 'both' });
      } catch (e) {}
    };
    // carried in from the left, bouncing; set down; the hat drops from the sky and squashes them; pops back
    var bob = [];
    for (var i = 0; i <= 10; i++) bob.push({ t: i / 10 * 0.55, x: -200 + (cx + 200) * (i / 10), y: base - 40 - (i % 2 ? 10 : 0), r: i % 2 ? 3 : -3 });
    bob.push({ t: 0.62, x: cx, y: base - 40 }, { t: 1, x: cx, y: base - 40 });
    kf(throne, bob, DURP);
    var trip = bob.filter(function (p) { return p.t <= 0.62; });
    kf(who, trip.map(function (p) { return { t: p.t, x: p.x, y: p.y - 40, r: p.r }; }).concat([{ t: 0.74, x: cx, y: base - 80 }, { t: 0.76, x: cx, y: base - 70, s: 0.86 }, { t: 0.8, x: cx, y: base - 80, s: 1.05 }, { t: 1, x: cx, y: base - 80 }]), DURP);
    kf(carry, trip.map(function (p) { return { t: p.t, x: p.x, y: p.y + 22, r: -p.r }; }).concat([{ t: 0.66, x: cx, y: base - 18, o: 1 }, { t: 0.7, x: cx + 400, y: base - 18, o: 1, e: 'linear' }, { t: 1, x: cx + 400, y: base - 18, o: 0 }]), DURP);
    kf(hatEl, [{ t: 0, x: cx, y: -400, o: 0 }, { t: 0.7, x: cx, y: -400, o: 1, e: 'cubic-bezier(.6,0,1,.5)' }, { t: 0.76, x: cx, y: base - 238, s: 1.1 }, { t: 0.8, x: cx, y: base - 262, s: 1 }, { t: 1, x: cx, y: base - 262, r: -6 }], DURP);
    if (RM) return;   // (the hat's thud, the scream and the march belong to the parade)
    var land = DURP * 0.76, ts = poobah._t = [];
    // the hat's thud belongs to the gong when the ceremony times it (landMs); the face still screams on impact
    ts.push(setTimeout(function () { if (!landMs) big(function () { noise(0.3, 0, 0.6, 400, 'lowpass'); tone(70, 0.4, 0, 'sine', 0.4, 40); }); buzz([120, 60, 200]); var h = who.querySelectorAll('.bh-head'); h.forEach(function (x) { x.classList.add('scream'); }); setTimeout(function () { h.forEach(function (x) { x.classList.remove('scream'); x.classList.add('talk'); }); setTimeout(function () { h.forEach(function (x) { x.classList.remove('talk'); }); }, 2200); }, 500); }, land));
    var steps = 8, gap = (DURP * 0.55) / steps;
    for (var k = 0; k < steps; k++) ts.push(setTimeout(function () { big(function () { tone(196, 0.06, 0, 'square', 0.035); }); }, k * gap));
  }

  /* ════════ #23 The quick stamp: most rounds, the winner gets ~1s, not a 5s gag ════════
     A rubber stamp slams onto the scoreboard with the winner's face and name, then lifts away.
     Not full-screen and not a gag, so it never upstages the table. Reduce Motion: a fade. */
  var STAMP_MS = 1100;
  var STAMP_CSS = '#bh-stamp{position:fixed;left:50%;top:30%;z-index:755;pointer-events:none;display:flex;align-items:center;gap:10px;padding:8px 16px 8px 9px;' +
    'background:#FFF8EA;border:4px solid #D7261E;border-radius:14px;color:#D7261E;box-shadow:0 0 0 2px #FFF8EA,5px 6px 0 rgba(31,26,23,.85);transform:translate(-50%,-50%) rotate(-7deg);opacity:0;}' +
    '#bh-stamp .bh-head{flex:none;}' +
    '#bh-stamp .bh-st-t{display:flex;flex-direction:column;line-height:1;font-family:var(--display,system-ui);}' +
    '#bh-stamp .bh-st-e{font-size:12px;font-weight:800;letter-spacing:.24em;text-transform:uppercase;}' +
    '#bh-stamp .bh-st-n{font-size:26px;font-weight:700;color:' + INK + ';margin-top:3px;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}';
  function stamp(ids, wait) {
    ids = [].concat(ids || []).filter(Boolean);
    if (!ids.length) return 0;
    try { if (!document.getElementById('bh-stamp-css')) { var s = document.createElement('style'); s.id = 'bh-stamp-css'; s.textContent = STAMP_CSS; document.head.appendChild(s); } } catch (e) {}
    var old = document.getElementById('bh-stamp'); if (old) old.remove();
    var me = ids.indexOf(myPlayerId) >= 0, el = document.createElement('div');
    el.id = 'bh-stamp';
    el.innerHTML = headHtml(ids, ids.length > 1 ? 40 : 52) + '<span class="bh-st-t"><span class="bh-st-e">' + (ids.length > 1 ? 'Round winners' : 'Round winner') + '</span><span class="bh-st-n">' + esc(me ? (ids.length > 1 ? 'You & co.' : 'You') : listNamesSafe(ids)) + '</span></span>';
    document.body.appendChild(el);
    var RM = !!(window.ccReducedMotion && window.ccReducedMotion());
    var go = function () {
      try {
        el.animate(RM
          ? [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
          : [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-16deg) scale(2.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(.96)', offset: 0.13 },
             { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(1)', offset: 0.2 }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(1)', offset: 0.8 },
             { opacity: 0, transform: 'translate(-50%,-62%) rotate(-5deg) scale(1.04)' }], { duration: STAMP_MS, easing: 'ease-out', fill: 'both' });
      } catch (e) {}
      big(function () { noise(0.12, 0, 0.35, 700, 'lowpass'); tone(150, 0.16, 0, 'sine', 0.2, 70); });
      buzz(me ? [50, 30, 90] : 25);
    };
    timers.push(setTimeout(go, Math.max(0, wait || 0)));
    timers.push(setTimeout(function () { if (el.parentNode) el.remove(); }, Math.max(0, wait || 0) + STAMP_MS + 60));
    return Math.max(0, wait || 0) + STAMP_MS;
  }

  window.ccHeads = { add: add, play: play, close: close, poobah: poobah, stamp: stamp, STAMP_MS: STAMP_MS, head: headHtml, body: bodySvg, faceUrl: faceUrl, count: function () { return acts.length; }, acts: acts, DUR: DUR };
})();
