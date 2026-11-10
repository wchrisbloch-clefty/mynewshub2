// AB3: real-network font proof. Loads Home, Business, Sports, Podcasts and the Reader with the
// network recorder on and asserts, for each: 0 requests to fonts.googleapis.com / fonts.gstatic.com;
// no self-hosted font requested more than once; every served font response is 200/304. It also
// asserts the vercel.json immutable cache-header config for /fonts is present. The REAL response
// header on the Vercel preview is MOCKED here (the sandbox static server does not apply vercel.json);
// the exact `curl -I` commands to confirm it on the preview are printed at the end (NEEDS-DEVICE).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';
import { readFileSync } from 'node:fs';
const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const PAGES = [['Home', 'general'], ['Business', 'business'], ['Sports', 'sports'], ['Podcasts', 'podcasts'], ['Reader', 'general']];
let fails = 0;
const note = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

// 1) vercel.json config assertion.
const vj = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const fontRule = (vj.headers || []).find(h => h.source === '/fonts/(.*)');
const cc = fontRule && fontRule.headers.find(h => h.key === 'Cache-Control');
note(!!cc && /max-age=31536000/.test(cc.value) && /immutable/.test(cc.value), `vercel.json: /fonts → "${cc ? cc.value : '(none)'}"`);
note(/\(\?!api\)/.test((vj.rewrites || [])[0]?.source || ''), 'vercel.json: SPA rewrite still excludes /api');

const browser = await chromium.launch();
for (const [label, route] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1194, height: 834 } });
  const p = await ctx.newPage();
  const reqs = []; const statuses = [];
  let google = 0;
  p.on('request', r => { const u = r.url(); if (/fonts\.(googleapis|gstatic)\.com/.test(u)) google++; else if (/\.woff2(\?|$)/.test(u)) reqs.push(u.split('/').pop().split('?')[0]); });
  p.on('response', r => { if (/\.woff2(\?|$)/.test(r.url())) statuses.push(r.status()); });
  const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  if (label === 'Reader') { await p.waitForTimeout(1200); await p.locator('.fc-title, .toh-text-title, .snap-title, [class*="-title"]').first().click().catch(() => {}); }
  await p.waitForTimeout(1800);
  const dup = [...new Set(reqs)].filter(f => reqs.filter(x => x === f).length > 1);
  note(google === 0, `${label}: 0 fonts.googleapis/gstatic requests (got ${google})`);
  note(dup.length === 0, `${label}: no self-hosted font requested twice${dup.length ? ' — ' + dup.join(',') : ''}`);
  note(statuses.every(s => s === 200 || s === 304), `${label}: every woff2 response 200/304 (${statuses.join(',') || 'none needed'})`);
  note(errs.length === 0, `${label}: 0 console errors`);
  await ctx.close();
}
await browser.close();

console.log('\nMOCKED — the real immutable response header is NEEDS-DEVICE (the sandbox static server');
console.log('does not apply vercel.json). Confirm on the Vercel preview with:');
for (const f of ['inter-latin-wght', 'inter-latin-ext-wght', 'source-serif-4-latin-wght', 'source-serif-4-latin-ext-wght'])
  console.log(`  curl -sI "https://<preview>/fonts/${f}.<hash>.woff2" | grep -i cache-control   # expect: public, max-age=31536000, immutable`);
console.log(`\nFONT-NETWORK — ${fails} failures`);
console.log(fails === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fails ? 1 : 0);
