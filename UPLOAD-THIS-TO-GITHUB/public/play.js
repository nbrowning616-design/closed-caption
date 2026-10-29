/* Closed Caption — the round (play.js): every in-game screen, from the first cartoon to Caption of the Night.
   Nick, Oct 29 2026: "more like the older version, but with the frame, the steal, the new cartoons". One screen at a
   time, no scrolling, one obvious action: the dealer's phone has the one Next button; every other phone says
   "Waiting for <dealer>". The cartoon takes whatever room is left and shrinks to fit (tap it to zoom).
   Reads the page's globals at call time (state, myPlayerId, gameCode, clockOffset, esc, $, chipHtml, firstName,
   nameOf, playerById, send, sfx, bsfx, buzz, srSay, showToast, openViewer, sheetOpen, closeMenu, …). Everything
   that calls into another helper file checks for it first. Exposes window.ccPlay and the globals index.html calls:
   render, openMenu, setActionBar, saveDraftNow, recordCareer. */
(function () {
  'use strict';
  const W = window;
  const has = (name) => typeof W[name] === 'function';
  const safe = (fn) => { try { return fn(); } catch (e) { console.warn('play', e); return undefined; } };
  const now = () => Date.now() + (typeof clockOffset === 'number' ? clockOffset : 0);
  const tagOf = (s) => (s ? s.code + '#' + (s.gameNo || 0) + '|' + s.round : '');
  const first = (id) => safe(() => fnameOf(id)) || '?';
  const dealerFirst = () => (state.isDealer ? 'You' : esc(firstName(state.dealerName || '')));
  const dealerName = () => esc(firstName(state.dealerName || 'the dealer'));
  const hostName = () => esc(first(state.hostId));
  const listN = (names) => names.length <= 1 ? (names[0] || '') : names.length === 2 ? `${names[0]} and ${names[1]}` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const chip = (pid, cls = '', extra = '', attrs = '') => safe(() => chipHtml(pid, cls, extra, attrs)) || '';
  // Who the table is waiting on: the names, or a count once there are more than three
  const waitNames = (ids) => ids.length <= 3 ? esc(listN(ids.map(first))) : `${ids.length} more`;
  const SET = () => (state && state.settings) || {};

  /* ── The visible screen: on a phone the keyboard shrinks the visual viewport, not the page. The screen is sized
     to what you can see, so the caption box and the Send button never go under the keyboard. ── */
  function syncViewport() {
    const v = W.visualViewport, h = v ? v.height : W.innerHeight, t = v ? v.offsetTop : 0;
    const r = document.documentElement.style;
    r.setProperty('--vvh', Math.round(h) + 'px');
    r.setProperty('--vvt', Math.round(t) + 'px');
  }
  try {
    if (W.visualViewport) { W.visualViewport.addEventListener('resize', () => { syncViewport(); fitSoon(); }); W.visualViewport.addEventListener('scroll', syncViewport); }
    W.addEventListener('resize', () => { syncViewport(); fitSoon(); });
    W.addEventListener('orientationchange', () => setTimeout(() => { syncViewport(); fitSoon(); }, 300));
    // (a web font arriving late changes how much room the words take: fit again)
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => fitSoon());
  } catch (e) {}

  /* ── Fit: nothing scrolls. The cartoon takes whatever room is left. If the middle doesn't fit beside it, the type
     steps down a little; then the list goes compact (tighter rows, a smaller Bravo!, chips stacked) and the cartoon may
     shrink further (tap it to zoom). Only as a very last resort does the middle scroll inside itself (never the page).
     The type never drops below about 12 px: a table has to be able to read it. ── */
  let fitT = null;
  function fitSoon() { clearTimeout(fitT); fitT = setTimeout(fit, 30); }
  /* The steps, roomiest first: d 1 = compact rows, d 2 = the cartoon moves into the header as a small picture (never on
     the reading); f = type scale; c = long captions stop at two lines (tap one to read it all).
     The cartoon has a goal height per screen (big enough to tell what it is): the first step that reaches it wins;
     otherwise the step that leaves the biggest cartoon. On the reading (the dealer reads every caption out loud) the
     two-line stop is used only when the cartoon would otherwise be under 110 px. */
  const STEPS = [{ d: 0, f: 1 }, { d: 1, f: 1 }, { d: 1, f: 0.93 }, { d: 1, f: 0.93, c: 1 }, { d: 1, f: 0.87, c: 1 }, { d: 2, f: 0.87, c: 1 }];
  // (at least 170 px on the reading, 120 on the bets and the reveal; a little more on a taller phone)
  const GOAL = { writing: [170, 0.27], reading: [170, 0.27] }, GOAL_DEFAULT = [120, 0.2], CLAMP_UNDER = { reading: 110 };
  const goalFor = (phase, vh) => { const g = GOAL[phase] || GOAL_DEFAULT; return Math.round(Math.max(g[0], vh * g[1])); };
  let fitMemo = { key: '', i: -1 };
  function applyStep(pg, s) {
    pg.classList.toggle('dense', s.d >= 1);
    pg.classList.toggle('no-toon', s.d === 2);
    pg.classList.toggle('clamp', !!s.c);
    pg.style.setProperty('--fs', String(s.f));
  }
  function fit() {
    const pg = document.querySelector('#game-content .pg');
    if (!pg) return;
    pg.classList.remove('scroll-mid');
    if (pg.querySelector('.pg-wall')) { fitWall(pg); return; }
    const mids = [...pg.querySelectorAll('.pg-mid')];
    const toon = pg.querySelector('.pg-toon');
    const phase = state && state.phase;
    const goal = toon ? goalFor(phase, pg.clientHeight) : 0;
    const thumbOk = !!toon && ['first_bets', 'second_bets', 'reveal', 'answer'].includes(phase) && !toon.classList.contains('framed');
    const tryStep = (i) => {
      applyStep(pg, STEPS[i]);
      if (toon) sizeToon(toon);
      const over = pg.scrollHeight > pg.clientHeight + 1 || mids.some(m => m.scrollHeight > m.clientHeight + 1);
      return { over, h: toon && STEPS[i].d !== 2 ? toon.clientHeight - 8 : 0 };
    };
    const key = pg.dataset.key || '';
    let pick = -1;
    // the same screen again (a chip placed, a Bravo!, a caption opened): keep its step while it still works
    // (the cartoon as big as it was, or the goal; a caption opened in full may take a couple of lines from it)
    let kept = false;
    if (fitMemo.key === key && fitMemo.i >= 0 && fitMemo.i < STEPS.length) {
      const r = tryStep(fitMemo.i);
      const slack = openKeyNow() ? 48 : 2;
      if (!r.over && (!toon || STEPS[fitMemo.i].d === 2 || r.h >= Math.min(goal, fitMemo.h) - slack)) { pick = fitMemo.i; kept = true; }
    }
    if (pick < 0) {
      let best = -1, bestH = -1, bestPlain = -1;
      for (let i = 0; i < STEPS.length; i++) {
        const s = STEPS[i];
        if (s.d === 2 && !thumbOk) break;
        if (s.d === 2 && best >= 0 && bestH >= 64) break;   // the header picture only when nothing else fits
        if (s.c && CLAMP_UNDER[phase] && bestPlain >= CLAMP_UNDER[phase]) break;
        if (!toon && s.c) break;                       // (no cartoon on this screen: nothing to make room for)
        const r = tryStep(i);
        if (r.over) continue;
        if (!toon || s.d === 2) { pick = i; break; }
        if (r.h >= goal) { pick = i; break; }
        if (r.h > bestH + 4) { best = i; bestH = r.h; }
        if (!s.c) bestPlain = Math.max(bestPlain, r.h);
      }
      if (pick < 0) pick = best;
    }
    if (pick < 0) {   // nothing fits: the smallest step, and the middle scrolls inside itself (never the page)
      let last = STEPS.length - 1; while (last > 0 && STEPS[last].d === 2 && !thumbOk) last--;
      pick = last; applyStep(pg, STEPS[pick]); pg.classList.add('scroll-mid');
    } else applyStep(pg, STEPS[pick]);
    if (toon) sizeToon(toon);
    if (!kept) fitMemo = { key, i: pick, h: toon && STEPS[pick].d !== 2 ? toon.clientHeight - 8 : 0 };
    markCut(pg);
  }
  // Captions stopped at two lines: a tap opens them (the reading says so)
  function markCut(pg) {
    let any = false;
    pg.querySelectorAll('.pg-cap').forEach(c => {
      const t = c.querySelector('.pg-t');
      const cut = !!t && pg.classList.contains('clamp') && !c.classList.contains('open') && !c.classList.contains('sel') && t.scrollHeight > t.clientHeight + 2;
      c.classList.toggle('cut', cut); if (cut) any = true;
    });
    pg.classList.toggle('has-cut', any);
  }
  // (Safari is shaky with percentage heights inside flex boxes: the picture gets the box's height in pixels)
  function sizeToon(toon) {
    const img = toon.querySelector('img'); if (!img) return;
    const inset = toon.classList.contains('framed') ? 26 : 8;   // (the gold frame is drawn around the picture)
    const h = Math.max(40, toon.clientHeight - inset), w = Math.max(40, toon.clientWidth - (inset - 8));
    img.style.maxHeight = h + 'px'; img.style.maxWidth = w + 'px';
  }

  /* ── Pieces ── */
  function header() {
    const r = state.totalRounds ? `${state.round}/${state.totalRounds}` : `${state.round}`;
    const over = state.phase === 'scores' && state.gameOver;
    const who = over ? 'Game over' : state.isDealer ? '<b>You</b> deal' : `<b>${dealerName()}</b> deals`;
    // (the small cartoon in the header shows only when a long list leaves no room for the big one: fit())
    const thumb = state.cartoon ? `<button class="pg-thumb" onclick="openViewer()" aria-label="The cartoon. Tap to zoom"><img src="/images/${esc(state.cartoon.image)}" alt=""></button>` : '';
    return `<header class="pg-hd"><span class="pg-rd">${over ? 'Final' : 'Round ' + r}</span><span class="pg-dl">${who}</span><span class="pg-clk" id="pg-clk" aria-live="off"></span>${thumb}<button class="pg-menu" onclick="openMenu()" aria-label="Menu">☰</button></header>`;
  }
  // The cartoon (this round's, or with src another one: the Caption of the Night's, in its gold frame). Tap to zoom.
  function toonHtml(src) {
    if (!src && !state.cartoon) return '<div class="pg-fill"></div>';
    const url = src ? esc(src) : '/images/' + esc(state.cartoon.image);
    return `<button class="pg-toon${src ? ' framed' : ''}" onclick="openViewer(${src ? `'${url}'` : ''})" aria-label="The cartoon. Tap to zoom"><span class="pg-pic"><img src="${url}" alt="" onload="ccPlay.fit()"><span class="pg-zoom" aria-hidden="true">⤢</span></span></button>`;
  }
  const btn = (label, onclick, cls = 'btn-yellow', attrs = '') => `<button class="btn ${cls}" onclick="${onclick}" ${attrs}>${label}</button>`;
  const waitLine = (html) => `<p class="pg-wait" role="status">${html}</p>`;
  // The dealer's one button; everyone else waits for the dealer. The host's phone alone gets the fallback.
  function dealerAct(label, opts = {}) {
    if (state.isDealer) return btn(label, opts.onclick || 'ccPlay.next()', opts.cls || 'btn-yellow', opts.disabled ? 'disabled' : '');
    if (state.canStandIn) return `${waitLine(`${dealerName()}’s phone is off.`)}${btn(`Move on without ${dealerName()}`, 'ccPlay.standIn()', 'btn-ink', opts.disabled ? 'disabled' : '')}`;
    return waitLine(`Waiting for <b>${dealerName()}</b>${state.dealerOff || !state.dealerConnected ? ' (phone off)' : ''}<span class="dots"></span>`);
  }
  const page = (cls, inner, key) => `<div class="pg pg-${cls}" data-key="${esc(key || '')}">${inner}</div>`;

  /* Bravo! on every caption but your own: shown here at once, confirmed by the server */
  let bravoLocal = { tag: '', map: {} };
  function bravoOn(key) {
    if (bravoLocal.tag === tagOf(state) && key in bravoLocal.map) return bravoLocal.map[key];
    return !!(state.myReactions && state.myReactions[key]);
  }
  const isMine = (key) => key === 'closed' ? !!state.iWroteClosed : Number(key) === state.myOpenIndex;
  function bravoHtml(key) {
    if (isMine(key)) return '';
    if (key === 'closed' && !state.flipped) return '';
    if (state.phase === 'scores' && state.gameOver) return '';
    const on = bravoOn(key);
    return `<button class="pg-bravo${on ? ' on' : ''}" aria-pressed="${on}" onclick="event.stopPropagation(); ccPlay.bravo('${key}')">Bravo!</button>`;
  }
  function bravo(key) {
    if (!state) return;
    const on = !bravoOn(key);
    if (bravoLocal.tag !== tagOf(state)) bravoLocal = { tag: tagOf(state), map: {} };
    bravoLocal.map[key] = on;
    send({ action: 'react', target: key === 'closed' ? 'closed' : Number(key), kind: 'ha', on });
    if (on) { buzz(15); safe(() => sfx.tap()); }
    render(true);
  }

  /* The chips on each caption: after the drop, everyone's; before it, only your own (secret) */
  function chipsByKey(opts = {}) {
    const by = {};
    const add = (k, html) => { (by[k] = by[k] || []).push(html); };
    const bets = state.bets || [];
    const fresh = opts.freshDrop;
    bets.forEach((b, bi) => {
      if (!b || b.target === 'pass') return;
      const k = String(b.target);
      for (let j = 0; j < (b.count || 0); j++) {
        if (opts.steal && opts.stealable && opts.stealable.includes(bi)) add(k, `<button class="pg-grab" onclick="ccPlay.steal(${bi})" aria-label="Steal ${esc(nameOf(b.playerId))}’s chip">${chip(b.playerId, '')}</button>`);
        else add(k, chip(b.playerId, (fresh && fresh(b) ? 'drop' : '') + (opts.steal && b.playerId === state.dealerId ? ' dim' : '')));
      }
      for (let j = 0; j < (b.stolen || 0); j++) add(k, W.ccPaintedChip ? safe(() => W.ccPaintedChip(state.dealerId, '', b.playerId)) || chip(b.playerId, 'stolen') : chip(b.playerId, 'stolen'));
    });
    // my secret bet, before the chips drop
    if (state.phase === 'first_bets' && !state.dropAt && state.myFirstBet) for (let j = 0; j < state.myFirstBet.count; j++) add(String(state.myFirstBet.target), chip(myPlayerId, 'secret'));
    if (state.phase === 'second_bets' && !state.lateDropAt && state.mySecondBet) add(String(state.mySecondBet.target), chip(myPlayerId, 'secret'));
    return by;
  }
  // One caption opened in full (when long ones stop at two lines): tap it again, or another, to switch
  let opened = { tag: '', key: null };
  const openOn = (key) => opened.tag === tagOf(state) + state.phase && opened.key === key;
  const openKeyNow = () => (state && ((opened.tag === tagOf(state) + state.phase && opened.key) || selKey())) || '';
  function open(key) {
    if (!state) return;
    const pg = document.querySelector('#game-content .pg');
    const row = pg && pg.querySelector(`.pg-cap[data-k="${key}"]`);
    if (!openOn(key) && !(row && (row.classList.contains('cut') || pg.classList.contains('clamp')))) return;   // (nothing is cut: a tap does nothing)
    opened = { tag: tagOf(state) + state.phase, key: openOn(key) ? null : key };
    render(true);
  }
  // The captions on the table, numbered, and the face-down one last
  function capsHtml(o = {}) {
    const list = (state.openCaptions || []).map((t, i) => ({ key: String(i), n: i + 1, text: t }));
    list.push({ key: 'closed', n: 'CC', text: null });
    const chips = o.chips ? chipsByKey(o) : {};
    const rows = list.filter(r => !o.onlyChipped || (chips[r.key] || []).length).map(r => {
      const up = r.key !== 'closed' || state.flipped;
      const text = up ? esc(r.key === 'closed' ? state.closedCaption : r.text) : 'Face down';
      const mine = isMine(r.key) ? '<span class="pg-yours">yours</span>' : '';
      const sel = o.sel === r.key ? ' sel' : '';
      // (a tap on a caption that isn't a bet opens it, when long captions stop at two lines)
      const pick = o.pick ? ` role="button" tabindex="0" onclick="ccPlay.pick('${r.key}')" aria-pressed="${o.sel === r.key}"` : up ? ` onclick="ccPlay.open('${r.key}')"` : '';
      const flipIn = r.key === 'closed' && o.flipIn ? ' flip-in' : '';
      const opened = !o.pick && openOn(r.key) ? ' open' : '';
      return `<div class="pg-cap${sel}${flipIn}${opened}"${pick} data-k="${r.key}"><span class="pg-n${r.key === 'closed' ? ' cc' : ''}">${r.n}</span><span class="pg-t${up ? '' : ' down'}">${up ? '“' + text + '”' : text}${mine}</span>${(chips[r.key] || []).length ? `<span class="pg-chips">${chips[r.key].join('')}</span>` : ''}${o.bravo ? bravoHtml(r.key) : ''}</div>`;
    });
    return `<div class="pg-caps">${rows.join('')}</div>`;
  }

  /* ── WRITING ── */
  function draftKey() { return state && state.cartoon ? `${gameCode}|${state.round}|${state.cartoon.id}` : ''; }
  let draft = { key: '', text: '' };
  try { draft = JSON.parse(sessionStorage.getItem('cc_draft') || 'null') || draft; } catch (e) {}
  function saveDraftNow() { try { sessionStorage.setItem('cc_draft', JSON.stringify(draft)); } catch (e) {} }
  function draftText() { return draft.key === draftKey() ? draft.text || '' : ''; }
  let check = null;   // the server's spelling question: { text, fixed, typos }
  function writingHtml() {
    const s = state, max = s.captionMax || 100;
    const votes = (s.mulliganVotes || []).length, need = s.mulliganNeeded || 2;
    const waiting = (s.waitingWriters || []).filter(id => id !== myPlayerId);
    const inN = (s.submittedPlayerIds || []).length, all = inN + (s.waitingWriters || []).length;
    const status = waiting.length ? `${inN} of ${all} in · waiting for ${waitNames(waiting)}` : `${inN} of ${all} in`;
    const skip = `<span data-live="skip"><button class="pg-skip${s.myMulligan ? ' on' : ''}" onclick="ccPlay.skip()" aria-pressed="${!!s.myMulligan}">${s.myMulligan ? '✓ Skip' : 'Skip this cartoon'}${votes ? ` · ${votes} of ${need}` : ''}</button></span>`;
    if (s.hasSubmitted) {
      const stopBtn = s.isDealer && !s.timerDuration && inN >= 2 && waiting.length ? btn('Stop writing', 'ccPlay.stopWriting()', 'btn-sm') : '';
      return page('writing', header() + toonHtml() +
        `<div class="pg-mid"><p class="pg-mine">“${esc(s.myCaption || '')}”</p></div>` +
        `<div class="pg-act">${waiting.length ? waitLine(`Waiting for <b>${waitNames(waiting)}</b><span class="dots"></span>`) : waitLine('Everyone’s in.')}${stopBtn}</div>`,
        ['w', tagOf(s), s.cartoon && s.cartoon.id, 1].join('|'));
    }
    const ck = check && check.text === currentInput() ? check : null;
    const checkHtml = ck ? `<div class="pg-check" data-live="check"><p>Fix the spelling? <b>${esc(ck.fixed)}</b></p><div class="btn-row">${btn('Fix it', "ccPlay.submit('fix')", 'btn-yellow')}${btn('Keep mine', "ccPlay.submit('keep')", '')}</div></div>` : '<span data-live="check"></span>';
    return page('writing', header() + toonHtml() +
      `<div class="pg-under">${skip}<span class="pg-hint">Tap the cartoon to zoom</span></div>` +
      checkHtml +
      `<div class="pg-compose"><textarea id="caption-input" rows="1" maxlength="${max}" placeholder="Your fake caption" enterkeyhint="send" autocomplete="off" autocapitalize="sentences" oninput="ccPlay.onInput(this)" onfocus="ccPlay.onFocus()" onblur="ccPlay.onBlur()" aria-label="Your caption"></textarea><button class="pg-send" id="pg-send" onclick="ccPlay.submit()" aria-label="Send">Send</button></div>` +
      `<p class="pg-status" data-live="status">${status}</p>`,
      ['w', tagOf(s), s.cartoon && s.cartoon.id, 0].join('|'));
  }
  const currentInput = () => { const i = $('caption-input'); return i ? i.value : draftText(); };
  function growInput(i) { if (!i) return; i.style.height = 'auto'; i.style.height = Math.min(96, Math.max(48, i.scrollHeight + 2)) + 'px'; }
  function onInput(i) {
    draft = { key: draftKey(), text: i.value }; saveDraftNow();
    growInput(i);
    if (check && check.text !== i.value) { check = null; const c = document.querySelector('[data-live="check"]'); if (c) { c.outerHTML = '<span data-live="check"></span>'; fit(); } }
  }
  let typingOff = null;
  function onFocus() { clearTimeout(typingOff); document.body.classList.add('typing'); fitSoon(); }
  function onBlur() { clearTimeout(typingOff); typingOff = setTimeout(() => { document.body.classList.remove('typing'); fitSoon(); }, 150); }
  let sending = false, autoSent = '';
  function submit(mode) {
    const i = $('caption-input'), text = (i ? i.value : draftText()).trim();
    if (!text) { if (i) i.focus(); showToast('Write something first.'); return; }
    if (sending) return;
    sending = true; setTimeout(() => { sending = false; }, 4000);
    const b = $('pg-send'); if (b) b.disabled = true;
    send({ action: 'submit_caption', caption: text, mode: mode || 'check' });
    safe(() => sfx.submitSelf()); buzz(25);
  }
  function onCheck(msg) {
    sending = false;
    const i = $('caption-input');
    check = { text: i ? i.value : draftText(), fixed: msg.fixed || msg.polished || '', typos: msg.typos || [] };
    const b = $('pg-send'); if (b) b.disabled = false;
    render(true);
  }
  // The server said no (a caption too long or too close to the real one, a chip that's gone): try again
  function onError() {
    sending = false; W._stealSent = null;
    const b = $('pg-send'); if (b) b.disabled = false;
  }
  function skip() { if (send({ action: 'mulligan' })) buzz(15); }
  function stopWriting() { if (confirm('Stop the writing now? Anyone still writing sits this one out.')) send({ action: 'end_writing' }); }

  /* ── READING ── */
  function readingHtml() {
    return page('reading', header() + toonHtml() +
      `<div class="pg-mid">${capsHtml({ bravo: true })}</div>` +
      `<div class="pg-act"><p class="pg-tip pg-cut-tip">Tap a caption to read it all.</p>${state.isDealer ? '<p class="pg-tip pg-opt">Read them out loud.</p>' : ''}${dealerAct('Start the bets')}</div>`, 'r|' + tagOf(state));
  }

  /* ── BETS (blind, and the last chips): everyone at once, in secret ── */
  let sel = { tag: '', key: null };
  const selKey = () => (sel.tag === tagOf(state) + state.phase ? sel.key : null);
  function pick(key) {
    if (!state || !state.isMyTurn) return;
    sel = { tag: tagOf(state) + state.phase, key: selKey() === key ? null : key };
    safe(() => sfx.tap());
    render(true);
  }
  function placeBet(count) {
    const k = selKey(); if (k === null) return;
    send({ action: 'place_bet', target: k === 'closed' ? 'closed' : Number(k), count });
    safe(() => sfx.chip(count)); buzz(20);
    sel = { tag: '', key: null };
  }
  function undo() { send({ action: 'undo_bet' }); }
  function moreTime() { send({ action: 'more_bet_time' }); }
  let dropSeen = {};
  function betsHtml(stage) {
    const s = state, dropped = stage === 1 ? !!s.dropAt : !!s.lateDropAt;
    const mineBet = stage === 1 ? s.myFirstBet : s.mySecondBet;
    const k = selKey();
    const dropTag = tagOf(s) + '|' + stage;
    const freshDrop = dropped && !dropSeen[dropTag] ? (b) => b.stage === stage : null;
    if (dropped && !dropSeen[dropTag]) { dropSeen[dropTag] = 1; setTimeout(() => { safe(() => bsfx.chip(2)); buzz(30); }, 80); }
    const flipTag = tagOf(s) + '|flip';
    const flipIn = stage === 2 && s.flipAt && !played[flipTag] && now() - s.flipAt < 4000;
    if (flipIn) { played[flipTag] = 1; safe(() => { noise(0.1, 0, 0.16, 3400, 'bandpass'); tone(150, 0.12, 90, 'sine', 0.14, 85); }); }
    const caps = capsHtml({ pick: s.isMyTurn, sel: k, chips: true, freshDrop, bravo: true, flipIn });
    const pending = (s.pendingBetters || []).filter(id => id !== myPlayerId);
    const more = !dropped && !s.betMore && (stage === 1 ? s.blindEnd : s.lateEnd) ? `<button class="btn btn-sm pg-more" onclick="ccPlay.moreTime()">+20 s</button>` : '';
    let act = '';
    if (dropped) act = stage === 1 ? waitLine('The chips are down.') : dealerAct('Reveal the answers');
    else if (s.isMyTurn) {
      if (k === null) act = `<div class="pg-inline"><p class="pg-tip">${stage === 1 ? 'Tap the caption you think is real.' : 'One chip left. Tap where it goes.'}</p>${more}</div>`;
      else act = stage === 1 ? `<div class="btn-row">${btn('1 chip', 'ccPlay.placeBet(1)', 'btn-yellow')}${btn('2 chips', 'ccPlay.placeBet(2)', 'btn-yellow')}</div>` : btn('Put my last chip here', 'ccPlay.placeBet(1)');
    } else if (mineBet) {
      act = `<div class="pg-inline"><span class="pg-line">Your ${mineBet.count === 2 ? '2 chips are' : 'chip is'} on ${mineBet.target === 'closed' ? 'the face-down one' : '#' + (Number(mineBet.target) + 1)}.</span><button class="btn btn-sm pg-more" onclick="ccPlay.undo()">Take it back</button>${more}</div>${pending.length ? waitLine(`Waiting for <b>${waitNames(pending)}</b>`) : ''}`;
    } else act = `<div class="pg-inline">${waitLine(pending.length ? `Waiting for <b>${waitNames(pending)}</b>` : 'Waiting for the bets')}${more}</div>`;
    return page(stage === 1 ? 'bets' : 'late', header() + toonHtml() + `<div class="pg-mid">${caps}</div><div class="pg-act">${act}</div>`, 'b' + stage + '|' + tagOf(s));
  }

  /* ── THE STEAL: forced. The dealer's phone: "Tap a chip to steal it", big chips. Nobody else can do anything. ── */
  function stealHtml() {
    const s = state, mine = s.isDealer;
    const caps = capsHtml({ chips: true, steal: mine, stealable: s.stealable || [], onlyChipped: true });
    const title = mine ? 'Tap a chip to steal it' : `${dealerName()} is choosing a chip to steal`;
    const act = mine ? '' : `<div class="pg-act">${s.canStandIn ? `${waitLine(`${dealerName()}’s phone is off.`)}${btn(`Move on without ${dealerName()}`, 'ccPlay.standIn()', 'btn-ink')}` : waitLine(`Waiting for <b>${dealerName()}</b>${s.dealerOff ? ' (phone off)' : ''}<span class="dots"></span>`)}</div>`;
    return page('steal', header() + `<h2 class="pg-title">${title}</h2><div class="pg-mid grow">${caps}</div>` + act, 'st|' + tagOf(s) + '|' + mine);
  }
  const played = {};
  function playStealShow() {
    const st = state.steal;
    if (!st || !st.at || !W.ccClaw) return;
    const k = tagOf(state) + '|steal';
    if (played[k]) return;
    played[k] = 1;
    const sy = W.ccSync ? W.ccSync(st.at) : { wait: 0, late: 0 };
    const len = safe(() => W.ccClaw.lengthFor(st)) || 4500;
    if (sy.late > len - 800) return;   // long over (a phone that just came back): the screen already shows what happened
    safe(() => W.ccClaw.play(sy.wait));
  }

  /* ── THE FLIP: the dealer turns the face-down caption over ── */
  function stealLine() {
    const st = state.steal;
    if (!st || !st.victimId) return '';
    if (now() < (state.stealEnd || 0)) return '';
    const v = st.victimId === myPlayerId ? 'your' : esc(first(st.victimId)) + '’s';
    return `<p class="pg-line">${state.isDealer ? 'You' : dealerName()} stole ${v} chip.</p>`;
  }
  function revealHtml() {
    const s = state;
    const flipTag = tagOf(s) + '|flip';
    const flipIn = s.flipped && s.flipAt && !played[flipTag] && now() - s.flipAt < 4000;
    if (flipIn) { played[flipTag] = 1; safe(() => { noise(0.1, 0, 0.16, 3400, 'bandpass'); tone(150, 0.12, 90, 'sine', 0.14, 85); }); buzz(20); }
    const showing = now() < (s.stealEnd || 0);
    const act = !s.flipped ? dealerAct(showing ? 'Flip it' : 'Flip it', { onclick: 'ccPlay.flip()', disabled: showing }) : `${waitLine('Nobody has a chip left.')}${dealerAct('Reveal the answers')}`;
    return page('reveal', header() + toonHtml() + `<div class="pg-mid">${stealLine()}${capsHtml({ chips: true, bravo: true, flipIn })}</div><div class="pg-act">${act}</div>`, 'rv|' + tagOf(s));
  }

  /* ── THE REVEAL: one caption at a time, at the dealer's pace ── */
  const reelInfo = () => { const r = state.reel || { order: [], step: 1, nobody: 0 }; return { order: r.order || [], step: r.step || 1, n: (r.order || []).length, k: r.nobody || 0 }; };
  function capOf(key) {
    const d = state.openCaptionDetails || [];
    if (key === 'closed') return { caption: state.closedCaption, playerId: state.closedPlayerId, isCorrect: !!state.closedIsCorrect, closed: true };
    const c = d[Number(key)] || {};
    return { caption: c.caption, playerId: c.playerId, isCorrect: !!c.isCorrect, n: Number(key) + 1 };
  }
  const betsOn = (key) => (state.bets || []).filter(b => b && b.target !== 'pass' && String(b.target) === key);
  function fakeCard(key, pos, n) {
    const c = capOf(key), w = c.playerId, fs = SET();
    const on = betsOn(key).filter(b => b.playerId !== w && (b.count || 0) + (b.stolen || 0) > 0);
    const people = [...new Set(on.map(b => b.playerId))];
    const chips = on.reduce((a, b) => a + (b.count || 0) + (b.stolen || 0), 0);
    const framed = (state.framed || []).includes(key);
    const writer = w === myPlayerId ? 'You wrote it' : `<b>${esc(first(w))}</b> wrote it`;
    const fooled = people.length ? `Fooled ${people.map(id => chip(id, '')).join('')} ${esc(listN(people.map(id => id === myPlayerId ? 'you' : first(id))))}` : 'Nobody fell for it.';
    return `<div class="pg-card${framed ? ' framed' : ''}"><p class="pg-kick">${c.closed ? 'The face-down one' : '#' + c.n} · ${pos} of ${n}</p><p class="pg-big">“${esc(c.caption || '')}”</p>
      <p class="pg-who">${chip(w, '')} ${writer}${chips ? `<span class="pg-pts">+${chips * (fs.pointsPerFool || 2)}</span>` : ''}</p>
      <p class="pg-who">${fooled}</p>
      ${framed ? '<p class="pg-frame-note">Framed. It hangs in The Gallery.</p>' : ''}
      ${!framed && w !== myPlayerId ? `<div class="pg-card-row">${bravoHtml(key)}</div>` : ''}</div>`;
  }
  function nobodyCard(keys) {
    return `<div class="pg-card"><p class="pg-kick">Nobody fell for these</p><div class="pg-nob">${keys.map(k => { const c = capOf(k); return `<p><i>“${esc(c.caption || '')}”</i> — ${c.playerId === myPlayerId ? 'you' : esc(first(c.playerId))}</p>`; }).join('')}</div></div>`;
  }
  function realCard(key) {
    const c = capOf(key), fs = SET();
    const found = betsOn(key).filter(b => (b.count || 0) > 0);
    const per = (b) => (b.stage === 1 ? (key === 'closed' ? fs.pointsClosedBet || 5 : fs.pointsOpenBet || 2) : fs.pointsOpenLate || 1) * b.count;
    const pts = {}; found.forEach(b => { pts[b.playerId] = (pts[b.playerId] || 0) + per(b); });
    const ids = Object.keys(pts);
    const st = state.steal, dl = state.dealerId;
    const stoleIt = st && st.victimId && st.onCorrect;
    const rows = ids.map(id => `<p class="pg-who">${chip(id, '')} ${id === myPlayerId ? 'You' : esc(first(id))} found it<span class="pg-pts">+${pts[id]}</span></p>`).join('');
    const none = !ids.length ? '<p class="pg-who">Nobody found it.</p>' : '';
    const revenge = state.dealerBonusAwarded ? `<p class="pg-who">${chip(dl, '')} ${dl === myPlayerId ? 'Your' : esc(first(dl)) + '’s'} revenge<span class="pg-pts">+${fs.dealerBonus || 4}</span></p>` : '';
    const stole = stoleIt ? `<p class="pg-who">${chip(dl, '')} ${dl === myPlayerId ? 'You' : esc(first(dl))} stole a chip off it<span class="pg-pts">+${st.stage === 1 ? (st.target === 'closed' ? fs.pointsClosedBet || 5 : fs.pointsOpenBet || 2) : fs.pointsOpenLate || 1}</span></p>` : '';
    return `<div class="pg-card real"><p class="pg-kick">The real caption${c.closed ? ' · it was face down' : ' · #' + c.n}</p><p class="pg-big">“${esc(c.caption || '')}”</p>${rows}${none}${stole}${revenge}</div>`;
  }
  function answerHtml() {
    const { order, step, n, k } = reelInfo();
    const key = order[Math.min(step, n) - 1];
    let card = '';
    const realKey = order[n - 1];
    const isReal = key === realKey && capOf(key).isCorrect;
    if (k && step <= k) card = nobodyCard(order.slice(0, k));
    else if (isReal) card = realCard(key);
    else card = fakeCard(key, step - (k ? k - 1 : 0), n - (k ? k - 1 : 0) - 1);
    const last = step >= n;
    return page('answer', header() + toonHtml() + `<div class="pg-mid">${card}</div><div class="pg-act">${dealerAct(last ? 'Scores' : 'Next')}</div>`, 'a|' + tagOf(state) + '|' + step);
  }

  /* ── SCORES ── */
  function scoreRows(o = {}) {
    const ps = [...state.players].filter(p => !p.gone || p.score > 0).sort((a, b) => b.score - a.score);
    const rs = state.roundScores || {};
    let rank = 0, prev = null;
    return `<div class="pg-sc">${ps.map((p, i) => { if (p.score !== prev) { rank = i + 1; prev = p.score; } const r = rs[p.id] || 0; const win = o.winners && o.winners.includes(p.id);
      return `<div class="pg-sr${p.id === myPlayerId ? ' me' : ''}${win ? ' win' : ''}"><span class="pg-rk">${rank}</span>${chip(p.id, '')}<span class="pg-nm">${esc(p.name)}${p.id === myPlayerId ? ' (you)' : ''}</span>${o.round !== false ? `<span class="pg-rp">${r ? '+' + r : ''}</span>` : ''}<span class="pg-tot">${p.score}</span></div>`; }).join('')}</div>`;
  }
  function scoresHtml() {
    const nd = state.nextDealerId;
    const next = state.endsNext ? 'Last round done.' : nd ? (nd === myPlayerId ? 'You deal next.' : `${esc(first(nd))} deals next.`) : '';
    return page('scores', header() + `<h2 class="pg-title">Scores</h2><div class="pg-mid grow">${scoreRows()}${next ? `<p class="pg-tip">${next}</p>` : ''}</div><div class="pg-act">${dealerAct(state.endsNext ? 'Final scores' : 'Next round')}</div>`, 's|' + tagOf(state));
  }

  /* ── THE END OF THE GAME: the winner and final scores → everyone's rating and line → Caption of the Night ── */
  const hostAct = (label, onclick) => state.isHost ? btn(label, onclick) : waitLine(`Waiting for <b>${hostName()}</b><span class="dots"></span>`);
  let cheered = {};
  function winnerHtml() {
    const st = state.standing || {}, w = st.winners || [];
    const names = w.map(id => id === myPlayerId ? 'You' : esc(first(id)));
    const head = w.length > 1 ? `${listN(names)} tie!` : `${names[0] || ''} ${w[0] === myPlayerId ? 'win!' : 'wins!'}`;
    const why = st.by === 'fooled' ? '<p class="pg-tip">Tied on points: fooled the most.</p>' : st.by === 'framed' ? '<p class="pg-tip">Tied on points: framed the most.</p>' : '';
    const k = tagOf(state) + '|win';
    if (!cheered[k]) { cheered[k] = 1; setTimeout(() => { safe(() => bsfx.fanfare()); safe(() => confetti.burst()); }, 300); }
    return page('final', header() + `<div class="pg-win">${head}</div>${why}<div class="pg-mid grow">${scoreRows({ winners: w })}</div><div class="pg-act">${hostAct('Next', "ccPlay.ending(0)")}</div>`, 'f0|' + tagOf(state));
  }
  function ratingsHtml() {
    const R = state.rating, frames = state.framedTonight || 0;
    let rows = '';
    if (R && R.rows) {
      const order = (R.order && R.order.length ? R.order : Object.keys(R.rows));
      rows = order.map(id => { const r = R.rows[id]; if (!r) return ''; const d = r.delta || 0; const line = r.line && r.line.text ? r.line.text : '';
        return `<div class="pg-sr pg-rt${id === myPlayerId ? ' me' : ''}"><span class="pg-rt1">${chip(id, '')}<span class="pg-nm">${esc(first(id))}</span><span class="pg-d ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${d > 0 ? '+' : ''}${d}</span><span class="pg-tot">${Number(r.after).toLocaleString('en-US')}</span></span>${line ? `<span class="pg-vl">${esc(line)}</span>` : ''}</div>`; }).join('');
    }
    if (!rows) rows = '<p class="pg-tip">No ratings this game.</p>';
    const next = frames ? hostAct('Next: Caption of the Night', "ccPlay.ending(1)") : hostAct('Play again', 'ccPlay.again()');
    return page('final', header() + `<h2 class="pg-title">Ratings</h2><div class="pg-mid grow"><div class="pg-sc">${rows}</div></div><div class="pg-act">${next}</div>`, 'f1|' + tagOf(state));
  }
  let localVote = { tag: '', key: null };
  function vote(key) {
    const f = state && state.finale; if (!f || f.winner || !f.canVote) return;
    const e = (f.entries || []).find(x => x.key === key); if (!e || e.writerId === myPlayerId) return;
    if (send({ action: 'finale_vote', key })) { localVote = { tag: state.code + '|' + f.at, key }; buzz(20); safe(() => sfx.tap()); render(true); }
  }
  function finaleHtml() {
    const f = state.finale;
    if (!f) return ratingsHtml();
    if (W.ccFinale && f.winner) safe(() => W.ccFinale.sync());   // the ceremony, once, on every phone together
    if (f.winner) {
      // The last screen of the game: the framed card (tap the picture to zoom), and one button: the host's Play again
      // (everyone else: Save the card, and who they're waiting for)
      const e = (f.entries || []).find(x => x.key === f.winner) || {};
      const who = e.writerId === myPlayerId ? 'by you' : 'by ' + esc(e.writerName || first(e.writerId));
      const act = state.isHost
        ? `${btn('Play again', 'ccPlay.again()')}<button class="btn-link pg-save" onclick="ccFinale.saveClean()">Save the card</button>`
        : `${btn('Save the card', 'ccFinale.saveClean()', '')}${waitLine(`Waiting for <b>${hostName()}</b> to play again<span class="dots"></span>`)}`;
      return page('final pg-cotn', header() +`<h2 class="pg-title">Caption of the Night</h2>` + toonHtml('/images/' + (e.image || '')) +
        `<div class="pg-mid"><p class="pg-big pg-memo-c">“${esc(e.caption || '')}”</p><p class="pg-tip">${who}</p></div><div class="pg-act">${act}</div>`, 'f3|' + tagOf(state));
    }
    // The vote: one row per framed caption, the whole caption always there to read (the type shrinks to fit, never cut)
    const mine = localVote.tag === state.code + '|' + f.at ? localVote.key : f.myVote;
    const cards = (f.entries || []).map(e => { const own = e.writerId === myPlayerId; const can = f.canVote && !own;
      return `<button class="pg-fr${mine === e.key ? ' on' : ''}" ${can ? `onclick="ccPlay.vote('${esc(e.key)}')"` : 'disabled'} aria-pressed="${mine === e.key}"><span class="pg-fpic"><img src="/images/${esc(e.image)}" alt="" onload="ccPlay.fit()"></span><span class="pg-ftx"><span class="pg-fc">“${esc(e.caption)}”</span><span class="pg-fb">${own ? 'Yours' : esc(e.writerName || first(e.writerId))}${mine === e.key ? ' · your vote' : ''}</span></span></button>`; }).join('');
    const voters = (f.voters || []).length, decided = (f.decided || []).length;
    const tip = f.canVote ? (mine ? 'Voted. Tap another to change it.' : 'Tap the best one. Not your own.') : 'They’re all yours. The table is voting.';
    const act = state.isHost ? `${waitLine(`${decided} of ${voters} voted`)}${decided ? btn('Count the votes', "ccPlay.countVotes()", '') : ''}` : waitLine(`${decided} of ${voters} voted`);
    return page('final', header() + `<h2 class="pg-title">Caption of the Night?</h2><p class="pg-tip">${tip}</p><div class="pg-mid grow"><div class="pg-wall">${cards}</div></div><div class="pg-act">${act}</div>`, 'f2|' + tagOf(state));
  }
  /* The vote's rows: the biggest picture and the biggest type that let every caption show in full */
  const WALL = (() => { const c = []; for (const f of [1, 0.92, 0.85]) for (const th of [150, 128, 108, 92, 80]) c.push([th, f]); for (const th of [68, 58]) for (const f of [0.85, 0.78, 0.72]) c.push([th, f]); return c; })();
  function fitWall(pg) {
    const wall = pg.querySelector('.pg-wall'); if (!wall) return false;
    pg.classList.toggle('dense', pg.clientHeight < 760);
    const rows = [...wall.querySelectorAll('.pg-fr')];
    const fits = () => pg.scrollHeight <= pg.clientHeight + 1 && wall.scrollHeight <= wall.clientHeight + 1 && rows.every(r => r.scrollHeight <= r.clientHeight + 1);
    for (const [th, f] of WALL) {
      pg.style.setProperty('--th', th + 'px'); pg.style.setProperty('--fs', String(f));
      if (fits()) return true;
    }
    pg.classList.add('scroll-mid');
    return true;
  }
  function endingHtml() {
    const step = (state.ending && state.ending.step) || 0;
    if (step === 0) return winnerHtml();
    if (step === 1) return ratingsHtml();
    return finaleHtml();
  }

  /* ── Moments that play once, on every phone ── */
  function framedMoments() {
    const li = state.lastInduction;
    if (!li) return;
    safe(() => collectGallery());
    if (typeof lastIndN === 'undefined') return;
    if (lastIndN === null) { lastIndN = li.n || 0; if (!(state.phase === 'answer' && li.round === state.round && now() - (li.at || 0) < 4000)) return; lastIndN = (li.n || 1) - 1; }
    if ((li.n || 0) <= lastIndN) return;
    lastIndN = li.n || 0;
    const mine = li.writerId === myPlayerId;
    safe(() => big(() => { tone(1318, 0.18, 0, 'sine', 0.04); tone(1976, 0.32, 110, 'sine', 0.03); }));
    buzz(mine ? [50, 40, 90] : 25);
    safe(() => srSay(`Framed: ${li.author || 'a caption'}.`));
    if (mine) setTimeout(() => showToast('Your caption is framed. It hangs in The Gallery.', 'ok'), 200);
  }
  let lastRound = 0, stealT = null, clockT = null, sayKey = '';
  function stageSay() {
    const s = state, d = firstName(s.dealerName || '');
    const line = { writing: `Round ${s.round}. ${s.isDealer ? 'You deal.' : d + ' deals.'} Write a caption.`, reading: s.isDealer ? 'Read the captions out loud, then start the bets.' : `${d} reads the captions.`, first_bets: 'Bet. Everyone at once, in secret.', steal: s.isDealer ? 'Tap a chip to steal it.' : `${d} is choosing a chip to steal.`, reveal: 'The face-down caption.', second_bets: 'Last chips.', answer: 'Who wrote what.', scores: s.gameOver ? 'Final scores.' : 'Scores.' }[s.phase];
    if (line) safe(() => srSay(line));
  }

  /* ── The clock in the header: writing, blind bets, last chips ── */
  function clockTick() {
    const el = $('pg-clk'); if (!el || !state) return;
    let end = null;
    if (state.phase === 'writing') end = state.timerEnd;
    else if (state.phase === 'first_bets' && !state.dropAt) end = state.blindEnd;
    else if (state.phase === 'second_bets' && !state.lateDropAt) end = state.lateEnd;
    if (!end) { el.textContent = ''; el.classList.remove('low'); return; }
    const left = Math.max(0, Math.ceil((end - now()) / 1000));
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('low', left <= 10);
    if (state.phase === 'writing' && !state.hasSubmitted) {
      if (left <= 10 && left > 0 && el.dataset.t !== String(left)) safe(() => sfx.tick());
      // out of time with something written: it goes in as it is (with the spelling fixed)
      const k = tagOf(state) + '|' + (state.cartoon && state.cartoon.id);
      if (left <= 0 && autoSent !== k && currentInput().trim()) { autoSent = k; submit('fix'); }
    }
    el.dataset.t = String(left);
  }

  /* ── Render: the lobby is the other screen family (it scrolls); every in-game screen is one fixed page ── */
  function render(force = false) {
    if (!state) return;
    // The Caption of the Night ceremony belongs to the end of the game: once the game moves on it's gone, on every phone
    if (!(state.phase === 'scores' && state.gameOver && state.finale && state.finale.winner) && W.ccFinale) safe(() => W.ccFinale.close());
    if (!$('screen-game').classList.contains('active')) return;
    const el = $('game-content');
    const phaseChanged = lastPhase !== state.phase || lastRound !== state.round;
    if (state.phase === 'lobby') {
      document.body.classList.remove('in-play'); document.documentElement.classList.remove('in-play');
      clearInterval(clockT); clockT = null;
      const openDetails = new Set(); el.querySelectorAll('details[open]').forEach(d => { if (d.id) openDetails.add(d.id); });
      const y = W.scrollY;
      let html = '';
      try { html = (has('hostAwayHtml') ? hostAwayHtml() : '') + (has('renderLobby') ? renderLobby() : ''); } catch (e) { console.error('lobby', e); html = '<p class="sub center">Lobby</p>'; }
      el.innerHTML = html;
      el.querySelectorAll('details').forEach(d => { if (d.id && openDetails.has(d.id)) d.open = true; });
      W.scrollTo(0, phaseChanged ? 0 : y);
      try { setActionBar(has('lobbyBarHtml') ? lobbyBarHtml() : ''); } catch (e) { setActionBar(''); }
      if (phaseChanged && lastPhase) { safe(() => sendSeen()); safe(() => closeMenu()); }
      lastPhase = state.phase; lastRound = state.round; lastKey = 'lobby';
      return;
    }
    document.body.classList.add('in-play'); document.documentElement.classList.add('in-play');
    syncViewport();
    setActionBar('');
    if (phaseChanged) {
      check = null; sending = false;
      if (!($('sheet-body') && $('sheet-body').querySelector('[onclick^="shareHofCard"]'))) safe(() => closeMenu());
      if (state.phase !== 'writing') document.body.classList.remove('typing');
      W.scrollTo(0, 0);
    }
    safe(() => recordSeen()); safe(() => recordCareer());
    framedMoments();
    let html = '';
    try {
      switch (state.phase) {
        case 'writing': html = writingHtml(); break;
        case 'reading': html = readingHtml(); break;
        case 'first_bets': html = betsHtml(1); break;
        case 'steal': html = stealHtml(); break;
        case 'reveal': html = revealHtml(); break;
        case 'second_bets': html = betsHtml(2); break;
        case 'answer': html = answerHtml(); break;
        case 'scores': html = state.gameOver ? endingHtml() : scoresHtml(); break;
        default: html = page('wait', header() + '<div class="pg-fill"></div>' + waitLine('One moment'), 'x');
      }
    } catch (e) { console.error('render', e); html = page('wait', header() + '<div class="pg-fill"></div>' + waitLine('One moment<span class="dots"></span>'), 'err'); }
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    const fresh = tpl.content.firstElementChild, cur = el.querySelector('.pg');
    const input = $('caption-input');
    if (!force && cur && fresh && cur.dataset.key === fresh.dataset.key && input && state.phase === 'writing') {
      // the caption box stays exactly as it is (focus, keyboard, what's typed): only the live bits change
      fresh.querySelectorAll('[data-live]').forEach(n => { const old = cur.querySelector(`[data-live="${n.dataset.live}"]`); if (old && old.outerHTML !== n.outerHTML) old.replaceWith(n); });
    } else if (force && cur && fresh && cur.dataset.key === fresh.dataset.key && input && state.phase === 'writing') {
      fresh.querySelectorAll('[data-live]').forEach(n => { const old = cur.querySelector(`[data-live="${n.dataset.live}"]`); if (old) old.replaceWith(n); });
    } else {
      el.innerHTML = '';
      el.appendChild(fresh || document.createTextNode(''));
      if (state.phase === 'writing' && !state.hasSubmitted) {
        const i = $('caption-input');
        if (i) { const t = draftText(); if (t) { i.value = t; growInput(i); } }
      }
    }
    // the moments
    if (state.phase === 'steal' && state.nextThief) safe(() => loadFilm(state.nextThief));
    if (state.phase === 'steal' && phaseChanged && state.isDealer) { safe(() => sfx.evil()); buzz([50, 50, 50]); }
    if (['reveal', 'second_bets'].includes(state.phase)) playStealShow();
    clearTimeout(stealT);
    if (state.phase === 'reveal' && now() < (state.stealEnd || 0)) stealT = setTimeout(() => render(true), Math.max(50, state.stealEnd - now() + 60));
    if (phaseChanged) {
      if (state.phase === 'writing') buzz(30);
      if (state.phase === 'reading') { (state.openCaptions || []).forEach((_, i) => setTimeout(() => safe(() => bsfx.deal(i)), 120 + i * 140)); }
      if ((state.phase === 'first_bets' || state.phase === 'second_bets') && state.isMyTurn) { safe(() => sfx.yourTurn()); buzz([60, 80, 60]); }
      if (state.phase === 'answer') safe(() => bsfx.advance());
    }
    if (state.phase === 'answer') { const { step, n } = reelInfo(); const k = tagOf(state) + '|real'; if (step >= n && !played[k]) { played[k] = 1; safe(() => bsfx.tada()); } }
    if (!clockT) clockT = setInterval(clockTick, 250);
    clockTick();
    fit();
    const sk = state.phase + '|' + tagOf(state);
    if (sk !== sayKey) { sayKey = sk; stageSay(); }
    lastPhase = state.phase; lastRound = state.round; lastKey = el.querySelector('.pg') ? el.querySelector('.pg').dataset.key : '';
  }

  /* ── The dealer's button, the host's fallback, the rest ── */
  function next() {
    if (!state || !state.isDealer) return;
    const r = state.reel;
    send({ action: 'advance', phase: state.phase, round: state.round, step: state.phase === 'answer' && r ? r.step : undefined, flipped: state.phase === 'reveal' ? !!state.flipped : undefined });
    safe(() => sfx.tap()); buzz(15);
  }
  function flip() { next(); }
  function standIn() {
    if (!state || !state.canStandIn) return;
    if (!confirm(`Move on without ${firstName(state.dealerName || 'the dealer')}? The game makes their choice for them.`)) return;
    const r = state.reel;
    send({ action: 'stand_in', phase: state.phase, round: state.round, step: state.phase === 'answer' && r ? r.step : undefined, flipped: state.phase === 'reveal' ? !!state.flipped : undefined });
  }
  function steal(i) {
    if (!state || state.phase !== 'steal' || !state.isDealer) return;
    if (W._stealSent === tagOf(state)) return;
    W._stealSent = tagOf(state);
    send({ action: 'steal', betIndex: i });
    safe(() => sfx.evil()); buzz(40);
    setTimeout(() => { if (W._stealSent === tagOf(state) && state.phase === 'steal') W._stealSent = null; }, 4000);
  }
  function ending(step) { send({ action: 'ending_next', step }); safe(() => sfx.tap()); }
  function countVotes() { send({ action: 'finale_close' }); }
  function again() { send({ action: 'play_again', seen: safe(() => getSeen().slice(-200)) || [] }); }

  /* ── The menu: How to play, invite, The Gallery, sound, leave; the host can move on without someone ── */
  function openMenu() {
    if (!state) return;
    const inGame = state.phase !== 'lobby';
    const hostRow = state.isHost && state.players.some(p => p.id !== myPlayerId && !p.gone) ? `<button class="menu-row" onclick="ccPlay.removeMenu()"><span class="ic">${safe(() => inkIcon('cross')) || ''}</span>Remove a player</button>` : '';
    const n = safe(() => galleryList().length) || 0;
    sheetOpen(`<p class="eyebrow center" style="margin-bottom:10px;">Room ${esc(state.code)}</p>
      <button class="menu-row" onclick="closeMenu(); showScreen('screen-rules')"><span class="ic">${safe(() => inkIcon('book')) || ''}</span>How to play</button>
      <button class="menu-row" onclick="openInvite()"><span class="ic">${safe(() => inkIcon('invite')) || ''}</span>Invite someone<span class="r">QR + link</span></button>
      <button class="menu-row" onclick="openGallery()"><span class="ic">${safe(() => inkIcon('frame')) || ''}</span>The Gallery<span class="r">${n || ''}</span></button>
      <button class="menu-row" onclick="ccPlay.toggleSound()"><span class="ic">${safe(() => inkIcon(soundEnabled() ? 'sound' : 'mute')) || ''}</span>Sound<span class="r">${soundEnabled() ? 'On' : 'Off'}</span></button>
      ${hostRow}
      <button class="menu-row" onclick="leaveGame()" style="color:var(--red-ink);"><span class="ic">${safe(() => inkIcon('door')) || ''}</span>${inGame ? 'Leave the game' : 'Leave'}</button>
      <button class="btn btn-ink" style="margin-top:6px;" onclick="closeMenu()">Close</button>`);
  }
  function toggleSound() { const on = !soundEnabled(); setSoundEnabled(on); if (on) safe(() => sfx.notify()); openMenu(); }
  function removeMenu() {
    const others = state.players.filter(p => p.id !== myPlayerId && !p.gone);
    sheetOpen(`<h2 class="h2 center" style="margin-bottom:12px;">Remove who?</h2>${others.map(p => `<button class="menu-row" onclick="ccPlay.removePlayer('${p.id}')">${chip(p.id, 'sm')}<span>${esc(p.name)}</span><span class="r">${p.connected ? '' : 'phone off'}</span></button>`).join('')}<button class="btn btn-ink" style="margin-top:6px;" onclick="closeMenu()">Cancel</button>`);
  }
  function removePlayer(id) {
    const p = playerById(id); if (!p) return closeMenu();
    const mid = state.phase !== 'lobby';
    if (!confirm(mid ? `Move on without ${p.name}? Their score stays, and they can come back with the same name.` : `Remove ${p.name}?`)) return;
    send({ action: mid ? 'remove_player' : 'kick_player', targetPlayerId: id });
    closeMenu();
  }

  function setActionBar(html) {
    const root = $('action-bar-root'); if (!root) return;
    const had = root.innerHTML !== '';
    root.innerHTML = html ? `<div class="action-bar ${had ? '' : 'up'}"><div class="inner">${html}</div></div>` : '';
    document.body.classList.toggle('has-bar', !!html);
  }
  // Game over: this phone takes its own row of the rating, once
  function recordCareer() { if (has('applyRating')) applyRating(); }
  // The steal films live one per file (public/steals/<key>.js); the server deals this round's while the dealer chooses
  const filmLoading = {};
  function loadFilm(k) {
    if (!k || !/^[a-z0-9]+$/.test(k) || W['CCSteal2_' + k] || filmLoading[k]) return;
    filmLoading[k] = 1;
    const s = document.createElement('script'); s.async = true; s.src = '/steals/' + k + '.js?v=' + (W.__ccV || '1');
    s.onerror = () => { delete filmLoading[k]; };
    document.head.appendChild(s);
  }

  W.render = render;
  W.openMenu = openMenu;
  W.setActionBar = setActionBar;
  W.saveDraftNow = saveDraftNow;
  W.recordCareer = recordCareer;
  W.canRun = () => !!state && (state.isDealer || state.isHost);   // (finale.js asks)
  W.ccPlay = { render, fit, next, flip, standIn, steal, pick, open, placeBet, undo, moreTime, bravo, submit, onCheck, onInput, onFocus, onBlur, skip, stopWriting,
    ending, vote, countVotes, again, toggleSound, removeMenu, removePlayer, draftText, onError };
})();
