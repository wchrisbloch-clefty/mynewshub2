import { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function TopBar() {
  const { activeModule, setActiveModule, graph, projects, chatOpen, setChatOpen, searchQuery, setSearchQuery, isMobile } = useApp();
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef(null);

  const currentNav = NAV_ITEMS.find(n => n.id === activeModule);
  const accent = currentNav?.accent || '#00FFB2';

  const activeProjects = (projects || []).filter(p => p.status === 'active').length;
  const totalTopics = Object.keys(graph?.topics || {}).length;

  // search suggestions
  const allTopics = Object.values(graph?.topics || {}).map(t => ({ label: t.title, type: 'topic', module: 'learn' }));
  const projSuggestions = (projects || []).map(p => ({ label: p.title, type: 'project', module: 'projects' }));
  const all = [...allTopics, ...projSuggestions];
  const filtered = searchQuery.length > 1 ? all.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6) : [];

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [mobileSearchOpen]);

  if (isMobile) {
    return (
      <header style={{
        height: 56,
        borderBottom: '1px solid #1a1a2e',
        background: '#08080f',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}>
        {/* Mobile search overlay */}
        {mobileSearchOpen ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            background: '#08080f',
            borderBottom: '1px solid #1a1a2e',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 10,
            zIndex: 30,
          }}>
            <input
              ref={mobileSearchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics, projects, notes..."
              style={{
                flex: 1,
                background: '#0c0c18',
                border: `1px solid ${accent}60`,
                borderRadius: 10,
                padding: '8px 14px',
                color: '#c8d4e0',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div
              onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
              style={{ fontSize: 14, color: '#445', cursor: 'pointer', padding: '4px 6px', flexShrink: 0 }}
            >✕</div>
            {filtered.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 16,
                right: 16,
                background: '#0c0c18',
                border: '1px solid #1e2a38',
                borderRadius: 10,
                overflow: 'hidden',
                zIndex: 100,
              }}>
                {filtered.map((s, i) => (
                  <div key={i} onClick={() => { setActiveModule(s.module); setSearchQuery(''); setMobileSearchOpen(false); }}
                    style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
                    <span style={{ fontSize: 9, color: s.type === 'project' ? '#ff8844' : '#00FFB2', background: s.type === 'project' ? '#ff884420' : '#00FFB220', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.type}</span>
                    <span style={{ fontSize: 12, color: '#c8d4e0' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Title area */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Fraunces', serif", letterSpacing: -0.3 }}>Aether</div>
          <div style={{ fontSize: 9, color: accent, letterSpacing: 1, textTransform: 'uppercase' }}>{currentNav?.label || ''}</div>
        </div>

        {/* Search icon */}
        <div
          onClick={() => setMobileSearchOpen(true)}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#0c0c18',
            border: '1px solid #1e2a38',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 15,
            color: '#445',
            flexShrink: 0,
          }}
        >⌕</div>

        {/* Chat toggle */}
        <div
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: chatOpen ? 'linear-gradient(135deg, #00FFB2, #6366F1)' : '#0c0c18',
            border: `1px solid ${chatOpen ? 'transparent' : '#1e2a38'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >{chatOpen ? '✕' : '💬'}</div>
      </header>
    );
  }

  // Desktop / Tablet
  return (
    <header style={{
      height: 56,
      borderBottom: '1px solid #1a1a2e',
      background: '#08080f',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      position: 'relative',
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Module title */}
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 0.3 }}>{currentNav?.label || 'Aether'}</div>
        <div style={{ fontSize: 9, color: '#334', letterSpacing: 1 }}>
          {activeModule === 'home' && `${totalTopics} topics · ${activeProjects} active projects`}
          {activeModule === 'learn' && `${totalTopics} topics tracked`}
          {activeModule === 'projects' && `${activeProjects} active`}
          {activeModule === 'research' && 'truth-first intelligence'}
          {activeModule === 'vault' && 'your knowledge base'}
          {activeModule === 'growth' && 'compounding daily'}
        </div>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0c0c18', border: `1px solid ${searchFocused ? accent + '60' : '#1e2a38'}`, borderRadius: 10, padding: '7px 14px', transition: 'border-color 0.15s' }}>
          <span style={{ fontSize: 11, color: '#334', flexShrink: 0 }}>⌕</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search topics, projects, notes..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: '#c8d4e0', fontFamily: 'inherit' }}
          />
          {searchQuery && <span onClick={() => setSearchQuery('')} style={{ fontSize: 10, color: '#445', cursor: 'pointer' }}>✕</span>}
        </div>
        {filtered.length > 0 && searchFocused && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 10, overflow: 'hidden', zIndex: 100 }}>
            {filtered.map((s, i) => (
              <div key={i} onClick={() => { setActiveModule(s.module); setSearchQuery(''); }}
                style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
                <span style={{ fontSize: 9, color: s.type === 'project' ? '#ff8844' : '#00FFB2', background: s.type === 'project' ? '#ff884420' : '#00FFB220', padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{s.type}</span>
                <span style={{ fontSize: 12, color: '#c8d4e0' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Quick stats chips */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: '#445', padding: '4px 10px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 20 }}>
          🔥 {graph?.streak || 0}d streak
        </div>
        <div style={{ fontSize: 10, color: '#445', padding: '4px 10px', background: '#0c0c18', border: '1px solid #1e2a38', borderRadius: 20 }}>
          ⚡ {Math.round((graph?.totalTime || 0) / 60)}h logged
        </div>
      </div>

      {/* Chat toggle */}
      <div
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: chatOpen ? 'linear-gradient(135deg, #00FFB2, #6366F1)' : '#0c0c18',
          border: `1px solid ${chatOpen ? 'transparent' : '#1e2a38'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 14,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        title="Intelligence Chat"
      >
        {chatOpen ? '✕' : '💬'}
      </div>
    </header>
  );
}
