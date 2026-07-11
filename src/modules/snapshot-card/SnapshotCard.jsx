// ─── SNAPSHOT CARD ────────────────────────────────────────────────────────────
// A deduped story card: category accent bar, source/badge meta row, Archivo
// headline, Public Sans snippet, "N sources" row, and a Save button. Clicking the
// card calls onRead (host decides what "read" means). App-agnostic: category
// theming and date formatting are INJECTED.
//
// Props:
//   a           (article)  { title, source, pubDate, desc?, img?, matchedKw?, isAlert?, _clusterSize?, _clusterSources? }
//   meta        ({ color, bg })  accent color + tint for the category
//   isSaved     (bool)     saved state
//   onSave(a)   (fn)       toggle save
//   onRead(a)   (fn)       open/read
//   formatDate  (fn)       (pubDate) -> string
//
// Styling: co-located SnapshotCard.css + design tokens (src/styles/tokens.css).

import { useState } from 'react';
import './SnapshotCard.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

// Precise relative timestamp for the Full Coverage list.
function relTime(d) {
  if (!d) return '';
  const t = new Date(d).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
// Publisher diversity: at most `max` items per publisher (order preserved).
function diversify(list, max) {
  const c = {}, out = [];
  for (const m of list) { const p = (m.source || '').toLowerCase(); c[p] = (c[p] || 0) + 1; if (c[p] <= max) out.push(m); }
  return out;
}

export function SnapshotCard({ a, meta = {}, isSaved, onSave, onRead, formatDate = defaultFormatDate }) {
  const color = meta.color;
  const bg = meta.bg;
  const [imgErr, setImgErr] = useState(false);
  const [showCov, setShowCov] = useState(false);
  const [covAll, setCovAll] = useState(false);
  const topKw = a.matchedKw?.[0] || null;
  const multi = a._clusterSize > 1;
  const members = a._clusterMembers || [];
  const covShown = covAll ? members : diversify(members, 2);
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
            ? <button className="snap-sources snap-sources-btn" aria-expanded={showCov}
                onClick={e => { e.stopPropagation(); setShowCov(v => !v); }}>
                <strong>{a._clusterSize} sources</strong> · Full coverage
                <svg className={`snap-cov-caret ${showCov ? 'open' : ''}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            : <span className="snap-single">{a.source}</span>}
          <button className={`snap-save ${isSaved ? 'saved' : ''}`}
            onClick={e => { e.stopPropagation(); onSave(a); }} aria-label={isSaved ? 'Saved' : 'Save'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
        {showCov && multi && (
          <div className="snap-coverage" onClick={e => e.stopPropagation()}>
            <div className="snap-cov-head">
              <span className="snap-cov-title-lbl">Full Coverage · {a._clusterSize} sources</span>
              <button className="snap-cov-close" onClick={() => setShowCov(false)} aria-label="Close">×</button>
            </div>
            <div className="snap-cov-list">
              {covShown.map((m, i) => (
                <a key={m.link || i} className="snap-cov-item" href={m.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                  <div className="snap-cov-line">
                    <span className="snap-cov-pub">{m.source}</span>
                    {m.author && <span className="snap-cov-by">{m.author}</span>}
                    <span className="snap-cov-time">{relTime(m.pubDate)}</span>
                  </div>
                  <div className="snap-cov-hl">{m.title}</div>
                </a>
              ))}
            </div>
            {!covAll && members.length > covShown.length && (
              <button className="snap-cov-all" onClick={() => setCovAll(true)}>Show all {members.length} articles</button>
            )}
          </div>
        )}
      </div>
      {a.img && !imgErr && <img className="snap-thumb" src={a.img} loading="lazy" alt="" onError={() => setImgErr(true)} />}
    </article>
  );
}
