// ─── SNAPSHOT CARD ────────────────────────────────────────────────────────────
// A deduped story card: category accent bar, source/badge meta row, Archivo
// headline, Public Sans snippet, "N sources" row, and a Save button. Clicking the
// card calls onRead (host decides what "read" means). App-agnostic: category
// theming and date formatting are INJECTED.
//
// Props:
//   a              (article)  { title, source, pubDate, desc?, img?, matchedKw?, isAlert?, _clusterSize?, _clusterMembers? }
//   meta           ({ color, bg })  accent color + tint for the category
//   isSaved        (bool)     saved state
//   onSave(a)      (fn)       toggle save
//   onRead(a)      (fn)       open/read
//   onPerspectives (fn)       (a) -> open the Perspectives panel (sources + X Pulse + AI)
//   formatDate     (fn)       (pubDate) -> string
//
// Styling: co-located SnapshotCard.css + design tokens (src/styles/tokens.css).

import { useState } from 'react';
import './SnapshotCard.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

export function SnapshotCard({ a, meta = {}, isSaved, onSave, onRead, onPerspectives, formatDate = defaultFormatDate }) {
  const color = meta.color;
  const bg = meta.bg;
  const [imgErr, setImgErr] = useState(false);
  const topKw = a.matchedKw?.[0] || null;
  const multi = a._clusterSize > 1;
  return (
    <article className={`snap-card ${a.isAlert ? 'snap-breaking' : ''}`} onClick={() => onRead(a)}>
      <span className="snap-accent" style={{ background: color }} />
      <div className="snap-main">
        <div className="snap-meta">
          <span className="snap-source" style={{ color }}>{a.source}</span>
          {a.author && <span className="snap-byline">{a.author}</span>}
          {a.isAlert && <span className="snap-live">● LIVE</span>}
          {topKw && <span className="snap-tag" style={{ background: bg, color }}>{topKw}</span>}
          <span className="snap-time">{formatDate(a.pubDate)}</span>
        </div>
        <h3 className="snap-title">{a.title}</h3>
        {a.desc && <p className="snap-snippet">{a.desc}</p>}
        <div className="snap-foot">
          {multi
            ? <button className="snap-sources snap-sources-btn"
                onClick={e => { e.stopPropagation(); onPerspectives?.(a); }}>
                <strong>{a._clusterSize} sources</strong> · Perspectives
                <svg className="snap-cov-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            : <span className="snap-single">{a.source}</span>}
          <button className={`snap-save ${isSaved ? 'saved' : ''}`}
            onClick={e => { e.stopPropagation(); onSave(a); }} aria-label={isSaved ? 'Saved' : 'Save'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>
      {a.img && !imgErr && <img className="snap-thumb" src={a.img} loading="lazy" alt="" onError={() => setImgErr(true)} />}
    </article>
  );
}
