/* ═══════════════════════════════════════════════════════════
   Closed Caption — THE OPENING SCREEN (home.js)
   Simple, clean, obvious: the logo, one line, one picture, three buttons.

   The picture shows the game at a glance and says nothing:
     a cartoon card, three caption slips under it,
     chips drop onto the slips (people betting),
     one slip turns over: REAL. The others were lies.
   Slow, with holds. No sound. Still picture under Reduce Motion.

   The cartoons are drawn for this screen only (images/demo_*.jpg): they are
   never dealt, and the captions below are written for this screen only,
   so the home screen never gives an answer away.

   window.Home = {
     start()  -> renders into #home-mount and runs the loop
     stop()   -> stops every timer
   }
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Demo-only cartoons and captions. real = index of the true one; chips = the slip each chip lands on. */
  var SEQ = [
    { img: 'demo_snowman.jpg',  caps: ['Any history of spring?', 'Have you tried Canada?', 'Let’s get you on ice.'], real: 1, chips: [0, 1, 2, 0] },
    { img: 'demo_penguin.jpg',  caps: ['He came with the ice.', 'Members only, kid.', 'Try the other cooler.'], real: 0, chips: [2, 0, 1, 2] },
    { img: 'demo_goldfish.jpg', caps: ['Must be nice.', 'Just one more episode.', 'His ex. She looks happy.'], real: 2, chips: [1, 2, 1, 0] },
    { img: 'demo_robot.jpg',    caps: ['I feel so programmed.', 'They upgraded my brother.', 'Same dream. The toaster.'], real: 1, chips: [0, 2, 1, 0] }
  ];
  var CHIP = ['#E8453A', '#12A587', '#6E4CF5', '#2F6FE0'];
  var LINE = 'One caption is real. The rest are lies.';

  var CASLON = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap';
  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif";
  var RED = '#D7372C';

  var CSS = [
    /* the page: a column that fills the phone; if a small phone runs out of room it scrolls, nothing overlaps */
    '#screen-home.active{display:flex;flex-direction:column;min-height:100dvh;padding-bottom:calc(10px + var(--sab,0px));}',
    '.home-root{flex:1 1 auto;display:flex;flex-direction:column;text-align:center;}',
    '#home-mount{flex:1 1 auto;display:flex;flex-direction:column;}',

    /* logo + the one line */
    '.home-mast{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:9px;margin:6px 0 0;font-family:var(--display);font-weight:700;font-size:34px;line-height:1;letter-spacing:-1px;color:var(--ink);}',
    '.home-mast .home-w1{display:inline-block;transform:rotate(-3deg);background:var(--yellow);padding:4px 10px 5px;border:3px solid var(--ink);border-radius:10px;box-shadow:var(--shadow-sm);}',
    '.home-line{flex:0 0 auto;margin:14px auto 0;padding:0 8px;font-family:' + SERIF + ';font-style:italic;font-size:16px;line-height:1.3;color:var(--ink-2);}',

    /* the picture */
    '.home-stage{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-top:18px;}',
    '.home-cardbox{position:relative;flex:1 1 0;width:100%;min-height:120px;max-height:350px;container-type:size;}',
    '.home-card{position:absolute;top:50%;left:50%;height:calc(100% - 8px);height:min(100cqh - 8px,340px,(100cqw - 12px) * 1.125);aspect-ratio:640/720;transform:translate(-50%,-50%) rotate(-1.5deg);background:#fff;border:3px solid var(--ink);border-radius:14px;box-shadow:var(--shadow);padding:5px;overflow:hidden;}',
    '.home-card img{position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px);object-fit:contain;border-radius:7px;background:#fff;opacity:0;transition:opacity .9s ease;}',
    '.home-card img.home-on{opacity:1;}',

    '.home-slips{flex:0 0 auto;width:min(100%,340px);margin-top:16px;display:flex;flex-direction:column;gap:9px;list-style:none;padding:0;}',
    '.home-slip{position:relative;display:flex;align-items:center;height:40px;padding:0 66px 0 14px;background:#fff;border:2.5px solid var(--ink);border-radius:11px;box-shadow:2px 2px 0 var(--ink);text-align:left;opacity:0;transform:translateY(8px);transition:opacity .6s ease,transform .6s var(--ease-out),background-color .3s;}',
    '.home-slip.home-in{opacity:1;transform:none;}',
    '.home-slips{transition:opacity .7s ease;}.home-slips.home-out{opacity:0;}',
    '.home-slip.home-dim{opacity:.42;}',
    '.home-slip.home-real{background:var(--yellow-bg);}',
    '.home-slip.home-turn{animation:homeTurn .9s cubic-bezier(.45,0,.25,1);}',
    '@keyframes homeTurn{0%{transform:rotateX(0);}50%{transform:perspective(500px) rotateX(90deg);}100%{transform:perspective(500px) rotateX(0);}}',
    '.home-cap{flex:1 1 auto;min-width:0;font-family:' + SERIF + ';font-style:italic;font-size:14.5px;line-height:1.2;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.home-chips{position:absolute;right:10px;top:50%;margin-top:-11px;display:flex;flex-direction:row-reverse;}',
    '.home-chip{display:block;width:22px;height:22px;margin-left:-8px;border-radius:50%;border:2px solid var(--ink);background:radial-gradient(circle,var(--c) 0 56%,transparent 57%),repeating-conic-gradient(from 8deg,var(--c) 0deg 28deg,#fff 28deg 60deg);box-shadow:0 2px 0 rgba(31,26,23,.9);animation:homeChip .7s cubic-bezier(.2,.8,.3,1) both;}',
    '@keyframes homeChip{0%{opacity:0;transform:translateY(-26px);}60%{opacity:1;}100%{opacity:1;transform:none;}}',
    '.home-mark{position:absolute;right:8px;top:-14px;padding:2px 7px 1px;font-family:var(--display);font-weight:700;font-size:11px;line-height:1.2;letter-spacing:2px;color:' + RED + ';background:#FFFBF2;border:2px solid ' + RED + ';border-radius:5px;transform:rotate(-4deg);opacity:0;transition:opacity .5s ease;}',
    '.home-slip.home-real .home-mark{opacity:1;}',

    /* actions (static markup in index.html) */
    '.home-actions{flex:0 0 auto;margin-top:22px;}',
    '.home-actions #rejoin-box:not(:empty){margin-bottom:10px;}',
    '.home-actions #rejoin-box .rejoin-sub{margin:2px 0 0;}.home-actions #rejoin-box .rejoin-sub .btn-link{min-height:40px;}',
    '#screen-home:has(#rejoin-box:not(:empty)) .home-cardbox{min-height:84px;}',
    '.home-actions .btn + .btn{margin-top:10px;}',
    '.home-actions .home-host{font-size:18px;}',
    '.home-foot{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:8px;}',
    '.home-foot .btn-link{display:inline-flex;align-items:center;min-height:36px;line-height:1;padding:0 6px;font-size:13px;color:var(--muted);text-decoration-thickness:1.5px;}',
    '.home-foot .home-dot{color:var(--muted);font-weight:900;}',

    /* shorter phones: tighten, never hide */
    '@media (max-height:700px){.home-mast{font-size:30px;margin-top:0;}.home-line{margin-top:10px;font-size:15px;}.home-stage{margin-top:12px;}.home-slips{margin-top:12px;gap:7px;}.home-slip{height:36px;}.home-actions{margin-top:14px;}.home-actions .btn{padding-top:13px;padding-bottom:13px;}.home-actions .btn + .btn{margin-top:9px;}.home-foot{margin-top:2px;}}',
    '@media (max-height:600px){.home-cardbox{min-height:96px;}}',
    '@media (max-width:350px){.home-cap{font-size:13.5px;}.home-slip{padding-right:60px;}}',

    /* landscape phones: the picture on the left, everything else on the right */
    '@media (orientation:landscape) and (max-height:520px){' +
      '#screen-home.active{max-width:860px;padding-left:calc(20px + env(safe-area-inset-left,0px));padding-right:calc(20px + env(safe-area-inset-right,0px));}' +
      '.home-root,#home-mount{display:contents;}' +
      '#screen-home.active > .home-root{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);grid-template-rows:1fr auto auto auto 1fr;grid-template-areas:"stage ." "stage mast" "stage line" "stage actions" "stage .";column-gap:28px;}' +
      '.home-mast{grid-area:mast;margin-top:4px;}.home-line{grid-area:line;}' +
      '.home-stage{grid-area:stage;margin-top:0;height:calc(100dvh - 30px - var(--sat,0px) - var(--sab,0px));min-height:290px;}' +
      '.home-cardbox{max-height:none;min-height:110px;}' +
      '.home-slips{margin-top:12px;gap:7px;}.home-slip{height:34px;}' +
      '.home-actions{grid-area:actions;margin-top:14px;}' +
    '}'
  ].join('\n');

  var started = false, token = 0, timers = [], seqIdx = 0, els = {}, imgFlip = 0;

  function injectCss() {
    try {
      if (document.getElementById('home-style')) return;
      var s = document.createElement('style');
      s.id = 'home-style';
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
    try { addFont(CASLON, /Libre\+Caslon\+Text/); } catch (e) {}
  }
  function addFont(href, re) {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) if (re.test(links[i].href || '')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
    (document.head || document.documentElement).appendChild(l);
  }
  injectCss();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduced() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function imgUrl(src) { return '/images/' + src; }

  /* ── timers that all die together ── */
  function later(ms, fn) { var t = setTimeout(function () { timers = timers.filter(function (x) { return x !== t; }); fn(); }, ms); timers.push(t); return t; }
  function wait(ms) { var my = token; return new Promise(function (res) { later(ms, function () { if (my === token) res(); }); }); }

  /* ── markup ── */
  function lineText() {
    // a returning player gets their name instead of the pitch: still one quiet line
    var name = '';
    try { name = (localStorage.getItem('cc_name') || '').trim().slice(0, 24); } catch (e) {}
    return name ? 'Welcome back, ' + esc(name) + '.' : LINE;
  }

  function render() {
    var mount = document.getElementById('home-mount');
    if (!mount) return false;
    mount.innerHTML =
      '<h1 class="home-mast"><span class="home-w1">CLOSED</span><span>CAPTION</span></h1>' +
      '<p class="home-line">' + lineText() + '</p>' +
      '<div class="home-stage" aria-hidden="true">' +
        '<div class="home-cardbox"><div class="home-card"><img alt="" draggable="false"><img alt="" draggable="false"></div></div>' +
        '<ul class="home-slips">' +
          [0, 1, 2].map(function () { return '<li class="home-slip"><span class="home-mark">REAL</span><span class="home-cap"></span><span class="home-chips"></span></li>'; }).join('') +
        '</ul>' +
      '</div>';
    els = {
      imgs: mount.querySelectorAll('.home-card img'),
      slips: mount.querySelectorAll('.home-slip'),
      caps: mount.querySelectorAll('.home-cap'),
      chips: mount.querySelectorAll('.home-chips'),
      list: mount.querySelector('.home-slips')
    };
    return true;
  }

  function chip(slot, color) {
    var c = document.createElement('i');
    c.className = 'home-chip'; c.style.setProperty('--c', color);
    els.chips[slot].appendChild(c);
    return c;
  }

  function setCartoon(s, instant) {
    var next = els.imgs[imgFlip], prev = els.imgs[1 - imgFlip];
    imgFlip = 1 - imgFlip;
    if (instant) next.style.transition = 'none';
    next.src = imgUrl(s.img);
    next.classList.add('home-on');
    if (instant) later(50, function () { next.style.transition = ''; });
    prev.classList.remove('home-on');
  }

  function resetSlips(s) {
    for (var i = 0; i < 3; i++) {
      els.slips[i].className = 'home-slip';
      els.caps[i].textContent = s.caps[i];
      els.chips[i].innerHTML = '';
    }
  }

  /* one round of the picture, ~11 s */
  async function round(s, first) {
    resetSlips(s);
    els.list.classList.remove('home-out');
    try { var pre = els.imgs[imgFlip]; pre.src = imgUrl(s.img); if (pre.decode) await Promise.race([pre.decode().catch(function () {}), wait(1200)]); } catch (e) {}
    setCartoon(s, first);
    await wait(first ? 500 : 900);
    // the captions come in, one by one
    for (var i = 0; i < 3; i++) { els.slips[i].classList.add('home-in'); await wait(260); }
    await wait(1300);
    // the bets: a chip at a time
    for (var k = 0; k < s.chips.length; k++) { chip(s.chips[k], CHIP[k % CHIP.length]); await wait(620); }
    await wait(1100);
    // the real one turns over
    var real = els.slips[s.real];
    real.classList.add('home-turn');
    await wait(450);
    real.classList.add('home-real');
    for (var j = 0; j < 3; j++) if (j !== s.real) els.slips[j].classList.add('home-dim');
    await wait(450);
    real.classList.remove('home-turn');
    await wait(3400);
    // clear the table
    els.list.classList.add('home-out');
    await wait(800);
  }

  async function loop() {
    var my = token;
    while (my === token) {
      var first = seqIdx === 0;
      var s = SEQ[seqIdx % SEQ.length]; seqIdx++;
      await round(s, first);
    }
  }

  /* Reduce Motion: one finished picture, still */
  function staticScene() {
    var s = SEQ[0];
    resetSlips(s);
    setCartoon(s, true);
    for (var i = 0; i < 3; i++) {
      els.slips[i].style.transition = 'none';
      els.slips[i].classList.add('home-in');
      if (i === s.real) els.slips[i].classList.add('home-real'); else els.slips[i].classList.add('home-dim');
    }
    s.chips.forEach(function (slot, k) { chip(slot, CHIP[k % CHIP.length]).style.animation = 'none'; });
  }

  function start() {
    try {
      stop();
      if (!render()) return;
      started = true;
      imgFlip = 0; seqIdx = 0;
      if (reduced()) { staticScene(); return; }
      loop().catch(function () {});
    } catch (e) {}
  }

  function stop() {
    token++;
    started = false;
    timers.forEach(function (t) { clearTimeout(t); }); timers = [];
  }

  // pause in the background, resume on return (only if home is the active screen)
  try {
    document.addEventListener('visibilitychange', function () {
      var home = document.getElementById('screen-home');
      if (document.hidden) { if (started) { stop(); started = 'paused'; } }
      else if (started === 'paused' && home && home.classList.contains('active')) start();
      else if (started === 'paused') started = false;
    });
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (started) start(); });
  } catch (e) {}

  window.Home = { start: start, stop: stop };
})();
