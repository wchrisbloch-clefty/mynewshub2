// api/discussions.js — "What People Are Saying" street-signal lookup (Batch B item 3).
//
// Server-side Reddit + Hacker News search for a story title. This moved OFF the browser
// (item 3b): the client used to fetch https://www.reddit.com/search.json directly, but
// that cross-origin call is unreliable in a real browser — reddit.com does not send CORS
// headers for arbitrary origins, and unauthenticated requests with no User-Agent are
// rate-limited (429). Server-side we control the User-Agent and there is no CORS gate.
//
// Mirrors api/x-pulse.js: GET, fail-soft (always 200, never throws), per-query memory
// cache + edge s-maxage, and the client keeps its click-to-load trigger (nothing here
// auto-fetches). Every item is stamped tier:'inferred', source_class:'discussion'.

const cache = new Map(); // queryKey -> { at, data }
const TTL = 10 * 60_000;
const UA = 'MyNewsHub/1.0 (+https://mynewshub2.vercel.app; news discussions lookup)';

async function fetchReddit(q) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=5&t=week`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.data?.children || [])
      .filter(c => c?.data?.num_comments > 0)
      .slice(0, 3)
      .map(c => ({
        title: c.data.title, sub: c.data.subreddit_name_prefixed,
        ups: c.data.ups, comments: c.data.num_comments,
        url: `https://reddit.com${c.data.permalink}`,
        platform: 'reddit', source_class: 'discussion', tier: 'inferred',
      }));
  } catch { return []; }
}

async function fetchHN(q) {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=5`;
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    const d = await r.json();
    return (d?.hits || [])
      .filter(h => h.num_comments > 0)
      .slice(0, 3)
      .map(h => ({
        title: h.title, points: h.points, comments: h.num_comments,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        platform: 'hn', source_class: 'discussion', tier: 'inferred',
      }));
  } catch { return []; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

  const q = (req.query.q || '').toString().slice(0, 120).trim();
  const empty = { reddit: [], hn: [] };
  if (!q) return res.status(200).json(empty);

  const ck = q.toLowerCase();
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < TTL) return res.status(200).json(hit.data);

  const [reddit, hn] = await Promise.all([fetchReddit(q), fetchHN(q)]);
  const data = { reddit, hn };
  cache.set(ck, { at: Date.now(), data });
  return res.status(200).json(data);
}
