/* practice.js — Solo practice from the home screen (Nick, Oct 21 2026; betting Oct 23 2026: "how people learn
   without playing a group"). Six cartoons, a real round each: write your own fake; five captions on the table, one
   face-down; two chips: blind bets, the flip, the last chip; paid like the game. No rating, nothing saved but the
   cartoons this phone has seen. The server (practice.js there) keeps the answers: this page learns the face-down
   card's text at the flip and which caption was real only after the last chip.
   Reads the page's globals at call time: $, esc, showScreen, showToast, sfx, buzz. CSS prefix: pr-. */
(function () {
  var ROOT = 'practice-root', DECKS = [['family', 'Family'], ['standard', 'Standard'], ['everything', 'Everything']];
  var P = null;   // { token, card, total, step: 'intro'|'write'|'blind'|'late'|'result'|'end', captions, mine, downMine, pick, blind, flipped, result, score, points, busy, check, pts }

  function el() { return document.getElementById(ROOT); }
  function E(s) { try { return esc(s); } catch (e) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); } }
  function toast(t) { try { showToast(t); } catch (e) {} }
  function snd(k) { try { if (window.sfx && sfx[k]) sfx[k](); } catch (e) {} }
  function deckGet() { try { var d = localStorage.getItem('cc_prac_deck'); return d === 'family' || d === 'everything' ? d : 'standard'; } catch (e) { return 'standard'; } }
  function deckSet(d) { try { localStorage.setItem('cc_prac_deck', d); } catch (e) {} }
  function seenGet() { try { var v = JSON.parse(localStorage.getItem('cc_seen') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  // The same 'already seen' list a hosted game reads, so practice and the next game night don't repeat each other
  function seenAdd(id) {
    var list = seenGet(); if (list[list.length - 1] === id) return;
    list = list.filter(function (x) { return x !== id; }).concat(id).slice(-200);
    try { localStorage.setItem('cc_seen', JSON.stringify(list)); } catch (e) {}
  }
  function post(path, body) {
    return fetch('/practice/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return { error: 'That didn’t take. Try again.' }; }); })
      .catch(function () { return { error: 'No connection. Try again.' }; });
  }

  function open() { P = { step: 'intro', deck: deckGet() }; showScreen('screen-practice'); draw(); try { history.pushState({ cc: 'practice' }, ''); } catch (e) {} }
  function home(fromBack) { P = null; closeZoom(); showScreen('screen-home'); if (!fromBack) { try { if (history.state && history.state.cc === 'practice') history.back(); } catch (e) {} } }
  // the phone's Back button: closes the zoom, or leaves Practice for the home screen (never out of the app)
  try { window.addEventListener('popstate', function () { if (!P) return; var st = history.state; if (st && st.cc === 'practice') { closeZoom(); return; } home(true); }); } catch (e) {}
  function setDeck(d) { if (!P) return; P.deck = d; deckSet(d); draw(); }
  function start() {
    if (!P || P.busy) return;
    P.busy = true; draw();
    post('start', { deck: P.deck, seen: seenGet().slice(-200) }).then(function (r) {
      P.busy = false;
      if (r.error) { toast(r.error); draw(); return; }
      P.token = r.token; P.total = r.total; P.score = 0; P.points = 0; P.pts = r.pts || { open: 2, closed: 5, late: 1 }; showCard(r.card);
    });
  }
  function showCard(card) { P.card = card; P.step = 'write'; P.captions = null; P.pick = null; P.result = null; P.blind = null; P.flipped = null; P.left = 0; P.check = null; P.draft = ''; seenAdd(card.id); draw(); window.scrollTo(0, 0); }

  function submit(mode) {
    var i = document.getElementById('pr-input'); if (!P || P.busy) return;
    var text = (i ? i.value : P.draft || '').trim(); P.draft = text;
    if (!text) { if (i) { i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake'); } snd('error'); return; }
    P.busy = true; draw();
    post('write', { token: P.token, caption: text, mode: mode || 'check' }).then(function (r) {
      P.busy = false;
      if (r.gone) { toast(r.error); P.step = 'intro'; draw(); return; }
      if (r.error) { toast(r.error); snd('error'); draw(); return; }
      if (r.check) { P.check = r.check; draw(); return; }
      P.check = null; P.captions = r.captions; P.mine = r.mine; P.downMine = !!r.downMine; P.step = 'blind'; snd('submitSelf');
      draw(); window.scrollTo(0, 0);
    });
  }
  // k: a caption's number, or 'closed' for the face-down one. Your own is allowed (it scores nothing), like the game.
  function choose(k) { if (!P || (P.step !== 'blind' && P.step !== 'late')) return; P.pick = k; snd('tap'); draw(); }
  function answer(r) {
    P.result = r; P.score = r.score; P.points = r.points; P.step = 'result';
    if (r.flipped) P.flipped = r.flipped;
    try { buzz(r.found ? [15, 40, 15] : 30); } catch (e) {}
    draw(); window.scrollTo(0, 0);
    setTimeout(function () { var c = document.querySelector('.pr-cap.correct'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 700);
  }
  function failed(r) { if (r.gone) { toast(r.error); P.step = 'intro'; draw(); return true; } if (r.error) { toast(r.error); snd('error'); draw(); return true; } return false; }
  // Blind bet: count 1 or 2 on the picked caption; count 0 = sit it out
  function bet(count) {
    if (!P || P.busy || P.step !== 'blind' || (count && (P.pick === null || P.pick === undefined))) return;
    P.busy = true; draw();
    var body = count ? { token: P.token, target: P.pick, count: count } : { token: P.token, pass: true };
    post('bet', body).then(function (r) {
      P.busy = false;
      if (failed(r)) return;
      P.blind = count ? { target: P.pick, count: count } : { pass: true };
      P.flipped = r.flipped; snd('notify');
      if (r.answer) { answer(r); return; }
      P.left = r.left || 1; P.pick = null; P.step = 'late';
      draw(); window.scrollTo(0, 0);
    });
  }
  // The last chip on the picked caption, or keep it
  function late(keep) {
    if (!P || P.busy || P.step !== 'late' || (!keep && (P.pick === null || P.pick === undefined))) return;
    P.busy = true; draw();
    post('late', keep ? { token: P.token, keep: true } : { token: P.token, target: P.pick }).then(function (r) {
      P.busy = false;
      if (failed(r)) return;
      answer(r);
    });
  }
  function next() {
    if (!P || !P.result) return;
    if (P.result.done) { P.step = 'end'; draw(); window.scrollTo(0, 0); return; }
    showCard(P.result.next);
  }

  // A plain full-screen look at the cartoon (tap anywhere to close)
  function zoom() {
    if (!P || !P.card) return;
    if (typeof openViewer === 'function') { openViewer('/images/' + P.card.image); try { history.pushState({ cc: 'practice', zoom: 1 }, ''); } catch (e) {} return; }   // the game's own viewer: pinch, pan, Escape, focus
    closeZoom();
    var z = document.createElement('div'); z.id = 'pr-zoom'; z.className = 'pr-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'The cartoon, full-screen. Tap to close');
    z.innerHTML = '<img src="/images/' + E(P.card.image) + '" alt=""><button class="btn btn-sm pr-zoom-x">Close</button>';
    z.onclick = closeZoom; document.body.appendChild(z);
  }
  function closeZoom() { var z = document.getElementById('pr-zoom'); if (z) z.remove(); try { if (typeof closeViewer === 'function') closeViewer(); } catch (e) {} }

  function hdr(label) {
    return '<div class="pr-hdr"><span class="sticker">Practice</span><span class="pr-hdr-s">' + E(label || '') + '</span><button class="btn-link pr-x" onclick="Practice.home()">Home</button></div>';
  }
  function toon(slot) {
    return '<div class="toon-big ' + (slot ? 'mag' : 'compact') + ' pr-toon"><button class="toon-hit" onclick="Practice.zoom()" aria-label="The cartoon. See it full-screen"><img src="/images/' + E(P.card.image) + '" alt=""></button><span class="zoom" aria-hidden="true">Tap to zoom</span>' + (slot || '') + '</div>';
  }
  function same(a, b) { return a !== null && a !== undefined && String(a) === String(b); }
  function chipsOn(k) {   // your chips on caption k so far
    var n = 0, b = P.blind, r = P.result;
    if (b && !b.pass && same(b.target, k)) n += b.count;
    if (r && r.late && same(r.late.target, k)) n += 1;
    return n;
  }
  function chipTag(k) { var n = chipsOn(k); return n ? '<span class="pr-chips">' + (n >= 2 ? 'Both your chips' : 'Your chip') + '</span>' : ''; }
  function whoLine(c, k, real) {
    if (real) return 'The real caption' + (k === 'closed' ? ' · it was the face-down one' : '');
    var w = c.house ? 'Written by ' + E(c.house) + ' <span class="house-tag">house</span>' : c.who === 'you' ? 'Yours' : '';
    return w + (k === 'closed' ? ' · the face-down one' : '');
  }
  // One caption card. mode: 'pick' (tappable) or 'result' (credits)
  function capHtml(k, text, mode) {
    var mine = k === 'closed' ? P.downMine : k === P.mine, r = P.result, cls = 'cap pr-cap', foot = '';
    if (mode === 'pick') { if (same(P.pick, k)) cls += ' picked'; if (mine) cls += ' pr-mine'; }
    else cls += ' locked';
    if (mode === 'result') {
      var real = same(r.real, k), c = k === 'closed' ? r.downCredit : (r.credits[k] || {});
      if (real) cls += ' correct'; else if (chipsOn(k)) cls += ' pr-miss';
      foot = '<p class="pr-who">' + whoLine(c, k, real) + '</p>';
    } else if (mine) foot = '<p class="pr-who">Yours' + (k === 'closed' ? ' · the face-down one' : '') + '</p>';
    else if (k === 'closed') foot = '<p class="pr-who">The face-down one, turned over</p>';
    var attrs = mode === 'pick' ? ' onclick="Practice.choose(' + (k === 'closed' ? "'closed'" : k) + ')" aria-pressed="' + (same(P.pick, k) ? 'true' : 'false') + '"' : ' disabled aria-disabled="true"';
    var num = k === 'closed' ? 'CC' : String(k + 1);
    return '<button class="' + cls + '"' + attrs + '><span class="num">' + num + '</span><p class="caption-text">“' + E(text) + '”</p>' + foot + chipTag(k) + '</button>';
  }
  // The face-down card before the flip
  function downHtml() {
    var cls = 'cap closed pr-cap' + (same(P.pick, 'closed') ? ' picked' : '');
    return '<button class="' + cls + '" onclick="Practice.choose(\'closed\')" aria-pressed="' + (same(P.pick, 'closed') ? 'true' : 'false') + '" aria-label="The face-down caption" style="text-align:center; padding:18px 16px;"><div class="ccard mini"><div class="cc">CC</div></div><p class="eyebrow" style="color:var(--ink-2); margin-top:8px;">Closed Caption · face-down</p><p class="small" style="color:var(--ink-2);">' + (P.downMine ? 'It’s yours. Keep a straight face.' : 'It turns over after the blind bets.') + '</p></button>';
  }
  function tableHtml(mode) {
    var h = P.captions.map(function (t, i) { return capHtml(i, t, mode); }).join('');
    if (P.flipped === null || P.flipped === undefined) h += downHtml();
    else h += capHtml('closed', P.flipped, mode);
    return h;
  }
  function whereOf(k) { return k === 'closed' ? (P.flipped ? 'the Closed Caption' : 'the face-down one') : 'Caption ' + (k + 1); }
  function pickedMine() { return P.pick === 'closed' ? P.downMine : P.pick === P.mine; }
  function cap1(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function draw() {
    var root = el(); if (!root || !P) return;
    var h = '';
    if (P.step === 'intro') {
      h = hdr('') + '<div class="pr-intro"><h2 class="h1">Practice</h2>'
        + '<p class="sub">Six cartoons, played like the game. Write a fake, then bet your two chips on the real caption. One of the five is face-down.</p>'
        + '<div class="field" style="margin-top:18px;"><label class="eyebrow" id="pr-deck-l">Cartoons</label><div class="seg" role="group" aria-labelledby="pr-deck-l">'
        + DECKS.map(function (d) { var on = P.deck === d[0]; return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" onclick="Practice.setDeck(\'' + d[0] + '\')">' + d[1] + '</button>'; }).join('')
        + '</div></div>'
        + '<button class="btn btn-yellow" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.start()">Start →</button></div>';
    } else if (P.step === 'write') {
      var ck = P.check;
      h = hdr('Cartoon ' + P.card.n + ' of ' + P.card.total)
        + toon('<label class="sr-only" for="pr-input">Your caption</label><textarea id="pr-input" class="caption-input mag" rows="2" placeholder="Your caption goes here…" maxlength="200" enterkeyhint="done" autocapitalize="sentences" autocorrect="on" autocomplete="off" spellcheck="true" oninput="Practice.typed(this)" onfocus="onCaptionFocus()" onblur="onCaptionBlur()">' + E(P.draft || '') + '</textarea>')
        + '<div class="w-box">'
        + '<p class="small pr-count" id="pr-count">' + (P.draft || '').length + ' / 200</p>'
        + (ck ? '<div class="panel flat pr-check" role="alert"><p class="eyebrow">Quick spelling check</p><p class="caption-text" style="margin:4px 0 10px;">“' + E(ck.fixed) + '”</p><div class="pr-row"><button class="btn btn-sm" onclick="Practice.submit(\'fix\')">Use the fix</button><button class="btn btn-sm" onclick="Practice.submit(\'keep\')">Keep mine</button></div></div>'
          : '<button class="btn btn-yellow" id="pr-submit" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.submit()">Lock it in ✓</button>')
        + '</div>';
    } else if (P.step === 'blind') {
      var has = P.pick !== null && P.pick !== undefined, pts = P.pts;
      h = hdr('Cartoon ' + P.card.n + ' of ' + P.card.total) + toon()
        + '<div class="pr-q"><h2 class="h2">Blind bets</h2><p class="sub pr-tip">Two chips. One caption is real. A blind chip on it pays ' + pts.open + '. On the face-down one, ' + pts.closed + ' (it’s the real one about 1 round in 7).</p></div>'
        + '<div class="stack pr-list">' + tableHtml('pick') + '</div>'
        + '<div class="pr-bar">' + (has
          ? (pickedMine() ? '<p class="center small pr-warn">That’s your own caption — it can’t score for you</p>' : '')
            + '<p class="center small" style="margin-bottom:8px;">' + cap1(whereOf(P.pick)) + ' — how many chips?</p><div class="pr-row">'
            + '<button class="btn btn-blue" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.bet(1)">1 chip</button>'
            + '<button class="btn ' + (P.pick === 'closed' ? 'btn-yellow' : 'btn-violet') + '" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.bet(2)">Both chips — ' + (P.pick === 'closed' ? 'Blind Double Down' : 'Double Down') + '</button></div>'
          : '<button class="btn pr-go" disabled>Tap a caption to bet on it</button>')
        + '<button class="btn-link pr-pass" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.bet(0)">Sit the blind bet out</button></div>';
    } else if (P.step === 'late') {
      var has2 = P.pick !== null && P.pick !== undefined, stack = has2 && P.blind && !P.blind.pass && same(P.blind.target, P.pick);
      h = hdr('Cartoon ' + P.card.n + ' of ' + P.card.total) + toon()
        + '<div class="pr-q"><h2 class="h2">It turned over</h2><p class="sub pr-tip">One chip left. Now a chip on the real one pays ' + P.pts.late + '. Anywhere, even on top of your first.</p></div>'
        + '<div class="stack pr-list">' + tableHtml('pick') + '</div>'
        + '<div class="pr-bar">' + (has2
          ? (pickedMine() ? '<p class="center small pr-warn">That’s your own caption — it can’t score for you</p>' : '')
            + '<button class="btn btn-blue" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.late()">' + (stack ? 'Stack my last chip on ' : 'Last chip on ') + E(whereOf(P.pick)) + ' →</button>'
          : '<button class="btn pr-go" disabled>Tap a caption for your last chip</button>')
        + '<button class="btn-link pr-pass" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.late(true)">Keep it</button></div>';
    } else if (P.step === 'result') {
      var r = P.result;
      h = hdr('Cartoon ' + r.played + ' of ' + r.total) + toon()
        + '<div class="pr-q"><div class="stamp' + (r.found ? '' : ' pr-stamp-miss') + '" role="status">' + (r.found ? 'Found it' : 'Not this time') + '</div>'
        + (r.lines.length ? '<div class="pr-pts">' + r.lines.map(function (l) { return '<p><b>+' + l.pts + '</b> ' + E(l.why) + '</p>'; }).join('') + '</div>' : '<p class="sub" style="margin-top:8px;">No points this one.</p>')
        + '<p class="sub" style="margin-top:6px;">' + r.points + ' point' + (r.points === 1 ? '' : 's') + ' so far · found it ' + r.score + ' of ' + r.played + '</p></div>'
        + '<div class="stack pr-list">' + tableHtml('result') + '</div>'
        + '<button class="btn btn-yellow pr-go" onclick="Practice.next()">' + (r.done ? 'See how you did →' : 'Next cartoon →') + '</button>';
    } else if (P.step === 'end') {
      var rr = P.result || { score: P.score, total: P.total, played: P.total };
      var pp = rr.points !== undefined ? rr.points : (P.points || 0);
      h = hdr('') + '<div class="pr-end"><div class="h-display pr-big">' + pp + '</div>'
        + '<p class="sub">point' + (pp === 1 ? '' : 's') + ' · the real caption found ' + rr.score + ' of ' + rr.played + ' times</p>'
        + '<div class="stack" style="margin-top:22px;"><button class="btn btn-yellow" onclick="Practice.start()">Play again</button></div></div>';
    }
    root.innerHTML = h;
    try { if (!document.body.classList.contains('typing')) { var fe = root.querySelector('h2, .h2, .stamp[role="status"], .pr-hdr'); if (fe) { if (!fe.hasAttribute('tabindex')) fe.setAttribute('tabindex', '-1'); fe.focus({ preventScroll: true }); } } } catch (e) {}
    if (P.step === 'write' && P.check) { var pc = root.querySelector('.pr-check'); if (pc && pc.scrollIntoView) pc.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    var pi = document.getElementById('pr-input'); if (pi && pi.value) { pi.style.height = 'auto'; pi.style.height = (pi.scrollHeight + 2) + 'px'; }
  }
  function typed(t) { if (!P) return; if (t.value.length > 200) t.value = t.value.slice(0, 200); t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; P.draft = t.value; P.check = null; var c = document.getElementById('pr-count'); if (c) c.textContent = t.value.length + ' / 200'; if (!document.getElementById('pr-submit')) { var pos = t.selectionStart; draw(); var n = document.getElementById('pr-input'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } } }

  window.Practice = { open: open, home: home, setDeck: setDeck, start: start, submit: submit, choose: choose, bet: bet, late: late, next: next, zoom: zoom, typed: typed };
})();
