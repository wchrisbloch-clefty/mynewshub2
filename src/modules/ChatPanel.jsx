import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.jsx';
import { CHAT_MODES } from '../constants.js';
import { callClaude, buildApiMessages, buildSystem, processFiles, getFileIcon } from '../utils.js';
import MD from './shared/MD.jsx';
import { ThinkingDots, Label } from './shared/Common.jsx';

const QUICK_PROMPTS = {
  home: ['What should I focus on today?', 'Connect my top 3 learnings', 'Where is the biggest Blue Ocean right now?', 'Give me a decisive action for this week'],
  learn: ['Cross-reference my recent learning', 'What mental model applies here?', 'Find the tipping point', 'What am I missing?'],
  research: ['Contrarian view on this topic', 'What would the market get wrong?', 'Strip the narrative — what\'s true?', 'Blue Ocean angle'],
  projects: ['What knowledge applies to my active projects?', 'Where should I focus next 30 days?', 'What\'s the compounding play here?', 'Biggest risk I\'m ignoring?'],
  vault: ['Synthesize my strongest connections', 'What\'s the thread across my notes?', 'Turn my notes into a decisive action', 'Gap analysis — what am I missing?'],
  growth: ['Rate my learning stack honestly', 'What skill compounds most in 3 years?', 'Stoic lens on where I am', 'Extreme Ownership moment — what do I own?'],
};

export default function ChatPanel() {
  const { chatOpen, setChatOpen, activeModule, graph, projects, isMobile } = useApp();
  const [chatMode, setChatMode] = useState('synthesis');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    if ((!text.trim() && attachments.length === 0) || loading) return;
    const userMsg = { role: 'user', content: text, attachments };
    const newHist = [...messages, userMsg];
    setMessages(newHist);
    setInput('');
    setAttachments([]);
    setLoading(true);

    try {
      const system = buildSystem(null, null, { chatMode }, graph);
      const apiMsgs = await buildApiMessages(newHist);
      const reply = await callClaude({ system, messages: apiMsgs });
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Try again.' }]);
    }
    setLoading(false);
  };

  const handleFiles = async (files) => {
    const processed = await processFiles(files);
    setAttachments(prev => [...prev, ...processed]);
  };

  const mode = CHAT_MODES.find(m => m.id === chatMode);
  const prompts = QUICK_PROMPTS[activeModule] || QUICK_PROMPTS.home;

  if (!chatOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: isMobile ? '100%' : 360,
      height: isMobile ? 'calc(100vh - 60px)' : '100vh',
      background: '#080812',
      borderLeft: isMobile ? 'none' : '1px solid #1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      zIndex: isMobile ? 200 : 50,
      animation: 'slideInRight 0.22s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif" }}>Intelligence Chat</div>
            <div style={{ fontSize: 9, color: '#00FFB2', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>{mode?.icon} {mode?.label}</div>
          </div>
          <div onClick={() => setChatOpen(false)} style={{ fontSize: 13, color: '#445', cursor: 'pointer', padding: '2px 5px' }}>✕</div>
        </div>
        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
          {CHAT_MODES.map(m => (
            <div key={m.id} onClick={() => setChatMode(m.id)} title={m.desc}
              style={{ fontSize: 9, padding: '4px 8px', borderRadius: 6, border: `1px solid ${chatMode === m.id ? '#00FFB2' : '#1e2a38'}`, color: chatMode === m.id ? '#00FFB2' : '#445', cursor: 'pointer', background: chatMode === m.id ? '#00FFB210' : 'transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {m.icon} {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, marginBottom: 6 }}>{mode?.label} Mode</div>
            <div style={{ fontSize: 10, color: '#334', lineHeight: 1.7 }}>{mode?.desc}</div>
            <div style={{ marginTop: 16 }}>
              <Label>Quick prompts</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {prompts.map(p => (
                  <div key={p} onClick={() => send(p)}
                    style={{ fontSize: 11, padding: '8px 12px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, color: '#556', cursor: 'pointer', textAlign: 'left', lineHeight: 1.5 }}>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 14, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.15s ease' }}>
            {msg.role === 'user' ? (
              <div style={{ background: '#12122a', border: '1px solid #2a2a45', borderRadius: '14px 14px 3px 14px', padding: '9px 13px', maxWidth: '88%', fontSize: 12, lineHeight: 1.65, color: '#c0d0e0' }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ background: '#0c0c18', border: '1px solid #00FFB220', borderRadius: '3px 14px 14px 14px', padding: '12px 14px', maxWidth: '96%' }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: '#00FFB2', textTransform: 'uppercase', marginBottom: 8 }}>Aether · {mode?.label}</div>
                <MD text={msg.content} color="#00FFB2" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
            <div style={{ background: '#0c0c18', border: '1px solid #00FFB220', borderRadius: '3px 14px 14px 14px', padding: '12px 14px' }}>
              <div style={{ fontSize: 8, letterSpacing: 3, color: '#00FFB2', textTransform: 'uppercase', marginBottom: 8 }}>Thinking...</div>
              <ThinkingDots color="#00FFB2" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div style={{ padding: '6px 14px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {attachments.map((a, i) => (
            <div key={i} style={{ fontSize: 9, color: '#4488ff', background: '#4488ff12', border: '1px solid #4488ff25', borderRadius: 5, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              {a.icon} {a.name.slice(0, 14)}
              <span onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} style={{ color: '#ff4444', cursor: 'pointer' }}>✕</span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '10px 12px 14px', borderTop: '1px solid #1a1a2e', flexShrink: 0 }}>
        {messages.length > 0 && (
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 8, paddingBottom: 2 }}>
            {prompts.slice(0, 3).map(p => (
              <div key={p} onClick={() => send(p)}
                style={{ fontSize: 9, padding: '3px 9px', background: '#0c0c18', border: '1px solid #1e2a38', color: '#445', borderRadius: 14, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {p}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
          <div onClick={() => fileRef.current?.click()} style={{ padding: '8px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, cursor: 'pointer', color: '#445', fontSize: 13, flexShrink: 0 }}>📎</div>
          <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1} placeholder="Ask anything..."
            style={{ flex: 1, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 10, padding: '8px 12px', color: '#c8d4e0', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 80 }} />
          <button onClick={() => send(input)} disabled={!input.trim() && attachments.length === 0}
            style={{ padding: '8px 13px', background: input.trim() ? '#00FFB2' : '#1a1a2e', border: 'none', borderRadius: 9, color: input.trim() ? '#000' : '#334', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>→</button>
        </div>
      </div>
    </div>
  );
}
