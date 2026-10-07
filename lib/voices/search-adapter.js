// lib/voices/search-adapter.js — provider-agnostic web search for Voices discovery (E2).
//
// One tiny surface — searchWeb(query, { limit }) -> [{ title, url, description }] — behind
// two interchangeable providers chosen by env:
//   SEARCH_PROVIDER = 'brave' | 'serper'   (default 'brave')
//   SEARCH_API_KEY  = <key>
// With NO key it returns null (NOT []), so callers can tell "search is OFF" from "search
// ran and found nothing" and show "Add a search key to enable discovery". Dependency-free
// (uses global fetch); importable from the serverless API.

// Brave Search API has NO free tier (metered billing since Feb 2026), so Serper is the
// default (it has a one-time free allowance). Brave is kept as an option but is PAID.
export const PAID_PROVIDERS = new Set(['brave']);
export function searchProvider() {
  const key = process.env.SEARCH_API_KEY || '';
  const provider = (process.env.SEARCH_PROVIDER || 'serper').toLowerCase();
  return { key, provider, enabled: !!key, paid: PAID_PROVIDERS.has(provider) };
}

export async function searchWeb(query, { limit = 5, signal } = {}) {
  const { key, provider, enabled } = searchProvider();
  if (!enabled) return null; // search disabled — distinct from an empty result
  try {
    if (provider === 'serper') return await serper(query, key, limit, signal);
    return await brave(query, key, limit, signal);
  } catch {
    return []; // ran but failed — empty, not null
  }
}

async function brave(query, key, limit, signal) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;
  const r = await fetch(url, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
    signal: signal || AbortSignal.timeout(7000),
  });
  if (!r.ok) throw new Error(`brave ${r.status}`);
  const d = await r.json();
  const rows = (d && d.web && d.web.results) || [];
  return rows.slice(0, limit).map(x => ({ title: x.title || '', url: x.url || '', description: x.description || '' }));
}

async function serper(query, key, limit, signal) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: limit }),
    signal: signal || AbortSignal.timeout(7000),
  });
  if (!r.ok) throw new Error(`serper ${r.status}`);
  const d = await r.json();
  const rows = (d && d.organic) || [];
  return rows.slice(0, limit).map(x => ({ title: x.title || '', url: x.link || '', description: x.snippet || '' }));
}
