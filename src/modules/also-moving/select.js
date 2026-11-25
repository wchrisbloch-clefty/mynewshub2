// AG3: "Also moving" — behind-the-scenes stories that did NOT make Top now or any outlet's glance
// lead, but are relevant. Pure + unit-tested. Labelled inferred; never raises a tier. Each row gets a
// neutral "why" chip. A fan/alt/local-ONLY story needs >=2 DISTINCT ranks to qualify on coverage (so
// a lone fan blog or a single alt post can't surface). Max 2 per publisher.
import { rankOf } from '../ranking/rank.js';

const LOW = new Set(['fan', 'alt', 'local']);

// pool: candidate articles (already cluster-annotated + promo-filtered + NOT already shown elsewhere).
// opts: { excludeKeys:Set, storyKey, kwMatch, cat, followedTeams:[], trendingHas, voiceFlag, max=5 }
//   kwMatch(a,cat) → array of matched keywords; trendingHas(a) → bool; voiceFlag(a) → {name,ago}|null.
// trendingHas (AG4) and voiceFlag (AG5) are optional and wired in by those items.
export function selectAlsoMoving(pool, opts = {}) {
  const { excludeKeys = new Set(), storyKey, kwMatch, cat, followedTeams = [], trendingHas, voiceFlag, max = 5 } = opts;
  const key = storyKey || (a => (a.title || '').slice(0, 60).toLowerCase().replace(/\s+/g, ''));
  const out = [];
  const pubCount = {};
  for (const a of pool || []) {
    if (!a || !a.title || !a.link || excludeKeys.has(key(a))) continue;
    const pub = (a.source || '').toLowerCase();
    if ((pubCount[pub] || 0) >= 2) continue;

    const size = a._clusterSize || 1;
    const vf = voiceFlag && voiceFlag(a);
    const kwHits = kwMatch ? (kwMatch(a, cat) || []) : [];
    const teamHit = followedTeams.find(t => t && (a.title + ' ' + (a.desc || '')).toLowerCase().includes(String(t).toLowerCase()));
    let why = '';
    if (size >= 2) {
      // (a) multi-outlet coverage — but a fan/alt/local-only cluster needs >=2 distinct ranks.
      if (LOW.has(rankOf(a.source))) {
        const ranks = new Set((a._clusterSources || [a.source]).map(rankOf));
        if (ranks.size < 2) continue;
      }
      why = `${size} outlets`;
    } else if (vf) why = `${vf.name}${vf.ago ? ' · ' + vf.ago : ''} ↗`;
    else if (trendingHas && trendingHas(a)) why = 'Trending';
    else if (kwHits.length) why = `Your keyword: ${kwHits[0]}`;
    else if (teamHit) why = `Your team: ${teamHit}`;
    else continue;

    pubCount[pub] = (pubCount[pub] || 0) + 1;
    out.push({ item: a, why });
    if (out.length >= max) break;
  }
  return out;
}
