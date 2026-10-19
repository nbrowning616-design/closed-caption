/* Closed Caption — the steal show: the stage they share, and the short stamp.
   The dealer's steal plays on every phone at once, timed from the shared beat (ccSync(state.steal.at)).
   The server says which show (state.steal.stealShow):
     'full'  — the first steal of a game, or a steal off the real caption: one of the heists in heists.js (12.4 s);
     'short' — every other steal: paperwork. The chip is circled, an ink TRANSFERRED stamp lands on it in the
               dealer's colour, one typed line (6 s).
   Both have the same two held beats, so nobody misses WHOSE chip it was:
     before the grab — the chip circled and lifted, the rest of the table dimmed, "Lilah's chip." large;
     after the grab  — still: the chip in the dealer's colour, "Margaret's now." under it; then the gloat.
   House style: a cartoon panel. Black ink line, soft grey wash, white paper; the chips are the only colour.
   Both shows end on their own (a timer clears the overlay at the end, and a tap skips it).
   Everything is driven by the Web Animations API from one clock, so a frame at time t is the same frame on
   every phone. Big sounds play on the speaker phone only (big()). CSS prefix: st-.
   Exports ccPaintedChip(dealerId, cls, fallbackPid): how a stolen chip looks after the show.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, playerById,
   playerColor, getPlayerIndex, big, buzz, tone, noise. */
(function () {
  'use strict';

  var INK = '#1F1A17';
  var FULL_MS = 12400, SHORT_MS = 6000;   // index.html STEAL_SHOW_MS / STEAL_QUICK_MS; server.js waits these + a margin

  var CSS = [
    '@keyframes stFade{from{opacity:0}to{opacity:1}}',
    /* the panel: paper, a thin ink frame, the table inside it, the caption under it */
    '.st-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:stretch;justify-content:center;padding:calc(26px + var(--sat,0px)) 16px calc(18px + var(--sab,0px));overflow:hidden;background:#FBF8F2;color:' + INK + ';}',
    '.st-head{position:relative;text-align:center;padding:4px 8px 14px;}',
    '.st-eye{font-family:var(--sans);font-weight:800;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#7A7066;margin:0;}',
    '.st-title{font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-weight:700;font-size:29px;line-height:1.1;margin:6px 0 0;color:' + INK + ';}',
    '.st-tag{font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-style:italic;font-size:16px;line-height:1.3;color:#6E655C;margin:6px 0 0;}',
    '.st-panel{position:relative;flex:0 0 auto;height:min(54vh,460px);min-height:300px;border:2px solid ' + INK + ';background:#fff;overflow:hidden;}',
    '.st-room{position:absolute;inset:0;width:100%;height:100%;display:block;}',
    '.st-panel::before{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(181,174,162,0),rgba(181,174,162,.16));pointer-events:none;}',
    '.st-tw{position:absolute;left:16px;right:16px;bottom:22px;perspective:900px;z-index:1;}',
    '.st-table{position:relative;transform:rotateX(22deg);transform-origin:50% 100%;background:#F2EEE7;border:2px solid ' + INK + ';border-radius:12px;padding:4px 12px;box-shadow:0 7px 0 -1px #CFC8BC,0 7px 0 1px ' + INK + ';}',
    '.st-row{display:flex;align-items:center;gap:10px;min-height:46px;padding:5px 2px;}',
    '.st-row+.st-row{border-top:1.5px dashed rgba(31,26,23,.22);}',
    '.st-lbl{width:26px;height:26px;border-radius:50%;background:#fff;color:' + INK + ';border:2px solid ' + INK + ';font-family:var(--serif,Georgia,serif);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '.st-lbl .cc-badge{margin:0;font-size:9px;padding:1px 3px;}',
    '.st-chips{display:flex;flex-wrap:wrap;gap:7px;align-items:center;}',
    '.st-chips .chip{box-shadow:0 2px 0 rgba(31,26,23,.75);}',
    '.st-chips .chip .st-over{position:absolute;left:-2px;top:-2px;margin:0;opacity:0;}',
    /* the pencil ring around the doomed chip */
    '.st-ring{position:absolute;left:0;top:0;width:64px;height:58px;margin:-29px 0 0 -32px;z-index:2;overflow:visible;pointer-events:none;}',
    '.st-ring path{fill:none;stroke:' + INK + ';stroke-width:2.2;stroke-linecap:round;stroke-dasharray:190;stroke-dashoffset:190;}',
    /* the caption under the panel */
    '.st-cap{flex:0 0 auto;min-height:182px;text-align:center;padding:16px 4px 0;}',
    '.st-res{font-family:var(--sans);font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#7A7066;margin:0;opacity:0;}',
    '.st-res b{color:' + INK + ';}',
    /* whose chip: two big lines, the chip beside each name. "Lilah's chip." / "Margaret's now." */
    '.st-who{margin:0 auto;max-width:370px;}',
    '.st-w{display:flex;align-items:center;justify-content:center;gap:11px;margin:0;font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-weight:700;font-size:29px;line-height:1.12;letter-spacing:-.005em;color:' + INK + ';opacity:0;}',
    '.st-w>span:last-child{text-wrap:balance;text-align:left;}',
    '.st-w+.st-w{margin-top:9px;}',
    '.st-w .chip{flex-shrink:0;margin:0;box-shadow:0 2px 0 rgba(31,26,23,.75);}',
    '.st-chips .chip[data-st="victim"]{position:relative;z-index:1;}',
    '.st-quote{font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-style:italic;font-weight:400;font-size:21px;line-height:1.3;margin:14px auto 0;max-width:330px;color:' + INK + ';opacity:0;text-wrap:balance;}',
    /* the short show: no thief, so the panel is just the table; a stamp in the dealer's colour */
    '.st-q{justify-content:center;}',
    '.st-q .st-panel{flex:0 0 auto;height:auto;min-height:0;margin:0;background:#fff;}',
    '.st-q .st-tw{position:relative;left:auto;right:auto;bottom:auto;margin:22px 16px 26px;}',
    '.st-q .st-cap{flex:0 0 auto;min-height:130px;}',
    '.stq-stamp{position:absolute;left:0;top:0;z-index:7;pointer-events:none;opacity:0;padding:4px 8px 3px;border:3px double var(--dc);border-radius:5px;color:var(--dc);background:rgba(255,255,255,.88);text-align:center;line-height:1;white-space:nowrap;}',
    '.stq-stamp b{display:block;font-family:var(--sans);font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;}',
    '.stq-stamp i{display:block;font-family:var(--serif,"Libre Caslon Text",Georgia,serif);font-size:10px;margin-top:2px;}',
    '.st-q .st-quote{font-size:21px;}',
    /* After the show: a stolen chip is the dealer's now — their colour, their initials, still wet */
    '.chip.painted{overflow:visible;}',
    '.chip.painted .pd{position:absolute;left:50%;bottom:-7px;width:18px;height:11px;margin-left:-9px;pointer-events:none;}',
    '.chip.painted .pd path{fill:var(--c);stroke:' + INK + ';stroke-width:1.5;stroke-linejoin:round;}',
    '.chip.painted .ps{position:absolute;right:-6px;top:-6px;width:15px;height:15px;border-radius:50%;background:#FFF8EA;border:1.5px solid ' + INK + ';display:flex;align-items:center;justify-content:center;pointer-events:none;}',
    '.chip.lg.painted .pd{width:24px;height:15px;bottom:-10px;margin-left:-12px;}',
    '.chip.xs.painted .ps,.chip.xs.painted .pd{display:none;}'
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-steal-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var reduced = function () { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /* The dealer: id, colour */
  function dealerId() {
    if (state.dealerId) return state.dealerId;
    var p = (state.players || []).find(function (q) { return q.name === state.dealerName; });
    return p ? p.id : null;
  }
  function colourOf(pid) { try { var i = getPlayerIndex(pid); return i < 0 ? '#E8453A' : playerColor(i); } catch (e) { return '#E8453A'; } }
  function first(pid) { var n = nameOf(pid); try { if (typeof firstName === 'function') return firstName(n); } catch (e) {} return String(n || '').trim().split(/\s+/)[0] || n; }

  /* A stolen chip, as it sits on the table after the show: the dealer's chip, a drip of fresh paint,
     a tiny can on its shoulder. Falls back to the old grey ✕ if we can't tell who the dealer was. */
  var MINI_CAN = '<svg viewBox="0 0 10 14" width="8" height="11" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="9" rx="1.2" fill="' + INK + '"/><rect x="3.4" y="1.6" width="3.6" height="2.6" rx=".8" fill="' + INK + '"/><path d="M3.2 2.9 H.6" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/><rect x="1.5" y="7" width="7" height="3.2" fill="var(--c)"/></svg>';
  var DRIP = '<svg class="pd" viewBox="0 0 18 11" aria-hidden="true"><path d="M2 0 Q2.5 2.5 4.5 3 V6.5 A2 2 0 0 0 8.5 6.5 V3.4 Q9.5 3 10.5 3.6 V8 A2.2 2.2 0 0 0 14.9 8 V3 Q15.8 2 16 0 Z"/></svg>';
  function paintedChip(dId, cls, fallbackPid) {
    if (!dId || !(typeof playerById === 'function' && playerById(dId))) return chipHtml(fallbackPid, (cls || '') + ' stolen');
    return chipHtml(dId, (cls || '') + ' painted', '<span class="ps">' + MINI_CAN + '</span>' + DRIP).replace('title="', 'title="Stolen by ');
  }
  window.ccPaintedChip = paintedChip;

  /* The table: only the rows with chips on them. The doomed chip is data-st="victim", with the dealer's
     chip waiting on top of it, invisible (.st-over), for the moment it changes hands. */
  function tableHtml(st, bare) {
    var bets = state.bets || [], targets = (state.openCaptions || []).map(function (_, i) { return i; }).concat(['closed']);
    var dId = dealerId();
    var rows = targets.map(function (t) {
      var chips = [];
      bets.forEach(function (b, bi) {
        if (b.target === 'pass' || String(b.target) !== String(t)) return;
        var n = (b.count || 0) + (b.stolen || 0);
        for (var k = 0; k < n; k++) {
          var v = bi === st.betIndex && k === n - 1;
          chips.push(chipHtml(b.playerId, '', v && dId ? chipHtml(dId, 'st-over') : '', 'data-st="' + (v ? 'victim' : 'other') + '"'));
        }
      });
      if (!chips.length) return '';
      return '<div class="st-row"><span class="st-lbl">' + (t === 'closed' ? '<span class="cc-badge">CC</span>' : t + 1) + '</span><div class="st-chips">' + chips.join('') + '</div></div>';
    }).join('');
    return (bare ? '' : ROOM) + '<div class="st-tw"><div class="st-table">' + rows + '</div></div>';
  }
  // The room behind the table: a dado rail, a picture slightly askew, a lamp on a long flex. Ink and wash only.
  var ROOM = '<svg class="st-room" viewBox="0 0 360 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
    '<rect x="0" y="0" width="360" height="400" fill="#FFFFFF"/>' +
    '<rect x="0" y="236" width="360" height="164" fill="#F1EEE8"/>' +
    '<path d="M0 236 H360 M0 242 H360" stroke="' + INK + '" stroke-width="1.4" opacity=".55"/>' +
    '<path d="M0 262 H360 M0 286 H360 M0 314 H360" stroke="' + INK + '" stroke-width=".8" opacity=".14"/>' +
    '<g transform="rotate(-2.5 292 120)"><rect x="262" y="92" width="60" height="46" fill="#F4F1EC" stroke="' + INK + '" stroke-width="1.8"/>' +
      '<rect x="268" y="98" width="48" height="34" fill="#fff" stroke="' + INK + '" stroke-width="1"/><path d="M272 126 L284 112 L292 120 L300 108 L312 126 Z" fill="#DCD6CC" stroke="' + INK + '" stroke-width="1"/></g>' +
    '<path d="M292 92 L292 80" stroke="' + INK + '" stroke-width="1" opacity=".5"/>' +
    '<path d="M36 0 V40" stroke="' + INK + '" stroke-width="1.3"/>' +
    '<path d="M18 62 C18 48 26 40 36 40 C46 40 54 48 54 62 Z" fill="#3A3531" stroke="' + INK + '" stroke-width="1.8"/>' +
    '<path d="M24 62 H48" stroke="' + INK + '" stroke-width="1.8"/>' +
    '<path d="M22 64 L6 140 M50 64 L66 140" stroke="#B5AEA2" stroke-width="1" stroke-dasharray="2 4" opacity=".7"/>' +
    '</svg>';
  // A loose pencil loop, drawn on around the doomed chip
  var RING = '<svg class="st-ring" id="st-ring" viewBox="0 0 64 58" aria-hidden="true"><path d="M44 8 C30 1 9 6 5 24 C1 42 20 55 38 52 C55 49 62 34 58 21 C55 12 47 7 36 7"/></svg>';
  // "Lilah’s chip. Margaret’s now." from where this phone sits
  function resultLine(st) {
    var me = myPlayerId, d = dealerId();
    var whose = st.victimId === me ? 'Your chip.' : esc(first(st.victimId)) + '’s chip.';
    var now = d === me || state.isDealer ? 'Yours now.' : esc(first(d) || state.dealerName || 'The dealer') + '’s now.';
    return whose + ' <b>' + now + '</b>';
  }
  // The same thing as two big lines, a chip beside each: "Lilah’s chip." then "Margaret’s now."
  function whoHtml(st) {
    var me = myPlayerId, d = dealerId(), dealerMe = d === me || state.isDealer;
    var w1 = st.victimId === me ? 'Your chip.' : esc(first(st.victimId)) + '’s chip.';
    var w2 = dealerMe ? 'Yours now.' : esc(first(d) || state.dealerName || 'The dealer') + '’s now.';
    return '<div class="st-who"><p class="st-w" id="st-w1">' + (st.victimId ? chipHtml(st.victimId, '') : '') + '<span>' + w1 + '</span></p>' +
      '<p class="st-w" id="st-w2">' + (d ? chipHtml(d, '') : '') + '<span>' + w2 + '</span></p></div>';
  }
  /* The table's spotlight: the other chips dim, the doomed one is lifted while everyone reads whose it is.
     scaleAt: [[ms, scale], ...] on the show's clock (one animation, so nothing fights). Reduce Motion: no lift. */
  function spotlight(anim, o, victim, len, scaleAt, RM) {
    [].slice.call(o.querySelectorAll('.st-chips [data-st="other"]')).forEach(function (el) { anim(el, [{ opacity: 1 }, { opacity: 0.28 }], 400, 250, 'ease-out'); });
    if (!victim || RM || !scaleAt) return;
    anim(victim, scaleAt.map(function (k) { return { transform: 'scale(' + k[1] + ')', offset: Math.min(1, k[0] / len) }; }), len, 0, 'linear');
  }
  function centreIn(el, box) {
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, w: r.width, h: r.height };
  }
  // Web Animation pinned to the shared beat, so every phone draws the same frame
  function animator(startAt) {
    var lag = Math.max(0, performance.now() - startAt);
    return function (el, kf, ms, at, easing, extra) {
      if (!el) return null;
      var op = { duration: Math.max(1, ms), delay: at || 0, easing: easing || 'linear', fill: 'both' };
      for (var k in extra || {}) op[k] = extra[k];
      try {
        var a = el.animate(kf, op);
        try { if (document.timeline && document.timeline.currentTime != null) a.startTime = startAt; } catch (e) { a.currentTime = lag; }
        return a;
      } catch (e) { return null; }
    };
  }
  function ringOn(anim, ring, at, ms) {
    if (!ring) return;
    anim(ring.firstChild, [{ strokeDashoffset: 190 }, { strokeDashoffset: 0 }], ms || 520, at, 'cubic-bezier(.4,0,.2,1)');
  }

  /* Sounds — every call sits inside big(), so only the speaker phone plays them. Soft and short; nothing
     louder than the game's own seal. tone(freq, sec, delayMs, type, vol, glideTo); noise(sec, delayMs, vol, freq, filter) */
  var SND = {
    pencil: function () { noise(0.42, 0, 0.05, 3800, 'bandpass'); },
    pop: function () { tone(1100, 0.06, 0, 'sine', 0.05, 640); noise(0.04, 0, 0.08, 2400, 'bandpass'); },
    clack: function () { noise(0.05, 0, 0.16, 2600, 'bandpass'); tone(520, 0.06, 0, 'triangle', 0.06, 330); tone(140, 0.1, 0, 'sine', 0.1, 95); },
    stamp: function () { noise(0.1, 0, 0.16, 600, 'lowpass'); tone(110, 0.22, 0, 'sine', 0.1, 70); },
    gloat: function () { tone(196, 0.5, 0, 'sine', 0.045); tone(147, 0.7, 180, 'sine', 0.04); },
    creep: function () { [147, 175, 147, 196].forEach(function (f, i) { tone(f, 0.16, i * 260, 'triangle', 0.045); }); }
  };

  function showKind(st) { var k = (st && st.stealShow) || (typeof state !== 'undefined' && state && state.stealShow) || null; return k === 'short' || k === 'full' ? k : null; }
  // How long this steal's show runs (index.html paces the reel after it). No stealShow (older server): the full show.
  function lengthFor(st, fullMs) { return showKind(st) === 'short' ? SHORT_MS : (fullMs || FULL_MS); }

  /* ── The show ── */
  function play(wait, opt) {
    var st = state.steal;
    if (showKind(st) !== 'short' && window.ccHeist) return window.ccHeist.play(wait, opt);
    return short(wait, showKind(st) === 'short' ? SHORT_MS : (opt && opt.fullMs) || FULL_MS);
  }

  /* ── The short show (6 s): paperwork, not a heist ──
     0.15 s the chip is circled and lifted, the table dims · 0.35 s "Lilah's chip." · held, read it ·
     2.1 s the stamp lands, the chip is the dealer's · 2.35 s "Margaret's now." · held, nothing moves ·
     4.15 s the line · 5.6 s fade. Reduce Motion: fades only, same beats. */
  var SQ = { ring: 150, who: 350, hit: 2100, now: 2350, line: 4150 };
  function short(wait, len) {
    var st = state.steal, o = document.getElementById('stealshow');
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var startAt = performance.now() + Math.max(0, wait);
    var T = function (fn, ms) { window._ssT.push(setTimeout(function () { try { fn(); } catch (e) { console.error('steal', e); } }, Math.max(0, startAt + ms - performance.now()))); };
    var close = function () { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick'); o.innerHTML = ''; };
    o.innerHTML = ''; o.classList.remove('out'); o.classList.add('quick', 'on');
    o.onclick = function () { close(); if (window._answerGo) window._answerGo(); };
    T(function () { o.classList.add('out'); }, len - 400);
    T(close, len);
    try {
      var me = state.isDealer, dId = dealerId(), isVictim = st.victimId === myPlayerId;
      o.innerHTML = '<div class="st-stage st-q" id="st-stage" style="visibility:hidden;--dc:' + colourOf(dId) + '">' +
        '<div class="st-head"><p class="st-eye">Transfer of ownership</p></div>' +
        '<div class="st-panel" id="st-panel">' + tableHtml(st, true) + RING +
          '<div class="stq-stamp" id="stq-stamp"><b>Transferred</b><i>to ' + (me ? 'you' : esc(first(dId) || state.dealerName)) + '</i></div></div>' +
        '<div class="st-cap">' + whoHtml(st) + '<p class="st-quote" id="st-quote">' + esc(st.gloat || 'Received. Condition: used.') + '</p></div>' +
        '</div>';
      var $q = function (sel) { return o.querySelector(sel); };
      var stage = $q('#st-stage'), panel = $q('#st-panel'), victim = $q('[data-st="victim"]'), stamp = $q('#stq-stamp'), ring = $q('#st-ring');
      var w1 = $q('#st-w1'), w2 = $q('#st-w2'), line = $q('#st-quote'), RM = reduced(), anim = animator(startAt);
      var beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
      var V = victim ? centreIn(victim, panel) : { x: panel.clientWidth / 2, y: panel.clientHeight / 2 };
      if (ring) ring.style.transform = 'translate(' + V.x.toFixed(1) + 'px,' + V.y.toFixed(1) + 'px)';
      var coat = victim && victim.querySelector('.st-over');
      var px = Math.max(70, Math.min(panel.clientWidth - 70, V.x + 6));
      var place = 'translate(' + px.toFixed(1) + 'px,' + (V.y - (V.h || 34) / 2 - 4).toFixed(1) + 'px) translate(-50%,-100%) rotate(-7deg)';
      // lifted while it's read; set down under the stamp; lifted again, the dealer's now, for the result
      spotlight(anim, o, victim, len, [[0, 1], [SQ.ring, 1], [SQ.ring + 350, 1.2], [SQ.hit - 160, 1.2], [SQ.hit, 1], [SQ.now, 1], [SQ.now + 300, 1.14], [len, 1.14]], RM);
      if (RM) {
        anim(ring, [{ opacity: 0 }, { opacity: 1 }], 300, SQ.ring, 'ease-out'); if (ring) ring.firstChild.style.strokeDashoffset = '0';
        anim(ring, [{ opacity: 1 }, { opacity: 0 }], 250, SQ.hit, 'ease-out', { fill: 'forwards' });
        anim(stamp, [{ opacity: 0, transform: place }, { opacity: 0.94, transform: place }], 300, SQ.hit, 'ease-out');
        anim(coat, [{ opacity: 0 }, { opacity: 1 }], 300, SQ.hit, 'ease-out');
        anim(w1, [{ opacity: 0 }, { opacity: 1 }], 300, SQ.who, 'ease-out');
        anim(w2, [{ opacity: 0 }, { opacity: 1 }], 300, SQ.now, 'ease-out');
        anim(line, [{ opacity: 0 }, { opacity: 1 }], 300, SQ.line, 'ease-out');
      } else {
        ringOn(anim, ring, SQ.ring, 480);
        anim(ring, [{ opacity: 1 }, { opacity: 0 }], 200, SQ.hit, 'ease-out', { fill: 'forwards' });
        anim(stamp, [{ opacity: 0, transform: place + ' scale(1.45)' }, { opacity: 0.94, transform: place + ' scale(1)' }], 120, SQ.hit - 120, 'cubic-bezier(.6,0,1,.6)');
        anim(coat, [{ opacity: 0 }, { opacity: 1 }], 1, SQ.hit, 'linear');
        anim(w1, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 320, SQ.who, 'cubic-bezier(.2,.7,.3,1)');
        anim(w2, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 320, SQ.now, 'cubic-bezier(.2,.7,.3,1)');
        anim(line, [{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], 450, SQ.line, 'cubic-bezier(.2,.7,.3,1)');
      }
      T(function () { stage.style.visibility = ''; beat('steal:quick'); big(SND.pencil); buzz(isVictim ? [40] : 15); }, 0);
      T(function () { beat('steal:set'); big(SND.stamp); buzz(isVictim ? [120, 40, 120] : 25); }, SQ.hit);
      T(function () { beat('steal:gloat'); }, SQ.line);
    } catch (e) { console.error('steal', e); var sg = o.querySelector('#st-stage'); if (sg) sg.style.visibility = ''; }
    return Math.max(0, wait) + len;
  }

  window.ccClaw = { play: play, lengthFor: lengthFor, SHORT_MS: SHORT_MS, FULL_MS: FULL_MS };
  window.ccStealKit = { seeded: seeded, SND: SND, dealerId: dealerId, colourOf: colourOf, reduced: reduced, DRIP: DRIP, first: first,
    tableHtml: tableHtml, ROOM: ROOM, RING: RING, resultLine: resultLine, whoHtml: whoHtml, spotlight: spotlight, centreIn: centreIn, animator: animator, ringOn: ringOn, FULL_MS: FULL_MS };
})();
