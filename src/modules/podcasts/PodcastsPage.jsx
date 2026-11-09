// ─── PODCASTS PAGE ────────────────────────────────────────────────────────────
// Z5: episodes get the SAME features as articles. PodCard is a MODULE-SCOPE component (was declared
// inside PodcastsPage, so every parent re-render remounted it and closed an open AI panel — fixed).
// Every episode exposes Summary, Key Takeaways, Explain, Ask, Save, Share and Listen. The AI summary
// has no >=500-char gate any more: it follows an honest source ladder —
//   (a) TRANSCRIPT via the existing /api/listen (captions/Whisper) when the user taps "Summarize
//       episode" (on demand only, never on render/scroll), labelled with its provenance chip;
//   (b) SHOW NOTES when they are at least PREVIEW_MIN long (labelled "Show notes");
//   (c) otherwise it says so plainly ("No notes or transcript available") and still offers
//       Listen / Save / Ask.
// No new api/ files (reuses /api/listen and /api/summarize via fetchAISummary / fetchListen).
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

function EpisodeActions({ ep, idx, deps }) {
  const { onSave, isSaved, fmtDate, fmtDuration, TakeawaysContent, ExplainContent, ShareControl,
    fetchAISummary, fetchListen, setChatContext, PREVIEW_MIN = 120 } = deps;
  const [panel, setPanel] = useState('closed');      // closed | summary | takeaways | explain
  const [sum, setSum] = useState(''); const [take, setTake] = useState(''); const [explain, setExplain] = useState('');
  const [prov, setProv] = useState('');              // '', 'Show notes', 'Transcript', 'Captions'
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const key = ep.link || ep.show + idx;
  const sv = isSaved({ ...ep, link: key });
  const notes = ep.desc || '';
  const hasNotes = notes.length >= PREVIEW_MIN;
  const hasMedia = !!(ep.audio || ep.enclosure || ep.link);

  const close = () => setPanel('closed');
  const showNotesSummary = async () => {
    if (sum) return; setBusy(true); setErr('');
    const r = await fetchAISummary({ type: 'podcast', title: ep.title, content: notes, mode: 'summary' });
    if (r.summary) { setSum(r.summary); setProv('Show notes'); } else setErr(r.error || 'Could not summarize.');
    setBusy(false);
  };
  // (a) transcript — on demand only; one in flight; provenance from the API response.
  const summarizeEpisode = async () => {
    if (busy) return; setBusy(true); setErr(''); setPanel('summary');
    const r = await fetchListen(ep.audio || ep.enclosure || ep.link);
    if (r.summary) { setSum(r.summary); setProv(r.provenance === 'captions' ? 'Captions' : r.provenance === 'transcript' ? 'Transcript' : 'Transcript'); }
    else if (hasNotes) { await showNotesSummary(); }
    else setErr(r.error ? `No transcript (${r.error})` : 'No notes or transcript available');
    setBusy(false);
  };
  const openSummary = async () => { if (panel !== 'closed') return close(); setPanel('summary'); if (!sum && hasNotes) await showNotesSummary(); };
  const openTakeaways = async () => {
    setPanel('takeaways');
    if (!take && hasNotes) { setBusy(true); const r = await fetchAISummary({ type: 'podcast', title: ep.title, content: notes, mode: 'takeaways' });
      if (r.summary) setTake(r.summary); else setErr(r.error || ''); setBusy(false); }
  };
  const openExplain = async () => {
    setPanel('explain');
    if (!explain) { setBusy(true); const r = await fetchAISummary({ type: 'podcast', title: ep.title, content: notes, mode: 'explain' });
      setExplain(r.summary || r.error || 'Could not generate an explanation.'); setBusy(false); }
  };

  return (
    <>
      {panel !== 'closed' && (
        <div className="fc-ai-panel pod-ai-panel">
          <div className="fc-summary">
            <div className="fc-summary-lbl"><Sparkles size={13} aria-hidden="true"/> {
              panel === 'takeaways' ? 'Key Takeaways' : panel === 'explain' ? 'Explain' : 'Summary'}{
              panel === 'summary' && prov ? ` · from ${prov.toLowerCase()}` : ''}</div>
            {busy && !sum && !take && !explain ? <div className="pod-ai-note">Generating…</div>
              : err && !sum && !take && !explain ? <div className="pod-ai-err">{err}</div>
              : panel === 'takeaways' ? (take ? <TakeawaysContent text={take}/> : <div className="pod-ai-note">No show notes to summarize.</div>)
              : panel === 'explain' ? (ExplainContent ? <ExplainContent text={explain}/> : <div className="fc-summary-text">{explain}</div>)
              : (sum ? <div className="fc-summary-text">{sum}</div>
                  : <div className="pod-ai-note">No notes or transcript available.{hasMedia && <> <button className="pod-inline-link" onClick={summarizeEpisode}>Summarize episode</button></>}</div>)}
          </div>
        </div>
      )}
      <div className="pod-actions">
        <button className="pod-btn" onClick={() => ep.link && window.open(ep.link, '_blank')}>Listen</button>
        <button className={`pod-btn ${panel === 'summary' ? 'ai-on' : ''}`} onClick={openSummary} disabled={busy}>
          <Sparkles size={13} aria-hidden="true"/> {busy && panel === 'summary' ? 'Thinking…' : 'Summary'}</button>
        <button className={`pod-btn ${panel === 'takeaways' ? 'ai-on' : ''}`} onClick={openTakeaways} disabled={busy}>Takeaways</button>
        <button className={`pod-btn ${panel === 'explain' ? 'ai-on' : ''}`} onClick={openExplain} disabled={busy}>Explain</button>
        {setChatContext && <button className="pod-btn" onClick={() => setChatContext({ ...ep, link: key, source: ep.show, cat: 'podcasts' })}>Ask</button>}
        {hasMedia && <button className="pod-btn" onClick={summarizeEpisode} disabled={busy} title="Summarize from the episode transcript">Summarize episode</button>}
        {ShareControl && <ShareControl title={ep.title} url={ep.link || ''} source={ep.show} className="pod-btn"/>}
        <button className={`pod-btn ${sv ? 'saved' : ''}`} onClick={() => onSave({ ...ep, link: key, source: ep.show, cat: 'podcasts' })}>{sv ? '★ Saved' : '☆ Save'}</button>
      </div>
    </>
  );
}

// Module-scope so an open AI panel survives parent re-renders (podLoading ticks, etc.).
export function PodCard({ ep, idx, deps }) {
  const { fmtDate, fmtDuration } = deps;
  return (
    <div className="pod-card">
      <div className="pod-card-top">
        <div className="pod-num">{idx + 1}</div>
        <div className="pod-body">
          <div className="pod-show">{ep.emoji} {ep.show}</div>
          <div className="pod-title" onClick={() => ep.link && window.open(ep.link, '_blank')}>{ep.title}</div>
          {/* Z5.4: PODCAST · Show · time · duration meta, matching the STANDARD/COMPACT row meta order. */}
          <div className="pod-meta"><span>Podcast</span><span>{ep.show}</span><span>{fmtDate(ep.pubDate)}</span>{ep.duration && <span>{fmtDuration(ep.duration)}</span>}</div>
          {ep.desc && <div className="pod-desc">{ep.desc}</div>}
        </div>
      </div>
      <EpisodeActions ep={ep} idx={idx} deps={deps}/>
    </div>
  );
}

export function PodcastsPage({
  podEps, podLoading, activePod, setActivePod, podLimit, setPodLimit,
  onSave, isSaved, loadPod, fetchAISummary, fmtDate, fmtDuration,
  TakeawaysContent, LastUpdated, PODCAST_FEEDS,
  fetchListen, setChatContext, ExplainContent, ShareControl, PREVIEW_MIN,
}) {
  const deps = { onSave, isSaved, fmtDate, fmtDuration, TakeawaysContent, ExplainContent, ShareControl,
    fetchAISummary, fetchListen, setChatContext, PREVIEW_MIN };
  const allEps = PODCAST_FEEDS.flatMap(p => (podEps[p.name] || []).slice(0, 3).map(e => ({ ...e, show: p.name, host: p.host, emoji: p.emoji }))).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const displayEps = activePod ? (podEps[activePod.name] || []).map(e => ({ ...e, show: activePod.name, host: activePod.host, emoji: activePod.emoji })) : allEps;

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
            : displayEps.slice(0, podLimit).map((ep, i) => <PodCard key={ep.link || ep.show + i} ep={ep} idx={i} deps={deps}/>)}
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
