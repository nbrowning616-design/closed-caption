// music.js — Procedural ambient music using Web Audio API
// All sounds generated in-browser, no external files needed

/* ── The phone's speaker: one shared audio unlock for the whole game ──
   Loaded first, so everything else (index.html's tone()/noise()/actx(), fx.js, steal.js, voice.js) uses the
   same AudioContext: window._gameAudio. What it fixes:
   • iPhone ringer switch on silent: Web Audio is muted unless the page says it's media playback.
     navigator.audioSession.type = 'playback' (Safari 17+, feature-detected) does that, set on a real tap.
   • Browsers only start audio inside a tap: every tap (not just the first) makes/resumes the context, and the
     first one also plays one silent sample (older iPhones need that to fully unlock).
   • After the phone locks/unlocks or the tab comes back, the context is resumed (visibilitychange/pageshow/
     focus); if the phone refuses without a tap, the next tap does it.
   The voice call switches the session to 'play-and-record' while the mic is on (ccAudio.session).
   window.ccAudio = { ctx(), unlock(), wake(), session(type) } */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var primed = false, want = 'playback';
  function session(type) {
    if (type) want = type;
    var t = want;
    // Sound switched off in the game menu: hand the phone back its normal rules (and don't pause the user's own music)
    try { if (t === 'playback' && typeof window.soundEnabled === 'function' && !window.soundEnabled()) t = 'auto'; } catch (e) {}
    try { if (navigator.audioSession && navigator.audioSession.type !== t) navigator.audioSession.type = t; } catch (e) {}
  }
  function ctx() {
    if (!AC) return null;
    var c = window._gameAudio;
    if (!c || c.state === 'closed') { try { c = window._gameAudio = new AC(); } catch (e) { return null; } }
    return c;
  }
  function wake() {
    var c = window._gameAudio;
    if (!c || c.state === 'running' || c.state === 'closed') return;
    try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function unlock() {
    session();
    var c = ctx(); if (!c) return;
    wake();
    if (!primed) {
      primed = true;
      try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    }
  }
  /* #47 One master output for ALL game audio: every sound in the app connects to ctx.destination, so the shared
     context's destination is swapped (on the context itself) for a master chain:
       master gain (ducking) → DynamicsCompressor (limiter) → trim (undoes the compressor's automatic make-up
       gain, so quiet sounds keep their level) → soft clipper (a last guard: never past ±0.98) → speaker.
     window._gameAudio is wired the moment anything creates it (index.html actx(), voice.js, this file). */
  function wire(c) {
    if (!c || c.__ccOut) return c;
    try {
      var real = c.destination;
      var master = c.createGain(); master.gain.value = 1;
      var comp = c.createDynamicsCompressor();
      comp.threshold.value = -4; comp.knee.value = 4; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.2;
      var trim = c.createGain(); trim.gain.value = 0.78;
      var clip = c.createWaveShaper(), n = 2048, curve = new Float32Array(n);
      for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1, ax = Math.abs(x); curve[i] = ax < 0.8 ? x : (x < 0 ? -1 : 1) * (0.8 + 0.18 * Math.tanh((ax - 0.8) / 0.18)); }
      clip.curve = curve;
      master.connect(comp); comp.connect(trim); trim.connect(clip); clip.connect(real);
      Object.defineProperty(c, 'destination', { configurable: true, get: function () { return master; } });
      c.__ccOut = { master: master, comp: comp, trim: trim, clip: clip, real: real };
    } catch (e) {}
    return c;
  }
  try {
    var ga = window._gameAudio || null;
    Object.defineProperty(window, '_gameAudio', { configurable: true, get: function () { return ga; }, set: function (v) { ga = wire(v); } });
    if (ga) wire(ga);
  } catch (e) {}
  // Dip the whole mix by db for ms (then back over half a second).
  function duck(db, ms) {
    var c = window._gameAudio; if (!c || !c.__ccOut) return;
    try {
      var g = c.__ccOut.master.gain, t = c.currentTime, k = Math.pow(10, (db || -6) / 20), e = t + Math.max(0.05, (ms || 3000) / 1000);
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(k, t + 0.03);
      g.setValueAtTime(k, e); g.linearRampToValueAtTime(1, e + 0.5);
    } catch (e2) {}
  }
  try {
    ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, unlock, { capture: true, passive: true }); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { session(); wake(); } });
    window.addEventListener('pageshow', function () { session(); wake(); });
    window.addEventListener('focus', wake);
  } catch (e) {}
  window.ccAudio = { ctx: ctx, unlock: unlock, wake: wake, session: session, duck: duck, wire: wire };
})();

(function() {
  let audioCtx = null;
  let currentTrack = null;
  let currentInterval = null;
  let masterGain = null;
  let isPlaying = false;
  let level = 0.18;   // the music's own volume (setVolume)

  function ensureContext() {
    const shared = window.ccAudio ? window.ccAudio.ctx() : null;
    if (!audioCtx || (shared && shared !== audioCtx)) {
      audioCtx = shared || new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state !== 'running') { try { const p = audioCtx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
    return audioCtx;
  }

  // ── Sound generators ──

  // Pluck-like tone (for jazz/lounge)
  function pluck(freq, duration, when, vol = 1) {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(when);
    osc.stop(when + duration + 0.1);
  }

  // Soft pad (held note)
  function pad(freq, duration, when, vol = 1) {
    const ctx = audioCtx;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.005; // slight detune for warmth

    filter.type = 'lowpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.5);
    gain.gain.setValueAtTime(vol, when + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, when + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc1.start(when);
    osc2.start(when);
    osc1.stop(when + duration + 0.1);
    osc2.stop(when + duration + 0.1);
  }

  // Sharp click/tick (for suspense)
  function tick(when, freq = 800, vol = 0.5) {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(when);
    osc.stop(when + 0.1);
  }

  // Bass thump
  function thump(when, freq = 60, vol = 1) {
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2, when);
    osc.frequency.exponentialRampToValueAtTime(freq, when + 0.1);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(when);
    osc.stop(when + 0.4);
  }

  // ── Musical scales/chords ──
  // Frequencies in Hz for one octave
  const NOTES = {
    C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13,
    E: 329.63, F: 349.23, 'F#': 369.99, G: 392.00,
    'G#': 415.30, A: 440.00, 'A#': 466.16, B: 493.88,
  };

  function note(name, octave = 0) {
    return NOTES[name] * Math.pow(2, octave);
  }

  // ── TRACKS ──

  const TRACKS = {

    // 1. Lounge — gentle jazz piano vibes
    lounge: {
      name: 'Lounge',
      description: 'Easy jazz piano',
      icon: '',
      start() {
        const t0 = audioCtx.currentTime;
        let beat = 0;
        const bpm = 80;
        const beatDur = 60 / bpm;

        // Chord progression: Cmaj7, Am7, Dm7, G7
        const progression = [
          [note('C', 0), note('E', 0), note('G', 0), note('B', 0)],
          [note('A', -1), note('C', 0), note('E', 0), note('G', 0)],
          [note('D', 0), note('F', 0), note('A', 0), note('C', 1)],
          [note('G', -1), note('B', -1), note('D', 0), note('F', 0)],
        ];

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;
          const chord = progression[beat % 4];

          // Bass note
          pluck(chord[0] / 2, beatDur * 2, when, 0.6);
          // Comp chords on offbeats
          if (beat % 2 === 1) {
            pluck(chord[1], beatDur * 0.8, when, 0.3);
            pluck(chord[2], beatDur * 0.8, when, 0.3);
            pluck(chord[3], beatDur * 0.8, when, 0.25);
          }
          // Occasional melody note
          if (Math.random() < 0.4) {
            const melodyOptions = [chord[1], chord[2], chord[3], chord[3] * 1.25];
            const m = melodyOptions[Math.floor(Math.random() * melodyOptions.length)];
            pluck(m * 2, beatDur * 1.5, when + beatDur * 0.5, 0.35);
          }

          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },

    // 2. Mystery — suspenseful pulses
    mystery: {
      name: 'Stakeout',
      description: 'Slow-building suspense',
      icon: '',
      start() {
        let beat = 0;
        const bpm = 70;
        const beatDur = 60 / bpm;

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;

          // Low pulsing bass
          if (beat % 4 === 0) {
            thump(when, 55, 0.7);
            pad(note('A', -2), beatDur * 4, when, 0.4);
          }
          // High eerie tone
          if (beat % 8 === 4) {
            pad(note('F', 1), beatDur * 2, when, 0.2);
          }
          // Random ticks
          if (Math.random() < 0.3) {
            // Use the sharp tick generator (need to rename inner ref to avoid clash)
            const tWhen = when + Math.random() * beatDur;
            const ctx = audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 1200 + Math.random() * 400;
            gain.gain.setValueAtTime(0.15, tWhen);
            gain.gain.exponentialRampToValueAtTime(0.001, tWhen + 0.04);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(tWhen);
            osc.stop(tWhen + 0.1);
          }
          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },

    // 5. Ambient — calm spacious
    ambient: {
      name: 'Waiting Room',
      description: 'Calm and spacious',
      icon: '',
      start() {
        let beat = 0;
        const beatDur = 2.5; // slow

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;

          // Long pads
          const root = [note('C', -1), note('F', -1), note('A', -2), note('E', -1)][beat % 4];
          pad(root, beatDur * 1.5, when, 0.5);
          pad(root * 1.5, beatDur * 1.5, when, 0.3);
          pad(root * 2, beatDur * 1.5, when, 0.25);

          // Occasional sparkle
          if (Math.random() < 0.4) {
            const sparkleWhen = when + Math.random() * beatDur;
            const sparkleFreq = [note('G', 1), note('C', 2), note('E', 1), note('A', 1)][Math.floor(Math.random() * 4)];
            pluck(sparkleFreq, 1.5, sparkleWhen, 0.25);
          }
          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },

    // 6. Speakeasy — vintage jazz
    speakeasy: {
      name: 'Speakeasy',
      description: 'Old-timey jazz club',
      icon: '',
      start() {
        let beat = 0;
        const bpm = 100;
        const beatDur = 60 / bpm;

        // Swing feel with ii-V-I in C
        const progression = [
          [note('D', -1), note('F', 0), note('A', 0), note('C', 1)],  // Dm7
          [note('G', -1), note('B', -1), note('D', 0), note('F', 0)],  // G7
          [note('C', 0), note('E', 0), note('G', 0), note('B', 0)],   // Cmaj7
          [note('C', 0), note('E', 0), note('G', 0), note('A', 0)],   // C6
        ];

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;
          const chord = progression[Math.floor(beat / 2) % progression.length];

          // Walking bass
          pluck(chord[0] / 2, beatDur * 0.85, when, 0.55);
          // Comp on 2 and 4
          if (beat % 2 === 1) {
            pluck(chord[1], beatDur * 0.4, when, 0.25);
            pluck(chord[2], beatDur * 0.4, when, 0.25);
            pluck(chord[3], beatDur * 0.4, when, 0.2);
          }
          // Sax-like melody (occasional)
          if (Math.random() < 0.3) {
            const noteOpts = [chord[1] * 2, chord[2] * 2, chord[3] * 2];
            const m = noteOpts[Math.floor(Math.random() * noteOpts.length)];
            // Slight portamento by playing two close notes
            pluck(m, beatDur * 1.2, when + beatDur * 0.3, 0.3);
          }
          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },
  };

  // ── Public API ──

  window.GameMusic = {
    tracks() {
      return Object.entries(TRACKS).map(([key, t]) => ({
        key,
        name: t.name,
        description: t.description,
        icon: t.icon,
      }));
    },

    play(trackKey) {
      ensureContext();
      this.hardStop();
      const track = TRACKS[trackKey];
      if (!track) return;
      currentTrack = trackKey;
      isPlaying = true;
      // Fade in
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(level, audioCtx.currentTime + 0.5);
      track.start();
    },

    // #60: the picked music keeps going after the reveals. The reveal used to call stop() and the track never
    // came back. Now only a person stops it (a tap in the menu, or sound off): a stop() from the game itself
    // (not inside a tap) just dips the music under the moment and brings it back.
    stop() {
      const ev = window.event, byTap = !!(ev && /^(click|pointer|touch|mouse|key)/.test(ev.type || ''));
      let soundOn = true; try { soundOn = typeof window.soundEnabled !== 'function' || window.soundEnabled(); } catch (e) {}
      if (isPlaying && !byTap && soundOn) { this.duck(2600); return; }
      this.hardStop();
    },

    duck(ms = 2600) {
      if (!isPlaying || !masterGain || !audioCtx) return;
      const g = masterGain.gain, t = audioCtx.currentTime, e = t + ms / 1000;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(level * 0.12, t + 0.25);
      g.setValueAtTime(level * 0.12, e); g.linearRampToValueAtTime(level, e + 0.9);
    },

    hardStop() {
      isPlaying = false;
      if (currentInterval) {
        clearInterval(currentInterval);
        currentInterval = null;
      }
      if (masterGain && audioCtx) {
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      }
      currentTrack = null;
    },

    isPlaying() { return isPlaying; },

    currentTrack() { return currentTrack; },

    setVolume(v) {
      level = Math.max(0, Math.min(0.4, v));
      if (masterGain && audioCtx) {
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(level, audioCtx.currentTime + 0.1);
      }
    }
  };
})();
