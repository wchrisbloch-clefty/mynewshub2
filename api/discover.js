// /api/discover.js — coverage-gap discovery.
//
// Runs a SECOND, wider scan independent of the reader's followed sources, so a big
// story can surface even when none of their configured feeds carried it. Keyed off
// the category's topic keywords (passed from App.jsx). Discovery feeds: Google News
// topic search (aggregates many outlets, each item carries its <source>), Hacker News
// (Algolia) for tech, and Reddit search RSS. Returns only stories that (a) multiple
// discovery outlets cover AND (b) none of the reader's own sources touched. Every
// returned item is capped at 'reported' tier — found via a wide net, not the reader's
// curated primaries. Standalone file; does not touch other /api functions.

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !req.body.on) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return new Promise(resolve => {
    let d = '';
    req.on('data', c => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const decode = s => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .trim();

const STOP = new Set('the a an of to in on for and or but with from as at by is are was were be been has have had will would this that these those it its他 he she they we you i new news says say after over into more amid'.split(' '));
function tokens(title) {
  return (title.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(w => !STOP.has(w));
}
function titleKey(title) {
  return tokens(title).slice(0, 6).sort().join(' ');
}
function similar(aTokens, bTokens) {
  const b = new Set(bTokens);
  const shared = aTokens.filter(t => b.has(t)).length;
  return shared >= 3; // ≥3 shared meaningful tokens ≈ same story
}

// Parse a Google-News-style RSS: each <item> has <title>, <link>, <source>.
function parseGoogleNews(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 40) {
    const block = m[1];
    const title = decode((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const link = decode((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '');
    const source = decode((block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '');
    if (title && link) items.push({ title: title.replace(/ - [^-]*$/, '').trim(), link, source: source || 'Web' });
  }
  return items;
}

async function fetchFeed(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyNewsHub/1.0)' }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return [];
    return parseGoogleNews(await r.text());
  } catch { return []; }
}

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function isFollowed(source, followedNorm) {
  const s = norm(source);
  if (!s) return false;
  return followedNorm.some(f => f && (f.includes(s) || s.includes(f)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body;
  try { body = await readBody(req); } catch { return res.status(400).json({ error: 'Bad body' }); }
  const keywords = (Array.isArray(body.keywords) ? body.keywords : []).filter(Boolean).slice(0, 4);
  const followedNorm = (Array.isArray(body.followedSources) ? body.followedSources : []).map(norm).filter(Boolean);
  const category = String(body.category || 'general');
  if (!keywords.length) return res.status(200).json({ items: [] });

  // Build discovery feed URLs (Google News topic search per keyword; HN for tech).
  const urls = keywords.map(k => `https://news.google.com/rss/search?q=${encodeURIComponent(k)}&hl=en-US&gl=US&ceid=US:en`);
  if (category === 'tech') urls.push('https://hnrss.org/newest?points=100');

  const results = await Promise.all(urls.map(fetchFeed));
  const all = results.flat();
  if (!all.length) return res.status(200).json({ items: [] });

  // Cluster near-duplicate titles across outlets.
  const clusters = [];
  for (const it of all) {
    const tk = tokens(it.title);
    if (tk.length < 3) continue;
    let placed = false;
    for (const c of clusters) {
      if (similar(tk, c.tokens)) { c.items.push(it); c.sources.add(norm(it.source)); placed = true; break; }
    }
    if (!placed) clusters.push({ key: titleKey(it.title), tokens: tk, items: [it], sources: new Set([norm(it.source)]) });
  }

  // A gap = covered by ≥2 distinct discovery outlets AND none of the reader's sources.
  const gaps = clusters
    .filter(c => c.sources.size >= 2)
    .filter(c => !c.items.some(it => isFollowed(it.source, followedNorm)))
    .map(c => {
      const lead = c.items[0];
      const outlets = [...new Set(c.items.map(it => it.source).filter(Boolean))];
      return {
        title: lead.title,
        link: lead.link,
        source: lead.source,
        outlets: outlets.slice(0, 5),
        outletCount: c.sources.size,
        tier: 'reported', // capped — found via a wide net, never 'verified'
      };
    })
    .sort((a, b) => b.outletCount - a.outletCount)
    .slice(0, 6);

  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  return res.status(200).json({ items: gaps });
}
