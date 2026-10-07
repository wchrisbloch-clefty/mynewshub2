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

import { clusterStories } from '../clustering';

export const BREAKING_STRONG_TERMS = [
  'death', 'killed', 'dies', 'died', 'resigns', 'resign', 'fired', 'arrested', 'indicted',
  'traded', 'outage', 'evacuation', 'evacuate', 'explosion', 'earthquake', 'hurricane',
  'tornado', 'wildfire', 'recall', 'halt', 'halts', 'emergency',
];
// 'trade' alone is noisy (trade war / trade deal), so it is a strong term ONLY for
// sports-category items; 'traded' is strong everywhere (already in the list above).
export const BREAKING_STRONG_SPORTS = ['trade', 'traded'];

export const PROMO_TERMS = [
  'bet now', 'promo code', 'sportsbook promo', 'parlay', 'sign-up bonus', 'signup bonus',
  'bonus code', 'free bets', 'best bets', 'how to bet', 'picks and odds', 'odds and picks',
  'betting promo', 'sponsored', 'promoted post', 'use code',
];
export const PROMO_DOMAINS = [
  'draftkings', 'fanduel', 'betmgm', 'caesars', 'bet365', 'pointsbet', 'actionnetwork',
  'oddschecker', 'covers.com', 'sportsbook',
];

export function isPromoItem(a) {
  if (!a) return false;
  const txt = ((a.title || '') + ' ' + (a.desc || '')).toLowerCase();
  if (PROMO_TERMS.some(t => txt.includes(t))) return true;
  const src = ((a.source || '') + ' ' + (a.link || '')).toLowerCase();
  return PROMO_DOMAINS.some(d => src.includes(d));
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
