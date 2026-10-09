// ─── STATE OF PLAY — row selection (pure) ─────────────────────────────────────
// The ranked/breaking/gap rows State of Play renders, computed in one place so the
// dedup rules are testable without React (I0.7). No UI, no app state.
//
// Rule: a story shown as Breaking must NOT repeat in the numbered list, and a story
// already numbered must NOT repeat as a coverage-gap row. Breaking, the ranked feed,
// and the gap list are three separate inputs drawn from the same stories, so they are
// deduped against each other by clusterKey (the shared cluster-identity normalization).
import { rankClusters, sameStory } from '../clustering/index.js';
import { isSatire } from '../satire/index.js';

export function selectStateOfPlay({ items = [], breakingItems = [], gapItems = [] } = {}) {
  // Satire (The Onion, Babylon Bee, …) is excluded from State of Play by rule (I0.8).
  const noSatire = arr => (arr || []).filter(a => !isSatire(a));
  items = noSatire(items); breakingItems = noSatire(breakingItems); gapItems = noSatire(gapItems);
  // Breaking rows fold in at the TOP (top 3).
  const breaking = breakingItems.slice(0, 3);
  const notSameAsAny = (row, shown) => !shown.some(s => sameStory(row, s));

  // Numbered rows: ranked by heat, ≤2 per publisher, MINUS any story already breaking.
  // Over-fetch (limit 8) before dropping breaking dupes so the list still fills to 5.
  const top = rankClusters(items, { max: 2, limit: 8 })
    .filter(a => notSameAsAny(a, breaking))
    .slice(0, 5);

  // Coverage-gap rows continue the count (top 3), minus any story already shown above.
  const shownAbove = [...breaking, ...top];
  const gaps = (gapItems || [])
    .filter(g => notSameAsAny(g, shownAbove))
    .slice(0, 3);

  return { breaking, top, gaps };
}
