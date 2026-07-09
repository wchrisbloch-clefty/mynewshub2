// ─── STATE OF PLAY ────────────────────────────────────────────────────────────
// A scannable strip that ranks clustered stories by heat and lists the top few as
// numbered headlines. Fully app-agnostic: category theming and date formatting are
// INJECTED, so it has no dependency on any CATS table or app util.
//
// Props:
//   items       (array)  clustered articles ({ title, link, pubDate, _clusterSize })
//   meta        ({ color, label })  accent color + display label for the section
//   onRead      (fn)     called with an article when a row is tapped
//   formatDate  (fn)     (pubDate) -> string; defaults to a locale time string
//
// Renders nothing when fewer than 3 items. Styling: co-located StateOfPlay.css +
// design tokens (src/styles/tokens.css).

import { useMemo } from 'react';
import { rankClusters } from '../clustering';
import './StateOfPlay.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

export function StateOfPlay({ items, meta = {}, onRead, formatDate = defaultFormatDate }) {
  const color = meta.color;
  const label = meta.label || '';
  // Ranked by heat, capped at 2 per publisher (no single-source flood).
  const top = useMemo(() => rankClusters(items, { max: 2, limit: 5 }), [items]);

  if (top.length < 3) return null;

  return (
    <section className="sop-strip">
      <div className="sop-head">
        <span className="sop-label" style={{ borderColor: color, color }}>State of Play</span>
        <span className="sop-sub">{label} — what’s driving the day</span>
      </div>
      <div className="sop-list">
        {top.map((a, i) => (
          <button key={a.link || i} className="sop-item" onClick={() => onRead(a)}>
            <span className="sop-num" style={{ color }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="sop-item-title">{a.title}</span>
            <span className="sop-item-meta">
              {a._clusterSize > 1 && <span className="sop-item-sources">{a._clusterSize} sources</span>}
              <span className="sop-item-time">{formatDate(a.pubDate)}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
