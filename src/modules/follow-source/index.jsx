// ─── FOLLOW SOURCE ────────────────────────────────────────────────────────────
// A tiny "+ Follow" affordance shown next to a source name (article byline /
// source tag / Coverage Gap outlet) when that source isn't already in the
// reader's followed sources. Tapping it follows the source in place — no need to
// leave the feed or open Customize (Pass G item 7).
//
// The host (App) supplies { isSourceFollowed, followSource } via context so the
// chip can drop into any module (SnapshotCard, StateOfPlay, …) without threading
// callbacks through every call site.

import { createContext, useContext } from 'react';
import './follow-source.css';

export const FollowSourceContext = createContext(null);

export function FollowSourceChip({ name, url, className = '' }) {
  const ctx = useContext(FollowSourceContext);
  if (!ctx || !name) return null;
  // Already following (or nothing to offer) → render nothing.
  if (ctx.isSourceFollowed(name)) return null;
  return (
    <button
      type="button"
      className={`follow-src-chip ${className}`}
      title={`Follow ${name}`}
      onClick={e => { e.stopPropagation(); ctx.followSource(name, url); }}
    >
      + Follow
    </button>
  );
}
