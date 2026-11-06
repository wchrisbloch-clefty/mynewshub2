// X4: layout polish. (a) no meta line wraps leaving a lone age / "ago"; (d) the first item of a
// phone horizontal scroller sits at the 16px page gutter; (c) a feed-row headline never exceeds the
// Top Stories headline size on the same page/band.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const browser = await chromium.launch();
let fails = 0;

async function ctx(w, h) {
  const c = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w <= 640, hasTouch: w <= 640 });
  const p = await c.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  return { c, p };
}

// (d) first chip at the 16px gutter
for (const w of [360, 390, 430]) {
  const { c, p } = await ctx(w, 844);
  await p.waitForTimeout(1500);
  const x = await p.evaluate(() => { const bar = document.querySelector('.chip-bar'); if (!bar) return null; const chip = bar.querySelector('.chip'); if (!chip) return null; return Math.round(chip.getBoundingClientRect().left); });
  if (x === null) console.log(`SKIP chip-gutter ${w}: no chip bar`);
  else if (Math.abs(x - 16) <= 2) console.log(`PASS chip-gutter ${w}: first chip at ${x}px`);
  else { fails++; console.log(`FAIL chip-gutter ${w}: first chip at ${x}px (want 16)`); }
  await c.close();
}

// (a) meta age not orphaned + (c) feed headline <= top-stories headline
for (const [w, route, name] of [[390, 'bloom', 'energy'], [820, 'business', 'business'], [1194, 'general', 'home'], [1440, 'bloom', 'energy']]) {
  const { c, p } = await ctx(w, 1000);
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    // meta orphan: a meta element whose last visual line is just an age token
    const metas = [...document.querySelectorAll('.toh-meta, .toh-text-meta, .toh-compact-meta, .fc-meta, .snap-meta')];
    let orphan = 0;
    for (const m of metas) {
      const cs = getComputedStyle(m); if (cs.display === 'none') continue;
      const lh = parseFloat(cs.lineHeight) || 16; const h = m.getBoundingClientRect().height;
      const lines = Math.round(h / lh);
      if (lines > 1) {
        // multi-line meta: does the trailing text look like a lone age?
        const txt = (m.textContent || '').trim();
        if (/(^|\s)(\d+[mhdwy]o?\s?ago|ago|Just\s?now)$/i.test(txt) && txt.split(/\s+/).length <= (lines + 1)) orphan++;
      }
    }
    // feed headline vs top-stories headline font-size
    const fz = sel => { const e = document.querySelector(sel); return e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null; };
    const feed = fz('.fc-title') || fz('.snap-title'); const top = fz('.toh-title') || fz('.toh-compact-title');
    return { orphan, feed, top };
  });
  if (r.orphan) { fails++; console.log(`FAIL meta-orphan ${name} ${w}: ${r.orphan} lone-age meta line(s)`); }
  else console.log(`PASS meta-orphan ${name} ${w}: 0`);
  if (r.feed && r.top && r.feed > r.top) { fails++; console.log(`FAIL feed-headline ${name} ${w}: feed ${r.feed}px > top-stories ${r.top}px`); }
  else console.log(`PASS feed-headline ${name} ${w}: feed ${r.feed} <= top ${r.top}`);
  await c.close();
}

console.log(`\nLAYOUT-POLISH — ${fails} failures`);
console.log(fails === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
await browser.close();
process.exit(fails ? 1 : 0);
