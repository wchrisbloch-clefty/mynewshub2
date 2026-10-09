// ─── CONNECTIONS (G6) — cross-category bridge detector. PURE, AI-FREE, no network. ──
// A "connection" is a set of already-loaded stories that bridges >= 2 categories via
// >= 2 shared entities/keyword phrases, with >= 2 distinct outlets total. Single common
// words and generic terms never count (see CONNECTION_STOPLIST — the one editable list).
// Ranking is recency + outlet count only; breadth NEVER changes a trust tier.

// The ONE editable stoplist of generic phrases/tokens that must never act as a bridge.
export const CONNECTION_STOPLIST = new Set([
  'this week', 'last week', 'next week', 'this year', 'last year', 'new report', 'new study',
  'breaking news', 'top stories', 'read more', 'click here', 'first time', 'years ago',
  'new york times', 'associated press', 'getty images', 'the new', 'united states',
  'new data', 'new rules', 'white house press', 'press conference',
  // generic single tokens
  'news', 'report', 'update', 'market', 'markets', 'today', 'world', 'people', 'time',
  'year', 'week', 'day', 'story', 'video', 'photo', 'live', 'breaking', 'america',
]);

const norm = s => (s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

// Build the entity set for one article from: (1) known multi-word keyword phrases present,
// (2) distinctive single-word keywords present, (3) multi-word Capitalised phrases (orgs/
// places). Generic/stoplisted terms are dropped; bare generic single words never qualify.
export function articleEntities(a, { kwMulti, kwSingle }) {
  const text = `${a.title || ''}. ${a.desc || ''}`;
  const lower = ' ' + norm(text) + ' ';
  const ents = new Set();
  // (1) known multi-word phrases (literal)
  for (const kw of kwMulti) { if (lower.includes(' ' + kw + ' ') || lower.includes(' ' + kw + ',') || lower.includes(' ' + kw + '.')) ents.add(kw); }
  // (2) distinctive single-word keywords (literal word match)
  for (const kw of kwSingle) { const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); if (re.test(text)) ents.add(kw); }
  // (3) multi-word Capitalised phrases (proper nouns)
  const re2 = /\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)+)\b/g;
  let m;
  while ((m = re2.exec(text))) { const p = norm(m[1]); if (p && !CONNECTION_STOPLIST.has(p)) ents.add(p); }
  // drop anything stoplisted
  for (const e of [...ents]) if (CONNECTION_STOPLIST.has(e)) ents.delete(e);
  return ents;
}

// items: flat array of articles, each { title, desc, source, pubDate, cat, link, _clusterSize? }.
// kw: the DEFAULT_KW map (or any {cat:[phrases]}). Returns up to `max` connections.
export function findConnections(items, { kw = {}, max = 3, catLabel = (c) => c } = {}) {
  const flatKw = [...new Set(Object.values(kw).flat().map(norm).filter(Boolean))];
  const kwMulti = flatKw.filter(k => k.includes(' '));
  const kwSingle = flatKw.filter(k => !k.includes(' ') && k.length >= 2);

  const arts = (items || []).filter(a => a && a.link && a.cat).map(a => ({ ...a, _ents: articleEntities(a, { kwMulti, kwSingle }) }));

  // Index articles by each unordered entity PAIR that co-occurs in an article. A shared
  // pair across articles guarantees the >= 2 shared-entities rule by construction.
  const byPair = new Map();
  for (const a of arts) {
    const es = [...a._ents];
    for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
      const key = [es[i], es[j]].sort().join(' + ');
      if (!byPair.has(key)) byPair.set(key, []);
      byPair.get(key).push(a);
    }
  }

  const connections = [];
  const seen = new Set();
  for (const [pair, members] of byPair) {
    const cats = [...new Set(members.map(m => m.cat))];
    const outlets = [...new Set(members.map(m => m.source).filter(Boolean))];
    if (cats.length < 2) continue;          // (a) must bridge >= 2 categories
    if (outlets.length < 2) continue;       // (c) must have >= 2 distinct outlets
    // (b) >= 2 shared entities is guaranteed by the pair; collect any further common ones.
    const shared = pair.split(' + ');
    // dedup by member-set signature
    const sig = members.map(m => m.link).sort().join('|');
    if (seen.has(sig)) continue; seen.add(sig);
    const lead = members.slice().sort((x, y) => new Date(y.pubDate) - new Date(x.pubDate))[0];
    const catsByCount = cats.slice().sort((c1, c2) => members.filter(m => m.cat === c2).length - members.filter(m => m.cat === c1).length);
    connections.push({
      key: pair,
      bridge: `${catLabel(catsByCount[0])} ↔ ${catLabel(catsByCount[1])}`,
      categories: catsByCount,
      shared,                 // the shared entities (>= 2)
      outlets: outlets.length,
      members,
      lead,
      recency: new Date(lead.pubDate).getTime() || 0,
    });
  }

  // Rank by recency then outlet count. Drop connections fully subsumed by a kept one.
  connections.sort((a, b) => (b.recency - a.recency) || (b.outlets - a.outlets));
  const kept = [];
  for (const c of connections) {
    const cLinks = new Set(c.members.map(m => m.link));
    const subsumed = kept.some(k => { const kl = new Set(k.members.map(m => m.link)); return [...cLinks].every(x => kl.has(x)); });
    if (!subsumed) kept.push(c);
    if (kept.length >= max) break;
  }
  return kept;
}
