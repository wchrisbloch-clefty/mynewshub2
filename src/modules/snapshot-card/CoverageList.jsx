// ─── COVERAGE LIST ────────────────────────────────────────────────────────────
// The shared "every article in the cluster" list — publisher · byline · precise
// relative time, capped to `max` per publisher then a "Show all" toggle. Used by
// both the SnapshotCard Full Coverage disclosure and the Perspectives panel, so
// there is ONE sources view, never a duplicate.
import { useState } from 'react';

export function relTime(d) {
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

export function CoverageList({ members = [], max = 2 }) {
  const [all, setAll] = useState(false);
  const shown = all ? members : diversify(members, max);
  return (
    <div className="snap-cov-list">
      {shown.map((m, i) => (
        <a key={m.link || i} className="snap-cov-item" href={m.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
          <div className="snap-cov-line">
            <span className="snap-cov-pub">{m.source}</span>
            {m.author && <span className="snap-cov-by">{m.author}</span>}
            <span className="snap-cov-time">{relTime(m.pubDate)}</span>
          </div>
          <div className="snap-cov-hl">{m.title}</div>
        </a>
      ))}
      {!all && members.length > shown.length && (
        <button className="snap-cov-all" onClick={() => setAll(true)}>Show all {members.length} articles</button>
      )}
    </div>
  );
}
