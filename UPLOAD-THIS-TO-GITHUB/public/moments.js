/* Closed Caption — the big moments, together.
   - ccSync(at): when a server-timed moment should start on this phone (server time + a short lead)
   - ccBigSound(): does THIS phone play the big sounds? One speaker for the table (the host by default)
   - ccFlash / ccShake / ccPunch / ccImpact: every impact lands on a silent phone too
   - ccBeat(name): marks where this phone is in a moment (data-beat on <html>, and a log for tests)
   Reads the page's globals (state, myPlayerId, clockOffset) at call time; everything is guarded. */
(function () {
  'use strict';
  var LEAD = 400;          // ms after the server's timestamp that every phone starts together
  var STALE = 2500;        // later than this and a phone skips to the end state instead of replaying

  /* global state, myPlayerId, clockOffset */
  function g(name) {   // the page's top-level lets, read at call time
    try {
      if (name === 'state') return typeof state !== 'undefined' ? state : undefined;
      if (name === 'myPlayerId') return typeof myPlayerId !== 'undefined' ? myPlayerId : undefined;
      if (name === 'clockOffset') return typeof clockOffset !== 'undefined' ? clockOffset : undefined;
    } catch (e) {}
    return undefined;
  }
  function serverNow() { var o = g('clockOffset'); return Date.now() + (typeof o === 'number' ? o : 0); }

  /* Clock: phones learn the server's time from every state message. One-way latency only ever makes
     the sample look EARLIER, so the best recent sample is the largest one. */
  var samples = [];
  window.ccClock = function (sample) {
    var now = Date.now();
    samples.push({ v: sample, t: now });
    samples = samples.filter(function (s) { return now - s.t < 60000; }).slice(-12);
    var best = -Infinity;
    samples.forEach(function (s) { if (s.v > best) best = s.v; });
    return best;
  };

  // { wait: ms from now until the moment starts here, late: ms this phone is behind (0 if early), stale }
  window.ccSync = function (at, lead) {
    if (!at) return { wait: 0, late: 0, stale: false };
    var wait = at + (lead == null ? LEAD : lead) - serverNow();
    var late = Math.max(0, -wait);
    return { wait: Math.max(0, wait), late: late, stale: late > STALE };
  };
  window.ccSync.LEAD = LEAD; window.ccSync.STALE = STALE;

  /* One speaker. Four phones each blaring a drumroll is mush, so the big sounds come from one phone:
     the host's (or, if the host's phone is away, the first one still here). Any phone can opt in or out
     from the menu; that choice sticks on the phone. */
  var KEY = 'cc_bigsound';
  function override() { try { var v = localStorage.getItem(KEY); return v === null ? null : v === 'true'; } catch (e) { return null; } }
  function speakerId() {
    var s = g('state');
    if (!s || !s.players) return null;
    var host = s.players.find(function (p) { return p.id === s.hostId && p.connected; });
    var sp = host || s.players.find(function (p) { return p.connected; });
    return sp ? sp.id : null;
  }
  window.ccBigSound = function () {
    var o = override(); if (o !== null) return o;
    var s = g('state'); if (!s) return true;
    var me = g('myPlayerId'), sp = speakerId();
    return !sp || sp === me;
  };
  window.ccBigSoundDefault = function () { var s = g('state'); if (!s) return true; var sp = speakerId(); return !sp || sp === g('myPlayerId'); };
  window.ccSetBigSound = function (on) {
    try { if (on === window.ccBigSoundDefault()) localStorage.removeItem(KEY); else localStorage.setItem(KEY, on ? 'true' : 'false'); } catch (e) {}
  };

  /* Beats: where this phone is in a moment. Tests compare these across phones. */
  window._beats = window._beats || [];
  window.ccBeat = function (name) {
    try { document.documentElement.setAttribute('data-beat', name); } catch (e) {}
    window._beats.push([name, serverNow()]);
    if (window._beats.length > 200) window._beats.shift();
  };

  /* Impact frames: a white flash, a scale punch, a small shake. */
  function restart(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); clearTimeout(el['_t' + cls]); el['_t' + cls] = setTimeout(function () { el.classList.remove(cls); }, 600); }
  // Photosensitivity: never more than one full-screen flash per 400ms (under 3 a second, anywhere in the
  // app), and none at all under Reduce Motion. Shows budget one flash per moment on top of this.
  var lastFlash = -1e9, FLASH_GAP = 400;
  window.ccFlash = function (strength) {
    var a = strength == null ? 0.9 : +strength;
    if (!(a > 0)) return;   // a zero-strength "flash" is a no-op, and must not use up the budget
    if (window.ccReducedMotion && window.ccReducedMotion()) return;
    var t = (window.performance && performance.now) ? performance.now() : Date.now();
    if (t - lastFlash < FLASH_GAP) return;
    lastFlash = t;
    var f = document.getElementById('cc-flash');
    if (!f) { f = document.createElement('div'); f.id = 'cc-flash'; document.body.appendChild(f); }
    f.style.setProperty('--a', String(a));
    restart(f, 'go');
  };
  window.ccShake = function (el) { restart(el || document.getElementById('game-content'), 'cc-shake'); };
  window.ccPunch = function (el) { restart(el, 'cc-punch'); };
  window.ccImpact = function (o) {
    o = o || {};
    if (o.flash !== false) window.ccFlash(o.flash == null ? 0.9 : o.flash);
    if (o.punch) window.ccPunch(o.punch);
    if (o.shake !== false) window.ccShake(o.shake || null);
  };

  var CSS = [
    '#cc-flash{position:fixed;inset:0;z-index:2000;pointer-events:none;background:#fff;opacity:0;}',
    '#cc-flash.go{animation:ccFlash .34s ease-out;}',
    '@keyframes ccFlash{0%{opacity:var(--a,.9);}100%{opacity:0;}}',
    '.cc-shake,#game-content.cc-shake,#boom.on.cc-shake,#stealshow.on.cc-shake{animation:ccShake .34s cubic-bezier(.36,.07,.19,.97);}',
    '@keyframes ccShake{0%,100%{transform:none;}15%{transform:translate(-8px,4px);}30%{transform:translate(7px,-5px);}45%{transform:translate(-5px,3px);}60%{transform:translate(4px,-2px);}80%{transform:translate(-2px,1px);}}',
    '.cc-punch{animation:ccPunch .36s cubic-bezier(.2,.9,.3,1.35);}',
    '@keyframes ccPunch{0%{transform:scale(1.14);}100%{transform:scale(1);}}',
    /* The reveal: the face-down card lifts, trembles, slaps over */
    '.flip.phys .inner{transition:transform .45s cubic-bezier(.2,.8,.3,1);}',
    '.flip.phys .front .ccard{transition:box-shadow .45s ease-out;}',
    '.flip.phys.lift .inner{transform:translateY(-12px) scale(1.06) rotateX(10deg);}',
    '.flip.phys.lift .front .ccard{box-shadow:0 38px 34px -10px rgba(31,26,23,.55),0 0 0 3px #1F1A17;}',
    '.flip.phys.trem .front .ccard{animation:tremble .08s linear infinite;}',
    '.flip.phys.slap .inner{transform:rotateY(180deg);transition:transform .17s cubic-bezier(.6,0,1,.55);}',
    '.flip.phys.instant .inner{transition:none;}',
    '.flip.phys.landed .back>.panel{animation:ccLand .4s cubic-bezier(.2,.9,.3,1.4);}',
    '@keyframes ccLand{0%{transform:rotate(-1deg) scale(1.12,.84);}55%{transform:rotate(-1deg) scale(.97,1.04);}100%{transform:rotate(-1deg) scale(1);}}',
    '.flip-dust{position:absolute;left:50%;bottom:-6px;width:0;height:0;pointer-events:none;}',
    '.flip-dust i{position:absolute;width:10px;height:10px;border-radius:50%;background:#1F1A17;opacity:0;animation:ccDust .5s ease-out forwards;}',
    '@keyframes ccDust{0%{opacity:.5;transform:translate(0,0) scale(1);}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2);}}',
    /* The real caption landing */
    '.spot.correct.cc-punch{animation:ccPunchSm .36s cubic-bezier(.2,.9,.3,1.35);}',
    '@keyframes ccPunchSm{0%{transform:scale(1.05);}100%{transform:scale(1);}}',
    /* The quick steal */
    '#stealshow.quick.on{animation:stFade .12s ease-out;}',
    '@media (prefers-reduced-motion: reduce){.cc-shake{animation:none;}#cc-flash.go{animation-duration:.2s;}}'
  ].join('\n');
  try { var st = document.createElement('style'); st.id = 'cc-moments-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); } catch (e) {}
})();
