/* Closed Caption — HOW TO PLAY. A fake round plays itself, with the real game's chips and buttons.
   Rebuilt Oct 29 2026 around a BIG cartoon (Nick: "the cartoon is so small you can't even tell that it's a cartoon or
   what the cartoon is about, so the captions don't make any sense"). One stage, three bands that never move:
   the headline on top, the cartoon under it (as big as the phone allows), and the bottom band, which holds the
   captions (or the writing box, or what scores). The cartoon stays on screen whenever the captions are.
   Scenes: same cartoon → write a fake → one of these is real → one goes face-down → bet in secret → the chips
   drop together (the dealer bets too) → what scores → the dealer must steal a chip → it's the dealer's chip now →
   the flip → a last chip → the reveal → Bravo! → framed → most points wins.
   The betting runs at reading pace, one idea per screen (Oct 29 2026): the words never change mid-screen, and each
   screen holds about 2 s plus a third of a second a word after the last thing moves. ▶ skips ahead. Tap the stage
   to pause; ◀ ▶ to jump. Short phones: the stage is as tall as the screen allows and layout() sizes the cartoon to
   what is left over, so nothing overlaps (index.html sizes the stage; under 700 px tall the title row goes).
   window.HowTo = { start(mountEl), stop(), pause(), resume(), go(i) }. The demo captions are written for this
   screen only, and the cartoon (images/demo_snowman.jpg) was drawn for the demos: it is not in the deck, so nothing
   here is a spoiler. Uses host globals when present: tone(), noise(), soundEnabled(). CSS prefix: ht-. */
(function () {
  'use strict';
  var RED = '#D7372C', INK = '#1F1A17';
  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif", HAND = "'Caveat','Bradley Hand','Segoe Print',cursive";
  var IMG = '/images/demo_snowman.jpg';
  var A_FULL = 640 / 720, A_CROP = 1.02;   // the picture's own shape; how wide it may go on a short phone (a little off the top and bottom, the clock and the puddle stay)
  var HEAD = 62;                            // the headline band; the cartoon starts under it

  // The cast. Dan deals (he bets 2 chips too, then steals one). Colours: the game's chip palette.
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
    '.ht-stage{position:relative;height:min(600px,calc(100dvh - 200px));min-height:400px;border:3px solid ' + INK + ';border-radius:18px;background:var(--paper-2);box-shadow:var(--shadow);overflow:hidden;cursor:pointer;}',
    '.ht-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(rgba(31,26,23,.06) 1.2px,transparent 1.3px) 0 0/16px 16px;pointer-events:none;}',
    /* the headline band */
    '.ht-head{position:absolute;left:10px;right:10px;top:6px;height:' + (HEAD - 8) + 'px;z-index:30;text-align:center;}',
    '.ht-h{font-family:var(--display);font-weight:700;font-size:25px;line-height:1.1;letter-spacing:-.4px;color:' + INK + ';white-space:nowrap;overflow:hidden;transition:opacity .25s,transform .25s;}',
    '.ht-h.swap{opacity:0;transform:translateY(8px);}',
    '.ht-note{font-family:' + HAND + ';font-weight:700;font-size:18px;color:' + RED + ';line-height:1.05;margin-top:2px;white-space:nowrap;overflow:hidden;transition:opacity .25s;}',
    '.ht-note.wrap{white-space:normal;}',
    '.ht-note.swap{opacity:0;}',
    '.ht-it{position:absolute;}',
    /* the cartoon: sized by layout(), never moved by a scene */
    '.ht-toon{z-index:5;border:3px solid ' + INK + ';border-radius:12px;background:#fff;box-shadow:var(--shadow-sm);overflow:hidden;transition:opacity .35s;}',
    '.ht-toon img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 67%;pointer-events:none;}',
    '.ht-toon.off,.ht-band.off{opacity:0;}',
    '.ht-toon .ht-frame{inset:0;border-radius:9px;}',
    /* the bottom band and what it holds */
    '.ht-band{left:10px;right:10px;bottom:10px;z-index:8;transition:opacity .3s;}',
    '.ht-band>.ht-it{left:0;right:0;}',
    '.ht-miss{top:0;height:36px;display:flex;align-items:center;justify-content:center;border:2.5px dashed #9A9087;border-radius:10px;background:rgba(255,255,255,.7);font-family:' + SERIF + ';font-style:italic;font-size:15px;color:#6E655C;opacity:0;transition:opacity .4s;}',
    '.ht-miss.on{opacity:1;}',
    '.ht-phones{top:50px;display:flex;justify-content:center;gap:12px;}',
    '.ht-ph{position:relative;width:46px;height:74px;border:3px solid ' + INK + ';border-radius:10px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0;box-shadow:2px 2px 0 ' + INK + ';opacity:0;transform:translateY(18px);}',
    '.ht-ph.on{opacity:1;transform:none;transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1);}',
    '.ht-ph i{width:32px;height:30px;border-radius:4px;background:url(' + IMG + ') center/cover;border:1.5px solid ' + INK + ';}',
    '.ht-ph b{position:absolute;left:50%;bottom:-19px;transform:translateX(-50%);font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:' + INK + ';white-space:nowrap;}',
    '.ht-chip{display:inline-flex;align-items:center;justify-content:center;width:var(--s,22px);height:var(--s,22px);border-radius:50%;border:2px solid ' + INK + ';background:radial-gradient(circle,var(--c) 0 58%,transparent 59%),repeating-conic-gradient(from 8deg,var(--c) 0deg 28deg,#fff 28deg 60deg);color:#fff;font-family:var(--display);font-weight:700;font-size:calc(var(--s,22px)*.45);text-shadow:0 1px 0 rgba(0,0,0,.3);box-shadow:0 2px 0 rgba(31,26,23,.9);flex-shrink:0;}',
    /* writing */
    '.ht-write{top:50%;transform:translateY(-40%);opacity:0;transition:opacity .35s,transform .45s cubic-bezier(.3,1.2,.5,1);}',
    '.ht-write.on{opacity:1;transform:translateY(-50%);}',
    '.ht-box{border:3px solid ' + INK + ';border-radius:12px;background:#fff;padding:10px 12px;font-family:' + SERIF + ';font-size:16px;line-height:1.3;min-height:50px;text-align:left;box-shadow:var(--shadow-sm);}',
    '.ht-box .cur{display:inline-block;width:2px;height:17px;background:' + INK + ';vertical-align:-3px;animation:htBlink .8s steps(1) infinite;}',
    '@keyframes htBlink{50%{opacity:0}}',
    '.ht-btn{margin-top:10px;padding:10px;border:3px solid ' + INK + ';border-radius:12px;background:var(--yellow);font-weight:900;font-size:16px;text-align:center;box-shadow:var(--shadow-sm);transition:transform .1s,box-shadow .1s;}',
    '.ht-btn.press{transform:translate(3px,3px);box-shadow:0 0 0 ' + INK + ';}',
    '.ht-btn.done{background:var(--teal);color:#fff;}',
    /* the captions: four rows that keep their height (two lines fit), so the cartoon above never moves */
    '.ht-caps{bottom:0;display:flex;flex-direction:column;gap:8px;}',
    '.ht-cap{position:relative;display:flex;align-items:center;gap:7px;height:40px;padding:0 7px;border:2.5px solid ' + INK + ';border-radius:11px;background:#fff;box-shadow:2px 2px 0 ' + INK + ';opacity:0;transform:translateX(-30px) rotate(-2deg);transition:opacity .3s,transform .45s cubic-bezier(.3,1.4,.5,1),background .3s,box-shadow .3s;}',
    '.ht-cap[data-k="3"]{margin-top:14px;}',   /* room for the real one's points tab, between the rows, over no words */
    '.ht-cap.on{opacity:1;transform:none;}',
    '.ht-cap .n{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--paper);border:2px solid ' + INK + ';font-family:var(--display);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;transition:width .3s,border-radius .3s,background .3s;}',
    '.ht-cap .n.cc{font-size:9px;background:' + INK + ';color:var(--yellow);border-radius:6px;width:28px;}',
    '.ht-cap .n.who{width:42px;height:30px;border-radius:8px;flex-direction:column;gap:1px;background:var(--c);color:#fff;font-family:var(--sans);font-size:11px;font-weight:900;line-height:1;text-shadow:0 1px 0 rgba(0,0,0,.25);animation:htPop .35s cubic-bezier(.3,1.6,.5,1);}',
    '.ht-cap .n.who i{font-style:normal;font-family:var(--display);font-weight:700;font-size:12px;}',
    '.ht-cap .n.who.ok{background:var(--teal);}',
    '@keyframes htPop{0%{transform:scale(.3)}100%{transform:none}}',
    '.ht-cap .t{flex:1;min-width:0;font-family:' + SERIF + ';font-size:13px;line-height:1.2;text-align:left;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}',
    '.ht-cap .chips{display:flex;flex-shrink:0;min-width:22px;justify-content:flex-end;}',
    '.ht-cap .chips .ht-chip+.ht-chip{margin-left:-5px;}',
    '.ht-cap.down{background:' + INK + ';color:var(--yellow);}',
    '.ht-cap.down .t{font-family:var(--display);font-weight:700;font-size:14px;letter-spacing:.06em;}',
    '.ht-cap.flip{animation:htFlip .6s ease-in-out;}',
    '@keyframes htFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}',
    '.ht-cap.real{background:var(--teal-bg);box-shadow:0 0 0 3px var(--teal),3px 3px 0 ' + INK + ';}',
    '.ht-cap.dim{opacity:.4;}',
    '.ht-cap.faded{opacity:.12;}',
    '.ht-cap.tap{box-shadow:0 0 0 4px var(--yellow),2px 2px 0 ' + INK + ';}',
    '.ht-pts{position:absolute;right:8px;top:-22px;z-index:3;font-family:var(--display);font-weight:700;font-size:13px;line-height:16px;color:#fff;background:var(--teal);border:2px solid ' + INK + ';border-radius:999px;padding:0 7px;white-space:nowrap;opacity:0;transform:scale(.3);transition:transform .3s cubic-bezier(.3,1.8,.5,1),opacity .2s;}',
    '.ht-pts.on{opacity:1;transform:none;}',
    '.ht-frame{position:absolute;inset:-5px;border:5px solid #C9A24A;border-radius:6px;box-shadow:inset 0 0 0 2px #7a5a00,0 0 0 2px #7a5a00,0 6px 18px rgba(0,0,0,.35);opacity:0;transform:scale(1.25) rotate(3deg);transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .2s;pointer-events:none;}',
    '.ht-frame.on{opacity:1;transform:none;}',
    '.ht-bravo{flex-shrink:0;padding:3px 10px;border:2px solid #C0322A;border-radius:999px;background:#FFF5F3;color:#B02A22;font-weight:900;font-size:13px;line-height:1.3;white-space:nowrap;opacity:0;transform:scale(.4);transition:transform .3s cubic-bezier(.3,1.8,.5,1),opacity .2s,background .2s,color .2s;}',
    '.ht-bravo.on{opacity:1;transform:none;}',
    '.ht-bravo.lit{background:#D7372C;color:#fff;box-shadow:0 0 0 3px rgba(215,55,44,.22),0 0 12px rgba(215,55,44,.45);}',
    /* what scores: it takes the captions' place, under the cartoon */
    '.ht-pay{top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:6px 12px;border:3px solid ' + INK + ';border-radius:14px;background:#fff;box-shadow:var(--shadow);opacity:0;transform:translateY(16px);transition:opacity .35s,transform .45s cubic-bezier(.3,1.2,.5,1);}',
    '.ht-pay.on{opacity:1;transform:none;}',
    '.ht-pay .ttl{font-family:var(--display);font-weight:700;font-size:15px;text-align:left;margin-bottom:2px;}',
    '.ht-pr{display:flex;align-items:center;gap:10px;min-height:33px;padding:3px 0;border-top:2px dashed var(--line);opacity:0;transform:translateX(-14px);transition:opacity .3s,transform .4s cubic-bezier(.3,1.4,.5,1);}',
    '.ht-pr.on{opacity:1;transform:none;}',
    '.ht-pr.gap{margin-top:4px;border-top:3px solid ' + INK + ';}',
    '.ht-pr .lb{flex:1;text-align:left;font-weight:900;font-size:14px;line-height:1.15;}',
    '.ht-pr .lb small{font-weight:800;font-size:12.5px;color:var(--ink-2);}',
    '.ht-pr .v{font-family:var(--display);font-weight:700;font-size:19px;color:#fff;background:var(--teal);border:2px solid ' + INK + ';border-radius:999px;min-width:46px;text-align:center;padding:0 8px;}',
    '.ht-pr .v.big{background:' + RED + ';}',
    '.ht-chip.pulse{animation:htPulse .9s ease-in-out 3;}',
    '@keyframes htPulse{50%{transform:scale(1.4)}}',
    /* a flying chip, a hand, the claw */
    '.ht-fly{z-index:20;left:0;top:0;transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .3s;}',
    '.ht-hand{z-index:25;left:0;top:0;font-size:34px;opacity:0;transition:transform .45s cubic-bezier(.4,0,.2,1),opacity .2s;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.3));}',
    '.ht-claw{z-index:22;left:0;top:0;font-size:40px;opacity:0;transition:transform .5s cubic-bezier(.4,0,.2,1),opacity .2s;}',
    '.ht-claw::before{content:"";position:absolute;left:50%;bottom:90%;width:3px;height:900px;margin-left:-1.5px;background:#777;}',
    /* the scoreboard and the end card use the whole stage under the headline */
    '.ht-board{left:16px;right:16px;z-index:9;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translateY(20px);transition:opacity .35s,transform .45s cubic-bezier(.3,1.2,.5,1);}',
    '.ht-board.on{opacity:1;transform:none;}',
    '.ht-row{display:flex;align-items:center;gap:10px;padding:7px 12px;border:2.5px solid ' + INK + ';border-radius:12px;background:#fff;box-shadow:2px 2px 0 ' + INK + ';font-weight:900;font-size:17px;}',
    '.ht-row.top{background:var(--yellow-bg);}',
    '.ht-row .nm{flex:1;text-align:left;}',
    '.ht-row .pl{font-family:var(--display);color:#fff;background:var(--teal);border:2px solid ' + INK + ';border-radius:999px;padding:0 8px;font-size:15px;}',
    '.ht-row .sc{font-family:var(--display);font-size:24px;min-width:26px;text-align:right;}',
    '.ht-end{left:16px;right:16px;z-index:12;text-align:center;opacity:0;transform:scale(.9);transition:opacity .35s,transform .45s cubic-bezier(.3,1.2,.5,1);}',
    '.ht-end.on{opacity:1;transform:none;}',
    '.ht-end .big{font-family:var(--display);font-weight:700;font-size:38px;line-height:1;margin:18px 0 12px;}',
    '.ht-end .line{font-size:17px;font-weight:800;color:var(--ink-2);line-height:1.5;}',
    /* controls */
    '.ht-bar{display:flex;align-items:center;gap:8px;margin-top:10px;}',
    '.ht-prog{flex:1;display:flex;gap:3px;}',
    '.ht-prog i{flex:1;height:6px;border-radius:3px;background:var(--line);overflow:hidden;position:relative;}',
    '.ht-prog i b{position:absolute;inset:0;width:0;background:' + INK + ';}',
    '.ht-prog i.done b{width:100%;}',
    '.ht-ctl{width:46px;height:36px;flex:none;border:2.5px solid ' + INK + ';border-radius:10px;background:#fff;font-size:15px;font-weight:900;box-shadow:2px 2px 0 ' + INK + ';cursor:pointer;}',
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
  var root, stage, timers = [], paused = false, sceneIdx = 0, sceneStart = 0, pausedAt = 0, progT = null, G = {};
  function at(ms, fn) { var t = { due: performance.now() + ms, fn: fn, id: 0 }; t.id = setTimeout(function () { run(t); }, ms); timers.push(t); }
  function run(t) { timers = timers.filter(function (x) { return x !== t; }); try { t.fn(); } catch (e) { console.error('howto', e); } }
  function clearAll() { timers.forEach(function (t) { clearTimeout(t.id); }); timers = []; }
  function pause() {
    if (paused || !root || SCENES[sceneIdx].end) return;   // the last card has nothing left to pause
    paused = true; pausedAt = performance.now(); root.classList.add('paused');
    timers.forEach(function (t) { clearTimeout(t.id); t.left = t.due - pausedAt; });
    try { stage.getAnimations({ subtree: true }).forEach(function (a) { a.pause(); }); } catch (e) {}
  }
  function resume() {
    if (!paused || !root) return; paused = false; root.classList.remove('paused');
    var now = performance.now(); sceneStart += now - pausedAt;
    timers.forEach(function (t) { t.due = now + Math.max(0, t.left); t.id = setTimeout(function () { run(t); }, Math.max(0, t.left)); });
    try { stage.getAnimations({ subtree: true }).forEach(function (a) { a.play(); }); } catch (e) {}
  }

  /* ── The layout: the headline band, the cartoon as big as what's left, the captions' band at the bottom ── */
  var $ = function (s) { return stage.querySelector(s); };
  var $$ = function (s) { return [].slice.call(stage.querySelectorAll(s)); };
  var cap = function (k) { return $('.ht-cap[data-k="' + k + '"]'); };
  function layout() {
    if (!stage) return;
    var W = stage.clientWidth, H = stage.clientHeight, band = $('.ht-band'), caps = $('.ht-caps'), toon = $('.ht-toon');
    if (!W || !H || !band) return;
    var bh = Math.max(150, caps.offsetHeight);
    band.style.height = bh + 'px';
    var bandTop = H - 10 - bh, availH = Math.max(80, bandTop - 12 - HEAD), availW = W - 20;
    var h = Math.min(availH, availW / A_FULL), w = Math.min(availW, h * A_CROP);
    toon.style.width = Math.round(w) + 'px'; toon.style.height = Math.round(h) + 'px';
    toon.style.left = Math.round((W - w) / 2) + 'px'; toon.style.top = Math.round(HEAD + (availH - h) / 2) + 'px';
    $$('.ht-board,.ht-end').forEach(function (e) { e.style.top = Math.round(HEAD + 4 + Math.max(0, (H - HEAD - 14 - e.offsetHeight) / 2.5)) + 'px'; });
    G = { W: W, H: H, bandTop: bandTop, bandMid: bandTop + bh / 2 };
  }
  // A headline (and the red-pen note) always fits on one line: the type shrinks a little rather than wrap
  function fit(el, max, min) {
    var s = max; el.style.fontSize = s + 'px'; el.classList.remove('wrap');
    while (el.scrollWidth > el.clientWidth + 1 && s > min) { s -= 1; el.style.fontSize = s + 'px'; }
    if (el.scrollWidth > el.clientWidth + 1) el.classList.add('wrap');
  }
  function fitHead() { if (!root) return; fit(root.querySelector('.ht-h'), 25, 17); fit(root.querySelector('.ht-note'), 18, 13); }
  function head(h, note) {
    var H = root.querySelector('.ht-h'), N = root.querySelector('.ht-note');
    H.classList.add('swap'); N.classList.add('swap');
    setTimeout(function () { if (!root) return; H.textContent = h; N.textContent = note || ''; fitHead(); H.classList.remove('swap'); N.classList.remove('swap'); }, 200);
  }
  // fly a chip from (x0,y0) on the stage into a caption's chip tray
  function bet(who, k, from, i) {
    var c = cap(k); if (!c) return;
    var sr = stage.getBoundingClientRect(), tr = c.querySelector('.chips').getBoundingClientRect();
    var f = document.createElement('div'); f.className = 'ht-it ht-fly'; f.innerHTML = chip(who, 22);
    f.style.transform = 'translate(' + from.x + 'px,' + from.y + 'px) scale(1.4)'; stage.appendChild(f);
    void f.offsetWidth;
    f.style.transform = 'translate(' + (tr.right - sr.left - 24) + 'px,' + (tr.top - sr.top + (tr.height - 22) / 2) + 'px) scale(1)';
    setTimeout(function () { f.remove(); c.querySelector('.chips').insertAdjacentHTML('beforeend', chip(who)); plink(i); }, 560);
  }
  // point at something with the hand, then tap it
  function tapAt(el, ms, then) {
    var hand = $('.ht-hand');
    at(ms, function () { var sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); hand.style.opacity = 1; hand.style.transform = 'translate(' + (r.left - sr.left + r.width * 0.55) + 'px,' + (r.top - sr.top + r.height * 0.35) + 'px)'; });
    at(ms + 600, function () { click(); if (then) then(); });
    at(ms + 1100, function () { hand.style.opacity = 0; });
  }
  // the reveal: the number becomes the writer's name and what they scored
  function who(k, name, color, pts, quiet) {
    var c = cap(k); if (!c) return; var n = c.querySelector('.n');
    n.className = 'n who'; n.style.setProperty('--c', color); n.innerHTML = '<b>' + name + '</b><i>' + pts + '</i>';
    if (quiet) n.style.animation = 'none'; else ding();
  }
  function realOne(quiet) {
    var c = cap('3'), n = c.querySelector('.n');
    c.classList.add('real'); n.className = 'n who ok'; n.innerHTML = '<b>✓</b><i>Real</i>'; if (quiet) n.style.animation = 'none';
    var s = document.createElement('span'); s.className = 'ht-pts'; s.textContent = '+3 You · +2 Dan'; c.appendChild(s);
    if (quiet) s.classList.add('on'); else { void s.offsetWidth; s.classList.add('on'); }
  }
  var capsOn = function () { $$('.ht-cap').forEach(function (c) { c.style.transition = 'none'; c.classList.add('on'); void c.offsetWidth; c.style.transition = ''; }); };
  var bravoBtn = function () { var c = cap('cc'), b = c.querySelector('.ht-bravo'); if (!b) { c.querySelector('.chips').style.display = 'none'; b = document.createElement('span'); b.className = 'ht-bravo'; b.textContent = 'Bravo!'; c.appendChild(b); } return b; };

  var SCENES = [
    { h: 'Same cartoon, every phone.', note: 'one phone each', ms: 5500, go: function () {
      at(200, function () { $('.ht-miss').classList.add('on'); });
      $$('.ht-ph').forEach(function (p, i) { at(700 + i * 220, function () { p.classList.add('on'); plink(i); }); });
    } },
    { h: 'Write a fake caption.', note: 'make it sound real. the dealer too.', ms: 6800, go: function () {
      var w = $('.ht-write'), box = w.querySelector('.ht-box'), btn = w.querySelector('.ht-btn');
      w.classList.add('on'); box.innerHTML = '<span class="cur"></span>';
      var txt = CAPS[1].t;
      for (var i = 1; i <= txt.length; i++) (function (i) { at(500 + i * 65, function () { box.innerHTML = txt.slice(0, i) + '<span class="cur"></span>'; if (i % 3 === 0) click(); }); })(i);
      var n = 500 + txt.length * 65;
      at(n + 400, function () { btn.classList.add('press'); click(); });
      at(n + 550, function () { btn.classList.remove('press'); btn.classList.add('done'); btn.textContent = '✓ Sent'; ding(); });
    } },
    /* The betting (Oct 29 2026, Nick: "a little complicated and needs to give time to digest"): one idea per
       screen, the words never change mid-screen, and each screen holds until it can be read. */
    { h: 'One of these is real.', note: 'the rest are everyone’s fakes', ms: 6500, ff: capsOn, go: function () {
      $$('.ht-cap').forEach(function (c, i) { at(300 + i * 350, function () { c.classList.add('on'); plink(i); }); });
    } },
    { h: 'One goes face-down.', note: 'could be anyone’s. even the real one.', ms: 6500, go: function () {
      at(400, function () { cap('cc').classList.add('tap'); thunk(); });
      at(6000, function () { cap('cc').classList.remove('tap'); });
    } },
    { h: 'Bet on the real one.', note: '1 or 2 chips, in secret', ms: 6500, go: function () {
      // You tap caption 3 and lock in; nobody sees anyone's chips until they all drop together (next screen)
      var c3 = cap('3');
      tapAt(c3, 500, function () { c3.classList.add('tap'); });
      at(2200, function () { c3.classList.remove('tap'); });
    } },
    { h: 'The chips drop together.', note: 'everyone bets at once. the dealer too.', ms: 7000, ff: function () {
      cap('3').querySelector('.chips').innerHTML = chip('you') + chip('cat'); cap('2').querySelector('.chips').innerHTML = chip('amy');
      cap('cc').querySelector('.chips').innerHTML = chip('bob') + chip('bob'); cap('1').querySelector('.chips').innerHTML = chip('dan') + chip('dan');
    }, go: function () {
      var W = G.W, y = G.bandMid;
      at(500, function () {
        bet('you', '3', { x: W / 2, y: G.H - 30 }, 0); bet('amy', '2', { x: -30, y: y - 40 }, 1);
        bet('bob', 'cc', { x: W + 10, y: y }, 2); bet('bob', 'cc', { x: W + 10, y: y + 20 }, 3); bet('cat', '3', { x: -30, y: y + 40 }, 4);
        bet('dan', '1', { x: W + 10, y: y - 60 }, 5); bet('dan', '1', { x: W + 10, y: y - 40 }, 6);
      });
    } },
    { h: 'Early chips pay more.', note: 'if they’re on the real one', ms: 12500, go: function () {
      $('.ht-caps').style.opacity = 0;
      $('.ht-pay').classList.add('on');
      $$('.ht-pr').forEach(function (r, i) { at(700 + i * 1300 + (i === 3 ? 300 : 0), function () { r.classList.add('on'); plink(i); }); });
    } },
    { h: 'The dealer steals a chip.', note: 'Dan is dealing. he must take one.', ms: 6000, ff: function () {
      cap('3').querySelector('.chips').innerHTML = chip('you') + chip('dan');
    }, go: function () {
      var sr = stage.getBoundingClientRect(), target = cap('3').querySelectorAll('.ht-chip')[1], claw = $('.ht-claw');
      if (!target) return;
      var tr = target.getBoundingClientRect(), x = tr.left - sr.left - 9, y = tr.top - sr.top - 34;
      claw.style.transition = 'none'; claw.style.transform = 'translate(' + x + 'px,-140px)'; claw.style.opacity = 1; void claw.offsetWidth; claw.style.transition = '';
      at(500, function () { claw.style.transform = 'translate(' + x + 'px,' + y + 'px)'; snd(function () { tone(300, 0.5, 0, 'sawtooth', 0.03, 140); }); });
      at(1400, function () { thunk(); target.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)'; claw.style.transform = 'translate(' + x + 'px,-160px)'; target.style.transform = 'translateY(-' + (y + 190) + 'px)'; });
      at(2000, function () { target.outerHTML = chip('dan'); plink(2); });
    } },
    { h: 'Now it’s Dan’s chip.', note: 'real one? Dan scores. a fake? Cat gets +1.', ms: 7500, go: function () {
      var d = cap('3').querySelectorAll('.ht-chip')[1];
      at(300, function () { if (d) d.classList.add('pulse'); });
    } },
    { h: 'The face-down one flips.', note: 'now everyone can read it', ms: 4800, ff: function () {
      var c = cap('cc'); c.classList.remove('down'); c.querySelector('.t').textContent = CAPS[3].t;
    }, go: function () {
      var c = cap('cc');
      at(500, function () { c.classList.add('flip'); thunk(); });
      at(800, function () { c.classList.remove('down'); c.querySelector('.t').textContent = CAPS[3].t; });
      at(1400, function () { c.classList.remove('flip'); });
    } },
    { h: 'Then a last chip.', note: 'if you kept one. late chips pay less.', ms: 6000, ff: function () {
      cap('3').querySelector('.chips').innerHTML = chip('you') + chip('dan') + chip('you');
    }, go: function () {
      at(900, function () { bet('you', '3', { x: G.W / 2, y: G.H - 30 }, 1); });
    } },
    // who wrote each one, what they scored, and the chips on it are who fell for it; the real one comes last
    { h: 'The reveal.', note: 'who wrote it · who fell for it', ms: 10500, ff: function () {
      who('1', 'Amy', P.amy.c, '+4', true); who('2', 'You', P.you.c, '+2', true); who('cc', 'Cat', P.cat.c, '+4', true); realOne(true);
      ['1', '2', 'cc'].forEach(function (k) { cap(k).classList.add('dim'); });
    }, go: function () {
      at(600, function () { who('1', 'Amy', P.amy.c, '+4'); thunk(); });
      at(2300, function () { who('2', 'You', P.you.c, '+2'); thunk(); });
      at(4000, function () { who('cc', 'Cat', P.cat.c, '+4'); thunk(); });
      at(5900, function () {
        ['1', '2', 'cc'].forEach(function (k) { cap(k).classList.add('dim'); });
        realOne(); snd(function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.25, i * 90, 'square', 0.04); }); });
      });
    } },
    { h: 'Love one? Bravo!', note: 'on any caption but your own', ms: 5500, ff: function () {
      var b = bravoBtn(); b.classList.add('on', 'lit'); b.textContent = '✓ Bravo!';
    }, go: function () {
      cap('cc').classList.remove('dim');
      var b = bravoBtn();
      at(300, function () { b.classList.add('on'); plink(1); });
      tapAt(b, 900, function () { b.classList.add('lit'); b.textContent = '✓ Bravo!'; });
    } },
    { h: 'Framed!', note: 'most of the table said Bravo!', ms: 5500, go: function () {
      ['1', '2', '3'].forEach(function (k) { cap(k).classList.add('faded'); });
      var c = cap('cc'); c.classList.remove('dim');
      at(500, function () {
        [c, $('.ht-toon')].forEach(function (el) { var f = document.createElement('span'); f.className = 'ht-frame'; el.appendChild(f); void f.offsetWidth; f.classList.add('on'); });
        thunk();
      });
      at(1100, function () { snd(function () { [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, 0.3, i * 110, 'triangle', 0.06); }); }); });
    } },
    { h: 'Most points wins.', note: 'a new dealer every round', ms: 5200, go: function () {
      $('.ht-toon').classList.add('off'); $('.ht-band').classList.add('off');
      $('.ht-board').classList.add('on');
      $$('.ht-row .pl').forEach(function (p, i) { p.style.opacity = 0; at(600 + i * 300, function () { p.style.transition = 'opacity .2s'; p.style.opacity = 1; plink(i); }); });
    } },
    { h: 'That’s it. You’re ready.', note: '', ms: 99999, end: true, go: function () {
      $('.ht-toon').classList.add('off'); $('.ht-band').classList.add('off');
      $('.ht-end').classList.add('on');
      snd(function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.3, i * 120, 'square', 0.04); tone(f / 2, 0.3, i * 120, 'triangle', 0.05); }); });
    } },
  ];

  function stageHtml() {
    var phones = ['you', 'amy', 'bob', 'cat', 'dan'].map(function (w) { return '<div class="ht-ph"><i></i>' + chip(w, 20) + (w === 'dan' ? '<b>dealer</b>' : '') + '</div>'; }).join('');
    var caps = CAPS.map(function (c) {
      return '<div class="ht-cap ' + (c.k === 'cc' ? 'down' : '') + '" data-k="' + c.k + '"><span class="n ' + (c.k === 'cc' ? 'cc' : '') + '">' + (c.k === 'cc' ? 'CC' : c.k) + '</span>' +
        '<span class="t">' + (c.k === 'cc' ? 'CLOSED CAPTION' : c.t) + '</span><span class="chips"></span></div>';
    }).join('');
    // the round's points: You 2 early + 1 late + 2 (fooled Amy); Amy and Cat 4 each (two chips apiece on their fakes); Dan 2 (the stolen chip)
    var rows = [['you', 5, 'top'], ['amy', 4], ['cat', 4], ['dan', 2], ['bob', 0]].map(function (r) {
      return '<div class="ht-row ' + (r[2] || '') + '">' + chip(r[0], 30) + '<span class="nm">' + P[r[0]].n + (r[2] ? ' 👑' : '') + '</span>' + (r[1] ? '<span class="pl">+' + r[1] + '</span>' : '') + '<span class="sc">' + r[1] + '</span></div>';
    }).join('');
    return '<div class="ht-head"><div class="ht-h"></div><div class="ht-note"></div></div>' +
      '<div class="ht-it ht-toon"><img src="' + IMG + '" alt="The cartoon: a snowman at the doctor" draggable="false"></div>' +
      '<div class="ht-it ht-band">' +
        '<div class="ht-it ht-miss">The caption is missing…</div>' +
        '<div class="ht-it ht-phones">' + phones + '</div>' +
        '<div class="ht-it ht-write"><div class="ht-box"></div><div class="ht-btn">Send ↑</div></div>' +
        '<div class="ht-it ht-caps">' + caps + '</div>' +
        // the game's default points (the reveal's +3 = an early 2 + a late 1)
        '<div class="ht-it ht-pay"><div class="ttl">A chip on the real one scores</div>' +
          '<div class="ht-pr"><span class="lb">Early <small>· before the flip</small></span><span class="v">+2</span></div>' +
          '<div class="ht-pr"><span class="lb">Early, on the face-down one</span><span class="v big">+5</span></div>' +
          '<div class="ht-pr"><span class="lb">Late <small>· after the flip</small></span><span class="v">+1</span></div>' +
          '<div class="ht-pr gap"><span class="lb">Each chip on <i>your</i> fake</span><span class="v">+2</span></div></div>' +
      '</div>' +
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
    layout();
    for (var k = 0; k < sceneIdx; k++) fastForward(k);
    var s = SCENES[sceneIdx];
    head(s.h, s.note);
    sceneStart = performance.now();
    s.go();
    if (!s.end) at(s.ms, function () { go(sceneIdx + 1); });
    paintProg();
  }
  // Jumping ahead: put the table in the state an earlier scene leaves it in, with no animation (each scene's ff)
  function fastForward(k) { var s = SCENES[k]; if (s && s.ff) s.ff(); }
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

  var onResize = function () { if (root) { layout(); fitHead(); } };
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
    addEventListener('resize', onResize);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize); } catch (e) {}
    go(0);
  }
  function stop() { clearAll(); clearInterval(progT); removeEventListener('resize', onResize); paused = false; if (root && root.parentNode) root.parentNode.innerHTML = ''; root = null; stage = null; }

  window.HowTo = { start: start, stop: stop, pause: pause, resume: resume, go: function (i) { if (root) go(i); } };
})();
