/* ═══════════════════════════════════════════════════════════
   Closed Caption — THE OPENING SCREEN (home.js)
   Two beats, taking turns, so the screen shows what makes the game different:
   • the PEN: a face-down CC card flips to a cartoon; a caption types itself,
     an editor's red pen strikes it out — twice — and a rubber stamp asks
     the only question the game asks: REAL?
   • the TABLE: chips land on a face-down caption, it flips, and a stamp says
     what happened — FRAMED (a fake that beat the real one) or STOLEN (the
     dealer's one-chip steal).
   The cartoons are drawn for this screen only (images/demo_*.jpg): they are
   not in the deck, so the home screen never gives an answer away.

   window.Home = {
     start()  -> renders into #home-mount and runs the loop
     stop()   -> stops every timer, frame and animation
   }

   Uses host globals when present: galleryGet(), careerSummary(),
   tone(), noise(), soundEnabled(), window.Badges, localStorage cc_name.
   The demo captions below are written for this screen only and are
   never the game's real captions. Everything is try/catch guarded.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Demo-only cartoons (never dealt). pen: flat draft → better → dry. table: a fake caption that fools the room. */
  var SEQ = [
    { img: 'demo_snowman.jpg', lines: ['The snowman is melting.', 'Have you tried somewhere colder?', 'Does this run in the family?'], notes: ['Obvious.', 'Closer.'] },
    { img: 'demo_penguin.jpg', table: 'framed', fake: 'He says he’s with the drinks.', by: 'Amy', chips: ['#E8453A', '#12A587', '#6E4CF5'], note: 'fooled 3. framed.' },
    { img: 'demo_goldfish.jpg', lines: ['The fish looks sad.', 'He misses the old neighborhood.', 'That’s his ex. She looks happy.'], notes: ['Too literal.', 'Warmer.'] },
    { img: 'demo_robot.jpg', table: 'stolen', fake: 'It started when they upgraded my brother.', by: 'Bob', chips: ['#2F6FE0', '#E89A2A'], note: 'the dealer swipes a chip' }
  ];

  var CASLON = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap';
  var CAVEAT = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap';
  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif";
  var HAND = "'Caveat','Bradley Hand','Segoe Print',cursive";
  var RED = '#D7372C';

  var CSS = [
    '#screen-home.active{display:flex;flex-direction:column;height:100dvh;min-height:560px;padding-bottom:calc(14px + var(--sab,0px));overflow:hidden;}',
    '.home-root{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;text-align:center;}',
    '#home-mount{flex:1 1 auto;display:flex;flex-direction:column;min-height:0;}',
    '.home-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}',

    /* masthead */
    '.home-mast{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:9px;padding-top:4px;font-family:var(--display);font-weight:700;font-size:33px;line-height:1;letter-spacing:-1px;}',
    '.home-mast .home-w1{display:inline-block;transform:rotate(-3deg);background:var(--yellow);padding:4px 10px 5px;border:3px solid var(--ink);border-radius:10px;box-shadow:var(--shadow-sm);}',
    '.home-hello{flex:0 0 auto;height:34px;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;overflow:hidden;}',
    '.home-pitch{flex:0 0 auto;margin:12px auto 0;}',
    '.home-pitch .home-p1{font-family:' + SERIF + ';font-weight:700;font-size:min(21px,5.4vw);line-height:1.15;color:var(--ink);letter-spacing:-.2px;}',
    '.home-pitch .home-p2{font-family:' + SERIF + ';font-style:italic;font-weight:400;font-size:min(14.5px,3.8vw);color:var(--ink-2);margin-top:3px;}',
    '.home-hello .home-rt{flex:0 0 auto;font-family:' + SERIF + ';font-size:13px;font-weight:700;color:var(--ink-2);}',
    '.home-hello .home-wb{font-size:15px;font-weight:800;color:var(--ink);overflow:hidden;text-overflow:ellipsis;}',
    '.home-hello .home-wb b{font-weight:900;}',
    '.home-line{flex:0 0 auto;margin:6px auto 0;max-width:330px;padding:0 4px;font-size:13.5px;font-weight:800;line-height:1.35;color:var(--ink-2);}',
    '.home-hello .home-fr{flex:0 0 auto;font-size:12px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:#8E1B22;border:1.5px solid #C9A24A;background:#FFF7DD;border-radius:999px;padding:3px 8px;}',

    /* stage: the card */
    '.home-stage{position:relative;flex:1 1 0;min-height:170px;margin-top:12px;perspective:1100px;}',
    '.home-card{position:absolute;top:0;bottom:4px;left:50%;height:calc(100% - 4px);max-height:470px;aspect-ratio:.62;perspective:900px;transform:translateX(-50%) rotate(-1.5deg);}',
    '.home-card.home-thunk{animation:homeThunk .26s ease-out;}',
    '@keyframes homeThunk{0%{transform:translateX(-50%) rotate(-1.5deg) translateY(0);}35%{transform:translateX(-50%) rotate(-1.2deg) translateY(3px) scale(.992);}100%{transform:translateX(-50%) rotate(-1.5deg) translateY(0);}}',
    '.home-inner{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .9s cubic-bezier(.45,.05,.2,1.12);}',
    '.home-card.home-up .home-inner{transform:rotateY(180deg);}',
    '.home-card.home-down .home-inner{transition:transform .7s cubic-bezier(.55,0,.35,1);}',
    '.home-face{position:absolute;inset:0;border-radius:14px;border:3px solid var(--ink);box-shadow:var(--shadow-lg);backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;}',
    '.home-back{background:var(--ink);background-image:radial-gradient(rgba(255,255,255,.09) 1.5px,transparent 1.5px);background-size:12px 12px;color:var(--yellow);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;}',
    '.home-back .home-cc{font-family:var(--display);font-weight:700;font-size:54px;letter-spacing:2px;border:3.5px solid var(--yellow);border-radius:10px;padding:0 12px;line-height:1.2;}',
    '.home-back .home-lbl{font-size:12px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;opacity:.92;}',
    '.home-back::after{content:"";position:absolute;inset:9px;border:1.5px solid rgba(255,210,63,.28);border-radius:8px;pointer-events:none;}',
    '.home-front{transform:rotateY(180deg);background:#fff;padding:6px;}',
    '.home-front img{display:block;width:100%;height:100%;object-fit:contain;border-radius:7px;background:#fff;}',

    /* the stamp */
    '.home-stamp{position:absolute;z-index:3;left:calc(50% + 14px);bottom:26px;pointer-events:none;opacity:0;transform:rotate(-11deg);}',
    '.home-stamp span{display:block;font-family:var(--display);font-weight:700;font-size:31px;line-height:1;letter-spacing:3px;color:' + RED + ';padding:7px 12px 6px 15px;border:3.5px solid ' + RED + ';border-radius:9px;box-shadow:inset 0 0 0 2.5px rgba(255,251,242,.82),inset 0 0 0 4.5px ' + RED + ';background:rgba(255,251,242,.82);-webkit-mask-image:var(--home-grit);mask-image:var(--home-grit);-webkit-mask-size:150px 80px;mask-size:150px 80px;}',
    '.home-stamp.home-on{opacity:.93;animation:homeStamp .34s cubic-bezier(.2,.9,.3,1.15) both;}',
    '.home-stamp.home-static{opacity:.93;}',
    '.home-stamp.home-off{opacity:0;transition:opacity .4s;}',
    '.home-stamp.home-gold span{color:#A9781C;border-color:#A9781C;box-shadow:inset 0 0 0 2.5px rgba(255,251,242,.82),inset 0 0 0 4.5px #A9781C;}',
    /* the table beat: a face-down caption slip, chips, a flip */
    '.home-slip{position:absolute;left:50%;top:10px;width:min(318px,88%);height:58px;transform:translate(-50%,10px);opacity:0;perspective:700px;transition:opacity .3s,transform .35s cubic-bezier(.3,1.4,.5,1);}',
    '.home-slip.home-on{opacity:1;transform:translate(-50%,0);}',
    '.home-slip-in{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform .7s cubic-bezier(.45,.05,.2,1.12);}',
    '.home-slip.home-flip .home-slip-in{transform:rotateX(180deg);}',
    '.home-slip-f{position:absolute;inset:0;border:2.5px solid var(--ink);border-radius:11px;box-shadow:2px 2px 0 var(--ink);backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center;padding:0 62px 0 12px;}',
    '.home-slip-back{background:var(--ink);color:var(--yellow);font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.12em;}',
    '.home-slip-front{background:#fff;transform:rotateX(180deg);flex-direction:column;align-items:flex-start;text-align:left;}',
    '.home-slip-t{font-family:' + SERIF + ';font-style:italic;font-size:14px;line-height:1.25;color:var(--ink);}',
    '.home-slip-by{font-size:12px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--muted);margin-top:2px;}',
    '.home-chips{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;z-index:2;}',
    '.home-chip{display:block;width:22px;height:22px;margin-left:-7px;border-radius:50%;border:2px solid var(--ink);background:radial-gradient(circle,var(--c) 0 56%,transparent 57%),repeating-conic-gradient(from 8deg,var(--c) 0deg 28deg,#fff 28deg 60deg);box-shadow:0 2px 0 rgba(31,26,23,.9);animation:homeChip .42s cubic-bezier(.3,1.5,.5,1) both;}',
    '@keyframes homeChip{0%{opacity:0;transform:translate(26px,-70px) scale(1.5) rotate(-40deg);}70%{opacity:1;}100%{opacity:1;transform:none;}}',
    '.home-chip.home-yank{animation:homeYank .6s cubic-bezier(.5,0,.8,.4) both;}',
    '@keyframes homeYank{0%{opacity:1;transform:none;}20%{opacity:1;transform:translateY(4px);}100%{opacity:0;transform:translate(-14px,-150px) rotate(30deg);}}',
    '@keyframes homeStamp{0%{opacity:0;transform:rotate(-4deg) scale(2.1);}60%{opacity:.95;transform:rotate(-12deg) scale(.95);}100%{opacity:.93;transform:rotate(-11deg) scale(1);}}',

    /* the caption under the card */
    '.home-capbox{position:relative;flex:0 0 auto;height:76px;margin:12px -4px 0;}',
    '.home-cap{position:absolute;left:0;right:0;top:18px;margin:0 auto;max-width:340px;padding:0 6px;font-family:' + SERIF + ';font-style:italic;font-weight:400;font-size:18px;line-height:1.3;color:var(--ink);transition:opacity .28s,transform .28s,color .3s;}',
    '.home-cap.home-gone{opacity:0;transform:translateY(-8px);}',
    '.home-cap.home-struck{color:#8A8079;}',
    '.home-caret{display:inline-block;width:1.5px;height:1.05em;margin-left:1px;background:var(--ink);vertical-align:-3px;animation:homeBlink 1s steps(2) infinite;}',
    '.home-caret.home-hide{visibility:hidden;}',
    '@keyframes homeBlink{0%{opacity:1;}100%{opacity:0;}}',
    '.home-ink{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;}',
    '.home-ink path{fill:none;stroke:' + RED + ';stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;}',
    '.home-note{position:absolute;font-family:' + HAND + ';font-weight:700;font-size:21px;line-height:1;color:' + RED + ';white-space:nowrap;transform:rotate(-5deg);transform-origin:left bottom;opacity:0;transition:opacity .2s;}',
    '.home-note.home-on{opacity:1;}',
    '.home-pen{position:absolute;left:0;top:0;width:52px;height:52px;pointer-events:none;opacity:0;transition:opacity .2s;z-index:2;}',
    '.home-pen.home-on{opacity:1;}',

    /* your Gallery on the wall */
    '.home-wall{flex:0 0 auto;position:relative;height:74px;margin-top:6px;}',
    '.home-plaque{position:absolute;inset:0;display:flex;align-items:center;gap:13px;text-align:left;padding:0 4px;transition:opacity .5s,transform .5s;}',
    '.home-plaque.home-gone{opacity:0;transform:translateY(4px);}',
    '.home-gilt{flex:0 0 auto;width:58px;height:70px;padding:5px;border-radius:2px;background:linear-gradient(135deg,#6b4b10 0%,#f7e19a 18%,#c9973a 38%,#6e4d10 52%,#e9c86e 70%,#a07422 86%,#3f2a06 100%);box-shadow:0 5px 9px -3px rgba(0,0,0,.55),0 1px 2px rgba(0,0,0,.35);}',
    '.home-gilt i{display:block;width:100%;height:100%;padding:3px;background:#FBF8F0;box-shadow:inset 0 0 0 1px rgba(80,55,10,.45),inset 0 2px 4px rgba(60,40,10,.3);}',
    '.home-gilt img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 30%;}',
    '.home-plaque .home-eb{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#8E1B22;}',
    '.home-plaque .home-gc{margin-top:3px;font-family:' + SERIF + ';font-style:italic;font-size:14.5px;line-height:1.28;color:var(--ink);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}',
    '.home-plaque .home-gw{margin-top:3px;font-size:12px;font-weight:800;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.home-plaque .home-gt{flex:1;min-width:0;}',

    /* actions (static markup in index.html) */
    '.home-actions{flex:0 0 auto;margin-top:14px;}',
    '.home-actions #rejoin-box:not(:empty){margin-bottom:12px;}',
    '.home-actions .btn + .btn{margin-top:10px;}',
    '.home-actions .home-host{font-size:18px;padding:16px 18px;}',
    '.home-foot{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px;}',
    '.home-foot .btn-link{padding:8px 4px;}',
    '.home-foot .home-dot{color:var(--line);font-weight:900;}',
    '.home-foot .small{font-size:13px;color:var(--ink-2);}',
    /* #22 / #40: the quiet reassurances under the buttons */
    '.home-free{margin:10px 0 0;font-size:13.5px;font-weight:800;color:var(--ink-2);}',
    '.home-call{margin:2px auto 0;max-width:330px;font-size:13px;font-weight:800;line-height:1.35;color:var(--ink-2);}',
    '.home-foot a.btn-link{display:inline-flex;align-items:center;}',
    '@media (max-height:700px){.home-capbox{height:62px;margin-top:6px;}.home-wall{height:66px;}.home-gilt{width:52px;height:62px;}.home-mast{font-size:30px;}.home-pitch .home-p2{display:none;}.home-stage{min-height:120px;margin-top:8px;}.home-actions{margin-top:8px;}.home-free{margin-top:6px;}.home-foot{margin-top:0;}}',
    '@media (max-height:620px){.home-line{display:none;}}'
  ].join('\n');

  /* grit for the stamp: fractal noise as a mask */
  var GRIT = "url(\"data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='80'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.15'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
  ) + "\")";

  /* the editor's red pen (tip at 4,48 in a 52-box) */
  var PEN = '<svg class="home-pen" viewBox="0 0 52 52" aria-hidden="true"><g transform="rotate(-42 26 26)">' +
    '<rect x="21.5" y="-6" width="9" height="40" rx="2.5" fill="' + RED + '" stroke="#1F1A17" stroke-width="1.8"/>' +
    '<rect x="21.5" y="-6" width="9" height="10" rx="2" fill="#1F1A17"/>' +
    '<path d="M21.5 34 L26 47 L30.5 34 Z" fill="#F4E7CF" stroke="#1F1A17" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M24.6 43 L26 47 L27.4 43 Z" fill="' + RED + '"/></g></svg>';

  var started = false, token = 0, timers = [], rafs = [], seqIdx = 0, galTimer = null, galIdx = 0, tapped = false, els = {};

  function injectCss() {
    try {
      if (document.getElementById('home-style')) return;
      var s = document.createElement('style');
      s.id = 'home-style';
      s.textContent = CSS + '\n.home-stamp{--home-grit:' + GRIT + ';}';
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
    try { addFont(CASLON, /Libre\+Caslon\+Text/); addFont(CAVEAT, /family=Caveat/); } catch (e) {}
  }
  function addFont(href, re) {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) if (re.test(links[i].href || '')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
    (document.head || document.documentElement).appendChild(l);
  }
  injectCss();

  /* audio only after a real tap (browsers block it before) */
  function markTap() { tapped = true; }
  try { document.addEventListener('pointerdown', markTap, { once: true, capture: true, passive: true }); document.addEventListener('keydown', markTap, { once: true, capture: true }); } catch (e) {}
  function soundOk() { try { return tapped && typeof window.soundEnabled === 'function' && window.soundEnabled() && typeof window.tone === 'function' && typeof window.noise === 'function'; } catch (e) { return false; } }
  function flick() { if (!soundOk()) return; try { window.noise(0.05, 0, 0.1, 3800, 'bandpass'); window.noise(0.07, 55, 0.07, 2400, 'bandpass'); window.tone(2200, 0.04, 0, 'sine', 0.015, 900); } catch (e) {} }
  function thunk() { if (!soundOk()) return; try { window.noise(0.16, 0, 0.32, 380, 'lowpass'); window.tone(92, 0.2, 0, 'sine', 0.26, 52); window.noise(0.03, 0, 0.08, 1800, 'bandpass'); } catch (e) {} }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduced() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function imgUrl(src) { src = String(src || ''); if (!src) return ''; return /^(https?:|\/|data:|blob:)/.test(src) ? src : '/images/' + src; }
  function smarten(s) { return String(s || '').replace(/(^|[\s(\[“])'/g, '$1‘').replace(/'/g, '’').replace(/(^|[\s(\[‘])"/g, '$1“').replace(/"/g, '”'); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ── timers that all die together ── */
  function later(ms, fn) { var t = setTimeout(function () { timers = timers.filter(function (x) { return x !== t; }); fn(); }, ms); timers.push(t); return t; }
  function wait(ms) { var my = token; return new Promise(function (res) { later(ms, function () { if (my === token) res(); }); }); }
  function frames(ms, step) {
    var my = token;
    return new Promise(function (res) {
      var t0 = null;
      function f(now) {
        if (my !== token) return;
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / ms);
        try { step(p); } catch (e) {}
        if (p < 1) rafs.push(requestAnimationFrame(f)); else res();
      }
      rafs.push(requestAnimationFrame(f));
    });
  }

  /* ── markup ── */
  function helloHtml() {
    var name = '', car = null, gal = [];
    try { name = (localStorage.getItem('cc_name') || '').trim(); } catch (e) {}
    try { car = typeof window.careerSummary === 'function' ? window.careerSummary() : null; } catch (e) {}
    try { gal = typeof window.galleryGet === 'function' ? window.galleryGet() : []; } catch (e) {}
    if (!name) return '';
    var me = name.toLowerCase(), mine = 0;
    gal.forEach(function (g) { if (g && g.author && String(g.author).trim().toLowerCase() === me) mine++; });
    // the rating, once this phone has played a game: "1,412 · Candidate"
    var rt = '';
    if (car && car.games > 0 && car.rating) rt = '<span class="home-rt">' + Number(car.rating).toLocaleString('en-US') + (car.title ? ' · ' + esc(car.title) : car.provisional ? ' · new' : '') + '</span>';
    return '<span class="home-wb">Welcome back, <b>' + esc(name) + '</b></span>' + rt + (mine ? '<span class="home-fr">' + mine + ' framed</span>' : '');
  }

  function render() {
    var mount = document.getElementById('home-mount');
    if (!mount) return false;
    var gal = [];
    try { gal = typeof window.galleryGet === 'function' ? window.galleryGet() : []; } catch (e) {}
    gal = gal.filter(function (g) { return g && g.caption; }).slice().reverse();   // newest first
    mount.innerHTML =
      '<div class="home-mast" role="heading" aria-level="1"><span class="home-w1">CLOSED</span><span>CAPTION</span></div>' +
      (helloHtml() ? '<div class="home-hello">' + helloHtml() + '</div>' : '') +
      // the pitch, on screen: a dry hook (#22), then what the game is
      '<div class="home-pitch"><p class="home-p1">One caption is real. Everyone else is lying.</p><p class="home-p2">Ranked like chess, but judged by friends.</p></div>' +
      '<p class="home-line">A bluffing game, not a joke contest. Everyone gets the same cartoon: write a fake caption that passes for the real one, then bet on which one is.</p>' +
      '<div class="home-stage" aria-hidden="true">' +
        '<div class="home-card"><div class="home-inner">' +
          '<div class="home-face home-back"><span class="home-cc">CC</span><span class="home-lbl">Closed Caption</span></div>' +
          '<div class="home-face home-front"><img alt="" draggable="false"></div>' +
        '</div></div>' +
        '<div class="home-stamp"><span>REAL?</span></div>' +
      '</div>' +
      '<div class="home-capbox" aria-hidden="true"><p class="home-cap"><span class="home-txt"></span><span class="home-caret home-hide"></span></p><svg class="home-ink"></svg>' + PEN +
        '<div class="home-slip"><div class="home-slip-in"><div class="home-slip-f home-slip-back">CLOSED CAPTION</div><div class="home-slip-f home-slip-front"><span class="home-slip-t"></span><span class="home-slip-by"></span></div></div><div class="home-chips"></div></div>' +
      '</div>' +
      (gal.length ? '<div class="home-wall"></div>' : '');
    els = {
      card: mount.querySelector('.home-card'), img: mount.querySelector('.home-front img'), stamp: mount.querySelector('.home-stamp'),
      box: mount.querySelector('.home-capbox'), cap: mount.querySelector('.home-cap'), txt: mount.querySelector('.home-txt'), caret: mount.querySelector('.home-caret'),
      ink: mount.querySelector('.home-ink'), pen: mount.querySelector('.home-pen'), wall: mount.querySelector('.home-wall'), gal: gal,
      slip: mount.querySelector('.home-slip'), slipT: mount.querySelector('.home-slip-t'), slipBy: mount.querySelector('.home-slip-by'), chips: mount.querySelector('.home-chips'), stampTxt: mount.querySelector('.home-stamp span')
    };
    return true;
  }

  /* ── the Gallery plaque ── */
  function plaqueHtml(g) {
    var who = g.isReal || !g.author ? 'The original' : String(g.author);
    var mo = '';
    try { mo = String(g.month || ''); var x = mo.match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})$/); if (x) mo = x[1] + ' ' + x[2]; } catch (e) {}
    var src = imgUrl(g.image);
    return '<div class="home-gilt"><i>' + (src ? '<img src="' + esc(src) + '" alt="" draggable="false">' : '') + '</i></div>' +
      '<div class="home-gt"><div class="home-eb">Now hanging in your Gallery</div>' +
      '<div class="home-gc">' + esc(smarten(g.caption)) + '</div>' +
      '<div class="home-gw">— ' + esc(who) + (mo ? ' · ' + esc(mo) : '') + '</div></div>';
  }
  function showPlaque(first) {
    var wall = els.wall, list = els.gal;
    if (!wall || !list || !list.length) return;
    var g = list[galIdx % list.length]; galIdx++;
    var next = document.createElement('div');
    next.className = 'home-plaque' + (first ? '' : ' home-gone');
    next.innerHTML = plaqueHtml(g);
    var old = wall.querySelector('.home-plaque:not(.home-leaving)');
    wall.appendChild(next);
    if (old) { old.classList.add('home-leaving', 'home-gone'); setTimeout(function () { try { old.remove(); } catch (e) {} }, 600); }
    if (!first) requestAnimationFrame(function () { requestAnimationFrame(function () { next.classList.remove('home-gone'); }); });
  }

  /* ── the red pen ── */
  function lineRects() {
    var out = [], node = els.txt.firstChild, base = els.box.getBoundingClientRect();
    if (!node) return out;
    var r = document.createRange(); r.selectNodeContents(node);
    var rects = r.getClientRects(), rows = [];
    for (var i = 0; i < rects.length; i++) {
      var q = rects[i]; if (q.width < 2) continue;
      var row = null;
      for (var j = 0; j < rows.length; j++) if (Math.abs(rows[j].top - q.top) < 4) row = rows[j];
      if (row) { row.left = Math.min(row.left, q.left); row.right = Math.max(row.right, q.right); row.bottom = Math.max(row.bottom, q.bottom); }
      else rows.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom });
    }
    rows.forEach(function (q) { out.push({ x0: q.left - base.left, x1: q.right - base.left, top: q.top - base.top, y: q.top - base.top + (q.bottom - q.top) * 0.56 }); });
    return out;
  }
  function strikePath(l) {
    var x0 = l.x0 - rnd(3, 7), x1 = l.x1 + rnd(3, 8), y0 = l.y + rnd(-1, 2), y1 = l.y + rnd(-3, 0);
    var w = x1 - x0;
    return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) +
      ' C' + (x0 + w * 0.3).toFixed(1) + ' ' + (y0 - rnd(1, 3)).toFixed(1) + ' ' + (x0 + w * 0.62).toFixed(1) + ' ' + (y1 + rnd(1, 3)).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function penAt(x, y) { els.pen.style.transform = 'translate(' + (x - 4).toFixed(1) + 'px,' + (y - 48).toFixed(1) + 'px)'; }

  async function strike(note) {
    var rows = lineRects(), ns = 'http://www.w3.org/2000/svg';
    if (!rows.length) return;
    els.pen.classList.add('home-on');
    for (var i = 0; i < rows.length; i++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', strikePath(rows[i]));
      els.ink.appendChild(p);
      var len = 0; try { len = p.getTotalLength(); } catch (e) { len = rows[i].x1 - rows[i].x0 + 16; }
      p.style.strokeDasharray = len + ' ' + len; p.style.strokeDashoffset = len;
      var dur = Math.max(260, Math.min(520, len * 1.7));
      await frames(dur, function (t) {
        var e = ease(t);
        p.style.strokeDashoffset = (len * (1 - e)).toFixed(1);
        try { var pt = p.getPointAtLength(len * e); penAt(pt.x, pt.y); } catch (er) {}
      });
      if (i === 0) els.cap.classList.add('home-struck');
      if (i < rows.length - 1) await wait(70);
    }
    // the margin note, top-right of the last struck line
    var last = rows[rows.length - 1], n = document.createElement('div');
    n.className = 'home-note'; n.textContent = note;
    els.box.appendChild(n);
    var bw = els.box.clientWidth, nw = n.offsetWidth;
    var nx = Math.min(bw - nw - 2, Math.max(2, last.x1 - nw * 0.35)), ny = Math.max(-6, rows[0].top - 21);
    n.style.left = nx + 'px'; n.style.top = ny + 'px';
    await frames(180, function (t) { penAt(last.x1 + 8 + (nx + nw * 0.5 - last.x1 - 8) * ease(t), last.y + (ny + 16 - last.y) * ease(t)); });
    n.classList.add('home-on');
    await frames(260, function (t) { penAt(nx + nw * (0.5 + 0.5 * t), ny + 16 + Math.sin(t * 9) * 3); });
    els.pen.classList.remove('home-on');
  }

  function clearInk() {
    try { els.ink.innerHTML = ''; } catch (e) {}
    try { els.box.querySelectorAll('.home-note').forEach(function (n) { n.remove(); }); } catch (e) {}
  }

  async function type(text) {
    els.cap.classList.remove('home-gone', 'home-struck');
    els.txt.textContent = '';
    els.caret.classList.remove('home-hide');
    for (var i = 1; i <= text.length; i++) {
      els.txt.textContent = text.slice(0, i);
      var ch = text.charAt(i - 1);
      await wait(/[.,?!:]/.test(ch) ? 150 : ch === ' ' ? 46 : rnd(26, 44));
    }
    await wait(250);
    els.caret.classList.add('home-hide');
  }

  function plink(i) { if (!soundOk()) return; try { window.noise(0.03, 0, 0.3, 3000, 'bandpass'); window.tone(1500 + i * 120, 0.05, 0, 'sine', 0.05, 500); window.tone(180, 0.08, 10, 'sine', 0.1); } catch (e) {} }
  // a red-pen margin note above the slip
  function note(text) {
    var n = document.createElement('div'); n.className = 'home-note'; n.textContent = text;
    els.box.appendChild(n);
    var bw = els.box.clientWidth, nw = n.offsetWidth;
    n.style.left = Math.max(2, Math.min(bw - nw - 2, bw / 2 - nw / 2 + 50)) + 'px'; n.style.top = '-16px';
    n.classList.add('home-on');
  }

  /* the TABLE beat: chips land on the face-down caption → it flips → the stamp */
  async function table(s) {
    els.stamp.className = 'home-stamp' + (s.table === 'framed' ? ' home-gold' : '');
    els.stampTxt.textContent = s.table === 'framed' ? 'FRAMED' : 'STOLEN';
    els.img.src = imgUrl(s.img);
    try { if (els.img.decode) await Promise.race([els.img.decode().catch(function () {}), wait(900)]); } catch (e) {}
    els.cap.classList.add('home-gone'); els.txt.textContent = '';
    els.slipT.textContent = s.fake; els.slipBy.textContent = '— ' + s.by + ' wrote it';
    els.chips.innerHTML = ''; els.slip.className = 'home-slip';
    await wait(450);
    flick();
    els.card.classList.remove('home-down'); els.card.classList.add('home-up');
    await wait(700);
    els.slip.classList.add('home-on');
    await wait(650);
    for (var i = 0; i < s.chips.length; i++) {
      var c = document.createElement('i'); c.className = 'home-chip'; c.style.setProperty('--c', s.chips[i]);
      els.chips.appendChild(c); later(300, (function (k) { return function () { plink(k); }; })(i));
      await wait(380);
    }
    await wait(500);
    flick();
    els.slip.classList.add('home-flip');
    await wait(1100);
    if (s.table === 'stolen') {
      var last = els.chips.lastElementChild;
      if (last) last.classList.add('home-yank');
      await wait(520);
    }
    thunk();
    els.stamp.classList.add('home-on');
    els.card.classList.remove('home-thunk'); void els.card.offsetWidth; els.card.classList.add('home-thunk');
    await wait(260);
    note(s.note);
    await wait(2600);
    els.stamp.classList.remove('home-on'); els.stamp.classList.add('home-off');
    els.slip.classList.remove('home-on');
    clearInk();
    await wait(300);
    flick();
    els.card.classList.remove('home-up'); els.card.classList.add('home-down');
    await wait(760);
    els.slip.className = 'home-slip'; els.chips.innerHTML = '';
  }

  async function sequence(s) {
    if (s.table) return table(s);
    els.stamp.className = 'home-stamp';
    els.stampTxt.textContent = 'REAL?';
    els.img.src = imgUrl(s.img);
    try { if (els.img.decode) await Promise.race([els.img.decode().catch(function () {}), wait(900)]); } catch (e) {}
    await wait(650);
    flick();
    els.card.classList.remove('home-down'); els.card.classList.add('home-up');
    await wait(820);
    for (var i = 0; i < s.lines.length; i++) {
      await type(s.lines[i]);
      if (i < s.lines.length - 1) {
        await wait(i === 0 ? 650 : 800);
        await strike(s.notes[i] || '');
        await wait(620);
        els.cap.classList.add('home-gone');
        await wait(300);
        clearInk();
      }
    }
    await wait(520);
    thunk();
    els.stamp.classList.add('home-on');
    els.card.classList.remove('home-thunk'); void els.card.offsetWidth; els.card.classList.add('home-thunk');
    await wait(2600);
    els.stamp.classList.remove('home-on'); els.stamp.classList.add('home-off');
    els.cap.classList.add('home-gone');
    await wait(300);
    flick();
    els.card.classList.remove('home-up'); els.card.classList.add('home-down');
    await wait(760);
    els.txt.textContent = '';
  }

  async function loop() {
    var my = token;
    while (my === token) {
      var s = SEQ[seqIdx % SEQ.length]; seqIdx++;
      // warm the next image while this one plays
      try { var pre = new Image(); pre.src = imgUrl(SEQ[seqIdx % SEQ.length].img); } catch (e) {}
      await sequence(s);
    }
  }

  function staticScene() {
    var s = SEQ[0];   // a pen beat (it has lines)
    els.img.src = imgUrl(s.img);
    els.card.classList.add('home-up');
    els.card.querySelector('.home-inner').style.transition = 'none';
    els.txt.textContent = s.lines[s.lines.length - 1];
    els.caret.classList.add('home-hide');
    els.stamp.className = 'home-stamp home-static';
  }

  function start() {
    try {
      stop();
      if (!render()) return;
      started = true;
      galIdx = 0;
      if (els.wall) {
        showPlaque(true);
        if (els.gal.length > 1 && !reduced()) galTimer = setInterval(function () { try { showPlaque(false); } catch (e) {} }, 5200);
      }
      if (reduced()) { staticScene(); return; }
      var my = token;
      loop().catch(function () {});
      void my;
    } catch (e) {}
  }

  function stop() {
    token++;
    started = false;
    timers.forEach(function (t) { clearTimeout(t); }); timers = [];
    rafs.forEach(function (r) { cancelAnimationFrame(r); }); rafs = [];
    clearInterval(galTimer); galTimer = null;
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
