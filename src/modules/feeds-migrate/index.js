// AA5.1: ONE-TIME feed reconcile. Feeds persist in localStorage, so Z2's per-feed re-tag only reached
// fresh browsers. This versioned migration moves ONLY the four Z2 feeds in a SAVED config, preserving
// each feed's `on` flag, its position, custom feeds and every other user edit. Runs once per device
// (the host guards on FEEDS_MIG_V), is idempotent, and never touches a feed the user moved back.
export const FEEDS_MIG_V = 5; // AG2.2: bumped so devices pick up ESPN + NBC Sports feeds.
// (prev) AF5: bumped so devices at v3 pick up the AF5 feed additions (AI
// stay-current + energy trade depth). migrateFeedsAE is add-only/idempotent, so re-running it only
// appends the new `_ae` feeds; the v3 additions are already present and skipped by url/name.

// AF1: the seven energy/data-center duplicates removed from `business` (they stay in `bloom`; MIT
// Tech Review moves to tech-only). Removed ONLY when the saved `business` list is still pristine —
// the pre-AE 13-feed default, all enabled, no custom or removed feed — so any user edit leaves it
// untouched. "Pristine" is checked cheaply: 13 enabled non-custom feeds that still include all seven.
const BUSINESS_DUP_REMOVE = new Set(['Oilprice.com','Utility Dive','Data Center Dynamics',
  'Power Magazine','Rigzone','MIT Tech Review','Canary Media']);

function businessUnedited(list) {
  if (!Array.isArray(list) || list.length !== 13) return false;
  if (!list.every(f => f && f.on === true && !f.custom)) return false;
  return [...BUSINESS_DUP_REMOVE].every(n => list.some(f => f.name === n));
}

/**
 * AF1: add-only / idempotent AE migration. For a SAVED feed config:
 *   • ADD every `_ae:true` default feed (carrying sub/_alt/tier/on) not already present by url OR
 *     name — so a feed the user removed is NEVER re-added, and re-running adds nothing.
 *   • REMOVE the seven business/bloom duplicates from `business` only if that list is pristine.
 *   • KHOU/Chron are ranked `local` by name (rankOf) at runtime — no redundant saved tag.
 * Never touches toggles, custom feeds, order, or tombstoned feeds. Returns { feeds, added, changed }.
 */
export function migrateFeedsAE(saved, defaults) {
  if (!saved || typeof saved !== 'object' || !defaults || typeof defaults !== 'object') {
    return { feeds: saved, added: 0, changed: false };
  }
  const next = JSON.parse(JSON.stringify(saved));
  let added = 0;
  for (const cat of Object.keys(defaults)) {
    const aeFeeds = (defaults[cat] || []).filter(f => f && f._ae);
    if (!aeFeeds.length) continue;
    if (!Array.isArray(next[cat])) next[cat] = [];
    const haveUrl = new Set(next[cat].map(f => f && f.url));
    const haveName = new Set(next[cat].map(f => f && f.name));
    for (const f of aeFeeds) {
      if (haveUrl.has(f.url) || haveName.has(f.name)) continue; // never re-add a removed/known feed
      next[cat].push(JSON.parse(JSON.stringify(f)));
      haveUrl.add(f.url); haveName.add(f.name);
      added++;
    }
  }
  if (businessUnedited(saved.business)) {
    next.business = (next.business || []).filter(f => !(f && BUSINESS_DUP_REMOVE.has(f.name)));
  }
  return { feeds: next, added, changed: added > 0 };
}

export const FEEDS_Z2_MOVES = [
  { name: 'TechCrunch', from: 'general', to: 'tech' },
  { name: 'CNBC Top News', from: 'general', to: 'business' },
  { name: 'Morning Brew', from: 'general', to: 'business' },
  { name: 'Bloomberg', from: 'general', to: 'finance' },
];

// Returns { feeds, changed }. Matching is by exact feed name. A feed only moves when it is still in
// its `from` category (so a user who moved it elsewhere, or removed it, is left alone); its object
// (on/url/tier/custom flags) is carried over unchanged, and the target dedupes by name.
export function migrateFeedsZ2(saved, moves = FEEDS_Z2_MOVES) {
  if (!saved || typeof saved !== 'object') return { feeds: saved, changed: false };
  const next = JSON.parse(JSON.stringify(saved));
  let changed = false;
  for (const mv of moves) {
    const src = next[mv.from];
    if (!Array.isArray(src)) continue;
    const i = src.findIndex(f => f && f.name === mv.name);
    if (i < 0) continue;
    const [feed] = src.splice(i, 1);
    if (!Array.isArray(next[mv.to])) next[mv.to] = [];
    if (!next[mv.to].some(f => f && f.name === mv.name)) next[mv.to].push(feed);
    changed = true;
  }
  return { feeds: next, changed };
}
