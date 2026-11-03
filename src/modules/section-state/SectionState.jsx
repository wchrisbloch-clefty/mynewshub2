// Shared per-section loading + error states (Batch M, M3). One component used by the
// mobile sectioned Home AND reusable on desktop/iPad pages, so a slow or failed category
// never leaves a large blank block: a reserved-height skeleton while loading, and a
// compact inline error row ("Couldn't load Energy · Retry", ≤64px) on failure whose
// Retry re-fetches ONLY that category. No app imports, no tokens hard-coded beyond the
// co-located CSS (which consumes design tokens).
import './section-state.css';

// Reserved-height skeleton that mirrors a section's final layout (optional lead + N rows),
// so content swapping in does not shift the page (CLS).
export function SectionSkeleton({ rows = 3, lead = false, label = '' }) {
  return (
    <div className="sect-skel" aria-busy="true" aria-label={label ? `Loading ${label}` : 'Loading'}>
      {lead && <div className="sect-skel-lead" />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sect-skel-row">
          <div className="sect-skel-thumb" />
          <div className="sect-skel-lines"><span /><span /></div>
        </div>
      ))}
    </div>
  );
}

// Compact inline failure row (≤64px) with a working Retry that re-fetches only this section.
export function SectionError({ label, onRetry }) {
  return (
    <div className="sect-error" role="alert">
      <span className="sect-error-text">Couldn’t load {label}</span>
      <button className="sect-error-retry" type="button" onClick={onRetry}>Retry</button>
    </div>
  );
}
