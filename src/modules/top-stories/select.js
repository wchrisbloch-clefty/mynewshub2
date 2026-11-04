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
