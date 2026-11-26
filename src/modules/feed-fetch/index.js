// AH2: one fetch-with-fallback rule, pure + unit-tested (inject doFetch(url)→{items,status}).
// Trigger: the fallback runs when the primary yields NO items — whether that is a non-200, a 200 with
// 0 items, or a timeout/error (status 0). A "thin" primary (a few items) plus a mergeFallbackUrl
// fetches both and merges (dedupe by link). If a fallback also returns 0 items the result is a neutral
// "no items" (usedFallback:true), never a hard failure. Items keep the feed's name upstream, so the
// source's rank/sub/alt are unchanged.
// AG1/AH2: Google News `site:` search is the reliable fallback for a publisher whose own RSS blocks
// or 404s. Derived from the primary host; never GNews → GNews.
export function gnewsFallback(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    if (!h || h.includes('news.google.com')) return '';
    return `https://news.google.com/rss/search?q=when:2d%20site:${h}&hl=en-US&gl=US&ceid=US:en`;
  } catch { return ''; }
}

// AH2: the /api/feed proxy fetch, built in this lazy chunk (takes App's fetchWithTimeout) so it stays
// out of the initial bundle. Returns { items, status } with the real upstream status.
export function makeProxyFetch(fetchWithTimeout) {
  return async u => {
    const r = await fetchWithTimeout(`/api/feed?url=${encodeURIComponent(u)}`, 10000);
    if (r.ok) { const d = await r.json(); return { items: d.items || [], status: d.status || ((d.items && d.items.length) ? 200 : 0) }; }
    return { items: [], status: r.status || 0 };
  };
}

function dedupeByLink(items) {
  const seen = new Set(); const out = [];
  for (const i of items || []) { const k = i && i.link; if (k && seen.has(k)) continue; if (k) seen.add(k); out.push(i); }
  return out;
}

// `thin` only ever triggers a merge for a feed that carries an explicit mergeFallbackUrl (just DCF +
// VentureBeat), so a higher value is safe — it never adds a second fetch to any other feed.
export async function fetchWithFallback(url, { fallbackUrl, mergeFallbackUrl, gnews, thin = 10, doFetch } = {}) {
  const get = async u => { try { const r = await doFetch(u); return { items: (r && r.items) || [], status: (r && r.status) || 0 }; } catch { return { items: [], status: 0 }; } };
  const prim = await get(url);

  // THIN merge: a working-but-sparse primary + an explicit merge fallback → fetch both, merge+dedupe.
  if (prim.items.length > 0 && prim.items.length < thin && mergeFallbackUrl) {
    const ex = await get(mergeFallbackUrl);
    const merged = dedupeByLink([...prim.items, ...ex.items]);
    return { items: merged, status: 200, usedFallback: merged.length > prim.items.length, via: 'Google News', reason: '' };
  }
  if (prim.items.length > 0) return { items: prim.items, status: prim.status || 200, usedFallback: false, reason: '' };

  // Primary yielded nothing (non-200 / 0 items / timeout) → try ONE fallback: explicit, else GNews.
  const fb = fallbackUrl || (gnews ? gnews(url) : '');
  if (fb && fb !== url) {
    const fr = await get(fb);
    if (fr.items.length) return { items: fr.items, status: 200, usedFallback: true, via: 'Google News', reason: '' };
    return { items: [], status: prim.status || 0, usedFallback: true, reason: 'no items' }; // tried, empty → neutral
  }
  return { items: [], status: prim.status || 0, usedFallback: false, reason: `unavailable${prim.status ? ` (${prim.status})` : ''}` };
}
