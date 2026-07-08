// ─── CLUSTERING / DEDUP ENGINE ────────────────────────────────────────────────
// Pure functions. No UI, no framework, no app state. Groups articles that cover
// the same story (title bigram Jaccard within a time window), scores them by
// "heat" (coverage breadth + freshness), and extracts trending topic labels.
//
// Public interface:
//   clusterStories(articles)        -> articles[] each annotated with _clusterSize + _clusterSources
//   heatScore(article)              -> number (higher = hotter): clusterSize*12 + recency(0..48)
//   hotClusterTopics(items, n?)     -> string[] of salient topic labels, hottest first
//   TREND_STOP                      -> Set<string> shared stopwords
//
// Input article shape (only these fields are read): { title, source, pubDate }.
// clusterStories preserves every other field via spread.

export const TREND_STOP = new Set([
  'the','and','for','that','with','this','from','have','will','are','was','were',
  'been','about','into','than','they','their','what','when','where','which','who',
  'said','says','after','before','would','could','should','there','these','those',
  'report','update','first','last','more','also','just','news','new','amid',
]);

// Heat = coverage breadth (how many sources) × 12 + recency points (0–48, one per
// hour under 48h old). Stories with no/invalid date are treated as stale.
export function heatScore(a) {
  const ageH = a.pubDate ? (Date.now() - new Date(a.pubDate)) / 3600000 : 999;
  return (a._clusterSize || 1) * 12 + Math.max(0, 48 - ageH);
}

// Groups articles covering the same story. Bigram Jaccard on titles (>=0.28)
// within a 6-hour window. Returns one representative per cluster (the first seen),
// annotated with _clusterSize and up to 5 _clusterSources.
export function clusterStories(articles) {
  function bigrams(str) {
    const words = (str || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2);
    const bg = new Set();
    for (let i = 0; i < words.length - 1; i++) bg.add(words[i] + '_' + words[i + 1]);
    return bg;
  }
  function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const k of a) if (b.has(k)) inter++;
    return inter / (a.size + b.size - inter);
  }

  const sixHoursMs = 6 * 60 * 60 * 1000;
  const clustered = new Set();
  const result = [];

  for (let i = 0; i < articles.length; i++) {
    if (clustered.has(i)) continue;
    const a = articles[i];
    const bgA = bigrams(a.title);
    const cluster = [a];
    const clusterSources = new Set([a.source]);

    for (let j = i + 1; j < articles.length; j++) {
      if (clustered.has(j)) continue;
      const b = articles[j];
      const timeDiff = Math.abs(new Date(a.pubDate) - new Date(b.pubDate));
      if (timeDiff > sixHoursMs) continue;
      if (jaccard(bgA, bigrams(b.title)) >= 0.28) {
        clustered.add(j);
        cluster.push(b);
        clusterSources.add(b.source);
      }
    }

    clustered.add(i);
    result.push({
      ...a,
      _clusterSize: cluster.length,
      _clusterSources: [...clusterSources].slice(0, 5),
    });
  }
  return result;
}

// Derives up to n trending topic labels from the hottest clusters. Each label is a
// salient token from a hot cluster's title (a capitalized proper noun preferred,
// else the longest meaningful word), de-duplicated. Works on any clustered list.
export function hotClusterTopics(items, n = 5) {
  const scored = [...(items || [])].map(a => ({ a, heat: heatScore(a) })).sort((x, y) => y.heat - x.heat);
  const seen = new Set(), out = [];
  for (const { a } of scored) {
    const tokens = (a.title || '').split(/\s+/).map(w => w.replace(/[^A-Za-z0-9]/g, ''));
    let label = tokens.find(w => w.length > 3 && /^[A-Z]/.test(w) && !TREND_STOP.has(w.toLowerCase()));
    if (!label) label = tokens.filter(w => w.length > 4 && !TREND_STOP.has(w.toLowerCase())).sort((x, y) => y.length - x.length)[0];
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key); out.push(label);
    if (out.length >= n) break;
  }
  return out;
}
