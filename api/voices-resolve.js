// /api/voices-resolve.js — Voices discovery (E2). Given a name (+type), returns up to 3
// candidate profiles per platform (X, Instagram, LinkedIn, TikTok, YouTube) with the
// handle, URL, display name, bio snippet, follower count and verified flag WHEN the
// search provider surfaces them. A candidate is marked confirmedEligible only when two
// signals agree; the client still requires an explicit per-platform confirm — this route
// never saves anything and never returns a guess as wired.
//
// Fail-soft: with no SEARCH_API_KEY it returns { enabled:false, note } (HTTP 200) so the
// UI can say "Add a search key to enable discovery" while manual entry still works.

process.noDeprecation = true;

import { resolveVoice } from '../lib/voices/resolve.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  const name = (q.name || '').toString().trim();
  const type = (q.type || 'person').toString();
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const result = await resolveVoice({ name, type });
    // Discovery is a paid call; cache per name/type for 30 min at the CDN (E5 cost guard).
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({ name, enabled: false, reason: 'resolve-error', note: String(err && err.message || err).slice(0, 160), platforms: {} });
  }
}
