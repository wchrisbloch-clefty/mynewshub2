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
import { hasUsableImage, imgReferrerPolicy, imageVerdict } from '../source-image';
import { FollowSourceChip } from '../follow-source';
import { TierBadge } from '../provenance';
import './SnapshotCard.css';

const defaultFormatDate = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

export function SnapshotCard({ a, meta = {}, isSaved, onSave, onRead, onPerspectives, onAsk, formatDate = defaultFormatDate, hideImage = false, lead = false, opinionLabel = null }) {
  // V2: category colour no longer painted on the source name / topic tag (meta.color/.bg unused).
  const [imgErr, setImgErr] = useState(false);
  const topKw = a.matchedKw?.[0] || null;
  const multi = a._clusterSize > 1;
  // F2: a lead WITH an image renders as a hero — 16:9 cover image, a bottom-up dark
  // gradient, and the source + headline overlaid in white (meta in one fixed position).
  // The no-image lead keeps the D5 typographic treatment. Regular cards are unchanged.
  const hasImg = hasUsableImage(a.img) && !imgErr && !hideImage; // X1: generic fallback-card URLs are "no image"
  const heroImg = lead && hasImg;
  // Y3.1: stamp this card's image decision so the ?debug=1 image report can show src/host/verdict
  // for EVERY slot — including ones that render no <img> (dropped as generic-card / 404 / blank /
  // empty). `imgErr` is the runtime 404/blank signal; `iv` is the static (URL-shape) verdict.
  const iv = imageVerdict(a.img);
  const imgState = imgErr ? 'blank-or-404' : (hideImage ? 'hidden' : iv.verdict);
  return (
    <article className={`snap-card ${a.isAlert ? 'snap-breaking' : ''}${lead ? ' snap-lead' : ''}${lead && !hasImg ? ' snap-lead-noimg' : ''}${heroImg ? ' snap-lead-hero' : ''}${!heroImg ? ' snap-row' : ''}`} onClick={() => onRead(a)}
      data-img-src={a.img || ''} data-img-state={imgState} data-img-pattern={iv.pattern || ''} data-img-unverified={iv.unverified ? '1' : ''}>
      {/* K6: STANDARD row — the image is on the LEFT at a fixed 4:3 (112x84 / 88x66),
          its space reserved via aspect-ratio so nothing shifts; a text-only row keeps
          the same min-height so the list rhythm holds (no placeholder tile). The accent
          left bar + card box chrome are removed in CSS. */}
      {!heroImg && hasImg && <img className="snap-thumb" src={a.img} loading="lazy" decoding="async" alt="" referrerPolicy={imgReferrerPolicy(a.img)} onError={() => setImgErr(true)} onLoad={e => { if (!e.currentTarget.naturalWidth) setImgErr(true); }} />}
      {heroImg && (
        <div className="snap-hero-media">
          <img className="snap-hero-img" src={a.img} loading="lazy" alt="" referrerPolicy={imgReferrerPolicy(a.img)} onError={() => setImgErr(true)} onLoad={e => { if (!e.currentTarget.naturalWidth) setImgErr(true); }} />
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
          <span className="snap-source">{a.source}</span>
          <FollowSourceChip name={a.source} url={a.sourceUrl}/>
          {a.author && <span className="snap-byline">{a.author}</span>}
          {a.isAlert && <span className="snap-live">● LIVE</span>}
          <TierBadge item={a}/>
          {opinionLabel && <span className="snap-opinion">{opinionLabel}</span>}
          {topKw && <span className="snap-tag">{topKw}</span>}
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
          {/* Y1.2: on the LEAD the actions are GHOST ICONS (no boxed button, 16px glyph, >=44px hit via
              ::after) sitting on the meta foot — the hero already carries strong chrome, so a pair of
              bordered buttons there was heavy. Distinct classes (.snap-lead-act), NOT the .snap-ask /
              .snap-save secondary-button equivalence class, so the one-look conformance gate is
              unaffected (a hero's inline icon actions are their own affordance). Every OTHER card keeps
              the bordered Ask / Save. */}
          {lead ? (
            <span className="snap-foot-actions snap-lead-actions">
              {onAsk && (
                <button className="snap-lead-act" onClick={e => { e.stopPropagation(); onAsk(a); }}
                  aria-label="Ask about this story" title="Ask the assistant about this story">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
              )}
              <button className={`snap-lead-act ${isSaved ? 'saved' : ''}`}
                onClick={e => { e.stopPropagation(); onSave(a); }} aria-label={isSaved ? 'Saved' : 'Save'} title={isSaved ? 'Saved' : 'Save'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </span>
          ) : (
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
          )}
        </div>
      </div>
    </article>
  );
}
