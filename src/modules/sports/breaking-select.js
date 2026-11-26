// AF4.2: "Breaking in sports" selector (pure, unit-tested). A story qualifies only when >=3 DISTINCT
// real outlets (core or specialist; fan/alt are NEVER counted, so a pile of hot-take blogs can't
// trigger it) carry it within 2h AND at least ONE of them is a core outlet. Followed teams get a +1
// followBoost so a story about the reader's team sorts above an equally-covered one.
import { rankOf } from '../ranking/rank.js';
import { isPromoItem } from '../breaking/index.js';

export function selectSportsBreaking(items, { favMatches = [], storyKey, now = Date.now(), max = 3 } = {}) {
  const key = storyKey || (a => (a.title || '').slice(0, 60).toLowerCase().replace(/\s+/g, ''));
  const groups = new Map();
  for (const a of items || []) {
    if (!a || !a.title || isPromoItem(a)) continue;
    if ((now - new Date(a.pubDate)) / 3_600_000 > 2) continue; // within 2h
    const r = rankOf(a.source);
    if (r === 'fan' || r === 'alt') continue; // fan/alt NEVER count toward breaking
    const k = key(a);
    let g = groups.get(k);
    if (!g) { g = { rep: a, sources: new Set(), hasCore: false }; groups.set(k, g); }
    if (a.source) g.sources.add(a.source);
    if (r === 'core') g.hasCore = true;
    if (!g.rep.img && a.img) g.rep = a; // prefer an imaged representative
  }
  const out = [];
  for (const g of groups.values()) {
    if (g.sources.size >= 3 && g.hasCore) {
      const t = (g.rep.title + ' ' + (g.rep.desc || '')).toLowerCase();
      const fav = favMatches.some(m => m && t.includes(m)) ? 1 : 0;
      out.push({ ...g.rep, _outlets: g.sources.size, _fav: fav });
    }
  }
  out.sort((a, b) => (b._fav - a._fav) || (b._outlets - a._outlets) || (new Date(b.pubDate) - new Date(a.pubDate)));
  return out.slice(0, max);
}
