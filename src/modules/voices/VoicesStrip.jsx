// src/modules/voices/VoicesStrip.jsx — the per-page Voices tiles (E3).
//
// <=4 tiles, ranked by velocity upstream, labeled "Voices · inferred" with a platform
// badge, who, age and a one-line title. Clicking a tile opens the platform in a NEW TAB —
// there is NO in-app reader and NO AI here. A failing source is named (not a broken tile).
// Governance: every tile is inferred/social; velocity only orders, never raises the tier.
import { useState } from 'react';
import './VoicesStrip.css';

const BADGE = { x: 'X', twitter: 'X', instagram: 'IG', linkedin: 'LI', tiktok: 'TT', youtube: 'YT', reddit: 'Reddit' };
const age = h => h == null ? '' : h < 1 ? 'now' : h < 24 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;

export function VoicesStrip({ tiles = [], failures = [], loading = false, sidebar = true, hasX = false, xLoaded = false, onLoadX }) {
  const [showFail, setShowFail] = useState(false);
  if (!loading && !tiles.length && !failures.length && !hasX) return null;
  return (
    <section className={`voices-strip${sidebar ? ' voices-sidebar' : ''}`}>
      <div className="voices-head">
        <span className="voices-label">Voices</span>
        <span className="voices-inferred" title="Social/discussion signal — unverified. Velocity never raises trust.">· inferred</span>
      </div>
      {/* G5: skeleton reserves height while loading; honest "No signals yet" otherwise. */}
      {loading && !tiles.length && (
        <div className="voices-list" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="voices-tile voices-skel">
              <span className="voices-skel-badge"/>
              <span className="voices-tile-main"><span className="voices-skel-line" style={{ width: '45%' }}/><span className="voices-skel-line" style={{ width: '90%' }}/></span>
            </div>
          ))}
        </div>
      )}
      {!loading && !tiles.length && <div className="voices-empty">No signals yet</div>}
      <div className="voices-list">
        {tiles.slice(0, 4).map((t, i) => (
          <a key={t.url || i} className="voices-tile" href={t.url} target="_blank" rel="noreferrer">
            <span className="voices-badge">{BADGE[t.platform] || t.platform}</span>
            <span className="voices-tile-main">
              <span className="voices-who">{t.who}{t.age != null || t.ageHours != null ? <span className="voices-age"> · {age(t.ageHours)}</span> : null}</span>
              <span className="voices-tile-title">{t.title}</span>
            </span>
          </a>
        ))}
      </div>
      {/* E6: X stays click-to-load (it costs money) — never auto-fetched. */}
      {hasX && !xLoaded && onLoadX && (
        <button className="voices-loadx" onClick={onLoadX}>＋ Load X posts</button>
      )}
      {failures.length > 0 && (
        <button className="voices-fail" onClick={() => setShowFail(s => !s)}>
          {failures.length} source{failures.length === 1 ? '' : 's'} unavailable
          {showFail && <span className="voices-fail-detail">{failures.map((f, i) => <span key={i}>{f.source}: {f.reason}</span>)}</span>}
        </button>
      )}
    </section>
  );
}
