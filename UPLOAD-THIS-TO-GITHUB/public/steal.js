/* Closed Caption — the steal, as an arcade claw with a can of spray paint.
   The dealer's steal plays on every phone at once, timed from the shared beat (ccSync(state.steal.at)).
   Full show (the first steal of a game, ~7.6s): the claw glides over the felt, dips on a decoy, thinks
   better of it, lines up, drops, CLUNK, and lifts the chip into the spotlight. A spray can swoops in,
   rattles, and sprays it in the DEALER's colour (their chip now, their initials); the claw sets it back
   down in the same spot, lets go, and leaves. Quick show (every later steal, ~2.6s): down, CLUNK, up a
   little, pssst, back down, gone. Scoring never changes; this is presentation.
   Beats: steal:full|quick, steal:hover, steal:fake, steal:snatch, steal:paint, steal:set, steal:gloat.
   Everything is driven by the Web Animations API from one clock, so a frame at time t is the same
   frame on every phone. Big sounds play on the speaker phone only (big()). CSS prefix: st-.
   Also exports ccPaintedChip(dealerId, cls, fallbackPid): how a stolen chip looks after the show.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, playerById,
   playerColor, getPlayerIndex, big, buzz, tone, noise, actx, sfx. */
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

  /* ── The spray can: drawn with its nozzle tip at the wrapper's origin, spraying left (−x) ── */
  var CAN_K = 1.16, NOZ_X = 12 * CAN_K, NOZ_Y = 16.5 * CAN_K;   // drawn at 64×150, shown a touch bigger
  function splat(cx, cy, r1, r2, n) {   // a paint-splat blob for the label
    var d = '';
    for (var i = 0; i < n * 2; i++) {
      var a = Math.PI * i / n - Math.PI / 2, r = i % 2 ? r2 : r1 * (i % 4 === 0 ? 1 : 0.86);
      d += (i ? ' L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1);
    }
    return d + ' Z';
  }
  var CAN_SVG = '<svg class="st-cansvg" viewBox="0 0 64 150" width="' + (64 * CAN_K) + '" height="' + (150 * CAN_K) + '" aria-hidden="true">' +
    '<defs><linearGradient id="st-cyl" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".16" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset=".27" stop-color="#fff" stop-opacity=".55"/><stop offset=".37" stop-color="#fff" stop-opacity=".06"/>' +
      '<stop offset=".72" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>' +
    // body
    '<rect x="7" y="40" width="50" height="100" rx="4" fill="url(#st-chrome)"/>' +
    // the label, in the dealer's colour, with a couple of drips running off it
    '<path d="M14 112 V121 A3.2 3.2 0 0 0 20.4 121 V112 Z M35 112 V127 A3.2 3.2 0 0 0 41.4 127 V112 Z M47 112 V117 A2.6 2.6 0 0 0 52.2 117 V112 Z" style="fill:var(--dc)" stroke="' + INK + '" stroke-width="1.8"/>' +
    '<rect x="7" y="58" width="50" height="56" style="fill:var(--dc)"/>' +
    '<path d="' + splat(32, 85, 13, 6.5, 9) + '" fill="#FFF8EA" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="49" cy="70" r="2.4" fill="#FFF8EA" stroke="' + INK + '" stroke-width="1.2"/><circle cx="15" cy="102" r="1.8" fill="#FFF8EA" stroke="' + INK + '" stroke-width="1.1"/><circle cx="48" cy="101" r="1.4" fill="#FFF8EA"/>' +
    '<path d="M7 58 H57 M7 114 H57" stroke="' + INK + '" stroke-width="2"/>' +
    '<path d="M7 62.5 H57 M7 109.5 H57" stroke="#FFF8EA" stroke-opacity=".75" stroke-width="1.3"/>' +
    // cylinder shading + specular, then the outline
    '<rect x="7" y="40" width="50" height="100" rx="4" fill="url(#st-cyl)"/>' +
    '<rect x="13.5" y="47" width="4" height="84" rx="2" fill="#fff" opacity=".55"/>' +
    '<rect x="7" y="40" width="50" height="100" rx="4" fill="none" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<rect x="5" y="133" width="54" height="11" rx="3.5" fill="url(#st-ring)" stroke="' + INK + '" stroke-width="2.5"/>' +
    // shoulder dome, seam ring, valve cup
    '<path d="M8 44 Q8 30 32 27 Q56 30 56 44 Z" fill="url(#st-chrome)" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M16 37 Q22 31.5 30 30.5" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/>' +
    '<rect x="5" y="40" width="54" height="7.5" rx="3.5" fill="url(#st-ring)" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<rect x="24" y="21" width="16" height="9" rx="2" fill="url(#st-chrome)" stroke="' + INK + '" stroke-width="2"/>' +
    // actuator cap (dealer's colour) and the nozzle
    '<rect x="20" y="6" width="24" height="17" rx="5.5" style="fill:var(--dc)" stroke="' + INK + '" stroke-width="2.5"/>' +
    '<rect x="20" y="6" width="24" height="17" rx="5.5" fill="url(#st-cyl)"/>' +
    '<path d="M25 10 H39" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>' +
    '<rect x="11" y="12.5" width="12" height="8" rx="2.2" fill="#3a434c" stroke="' + INK + '" stroke-width="2"/>' +
    '<circle cx="13.6" cy="16.5" r="1.7" fill="#0d0a09"/>' +
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
    '.st-chips .chip .st-over{position:absolute;left:-2px;top:-2px;margin:0;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35);}',
    '.st-none{font-size:13px;font-weight:800;color:rgba(255,248,234,.38);letter-spacing:.02em;}',
    '.st-doomed{box-shadow:0 0 0 4px #E8453A,0 0 18px 4px rgba(232,69,58,.6),0 3px 0 rgba(0,0,0,.55)!important;}',
    '.st-dim{position:absolute;left:-1100px;top:-1100px;width:2200px;height:2200px;z-index:3;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(8,5,4,0) 0,rgba(8,5,4,0) 70px,rgba(8,5,4,.5) 175px,rgba(8,5,4,.6) 100%);will-change:transform;}',
    '.st-beam{position:absolute;left:-120px;top:0;width:240px;height:78%;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(255,236,200,.13),rgba(255,236,200,.05) 55%,rgba(255,236,200,0));clip-path:polygon(41% 0,59% 0,100% 100%,0 100%);will-change:transform;}',
    '.st-shadow{position:absolute;left:-52px;top:-15px;width:104px;height:30px;z-index:4;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,.8),rgba(0,0,0,.35) 45%,rgba(0,0,0,0) 72%);opacity:0;will-change:transform,opacity;}',
    '.st-ripple{position:absolute;left:-40px;top:-14px;width:80px;height:28px;z-index:4;border-radius:50%;pointer-events:none;border:2px solid rgba(255,248,234,.55);opacity:0;}',
    '.st-rig{position:absolute;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none;will-change:transform;}',
    '.st-swing{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 -640px;}',
    '.st-cable{position:absolute;left:-4px;bottom:' + (ANCHOR_Y - 1) + 'px;width:8px;height:1800px;border-left:2.5px solid ' + INK + ';border-right:2.5px solid ' + INK + ';background:repeating-linear-gradient(-58deg,rgba(31,26,23,.28) 0 1.6px,transparent 1.6px 4.4px),linear-gradient(90deg,#59636e,#eef2f5 45%,#8a95a0);}',
    '.st-claw{position:absolute;left:' + (-ANCHOR_X) + 'px;top:' + (-ANCHOR_Y) + 'px;overflow:visible;}',
    '.st-front{filter:drop-shadow(0 10px 10px rgba(0,0,0,.45));}',
    '.st-claw g.st-pl,.st-claw g.st-pr,.st-claw g.st-pc{transform-box:view-box;transform-origin:0 0;}',
    '.st-held{position:absolute;left:-23px;top:-23px;width:46px;height:46px;opacity:0;}',
    '.st-held .chip{margin:0;position:absolute;left:0;top:0;box-shadow:0 3px 0 rgba(0,0,0,.55);}',
    /* the repaint: overspray speckle, then the dealer's coat wiping down behind the spray, a wet sheen, drips */
    '.st-speck{position:absolute;left:-5px;top:-5px;width:56px;height:56px;border-radius:50%;opacity:0;pointer-events:none;}',
    '.st-coat{position:absolute;left:0;top:0;width:46px;height:46px;border-radius:50%;overflow:hidden;' +
      '-webkit-mask-image:linear-gradient(180deg,#000 0,#000 41%,rgba(0,0,0,.6) 46%,rgba(0,0,0,.18) 51%,transparent 55%);mask-image:linear-gradient(180deg,#000 0,#000 41%,rgba(0,0,0,.6) 46%,rgba(0,0,0,.18) 51%,transparent 55%);' +
      '-webkit-mask-size:100% 300%;mask-size:100% 300%;-webkit-mask-position:0 100%;mask-position:0 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;}',
    '.st-held .st-coat .chip{box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35);}',
    '.st-sheen{position:absolute;left:0;top:0;width:46px;height:46px;background:linear-gradient(110deg,transparent 22%,rgba(255,255,255,.18) 38%,rgba(255,255,255,.9) 50%,rgba(255,255,255,.18) 62%,transparent 78%);transform:translateX(-120%);}',
    '.st-drip{position:absolute;top:37px;width:8px;height:15px;border:1.3px solid ' + INK + ';border-top:0;border-radius:0 0 5px 5px;transform-origin:50% 0;transform:scaleY(0);background:var(--dc);background-image:linear-gradient(90deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.55) 45%,rgba(255,255,255,0) 60%);}',
    '.st-drop{position:absolute;width:7px;height:8px;border:1.3px solid ' + INK + ';border-radius:50% 50% 50% 50%/40% 40% 60% 60%;background:var(--dc);opacity:0;}',
    /* the can, its cone of mist, the fog of paint hanging around the chip */
    '.st-can{position:absolute;left:0;top:0;width:0;height:0;z-index:6;pointer-events:none;will-change:transform;}',
    '.st-canflip,.st-canshake{position:absolute;left:0;top:0;width:0;height:0;}',
    '.st-cansvg{position:absolute;left:' + (-NOZ_X) + 'px;top:' + (-NOZ_Y) + 'px;overflow:visible;filter:drop-shadow(0 12px 12px rgba(0,0,0,.5));}',
    '.st-conewrap{position:absolute;left:-128px;top:-38px;width:126px;height:76px;filter:blur(2px);opacity:0;}',
    '.st-cone{position:absolute;inset:0;clip-path:polygon(100% 44%,100% 56%,0 100%,0 0);background:radial-gradient(ellipse 60% 22% at 100% 50%,rgba(255,255,255,.85),rgba(255,255,255,0)),linear-gradient(270deg,var(--dc) 0,var(--dc) 30%,transparent 100%);}',
    '.st-mist i{position:absolute;left:-2px;top:-2px;width:4px;height:4px;border-radius:50%;background:var(--dc);opacity:0;}',
    '.st-fog{position:absolute;left:-95px;top:-95px;width:190px;height:190px;z-index:4;border-radius:50%;pointer-events:none;background:radial-gradient(circle,var(--dc) 0,transparent 66%);opacity:0;filter:blur(8px);}',
    '.st-ledR,.st-haloR{opacity:0;}',
    '.st-ledA{animation:stBlink .42s steps(1) infinite;}',
    '.st-halo{animation:stBlink .42s steps(1) infinite;}',
    '@keyframes stBlink{0%{opacity:1}50%{opacity:.25}}',
    '.st-locked .st-ledR,.st-locked .st-haloR{opacity:1;}',
    '.st-locked .st-ledA,.st-locked .st-halo{opacity:0;animation:none;}',
    '.st-veil{position:absolute;inset:0;z-index:8;background:rgba(10,7,6,.55);opacity:0;pointer-events:none;}',
    '.st-gloat{position:absolute;left:22px;right:22px;top:50%;z-index:9;opacity:0;text-align:center;color:#fff;background:linear-gradient(180deg,#EE5247,#C9362C);border:3px solid ' + INK + ';border-radius:20px;padding:30px 20px 26px;box-shadow:7px 7px 0 ' + INK + ',0 24px 60px rgba(0,0,0,.55);transform:translateY(-50%);}',
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
    /* After the show: a stolen chip is the dealer's now — their colour, their initials, still wet */
    '.chip.painted{overflow:visible;}',
    '.chip.painted .pd{position:absolute;left:50%;bottom:-7px;width:18px;height:11px;margin-left:-9px;pointer-events:none;}',
    '.chip.painted .pd path{fill:var(--c);stroke:' + INK + ';stroke-width:1.5;stroke-linejoin:round;}',
    '.chip.painted .ps{position:absolute;right:-6px;top:-6px;width:15px;height:15px;border-radius:50%;background:#FFF8EA;border:1.5px solid ' + INK + ';display:flex;align-items:center;justify-content:center;pointer-events:none;}',
    '.chip.lg.painted .pd{width:24px;height:15px;bottom:-10px;margin-left:-12px;}',
    '.chip.xs.painted .ps,.chip.xs.painted .pd{display:none;}',
    /* The short show (every later steal, ~2.5s): a spray can slashes the chip in the dealer's colour, the line is tagged under the felt */
    '.st-q .st-head{margin-bottom:26px;}',
    '.stq-swipe{position:absolute;left:0;top:0;width:150px;height:30px;margin:-15px 0 0 -75px;z-index:6;pointer-events:none;border-radius:16px 8px 18px 6px;background:var(--dc);box-shadow:0 0 12px 2px var(--dc);opacity:.92;clip-path:inset(0 100% 0 0);-webkit-clip-path:inset(0 100% 0 0);}',
    '.stq-mist{position:absolute;left:0;top:0;width:190px;height:70px;margin:-35px 0 0 -95px;z-index:6;pointer-events:none;opacity:0;}',
    '.stq-can{position:absolute;left:0;top:0;width:0;height:0;z-index:7;pointer-events:none;opacity:0;}',
    '.stq-can .st-cansvg{transform:scale(.6);transform-origin:' + NOZ_X + 'px ' + NOZ_Y + 'px;}',
    '.stq-tag{position:relative;z-index:8;margin-top:22px;text-align:center;max-width:340px;}',
    '.stq-who{font-size:13px;font-weight:800;letter-spacing:.04em;color:rgba(255,248,234,.75);opacity:0;}',
    '.stq-line{font-family:var(--display);font-weight:700;font-size:30px;line-height:1.1;margin-top:6px;color:var(--dc);-webkit-text-stroke:1.5px ' + INK + ';paint-order:stroke fill;text-shadow:3px 3px 0 ' + INK + ';transform:rotate(-3deg);clip-path:inset(-20px 100% -20px -20px);-webkit-clip-path:inset(-20px 100% -20px -20px);}',
    '@media (prefers-reduced-motion: reduce){.st-ledA,.st-halo,.st-bulbs{animation:none;}}'
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-steal-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  function seeded(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduced = function () { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /* The dealer: id, colour, and a chip in their colour */
  function dealerId() {
    if (state.dealerId) return state.dealerId;
    var p = (state.players || []).find(function (q) { return q.name === state.dealerName; });
    return p ? p.id : null;
  }
  function colourOf(pid) { try { var i = getPlayerIndex(pid); return i < 0 ? '#E8453A' : playerColor(i); } catch (e) { return '#E8453A'; } }

  /* A stolen chip, as it sits on the table after the show: the dealer's chip, fresh paint dripping off it,
     a tiny spray can on its shoulder. Falls back to the old grey ✕ if we can't tell who the dealer was. */
  var MINI_CAN = '<svg viewBox="0 0 10 14" width="8" height="11" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="9" rx="1.2" fill="' + INK + '"/><rect x="3.4" y="1.6" width="3.6" height="2.6" rx=".8" fill="' + INK + '"/><path d="M3.2 2.9 H.6" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/><rect x="1.5" y="7" width="7" height="3.2" fill="var(--c)"/></svg>';
  var DRIP = '<svg class="pd" viewBox="0 0 18 11" aria-hidden="true"><path d="M2 0 Q2.5 2.5 4.5 3 V6.5 A2 2 0 0 0 8.5 6.5 V3.4 Q9.5 3 10.5 3.6 V8 A2.2 2.2 0 0 0 14.9 8 V3 Q15.8 2 16 0 Z"/></svg>';
  function paintedChip(dId, cls, fallbackPid) {
    if (!dId || !(typeof playerById === 'function' && playerById(dId))) return chipHtml(fallbackPid, (cls || '') + ' stolen');
    return chipHtml(dId, (cls || '') + ' painted', '<span class="ps">' + MINI_CAN + '</span>' + DRIP).replace('title="', 'title="Stolen by ');
  }
  window.ccPaintedChip = paintedChip;

  /* Sounds — every call sits inside big(), so only the speaker phone plays them.
     tone()/noise() take SECONDS for duration and ms for delay. */
  function hum(ms) {   // the cabinet's low, ominous motor hum under everything
    try {
      var ctx = actx(), t0 = ctx.currentTime, end = t0 + Math.min(ms, 8000) / 1000;
      var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.5); g.gain.setValueAtTime(0.05, end - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, end);
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 3;
      var lfo = ctx.createOscillator(), dep = ctx.createGain(); lfo.frequency.value = 0.9; dep.gain.value = 140; lfo.connect(dep); dep.connect(lp.frequency);
      lp.connect(g); g.connect(ctx.destination);
      [55, 55.6, 82.4].forEach(function (f, i) { var o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(t0); o.stop(end + 0.05); });
      lfo.start(t0); lfo.stop(end + 0.05);
    } catch (e) {}
  }
  function hiss(ms) {   // the spray: steady filtered noise with a hard "pss" onset and a little valve flutter
    try {
      var ctx = actx(), t0 = ctx.currentTime, dur = clamp(ms, 60, 2000) / 1000, end = t0 + dur;
      var len = Math.floor(ctx.sampleRate * (dur + 0.1)), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
      var bp = ctx.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 7200; bp.gain.value = 9; bp.Q.value = 1.2;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.018); g.gain.exponentialRampToValueAtTime(0.17, t0 + 0.09);
      g.gain.setValueAtTime(0.17, end - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, end);
      var lfo = ctx.createOscillator(), dep = ctx.createGain(); lfo.frequency.value = 13; dep.gain.value = 0.035; lfo.connect(dep); dep.connect(g.gain);
      src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(t0); src.stop(end + 0.05); lfo.start(t0); lfo.stop(end + 0.05);
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
    lift: function (ms) { tone(160, ms / 1000, 0, 'sawtooth', 0.04, 420); noise(ms / 1000, 40, 0.1, 1200); },
    servo: function () { noise(0.04, 0, 0.12, 4200, 'highpass'); tone(880, 0.05, 0, 'square', 0.02, 640); },
    nope: function () { tone(196, 0.09, 0, 'triangle', 0.08); tone(165, 0.13, 110, 'triangle', 0.08); },
    clunk: function () { noise(0.18, 0, 0.6, 480, 'lowpass'); tone(96, 0.3, 0, 'sine', 0.36, 52); tone(1240, 0.07, 0, 'square', 0.045, 620); tone(2650, 0.06, 6, 'triangle', 0.05); noise(0.05, 0, 0.3, 4800, 'highpass'); },
    drop: function () { noise(0.3, 0, 0.18, 1400); tone(720, 0.3, 0, 'sine', 0.06, 240); },
    swoosh: function () { noise(0.32, 0, 0.16, 900, 'lowpass'); tone(260, 0.3, 0, 'sine', 0.04, 520); },
    // the mixing ball: two knocks per shake, bright and glassy
    rattle: function (shakes, period) {
      for (var i = 0; i < shakes * 2; i++) {
        var at = i * period / 2 + (i % 2 ? 6 : 0), f = 2300 + (i * 397 % 700);
        noise(0.025, at, 0.34, 3400, 'bandpass'); tone(f, 0.03, at, 'square', 0.035, f * 0.8); tone(f * 1.9, 0.02, at + 2, 'sine', 0.03);
      }
    },
    pop: function () { tone(1900, 0.05, 0, 'sine', 0.05, 900); },
    clack: function () { noise(0.06, 0, 0.32, 2600, 'bandpass'); tone(560, 0.07, 0, 'triangle', 0.09, 320); tone(140, 0.12, 0, 'sine', 0.16, 90); },
    gloat: function () { sfx.evil(); tone(1568, 0.22, 420, 'sine', 0.05); tone(1568, 0.3, 640, 'sine', 0.05); }
  };

  /* ── The show ── */
  function play(wait, opt) {
    opt = opt || {};
    var st = state.steal, o = document.getElementById('stealshow');
    // The server says which show (st.stealShow): 'full' for the first steal of a game or a steal off the real
    // caption, 'short' (~2.5s) otherwise. An older server doesn't say: every steal is the full show, as before.
    if (showKind(st) === 'short') return short(wait);
    // The full show: act 0 is The Claw, the other 30 heists live in heists.js
    if (st.act && window.ccHeist) return window.ccHeist.play(wait, opt);
    var quick = false, L = opt.fullMs || 7600;
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
    var rnd = seeded((st.seed || 7) + 99), N = quick ? 30 : 70, mist = '';
    for (var i = 0; i < N; i++) mist += '<i></i>';
    var dots = [];   // overspray speckle, in the dealer's colour
    for (var j = 0; j < 26; j++) { var r = (0.6 + rnd() * 1.7).toFixed(1); dots.push('radial-gradient(circle at ' + (8 + rnd() * 84).toFixed(0) + '% ' + (8 + rnd() * 84).toFixed(0) + '%,var(--dc) 0 ' + r + 'px,transparent ' + (+r + 0.6) + 'px)'); }
    o.innerHTML = '<div class="st-stage" id="st-stage" style="visibility:hidden;--dc:' + colourOf(dealerId()) + '">' +
      '<div class="st-head" id="st-head"><p class="st-eyebrow">The Claw</p><p class="h2 st-title">' + title + '</p></div>' +
      '<div class="st-rail"><div class="st-felt">' + rows + '</div></div>' +
      '<div class="st-dim" id="st-dim"></div><div class="st-beam" id="st-beam"></div><div class="st-shadow" id="st-shadow"></div><div class="st-ripple" id="st-ripple"></div>' +
      '<div class="st-fog" id="st-fog"></div>' +
      '<div class="st-rig" id="st-rig"><div class="st-swing" id="st-swing"><div class="st-cable"></div>' + BACK_SVG + '<div class="st-held" id="st-held"></div>' + FRONT_SVG + '</div></div>' +
      '<div class="st-can" id="st-can"><div class="st-canflip"><div class="st-canshake">' +
        '<div class="st-conewrap"><div class="st-cone"></div></div><div class="st-mist">' + mist + '</div>' + CAN_SVG +
      '</div></div></div>' +
      '<div class="st-veil" id="st-veil"></div>' +
      '<div class="st-gloat" id="st-gloat"><i class="st-bulbs t"></i><i class="st-bulbs b"></i>' +
        '<p class="st-g-eye">Stolen</p><p class="st-g-head">' + head + '</p>' +
        '<p class="st-quote">“' + esc(st.gloat || 'Mine now.') + '”</p><p class="st-by">— ' + (me ? 'you' : esc(state.dealerName)) + '</p>' +
        '</div>' +
      '</div>';
    o.querySelector('#st-stage').dataset.speck = dots.join(',');
  }

  function choreograph(o, st, quick, L, startAt, T) {
    var $q = function (s) { return o.querySelector(s); };
    var stage = $q('#st-stage'), rig = $q('#st-rig'), swing = $q('#st-swing'), held = $q('#st-held'), shadow = $q('#st-shadow'), dim = $q('#st-dim'), beam = $q('#st-beam');
    var gl = $q('#st-gloat'), veil = $q('#st-veil'), head = $q('#st-head'), can = $q('#st-can'), fog = $q('#st-fog'), ripple = $q('#st-ripple');
    var pl = $q('.st-pl'), pr = $q('.st-pr'), pc = $q('.st-pc');
    var victim = $q('[data-st="victim"]'), isVictim = st.victimId === myPlayerId;
    var W = o.clientWidth || innerWidth;
    // #48: the moving dim only needs to cover the screen from wherever its centre goes (it was a fixed 2200px square)
    var Hh = o.clientHeight || innerHeight;
    if (dim) { dim.style.width = (2 * W + 80) + 'px'; dim.style.height = (2 * Hh + 80) + 'px'; dim.style.left = -(W + 40) + 'px'; dim.style.top = -(Hh + 40) + 'px'; }
    var lag = Math.max(0, performance.now() - startAt);
    var beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
    var c = function (el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el }; };
    var dId = dealerId(), dChip = dId ? chipHtml(dId, 'lg') : (victim ? victim.outerHTML : '');
    // the dealer's chip laid over the victim's on the felt (the repainted chip, back in its spot)
    var paintInPlace = function (ms) {
      if (!victim || !dId) return;
      victim.insertAdjacentHTML('beforeend', chipHtml(dId, 'lg st-over painted', DRIP));
      var ov = victim.lastElementChild; ov.removeAttribute('title');
      if (ms) ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-in-out', fill: 'both' });
    };
    if (victim) held.innerHTML = victim.outerHTML.replace('data-st="victim"', '') +
      '<span class="st-speck" style="background:' + stage.dataset.speck + '"></span>' +
      '<span class="st-coat">' + dChip + '<i class="st-sheen"></i></span>' +
      '<i class="st-drip" style="left:15px"></i><i class="st-drip" style="left:28px;height:10px"></i>' +
      '<i class="st-drop" style="left:15.5px;top:50px"></i>';
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

    /* The reduced-motion show: the table; the chip glows, then cross-fades into the dealer's; the gloat card */
    if (reduced()) {
      // Reduce Motion: no claw, no flight. The doomed chip glows, fades into the dealer's, the gloat card
      // fades in by 1.7s and holds until the show's end (the server paces the next step anyway). No flash.
      [rig, shadow, dim, beam, can, fog, ripple].forEach(function (el) { el.style.display = 'none'; });
      T(function () { stage.style.visibility = ''; beat(quick ? 'steal:quick' : 'steal:full'); if (victim) victim.classList.add('st-doomed'); }, 0);
      T(function () { beat('steal:snatch'); big(SND.clunk); buzz(isVictim ? [120, 40, 200] : 40); }, 700);
      T(function () { beat('steal:paint'); paintInPlace(500); big(function () { hiss(500); }); }, 900);
      T(function () { beat('steal:set'); if (victim) victim.classList.remove('st-doomed'); big(SND.clack); }, 1500);
      T(function () {
        beat('steal:gloat'); head.style.opacity = '0';
        veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
        gl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: 'forwards' });
        big(SND.gloat); if (isVictim) buzz([300, 100, 300]);
      }, 1700);
      return;
    }

    /* ── The path: rig points {t, x, y, sy (the felt under it), k (scale: nearer the camera), dy (spotlight), e} ── */
    var P = [], prong = [], sway = [], tm;
    var at = function (t, x, y, sy, e, k, dy) { P.push({ t: t, x: x, y: y, sy: sy, e: e, k: k || 1, dy: dy }); };
    var glideSway = function (t0, t1, dx, tight) {
      var s = clamp(dx / 140, -1, 1) * 1.7;
      sway.push({ t: t0, a: 0, e: 'ease-in-out' }, { t: t0 + (t1 - t0) * 0.42, a: s, e: 'ease-in-out' }, { t: t1, a: -0.55 * s, e: 'ease-in-out' });
      if (tight) sway.push({ t: t1 + 140, a: 0.18 * s, e: 'ease-in-out' }, { t: t1 + 250, a: 0, e: 'linear' });
      else sway.push({ t: t1 + 210, a: 0.26 * s, e: 'ease-in-out' }, { t: t1 + 400, a: 0, e: 'linear' });
    };
    var GLIDE = 'cubic-bezier(.45,0,.2,1)', DROP = 'cubic-bezier(.6,0,.9,.5)';
    var side = 1, C, K;   // where the chip is held for the paint job, and how close to the camera

    if (quick) {
      // Quick: drop, CLUNK, lift a little, pssst, set it back down, gone
      K = 1.3; C = { x: clamp(V.x + (W / 2 - V.x) * 0.3, 70, W - 70), y: Math.min(V.y - 82, top.y - 105) };   // up off the felt, into the light
      side = C.x > W * 0.56 ? -1 : 1;
      tm = { snatch: 400, lift0: 470, lift1: 740, can0: 600, can1: 720, paint: 745, spray1: 1070, wipe0: 760, wipe1: 1040, out0: 1110, out1: 1220,
             lower0: 1170, set: 1440, open: 1470, rise0: 1620, rise1: 2000, gloat: 1650 };
      at(0, V.x, -190, V.y, 'linear');
      at(70, V.x, -190, V.y, DROP);
      at(340, V.x, V.y, V.y, 'ease-out');
      at(400, V.x, V.y, V.y, 'cubic-bezier(.3,0,.5,1)');
      at(445, V.x, V.y + 3, V.y, 'ease-out');
      at(tm.lift0, V.x, V.y, V.y, 'cubic-bezier(.3,0,.2,1.1)');
      at(tm.lift1, C.x, C.y, V.y, 'linear', K, C.y + 6);
      at(tm.lower0, C.x, C.y, V.y, 'cubic-bezier(.55,0,.4,1)', K, C.y + 6);
      at(tm.set - 10, V.x, V.y + 2, V.y, 'ease-out');
      at(tm.set + 50, V.x, V.y - 1, V.y, 'ease-in-out');
      at(tm.rise0, V.x, V.y, V.y, 'cubic-bezier(.55,0,.8,.4)');
      at(tm.rise1, V.x, -330, V.y, 'linear');
      prong.push({ t: 0, a: 26 }, { t: 340, a: 26, e: 'cubic-bezier(.7,0,1,.6)' }, { t: 400, a: -3, e: 'ease-out' }, { t: 470, a: 0 }, { t: tm.open, a: 0, e: 'ease-out' }, { t: tm.open + 90, a: 26 });
      sway.push({ t: 0, a: 0 });
      T(function () { if (victim) victim.classList.add('st-doomed'); }, 0);
      S(70, SND.drop);
      T(function () { head.style.opacity = '0'; }, tm.lift0);
      S(tm.lift0, function () { SND.lift(260); });
      S(tm.can0, SND.pop);
      S(tm.lower0, function () { SND.lower(260); });
      S(tm.rise0, function () { SND.rise(350); });
    } else {
      K = 1.5; C = { x: W / 2, y: Math.max(150, top.y - 170) };
      tm = { snatch: 2990, lift0: 3260, lift1: 3700, can0: 3380, can1: 3720, rattle0: 3750, rattle1: 4170, paint: 4230, spray1: 4980, wipe0: 4260, wipe1: 4960,
             out0: 5060, out1: 5400, lower0: 5260, set: 5740, open: 5790, rise0: 5960, rise1: 6500, gloat: 6250 };
      // pick the decoy: another chip first, else an empty spot on the felt
      var rnd = seeded(st.seed || 7), others = [].slice.call(o.querySelectorAll('[data-st="other"]')), dec = [];
      if (others.length) dec.push(others[Math.floor(rnd() * others.length)]);
      else { var lb = [].slice.call(o.querySelectorAll('.st-none, .st-lbl')); if (lb.length) dec.push(lb[Math.floor(rnd() * lb.length)]); }
      dec = dec.map(c);
      var x0 = W * (rnd() < 0.5 ? 0.24 : 0.76);
      at(0, x0, -190, top.y, 'cubic-bezier(.22,1.18,.36,1)');
      at(620, x0, top.y - HOVER, top.y, 'linear');
      prong.push({ t: 0, a: 7 });
      var cur = { t: 760, x: x0, y: top.y - HOVER, sy: top.y };
      dec.forEach(function (d) {
        var p = { g: 460, l: 290, h: 220, r: 240, d: 10 }, t = cur.t;
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
      // drift past the victim before committing
      var px = clamp(V.x + (V.x > W / 2 ? -90 : 90), 50, W - 50), t1 = Math.min(cur.t, 2060);
      at(t1, cur.x, cur.y, cur.sy, GLIDE); glideSway(t1, 2400, px - cur.x);
      at(2400, px, V.y - HOVER, V.y, 'cubic-bezier(.35,0,.25,1.12)');
      glideSway(2400, 2650, V.x - px, true);
      S(2400, function () { SND.whir(250, V.x > px); });
      at(2650, V.x, V.y - HOVER, V.y, 'linear');
      at(2760, V.x, V.y - HOVER, V.y, DROP);
      at(2920, V.x, V.y, V.y, 'linear');
      at(2990, V.x, V.y, V.y, 'cubic-bezier(.3,0,.5,1)');
      at(3050, V.x, V.y + 4, V.y, 'ease-out');
      at(3130, V.x, V.y, V.y, 'ease-in-out');
      at(3200, V.x, V.y - 6, V.y, 'ease-in-out');   // strain…
      at(tm.lift0, V.x, V.y + 2, V.y, 'cubic-bezier(.3,0,.15,1)');   // …and up into the light
      at(tm.lift1, C.x, C.y - 8, V.y, 'ease-in-out', K, C.y + 4);
      at(tm.lift1 + 160, C.x, C.y, V.y, 'linear', K, C.y + 4);
      at(tm.lower0, C.x, C.y, V.y, 'cubic-bezier(.5,0,.35,1)', K, C.y + 4);
      at(tm.set - 20, V.x, V.y - 3, V.y, 'ease-out');
      at(tm.set + 20, V.x, V.y + 3, V.y, 'ease-in-out');
      at(tm.set + 100, V.x, V.y, V.y, 'linear');
      at(tm.rise0, V.x, V.y, V.y, 'cubic-bezier(.55,0,.8,.4)');
      at(tm.rise1, V.x, -330, V.y, 'linear');
      glideSway(tm.lift0, tm.lift1, C.x - V.x);
      glideSway(tm.lower0, tm.set, V.x - C.x, true);
      prong.push({ t: 2630, a: 8, e: 'cubic-bezier(.3,0,.3,1.3)' }, { t: 2770, a: 30 }, { t: 2920, a: 30, e: 'cubic-bezier(.7,0,1,.6)' }, { t: 2990, a: -3, e: 'ease-out' }, { t: 3070, a: 0 },
                 { t: tm.open, a: 0, e: 'cubic-bezier(.3,0,.3,1.3)' }, { t: tm.open + 130, a: 27 });
      T(function () { if (victim) victim.classList.add('st-doomed'); if (victim) victim.animate([{ transform: 'translate(1px,0) rotate(.6deg)' }, { transform: 'translate(-1px,1px) rotate(-.6deg)' }], { duration: 90, iterations: 4, direction: 'alternate' }); }, 2650);
      S(2630, SND.servo); S(2760, SND.drop);
      S(tm.lift0, function () { SND.lift(440); });
      S(tm.can0, SND.swoosh);
      S(tm.rattle0, function () { SND.rattle(5, 84); });
      S(tm.lower0, function () { SND.lower(480); });
      S(tm.rise0, function () { SND.rise(450); });
      T(function () { beat('steal:hover'); }, 620);
      T(function () { head.style.opacity = '.55'; }, 300);
      T(function () { head.style.opacity = '0'; }, tm.lift0);
      S(0, function () { hum(5600); arcadeTune(2700); });
    }
    P.sort(function (a, b) { return a.t - b.t; });

    // sway: sorted, and a later glide cuts off the previous settle
    sway.sort(function (a, b) { return a.t - b.t; });
    var sw = []; sway.forEach(function (p) { if (sw.length && p.t <= sw[sw.length - 1].t) sw.pop(); sw.push(p); });
    if (!sw.length) sw.push({ t: 0, a: 0 });

    /* Run it: one animation per layer, all on the same clock */
    whole(rig, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) scale(' + p.k + ')' }; });
    whole(swing, sw, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(shadow, P, function (p) {
      var h = Math.max(0, p.sy - p.y), k = clamp(1.12 - h / 300, 0.42, 1.12);
      return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + (p.sy + 22).toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')', opacity: clamp(0.78 - h / 330, 0.06, 0.78).toFixed(3) };
    });
    whole(dim, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + (p.dy != null ? p.dy : Math.max(p.y, p.sy - 140) + 30).toFixed(1) + 'px,0)' }; });
    whole(beam, P, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,0,0)' }; });
    prong.sort(function (a, b) { return a.t - b.t; });
    var pa = prong.map(function (p) { return { t: p.t, a: p.a, e: p.e || 'ease-in-out' }; });
    whole(pl, pa, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(pr, pa, function (p) { return { transform: 'rotate(' + p.a + 'deg)' }; });
    whole(pc, pa, function (p) { return { transform: 'scale(1,' + clamp(1 - p.a / 80, 0.6, 1.04).toFixed(3) + ')' }; });
    // the chip, swinging in its grip as it goes up, and again as it comes down
    var swingKf = function (a) { return [{ transform: 'rotate(0)' }, { transform: 'rotate(' + (-a) + 'deg)', offset: 0.3 }, { transform: 'rotate(' + (a * 0.7) + 'deg)', offset: 0.62 }, { transform: 'rotate(' + (-a * 0.3) + 'deg)', offset: 0.86 }, { transform: 'rotate(0)' }]; };
    anim(held, swingKf(quick ? 5 : 8), quick ? 380 : 640, tm.lift0 + 40, 'ease-in-out');
    if (!quick) anim(held, swingKf(4), 500, tm.lower0 + 80, 'ease-in-out', { fill: 'none' });

    /* ── The paint job ── */
    var cx = C.x, cy = C.y, R = 23 * K, sx = function (dx) { return cx + side * dx; };
    if (side < 0) can.querySelector('.st-canflip').style.transform = 'scaleX(-1)';
    var CP = [];   // can path {t, x, y, r, s, e}
    var cp = function (t, x, y, r, s, e) { CP.push({ t: t, x: x, y: y, r: r, s: s == null ? 1 : s, e: e }); };
    var NX = R + 62;   // nozzle distance from the chip's centre
    if (quick) {
      cp(0, sx(NX + 4), cy - 22, -18, 0, 'linear');
      cp(tm.can0, sx(NX + 4), cy - 22, -18, 0, 'cubic-bezier(.3,1.5,.5,1)');
      cp(tm.can1, sx(NX), cy - 14, -4, 1, 'linear');
      cp(tm.paint, sx(NX), cy - 14, -4, 1, 'ease-in-out');
      cp(tm.spray1, sx(NX), cy + 12, 4, 1, 'linear');
      cp(tm.out0, sx(NX), cy + 12, 4, 1, 'cubic-bezier(.5,0,.9,.5)');
      cp(tm.out1, sx(NX + 14), cy, 20, 0, 'linear');
    } else {
      cp(0, sx(W / 2 + 140), cy - 190, 48, 1, 'linear');
      cp(tm.can0, sx(W / 2 + 140), cy - 190, 48, 1, 'cubic-bezier(.2,.9,.3,1.12)');
      cp(tm.can1, sx(NX + 10), cy - 30, -8, 1, 'linear');
      cp(tm.paint - 50, sx(NX + 10), cy - 30, -8, 1, 'cubic-bezier(.4,0,.2,1)');
      cp(tm.paint, sx(NX), cy - R * 0.85, -5, 1, 'cubic-bezier(.45,0,.55,1)');
      cp(tm.spray1, sx(NX), cy + R * 0.85, 5, 1, 'linear');
      cp(tm.out0, sx(NX + 4), cy + R * 0.7, 2, 1, 'cubic-bezier(.5,0,.8,.4)');
      cp(tm.out1, sx(W / 2 + 150), cy - 140, 42, 1, 'linear');
    }
    whole(can, CP, function (p) { return { transform: 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + (side * p.r) + 'deg) scale(' + p.s + ')' }; });
    // the shake: the mixing ball knocking about
    if (!quick) {
      anim(can.querySelector('.st-canshake'), [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-9px) rotate(-7deg)', offset: 0.25 }, { transform: 'translateY(6px) rotate(6deg)', offset: 0.75 }, { transform: 'translateY(0) rotate(0)' }],
        84, tm.rattle0, 'ease-in-out', { iterations: 5, fill: 'none' });
    }
    // the cone: bursts on, flickers with the valve, cuts off
    var cone = can.querySelector('.st-conewrap'), sprayMs = tm.spray1 - tm.paint, ck = [{ t: 0, o: 0 }, { t: tm.paint, o: 0 }, { t: tm.paint + 40, o: 0.95 }];
    for (var f = tm.paint + 110; f < tm.spray1 - 40; f += 95) ck.push({ t: f, o: 0.62 + ((f / 95) % 2) * 0.2 });
    ck.push({ t: tm.spray1, o: 0.8 }, { t: tm.spray1 + 70, o: 0 });
    whole(cone, ck, function (p) { return { opacity: p.o }; });
    // the mist: fine droplets flying out along the cone, landing on (and around) the chip
    var prnd = seeded((st.seed || 7) * 3 + 1);
    [].slice.call(can.querySelectorAll('.st-mist i')).forEach(function (el, i, all) {
      var t = tm.paint + (i / all.length) * (sprayMs - 120) + prnd() * 60, d = 220 + prnd() * 160;
      var ang = (prnd() - 0.5) * 0.62, dist = NX - R * 0.4 + prnd() * R * 1.9, s = 0.6 + prnd() * 1.4;
      anim(el, [{ transform: 'translate(0,0) scale(.35)', opacity: 0 }, { opacity: 0.95, offset: 0.12 }, { opacity: 0.85, offset: 0.7 },
        { transform: 'translate(' + (-dist * Math.cos(ang)).toFixed(1) + 'px,' + (dist * Math.sin(ang)).toFixed(1) + 'px) scale(' + s.toFixed(2) + ')', opacity: 0 }], d, t, 'cubic-bezier(.2,.6,.4,1)');
    });
    // a cloud of paint hanging in the light around the chip
    fog.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    whole(fog, [{ t: tm.paint, o: 0, k: 0.5 }, { t: tm.paint + 300, o: quick ? 0.4 : 0.5, k: 1, e: 'ease-out' }, { t: tm.spray1 + 120, o: quick ? 0.34 : 0.42, k: 1.25, e: 'ease-in' }, { t: tm.spray1 + (quick ? 450 : 900), o: 0, k: 1.6 }],
      function (p) { return { opacity: p.o, transform: 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0) scale(' + p.k + ')' }; });
    // on the chip: speckle, then the coat wipes down behind the spray, then the wet sheen and the drips
    var speck = held.querySelector('.st-speck'), coat = held.querySelector('.st-coat'), sheen = held.querySelector('.st-sheen');
    var drips = held.querySelectorAll('.st-drip'), drop = held.querySelector('.st-drop');
    if (speck) anim(speck, [{ opacity: 0 }, { opacity: 1 }], quick ? 140 : 300, tm.paint + 30, 'ease-out');
    if (coat) anim(coat, [{ WebkitMaskPosition: '0 100%', maskPosition: '0 100%' }, { WebkitMaskPosition: '0 0', maskPosition: '0 0' }], tm.wipe1 - tm.wipe0, tm.wipe0, 'cubic-bezier(.35,.1,.65,.9)');
    if (coat) anim(coat.querySelector('.chip'), [{ filter: 'saturate(1.35) brightness(1.12)' }, { filter: 'saturate(1.35) brightness(1.12)', offset: 0.5 }, { filter: 'none' }], quick ? 700 : 1500, tm.wipe0, 'ease-in');
    if (sheen) anim(sheen, [{ transform: 'translateX(-120%)' }, { transform: 'translateX(120%)' }], quick ? 300 : 520, tm.wipe1 - 20, 'cubic-bezier(.4,0,.3,1)');
    if (drips[0]) anim(drips[0], [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)', offset: 0.55 }, { transform: 'scaleY(1.15)' }], quick ? 420 : 820, tm.wipe1 - 40, 'cubic-bezier(.3,.1,.4,1)');
    if (drips[1]) anim(drips[1], [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], quick ? 360 : 700, tm.wipe1 + (quick ? 40 : 160), 'cubic-bezier(.3,.1,.4,1)');
    if (drop && !quick) anim(drop, [{ transform: 'translateY(0) scale(.6)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translateY(70px) scale(1,1.2)', opacity: 0 }], 560, tm.wipe1 + 420, 'cubic-bezier(.5,0,.9,.6)');
    // the set-down: a ring on the felt
    ripple.style.transform = 'translate3d(' + V.x.toFixed(1) + 'px,' + (V.y + 20).toFixed(1) + 'px,0)';
    anim(ripple, [{ opacity: 0.9, transform: 'translate3d(' + V.x.toFixed(1) + 'px,' + (V.y + 20).toFixed(1) + 'px,0) scale(.5)' }, { opacity: 0, transform: 'translate3d(' + V.x.toFixed(1) + 'px,' + (V.y + 20).toFixed(1) + 'px,0) scale(1.5)' }], 420, tm.set, 'ease-out', { fill: 'forwards' });

    // the gloat card: veil, then a sprung entrance with a slight tilt
    anim(veil, [{ opacity: 0 }, { opacity: 1 }], 320, tm.gloat - 60, 'ease-out');
    anim(gl, [{ opacity: 0, transform: 'translateY(-50%) scale(.55) rotate(4deg)' }, { opacity: 1, transform: 'translateY(-50%) scale(1.06) rotate(-2.5deg)', offset: 0.55 }, { opacity: 1, transform: 'translateY(-50%) scale(1) rotate(-2deg)' }], 520, tm.gloat, 'cubic-bezier(.2,.8,.3,1)');

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
    }, tm.snatch);
    T(function () {   // pssssst
      beat('steal:paint');
      big(function () { hiss(sprayMs + 40); });
      buzz(isVictim ? [60, 30, 60, 30, 60] : 20);
    }, tm.paint);
    T(function () {   // clack: the dealer's chip, back in its spot
      beat('steal:set');
      if (victim) { paintInPlace(0); victim.style.visibility = ''; }
      held.style.opacity = '0';   // (no flash here: one full-screen flash per show, at the CLUNK)
      big(SND.clack);
      buzz(isVictim ? [80, 40, 80] : 25);
    }, tm.set);
    T(function () {
      beat('steal:gloat');
      if (window.ccPunch) window.ccPunch(gl.querySelector('.st-quote'));
      big(SND.gloat);
      if (isVictim) { document.body.classList.remove('quake'); void document.body.offsetWidth; document.body.classList.add('quake'); buzz([300, 100, 300, 100, 600]); setTimeout(function () { document.body.classList.remove('quake'); }, 1300); }
    }, tm.gloat);
  }

  /* ── The short show (~2.5s): every steal after the first, unless it's off the real caption ──
     The table; the doomed chip; a spray can slashes across it in the dealer's colour (pssht); the chip is
     theirs; the steal line is tagged under the felt. Same clock on every phone. Reduce Motion: fades only. */
  var SHORT_MS = 2500;
  function short(wait) {
    var st = state.steal, o = document.getElementById('stealshow');
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var startAt = performance.now() + Math.max(0, wait);
    var T = function (fn, ms) { window._ssT.push(setTimeout(function () { try { fn(); } catch (e) { console.error('steal', e); } }, Math.max(0, startAt + ms - performance.now()))); };
    var close = function () { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick'); o.innerHTML = ''; };
    o.innerHTML = ''; o.classList.remove('out'); o.classList.add('quick', 'on');
    o.onclick = function () { close(); if (window._answerGo) window._answerGo(); };

    var bets = state.bets || [], targets = (state.openCaptions || []).map(function (_, i) { return i; }).concat(['closed']);
    var rows = targets.map(function (t) {
      var chips = [];
      bets.forEach(function (b, bi) {
        if (b.target === 'pass' || String(b.target) !== String(t)) return;
        var n = b.count + (b.stolen || 0);
        for (var k = 0; k < n; k++) chips.push(chipHtml(b.playerId, 'lg', '', 'data-st="' + (bi === st.betIndex && k === n - 1 ? 'victim' : 'other') + '"'));
      });
      if (!chips.length) return '';   // the short show only needs the rows with chips on them
      return '<div class="st-row"><span class="st-lbl">' + (t === 'closed' ? '<span class="cc-badge">CC</span>' : t + 1) + '</span><div class="st-chips">' + chips.join('') + '</div></div>';
    }).join('');
    var me = state.isDealer, dealer = me ? 'You' : esc(state.dealerName), isVictim = st.victimId === myPlayerId;
    var who = isVictim ? 'That was YOUR chip.' : dealer + ' stole ' + esc(nameOf(st.victimId)) + '’s chip';
    var dId = dealerId(), rnd = seeded((st.seed || 7) + 7), dots = [];
    for (var j = 0; j < 22; j++) { var r = (0.8 + rnd() * 1.8).toFixed(1); dots.push('radial-gradient(circle at ' + (4 + rnd() * 92).toFixed(0) + '% ' + (10 + rnd() * 80).toFixed(0) + '%,var(--dc) 0 ' + r + 'px,transparent ' + (+r + 0.6) + 'px)'); }
    o.innerHTML = '<div class="st-stage st-q" id="st-stage" style="visibility:hidden;--dc:' + colourOf(dId) + '">' +
      '<div class="st-head" id="st-head"><p class="st-eyebrow">Stolen</p><p class="h2 st-title">' + dealer + (me ? ' strike' : ' strikes') + ' again</p></div>' +
      '<div class="st-rail"><div class="st-felt">' + rows + '</div></div>' +
      '<div class="stq-tag"><p class="stq-who" id="stq-who">' + who + '</p><p class="stq-line" id="stq-line">“' + esc(st.gloat || 'Mine now.') + '”</p></div>' +
      '<div class="stq-mist" id="stq-mist" style="background:' + dots.join(',') + '"></div><div class="stq-swipe" id="stq-swipe"></div>' +
      '<div class="stq-can" id="stq-can">' + CAN_SVG + '</div>' +
      '</div>';
    var $q = function (sel) { return o.querySelector(sel); };
    var stage = $q('#st-stage'), victim = $q('[data-st="victim"]'), swipe = $q('#stq-swipe'), mist = $q('#stq-mist'), can = $q('#stq-can');
    var whoEl = $q('#stq-who'), line = $q('#stq-line'), RM = reduced();
    var lag = Math.max(0, performance.now() - startAt);
    var anim = function (el, kf, ms, at, easing, extra) {
      if (!el) return null;
      var op = { duration: ms, delay: at, easing: easing || 'linear', fill: 'both' };
      for (var k in extra || {}) op[k] = extra[k];
      try { var a = el.animate(kf, op); try { if (document.timeline && document.timeline.currentTime != null) a.startTime = startAt; } catch (e) { a.currentTime = lag; } return a; } catch (e) { return null; }
    };
    var beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
    var oc = o.getBoundingClientRect(), vr = victim ? victim.getBoundingClientRect() : null;
    var V = vr ? { x: vr.left - oc.left + vr.width / 2, y: vr.top - oc.top + vr.height / 2 } : { x: oc.width / 2, y: oc.height / 2 };
    // the dealer's chip, laid over the victim's (hidden until the paint reaches it)
    var coat = null;
    if (victim && dId) { victim.insertAdjacentHTML('beforeend', chipHtml(dId, 'lg st-over painted', DRIP)); coat = victim.lastElementChild; coat.removeAttribute('title'); coat.style.opacity = '0'; }
    var PAINT = 300, PAINT1 = 560, LINE = 880;
    if (RM) {
      [swipe, mist, can].forEach(function (el) { el.style.display = 'none'; });
      anim(coat, [{ opacity: 0 }, { opacity: 1 }], 400, PAINT, 'ease-out');
      anim(whoEl, [{ opacity: 0 }, { opacity: 1 }], 300, LINE - 200, 'ease-out');
      line.style.clipPath = 'none'; line.style.webkitClipPath = 'none';
      anim(line, [{ opacity: 0 }, { opacity: 1 }], 400, LINE, 'ease-out');
    } else {
      // the slash: tilted a touch, wiped on left to right behind the nozzle; then it evaporates
      var ROT = -17, rad = ROT * Math.PI / 180, dx = Math.cos(rad) * 70, dy = Math.sin(rad) * 70;
      var place = 'translate3d(' + V.x.toFixed(1) + 'px,' + V.y.toFixed(1) + 'px,0) rotate(' + ROT + 'deg)';
      swipe.style.transform = place; mist.style.transform = place;
      anim(swipe, [{ clipPath: 'inset(0 100% 0 0)', WebkitClipPath: 'inset(0 100% 0 0)', opacity: 0.92 }, { clipPath: 'inset(0 0 0 0)', WebkitClipPath: 'inset(0 0 0 0)', opacity: 0.92, offset: 0.4 },
        { clipPath: 'inset(0 0 0 0)', WebkitClipPath: 'inset(0 0 0 0)', opacity: 0.92, offset: 0.62 }, { clipPath: 'inset(0 0 0 0)', WebkitClipPath: 'inset(0 0 0 0)', opacity: 0 }], 660, PAINT, 'cubic-bezier(.4,0,.6,1)');
      anim(mist, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0.6, offset: 0.7 }, { opacity: 0 }], 900, PAINT, 'ease-out');
      // the can rides the leading edge of the slash (it sprays to its left), then is gone up and right
      var at0 = { x: V.x - dx - 18, y: V.y - dy + 14 }, at1 = { x: V.x + dx + 22, y: V.y + dy + 10 };
      var cpos = function (p, r) { return 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) rotate(' + r + 'deg)'; };
      anim(can, [
        { opacity: 0, transform: cpos({ x: at0.x - 90, y: at0.y + 70 }, -30), offset: 0 },
        { opacity: 1, transform: cpos(at0, -8), offset: 150 / 760, easing: 'cubic-bezier(.3,0,.5,1)' },
        { opacity: 1, transform: cpos(at0, -8), offset: PAINT / 760, easing: 'cubic-bezier(.4,0,.6,1)' },
        { opacity: 1, transform: cpos(at1, 6), offset: PAINT1 / 760, easing: 'cubic-bezier(.5,0,.9,.5)' },
        { opacity: 0, transform: cpos({ x: at1.x + 90, y: at1.y - 120 }, 40), offset: 1 }
      ], 760, 0, 'linear');
      // the coat follows the paint: wiped on in the same direction, then the chip punches
      if (coat) anim(coat, [{ opacity: 1, clipPath: 'inset(0 100% 0 0)', WebkitClipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)', WebkitClipPath: 'inset(0 0 0 0)' }], PAINT1 - PAINT - 40, PAINT + 40, 'cubic-bezier(.4,0,.6,1)');
      if (victim) anim(victim, [{ transform: 'scale(1.32) rotate(-6deg)', filter: 'brightness(1.5)' }, { transform: 'scale(.94) rotate(2deg)', filter: 'none', offset: 0.55 }, { transform: 'none', filter: 'none' }], 380, PAINT1, 'cubic-bezier(.2,.9,.3,1.3)', { fill: 'none' });
      anim(whoEl, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], 260, LINE - 160, 'ease-out');
      anim(line, [{ clipPath: 'inset(-20px 100% -20px -20px)', WebkitClipPath: 'inset(-20px 100% -20px -20px)' }, { clipPath: 'inset(-20px -20px -20px -20px)', WebkitClipPath: 'inset(-20px -20px -20px -20px)' }], 380, LINE, 'cubic-bezier(.4,0,.5,1)');
    }
    T(function () { stage.style.visibility = ''; beat('steal:quick'); if (victim) victim.classList.add('st-doomed'); buzz(isVictim ? [60, 30, 60] : 25); }, 0);
    T(function () { beat('steal:paint'); big(function () { hiss(RM ? 380 : PAINT1 - PAINT + 60); }); }, PAINT);
    T(function () { beat('steal:set'); if (victim) victim.classList.remove('st-doomed'); big(SND.clack); buzz(isVictim ? [140, 50, 220] : 35); }, PAINT1);
    T(function () { beat('steal:gloat'); big(SND.gloat); if (isVictim) buzz([200, 80, 300]); }, LINE);
    T(function () { o.classList.add('out'); }, SHORT_MS - 350);
    T(close, SHORT_MS);
    return Math.max(0, wait) + SHORT_MS;
  }
  // How long this steal's show runs (index.html paces the reel after it). No stealShow (older server): the full show.
  function lengthFor(st, fullMs) { return showKind(st) === 'short' ? SHORT_MS : (fullMs || 7600); }
  // 'full' | 'short' | null (null: an older server; play the full show). On the steal itself, or beside it in the state.
  function showKind(st) { var k = (st && st.stealShow) || (typeof state !== 'undefined' && state && state.stealShow) || null; return k === 'short' || k === 'full' ? k : null; }

  window.ccClaw = { play: play, lengthFor: lengthFor, SHORT_MS: SHORT_MS };

  window.ccStealKit = { seeded: seeded, hiss: hiss, SND: SND, dealerId: dealerId, colourOf: colourOf, reduced: reduced, DRIP: DRIP };
})();
