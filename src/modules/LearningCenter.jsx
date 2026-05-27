import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.jsx';
import {
  KNOWN_BOOKS, TYPE_META, ENTRY_MODES, SESSION_MODES, ACCEPT_TYPES,
} from '../constants.js';
import {
  buildSystem, buildQuizPrompt, callClaude, buildApiMessages,
  logSession, saveGraph, extractYouTubeId, fetchYouTubeTranscript,
  fetchYouTubeMeta, processFiles,
} from '../utils.js';
import MD from './shared/MD.jsx';
import QuizMode from './shared/QuizMode.jsx';
import { Btn, Input, Textarea, Label, Card, Badge, ThinkingDots, BottomSheet } from './shared/Common.jsx';

// ─── SUBSCREEN TYPES ──────────────────────────────────────────────────────
// home | book-select | book-mode | doc-upload | topic-input | youtube-input | session | progress

export default function LearningCenter() {
  const { graph, setGraph } = useApp();
  const [screen, setScreen] = useState('home');
  const [entryMode, setEntryMode] = useState(null);
  const [sessionMode, setSessionMode] = useState('chat');
  const [context, setContext] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [webUrl, setWebUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [customBook, setCustomBook] = useState({ title: '', author: '', type: 'other' });
  const [topicInput, setTopicInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const accentColor = ENTRY_MODES.find(m => m.id === entryMode)?.color || '#00FFB2';
  const bookColor = context.book?.color || accentColor;
  const currentAccent = entryMode === 'book' ? bookColor : accentColor;
  const sessionTitle = entryMode === 'book' ? context.book?.title : entryMode === 'topic' ? context.topic : entryMode === 'youtube' ? context.title : 'Document';

  // ── SEND ────────────────────────────────────────────────────────────────
  const send = async (text, attachments = []) => {
    if ((!text.trim() && attachments.length === 0) || loading) return;
    const userMsg = { role: 'user', content: text, attachments };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setUploadedFiles([]);
    setLoading(true);
    try {
      const apiMessages = await buildApiMessages(newHistory);
      const system = buildSystem(entryMode, sessionMode, context, graph);
      const reply = await callClaude({ system, messages: apiMessages, searchEnabled });
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Try again.' }]);
    }
    setLoading(false);
  };

  // ── AUTO OPEN ────────────────────────────────────────────────────────────
  const autoOpen = async (eMode, sMode, ctx) => {
    setMessages([]);
    setSessionStart(Date.now());
    setLoading(true);
    const openers = {
      book: {
        package:   `I want the full intelligence package for "${ctx.book?.title}". Propose the right format and ask about depth. Be decisive.`,
        readalong: `I'm reading "${ctx.book?.title}". Set up read-along — structural map first, then ask where I am.`,
        reference: `I'm using "${ctx.book?.title}" as reference. Give master-expert orientation: what domains surround it, what insight most people miss. Ask what I want to go deep on.`,
        socratic:  `Start the Socratic session on "${ctx.book?.title}". Begin immediately — first question now.`,
        chat:      `Let's talk about "${ctx.book?.title}". Sharpest single insight most people miss, then ask what's on my mind.`,
      },
      document: 'I\'ve uploaded a document. Analyze completely, teach in CB style, connect to my mental models and goals. Tell me what to act on.',
      topic:    sMode === 'socratic' ? `Start Socratic mode on the topic: "${ctx.topic}". First question now. No preamble.` : `I want to learn about "${ctx.topic}". Master expert mode. Ask: full course outline first or specific module?`,
      youtube:  `YouTube video: "${ctx.title}" by ${ctx.channel}. ${ctx.transcriptAvailable ? 'Full transcript is in context.' : 'Transcript unavailable — use your knowledge.'} Teach me now in CB style.`,
    };
    const opener = eMode === 'book' ? (openers.book[sMode] || openers.book.chat) : openers[eMode];
    try {
      const system = buildSystem(eMode, sMode, ctx, graph);
      const reply = await callClaude({ system, messages: [{ role: 'user', content: opener }] });
      setMessages([{ role: 'assistant', content: reply }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Ready. What do you want to learn?' }]);
    }
    setLoading(false);
  };

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  const generateQuiz = async () => {
    setQuizLoading(true);
    try {
      const reply = await callClaude({ system: '', messages: [{ role: 'user', content: buildQuizPrompt(context, entryMode) }] });
      const clean = reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setQuizQuestions(parsed.questions || []);
      setQuizMode(true);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Quiz generation failed. Ask me to quiz you directly in chat.' }]);
    }
    setQuizLoading(false);
  };

  const onQuizComplete = (scores) => {
    const pct = Math.round((scores.filter(s => s > 0).length / scores.length) * 100);
    setQuizMode(false);
    setQuizQuestions([]);
    setMessages(prev => [...prev, { role: 'assistant', content: `**Quiz Complete — ${pct}% (${scores.filter(s => s > 0).length}/${scores.length})**\n\n${pct >= 80 ? 'Strong. You\'ve internalized the core material.' : pct >= 60 ? 'Solid foundation. A few gaps — review what you missed and come back.' : 'Early stages. This is data, not judgment. Run the quiz again after another pass.'}\n\nWant to go deeper on anything you missed, or move forward?` }]);
  };

  // ── YOUTUBE ────────────────────────────────────────────────────────────────
  const handleYouTube = async () => {
    if (!youtubeUrl.trim()) return;
    const videoId = extractYouTubeId(youtubeUrl.trim());
    if (!videoId) { setYtError('Invalid YouTube URL.'); return; }
    setYtLoading(true); setYtError('');
    const [meta, transcript] = await Promise.all([fetchYouTubeMeta(videoId), fetchYouTubeTranscript(videoId)]);
    const ctx = { url: youtubeUrl.trim(), videoId, title: meta?.title || 'YouTube Video', channel: meta?.author_name || 'Unknown', transcript: transcript || '', transcriptAvailable: !!(transcript && transcript.length > 100) };
    setContext(ctx); setEntryMode('youtube'); setScreen('session'); setYoutubeUrl('');
    autoOpen('youtube', sessionMode, ctx);
    setYtLoading(false);
  };

  // ── LOG SESSION ────────────────────────────────────────────────────────
  const handleLogSession = async (conf, notes) => {
    const durationMin = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : 5;
    const updated = await logSession(sessionTitle, entryMode, Math.max(durationMin, 1), conf, notes);
    setGraph(updated);
    setShowLogModal(false);
  };

  // ── QUICK PROMPTS ──────────────────────────────────────────────────────
  const quickPrompts = {
    book: {
      package:   ['Confirm format proposed', 'Go deeper on key framework', 'Connect to my mental models', 'Investment/business angle', 'Decisive action now'],
      readalong: ['What connects to my other books?', 'What to watch for next?', 'Master-expert breakdown', 'Connect to my goals', 'Spoil the next section'],
      reference: ['Go master-expert deep', 'CB application — my goals', 'What am I missing?', 'Clean framework extraction', 'Cross-book connection'],
      socratic:  ['Next question', 'Go harder', 'Explain what I got wrong', 'Quiz me on a different angle', 'Give me my scorecard'],
      chat:      ['Sharpest counterargument', 'Blue Ocean angle', 'What would Buffett say?', 'Connect to Chip War', 'One decisive action'],
    },
    document: ['Core thesis of this doc', 'Extract key frameworks', 'Connect to my goals', 'What to act on now', 'Build a course from this', 'Quiz me on this'],
    topic:    ['Full course outline', 'Start Module 1', 'Tipping point in this field', 'Blue Ocean opportunities', 'Best resources to go deeper', 'Decisive bet for my goals'],
    youtube:  ['3 biggest ideas from this', 'Connect to my mental models', 'What should I act on?', 'Go deeper on key framework', 'Quiz me on this video'],
  };

  const getQuickPrompts = () => entryMode === 'book' ? (quickPrompts.book[sessionMode] || quickPrompts.book.chat) : (quickPrompts[entryMode] || quickPrompts.topic);

  // ─────────────────────────────────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────────────────────────────────

  // HOME
  if (screen === 'home') return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: '#334', textTransform: 'uppercase', marginBottom: 6 }}>CB · Learning Center</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", letterSpacing: -0.5, marginBottom: 6 }}>What do you want to master?</div>
        <div style={{ fontSize: 11, color: '#445' }}>Books · Documents · Topics · YouTube — all tracked, all connected.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {ENTRY_MODES.map(m => (
          <Card key={m.id} color={m.color} onClick={() => {
            setEntryMode(m.id);
            setScreen(m.id === 'book' ? 'book-select' : m.id === 'document' ? 'doc-upload' : m.id === 'youtube' ? 'youtube-input' : 'topic-input');
          }} style={{ padding: '16px 18px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 24 }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 10, color: '#445', lineHeight: 1.55 }}>{m.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Progress Overview */}
      <div style={{ marginBottom: 16 }}>
        <Label>Knowledge Graph</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            ['Topics', Object.keys(graph?.topics || {}).length, '#00FFB2'],
            ['Sessions', (graph?.sessions || []).length, '#6366F1'],
            ['Minutes', graph?.totalTime || 0, '#ff8844'],
            ['Avg Conf', (Object.values(graph?.topics || {}).length ? Math.round(Object.values(graph.topics).reduce((s, t) => s + t.confidence, 0) / Object.values(graph.topics).length) : 0) + '/10', '#ffcc44'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: '#0c0c18', border: `1px solid ${color}20`, borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Fraunces', serif" }}>{val}</div>
              <div style={{ fontSize: 8, letterSpacing: 1.5, color: '#334', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Topic list */}
        {Object.values(graph?.topics || {}).slice(0, 5).map(t => (
          <div key={t.title} style={{ padding: '10px 14px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{t.title}</div>
              <div style={{ fontSize: 9, color: '#334', marginTop: 2 }}>{t.sessions} sessions · {t.totalMin}min</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.confidence >= 7 ? '#00FFB2' : t.confidence >= 4 ? '#ffcc44' : '#ff6644' }}>{t.confidence}/10</div>
              <div style={{ width: 50, background: '#1e2a38', borderRadius: 2, height: 2, marginTop: 4 }}>
                <div style={{ width: `${t.confidence * 10}%`, height: '100%', background: t.confidence >= 7 ? '#00FFB2' : t.confidence >= 4 ? '#ffcc44' : '#ff6644', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // BOOK SELECT
  if (screen === 'book-select') return (
    <div style={{ padding: '24px 28px 80px', maxWidth: 800, margin: '0 auto' }}>
      <div onClick={() => setScreen('home')} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 16 }}>← Back</div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#334', textTransform: 'uppercase', marginBottom: 14 }}>CB Reading List · {KNOWN_BOOKS.length} Books</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {['all', ...Object.keys(TYPE_META)].map(t => (
          <div key={t} onClick={() => setFilterType(t)}
            style={{ padding: '4px 12px', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', border: `1px solid ${filterType === t ? '#00FFB2' : '#1a1a2e'}`, color: filterType === t ? '#00FFB2' : '#445', borderRadius: 20, cursor: 'pointer', background: filterType === t ? '#00FFB218' : 'transparent' }}>
            {t === 'all' ? 'All' : TYPE_META[t]?.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
        {(filterType === 'all' ? KNOWN_BOOKS : KNOWN_BOOKS.filter(b => b.type === filterType)).map(book => (
          <div key={book.title} onClick={() => { setContext({ book }); setScreen('book-mode'); }}
            style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid #1a1a2e', background: '#0c0c18', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{book.title}</div>
              <div style={{ fontSize: 10, color: '#445' }}>{book.author}</div>
            </div>
            <div style={{ fontSize: 9, color: book.color, textAlign: 'right' }}>
              <div style={{ fontSize: 14 }}>{TYPE_META[book.type]?.icon}</div>
              <div style={{ marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>{TYPE_META[book.type]?.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add custom book */}
      <div style={{ padding: '20px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 12 }}>
        <Label>Add Any Book</Label>
        <Input label="Title *" value={customBook.title} onChange={v => setCustomBook(p => ({ ...p, title: v }))} placeholder="Book title..." />
        <Input label="Author" value={customBook.author} onChange={v => setCustomBook(p => ({ ...p, author: v }))} placeholder="Author name..." />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <div key={k} onClick={() => setCustomBook(p => ({ ...p, type: k }))}
              style={{ padding: '5px 10px', fontSize: 9, border: `1px solid ${customBook.type === k ? '#00FFB2' : '#1a1a2e'}`, color: customBook.type === k ? '#00FFB2' : '#445', borderRadius: 6, cursor: 'pointer', background: customBook.type === k ? '#00FFB215' : 'transparent' }}>
              {v.icon} {v.label}
            </div>
          ))}
        </div>
        <Btn color="#00FFB2" disabled={!customBook.title.trim()} onClick={() => {
          const colors = { leadership: '#ff6644', systems: '#00FFB2', business: '#ffcc44', negotiation: '#ff4488', memoir: '#88ff44', stoic: '#ffaa66', fiction: '#aa88ff', other: '#4488ff' };
          setContext({ book: { title: customBook.title, author: customBook.author || 'Unknown', type: customBook.type, color: colors[customBook.type] || '#00FFB2' } });
          setCustomBook({ title: '', author: '', type: 'other' });
          setScreen('book-mode');
        }}>Continue →</Btn>
      </div>
    </div>
  );

  // BOOK MODE
  if (screen === 'book-mode' && context.book) return (
    <div style={{ padding: '24px 28px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div onClick={() => setScreen('book-select')} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 16 }}>← Books</div>
      <div style={{ fontSize: 9, letterSpacing: 4, color: context.book.color, textTransform: 'uppercase', marginBottom: 6 }}>{TYPE_META[context.book.type]?.icon} {TYPE_META[context.book.type]?.label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: "'Fraunces', serif" }}>{context.book.title}</div>
      <div style={{ fontSize: 12, color: '#445', marginBottom: 28 }}>{context.book.author}</div>
      <Label>How do you want to engage?</Label>
      {SESSION_MODES.map(m => (
        <div key={m.id} onClick={() => { setSessionMode(m.id); setEntryMode('book'); setScreen('session'); autoOpen('book', m.id, context); }}
          style={{ padding: '14px 18px', borderRadius: 10, border: `1px solid ${m.id === 'socratic' ? `${context.book.color}40` : '#1a1a2e'}`, background: m.id === 'socratic' ? `${context.book.color}08` : '#0c0c18', marginBottom: 10, cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{m.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: m.id === 'socratic' ? context.book.color : '#fff', marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#445', lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // DOCUMENT UPLOAD
  if (screen === 'doc-upload') return (
    <div style={{ padding: '24px 28px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div onClick={() => setScreen('home')} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 16 }}>← Back</div>
      <div style={{ fontSize: 9, letterSpacing: 4, color: '#4488ff', textTransform: 'uppercase', marginBottom: 8 }}>📄 Document Intelligence</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, fontFamily: "'Fraunces', serif" }}>Upload Your Document</div>

      <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
        onDrop={async e => { e.preventDefault(); setDragOver(false); const files = await processFiles(e.dataTransfer.files); setUploadedFiles(p => [...p, ...files]); }}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? '#4488ff' : '#1e2a38'}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: dragOver ? '#4488ff08' : 'transparent' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: 12, color: '#fff', marginBottom: 3 }}>Drop files or tap to browse</div>
        <div style={{ fontSize: 10, color: '#445' }}>PDF · Word · Excel · PowerPoint · Images</div>
        <input ref={fileRef} type="file" multiple accept={ACCEPT_TYPES} style={{ display: 'none' }} onChange={async e => { const files = await processFiles(e.target.files); setUploadedFiles(p => [...p, ...files]); }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Label>Or Paste a Web Link</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={webUrl} onChange={e => setWebUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && webUrl.trim() && (setUploadedFiles(p => [...p, { type: 'url', url: webUrl, name: webUrl, icon: '🔗', label: 'Web Link' }]), setWebUrl(''))}
            placeholder="https://..."
            style={{ flex: 1, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, padding: '10px 14px', color: '#c8d4e0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => { if (webUrl.trim()) { setUploadedFiles(p => [...p, { type: 'url', url: webUrl, name: webUrl, icon: '🔗', label: 'Web Link' }]); setWebUrl(''); } }}
            style={{ padding: '10px 14px', background: '#4488ff', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {uploadedFiles.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <div style={{ flex: 1, fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <div onClick={() => setUploadedFiles(p => p.filter((_, j) => j !== i))} style={{ color: '#ff4444', cursor: 'pointer', fontSize: 14 }}>✕</div>
            </div>
          ))}
        </div>
      )}
      <Btn color="#4488ff" disabled={uploadedFiles.length === 0} onClick={() => { setContext({ files: uploadedFiles }); setEntryMode('document'); setScreen('session'); autoOpen('document', sessionMode, { files: uploadedFiles }); }}>
        Analyze {uploadedFiles.length > 1 ? `${uploadedFiles.length} Documents` : 'Document'} →
      </Btn>
    </div>
  );

  // TOPIC INPUT
  if (screen === 'topic-input') return (
    <div style={{ padding: '24px 28px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div onClick={() => setScreen('home')} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 16 }}>← Back</div>
      <div style={{ fontSize: 9, letterSpacing: 4, color: '#ff8844', textTransform: 'uppercase', marginBottom: 8 }}>🎓 Topic / Course Builder</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, fontFamily: "'Fraunces', serif" }}>What do you want to master?</div>

      <Textarea value={topicInput} onChange={setTopicInput} rows={3}
        placeholder={'ERCOT energy markets\nReal estate underwriting\nSemiconductor supply chain\nNegotiation psychology'} />

      <div style={{ marginBottom: 16 }}>
        <Label>Mode</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'chat', label: 'Course Build' }, { id: 'socratic', label: '🧠 Quiz Me' }].map(m => (
            <div key={m.id} onClick={() => setSessionMode(m.id)}
              style={{ flex: 1, padding: '10px', border: `1px solid ${sessionMode === m.id ? '#ff8844' : '#1a1a2e'}`, borderRadius: 8, textAlign: 'center', fontSize: 11, color: sessionMode === m.id ? '#ff8844' : '#445', cursor: 'pointer', background: sessionMode === m.id ? '#ff884408' : 'transparent' }}>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['ERCOT energy markets', 'Real estate underwriting', 'Semiconductor supply chain', 'Options basics', 'Negotiation psychology', 'Longevity & biohacking', 'AI agents', 'Dividend investing'].map(s => (
          <div key={s} onClick={() => setTopicInput(s)} style={{ fontSize: 10, padding: '4px 10px', background: '#0c0c18', border: '1px solid #1e2a38', color: '#556', borderRadius: 20, cursor: 'pointer' }}>{s}</div>
        ))}
      </div>
      <Btn color="#ff8844" disabled={!topicInput.trim()} onClick={() => { setContext({ topic: topicInput }); setEntryMode('topic'); setScreen('session'); autoOpen('topic', sessionMode, { topic: topicInput }); }}>
        {sessionMode === 'socratic' ? 'Start Quiz →' : 'Build My Course →'}
      </Btn>
    </div>
  );

  // YOUTUBE INPUT
  if (screen === 'youtube-input') return (
    <div style={{ padding: '24px 28px 80px', maxWidth: 640, margin: '0 auto' }}>
      <div onClick={() => setScreen('home')} style={{ fontSize: 11, color: '#445', cursor: 'pointer', marginBottom: 16 }}>← Back</div>
      <div style={{ fontSize: 9, letterSpacing: 4, color: '#ff4444', textTransform: 'uppercase', marginBottom: 8 }}>▶️ YouTube Intelligence</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, fontFamily: "'Fraunces', serif" }}>Paste a YouTube URL</div>
      <Input label="YouTube URL" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/watch?v=..." />
      {ytError && <div style={{ fontSize: 11, color: '#ff4444', marginBottom: 12, padding: '8px 12px', background: '#ff444412', borderRadius: 6 }}>{ytError}</div>}
      <div style={{ marginBottom: 16 }}>
        <Label>Mode</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'chat', label: 'Teach Me' }, { id: 'socratic', label: '🧠 Quiz Me' }].map(m => (
            <div key={m.id} onClick={() => setSessionMode(m.id)}
              style={{ flex: 1, padding: '10px', border: `1px solid ${sessionMode === m.id ? '#ff4444' : '#1a1a2e'}`, borderRadius: 8, textAlign: 'center', fontSize: 11, color: sessionMode === m.id ? '#ff4444' : '#445', cursor: 'pointer', background: sessionMode === m.id ? '#ff444408' : 'transparent' }}>
              {m.label}
            </div>
          ))}
        </div>
      </div>
      <Btn color="#ff4444" disabled={!youtubeUrl.trim() || ytLoading} onClick={handleYouTube}>
        {ytLoading ? 'Fetching transcript...' : 'Analyze Video →'}
      </Btn>
    </div>
  );

  // SESSION
  if (screen === 'session') {
    const sessionModeLabel = SESSION_MODES.find(m => m.id === sessionMode);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Session Header */}
        <div style={{ padding: '10px 20px', background: '#08080f', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: currentAccent, textTransform: 'uppercase', marginBottom: 3 }}>
                {sessionModeLabel?.icon} {sessionModeLabel?.label}{sessionTitle ? ` · ${sessionTitle}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <div onClick={() => setSearchEnabled(s => !s)}
                  style={{ fontSize: 9, padding: '3px 8px', border: `1px solid ${searchEnabled ? '#4488ff' : '#1e2a38'}`, borderRadius: 10, color: searchEnabled ? '#4488ff' : '#334', cursor: 'pointer' }}>
                  🔍 Web {searchEnabled ? 'ON' : 'OFF'}
                </div>
                <div onClick={generateQuiz} style={{ fontSize: 9, padding: '3px 8px', border: `1px solid ${currentAccent}40`, borderRadius: 10, color: currentAccent, cursor: 'pointer', background: `${currentAccent}10` }}>
                  {quizLoading ? '...' : '🧠 Quiz'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <div onClick={() => setShowLogModal(true)} style={{ fontSize: 10, color: currentAccent, padding: '5px 10px', border: `1px solid ${currentAccent}40`, borderRadius: 6, cursor: 'pointer' }}>Log</div>
              <div onClick={() => { setScreen('home'); setContext({}); setMessages([]); setUploadedFiles([]); setQuizMode(false); }} style={{ fontSize: 10, color: '#445', padding: '5px 10px', border: '1px solid #1a1a2e', borderRadius: 6, cursor: 'pointer' }}>← Learn</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 200px' }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{ENTRY_MODES.find(m => m.id === entryMode)?.icon || '📚'}</div>
              <div style={{ fontSize: 13, color: '#333' }}>Initializing...</div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 18, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: 720, margin: '0 auto 18px' }}>
              {msg.role === 'user' ? (
                <div style={{ background: '#12122a', border: '1px solid #2a2a45', borderRadius: '16px 16px 4px 16px', padding: '11px 15px', maxWidth: '80%', fontSize: 13, lineHeight: 1.7, color: '#c0d0e0' }}>
                  {msg.content}
                </div>
              ) : (
                <div style={{ background: '#0c0c18', border: `1px solid ${currentAccent}18`, borderRadius: '4px 16px 16px 16px', padding: '14px 18px', maxWidth: '92%', width: '100%' }}>
                  <div style={{ fontSize: 8, letterSpacing: 3, color: currentAccent, textTransform: 'uppercase', marginBottom: 10 }}>CB Intelligence {searchEnabled ? '· 🔍 Web' : ''}</div>
                  <MD text={msg.content} color={currentAccent} />
                </div>
              )}
            </div>
          ))}
          {quizMode && quizQuestions.length > 0 && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <QuizMode questions={quizQuestions} color={currentAccent} onComplete={onQuizComplete} />
            </div>
          )}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 18, maxWidth: 720, margin: '0 auto 18px' }}>
              <div style={{ background: '#0c0c18', border: `1px solid ${currentAccent}18`, borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
                <div style={{ fontSize: 8, letterSpacing: 3, color: currentAccent, textTransform: 'uppercase', marginBottom: 8 }}>Thinking...</div>
                <ThinkingDots color={currentAccent} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Prompts */}
        {!quizMode && (
          <div style={{ position: 'sticky', bottom: 72, left: 0, right: 0, padding: '0 16px 6px', background: 'linear-gradient(transparent, #08080f 30%)', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {getQuickPrompts().map(p => (
              <div key={p} onClick={() => send(p)} style={{ fontSize: 10, padding: '5px 12px', background: '#0c0c18', border: '1px solid #1a1a2e', color: '#445', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{p}</div>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ position: 'sticky', bottom: 0, background: '#08080f', borderTop: '1px solid #1a1a2e', padding: '8px 16px 16px' }}>
          {uploadedFiles.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {uploadedFiles.map((f, i) => (
                <div key={i} style={{ fontSize: 9, color: '#4488ff', background: '#4488ff12', border: '1px solid #4488ff30', borderRadius: 5, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {f.icon} {f.name.slice(0, 16)}<span onClick={() => setUploadedFiles(p => p.filter((_, j) => j !== i))} style={{ color: '#ff4444', cursor: 'pointer' }}>✕</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto', alignItems: 'flex-end' }}>
            <div onClick={() => fileRef.current?.click()} style={{ padding: '9px 11px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 9, cursor: 'pointer', color: '#445', fontSize: 14, flexShrink: 0 }}>📎</div>
            <input ref={fileRef} type="file" multiple accept={ACCEPT_TYPES} style={{ display: 'none' }} onChange={async e => { const files = await processFiles(e.target.files); setUploadedFiles(p => [...p, ...files]); }} />
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input, uploadedFiles); } }}
              rows={1} placeholder="Ask anything, drop a file, or use a quick prompt..."
              style={{ flex: 1, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 12, padding: '10px 14px', color: '#c8d4e0', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'none', maxHeight: 100 }} />
            <button onClick={() => send(input, uploadedFiles)} disabled={(!input.trim() && uploadedFiles.length === 0) || loading}
              style={{ padding: '10px 16px', background: (input.trim() || uploadedFiles.length > 0) && !loading ? currentAccent : '#1a1a2e', border: 'none', borderRadius: 10, color: (input.trim() || uploadedFiles.length > 0) && !loading ? '#000' : '#333', fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>→</button>
          </div>
        </div>

        {/* Log Modal */}
        {showLogModal && <LogSessionModal title={sessionTitle} color={currentAccent} onLog={handleLogSession} onSkip={() => setShowLogModal(false)} />}
      </div>
    );
  }

  return null;
}

function LogSessionModal({ title, onLog, onSkip, color }) {
  const [conf, setConf] = useState(7);
  const [notes, setNotes] = useState('');
  return (
    <BottomSheet title={`Log: ${title}`} accent={color} onClose={onSkip}>
      <div style={{ marginBottom: 16 }}>
        <Label>Confidence Level: {conf}/10</Label>
        <input type="range" min={1} max={10} value={conf} onChange={e => setConf(+e.target.value)} style={{ width: '100%', accentColor: color }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#334', marginTop: 4 }}>
          <span>Just started</span><span>Fuzzy</span><span>Solid</span><span>Mastered</span>
        </div>
      </div>
      <Textarea value={notes} onChange={setNotes} placeholder="Key insight or note (optional)..." rows={2} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div onClick={onSkip} style={{ flex: 1, padding: '11px', border: '1px solid #1e2a38', borderRadius: 10, textAlign: 'center', fontSize: 12, color: '#445', cursor: 'pointer' }}>Skip</div>
        <div onClick={() => onLog(conf, notes)} style={{ flex: 2, padding: '11px', background: color, borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#000', cursor: 'pointer' }}>Log Session →</div>
      </div>
    </BottomSheet>
  );
}
