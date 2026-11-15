// src/modules/voices/VoiceFinderModal.jsx — the Voices SOURCE FINDER result sheet (AC2).
//
// Reuses the ResolveModal (E2) shell + tokens; one row anatomy (Z3): name · role, one reason
// line, an Evidence ↗ link, a neutral "Suggested · unverified" chip, and Add. Nothing is auto-
// accepted — Add hands the candidate to the existing E2 confirm flow (handles are confirmed,
// never guessed). Every non-list state (loading / disabled-no-key / error / empty) uses the same
// quiet status language and never shows red.
import './ResolveModal.css';
import './VoiceFinderModal.css';

export function VoiceFinderModal({ state, onAdd, onClose, onRetry }) {
  if (!state) return null;
  const { category, loading, data } = state;
  const disabled = data && data.enabled === false;
  const errored = data && !disabled && data.error;
  const candidates = (data && Array.isArray(data.candidates)) ? data.candidates : [];
  return (
    <div className="vr-overlay" onClick={onClose}>
      <div className="vr-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label={`Find voices for ${category}`}>
        <div className="vr-head">
          <span className="vr-title">Find voices · {category}</span>
          <button className="vr-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="vr-sub">Suggestions from a web search — <strong>unverified</strong>. Check the evidence, then Add to confirm handles yourself. Nothing here is followed automatically.</div>

        {loading && <div className="vr-empty">Searching the web…</div>}

        {!loading && disabled && (
          <div className="vr-empty">{(data && data.note) || 'Source finder is off until FIRECRAWL_API_KEY is set in Vercel.'}</div>
        )}

        {!loading && !disabled && errored && (
          <div className="vr-empty">Couldn’t fetch suggestions just now ({String(data.error)}). {onRetry && <button className="vf-link" onClick={onRetry}>Try again</button>}</div>
        )}

        {!loading && !disabled && !errored && candidates.length === 0 && (
          <div className="vr-empty">No clear suggestions found for this category. {onRetry && <button className="vf-link" onClick={onRetry}>Try again</button>}</div>
        )}

        {!loading && !disabled && !errored && candidates.map((c) => (
          <div key={c.voiceId} className="vf-row">
            <div className="vf-main">
              <div className="vf-top">
                <span className="vf-name">{c.name}</span>
                <span className="vf-type">{c.type}</span>
                <span className="vf-chip">Suggested · unverified</span>
              </div>
              {c.role && <div className="vf-role">{c.role}</div>}
              {c.whyRelevant && <div className="vf-why">{c.whyRelevant}</div>}
              {c.evidenceUrl && <a className="vf-ev" href={c.evidenceUrl} target="_blank" rel="noreferrer">Evidence ↗</a>}
            </div>
            <button className="vf-add" onClick={() => onAdd(c)}>Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}
