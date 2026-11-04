// O4: one story once per Sports PAGE. With the real-shape fixture (which repeats several
// headlines across 2–4 "sources", exactly like a syndicated wire), assert that:
//   (a) no story (by title-key) renders twice inside the main column — hero, hero grid, list;
//   (b) the rail (State of Play) is disjoint from the main column — nothing shown in the
//       column reappears in the rail.
// Title-key is the same rule Home uses: first 60 chars, lowercased, whitespace stripped.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const key = t => (t || '').slice(0, 60).toLowerCase().replace(/\s+/g, '');

const browser = await chromium.launch();
let failures = 0;
const log = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

for (const dark of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await installRealFixtures(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.__nav && window.__nav('sports'));
  // wait for the sports feed to populate
  await page.waitForSelector('.sports-page .feed-col', { timeout: 15000 });
  await page.waitForTimeout(1200);

  const data = await page.evaluate(() => {
    const txt = el => (el?.textContent || '').trim();
    const col = document.querySelector('.sports-page .feed-col');
    const sidebar = document.querySelector('.sports-page .sidebar');
    const colTitles = col ? [
      ...col.querySelectorAll('.sports-hero-title'),
      ...col.querySelectorAll('.gn-card-title'),
      ...col.querySelectorAll('.fc-title'),
    ].map(txt).filter(Boolean) : [];
    const railTitles = sidebar ? [...sidebar.querySelectorAll('.sop-item-title')].map(txt).filter(Boolean) : [];
    // blank-image audit: every image slot must show a real <img> or a labelled placeholder.
    const slots = col ? [...col.querySelectorAll('.gn-card-img, .fc-body')] : [];
    let blank = 0;
    for (const s of slots) {
      const hasImg = s.querySelector('img');
      const hasPh = s.querySelector('.cover-img-ph-label, .fc-thumb-ph .ph-label');
      if (!hasImg && !hasPh) continue; // .fc-body text-only rows have no image slot at all
      const phLabel = s.querySelector('.cover-img-ph-label, .ph-label');
      if (!hasImg && phLabel && !txt(phLabel)) blank++;
    }
    return { colTitles, railTitles, blank };
  });

  const mode = dark ? 'dark ' : 'light';
  // (a) no duplicate within the column
  const colKeys = data.colTitles.map(key);
  const seen = new Set(); const dupes = [];
  for (const k of colKeys) { if (seen.has(k)) dupes.push(k); seen.add(k); }
  log(dupes.length === 0, `[${mode}] column has no repeated story (${data.colTitles.length} rows, ${dupes.length} dupes)`);

  // (b) rail disjoint from column
  const colSet = new Set(colKeys);
  const overlap = data.railTitles.map(key).filter(k => colSet.has(k));
  log(overlap.length === 0, `[${mode}] rail disjoint from column (${data.railTitles.length} rail rows, ${overlap.length} overlap)`);

  // (c) no blank image boxes
  log(data.blank === 0, `[${mode}] no blank image boxes (${data.blank} blank)`);

  if (dupes.length || overlap.length) {
    console.log(`       column: ${data.colTitles.length} rows; rail: ${data.railTitles.length} rows`);
    if (dupes.length) console.log(`       dup keys: ${[...new Set(dupes)].join(' | ')}`);
    if (overlap.length) console.log(`       overlap keys: ${[...new Set(overlap)].join(' | ')}`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
