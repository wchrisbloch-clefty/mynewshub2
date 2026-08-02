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
//   gapItems    (array)  Coverage-Gap stories ({ title, link, outlets, source, outletCount }) —
//                        widely-covered stories none of the reader's own sources carried.
//                        Folded into this same ranked list as extra rows, tagged
//                        "Not in your sources" — no separate panel.
//
// Renders nothing when fewer than 3 ranked items and no gap items. Styling:
// co-located StateOfPlay.css + design tokens (src/styles/tokens.css).

import { useMemo } from 'react';
import { rankClusters } from '../clustering';
import { FollowSourceChip } from '../follow-source';
import './StateOfPlay.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

export function StateOfPlay({ items, meta = {}, onRead, formatDate = defaultFormatDate, collapsed = false, onToggleCollapse, gapItems = [], variant = 'strip' }) {
  const color = meta.color;
  const label = meta.label || '';
  const sidebar = variant === 'sidebar';
  // Ranked by heat, capped at 2 per publisher (no single-source flood).
  const top = useMemo(() => rankClusters(items, { max: 2, limit: 5 }), [items]);
  // Coverage-Gap rows fold into the same list (top 3), continuing the count.
  const gaps = (gapItems || []).slice(0, 3);

  // Need a real ranked list to hang the module on; a couple of gap rows alone
  // isn't a "State of Play".
  if (top.length < 3) return null;

  return (
    <section className={`sop-strip${sidebar ? ' sop-sidebar' : ''}`}>
      <div className="sop-head">
        <span className="sop-label" style={{ borderColor: color, color }}>State of Play</span>
        {!sidebar && <span className="sop-sub">{label} — what’s driving the day</span>}
        {onToggleCollapse && (
          <button className="sop-collapse" onClick={onToggleCollapse}
            aria-expanded={!collapsed} aria-label={collapsed ? 'Expand State of Play' : 'Collapse State of Play'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
      </div>
      <div className="sop-list" style={collapsed ? { display: 'none' } : undefined}>
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
        {gaps.map((g, i) => {
          const outlets = (g.outlets && g.outlets.length ? g.outlets : [g.source]).filter(Boolean);
          const num = String(top.length + i + 1).padStart(2, '0');
          const outletText = outlets.length > 0
            ? `${outlets.slice(0, 2).join(', ')}${g.outletCount > 2 ? ` +${g.outletCount - 2}` : ''}` : '';
          // Sidebar: stack the badge/outlets under the headline and put Follow on its
          // own right-aligned line — the inline row is too wide for 32% (Pass J item 2).
          if (sidebar) {
            return (
              <a key={g.link || `gap-${i}`} className="sop-item sop-item-gap sop-item-gap-stacked" href={g.link}
                target="_blank" rel="noreferrer">
                <div className="sop-gap-headline">
                  <span className="sop-num sop-num-gap">{num}</span>
                  <span className="sop-item-title">{g.title}</span>
                </div>
                <div className="sop-gap-below">
                  <span className="sop-gap-tag" style={{ borderColor: color, color }}>Not in your sources</span>
                  {outletText && <span className="sop-item-time">{outletText}</span>}
                </div>
                {outlets[0] && (
                  <div className="sop-gap-follow" onClick={e => e.preventDefault()}>
                    <FollowSourceChip name={outlets[0]}/>
                  </div>
                )}
              </a>
            );
          }
          return (
            <a key={g.link || `gap-${i}`} className="sop-item sop-item-gap" href={g.link}
              target="_blank" rel="noreferrer">
              <span className="sop-num sop-num-gap">{num}</span>
              <span className="sop-item-title">{g.title}</span>
              <span className="sop-item-meta">
                <span className="sop-gap-tag" style={{ borderColor: color, color }}>Not in your sources</span>
                {outletText && <span className="sop-item-time">{outletText}</span>}
                {/* Follow the lead outlet straight from the gap row (Pass G item 7). */}
                {outlets[0] && <FollowSourceChip name={outlets[0]}/>}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
