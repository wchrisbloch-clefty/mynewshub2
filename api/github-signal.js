// api/github-signal.js — "Trending on GitHub" street signal (Batch B item 3c, OPTIONAL).
//
// Surfaces recently-created repositories with fast star growth as an INFERRED signal on
// the AI & Tech page only. There is no GitHub "trending" API, so this uses the public
// Search API (unauthenticated): repos created in the last ~30 days, most-starred first.
//
// Reliability (item 3c's explicit concern): unauthenticated Search is rate-limited to
// ~10 requests/min PER IP, shared across all users. This stays safe ONLY because the
// query is GENERAL (not per-article) and cached hard — one upstream call per hour per
// warm lambda via the in-memory cache + edge s-maxage=3600. Fail-soft like x-pulse:
// any error / rate-limit / timeout returns { repos: [] } with 200, so the UI simply
// renders nothing rather than breaking. Click-to-load only; nothing here auto-fetches.

const cache = new Map(); // key -> { at, data }
const TTL = 60 * 60_000; // 1 hour
const UA = 'MyNewsHub/1.0 (+https://mynewshub2.vercel.app; trending repos)';

function sinceDate(days) {
  const d = new Date(Date.now() - days * 86400_000);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const empty = { repos: [] };
  const hit = cache.get('trending');
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json(hit.data);

  try {
    // Recently created + already well-starred ≈ fast star growth.
    const q = encodeURIComponent(`created:>${sinceDate(30)} stars:>100`);
    const url = `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=8`;
    const headers = { 'User-Agent': UA, 'Accept': 'application/vnd.github+json' };
    // Optional token lifts the rate limit if one is ever configured; unauthenticated works too.
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(200).json(empty); // 403 rate-limit etc. → fail soft
    const d = await r.json();
    const repos = (Array.isArray(d?.items) ? d.items : []).slice(0, 8).map(it => ({
      name: it.full_name,
      stars: it.stargazers_count,
      url: it.html_url,
      desc: (it.description || '').slice(0, 140),
      language: it.language || '',
      platform: 'github', source_class: 'discussion', tier: 'inferred',
    }));
    const data = { repos };
    cache.set('trending', { at: Date.now(), data });
    return res.status(200).json(data);
  } catch {
    return res.status(200).json(empty);
  }
}
