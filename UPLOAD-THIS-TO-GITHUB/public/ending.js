/* Closed Caption — THE END OF THE NIGHT (ending.js)
   The server works it all out (night.js) and every phone shows the same thing at the same moment:
     1. The winner: the name, the points, the Remote changing hands ("Bob, hand over the remote."), and each
        player's rating change on one line.
     2. One awards slide: Best Lie and Nobody Bit (quoted), Best Liar, Most Groans, Sharpest Eye.
     3. END CREDITS: one freeze-frame per player — their best caption on its cartoon, their name in a caption box,
        an epilogue earned from how they played (big, for the dealer to read aloud), and their rating's verdict as a
        pull quote. ~6.5 s each; the dealer (or host) taps on.
     4. The cast list, and the monkey (a dart-throwing control player) if it out-guessed anyone. The dealer's tap
        opens Caption of the Night (finale.js).
   A sealed game (R18: the Late Edition seals the scoreboard) opens the ending by reading the standings from last
   place up, one name a beat, then holds the top two together before the winner lands.
   Also here: HEADING OUT (R28: your own credit now, to keep), LAST CALL (R30: the host's "one more trip around"),
   the sealed scoreboard, THE REMOTE (the table's traveling trophy: an inline drawing, the lobby line, the tape to read),
   "PREVIOUSLY ON CLOSED CAPTION" (round 1's cold open for a returning table), and the table records each phone
   keeps (cc_tables: who has the Remote, the tape, the first cartoon, a short summary of the last game).
   Server: state.ending = { at, step, stepAt, beats, done, remote, ratings, awards, credits, cast, monkey, keys, table },
           state.previously (round 1, writing), state.remote (the lobby).
   Reads the page's globals at call time: state, myPlayerId, esc, chipHtml, plural, canRun, send, clockOffset, ws,
   buzz, big, tone, noise, srSay, careerGet, careerSave, sendCareer, addSeenLines, fmtRating, inkIcon, closeMenu,
   firstName, nameOf, render. CSS prefix: en- (the ending), rm- (the Remote), pv- (Previously on). */
(function () {
  'use strict';
  var INK = '#1F1A17';
  var CSS = [
    /* ── the overlay: paper for the winner and the awards, the dark of a theater for the credits ── */
    '#ending{position:fixed;inset:0;z-index:785;display:none;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}',
    '#ending.on{display:block;}',
    '#ending.paper{background:var(--paper,#FFF8EA);background-image:radial-gradient(rgba(31,26,23,0.06) 1.2px,transparent 1.2px);background-size:18px 18px;color:' + INK + ';}',
    '#ending.dark{background:#14100D;color:#F3EBDD;}',
    '.en-in{min-height:100%;max-width:440px;margin:0 auto;padding:calc(18px + var(--sat,0px)) 16px calc(84px + var(--sab,0px));display:flex;flex-direction:column;justify-content:center;}',
    '.en-eye{font-size:12px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;color:var(--muted,#6E655C);margin:0;}',
    '#ending.dark .en-eye{color:#B9AE9C;}',
    '.en-fade{animation:enFade .5s ease-out both;}',
    '@keyframes enFade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}',
    /* the bar that shows how long a beat stays; the dealer's tap */
    '.en-foot{position:fixed;left:0;right:0;bottom:0;padding:10px 16px calc(12px + var(--sab,0px));display:flex;align-items:center;gap:12px;justify-content:space-between;max-width:440px;margin:0 auto;}',
    '#ending.paper .en-foot{background:linear-gradient(to top,var(--paper,#FFF8EA) 70%,rgba(255,248,234,0));}',
    '#ending.dark .en-foot{background:linear-gradient(to top,#14100D 70%,rgba(20,16,13,0));}',
    '.en-bar{flex:1;height:3px;border-radius:2px;background:rgba(31,26,23,.14);overflow:hidden;}',
    '#ending.dark .en-bar{background:rgba(243,235,221,.18);}',
    '.en-bar i{display:block;height:100%;width:100%;background:currentColor;transform-origin:left;animation:enBar linear both;opacity:.6;}',
    '@keyframes enBar{from{transform:scaleX(0);}to{transform:scaleX(1);}}',
    '.en-next{flex:none;min-height:44px;padding:0 18px;border-radius:999px;border:2.5px solid currentColor;background:transparent;color:inherit;font:inherit;font-weight:900;font-size:15px;cursor:pointer;}',
    '#ending.dark .en-next{border-color:#F3EBDD;}',
    '.en-who{flex:none;font-family:var(--serif);font-style:italic;font-size:15px;}',
    '.en-go{width:100%;}',
    /* 1. the winner */
    '.en-win{text-align:center;}',
    '.en-win .en-ic{display:flex;justify-content:center;margin-bottom:4px;}',
    '.en-name{font-family:var(--serif);font-weight:700;font-size:46px;line-height:1.02;margin:6px 0 4px;overflow-wrap:anywhere;}',
    '.en-name.mid{font-size:36px;} .en-name.small{font-size:28px;}',
    '.en-pts{font-family:var(--serif);font-size:18px;color:var(--ink-2,#4A433D);}',
    '.en-why{font-family:var(--serif);font-style:italic;font-size:15px;color:var(--ink-2,#4A433D);margin-top:4px;}',
    '.en-rm{display:flex;align-items:center;gap:12px;justify-content:center;margin:18px auto 4px;max-width:340px;text-align:left;}',
    '.en-rm .rm-svg{flex:none;transform:rotate(-14deg);}',
    '.en-rm p{font-family:var(--serif);font-style:italic;font-weight:400;font-size:20px;line-height:1.3;}',
    '.en-rates{margin:18px auto 0;max-width:360px;text-align:left;border-top:2px solid ' + INK + ';border-bottom:2px solid ' + INK + ';padding:4px 0;}',
    '.en-rate{display:flex;align-items:center;gap:8px;padding:5px 2px;font-size:15px;font-weight:800;}',
    '.en-rate + .en-rate{border-top:1.5px dashed var(--line,#E6DCC8);}',
    '.en-rate .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.en-rate .rt{font-family:var(--serif);font-weight:700;}',
    '.en-rate .d{min-width:44px;text-align:right;font-size:14px;font-weight:900;color:var(--muted,#6E655C);}',
    '.en-rate .d.up{color:var(--teal-ink,#0B6E59);} .en-rate .d.down{color:var(--red-ink,#B3261E);}',
    '.en-rate.me{background:linear-gradient(90deg,var(--yellow-bg,#FFF4C7),transparent);}',
    '.en-short{font-size:13px;font-weight:800;color:var(--muted,#6E655C);margin-top:6px;text-align:center;}',
    /* 2. the awards */
    '.en-aw h2{font-family:var(--serif);font-weight:700;font-size:30px;text-align:center;margin:4px 0 14px;}',
    '.en-awr{padding:12px 4px;border-top:1.5px dashed var(--line,#E6DCC8);}',
    '.en-awr:first-of-type{border-top:2px solid ' + INK + ';}',
    '.en-awr:last-child{border-bottom:2px solid ' + INK + ';}',
    '.en-awh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;}',
    '.en-awt{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-2,#4A433D);}',
    '.en-aww{font-family:var(--serif);font-weight:700;font-size:20px;}',
    '.en-awq{font-family:var(--serif);font-style:italic;font-weight:400;font-size:19px;line-height:1.3;margin-top:4px;overflow-wrap:anywhere;}',
    '.en-awl{font-family:var(--serif);font-size:15px;color:var(--ink-2,#4A433D);margin-top:3px;}',
    /* 3. the credits: a freeze-frame, the name in a caption box, the epilogue */
    '.en-count{text-align:center;margin-bottom:10px;}',
    '.en-frame{position:relative;margin:0 auto;width:min(84vw,330px);background:#fff;padding:8px 8px 8px;box-shadow:0 14px 40px rgba(0,0,0,.55);transform:rotate(-1.2deg);}',
    '.en-frame img{display:block;width:100%;max-height:31vh;object-fit:contain;background:#fff;}',
    '.en-flash{position:absolute;inset:8px;background:#fff;opacity:0;pointer-events:none;}',
    '.en-cc{position:absolute;left:50%;bottom:-16px;transform:translateX(-50%) rotate(1.2deg);max-width:94%;background:#000;color:#fff;font-family:var(--sans);font-weight:900;font-size:21px;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.en-cc span{display:inline-block;min-width:1ch;}',
    '.en-cap{font-family:var(--serif);font-style:italic;font-weight:400;font-size:15.5px;line-height:1.35;color:#CFC4B2;text-align:center;margin:28px 8px 0;overflow-wrap:anywhere;}',
    '.en-epi{font-family:var(--serif);font-weight:400;font-size:23px;line-height:1.38;color:#FFF8EA;margin:16px 2px 0;text-wrap:pretty;}',
    '.en-blurb{font-family:var(--serif);font-weight:400;font-size:15px;line-height:1.4;color:#B9AE9C;margin:14px 2px 0;}',
    '.en-blurb b{font-weight:700;color:#E8DDC9;font-style:normal;}',
    '.en-blurb i{font-style:italic;}',
    /* 4. the cast */
    '.en-cast{text-align:center;}',
    '.en-cast h2{font-family:var(--serif);font-weight:700;font-size:15px;letter-spacing:.42em;text-transform:uppercase;margin:0 0 16px;color:#E8DDC9;}',
    '.en-cl{list-style:none;margin:0 auto;padding:0;max-width:340px;}',
    '.en-cl li{display:flex;align-items:baseline;gap:6px;font-family:var(--serif);font-size:18px;line-height:1.5;color:#FFF8EA;animation:enFade .5s ease-out both;}',
    '.en-cl .n{flex:none;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.en-cl .lead{flex:1;border-bottom:1.5px dotted rgba(243,235,221,.4);transform:translateY(-5px);min-width:14px;}',
    '.en-cl .r{flex:none;font-style:italic;color:#CFC4B2;max-width:52%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.en-cl li.mk{margin-top:6px;}',
    '.en-monkey{display:flex;align-items:center;gap:12px;margin:22px auto 0;max-width:340px;text-align:left;animation:enFade .6s ease-out both;}',
    '.en-monkey svg{flex:none;}',
    '.en-monkey p{font-family:var(--serif);font-weight:400;font-size:17px;line-height:1.35;color:#FFF8EA;}',
    '.en-vs{font-family:var(--serif);font-size:16px;color:#CFC4B2;margin-top:16px;}',
    '.en-the-end{font-family:var(--serif);font-style:italic;font-size:15px;color:#B9AE9C;margin-top:22px;}',
    /* the Remote */
    '.rm-svg{display:block;overflow:visible;}',
    '.rm-lobby{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 16px;padding:10px 14px;border:var(--bw,2.5px) solid ' + INK + ';border-radius:var(--r-lg,18px);background:var(--card,#fff);color:' + INK + ';box-shadow:var(--shadow-sm,3px 3px 0 ' + INK + ');font:inherit;text-align:left;cursor:pointer;min-height:56px;}',
    '.rm-lobby:active{transform:translate(2px,2px);box-shadow:1px 1px 0 ' + INK + ';}',
    '.rm-lobby .rm-svg{transform:rotate(-16deg);margin:-6px 2px -6px 4px;}',
    '.rm-t{flex:1;min-width:0;display:flex;flex-direction:column;}',
    '.rm-t b{font-family:var(--serif);font-weight:700;font-size:17px;line-height:1.25;}',
    '.rm-t span{font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink-2,#4A433D);}',
    '.rm-go{flex:none;font-size:13px;font-weight:800;color:var(--ink-2,#4A433D);text-decoration:underline;text-underline-offset:2px;}',
    '.rm-sheet{max-width:420px;margin:0 auto;text-align:center;}',
    '.rm-h{font-family:var(--serif);font-weight:700;font-size:26px;margin:2px 0 8px;}',
    '.rm-big{display:flex;justify-content:center;margin:6px 0 10px;}',
    '.rm-big .rm-svg{transform:rotate(-5deg);}',
    '.rm-p{font-family:var(--serif);font-size:15.5px;line-height:1.45;color:' + INK + ';margin:0 4px 10px;}',
    '.rm-p.small{font-size:14px;font-style:italic;color:var(--muted,#6E655C);}',
    '.rm-tape{display:flex;flex-direction:column;align-items:center;gap:8px;margin:6px 0 12px;}',
    '.rm-strip{position:relative;display:flex;align-items:baseline;gap:14px;padding:5px 22px 4px;background:#E9DDB6;color:#2E2619;font-family:Caveat,"Bradley Hand","Segoe Print",cursive;font-weight:700;font-size:22px;line-height:1.1;box-shadow:0 1px 2px rgba(0,0,0,.15);',
    '-webkit-mask:linear-gradient(#000,#000) center/calc(100% - 12px) 100% no-repeat,conic-gradient(from -45deg at left,#0000 25%,#000 0) left/6px 7px repeat-y,conic-gradient(from 135deg at right,#0000 25%,#000 0) right/6px 7px repeat-y;',
    'mask:linear-gradient(#000,#000) center/calc(100% - 12px) 100% no-repeat,conic-gradient(from -45deg at left,#0000 25%,#000 0) left/6px 7px repeat-y,conic-gradient(from 135deg at right,#0000 25%,#000 0) right/6px 7px repeat-y;}',
    '.rm-strip:nth-child(odd){transform:rotate(-1.5deg);} .rm-strip:nth-child(even){transform:rotate(1.2deg);}',
    '.rm-strip .d{font-size:18px;font-weight:600;color:#5B4E36;}',
    '.en-rm-btn{display:flex;align-items:center;gap:10px;justify-content:center;width:100%;min-height:44px;margin:10px 0 0;padding:6px 10px;border:0;background:none;font:inherit;color:inherit;cursor:pointer;}',
    '.en-rm-btn p{font-family:var(--serif);font-style:italic;font-size:16px;line-height:1.3;text-align:left;}',
    '.en-rm-btn .rm-svg{transform:rotate(-14deg);flex:none;}',
    /* Previously on Closed Caption */
    '#prev{position:fixed;inset:0;z-index:771;display:none;overflow-y:auto;background:#14100D;color:#F3EBDD;}',
    '#prev.on{display:block;animation:enFade .4s ease-out;}',
    '.pv-in{min-height:100%;max-width:420px;margin:0 auto;padding:calc(22px + var(--sat,0px)) 18px calc(24px + var(--sab,0px));display:flex;flex-direction:column;justify-content:center;}',
    '.pv-eye{font-size:12px;font-weight:900;letter-spacing:.3em;text-transform:uppercase;color:#B9AE9C;text-align:center;}',
    '.pv-t{font-family:var(--serif);font-weight:700;font-size:38px;line-height:1.05;text-align:center;margin:2px 0 18px;color:#FFF8EA;}',
    '.pv-b{opacity:0;animation:enFade .55s ease-out both;}',
    '.pv-row{display:flex;align-items:center;gap:14px;margin:0 0 16px;}',
    '.pv-row p{font-family:var(--serif);font-weight:400;font-size:19px;line-height:1.35;}',
    '.pv-row b{font-weight:700;}',
    '.pv-thumb{flex:none;width:104px;background:#fff;padding:4px;transform:rotate(-2deg);box-shadow:0 8px 20px rgba(0,0,0,.5);}',
    '.pv-thumb img{display:block;width:100%;max-height:120px;object-fit:contain;background:#fff;}',
    '.pv-q{font-style:italic;font-size:17px !important;}',
    '.pv-by{font-family:var(--sans) !important;font-size:13px !important;font-weight:800;letter-spacing:.04em;color:#B9AE9C;margin-top:4px;}',
    '.pv-kick{font-family:var(--serif) !important;font-style:italic;font-size:16px !important;color:#CFC4B2;margin-top:4px;}',
    '.pv-grudge{font-family:var(--serif);font-weight:400;font-size:21px;line-height:1.4;margin:6px 0 0;color:#FFF8EA;}',
    '.pv-re{font-family:var(--serif);font-weight:700;font-size:26px;text-align:center;margin-top:24px;color:var(--yellow,#FFD23F);}',
    '.pv-skip{display:block;margin:18px auto 0;min-height:44px;padding:0 16px;border:0;background:none;color:#B9AE9C;font:inherit;font-size:14px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer;}',
    /* R18 the standings, read from the bottom; the top two */
    '.en-st{text-align:center;}',
    '.en-place{font-family:var(--serif);font-style:italic;font-weight:400;font-size:22px;color:var(--ink-2,#4A433D);margin-top:6px;}',
    '.en-st .en-name{margin-top:2px;}',
    '.en-read{list-style:none;margin:22px auto 0;padding:0;max-width:320px;text-align:left;border-top:2px solid ' + INK + ';}',
    '.en-read li{display:flex;align-items:center;gap:8px;padding:5px 2px;font-size:15px;font-weight:800;border-bottom:1.5px dashed var(--line,#E6DCC8);}',
    '.en-read .pl{min-width:34px;font-family:var(--serif);font-style:italic;font-weight:400;color:var(--ink-2,#4A433D);}',
    '.en-read .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.en-read .pt{font-family:var(--serif);font-weight:700;}',
    '.en-top{display:flex;justify-content:center;gap:18px;margin:18px 0 6px;flex-wrap:wrap;}',
    '.en-top .t{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0;max-width:46%;}',
    '.en-top .t b{font-family:var(--serif);font-weight:700;font-size:30px;line-height:1.05;overflow-wrap:anywhere;}',
    '.en-top-l{font-family:var(--serif);font-style:italic;font-weight:400;font-size:17px;color:var(--ink-2,#4A433D);margin-top:12px;}',
    '.en-abs{display:inline-block;margin-left:8px;padding:1px 8px;border:1.5px solid #B9AE9C;border-radius:999px;font-size:12px;letter-spacing:.12em;}',
    '.en-cl .ab{font-style:italic;font-weight:400;color:#B9AE9C;font-size:14px;margin-left:6px;}',
    /* R18 the sealed scoreboard */
    '.sl-card{margin:8px 0 16px;padding:22px 16px 20px;text-align:center;border:var(--bw,2.5px) dashed ' + INK + ';border-radius:var(--r-lg,18px);background:var(--card,#fff);}',
    '.sl-h{font-family:var(--serif);font-weight:700;font-size:26px;line-height:1.15;margin:8px 0 4px;}',
    '.sl-p{font-family:var(--serif);font-weight:400;font-size:16px;color:var(--ink-2,#4A433D);}',
    '.sl-mine{margin:16px auto 0;max-width:320px;text-align:left;border-top:2px solid ' + INK + ';padding-top:10px;}',
    '.sl-mine .big{font-family:var(--serif);font-weight:700;font-size:22px;}',
    '.sl-mine ul{list-style:none;margin:6px 0 0;padding:0;font-size:15px;font-weight:800;line-height:1.5;}',
    /* R30 the Last Call card */
    '#lastcall{position:fixed;inset:0;z-index:772;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(20,16,13,.92);color:#FFF8EA;text-align:center;}',
    '#lastcall.on{display:flex;animation:enFade .35s ease-out;}',
    '#lastcall p{font-family:var(--serif);font-weight:700;font-size:30px;line-height:1.2;max-width:340px;}',
    /* R28 heading out: your own credit */
    '#mycredit{position:fixed;inset:0;z-index:795;display:none;overflow-y:auto;background:#14100D;color:#F3EBDD;}',
    '#mycredit.on{display:block;animation:enFade .4s ease-out;}',
    '#mycredit .en-foot{position:static;margin-top:22px;padding:0;background:none;gap:10px;}',
    '#mycredit .en-foot .btn{flex:1;}',
    '@media (prefers-reduced-motion: reduce){#ending *,#prev *{animation-duration:.01s !important;transition-duration:.01s !important;}}',
  ].join('\n');
  try { var st = document.createElement('style'); st.id = 'cc-ending-css'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); } catch (e) {}

  /* ── small helpers ── */
  function E(s) { try { return esc(s); } catch (e) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); } }
  function S() { try { return typeof state !== 'undefined' ? state : null; } catch (e) { return null; } }
  function me() { try { return myPlayerId; } catch (e) { return null; } }
  function now() { try { return Date.now() + (clockOffset || 0); } catch (e) { return Date.now(); } }
  function reduced() { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function run() { try { return canRun(); } catch (e) { return false; } }
  function snd(fn) { try { big(fn); } catch (e) {} }
  function vib(p) { try { buzz(p); } catch (e) {} }
  function say(t) { try { srSay(t); } catch (e) {} }
  function rating(n) { try { return fmtRating(n); } catch (e) { return String(n); } }
  function chip(id, cls) { try { return chipHtml(id, cls || 'xs'); } catch (e) { return ''; } }
  function first(n) { try { return firstName(n); } catch (e) { return String(n || '').split(' ')[0]; } }
  function names(a) { a = (a || []).filter(Boolean); return a.length <= 1 ? (a[0] || '') : a.length === 2 ? a[0] + ' and ' + a[1] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  var NUMS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  function cap1(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  function day(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? (+m[2]) + '/' + (+m[3]) + '/' + m[1].slice(2) : ''; }
  function longDay(d) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return ''; try { return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { return d; } }

  /* ═════════════ The Remote, in ink ═════════════
     A chunky 1980s TV remote: one button, CC; the battery cover held on with masking tape (a strip per winner). */
  function tapeD(x, y, w, h) {   // a strip with torn ends
    var z = 'M' + x + ' ' + y, k, n = Math.max(3, Math.round(h / 3.2)), s = h / n;
    z += ' H' + (x + w);
    for (k = 1; k <= n; k++) z += ' L' + (x + w + (k % 2 ? -2.6 : 0.6)) + ' ' + (y + k * s).toFixed(1);
    z += ' H' + x;
    for (k = n - 1; k >= 0; k--) z += ' L' + (x + (k % 2 ? 2.6 : -0.6)) + ' ' + (y + k * s).toFixed(1);
    return z + ' Z';
  }
  // opts: { w: width in px, strips: [names] (newest last; the newest is on top), label: true to write names on the tape }
  function remoteSvg(opts) {
    opts = opts || {};
    var w = opts.w || 40, h = Math.round(w * 2.5);
    var strips = (opts.strips || []).slice(-4), lbl = !!opts.label;
    var tape = '';
    var y0 = 150, sh = strips.length > 2 ? 12 : 15;
    if (!strips.length) strips = [''];
    strips.forEach(function (n, i) {
      var y = y0 + i * (sh + 2) - (strips.length - 1) * 4, rot = (i % 2 ? 4 : -5) + (i * 1.3);
      tape += '<g transform="rotate(' + rot.toFixed(1) + ' 40 ' + (y + sh / 2) + ')"><path d="' + tapeD(3, y, 74, sh) + '" fill="#E7DAB1" fill-opacity=".96" stroke="#B4A372" stroke-width=".9"/>' +
        (lbl && n ? '<text x="40" y="' + (y + sh * 0.76).toFixed(1) + '" text-anchor="middle" font-family="Caveat,Bradley Hand,cursive" font-weight="700" font-size="' + (sh * 0.95).toFixed(1) + '" fill="#2E2619">' + E(String(n).slice(0, 14)) + '</text>' : '') + '</g>';
    });
    // A boxy 1980s remote: a wedge at the top for the infrared window, dark plastic, a brushed face plate, one button
    var body = 'M13 24 L21 7 H59 L67 24 L68.5 187 Q68.5 195 60.5 195 H19.5 Q11.5 195 11.5 187 Z';
    var brush = ''; for (var yb = 33; yb < 118; yb += 5) brush += 'M22 ' + yb + ' H58 ';
    return '<svg class="rm-svg" viewBox="0 0 80 200" width="' + w + '" height="' + h + '" aria-hidden="true" focusable="false">' +
      '<path d="' + body + '" fill="' + INK + '" opacity=".16" transform="translate(4 4)"/>' +
      '<path d="' + body + '" fill="#5E5650" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M16.5 26 L17.6 184" fill="none" stroke="#8D847A" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M22.5 9.5 H57.5 L64 23 H16 Z" fill="#2A2420" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M27 13 H44" stroke="#7A3B33" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>' +
      '<rect x="19" y="29" width="42" height="92" rx="4" fill="#DCD6CB" stroke="' + INK + '" stroke-width="1.8"/>' +
      '<path d="' + brush + '" stroke="#C9C2B5" stroke-width=".8"/>' +
      '<circle cx="40" cy="63" r="16.5" fill="#F6F2EA" stroke="' + INK + '" stroke-width="2.8"/>' +
      '<circle cx="40" cy="63" r="12.2" fill="none" stroke="#BFB7AA" stroke-width="1.8"/>' +
      '<text x="40" y="68.6" text-anchor="middle" font-family="Georgia,\'Libre Caslon Text\',serif" font-weight="700" font-size="15" fill="' + INK + '">CC</text>' +
      '<path d="M28 95 H52 M28 101 H52 M28 107 H52" stroke="#8F877C" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="40" cy="38" r="1.8" fill="#7A3B33"/>' +
      '<path d="M17 134 H63 M17 134 L17.6 182 Q17.8 188 24 188 H56 Q62.2 188 62.4 182 L63 134" fill="none" stroke="#2A2420" stroke-width="1.8" opacity=".8"/>' +
      tape + '</svg>';
  }
  // A small chimp in ink, on a paper roundel (it sits on the dark of the credits), holding up a dart like a pro
  function chimpSvg(w) {
    w = w || 64;
    var s = 'stroke="' + INK + '" stroke-linecap="round" stroke-linejoin="round"', fur = '#C9C1B4', face = '#F4EFE6';
    return '<svg viewBox="0 0 104 100" width="' + w + '" height="' + Math.round(w * 100 / 104) + '" aria-hidden="true" focusable="false" style="overflow:visible">' +
      '<circle cx="52" cy="50" r="51" fill="#F3EBDD"/>' +
      // body and the arm raised to throw
      '<path d="M28 70 Q22 92 31 99 H63 Q71 92 66 70" fill="' + fur + '" ' + s + ' stroke-width="2.6"/>' +
      '<path d="M38 84 Q47 90 56 84" fill="none" ' + s + ' stroke-width="1.8" opacity=".55"/>' +
      '<path d="M62 72 Q90 68 83 32" fill="none" ' + s + ' stroke-width="10"/><path d="M62 72 Q90 68 83 32" fill="none" stroke="' + fur + '" stroke-width="5.4" stroke-linecap="round"/>' +
      // ears, head, face
      '<circle cx="24" cy="47" r="9" fill="' + face + '" ' + s + ' stroke-width="2.6"/><circle cx="24" cy="47" r="4.2" fill="none" ' + s + ' stroke-width="1.5" opacity=".55"/>' +
      '<circle cx="70" cy="47" r="9" fill="' + face + '" ' + s + ' stroke-width="2.6"/><circle cx="70" cy="47" r="4.2" fill="none" ' + s + ' stroke-width="1.5" opacity=".55"/>' +
      '<path d="M47 24 Q69 24 69 46 Q69 68 47 69 Q25 68 25 46 Q25 24 47 24 Z" fill="' + fur + '" ' + s + ' stroke-width="2.6"/>' +
      '<path d="M31 48 Q30 36 40 36 Q44 36 47 38.5 Q50 36 54 36 Q64 36 63 48 Q65 64 47 66 Q29 64 31 48 Z" fill="' + face + '" ' + s + ' stroke-width="2"/>' +
      '<path d="M34 41 Q39.5 37.5 45 40.5 M49 40.5 Q54.5 37.5 60 41" fill="none" ' + s + ' stroke-width="2.2"/>' +
      '<circle cx="40.5" cy="45" r="2.3" fill="' + INK + '"/><circle cx="53.5" cy="45" r="2.3" fill="' + INK + '"/>' +
      '<circle cx="45" cy="53.5" r="1.2" fill="' + INK + '"/><circle cx="49.5" cy="53.5" r="1.2" fill="' + INK + '"/>' +
      '<path d="M38 59 Q47 64 57 57" fill="none" ' + s + ' stroke-width="2.2"/>' +
      // the dart: flights, shaft, barrel, point (held by the hand, pointing at the board)
      '<path d="M79.1 27.8 L69.3 25.8 L70.5 30.1 Z M79.1 27.8 L71.7 34.4 L70.5 30.1 Z" fill="#fff" ' + s + ' stroke-width="1.5"/>' +
      '<path d="M70.5 30.1 L81 27.3" fill="none" ' + s + ' stroke-width="1.6"/>' +
      '<path d="M81 27.3 L89 25.1" fill="none" ' + s + ' stroke-width="3.6"/><path d="M89 25.1 L94.5 23.6" fill="none" ' + s + ' stroke-width="1.3"/>' +
      '<circle cx="82.5" cy="28.5" r="5" fill="' + face + '" ' + s + ' stroke-width="2"/>' +
      '</svg>';
  }

  /* ═════════════ Table records (cc_tables) ═════════════ */
  var KEY = 'cc_tables';
  function tablesGet() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(function (r) { return r && typeof r.id === 'string' && Array.isArray(r.names); }) : []; } catch (e) { return []; } }
  function tablesSave(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12))); } catch (e) {} }
  var savedFor = null;
  function saveTable(rec) {
    if (!rec || !rec.id) return;
    var k = rec.id + '|' + rec.at + '|' + (rec.last && rec.last.coton ? 1 : 0);
    if (savedFor === k) return;
    savedFor = k;
    var list = tablesGet(), i = -1;
    for (var j = 0; j < list.length; j++) if (list[j].id === rec.id) i = j;
    if (i >= 0 && list[i].at > rec.at) return;   // this phone already has a newer night at this table
    if (i >= 0) list.splice(i, 1);
    list.unshift(rec);
    list.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    tablesSave(list);
  }
  function normN(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function overlap(names, rec) { var set = {}; (rec.names || []).forEach(function (n) { set[normN(n)] = 1; }); return names.filter(function (n) { return set[normN(n)]; }).length; }
  // In the lobby: send the server the records that look like this table (the server decides which fits best)
  var sentFor = null;
  function sendTables() {
    var s = S(); if (!s || s.phase !== 'lobby' || !me()) return;
    var here = (s.players || []).map(function (p) { return p.name; });
    var list = tablesGet().filter(function (r) { return overlap(here, r) >= 2; }).slice(0, 3);
    var k = s.code + '|' + me() + '|' + here.map(normN).sort().join(',') + '|' + list.map(function (r) { return r.id + r.at; }).join(',');
    if (k === sentFor) return;
    sentFor = k;
    if (!list.length) return;
    try { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ action: 'tables', list: list })); else sentFor = null; } catch (e) { sentFor = null; }
  }
  // The lines the table was shown go on this phone's list (so no phone hears the same line twice)
  var notedFor = {};
  function noteSeen(tag, keys) {
    if (!keys || !keys.length || notedFor[tag]) return;
    notedFor[tag] = 1;
    try { var c = careerGet(); if (addSeenLines(c, keys)) { careerSave(c); sendCareer(); } } catch (e) {}
  }

  /* ═════════════ The ending overlay ═════════════ */
  var ov = null, timer = null, shown = null, local = null;
  function el() { ov = document.getElementById('ending'); if (!ov) { ov = document.createElement('div'); ov.id = 'ending'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'The end of the night'); document.body.appendChild(ov); } return ov; }
  function close() { clearTimeout(timer); timer = null; shown = null; if (ov) { ov.className = ''; ov.innerHTML = ''; ov.onclick = null; } }
  function beatNow(e, t) {
    var i = Math.max(0, Math.min(e.step || 0, e.beats.length - 1)), at = e.stepAt || e.at;
    while (i < e.beats.length - 1 && e.beats[i].ms && t >= at + e.beats[i].ms) { at += e.beats[i].ms; i++; }
    return { i: i, start: at };
  }
  function current() {
    var s = S();
    if (local) return local.e;
    return s && s.phase === 'scores' && s.gameOver && s.ending && !s.ending.done ? s.ending : null;
  }
  function sync() {
    var s = S();
    if (s && s.phase === 'scores' && s.gameOver && s.ending) {
      if (s.ending.table) saveTable(s.ending.table);
      noteSeen('e|' + s.ending.gameId, s.ending.keys);
    }
    var e = current();
    if (!e) { if (ov && ov.className) close(); return; }
    var c = beatNow(e, now()), b = e.beats[c.i];
    var key = (local ? 'L' : '') + e.gameId + '|' + c.i + '|' + c.start + '|' + (run() ? 1 : 0);
    if (key !== shown) { shown = key; draw(e, c, b); }
    clearTimeout(timer); timer = null;
    if (b.ms) timer = setTimeout(sync, Math.max(60, c.start + b.ms - now() + 40));
  }
  function next(i) {
    if (local) {
      var e = local.e, c = beatNow(e, now());
      if (e.beats[c.i].k === 'cast') { local = null; close(); try { render(true); } catch (x) {} return; }
      e.step = c.i + 1; e.stepAt = now(); sync(); return;
    }
    vib(15);
    try { send({ action: 'ending_next', beat: i }); } catch (x) {}
  }
  function footHtml(e, c, b, last) {
    var left = b.ms ? Math.max(0, c.start + b.ms - now()) : 0, gone = b.ms ? b.ms - left : 0;
    var bar = b.ms ? '<div class="en-bar" aria-hidden="true"><i style="animation-duration:' + b.ms + 'ms;animation-delay:-' + gone + 'ms"></i></div>' : '';
    if (last) {
      var s = S(), fr = s && s.framedTonight;
      if (local) return '<div class="en-foot"><button class="btn btn-yellow en-go" onclick="Ending.next(' + c.i + ')">Done</button></div>';
      if (run()) return '<div class="en-foot"><button class="btn btn-yellow en-go" onclick="Ending.next(' + c.i + ')">' + (fr && !(s.finale) ? 'Caption of the Night →' : 'Final scores →') + '</button></div>';
      var who = s ? first(s.dealerName || nameOfId(s.hostId)) : '';
      return '<div class="en-foot"><p class="en-who">' + E(who) + ' moves things along<span class="dots"></span></p></div>';
    }
    return '<div class="en-foot">' + bar + (run() || local ? '<button class="en-next" onclick="event.stopPropagation(); Ending.next(' + c.i + ')">Next →</button>' : '') + '</div>';
  }
  function nameOfId(id) { try { return nameOf(id); } catch (e) { return ''; } }
  function draw(e, c, b) {
    var o = el(), s = S(), fresh = !o.className;
    var dark = b.k === 'credit' || b.k === 'cast';
    o.className = 'on ' + (dark ? 'dark' : 'paper');
    var html = '';
    if (b.k === 'stand') html = standHtml(e, b);
    else if (b.k === 'top') html = topHtml(e, b);
    else if (b.k === 'winner') html = winnerHtml(e);
    else if (b.k === 'awards') html = awardsHtml(e);
    else if (b.k === 'credit') html = creditHtml(e, b, c);
    else html = castHtml(e);
    o.innerHTML = '<div class="en-in">' + html + '</div>' + footHtml(e, c, b, b.k === 'cast');
    o.scrollTop = 0;
    o.onclick = function (ev) { if ((run() || local) && b.k !== 'cast' && !(ev.target.closest && ev.target.closest('button'))) next(c.i); };
    if (b.k === 'credit') freeze(c);
    sound(b.k, fresh);
    try { var f = o.querySelector('.en-in'); if (f && f.focus) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); } } catch (x) {}
  }
  function sound(k, fresh) {
    if (k === 'winner') { snd(function () { tone(784, 0.2, 0, 'triangle', 0.05); tone(1047, 0.35, 120, 'triangle', 0.045); }); vib([60, 40, 120]); }
    else if (k === 'awards') snd(function () { noise(0.3, 0, 0.18, 1800); tone(880, 0.25, 0, 'sine', 0.04, 260); });
    else if (k === 'credit') snd(function () { noise(0.04, 520, 0.3, 3800, 'highpass'); tone(2400, 0.02, 520, 'square', 0.02); });   // the shutter, on the freeze
    else if (k === 'stand') snd(function () { tone(392, 0.12, 0, 'triangle', 0.035); });
    else if (k === 'top') snd(function () { noise(0.6, 0, 0.06, 700, 'lowpass'); tone(196, 1.2, 0, 'sine', 0.05); tone(247, 1.2, 0, 'sine', 0.035); });
    else if (k === 'cast') snd(function () { [392, 494, 587, 784].forEach(function (f, i) { tone(f, 0.9, i * 90, 'sine', 0.035); }); });
  }

  /* 1. The winner, the Remote, the ratings */
  function winnerHtml(e) {
    var s = S(), stn = s.standing || {};
    var won = (stn.winners && stn.winners.length ? stn.winners : []).map(function (id) { return (s.players || []).find(function (p) { return p.id === id; }); }).filter(Boolean);
    if (!won.length) { var top = Math.max.apply(null, s.players.map(function (p) { return p.score; })); won = s.players.filter(function (p) { return p.score === top; }); }
    var nm = names(won.map(function (p) { return p.name; }));
    var why = ''; try { why = tieWhyLine(stn); } catch (x) {}
    var sz = nm.length > 16 ? ' small' : nm.length > 9 ? ' mid' : '';
    var rm = e.remote ? '<div class="en-rm en-fade" style="animation-delay:.6s">' + remoteSvg({ w: 44, strips: e.remote.tape.slice(-2).map(function (t) { return t.n; }) }) + '<p>' + E(e.remote.line) + '</p></div>' : '';
    var rates = (e.ratings || []).map(function (r) {
      var d = r.delta > 0 ? '+' + r.delta : r.delta < 0 ? '−' + Math.abs(r.delta) : '±0';
      return '<div class="en-rate' + (r.id === me() ? ' me' : '') + '">' + chip(r.id) + '<span class="nm">' + E(nameOfId(r.id)) + '</span><span class="rt">' + rating(r.after) + '</span><span class="d ' + (r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : '') + '">' + d + '</span></div>';
    }).join('');
    return '<div class="en-win" aria-live="polite">' +
      '<div class="en-ic">' + (typeof inkIcon === 'function' ? inkIcon('trophy', 46) : '') + '</div>' +
      '<p class="en-eye">' + (won.length > 1 ? 'It’s a tie' : 'Winner') + '</p>' +
      '<h2 class="en-name' + sz + '">' + E(nm) + '</h2>' +
      '<p class="en-pts">' + (won[0] ? plural(won[0].score, 'point') : '') + '</p>' + (why ? '<p class="en-why">' + why + '</p>' : '') + rm +
      (rates ? '<div class="en-rates en-fade" style="animation-delay:1.2s"><p class="en-eye" style="padding:4px 2px 2px">Ratings</p>' + rates + '</div>' + (e.short ? '<p class="en-short">Short game: ratings moved less.</p>' : '') : '') +
      '</div>';
  }
  /* R18 A sealed game: the standings, read from last place up, then the top two held together */
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function standHtml(e, b) {
    var sc = e.scores || {}, i = e.beats.indexOf(b);
    var read = e.beats.slice(0, i).filter(function (x) { return x.k === 'stand'; });
    var nm = nameOfId(b.id);
    var gone = (e.credits[b.id] || {}).absentia;
    var list = read.slice().reverse().map(function (x) { return '<li>' + '<span class="pl">' + ord(x.place) + '</span>' + chip(x.id) + '<span class="nm">' + E(nameOfId(x.id)) + '</span><span class="pt">' + (sc[x.id] || 0) + '</span></li>'; }).join('');
    return '<div class="en-st" aria-live="polite"><p class="en-eye">Unsealed, from the bottom</p>' +
      '<p class="en-place en-fade">' + (b.tied ? 'Tied for ' + ord(b.place) : ord(b.place)) + (gone ? ' · in absentia' : '') + '</p>' +
      '<h2 class="en-name en-fade' + (nm.length > 9 ? ' mid' : '') + '">' + E(nm) + '</h2>' +
      '<p class="en-pts en-fade" style="animation-delay:.25s">' + plural(sc[b.id] || 0, 'point') + '</p>' +
      (list ? '<ol class="en-read">' + list + '</ol>' : '') + '</div>';
  }
  function topHtml(e, b) {
    var ids = b.ids || [];
    return '<div class="en-st" aria-live="polite"><p class="en-eye">And at the top</p>' +
      '<div class="en-top">' + ids.map(function (id, k) { return '<div class="t en-fade" style="animation-delay:' + (0.2 + k * 0.5) + 's">' + chip(id, 'lg') + '<b>' + E(nameOfId(id)) + '</b></div>'; }).join('') + '</div>' +
      '<p class="en-top-l en-fade" style="animation-delay:1.4s">' + (ids.length > 2 ? 'One of them won. Possibly more.' : 'One of them won.') + '</p></div>';
  }
  /* 2. The one awards slide */
  function awardsHtml(e) {
    var rows = (e.awards || []).map(function (a, i) {
      return '<div class="en-awr en-fade" style="animation-delay:' + (0.15 + i * 0.35) + 's"><div class="en-awh"><span class="en-awt">' + E(a.title) + '</span><span class="en-aww">' + E(a.who) + '</span></div>' +
        (a.quote ? '<p class="en-awq">“' + E(a.quote) + '”</p>' : '') + '<p class="en-awl">' + E(a.line) + '</p></div>';
    }).join('');
    return '<div class="en-aw"><p class="en-eye" style="text-align:center">The awards</p><h2>Tonight</h2>' + rows + '</div>';
  }
  /* 3. A credit: the freeze-frame, the caption box, the epilogue, the verdict */
  function creditHtml(e, b, c) {
    var cr = (e.credits || {})[b.id] || {}, n = (e.beats || []).filter(function (x) { return x.k === 'credit'; }), k = n.indexOf(b) + 1;
    var nm = nameOfId(b.id) || (e.cast || []).filter(function (x) { return x.id === b.id; }).map(function (x) { return x.name; })[0] || '';
    var fz = cr.freeze, r = cr.rating;
    var frame = fz && fz.image ? '<figure class="en-frame" id="en-frame"><img src="/images/' + E(fz.image) + '" alt="' + E('Cartoon from round ' + fz.round) + '"><div class="en-flash" id="en-flash"></div><figcaption class="en-cc"><span id="en-cc" data-n="' + E(nm) + '">' + E(nm) + '</span></figcaption></figure>'
      : '<figure class="en-frame" id="en-frame" style="padding:28px 8px"><figcaption class="en-cc" style="position:static;transform:none;display:inline-block"><span id="en-cc" data-n="' + E(nm) + '">' + E(nm) + '</span></figcaption></figure>';
    var d = r ? (r.delta > 0 ? '+' + r.delta : r.delta < 0 ? '−' + Math.abs(r.delta) : '±0') : '';
    var rt = r ? '<b>' + rating(r.after) + ' (' + d + ')' + (r.newTitle ? ' · ' + E(r.newTitle) + ', new' : r.title ? ' · ' + E(r.title) : '') + '.</b> ' : '';
    return '<div class="en-credit">' +
      '<p class="en-eye en-count">' + k + ' of ' + n.length + (cr.absentia ? '<span class="en-abs">in absentia</span>' : '') + '</p>' + frame +
      (fz && fz.caption ? '<p class="en-cap en-fade" style="animation-delay:.7s">“' + E(fz.caption) + '”</p>' : '') +
      '<p class="en-epi en-fade" style="animation-delay:1s" aria-live="polite">' + E(cr.text || '') + '</p>' +
      (rt || cr.blurb ? '<p class="en-blurb en-fade" style="animation-delay:2.2s">' + rt + (cr.blurb ? '<i>“' + E(cr.blurb) + '”</i>' : '') + '</p>' : '') +
      '</div>';
  }
  // The freeze: the frame lands, holds, and stops (one soft flash, no strobe); the name types out like a caption
  function freeze(c) {
    var f = document.getElementById('en-frame'), fl = document.getElementById('en-flash'), cc = document.getElementById('en-cc');
    var late = now() - c.start;
    if (late > 1500 || reduced()) { if (f && f.animate && !reduced()) f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'both' }); return; }
    try {
      f.animate([{ opacity: 0, transform: 'translateY(18px) rotate(1.5deg) scale(1.05)' }, { opacity: 1, transform: 'translateY(0) rotate(-0.4deg) scale(1.03)', offset: 0.75 }, { opacity: 1, transform: 'rotate(-1.2deg) scale(1)' }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
      if (fl) setTimeout(function () { try { fl.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'both' }); } catch (x) {} }, 520);
      if (cc) { var full = cc.getAttribute('data-n') || ''; cc.textContent = ''; for (var i = 1; i <= full.length; i++) (function (j) { setTimeout(function () { cc.textContent = full.slice(0, j); }, 560 + j * 45); })(i); }
    } catch (x) {}
  }
  /* 4. The cast, and the monkey */
  // R10 the table vs. the cartoonist (the round's blind laughs): tonight's score, and the table's best to beat
  function vsLine(e) {
    var v = e && e.vs; if (!v || !(v.table + v.cartoonist > 0)) return null;
    var line = 'The table ' + v.table + ', the cartoonist ' + v.cartoonist + '.';
    if (v.record) line += ' A new best for this table.';
    else if (v.best) line += ' This table’s best: ' + v.best.table + ' to ' + v.best.cartoonist + '.';
    return line;
  }
  function castHtml(e) {
    var rows = (e.cast || []).map(function (p, i) { return '<li style="animation-delay:' + (0.1 + i * 0.12) + 's"><span class="n">' + E(p.name) + (p.absentia ? '<span class="ab">(in absentia)</span>' : '') + '</span><span class="lead" aria-hidden="true"></span><span class="r">' + E(p.role) + '</span></li>'; }).join('');
    if (e.monkey) rows += '<li class="mk" style="animation-delay:' + (0.1 + (e.cast || []).length * 0.12) + 's"><span class="n">The monkey</span><span class="lead" aria-hidden="true"></span><span class="r">Himself</span></li>';
    var vs = vsLine(e);
    return '<div class="en-cast"><h2>Cast</h2><ol class="en-cl">' + rows + '</ol>' +
      (e.monkey ? '<div class="en-monkey" style="animation-delay:' + (0.6 + (e.cast || []).length * 0.12) + 's">' + chimpSvg(76) + '<p>' + E(e.monkey.text) + '</p></div>' : '') +
      (vs ? '<p class="en-vs">' + E(vs) + '</p>' : '') + '</div>';
  }

  /* ── The final page, after the ending: the Remote's line (tap it to read the tape) and a replay ── */
  function remoteLineHtml() {
    var s = S(), e = s && s.ending; if (!e || !e.remote) return '';
    return '<button class="en-rm-btn" onclick="Ending.openRemote()" aria-label="The Remote. ' + E(e.remote.line) + ' Read the tape.">' + remoteSvg({ w: 26, strips: e.remote.tape.slice(-1).map(function (t) { return t.n; }) }) + '<p>' + E(e.remote.line) + '</p></button>';
  }
  function replay() {
    var s = S(); if (!s || !s.ending) return;
    var e = JSON.parse(JSON.stringify(s.ending));
    e.step = 0; e.stepAt = now(); e.done = false; e.gameId = 'replay-' + e.gameId;
    local = { e: e }; shown = null; sync();
  }

  /* ═════════════ The Remote, in the lobby and in its own sheet ═════════════ */
  function streakWord(n) { return n >= 2 ? cap1(NUMS[n] || String(n)) + ' straight.' : ''; }
  function lobbyHtml() {
    var s = S(), r = s && s.remote; if (!r || !r.holder || !r.holder.length) return '';
    var who = names(r.holder.map(first)), one = r.holder.length === 1;
    var line = one ? who + ' has the Remote.' : who + ' share the Remote.';
    var sub = !r.present ? (one ? first(r.holder[0]) + ' isn’t here to defend it.' : 'Neither is here to defend it.') : streakWord(r.streak);
    return '<button class="rm-lobby" onclick="Ending.openRemote()" aria-label="' + E(line + ' ' + sub + ' Read the tape.') + '">' + remoteSvg({ w: 22, strips: (r.tape || []).slice(-1).map(function (t) { return t.n; }) }) +
      '<span class="rm-t"><b>' + E(line) + '</b>' + (sub ? '<span>' + E(sub) + '</span>' : '') + '</span><span class="rm-go">Read the tape</span></button>';
  }
  function openRemote() {
    var s = S(); if (!s) return;
    var t = s.ending && s.ending.table, iso = function (ms) { try { return new Date(ms).toLocaleDateString('en-CA'); } catch (x) { return null; } };
    var r = s.phase === 'lobby' ? s.remote : s.ending && s.ending.remote ? { holder: s.ending.remote.after, tape: s.ending.remote.tape, streak: s.ending.remote.streak, games: t ? t.games : null, since: t && t.first && t.first.at ? iso(t.first.at) : null } : null;
    if (!r) return;
    var tape = (r.tape || []).slice().reverse();
    var strips = tape.map(function (t) { return '<div class="rm-strip"><span>' + E(t.n) + '</span><span class="d">' + E(day(t.d)) + '</span></div>'; }).join('');
    var since = r.since ? 'This table since ' + longDay(r.since) + '. ' : '';
    var games = r.games ? (r.games === 1 ? 'One game.' : (NUMS[r.games] ? cap1(NUMS[r.games]) : r.games) + ' games.') : '';
    var body = '<div class="grip"></div><div class="rm-sheet"><p class="eyebrow center">This table’s trophy</p><h3 class="rm-h">The Remote</h3>' +
      '<div class="rm-big">' + remoteSvg({ w: 108, strips: (r.tape || []).slice(-4).map(function (t) { return first(t.n); }), label: true }) + '</div>' +
      '<p class="rm-p">The last winner at this table holds it. Every winner adds a strip of masking tape.</p>' +
      '<div class="rm-tape" role="list" aria-label="The tape, newest first">' + strips.replace(/<div class="rm-strip">/g, '<div class="rm-strip" role="listitem">') + '</div>' +
      ((since || games) ? '<p class="rm-p small">' + E(since + games) + '</p>' : '') + '</div>' +
      '<button class="btn btn-ink" style="margin-top:12px;" onclick="closeMenu()">Close</button>';
    try { document.getElementById('sheet-body').innerHTML = body; document.getElementById('sheet').classList.add('on'); } catch (x) {}
  }

  /* ═════════════ Previously on Closed Caption ═════════════ */
  var pvShown = null, pvT = null;
  function closePrev() { clearTimeout(pvT); var o = document.getElementById('prev'); if (o) { o.className = ''; o.innerHTML = ''; } }
  function syncPrev() {
    var s = S(), p = s && s.phase === 'writing' && s.round === 1 ? s.previously : null;
    var o = document.getElementById('prev');
    if (!p) { if (o && o.className) closePrev(); return false; }
    var tag = s.code + '|' + p.at;
    if (pvShown === tag) return true;
    pvShown = tag;
    var left = p.at + p.ms - now();
    noteSeen('p|' + tag, p.keys);
    if (left < 1500) return true;   // walked in late: straight to the cartoon
    if (!o) { o = document.createElement('div'); o.id = 'prev'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Previously on Closed Caption'); document.body.appendChild(o); }
    var t = 0.35, step = function (d) { var x = t; t += d; return 'style="animation-delay:' + x.toFixed(2) + 's"'; };
    var h = '<div class="pv-in" onclick="Ending.closePrev()"><p class="pv-eye">Previously on</p><h2 class="pv-t">Closed Caption</h2>';
    if (p.winners && p.winners.length) h += '<div class="pv-row pv-b" ' + step(1.1) + '>' + remoteSvg({ w: 30, strips: [p.winners[0]] }) + '<p>Last time, <b>' + E(names(p.winners.map(first))) + '</b> ' + (p.winners.length > 1 ? 'tied for first.' : 'won.') + '</p></div>';
    if (p.coton) h += '<div class="pv-row pv-b" ' + step(1.6) + '><div class="pv-thumb"><img src="/images/' + E(p.coton.image) + '" alt="Last time’s Caption of the Night, on its cartoon"></div><div><p class="pv-q">“' + E(p.coton.caption) + '”</p><p class="pv-by">Caption of the Night · ' + E(p.coton.writer || '') + '</p></div></div>';
    if (p.anniv) h += '<div class="pv-row pv-b" ' + step(1.6) + '><div class="pv-thumb"><img src="/images/' + E(p.anniv.image) + '" alt="This table’s first cartoon"></div><div><p>' + (p.anniv.years === 1 ? 'One year ago' : cap1(NUMS[p.anniv.years] || String(p.anniv.years)) + ' years ago') + ', this table played its first cartoon.</p><p class="pv-kick">It has not gotten easier.</p></div></div>';
    if (p.grudge && p.grudge.text) h += '<p class="pv-grudge pv-b" ' + step(2.6) + '>' + E(p.grudge.text) + '</p>';
    var reAt = Math.max(t, (p.ms / 1000) - 3.2);
    h += '<p class="pv-re pv-b" style="animation-delay:' + reAt.toFixed(2) + 's">And now, the rematch.</p><button class="pv-skip pv-b" style="animation-delay:' + (reAt + 0.4).toFixed(2) + 's" onclick="event.stopPropagation(); Ending.closePrev()">To the cartoon</button></div>';
    o.innerHTML = h; o.className = 'on';
    // a phone that opens it partway through starts partway through
    var gone = Math.max(0, p.ms - left) / 1000;
    if (gone > 0.2) o.querySelectorAll('.pv-b').forEach(function (b) { var d = parseFloat(b.style.animationDelay) || 0; b.style.animationDelay = Math.max(0, d - gone).toFixed(2) + 's'; });
    say('Previously on Closed Caption. ' + (p.winners && p.winners.length ? 'Last time, ' + names(p.winners) + ' won. ' : '') + (p.grudge ? p.grudge.text + ' ' : '') + 'And now, the rematch.');
    snd(function () { noise(0.5, 0, 0.08, 900, 'lowpass'); tone(196, 0.6, 0, 'sine', 0.05); tone(294, 0.8, 250, 'sine', 0.04); });
    clearTimeout(pvT); pvT = setTimeout(closePrev, left);
    return true;
  }

  /* ═════════════ R18 The sealed scoreboard ═════════════ */
  function sealedHtml() {
    var s = S(); if (!s || !s.sealed) return '';
    var mine = s.sealed.mine, why = ((s.roundScoreDetails || {})[me()] || []);
    var reasons = why.map(function (w) { return '<li>' + (w.pts > 0 ? '+' : '') + w.pts + ' ' + E(String(w.reason || '').replace(/^./, function (c) { return c.toLowerCase(); })) + '</li>'; }).join('');
    var wrote = mine === null || mine === undefined ? '' : '<div class="sl-mine"><p class="big">' + (mine > 0 ? 'You: +' + mine + ' this round.' : 'You: nothing this round.') + '</p>' + (reasons ? '<ul>' + reasons + '</ul>' : '') + '</div>';
    return '<div class="sl-card" role="status"><p class="eyebrow">The Late Edition</p><h2 class="sl-h">Scores are sealed until the end.</h2>' +
      '<p class="sl-p">' + (s.lastCall ? 'Last call. ' : '') + 'Every point counts double. The standings are read out at the finish, last place first.</p>' + wrote + '</div>';
  }

  /* ═════════════ R30 Last Call: a one-line card on every phone ═════════════ */
  var lcShown = null, lcT = null;
  function tick() {
    var s = S(), L = s && s.lastCall;
    if (!L || !s.code) return;
    var tag = s.code + '|' + L.at;
    if (lcShown === tag) return;
    lcShown = tag;
    var left = L.at + 3600 - now();
    if (left < 600) return;
    var o = document.getElementById('lastcall');
    if (!o) { o = document.createElement('div'); o.id = 'lastcall'; o.setAttribute('role', 'status'); document.body.appendChild(o); }
    o.innerHTML = '<p>Last call. One more trip around.</p>'; o.className = 'on'; o.onclick = function () { o.className = ''; };
    say('Last call. One more trip around.');
    snd(function () { tone(523, 0.35, 0, 'triangle', 0.04); tone(392, 0.6, 220, 'triangle', 0.04); });
    clearTimeout(lcT); lcT = setTimeout(function () { o.className = ''; }, left);
  }

  /* ═════════════ The menu: Heading out (everyone), Last Call (the host) ═════════════ */
  function playing() { var s = S(); return !!s && s.phase !== 'lobby' && !(s.phase === 'scores' && s.gameOver); }
  function menuRows() {
    var s = S(); if (!playing()) return '';
    var lc = s.isHost && !s.lastCall && !s.late ? '<button class="menu-row" onclick="Ending.askLastCall()"><span class="ic">' + (typeof inkIcon === 'function' ? inkIcon('clock') : '') + '</span>Last call<span class="r">One more trip around</span></button>' : '';
    return lc + '<button class="menu-row" onclick="Ending.askHeadOut()"><span class="ic">' + (typeof inkIcon === 'function' ? inkIcon('door') : '') + '</span>Heading out<span class="r">Your credit, now</span></button>';
  }
  function askLastCall() {
    try { closeMenu(); } catch (x) {}
    if (!confirm('Last call? The next trip around the table is the last one, then the winner and the credits.')) return;
    try { send({ action: 'last_call' }); } catch (x) {}
  }
  function askHeadOut() {
    try { closeMenu(); } catch (x) {}
    if (!confirm('Heading out? Your end credit plays now, and your seat leaves the game. The table carries on without you.')) return;
    try { send({ action: 'head_out' }); } catch (x) {}
  }
  // The server's answer to 'head_out': this phone is out of the game; its own credit plays, to keep
  var mine = null;
  function showOwnCredit(d) {
    if (!d) return;
    mine = d;
    try { if (window.Voice) Voice.leave(); } catch (x) {}
    try { dropOutbox(); clearSession(); myPlayerId = null; gameCode = null; } catch (x) {}
    noteSeen('out|' + d.key, d.key ? [d.key] : []);
    var o = document.getElementById('mycredit');
    if (!o) { o = document.createElement('div'); o.id = 'mycredit'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Your end credit'); document.body.appendChild(o); }
    var fz = d.freeze;
    var frame = fz && fz.image ? '<figure class="en-frame" id="en-frame"><img src="/images/' + E(fz.image) + '" alt="' + E('Cartoon from round ' + fz.round) + '"><div class="en-flash" id="en-flash"></div><figcaption class="en-cc"><span id="en-cc" data-n="' + E(d.name) + '">' + E(d.name) + '</span></figcaption></figure>'
      : '<figure class="en-frame" id="en-frame" style="padding:28px 8px"><figcaption class="en-cc" style="position:static;transform:none;display:inline-block"><span id="en-cc" data-n="' + E(d.name) + '">' + E(d.name) + '</span></figcaption></figure>';
    o.innerHTML = '<div class="en-in"><div class="en-credit"><p class="en-eye en-count">Heading out</p>' + frame +
      (fz && fz.caption ? '<p class="en-cap en-fade" style="animation-delay:.7s">“' + E(fz.caption) + '”</p>' : '') +
      '<p class="en-epi en-fade" style="animation-delay:1s">' + E(d.text || '') + '</p>' +
      '<p class="en-blurb en-fade" style="animation-delay:2s"><i>The table will read it again at the end, in absentia.</i></p>' +
      '<div class="en-foot en-fade" style="animation-delay:2.4s"><button class="btn" onclick="Ending.saveCredit()">Save the card</button><button class="btn btn-yellow" onclick="Ending.closeOwnCredit()">Done</button></div></div></div>';
    o.className = 'on';
    freeze({ start: now() });
    say(d.text || '');
    snd(function () { noise(0.04, 520, 0.3, 3800, 'highpass'); tone(2400, 0.02, 520, 'square', 0.02); });
  }
  function closeOwnCredit() {
    var o = document.getElementById('mycredit'); if (o) { o.className = ''; o.innerHTML = ''; }
    try { state = null; lastPhase = null; showScreen('screen-home'); } catch (x) {}
  }

  /* ═════════════ Save the card: a credit as a picture (1080 × 1350) ═════════════ */
  function loadImg(src) { return new Promise(function (res) { if (!src) return res(null); var i = new Image(), done = false, fin = function (v) { if (!done) { done = true; res(v); } }; i.onload = function () { fin(i.naturalWidth ? i : null); }; i.onerror = function () { fin(null); }; setTimeout(function () { fin(null); }, 6000); i.src = src; }); }
  function wrap(ctx, text, maxW) { var words = String(text || '').split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function creditCard(d) {
    var W2 = 1080, H2 = 1350, c = document.createElement('canvas'); c.width = W2; c.height = H2;
    var ctx = c.getContext('2d'), serif = "'Libre Caslon Text', Georgia, serif";
    return Promise.all([loadImg(d.freeze && d.freeze.image ? '/images/' + d.freeze.image : null), document.fonts && document.fonts.load ? Promise.race([Promise.all(["400 40px 'Libre Caslon Text'", "italic 400 30px 'Libre Caslon Text'", "700 40px 'Libre Caslon Text'"].map(function (f) { return document.fonts.load(f); })), new Promise(function (r) { setTimeout(r, 2000); })]).catch(function () {}) : null]).then(function (r) {
      var img = r[0];
      ctx.fillStyle = '#14100D'; ctx.fillRect(0, 0, W2, H2);
      var y = 90;
      if (img) {
        var fw = 860, ih = Math.min(560, fw * img.naturalHeight / img.naturalWidth), iw = ih * img.naturalWidth / img.naturalHeight, fx = (W2 - fw) / 2;
        ctx.save(); ctx.translate(W2 / 2, y + ih / 2 + 24); ctx.rotate(-1.2 * Math.PI / 180); ctx.translate(-W2 / 2, -(y + ih / 2 + 24));
        ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillRect(fx, y, fw, ih + 48); ctx.shadowColor = 'transparent';
        ctx.drawImage(img, (W2 - iw) / 2, y + 24, iw, ih);
        ctx.restore();
        y += ih + 48;
      }
      ctx.font = '900 54px Nunito, system-ui, sans-serif'; var nm = String(d.name || '').toUpperCase(), nw = Math.min(900, ctx.measureText(nm).width + 64);
      ctx.fillStyle = '#000'; ctx.fillRect((W2 - nw) / 2, y - 34, nw, 84); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(nm, W2 / 2, y + 26, 880);
      y += 110;
      if (d.freeze && d.freeze.caption) { ctx.font = 'italic 400 34px ' + serif; ctx.fillStyle = '#CFC4B2'; wrap(ctx, '“' + d.freeze.caption + '”', 900).slice(0, 2).forEach(function (l) { ctx.fillText(l, W2 / 2, y); y += 46; }); y += 20; }
      ctx.textAlign = 'left'; ctx.fillStyle = '#FFF8EA'; ctx.font = '400 46px ' + serif;
      wrap(ctx, d.text || '', 920).slice(0, 7).forEach(function (l) { ctx.fillText(l, 80, y); y += 62; });
      ctx.textAlign = 'center'; ctx.fillStyle = '#B9AE9C'; ctx.font = '700 28px Nunito, system-ui, sans-serif';
      var site = ''; try { site = window.HallCard && HallCard.siteLabel ? HallCard.siteLabel() : location.host; } catch (x) {}
      ctx.fillText('CLOSED CAPTION' + (site ? '  ·  ' + site : ''), W2 / 2, H2 - 60);
      return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  }
  function saveCredit(d) {
    d = d || mine; if (!d) return;
    creditCard(d).then(function (blob) {
      if (!blob) return;
      var file = 'closed-caption-credit-' + String(d.name || 'you').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
      if (window.HallCard && HallCard.share) HallCard.share(blob, { filename: file, title: 'My Closed Caption credit', text: 'What became of me. ' + (HallCard.siteUrl ? HallCard.siteUrl('credit') : '') }).then(function (r) { if (r === 'downloaded') { try { showToast('Saved to your downloads', 'ok'); } catch (x) {} } if (r !== 'cancelled') { try { ccTally('credit'); } catch (x) {} } });
    });
  }
  // Everyone else's, from the final page
  function saveMyCredit() {
    var s = S(), e = s && s.ending, c = e && e.credits && e.credits[me()];
    if (c) saveCredit({ name: nameOfId(me()), text: c.text, freeze: c.freeze });
  }

  window.Ending = {
    sync: sync, close: close, next: next, replay: replay, active: function () { return !!current(); },
    lobbyHtml: lobbyHtml, sendTables: sendTables, openRemote: openRemote, remoteSvg: remoteSvg, chimpSvg: chimpSvg, remoteLineHtml: remoteLineHtml,
    syncPrev: syncPrev, closePrev: closePrev, tables: tablesGet, saveTable: saveTable,
    sealedHtml: sealedHtml, tick: tick, menuRows: menuRows, askLastCall: askLastCall, askHeadOut: askHeadOut,
    showOwnCredit: showOwnCredit, closeOwnCredit: closeOwnCredit, saveCredit: saveCredit, saveMyCredit: saveMyCredit,
  };
})();
