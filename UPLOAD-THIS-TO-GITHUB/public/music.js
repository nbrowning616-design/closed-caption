// music.js — Procedural ambient music using Web Audio API
// All sounds generated in-browser, no external files needed

(function() {
  let audioCtx = null;
  let currentTrack = null;
  let currentInterval = null;
  let masterGain = null;
  let isPlaying = false;

  function ensureContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
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
      icon: '🎹',
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
      name: 'Mystery',
      description: 'Slow-building suspense',
      icon: '🕵️',
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

    // 3. Bouncy — playful upbeat
    bouncy: {
      name: 'Bouncy',
      description: 'Playful and upbeat',
      icon: '🎪',
      start() {
        let beat = 0;
        const bpm = 130;
        const beatDur = 60 / bpm;

        // Simple I-V-vi-IV in C
        const bassNotes = [
          note('C', -1), note('G', -1), note('A', -1), note('F', -1),
        ];

        const melody = [
          note('E', 1), note('G', 1), note('A', 1), note('G', 1),
          note('E', 1), note('D', 1), note('C', 1), note('D', 1),
        ];

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;

          // Bass line — quarter notes
          const bassIdx = Math.floor(beat / 4) % bassNotes.length;
          pluck(bassNotes[bassIdx], beatDur * 0.8, when, 0.5);

          // Melody — eighth notes
          const melIdx = beat % melody.length;
          pluck(melody[melIdx], beatDur * 0.6, when, 0.35);

          // Off-beat percussion-like tick
          const offWhen = when + beatDur * 0.5;
          const ctx = audioCtx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = note('C', 2);
          gain.gain.setValueAtTime(0.15, offWhen);
          gain.gain.exponentialRampToValueAtTime(0.001, offWhen + 0.1);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(offWhen);
          osc.stop(offWhen + 0.15);

          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },

    // 4. Game show — classic countdown tension
    gameshow: {
      name: 'Game Show',
      description: 'Classic countdown tension',
      icon: '⏱️',
      start() {
        let beat = 0;
        const bpm = 110;
        const beatDur = 60 / bpm;

        const tick = () => {
          if (!isPlaying) return;
          const when = audioCtx.currentTime + 0.05;

          // Steady bass
          thump(when, note('D', -2), 0.4);
          // Walking quarter notes
          const walk = [note('D', 0), note('F', 0), note('A', 0), note('F', 0)];
          pluck(walk[beat % 4], beatDur * 0.7, when, 0.3);
          // High accent every 4 beats
          if (beat % 4 === 0) {
            pluck(note('D', 1), beatDur * 1.5, when, 0.4);
          }
          beat++;
        };

        tick();
        currentInterval = setInterval(tick, beatDur * 1000);
      }
    },

    // 5. Ambient — calm spacious
    ambient: {
      name: 'Ambient',
      description: 'Calm and spacious',
      icon: '🌙',
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
      icon: '🎷',
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
      this.stop();
      const track = TRACKS[trackKey];
      if (!track) return;
      currentTrack = trackKey;
      isPlaying = true;
      // Fade in
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.5);
      track.start();
    },

    stop() {
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
      if (masterGain && audioCtx) {
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(0.4, v)), audioCtx.currentTime + 0.1);
      }
    }
  };
})();
