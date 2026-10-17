/* Closed Caption — first-game guide + last-writer spotlight.
 * Self-contained (injected CSS, `gd-` prefix). Exposes window.Guide:
 *   Guide.onRender(state)   called once at the end of render()
 *   Guide.waitHtml(player)  the "Waiting on Sam…" banner for writingStatusHtml (a [data-live] block)
 *   Guide.reset()           forget everything (testing)
 * Tips show once each, for phones that have never finished a game. Nothing here ever
 * touches the caption textarea or takes focus.
 */
(function () {
  var KEY_PLAYED = 'cc_played_game', KEY_OFF = 'cc_tips_off', KEY_SEEN = 'cc_tips_seen';
  var SHOW_MS = 7000;

  var TIPS = {
    writing: { icon: '✍️', text: 'Write a fake that could pass for the real caption. The real ones are short and dry.' },
    facedown: { icon: '🃏', text: 'One caption is face-down. Sometimes it’s the real one.' },
    first_bets: { icon: '🎰', text: 'Bet on the one you think is real. Blind bets pay more; both chips is a Half-Moon.' },
    steal: { icon: '😈', text: 'The dealer can steal one chip. A chip on the real one scores them +1.' },
    answer: { icon: '🍿', text: 'This is the fun part: who wrote what, who fell for it. Take your time.' },
    frame: { icon: '🖼', text: 'Beat the real caption? Frame it. Enough frames and it hangs in The Gallery.' }
  };
  // How long after the moment arrives before the tip slides in (let the screen's own show land first)
  var DELAY = { writing: 2600, facedown: 2400, first_bets: 1200, steal: 1800, answer: 5200, frame: 2200 };   // after the moment lands, never on top of it

  var CSS = [
    /* ── Last-writer spotlight ── */
    '.gd-wait{position:relative;display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:11px 14px;border:2.5px solid var(--ink,#1F1A17);border-radius:16px;background:var(--yellow,#FFD23F);box-shadow:3px 3px 0 var(--ink,#1F1A17);text-align:left;transform:rotate(-1.2deg);animation:gdWaitIn .45s cubic-bezier(.34,1.56,.64,1) both;overflow:hidden;}',
    '.gd-wait::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 66%);transform:translateX(-100%);animation:gdSheen 2.8s ease-in-out 0.6s infinite;pointer-events:none;}',
    '.gd-wait .gd-ic{font-size:26px;line-height:1;animation:gdTilt 1.4s ease-in-out infinite;transform-origin:50% 60%;}',
    '.gd-wait .gd-h{font-family:var(--display,Fredoka,sans-serif);font-weight:700;font-size:20px;line-height:1.15;color:var(--ink,#1F1A17);}',
    '.gd-wait .gd-s{display:block;font-size:13px;font-weight:800;color:var(--ink-2,#4A433D);margin-top:1px;}',
    '.gd-wait .gd-dots::after{content:"";display:inline-block;width:1.1em;text-align:left;animation:gdDots 1.4s steps(4,end) infinite;}',
    '.chip.gd-spot{filter:none!important;opacity:1!important;z-index:1;animation:gdSpot 1.5s ease-in-out infinite;}',
    '.chip.gd-spot::before{content:"";position:absolute;left:50%;top:50%;width:250%;height:250%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,210,63,.75) 0 30%,rgba(255,210,63,.28) 48%,rgba(255,210,63,0) 70%);z-index:-1;pointer-events:none;animation:gdGlow 1.5s ease-in-out infinite;}',
    '@keyframes gdSpot{0%,100%{transform:translateY(0) scale(1);box-shadow:0 0 0 3px var(--yellow,#FFD23F),0 2px 0 rgba(31,26,23,.9);}50%{transform:translateY(-4px) scale(1.12);box-shadow:0 0 0 5px var(--yellow,#FFD23F),0 6px 0 rgba(31,26,23,.25);}}',
    '@keyframes gdGlow{0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(.9);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08);}}',
    '@keyframes gdWaitIn{from{opacity:0;transform:rotate(-1.2deg) scale(.85);}to{opacity:1;transform:rotate(-1.2deg) scale(1);}}',
    '@keyframes gdSheen{0%{transform:translateX(-100%);}60%,100%{transform:translateX(100%);}}',
    '@keyframes gdTilt{0%,100%{transform:rotate(-12deg);}50%{transform:rotate(12deg);}}',
    '@keyframes gdDots{0%{content:"";}25%{content:".";}50%{content:"..";}75%,100%{content:"...";}}',
    /* The last writer's nudge: a friendly card at the top (never over the text box or the button) */
    '.gd-nudge{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));z-index:940;width:max-content;max-width:min(92vw,420px);display:flex;align-items:center;gap:12px;padding:12px 18px 12px 14px;border:2.5px solid var(--ink,#1F1A17);border-radius:18px;background:var(--yellow,#FFD23F);box-shadow:5px 5px 0 var(--ink,#1F1A17);transform:translate(-50%,-180%) rotate(-1.5deg);transition:transform .5s cubic-bezier(.34,1.56,.64,1);cursor:pointer;-webkit-user-select:none;user-select:none;}',
    '.gd-nudge.on{transform:translate(-50%,0) rotate(-1.5deg);}',
    '.gd-nudge .gd-em{font-size:32px;line-height:1;animation:gdWave 1s ease-in-out 3;transform-origin:70% 80%;}',
    '.gd-nudge b{display:block;font-family:var(--display,Fredoka,sans-serif);font-weight:700;font-size:21px;line-height:1.1;color:var(--ink,#1F1A17);}',
    '.gd-nudge span.gd-s{display:block;font-size:13px;font-weight:800;color:var(--ink-2,#4A433D);margin-top:2px;}',
    '@keyframes gdWave{0%,100%{transform:rotate(0);}25%{transform:rotate(-18deg);}75%{transform:rotate(14deg);}}',
    /* ── Coach cards ── */
    '.gd-tip{position:fixed;left:50%;z-index:96;width:min(calc(100vw - 32px),420px);padding:11px 13px 9px;border:2.5px solid var(--ink,#1F1A17);border-radius:16px;background:#fff;box-shadow:4px 4px 0 var(--ink,#1F1A17);font-family:var(--sans,Nunito,sans-serif);color:var(--ink,#1F1A17);opacity:0;transform:translate(-50%,16px) scale(.96);transition:opacity .28s ease,transform .38s cubic-bezier(.34,1.56,.64,1);pointer-events:none;overflow:hidden;}',
    '.gd-tip.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto;}',
    '.gd-tip .gd-row{display:flex;gap:11px;align-items:flex-start;}',
    '.gd-tip .gd-ic{flex-shrink:0;width:32px;height:32px;border-radius:50%;border:2px solid var(--ink,#1F1A17);background:var(--yellow-bg,#FFF4C7);display:flex;align-items:center;justify-content:center;font-size:16px;}',
    '.gd-tip .gd-lab{display:inline-block;font-size:10.5px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;color:var(--yellow-d,#C99A08);margin-bottom:1px;}',
    '.gd-tip p{margin:0;font-size:14px;line-height:1.35;font-weight:800;}',
    '.gd-tip .gd-x{flex-shrink:0;width:28px;height:28px;margin:-4px -6px 0 0;border:0;background:none;font-size:16px;font-weight:900;color:var(--muted,#6E655C);cursor:pointer;}',
    '.gd-tip .gd-foot{display:flex;justify-content:space-between;align-items:center;margin:6px 0 0 43px;}',
    '.gd-tip .gd-off{border:0;background:none;padding:2px 0;font:inherit;font-size:12px;font-weight:800;color:var(--muted,#6E655C);text-decoration:underline;cursor:pointer;}',
    '.gd-tip .gd-ok{border:2px solid var(--ink,#1F1A17);border-radius:999px;background:var(--yellow,#FFD23F);padding:3px 14px;font:inherit;font-size:12.5px;font-weight:900;color:var(--ink,#1F1A17);cursor:pointer;box-shadow:2px 2px 0 var(--ink,#1F1A17);}',
    '.gd-tip .gd-bar{position:absolute;left:0;bottom:0;height:3px;background:var(--yellow,#FFD23F);width:100%;transform-origin:left;}',
    '.gd-tip.on .gd-bar{animation:gdBar linear forwards;}',
    '@keyframes gdBar{from{transform:scaleX(1);}to{transform:scaleX(0);}}',
    '@media (prefers-reduced-motion:reduce){.gd-wait,.gd-wait .gd-ic,.chip.gd-spot,.chip.gd-spot::before,.gd-nudge .gd-em,.gd-wait::after{animation:none!important;}}'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('gd-style')) return;
    var s = document.createElement('style'); s.id = 'gd-style'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  injectCss();

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function seenList() { try { var v = JSON.parse(get(KEY_SEEN) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function markSeen(id) { var l = seenList(); if (l.indexOf(id) < 0) { l.push(id); put(KEY_SEEN, JSON.stringify(l)); } }
  function enabled() { return get(KEY_PLAYED) !== '1' && get(KEY_OFF) !== '1'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function cur() { try { return typeof state !== 'undefined' ? state : null; } catch (e) { return null; } }
  function me() { try { return typeof myPlayerId !== 'undefined' ? myPlayerId : null; } catch (e) { return null; } }
  function doBuzz(p) { try { if (typeof buzz === 'function') buzz(p); } catch (e) {} }
  function sound(k) { try { if (typeof sfx !== 'undefined' && sfx[k]) sfx[k](); } catch (e) {} }

  /* ═══ 1. Last-writer spotlight ═══ */
  // The one person everyone present is waiting on (null unless exactly one is left)
  function lastWriter(st) {
    if (!st || st.phase !== 'writing') return null;
    var sub = {}; (st.submittedPlayerIds || []).forEach(function (id) { sub[id] = 1; });
    var here = (st.players || []).filter(function (p) { return p.connected || sub[p.id]; });
    var waiting = here.filter(function (p) { return !sub[p.id]; });
    return here.length >= 2 && waiting.length === 1 ? waiting[0] : null;
  }
  var LINES = ['Everyone else is locked in.', 'The table holds its breath.', 'Genius takes time. Apparently.', 'No pressure. (Some pressure.)', 'Every chip is waiting.'];
  function waitHtml(p) {
    if (!p) return '';
    var st = cur() || {}, line = LINES[hash((st.code || '') + '|' + st.round + '|' + p.id) % LINES.length];
    return '<div class="gd-wait" role="status"><span class="gd-ic" aria-hidden="true">⏳</span><div><div class="gd-h">Waiting on ' + esc(p.name) + '<span class="gd-dots"></span></div><span class="gd-s">' + esc(line) + '</span></div></div>';
  }
  var nudged = {};
  function checkNudge(st) {
    var p = lastWriter(st);
    if (!p || p.id !== me() || st.hasSubmitted) return;
    var k = st.code + '|' + st.round + '|' + (st.cartoon && st.cartoon.id);
    if (nudged[k]) return;
    nudged[k] = 1;
    showNudge();
  }
  var nudgeEl = null, nudgeT = null;
  function showNudge() {
    if (!nudgeEl) {
      nudgeEl = document.createElement('div'); nudgeEl.className = 'gd-nudge'; nudgeEl.setAttribute('role', 'status');
      nudgeEl.addEventListener('pointerdown', function (e) { e.preventDefault(); }); // keep the keyboard up
      nudgeEl.addEventListener('click', hideNudge);
      document.body.appendChild(nudgeEl);
    }
    nudgeEl.innerHTML = '<span class="gd-em" aria-hidden="true">👋</span><div><b>Everyone’s waiting on you!</b><span class="gd-s">No rush — the table’s ready when you are.</span></div>';
    hideTip();   // the nudge matters more right now
    void nudgeEl.offsetWidth;
    nudgeEl.classList.add('on');
    doBuzz([70, 60, 70, 60, 160]); sound('yourTurn');
    clearTimeout(nudgeT); nudgeT = setTimeout(hideNudge, 4800);
  }
  function hideNudge() { clearTimeout(nudgeT); if (nudgeEl) nudgeEl.classList.remove('on'); }

  /* ═══ 2. First-game coach cards ═══ */
  function moment(st) {
    if (!st) return null;
    var screen = document.getElementById('screen-game');
    if (!screen || !screen.classList.contains('active')) return null;
    switch (st.phase) {
      case 'writing': return st.hasSubmitted ? null : 'writing';
      case 'reading': return 'facedown';
      case 'first_bets': return st.isDealer ? null : 'first_bets';
      case 'steal': return 'steal';
      case 'answer': {
        var r = st.reel || {}, n = (r.order || []).length, step = r.step || 1;
        return st.reel && step <= n ? 'answer' : null;
      }
      case 'framing': return st.framing && st.framing.resolved ? null : 'frame';   // Frame It has its own screen
      case 'scores': return null;
    }
    return null;
  }
  function blocked() {
    return !!document.querySelector('#stealshow.on, #awards.on, #poobah.on, #induct.on, #sheet.on, #viewer.on, .gal-ov, #warn.on, #readaloud.on, .fx-root');
  }

  var tipEl = null, tipId = null, tipShownAt = 0, hideT = null, pending = null, ticker = null;
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement('div'); tipEl.className = 'gd-tip'; tipEl.setAttribute('role', 'note');
    // Taps on the card never move focus (the keyboard stays up while writing)
    tipEl.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    tipEl.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    tipEl.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('gd-off')) { put(KEY_OFF, '1'); pending = null; }
      hideTip();
    });
    document.body.appendChild(tipEl);
    return tipEl;
  }
  function showTip(id) {
    var t = TIPS[id]; if (!t) return;
    var el = ensureTip();
    el.innerHTML = '<div class="gd-row"><span class="gd-ic" aria-hidden="true">' + t.icon + '</span><div style="flex:1;min-width:0;"><span class="gd-lab">First-game tip</span><p>' + esc(t.text) + '</p></div><button class="gd-x" type="button" tabindex="-1" aria-label="Dismiss tip">✕</button></div>'
      + '<div class="gd-foot"><button class="gd-off" type="button" tabindex="-1">Don’t show tips</button><button class="gd-ok" type="button" tabindex="-1">Got it</button></div><i class="gd-bar" style="animation-duration:' + SHOW_MS + 'ms"></i>';
    el.classList.remove('on');
    tipId = id; tipShownAt = Date.now(); markSeen(id);
    place();
    void el.offsetWidth;
    el.classList.add('on');
    clearTimeout(hideT); hideT = setTimeout(hideTip, SHOW_MS);
  }
  function hideTip() { clearTimeout(hideT); tipId = null; if (tipEl) tipEl.classList.remove('on'); }

  // Bottom-centre, above the action bar; if that would cover a main button, tuck it under the header instead
  function rectsHit(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
  function place() {
    if (!tipEl) return;
    var bar = document.querySelector('#action-bar-root .action-bar');
    var bottom = bar ? Math.round(bar.getBoundingClientRect().height) + 4 : 16;
    tipEl.style.top = 'auto';
    tipEl.style.bottom = 'calc(' + bottom + 'px + env(safe-area-inset-bottom, 0px))';
    var r = tipEl.getBoundingClientRect(), h = r.height || 110;
    var box = { left: r.left, right: r.right, top: innerHeight - bottom - h - 6, bottom: innerHeight - bottom + 6 };
    var buttons = document.querySelectorAll('#game-content .btn:not(.btn-sm), #game-content textarea, #submit-btn');
    var hit = false;
    for (var i = 0; i < buttons.length; i++) {
      var br = buttons[i].getBoundingClientRect();
      if (br.width && br.height && br.bottom > 0 && br.top < innerHeight && rectsHit(box, br)) { hit = true; break; }
    }
    if (hit) {
      var hdr = document.querySelector('#game-content .hdr'), top = hdr ? Math.max(8, Math.round(hdr.getBoundingClientRect().bottom) + 8) : 12;
      tipEl.style.bottom = 'auto'; tipEl.style.top = top + 'px';
    }
  }

  function tick() {
    var st = cur();
    if (tipId) {
      // The moment passed (or an overlay took over): get out of the way
      if (moment(st) !== tipId || blocked()) { if (Date.now() - tipShownAt > 600) hideTip(); }
      else place();
    }
    if (pending && Date.now() >= pending.at) {
      if (!enabled() || moment(st) !== pending.id) pending = null;
      else if (!blocked() && !tipId) { var id = pending.id; pending = null; showTip(id); }
    }
    if (!pending && !tipId && ticker) { clearInterval(ticker); ticker = null; }
  }
  function startTicker() { if (!ticker) ticker = setInterval(tick, 400); }

  var lastMoment = null;
  function onRender(st) {
    try {
      if (!st) return;
      if (st.phase === 'scores' && st.gameOver) put(KEY_PLAYED, '1');   // finished a game: no more tips on this phone
      checkNudge(st);
      if (st.phase !== 'writing' || st.hasSubmitted) hideNudge();
      var m = moment(st);
      if (m !== lastMoment) {
        lastMoment = m;
        if (tipId && tipId !== m) hideTip();
        if (m && enabled() && seenList().indexOf(m) < 0 && (!pending || pending.id !== m)) pending = { id: m, at: Date.now() + (DELAY[m] || 1200) };
      }
      if (pending || tipId) startTicker();
    } catch (e) { try { console.warn('Guide', e); } catch (e2) {} }
  }

  window.Guide = {
    onRender: onRender,
    waitHtml: waitHtml,
    lastWriter: lastWriter,
    reset: function () { try { [KEY_PLAYED, KEY_OFF, KEY_SEEN].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} nudged = {}; lastMoment = null; },
    _state: function () { return { tipId: tipId, pending: pending && pending.id, enabled: enabled(), seen: seenList() }; }
  };
})();
