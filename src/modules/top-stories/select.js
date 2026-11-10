// Z1: selectTopStories (below) composes these with the shared clustering + filter helpers.
import { capByPublisher, rankClusters, sameStory } from '../clustering/index.js';
import { isSatire } from '../satire/index.js';
import { isPromoItem } from '../breaking/index.js';

// S7: Home "Top Stories" selection. The old selection was a category round-robin (the first
// image item of sports, then business, then …), so a niche trade interview or a weekly-award
// blurb took a slot a national headline should have. This ranks the WHOLE cross-category pool by
// how widely the cluster is covered (distinct outlets), then recency — and allows at most ONE
// non-general-category story, and only when it is well-covered (>=2 outlets) or breaking. Pure +
// unit-tested; it does NOT touch K4's per-category balance for the sections below.
//
// items: [{ key, cat, clusterSize, pubDate, breaking }]  (already image-eligible where required)
// nonGeneralUsed: how many non-general slots the lead/hero already consumed (0 or 1).
export function rankHomeTop(items, { max = 5, nonGeneralUsed = 0 } = {}) {
  const seen = new Set();
  const dedup = [];
  for (const a of items || []) { if (!a || seen.has(a.key)) continue; seen.add(a.key); dedup.push(a); }
  dedup.sort((a, b) => {
    const c = (b.clusterSize || 1) - (a.clusterSize || 1);
    if (c) return c;
    return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
  });
  const out = [];
  let ng = nonGeneralUsed;
  const overflow = []; // kept to fill the tail so Top Stories is never short
  for (const a of dedup) {
    if (out.length >= max) break;
    const isGeneral = (a.cat || 'general') === 'general';
    if (!isGeneral) {
      if (ng >= 1 || !((a.clusterSize || 1) >= 2 || a.breaking)) { overflow.push(a.key); continue; }
      ng++;
    }
    out.push(a.key);
  }
  // never leave Top Stories short: top up from the rejected pool (keeps 6 filled on thin data).
  for (const k of overflow) { if (out.length >= max) break; out.push(k); }
  return out;
}

// Z1: ONE "Top stories" list, built only from existing parts — rankHomeTop (cluster size then
// recency, <=1 non-general and only when well-covered or breaking), capByPublisher (<=2 per
// publisher), isPromoItem/isSatire filtering, and breaking dedupe via sameStory. Returns up to
// `max` ARTICLE objects (phone shows 5 + Show-all, desktop main 1-6 + rail continuation 7-11).
// This is the SINGLE cross-category ranked list that replaces the old phone round-robin AND the
// phone State-of-Play card (the double dip): both drew from the same pool under two names.
//   general : general-category stories (already loaded)
//   allCats : the whole cross-category pool (for the <=1 well-covered non-general slot)
//   breaking: the breaking items to dedupe against (a breaking story never repeats in the list)
//   minOutlets: the non-general eligibility threshold (Z2 raises it to 3)
export function selectTopStories({ general = [], allCats = [], breaking = [], max = 6, minOutlets = 2 } = {}) {
  const clean = arr => (arr || []).filter(a => a && a.title && a.link && !isPromoItem(a) && !isSatire(a));
  // A TITLE key (matching the app's storyKey) collapses multi-outlet variants of ONE story to a
  // single row and guarantees the breaking↔Top-stories dedup holds even when the breaking item and
  // the pool item are clustered differently (sameStory can miss across _clusterMembers).
  const titleKey = a => ((a.title || '').slice(0, 60).toLowerCase().replace(/\s+/g, ''));
  const brk = clean(breaking); // the FULL exclude set (lead + breaking rows) — never sliced
  const brkKeys = new Set(brk.map(titleKey));
  const isBreaking = a => brkKeys.has(titleKey(a)) || brk.some(b => sameStory(a, b));
  // Pool = unique cross-category stories, MINUS anything that is already a breaking row (so the
  // breaking strip and the list never show the same story), keeping the first occurrence. GENERAL is
  // concatenated FIRST so that a story carried by both the general feed and a category feed is kept
  // under its general category — otherwise a cross-posted headline could be filed as e.g. "tech" and
  // dropped from the general-first list.
  const byKey = new Map();
  for (const a of clean(general).concat(clean(allCats))) {
    const k = titleKey(a);
    if (k && !byKey.has(k) && !isBreaking(a)) byKey.set(k, a);
  }
  const arts = [...byKey.values()];
  // POOL RULE (Z2): GENERAL FIRST, then at most ONE non-general story — and only when it is
  // well-covered (>= minOutlets outlets) or breaking. rankClusters ranks each pool by heat (cluster
  // size then recency) and caps <=2 per publisher, so general headlines are never buried under a
  // recent niche non-general item (the old bug: a global rank mixed them and the <=1 cap then
  // starved the list).
  const eligibleNonGeneral = a => ((a._clusterSize || 1) >= minOutlets) || isBreaking(a);
  const generalRanked = rankClusters(arts.filter(a => (a.cat || 'general') === 'general'), { max: 2 });
  const nonGeneralRanked = rankClusters(arts.filter(a => (a.cat || 'general') !== 'general' && eligibleNonGeneral(a)), { max: 2 });
  const out = generalRanked.slice(0, max);
  // Include the single best eligible non-general story: append it if there is room, otherwise it
  // takes the last slot — so the list is general-dominated with exactly <=1 cross-category row.
  if (nonGeneralRanked[0]) { if (out.length < max) out.push(nonGeneralRanked[0]); else out[max - 1] = nonGeneralRanked[0]; }
  return out.slice(0, max);
}
