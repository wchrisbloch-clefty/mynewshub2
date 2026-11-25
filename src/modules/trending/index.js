// AG4: trending boost. After first paint, fetch Google Trends US daily RSS (through the existing
// /api/feed proxy — no new endpoint) and build a set of meaningful tokens. A cluster whose headline
// shares >=2 of those tokens is "trending": it gets a neutral "Trending" chip in "Also moving" (AG3)
// and a capped +1 follow boost. Inferred; never raises a tier; failure is silent. Pure token logic is
// unit-tested; the fetch itself is NEEDS-DEVICE (no live egress in the sandbox).
export const TRENDING_URL = 'https://trends.google.com/trending/rss?geo=US';

const STOP = new Set(['the','and','for','with','from','that','this','have','will','your','what','when',
  'news','today','update','latest','says','after','over','into','amid','about','their','they','been']);

// Fetch the daily trending searches via the app's RSS loader (fetchRSS). Returns raw term strings.
export async function fetchTrending(fetchRSS) {
  try { const { items } = await fetchRSS(TRENDING_URL); return (items || []).map(i => i && i.title).filter(Boolean); }
  catch { return []; }
}

// Build a Set of meaningful (>3 char, non-stopword) lowercased tokens from the trending terms.
export function trendTokens(terms) {
  const set = new Set();
  for (const t of terms || []) for (const w of String(t).toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length > 3 && !STOP.has(w)) set.add(w);
  }
  return set;
}

// A headline is trending when it shares >= 2 meaningful tokens with the trending set.
export function isTrending(article, tokenSet) {
  if (!tokenSet || !tokenSet.size || !article || !article.title) return false;
  const seen = new Set();
  let hits = 0;
  for (const w of article.title.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length > 3 && !seen.has(w) && tokenSet.has(w)) { seen.add(w); if (++hits >= 2) return true; }
  }
  return false;
}
