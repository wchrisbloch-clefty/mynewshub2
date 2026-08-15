// ─── X PULSE — client component ───────────────────────────────────────────────
// Inline "street-level" X (Twitter) sentiment for a topic string, as an EXPLICIT,
// USER-TRIGGERED layer: nothing is fetched until the reader taps the collapsed
// trigger (cost control — it never auto-fires per feed item). Once tapped it fetches
// (8s cap) and, being fail-soft, shows takes if any and an unobtrusive "no signal"
// line otherwise — it never errors or blocks whatever it's embedded in.
//
// Governance: everything here is tier INFERRED, labeled "alternative perspective",
// never mixed unlabeled with verified/reported sources, never used to raise a story's
// confidence — only to show contrast.
//
// Props:
//   topic     (string)  required — what to read the room on ("Kentucky", "Markets")
//   variant   (string?) 'reader' tightens spacing for use inside a modal
//   endpoint  (string?) serverless route; defaults to '/api/x-pulse'
//
// Server half: api/x-pulse.js (a single self-contained Vercel function; must live
// under api/ for the platform to route it). Needs only XAI_API_KEY in the env.
// Styling: co-located XPulse.css.

import { useState, useEffect } from 'react';
import './XPulse.css';

export function XPulse({ topic, variant, endpoint = '/api/x-pulse' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [done, setDone] = useState(false);

  // The component is reused across feed positions and the reader — reset when the
  // topic changes so a new story starts collapsed (and never inherits stale takes).
  useEffect(() => { setOpen(false); setLoading(false); setData(null); setDone(false); }, [topic]);

  if (!topic) return null;

  async function load(e) {
    e && e.stopPropagation();
    if (done) { setOpen(o => !o); return; }   // already fetched — just toggle
    setOpen(true); setLoading(true);
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(`${endpoint}?topic=${encodeURIComponent(topic)}`, { signal: ctrl.signal });
      if (r.ok) {
        const d = await r.json();
        if (d && Array.isArray(d.takes) && d.takes.length) setData(d);
      }
    } catch { /* fail-soft: no throw, no block */ }
    finally { clearTimeout(to); setLoading(false); setDone(true); }
  }

  // Collapsed affordance — NO network call until this is tapped.
  if (!open) {
    return (
      <button className={`xp-trigger ${variant === 'reader' ? 'x-pulse-reader' : ''}`} onClick={load}>
        <span className="xp-badge">𝕏 Pulse</span>
        <span className="xp-trigger-label">See the street reaction · alternative perspective</span>
      </button>
    );
  }

  const s = data?.sentiment || 'n/a';
  const sentClass = s === 'bullish' ? 'xp-bull' : s === 'bearish' ? 'xp-bear' : 'xp-neutral';
  const sentLabel = s === 'bullish' ? 'Bullish' : s === 'bearish' ? 'Bearish' : s === 'mixed' ? 'Mixed' : 'Neutral';
  return (
    <div className={`x-pulse ${variant === 'reader' ? 'x-pulse-reader' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="xp-head">
        <span className="xp-badge">𝕏 Pulse</span>
        {data && <span className={`xp-sent ${sentClass}`}>{sentLabel}</span>}
        <span className="xp-note">alternative perspective · inferred, unverified street signal</span>
        <button className="xp-close" onClick={() => setOpen(false)} aria-label="Hide X Pulse">×</button>
      </div>
      {loading && <div className="xp-loading">Reading the room…</div>}
      {!loading && data && (
        <div className="xp-takes">
          {data.takes.slice(0, 3).map((t, i) => (
            <a key={i} className="xp-take" href={t.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              <span className="xp-handle">{t.handle || '@x'}</span>
              <span className="xp-text">{t.text}</span>
            </a>
          ))}
        </div>
      )}
      {!loading && !data && <div className="xp-empty">No street signal available right now.</div>}
    </div>
  );
}
