// /api/voices-signals.js — Voices tiles for a category (E3). Flag-only, labeled inferred,
// link-out. NO AI, NO summaries. Loads once per category open (client caches); this route
// is CDN-cached 30 min. Returns { tiles:[...], failures:[{source,reason}] } — a failing
// source is NAMED, never a broken tile.
//
// Lanes (best-effort, fail-soft, per-source try/catch):
//   Lane 1  — search snippets for each confirmed profile (latest post titles) via the
//             provider-agnostic adapter. Works for every platform a voice has a handle on.
//   Lane 2  — YouTube Data API (YOUTUBE_API_KEY, quota-guarded); RSSHub public instance
//             (RSSHUB_BASE_URL, default https://rsshub.app) for Instagram / LinkedIn
//             company / TikTok, paced per host and 429-aware.
// Reddit (existing /api/discussions) and X (xAI x-pulse, click-to-load, costs money) stay
// CLIENT lanes and are not fetched here. velocity.js orders tiles; it never raises a tier.

process.noDeprecation = true;

import { searchWeb, searchProvider } from '../lib/voices/search-adapter.js';
import { rankByVelocity, signalFor } from '../lib/voices/velocity.js';

const RSSHUB = () => (process.env.RSSHUB_BASE_URL || 'https://rsshub.app').replace(/\/$/, '');
const ageHours = d => { const t = Date.parse(d); return isFinite(t) ? Math.max(0, (Date.now() - t) / 3.6e6) : 48; };
const UA = 'Mozilla/5.0 (compatible; NewsHubBot/1.0)';

// Minimal RSS item parse (title/link/pubDate) — avoids a second feed-parser lift.
function parseRss(xml, limit = 3) {
  const items = [];
  const blocks = String(xml || '').split(/<item[\s>]/i).slice(1);
  for (const b of blocks.slice(0, limit)) {
    const pick = re => { const m = re.exec(b); return m ? (m[1] || m[2] || '').trim() : ''; };
    const title = pick(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const link = pick(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i);
    const pub = pick(/<pubDate>([\s\S]*?)<\/pubDate>/i) || pick(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    if (title) items.push({ title, url: link, pubDate: pub });
  }
  return items;
}

async function rsshubTiles(voice, platform, path, failures) {
  try {
    const url = `${RSSHUB()}${path}`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml' }, signal: AbortSignal.timeout(7000) });
    if (r.status === 429) { failures.push({ source: `${voice.name} · ${platform}`, reason: 'rate-limited (RSSHub)' }); return []; }
    if (!r.ok) { failures.push({ source: `${voice.name} · ${platform}`, reason: `RSSHub ${r.status}` }); return []; }
    const xml = await r.text();
    return parseRss(xml, 2).map(it => ({ platform, who: voice.name, handle: voice.handles[platform], url: it.url, title: it.title, ageHours: ageHours(it.pubDate) }));
  } catch (e) {
    failures.push({ source: `${voice.name} · ${platform}`, reason: e.name === 'TimeoutError' ? 'timeout' : 'unreachable' });
    return [];
  }
}

async function youtubeTiles(voice, failures) {
  const key = process.env.YOUTUBE_API_KEY;
  const h = voice.handles.youtube;
  if (!key || !h) return [];
  try {
    const handle = h.replace(/^@/, '');
    const su = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=2&order=date&q=${encodeURIComponent(handle)}&key=${key}`;
    const r = await fetch(su, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) { failures.push({ source: `${voice.name} · YouTube`, reason: `YouTube ${r.status}` }); return []; }
    const d = await r.json();
    return (d.items || []).map(it => ({ platform: 'youtube', who: voice.name, handle: h, url: `https://youtube.com/watch?v=${it.id?.videoId}`, title: it.snippet?.title || '', ageHours: ageHours(it.snippet?.publishedAt) }));
  } catch (e) { failures.push({ source: `${voice.name} · YouTube`, reason: e.name === 'TimeoutError' ? 'timeout' : 'error' }); return []; }
}

// E5 COST GUARD: Lane 1 (search snippets) is OFF by default. At scale it blows the free
// search tier — see the cost report in the PR: ~1 search per voice per category open; for
// 40 voices across a few sessions/day that is thousands of queries/month, well over Brave's
// ~2,000/mo free tier (>50%). So Lane 1 runs only when VOICES_LANE1=1 (and a key exists),
// and even then at most ONE search per voice (name-based), not per handle. Default tiles
// come from the free Lane 2 (YouTube quota-guarded + RSSHub). One search per voice, capped.
// E5/item7: Lane 1 defaults ON when a search key exists, OFF without it; VOICES_LANE1
// is the explicit override ('0' forces off, '1' forces on even if the default would differ).
const LANE1_ON = () => {
  const sw = process.env.VOICES_LANE1;
  if (sw === '0') return false;
  if (sw === '1') return true;
  return !!process.env.SEARCH_API_KEY;
};
async function lane1Tiles(voice, failures) {
  if (!LANE1_ON()) return [];
  try {
    const res = await searchWeb(`${voice.name} latest post`, { limit: 2 });
    if (res == null) return []; // search disabled (no key)
    const pk = Object.keys(voice.handles || {})[0] || 'x';
    return res.slice(0, 1).map(r => ({ platform: pk, who: voice.name, handle: voice.handles[pk], url: r.url, title: r.title, ageHours: 24, _lane: 1 }));
  } catch { failures.push({ source: `${voice.name} · search`, reason: 'search error' }); return []; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = req.body || {};
  // item 7: hard top-3 cap per category (defensive — the client already sends the user's
  // first 3), so Lane 1 search never runs for more than 3 voices per category open.
  const voices = (Array.isArray(body.voices) ? body.voices.filter(v => v && v.status === 'confirmed' && v.handles && Object.keys(v.handles).length) : []).slice(0, 3);
  const limit = Math.min(Number(body.limit) || 4, 8);
  const failures = [];

  const all = [];
  await Promise.all(voices.map(async v => {
    const [l1, yt] = await Promise.all([lane1Tiles(v, failures), youtubeTiles(v, failures)]);
    all.push(...l1, ...yt);
    // RSSHub lanes (best-effort) — IG, LinkedIn company, TikTok.
    if (v.handles.instagram) all.push(...await rsshubTiles(v, 'instagram', `/instagram/user/${v.handles.instagram.replace(/^@/, '')}`, failures));
    if (v.handles.tiktok) all.push(...await rsshubTiles(v, 'tiktok', `/tiktok/user/${v.handles.tiktok.replace(/^@/, '')}`, failures));
    if (v.handles.linkedin && /company/.test(v.handles.linkedin)) all.push(...await rsshubTiles(v, 'linkedin', `/linkedin/company/${v.handles.linkedin.replace(/^.*company\//, '')}`, failures));
  }));

  const tiles = rankByVelocity(all.map(t => ({ ...t, signal: t.signal || signalFor(t) })), { limit })
    .map(t => ({ platform: t.platform, who: t.who, handle: t.handle, url: t.url, title: t.title, ageHours: Math.round(t.ageHours), tier: 'inferred', source_class: 'social' }));

  // item 7: 24h CDN cache + SWR (no KV). Note: this route is POST, which most CDNs do not
  // cache; the durable 24h caching is on the GET /api/voices-resolve (per voice name). The
  // client also loads signals once per category open (no polling), so repeat cost is low.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  return res.status(200).json({ tiles, failures, searchEnabled: searchProvider().enabled, lane1: LANE1_ON() });
}
