/* ═══════════════════════════════════════════════════════════
   Closed Caption — BADGES, rockets & ranks (badges.js)
   Self-contained. No images, no libraries, no network.

   window.Badges = {
     KINDS, RANKS,
     icon(kind, size=48)            -> SVG string (round stitched patch)
     insignia(rankTitle, size=40)   -> SVG string (gold-on-navy shield)
     rankOf(rockets)                -> { title, next, need, progress }
     pop({kind,title,who,line,mine})-> ms it stays (queued; tap dismisses)
     promotion({rank,name,mine})    -> ms it stays (queued with pops)
     clearQueue()                   -> removes pending + current
     caseHtml(counts, rockets)      -> trophy-case HTML (bdg- classes)
   }

   Uses host globals when present: tone(), noise(), buzz(), soundEnabled(),
   window.confetti. Everything is try/catch guarded.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var INK = '#1F1A17', PAPER = '#FFF8EA', YELLOW = '#FFD23F', GOLD_D = '#C99A08', RED = '#E8453A',
      TEAL = '#12A587', BLUE = '#2F6FE0', VIOLET = '#6E4CF5', NAVY = '#1C2A5C';
  var DISPLAY = "'Fredoka','Nunito',system-ui,sans-serif";

  /* ── Kinds ── rim = patch colour, bg = inner disc */
  // Only the five badges that tell a story. Old careers on a phone may still count removed kinds
  // (ice_cold, better_than_real, less_is_more, crowd_favorite, poobah, hat_trick): the trophy case ignores them.
  var KINDS = {
    moon:             { name: 'Moon Landing',               desc: 'Bet both chips blind on the real caption — and hit.' },
    three_bagger:     { name: 'Three Bagger',               desc: 'Three players bet both chips on your caption.' },
    clean_sweep:      { name: 'Clean Sweep',                desc: 'Every other player bet on your caption.' },
    great_minds:      { name: 'Great Minds',                desc: 'Two of you wrote nearly the same caption.' },
    pickpocket:       { name: 'Pickpocket',                 desc: 'As dealer, you stole a chip off the real caption.' }
  };
  var ORDER = ['moon', 'three_bagger', 'clean_sweep', 'great_minds', 'pickpocket'];
  var PAL = {
    moon:             { rim: NAVY,      bg: '#2C3F8C', stitch: YELLOW },
    three_bagger:     { rim: TEAL,      bg: '#DDF5EE' },
    clean_sweep:      { rim: '#4FAE3A', bg: '#E6F6DA' },
    better_than_real: { rim: RED,       bg: '#FFE3E0' },
    ice_cold:         { rim: '#3FA9F5', bg: '#E3F4FF' },
    less_is_more:     { rim: '#E8559E', bg: '#FFE4F0' },
    great_minds:      { rim: BLUE,      bg: '#E3EDFF' },
    pickpocket:       { rim: '#3A332E', bg: '#FFF1D6' },
    crowd_favorite:   { rim: '#F28C0F', bg: '#FFE9CC' },
    poobah:           { rim: VIOLET,    bg: '#ECE7FF' },
    hat_trick:        { rim: '#3B2A8F', bg: '#FFF4C7', stitch: YELLOW }
  };

  var RANKS = [
    { title: 'Cadet', rockets: 0 },
    { title: 'Captain', rockets: 10 },
    { title: 'Commodore', rockets: 25 },
    { title: 'Admiral', rockets: 50 }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var uid = 0;
  function nextId() { uid = (uid + 1) % 1e9; return 'bdg' + uid.toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  /* ═════════════ Pictograms (64×64 space, inner disc r≈22.5 at 32,32) ═════════════ */
  function star4(x, y, r, fill) {
    var k = r * 0.28;
    return '<path d="M' + x + ' ' + (y - r) + ' Q' + (x + k) + ' ' + (y - k) + ' ' + (x + r) + ' ' + y + ' Q' + (x + k) + ' ' + (y + k) + ' ' + x + ' ' + (y + r) +
      ' Q' + (x - k) + ' ' + (y + k) + ' ' + (x - r) + ' ' + y + ' Q' + (x - k) + ' ' + (y - k) + ' ' + x + ' ' + (y - r) + ' Z" fill="' + fill + '" stroke="none"/>';
  }
  function star5(cx, cy, R, fill, sw) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? R * 0.45 : R, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2));
    }
    return '<path d="M' + pts.join(' L') + ' Z" fill="' + fill + '"' + (sw != null ? ' stroke-width="' + sw + '"' : '') + '/>';
  }
  // The Poobah fez, drawn upright around (32,31)
  function fez(sw, big) {
    return '<path d="M32 15 Q24 19 20 25" fill="none" stroke-width="' + (sw * 0.8) + '"/>' +
      '<path d="M17 24.5 L22 25.5 L23 33 L18.5 33.5 Z" fill="' + YELLOW + '"/>' +
      '<path d="M21 47 L25 20 Q26 14.5 31 14.5 H33 Q38 14.5 39 20 L43 47 Z" fill="' + VIOLET + '"/>' +
      (big ? '<path d="M27.5 21 Q26.5 32 27.5 42" fill="none" stroke="#9C84FF" stroke-width="' + (sw * 1.1) + '" stroke-opacity=".8"/>' : '') +
      '<rect x="17" y="39" width="30" height="10" rx="3" fill="' + YELLOW + '"/>' +
      '<path d="M32 40 L36 44 L32 48 L28 44 Z" fill="' + RED + '" stroke-width="' + (sw * 0.8) + '"/>' +
      '<circle cx="32" cy="14.5" r="3.2" fill="' + YELLOW + '"/>' +
      (big ? star5(35.5, 28, 3.6, YELLOW, sw * 0.6) : '');
  }
  function rocket(sw, big) {
    // upright rocket, nose at (32,12)
    return (big ? '<path d="M28.5 46 Q32 58 35.5 46" fill="#FFF8EA" stroke="none" opacity=".0"/>' : '') +
      '<path d="M27 40 L32 54 L37 40 Z" fill="' + YELLOW + '"/>' +
      '<path d="M29.6 41 L32 48.5 L34.4 41 Z" fill="#F28C0F" stroke="none"/>' +
      '<path d="M24.5 32 L17.5 40 L17.5 46 L24.5 42 Z" fill="' + RED + '"/>' +
      '<path d="M39.5 32 L46.5 40 L46.5 46 L39.5 42 Z" fill="' + RED + '"/>' +
      '<path d="M32 11 C38.5 16 40 24 40 31 L40 42 L24 42 L24 31 C24 24 25.5 16 32 11 Z" fill="#fff"/>' +
      '<path d="M32 11 C35.6 13.8 37.6 17.4 38.6 21 L25.4 21 C26.4 17.4 28.4 13.8 32 11 Z" fill="' + RED + '"/>' +
      '<circle cx="32" cy="29" r="4.4" fill="#7FC4FF"/>' +
      (big ? '<path d="M30 27.6 Q30.8 26.4 32.2 26.2" fill="none" stroke="#fff" stroke-width="' + (sw * 0.7) + '"/>' : '') +
      '<path d="M32 33.5 V42" fill="none" stroke-width="' + (sw * 0.7) + '"/>';
  }

  var PICTO = {
    moon: function (sw, big) {
      var s = '';
      if (big) {
        s += '<path d="M16 15.5 A6 6 0 1 0 22.5 23 A4.8 4.8 0 1 1 16 15.5 Z" fill="' + YELLOW + '" stroke="none"/>';
        s += star4(46.5, 43, 3.2, '#fff') + star4(41, 17, 2, YELLOW) + star4(16.5, 37, 1.8, '#fff');
      } else {
        s += star4(18, 20, 3.4, YELLOW) + star4(46, 44, 3, '#fff');
      }
      return s + '<g transform="translate(32 32) rotate(40) scale(.92) translate(-32 -32)">' + rocket(sw, big) + '</g>';
    },
    three_bagger: function (sw, big) {
      function bag(x, y, k, fill, dollar) {
        var w = sw / k;
        return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')" stroke-width="' + w + '">' +
          '<path d="M-2.6 1 C-10 5 -12.5 13 -11.4 18 C-10.4 22.4 -5 23.5 0 23.5 C5 23.5 10.4 22.4 11.4 18 C12.5 13 10 5 2.6 1 Z" fill="' + fill + '"/>' +
          '<path d="M-5.5 -4 L-2.4 1 L2.4 1 L5.5 -4 L2 -2.2 L0 -4.4 L-2 -2.2 Z" fill="' + fill + '"/>' +
          '<path d="M-3.4 1.2 H3.4" stroke-width="' + (w * 1.3) + '"/>' +
          (dollar ? '<text x="0" y="18.4" text-anchor="middle" font-family="' + DISPLAY.replace(/'/g, '') + ',Arial Black" font-weight="700" font-size="13" fill="' + INK + '" stroke="none">$</text>' : '') +
          '</g>';
      }
      return bag(20.5, 21, 0.72, '#E9A93A', false) + bag(43.5, 21, 0.72, '#E9A93A', false) + bag(32, 22.5, 1.0, YELLOW, true);
    },
    clean_sweep: function (sw, big) {
      var s = '';
      if (big) {
        s += '<g fill="#fff" stroke-width="' + (sw * 0.8) + '"><circle cx="45" cy="47" r="3"/><circle cx="50" cy="43.5" r="2.2"/><circle cx="40.5" cy="49.5" r="1.8"/></g>';
        s += star4(17.5, 21, 3.4, YELLOW);
      }
      s += '<g transform="translate(32 31) rotate(38) translate(-32 -31)">' +
        '<rect x="30" y="7.5" width="4.4" height="28" rx="2.2" fill="#B5651D"/>' +
        '<path d="M24.5 37 L39.5 37 L45.5 54 L18.5 54 Z" fill="#F5C451"/>' +
        (big ? '<path d="M27.5 41 L25 52 M32 41 V52.5 M36.5 41 L39 52" fill="none" stroke-width="' + (sw * 0.7) + '" stroke="#B8862A"/>' : '') +
        '<rect x="24.5" y="33" width="15" height="6" rx="2" fill="' + RED + '"/>' +
        '</g>';
      return s;
    },
    better_than_real: function (sw, big) {
      return '<path d="M14 45 L15.5 22 L24 31 L32 15.5 L40 31 L48.5 22 L50 45 Z" fill="' + YELLOW + '"/>' +
        (big ? '<path d="M19 27 L19.5 38" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="' + (sw * 1.1) + '"/>' : '') +
        '<rect x="13" y="39" width="38" height="9" rx="2.5" fill="#F5B014"/>' +
        '<circle cx="15.5" cy="21.5" r="2.8" fill="' + YELLOW + '"/><circle cx="32" cy="15" r="2.8" fill="' + YELLOW + '"/><circle cx="48.5" cy="21.5" r="2.8" fill="' + YELLOW + '"/>' +
        '<circle cx="23" cy="43.5" r="2.3" fill="' + TEAL + '" stroke-width="' + (sw * 0.7) + '"/>' +
        '<path d="M32 40 L35.2 43.5 L32 47 L28.8 43.5 Z" fill="' + RED + '" stroke-width="' + (sw * 0.7) + '"/>' +
        '<circle cx="41" cy="43.5" r="2.3" fill="' + BLUE + '" stroke-width="' + (sw * 0.7) + '"/>';
    },
    ice_cold: function (sw, big) {
      var s = '<path d="M32 13.5 L49 22 L32 30.5 L15 22 Z" fill="#F4FBFF"/>' +
        '<path d="M15 22 L32 30.5 L32 50 L15 41.5 Z" fill="#BFE6FF"/>' +
        '<path d="M49 22 L32 30.5 L32 50 L49 41.5 Z" fill="#7CC4F5"/>' +
        '<path d="M19 27.5 L19 35" fill="none" stroke="#fff" stroke-width="' + (sw * 1.2) + '"/>';
      if (big) s += '<path d="M25 19.5 L31 16.5" fill="none" stroke="#BFE6FF" stroke-width="' + (sw * 0.9) + '"/>' +
        star4(47, 13.5, 4, '#fff') + '<path d="M47 9 V18 M42.5 13.5 H51.5" stroke="#3FA9F5" stroke-width="' + (sw * 0.45) + '" fill="none"/>' +
        '<path d="M40 50.5 Q40 47 41.5 45 Q43 47 43 50.5 Q43 52.5 41.5 52.5 Q40 52.5 40 50.5 Z" fill="#BFE6FF" stroke-width="' + (sw * 0.7) + '"/>';
      return s;
    },
    less_is_more: function (sw, big) {
      var bg = PAL.less_is_more.bg;
      return '<path d="M35.5 36.5 Q24 25 16.5 12 Q25.5 20 39.5 32.5 Z" fill="#E9EEF2"/>' +
        '<path d="M28.5 36.5 Q40 25 47.5 12 Q38.5 20 24.5 32.5 Z" fill="#fff"/>' +
        '<path d="M28.5 36.5 L24.5 41" fill="none" stroke-width="' + (sw * 1.6) + '"/>' +
        '<path d="M35.5 36.5 L39.5 41" fill="none" stroke-width="' + (sw * 1.6) + '"/>' +
        '<circle cx="22" cy="45" r="6.6" fill="' + RED + '"/><circle cx="22" cy="45" r="2.8" fill="' + bg + '"/>' +
        '<circle cx="42" cy="45" r="6.6" fill="' + RED + '"/><circle cx="42" cy="45" r="2.8" fill="' + bg + '"/>' +
        '<circle cx="32" cy="34" r="2.3" fill="' + YELLOW + '" stroke-width="' + (sw * 0.7) + '"/>' +
        (big ? star4(49, 22, 3.2, '#E8559E') + star4(15, 24, 2.4, '#E8559E') : '');
    },
    great_minds: function (sw, big) {
      function bust(cx) {
        return '<path d="M' + (cx - 9) + ' 47 C' + (cx - 9) + ' 40 ' + (cx - 5.5) + ' 37 ' + cx + ' 37 C' + (cx + 5.5) + ' 37 ' + (cx + 9) + ' 40 ' + (cx + 9) + ' 47 Z" fill="' + BLUE + '"/>' +
          '<circle cx="' + cx + '" cy="28" r="7.6" fill="#fff"/>' +
          '<path d="M' + (cx - 7.2) + ' 26 Q' + (cx - 6) + ' 19.5 ' + cx + ' 20.4 Q' + (cx + 4) + ' 19.6 ' + (cx + 7.2) + ' 25 Q' + (cx + 2) + ' 23.2 ' + (cx - 1) + ' 24 Q' + (cx - 4) + ' 24.6 ' + (cx - 7.2) + ' 26 Z" fill="' + INK + '"/>' +
          '<circle cx="' + (cx - 2.6) + '" cy="28.6" r="1.2" fill="' + INK + '" stroke="none"/><circle cx="' + (cx + 2.6) + '" cy="28.6" r="1.2" fill="' + INK + '" stroke="none"/>' +
          '<path d="M' + (cx - 2.6) + ' 31.4 Q' + cx + ' 33.6 ' + (cx + 2.6) + ' 31.4" fill="none" stroke-width="' + (sw * 0.6) + '"/>';
      }
      return bust(22.5) + bust(41.5) +
        (big ? star4(32, 15, 4.4, YELLOW) : '');
    },
    pickpocket: function (sw, big) {
      var s = '';
      if (big) s += '<path d="M15 20 L19.5 23 M12.5 27 L17.5 28 M20 14.5 L22.5 19" fill="none" stroke-width="' + (sw * 0.8) + '"/>';
      // poker chip, upper right
      s += '<circle cx="39" cy="24" r="10.5" fill="' + RED + '"/>' +
        '<circle cx="39" cy="24" r="10.5" fill="none" stroke="#fff" stroke-width="' + (sw * 1.15) + '" stroke-dasharray="3.6 4.65" stroke-linecap="butt" transform="rotate(8 39 24)"/>' +
        '<circle cx="39" cy="24" r="10.5" fill="none"/>' +
        '<circle cx="39" cy="24" r="5.2" fill="#fff" stroke-width="' + (sw * 0.75) + '"/>';
      // gloved hand from lower-left, fingers reaching up-right to pinch the chip
      var cid = nextId();
      s += '<clipPath id="' + cid + '"><circle cx="32" cy="32" r="22.4"/></clipPath><g clip-path="url(#' + cid + ')">' +
        '<g transform="translate(25.5 41) rotate(42) scale(.86)">' +
        '<path d="M-7.5 5 L-7.5 24 L7.5 24 L7.5 5 Z" fill="' + INK + '"/>' +
        (big ? '<path d="M-6 10 H6 M-6 14 H6" stroke="#fff" stroke-width="' + (sw * 0.8) + '" fill="none"/>' : '') +
        '<path d="M-9 -8 Q-9.5 4 -6 6 L6 6 Q9.5 4 9 -8 Z" fill="#fff"/>' +
        '<rect x="-8.6" y="-22" width="5" height="17" rx="2.5" fill="#fff"/>' +
        '<rect x="-3.4" y="-24.5" width="5" height="19.5" rx="2.5" fill="#fff"/>' +
        '<rect x="1.8" y="-21" width="4.8" height="16" rx="2.4" fill="#fff"/>' +
        '<rect x="6" y="-15.5" width="4.2" height="11" rx="2.1" fill="#fff"/>' +
        '<path d="M-9 -1 Q-16 -4 -16.5 -12 Q-16.6 -15 -13.8 -14.6 Q-12 -14.2 -11.6 -10" fill="#fff"/>' +
        '</g></g>';
      return s;
    },
    crowd_favorite: function (sw, big) {
      return '<circle cx="32" cy="32" r="17" fill="' + YELLOW + '"/>' +
        '<path d="M21.5 23.5 L27.5 26.8 L21.5 30" fill="none" stroke-width="' + (sw * 1.1) + '"/>' +
        '<path d="M42.5 23.5 L36.5 26.8 L42.5 30" fill="none" stroke-width="' + (sw * 1.1) + '"/>' +
        '<path d="M20.5 34 H43.5 Q43 47.5 32 47.5 Q21 47.5 20.5 34 Z" fill="' + INK + '"/>' +
        '<path d="M22.5 35.4 H41.5 L41 38.4 H23 Z" fill="#fff" stroke="none"/>' +
        '<path d="M26 44.6 Q32 40 38 44.6 Q35.5 46.6 32 46.6 Q28.5 46.6 26 44.6 Z" fill="' + RED + '" stroke="none"/>' +
        '<path d="M13 28 Q11 33 12.6 35.6 Q14.4 37.8 16.4 35.4 Q17.8 33 13 28 Z" fill="#7FC4FF" stroke-width="' + (sw * 0.75) + '"/>' +
        '<path d="M51 28 Q53 33 51.4 35.6 Q49.6 37.8 47.6 35.4 Q46.2 33 51 28 Z" fill="#7FC4FF" stroke-width="' + (sw * 0.75) + '"/>' +
        (big ? '<path d="M24.5 17.8 Q28 15.6 31.5 15.8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="' + (sw * 0.9) + '"/>' : '');
    },
    poobah: function (sw, big) {
      return '<g transform="translate(32 32) scale(1.02) translate(-32 -32)">' + fez(sw, big) + '</g>';
    },
    hat_trick: function (sw, big) {
      function hat(x, y, k, rot) {
        return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + k + ') translate(-32 -31)" stroke-width="' + (sw / k) + '">' + fez(sw / k, false) + '</g>';
      }
      return (big ? star4(14.5, 19, 2.6, VIOLET) + star4(49.5, 19, 2.6, VIOLET) : '') +
        hat(18, 37, 0.42, -14) + hat(46, 37, 0.42, 14) + hat(32, 30.5, 0.58, 0);
    }
  };

  /* ═════════════ Patch icon ═════════════ */
  function icon(kind, size) {
    try {
      size = +size || 48;
      var p = PAL[kind] || PAL.moon, draw = PICTO[kind] || PICTO.moon;
      var small = size < 34, big = size >= 40;
      var sw = small ? 3.4 : (size < 60 ? 2.7 : 2.4);   // pictogram ink weight (in 64-unit space)
      var ow = small ? 4.2 : 3.2;                        // patch outline
      var s = '<svg class="bdg-icon" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
        '<circle cx="32" cy="32" r="29.6" fill="' + p.rim + '" stroke="' + INK + '" stroke-width="' + ow + '"/>';
      if (big) {
        s += '<circle cx="32" cy="32" r="26.4" fill="none" stroke="' + (p.stitch || '#fff') + '" stroke-opacity="' + (p.stitch ? '.95' : '.7') + '" stroke-width="1.3" stroke-dasharray="2.4 2.2" stroke-linecap="round"/>';
        s += '<path d="M9.5 24 A23.5 23.5 0 0 1 24 9.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.6" stroke-linecap="round"/>';
      }
      s += '<circle cx="32" cy="32" r="' + (small ? 23.6 : 23) + '" fill="' + p.bg + '" stroke="' + INK + '" stroke-width="' + (small ? 3 : 2.5) + '"/>';
      s += '<g stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round">' + draw(sw, big) + '</g>';
      return s + '</svg>';
    } catch (e) { return ''; }
  }

  /* ═════════════ Rank insignia (gold on navy shield) ═════════════ */
  var GOLD = '#FFC93C', GOLD_L = '#FFE58A', GOLD_S = '#B9860B';
  var SHIELD = 'M32 4.5 L55 11 V31 C55 45 45 54.5 32 59.5 C19 54.5 9 45 9 31 V11 Z';
  function miniRocket(x, y, k, sw) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ') translate(-32 -32)" stroke-width="' + (sw / k) + '">' +
      '<path d="M28 41 L32 51 L36 41 Z" fill="' + RED + '"/>' +
      '<path d="M24.5 32 L18 40 L18 45 L24.5 42 Z" fill="' + GOLD + '"/><path d="M39.5 32 L46 40 L46 45 L39.5 42 Z" fill="' + GOLD + '"/>' +
      '<path d="M32 11 C38.5 16 40 24 40 31 L40 42 L24 42 L24 31 C24 24 25.5 16 32 11 Z" fill="' + GOLD + '"/>' +
      '<circle cx="32" cy="28" r="4.2" fill="' + NAVY + '"/></g>';
  }
  function laurel(side, sw) {
    var m = side < 0 ? '' : 'transform="translate(64 0) scale(-1 1)"', s = '<g ' + m + '>';
    s += '<path d="M20 47 Q12.5 38 14.5 24" fill="none" stroke="' + GOLD + '" stroke-width="' + (sw * 0.9) + '"/>';
    var leaves = [[15.5, 42, -50], [13.5, 36, -30], [13.2, 30, -10], [14.5, 24.5, 10]];
    for (var i = 0; i < leaves.length; i++) {
      var L = leaves[i];
      s += '<ellipse cx="' + L[0] + '" cy="' + L[1] + '" rx="2.2" ry="4.2" fill="' + GOLD + '" transform="rotate(' + L[2] + ' ' + L[0] + ' ' + L[1] + ')" stroke-width="' + (sw * 0.55) + '"/>';
    }
    return s + '</g>';
  }
  function insigniaInner(rank, sw, big, shineId) {
    var t = String(rank || 'Cadet').toLowerCase(), body = '';
    var lineGold = 'stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"';
    if (t === 'captain') {
      body = '<g ' + lineGold + '>' + miniRocket(32, 20.5, 0.5, sw) +
        '<rect x="18" y="32.5" width="28" height="6" rx="2" fill="' + GOLD + '"/>' +
        '<rect x="20" y="41.5" width="24" height="6" rx="2" fill="' + GOLD + '"/></g>';
    } else if (t === 'commodore') {
      body = '<g ' + lineGold + '>' + laurel(-1, sw) + laurel(1, sw) + star5(32, 31, 11.5, GOLD, sw) +
        '<path d="M24 47.5 L32 44 L40 47.5" fill="none" stroke="' + GOLD + '" stroke-width="' + (sw * 1.1) + '"/></g>';
    } else if (t === 'admiral') {
      body = '<g ' + lineGold + '>' +
        star5(19.5, 18, 4.8, GOLD, sw * 0.75) + star5(32, 14.5, 5.4, GOLD, sw * 0.75) + star5(44.5, 18, 4.8, GOLD, sw * 0.75) +
        '<path d="M18.5 37 Q19.5 50.5 32 51.5 Q44.5 50.5 45.5 37" fill="none" stroke="' + INK + '" stroke-width="' + (sw * 2.6) + '"/>' +
        '<path d="M18.5 37 Q19.5 50.5 32 51.5 Q44.5 50.5 45.5 37" fill="none" stroke="' + GOLD + '" stroke-width="' + (sw * 1.2) + '"/>' +
        '<path d="M14.8 39.5 L18.5 33.5 L22.2 39.5 Z M41.8 39.5 L45.5 33.5 L49.2 39.5 Z" fill="' + GOLD + '" stroke-width="' + (sw * 0.7) + '"/>' +
        miniRocket(32, 35.5, 0.52, sw) + '</g>';
    } else {
      body = '<g ' + lineGold + '>' +
        '<path d="M16 38 L32 26 L48 38 L48 46 L32 34 L16 46 Z" fill="' + GOLD + '"/>' +
        (big ? star5(32, 17, 4, GOLD, sw * 0.7) : '') + '</g>';
    }
    var s = '<path d="' + SHIELD + '" fill="' + NAVY + '" stroke="' + INK + '" stroke-width="' + (sw * 1.25) + '" stroke-linejoin="round"/>' +
      '<path d="M32 8.6 L51.5 14 V31 C51.5 43 43.2 51 32 55.6 C20.8 51 12.5 43 12.5 31 V14 Z" fill="none" stroke="' + GOLD + '" stroke-width="' + (big ? 1.6 : 2) + '"' + (big ? ' stroke-dasharray="0.1 3.1" stroke-linecap="round"' : '') + '/>' + body;
    if (shineId) {
      s += '<clipPath id="' + shineId + '"><path d="' + SHIELD + '"/></clipPath>' +
        '<g clip-path="url(#' + shineId + ')"><rect class="bdg-shine" x="-30" y="-10" width="12" height="90" fill="#fff" opacity=".42" transform="skewX(-20)"/></g>';
    }
    return s;
  }
  function insignia(rankTitle, size, _shine) {
    try {
      size = +size || 40;
      var sw = size < 34 ? 3 : 2.3, big = size >= 40;
      return '<svg class="bdg-insignia" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
        insigniaInner(rankTitle, sw, big, _shine ? nextId() : null) + '</svg>';
    } catch (e) { return ''; }
  }

  function rankOf(rockets) {
    try {
      var r = Math.max(0, Math.floor(+rockets || 0)), i = 0;
      for (var k = 0; k < RANKS.length; k++) if (r >= RANKS[k].rockets) i = k;
      var cur = RANKS[i], nx = RANKS[i + 1] || null;
      if (!nx) return { title: cur.title, next: null, need: 0, progress: 1 };
      return { title: cur.title, next: nx.title, need: nx.rockets - r, progress: Math.max(0, Math.min(1, (r - cur.rockets) / (nx.rockets - cur.rockets))) };
    } catch (e) { return { title: 'Cadet', next: 'Captain', need: 10, progress: 0 }; }
  }

  /* ═════════════ CSS ═════════════ */
  var CSS = [
    /* ── overlay layer ── */
    '#bdg-layer,#bdg-layer *,.bdg-case,.bdg-case *{box-sizing:border-box;}',
    '#bdg-layer{position:fixed;left:0;right:0;top:0;z-index:850;pointer-events:none;display:flex;justify-content:center;padding:calc(64px + env(safe-area-inset-top,0px)) 16px 0;}',
    '#bdg-layer.bdg-promo-on{bottom:0;padding:0;align-items:center;}',
    '.bdg-pop{pointer-events:auto;cursor:pointer;position:relative;width:min(320px,100%);margin-top:34px;padding:52px 18px 16px;text-align:center;background:#fff;border:3px solid ' + INK + ';border-radius:22px;box-shadow:6px 6px 0 ' + INK + ';font-family:' + "'Nunito',-apple-system,system-ui,sans-serif" + ';color:' + INK + ';animation:bdgStamp .62s cubic-bezier(.2,1.25,.4,1) both;}',
    '.bdg-pop.bdg-mine{width:min(344px,100%);padding-top:70px;background:#FFF4C7;box-shadow:7px 7px 0 ' + INK + ';}',
    '.bdg-pop.bdg-out{animation:bdgOut .32s cubic-bezier(.5,0,.75,0) forwards;}',
    '.bdg-pop .bdg-medal{position:absolute;left:50%;top:0;width:96px;height:96px;margin:-50px 0 0 -48px;}',
    '.bdg-pop.bdg-mine .bdg-medal{width:124px;height:124px;margin:-62px 0 0 -62px;}',
    '.bdg-medal .bdg-rays{position:absolute;inset:-22px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,210,63,.95) 0 9deg,rgba(255,210,63,0) 9deg 22.5deg);-webkit-mask:radial-gradient(circle,#000 38%,transparent 70%);mask:radial-gradient(circle,#000 38%,transparent 70%);animation:bdgRays 6s linear infinite,bdgFade .5s ease-out .25s both;}',
    '.bdg-medal .bdg-coin{position:absolute;inset:0;animation:bdgSpin .9s cubic-bezier(.2,1.1,.35,1) .08s both;filter:drop-shadow(3px 4px 0 rgba(31,26,23,.9));}',
    '.bdg-medal .bdg-coin svg{width:100%;height:100%;display:block;}',
    '.bdg-medal .bdg-glint{position:absolute;inset:4px;border-radius:50%;overflow:hidden;pointer-events:none;}',
    '.bdg-medal .bdg-glint::after{content:"";position:absolute;top:-20%;bottom:-20%;width:28%;left:-40%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));transform:skewX(-18deg);animation:bdgGlint .7s ease-in-out .95s both;}',
    '.bdg-eyebrow{font-size:11px;font-weight:900;letter-spacing:1.6px;text-transform:uppercase;color:#6E655C;}',
    '.bdg-title{font-family:' + DISPLAY + ';font-weight:700;font-size:25px;line-height:1.05;letter-spacing:-.4px;margin:3px 0 0;}',
    '.bdg-mine .bdg-title{font-size:29px;}',
    '.bdg-who{display:inline-block;margin-top:9px;max-width:100%;padding:4px 12px;border:2.5px solid ' + INK + ';border-radius:999px;background:' + YELLOW + ';font-weight:900;font-size:13px;letter-spacing:.3px;box-shadow:2px 2px 0 ' + INK + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform:rotate(-2deg);}',
    '.bdg-mine .bdg-who{background:' + INK + ';color:' + YELLOW + ';}',
    '.bdg-line{margin-top:9px;font-size:14px;font-weight:700;line-height:1.35;color:#4A433D;}',
    '.bdg-added{display:flex;align-items:center;justify-content:center;gap:7px;margin:12px -6px 0;padding:8px 10px;border-top:2px dashed rgba(31,26,23,.25);font-size:12px;font-weight:900;letter-spacing:.9px;text-transform:uppercase;color:' + INK + ';animation:bdgFade .4s ease-out .9s both;}',
    '.bdg-added svg{flex:none;}',
    '.bdg-timer{position:absolute;left:18px;right:18px;bottom:7px;height:3px;border-radius:3px;background:rgba(31,26,23,.12);overflow:hidden;}',
    '.bdg-timer i{display:block;height:100%;background:' + INK + ';transform-origin:left;animation:bdgTimer linear both;}',
    '.bdg-spark{position:absolute;width:12px;height:12px;background:' + YELLOW + ';clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);animation:bdgTwinkle 1.1s ease-out both;}',

    /* ── promotion ── */
    '.bdg-promo{pointer-events:auto;cursor:pointer;position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(24px + env(safe-area-inset-top,0px)) 24px calc(24px + env(safe-area-inset-bottom,0px));text-align:center;color:' + PAPER + ';background:radial-gradient(ellipse at 50% 42%,#2E3F86 0%,#16204A 55%,#0B1028 100%);overflow:hidden;animation:bdgFade .35s ease-out both;font-family:' + "'Nunito',-apple-system,system-ui,sans-serif" + ';}',
    '.bdg-promo.bdg-out{animation:bdgFadeOut .4s ease-in forwards;}',
    '.bdg-promo .bdg-sunburst{position:absolute;left:50%;top:40%;width:760px;height:760px;margin:-380px 0 0 -380px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,201,60,.13) 0 7deg,rgba(255,201,60,0) 7deg 18deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 62%);mask:radial-gradient(circle,#000 20%,transparent 62%);animation:bdgRays 14s linear infinite,bdgFade 1s ease-out .5s both;}',
    '.bdg-promo .bdg-insw{position:relative;width:176px;height:176px;}',
    '.bdg-promo .bdg-ins{position:relative;width:176px;height:176px;filter:drop-shadow(5px 6px 0 rgba(0,0,0,.55)) drop-shadow(0 0 26px rgba(255,201,60,.45));animation:bdgInsIn 1s cubic-bezier(.2,1.3,.4,1) .15s both;}',
    '.bdg-promo .bdg-ins svg{width:100%;height:100%;display:block;overflow:visible;}',
    '.bdg-promo .bdg-shine{animation:bdgShine 1.1s cubic-bezier(.4,0,.2,1) 1.05s both;}',
    '.bdg-promo .bdg-p-eyebrow{position:relative;margin-top:20px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#FFE58A;animation:bdgUp .5s ease-out .75s both;}',
    '.bdg-promo .bdg-p-title{position:relative;margin-top:4px;font-family:' + DISPLAY + ';font-weight:700;font-size:40px;line-height:1;letter-spacing:-.6px;color:' + GOLD + ';-webkit-text-stroke:2px ' + INK + ';paint-order:stroke fill;text-shadow:4px 4px 0 ' + INK + ';animation:bdgWord .7s cubic-bezier(.2,1.4,.4,1) .9s both;}',
    '.bdg-promo .bdg-p-name{position:relative;display:inline-block;margin-top:16px;padding:6px 16px;border:2.5px solid ' + INK + ';border-radius:999px;background:' + PAPER + ';color:' + INK + ';font-family:' + DISPLAY + ';font-weight:700;font-size:19px;box-shadow:3px 3px 0 #000;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;animation:bdgUp .5s ease-out 1.25s both;}',
    '.bdg-promo .bdg-p-line{position:relative;margin-top:12px;font-size:14px;font-weight:800;color:#C9D3F5;animation:bdgUp .5s ease-out 1.45s both;}',
    '.bdg-promo .bdg-p-hint{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom,0px));left:0;right:0;font-size:12px;font-weight:800;color:rgba(255,255,255,.45);animation:bdgFade .5s ease-out 2.2s both;}',
    '.bdg-promo .bdg-spark{background:' + GOLD + ';}',
    '.bdg-promo .bdg-spark.w{background:#fff;}',
    '.bdg-promo .bdg-ribbon{position:absolute;width:9px;height:16px;border-radius:2px;top:-20px;animation:bdgFall linear both;}',

    /* ── trophy case ── */
    '.bdg-case{font-family:' + "'Nunito',-apple-system,system-ui,sans-serif" + ';color:' + INK + ';width:100%;max-width:420px;margin:0 auto;}',
    '.bdg-rank{display:flex;align-items:center;gap:12px;padding:12px 14px;background:' + NAVY + ';color:' + PAPER + ';border:2.5px solid ' + INK + ';border-radius:18px;box-shadow:4px 4px 0 ' + INK + ';}',
    '.bdg-rank .bdg-insignia{flex:none;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45));}',
    '.bdg-rank-body{flex:1;min-width:0;}',
    '.bdg-rank-eyebrow{font-size:10.5px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#FFE58A;display:flex;justify-content:space-between;gap:8px;}',
    '.bdg-rank-eyebrow span{color:#C9D3F5;letter-spacing:.4px;text-transform:none;font-size:12px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;}',
    '.bdg-rank-title{font-family:' + DISPLAY + ';font-weight:700;font-size:25px;line-height:1.05;letter-spacing:-.3px;color:' + GOLD + ';margin-top:1px;}',
    '.bdg-bar{position:relative;height:12px;margin-top:8px;border:2px solid ' + INK + ';border-radius:999px;background:#0E1533;overflow:hidden;}',
    '.bdg-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(180deg,#FFE58A 0 35%,' + GOLD + ' 35%);border-right:2px solid ' + INK + ';}',
    '.bdg-bar i.full{border-right:0;}',
    '.bdg-rank-next{margin-top:5px;font-size:12.5px;font-weight:800;color:#E3E8FA;}',
    '.bdg-rank-next b{color:' + GOLD + ';font-weight:900;}',
    '.bdg-case-head{display:flex;align-items:baseline;justify-content:space-between;margin:18px 2px 10px;}',
    '.bdg-case-head .bdg-eyebrow{color:#6E655C;}',
    '.bdg-case-head b{font-family:' + DISPLAY + ';font-weight:700;font-size:15px;}',
    '.bdg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}',
    '.bdg-cell{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 5px 9px;background:#fff;border:2.5px solid ' + INK + ';border-radius:14px;box-shadow:3px 3px 0 ' + INK + ';min-width:0;}',
    '.bdg-cell .bdg-ic{position:relative;width:54px;height:54px;}',
    '.bdg-cell .bdg-ic svg{width:100%;height:100%;display:block;}',
    '.bdg-cell .bdg-n{position:absolute;right:-9px;top:-5px;min-width:24px;padding:1px 5px;border:2px solid ' + INK + ';border-radius:999px;background:' + YELLOW + ';font-family:' + DISPLAY + ';font-weight:700;font-size:12.5px;line-height:16px;box-shadow:1.5px 1.5px 0 ' + INK + ';}',
    '.bdg-cell .bdg-name{margin-top:6px;font-family:' + DISPLAY + ';font-weight:700;font-size:13px;line-height:1.1;letter-spacing:-.1px;}',
    '.bdg-cell .bdg-desc{margin-top:3px;font-size:10.5px;font-weight:700;line-height:1.25;color:#6E655C;}',
    '.bdg-cell.bdg-locked{background:#F4EEE2;border-color:#B9AE9C;box-shadow:none;border-style:dashed;}',
    '.bdg-cell.bdg-locked .bdg-ic svg.bdg-icon{filter:grayscale(1);opacity:.32;}',
    '.bdg-cell.bdg-locked .bdg-name{color:#857A6E;}',
    '.bdg-cell .bdg-lock{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;}',
    '.bdg-cell.bdg-rocket{grid-column:span 1;}',

    /* ── keyframes ── */
    '@keyframes bdgStamp{0%{opacity:0;transform:translateY(-40px) scale(1.35) rotate(-7deg);}55%{opacity:1;transform:translateY(0) scale(.95) rotate(-1deg);}78%{transform:scale(1.02) rotate(-1.5deg);}100%{opacity:1;transform:scale(1) rotate(-1deg);}}',
    '@keyframes bdgOut{to{opacity:0;transform:translateY(-36px) scale(.92) rotate(-2deg);}}',
    '@keyframes bdgSpin{0%{opacity:0;transform:scale(.2) rotate(-300deg);}60%{opacity:1;transform:scale(1.14) rotate(12deg);}80%{transform:scale(.97) rotate(-3deg);}100%{opacity:1;transform:scale(1) rotate(0);}}',
    '@keyframes bdgRays{to{transform:rotate(360deg);}}',
    '@keyframes bdgFade{from{opacity:0;}to{opacity:1;}}',
    '@keyframes bdgFadeOut{to{opacity:0;}}',
    '@keyframes bdgGlint{from{left:-40%;}to{left:120%;}}',
    '@keyframes bdgTimer{from{transform:scaleX(1);}to{transform:scaleX(0);}}',
    '@keyframes bdgTwinkle{0%{opacity:0;transform:scale(0) rotate(0);}40%{opacity:1;transform:scale(1.2) rotate(45deg);}100%{opacity:0;transform:scale(.4) rotate(90deg);}}',
    '@keyframes bdgInsIn{0%{opacity:0;transform:translateY(-60px) scale(2.2) rotate(-14deg);}55%{opacity:1;transform:translateY(0) scale(.92) rotate(2deg);}75%{transform:scale(1.05) rotate(-1deg);}100%{opacity:1;transform:scale(1) rotate(0);}}',
    '@keyframes bdgShine{from{transform:translateX(0) skewX(-20deg);}to{transform:translateX(130px) skewX(-20deg);}}',
    '@keyframes bdgUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}',
    '@keyframes bdgWord{0%{opacity:0;transform:scale(.3) rotate(-6deg);}100%{opacity:1;transform:scale(1) rotate(-2deg);}}',
    '@keyframes bdgFall{0%{transform:translateY(0) rotate(0);opacity:1;}100%{transform:translateY(110vh) rotate(720deg);opacity:.9;}}',
    '@media (prefers-reduced-motion: reduce){',
    '.bdg-pop,.bdg-promo,.bdg-medal .bdg-coin,.bdg-promo .bdg-ins,.bdg-promo .bdg-p-title,.bdg-promo .bdg-p-name,.bdg-promo .bdg-p-line,.bdg-promo .bdg-p-eyebrow,.bdg-added{animation:bdgFade .3s ease-out both !important;}',
    '.bdg-pop.bdg-out,.bdg-promo.bdg-out{animation:bdgFadeOut .25s ease-in forwards !important;}',
    '.bdg-medal .bdg-rays,.bdg-promo .bdg-sunburst{animation:bdgFade .3s both !important;}',
    '.bdg-spark,.bdg-ribbon,.bdg-glint,.bdg-shine{display:none !important;}',
    '}'
  ].join('\n');

  function injectCss() {
    try {
      if (document.getElementById('bdg-style')) return;
      var s = document.createElement('style');
      s.id = 'bdg-style';
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }

  /* ═════════════ Sound & haptics (host globals, guarded) ═════════════ */
  function soundOn() {
    try { return typeof window.soundEnabled === 'function' ? !!window.soundEnabled() : false; } catch (e) { return false; }
  }
  function T(f, d, delay, type, vol, glide) {
    try { if (typeof window.tone === 'function') window.tone(f, d, delay || 0, type || 'sine', vol == null ? 0.08 : vol, glide || null); } catch (e) {}
  }
  function N(d, delay, vol, ff, type) {
    try { if (typeof window.noise === 'function') window.noise(d, delay || 0, vol == null ? 0.15 : vol, ff || 2500, type || 'bandpass'); } catch (e) {}
  }
  function vib(p) {
    try { if (typeof window.buzz === 'function') { window.buzz(p); return; } } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {}
  }
  function reduced() { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }

  function sndStamp(at, heavy) {
    N(0.09, at, heavy ? 0.34 : 0.24, 700, 'lowpass');
    T(heavy ? 120 : 150, 0.16, at, 'sine', heavy ? 0.34 : 0.24, 55);
    N(0.025, at, 0.12, 4200, 'bandpass');
  }
  // Your own badge always sings on your phone; everyone else's plays only on the speaker phone (moments.js)
  function bigOk(mine) { try { return !!mine || (!window.ccBigSound || window.ccBigSound()); } catch (e) { return true; } }
  function sndPop(kind, mine) {
    if (!soundOn() || !bigOk(mine)) return;
    try {
      var t = 0;
      if (kind === 'moon') {               // whoosh up before the stamp
        N(0.42, 0, 0.16, 1400, 'bandpass'); T(260, 0.42, 0, 'sine', 0.05, 1400); t = 300;
      } else {
        N(0.16, 0, 0.08, 2600, 'highpass');
      }
      sndStamp(t + 260, mine);
      var notes = mine ? [1047, 1319, 1568, 2093] : [1319, 1760];
      notes.forEach(function (f, i) { T(f, 0.22, t + 360 + i * 75, 'sine', mine ? 0.07 : 0.06); T(f * 2, 0.09, t + 360 + i * 75, 'triangle', 0.015); });
      if (mine) { [1047, 1319, 1568].forEach(function (f) { T(f, 0.8, t + 360 + notes.length * 75, 'sine', 0.035); }); N(0.25, t + 640, 0.06, 6000, 'highpass'); }
    } catch (e) {}
  }
  function sndPromo(mine) {
    if (!soundOn() || !bigOk(mine)) return;
    try {
      var v = mine ? 1 : 0.75;
      // brass: stacked saw + square + triangle, slightly detuned
      function brass(f, d, at, vol) {
        T(f, d, at, 'sawtooth', 0.028 * vol); T(f * 1.004, d, at, 'square', 0.018 * vol); T(f, d, at, 'triangle', 0.05 * vol); T(f / 2, d, at, 'triangle', 0.03 * vol);
      }
      var G4 = 392, C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
      N(0.5, 0, 0.1 * v, 1200, 'bandpass'); T(200, 0.5, 0, 'sine', 0.04, 900);   // rise
      sndStamp(520, true);
      [[G4, 0.13, 640], [G4, 0.13, 780], [C5, 0.13, 920], [E5, 0.3, 1060], [C5, 0.13, 1380], [E5, 0.13, 1520]].forEach(function (n) { brass(n[0], n[1], n[2], v); });
      [C5, E5, G5].forEach(function (f) { brass(f, 1.5, 1680, v * 0.8); });
      brass(C6, 1.5, 1680, v * 0.6);
      T(130.8, 1.4, 1680, 'sine', 0.12 * v);
      N(0.9, 1700, 0.07 * v, 6000, 'highpass');                                  // cymbal
      [2093, 2637, 3136, 4186].forEach(function (f, i) { T(f, 0.25, 1180 + i * 60, 'sine', 0.025); }); // shine sparkle
    } catch (e) {}
  }

  /* ═════════════ Queue / overlay ═════════════ */
  var queue = [], current = null, layer = null;

  function getLayer() {
    if (layer && document.body && document.body.contains(layer)) return layer;
    layer = document.createElement('div');
    layer.id = 'bdg-layer';
    layer.setAttribute('aria-live', 'polite');
    (document.body || document.documentElement).appendChild(layer);
    return layer;
  }

  function sparkles(host, n, spread, cls) {
    try {
      if (reduced()) return;
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i');
        s.className = 'bdg-spark' + (cls && i % 3 === 0 ? ' ' + cls : '');
        var a = (i / n) * Math.PI * 2 + Math.random() * 0.6, r = spread * (0.65 + Math.random() * 0.45), k = 0.6 + Math.random() * 1.1;
        s.style.cssText = 'left:calc(50% + ' + (Math.cos(a) * r).toFixed(1) + 'px - 6px);top:calc(50% + ' + (Math.sin(a) * r).toFixed(1) + 'px - 6px);' +
          'transform:scale(' + k.toFixed(2) + ');animation-delay:' + (0.35 + Math.random() * 0.9).toFixed(2) + 's;animation-duration:' + (0.8 + Math.random() * 0.8).toFixed(2) + 's;';
        host.appendChild(s);
      }
    } catch (e) {}
  }

  function caseGlyph() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><g stroke="' + INK + '" stroke-width="2" stroke-linejoin="round">' +
      '<path d="M7 4 H17 V9 Q17 14 12 14 Q7 14 7 9 Z" fill="' + YELLOW + '"/><path d="M7 6 H4 Q4 10 7.6 11 M17 6 H20 Q20 10 16.4 11" fill="none"/>' +
      '<path d="M12 14 V17" fill="none"/><rect x="8" y="17" width="8" height="3.5" rx="1" fill="' + YELLOW + '"/></g></svg>';
  }

  function showPop(it) {
    var o = it.opts, kind = KINDS[o.kind] ? o.kind : 'moon', mine = !!o.mine;
    var L = getLayer(); L.className = '';
    var card = document.createElement('div');
    card.className = 'bdg-pop' + (mine ? ' bdg-mine' : '');
    card.setAttribute('role', 'status');
    var title = o.title || KINDS[kind].name;
    var whoTxt = Array.isArray(o.who) ? o.who.join(' & ') : o.who;
    card.innerHTML =
      '<div class="bdg-medal"><div class="bdg-rays"></div><div class="bdg-coin">' + icon(kind, mine ? 124 : 96) + '</div><div class="bdg-glint"></div></div>' +
      '<div class="bdg-eyebrow">' + (mine ? 'New badge!' : (kind === 'moon' ? 'Rocket earned' : 'Badge earned')) + '</div>' +
      '<div class="bdg-title">' + esc(title) + '</div>' +
      (whoTxt ? '<div class="bdg-who">' + esc(whoTxt) + (mine ? ' · you!' : '') + '</div>' : '') +
      (o.line ? '<div class="bdg-line">' + esc(o.line) + '</div>' : '') +
      (mine ? '<div class="bdg-added">' + caseGlyph() + 'Added to your trophy case</div>' : '') +
      '<div class="bdg-timer"><i style="animation-duration:' + it.dur + 'ms"></i></div>';
    L.appendChild(card);
    sparkles(card.querySelector('.bdg-medal'), mine ? 9 : 6, mine ? 74 : 60);
    card.addEventListener('click', function (e) { try { e.stopPropagation(); } catch (x) {} finish(it); });
    it.el = card;
    sndPop(kind, mine);
    if (mine) setTimeout(function () { vib(kind === 'moon' ? [30, 50, 30, 50, 120] : [25, 45, 90]); }, kind === 'moon' ? 560 : 260);
  }

  function showPromo(it) {
    var o = it.opts, rank = o.rank || 'Captain', mine = !!o.mine;
    var L = getLayer(); L.className = 'bdg-promo-on';
    var ov = document.createElement('div');
    ov.className = 'bdg-promo';
    ov.setAttribute('role', 'status');
    var rk = null; for (var i = 0; i < RANKS.length; i++) if (RANKS[i].title.toLowerCase() === String(rank).toLowerCase()) rk = RANKS[i];
    var title = rk ? rk.title : String(rank);
    ov.innerHTML =
      '<div class="bdg-sunburst"></div>' +
      '<div class="bdg-insw"><div class="bdg-ins">' + insignia(title, 176, true) + '</div></div>' +
      '<div class="bdg-p-eyebrow">' + (mine ? 'Attention on deck' : 'Promotion') + '</div>' +
      '<div class="bdg-p-title">Promoted to<br>' + esc(title) + '</div>' +
      (o.name ? '<div class="bdg-p-name">' + esc(o.name) + (mine ? ' · you!' : '') + '</div>' : '') +
      (rk ? '<div class="bdg-p-line">' + rk.rockets + ' rockets landed' + (mine ? ' · added to your trophy case' : '') + '</div>' : '') +
      '<div class="bdg-p-hint">Tap to continue</div>';
    L.appendChild(ov);
    sparkles(ov.querySelector('.bdg-insw'), 14, 120, 'w');
    try {
      if (!reduced()) {
        var cols = [GOLD, '#FFE58A', '#fff', RED, '#7FC4FF'];
        for (var k = 0; k < 26; k++) {
          var r = document.createElement('i');
          r.className = 'bdg-ribbon';
          r.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[k % cols.length] + ';animation-delay:' + (0.9 + Math.random() * 1.6).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;width:' + (6 + Math.random() * 5).toFixed(0) + 'px;';
          ov.appendChild(r);
        }
      }
    } catch (e) {}
    ov.addEventListener('click', function (e) { try { e.stopPropagation(); } catch (x) {} finish(it); });
    it.el = ov;
    sndPromo(mine);
    setTimeout(function () {
      if (current !== it) return;
      if (mine) vib([40, 60, 40, 60, 220]);
      try { if (window.confetti && typeof window.confetti.burst === 'function') window.confetti.burst(innerWidth / 2, innerHeight * 0.36, mine ? 110 : 60); } catch (e) {}
    }, 620);
  }

  function finish(it) {
    try {
      if (!it || it.done) return;
      it.done = true;
      clearTimeout(it.timer);
      var el = it.el;
      if (el) {
        el.classList.add('bdg-out');
        setTimeout(function () { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) {} }, 420);
      }
      if (current === it) current = null;
      setTimeout(next, 260);
    } catch (e) { current = null; }
  }

  function next() {
    try {
      if (current) return;
      var it = queue.shift();
      if (!it) { if (layer) layer.className = ''; return; }
      current = it;
      injectCss();
      if (it.type === 'promo') showPromo(it); else showPop(it);
      it.timer = setTimeout(function () { finish(it); }, it.dur);
    } catch (e) { current = null; }
  }

  function enqueue(type, opts, dur) {
    try {
      queue.push({ type: type, opts: opts || {}, dur: dur });
      if (!current) next();
    } catch (e) {}
    return dur;
  }

  function pop(opts) {
    opts = opts || {};
    return enqueue('pop', opts, opts.mine ? 3800 : 3200);   // long enough to read before the dealer moves on
  }
  function promotion(opts) {
    opts = opts || {};
    return enqueue('promo', opts, opts.mine ? 4400 : 3800);
  }
  function clearQueue() {
    try {
      queue = [];
      if (current) finish(current);
    } catch (e) {}
  }

  /* ═════════════ Trophy case ═════════════ */
  function lockGlyph() {
    return '<svg class="bdg-lock" viewBox="0 0 24 24" aria-hidden="true"><g stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round">' +
      '<path d="M8 11 V8 Q8 4 12 4 Q16 4 16 8 V11" fill="none" stroke-linecap="round"/>' +
      '<rect x="5.5" y="10.5" width="13" height="10" rx="2.5" fill="' + YELLOW + '"/><circle cx="12" cy="15.5" r="1.6" fill="' + INK + '" stroke="none"/></g></svg>';
  }
  function caseHtml(counts, rockets) {
    try {
      injectCss();
      counts = counts || {};
      var r = Math.max(0, Math.floor(+rockets || 0)), rk = rankOf(r), pct = Math.round(rk.progress * 100);
      var nextTxt = rk.next ? '<b>' + rk.need + '</b> more rocket' + (rk.need === 1 ? '' : 's') + ' to ' + esc(rk.next) : 'Top rank. The fleet salutes you.';
      var earned = 0, cells = '';
      for (var i = 0; i < ORDER.length; i++) {
        var k = ORDER[i], n = Math.max(0, Math.floor(+counts[k] || 0));
        if (k === 'moon' && !n && r) n = r;
        if (n) earned++;
        cells += '<div class="bdg-cell' + (n ? '' : ' bdg-locked') + '" title="' + esc(KINDS[k].desc) + '">' +
          '<div class="bdg-ic">' + icon(k, 54) + (n ? (n > 1 ? '<span class="bdg-n">×' + n + '</span>' : '') : lockGlyph()) + '</div>' +
          '<div class="bdg-name">' + esc(KINDS[k].name) + '</div>' +
          '<div class="bdg-desc">' + esc(KINDS[k].desc) + '</div></div>';
      }
      var rocketTiny = icon('moon', 18);
      return '<div class="bdg-case">' +
        '<div class="bdg-rank">' + insignia(rk.title, 62) +
          '<div class="bdg-rank-body">' +
            '<div class="bdg-rank-eyebrow">Your rank<span>' + rocketTiny + ' ' + r + ' rocket' + (r === 1 ? '' : 's') + '</span></div>' +
            '<div class="bdg-rank-title">' + esc(rk.title) + '</div>' +
            '<div class="bdg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i class="' + (pct >= 100 ? 'full' : '') + '" style="width:' + Math.max(pct, pct > 0 ? 6 : 0) + '%"></i></div>' +
            '<div class="bdg-rank-next">' + nextTxt + '</div>' +
          '</div></div>' +
        '<div class="bdg-case-head"><span class="bdg-eyebrow">Trophy case</span><b>' + earned + ' / ' + ORDER.length + '</b></div>' +
        '<div class="bdg-grid">' + cells + '</div></div>';
    } catch (e) { return ''; }
  }

  try { if (document.head) injectCss(); else document.addEventListener('DOMContentLoaded', injectCss); } catch (e) {}

  window.Badges = {
    KINDS: KINDS,
    RANKS: RANKS,
    ORDER: ORDER,
    icon: icon,
    insignia: function (rankTitle, size) { return insignia(rankTitle, size, false); },
    rankOf: rankOf,
    pop: function (o) { try { return pop(o); } catch (e) { return 0; } },
    promotion: function (o) { try { return promotion(o); } catch (e) { return 0; } },
    clearQueue: clearQueue,
    caseHtml: caseHtml
  };
})();
