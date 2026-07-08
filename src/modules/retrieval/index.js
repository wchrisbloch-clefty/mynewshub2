// ─── QUERY-AWARE RETRIEVAL ────────────────────────────────────────────────────
// Given a natural-language question + the app's per-category article arrays,
// classify intent, select the relevant clustered items, and return structured,
// model-ready context. Zero coupling to any UI. The only app-specific concept —
// resolving an entity to an in-app deep link — is INJECTED via opts.resolveDeepLink,
// so the module itself knows nothing about NewsHub routing or team lists.
//
// Public interface:
//   retrieveFeedContext(question, arts, opts?)
//     opts.resolveDeepLink?({ entities, category }) -> string | null
//     -> { intent, category, entities?, topics?, clusters[], deepLink }
//   buildFeedContextBlock(ctx) -> string   (compact block to feed an LLM)
//
// `arts` is an object of { [category]: article[] }; each article: { title, source, pubDate, desc?, link? }.
// Depends only on the sibling clustering module.

import { clusterStories, hotClusterTopics, heatScore, TREND_STOP } from '../clustering';

export const RETRIEVAL_CATS = {
  finance:['finance','market','markets','stock','stocks','wall street','nasdaq','dow','s&p','crypto','bitcoin','earnings','fed','interest rate','rates','inflation','treasury'],
  bloom:['energy','power grid','grid','oil','gas','solar','wind','nuclear','utility','utilities','electricity','ercot','renewable','battery'],
  tech:['tech','technology','artificial intelligence','software','startup','chip','chips','semiconductor','nvidia','openai','gadget'],
  sports:['sport','sports','nfl','nba','mlb','ncaa','ncaaf','ncaab','football','basketball','baseball','college football','college basketball','golf','racing','playoff'],
  business:['business','economy','economic','company','companies','corporate','trade','tariff','merger','layoffs'],
  popculture:['pop culture','celebrity','movie','movies','music','tv show','entertainment','hollywood','box office'],
  comedy:['satire','onion','babylon bee'],
  general:['world','breaking','politics','election','headline'],
};
const Q_STOP = new Set(['what','whats','how','when','where','who','why','the','are','you','me','up','on','about','tell','give','latest','news','update','catch','today','now','going','with','into','and','for','any','all','get','show','anything','happening','trending','summary','recap','story','stories','this','that','from','was','were','has','have','can']);

export function detectRetrievalCategory(q) {
  const t = ' ' + (q || '').toLowerCase() + ' ';
  let best = null, bestHits = 0;
  for (const [cat, kws] of Object.entries(RETRIEVAL_CATS)) {
    const hits = kws.filter(k => t.includes(k)).length;
    if (hits > bestHits) { bestHits = hits; best = cat; }
  }
  return best;
}
export function detectRetrievalIntent(q) {
  const t = (q || '').toLowerCase();
  if (/how (are|is|'?s)? ?(the )?markets?|markets? (summary|recap|update|today|doing)|market (summary|recap|update)/.test(t)) return 'markets';
  if (/trending|what'?s hot|what'?s happening|top (stories|news)|what'?s new|biggest (stories|news)/.test(t)) return 'trending';
  if (/catch me up|latest on|update on|tell me about|what happened|going on with|what'?s the latest|recap of|fill me in/.test(t)) return 'entity';
  return 'general';
}
export function extractQueryKeywords(q) {
  return (q || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !Q_STOP.has(w));
}
function slimFeedItem(a) {
  const ageH = a.pubDate ? (Date.now() - new Date(a.pubDate)) / 3600000 : null;
  const ageLabel = ageH == null ? '' : ageH < 1 ? `${Math.max(1, Math.round(ageH * 60))}m ago` : ageH < 24 ? `${Math.round(ageH)}h ago` : `${Math.round(ageH / 24)}d ago`;
  return { title: a.title, source: a.source || '', link: a.link || '', clusterSize: a._clusterSize || 1, sources: a._clusterSources || [], ageLabel };
}

export function retrieveFeedContext(question, arts, opts = {}) {
  const { resolveDeepLink } = opts;
  const q = (question || '').trim();
  const intent = detectRetrievalIntent(q);
  const category = detectRetrievalCategory(q);
  const kws = extractQueryKeywords(q);
  // Scope + cap the pool (most recent first) so clustering stays cheap.
  const rawPool = category ? (arts[category] || []) : Object.values(arts || {}).flat();
  const pool = [...rawPool].sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0)).slice(0, 150);

  if (intent === 'trending') {
    const clustered = clusterStories(pool);
    const topics = hotClusterTopics(clustered, 5);
    const hot = clustered.map(a => ({ a, heat: heatScore(a) }))
      .sort((x, y) => y.heat - x.heat).slice(0, 6).map(x => slimFeedItem(x.a));
    return { intent, category, topics, clusters: hot, deepLink: category ? `/${category}` : null };
  }

  // entity / general: keyword-filter, cluster, rank by relevance + size + recency.
  const matched = kws.length
    ? pool.filter(a => { const t = (a.title + ' ' + (a.desc || '')).toLowerCase(); return kws.some(k => t.includes(k)); })
    : pool;
  const clustered = clusterStories(matched);
  const ranked = clustered.map(a => {
    const t = (a.title + ' ' + (a.desc || '')).toLowerCase();
    const kwHits = kws.filter(k => t.includes(k)).length;
    const ageH = a.pubDate ? (Date.now() - new Date(a.pubDate)) / 3600000 : 999;
    return { a, score: kwHits * 20 + (a._clusterSize || 1) * 8 + Math.max(0, 48 - ageH) };
  }).sort((x, y) => y.score - x.score).slice(0, 8).map(x => slimFeedItem(x.a));

  // Optional deep link — resolution is injected by the host app (keeps this module
  // free of any app-specific routing / entity tables).
  let deepLink = category ? `/${category}` : null;
  if (kws.length && typeof resolveDeepLink === 'function') {
    const dl = resolveDeepLink({ entities: kws, category });
    if (dl) deepLink = dl;
  }
  return { intent, category, entities: kws, clusters: ranked, deepLink };
}

// Format retrieved context into a compact, model-ready block.
export function buildFeedContextBlock(ctx) {
  if (ctx.intent === 'trending' && ctx.topics?.length) {
    let s = `TRENDING TOPICS${ctx.category ? ` in ${ctx.category}` : ''}: ${ctx.topics.join(', ')}.\nTOP CLUSTERS:\n`;
    s += ctx.clusters.map((c, i) => `${i + 1}. "${c.title}" — ${c.source}${c.clusterSize > 1 ? ` (+${c.clusterSize - 1} more sources)` : ''}, ${c.ageLabel}`).join('\n');
    return s;
  }
  if (!ctx.clusters?.length) return '';
  return "RELEVANT STORIES FROM TODAY'S FEED:\n" + ctx.clusters.map((c, i) => `${i + 1}. "${c.title}" — ${c.source}${c.clusterSize > 1 ? ` · ${c.clusterSize} sources` : ''}, ${c.ageLabel}`).join('\n');
}
