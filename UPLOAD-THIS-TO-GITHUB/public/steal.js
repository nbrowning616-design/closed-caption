/* Closed Caption — the steal show, on every phone at once (steal.js).
   The show itself is the hand-drawn one Nick approved (Oct 21 2026): thieves.js (CCSteal), six thieves drawn in the
   same hand as the skip gags, on the steal screen itself (the caption cards as the table sees them, the chips on their
   top edges; the cards carry stand-in lines, never words, so nothing hints which caption is real). The server picks it
   all (state.steal): the thief (dealt per night), the show — 'full' (~6.5 s: the night's first steal, then about one in
   four at random, never because of where the chip was; the closing caption held ~2.5 s) or 'short' (~2 s, ending on the
   thief's tag) — and the line under it (state.steal.gloat, neutral). It starts on the shared beat (state.steal.at), so
   every phone draws the same frame. One phone (the speaker) plays the sounds (window.ccCueSound).
   Also here: ccPaintedChip(dealerId, cls, fallbackPid), how a stolen chip looks afterwards (the dealer's colour, a drip
   of wet paint), as the Painter leaves it.
   Reads the page's globals at call time: state, myPlayerId, esc, nameOf, chipHtml, playerById, playerColor,
   getPlayerIndex, initials, firstName. */
(function () {
  'use strict';
  var INK = '#1F1A17';
  var FULL_MS = 7500, SHORT_MS = 2000;   // (payoff beats: the closing caption is held a full second longer than the drawing needs)   // thieves.js full.T / short.T; game.js STEAL_FULL_MS / STEAL_SHORT_MS (the flip waits for these)

  var CSS = [
    /* the stage: paper, the steal screen drawn on it (thieves.js .ccs), the line under it */
    '#stealshow.ccs-on{background:var(--paper,#FFF8EA);background-image:none;color:var(--ink,#1F1A17);padding:calc(14px + var(--sat,0px)) 12px calc(14px + var(--sab,0px));}',
    '#stealshow .st-wrap{width:100%;max-width:430px;margin:0 auto;}',
    '#stealshow .ccs-scr{box-shadow:0 1px 0 rgba(31,26,23,.05);}',
    '#stealshow .st-plain{max-width:340px;margin:0 auto;text-align:center;font-family:var(--serif,Georgia,serif);}',
    '#stealshow .st-plain p{margin:0;}',
    '#stealshow .st-plain .a{font-weight:700;font-size:26px;line-height:1.2;}',
    '#stealshow .st-plain .b{font-style:italic;font-size:19px;line-height:1.35;margin-top:14px;}',
    /* cut 7: the short show (2 s) has no line to read: the thief, the chip, whose it is now */
    '#stealshow.st-short .ccs-cap{display:none;}',
    /* After the show: a stolen chip is the dealer's now — their colour, their initials, still wet */
    '.chip.painted{overflow:visible;}',
    '.chip.painted .pd{position:absolute;left:50%;bottom:-7px;width:18px;height:11px;margin-left:-9px;pointer-events:none;}',
    '.chip.painted .pd path{fill:var(--c);stroke:' + INK + ';stroke-width:1.5;stroke-linejoin:round;}',
    '.chip.painted .ps{position:absolute;right:-6px;top:-6px;width:15px;height:15px;border-radius:50%;background:#FFF8EA;border:1.5px solid ' + INK + ';display:flex;align-items:center;justify-content:center;pointer-events:none;}',
    '.chip.lg.painted .pd{width:24px;height:15px;bottom:-10px;margin-left:-12px;}',
    '.chip.xs.painted .ps,.chip.xs.painted .pd{display:none;}'
  ].join('\n');
  try { var s = document.createElement('style'); s.id = 'cc-steal-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); } catch (e) {}

  function dealerId() {
    if (state.dealerId) return state.dealerId;
    var p = (state.players || []).find(function (q) { return q.name === state.dealerName; });
    return p ? p.id : null;
  }
  function colourOf(pid) { try { var i = getPlayerIndex(pid); return i < 0 ? '#E8453A' : playerColor(i); } catch (e) { return '#E8453A'; } }
  function first(pid) { var n = nameOf(pid); try { if (typeof firstName === 'function') return firstName(n); } catch (e) {} return String(n || '').trim().split(/\s+/)[0] || n; }
  function ini(pid) { try { return typeof initials === 'function' ? initials(nameOf(pid)) : String(nameOf(pid) || '?').charAt(0); } catch (e) { return '?'; } }

  /* A stolen chip, as it sits on the table after the show: the dealer's chip, a drip of fresh paint, a tiny can on
     its shoulder. Falls back to the old grey ✕ if we can't tell who the dealer was. */
  var MINI_CAN = '<svg viewBox="0 0 10 14" width="8" height="11" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="9" rx="1.2" fill="' + INK + '"/><rect x="3.4" y="1.6" width="3.6" height="2.6" rx=".8" fill="' + INK + '"/><path d="M3.2 2.9 H.6" stroke="' + INK + '" stroke-width="1.2" stroke-linecap="round"/><rect x="1.5" y="7" width="7" height="3.2" fill="var(--c)"/></svg>';
  var DRIP = '<svg class="pd" viewBox="0 0 18 11" aria-hidden="true"><path d="M2 0 Q2.5 2.5 4.5 3 V6.5 A2 2 0 0 0 8.5 6.5 V3.4 Q9.5 3 10.5 3.6 V8 A2.2 2.2 0 0 0 14.9 8 V3 Q15.8 2 16 0 Z"/></svg>';
  function paintedChip(dId, cls, fallbackPid) {
    if (!dId || !(typeof playerById === 'function' && playerById(dId))) return chipHtml(fallbackPid, (cls || '') + ' stolen');
    return chipHtml(dId, (cls || '') + ' painted', '<span class="ps">' + MINI_CAN + '</span>' + DRIP).replace('title="', 'title="Stolen by ');
  }
  window.ccPaintedChip = paintedChip;

  /* The table as the show draws it: the captions with chips on them, in the table's order (3 to 5 cards; the one the
     chip comes off always among them), up to 3 chips a card (the doomed one always shown). The stolen chip is still on
     its card when the show starts: the server has already moved it to bet.stolen. */
  function tableFor(st) {
    var bets = state.bets || [], n = (state.openCaptions || []).length;
    var targets = []; for (var i = 0; i < n; i++) targets.push(i); targets.push('closed');
    var rows = targets.map(function (t) { return { t: t, num: t === 'closed' ? 'CC' : String(t + 1), chips: [], victim: -1 }; });
    var rowOf = function (t) { return rows.find(function (r) { return String(r.t) === String(t); }); };
    bets.forEach(function (b, bi) {
      if (!b || b.target === 'pass') return;
      var r = rowOf(b.target); if (!r) return;
      var k = (b.count || 0) + (b.stolen || 0);
      for (var j = 0; j < k; j++) {
        var isV = bi === st.betIndex && j === k - 1;
        if (isV) r.victim = r.chips.length;
        r.chips.push({ c: colourOf(b.playerId), i: ini(b.playerId), v: isV });
      }
    });
    var tr = rowOf(st.target);
    var withChips = rows.filter(function (r) { return r.chips.length; });
    var pick = withChips.slice();
    if (pick.length > 5) {   // the doomed card, then the busiest four, kept in the table's order
      var rest = pick.filter(function (r) { return r !== tr; }).sort(function (a, b) { return b.chips.length - a.chips.length; }).slice(0, 4);
      pick = rows.filter(function (r) { return r === tr || rest.indexOf(r) >= 0; });
    }
    if (tr && pick.indexOf(tr) < 0) pick.push(tr);
    for (var e = 0; pick.length < 3 && e < rows.length; e++) if (pick.indexOf(rows[e]) < 0) pick.push(rows[e]);   // at least three cards on the table
    pick.sort(function (a, b) { return rows.indexOf(a) - rows.indexOf(b); });
    var cards = pick.map(function (r) {
      var cs = r.chips;
      if (cs.length > 3) { var keep = cs.filter(function (c) { return c.v; }), others = cs.filter(function (c) { return !c.v; }); cs = others.slice(0, 3 - keep.length).concat(keep); }
      return { num: r.num, chips: cs.map(function (c) { return { c: c.c, i: c.i, v: c.v }; }) };
    });
    var ci = Math.max(0, pick.indexOf(tr)), ch = Math.max(0, cards[ci].chips.findIndex(function (c) { return c.v; }));
    return { cards: cards, target: { card: ci, chip: ch } };
  }

  // Cut 7: the server says which (state.steal.stealShow, or the view's stealShow); missing = the full show
  function showKind(st) { var k = (st && st.stealShow) || (typeof state !== 'undefined' && state && state.stealShow); return k === 'short' ? 'short' : 'full'; }
  // How long this steal's show runs (index.html paces the flip after it)
  function lengthFor(st) { return showKind(st) === 'short' ? SHORT_MS : FULL_MS; }

  function close(o) { (window._ssT || []).forEach(clearTimeout); window._ssT = []; o.classList.remove('on', 'out', 'quick', 'ccs-on', 'st-short'); o.innerHTML = ''; o.onclick = null; }
  /* The show, `wait` ms from now (the shared beat; negative: it started that long ago). Returns ms until it's over. */
  function play(wait) {
    wait = +wait || 0;
    var st = state.steal, o = document.getElementById('stealshow');
    if (!st || !o) return 0;
    (window._ssT || []).forEach(clearTimeout); window._ssT = [];
    var mode = showKind(st), len = lengthFor(st), me = myPlayerId, dId = dealerId();
    var startAt = performance.now() + wait;
    o.innerHTML = '<div class="st-wrap" id="st-wrap"></div>';
    o.classList.remove('out', 'quick', 'st-short'); o.classList.add('on', 'ccs-on'); if (mode === 'short') o.classList.add('st-short');
    o.onclick = function () { close(o); if (window._answerGo) window._answerGo(); };   // a tap skips it (on this phone)
    window._ssT.push(setTimeout(function () { o.classList.add('out'); }, Math.max(0, wait + len - 300)));
    window._ssT.push(setTimeout(function () { close(o); }, Math.max(0, wait + len + 200)));
    var wrap = o.querySelector('#st-wrap'), beat = function (n) { if (window.ccBeat) window.ccBeat(n); };
    if (!window.CCSteal) {   // thieves.js still on its way: the result, in words, for the same length
      wrap.innerHTML = '<div class="st-plain"><p class="a">' + (st.victimId === me ? 'Your chip.' : esc(first(st.victimId)) + '’s chip.') + '<br>' + (dId === me ? 'Yours now.' : esc(first(dId)) + '’s now.') + '</p>' + (st.gloat && mode === 'full' ? '<p class="b">' + esc(st.gloat) + '</p>' : '') + '</div>';
      beat('steal:plain');
      return Math.max(0, wait + len);
    }
    try {
      var T = tableFor(st);
      var opts = {
        heist: st.thief && window.CCSteal.HEISTS[st.thief] ? st.thief : 'cat', mode: mode, cards: T.cards, target: T.target,
        victim: first(st.victimId), victimYou: st.victimId === me, dealer: first(dId), dealerYou: dId === me || !!state.isDealer,
        dealerColor: colourOf(dId), dealerInitial: dId ? ini(dId) : '', round: state.round, caption: mode === 'full' ? (st.gloat || undefined) : undefined,
        seed: (st.seed || 7) % 997, startAt: startAt,
        onCue: function (name) { try { if (window.ccCueSound) window.ccCueSound(name); } catch (e) {} if (name === 'clink' || name === 'tink' || name === 'catch') { try { if (st.victimId === me) buzz([60, 40, 60]); } catch (e) {} } }
      };
      window._ssT.push(setTimeout(function () { beat('steal:' + mode); try { if (st.victimId === me) buzz([40]); } catch (e) {} }, Math.max(0, wait)));
      window.CCSteal.play(wrap, opts).then(function () { beat('steal:end'); });
    } catch (e) { console.error('steal', e); }
    return Math.max(0, wait + len);
  }

  window.ccClaw = { play: play, lengthFor: lengthFor, tableFor: tableFor, SHORT_MS: SHORT_MS, FULL_MS: FULL_MS };
})();
