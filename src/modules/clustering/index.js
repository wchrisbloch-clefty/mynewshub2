// ─── CLUSTERING / DEDUP ENGINE ────────────────────────────────────────────────
// Pure functions. No UI, no framework, no app state. Groups articles that cover
// the same story (title bigram Jaccard within a time window), scores them by
// "heat" (coverage breadth + freshness), and extracts trending topic labels.
//
// Public interface:
//   clusterStories(articles)              -> articles[] annotated with _clusterSize + _clusterSources
//   heatScore(article)                    -> number (clusterSize*12 + recency 0..48)
//   rankClusters(items, {max?,limit?})    -> items sorted by heat, capped ≤max per publisher
//   capByPublisher(items, max?)           -> items with ≤max per publisher (order preserved)
//   hotClusterTopics(items, n?)           -> topic labels ranked by entity frequency×heat
//   decodeEntities(str)                   -> HTML-entity-decoded string
//   TREND_STOP                            -> Set<string> shared stopwords
//
// Input article shape (only these fields are read): { title, source, pubDate }.
// clusterStories preserves every other field via spread.

import { tierRankOf } from '../../../lib/provenance.js';

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

// Tier trust ranking — higher wins. Used so a cluster's representative (which carries
// the "_clusterSize / N sources" credibility signal) is always the HIGHEST-tier member,
// never merely the first one seen. Prevents an inferred item from inheriting a
// multi-source credibility badge from higher-tier coverage it was clustered with.
// The rank table is the shared one in /lib/provenance.js (single source of truth); an
// untagged article keeps its historical default of 2 ('reported').
function tierRank(a) { return tierRankOf(a && (a._tier || a.tier), 2); }

// Groups articles covering the same story. Bigram Jaccard on titles (>=0.28)
// within a 6-hour window. Returns one representative per cluster — the highest-tier
// member (ties keep the first seen, which is also the most recent when input is sorted
// newest-first) — annotated with _clusterSize and up to 5 _clusterSources.
// Title → set of word bigrams (words >2 chars, punctuation stripped). Module-level so
// the same similarity primitive powers clusterStories AND the cross-list sameStory test.
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

export function clusterStories(articles) {
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
    // Representative = highest-tier member (provenance guard). Tie → first seen (a),
    // preserving recency ordering. The credibility signal (_clusterSize) then attaches
    // to the most trustworthy headline in the cluster, not whichever arrived first.
    let rep = a, repRank = tierRank(a);
    for (const m of cluster) { const rk = tierRank(m); if (rk > repRank) { rep = m; repRank = rk; } }
    result.push({
      ...rep,
      _clusterSize: cluster.length,
      _clusterSources: [...clusterSources].slice(0, 5),
      _clusterMembers: cluster, // every article in the cluster — powers Full Coverage
    });
  }
  return result;
}

// Decode HTML entities (numeric + named) so titles/topics never render raw
// &#8217; / &quot; / &#8230; etc. Safe on already-decoded strings.
function decodeEntitiesOnce(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; } })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, '‘').replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // amp last within a pass
}
// Iterate so DOUBLE-encoded entities (`&amp;#8217;`) decode fully instead of
// stalling at `&#8217;`. Safe on already-decoded strings (loop exits when stable).
export function decodeEntities(str = '') {
  if (!str) return str;
  let out = String(str), prev;
  for (let i = 0; i < 3 && out !== prev; i++) { prev = out; out = decodeEntitiesOnce(out); }
  return out;
}

// Cap how many items any single publisher contributes to a ranked list (prevents a
// single-source flood, e.g. 7 of 8 from one outlet). Preserves input order.
export function capByPublisher(items, max = 2) {
  const counts = new Map(), out = [];
  for (const a of items || []) {
    const p = (a.source || '').toLowerCase();
    const c = counts.get(p) || 0;
    if (c >= max) continue;
    counts.set(p, c + 1);
    out.push(a);
  }
  return out;
}

// Cluster identity for a headline: decode entities, strip punctuation, keep the first
// 10 words. Two headlines that normalize to the same key are the same story even when
// title-bigram clustering missed them (e.g. one source encoded its entities, another
// didn't). This is the de-facto cluster id used to dedupe any ranked list — within one
// list (rankClusters) AND across lists (e.g. State of Play's Breaking rows vs its
// numbered rows, so a breaking story never repeats below — I0.7).
export function clusterKey(title) {
  return decodeEntities(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 10).join(' ');
}

// Are two articles the same story (same cluster)? True when they are the same link, a
// member of each other's cluster (_clusterMembers), share a clusterKey, or their titles
// pass the same bigram-Jaccard threshold clusterStories uses (>=0.28). This is the
// cross-list cluster-identity test — e.g. to stop a Breaking story repeating in State of
// Play's numbered rows even when the two headlines are only near-identical (I0.7).
export function sameStory(a, b) {
  if (!a || !b) return false;
  if (a.link && b.link && a.link === b.link) return true;
  const inMembers = (x, y) => Array.isArray(x._clusterMembers) && x._clusterMembers.some(m => m && m.link && m.link === y.link);
  if (inMembers(a, b) || inMembers(b, a)) return true;
  const ka = clusterKey(a.title), kb = clusterKey(b.title);
  if (ka && ka === kb) return true;
  return jaccard(bigrams(a.title), bigrams(b.title)) >= 0.28;
}

// Rank clusters by heat, then apply the per-publisher cap. This is the correct
// primitive for any "ranked list" (Trending, State of Play, Top Stories).
export function rankClusters(items, { max = 2, limit } = {}) {
  const ranked = [...(items || [])].sort((a, b) => heatScore(b) - heatScore(a));
  // Drop near-identical headlines that title-bigram clustering missed (the
  // duplicate-in-State-of-Play bug), keyed by the shared clusterKey normalization.
  const seen = new Set(), deduped = [];
  for (const a of ranked) {
    const key = clusterKey(a.title);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    deduped.push(a);
  }
  const capped = capByPublisher(deduped, max);
  return limit ? capped.slice(0, limit) : capped;
}

// Pull candidate entities from a headline: multi-word Capitalized proper-noun
// phrases (e.g. "Graham Platner", "Jim Cramer") plus long salient words. Used only
// for trending — never derived from word POSITION.
function extractEntities(title) {
  const clean = decodeEntities(title || '');
  const out = [];
  const phraseRe = /([A-Z][a-zA-Z0-9.&]+(?:\s+(?:of|the|and|for|&)\s+|\s+)?(?:[A-Z][a-zA-Z0-9.&]+)?(?:\s+[A-Z][a-zA-Z0-9.&]+)*)/g;
  let m;
  while ((m = phraseRe.exec(clean))) {
    const phrase = m[1].trim().replace(/\s+/g, ' ');
    const words = phrase.split(' ').filter(Boolean);
    if (words.length >= 2) out.push(phrase);
    else if (phrase.length > 3 && !TREND_STOP.has(phrase.toLowerCase())) out.push(phrase);
  }
  for (const w of clean.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
    if (w.length > 6 && !TREND_STOP.has(w)) out.push(w);
  }
  return [...new Set(out)];
}

// Trending topics ranked by REAL cluster heat: entity/topic frequency across the
// clusters, weighted by each cluster's source-count + recency. Case-normalized and
// overlap-merged ("houston"+"houston texans" -> one; "platner"+"graham platner" -> one).
export function hotClusterTopics(items, n = 5) {
  const stats = new Map(); // lowercaseKey -> { label, weight, count }
  for (const a of items || []) {
    const w = heatScore(a); // source breadth + recency already baked in
    for (const ent of extractEntities(a.title)) {
      const key = ent.toLowerCase();
      const cur = stats.get(key) || { label: ent, weight: 0, count: 0 };
      if (ent.length > cur.label.length) cur.label = ent; // keep most specific surface form
      cur.weight += w; cur.count += 1;
      stats.set(key, cur);
    }
  }
  // Merge overlapping entities: fold a shorter key into a longer one that contains
  // it as a whole word (case-insensitive).
  const keys = [...stats.keys()].sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (!stats.has(k)) continue;
    for (const k2 of keys) {
      if (k2 === k || !stats.has(k2) || k2.length >= k.length) continue;
      const re = new RegExp(`\\b${k2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(k)) {
        const a = stats.get(k), b = stats.get(k2);
        a.weight += b.weight; a.count += b.count;
        stats.delete(k2);
      }
    }
  }
  return [...stats.values()]
    .filter(s => s.count >= 2 || s.weight >= 24) // must recur or be genuinely hot
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n)
    .map(s => s.label);
}
