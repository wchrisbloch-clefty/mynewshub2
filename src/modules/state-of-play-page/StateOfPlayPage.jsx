// T3: the full "State of Play" view — a lazy, single-column page that gathers the rail modules
// (State of Play with ALL rows, Connections, Trending, Prediction Markets, Sources) in one place,
// reachable from the card's "Open full view" and from the More sheet. Pure render over ctx; the
// host owns routing (browser Back returns to the previous page + scroll), so there is no new
// bottom-bar tab and no app state here.
import { useMemo } from 'react';
import { StateOfPlay, selectStateOfPlay } from '../state-of-play';
import { ConnectionsStrip, findConnections } from '../connections';
import './state-of-play-page.css';

export function StateOfPlayPage({ ctx }) {
  const {
    arts, breakingItems, kw, health, onRead, setChatContext, fmtDate, setSearch,
    isTopicFollowed, toggleTopic, isPromoItem, storyKey, CATS,
    TrendingPills, PredictionMarkets, cleanSourceName,
  } = ctx;

  const flat = useMemo(() => Object.entries(arts || {}).flatMap(([c, list]) => (list || []).map(a => ({ ...a, cat: a.cat || c }))), [arts]);

  // State of Play pool — the whole cross-category set, promo/satire dropped by the selector.
  const sopPool = useMemo(() => {
    const seen = new Set();
    return flat.filter(a => a && a.title && a.link && !(isPromoItem && isPromoItem(a)))
      .filter(a => { const k = storyKey(a); if (seen.has(k)) return false; seen.add(k); return true; });
  }, [flat, isPromoItem, storyKey]);

  const breaking = useMemo(() => (breakingItems || []).filter(b => !(isPromoItem && isPromoItem(b))).slice(0, 3), [breakingItems, isPromoItem]);

  // Trending topics across everything (reuse the same pills the rail uses).
  const trendingItems = useMemo(() => selectStateOfPlay({ items: sopPool, breakingItems: [], gapItems: [] }).top, [sopPool]);

  const connections = useMemo(() => {
    try { return findConnections(flat, { storyKey }); } catch { return []; }
  }, [flat, storyKey]);

  // Sources summary — count per source across the pool, with honest live/total (P6 style).
  const sources = useMemo(() => {
    const counts = {};
    for (const a of flat) counts[a.source] = (counts[a.source] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([name, n]) => ({ name, n }));
  }, [flat]);
  const liveN = sources.filter(s => health && health[s.name] === 'green').length;

  const topicKeywords = useMemo(() => Object.values(kw || {}).flat().slice(0, 8), [kw]);

  return (
    <div className="page sop-page" data-no-swipe>
      <div className="sop-page-head">
        <h1 className="sop-page-title">State of Play</h1>
        <span className="sop-page-sub">What’s driving the day — everything in one column.</span>
      </div>

      <section className="sop-page-module">
        <StateOfPlay variant="sidebar" items={sopPool} breakingItems={breaking} showTopic
          meta={(CATS && CATS.general) || {}} onRead={onRead} onAsk={setChatContext} formatDate={fmtDate}/>
      </section>

      {connections && connections.length > 0 && (
        <section className="sop-page-module">
          <div className="sidebar-sec-head"><span className="sidebar-sec-label">Connections</span></div>
          <ConnectionsStrip connections={connections} onRead={onRead} formatDate={fmtDate}/>
        </section>
      )}

      {TrendingPills && trendingItems.length > 0 && (
        <section className="sop-page-module">
          <TrendingPills label="Trending" items={trendingItems} onOpen={t => setSearch && setSearch(String(t).toLowerCase())}
            isTopicFollowed={isTopicFollowed} toggleTopic={toggleTopic}/>
        </section>
      )}

      {PredictionMarkets && (
        <section className="sop-page-module">
          <PredictionMarkets keywords={topicKeywords}/>
        </section>
      )}

      {sources.length > 0 && (
        <section className="sop-page-module">
          <div className="sidebar-sec-head">
            <span className="sidebar-sec-label">{`Sources · ${liveN}/${sources.length} live`}</span>
          </div>
          <div className="sop-page-sources">
            {sources.map((s, i) => (
              <span key={i} className="sop-page-source">
                <span className={`src-pill-dot ${health && health[s.name] === 'green' ? 'h-green' : 'h-gray'}`}/>
                {cleanSourceName ? cleanSourceName(s.name) : s.name}
                <span className="sop-page-source-n">{s.n}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
