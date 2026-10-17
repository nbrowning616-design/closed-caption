/* Closed Caption — the steal, as an arcade claw.
   The dealer's steal plays on every phone at once, timed from the shared beat (ccSync(state.steal.at)).
   Full show (the first steal of a game, ~6.4s): the claw glides over the felt, dips on a decoy or two,
   thinks better of it, lines up, drops, CLUNK, and hauls the chip off the top of the screen.
   Quick show (every later steal, ~2.1s): straight down, CLUNK, gone.
   Everything is driven by the Web Animations API from one clock, so a frame at time t is the same
   frame on every phone. Big sounds play on the speaker phone only (big()). CSS prefix: st-.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, big, buzz, tone, noise, sfx. */
(function () {
  'use strict';

  var INK = '#1F1A17';
  var ANCHOR_X = 60, ANCHOR_Y = 104;   // the point the claw holds a chip by, in the claw's own SVG units

  /* ── The claw: two layers so a held chip sits between the back prong and the front ones ── */
  var DEFS = '<defs>' +
    '<linearGradient id="st-chrome" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="#262c33"/><stop offset=".1" stop-color="#5c6773"/><stop offset=".27" stop-color="#dfe6ec"/>' +
      '<stop offset=".34" stop-color="#ffffff"/><stop offset=".46" stop-color="#b3bdc7"/><stop offset=".7" stop-color="#6c7784"/>' +
      '<stop offset=".88" stop-color="#3a434c"/><stop offset="1" stop-color="#1f252b"/></linearGradient>' +
    '<linearGradient id="st-chromeV" x1="0" x2="0" y1="0" y2="1">' +
      '<stop offset="0" stop-color="#f6f9fb"/><stop offset=".45" stop-color="#a9b4be"/><stop offset="1" stop-color="#46505a"/></linearGradient>' +
    '<linearGradient id="st-ring" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="#1d2228"/><stop offset=".3" stop-color="#7d8894"/><stop offset=".42" stop-color="#cfd7de"/>' +
      '<stop offset=".7" stop-color="#4f5a65"/><stop offset="1" stop-color="#1d2228"/></linearGradient>' +
    '<linearGradient id="st-arm" x1="0" x2="1" y1="0" y2=".25">' +
      '<stop offset="0" stop-color="#4c5661"/><stop offset=".45" stop-color="#eef2f5"/><stop offset="1" stop-color="#7a8591"/></linearGradient>' +
    '<linearGradient id="st-armB" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="#2a3138"/><stop offset=".5" stop-color="#8d98a3"/><stop offset="1" stop-color="#3a434c"/></linearGradient>' +
    '<radialGradient id="st-ledA" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".35" stop-color="#ffd23f"/><stop offset="1" stop-color="#b86f00"/></radialGradient>' +
    '<radialGradient id="st-ledR" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe9e6"/><stop offset=".35" stop-color="#ff4a3d"/><stop offset="1" stop-color="#8f120b"/></radialGradient>' +
    '<radialGradient id="st-glow"><stop offset="0" stop-color="#ffd23f" stop-opacity=".75"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="st-glowR"><stop offset="0" stop-color="#ff4a3d" stop-opacity=".85"/><stop offset="1" stop-color="#ff4a3d" stop-opacity="0"/></radialGradient>' +
    '</defs>';

  // One prong, drawn from its pivot (0,0): upper arm, knuckle, curled finger with a hook.
  // A thick ink stroke under a thinner steel stroke gives a clean, even 2.5px outline.
  var PRONG =
    '<path d="M0 0 L-15 26 Q-18 46 -5 58 L1 55" fill="none" stroke="' + INK + '" stroke-width="10.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M0 0 L-15 26 Q-18 46 -5 58 L1 55" fill="none" stroke="url(#st-arm)" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M-2.6 6 L-12.4 23.6" stroke="#fff" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/>' +
    '<path d="M-14.6 33 Q-15 45 -7.5 53" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"/>' +
    '<circle cx="-15" cy="26" r="5.4" fill="url(#st-chromeV)" stroke="' + INK + '" stroke-width="2.5"/><circle cx="-15" cy="26" r="1.5" fill="' + INK + '"/>';

  var BACK_SVG = '<svg class="st-claw st-back" viewBox="0 0 120 140" width="120" height="140" aria-hidden="true">' +
    '<g transform="translate(60 63)"><g class="st-pc">' +
      '<path d="M0 0 L0 24 Q1 40 -1 47" fill="none" stroke="' + INK + '" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M0 0 L0 24 Q1 40 -1 47" fill="none" stroke="url(#st-armB)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="0" cy="24" r="4.6" fill="#7d8894" stroke="' + INK + '" stroke-width="2.5"/>' +
    '</g></g></svg>';

  var FRONT_SVG = '<svg class="st-claw st-front" viewBox="0 0 120 140" width="120" height="140" aria-hidden="true">' + DEFS +
    // cable clamp + motor cap
    '<rect x="53" y="-2" width="14" height="13" rx="3" fill="url(#st-chrome)" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<path d="M39 25 V19 Q39 10 48 10 H72 Q81 10 81 19 V25 Z" fill="url(#st-chrome)" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M44 16 H76" stroke="' + INK + '" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/>' +
    // side prongs (behind the hub)
    '<g transform="translate(44 63)"><g class="st-pl">' + PRONG + '</g></g>' +
    '<g transform="translate(76 63) scale(-1 1)"><g class="st-pr">' + PRONG + '</g></g>' +
    // hub
    '<path d="M23 35 Q23 24 34 24 H86 Q97 24 97 35 V46 Q97 59 83 61 H37 Q23 59 23 46 Z" fill="url(#st-chrome)" stroke="' + INK + '" stroke-width="2.75" stroke-linejoin="round"/>' +
    '<path d="M25 47 H95" stroke="' + INK + '" stroke-opacity=".28" stroke-width="1.4"/>' +
    '<rect x="30" y="28" width="4.5" height="17" rx="2.25" fill="#fff" opacity=".75"/>' +
    '<path d="M73 31 H86 M73 35.5 H86 M73 40 H86" stroke="' + INK + '" stroke-opacity=".55" stroke-width="1.8" stroke-linecap="round"/>' +
    '<circle cx="31" cy="53" r="1.9" fill="#e9eef2" stroke="' + INK + '" stroke-width="1.4"/><circle cx="89" cy="53" r="1.9" fill="#e9eef2" stroke="' + INK + '" stroke-width="1.4"/>' +
    // the little light: amber while it hunts, red once it has you
    '<circle class="st-halo" cx="60" cy="36" r="14" fill="url(#st-glow)"/>' +
    '<circle class="st-haloR" cx="60" cy="36" r="16" fill="url(#st-glowR)"/>' +
    '<circle cx="60" cy="36" r="7.2" fill="' + INK + '"/>' +
    '<circle class="st-ledA" cx="60" cy="36" r="4.6" fill="url(#st-ledA)"/>' +
    '<circle class="st-ledR" cx="60" cy="36" r="4.6" fill="url(#st-ledR)"/>' +
    '<circle cx="58.4" cy="34.4" r="1.3" fill="#fff" opacity=".9"/>' +
    // pivot collar + pins
    '<rect x="35" y="57" width="50" height="11" rx="4.5" fill="url(#st-ring)" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<circle cx="44" cy="63" r="2.6" fill="#dfe5ea" stroke="' + INK + '" stroke-width="1.6"/><circle cx="76" cy="63" r="2.6" fill="#dfe5ea" stroke="' + INK + '" stroke-width="1.6"/>' +
    '</svg>';

  var CSS = [
    '@keyframes stFade{from{opacity:0}to{opacity:1}}',
    '.st-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(18px + var(--sat,0px)) 18px 22px;overflow:hidden;}',
    '.st-stage::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 85% 55% at 50% 58%,rgba(232,69,58,.16),transparent 70%),radial-gradient(rgba(255,248,234,.035) 1.2px,transparent 1.3px) 0 0/18px 18px;pointer-events:none;}',
    '.st-head{position:relative;z-index:2;text-align:center;margin-bottom:108px;transition:opacity .35s;}',
    '.st-eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--display);font-weight:700;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#FFD23F;margin-bottom:6px;}',
    '.st-eyebrow::before,.st-eyebrow::after{content:"";width:26px;height:1.5px;background:linear-gradient(90deg,transparent,#FFD23F);}',
    '.st-eyebrow::after{transform:scaleX(-1);}',
    '.st-title{color:#FFF8EA;}',
    '.st-rail{position:relative;z-index:1;width:100%;max-width:372px;padding:7px;border-radius:30px;border:3px solid ' + INK + ';background:linear-gradient(160deg,#8a5a34,#5e3a1f 45%,#7a4c2a 70%,#4c2e18);box-shadow:0 22px 50px rgba(0,0,0,.6),inset 0 1.5px 0 rgba(255,220,180,.35);}',
    '.st-felt{border-radius:22px;border:2.5px solid ' + INK + ';padding:4px 12px;background:radial-gradient(ellipse 90% 70% at 50% 40%,#2f7d5c,#1d5440 62%,#143b2d),' + INK + ';box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.07),inset 0 10px 30px rgba(0,0,0,.45);}',
    '.st-row{display:flex;align-items:center;gap:12px;min-height:66px;padding:8px 2px;}',
    '.st-row+.st-row{border-top:1.5px dashed rgba(255,248,234,.16);}',
    '.st-lbl{width:30px;height:30px;border-radius:50%;background:#FFF8EA;color:' + INK + ';border:2.5px solid ' + INK + ';font-family:var(--display);font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 0 rgba(0,0,0,.45);}',
    '.st-lbl .cc-badge{margin:0;font-size:10px;padding:1px 3px;}',
    '.st-chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}',
    '.st-chips .chip{box-shadow:0 3px 0 rgba(0,0,0,.55),0 6px 10px rgba(0,0,0,.35),inset 0 0 0 1.5px rgba(255,255,255,.35);}',
    '.st-none{font-size:13px;font-weight:800;color:rgba(255,248,234,.38);letter-spacing:.02em;}',
    '.st-doomed{box-shadow:0 0 0 4px #E8453A,0 0 18px 4px rgba(232,69,58,.6),0 3px 0 rgba(0,0,0,.55)!important;}',
    '.st-dim{position:absolute;left:-1100px;top:-1100px;width:2200px;height:2200px;z-index:3;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(8,5,4,0) 0,rgba(8,5,4,0) 70px,rgba(8,5,4,.5) 175px,rgba(8,5,4,.6) 100%);will-change:transform;}',
    '.st-beam{position:absolute;left:-120px;top:0;width:240px;height:78%;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(255,236,200,.13),rgba(255,236,200,.05) 55%,rgba(255,236,200,0));clip-path:polygon(41% 0,59% 0,100% 100%,0 100%);will-change:transform;}',
    '.st-shadow{position:absolute;left:-52px;top:-15px;width:104px;height:30px;z-index:4;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,.8),rgba(0,0,0,.35) 45%,rgba(0,0,0,0) 72%);opacity:0;will-change:transform,opacity;}',
    '.st-rig{position:absolute;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none;will-change:transform;}',
    '.st-swing{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 -640px;}',
    '.st-cable{position:absolute;left:-4px;bottom:' + (ANCHOR_Y - 1) + 'px;width:8px;height:1800px;border-left:2.5px solid ' + INK + ';border-right:2.5px solid ' + INK + ';background:repeating-linear-gradient(-58deg,rgba(31,26,23,.28) 0 1.6px,transparent 1.6px 4.4px),linear-gradient(90deg,#59636e,#eef2f5 45%,#8a95a0);}',
    '.st-claw{position:absolute;left:' + (-ANCHOR_X) + 'px;top:' + (-ANCHOR_Y) + 'px;overflow:visible;}',
    '.st-front{filter:drop-shadow(0 10px 10px rgba(0,0,0,.45));}',
    '.st-claw g.st-pl,.st-claw g.st-pr,.st-claw g.st-pc{transform-box:view-box;transform-origin:0 0;}',
    '.st-held{position:absolute;left:-23px;top:-23px;opacity:0;}',
    '.st-held .chip{margin:0;box-shadow:0 3px 0 rgba(0,0,0,.55);}',
    '.st-ledR,.st-haloR{opacity:0;}',
    '.st-ledA{animation:stBlink .42s steps(1) infinite;}',
    '.st-halo{animation:stBlink .42s steps(1) infinite;}',
    '@keyframes stBlink{0%{opacity:1}50%{opacity:.25}}',
    '.st-locked .st-ledR,.st-locked .st-haloR{opacity:1;}',
    '.st-locked .st-ledA,.st-locked .st-halo{opacity:0;animation:none;}',
    '.st-veil{position:absolute;inset:0;z-index:6;background:rgba(10,7,6,.55);opacity:0;pointer-events:none;}',
    '.st-gloat{position:absolute;left:22px;right:22px;top:50%;z-index:7;opacity:0;text-align:center;color:#fff;background:linear-gradient(180deg,#EE5247,#C9362C);border:3px solid ' + INK + ';border-radius:20px;padding:30px 20px 26px;box-shadow:7px 7px 0 ' + INK + ',0 24px 60px rgba(0,0,0,.55);transform:translateY(-50%);}',
    '.st-gloat::after{content:"";position:absolute;inset:7px;border-radius:14px;border:1.5px solid rgba(255,226,140,.6);pointer-events:none;}',
    '.st-bulbs{position:absolute;left:18px;right:18px;height:10px;background:radial-gradient(circle,#FFFBE0 0 1.8px,#FFD23F 2.4px,rgba(255,210,63,.3) 3.4px,transparent 4.6px) 0 50%/14px 10px repeat-x;animation:stChase .5s steps(1) infinite;}',
    '.st-bulbs.t{top:-5px;}.st-bulbs.b{bottom:-5px;animation-direction:reverse;}',
    '@keyframes stChase{0%{background-position:0 50%}50%{background-position:7px 50%}}',
    '.st-g-eye{font-family:var(--display);font-weight:700;font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#FFE38A;}',
    '.st-g-head{font-family:var(--display);font-weight:700;font-size:21px;line-height:1.15;margin-top:6px;}',
    '.st-quote{font-family:var(--display);font-weight:700;font-size:29px;line-height:1.12;margin:14px 0 8px;text-shadow:0 2px 0 rgba(31,26,23,.35);}',
    '.st-by{font-size:13px;font-weight:800;color:#FFD9D4;}',
    '.st-quake{animation:stQuake .5s cubic-bezier(.36,.07,.19,.97);}',
    '@keyframes stQuake{0%,100%{transform:none}10%{transform:translate(-14px,7px) rotate(-1deg)}25%{transform:translate(12px,-9px) rotate(1deg)}40%{transform:translate(-9px,6px)}55%{transform:translate(7px,-4px)}72%{transform:translate(-4px,2px)}86%{transform:translate(2px,-1px)}}',
    '@media (prefers-reduced-motion: reduce){.st-ledA,.st-halo,.st-bulbs{animation:none;}}'
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-steal-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduced = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /* Sounds — every call sits inside big(), so only the speaker phone plays them */
  function hum(ms) {   // the cabinet's low, ominous motor hum under everything
    try {
      var ctx = actx(), t0 = ctx.currentTime, end = t0 + ms / 1000;
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.5); g.gain.setValueAtTime(0.05, end - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, end);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 3;
      var lfo = ctx.createOscillator(), dep = ctx.createGain(); lfo.frequency.value = 0.9; dep.gain.value = 140; lfo.connect(dep); dep.connect(lp.frequency);
      lp.connect(g); g.connect(ctx.destination);
      [55, 55.6, 82.4].forEach(function (f, i) { var o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t0); o.stop(end + 0.05); });
      lfo.start(t0); lfo.stop(end + 0.05);
    } catch (e) {}
  }
  function arcadeTune(ms) {   // a sly minor-key claw-machine arpeggio
    var seq = [293.7, 220, 349.2, 220, 329.6, 220, 277.2, 220];
    for (var t = 0, i = 0; t < ms; t += 165, i++) tone(seq[i % 8], 0.12, t, 'square', i % 2 ? 0.014 : 0.024);
  }
  var SND = {
    whir: function (ms, up) { tone(up ? 150 : 210, ms / 1000, 0, 'sawtooth', 0.03, up ? 230 : 140); noise(ms / 1000, 0, 0.05, 700, 'lowpass'); },
    lower: function (ms) { tone(320, ms / 1000, 0, 'sawtooth', 0.025, 150); },
    rise: function (ms) { tone(150, ms / 1000, 0, 'sawtooth', 0.025, 320); },
    servo: function () { noise(0.04, 0, 0.12, 4200, 'highpass'); tone(880, 0.05, 0, 'square', 0.02, 640); },
    nope: function () { tone(196, 0.09, 0, 'triangle', 0.08); tone(165, 0.13, 110, 'triangle', 0.08); },
    clunk: function () { noise(0.18, 0, 0.6, 480, 'lowpass'); tone(96, 0.3, 0, 'sine', 0.36, 52); tone(1240, 0.07, 0, 'square', 0.045, 620); tone(2650, 0.06, 6, 'triangle', 0.05); noise(0.05, 0, 0.3, 4800, 'highpass'); },
    yank: function () { tone(170, 0.55, 0, 'sawtooth', 0.05, 560); noise(0.45, 60, 0.22, 1600); },
    drop: function () { noise(0.3, 0, 0.18, 1400); tone(720, 0.3, 0, 'sine', 0.06, 240); },
    gloat: function () { sfx.evil(); tone(1568, 0.22, 420, 'sine', 0.05); tone(1568, 0.3, 640, 'sine', 0.05); }
  };

  /* ── The show ── */
  function play(wait, opt) {
    opt = opt || {};
    var st = state.steal, o = document.getElementById('stealshow');
    var quick = (st.show || 1) > 1, L = quick ? (opt.quickMs || 2100) : (opt.fullMs || 6400);
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var startAt = performance.now() + Math.max(0, wait);   // the shared beat, on this phone's clock
    var T = function (fn, ms) { window._ssT.push(setTimeout(fn, Math.max(0, startAt + ms - performance.now()))); };
    var close = function () { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick'); o.innerHTML = ''; };
    o.innerHTML = ''; o.classList.remove('out'); o.classList.toggle('quick', quick); o.classList.add('on');   // dim now: no spoilers before the beat
    o.onclick = function () { close(); if (window._answerGo) window._answerGo(); };
    // Build and wind up everything now, hidden; the beat only has to show it (no heavy work on the beat)
    build(o, st, quick);
    choreograph(o, st, quick, L, startAt, T);
    T(function () { o.classList.add('out'); }, L - (quick ? 300 : 450));
    T(close, L);
    return Math.max(0, wait) + L;
  }

  function build(o, st, quick) {
    var bets = state.bets || [], targets = (state.openCaptions || []).map(function (_, i) { return i; }).concat(['closed']);
    var rows = targets.map(function (t) {
      var chips = [];
      bets.forEach(function (b, bi) {
        if (b.target === 'pass' || String(b.target) !== String(t)) return;
        var n = b.count + (b.stolen || 0);
        for (var k = 0; k < n; k++) chips.push(chipHtml(b.playerId, 'lg', '', 'data-st="' + (bi === st.betIndex && k === n - 1 ? 'victim' : 'other') + '"'));
      });
      return '<div class="st-row"><span class="st-lbl">' + (t === 'closed' ? '<span class="cc-badge">CC</span>' : t + 1) + '</span><div class="st-chips">' + (chips.join('') || '<span class="st-none">no chips</span>') + '</div></div>';
    }).join('');
    var me = state.isDealer, dealer = me ? 'You' : esc(state.dealerName), isVictim = st.victimId === myPlayerId;
    var title = quick ? dealer + (me ? ' strike' : ' strikes') + ' again' : (me ? 'You’re' : dealer + ' is') + ' at the controls<span class="dots"></span>';
    var head = isVictim ? 'That was YOUR chip.' : dealer + ' stole ' + esc(nameOf(st.victimId)) + '’s chip';
    o.innerHTML = '<div class="st-stage" id="st-stage" style="visibility:hidden">' +
      '<div class="st-head" id="st-head"><p class="st-eyebrow">The Claw</p><p class="h2 st-title">' + title + '</p></div>' +
      '<div class="st-rail"><div class="st-felt">' + rows + '</div></div>' +
      '<div class="st-dim" id="st-dim"></div><div class="st-beam" id="st-beam"></div><div class="st-shadow" id="st-shadow"></div>' +
      '<div class="st-rig" id="st-rig"><div class="st-swing" id="st-swing"><div class="st-cable"></div>' + BACK_SVG + '<div class="st-held" id="st-held"></div>' + FRONT_SVG + '</div></div>' +
      '<div class="st-veil" id="st-veil"></div>' +
      '<div class="st-gloat" id="st-gloat"><i class="st-bulbs t"></i><i class="st-bulbs b"></i>' +
        '<p class="st-g-eye">Stolen</p><p class="st-g-head">' + head + '</p>' +
        '<p class="st-quote">“' + esc(st.gloat || 'Mine now.') + '”</p><p class="st-by">— ' + (me ? 'you' : esc(state.dealerName)) + '</p>' +
        '</div>' +
      '</div>';
  }

  function choreograph(o, st, quick, L, startAt, T) {
    var $q = function (s) { return o.querySelector(s); };
    var stage = $q('#st-stage'), rig = $q('#st-rig'), swing = $q('#st-swing'), held = $q('#st-held'), shadow = $q('#st-shadow'), dim = $q('#st-dim'), beam = $q('#st-beam');
    var gl = $q('#st-gloat'), veil = $q('#st-veil'), head = $q('#st-head');
    var pl = $q('.st-pl'), pr = $q('.st-pr'), pc = $q('.st-pc'), front = $q('.st-front');
    var victim = $q('[data-st="victim"]'), isVictim = st.victimId === myPlayerId;
    var W = o.clientWidth || innerWidth;
    var lag = Math.max(0, performance.now() - startAt);
    var beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
    var c = function (el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el }; };
    if (victim) held.innerHTML = victim.outerHTML.replace('data-st="victim"', '');
    var V = victim ? c(victim) : { x: W / 2, y: o.clientHeight / 2 };
    var rows = [].slice.call(o.querySelectorAll('.st-row')), top = rows.length ? c(rows[0]) : V;
    var HOVER = 74;
    var anim = function (el, kf, ms, at, easing, extra) {
      var opts = { duration: ms, delay: at, easing: easing || 'linear', fill: 'both' };
      for (var k in extra || {}) opts[k] = extra[k];
      try {
        var a = el.animate(kf, opts);
        // pin it to the shared beat itself (not "the next frame"), so every phone draws the same frame
        try { if (document.timeline && document.timeline.currentTime != null) a.startTime = startAt; } catch (e) { a.currentTime = lag; }
        return a;
      } catch (e) { return null; }
    };
    var kfs = function (pts, frame) {   // [{t, e, ...}] -> keyframes across the whole show
      var out = pts.map(function (p) { var f = frame(p); f.offset = clamp(p.t / L, 0, 1); f.easing = p.e || 'linear'; return f; });
      if (out[0].offset > 0) out.unshift(Object.assign({}, out[0], { offset: 0 }));
      if (out[out.length - 1].offset < 1) out.push(Object.assign({}, out[out.length - 1], { offset: 1, easing: 'linear' }));
      return out;
    };
    var whole = function (el, pts, frame) { return anim(el, kfs(pts, frame), L, 0); };

    /* Sound + buzz on the beat */
    var S = function (ms, fn) { T(function () { big(fn); }, ms); };

    /* The reduced-motion show: the table, the chip simply goes, the gloat card fades in */
    if (reduced()) {
      [rig, shadow, dim, beam].forEach(function (el) { el.style.display = 'none'; });
      T(function () { stage.style.visibility = ''; beat(quick ? 'steal:quick' : 'steal:full'); }, 0);
      var snR = quick ? 400 : 3450, glR = quick ? 800 : 4550;
      if (!quick) T(function () { beat('steal:hover'); }, 650);
      T(function () {
        beat('steal:snatch');
        if (victim) victim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
        if (window.ccFlash) window.ccFlash(0.5);
        big(SND.clunk); buzz(isVictim ? [120, 40, 200] : 40);
      }, snR);
      T(function () {
        beat('steal:gloat'); head.style.opacity = '0';
        veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
        gl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
        big(SND.gloat); if (isVictim) buzz([300, 100, 300]);
      }, glR);
      return;
    }

    /* ── The path: rig points {t, x, y, sy (the felt under it), e (easing to the next point)} ── */
    var P = [], prong = [], sway = [], snatchAt, gloatAt, yankAt;
    var at = function (t, x, y, sy, e) { P.push({ t: t, x: x, y: y, sy: sy, e: e }); };
    var glideSway = function (t0, t1, dx, tight) {
      var s = clamp(dx / 140, -1, 1) * 1.7;
      sway.push({ t: t0, a: 0, e: 'ease-in-out' }, { t: t0 + (t1 - t0) * 0.42, a: s, e: 'ease-in-out' }, { t: t1, a: -0.55 * s, e: 'ease-in-out' });
      if (tight) sway.push({ t: t1 + 140, a: 0.18 * s, e: 'ease-in-out' }, { t: t1 + 250, a: 0, e: 'linear' });
      else sway.push({ t: t1 + 210, a: 0.26 * s, e: 'ease-in-out' }, { t: t1 + 400, a: 0, e: 'linear' });
    };
    var GLIDE = 'cubic-bezier(.45,0,.2,1)', DROP = 'cubic-bezier(.6,0,.9,.5)';

    if (quick) {
      at(0, V.x, -190, V.y, 'linear');
      at(70, V.x, -190, V.y, DROP);
      at(340, V.x, V.y, V.y, 'ease-out');
      at(400, V.x, V.y, V.y, 'cubic-bezier(.3,0,.5,1)');
      at(450, V.x, V.y + 3, V.y, 'ease-out');
      at(530, V.x, V.y - 6, V.y, 'ease-in-out');
      at(640, V.x, V.y + 2, V.y, 'cubic-bezier(.5,0,.7,.3)');
      at(1080, V.x, -320, V.y, 'linear');
      prong.push({ t: 0, a: 26 }, { t: 340, a: 26, e: 'cubic-bezier(.7,0,1,.6)' }, { t: 400, a: -3, e: 'ease-out' }, { t: 470, a: 0 });
      snatchAt = 400; yankAt = 640; gloatAt = 800;
      sway.push({ t: 0, a: 0 });
      T(function () { if (victim) victim.classList.add('st-doomed'); }, 0);
      S(70, SND.drop);
    } else {
      // pick the decoys: other chips first, then empty spots on the felt
      var rnd = seeded(st.seed || 7), others = [].slice.call(o.querySelectorAll('[data-st="other"]')), dec = [];
      while (others.length && dec.length < 2) dec.push(others.splice(Math.floor(rnd() * others.length), 1)[0]);
      if (dec.length < 2) { var lb = [].slice.call(o.querySelectorAll('.st-none, .st-lbl')); while (lb.length && dec.length < 2) dec.push(lb.splice(Math.floor(rnd() * lb.length), 1)[0]); }
      dec = dec.map(c);
      var x0 = W * (rnd() < 0.5 ? 0.24 : 0.76);
      at(0, x0, -190, top.y, 'cubic-bezier(.22,1.18,.36,1)');
      at(620, x0, top.y - HOVER, top.y, 'linear');
      prong.push({ t: 0, a: 7 });
      var cur = { t: 760, x: x0, y: top.y - HOVER, sy: top.y };
      var plan = dec.length >= 2 ? [{ g: 440, l: 270, h: 160, r: 220, d: 10 }, { g: 340, l: 170, h: 100, r: 170, d: 30 }]
                                 : [{ g: 600, l: 330, h: 260, r: 300, d: 10 }];
      dec.slice(0, plan.length).forEach(function (d, i) {
        var p = plan[i], t = cur.t;
        at(t, cur.x, cur.y, cur.sy, GLIDE);
        glideSway(t, t + p.g, d.x - cur.x);
        S(t, function () { SND.whir(p.g, d.x > cur.x); });
        t += p.g; at(t, d.x, d.y - HOVER, d.y, 'linear');
        t += 50; at(t, d.x, d.y - HOVER, d.y, 'cubic-bezier(.45,0,.55,1)');
        prong.push({ t: t - 40, a: 7, e: 'cubic-bezier(.3,0,.3,1.3)' }, { t: t + 150, a: 27 });
        S(t - 40, SND.servo); S(t, function () { SND.lower(p.l); });
        t += p.l; at(t, d.x, d.y - p.d, d.y, 'ease-out');
        var fakeAt = t;
        at(t + 70, d.x, d.y - p.d + 5, d.y, 'ease-in-out');   // a little bob: thinking about it…
        at(t + p.h, d.x, d.y - p.d, d.y, 'cubic-bezier(.4,0,.2,1)');
        T(function () { beat('steal:fake'); if (d.el) d.el.animate([{ transform: 'none' }, { transform: 'translateY(-5px) rotate(-14deg)' }, { transform: 'translateY(0) rotate(11deg)' }, { transform: 'translateY(-2px) rotate(-6deg)' }, { transform: 'rotate(3deg)' }, { transform: 'none' }], { duration: 440, easing: 'ease-out' }); }, fakeAt + 20);
        S(fakeAt + 20, SND.nope);
        t += p.h; prong.push({ t: t, a: 27, e: 'ease-in-out' }, { t: t + p.r, a: 8 });
        S(t, function () { SND.rise(p.r); });
        t += p.r; cur = { t: t + 40, x: d.x, y: d.y - HOVER, sy: d.y };
        at(t, cur.x, cur.y, cur.sy, 'linear');
      });
      if (plan.length === 1) {   // one fake-out: drift past the victim before committing
        var px = clamp(V.x + (V.x > W / 2 ? -90 : 90), 50, W - 50), t1 = cur.t;
        at(t1, cur.x, cur.y, cur.sy, GLIDE); glideSway(t1, t1 + 380, px - cur.x);
        at(t1 + 380, px, V.y - HOVER, V.y, 'linear');
        cur = { t: t1 + 380, x: px, y: V.y - HOVER, sy: V.y };
      }
      var tv = Math.min(Math.max(cur.t, 2740), 2780);   // line up over the victim: lands 3100, drops 3200, clamps 3450
      at(tv, cur.x, cur.y, cur.sy, 'cubic-bezier(.35,0,.25,1.12)');
      glideSway(tv, 3100, V.x - cur.x, true);
      S(tv, function () { SND.whir(320, V.x > cur.x); });
      at(3100, V.x, V.y - HOVER, V.y, 'linear');
      at(3210, V.x, V.y - HOVER, V.y, DROP);
      at(3380, V.x, V.y, V.y, 'linear');
      at(3450, V.x, V.y, V.y, 'cubic-bezier(.3,0,.5,1)');
      at(3510, V.x, V.y + 4, V.y, 'ease-out');
      at(3600, V.x, V.y, V.y, 'ease-in-out');
      at(3740, V.x, V.y - 7, V.y, 'ease-in-out');   // strain…
      at(3840, V.x, V.y + 2, V.y, 'cubic-bezier(.5,0,.7,.3)');   // …a dip, then YANK
      at(4460, V.x, -330, V.y, 'linear');
      prong.push({ t: 3080, a: 8, e: 'cubic-bezier(.3,0,.3,1.3)' }, { t: 3220, a: 30 }, { t: 3380, a: 30, e: 'cubic-bezier(.7,0,1,.6)' }, { t: 3450, a: -3, e: 'ease-out' }, { t: 3530, a: 0 });
      T(function () { if (victim) victim.classList.add('st-doomed'); if (victim) victim.animate([{ transform: 'translate(1px,0) rotate(.6deg)' }, { transform: 'translate(-1px,1px) rotate(-.6deg)' }], { duration: 90, iterations: 4, direction: 'alternate' }); }, 3100);
      S(3080, SND.servo); S(3210, SND.drop);
      snatchAt = 3450; yankAt = 3840; gloatAt = 4550;
      T(function () { beat('steal:hover'); }, 620);
      T(function () { head.style.opacity = '.55'; }, 300);
      S(0, function () { hum(4500); arcadeTune(3300); });
    }
    P.sort(function (a, b) { return a.t - b.t; });

    // sway: sorted, and a later glide cuts off the previous settle
    sway.sort(function (a, b) { return a.t - b.t; });
    var sw = []; sway.forEach(function (p) { if (sw.length && p.t <= sw[sw.length - 1].t) sw.pop(); sw.push(p); });
    if (!sw.length) sw.push({ t: 0, a: 0 });

    /* Run it: one animation per layer, all on the same clock */
    whole(rig, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0)' }; });
    whole(swing, sw, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(shadow, P, function (p) {
      var h = Math.max(0, p.sy - p.y), k = clamp(1.12 - h / 300, 0.42, 1.12);
      return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + (p.sy + 22).toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')', opacity: clamp(0.78 - h / 330, 0.06, 0.78).toFixed(3) };
    });
    whole(dim, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + (Math.max(p.y, p.sy - 140) + 30).toFixed(1) + 'px,0)' }; });
    whole(beam, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,0,0)' }; });
    prong.sort(function (a, b) { return a.t - b.t; });
    var pa = prong.map(function (p) { return { t: p.t, a: p.a, e: p.e || 'ease-in-out' }; });
    whole(pl, pa, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(pr, pa, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(pc, pa, function (p) { return { transform: 'scale(1,' + clamp(1 - p.a / 80, 0.6, 1.04).toFixed(3) + ')' }; });
    // the chip, swinging in its grip on the way out
    anim(held, [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)', offset: 0.28 }, { transform: 'rotate(8deg)', offset: 0.58 }, { transform: 'rotate(-4deg)', offset: 0.84 }, { transform: 'rotate(1deg)' }], 760, yankAt, 'ease-in-out');
    // the gloat card: veil, then a sprung entrance with a slight tilt
    anim(veil, [{ opacity: 0 }, { opacity: 1 }], 320, gloatAt - 60, 'ease-out');
    anim(gl, [{ opacity: 0, transform: 'translateY(-50%) scale(.55) rotate(4deg)' }, { opacity: 1, transform: 'translateY(-50%) scale(1.06) rotate(-2.5deg)', offset: 0.55 }, { opacity: 1, transform: 'translateY(-50%) scale(1) rotate(-2deg)' }], 520, gloatAt, 'cubic-bezier(.2,.8,.3,1)');

    /* The beats */
    T(function () { stage.style.visibility = ''; beat(quick ? 'steal:quick' : 'steal:full'); buzz(30); }, 0);
    T(function () {   // CLUNK
      if (victim) { victim.style.visibility = 'hidden'; victim.classList.remove('st-doomed'); }
      held.style.opacity = '1'; rig.classList.add('st-locked');
      beat('steal:snatch');
      if (window.ccImpact) window.ccImpact({ flash: isVictim ? 0.9 : 0.75, shake: isVictim ? false : stage });
      if (isVictim) { stage.classList.remove('st-quake'); void stage.offsetWidth; stage.classList.add('st-quake'); }
      big(SND.clunk);
      buzz(isVictim ? [140, 50, 260] : 45);
    }, snatchAt);
    S(yankAt, SND.yank);
    T(function () {
      beat('steal:gloat'); head.style.opacity = '0';
      if (window.ccPunch) window.ccPunch(gl.querySelector('.st-quote'));
      big(SND.gloat);
      if (isVictim) { document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); buzz([300, 100, 300, 100, 600]); setTimeout(function () { document.body.classList.remove('quake'); }, 1300); }
    }, gloatAt);
  }

  window.ccClaw = { play: play };
})();
