/* Closed Caption — THE FINALE (finale.js)
   After the winner, the awards and the final scores (ending.js): tonight's Gallery.
     1. Every caption framed tonight is shown. Two or more: everyone votes for the best (never their own).
     2. Caption of the Night: a short, quiet ceremony on every phone at once (~5 s). The framed card is hung,
        the rosette pinned on, the brass plaque engraved. Then it fades away by itself (no buttons on it) to the
        last screen (play.js): the framed card to save or text, and the host's Play again. It also closes on every
        phone the moment the game moves on (play.js calls close()).
   Server: state.finale = { entries, voters, decided, myVote, canVote, winner, counts, tie, showAt, best }.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, playerById, chipHtml, plural,
   tone, noise, buzz, big, sfx, canRun, send, clockOffset, makeCardFrom, render.
   CSS prefix: fp-. */
(function () {
  'use strict';
  var INK = '#1F1A17';

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


    /* ── the ceremony (full screen, every phone at once) ── */
    '#fp-show{position:fixed;inset:0;z-index:790;display:none;overflow:hidden;background:#14100D;color:#fff;font-family:var(--display,system-ui);}',
    '#fp-show.on{display:block;}',
    '#fp-show.out{opacity:0;transition:opacity .4s;}',
    '#fp-show .fp-it{position:absolute;will-change:transform,opacity;}',
    '.fp-spot{position:absolute;inset:0;background:radial-gradient(ellipse 95% 62% at 50% 40%,rgba(255,236,170,.30),rgba(255,236,170,0) 70%);pointer-events:none;opacity:0;}',
    '.fp-top{position:absolute;left:0;right:0;top:calc(18px + var(--sat,0px));text-align:center;z-index:30;}',
    '.fp-eye{font-size:12px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:#E9C86D;margin:0;}',
    '.fp-h{font-size:34px;line-height:1.02;font-weight:700;margin:6px 12px 0;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.5);}',
    '.fp-h.gold{background:linear-gradient(100deg,#b8862b 0%,#f9e6a6 28%,#fffbe8 40%,#e2b955 56%,#a8761e 80%,#f1d27c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 2px 8px rgba(0,0,0,.6));}',
    '.fp-sub{font-size:15px;font-weight:700;color:#d9cfc0;margin:6px 16px 0;min-height:1.2em;}',
    /* the framed card, on its wire, with a brass plaque under it */
    '.fp-piece{left:50%;top:47%;width:min(74vw,290px);margin-left:calc(min(74vw,290px) / -2);background:#FBF6EA;color:' + INK + ';padding:10px 10px 11px;border-radius:3px;box-shadow:0 0 0 4px #6b4b10,0 0 0 9px #e4c167,0 0 0 12px #8f6820,0 18px 40px rgba(0,0,0,.6);z-index:10;opacity:0;text-align:center;}',
    '.fp-piece img{display:block;width:100%;max-height:36vh;object-fit:contain;background:#fff;border:1px solid #cfc3a8;}',
    '.fp-piece .fp-pc{font-family:"Libre Caslon Text",Georgia,serif;font-style:italic;font-size:16px;line-height:1.28;margin:9px 4px 2px;}',
    '.fp-ros{position:absolute;width:82px;height:82px;right:-30px;top:-32px;z-index:12;opacity:0;}',
    '.fp-plaque{position:absolute;left:50%;top:calc(100% + 22px);transform:translateX(-50%);width:max-content;max-width:min(80vw,300px);padding:7px 18px 6px;background:linear-gradient(180deg,#e9c86d,#c99a3a 55%,#b08328);border:2px solid #5a3f0c;border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 3px 8px rgba(0,0,0,.5);color:#2b1d05;font-family:"Libre Caslon Text",Georgia,serif;text-align:center;opacity:0;}',
    '.fp-plaque::before,.fp-plaque::after{content:"";position:absolute;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#5a3f0c;box-shadow:inset 0 1px 0 rgba(255,255,255,.4);}',
    '.fp-plaque::before{left:6px;}.fp-plaque::after{right:6px;}',
    '.fp-plaque b{display:block;font-size:15px;font-weight:700;line-height:1.2;min-height:1.2em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.fp-plaque span{display:block;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-top:2px;white-space:nowrap;padding:0 4px;}',
    '.fp-wire{position:absolute;left:50%;top:-56px;width:120px;height:46px;margin-left:-60px;z-index:9;opacity:0;}',
    '#fp-show.reduce *{animation-duration:.01s!important;}',
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
  function reduced() { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
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

  /* ── The ceremony ── */
  var root = null, timers = [], playing = null, doneFor = null;
  function later(ms, fn) { timers.push(setTimeout(function () { try { fn(); } catch (e) { console.warn('finale', e); } }, Math.max(0, ms))); }
  function anim(el, kf, o) { try { if (el && el.animate) return el.animate(kf, o); } catch (e) {} return null; }
  function show(el, ms, kf) { if (!el) return; anim(el, kf || [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: ms || 300, fill: 'forwards', easing: 'cubic-bezier(.2,1.4,.4,1)' }); }
  function fade(el, ms) { if (el) anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: ms || 400, fill: 'forwards', easing: 'ease-out' }); }
  function overlay() {
    root = document.getElementById('fp-show');
    if (!root) { root = document.createElement('div'); root.id = 'fp-show'; (document.body || document.documentElement).appendChild(root); }
    return root;
  }
  function close() {
    timers.forEach(clearTimeout); timers = []; playing = null;
    if (root) { root.className = ''; root.innerHTML = ''; root.onclick = null; }
  }
  var S = {   // sounds (the speaker phone only): soft, few, and over before anyone has to talk over them
    whoosh: function () { snd(function () { N(0.35, 0, 0.1, 3000, 'highpass'); }); },
    thunk: function () { snd(function () { T(90, 0.25, 0, 'sine', 0.3, 50); N(0.12, 0, 0.25, 600, 'lowpass'); }); },
    tick: function () { snd(function () { N(0.025, 0, 0.08, 4200, 'bandpass'); }); },
    chime: function () { snd(function () { [1047, 1319, 1568, 2093].forEach(function (f, i) { T(f, 0.6, i * 120, 'sine', 0.045); }); }); },
  };
  function wireSvg() { return '<svg viewBox="0 0 120 46" width="120" height="46" aria-hidden="true"><path d="M8 44 L60 6 L112 44" fill="none" stroke="#8a6418" stroke-width="2"/><circle cx="60" cy="6" r="4" fill="#E9C86D" stroke="#5a3f0c" stroke-width="1.5"/></svg>'; }

  // f = state.finale (with a winner). wait: ms until it starts on the server clock (0 if it's already going); late: how far in we are
  function play(f, wait, late) {
    if (!f || !f.winner) return;
    var entry = (f.entries || []).filter(function (e) { return e.key === f.winner; })[0];
    if (!entry) return;
    var tag = (state && state.code) + '|' + f.showAt;
    if (playing === tag) return;
    close();
    playing = tag;
    var o = overlay();
    var who = entry.writerName || nm(entry.writerId), mine = entry.writerId === (window.myPlayerId || (typeof myPlayerId !== 'undefined' ? myPlayerId : null));
    var votes = f.counts ? (f.counts[entry.key] || 0) : 0, many = (f.entries || []).length > 1;
    var subLine = !many ? 'The only frame tonight. Unopposed.' : f.tie ? 'A tie on the votes. Settled by a coin.' : (votes === 1 ? '1 vote' : votes + ' votes') + ' from the table';
    var plaqueName = 'Caption by ' + who + (mine ? ' (you)' : '');
    var best = f.best || 'Caption of the Night';
    var imgUrl = '/images/' + E(entry.image);
    o.className = 'on' + (reduced() ? ' reduce' : '');
    o.innerHTML =
      '<div class="fp-spot" id="fp-spot"></div>' +
      '<div class="fp-top"><p class="fp-eye" id="fp-eye">Tonight’s Gallery</p><div class="fp-h gold" id="fp-h">Caption of the Night</div><p class="fp-sub" id="fp-sub"></p></div>' +
      '<div class="fp-it fp-piece" id="fp-piece" style="transform:translateY(-50%)">' +
        '<div class="fp-wire" id="fp-wire">' + wireSvg() + '</div>' +
        '<img src="' + imgUrl + '" alt=""><p class="fp-pc">“' + E(entry.caption) + '”</p>' +
        '<div class="fp-ros" id="fp-ros">' + rosetteSvg() + '</div>' +
        '<div class="fp-plaque" id="fp-plaque"><b id="fp-pn"></b><span>' + E(best) + '</span></div>' +
      '</div>';
    var $ = function (id) { return document.getElementById(id); };

    var t0 = wait || 0, skip = Math.max(0, late || 0);
    var at = function (ms, fn) { if (ms + t0 - skip >= -60) later(ms + t0 - skip, fn); };
    // ~4 s: hung (0) → the rosette (0.75) → the plaque engraved (1.5–2.7) → "In The Gallery. For good." (3.1);
    // held a moment, then it fades away by itself on every phone (5.6) to the last screen (Play again, Save the card).
    // No buttons on it: nobody has to find a Done. A tap skips to the end.
    var PT = { ros: 750, plaque: 1500, hung: 3100, end: 5600 };
    if (skip > PT.end - 500) { close(); doneFor = tag; return; }   // a phone that arrives late: the last screen already shows it
    var shownAt = Date.now();
    function finish() {
      if (playing !== tag) return;
      doneFor = tag; o.classList.add('out');
      later(400, function () { close(); try { render(true); } catch (e) {} });
    }
    o.onclick = function () { if (Date.now() - shownAt > 700) finish(); };
    at(PT.end, finish);

    // Reduce Motion: the same news in cross-fades
    if (reduced()) {
      at(0, function () { $('fp-sub').textContent = subLine; fade($('fp-spot')); fade($('fp-piece')); fade($('fp-wire')); S.whoosh(); vib(40); });
      at(PT.ros, function () { fade($('fp-ros'), 300); S.thunk(); vib(mine ? [120, 40, 120] : [60]); });
      at(PT.plaque, function () { $('fp-pn').textContent = plaqueName; fade($('fp-plaque'), 400); });
      at(PT.hung, function () { $('fp-eye').textContent = 'Caption of the Night'; $('fp-h').textContent = 'In The Gallery'; $('fp-sub').textContent = 'For good.'; S.chime(); });
      return;
    }

    /* 1. The card is hung: it comes down on its wire and settles with a small swing */
    at(0, function () {
      $('fp-sub').textContent = subLine;
      fade($('fp-spot'), 600);
      show($('fp-piece'), 900, [{ opacity: 0, transform: 'translateY(-130%) rotate(0deg)' }, { opacity: 1, transform: 'translateY(-46%) rotate(2.5deg)', offset: 0.55 }, { opacity: 1, transform: 'translateY(-51%) rotate(-1.2deg)', offset: 0.78 }, { opacity: 1, transform: 'translateY(-50%) rotate(0deg)' }]);
      later(250, function () { fade($('fp-wire'), 300); });
      S.whoosh(); vib(40);
    });
    /* 2. The rosette is pinned on */
    at(PT.ros, function () { anim($('fp-ros'), [{ opacity: 0, transform: 'scale(2.2) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1) rotate(8deg)' }], { duration: 340, fill: 'forwards', easing: 'cubic-bezier(.3,1.5,.5,1)' }); S.thunk(); vib(mine ? [120, 40, 120] : [60]); });
    /* 3. The brass plaque goes up, and the name is engraved on it, letter by letter */
    at(PT.plaque, function () {
      var pl = $('fp-plaque'), pn = $('fp-pn');
      anim(pl, [{ opacity: 0, transform: 'translateX(-50%) translateY(8px)' }, { opacity: 1, transform: 'translateX(-50%) translateY(0)' }], { duration: 300, fill: 'forwards', easing: 'ease-out' });
      var n = plaqueName.length, step = Math.max(18, Math.min(45, 1000 / Math.max(1, n)));
      for (var i = 1; i <= n; i++) (function (k) { later(250 + k * step, function () { pn.textContent = plaqueName.slice(0, k); if (k % 3 === 0) S.tick(); }); })(i);
    });
    /* 4. In The Gallery. For good. */
    at(PT.hung, function () {
      var eye = $('fp-eye'), h = $('fp-h'), sub = $('fp-sub');
      [eye, h, sub].forEach(function (e) { anim(e, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }); });
      later(200, function () {
        eye.textContent = 'Caption of the Night'; h.textContent = 'In The Gallery'; sub.textContent = 'For good.';
        [eye, h, sub].forEach(function (e) { anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: 'forwards' }); });
        S.chime(); vib(mine ? [80, 40, 80] : [40]);
      });
    });
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
    var by = (own ? 'Yours' : E(e.writerName || nm(e.writerId))) + ' · ' + (e.frames === 1 ? '1 Bravo' : e.frames + ' Bravos');
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
        '<div class="fp-foot" style="margin-bottom:12px;"><button class="btn btn-sm" style="width:100%" onclick="ccFinale.saveClean()">Save the card</button>' +
        '<button class="btn-link" onclick="ccFinale.replay()">▶ Watch it again</button></div>';
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
  // Called on every render of the final scores: plays the ceremony once, in sync, when the result is in
  function sync() {
    var f = state && state.finale;
    if (!f || !f.winner || !f.showAt) return;
    var tag = state.code + '|' + f.showAt;
    if (playing === tag || doneFor === tag) return;
    var t = now(), wait = f.showAt - t;
    if (wait < -60000) return;   // long over: the memorial on the page does the honours
    play(f, Math.max(0, wait), Math.max(0, -wait));
  }
  // The keepsake: the framed card (the untouched cartoon and the caption)
  function winnerOf(f) { return f && (f.entries || []).filter(function (e) { return e.key === f.winner; })[0]; }
  function saveClean(f) {
    var e = winnerOf(f); if (!e) return;
    try { makeCardFrom({ image: e.image, caption: e.caption, writerName: e.writerName || nm(e.writerId), isReal: false, month: f.best, inducted: f.best, flaggers: e.flaggers || [], top: true }); } catch (x) {}
  }
  function replay() { var f = state && state.finale; if (!f || !f.winner) return; doneFor = null; playing = null; play(f, 0, 0); }

  window.ccFinale = { saveClean: function () { saveClean(state && state.finale); }, play: play, close: close, sync: sync, replay: replay, vote: vote, screenHtml: screenHtml };
})();
