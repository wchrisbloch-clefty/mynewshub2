// src/modules/ranking — AE2 importance ranking (Top now / Latest), AE1 source ranks.
export { RANK_BY_NAME, RANKS, rankOf, isCore, isFan, isAlt, isLocal } from './rank.js';
export { HALF_LIFE, recencyDecay, clusterMembers, coverageOf, scoreStory, defaultEligible, splitTopNowLatest, legacyOrder } from './score.js';

// Ranking mode from the URL (?rank=legacy) or a stored flag. v2 is the default.
export function rankMode(search, stored) {
  try {
    const q = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : '')).get('rank');
    if (q === 'legacy' || q === 'v2') return q === 'legacy' ? 'legacy' : 'v2';
  } catch { /* ignore */ }
  return stored === 'legacy' ? 'legacy' : 'v2';
}
