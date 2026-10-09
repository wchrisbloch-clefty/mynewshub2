// ─── SNAPSHOT CARD ────────────────────────────────────────────────────────────
// A deduped story card: category accent bar, source/badge meta row, Source Serif 4
// headline, Inter snippet, "N sources" row, and a Save button. Clicking the
// card calls onRead (host decides what "read" means). App-agnostic: category
// theming and date formatting are INJECTED.
//
// Props:
//   a              (article)  { title, source, pubDate, desc?, img?, matchedKw?, isAlert?, _clusterSize?, _clusterMembers? }
//   meta           ({ color, bg })  accent color + tint for the category
//   isSaved        (bool)     saved state
//   onSave(a)      (fn)       toggle save
//   onRead(a)      (fn)       open/read
//   onPerspectives (fn)       (a) -> open the Perspectives panel (sources + X Pulse + AI)
//   formatDate     (fn)       (pubDate) -> string
//
// Styling: co-located SnapshotCard.css + design tokens (src/styles/tokens.css).

import { useState } from 'react';
import { FollowSourceChip } from '../follow-source';
import { TierBadge } from '../provenance';
import './SnapshotCard.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

export function SnapshotCard({ a, meta = {}, isSaved, onSave, onRead, onPerspectives, onAsk, formatDate = defaultFormatDate, hideImage = false, lead = false, opinionLabel = null }) {
  const color = meta.color;
  const bg = meta.bg;
  const [imgErr, setImgErr] = useState(false);
  const topKw = a.matchedKw?.[0] || null;
  const multi = a._clusterSize > 1;
  // F2: a lead WITH an image renders as a hero — 16:9 cover image, a bottom-up dark
  // gradient, and the source + headline overlaid in white (meta in one fixed position).
  // The no-image lead keeps the D5 typographic treatment. Regular cards are unchanged.
  const hasImg = a.img && !imgErr && !hideImage;
  const heroImg = lead && hasImg;
  return (
    <article className={`snap-card ${a.isAlert ? 'snap-breaking' : ''}${lead ? ' snap-lead' : ''}${lead && !hasImg ? ' snap-lead-noimg' : ''}${heroImg ? ' snap-lead-hero' : ''}`} onClick={() => onRead(a)}>
      <span className="snap-accent" style={{ background: color }} />
      {heroImg && (
        <div className="snap-hero-media">
          <img className="snap-hero-img" src={a.img} loading="lazy" alt="" onError={() => setImgErr(true)} />
          <div className="snap-hero-overlay">
            <div className="snap-meta snap-hero-meta">
              <span className="snap-hero-source">{a.source}</span>
              {opinionLabel && <span className="snap-opinion">{opinionLabel}</span>}
              {a.isAlert && <span className="snap-live">● LIVE</span>}
              <span className="snap-hero-time">{formatDate(a.pubDate)}</span>
            </div>
            <h3 className="snap-title snap-hero-title">{a.title}</h3>
          </div>
        </div>
      )}
      <div className="snap-main">
        {!heroImg && (<>
        <div className="snap-meta">
          <span className="snap-source" style={{ color }}>{a.source}</span>
          <FollowSourceChip name={a.source} url={a.sourceUrl}/>
          {a.author && <span className="snap-byline">{a.author}</span>}
          {a.isAlert && <span className="snap-live">● LIVE</span>}
          <TierBadge item={a}/>
          {opinionLabel && <span className="snap-opinion">{opinionLabel}</span>}
          {topKw && <span className="snap-tag" style={{ background: bg, color }}>{topKw}</span>}
        </div>
        <h3 className="snap-title">{a.title}</h3>
        </>)}
        {a.desc && <p className="snap-snippet">{a.desc}</p>}
        {/* F3: ONE meta row — timestamp (+ sources) left, Ask/save right. The hero shows
            its time in the overlay, so the foot omits it there to avoid duplication. */}
        <div className="snap-foot">
          <span className="snap-foot-left">
            {!heroImg && <span className="snap-time">{formatDate(a.pubDate)}</span>}
            {multi &&
              <button className="snap-sources snap-sources-btn"
                onClick={e => { e.stopPropagation(); onPerspectives?.(a); }}>
                {/* F8: the "N sources" count reuses the shared .sources-tag pill (State of
                    Play style); the button still opens Perspectives. */}
                <span className="sources-tag">{a._clusterSize} sources</span>
                <span className="snap-sources-cta">Perspectives</span>
                <svg className="snap-cov-caret" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>}
          </span>
          <span className="snap-foot-actions">
            {/* D7: Ask the assistant about this specific story. */}
            {onAsk && (
              <button className="snap-ask" onClick={e => { e.stopPropagation(); onAsk(a); }}
                aria-label="Ask about this story" title="Ask the assistant about this story">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Ask
              </button>
            )}
            <button className={`snap-save ${isSaved ? 'saved' : ''}`}
              onClick={e => { e.stopPropagation(); onSave(a); }} aria-label={isSaved ? 'Saved' : 'Save'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
          </span>
        </div>
      </div>
      {!heroImg && hasImg && <img className="snap-thumb" src={a.img} loading="lazy" alt="" onError={() => setImgErr(true)} />}
    </article>
  );
}
