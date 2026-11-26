// AG2: "Right now across outlets" — one row per pinned outlet showing that outlet's lead headline.
// Pure + unit-tested. Never affects ranking or tier. Alt outlets keep their chip and obey the Show-
// alternative-perspective toggle (handled in the component). RSS is newest-first, so for most outlets
// the lead is "latest from <outlet>"; a known top-stories feed (editorial priority) shows no qualifier.

// Pinned outlet NAMES per category — must match the feed `name` (source) exactly. CB-editable later.
export const PINNED_OUTLETS = {
  general: ['Fox News', 'The Daily Wire', 'CNN', 'CBS News', 'ABC News', 'NBC News', 'The New York Times',
    'Wall Street Journal', 'AP (Google News)', 'Reuters (Google News)', 'BBC News', 'NPR News', 'Politico'],
  business: ['CNBC Top News', 'WSJ Business', 'Bloomberg', 'MarketWatch', 'Reuters Business (Google News)', 'Yahoo Finance', 'ZeroHedge'],
  finance: ['CNBC Top News', 'WSJ Business', 'Bloomberg', 'MarketWatch', 'Reuters Business (Google News)', 'Yahoo Finance', 'ZeroHedge'],
  bloom: ['Rigzone', 'Oilprice.com', 'EIA Today in Energy', 'American Petroleum Institute (Google News)', 'Utility Dive', 'Natural Gas Intelligence', 'Hydrocarbon Processing', 'Power Magazine'],
  tech: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'Techmeme', 'OpenAI', 'Google DeepMind'],
  sports: ['ESPN', 'Yahoo Sports', 'Fox Sports', 'The Athletic', 'NBC Sports', 'Google News — Sports'],
};

// Known TOP-STORIES feeds — editorial priority, so the row shows the headline without a "latest" tag.
export const TOP_FEEDS = new Set([
  'Fox News', 'CNN', 'ABC News', 'NBC News', 'CBS News', 'BBC News', 'NPR News',
  'AP (Google News)', 'Reuters (Google News)', 'Reuters Business (Google News)', 'Google News — Sports',
  'Google News — Top stories', 'ESPN',
]);

// items: the category's articles (already promo-filtered). Returns one entry per pinned outlet, in
// pinned order: { outlet, item|null, isTop }. `item` is the most-recent article from that source
// (RSS newest-first ≈ the outlet's own lead); null when the outlet carried nothing / failed.
export function selectAcross(items, pinned) {
  const leadBySource = new Map();
  for (const a of items || []) {
    if (!a || !a.source || !a.title || !a.link) continue;
    const cur = leadBySource.get(a.source);
    if (!cur || new Date(a.pubDate || 0) > new Date(cur.pubDate || 0)) leadBySource.set(a.source, a);
  }
  return (pinned || []).map(outlet => ({ outlet, item: leadBySource.get(outlet) || null, isTop: TOP_FEEDS.has(outlet) }));
}
