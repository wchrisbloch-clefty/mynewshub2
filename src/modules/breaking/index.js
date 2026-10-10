// src/modules/breaking — the Breaking qualification rule (D2), extracted pure so it
// is unit-testable in node and shared by the app. An item is "Breaking" only when it
// clears BOTH gates:
//
//   (a) Relevance — it belongs to the page's category (feed category OR a DEFAULT_KW
//       match). On General it must be general/world-US top-news OR match ANY category's
//       keywords. Relevance is applied PER PAGE by the caller (relevanceFor), because it
//       depends on which page is being viewed.
//
//   (b) Significance — at least one of:
//        • >=3 DISTINCT outlets covering the same cluster within 2h (clusterStories), or
//        • a strong single-event term matched in the TITLE ONLY (not the description), or
//        • (optional, when the caller passes trending keys) present in a trending signal.
//
// Promos (sportsbook / sponsored / "bet now") are excluded from Breaking AND from State
// of Play ranking. Cap, 6h window and newest-first ordering are applied by qualifyBreaking.

import { clusterStories } from '../clustering/index.js';

export const BREAKING_STRONG_TERMS = [
  'death', 'killed', 'dies', 'died', 'resigns', 'resign', 'fired', 'arrested', 'indicted',
  'traded', 'outage', 'evacuation', 'evacuate', 'explosion', 'earthquake', 'hurricane',
  'tornado', 'wildfire', 'recall', 'halt', 'halts', 'emergency',
];
// 'trade' alone is noisy (trade war / trade deal), so it is a strong term ONLY for
// sports-category items; 'traded' is strong everywhere (already in the list above).
export const BREAKING_STRONG_SPORTS = ['trade', 'traded'];

// K3: ONE editable constant covering every promo/sponsored signal. Rules only, no AI.
//   title  — regexes tested against title + desc (promo PHRASES, never a bare brand name,
//            so "FanDuel parent stock falls" is NOT promo).
//   host   — bare sportsbook/affiliate DOMAINS, matched against the link's HOSTNAME only
//            (so a CNBC url that merely contains "fanduel" in its path is not promo).
//   url    — regexes tested against the whole link (sponsored/affiliate URL shapes).
//   source — regexes tested against the source NAME.
export const PROMO_PATTERNS = {
  title: [
    /\bsponsored\b/, /\bpromo code\b/, /\bbonus (bet|code)\b/, /\bbet\s*\$?\d[\d,]*\s*,?\s*get\s*\$?\d/,
    /\bsportsbook (promo|bonus)\b/, /\bsign-?up bonus\b/, /\buse code\b/, /\bpartner content\b/,
    /\bfree bets?\b/, /\bbest bets\b/, /\bhow to bet\b/, /\bpicks and odds\b/, /\bodds and picks\b/,
    /\bparlay\b/, /\bpromoted post\b/, /\bbetting promo\b/, /\bbet now\b/, /\bno-?sweat bet\b/,
    /\bfirst bet\b.*\b(safe|insurance|offer)\b/, /\bodds boost\b/,
  ],
  host: [
    'draftkings', 'fanduel', 'betmgm', 'caesars', 'bet365', 'pointsbet', 'fanatics',
    'actionnetwork', 'oddschecker', 'covers.com', 'sportsbook', 'betrivers', 'espnbet',
  ],
  url: [/\bsponsored\b/, /\/promo(s|-code)?\b/, /\/betting\/promo/, /\/sportsbook-promo/, /partner-content/],
  source: [/\bsponsored\b/, /\bpartner\b/, /sportsbook/, /\bbetmgm|draftkings|fanduel|caesars|fanatics\b/],
};

function hostOf(link) {
  try { return new URL(link).hostname.toLowerCase(); } catch { return (link || '').toLowerCase(); }
}

export function isPromoItem(a) {
  if (!a) return false;
  const txt = ((a.title || '') + ' ' + (a.desc || '')).toLowerCase();
  if (PROMO_PATTERNS.title.some(re => re.test(txt))) return true;
  const link = (a.link || a.url || '').toLowerCase();
  if (link) {
    const host = hostOf(link);
    if (PROMO_PATTERNS.host.some(d => host.includes(d))) return true;
    if (PROMO_PATTERNS.url.some(re => re.test(link))) return true;
  }
  const src = (a.source || '').toLowerCase();
  if (src && PROMO_PATTERNS.source.some(re => re.test(src))) return true;
  return false;
}

const keyOf = a => ((a && a.title) || '').slice(0, 60).toLowerCase().replace(/\s+/g, '');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const STRONG_RX = BREAKING_STRONG_TERMS.map(t => new RegExp(`\\b${esc(t)}\\b`, 'i'));
const SPORTS_RX = BREAKING_STRONG_SPORTS.map(t => new RegExp(`\\b${esc(t)}\\b`, 'i'));

// Does a single item's TITLE carry a strong event term? (sports terms only for sports cat)
export function hasStrongTerm(item) {
  const title = (item && item.title) || '';
  if (STRONG_RX.some(rx => rx.test(title))) return true;
  if (item && item.cat === 'sports' && SPORTS_RX.some(rx => rx.test(title))) return true;
  return false;
}

// Global significance pass. Returns the qualified pool (NOT yet filtered by page
// relevance), newest-first, each item stamped with _breakingWhy and _breakingSig.
// `now` is injectable for deterministic tests.
export function qualifyBreaking(articles, { now = Date.now(), trendingKeys = null, limit = 40 } = {}) {
  const sixHoursAgo = now - 6 * 60 * 60 * 1000;
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const all = (articles || []).filter(a => a && a.title && !isPromoItem(a));

  // Multi-outlet significance uses only the last 2h, clustered. Map each cluster's
  // DISTINCT-outlet count back onto its representative story key.
  const recent2h = all.filter(a => new Date(a.pubDate).getTime() > twoHoursAgo);
  const outletsByKey = new Map();
  clusterStories(recent2h).forEach(c => {
    outletsByKey.set(keyOf(c), (c._clusterSources || []).length);
  });

  const seen = new Set();
  const out = [];
  all
    .filter(a => new Date(a.pubDate).getTime() > sixHoursAgo)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .forEach(a => {
      const key = keyOf(a);
      if (seen.has(key)) return;
      const inWindow2h = new Date(a.pubDate).getTime() > twoHoursAgo;
      const outlets = inWindow2h ? (outletsByKey.get(key) || 0) : 0;
      const multiOutlet = outlets >= 3;
      const strong = hasStrongTerm(a);
      const trending = !!(trendingKeys && trendingKeys.has && trendingKeys.has(key));
      if (!multiOutlet && !strong && !trending) return;
      seen.add(key);
      const ageMin = Math.max(0, Math.round((now - new Date(a.pubDate).getTime()) / 60000));
      const why = multiOutlet ? `${outlets} outlets · ${ageMin}m`
        : strong ? `Breaking · ${ageMin}m`
        : `Trending · ${ageMin}m`;
      out.push({ ...a, _breakingWhy: why, _breakingSig: multiOutlet ? 'multi' : strong ? 'strong' : 'trending' });
    });
  return out.slice(0, limit);
}
