// ─── X PULSE — client component ───────────────────────────────────────────────
// Inline "street-level" X (Twitter) sentiment for a topic string. Fetches AFTER
// paint (deferred 400ms), caps at 8s, and renders NOTHING on any error / timeout /
// empty result — so it can never block or delay whatever it's embedded in.
//
// Props:
//   topic     (string)  required — what to read the room on ("Kentucky", "Markets")
//   variant   (string?) 'reader' tightens spacing for use inside a modal
//   endpoint  (string?) serverless route; defaults to '/api/x-pulse'
//
// Server half: api/x-pulse.js (a single self-contained Vercel function; must live
// under api/ for the platform to route it). Needs only XAI_API_KEY in the env.
// Styling: .x-pulse / .xp-* classes (currently in the host app's global stylesheet).

import { useState, useEffect } from 'react';

export function XPulse({ topic, variant, endpoint = '/api/x-pulse' }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!topic) return;
    let alive = true;
    const defer = setTimeout(async () => {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      try {
        const r = await fetch(`${endpoint}?topic=${encodeURIComponent(topic)}`, { signal: ctrl.signal });
        if (r.ok) {
          const d = await r.json();
          if (alive && d && Array.isArray(d.takes) && d.takes.length) setData(d);
        }
      } catch { /* fail silently */ }
      finally { clearTimeout(to); }
    }, 400);
    return () => { alive = false; clearTimeout(defer); };
  }, [topic, endpoint]);

  if (!data || !data.takes?.length) return null;
  const s = data.sentiment || 'n/a';
  const sentClass = s === 'bullish' ? 'xp-bull' : s === 'bearish' ? 'xp-bear' : 'xp-neutral';
  const sentLabel = s === 'bullish' ? 'Bullish' : s === 'bearish' ? 'Bearish' : s === 'mixed' ? 'Mixed' : 'Neutral';
  return (
    <div className={`x-pulse ${variant === 'reader' ? 'x-pulse-reader' : ''}`} onClick={e => e.stopPropagation()}>
      <div className="xp-head">
        <span className="xp-badge">𝕏 Pulse</span>
        <span className={`xp-sent ${sentClass}`}>{sentLabel}</span>
        <span className="xp-note">street-level reaction · unverified</span>
      </div>
      <div className="xp-takes">
        {data.takes.slice(0, 3).map((t, i) => (
          <a key={i} className="xp-take" href={t.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
            <span className="xp-handle">{t.handle || '@x'}</span>
            <span className="xp-text">{t.text}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
