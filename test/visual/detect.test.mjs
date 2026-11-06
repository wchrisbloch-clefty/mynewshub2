// Y3.3: generic-card detection is STRICT. Three legitimate Guardian photos — including one whose
// media id literally contains the substring "default" — must read as USABLE (rendered as images),
// while genuine generic fallback-card URLs (a /commercial/ or /fallback/ CDN segment, or a
// default/og-default FILENAME) must read as generic-card (dropped, never shown over the headline).
// This locks in the Y3.2 tightening: the old patterns matched "default"/"commercial" ANYWHERE in the
// URL and would have wrongly dropped the first three. Pure-logic test (no browser) over ./detect.
import { isGenericCard, hasUsableImage, imageVerdict, GENERIC_CARD_UNVERIFIED } from '../../src/modules/source-image/detect.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('FAIL ' + msg); } };

// ── 3 LEGIT Guardian photos — must be USABLE (isGenericCard === false) ──────────────────────────
const LEGIT = [
  // the key case: "default" appears INSIDE the media id, not as the filename or a /fallback/ segment
  'https://i.guim.co.uk/img/media/8f3b2default9c0a/0_0_3000_1800/master/3000.jpg?width=620&quality=85&s=abc',
  // an ordinary article photo
  'https://i.guim.co.uk/img/media/7c1a9/0_120_4000_2400/master/4000.jpg?width=620&dpr=2',
  // a photo from a *commercial-section* article — "commercial" as part of a segment NAME, not a /commercial/ segment
  'https://i.guim.co.uk/img/media/commercialnews12/0_0_2048_1229/master/2048.jpg?width=620',
];
for (const u of LEGIT) {
  ok(isGenericCard(u) === false, `legit URL wrongly flagged generic-card: ${u}`);
  ok(hasUsableImage(u) === true, `legit URL not usable: ${u}`);
  ok(imageVerdict(u).verdict === 'usable', `legit URL verdict !== usable: ${u} (got ${imageVerdict(u).verdict})`);
}

// ── Genuine generic fallback cards — must be GENERIC-CARD (isGenericCard === true, dropped) ──────
const FALLBACK = [
  'https://i.guim.co.uk/img/static/commercial/default.jpg?width=620',          // /commercial/ CDN segment
  'https://i.guim.co.uk/img/media/abc/fallback/card.png',                       // /fallback/ CDN segment
  'https://assets.guim.co.uk/images/og-default.jpg',                            // og-default FILENAME
  'https://media.theguardian.com/og/default.png',                               // default FILENAME on theguardian.com
  'https://static.example.com/assets/site-logo.png',                            // host-agnostic generic filename
];
for (const u of FALLBACK) {
  ok(isGenericCard(u) === true, `fallback URL not detected as generic-card: ${u}`);
  ok(hasUsableImage(u) === false, `fallback URL wrongly usable: ${u}`);
  const v = imageVerdict(u);
  ok(v.verdict === 'generic-card', `fallback verdict !== generic-card: ${u} (got ${v.verdict})`);
  ok(typeof v.pattern === 'string' && v.pattern.length > 0, `fallback verdict missing matched pattern: ${u}`);
  ok(v.unverified === GENERIC_CARD_UNVERIFIED, `fallback verdict missing UNVERIFIED flag: ${u}`);
}

// ── empty / missing src ─────────────────────────────────────────────────────────────────────────
ok(imageVerdict('').verdict === 'empty', 'empty src should be verdict=empty');
ok(imageVerdict(undefined).verdict === 'empty', 'undefined src should be verdict=empty');
ok(hasUsableImage('') === false, 'empty src should not be usable');

console.log(`\nDETECT — ${pass} assertions passed, ${fail} failed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
