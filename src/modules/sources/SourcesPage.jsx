// ─── SOURCES DIRECTORY PAGE ───────────────────────────────────────────────────
// Extracted verbatim from App.jsx (I2). Pure module — every app dependency (arts, feeds,
// the openCustomize/handleTabChange handlers, and the CATS / SOURCE_URLS / IconGear
// references) is passed in as a prop, so it never reaches into App's closure. Styles are
// the global .sources-* / .source-* rules. Lazy-loaded + idle/hover-prefetched by App.
import { useState, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

export function SourcesPage({ arts, feeds, openCustomize, handleTabChange, CATS, SOURCE_URLS, IconGear }) {
  const [q, setQ] = useState('');
  const counts = useMemo(() => {
    const m = {};
    Object.values(arts).flat().forEach(a => { if (a.source) m[a.source] = (m[a.source] || 0) + 1; });
    return m;
  }, []);
  const CAT_ORDER = ['general', 'business', 'finance', 'bloom', 'tech', 'sports', 'popculture', 'comedy'];
  const ql = q.trim().toLowerCase();
  let totalSources = 0, activeSources = 0;
  CAT_ORDER.forEach(c => (feeds[c] || []).forEach(f => { totalSources++; if (f.on) activeSources++; }));
  return (
    <div className="page">
      <div className="sources-hero">
        <div>
          <h1 className="sources-title">News Sources</h1>
          <p className="sources-sub">{activeSources} active · {totalSources} feeds powering your hub</p>
        </div>
        <button className="sources-manage-btn" onClick={() => openCustomize('sources', 'general')}><IconGear/> Manage feeds</button>
      </div>
      <input className="sources-search" placeholder="Filter sources…" value={q} onChange={e => setQ(e.target.value)}/>
      <div className="sources-cat-grid">
        {CAT_ORDER.map(c => {
          const cc = CATS[c] || CATS.general;
          const list = (feeds[c] || []).filter(f => !ql || f.name.toLowerCase().includes(ql));
          if (!list.length) return null;
          const sorted = [...list].sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
          return (
            <div key={c} className="sources-cat">
              <button className="sources-cat-head" style={{ borderLeftColor: cc.color }} onClick={() => handleTabChange(c)}>

                <span className="sources-cat-label" style={{ color: cc.color }}>{cc.label}</span>
                <span className="sources-cat-count">{list.length}</span>
              </button>
              <div className="sources-list">
                {sorted.map(f => {
                  const url = SOURCE_URLS[f.name];
                  const n = counts[f.name] || 0;
                  return (
                    <a key={f.name} className={`source-row ${f.on ? '' : 'source-off'}`}
                      href={url || '#'} target="_blank" rel="noreferrer"
                      onClick={e => { if (!url) e.preventDefault(); }}>
                      <span className={`source-status ${f.on ? 'on' : 'off'}`} title={f.on ? 'Active' : 'Disabled'}/>
                      <span className="source-name">{f.name}</span>
                      {n > 0 && <span className="source-count" title={`${n} articles loaded`}>{n}</span>}
                      {url && <span className="source-ext"><ExternalLink size={11} aria-hidden="true"/></span>}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
