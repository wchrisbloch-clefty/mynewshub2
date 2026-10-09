// ─── ANALYZE (Paste & Brief) PANEL ────────────────────────────────────────────
// Extracted from App.jsx (H5). Pure module — its one app dependency, fetchAISummary,
// is passed in as a prop (no reaching into App's closure). Styles are the global
// .analyze-* rules in App's GLOBAL_CSS. Lazy-loaded + idle-prefetched by App.
import { useState, useMemo } from 'react';
import { X as XIcon } from 'lucide-react';

export function AnalyzePanel({ onClose, fetchAISummary }) {
  const [tabType, setTabType] = useState('text'); // 'text' | 'youtube'
  const [text, setText] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [mode, setMode] = useState('summary');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const MODES = [
    { key: 'summary', label: 'Summarize' },
    { key: 'takeaways', label: 'Key Points' },
    { key: 'bias', label: 'Bias Check' },
    { key: 'brief', label: 'Full Brief' },
  ];

  const ytId = useMemo(() => {
    const m = ytUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
    return m ? m[1] : null;
  }, [ytUrl]);

  const analyze = async () => {
    const isYt = tabType === 'youtube';
    if (loading || (isYt ? !ytUrl.trim() : !text.trim())) return;
    setLoading(true);
    setResult('');
    let res;
    if (isYt) {
      res = await fetchAISummary({ type: 'article', title: 'Analysis', content: '', mode, url: ytUrl.trim() });
    } else {
      const modePrompts = {
        summary: 'Summarize this content in 3-5 sentences, hitting the key facts.',
        takeaways: 'List the 5 most important takeaways as bullet points.',
        bias: 'Analyze the bias and framing. What perspective does it favor? What might it omit?',
        brief: 'Write a comprehensive brief covering: 1) Summary 2) Key Facts 3) Why It Matters 4) Notable Quotes or Data.',
      };
      const prompt = `${modePrompts[mode]}\n\nCONTENT:\n${text.trim()}`;
      res = await fetchAISummary({ type: 'article', title: 'Analysis', content: prompt, mode });
    }
    const { summary, error, unavailable } = res;
    setResult(unavailable ? error : (error ? 'Analysis failed — try again.' : (summary || 'No result.')));
    setLoading(false);
  };

  return (
    <div className="analyze-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="analyze-panel">
        <div className="analyze-head">
          <span className="analyze-title">Paste & Brief</span>
          <button className="analyze-close" onClick={onClose} aria-label="Close"><XIcon size={13} aria-hidden="true"/></button>
        </div>
        <div className="analyze-type-tabs">
          <button className={`analyze-type-tab${tabType === 'text' ? ' active' : ''}`} onClick={() => setTabType('text')}>Article / Text</button>
          <button className={`analyze-type-tab${tabType === 'youtube' ? ' active' : ''}`} onClick={() => setTabType('youtube')}>▶ YouTube</button>
        </div>
        <div className="analyze-body">
          {tabType === 'text' ? (
            <textarea className="analyze-input" placeholder="Paste any article, transcript, or text here…" value={text} onChange={e => setText(e.target.value)} rows={8}/>
          ) : (
            <>
              <input className="analyze-url-input" placeholder="Paste YouTube URL (e.g. youtube.com/watch?v=…)" value={ytUrl} onChange={e => setYtUrl(e.target.value)}/>
              {ytId && (
                <iframe className="analyze-yt-embed" src={`https://www.youtube-nocookie.com/embed/${ytId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube video"/>
              )}
              <div className="analyze-yt-note">Captions are fetched automatically — no transcript to paste.</div>
            </>
          )}
          <div className="analyze-modes">
            {MODES.map(m => (
              <button key={m.key} className={`analyze-mode-btn${mode === m.key ? ' active' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>
            ))}
          </div>
          <button className="analyze-go-btn" onClick={analyze}
            disabled={loading || (tabType === 'text' && !text.trim()) || (tabType === 'youtube' && !ytUrl.trim())}>
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
          {result && (
            <div className="analyze-result">
              <div className="analyze-result-label">{MODES.find(m => m.key === mode)?.label}</div>
              <div className="analyze-result-text">{result}</div>
              <button className="analyze-result-clear" onClick={() => { setResult(''); setText(''); setYtUrl(''); }}>Clear</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
