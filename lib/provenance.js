// lib/provenance.js — SINGLE source of truth for trust tiers + provenance tagging.
//
// App-agnostic and dependency-free so it imports cleanly from BOTH the browser app
// (src/…) and the serverless API (api/… — which cannot import from src/), and can be
// lifted into its own package later. src/modules/provenance/ re-exports this file.
//
// Two orthogonal axes:
//   • tier         — how much to TRUST the claim: verified > reported > inferred > unknown
//   • source_class — WHAT KIND of source produced it (outlet, wire, primary, podcast,
//                    discussion, social, market). Independent of trust.

// Trust tiers, highest wins. 'inferred' is the modern name for what older code called
// 'unverified'; 'unknown' is the floor for items with no trust signal at all.
export const TIER_RANK = { verified: 3, reported: 2, inferred: 1, unknown: 0 };

// Canonicalize a tier string. Legacy 'unverified' → 'inferred'. Anything absent or
// unrecognized → undefined, so callers apply their OWN fallback (clustering, for
// example, treats an untagged article as 'reported', not as the 0-rank floor).
export function normalizeTier(t) {
  if (t == null) return undefined;
  const s = String(t).toLowerCase();
  if (s === 'unverified') return 'inferred';
  return s in TIER_RANK ? s : undefined;
}

// Numeric rank for any tier, with a caller-chosen fallback for untagged items.
// Default fallback 2 ('reported') matches the historical clustering default, so
// swapping existing `t in TIER_RANK ? TIER_RANK[t] : 2` reads for this is behavior-safe.
export function tierRankOf(t, fallback = 2) {
  const n = normalizeTier(t);
  return n ? TIER_RANK[n] : fallback;
}

// Display label. 'inferred' still READS as "Unverified" so user-facing wording is
// unchanged from before the rename; 'unknown' shows nothing.
export const TIER_LABEL = { verified: 'Verified', reported: 'Reported', inferred: 'Unverified', unknown: '' };

// Known wire services (a source_class of their own — syndicated primary reporting).
const WIRE_SOURCES = new Set(['reuters', 'associated press', 'ap', 'ap news', 'afp', 'bloomberg']);

// Classify WHAT KIND of source an item is. Honors an already-set source_class.
export function sourceClassOf(item) {
  if (!item) return 'outlet';
  if (item.source_class) return item.source_class;
  const src = String(item.source || '').toLowerCase();
  if (item.kind === 'market' || src === 'polymarket' || src === 'kalshi') return 'market';
  if (item.type === 'podcast' || item.cat === 'podcasts') return 'podcast';
  if (item.platform === 'reddit' || item.platform === 'hn' || item.platform === 'hackernews') return 'discussion';
  if (item.platform === 'x' || item.platform === 'twitter' || item.kind === 'xpulse') return 'social';
  if (WIRE_SOURCES.has(src)) return 'wire';
  return 'outlet';
}

// Default trust tier for a source_class when the item carries no explicit tier.
const CLASS_DEFAULT_TIER = {
  outlet: 'reported', wire: 'reported', primary: 'verified',
  podcast: 'reported', discussion: 'inferred', social: 'inferred', market: 'unknown',
};

// Pure: returns { tier, source_class, label } for any item. Never mutates the input.
// Governance rule preserved from the old scattered logic: a tag may never RAISE a
// low-trust class above its ceiling — discussion/social stay 'inferred' even if an
// upstream step mis-tagged them higher, and market probabilities are never news trust.
export function tagProvenance(item) {
  const source_class = sourceClassOf(item);
  const explicit = normalizeTier(item && (item._tier || item.tier));
  let tier = explicit || CLASS_DEFAULT_TIER[source_class] || 'reported';
  if ((source_class === 'discussion' || source_class === 'social') && TIER_RANK[tier] > TIER_RANK.inferred) tier = 'inferred';
  if (source_class === 'market') tier = 'unknown';
  return { tier, source_class, label: TIER_LABEL[tier] || '' };
}
