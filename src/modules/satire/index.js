// ─── SATIRE FILTER — rules only, NO AI, no network. ───────────────────────────
// Satirical outlets (The Onion, Babylon Bee, ClickHole, …) publish real-sounding
// headlines ("Hurricane…") that must never be treated as news. They are excluded from
// Breaking, State of Play, and Connections by RULE: a source-name match or a URL-host
// match against the two editable lists below. Nothing here reads article BODIES or uses
// a model — a source either is on the list or it isn't.
//
// These are THE editable lists (same convention as CONNECTION_STOPLIST / BREAKING_STRONG_
// TERMS). Add an outlet by adding its display name here AND, ideally, its domain, so both
// a feed labeled "The Onion" and a bare link to theonion.com are caught.

export const SATIRE_SOURCES = [
  'The Onion', 'Onion',
  'Babylon Bee', 'The Babylon Bee',
  'ClickHole',
  'Reductress',
  'The Beaverton',
  'Waterford Whispers News',
  'The Hard Times', 'Hard Times',
  'The Daily Mash',
  'NewsThump',
  'The Shovel',
  'Private Eye',
  'The Betoota Advocate', 'Betoota Advocate',
];

export const SATIRE_URL_RULES = [
  'theonion.com',
  'babylonbee.com',
  'clickhole.com',
  'reductress.com',
  'thebeaverton.com',
  'waterfordwhispersnews.com',
  'thehardtimes.net',
  'thedailymash.co.uk',
  'newsthump.com',
  'theshovel.com.au',
  'private-eye.co.uk',
  'betootaadvocate.com',
];

const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Is this article from a known satire source? Source-name match (exact or contained)
// OR URL-host match. Pure and cheap.
export function isSatire(item, { sources = SATIRE_SOURCES, urlRules = SATIRE_URL_RULES } = {}) {
  if (!item) return false;
  const src = norm(item.source);
  if (src) {
    for (const s of sources) { const n = norm(s); if (n && (src === n || src.includes(n))) return true; }
  }
  const url = (item.link || item.url || '').toLowerCase();
  if (url) { for (const r of urlRules) { if (r && url.includes(r.toLowerCase())) return true; } }
  return false;
}

// Split a feed into { satire, rest }. `rest` is what Breaking / State of Play /
// Connections consume; `satire` is what was held back (used for the ?debug=1 before/after
// and to report which source a flagged headline — e.g. the hurricane one — came from).
export function partitionSatire(items, opts) {
  const satire = [], rest = [];
  for (const a of items || []) (isSatire(a, opts) ? satire : rest).push(a);
  return { satire, rest };
}
