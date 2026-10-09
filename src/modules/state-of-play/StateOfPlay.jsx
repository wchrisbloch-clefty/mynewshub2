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
//   breakingItems (array)  Urgent stories ({ title, link, pubDate, source }). Folded in at
//                        the TOP of the list, tagged "Breaking" with a red pulse — so the
//                        cramped status-strip marquee is retired and State of Play is the
//                        single stop for "what's happening" (Pass L item 3).
//
// Renders nothing when fewer than 3 ranked items AND no breaking items. Styling:
// co-located StateOfPlay.css + design tokens (src/styles/tokens.css).

import { useMemo } from 'react';
import { rankClusters } from '../clustering';
import { FollowSourceChip } from '../follow-source';
import './StateOfPlay.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

// G7f item 4: Ask is a QUIET icon-only button in list rows — the "Ask" word only appears
// on hover/focus (and the full control shows in the reader/lead). Keeps a 44px touch
// target on mobile and an aria-label always.
function AskBtn({ onAsk, item }) {
  return (
    <button className="sop-ask" onClick={e => { e.stopPropagation(); onAsk(item); }}
      aria-label="Ask about this story" title="Ask the assistant">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span className="sop-ask-label">Ask</span>
    </button>
  );
}

export function StateOfPlay({ items, meta = {}, onRead, onAsk, formatDate = defaultFormatDate, collapsed = false, onToggleCollapse, gapItems = [], breakingItems = [], variant = 'strip' }) {
  const color = meta.color;
  const label = meta.label || '';
  const sidebar = variant === 'sidebar';
  // Ranked by heat, capped at 2 per publisher (no single-source flood).
  const top = useMemo(() => rankClusters(items, { max: 2, limit: 5 }), [items]);
  // Coverage-Gap rows fold into the same list (top 3), continuing the count.
  const gaps = (gapItems || []).slice(0, 3);
  // Breaking rows fold in at the TOP (top 3), tagged with a red pulse.
  const breaking = (breakingItems || []).slice(0, 3);

  // Need a real ranked list OR something breaking to hang the module on.
  if (top.length < 3 && !breaking.length) return null;

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
        {breaking.map((b, i) => (
          <div key={b.link || `brk-${i}`} className="sop-item sop-item-breaking" role="button" tabIndex={0}
            onClick={() => onRead(b)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRead(b); } }}
            title={b._breakingWhy ? `Breaking — ${b._breakingWhy}` : 'Breaking'}>
            <span className="sop-brk-dot" aria-hidden="true"/>
            <span className="sop-item-title">{b.title}</span>
            <span className="sop-item-meta">
              {/* G7f item 3: one breaking signal — plain red "BREAKING" eyebrow (no filled
                  pill) + the age only. The red dot (left) carries the colour. */}
              <span className="sop-brk-tag">Breaking</span>
              <span className="sop-item-time">{formatDate(b.pubDate)}</span>
              {onAsk && <AskBtn onAsk={onAsk} item={b}/>}
            </span>
          </div>
        ))}
        {top.map((a, i) => (
          <div key={a.link || i} className="sop-item" role="button" tabIndex={0}
            onClick={() => onRead(a)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRead(a); } }}>
            <span className="sop-num" style={{ color }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="sop-item-title">{a.title}</span>
            <span className="sop-item-meta">
              {a._clusterSize > 1 && <span className="sources-tag sop-item-sources">{a._clusterSize} sources</span>}
              <span className="sop-item-time">{formatDate(a.pubDate)}</span>
              {onAsk && <AskBtn onAsk={onAsk} item={a}/>}
            </span>
          </div>
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
