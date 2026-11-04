// T4: prove State of Play is up front AND disjoint on every category page, using a fixture rich
// enough (several feeds per category → several source names) that >=3 rail-eligible rows survive
// the 2-per-publisher cap. Chromium touch emulation; real Safari = NEEDS-DEVICE.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRichFixtures } from './richfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const key = t => (t || '').slice(0, 60).toLowerCase().replace(/\s+/g, '');
const browser = await chromium.launch();
let fails = 0;
const log = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

for (const route of ['sports', 'bloom', 'business', 'health']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const media = await p.addInitScript(() => {});
  await installRichFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  const touch = await p.evaluate(() => matchMedia('(hover:none)').matches);
  await p.evaluate(r => window.__nav && window.__nav(r), route);
  await p.waitForTimeout(1900);

  const r = await p.evaluate(() => {
    const txt = e => (e.textContent || '').trim();
    const vh = innerHeight;
    // the up-front State of Play card (phone hoist / sop-mobile / sports hoist)
    const card = document.querySelector('.sports-sop-hoist .sop-strip, .sop-mobile .sop-strip, .sop-hoist .sop-strip, .mh-sop .sop-strip');
    const cardTop = card ? (card.getBoundingClientRect().top + scrollY) : null;
    const sopTitles = card ? [...card.querySelectorAll('.sop-item-title')].map(txt) : [];
    const emptyBox = card ? (sopTitles.length === 0) : false; // a rendered card with no rows = stray empty box
    // everything the main column shows (hero + grid + list)
    const col = document.querySelector('.feed-col') || document.querySelector('.mobile-home');
    const colTitles = col ? [
      ...col.querySelectorAll('.sports-hero-title,.gn-card-title,.fc-title,.snap-title,.mh-compact-title'),
    ].map(txt).filter(Boolean) : [];
    return { hasCard: !!card, rows: sopTitles.length, vhMultiple: cardTop != null ? cardTop / vh : null, sopTitles, colTitles, emptyBox };
  });

  log(touch, `[${route}] touch media active (hover:none)`);
  if (!r.hasCard) { log(false, `[${route}] State of Play card present`); await ctx.close(); continue; }
  log(r.vhMultiple <= 1.5, `[${route}] SoP card top within 1.5 viewport heights (${r.vhMultiple.toFixed(2)})`);
  log(r.rows >= 3, `[${route}] SoP card shows a real list (${r.rows} rows)`);
  log(!r.emptyBox, `[${route}] no stray empty SoP box`);
  // disjoint: no SoP headline also appears in the column
  const colSet = new Set(r.colTitles.map(key));
  const overlap = r.sopTitles.map(key).filter(k => colSet.has(k));
  log(overlap.length === 0, `[${route}] State of Play disjoint from the column (${overlap.length} repeated)`);

  await ctx.close();
}

await browser.close();
console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
