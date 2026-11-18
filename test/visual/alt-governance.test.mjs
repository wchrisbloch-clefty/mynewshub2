// AF2.3: ALT-lane governance, end to end on a REAL alt feed (The Daily Wire, source assigned by the
// feed name so isAlt() sees it). Proves CB's device check #3 and the three governance rules it
// surfaced: an `alt` source (1) never leads Top Stories, (2) never enters State of Play, (3) appears
// ONLY in the feed's Latest carrying the "Alternative perspective" chip — and the Show-alternative-
// perspective switch (stored v26_showAlt=false) hides it everywhere. Chromium + realfix.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const iso = h => new Date(Date.now() + h * 3600e3).toISOString();
const TITLE = 'Daily Wire commentary on the national budget debate this week';
const browser = await chromium.launch();
let fails = 0;
const log = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

async function render(showAlt) {
  const ctx = await browser.newContext({ viewport: { width: 1194, height: 834 } });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  // Registered AFTER realfix so it wins for the Daily Wire URL; the app stamps source from the feed
  // NAME ('The Daily Wire'), which is what isAlt() keys on — injecting into another feed would not.
  await p.route('**/api/feed**', async r => {
    const f = new URL(r.request().url()).searchParams.get('url') || '';
    if (/dailywire\.com/.test(f)) {
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        items: [{ title: TITLE, link: 'https://ex.com/dw/1', pubDate: iso(-1), desc: 'alt take' }], status: 200 }) });
    }
    return r.fallback();
  });
  if (!showAlt) await p.addInitScript(() => { try { localStorage.setItem('v26_showAlt', 'false'); } catch {} });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  await p.evaluate(() => window.__nav && window.__nav('general'));
  await p.waitForTimeout(3000);
  const r = await p.evaluate(t => ({
    chip: [...document.querySelectorAll('.snap-alt')].filter(e => (e.textContent || '').includes('Alternative perspective')).length,
    inFeedCard: [...document.querySelectorAll('[class*="snap"]')].some(c => (c.textContent || '').includes(t)),
    inSopOrTop: [...document.querySelectorAll('.sop-item-title, [class*="toh"]')].some(c => (c.textContent || '').includes(t)),
    anyVisible: [...document.querySelectorAll('*')].some(n => [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.includes(t))),
  }), TITLE);
  await ctx.close();
  return r;
}

const on = await render(true);
log(on.anyVisible, 'alt item is present when Show-alt is ON');
log(on.inFeedCard, 'alt item appears in a feed card (SnapshotCard), not a promoted module');
log(!on.inSopOrTop, 'alt item never appears in State of Play or Top Stories (never leads/counts coverage)');
log(on.chip >= 1, '"Alternative perspective" chip is shown on the alt item');

const off = await render(false);
log(!off.anyVisible, 'Show-alt OFF hides the alt item everywhere');
log(off.chip === 0, 'no alt chip remains when Show-alt is OFF');

await browser.close();
console.log(`\nALT-GOVERNANCE — ${fails} failures`);
console.log(fails === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fails ? 1 : 0);
