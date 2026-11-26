// AH3.1: canonical `sub` keys, normalized at the single point where feeds are read into a chip. Feeds
// drifted between two spellings for the Tech "Stay current" lane (`stay-current` and `staycurrent`),
// so half the feeds never reached the chip. `normalizeSub` accepts the old spelling as an alias.
const SUB_ALIASES = {
  'stay-current': 'staycurrent',
  // energy keys are already consistent (upstream/midstream/downstream/power/datacenter/clean/policy);
  // add any future drift here so there is ONE canonical key per lane.
};

export function normalizeSub(sub) {
  const s = String(sub || '').trim().toLowerCase();
  return SUB_ALIASES[s] || s;
}

// All source NAMES in a feed list whose (normalized) sub matches `key`.
export function sourcesForSub(feeds, key) {
  const want = normalizeSub(key);
  return new Set((feeds || []).filter(f => f && normalizeSub(f.sub) === want).map(f => f.name));
}
