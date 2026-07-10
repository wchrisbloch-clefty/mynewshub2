// ─── CONCIERGE (grounded chat) ────────────────────────────────────────────────
// Floating chat assistant with two modes: a grounded "concierge" that answers only
// from retrieved feed context, and an "Analyze" mode for pasted text. App-agnostic:
// the summarizer, entity→route resolver, and navigation are all INJECTED.
//
// Props:
//   arts            ({[cat]: article[]})  feed data to ground answers in
//   onNavigate(path)(fn)  open an in-app route, e.g. "/sports/cfb/kentucky"
//   fetchSummary    (fn)  ({type,title,content,mode}) -> { summary, error }  (LLM call)
//   resolveDeepLink (fn)  ({entities,category}) -> string|null  (entity -> in-app path)
//
// Styling: co-located Concierge.css + design tokens (src/styles/tokens.css).
import { useState, useEffect, useRef } from 'react';
import { retrieveFeedContext, buildFeedContextBlock } from '../retrieval';
import './Concierge.css';

export function ChatBot({ arts, onNavigate, fetchSummary, resolveDeepLink }) {
  const [open, setOpen] = useState(false);
  const [chatMode, setChatMode] = useState('chat'); // 'chat' | 'analyze'
  const [msgs, setMsgs] = useState([
    { role:'bot', text:"Hi! I'm your AI news assistant. Ask me anything about today's stories, markets, or sports.", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzeMode, setAnalyzeMode] = useState('summary');
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && chatMode === 'chat') messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open, chatMode]);

  const QUICK = ["What's trending today?", "Sports update?", "Markets summary", "Top tech news"];
  const ANALYZE_MODES = [
    { key:'summary',   label:'Summarize' },
    { key:'takeaways', label:'Key Points' },
    { key:'bias',      label:'Bias Check' },
    { key:'related',   label:'Related Context' },
  ];

  // Phase 6: grounded concierge. Retrieve relevant clustered feed data for the
  // question (standalone retrieveFeedContext), hand ONLY that to the model, and
  // let the backend chat system prompt enforce "answer only from the feed".
  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setMsgs(m => [...m, { role:'user', text:q, time:t }]);
    setInput('');
    setLoading(true);
    const ctx = retrieveFeedContext(q, arts, { resolveDeepLink });
    let contextBlock = '';
    let deepLink = ctx.deepLink;

    if (ctx.intent === 'markets') {
      try {
        const r = await fetch('/api/markets', { signal: AbortSignal.timeout(9000) });
        if (r.ok) {
          const d = await r.json();
          const idx = (d.indices || []).map(i => `${i.name} ${i.price} (${(i.pct||0) >= 0 ? '+' : ''}${(i.pct||0).toFixed(2)}%)`).join(', ');
          const g = (d.gainers || []).slice(0, 3).map(m => `${m.symbol} ${(m.pct||0) >= 0 ? '+' : ''}${(m.pct||0).toFixed(1)}%`).join(', ');
          const l = (d.losers || []).slice(0, 3).map(m => `${m.symbol} ${(m.pct||0).toFixed(1)}%`).join(', ');
          if (idx) { contextBlock = `LIVE MARKETS SNAPSHOT:\nIndices: ${idx}\nTop gainers: ${g || '—'}\nTop losers: ${l || '—'}`; deepLink = '/finance'; }
        }
      } catch {}
      if (!contextBlock) contextBlock = buildFeedContextBlock(retrieveFeedContext(q, arts, { resolveDeepLink })); // fall back to feed
    } else {
      contextBlock = buildFeedContextBlock(ctx);
    }

    const content = contextBlock
      ? `FEED CONTEXT:\n${contextBlock}\n\nQUESTION: ${q}`
      : `FEED CONTEXT: (no matching stories found in today's feed)\n\nQUESTION: ${q}`;

    const { summary, error } = await fetchSummary({ type:'article', title:'concierge', content, mode:'chat' });
    const t2 = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const botText = error
      ? (error.includes('No AI provider') ? '⚙️ AI not configured — add GROQ_API_KEY in Vercel env vars, then redeploy.' : 'Sorry, I couldn\'t reach the AI right now. Try again in a moment.')
      : (summary || 'No response.');
    setMsgs(m => [...m, { role:'bot', text: botText, time:t2, link: (!error && contextBlock) ? deepLink : null }]);
    setLoading(false);
  };

  const analyze = async () => {
    const txt = analyzeText.trim();
    if (!txt || loading) return;
    setLoading(true);
    setAnalyzeResult('');
    // Detect a pasted URL (article, podcast page, or YouTube) → extract-first path.
    const urlMatch = txt.match(/https?:\/\/[^\s]+/);
    const isUrl = urlMatch && txt.split(/\s+/).length <= 2;
    const { summary, error, fromPreview } = isUrl
      ? await fetchSummary({ type:'article', title:'Analysis', content:'', mode:analyzeMode, url: urlMatch[0] })
      : await fetchSummary({ type:'article', title:'Analysis', content:txt, mode:analyzeMode });
    // Never show a preview-based summary unlabeled.
    const preview = fromPreview ? 'Summary from preview text — full article unavailable\n\n' : '';
    setAnalyzeResult(error ? error : (summary ? preview + summary : 'No result.'));
    setLoading(false);
  };

  return (
    <>
      <button className={`chat-fab ${open?'open':''}`} onClick={() => setOpen(o => !o)} aria-label="Chat assistant">
        {open
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </button>
      {open && (
        <div className="chat-drawer">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">AI News Assistant</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-mode-tabs">
            <button className={`chat-mode-tab${chatMode==='chat'?' active':''}`} onClick={()=>setChatMode('chat')}>Ask</button>
            <button className={`chat-mode-tab${chatMode==='analyze'?' active':''}`} onClick={()=>setChatMode('analyze')}>Analyze</button>
          </div>
          {chatMode === 'chat' ? (
            <>
              <div className="chat-messages">
                {msgs.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.role}`}>
                    <div className="chat-bubble">{m.text}</div>
                    {m.link && onNavigate && (
                      <button className="chat-deeplink" onClick={()=>{ onNavigate(m.link); setOpen(false); }}>Open in app →</button>
                    )}
                    <span className="chat-msg-time">{m.time}</span>
                  </div>
                ))}
                {loading && (
                  <div className="chat-msg bot">
                    <div className="chat-bubble" style={{padding:'10px 14px'}}>
                      <div className="chat-typing">
                        <div className="chat-typing-dot"/><div className="chat-typing-dot"/><div className="chat-typing-dot"/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>
              {msgs.length <= 2 && (
                <div className="chat-quick-btns">
                  {QUICK.map(q => <button key={q} className="chat-quick-btn" onClick={() => send(q)}>{q}</button>)}
                </div>
              )}
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Ask about today's news…" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}/>
                <button className="chat-send" onClick={() => send()} disabled={!input.trim() || loading}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-analyze">
              <div className="chat-analyze-modes">
                {ANALYZE_MODES.map(m => (
                  <button key={m.key} className={`chat-analyze-mode-btn${analyzeMode===m.key?' active':''}`}
                    onClick={()=>setAnalyzeMode(m.key)}>{m.label}</button>
                ))}
              </div>
              <textarea className="chat-analyze-input"
                placeholder="Paste article text or URL here…"
                value={analyzeText}
                onChange={e=>setAnalyzeText(e.target.value)}
                rows={5}
              />
              <button className="chat-analyze-go" onClick={analyze} disabled={!analyzeText.trim() || loading}>
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
              {analyzeResult && (
                <div className="chat-analyze-result">
                  <div className="chat-analyze-result-label">{ANALYZE_MODES.find(m=>m.key===analyzeMode)?.label}</div>
                  <div className="chat-analyze-result-text">{analyzeResult}</div>
                  <button className="chat-analyze-clear" onClick={()=>{setAnalyzeResult('');setAnalyzeText('');}}>Clear</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
