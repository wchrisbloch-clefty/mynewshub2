// /api/voices-test.js — "Test voices" (E5). For each confirmed voice + handle, probe the
// platform and report ok / failed(reason) / unverifiable. This is how a real device
// confirms the wiring; it makes NO search-API calls (so running it costs nothing against
// the search quota) — it probes the free/content routes only.
//
//   youtube                 — YouTube Data API if YOUTUBE_API_KEY, else "no key"
//   instagram/tiktok/       — RSSHub route resolves with items
//     linkedin(company)
//   x / twitter             — unverifiable on the free RSSHub instance (per source-resolver)
//   linkedin(person)        — no public route for a person → unverifiable

process.noDeprecation = true;
import { allowOrigin, guard } from '../lib/voices/guard.js';
const RSSHUB = () => (process.env.RSSHUB_BASE_URL || 'https://rsshub.app').replace(/\/$/, '');
const UA = 'Mozilla/5.0 (compatible; NewsHubBot/1.0)';
// item 4: encode each handle to one path segment so it can't change the request path.
const seg = s => encodeURIComponent(String(s || '').replace(/^@/, ''));

async function probeRss(path) {
  const r = await fetch(`${RSSHUB()}${path}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(7000) });
  if (r.status === 429) return { ok: false, reason: 'rate-limited (RSSHub)' };
  if (!r.ok) return { ok: false, reason: `RSSHub ${r.status}` };
  const xml = await r.text();
  return /<item[\s>]/i.test(xml) ? { ok: true } : { ok: false, reason: 'no items' };
}

async function probe(platform, handle) {
  const h = String(handle || '').replace(/^@/, '');
  try {
    if (platform === 'youtube') {
      const key = process.env.YOUTUBE_API_KEY;
      if (!key) return { ok: false, reason: 'no YOUTUBE_API_KEY' };
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&type=channel&maxResults=1&q=${encodeURIComponent(h)}&key=${key}`, { signal: AbortSignal.timeout(7000) });
      return r.ok ? { ok: true } : { ok: false, reason: `YouTube ${r.status}` };
    }
    if (platform === 'instagram') return await probeRss(`/instagram/user/${seg(h)}`);
    if (platform === 'tiktok') return await probeRss(`/tiktok/user/${seg(h)}`);
    if (platform === 'linkedin') return /company/.test(handle) ? await probeRss(`/linkedin/company/${seg(h.replace(/^.*company\//, ''))}`) : { ok: null, reason: 'no public route for a person' };
    if (platform === 'x' || platform === 'twitter') return { ok: null, reason: 'unverifiable on free instance' };
    return { ok: null, reason: 'no probe for platform' };
  } catch (e) {
    return { ok: false, reason: e.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
  }
}

export default async function handler(req, res) {
  allowOrigin(req, res); // item 2: specific origin, never '*'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (guard(req, res)) return; // item 2: 403 disallowed origin, 429 over rate limit
  // item 3: cap voices per request and every handle at a sane length.
  const voices = (Array.isArray((req.body || {}).voices) ? req.body.voices : []).slice(0, 10);
  const results = [];
  for (const v of voices) {
    if (!v || !v.handles) continue;
    for (const [platform, handle] of Object.entries(v.handles)) {
      if (!handle || String(handle).length > 120) continue; // item 3: reject absurd handles
      const r = await probe(platform, handle);
      results.push({ name: v.name, platform, handle, ok: r.ok, reason: r.reason || null });
    }
  }
  const okCount = results.filter(r => r.ok === true).length;
  const failCount = results.filter(r => r.ok === false).length;
  return res.status(200).json({ results, summary: { total: results.length, ok: okCount, failed: failCount, unverifiable: results.length - okCount - failCount } });
}
