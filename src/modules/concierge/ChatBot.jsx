// ─── CONCIERGE (grounded chat) ────────────────────────────────────────────────
// Floating chat assistant: a single unified chat that answers from a tiered
// waterfall (pasted URL → reader context → Feed → Web → AI-general), badging each
// answer with its source tier. App-agnostic: the summarizer, web search, entity→
// route resolver, and navigation are all INJECTED.
//
// Props:
//   arts            ({[cat]: article[]})  feed data to ground answers in
//   onNavigate(path)(fn)  open an in-app route, e.g. "/sports/cfb/kentucky"
//   fetchSummary    (fn)  ({type,title,content,mode,url}) -> { summary, error }  (LLM call)
//   fetchWebSearch  (fn)  (query) -> [{title,desc,link,source,pubDate}]  (web-tier fallback)
//   resolveDeepLink (fn)  ({entities,category}) -> string|null  (entity -> in-app path)
//   chatContext     (obj|null)  article the reader handed us to ground answers on
//   onClearContext  (fn)  clear the grounding article
//
// Styling: co-located Concierge.css + design tokens (src/styles/tokens.css).
import { useState, useEffect, useRef } from 'react';
import { retrieveFeedContext, buildFeedContextBlock } from '../retrieval';
import './Concierge.css';

export function ChatBot({ arts, onNavigate, fetchSummary, fetchWebSearch, resolveDeepLink, chatContext, onClearContext }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { role:'bot', text:"Hi! I'm your AI news assistant. Ask me anything about today's stories, markets, or sports.", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open]);

  // When the reader hands us an article to ground on, pop the chat open.
  useEffect(() => {
    if (chatContext) setOpen(true);
  }, [chatContext]);

  const QUICK = ["What's trending today?", "Sports update?", "Markets summary", "Top tech news"];

  // Push a bot message tagged with its source tier ('feed'|'web'|'ai'|'open').
  const pushBot = (summary, error, tier, link=null, sources=null) => {
    const t2 = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const botText = error ? (error.includes('No AI provider') ? '⚙️ AI not configured — add GROQ_API_KEY in Vercel env vars.' : "Sorry, I couldn't reach the AI right now.") : (summary || 'No response.');
    setMsgs(m => [...m, { role:'bot', text:botText, time:t2, tier: error?null:tier, link, sources: error?null:sources }]);
  };

  // Unified waterfall: pasted URL → reader context → Feed → Web → AI-general.
  // Every answer is badged with the tier it came from.
  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setMsgs(m => [...m, { role:'user', text:q, time:t }]);
    setInput(''); setLoading(true);

    // Detect a pasted URL/YouTube in the question → extract-first, tier 'open'
    const urlMatch = q.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const { summary, error } = await fetchSummary({ type:'article', title:'Ask', content:`QUESTION: ${q}`, mode:'chat-open', url: urlMatch[0] });
      pushBot(summary, error, 'open'); setLoading(false); return;
    }

    // Reader context present → answer about that article, tier 'open'
    if (chatContext) {
      const content = `ARTICLE:\n${chatContext.title}\n${chatContext.desc || ''}\n\nQUESTION: ${q}`;
      const { summary, error } = await fetchSummary({ type:'article', title:chatContext.title, content, mode:'chat-open', url: chatContext.link });
      pushBot(summary, error, 'open'); setLoading(false); return;
    }

    // Tier 1: FEED
    const ctx = retrieveFeedContext(q, arts, { resolveDeepLink });
    const feedBlock = buildFeedContextBlock(ctx);
    if (feedBlock) {
      const content = `FEED CONTEXT:\n${feedBlock}\n\nQUESTION: ${q}`;
      const { summary, error } = await fetchSummary({ type:'article', title:'concierge', content, mode:'chat' });
      if (summary && !/isn't in today's feed/i.test(summary)) { pushBot(summary, error, 'feed', ctx.deepLink); setLoading(false); return; }
    }

    // Tier 2: WEB
    try {
      const web = await fetchWebSearch(q);
      if (web && web.length) {
        const top = web.slice(0, 5);
        const webBlock = top.map(r => `${r.title} — ${r.desc || ''} (${r.source})`).join('\n');
        const content = `WEB RESULTS:\n${webBlock}\n\nQUESTION: ${q}`;
        const { summary, error } = await fetchSummary({ type:'article', title:'web', content, mode:'chat-open' });
        if (summary) {
          const sources = top.slice(0, 3).map(r => ({ title: r.title, link: r.link, source: r.source }));
          pushBot(summary, error, 'web', null, sources);
          setLoading(false); return;
        }
      }
    } catch {}

    // Tier 3: AI-general
    const { summary, error } = await fetchSummary({ type:'article', title:'ask', content:`QUESTION: ${q}\n\nAnswer from general knowledge, concisely.`, mode:'chat-open' });
    pushBot(summary, error, 'ai'); setLoading(false);
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
              <div className="chat-header-title">AI Assistant</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          {chatContext && (
            <div className="chat-context-chip">
              <span className="chat-context-label">Asking about:</span>
              <span className="chat-context-title">{chatContext.title}</span>
              <button className="chat-context-clear" onClick={onClearContext} aria-label="Clear context">✕</button>
            </div>
          )}
          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.tier && <span className={`chat-tier chat-tier-${m.tier}`}>{m.tier==='feed'?'● FEED':m.tier==='web'?'● WEB':m.tier==='open'?'● THIS':'● AI'}</span>}
                <div className="chat-bubble">{m.text}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="chat-sources">
                    {m.sources.map((s, si) => (
                      <a key={si} className="chat-source-link" href={s.link} target="_blank" rel="noreferrer">{s.source}: {s.title.slice(0, 60)} ↗</a>
                    ))}
                  </div>
                )}
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
        </div>
      )}
    </>
  );
}
