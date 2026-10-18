/* Closed Caption — THE HEADSHOT. Each player takes a quick selfie in the lobby; it stars in the round-winner
   gags (heads.js) and the Grand Poobah finale. It has to be a headshot: one face, close up, roughly centred,
   or it's refused (with a wisecrack). The check runs on the phone (face-api tiny face detector, bundled in
   /vendor and /models, loaded only when the camera opens). The photo is cropped to the face, shrunk to a
   small JPEG, kept on this phone (localStorage cc_face) so it comes along to every game, and sent to the
   room's server (memory only, gone when the room is). Reads the page's globals: state, myPlayerId, ws, $,
   esc, closeMenu, sfx, buzz. */
(function () {
  'use strict';
  var KEY = 'cc_face', SIZE = 200, Q = 0.82;
  var CSS = [
    '.sf-wrap{text-align:center;}',
    '.sf-frame{width:184px;height:200px;margin:6px auto 12px;border-radius:50% 50% 47% 47%;border:4px solid var(--ink);background:#EFE6D8 center/cover no-repeat;box-shadow:5px 5px 0 var(--ink);position:relative;overflow:hidden;}',
    '.sf-frame.empty::after{content:"🙂";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:84px;opacity:.35;}',
    '.sf-frame.busy::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,0) 0 12px,rgba(255,255,255,.45) 12px 24px);background-size:200% 100%;animation:sfScan 0.9s linear infinite;}',
    '@keyframes sfScan{to{background-position:-48px 0}}',
    '.sf-msg{min-height:44px;font-weight:900;font-size:16px;line-height:1.25;margin:0 0 12px;}',
    '.sf-msg.no{color:var(--red);}',
    '.sf-msg.ok{color:var(--teal);}',
    '.sf-mini{width:30px;height:32px;border-radius:50% 50% 47% 47%;border:2px solid var(--ink);background:center/cover no-repeat;flex-shrink:0;}',
    '.sf-add{display:inline-flex;align-items:center;gap:5px;margin-top:3px;padding:3px 9px;border-radius:999px;border:2px solid var(--ink);background:var(--yellow);font-weight:900;font-size:12px;color:var(--ink);box-shadow:0 2px 0 var(--ink);white-space:nowrap;}',
  ].join('\n');
  try { var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); } catch (e) {}

  var NO_FACE = ['No face found. Is that your thumb?', 'We see a ceiling. Nice ceiling. Where’s your face?', 'That’s not a face. Try again, with your face.'];
  var TWO = ['One face, please. This isn’t a group photo.', 'Too many faces. Who’s the winner here?'];
  var FAR = ['Closer. This is a HEADSHOT, not a landscape.', 'We need your face, not your whole life story. Get closer.'];
  var OFF = ['Put your face in the middle.', 'Centre yourself. Literally.'];
  var GOOD = ['Gorgeous. Terrifying, but gorgeous.', 'That’s the one. The table will never recover.', 'Perfect headshot. Hollywood is calling.'];
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  function saved() { try { var v = localStorage.getItem(KEY); return v && v.indexOf('data:image/jpeg;base64,') === 0 ? v : null; } catch (e) { return null; } }
  function save(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  function send(v) { try { if (ws && ws.readyState === 1 && myPlayerId) ws.send(JSON.stringify({ action: 'set_face', data: v })); } catch (e) {} }
  function mine() { return !!(state && state.faces && myPlayerId && state.faces[myPlayerId]); }
  function url(pid) { return window.ccHeads ? window.ccHeads.faceUrl(pid) : null; }

  // The detector loads once, on first use (~1.5 MB). If it can't load, the photo is accepted with a centre crop.
  var loading = null;
  function detector() {
    if (loading) return loading;
    loading = new Promise(function (ok, bad) {
      if (window.faceapi) return ok(window.faceapi);
      var sc = document.createElement('script'); sc.src = '/vendor/face-api.js'; sc.async = true;
      sc.onload = function () { ok(window.faceapi); }; sc.onerror = function () { bad(new Error('no detector')); };
      document.head.appendChild(sc);
    }).then(function (fa) {
      // the bundle prefers a WASM backend we don't ship: use the phone's GPU (WebGL), else plain CPU
      var tf = fa.tf, tryB = function (list) { return list.length ? tf.setBackend(list[0]).then(function (ok) { return ok ? tf.ready() : tryB(list.slice(1)); }, function () { return tryB(list.slice(1)); }) : Promise.reject(new Error('no backend')); };
      return tryB(['webgl', 'cpu']).then(function () { return fa.nets.tinyFaceDetector.loadFromUri('/models'); }).then(function () { return fa; });
    });
    loading.catch(function () { loading = null; });
    return loading;
  }

  function readImage(file) {
    return new Promise(function (ok, bad) {
      var u = URL.createObjectURL(file), img = new Image();
      img.onload = function () { ok(img); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      img.onerror = function () { bad(new Error('bad image')); };
      img.src = u;
    });
  }
  function toCanvas(img, max) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  // Crop a square around the face (a bit of hair on top, chin at the bottom), shrink, JPEG
  function crop(c, box) {
    var side = box ? box.width * 1.75 : Math.min(c.width, c.height);
    var cx = box ? box.x + box.width / 2 : c.width / 2, cy = box ? box.y + box.height * 0.42 : c.height / 2;
    var out = document.createElement('canvas'); out.width = out.height = SIZE;
    var g = out.getContext('2d'); g.fillStyle = '#E9DFD2'; g.fillRect(0, 0, SIZE, SIZE);
    g.drawImage(c, cx - side / 2, cy - side / 2, side, side, 0, 0, SIZE, SIZE);
    var q = Q, d = out.toDataURL('image/jpeg', q);
    while (d.length > 36000 && q > 0.4) { q -= 0.1; d = out.toDataURL('image/jpeg', q); }
    return d;
  }
  // The headshot test: exactly one face, big enough, near the middle
  function judge(c, faces) {
    if (!faces.length) return { no: pick(NO_FACE) };
    if (faces.length > 1) {
      var big = faces.map(function (f) { return f.box.width; }).sort(function (a, b) { return b - a; });
      if (big[1] > big[0] * 0.55) return { no: pick(TWO) };   // a tiny face way in the background doesn't count
    }
    var f = faces.slice().sort(function (a, b) { return b.box.width - a.box.width; })[0].box, m = Math.min(c.width, c.height);
    if (f.width < m * 0.24) return { no: pick(FAR) };
    var fx = (f.x + f.width / 2) / c.width, fy = (f.y + f.height / 2) / c.height;
    if (fx < 0.18 || fx > 0.82 || fy < 0.12 || fy > 0.85) return { no: pick(OFF) };
    return { box: f };
  }

  var pending = null;
  function sheet(html) { $('sheet-body').innerHTML = '<div class="grip"></div>' + html; $('sheet').classList.add('on'); }
  function render(msg, cls) {
    var have = pending || saved();
    sheet('<div class="sf-wrap"><p class="eyebrow">Your headshot</p>' +
      '<div class="sf-frame ' + (have ? '' : 'empty') + '" id="sf-frame" style="' + (have ? 'background-image:url(' + have + ')' : '') + '"></div>' +
      '<p class="sf-msg ' + (cls || '') + '" id="sf-msg">' + esc(msg || 'Whoever wins a round gets a victory bit starring their face. Face only — close up, looking at the camera.') + '</p>' +
      '<input type="file" id="sf-file" accept="image/*" capture="user" style="display:none">' +
      '<div class="stack">' +
        (pending ? '<button class="btn btn-yellow" onclick="Selfie.use()">✅ Use this one</button><button class="btn" onclick="Selfie.shoot()">🔁 Retake</button>'
                 : '<button class="btn btn-yellow" onclick="Selfie.shoot()">📸 ' + (have ? 'Retake my headshot' : 'Take my headshot') + '</button>') +
        '<button class="btn-link" onclick="Selfie.later()">' + (have || pending ? 'Done' : 'Maybe later') + '</button>' +
      '</div></div>');
    var inp = $('sf-file'); if (inp) inp.onchange = function () { if (inp.files && inp.files[0]) take(inp.files[0]); };
  }
  function take(file) {
    var fr = $('sf-frame'), msg = $('sf-msg');
    if (fr) fr.classList.add('busy');
    if (msg) { msg.className = 'sf-msg'; msg.textContent = 'Checking that face…'; }
    var c;
    readImage(file).then(function (img) {
      c = toCanvas(img, 640);
      return detector().then(function (fa) {
        return fa.detectAllFaces(c, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 }));
      }).then(function (faces) { return judge(c, faces || []); }, function () { return { box: null, fallback: true }; });
    }).then(function (r) {
      if (r.no) { pending = null; render(r.no, 'no'); try { sfx.error(); } catch (e) {} buzz([80, 40, 80]); return; }
      pending = crop(c, r.box);
      render(r.fallback ? 'Couldn’t run the face check on this phone — make sure it’s your face!' : pick(GOOD), 'ok');
      try { sfx.tada ? sfx.tada() : sfx.tap(); } catch (e) {} buzz(40);
    }).catch(function () { pending = null; render('That photo didn’t open. Try again?', 'no'); });
  }

  var asked = false;
  window.Selfie = {
    open: function () { pending = null; render(); detector().catch(function () {}); },
    shoot: function () { var i = $('sf-file'); if (i) { i.value = ''; i.click(); } },
    use: function () { if (!pending) return; save(pending); send(pending); pending = null; closeMenu(); },
    later: function () { pending = null; closeMenu(); },
    // after joining: bring the saved headshot along, or ask for one (once per visit, only in the lobby)
    sync: function () {
      var v = saved();
      if (v && !mine()) send(v);
      else if (!v && !asked && state && state.phase === 'lobby') { asked = true; setTimeout(function () { if (state && state.phase === 'lobby' && !saved() && !$('sheet').classList.contains('on')) Selfie.open(); }, 900); }
    },
    // the lobby: a little face next to each player who has one, and the button for you
    mini: function (pid) { var u = url(pid); return u ? '<span class="sf-mini" style="background-image:url(' + u + ')"></span>' : ''; },
    button: function () { return '<button class="sf-add" onclick="Selfie.open()">📸 ' + (mine() ? 'Retake' : 'Add your headshot') + '</button>'; },
  };
})();
