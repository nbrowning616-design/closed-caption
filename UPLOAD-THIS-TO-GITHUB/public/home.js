/* ═══════════════════════════════════════════════════════════
   Closed Caption — THE OPENING SCREEN (home.js)
   The cartoon IS the screen. A big cartoon fills the phone behind everything; the camera drifts slowly
   across it. Under it, the magazine caption: one at a time, each gets a rubber stamp. LIE. LIE. REAL.
   Then the next cartoon. The buttons sit over the bottom of the picture. No sound. No hidden text.
   Still picture (the real one stamped) under Reduce Motion.

   The cartoons are drawn for this screen only (images/home_*.jpg): never dealt, and the captions below
   are written for this screen only, so the home screen never gives an answer away.

   window.Home = { start(), stop() }
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Demo-only cartoons and captions. real = index of the true one. */
  var SEQ = [
    { img: 'home_snowman.jpg',  caps: ['Any history of spring?', 'Have you tried Canada?', 'Let’s get you on ice.'], real: 1 },
    { img: 'home_penguin.jpg',  caps: ['Members only, kid.', 'Try the other cooler.', 'He came with the ice.'], real: 2 },
    { img: 'home_goldfish.jpg', caps: ['His ex. She looks happy.', 'Must be nice.', 'Just one more episode.'], real: 0 },
    { img: 'home_robot.jpg',    caps: ['I feel so programmed.', 'Same dream. The toaster.', 'They upgraded my brother.'], real: 2 }
  ];

  var CASLON = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap';
  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif";
  var RED = '#D7372C', GREEN = '#0E8A6F';

  var CSS = [
    /* the screen: no side padding (the picture goes edge to edge); the content column keeps its gutters */
    '#screen-home.active{display:flex;flex-direction:column;min-height:100dvh;padding:0;position:relative;isolation:isolate;}',
    '.home-root{position:relative;z-index:1;flex:1 1 auto;display:flex;flex-direction:column;text-align:center;padding:calc(14px + var(--sat,0px)) 16px calc(10px + var(--sab,0px));}',
    '#home-mount{flex:1 1 auto;display:flex;flex-direction:column;}',

    /* the cartoon, behind everything: as wide as the phone column, down to just under the caption */
    '.home-bg{position:fixed;z-index:0;top:0;left:50%;width:min(100vw,480px);height:min(calc(100dvh - var(--home-foot,250px) + 70px),calc(min(100vw,480px) * 2.1));transform:translateX(-50%);overflow:hidden;background:var(--paper);pointer-events:none;}',
    '.home-bg img{position:absolute;inset:-3%;width:106%;height:106%;object-fit:cover;object-position:0% 50%;opacity:0;transition:opacity 1.1s ease;filter:none;}',
    '.home-bg img.home-on{opacity:1;}',
    '.home-bg img.home-pan-r{animation:homePanR 14s cubic-bezier(.45,0,.55,1) forwards;}',
    '.home-bg img.home-pan-l{animation:homePanL 14s cubic-bezier(.45,0,.55,1) forwards;}',
    '@keyframes homePanR{from{object-position:0% 50%;transform:scale(1);}to{object-position:100% 50%;transform:scale(1.06);}}',
    '@keyframes homePanL{from{object-position:100% 50%;transform:scale(1.06);}to{object-position:0% 50%;transform:scale(1);}}',
    /* soft paper at the top (for the logo) and a long fade into paper at the bottom (for the caption and buttons) */
    '.home-bg::before{content:"";position:absolute;z-index:2;left:0;right:0;top:0;height:130px;background:linear-gradient(var(--paper) 0%,rgba(255,248,234,.75) 35%,rgba(255,248,234,0));}',
    '.home-bg::after{content:"";position:absolute;z-index:2;left:0;right:0;bottom:0;height:46%;background:linear-gradient(rgba(255,248,234,0),rgba(255,248,234,.82) 55%,var(--paper));}',

    /* the logo: two stickers slapped on the cartoon */
    '.home-mast{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:8px;margin:2px 0 0;font-family:var(--display);font-weight:700;font-size:32px;line-height:1;letter-spacing:-1px;color:var(--ink);}',
    '.home-mast span{display:inline-block;padding:4px 10px 5px;border:3px solid var(--ink);border-radius:10px;box-shadow:var(--shadow-sm);}',
    '.home-mast .home-w1{transform:rotate(-3deg);background:var(--yellow);}',
    '.home-mast .home-w2{transform:rotate(2deg);background:#fff;}',

    '.home-gap{flex:1 1 auto;min-height:160px;}',

    /* the caption, magazine style, and its rubber stamp */
    '.home-capbox{position:relative;flex:0 0 auto;height:92px;display:flex;align-items:center;justify-content:center;}',
    '.home-cap{position:relative;margin:0;padding:0 12px;max-width:100%;font-family:' + SERIF + ';font-style:italic;font-size:24px;line-height:1.25;color:var(--ink);text-wrap:balance;opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s var(--ease-out),color .3s;}',
    '.home-cap.home-in{opacity:1;transform:none;}',
    '.home-cap.home-gone{opacity:0;transform:translateY(-8px);}',
    '.home-cap.home-lie{color:rgba(31,26,23,.5);}',
    '.home-stamp{position:absolute;right:4%;top:-6px;padding:2px 10px 0;font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:4px;line-height:1.15;border:3.5px solid currentColor;border-radius:8px;background:rgba(255,251,242,.6);opacity:0;pointer-events:none;transform:rotate(-9deg) scale(2.2);}',
    '.home-stamp.home-hit{animation:homeStamp .32s cubic-bezier(.3,1.6,.5,1) forwards;}',
    '.home-stamp.home-lie{color:' + RED + ';}',
    '.home-stamp.home-real{color:' + GREEN + ';}',
    '.home-stamp.home-off{transition:opacity .35s ease;opacity:0 !important;animation:none;transform:rotate(-9deg) scale(1);}',
    '@keyframes homeStamp{0%{opacity:0;transform:rotate(-9deg) scale(2.2);}100%{opacity:1;transform:rotate(-9deg) scale(1);}}',
    '.home-capbox.home-thud{animation:homeThud .25s ease;}',
    '@keyframes homeThud{30%{transform:translateY(2px);}}',

    /* actions (static markup in index.html) */
    '.home-actions{position:relative;z-index:1;flex:0 0 auto;margin-top:10px;}',
    '.home-actions #rejoin-box:not(:empty){margin-bottom:10px;}',
    '.home-actions #rejoin-box .rejoin-sub{margin:2px 0 0;}.home-actions #rejoin-box .rejoin-sub .btn-link{min-height:40px;}',
    '.home-actions .btn + .btn{margin-top:10px;}',
    '.home-actions .home-host{font-size:18px;}',
    '.home-foot{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:6px;}',
    '.home-foot .btn-link{display:inline-flex;align-items:center;min-height:36px;line-height:1;padding:0 6px;font-size:13px;color:var(--muted);text-decoration-thickness:1.5px;}',
    '.home-foot .home-dot{color:var(--muted);font-weight:900;}',

    /* shorter phones: tighten, never hide */
    '@media (max-height:700px){.home-mast{font-size:28px;}.home-gap{min-height:110px;}.home-capbox{height:78px;}.home-cap{font-size:21px;}.home-actions .btn{padding-top:13px;padding-bottom:13px;}.home-actions .btn + .btn{margin-top:9px;}.home-foot{margin-top:2px;}}',
    '@media (max-width:350px){.home-cap{font-size:20px;}.home-mast{font-size:27px;}}',

    /* landscape phones: the cartoon fills the left, everything else on the right */
    '@media (orientation:landscape) and (max-height:520px){' +
      '#screen-home.active{max-width:none;}' +
      '.home-bg{left:0;transform:none;width:55vw;height:100dvh;}' +
      '.home-bg::after{top:0;left:auto;right:0;bottom:0;width:40%;height:auto;background:linear-gradient(90deg,rgba(255,248,234,0),var(--paper));}' +
      '.home-root{margin-left:48vw;max-width:440px;padding-left:12px;padding-right:calc(16px + env(safe-area-inset-right,0px));justify-content:center;}' +
      '#home-mount{flex:0 0 auto;}.home-gap{display:none;}.home-capbox{height:70px;margin-top:16px;}.home-cap{font-size:19px;}' +
      '.home-bg img,.home-bg img.home-pan-r,.home-bg img.home-pan-l{inset:0;width:100%;height:100%;object-fit:contain;object-position:50% 50%;animation:none;transform:none;}' +
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

  function reduced() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function imgUrl(src) { return '/images/' + src; }

  /* ── timers that all die together ── */
  function later(ms, fn) { var t = setTimeout(function () { timers = timers.filter(function (x) { return x !== t; }); fn(); }, ms); timers.push(t); return t; }
  function wait(ms) { var my = token; return new Promise(function (res) { later(ms, function () { if (my === token) res(); }); }); }

  /* the picture stops where the buttons start: measure them */
  function fitBg() {
    try {
      var a = document.querySelector('#screen-home .home-actions'), r = document.getElementById('screen-home');
      if (a && r) r.style.setProperty('--home-foot', Math.round(a.getBoundingClientRect().height + 16) + 'px');
    } catch (e) {}
  }

  /* ── markup ── */
  function render() {
    var mount = document.getElementById('home-mount'), screen = document.getElementById('screen-home');
    if (!mount || !screen) return false;
    var old = screen.querySelector(':scope > .home-bg'); if (old) old.remove();
    var bg = document.createElement('div');
    bg.className = 'home-bg'; bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<img alt="" draggable="false"><img alt="" draggable="false">';
    screen.insertBefore(bg, screen.firstChild);
    mount.innerHTML =
      '<h1 class="home-mast" aria-label="Closed Caption"><span class="home-w1">CLOSED</span><span class="home-w2">CAPTION</span></h1>' +
      '<div class="home-gap"></div>' +
      '<div class="home-capbox" aria-hidden="true"><p class="home-cap"></p><span class="home-stamp"></span></div>';
    els = {
      imgs: bg.querySelectorAll('img'),
      box: mount.querySelector('.home-capbox'),
      cap: mount.querySelector('.home-cap'),
      stamp: mount.querySelector('.home-stamp')
    };
    fitBg();
    return true;
  }

  function setCartoon(n, still) {
    var next = els.imgs[imgFlip], prev = els.imgs[1 - imgFlip];
    imgFlip = 1 - imgFlip;
    next.classList.remove('home-pan-r', 'home-pan-l');
    void next.offsetWidth;   // restart the drift
    if (still) next.style.objectPosition = '50% 50%';
    else next.classList.add(n % 2 ? 'home-pan-l' : 'home-pan-r');
    next.classList.add('home-on');
    prev.classList.remove('home-on');
  }

  function showCap(text) {
    els.cap.className = 'home-cap';
    els.cap.textContent = '“' + text + '”';
    void els.cap.offsetWidth;
    els.cap.classList.add('home-in');
  }
  function stamp(real) {
    els.stamp.className = 'home-stamp';
    els.stamp.textContent = real ? 'REAL' : 'LIE';
    void els.stamp.offsetWidth;
    els.stamp.classList.add(real ? 'home-real' : 'home-lie', 'home-hit');
    els.box.classList.remove('home-thud'); void els.box.offsetWidth; els.box.classList.add('home-thud');
  }
  function clearCap() {
    els.cap.classList.add('home-gone');
    els.stamp.classList.add('home-off');
  }

  /* one cartoon, ~12 s: three captions, each stamped. LIE, LIE, REAL (in whatever order) */
  async function round(s, n) {
    var my = token, next = els.imgs[imgFlip];
    try { next.src = imgUrl(s.img); if (next.decode) await Promise.race([next.decode().catch(function () {}), wait(1500)]); } catch (e) {}
    if (my !== token) return;   // stopped (or restarted) while the picture was loading: this loop is over
    setCartoon(n);
    await wait(n === 0 ? 700 : 1300);
    for (var i = 0; i < 3; i++) {
      var real = i === s.real;
      showCap(s.caps[i]);
      await wait(1500);
      stamp(real);
      if (!real) els.cap.classList.add('home-lie');
      await wait(real ? 2600 : 1150);
      clearCap();
      await wait(450);
    }
  }

  async function loop() {
    var my = token;
    while (my === token) {
      var n = seqIdx; seqIdx++;
      await round(SEQ[n % SEQ.length], n);
    }
  }

  /* Reduce Motion: one still picture, the real caption stamped */
  function staticScene() {
    var s = SEQ[0];
    els.imgs[0].src = imgUrl(s.img);
    setCartoon(0, true);
    els.cap.style.transition = 'none';
    showCap(s.caps[s.real]);
    els.stamp.textContent = 'REAL';
    els.stamp.className = 'home-stamp home-real';
    els.stamp.style.opacity = '1';
    els.stamp.style.transform = 'rotate(-9deg) scale(1)';
  }

  function start() {
    try {
      stop();
      if (!render()) return;
      started = true;
      imgFlip = 0; seqIdx = 0;
      later(300, fitBg); later(1200, fitBg);
      if (reduced()) { staticScene(); return; }
      loop().catch(function () {});
    } catch (e) {}
  }

  function stop() {
    token++;
    started = false;
    timers.forEach(function (t) { clearTimeout(t); }); timers = [];
  }

  try {
    window.addEventListener('resize', function () { if (started) fitBg(); });
    // the rejoin box can fill in after start: keep the picture's bottom edge right
    var rb = document.getElementById('rejoin-box');
    if (rb && window.MutationObserver) new MutationObserver(function () { if (started) fitBg(); }).observe(rb, { childList: true, subtree: true });
    // pause in the background, resume on return (only if home is the active screen)
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
