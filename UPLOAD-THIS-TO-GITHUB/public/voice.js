/* Closed Caption — VOICE. A voice-only group call inside the game, so a family in different places can play
   and talk without a separate phone call. Phone-to-phone audio (WebRTC full mesh, up to 8 players); the
   server only passes the small set-up messages between phones ({action:'rtc'}) and keeps who's in the call
   and who's muted ({action:'voice'} → state.voice = { playerId: { on, muted } }).
   Page hooks:  Voice.button()  — HTML for the Join / Mute / Leave control (keeps itself up to date)
                Voice.onState(state) — on every state update     Voice.onSignal(msg) — on every {type:'rtc'}
                Voice.leave()  — leaving the game                Voice.speaking(pid) — true while they talk
   Anything with data-voice-pid="<id>" gets class vc-talking while that player talks (vc-in while in the call,
   vc-muted while muted). Reads the page's globals when present: ws, state, actx. */
(function () {
  'use strict';

  // ICE servers: STUN only for now. To add a TURN relay later, add one more entry here, e.g.
  //   { urls: ['turn:turn.example.com:3478', 'turns:turn.example.com:5349'], username: '…', credential: '…' }
  var ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }];
  var MAX_PEERS = 7;              // 8 players in the room = 7 other phones
  var CONNECT_TIMEOUT = 20000;    // no audio path after this long: "couldn't connect"
  var TALK_LEVEL = 0.035, TALK_HOLD = 350, TICK = 120;
  var AUDIO = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

  var CSS = [
    '.vc-ctl{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;vertical-align:middle;}',
    '.vc-b{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:999px;border:2px solid var(--ink,#1F1A17);background:#fff;color:var(--ink,#1F1A17);font:inherit;font-weight:900;font-size:13px;line-height:1.1;box-shadow:0 2px 0 var(--ink,#1F1A17);cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;}',
    '.vc-b:active{transform:translateY(2px);box-shadow:none;}',
    '.vc-b[disabled]{opacity:.6;cursor:default;}',
    '.vc-b.vc-join{background:var(--teal,#12A587);color:#fff;}',
    '.vc-b.vc-live{background:#fff;}',
    '.vc-b.vc-muted{background:var(--red,#E8453A);color:#fff;}',
    '.vc-b.vc-leave{background:transparent;box-shadow:none;border-color:transparent;text-decoration:underline;padding:6px 4px;}',
    '.vc-n{font-size:11px;font-weight:800;opacity:.9;background:rgba(255,255,255,.25);padding:1px 6px;border-radius:999px;}',
    '.vc-dot{width:9px;height:9px;border-radius:50%;background:#aaa;display:inline-block;flex-shrink:0;}',
    '.vc-dot.ok{background:var(--teal,#12A587);} .vc-dot.wait{background:#F28C0F;animation:vcBlink 1s ease-in-out infinite;} .vc-dot.bad{background:var(--red,#E8453A);}',
    '@keyframes vcBlink{50%{opacity:.3}}',
    '.vc-talking{box-shadow:0 0 0 3px var(--teal,#12A587),0 0 12px 3px rgba(18,165,135,.7)!important;transition:box-shadow .12s;}',
    '.vc-audio{position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;}',
    '.vc-sheet{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(360px,calc(100vw - 24px));background:#fff;border:3px solid var(--ink,#1F1A17);border-radius:18px;box-shadow:5px 5px 0 var(--ink,#1F1A17);padding:14px;z-index:9000;color:var(--ink,#1F1A17);}',
    '.vc-sheet h4{margin:0 0 8px;font-size:17px;font-weight:900;}',
    '.vc-row{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:12px;margin-bottom:4px;}',
    '.vc-row .nm{flex:1;min-width:0;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.vc-row .st{font-size:12px;font-weight:700;color:var(--muted,#6E655C);}',
    '.vc-row .st.bad{color:var(--red,#E8453A);}',
    '.vc-row.vc-talking{box-shadow:none!important;background:var(--teal-bg,#DDF5EE);}',
    '.vc-sheet .vc-foot{display:flex;gap:8px;margin-top:10px;justify-content:flex-end;}',
    '.vc-toast{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(380px,calc(100vw - 24px));background:var(--ink,#1F1A17);color:#fff;border-radius:14px;padding:12px 14px;font-weight:800;font-size:14px;line-height:1.3;z-index:9500;box-shadow:0 8px 24px rgba(0,0,0,.3);}',
    '.vc-toast button{margin-top:8px;}',
  ].join('\n');
  try { var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) {}

  var on = false, joining = false, muted = false, stream = null;
  var me = null, room = null, last = null;
  var confirmed = false, announcedAt = 0;
  var peers = {};                 // playerId -> peer
  var pool = [], box = null;      // hidden <audio> elements (made during the Join tap, for iOS)
  var meters = {};                // playerId (or 'me') -> { an, buf, src, talkUntil }
  var joinSeq = 0, sink = null, ticker = null, sheetOpen = false, needTap = false, cfg = {};

  /* ── small helpers ── */
  var rid = function () { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function sock() { if (cfg.ws) return cfg.ws; try { return typeof ws !== 'undefined' ? ws : null; } catch (e) { return null; } }
  function sendWs(obj) {
    try { if (cfg.send) return cfg.send(obj); var w = sock(); if (w && w.readyState === 1) { w.send(JSON.stringify(obj)); return true; } } catch (e) {}
    return false;
  }
  function pageState() { try { return typeof state !== 'undefined' ? state : undefined; } catch (e) { return undefined; } }
  function audioCtx() {
    try { if (typeof window.actx === 'function') return window.actx(); } catch (e) {}
    try {
      if (!window._gameAudio) window._gameAudio = new (window.AudioContext || window.webkitAudioContext)();
      if (window._gameAudio.state === 'suspended') window._gameAudio.resume();
      return window._gameAudio;
    } catch (e) { return null; }
  }
  function nameOf(pid) { var p = last && last.players && last.players.find(function (x) { return x.id === pid; }); return p ? p.name : 'Someone'; }
  function inCall(pid) { return !!(last && last.voice && last.voice[pid]); }
  function isMutedRemote(pid) { return !!(last && last.voice && last.voice[pid] && last.voice[pid].muted); }

  var toastTimer = null;
  function toast(html, ms) {
    var t = document.getElementById('vc-toast');
    if (!html) { if (t) t.remove(); return; }
    if (!t) { t = document.createElement('div'); t.id = 'vc-toast'; t.className = 'vc-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; clearTimeout(toastTimer);
    if (ms !== 0) toastTimer = setTimeout(function () { toast(''); }, ms || 6000);
  }

  /* ── hidden audio players (iOS: made and played inside the Join tap) ── */
  function preparePool() {
    if (!box) { box = document.createElement('div'); box.className = 'vc-audio'; box.setAttribute('aria-hidden', 'true'); document.body.appendChild(box); }
    while (pool.length + Object.keys(peers).length < MAX_PEERS) {
      var a = document.createElement('audio');
      a.autoplay = true; a.setAttribute('autoplay', ''); a.setAttribute('playsinline', ''); a.playsInline = true;
      box.appendChild(a);
      try { var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}   // the tap blesses each element
      pool.push(a);
    }
  }
  function takeAudio() {
    if (!pool.length) preparePool();
    return pool.pop();
  }
  function giveAudio(a) { if (!a) return; try { a.pause(); } catch (e) {} a.srcObject = null; pool.push(a); }
  function playAll() {
    needTap = false; toast('');
    Object.keys(peers).forEach(function (pid) { var a = peers[pid].audio; if (a && a.srcObject) { var pr = a.play(); if (pr && pr.catch) pr.catch(function () {}); } });
    audioCtx();
  }
  function play(a) {
    try {
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function (e) {
        if (e && e.name === 'NotAllowedError' && !needTap) { needTap = true; toast('Your phone paused the voices.<br><button class="vc-b vc-join" onclick="Voice._playAll()">🔊 Tap to hear everyone</button>', 0); }
      });
    } catch (e) {}
  }

  /* ── talking meters ── */
  function meter(key, s) {
    unmeter(key);
    var ctx = audioCtx(); if (!ctx || !s) return;
    try {
      if (!sink) { sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination); }   // keeps analysers running, makes no sound
      var src = ctx.createMediaStreamSource(s), an = ctx.createAnalyser();
      an.fftSize = 512; src.connect(an); an.connect(sink);
      meters[key] = { src: src, an: an, buf: new Uint8Array(an.fftSize), talkUntil: 0 };
    } catch (e) {}
  }
  function unmeter(key) { var m = meters[key]; if (!m) return; try { m.src.disconnect(); m.an.disconnect(); } catch (e) {} delete meters[key]; }
  function level(m) {
    m.an.getByteTimeDomainData(m.buf);
    var sum = 0; for (var i = 0; i < m.buf.length; i++) { var v = (m.buf[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / m.buf.length);
  }
  function speaking(pid) {
    if (!on) return false;
    if (pid === me) return !muted && !!meters.me && meters.me.talkUntil > Date.now();
    var m = meters[pid];
    return !!m && !isMutedRemote(pid) && m.talkUntil > Date.now() && !!peers[pid] && peers[pid].state === 'connected';
  }
  function tick() {
    var now = Date.now();
    Object.keys(meters).forEach(function (k) { var m = meters[k]; try { if (level(m) > TALK_LEVEL) m.talkUntil = now + TALK_HOLD; } catch (e) {} });
    paint();
    // Safety net: the page left the game without telling us
    var ps = pageState(); if (on && ps === null) leave();
  }
  function paint() {
    var els = document.querySelectorAll('[data-voice-pid]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], pid = el.getAttribute('data-voice-pid');
      el.classList.toggle('vc-talking', speaking(pid));
      el.classList.toggle('vc-in', on && (pid === me || inCall(pid)));
      el.classList.toggle('vc-muted', on && (pid === me ? muted : isMutedRemote(pid)));
    }
  }

  /* ── the call ── */
  function announce() { confirmed = false; announcedAt = Date.now(); sendWs({ action: 'voice', on: true, muted: muted }); }

  function join() {
    if (on || joining) return;
    var md = navigator.mediaDevices;
    if (!window.RTCPeerConnection || !md || !md.getUserMedia) {
      toast(window.isSecureContext === false ? 'Voice needs the secure (https://) game link. Open the game from that link to talk.' : 'This browser can’t do voice. Try Safari on iPhone or Chrome on Android.');
      return;
    }
    if (!last || !last.playerId) { toast('Join a game first, then tap Join voice.'); return; }
    joining = true; var mine = ++joinSeq; refresh();
    preparePool(); audioCtx();   // inside the tap: unlocks audio on iPhone
    md.getUserMedia({ audio: AUDIO, video: false }).then(function (s) {
      if (mine !== joinSeq) { s.getTracks().forEach(function (t) { t.stop(); }); return; }   // left while the permission prompt was up
      joining = false;
      if (!last || !last.playerId) { s.getTracks().forEach(function (t) { t.stop(); }); refresh(); return; }
      stream = s; on = true; muted = false; me = last.playerId; room = last.code;
      stream.getAudioTracks().forEach(function (t) { t.enabled = true; t.onended = function () { if (on) { toast('Your microphone stopped. Tap Join voice to talk again.'); leave(); } }; });
      meter('me', stream);
      audioCtx();
      if (!ticker) ticker = setInterval(tick, TICK);
      announce();
      sync();
      refresh();
    }).catch(function (e) {
      if (mine !== joinSeq) return;
      joining = false; refresh();
      var n = e && e.name;
      if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') toast('🎙 The microphone is blocked for this game.<br><span style="font-weight:600">iPhone: tap <b>aA</b> in the address bar → Website Settings → Microphone → Allow. Android: tap the lock icon → Permissions → Microphone. Then tap Join voice again.</span>', 14000);
      else if (n === 'NotFoundError' || n === 'OverconstrainedError') toast('No microphone found on this device.');
      else if (n === 'NotReadableError' || n === 'AbortError') toast('The microphone is busy. Hang up any other call (FaceTime, phone), then tap Join voice again.', 9000);
      else toast('Couldn’t start the microphone. Tap Join voice to try again.');
    });
  }

  function leave() {
    var was = on || joining, hadTap = needTap;
    on = false; joining = false; needTap = false; sheetOpen = false; joinSeq++;
    Object.keys(peers).forEach(closePeer);
    Object.keys(meters).forEach(unmeter);
    if (stream) { stream.getTracks().forEach(function (t) { t.onended = null; try { t.stop(); } catch (e) {} }); stream = null; }
    if (ticker) { clearInterval(ticker); ticker = null; }
    if (was) sendWs({ action: 'voice', on: false, muted: false });
    confirmed = false; muted = false;
    var sh = document.getElementById('vc-sheet'); if (sh) sh.remove();
    if (hadTap) toast('');
    paint(); refresh();
  }

  function toggleMute() {
    if (!on || !stream) return;
    muted = !muted;
    stream.getAudioTracks().forEach(function (t) { t.enabled = !muted; });
    sendWs({ action: 'voice', on: true, muted: muted });
    paint(); refresh();
  }

  // Keep the mesh matching who's in the call
  function sync() {
    if (!on || !last) return;
    var want = {};
    var players = (last.players || []).filter(function (p) { return p.id !== me && p.connected && inCall(p.id); }).slice(0, MAX_PEERS);
    players.forEach(function (p) { want[p.id] = true; });
    Object.keys(peers).forEach(function (pid) { if (!want[pid]) closePeer(pid); });
    players.forEach(function (p) { if (!peers[p.id]) makePeer(p.id, null); });
  }

  function onState(s) {
    last = s || null;
    if (!s) { if (on || joining) leave(); return; }
    if (on && (s.playerId !== me || s.code !== room)) { leave(); last = s; refresh(); return; }   // a different seat or room
    if (on) {
      if (s.voice && s.voice[me]) confirmed = true;
      else if (confirmed || Date.now() - announcedAt > 5000) {
        // The server dropped us from the call (this phone's connection blinked): rebuild every link and re-join
        Object.keys(peers).forEach(closePeer);
        announce();
      }
      sync();
    }
    refresh();
  }

  function sig(p, data) {
    data.sid = p.sid; data.toSid = p.remoteSid || null;
    sendWs({ action: 'rtc', to: p.pid, data: data });
  }
  var plainDesc = function (d) { return { type: d.type, sdp: d.sdp }; };

  function makePeer(pid, remoteSid) {
    var pc;
    try { pc = new RTCPeerConnection({ iceServers: ICE_SERVERS }); } catch (e) { return null; }
    var p = { pid: pid, pc: pc, sid: rid(), remoteSid: remoteSid || null, polite: String(me) < String(pid), makingOffer: false, ignoreOffer: false,
      state: 'connecting', chain: Promise.resolve(), pending: [], audio: takeAudio(), remote: null, restarted: false, closed: false, timer: null, startedAt: Date.now() };
    peers[pid] = p;
    stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });

    pc.onnegotiationneeded = function () {
      if (p.closed) return;
      p.makingOffer = true;
      pc.createOffer().then(function (offer) {
        if (pc.signalingState !== 'stable' || p.closed) return;
        return pc.setLocalDescription(offer).then(function () { sig(p, { description: plainDesc(pc.localDescription) }); });
      }).catch(function () {}).then(function () { p.makingOffer = false; });
    };
    pc.onicecandidate = function (e) { if (e.candidate && !p.closed) sig(p, { candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.ontrack = function (e) {
      if (p.closed) return;
      var s = (e.streams && e.streams[0]) || new MediaStream([e.track]);
      if (p.remote !== s) {
        p.remote = s; p.audio.srcObject = s; play(p.audio);
        meter(pid, s);
      }
    };
    var onConn = function () {
      if (p.closed) return;
      var cs = pc.connectionState, ics = pc.iceConnectionState, was = p.state;
      if (cs === 'connected' || (!cs && (ics === 'connected' || ics === 'completed'))) { p.state = 'connected'; p.restarted = false; clearTimeout(p.timer); }
      else if (cs === 'failed' || (!cs && ics === 'failed')) {
        if (!p.restarted && pc.restartIce) { p.restarted = true; p.state = 'connecting'; try { pc.restartIce(); } catch (e) {} armTimer(p); }
        else p.state = 'failed';
      } else if (cs === 'disconnected' || ics === 'disconnected') { if (p.state === 'connected') { p.state = 'connecting'; armTimer(p); } }
      if (was !== p.state) refresh();
    };
    pc.onconnectionstatechange = onConn; pc.oniceconnectionstatechange = onConn;
    armTimer(p);
    refresh();
    return p;
  }
  function armTimer(p) {
    clearTimeout(p.timer);
    p.timer = setTimeout(function () { if (!p.closed && p.state !== 'connected') { p.state = 'failed'; refresh(); } }, CONNECT_TIMEOUT);
  }
  function closePeer(pid) {
    var p = peers[pid]; if (!p) return;
    p.closed = true; clearTimeout(p.timer);
    try { p.pc.onicecandidate = p.pc.ontrack = p.pc.onnegotiationneeded = p.pc.onconnectionstatechange = p.pc.oniceconnectionstatechange = null; p.pc.close(); } catch (e) {}
    unmeter(pid); giveAudio(p.audio);
    delete peers[pid];
    refresh();
  }
  function retry(pid) { if (!on || !peers[pid]) return; closePeer(pid); makePeer(pid, null); }

  function onSignal(msg) {
    if (!on || !msg || !msg.from || !msg.data) return;
    var from = msg.from, d = msg.data, p = peers[from];
    if (from === me) return;
    if (d.toSid && (!p || d.toSid !== p.sid)) return;                    // meant for a link this phone already closed
    if (p && p.remoteSid && d.sid && d.sid !== p.remoteSid) { closePeer(from); p = null; }   // they started over: so do we
    if (!p) {
      if (!last || !(last.players || []).some(function (x) { return x.id === from; })) return;
      if (Object.keys(peers).length >= MAX_PEERS) return;
      p = makePeer(from, d.sid); if (!p) return;
    }
    if (!p.remoteSid && d.sid) p.remoteSid = d.sid;
    p.chain = p.chain.then(function () { return handle(p, d); }).catch(function (e) { if (window.console) console.warn('voice signal', e && e.name); });
  }

  function handle(p, d) {
    var pc = p.pc;
    if (p.closed) return;
    if (d.description) {
      var desc = d.description;
      var collision = desc.type === 'offer' && (p.makingOffer || pc.signalingState !== 'stable');
      p.ignoreOffer = !p.polite && collision;
      if (p.ignoreOffer) return;
      var ready = collision ? pc.setLocalDescription({ type: 'rollback' }).catch(function () {}) : Promise.resolve();
      return ready.then(function () { return pc.setRemoteDescription(desc); }).then(function () {
        var q = p.pending; p.pending = [];
        return Promise.all(q.map(function (c) { return pc.addIceCandidate(c).catch(function () {}); }));
      }).then(function () {
        if (desc.type !== 'offer' || p.closed) return;
        return pc.createAnswer().then(function (a) { return pc.setLocalDescription(a); }).then(function () { sig(p, { description: plainDesc(pc.localDescription) }); });
      });
    }
    if (d.candidate) {
      if (!pc.remoteDescription) { p.pending.push(d.candidate); return; }
      return pc.addIceCandidate(d.candidate).catch(function (e) { if (!p.ignoreOffer) throw e; });
    }
  }

  /* ── the control and the who's-here sheet ── */
  function overall() {
    var ids = Object.keys(peers);
    if (!ids.length) return { cls: '', text: 'Just you so far' };
    if (ids.some(function (k) { return peers[k].state === 'failed'; })) return { cls: 'bad', text: 'Trouble connecting' };
    if (ids.some(function (k) { return peers[k].state === 'connecting'; })) return { cls: 'wait', text: 'Connecting…' };
    return { cls: 'ok', text: 'Connected' };
  }
  function inner() {
    var others = last && last.voice ? Object.keys(last.voice).filter(function (k) { return k !== (last && last.playerId); }).length : 0;
    if (joining) return '<button class="vc-b" disabled>🎙 Starting…</button>';
    if (!on) return '<button class="vc-b vc-join" onclick="Voice.join()" aria-label="Join the voice call">🎙 Join voice' + (others ? '<span class="vc-n">' + others + ' on</span>' : '') + '</button>';
    var o = overall(), n = Object.keys(peers).length + 1;
    return '<button class="vc-b ' + (muted ? 'vc-muted' : 'vc-live') + '" onclick="Voice.toggleMute()" aria-label="' + (muted ? 'Unmute' : 'Mute') + ' your microphone">' + (muted ? '🎙 Unmute' : '🔇 Mute') + '</button>' +
      '<button class="vc-b" onclick="Voice.panel()" aria-label="Who is in the call: ' + esc(o.text) + '"><span class="vc-dot ' + o.cls + '"></span>' + n + '</button>' +
      '<button class="vc-b vc-leave" onclick="Voice.leave()">Leave</button>';
  }
  function button() { return '<span class="vc-ctl" data-vc-ctl>' + inner() + '</span>'; }
  function sheetHtml() {
    var rows = '<div class="vc-row" data-voice-pid="' + esc(me) + '"><span class="vc-dot ok"></span><span class="nm">' + esc(nameOf(me)) + ' (you)</span><span class="st">' + (muted ? '🔇 muted' : 'mic on') + '</span></div>';
    Object.keys(peers).forEach(function (pid) {
      var p = peers[pid], cls = p.state === 'connected' ? 'ok' : p.state === 'failed' ? 'bad' : 'wait';
      var txt = p.state === 'connected' ? (isMutedRemote(pid) ? '🔇 muted' : 'connected') : p.state === 'failed' ? 'couldn’t connect' : 'connecting…';
      rows += '<div class="vc-row" data-voice-pid="' + esc(pid) + '"><span class="vc-dot ' + cls + '"></span><span class="nm">' + esc(nameOf(pid)) + '</span><span class="st' + (p.state === 'failed' ? ' bad' : '') + '">' + txt + '</span>' +
        (p.state === 'failed' ? '<button class="vc-b" onclick="Voice._retry(\'' + esc(pid) + '\')">Retry</button>' : '') + '</div>';
    });
    var bad = Object.keys(peers).some(function (k) { return peers[k].state === 'failed'; });
    return '<h4>🎙 Voice call</h4>' + rows +
      (Object.keys(peers).length ? '' : '<p class="st" style="margin:6px 8px;">Nobody else has joined yet. Tell them to tap “Join voice”.</p>') +
      (bad ? '<p class="st" style="margin:6px 8px;">Some Wi-Fi networks block calls. Try switching that phone between Wi-Fi and cellular, then tap Retry.</p>' : '') +
      '<div class="vc-foot"><button class="vc-b vc-leave" onclick="Voice.leave()">Leave call</button><button class="vc-b" onclick="Voice.panel(false)">Close</button></div>';
  }
  function panel(show) {
    sheetOpen = show === undefined ? !sheetOpen : !!show;
    if (!on) sheetOpen = false;
    var sh = document.getElementById('vc-sheet');
    if (!sheetOpen) { if (sh) sh.remove(); return; }
    if (!sh) { sh = document.createElement('div'); sh.id = 'vc-sheet'; sh.className = 'vc-sheet'; sh.setAttribute('role', 'dialog'); document.body.appendChild(sh); }
    sh.innerHTML = sheetHtml(); paint();
  }
  function refresh() {
    var h = inner(), els = document.querySelectorAll('[data-vc-ctl]');
    for (var i = 0; i < els.length; i++) if (els[i].innerHTML !== h) els[i].innerHTML = h;
    if (sheetOpen) panel(true);
  }

  // Closing the page or leaving it: the microphone goes off
  window.addEventListener('pagehide', function () { if (on || joining) leave(); });
  window.addEventListener('beforeunload', function () { if (on || joining) leave(); });

  window.Voice = {
    button: button, join: join, leave: leave, toggleMute: toggleMute, panel: panel,
    onState: onState, onSignal: onSignal, speaking: speaking,
    isOn: function () { return on; }, isMuted: function () { return muted; },
    peerState: function (pid) { return peers[pid] ? peers[pid].state : null; },
    config: function (o) { cfg = o || {}; },
    ICE_SERVERS: ICE_SERVERS,
    _peers: peers, _retry: retry, _playAll: playAll,
  };
})();
