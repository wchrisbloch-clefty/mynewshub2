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

import { searchProvider } from './search-adapter.js';
import { rankByVelocity, signalFor } from './velocity.js';
import { allowOrigin, guard } from './guard.js';

const RSSHUB = () => (process.env.RSSHUB_BASE_URL || 'https://rsshub.app').replace(/\/$/, '');
// item 4: every handle placed in a path is a SINGLE encoded segment — strips a leading @
// and URL-encodes the rest so a value like "../admin?x=1" can't change the path.
const seg = s => encodeURIComponent(String(s || '').replace(/^@/, ''));
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

// item 1: Lane 1 (search snippets) is no longer here — it moved to the edge-cacheable GET
// /api/voice-search (POST routes can't be CDN-cached). This route runs only the FREE Lane 2
// (YouTube quota-guarded + RSSHub); the client merges Lane 1 (GET, 24h localStorage-cached),
// Reddit and click-to-load X into the same ranking.

export default async function handler(req, res) {
  allowOrigin(req, res); // item 2: specific origin, never '*'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (guard(req, res)) return; // item 2: 403 disallowed origin, 429 over rate limit

  const body = req.body || {};
  // item 7: hard top-3 cap per category (defensive — the client already sends the user's
  // first 3), so Lane 1 search never runs for more than 3 voices per category open.
  const voices = (Array.isArray(body.voices) ? body.voices.filter(v => v && v.status === 'confirmed' && v.handles && Object.keys(v.handles).length) : []).slice(0, 3);
  const limit = Math.min(Number(body.limit) || 4, 8);
  const failures = [];

  const all = [];
  await Promise.all(voices.map(async v => {
    all.push(...await youtubeTiles(v, failures));
    // RSSHub lanes (best-effort) — IG, LinkedIn company, TikTok. Handles are encoded to a
    // single path segment (item 4) so they can never alter the request path.
    if (v.handles.instagram) all.push(...await rsshubTiles(v, 'instagram', `/instagram/user/${seg(v.handles.instagram)}`, failures));
    if (v.handles.tiktok) all.push(...await rsshubTiles(v, 'tiktok', `/tiktok/user/${seg(v.handles.tiktok)}`, failures));
    if (v.handles.linkedin && /company/.test(v.handles.linkedin)) all.push(...await rsshubTiles(v, 'linkedin', `/linkedin/company/${seg(String(v.handles.linkedin).replace(/^.*company\//, ''))}`, failures));
  }));

  const tiles = rankByVelocity(all.map(t => ({ ...t, signal: t.signal || signalFor(t) })), { limit })
    .map(t => ({ platform: t.platform, who: t.who, handle: t.handle, url: t.url, title: t.title, ageHours: Math.round(t.ageHours), tier: 'inferred', source_class: 'social' }));

  // item 7: 24h CDN cache + SWR (no KV). Note: this route is POST, which most CDNs do not
  // cache; the durable 24h caching is on the GET /api/voices-resolve (per voice name). The
  // client also loads signals once per category open (no polling), so repeat cost is low.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  return res.status(200).json({ tiles, failures, searchEnabled: searchProvider().enabled });
}
