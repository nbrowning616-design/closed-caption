/* ═══════════════════════════════════════════════════════════
   Closed Caption — fx.js
   Reduce Motion, for every script-driven moment in the app (the steal, the skip gags, the round stamp, confetti,
   flashes, the framing, the end credits, Caption of the Night). One check, read live — so flipping the phone's setting mid-game takes
   effect at the next moment. CSS animations are already calmed by the media query in index.html; Web Animations,
   canvas confetti and the hand-drawn shows are not, so they ask this.
   (The old skip "executions" lived here; the 50 hand-drawn skip gags replaced them: skips.js, Oct 21 2026.)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.ccReducedMotion = function () {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  };
})();
