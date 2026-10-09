// ─── ARTICLE READER ───────────────────────────────────────────────────────────
// Extracted from App.jsx (H5). Pure module — all app dependencies are passed in as
// props (fetchAISummary, formatDate, previewLabel, TakeawaysContent) so it never reaches
// into App's closure. XPulse is a sibling module import. Styles are the global
// .article-reader-* rules. Lazy-loaded + idle-prefetched by App.
import { useState, useEffect, useRef } from 'react';
import { X as XIcon } from 'lucide-react';
import { XPulse } from '../x-pulse';

export function ArticleReader({ article, onClose, onAskInChat, related = [], onOpen,
  fetchAISummary, formatDate, previewLabel = '', TakeawaysContent }) {
  const [aiResult, setAiResult] = useState('');
  const [aiErr, setAiErr] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState(null);
  const [aiPreview, setAiPreview] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  // F9: focus trap + RETURN focus to the opener on close. (Esc-to-close is wired globally.)
  useEffect(() => {
    const opener = document.activeElement;
    const node = dialogRef.current;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Tab' || !node) return;
      const f = node.querySelectorAll('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node?.addEventListener('keydown', onKey);
    return () => {
      node?.removeEventListener('keydown', onKey);
      if (opener && opener.focus) { try { opener.focus(); } catch {} }
    };
  }, []);

  const runAI = async (mode) => {
    setAiMode(mode);
    setAiLoading(true);
    setAiResult(''); setAiErr(''); setAiPreview(false);
    const { summary, error, fromPreview } = await fetchAISummary({ type: 'article', title: article.title, content: article.desc || article.title, mode, url: article.link });
    if (summary) { setAiResult(summary); setAiPreview(!!fromPreview); }
    else setAiErr(error || 'Could not generate that right now — try again.');
    setAiLoading(false);
  };

  return (
    <div className="article-reader-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="article-reader" ref={dialogRef} role="dialog" aria-modal="true" aria-label={article.title}>
        <button className="article-reader-close" ref={closeRef} onClick={onClose} aria-label="Close reader"><XIcon size={16} aria-hidden="true"/></button>
        {article.img && <img className="article-reader-img" src={article.img} alt="" loading="lazy"/>}
        <div className="article-reader-body">
          <div className="article-reader-source">
            <span>{article.source}</span>
            {article.pubDate && <span className="article-reader-date">· {formatDate(article.pubDate)}</span>}
            {onAskInChat && (
              <button className="article-reader-ask" onClick={() => { onAskInChat(article); onClose(); }}
                aria-label="Ask the assistant about this story">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Ask
              </button>
            )}
          </div>
          <h2 className="article-reader-title">{article.title}</h2>
          {article.desc && <p className="article-reader-desc">{article.desc}</p>}
          <div className="article-reader-actions">
            <a className="article-reader-btn primary" href={article.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              Open Full Article
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>
            </a>
            <button className="article-reader-btn" onClick={() => runAI('summary')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>
              Summarize
            </button>
            <button className="article-reader-btn" onClick={() => runAI('takeaways')}>Key Points</button>
            <button className="article-reader-btn" onClick={() => runAI('bias')}>Bias Check</button>
            <button className="article-reader-btn" onClick={() => { onAskInChat?.(article); onClose(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Ask in Chat
            </button>
          </div>
          {aiLoading && <div className="article-reader-ai-result" style={{ color: 'var(--text3)' }}>Analyzing with AI…</div>}
          {!aiLoading && aiErr && (
            <div className="article-reader-ai-result" style={{ color: 'var(--red)' }}>
              {aiErr} <button className="article-reader-btn" style={{ marginLeft: '8px' }} onClick={() => runAI(aiMode || 'summary')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                Retry</button>
            </div>
          )}
          {!aiLoading && aiResult && (
            <div className="article-reader-ai-result">
              {aiPreview && <div className="fc-preview-note" style={{ marginBottom: '8px' }}>{previewLabel}</div>}
              <div className="section-label" style={{ color: 'var(--accent)', marginBottom: '8px' }}>
                {aiMode === 'summary' ? 'Summary' : aiMode === 'takeaways' ? 'Key Points' : 'Bias Check'}
              </div>
              {aiMode === 'takeaways' && TakeawaysContent ? <TakeawaysContent text={aiResult}/> : aiResult}
            </div>
          )}
          <XPulse topic={article.title} variant="reader"/>
          {related && related.length > 0 && (
            <div className="article-reader-related">
              <div className="section-label" style={{ color: 'var(--text3)', marginBottom: '8px' }}>Related</div>
              {related.slice(0, 4).map((r, i) => (
                <button key={r.link || i} className="article-reader-related-row" onClick={() => onOpen?.(r)}>
                  <span className="arr-title">{r.title}</span>
                  <span className="arr-src">{r.source}{r.pubDate ? ` · ${formatDate(r.pubDate)}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
