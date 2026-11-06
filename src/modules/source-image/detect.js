// X1/Y3.2: the PURE image-URL detection logic, with no React/JSX, so it can be unit-tested in Node
// (see detect.test.mjs) and imported by the <SourceImage> component (index.jsx re-exports all of it).
//
// Known generic fallback-card URL patterns publishers serve when an item has no real image.
// Y3.2: tightened to an EXACT host + path/filename SHAPE. The earlier patterns matched the bare
// substring "default"/"commercial"/"fallback" ANYWHERE in the URL, so a legitimate Guardian photo
// whose media id happened to contain those letters (e.g. .../media/0a1b2defaultc9/.../master/..jpg,
// or a commercial-section article photo) was wrongly treated as "no image" and dropped. Each pattern
// now requires the generic token to be a DEDICATED path segment (…/commercial/…, …/fallback/…) or
// the image FILENAME itself (…/default.jpg, …/og-default.png), never a fragment of a longer id.
// UNVERIFIED: in-sandbox we cannot fetch the real Guardian URLs, so the precise fallback-card shape
// is inferred from the observed wordmark cards, not confirmed against a live 200 response — see
// GENERIC_CARD_UNVERIFIED and the ?debug=1 image report. Prefer a false-negative (show a real-ish
// image) over a false-positive (drop a real one): these match only unambiguous generic-card URLs.
const IMG_EXT = '(?:jpe?g|png|webp|gif|avif)';
// A generic token matches only as a WHOLE path segment (slash-delimited) or a FILENAME stem — never
// as a substring of a longer id/slug. So "…/media/8f3b2default9c0a/…/3000.jpg" (the token buried in
// a media id) and "…/media/commercialnews12/…/2048.jpg" (a section slug) are USABLE, while
// "…/default-card/master/guardian-logo.png" (a dedicated segment + a branding filename) is generic.
export const GENERIC_CARD_PATTERNS = [
  // Guardian/guim generic-card DELIVERY PATHS — /commercial/ or /fallback/ as a full CDN path segment.
  /(?:^|\/\/)(?:i\.)?guim\.co\.uk\/.*\/(?:commercial|fallback)\//i,
  // Publisher BRANDING card as the filename stem — guardian-logo.png, guardian-branded-card.jpg, …
  new RegExp(`/guardian[-_](?:logo|branded|card)[^/]*\\.${IMG_EXT}(?:[?#]|$)`, 'i'),
  // Clearly-generic card as a whole path SEGMENT (host-agnostic): /default-card/, /og-image-default/…
  /\/(?:default[-_]card|fallback[-_]card|og[-_]image[-_]default|social[-_]generic|placeholder[-_]card|site[-_]logo)\//i,
  // Clearly-generic card as a whole FILENAME (host-agnostic): default.jpg, og-default.png,
  // default-card.png, site-logo.png — the whole filename, not a fragment of a media id.
  new RegExp(`/(?:default|og[-_]?default|social[-_]?default|fallback|default[-_]card|fallback[-_]card|og[-_]image[-_]default|social[-_]generic|placeholder[-_]card|site[-_]logo)\\.${IMG_EXT}(?:[?#]|$)`, 'i'),
];
// UNVERIFIED flag: the exact fallback-card URL shapes above are inferred, not confirmed against a
// live publisher response in-sandbox (no feed egress). Surfaced in the ?debug=1 image report.
export const GENERIC_CARD_UNVERIFIED = true;

export function isGenericCard(src) { return !!src && GENERIC_CARD_PATTERNS.some(re => re.test(src)); }
export function hasUsableImage(src) { return !!src && !isGenericCard(src); }

// Hosts that need NO referrer to serve a cross-site hotlinked image.
const NO_REFERRER_HOSTS = /(guim\.co\.uk|theguardian\.com|thespun\.com|nypost\.com|wp\.com|wordpress\.com)/i;
export function imgReferrerPolicy(src) { return NO_REFERRER_HOSTS.test(src || '') ? 'no-referrer' : 'no-referrer-when-downgrade'; }

// Y3.1: the static (pre-load) verdict for the ?debug=1 image report. 404/blank are only known at
// load time (onError / naturalWidth===0), so the report pairs this with the live <img> state.
export function imageVerdict(src) {
  if (!src) return { verdict: 'empty', pattern: null, unverified: false };
  for (const re of GENERIC_CARD_PATTERNS) if (re.test(src)) return { verdict: 'generic-card', pattern: re.source, unverified: GENERIC_CARD_UNVERIFIED };
  return { verdict: 'usable', pattern: null, unverified: false };
}
