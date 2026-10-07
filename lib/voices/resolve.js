// lib/voices/resolve.js — resolve a Voice name to real, per-platform candidates (E2).
//
// Lifts the verify-then-wire discipline from social-command-center's source-resolver:
// NEVER wire a guess. We search the open web per platform, extract candidates from the
// result URLs/snippets, score confidence, and mark a candidate `confirmedEligible` ONLY
// when two independent signals agree. Nothing is ever auto-accepted — the UI requires an
// explicit per-platform confirm, and only a confirmed handle is stored.
//
// Pure except for the injected `search` fn (defaults to the Brave/Serper adapter), so it
// unit-tests against a stub. Dependency-free; importable from the serverless API.

import { searchWeb as defaultSearch, searchProvider } from './search-adapter.js';

// Platform → how to query + how to pull a handle out of a result URL.
const PLATFORMS = {
  x:         { host: 'x.com',           q: n => `"${n}" site:x.com OR site:twitter.com`,       handle: u => m(u, /(?:x|twitter)\.com\/(@?[A-Za-z0-9_\.]+)/i) },
  instagram: { host: 'instagram.com',   q: n => `"${n}" site:instagram.com`,                   handle: u => m(u, /instagram\.com\/([A-Za-z0-9_\.]+)/i) },
  tiktok:    { host: 'tiktok.com',      q: n => `"${n}" site:tiktok.com`,                      handle: u => m(u, /tiktok\.com\/(@[A-Za-z0-9_\.]+)/i) },
  linkedin:  { host: 'linkedin.com',    q: (n, t) => t === 'org' ? `"${n}" site:linkedin.com/company` : `"${n}" site:linkedin.com/in`, handle: u => m(u, /linkedin\.com\/(?:in|company)\/([A-Za-z0-9\-_%]+)/i) },
  youtube:   { host: 'youtube.com',     q: n => `"${n}" site:youtube.com channel OR @`,        handle: u => m(u, /youtube\.com\/(@[A-Za-z0-9_\.\-]+)/i) || m(u, /youtube\.com\/(channel\/[A-Za-z0-9_\-]+)/i) },
};
const PLATFORM_KEYS = Object.keys(PLATFORMS);

function m(s, re) { const x = re.exec(String(s || '')); return x ? x[1] : null; }
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const RESERVED = new Set(['explore', 'about', 'legal', 'help', 'home', 'watch', 'results', 'hashtag', 'p', 'reel', 'tv', 'accounts', 'privacy']);

// Pull the official-website host out of a snippet/title if one is present (a cross-platform
// agreement signal: the same site linked in two bios is strong).
function siteHost(text) {
  const u = m(text, /https?:\/\/([a-z0-9.\-]+\.[a-z]{2,})/i);
  return u ? u.replace(/^www\./, '').toLowerCase() : null;
}

export async function resolveVoice(voice, { search = defaultSearch, perPlatform = 3 } = {}) {
  const name = (voice && voice.name) || '';
  const type = (voice && voice.type) || 'person';
  const nameKey = norm(name);
  const prov = searchProvider();
  if (!prov.enabled) {
    return { name, enabled: false, reason: 'no-search-key', note: 'Add a search key (SEARCH_API_KEY) to enable discovery — manual handle entry still works.', platforms: {} };
  }

  const raw = {};
  await Promise.all(PLATFORM_KEYS.map(async pk => {
    if (type === 'person' && pk === 'linkedin') { /* still searches /in */ }
    const spec = PLATFORMS[pk];
    const results = await search(spec.q(name, type), { limit: 6 }).catch(() => []);
    const seen = new Set();
    const cands = [];
    for (const r of results || []) {
      const h = spec.handle(r.url);
      if (!h) continue;
      const bare = h.replace(/^@/, '').split('/').pop();
      if (RESERVED.has(bare.toLowerCase())) continue;
      if (seen.has(bare.toLowerCase())) continue;
      seen.add(bare.toLowerCase());
      cands.push({
        handle: h, url: r.url, displayName: (r.title || '').replace(/\s*[\(\|\-–·].*$/, '').trim(),
        bio: r.description || '', site: siteHost(`${r.title} ${r.description}`),
        followers: pickFollowers(r.description), verified: /verified|✓|☑/i.test(r.title + ' ' + r.description) || null,
        nameMatch: norm(bare).includes(nameKey) || norm(r.title).includes(nameKey),
      });
      if (cands.length >= perPlatform) break;
    }
    raw[pk] = cands;
  }));

  // Second-signal agreement: a site host (or normalized display name) that shows up on
  // >=2 platforms is corroboration. Mark confirmedEligible when the name matches AND a
  // corroborating signal exists. Never auto-accept — this only pre-checks eligibility.
  const siteCount = {}, dispCount = {};
  for (const pk of PLATFORM_KEYS) for (const c of raw[pk]) {
    if (c.site) siteCount[c.site] = (siteCount[c.site] || 0) + 1;
    const d = norm(c.displayName); if (d) dispCount[d] = (dispCount[d] || 0) + 1;
  }
  const platforms = {};
  for (const pk of PLATFORM_KEYS) {
    platforms[pk] = raw[pk].map(c => {
      const crossSite = c.site && siteCount[c.site] >= 2;
      const crossName = norm(c.displayName) && dispCount[norm(c.displayName)] >= 2;
      const confirmedEligible = !!(c.nameMatch && (crossSite || crossName));
      const confidence = confirmedEligible ? 'high' : c.nameMatch ? 'medium' : 'low';
      return { ...c, confirmedEligible, confidence, signals: { nameMatch: c.nameMatch, crossSite: !!crossSite, crossName: !!crossName } };
    });
  }
  return { name, enabled: true, platforms };
}

function pickFollowers(text) {
  const x = /([\d.,]+)\s*([KkMm])?\s*(?:followers|subscribers)/.exec(String(text || ''));
  if (!x) return null;
  let n = parseFloat(x[1].replace(/,/g, '')); const u = (x[2] || '').toLowerCase();
  if (u === 'k') n *= 1e3; if (u === 'm') n *= 1e6;
  return Math.round(n) || null;
}

export { PLATFORM_KEYS };
