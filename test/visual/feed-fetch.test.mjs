// AH2: fetch-with-fallback rule. The fallback must fire on EVERY no-items case: 404, 200+0 items,
// code 0, and timeout. Thin primaries merge. A fallback that also returns 0 items is neutral.
import { fetchWithFallback } from '../../src/modules/feed-fetch/index.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const item = t => ({ title: t, link: 'l-' + t });
const gnews = () => 'https://news.google.com/rss/search?q=site:x.com';

// doFetch that returns a scripted result per URL (and records calls)
function scripted(map) { const calls = []; const doFetch = async u => { calls.push(u); const v = map[u]; if (v instanceof Error) throw v; return v; }; return { doFetch, calls }; }

async function run() {
  // ── the four no-items trigger cases: fallback fires, items + usedFallback ──
  for (const [label, prim] of [
    ['404', { items: [], status: 404 }],
    ['200+0 items', { items: [], status: 200 }],
    ['code 0', { items: [], status: 0 }],
  ]) {
    const { doFetch } = scripted({ 'P': prim, 'FB': { items: [item('a')], status: 200 } });
    const r = await fetchWithFallback('P', { fallbackUrl: 'FB', doFetch });
    ok(r.items.length === 1 && r.usedFallback === true && r.via === 'Google News', `${label} → fallback fires (items, usedFallback)`);
  }
  // timeout (doFetch rejects on primary) → fallback fires
  {
    const { doFetch } = scripted({ 'P': new Error('timeout'), 'FB': { items: [item('a')], status: 200 } });
    const r = await fetchWithFallback('P', { fallbackUrl: 'FB', doFetch });
    ok(r.items.length === 1 && r.usedFallback === true, 'timeout → fallback fires');
  }

  // primary has items (not thin) → NO fallback fetched
  {
    const { doFetch, calls } = scripted({ 'P': { items: [item('a'), item('b'), item('c'), item('d')], status: 200 } });
    const r = await fetchWithFallback('P', { fallbackUrl: 'FB', doFetch });
    ok(r.items.length === 4 && r.usedFallback === false && calls.length === 1, 'healthy primary → no fallback call');
  }

  // THIN primary (1 item) + mergeFallbackUrl → merged + dedupe by link
  {
    const { doFetch } = scripted({ 'P': { items: [item('a')], status: 200 }, 'M': { items: [item('a'), item('b'), item('c')], status: 200 } });
    const r = await fetchWithFallback('P', { mergeFallbackUrl: 'M', doFetch });
    ok(r.items.length === 3 && r.usedFallback === true, 'thin primary merges with fallback, dedup by link');
  }

  // a MODERATELY thin primary (8 items) WITH a mergeFallbackUrl still merges (thin default 10)
  {
    const prim = { items: Array.from({ length: 8 }, (_, i) => item('p' + i)), status: 200 };
    const { doFetch } = scripted({ 'P': prim, 'M': { items: [item('p0'), item('x'), item('y')], status: 200 } });
    const r = await fetchWithFallback('P', { mergeFallbackUrl: 'M', doFetch });
    ok(r.items.length === 10 && r.usedFallback === true, '8-item primary + merge → merged (dedup), thin=10');
  }

  // fallback ALSO returns 0 items → neutral "no items", usedFallback true, not a hard fail
  {
    const { doFetch } = scripted({ 'P': { items: [], status: 404 }, 'FB': { items: [], status: 200 } });
    const r = await fetchWithFallback('P', { fallbackUrl: 'FB', doFetch });
    ok(r.items.length === 0 && r.usedFallback === true && r.reason === 'no items', 'fallback empty → neutral "no items"');
  }

  // no fallback configured + GNews derivable → tries gnews; here gnews also empty → neutral
  {
    const { doFetch, calls } = scripted({ 'P': { items: [], status: 404 }, [gnews()]: { items: [], status: 200 } });
    const r = await fetchWithFallback('P', { gnews, doFetch });
    ok(calls.includes(gnews()) && r.usedFallback === true, 'derives GNews fallback when none configured');
  }

  // no fallback at all → unavailable (not usedFallback)
  {
    const { doFetch } = scripted({ 'P': { items: [], status: 500 } });
    const r = await fetchWithFallback('P', { doFetch }); // no gnews, no fallbackUrl
    ok(r.items.length === 0 && r.usedFallback === false && /unavailable/.test(r.reason), 'no fallback → unavailable');
  }
}

await run();
console.log(`\nFEED-FETCH — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
