// X1: the ONE image path. Every cover/thumb/lead image in the app goes through <SourceImage> so
// broken, hotlink-blocked and generic fallback-card images are handled identically everywhere:
//   • unusable up front — empty src, or a KNOWN generic fallback-card URL (e.g. a Guardian card that
//     bakes in a faint "THE GUARDIAN US/BUSINESS" wordmark that prints through the headline): treated
//     as "no image" before it ever renders;
//   • unusable on load — 404 (onError) or blank / hotlink-stripped (naturalWidth === 0 on load);
//   • referrerPolicy tuned per host — some publishers 403 a cross-site hotlink unless the request
//     carries no referrer (this is the most likely cause of the blank Guardian thumbnail).
// Fallback by surface:
//   variant="row"  → renders NOTHING (the caller drops the thumbnail column; the row is text-only
//                    with no blank indent);
//   variant="lead" / "thumb" → a --navy block the same size (NO source-name text mark), over which
//                    the caller draws the white headline. The O7 scrim/contrast sampling is unchanged.
import { useState, useEffect } from 'react';
// Y3.2: the detection logic lives in ./detect (pure, no JSX) so it can be unit-tested in Node
// (detect.test.mjs). Re-exported here so every existing importer of '../source-image' is unchanged.
import { hasUsableImage, imgReferrerPolicy, imageVerdict } from './detect';
export { GENERIC_CARD_PATTERNS, GENERIC_CARD_UNVERIFIED, isGenericCard, hasUsableImage, imageVerdict, imgReferrerPolicy } from './detect';

export function SourceImage({ src, alt = '', variant = 'row', className = '' }) {
  const usable = hasUsableImage(src);
  const [failed, setFailed] = useState(!usable);
  useEffect(() => { setFailed(!usable); }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  const onLoad = e => { if (!e.currentTarget.naturalWidth) setFailed(true); };
  if (failed) {
    if (variant === 'row') return null; // text-only row — caller omits the column, no blank indent
    return <div className={`src-img-ph ${className}`} aria-hidden="true"/>; // --navy block, no source text
  }
  return <img className={`src-img ${className}`} src={src} alt={alt} loading="lazy"
    referrerPolicy={imgReferrerPolicy(src)} onError={() => setFailed(true)} onLoad={onLoad}/>;
}
