import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.jsx';
import { callClaude, buildSystem, saveResearch, uid, timeAgo } from '../utils.js';
import { CB_SPINE } from '../constants.js';
import MD from './shared/MD.jsx';
import { Btn, Input, Label, Card, Badge, ThinkingDots, Modal } from './shared/Common.jsx';

const SEARCH_SUGGESTIONS = [
  'Houston real estate market 2025 tipping point',
  'AI agent disruption — which industries first',
  'ERCOT energy storage opportunities',
  'Covered calls strategy for dividend portfolios',
  'Blue Ocean in B2B business development',
  'Longevity biomarkers — what to track',
  'Passive income structures under $500K',
  'Semiconductor supply chain after Chip War',
];

const SOURCE_LIBRARY = [
  { name: 'Peter Attia', domain: 'Longevity/Medicine', type: 'Thinker', color: '#ff8844' },
  { name: 'Andrew Huberman', domain: 'Neuroscience/Performance', type: 'Thinker', color: '#44ffcc' },
  { name: 'Naval Ravikant', domain: 'Wealth/Philosophy', type: 'Thinker', color: '#6366F1' },
  { name: 'Chris Miller', domain: 'Geopolitics/Tech', type: 'Author', color: '#00FFB2' },
  { name: 'Warren Buffett', domain: 'Investing', type: 'Author', color: '#ffcc44' },
  { name: 'Jocko Willink', domain: 'Leadership', type: 'Author', color: '#ff6644' },
  { name: 'The Hustle', domain: 'Business News', type: 'Newsletter', color: '#ff44cc' },
  { name: 'Axios', domain: 'News/Policy', type: 'Newsletter', color: '#4488ff' },
];

export default function ResearchHub() {
  const { graph, research, setResearch } = useApp();
  const [activeThread, setActiveThread] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const startThread = async (query, saved = false) => {
    const thread = {
      id: uid(),
      title: query.slice(0, 60) + (query.length > 60 ? '...' : ''),
      query,
      status: saved ? 'saved' : 'active',
      createdAt: Date.now(),
      tags: [],
      messages: [],
    };
    const updated = [thread, ...research];
    setResearch(updated);
    await saveResearch(updated);
    setActiveThread(thread.id);
    setMessages([]);
    setShowNewThread(false);
    setNewQuery('');
    // auto-open with first response
    await sendMessage(thread.id, updated, query, []);
  };

  const sendMessage = async (threadId, threads, text, prevMessages) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    const newMsgs = [...prevMessages, userMsg];
    setMessages(newMsgs);
    setSearchInput('');
    setLoading(true);

    try {
      const system = CB_SPINE + '\n\nMODE: TRUTH & RESEARCH HUB\nYour job: cut through narrative, surface signal, flag bias, give CB the contrarian insight most people miss. End every response with: (1) Truth Score (1-10, how confident you are in this), (2) Bias Flags (sources or narratives to be skeptical of), (3) Decisive Bet (what CB should do with this information). Be rigorous.';
      const reply = await callClaude({ system, messages: newMsgs.map(m => ({ role: m.role, content: m.content })), searchEnabled });
      const assistantMsg = { role: 'assistant', content: reply };
      const finalMsgs = [...newMsgs, assistantMsg];
      setMessages(finalMsgs);

      // save messages to thread
      const updatedThreads = threads.map(t => t.id === threadId ? { ...t, messages: finalMsgs } : t);
      setResearch(updatedThreads);
      await saveResearch(updatedThreads);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Try again.' }]);
    }
    setLoading(false);
  };

  const openThread = (thread) => {
    setActiveThread(thread.id);
    setMessages(thread.messages || []);
    if ((thread.messages || []).length === 0) {
      sendMessage(thread.id, research, thread.query, []);
    }
  };

  const deleteThread = async (id) => {
    const updated = research.filter(t => t.id !== id);
    setResearch(updated);
    await saveResearch(updated);
    if (activeThread === id) { setActiveThread(null); setMessages([]); }
  };

  // Thread list view
  if (!activeThread) return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#6366F1', textTransform: 'uppercase', marginBottom: 6 }}>Truth & Research Hub</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", marginBottom: 4 }}>Deep Intelligence Search</div>
          <div style={{ fontSize: 11, color: '#445' }}>CB-style. Every response: Truth Score · Bias Flags · Decisive Bet.</div>
        </div>
        <div onClick={() => setShowNewThread(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6366F1, #00FFB2)', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#000', cursor: 'pointer', whiteSpace: 'nowrap' }}>+ New Thread</div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#0c0c18', border: '1px solid #6366F130', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <span style={{ fontSize: 16, color: '#6366F1' }}>🔭</span>
          <input value={newQuery} onChange={e => setNewQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && newQuery.trim() && startThread(newQuery)}
            placeholder="Research a topic, question, or opportunity..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#c8d4e0', fontFamily: 'inherit' }} />
          <div onClick={() => setSearchEnabled(s => !s)} style={{ fontSize: 9, padding: '4px 9px', border: `1px solid ${searchEnabled ? '#4488ff' : '#1e2a38'}`, borderRadius: 8, color: searchEnabled ? '#4488ff' : '#334', cursor: 'pointer', whiteSpace: 'nowrap' }}>🔍 Web {searchEnabled ? 'ON' : 'OFF'}</div>
          {newQuery.trim() && <div onClick={() => startThread(newQuery)} style={{ padding: '7px 14px', background: '#6366F1', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Research →</div>}
        </div>
        {/* suggestions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SEARCH_SUGGESTIONS.map(s => (
            <div key={s} onClick={() => startThread(s)} style={{ fontSize: 10, padding: '4px 10px', background: '#0c0c18', border: '1px solid #1e2a38', color: '#445', borderRadius: 20, cursor: 'pointer' }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Research threads */}
        <div>
          <Label color="#6366F1">Research Threads</Label>
          {research.length === 0 && <div style={{ fontSize: 12, color: '#334', padding: '24px 0' }}>No research threads yet. Start one above.</div>}
          {research.map(t => (
            <Card key={t.id} color="#6366F1" onClick={() => openThread(t)} style={{ marginBottom: 10, cursor: 'pointer', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.4 }}>{t.title}</div>
                  <div style={{ fontSize: 10, color: '#334' }}>{timeAgo(t.createdAt)} · {(t.messages || []).filter(m => m.role === 'assistant').length} responses</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 10 }}>
                  <Badge color={t.status === 'active' ? '#00FFB2' : '#445'}>{t.status}</Badge>
                  <div onClick={e => { e.stopPropagation(); deleteThread(t.id); }} style={{ fontSize: 11, color: '#334', cursor: 'pointer', padding: '2px 4px' }}>✕</div>
                </div>
              </div>
              {t.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 5 }}>
                  {t.tags.map(tag => <span key={tag} style={{ fontSize: 8, color: '#445', background: '#1e2a38', padding: '2px 6px', borderRadius: 3 }}>{tag}</span>)}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Source Library */}
        <div>
          <Label color="#6366F1">Source Library</Label>
          {SOURCE_LIBRARY.map(s => (
            <div key={s.name} style={{ padding: '10px 12px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.name}</div>
                <Badge color={s.color}>{s.type}</Badge>
              </div>
              <div style={{ fontSize: 10, color: '#334', marginTop: 4 }}>{s.domain}</div>
            </div>
          ))}
        </div>
      </div>

      {showNewThread && (
        <Modal title="New Research Thread" accent="#6366F1" onClose={() => setShowNewThread(false)}>
          <Textarea value={newQuery} onChange={setNewQuery} placeholder="What do you want to research? Be specific — the more context, the better the response." rows={4} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => setShowNewThread(false)} style={{ flex: 1, padding: '11px', border: '1px solid #1e2a38', borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#445', cursor: 'pointer' }}>Cancel</div>
            <div onClick={() => newQuery.trim() && startThread(newQuery)} style={{ flex: 2, padding: '11px', background: '#6366F1', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Research →</div>
          </div>
        </Modal>
      )}
    </div>
  );

  // Active thread view
  const thread = research.find(t => t.id === activeThread);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Thread header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div onClick={() => setActiveThread(null)} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 4 }}>← Research Hub</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', maxWidth: 500 }}>{thread?.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => setSearchEnabled(s => !s)} style={{ fontSize: 9, padding: '4px 9px', border: `1px solid ${searchEnabled ? '#4488ff' : '#1e2a38'}`, borderRadius: 8, color: searchEnabled ? '#4488ff' : '#334', cursor: 'pointer' }}>🔍 Web {searchEnabled ? 'ON' : 'OFF'}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 160px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 18, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: 760, margin: '0 auto 18px' }}>
            {msg.role === 'user' ? (
              <div style={{ background: '#12122a', border: '1px solid #2a2a45', borderRadius: '16px 16px 4px 16px', padding: '11px 15px', maxWidth: '80%', fontSize: 13, lineHeight: 1.7, color: '#c0d0e0' }}>{msg.content}</div>
            ) : (
              <div style={{ background: '#0c0c18', border: '1px solid #6366F120', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', maxWidth: '94%', width: '100%' }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: '#6366F1', textTransform: 'uppercase', marginBottom: 10 }}>Research · Truth-First Analysis</div>
                <MD text={msg.content} color="#6366F1" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: 760, margin: '0 auto 18px' }}>
            <div style={{ background: '#0c0c18', border: '1px solid #6366F120', borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
              <div style={{ fontSize: 8, letterSpacing: 3, color: '#6366F1', textTransform: 'uppercase', marginBottom: 8 }}>Researching...</div>
              <ThinkingDots color="#6366F1" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'sticky', bottom: 0, background: '#08080f', borderTop: '1px solid #1a1a2e', padding: '10px 16px 16px' }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 760, margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(activeThread, research, searchInput, messages); } }}
            rows={1} placeholder="Follow-up question, contrarian challenge, or deeper dive..."
            style={{ flex: 1, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 12, padding: '10px 14px', color: '#c8d4e0', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 100 }} />
          <button onClick={() => sendMessage(activeThread, research, searchInput, messages)} disabled={!searchInput.trim() || loading}
            style={{ padding: '10px 16px', background: searchInput.trim() ? '#6366F1' : '#1a1a2e', border: 'none', borderRadius: 10, color: searchInput.trim() ? '#fff' : '#333', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>→</button>
        </div>
      </div>
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: '100%', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, padding: '10px 14px', color: '#c8d4e0', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.65, boxSizing: 'border-box', marginBottom: 14 }} />
  );
}
