/* practice.js — Solo practice from the home screen (Nick, Oct 21 2026).
   Six cartoons. For each: write your own fake, then find the real caption among five (yours, the real one and
   three house fakes). Score = how often you found it. No rating, nothing saved but the cartoons this phone has seen.
   The server (practice.js there) keeps the answers: this page only learns which caption was real after its guess.
   Reads the page's globals at call time: $, esc, showScreen, showToast, sfx, buzz. CSS prefix: pr-. */
(function () {
  var ROOT = 'practice-root', DECKS = [['family', 'Family'], ['standard', 'Standard'], ['everything', 'Everything']];
  var P = null;   // { token, card, total, step: 'intro'|'write'|'guess'|'result'|'end', captions, mine, pick, result, score, busy, check }

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

  function open() { P = { step: 'intro', deck: deckGet() }; showScreen('screen-practice'); draw(); }
  function home() { P = null; closeZoom(); showScreen('screen-home'); }
  function setDeck(d) { if (!P) return; P.deck = d; deckSet(d); draw(); }
  function start() {
    if (!P || P.busy) return;
    P.busy = true; draw();
    post('start', { deck: P.deck, seen: seenGet().slice(-200) }).then(function (r) {
      P.busy = false;
      if (r.error) { toast(r.error); draw(); return; }
      P.token = r.token; P.total = r.total; P.score = 0; showCard(r.card);
    });
  }
  function showCard(card) { P.card = card; P.step = 'write'; P.captions = null; P.pick = null; P.result = null; P.check = null; P.draft = ''; seenAdd(card.id); draw(); window.scrollTo(0, 0); }

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
      P.check = null; P.captions = r.captions; P.mine = r.mine; P.step = 'guess'; snd('submitSelf');
      draw(); window.scrollTo(0, 0);
    });
  }
  function choose(k) { if (!P || P.step !== 'guess' || k === P.mine) return; P.pick = k; snd('tap'); draw(); }
  function guess() {
    if (!P || P.busy || P.pick === null || P.pick === undefined) return;
    P.busy = true; draw();
    post('guess', { token: P.token, pick: P.pick }).then(function (r) {
      P.busy = false;
      if (r.gone) { toast(r.error); P.step = 'intro'; draw(); return; }
      if (r.error) { toast(r.error); draw(); return; }
      P.result = r; P.score = r.score; P.step = 'result';
      try { buzz(r.right ? [15, 40, 15] : 30); } catch (e) {}
      draw(); window.scrollTo(0, 0);
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
    closeZoom();
    var z = document.createElement('div'); z.id = 'pr-zoom'; z.className = 'pr-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'The cartoon, full-screen. Tap to close');
    z.innerHTML = '<img src="/images/' + E(P.card.image) + '" alt=""><button class="btn btn-sm pr-zoom-x">Close</button>';
    z.onclick = closeZoom; document.body.appendChild(z);
  }
  function closeZoom() { var z = document.getElementById('pr-zoom'); if (z) z.remove(); }

  function hdr(label) {
    return '<div class="pr-hdr"><span class="sticker">Practice</span><span class="pr-hdr-s">' + E(label || '') + '</span><button class="btn-link pr-x" onclick="Practice.home()">Home</button></div>';
  }
  function toon(slot) {
    return '<div class="toon-big ' + (slot ? 'mag' : 'compact') + ' pr-toon"><button class="toon-hit" onclick="Practice.zoom()" aria-label="The cartoon. See it full-screen"><img src="/images/' + E(P.card.image) + '" alt=""></button><span class="zoom" aria-hidden="true">Tap to zoom</span>' + (slot || '') + '</div>';
  }
  function cardsHtml(mode) {
    var r = P.result;
    return P.captions.map(function (t, i) {
      var mine = i === P.mine, cls = 'cap pr-cap', credit = '';
      if (mode === 'guess') { if (mine) cls += ' locked pr-mine'; else if (i === P.pick) cls += ' picked'; }
      else {
        cls += ' locked';
        if (i === r.real) cls += ' correct'; else if (i === r.pick) cls += ' pr-miss';
        var c = r.credits[i] || {};
        credit = '<p class="pr-who">' + (i === r.real ? 'The real caption' : mine ? 'Yours' : c.house ? 'Written by ' + E(c.house) + ' <span class="house-tag">house</span>' : '') + (i === r.pick && i !== r.real ? ' · your guess' : '') + '</p>';
      }
      var tag = mode === 'guess' && mine ? '<p class="pr-who">Yours</p>' : '';
      var attrs = mode === 'guess' && !mine ? ' onclick="Practice.choose(' + i + ')" aria-pressed="' + (i === P.pick ? 'true' : 'false') + '"' : ' disabled aria-disabled="true"';
      return '<button class="' + cls + '"' + attrs + '><span class="num">' + (i + 1) + '</span><p class="caption-text">“' + E(t) + '”</p>' + tag + credit + '</button>';
    }).join('');
  }

  function draw() {
    var root = el(); if (!root || !P) return;
    var h = '';
    if (P.step === 'intro') {
      h = hdr('') + '<div class="pr-intro"><h2 class="h1">Practice</h2>'
        + '<p class="sub">Six cartoons. Write a fake for each, then find the real caption among five.</p>'
        + '<div class="field" style="margin-top:18px;"><label class="eyebrow" id="pr-deck-l">Cartoons</label><div class="seg" role="group" aria-labelledby="pr-deck-l">'
        + DECKS.map(function (d) { var on = P.deck === d[0]; return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" onclick="Practice.setDeck(\'' + d[0] + '\')">' + d[1] + '</button>'; }).join('')
        + '</div></div>'
        + '<button class="btn btn-yellow" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.start()">Start →</button></div>';
    } else if (P.step === 'write') {
      var ck = P.check;
      h = hdr('Cartoon ' + P.card.n + ' of ' + P.card.total)
        + toon('<label class="sr-only" for="pr-input">Your caption</label><textarea id="pr-input" class="caption-input mag" rows="2" placeholder="Your caption goes here…" maxlength="200" enterkeyhint="done" autocapitalize="sentences" autocorrect="on" autocomplete="off" spellcheck="true" oninput="Practice.typed(this)">' + E(P.draft || '') + '</textarea>')
        + '<div class="w-box">'
        + '<p class="small pr-count" id="pr-count">' + (P.draft || '').length + ' / 200</p>'
        + (ck ? '<div class="panel flat pr-check" role="alert"><p class="eyebrow">Quick spelling check</p><p class="caption-text" style="margin:4px 0 10px;">“' + E(ck.fixed) + '”</p><div class="pr-row"><button class="btn btn-sm" onclick="Practice.submit(\'fix\')">Use the fix</button><button class="btn btn-sm" onclick="Practice.submit(\'keep\')">Keep mine</button></div></div>'
          : '<button class="btn btn-yellow" id="pr-submit" ' + (P.busy ? 'disabled' : '') + ' onclick="Practice.submit()">Lock it in ✓</button>')
        + '</div>';
    } else if (P.step === 'guess') {
      h = hdr('Cartoon ' + P.card.n + ' of ' + P.card.total) + toon()
        + '<div class="pr-q"><h2 class="h2">Which one is real?</h2></div>'
        + '<div class="stack pr-list">' + cardsHtml('guess') + '</div>'
        + '<button class="btn btn-yellow pr-go" ' + (P.pick === null || P.pick === undefined || P.busy ? 'disabled' : '') + ' onclick="Practice.guess()">' + (P.pick === null || P.pick === undefined ? 'Tap the one you think is real' : 'That one') + '</button>';
    } else if (P.step === 'result') {
      var r = P.result;
      h = hdr('Cartoon ' + r.played + ' of ' + r.total) + toon()
        + '<div class="pr-q"><div class="stamp' + (r.right ? '' : ' pr-stamp-miss') + '" role="status">' + (r.right ? 'Found it' : 'Not that one') + '</div><p class="sub" style="margin-top:8px;">' + r.score + ' of ' + r.played + ' so far.</p></div>'
        + '<div class="stack pr-list">' + cardsHtml('result') + '</div>'
        + '<button class="btn btn-yellow pr-go" onclick="Practice.next()">' + (r.done ? 'See how you did →' : 'Next cartoon →') + '</button>';
    } else if (P.step === 'end') {
      var rr = P.result || { score: P.score, total: P.total, played: P.total };
      h = hdr('') + '<div class="pr-end"><div class="h-display pr-big">' + rr.score + ' of ' + rr.played + '</div>'
        + '<p class="sub">real captions spotted</p>'
        + '<div class="stack" style="margin-top:22px;"><button class="btn btn-yellow" onclick="Practice.start()">Play again</button></div></div>';
    }
    root.innerHTML = h;
    if (P.step === 'write' && P.check) { var pc = root.querySelector('.pr-check'); if (pc && pc.scrollIntoView) pc.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    var pi = document.getElementById('pr-input'); if (pi && pi.value) { pi.style.height = 'auto'; pi.style.height = (pi.scrollHeight + 2) + 'px'; }
  }
  function typed(t) { if (!P) return; if (t.value.length > 200) t.value = t.value.slice(0, 200); t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; P.draft = t.value; P.check = null; var c = document.getElementById('pr-count'); if (c) c.textContent = t.value.length + ' / 200'; if (!document.getElementById('pr-submit')) { var pos = t.selectionStart; draw(); var n = document.getElementById('pr-input'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } } }

  window.Practice = { open: open, home: home, setDeck: setDeck, start: start, submit: submit, choose: choose, guess: guess, next: next, zoom: zoom, typed: typed };
})();
