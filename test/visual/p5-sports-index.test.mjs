// P5: the Sports league row. Phone keeps scrollable label-only chips; >=641 it becomes a
// wrapping grid of equal outlined index tiles that carry live counts, hide 0-count leagues
// (except the selected one), and never scroll horizontally at >=820. Chromium; Safari = NEEDS-DEVICE.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const browser = await chromium.launch();
let failures = 0;
const log = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

async function load(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w <= 430, hasTouch: w <= 430 });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => window.__nav && window.__nav('sports'));
  await p.waitForSelector('.sport-index .sport-tab', { timeout: 15000 });
  await p.waitForTimeout(600);
  return { ctx, p };
}

// Phone (390): counts hidden, chips scroll row (not a grid).
{
  const { ctx, p } = await load(390, 844);
  const r = await p.evaluate(() => {
    const idx = document.querySelector('.sport-index');
    const count = document.querySelector('.sport-index .sport-tab-count');
    return { display: getComputedStyle(idx).display, countShown: count ? getComputedStyle(count).display !== 'none' : false };
  });
  log(r.display !== 'grid', `[390] league row is the chip row, not a grid (display=${r.display})`);
  log(r.countShown === false, `[390] counts hidden on the phone chip row`);
  await ctx.close();
}

// Tablet/desktop (820, 1280): grid, no horizontal scroll, counts shown, 0-count hidden, selected filled.
for (const [w, h] of [[820, 1180], [1280, 900]]) {
  const { ctx, p } = await load(w, h);
  const r = await p.evaluate(() => {
    const idx = document.querySelector('.sport-index');
    const noScroll = idx.scrollWidth <= idx.clientWidth + 1;
    const tiles = [...idx.querySelectorAll('.sport-tab')];
    const vis = el => getComputedStyle(el).display !== 'none';
    const anyCountShown = tiles.some(t => { const c = t.querySelector('.sport-tab-count'); return c && vis(c); });
    // a league tile whose count reads 0 must be hidden unless it is the active one
    const zeroShown = tiles.filter(t => {
      const c = t.querySelector('.sport-tab-count'); if (!c) return false;
      const n = parseInt(c.textContent || '0', 10);
      return n === 0 && vis(t) && !t.classList.contains('active');
    }).length;
    const active = idx.querySelector('.sport-tab.active');
    const activeBg = active ? getComputedStyle(active).backgroundColor : '';
    const isFilled = activeBg && activeBg !== 'rgba(0, 0, 0, 0)' && activeBg !== 'transparent';
    return { display: getComputedStyle(idx).display, noScroll, anyCountShown, zeroShown, isFilled, activeBg };
  });
  log(r.display === 'grid', `[${w}] league row is a wrapping grid (display=${r.display})`);
  log(r.noScroll, `[${w}] no horizontal scroll (scrollWidth<=clientWidth)`);
  log(r.anyCountShown, `[${w}] index tiles show counts`);
  log(r.zeroShown === 0, `[${w}] 0-count leagues hidden (${r.zeroShown} stray zero tiles)`);
  log(r.isFilled, `[${w}] selected tile is a filled pill (bg=${r.activeBg})`);
  await ctx.close();
}

await browser.close();
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
