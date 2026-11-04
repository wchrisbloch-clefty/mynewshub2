// S3: source-label normalizer. A few feeds (and web-discovery results) hand us a raw hostname
// like "www.chemengonline.com" instead of a brand name, which then renders as an ugly ALL-CAPS
// host. This turns a hostname into a readable name; anything that already looks like a brand name
// (has spaces, or isn't a bare host) passes through untouched. Pure, no deps — shared by State of
// Play (S3) and the topic/meta line (S13) so both read identically.
const KNOWN = {
  // exact lowercased-host → preferred display casing (extend as real feeds surface)
  chemengonline: 'ChemEngOnline', cnbc: 'CNBC', bbc: 'BBC', npr: 'NPR', espn: 'ESPN',
  wsj: 'WSJ', apnews: 'AP', foxnews: 'Fox News', nbcnews: 'NBC News',
  cbsnews: 'CBS News', abcnews: 'ABC News', theverge: 'The Verge', techcrunch: 'TechCrunch',
  marketwatch: 'MarketWatch', politico: 'Politico', axios: 'Axios', reuters: 'Reuters',
};
export function cleanSourceName(raw) {
  if (!raw) return raw;
  const s = String(raw).trim();
  // a bare hostname: letters/digits/dots/hyphens ending in a TLD, no spaces.
  if (!/\s/.test(s) && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) {
    const host = s.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '')
      .replace(/\.(com|net|org|co|io|us|gov|edu|news|online|co\.uk|org\.uk)$/,'');
    const base = host.split('.')[0];
    if (KNOWN[base]) return KNOWN[base];
    // Title-case the single label (best generic when no brand map entry exists).
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : s;
  }
  return s;
}
