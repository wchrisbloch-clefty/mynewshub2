// AG2: "Right now across outlets" — a compact, collapsible glance (one row per pinned outlet, its
// lead headline + time). No thumbnails. Lazy-loaded (not first paint). Never affects ranking/tier.
// Alt outlets keep the "Alternative perspective" chip and obey the Show-alt toggle. A failed outlet
// shows a neutral "unavailable" row, never an error wall.
import { useState } from 'react';
import { selectAcross, PINNED_OUTLETS } from './select';
import { isAlt as isAltSource } from '../ranking';
import './AcrossOutlets.css';

const PHONE = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width:640px)').matches;

export function AcrossOutlets({ items, cat, showAlt = true, onRead, formatDate }) {
  const pinned = PINNED_OUTLETS[cat];
  // default: open on iPad/desktop, collapsed (first 4) on phone
  const [expanded, setExpanded] = useState(!PHONE);
  if (!pinned || !pinned.length) return null;
  let rows = selectAcross(items, pinned);
  // Show-alt OFF hides alt outlets entirely (they never appear without the chip).
  if (!showAlt) rows = rows.filter(r => !isAltSource(r.outlet));
  // Nothing to show at all (no outlet carried anything) → render nothing (no empty box).
  if (!rows.some(r => r.item)) return null;
  const shown = expanded ? rows : rows.slice(0, 4);

  return (
    <section className="across" aria-label="Right now across outlets">
      <div className="across-head"><span className="across-label">Right now across outlets</span></div>
      {shown.map(r => {
        const alt = isAltSource(r.outlet);
        if (!r.item) return (
          <div key={r.outlet} className="across-row across-row-off">
            <span className="across-outlet">{r.outlet}</span>
            <span className="across-unavail">unavailable</span>
          </div>
        );
        return (
          <button key={r.outlet} className="across-row" onClick={() => onRead(r.item)}>
            <span className="across-outlet">{r.outlet}{alt && <span className="snap-alt across-alt">Alternative perspective</span>}</span>
            <span className="across-title">{r.item.title}</span>
            <span className="across-meta">{r.isTop ? '' : 'latest · '}{formatDate ? formatDate(r.item.pubDate) : ''}</span>
          </button>
        );
      })}
      {!expanded && rows.length > 4 && (
        <button className="across-more" onClick={() => setExpanded(true)}>See all outlets ({rows.length})</button>
      )}
    </section>
  );
}
