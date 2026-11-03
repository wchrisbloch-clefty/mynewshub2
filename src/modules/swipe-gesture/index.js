// ─── SWIPE GESTURE — pure decision (M4.2) ─────────────────────────────────────
// Given a COMPLETED touch gesture's metrics, decide whether it is a deliberate
// horizontal category swipe. Kept pure (no DOM, no React) so the thresholds are
// unit-tested without a browser (swipe-gesture.test.mjs); useSwipe() in App.jsx
// just collects the metrics and calls this.
//
// Why each rule (CB's phone: a diagonal thumb-arc while scrolling fired a nav):
//   minDx 100  — a real page-turn is a decisive slide, not a 60–80px drift.
//   ratio 3    — must be strongly horizontal (|dx| >= 3*|dy|); a diagonal is a scroll.
//   maxMs 600  — a slow drag is scrolling/reading, not a flick.
//   edge 24    — ignore the iOS left/right back-swipe zone entirely.
//   scrollChanged — if the page scrolled vertically during the gesture, it was a scroll.
export const SWIPE = { minDx: 100, ratio: 3, maxMs: 600, edge: 24 };

export function evaluateSwipe(m, cfg = SWIPE) {
  const { dx = 0, dy = 0, dt = 0, startX = NaN, viewportW = 0, scrollChanged = false, cancelled = false } = m || {};
  if (cancelled) return { fire: null, reason: 'cancelled' };           // data-no-swipe target / vertical intent
  if (scrollChanged) return { fire: null, reason: 'scrolled' };        // page scrolled during the gesture
  if (startX <= cfg.edge || startX >= viewportW - cfg.edge) return { fire: null, reason: 'edge' };
  if (dt > cfg.maxMs) return { fire: null, reason: 'too-slow' };
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < cfg.minDx) return { fire: null, reason: 'too-short' };
  if (adx < ady * cfg.ratio) return { fire: null, reason: 'too-diagonal' };
  return { fire: dx > 0 ? 'right' : 'left', reason: 'swipe' };
}
