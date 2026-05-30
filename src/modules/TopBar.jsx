import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function TopBar() {
  const {
    activeModule, setActiveModule,
    graph, projects,
    chatOpen, setChatOpen,
    searchQuery, setSearchQuery,
    setChatPrefill,
    isMobile,
    theme, toggleTheme,
  } = useApp();

  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const currentNav = NAV_ITEMS.find(n => n.id === activeModule);
  const accent = currentNav?.accent || '#00FFB2';

  const allTopics = Object.values(graph?.topics || {}).map(t => ({ label: t.title, type: 'topic', module: 'learn' }));
  const projItems = (projects || []).map(p => ({ label: p.title, type: 'project', module: 'projects' }));
  const all = [...allTopics, ...projItems];
  const filtered = searchQuery.length > 1
    ? all.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];
  const showAiRow = searchQuery.length > 2;

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setChatPrefill(searchQuery.trim());
    setChatOpen(true);
    setSearchQuery('');
    setSearchFocused(false);
  };

  // ─── Shared elements ───────────────────────────────────────────────────────
  const themeBtn = (
    <button onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13, flexShrink: 0, outline: 'none' }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );

  // ─── Search dropdown ────────────────────────────────────────────────────────
  const searchDropdown = searchFocused && (filtered.length > 0 || showAiRow) ? (
    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.28)' }}>
      {showAiRow && (
        <div onClick={handleSearchSubmit}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: filtered.length > 0 ? '1px solid var(--bord2)' : 'none', background: `${accent}0a` }}>
          <span style={{ fontSize: 13 }}>✦</span>
          <div>
            <div style={{ fontSize: 12, color: accent, fontWeight: 700 }}>Ask AI: "{searchQuery}"</div>
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 1 }}>Opens Intelligence Chat · Press ↵ Enter</div>
          </div>
        </div>
      )}
      {filtered.map((s, i) => (
        <div key={i} onClick={() => { setActiveModule(s.module); setSearchQuery(''); }}
          style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid var(--bord2)' : 'none' }}>
          <span style={{ fontSize: 9, color: s.type === 'project' ? '#ff8844' : '#00FFB2', background: s.type === 'project' ? '#ff884418' : '#00FFB218', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{s.type}</span>
          <span style={{ fontSize: 12, color: 'var(--text-b)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  ) : null;

  // ─── Nav tabs (shared between mobile and desktop) ───────────────────────────
  const navTabs = (
    <div style={{ display: 'flex', padding: isMobile ? '0 6px' : '0 16px', borderBottom: '1px solid var(--bord2)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', minWidth: 0 }}>
      {NAV_ITEMS.map(item => {
        const active = activeModule === item.id;
        return (
          <button key={item.id} onClick={() => setActiveModule(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: isMobile ? '8px 10px' : '9px 15px',
              fontSize: isMobile ? 11 : 12,
              fontWeight: active ? 700 : 500,
              color: active ? item.accent : 'var(--muted)',
              border: 'none',
              borderBottom: `2px solid ${active ? item.accent : 'transparent'}`,
              background: 'transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              marginBottom: -1,
              outline: 'none',
              flexShrink: 0,
              transition: 'color 0.12s',
            }}>
            <span style={{ fontSize: isMobile ? 12 : 13 }}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );

  // ─── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <header style={{ background: 'var(--bg)', flexShrink: 0, zIndex: 20, position: 'relative' }}>
        {/* Row 1: brand + icons */}
        <div style={{ height: 50, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, borderBottom: '1px solid var(--bord2)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', fontFamily: "'Fraunces', serif", letterSpacing: -0.5 }}>Aether</div>
          </div>
          {themeBtn}
          <button onClick={() => setChatOpen(o => !o)}
            style={{ padding: '0 11px', height: 30, borderRadius: 7, background: chatOpen ? 'linear-gradient(135deg,#00FFB2,#6366F1)' : 'var(--surface)', border: `1px solid ${chatOpen ? 'transparent' : 'var(--border)'}`, color: chatOpen ? '#000' : 'var(--subtle)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {chatOpen ? '✕' : '💬 Chat'}
          </button>
        </div>
        {/* Row 2: search */}
        <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--bord2)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: `1px solid ${searchFocused ? accent + '55' : 'var(--border)'}`, borderRadius: 8, padding: '6px 12px', transition: 'border-color 0.15s' }}>
            <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>⌕</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Ask anything — AI answers instantly..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-b)', fontFamily: 'inherit' }} />
            {searchQuery && (
              <span onClick={handleSearchSubmit} style={{ fontSize: 10, color: accent, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>Ask →</span>
            )}
          </div>
          {searchDropdown}
        </div>
        {/* Row 3: nav tabs */}
        {navTabs}
      </header>
    );
  }

  // ─── Desktop / tablet layout ─────────────────────────────────────────────────
  return (
    <header style={{ background: 'var(--bg)', flexShrink: 0, zIndex: 20, position: 'relative' }}>
      {/* Row 1 */}
      <div style={{ height: 54, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, borderBottom: '1px solid var(--bord2)' }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', fontFamily: "'Fraunces', serif", letterSpacing: -0.5 }}>Aether</div>
          <div style={{ fontSize: 7, letterSpacing: 3, color: '#00FFB2', textTransform: 'uppercase' }}>Intelligence Hub</div>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--bord2)', flexShrink: 0 }} />

        {/* AI Search */}
        <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: `1px solid ${searchFocused ? accent + '60' : 'var(--border)'}`, borderRadius: 9, padding: '7px 14px', transition: 'border-color 0.15s' }}>
            <span style={{ fontSize: 11, color: 'var(--dim)', flexShrink: 0 }}>⌕</span>
            <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Ask anything — AI-powered search..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-b)', fontFamily: 'inherit' }} />
            {searchQuery
              ? <span onClick={handleSearchSubmit} style={{ fontSize: 10, color: accent, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>Ask AI →</span>
              : <span style={{ fontSize: 9, color: 'var(--dim)', background: 'var(--bord2)', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>↵</span>
            }
          </div>
          {searchDropdown}
        </div>

        <div style={{ flex: 1 }} />

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, whiteSpace: 'nowrap' }}>
            🔥 {graph?.streak || 0}d streak
          </div>
          <div style={{ fontSize: 10, color: 'var(--subtle)', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, whiteSpace: 'nowrap' }}>
            ⏱ {Math.round((graph?.totalTime || 0) / 60)}h
          </div>
        </div>

        {themeBtn}

        <button onClick={() => setChatOpen(o => !o)}
          style={{ padding: '0 14px', height: 32, borderRadius: 8, background: chatOpen ? 'linear-gradient(135deg,#00FFB2,#6366F1)' : 'var(--surface)', border: `1px solid ${chatOpen ? 'transparent' : 'var(--border)'}`, color: chatOpen ? '#000' : 'var(--subtle)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', outline: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {chatOpen ? '✕ Close' : '💬 AI Chat'}
        </button>
      </div>

      {/* Row 2: Nav tabs */}
      {navTabs}
    </header>
  );
}
