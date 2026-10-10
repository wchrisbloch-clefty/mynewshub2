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

import { isSatire } from '../satire/index.js';

const norm = s => (s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

// K5: collapse entity ALIASES to one canonical form BEFORE the >=2-shared-entities rule,
// so "president trump" and "trump" are ONE entity (not two) and can't fake a bridge.
// Strip a leading honorific/title, then — for a 2-word "First Last" — key on the last name
// (surname), which is how the same person is referred to across outlets. Single tokens and
// multi-word org/place names are left as-is.
const TITLE_PREFIX = /^(president|vice president|vp|senator|sen|representative|rep|congress(man|woman)|governor|gov|mayor|secretary|sec|attorney general|justice|judge|chief|ceo|cfo|coach|dr|mr|mrs|ms|prof|professor|former|ex|prime minister|pm|king|queen|pope|chairman|chairwoman|chair)\s+/;
const SURNAME_STOP = new Set(['white house','new york','los angeles','san francisco','united states','wall street','supreme court','world cup','super bowl']);
export function canonEntity(e) {
  let s = norm(e);
  if (SURNAME_STOP.has(s)) return s;
  const stripped = s.replace(TITLE_PREFIX, '');
  const words = stripped.split(' ').filter(Boolean);
  // "First Last" person name -> surname (shared across "trump" / "president trump" / "donald trump")
  if (words.length === 2 && /^[a-z]+$/.test(words[0]) && /^[a-z]+$/.test(words[1])) return words[1];
  return stripped || s;
}

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
  // K5: canonicalize so aliases collapse to ONE entity, both within and across articles.
  // Known keyword phrases (kwMulti, e.g. "data center") are protected and never collapsed;
  // only free proper-noun names are reduced (president trump / donald trump / trump -> trump).
  const kwSet = new Set(kwMulti);
  const canonOf = e => kwSet.has(e) ? e : canonEntity(e);
  const out = new Set();
  for (const e of ents) { const c = canonOf(e); if (c && !CONNECTION_STOPLIST.has(c)) out.add(c); }
  return out;
}

// items: flat array of articles, each { title, desc, source, pubDate, cat, link, _clusterSize? }.
// kw: the DEFAULT_KW map (or any {cat:[phrases]}). Returns up to `max` connections.
export function findConnections(items, { kw = {}, max = 3, catLabel = (c) => c } = {}) {
  const flatKw = [...new Set(Object.values(kw).flat().map(norm).filter(Boolean))];
  const kwMulti = flatKw.filter(k => k.includes(' '));
  const kwSingle = flatKw.filter(k => !k.includes(' ') && k.length >= 2);

  // Satire (The Onion, Babylon Bee, …) never bridges — excluded by rule (I0.8).
  const arts = (items || []).filter(a => a && a.link && a.cat && !isSatire(a)).map(a => ({ ...a, _ents: articleEntities(a, { kwMulti, kwSingle }) }));

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

  // Rank by recency then outlet count, then keep greedily so EACH story appears in at
  // most ONE bridge (I0.8). When a higher-ranked bridge already claimed some of a
  // connection's members, strip those and re-validate: the trimmed bridge must still span
  // >=2 categories AND >=2 outlets AND keep the shared entity pair present in >=2 members.
  // This prevents one story fanning out across several overlapping bridges.
  connections.sort((a, b) => (b.recency - a.recency) || (b.outlets - a.outlets));
  const kept = [];
  const usedLinks = new Set();
  for (const c of connections) {
    const freeMembers = c.members.filter(m => !usedLinks.has(m.link));
    const cats = [...new Set(freeMembers.map(m => m.cat))];
    const outlets = [...new Set(freeMembers.map(m => m.source).filter(Boolean))];
    if (freeMembers.length < 2 || cats.length < 2 || outlets.length < 2) continue;
    const lead = freeMembers.slice().sort((x, y) => new Date(y.pubDate) - new Date(x.pubDate))[0];
    const catsByCount = cats.slice().sort((c1, c2) => freeMembers.filter(m => m.cat === c2).length - freeMembers.filter(m => m.cat === c1).length);
    kept.push({
      ...c,
      bridge: `${catLabel(catsByCount[0])} ↔ ${catLabel(catsByCount[1])}`,
      categories: catsByCount,
      outlets: outlets.length,
      members: freeMembers,
      lead,
      recency: new Date(lead.pubDate).getTime() || 0,
    });
    for (const m of freeMembers) usedLinks.add(m.link);
    if (kept.length >= max) break;
  }
  return kept;
}
