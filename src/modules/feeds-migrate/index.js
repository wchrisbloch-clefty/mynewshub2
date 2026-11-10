// AA5.1: ONE-TIME feed reconcile. Feeds persist in localStorage, so Z2's per-feed re-tag only reached
// fresh browsers. This versioned migration moves ONLY the four Z2 feeds in a SAVED config, preserving
// each feed's `on` flag, its position, custom feeds and every other user edit. Runs once per device
// (the host guards on FEEDS_MIG_V), is idempotent, and never touches a feed the user moved back.
export const FEEDS_MIG_V = 2;
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
