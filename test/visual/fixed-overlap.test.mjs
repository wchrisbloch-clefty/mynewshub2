// X6: no floating element covers text. The chat launcher is a header icon now, so at any scroll
// stop NO position:fixed/sticky element (other than the allowed chrome — header, bottom tab bar,
// sheets/toasts/modals/the chat panel) may intersect a text leaf. Also: the launcher opens in one
// tap, carries an accessible label, and the page logs 0 console errors.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const WIDTHS = [[360, 780], [390, 844], [390, 664], [430, 932], [820, 1180], [1024, 1366], [1194, 834], [1280, 900], [1440, 900]];
const PAGES = [['home', 'general'], ['sports', 'sports'], ['energy', 'bloom'], ['business', 'business'], ['tech', 'tech'], ['health', 'health'], ['briefing', 'briefing']];
const ALLOW = '.topbar-wrap,.header-scroll,.nav-bar,.bottom-tabs,.bottom-topics,.chip-bar,.more-sheet,.more-sheet-overlay,.mobile-search,.chat-drawer,.chat-overlay,.swipe-hint,.toast,.score-strip-scroll,.sticky-scores,.topbar-scores,.status-strip,.new-stories-pill,.sop-mobile';

const browser = await chromium.launch();
let fails = 0, consoleErrs = 0;

async function scan(w, h, name, route) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w <= 640, hasTouch: w <= 640 });
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') consoleErrs++; });
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  // hide the ?debug=1 scroll/render overlay — it is a test-only fixed panel (z:99999), not app chrome
  await p.addStyleTag({ content: 'div[style*="99999"]{display:none!important}' }).catch(() => {});
  await p.waitForTimeout(1600);
  const bad = [];
  for (const y of [0, 300, 900]) {
    await p.evaluate(yy => window.scrollTo(0, yy), y);
    await p.waitForTimeout(250);
    const hits = await p.evaluate((ALLOW) => {
      const out = [];
      const fixed = [...document.querySelectorAll('*')].filter(el => { const s = getComputedStyle(el); return (s.position === 'fixed' || s.position === 'sticky') && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05; });
      const texts = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while (n = tw.nextNode()) { const t = n.nodeValue.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!el) continue; const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') continue; const r = el.getBoundingClientRect(); if (r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight) texts.push({ el, r }); }
      for (const f of fixed) {
        if (f.closest(ALLOW) || ALLOW.split(',').some(sel => f.matches(sel.trim()))) continue;
        const fr = f.getBoundingClientRect();
        if (fr.width < 2 || fr.height < 2) continue;
        // does this floating element sit OVER any visible text leaf (that isn't its own descendant)?
        for (const t of texts) {
          if (f.contains(t.el) || t.el.contains(f)) continue;
          const ox = Math.min(fr.right, t.r.right) - Math.max(fr.left, t.r.left);
          const oy = Math.min(fr.bottom, t.r.bottom) - Math.max(fr.top, t.r.top);
          if (ox > 2 && oy > 2) { out.push(`<.${String(f.className).slice(0, 24)}> over "${(t.el.textContent || '').trim().slice(0, 18)}"`); break; }
        }
      }
      return [...new Set(out)];
    }, ALLOW);
    for (const hbad of hits) bad.push(`[${name} ${w} y=${y}] ${hbad}`);
  }
  // chat opens in one tap via the header icon. The phone renders .mobile-icon-btn, wider viewports
  // .nav-icon-btn; both carry aria-label="Ask NewsHub". Scroll to top so the auto-hiding header is
  // in view, then click the viewport-appropriate one.
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  const askBtns = await p.$$('button[aria-label="Ask NewsHub"]');
  const label = askBtns.length > 0;
  const sel = w <= 640 ? 'button.mobile-icon-btn[aria-label="Ask NewsHub"]' : 'button.nav-icon-btn[aria-label="Ask NewsHub"]';
  let oneTap = false;
  const btn = await p.$(sel);
  if (btn) { await p.$eval(sel, e => e.click()).catch(() => {}); await p.waitForTimeout(1600); oneTap = await p.evaluate(() => !!document.querySelector('.chat-drawer')); }
  await ctx.close();
  return { bad, oneTap, label };
}

for (const [w, h] of WIDTHS) {
  for (const [name, route] of PAGES) {
    const r = await scan(w, h, name, route);
    if (r.bad.length) { fails += r.bad.length; r.bad.slice(0, 3).forEach(s => console.log('FAIL ' + s)); }
    if (!r.label) { fails++; console.log(`FAIL ${name} ${w}: no accessible "Ask NewsHub" launcher`); }
    if (!r.oneTap) { fails++; console.log(`FAIL ${name} ${w}: chat did not open in one tap`); }
    if (!r.bad.length && r.label && r.oneTap) console.log(`PASS ${name} ${w}: 0 overlaps, 1-tap chat, labelled`);
  }
}
console.log(`\nFIXED-OVERLAP — ${fails} overlap/launcher failures, ${consoleErrs} console errors`);
console.log(fails === 0 && consoleErrs === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
await browser.close();
process.exit(fails || consoleErrs ? 1 : 0);
