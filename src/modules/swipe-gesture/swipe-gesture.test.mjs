// M4.2 gesture-decision test. Run: node src/modules/swipe-gesture/swipe-gesture.test.mjs
import { evaluateSwipe, SWIPE } from './index.js';
const W = 390, mid = 195;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const base = { dx: 0, dy: 0, dt: 200, startX: mid, viewportW: W, scrollChanged: false, cancelled: false };
const ev = o => evaluateSwipe({ ...base, ...o });

// Fires: a clean, fast, horizontal slide from mid-screen.
ok(ev({ dx: 140, dy: 10, dt: 250 }).fire === 'right', 'clean right swipe fires');
ok(ev({ dx: -140, dy: 10, dt: 250 }).fire === 'left', 'clean left swipe fires');
// Exactly at thresholds.
ok(ev({ dx: 100, dy: 0, dt: 600 }).fire === 'right', 'dx=100 dt=600 fires (boundary inclusive)');
ok(ev({ dx: 120, dy: 40, dt: 250 }).fire === 'right', '|dx|=3*|dy| fires (boundary)');

// Ignored — each M4.2 rule.
ok(ev({ dx: 90, dy: 5, dt: 250 }).reason === 'too-short', 'dx<100 ignored (too-short)');
ok(ev({ dx: 140, dy: 60, dt: 250 }).reason === 'too-diagonal', 'diagonal (|dx|<3|dy|) ignored');
ok(ev({ dx: 140, dy: 10, dt: 900 }).reason === 'too-slow', 'slow drag (>600ms) ignored');
ok(ev({ dx: 120, dy: 90, dt: 900 }).fire === null, 'slow diagonal drag ignored (M4.4 case 4)');
ok(ev({ dx: 150, dy: 10, dt: 250, startX: 10 }).reason === 'edge', 'start in left edge zone ignored');
ok(ev({ dx: 150, dy: 10, dt: 250, startX: W - 10 }).reason === 'edge', 'start in right edge zone ignored');
ok(ev({ dx: 150, dy: 10, dt: 250, scrollChanged: true }).reason === 'scrolled', 'page scrolled → ignored');
ok(ev({ dx: 150, dy: 10, dt: 250, cancelled: true }).reason === 'cancelled', 'cancelled (data-no-swipe/vertical) ignored');

// The 20-trial thumb-arc: a vertical scroll with slight horizontal drift never fires.
let navs = 0;
for (let i = 0; i < 20; i++) { const r = ev({ dx: 15 + (i % 10), dy: 120 + i, dt: 500, scrollChanged: true }); if (r.fire) navs++; }
ok(navs === 0, `20 thumb-arc trials → 0 navigations (got ${navs})`);

ok(SWIPE.minDx === 100 && SWIPE.ratio === 3 && SWIPE.maxMs === 600 && SWIPE.edge === 24, 'SWIPE config matches M4.2 spec');
console.log(fails ? `\nFAIL (${fails})` : '\nPASS: swipe fires only on a fast, decisive, horizontal, non-edge, non-scrolling gesture');
process.exit(fails ? 1 : 0);
