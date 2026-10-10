// ─── PODCASTS PAGE ────────────────────────────────────────────────────────────
// Extracted verbatim from App.jsx (I2). Pure module — every app dependency (state,
// handlers, formatters, and the shared TakeawaysContent/LastUpdated components, and the
// PODCAST_FEEDS table) is passed in as a prop, so it never reaches into App's closure.
// Styles are the global .pod-* rules in App's GLOBAL_CSS. Lazy-loaded + idle/hover-
// prefetched by App; a G5 pod-card skeleton is the Suspense fallback.
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function PodcastsPage({
  podEps, podLoading, activePod, setActivePod, podLimit, setPodLimit,
  onSave, isSaved, loadPod, fetchAISummary, fmtDate, fmtDuration,
  TakeawaysContent, LastUpdated, PODCAST_FEEDS,
}) {
  const allEps = PODCAST_FEEDS.flatMap(p => (podEps[p.name] || []).slice(0, 3).map(e => ({ ...e, show: p.name, host: p.host, emoji: p.emoji }))).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const displayEps = activePod ? (podEps[activePod.name] || []).map(e => ({ ...e, show: activePod.name, host: activePod.host, emoji: activePod.emoji })) : allEps;

  const PodCard = ({ ep, idx }) => {
    const [podAiState, setPodAiState] = useState('closed');
    const [podSum, setPodSum] = useState('');
    const [podTake, setPodTake] = useState('');
    const [podErr, setPodErr] = useState('');
    const [loadPodAI, setLoadPodAI] = useState(false);
    const sv2 = isSaved({ ...ep, link: ep.link || ep.show + idx });

    const handlePodAI = async () => {
      if (podAiState !== 'closed') { setPodAiState('closed'); return; }
      setPodAiState('takeaways');
      const needSum = !podSum, needTake = !podTake;
      if (!needSum && !needTake) return;
      setLoadPodAI(true);
      const tasks = [];
      if (needSum) tasks.push(fetchAISummary({ type: 'podcast', title: ep.title, content: ep.desc || '', mode: 'summary' }).then(r => ({ k: 's', ...r })));
      if (needTake) tasks.push(fetchAISummary({ type: 'podcast', title: ep.title, content: ep.desc || '', mode: 'takeaways' }).then(r => ({ k: 't', ...r })));
      const results = await Promise.all(tasks);
      for (const r of results) {
        if (r.summary) { if (r.k === 's') setPodSum(r.summary); else setPodTake(r.summary); }
        else if (r.error) setPodErr(r.error);
      }
      setLoadPodAI(false);
    };

    return (
      <div className="pod-card">
        <div className="pod-card-top">
          <div className="pod-num">{idx + 1}</div>
          <div className="pod-body">
            <div className="pod-show">{ep.emoji} {ep.show}</div>
            <div className="pod-title" onClick={() => ep.link && window.open(ep.link, '_blank')}>{ep.title}</div>
            <div className="pod-meta"><span>{fmtDate(ep.pubDate)}</span>{ep.duration && <span>{fmtDuration(ep.duration)}</span>}</div>
            {ep.desc && <div className="pod-desc">{ep.desc}</div>}
          </div>
        </div>
        {podAiState !== 'closed' && (
          <div className="fc-ai-panel" style={{ margin: '10px 0 0' }}>
            <div className="fc-summary">
              <div className="fc-summary-lbl"><Sparkles size={13} aria-hidden="true"/> Summary · from show notes</div>
              {loadPodAI && !podSum ? <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic' }}>Generating summary…</div>
                : podErr && !podSum ? <div style={{ fontSize: '11px', color: 'var(--red)' }}>{podErr}</div>
                  : <div className="fc-summary-text">{podSum}</div>}
            </div>
            {podAiState === 'takeaways' && (
              <div className="fc-takeaways">
                <div className="fc-takeaways-lbl">Key Takeaways</div>
                {loadPodAI && !podTake ? <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic' }}>Analyzing episode…</div>
                  : podErr && !podTake ? <div style={{ fontSize: '11px', color: 'var(--red)' }}>{podErr}</div>
                    : <TakeawaysContent text={podTake}/>}
              </div>
            )}
          </div>
        )}
        <div className="pod-actions">
          <button className="pod-btn" onClick={() => ep.link && window.open(ep.link, '_blank')}>Listen</button>
          {(ep.desc || '').length >= 500 && (
            <button className={`pod-btn ${podAiState !== 'closed' ? 'ai-on' : ''}`} onClick={handlePodAI} disabled={loadPodAI}>
              <Sparkles size={13} aria-hidden="true"/> {loadPodAI ? 'Thinking…' : podAiState === 'closed' ? 'AI Summary' : 'Hide AI'}
            </button>
          )}
          <button className={`pod-btn ${sv2 ? 'saved' : ''}`} onClick={() => onSave({ ...ep, link: ep.link || ep.show + idx, source: ep.show, cat: 'podcasts' })}>{sv2 ? '★ Saved' : '☆ Save'}</button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="pod-page">
        <div className="pod-col">
          <div className="pod-header">
            <div className="pod-header-emoji">{activePod ? activePod.emoji : ''}</div>
            <div>
              <div className="pod-header-name">{activePod ? activePod.name : 'All Podcasts'}</div>
              <div className="pod-header-sub">{activePod ? `Hosted by ${activePod.host}` : `${PODCAST_FEEDS.length} shows`}</div>
            </div>
            <span style={{ marginLeft: 'auto' }}><LastUpdated onRefresh={() => PODCAST_FEEDS.forEach(p => loadPod(p))}/></span>
          </div>
          {displayEps.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="pod-card" aria-busy="true">
                <div className="pod-card-top">
                  <div className="pod-skel-line" style={{ width: '22px', height: '15px', flexShrink: 0 }}/>
                  <div className="pod-body">
                    <div className="pod-skel-line" style={{ width: '34%', height: '10px', marginBottom: '6px' }}/>
                    <div className="pod-skel-line" style={{ width: '92%', height: '14px', marginBottom: '5px' }}/>
                    <div className="pod-skel-line" style={{ width: '70%', height: '14px', marginBottom: '8px' }}/>
                    <div className="pod-skel-line" style={{ width: '100%', height: '11px', marginBottom: '4px' }}/>
                    <div className="pod-skel-line" style={{ width: '85%', height: '11px' }}/>
                  </div>
                </div>
              </div>
            ))
            : displayEps.slice(0, podLimit).map((ep, i) => <PodCard key={i} ep={ep} idx={i}/>)}
          {displayEps.length > podLimit && (
            <div className="pod-load-more">
              <button onClick={() => setPodLimit(n => n + 20)}>
                Load more · {displayEps.length - podLimit} left
              </button>
            </div>
          )}
        </div>
        <div className="sidebar">
          <div className="pod-shows">
            <div className="section-label" style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border2)' }}>Shows</div>
            <div className="pod-show-item" onClick={() => { setActivePod(null); setPodLimit(20); }}>
              <div className="pod-show-emoji"></div>
              <div><div className="pod-show-name" style={{ color: !activePod ? 'var(--accent)' : '' }}>All Shows</div><div className="pod-show-ep">Latest from all {PODCAST_FEEDS.length} podcasts</div></div>
              {!activePod && <div className="pod-show-dot"/>}
            </div>
            {PODCAST_FEEDS.map((p, i) => {
              const eps = podEps[p.name] || []; const latest = eps[0]; const isA = activePod?.name === p.name;
              return (
                <div key={i} className="pod-show-item" onClick={() => { setActivePod(isA ? null : p); setPodLimit(20); }}>
                  <div className="pod-show-emoji">{p.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pod-show-name" style={{ color: isA ? 'var(--accent)' : '' }}>{p.name}</div>
                    <div className="pod-show-ep">{podLoading[p.name] ? 'Loading…' : (latest ? latest.title.slice(0, 36) + '…' : 'No episodes yet')}</div>
                  </div>
                  {isA && <div className="pod-show-dot"/>}
                </div>
              );
            })}
          </div>
          {allEps.length > 0 && (
            <div className="gs-section">
              <div className="gs-label">Trending Episodes</div>
              {allEps.slice(0, 6).map((ep, i) => (
                <div key={i} className="trend-row" onClick={() => ep.link && window.open(ep.link, '_blank')}>
                  <div className="trend-num">{i + 1}</div>
                  <div className="trend-body">
                    <div className="trend-title">{ep.title}</div>
                    <div className="trend-src">{ep.show} · {fmtDate(ep.pubDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
