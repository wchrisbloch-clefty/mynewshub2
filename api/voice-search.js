// /api/voice-search.js — Lane 1 (search snippet) for ONE voice, as a GET so the CDN can
// actually cache it. Keyed on (provider, q) via the query string, with s-maxage=86400 →
// repeat requests for the same voice are served from the edge for 24h and cost 0 search
// queries. The client ALSO keeps a 24h localStorage cache so a repeat load makes no
// request at all. POST routes (voices-signals) can't be edge-cached, which is why the
// quota-spending lane lives here.
//
// Fail-soft: no SEARCH_API_KEY, or VOICES_LANE1='0' → { enabled:false, tile:null }.

process.noDeprecation = true;

import { searchWeb, searchProvider } from '../lib/voices/search-adapter.js';
import { allowOrigin, guard } from '../lib/voices/guard.js';

const lane1On = () => {
  const sw = process.env.VOICES_LANE1;
  if (sw === '0') return false;
  if (sw === '1') return true;
  return !!process.env.SEARCH_API_KEY;
};

export default async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (guard(req, res)) return;

  const q = (req.query.q || req.query.name || '').toString().trim().slice(0, 120);
  const handle = (req.query.handle || '').toString().trim().slice(0, 120);
  const platform = (req.query.platform || 'x').toString().slice(0, 16);
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const prov = searchProvider();
  if (!prov.enabled || !lane1On()) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).json({ enabled: false, provider: prov.provider, paid: prov.paid, tile: null });
  }
  try {
    const res2 = await searchWeb(`${q} latest post`, { limit: 2 });
    const r = (res2 || [])[0];
    const tile = r ? { platform, who: q, handle, url: r.url, title: r.title, ageHours: 24, tier: 'inferred', source_class: 'social' } : null;
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).json({ enabled: true, provider: prov.provider, paid: prov.paid, tile });
  } catch (e) {
    return res.status(200).json({ enabled: true, provider: prov.provider, tile: null, error: String(e && e.message || e).slice(0, 120) });
  }
}
