/* Closed Caption — HOW TO PLAY, the one-minute version. A fake round plays itself, sped up, with the
   real game's buttons and chips: same cartoon for everyone → write a fake caption → the real one hides
   among them → everyone bets at once, the chips drop together → the dealer steals (before the flip) →
   the face-down one flips, a last chip → the reveal (Frame It is on it) → points.
   Big short headlines, a red-pen note, almost no reading. Tap the stage to pause; ◀ ▶ to jump.
   The full rules sit one tap below (index.html #rules-full).
   window.HowTo = { start(mountEl), stop() }. The demo captions are written for this screen only, and the
   cartoon (images/demo_snowman.jpg) was drawn for the demos: it is not in the deck, so nothing here is a spoiler.
   Uses host globals when present: tone(), noise(), soundEnabled(). CSS prefix: ht-. */
(function () {
  'use strict';
  var RED = '#D7372C', INK = '#1F1A17';
  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif", HAND = "'Caveat','Bradley Hand','Segoe Print',cursive";
  var IMG = '/images/demo_snowman.jpg';

  // The cast (dealer doesn't bet). Colours match the game's chip palette feel.
  var P = { you: { n: 'You', i: 'Y', c: '#2F6FE0' }, amy: { n: 'Amy', i: 'A', c: '#E8453A' }, bob: { n: 'Bob', i: 'B', c: '#12A587' }, cat: { n: 'Cat', i: 'C', c: '#E89A2A' }, dan: { n: 'Dan', i: 'D', c: '#6E4CF5' } };
  // The table. One is real; one goes face-down (the Closed Caption).
  var CAPS = [
    { k: '1', t: 'I’m afraid it’s spread to the carrot.', by: 'amy' },
    { k: '2', t: 'Relax. It’s mostly water weight.', by: 'you' },
    { k: '3', t: 'Have you been under a lot of heat lately?', by: null, real: true },
    { k: 'cc', t: 'Any symptoms besides the dripping?', by: 'cat' },
  ];

  var CSS = [
    '.ht{position:relative;user-select:none;-webkit-user-select:none;}',
    '.ht-stage{position:relative;height:min(560px,calc(100dvh - 210px));min-height:470px;border:3px solid ' + INK + ';border-radius:18px;background:var(--paper-2);box-shadow:var(--shadow);overflow:hidden;cursor:pointer;}',
    '.ht-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(rgba(31,26,23,.06) 1.2px,transparent 1.3px) 0 0/16px 16px;pointer-events:none;}',
    '.ht-head{position:absolute;left:12px;right:12px;top:12px;z-index:30;text-align:center;min-height:62px;}',
    '.ht-h{font-family:var(--display);font-weight:700;font-size:27px;line-height:1.05;letter-spacing:-.4px;color:' + INK + ';transition:opacity .25s,transform .25s;}',
    '.ht-h.swap{opacity:0;transform:translateY(8px);}',
    '.ht-note{font-family:' + HAND + ';font-weight:700;font-size:22px;color:' + RED + ';line-height:1;margin-top:4px;transform:rotate(-2deg);transition:opacity .25s;min-height:22px;}',
    '.ht-note.swap{opacity:0;}',
    /* things on the stage */
    '.ht-it{position:absolute;transition:transform .55s cubic-bezier(.3,1.2,.5,1),opacity .35s,width .5s,height .5s,left .5s,top .5s;}',
    '.ht-toon{left:50%;top:92px;width:220px;height:220px;margin-left:-110px;border:3px solid ' + INK + ';border-radius:12px;background:#fff center/cover no-repeat;box-shadow:var(--shadow-sm);z-index:5;}',
    '.ht-toon.small{top:84px;width:116px;height:116px;margin-left:-58px;}',
    '.ht-toon.tiny{top:84px;width:84px;height:84px;margin-left:-42px;}',
    '.ht-toon .ht-q{position:absolute;inset:auto 0 -2px 0;background:#fff;border-top:2.5px solid ' + INK + ';font-family:' + SERIF + ';font-style:italic;font-size:13px;padding:5px 6px;text-align:center;color:#888;}',
    '.ht-toon.small .ht-q,.ht-toon.tiny .ht-q{display:none;}',
    '.ht-phones{left:0;right:0;top:330px;display:flex;justify-content:center;gap:12px;z-index:6;}',
    '.ht-ph{width:46px;height:74px;border:3px solid ' + INK + ';border-radius:10px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0;box-shadow:2px 2px 0 ' + INK + ';opacity:0;transform:translateY(18px);}',
    '.ht-ph.on{opacity:1;transform:none;transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1);}',
    '.ht-ph i{width:32px;height:28px;border-radius:4px;background:url(' + IMG + ') center/cover;border:1.5px solid ' + INK + ';}',
    '.ht-chip{display:inline-flex;align-items:center;justify-content:center;width:var(--s,26px);height:var(--s,26px);border-radius:50%;border:2px solid ' + INK + ';background:radial-gradient(circle,var(--c) 0 58%,transparent 59%),repeating-conic-gradient(from 8deg,var(--c) 0deg 28deg,#fff 28deg 60deg);color:#fff;font-family:var(--display);font-weight:700;font-size:calc(var(--s,26px)*.42);text-shadow:0 1px 0 rgba(0,0,0,.3);box-shadow:0 2px 0 rgba(31,26,23,.9);flex-shrink:0;}',
    /* writing */
    '.ht-write{left:16px;right:16px;top:330px;z-index:8;opacity:0;transform:translateY(20px);}',
    '.ht-write.on{opacity:1;transform:none;}',
    '.ht-box{border:3px solid ' + INK + ';border-radius:12px;background:#fff;padding:12px;font-family:' + SERIF + ';font-size:17px;min-height:56px;text-align:left;box-shadow:var(--shadow-sm);}',
    '.ht-box .cur{display:inline-block;width:2px;height:18px;background:' + INK + ';vertical-align:-3px;animation:htBlink .8s steps(1) infinite;}',
    '@keyframes htBlink{50%{opacity:0}}',
    '.ht-btn{margin-top:12px;padding:12px;border:3px solid ' + INK + ';border-radius:12px;background:var(--yellow);font-weight:900;font-size:16px;text-align:center;box-shadow:var(--shadow-sm);transition:transform .1s,box-shadow .1s;}',
    '.ht-btn.press{transform:translate(3px,3px);box-shadow:0 0 0 ' + INK + ';}',
    '.ht-btn.done{background:var(--teal);color:#fff;}',
    /* the captions */
    '.ht-caps{left:12px;right:12px;top:212px;z-index:8;display:flex;flex-direction:column;gap:8px;}',
    '.ht-cap{position:relative;display:flex;align-items:center;gap:8px;min-height:52px;padding:7px 9px;border:2.5px solid ' + INK + ';border-radius:11px;background:#fff;box-shadow:2px 2px 0 ' + INK + ';opacity:0;transform:translateX(-30px) rotate(-2deg);transition:opacity .3s,transform .45s cubic-bezier(.3,1.4,.5,1),background .3s,box-shadow .3s;}',
    '.ht-cap.on{opacity:1;transform:none;}',
    '.ht-cap .n{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--paper);border:2px solid ' + INK + ';font-family:var(--display);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;}',
    '.ht-cap .n.cc{font-size:9px;background:' + INK + ';color:var(--yellow);border-radius:6px;width:28px;}',
    '.ht-cap .t{flex:1;font-family:' + SERIF + ';font-size:14px;line-height:1.25;text-align:left;}',
    '.ht-cap .chips{display:flex;gap:2px;flex-shrink:0;min-width:30px;justify-content:flex-end;}',
    '.ht-cap .chips .ht-chip{--s:24px;}',
    '.ht-cap.down{background:' + INK + ';color:var(--yellow);}',
    '.ht-cap.down .t{font-family:var(--display);font-weight:700;font-size:14px;letter-spacing:.06em;}',
    '.ht-cap.flip{animation:htFlip .6s ease-in-out;}',
    '@keyframes htFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',
    '.ht-cap.real{background:var(--teal-bg);box-shadow:0 0 0 3px var(--teal),3px 3px 0 ' + INK + ';}',
    '.ht-cap.dim{opacity:.38;}',
    '.ht-cap.tap{box-shadow:0 0 0 4px var(--yellow),2px 2px 0 ' + INK + ';}',
    '.ht-stamp{position:absolute;right:46px;top:50%;transform:translateY(-50%) rotate(-8deg) scale(2.2);opacity:0;font-family:var(--display);font-weight:700;font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border:2.5px solid currentColor;border-radius:6px;background:rgba(255,255,255,.92);white-space:nowrap;transition:transform .25s cubic-bezier(.3,1.6,.5,1),opacity .15s;}',
    '.ht-stamp.on{opacity:1;transform:translateY(-50%) rotate(-8deg) scale(1);}',
    '.ht-pts{position:absolute;right:-4px;top:-12px;z-index:3;font-family:var(--display);font-weight:700;font-size:15px;color:#fff;background:var(--teal);border:2px solid ' + INK + ';border-radius:999px;padding:0 7px;opacity:0;transform:scale(.3);transition:transform .3s cubic-bezier(.3,1.8,.5,1),opacity .2s;}',
    '.ht-pts.on{opacity:1;transform:none;}',
    '.ht-frame{position:absolute;inset:-9px;border:7px solid #C9A24A;border-radius:6px;box-shadow:inset 0 0 0 2px #7a5a00,0 0 0 2px #7a5a00,0 6px 18px rgba(0,0,0,.35);opacity:0;transform:scale(1.4) rotate(3deg);transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .2s;pointer-events:none;}',
    '.ht-frame.on{opacity:1;transform:none;}',
    /* a flying chip, a hand, the claw */
    '.ht-fly{z-index:20;left:0;top:0;transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .3s;}',
    '.ht-hand{z-index:25;left:0;top:0;font-size:34px;opacity:0;transition:transform .45s cubic-bezier(.4,0,.2,1),opacity .2s;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.3));}',
    '.ht-claw{z-index:22;left:0;top:0;font-size:40px;opacity:0;transition:transform .5s cubic-bezier(.4,0,.2,1),opacity .2s;}',
    '.ht-claw::before{content:"";position:absolute;left:50%;bottom:90%;width:3px;height:600px;margin-left:-1.5px;background:#777;}',
    /* scoreboard */
    '.ht-board{left:16px;right:16px;top:110px;z-index:9;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translateY(20px);}',
    '.ht-board.on{opacity:1;transform:none;}',
    '.ht-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border:2.5px solid ' + INK + ';border-radius:12px;background:#fff;box-shadow:2px 2px 0 ' + INK + ';font-weight:900;font-size:17px;}',
    '.ht-row.top{background:var(--yellow-bg);}',
    '.ht-row .nm{flex:1;text-align:left;}',
    '.ht-row .pl{font-family:var(--display);color:#fff;background:var(--teal);border:2px solid ' + INK + ';border-radius:999px;padding:0 8px;font-size:15px;}',
    '.ht-row .sc{font-family:var(--display);font-size:24px;min-width:26px;text-align:right;}',
    /* end card */
    '.ht-end{left:16px;right:16px;top:120px;z-index:12;text-align:center;opacity:0;transform:scale(.9);}',
    '.ht-end.on{opacity:1;transform:none;}',
    '.ht-end .big{font-family:var(--display);font-weight:700;font-size:40px;line-height:1;margin-bottom:10px;}',
    '.ht-end .line{font-size:17px;font-weight:800;color:var(--ink-2);line-height:1.5;}',
    /* controls */
    '.ht-bar{display:flex;align-items:center;gap:8px;margin-top:10px;}',
    '.ht-prog{flex:1;display:flex;gap:3px;}',
    '.ht-prog i{flex:1;height:6px;border-radius:3px;background:var(--line);overflow:hidden;position:relative;}',
    '.ht-prog i b{position:absolute;inset:0;width:0;background:' + INK + ';}',
    '.ht-prog i.done b{width:100%;}',
    '.ht-ctl{width:40px;height:36px;border:2.5px solid ' + INK + ';border-radius:10px;background:#fff;font-size:15px;font-weight:900;box-shadow:2px 2px 0 ' + INK + ';}',
    '.ht-paused{position:absolute;left:50%;top:50%;z-index:40;transform:translate(-50%,-50%);font-size:46px;background:rgba(255,255,255,.9);border:3px solid ' + INK + ';border-radius:50%;width:84px;height:84px;display:none;align-items:center;justify-content:center;}',
    '.ht.paused .ht-paused{display:flex;}',
  ].join('\n');
  try { var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) {}

  var chip = function (who, s) { var p = P[who]; return '<span class="ht-chip" style="--c:' + p.c + (s ? ';--s:' + s + 'px' : '') + '">' + p.i + '</span>'; };
  var snd = function (fn) { try { if (typeof soundEnabled === 'function' && !soundEnabled()) return; fn(); } catch (e) {} };
  var click = function () { snd(function () { tone(1400, 0.03, 0, 'sine', 0.04); }); };
  var plink = function (i) { snd(function () { tone(700 + (i || 0) * 90, 0.05, 0, 'triangle', 0.08); noise(0.03, 0, 0.12, 3000, 'bandpass'); }); };
  var thunk = function () { snd(function () { noise(0.08, 0, 0.3, 500, 'lowpass'); tone(160, 0.12, 0, 'sine', 0.15, 90); }); };
  var ding = function () { snd(function () { tone(1568, 0.4, 0, 'sine', 0.07); tone(2093, 0.5, 90, 'sine', 0.05); }); };

  /* ── A pausable clock: every step is scheduled through it ── */
  var root, stage, timers = [], paused = false, sceneIdx = 0, sceneStart = 0, pausedAt = 0, progT = null;
  function at(ms, fn) { var t = { due: performance.now() + ms, fn: fn, id: 0 }; t.id = setTimeout(function () { run(t); }, ms); timers.push(t); }
  function run(t) { timers = timers.filter(function (x) { return x !== t; }); try { t.fn(); } catch (e) { console.error('howto', e); } }
  function clearAll() { timers.forEach(function (t) { clearTimeout(t.id); }); timers = []; }
  function pause() {
    if (paused || !root) return; paused = true; pausedAt = performance.now(); root.classList.add('paused');
    timers.forEach(function (t) { clearTimeout(t.id); t.left = t.due - pausedAt; });
    try { stage.getAnimations({ subtree: true }).forEach(function (a) { a.pause(); }); } catch (e) {}
  }
  function resume() {
    if (!paused || !root) return; paused = false; root.classList.remove('paused');
    var now = performance.now(); sceneStart += now - pausedAt;
    timers.forEach(function (t) { t.due = now + Math.max(0, t.left); t.id = setTimeout(function () { run(t); }, Math.max(0, t.left)); });
    try { stage.getAnimations({ subtree: true }).forEach(function (a) { a.play(); }); } catch (e) {}
  }

  /* ── The scenes: headline, red-pen note, how long, and what happens ── */
  var $ = function (s) { return stage.querySelector(s); };
  var $$ = function (s) { return [].slice.call(stage.querySelectorAll(s)); };
  var cap = function (k) { return $('.ht-cap[data-k="' + k + '"]'); };
  function head(h, note) {
    var H = root.querySelector('.ht-h'), N = root.querySelector('.ht-note');
    H.classList.add('swap'); N.classList.add('swap');
    setTimeout(function () { H.textContent = h; N.textContent = note || ''; H.classList.remove('swap'); N.classList.remove('swap'); }, 200);
  }
  // fly a chip from (x0,y0) on the stage into a caption's chip tray
  function bet(who, k, from, i) {
    var c = cap(k); if (!c) return;
    var sr = stage.getBoundingClientRect(), tr = c.querySelector('.chips').getBoundingClientRect();
    var f = document.createElement('div'); f.className = 'ht-it ht-fly'; f.innerHTML = chip(who, 24);
    f.style.transform = 'translate(' + from.x + 'px,' + from.y + 'px) scale(1.4)'; stage.appendChild(f);
    void f.offsetWidth;
    f.style.transform = 'translate(' + (tr.right - sr.left - 26) + 'px,' + (tr.top - sr.top + (tr.height - 24) / 2) + 'px) scale(1)';
    setTimeout(function () { f.remove(); c.querySelector('.chips').insertAdjacentHTML('beforeend', chip(who)); plink(i); }, 560);
  }
  function stamp(k, text, color) { var c = cap(k); if (!c) return; var s = document.createElement('span'); s.className = 'ht-stamp'; s.style.color = color; s.textContent = text; c.appendChild(s); void s.offsetWidth; s.classList.add('on'); thunk(); }
  function pts(k, text) { var c = cap(k); if (!c) return; var s = document.createElement('span'); s.className = 'ht-pts'; s.textContent = text; c.appendChild(s); void s.offsetWidth; s.classList.add('on'); ding(); }

  var SCENES = [
    { h: 'Everyone sees the same cartoon.', note: 'one phone each', ms: 5200, go: function () {
      $('.ht-toon').classList.remove('small', 'tiny'); $('.ht-toon').style.opacity = 1;
      ['you', 'amy', 'bob', 'cat', 'dan'].forEach(function (w, i) { at(500 + i * 220, function () { $$('.ht-ph')[i].classList.add('on'); plink(i); }); });
      at(2600, function () { $('.ht-toon .ht-q').textContent = 'The caption is missing…'; });
    } },
    { h: 'Write a fake caption.', note: 'make it sound real', ms: 7400, go: function () {
      $$('.ht-ph').forEach(function (p) { p.classList.remove('on'); });
      $('.ht-toon').classList.add('small');
      var w = $('.ht-write'), box = w.querySelector('.ht-box'), btn = w.querySelector('.ht-btn');
      w.style.top = '226px'; w.classList.add('on'); btn.classList.remove('done', 'press'); btn.textContent = 'Lock it in ✓';
      var txt = CAPS[1].t, n = 0;
      box.innerHTML = '<span class="cur"></span>';
      for (var i = 1; i <= txt.length; i++) (function (i) { at(600 + i * 70, function () { box.innerHTML = txt.slice(0, i) + '<span class="cur"></span>'; if (i % 3 === 0) click(); }); })(i);
      n = 600 + txt.length * 70;
      at(n + 500, function () { btn.classList.add('press'); click(); });
      at(n + 650, function () { btn.classList.remove('press'); btn.classList.add('done'); btn.textContent = '✓ Locked in'; ding(); });
      at(n + 1100, function () { head('Everyone writes one.', 'even the dealer'); });
    } },
    { h: 'The real one hides among them.', note: 'one of these is real. which?', ms: 6200, go: function () {
      $('.ht-write').classList.remove('on');
      $('.ht-toon').classList.add('tiny');
      $$('.ht-cap').forEach(function (c, i) { at(300 + i * 350, function () { c.classList.add('on'); plink(i); }); });
      at(2300, function () { var c = cap('cc'); c.classList.add('tap'); head('One goes face-down.', 'the Closed Caption — could be anyone’s. even the real one.'); });
      at(5400, function () { cap('cc').classList.remove('tap'); });
    } },
    { h: 'Bet chips on the real one.', note: '1 or 2 chips · everyone at once, in secret', ms: 7600, go: function () {
      var sr = stage.getBoundingClientRect(), W = sr.width;
      var hand = $('.ht-hand'), c3 = cap('3');
      // You tap caption 3 and lock in; nobody sees anyone's chips until they all drop together
      at(400, function () { var r = c3.getBoundingClientRect(); hand.style.opacity = 1; hand.style.transform = 'translate(' + (W * 0.55) + 'px,' + (r.top - sr.top + 6) + 'px)'; });
      at(1000, function () { c3.classList.add('tap'); click(); });
      at(1400, function () { hand.style.opacity = 0; c3.classList.remove('tap'); });
      at(2600, function () {
        head('The chips drop together.', 'Bob goes all in on the face-down one');
        bet('you', '3', { x: W / 2, y: sr.height - 40 }, 0); bet('amy', '2', { x: -30, y: 300 }, 1);
        bet('bob', 'cc', { x: W + 10, y: 300 }, 2); bet('bob', 'cc', { x: W + 10, y: 320 }, 3); bet('cat', '3', { x: -30, y: 380 }, 4);
      });
      at(5400, function () { head('Bet chips on the real one.', 'first bets pay more. the face-down one pays most'); });
    } },
    { h: 'The dealer steals one chip.', note: 'before the flip. Dan, the dealer, is a menace', ms: 5000, go: function () {
      var sr = stage.getBoundingClientRect(), c3 = cap('3'), target = c3.querySelectorAll('.ht-chip')[1], claw = $('.ht-claw');
      if (!target) return;
      var tr = target.getBoundingClientRect(), x = tr.left - sr.left - 8, y = tr.top - sr.top - 30;
      claw.style.transition = 'none'; claw.style.transform = 'translate(' + x + 'px,-120px)'; claw.style.opacity = 1; void claw.offsetWidth; claw.style.transition = '';
      at(300, function () { claw.style.transform = 'translate(' + x + 'px,' + y + 'px)'; snd(function () { tone(300, 0.5, 0, 'sawtooth', 0.03, 140); }); });
      at(1100, function () { thunk(); target.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)'; claw.style.transform = 'translate(' + x + 'px,-140px)'; target.style.transform = 'translateY(-' + (y + 170) + 'px)'; });
      at(1700, function () { target.outerHTML = chip('dan'); plink(2); head('The dealer steals one chip.', 'it’s Dan’s chip now. on the real one? Dan scores. on a fake? Cat gets +1.'); });
    } },
    { h: 'The face-down one flips.', note: 'a last chip, if you’ve got one · in turn', ms: 5200, go: function () {
      var c = cap('cc'), sr = stage.getBoundingClientRect();
      at(500, function () { c.classList.add('flip'); thunk(); });
      at(800, function () { c.classList.remove('down'); c.querySelector('.t').textContent = CAPS[3].t; });
      at(1400, function () { c.classList.remove('flip'); });
      at(2600, function () { bet('you', '3', { x: sr.width / 2, y: sr.height - 40 }, 1); head('The face-down one flips.', 'your last chip. late chips pay less'); });
    } },
    { h: 'The reveal.', note: 'who wrote what · who fell for it · Ha or Groan', ms: 7600, go: function () {
      at(400, function () { stamp('1', 'Amy wrote it', P.amy.c); cap('1').classList.add('dim'); });
      at(1500, function () { stamp('2', 'You wrote it', P.you.c); });
      at(2000, function () { pts('2', '+2 fooled Amy'); });
      at(3100, function () { stamp('cc', 'Cat wrote it', P.cat.c); });
      at(3600, function () { pts('cc', '+4 fooled Bob ×2'); });
      at(4800, function () { var c = cap('3'); c.classList.add('real'); stamp('3', '✓ The real one', 'var(--teal)'); snd(function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.25, i * 90, 'square', 0.04); }); }); });
      at(5500, function () { pts('3', '+3 You · +2 Dan'); });
    } },
    { h: 'Frame the good ones.', note: 'beat the real one? tap Frame. most of the table agrees, it hangs in The Gallery.', ms: 5200, go: function () {
      $$('.ht-pts,.ht-stamp').forEach(function (e) { e.style.opacity = 0; });
      $$('.ht-cap').forEach(function (c) { if (c.dataset.k !== 'cc') c.classList.add('dim'); else c.classList.remove('dim'); });
      at(900, function () { var f = document.createElement('span'); f.className = 'ht-frame'; cap('cc').appendChild(f); void f.offsetWidth; f.classList.add('on'); thunk(); });
      at(1500, function () { snd(function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.3, i * 110, 'triangle', 0.06); }); }); });
    } },
    { h: 'Most points wins.', note: 'the winner takes the remote. until next time.', ms: 5200, go: function () {
      $$('.ht-cap').forEach(function (c) { c.classList.remove('on', 'dim', 'real'); c.style.opacity = 0; });
      $('.ht-toon').style.opacity = 0;
      $('.ht-board').classList.add('on');
      $$('.ht-row .pl').forEach(function (p, i) { p.style.opacity = 0; at(600 + i * 300, function () { p.style.transition = 'opacity .2s'; p.style.opacity = 1; plink(i); }); });
    } },
    { h: 'That’s it. You’re ready.', note: '', ms: 99999, end: true, go: function () {
      $('.ht-board').classList.remove('on');
      $('.ht-end').classList.add('on');
      snd(function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.3, i * 120, 'square', 0.04); tone(f / 2, 0.3, i * 120, 'triangle', 0.05); }); });
    } },
  ];

  function stageHtml() {
    var phones = ['you', 'amy', 'bob', 'cat', 'dan'].map(function (w) { return '<div class="ht-ph"><i></i>' + chip(w, 20) + '</div>'; }).join('');
    var caps = CAPS.map(function (c) {
      return '<div class="ht-cap ' + (c.k === 'cc' ? 'down' : '') + '" data-k="' + c.k + '"><span class="n ' + (c.k === 'cc' ? 'cc' : '') + '">' + (c.k === 'cc' ? 'CC' : c.k) + '</span>' +
        '<span class="t">' + (c.k === 'cc' ? 'CLOSED CAPTION' : c.t) + '</span><span class="chips"></span></div>';
    }).join('');
    var rows = [['you', 5, 'top'], ['cat', 4], ['dan', 2], ['amy', 0], ['bob', 0]].map(function (r) {
      return '<div class="ht-row ' + (r[2] || '') + '">' + chip(r[0], 30) + '<span class="nm">' + P[r[0]].n + (r[2] ? ' 👑' : '') + '</span>' + (r[1] ? '<span class="pl">+' + r[1] + '</span>' : '') + '<span class="sc">' + r[1] + '</span></div>';
    }).join('');
    return '<div class="ht-head"><div class="ht-h"></div><div class="ht-note"></div></div>' +
      '<div class="ht-it ht-toon" style="background-image:url(' + IMG + ')"><div class="ht-q">&nbsp;</div></div>' +
      '<div class="ht-it ht-phones">' + phones + '</div>' +
      '<div class="ht-it ht-write"><div class="ht-box"></div><div class="ht-btn">Lock it in ✓</div></div>' +
      '<div class="ht-it ht-caps">' + caps + '</div>' +
      '<div class="ht-it ht-hand">👆</div><div class="ht-it ht-claw">🦾</div>' +
      '<div class="ht-it ht-board">' + rows + '</div>' +
      '<div class="ht-it ht-end"><div class="big">You’re ready.</div><div class="line">Write a fake caption.<br>Bet on the real one.<br>Laugh at whoever got fooled.</div>' +
        '<div class="ht-btn" style="margin-top:18px" data-act="replay">↺ Watch again</div></div>' +
      '<div class="ht-paused">⏸</div>';
  }

  function go(i) {
    clearAll(); if (paused) { paused = false; root.classList.remove('paused'); }
    sceneIdx = Math.max(0, Math.min(SCENES.length - 1, i));
    // rebuild the table for a clean replay of this scene (earlier scenes' end state is fast-forwarded)
    stage.innerHTML = stageHtml();
    for (var k = 0; k < sceneIdx; k++) fastForward(k);
    var s = SCENES[sceneIdx];
    head(s.h, s.note);
    sceneStart = performance.now();
    s.go();
    if (!s.end) at(s.ms, function () { go(sceneIdx + 1); });
    paintProg();
  }
  // Jumping ahead: put the table in the state an earlier scene leaves it in, with no animation
  function fastForward(k) {
    var toon = $('.ht-toon'), caps = $$('.ht-cap');
    if (k === 1) toon.classList.add('small');
    if (k === 2) { toon.classList.add('tiny'); caps.forEach(function (c) { c.style.transition = 'none'; c.classList.add('on'); }); }
    if (k === 3) { cap('3').querySelector('.chips').innerHTML = chip('you') + chip('cat'); cap('2').querySelector('.chips').innerHTML = chip('amy'); cap('cc').querySelector('.chips').innerHTML = chip('bob') + chip('bob'); }
    if (k === 4) cap('3').querySelector('.chips').innerHTML = chip('you') + chip('dan');
    if (k === 5) { var c = cap('cc'); c.classList.remove('down'); c.querySelector('.t').textContent = CAPS[3].t; cap('3').querySelector('.chips').innerHTML = chip('you') + chip('dan') + chip('you'); }
    if (k === 6) { cap('1').classList.add('dim'); cap('3').classList.add('real'); }
    if (k === 7) { caps.forEach(function (c) { if (c.dataset.k !== 'cc') c.classList.add('dim'); }); }
    if (k === 8) { caps.forEach(function (c) { c.classList.remove('on', 'dim', 'real'); c.style.opacity = 0; }); toon.style.opacity = 0; }
  }
  function paintProg() {
    var bars = root.querySelectorAll('.ht-prog i');
    [].forEach.call(bars, function (b, i) { b.classList.toggle('done', i < sceneIdx); var f = b.querySelector('b'); f.style.transition = 'none'; f.style.width = i < sceneIdx ? '100%' : '0'; });
    clearInterval(progT);
    progT = setInterval(function () {
      if (paused || !root) return;
      var s = SCENES[sceneIdx], b = bars[sceneIdx]; if (!b || s.end) return;
      b.querySelector('b').style.width = Math.min(100, (performance.now() - sceneStart) / s.ms * 100) + '%';
    }, 120);
  }

  function start(mount) {
    stop();
    try { if (!document.getElementById('ht-fonts')) { var l = document.createElement('link'); l.id = 'ht-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Libre+Caslon+Text:ital@0;1&display=swap'; document.head.appendChild(l); } } catch (e) {}
    mount.innerHTML = '<div class="ht"><div class="ht-stage"></div>' +
      '<div class="ht-bar"><button class="ht-ctl" data-act="prev" aria-label="Back a step">◀</button><div class="ht-prog">' + SCENES.slice(0, -1).map(function () { return '<i><b></b></i>'; }).join('') + '</div><button class="ht-ctl" data-act="next" aria-label="Next step">▶</button></div></div>';
    root = mount.querySelector('.ht'); stage = root.querySelector('.ht-stage');
    root.onclick = function (e) {
      var a = e.target.closest('[data-act]'), act = a && a.dataset.act;
      if (act === 'prev') return go(sceneIdx - 1);
      if (act === 'next') return go(sceneIdx + 1);
      if (act === 'replay') return go(0);
      if (e.target.closest('.ht-stage')) { if (SCENES[sceneIdx].end) return; paused ? resume() : pause(); }
    };
    go(0);
  }
  function stop() { clearAll(); clearInterval(progT); paused = false; if (root && root.parentNode) root.parentNode.innerHTML = ''; root = null; stage = null; }

  window.HowTo = { start: start, stop: stop, pause: pause, resume: resume, go: function (i) { if (root) go(i); } };
})();
