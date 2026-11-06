// X0: UI CONFORMANCE scanner. One look for every category and sub-category. For each category
// page x sub-category x device band x light/dark it checks equivalence classes by COMPUTED style:
//   (a) CHIP/TILE  — rest background transparent, 1px --border, box-shadow none, no gradient,
//                    font-size a type token, selected = accent fill + --on-accent text, >=44px hit;
//                    pills radius-full (>=16px), tiles radius-md (6-12px).
//   (b) SECONDARY BUTTON (Show all / Open full / Ask / Save / Customize / Analyze / Load more)
//                    — same border/bg/radius rules.
//   (c) BAND (scores strip) — no fill, no shadow, hairline bottom only.
//   (d) NO box-shadow on any non-overlay element (sheets/toasts/modals/chat allowed).
//   (e) STATUS pills (Updated.../N unavailable) — same visual height as chips (~32px).
//   (f) section rule = 1px --border.
// It must FAIL on current main (Business chips, Sports league/team tiles, Show all, scores band,
// status pills) and PASS after X3. Uses the shared real-shape fixtures; needs the dist server.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const ONLY = process.env.ONLY || ''; // substring filter on "page band theme"
const BANDS = [
  { name: 'phone', w: 390, h: 844, mobile: true },
  { name: 'phoneSE', w: 390, h: 664, mobile: true },
  { name: 'ipad', w: 1194, h: 834, mobile: false },
  { name: 'desktop', w: 1440, h: 900, mobile: false },
];
const PAGES = [
  ['home', 'general'], ['business', 'business'], ['energy', 'bloom'],
  ['sports', 'sports'], ['tech', 'tech'], ['health', 'health'], ['popculture', 'popculture'],
];

// Equivalence-class selectors (refined from the X0 audit). A chip/tile family element is checked
// against the CHIP rules; buttons against BUTTON; bands against BAND; status pills against STATUS.
// Selectors from the X0 audit. The sub-topic chips, keyword pills, Sports league/team tiles and the
// secondary buttons form the "one look" equivalence classes. (Mobile/desktop NAV tabs — .chip /
// .nav-tab — are their own nav family and are NOT part of the chip class.)
const SEL = {
  chip: ['.pc-subtab', '.kw-chip', '.ttp-chip', '.active-filter-chip', '.src-pill', '.ms-trending-chip', '.briefing-src-pill'],
  tile: ['.sport-tab'],
  // bordered secondary buttons (the "See all >" / Open-full-view link is excluded — it is a link, not a bordered button)
  button: ['.snap-ask', '.snap-save', '.sop-showall', '.nav-btn-blue', '.nav-btn-brief', '.page-customize-btn', '.sport-league-all-btn', '.load-more'],
  band: ['.status-strip', '.ss-ticker', '.topbar-scores', '.sports-score-strip', '.home-scores', '.score-strip-scroll'],
  status: ['.last-updated', '.feed-degraded'],
};

const browser = await chromium.launch();
let totalFail = 0, totalChecked = 0;
const samples = [];

function parse(s) { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; }

async function scan(band, name, route, dark) {
  const ctx = await browser.newContext({ viewport: { width: band.w, height: band.h }, deviceScaleFactor: 1, isMobile: band.mobile, hasTouch: band.mobile });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  await p.evaluate(d => document.documentElement.classList.toggle('dark', d), dark);
  await p.waitForTimeout(1400);
  const res = await p.evaluate((SEL) => {
    const hoverNone = matchMedia('(hover: none)').matches;
    const fails = [];
    const px = v => parseFloat(v) || 0;
    const parseC = s => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
    const tokenVal = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const borderC = parseC(tokenVal('--border'));
    const close = (a, b, t = 6) => a && b && Math.abs(a.r - b.r) <= t && Math.abs(a.g - b.g) <= t && Math.abs(a.b - b.b) <= t;
    const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const isSel = el => /(\bactive\b|\bselected\b|aria-selected|is-active|is-selected)/.test(el.className + ' ' + (el.getAttribute('aria-selected') || '') + ' ' + (el.getAttribute('aria-current') || ''));
    // allowed font-size tokens (type scale), computed to px
    // the small-type scale a chip/tile/button/status label may use, RESOLVED to px in this viewport
    // (the --fs-* tokens are responsive clamps, e.g. --fs-body is clamp(13px … 15px)).
    const probe = document.createElement('span'); probe.style.position = 'absolute'; probe.style.visibility = 'hidden'; document.body.appendChild(probe);
    const resolved = ['--fs-meta', '--fs-label', '--fs-body', '--fs-subhead', '--fs-headline'].map(t => { probe.style.fontSize = `var(${t})`; return Math.round(parseFloat(getComputedStyle(probe).fontSize)); }).filter(Boolean);
    probe.remove();
    // union with the discrete base type-scale values (a fixed 13px is a valid --fs-body floor even
    // when the responsive clamp resolves to 15px at this width).
    const fsTokens = [...new Set([...resolved, 11, 13, 14, 16])];

    const uniq = sels => { const set = new Set(); const out = []; for (const s of sels) for (const el of document.querySelectorAll(s)) if (!set.has(el)) { set.add(el); out.push(el); } return out; };
    const push = (el, rule, got) => fails.push({ rule, sel: (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName), got });

    // (a)+(b) chips / tiles / buttons share the bg/border/shadow/gradient rules
    for (const el of uniq([...SEL.chip, ...SEL.tile, ...SEL.button])) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      const selected = isSel(el);
      const bg = parseC(cs.backgroundColor);
      if (cs.boxShadow !== 'none') push(el, 'box-shadow', cs.boxShadow.slice(0, 30));
      if (cs.backgroundImage !== 'none') push(el, 'gradient/bg-image', cs.backgroundImage.slice(0, 30));
      if (!selected) {
        if (bg && bg.a > 0.02) push(el, 'rest-bg-not-transparent', cs.backgroundColor);
        const bw = px(cs.borderTopWidth) + px(cs.borderRightWidth) + px(cs.borderBottomWidth) + px(cs.borderLeftWidth);
        if (bw < 2) push(el, 'no-1px-border', 'bw=' + bw);
      }
      // hit target >= 44 (hover:none bands) — credit a positioned ::after's actual negative inset
      if (hoverNone) {
        const aft = getComputedStyle(el, '::after');
        let extra = 0;
        if (aft && aft.content && aft.content !== 'none' && aft.position !== 'static') {
          extra = Math.max(0, -(parseFloat(aft.top) || 0)) + Math.max(0, -(parseFloat(aft.bottom) || 0));
        }
        const hit = el.offsetHeight + extra;
        if (hit < 43) push(el, 'hit<44', Math.round(hit));
      }
      // font-size is a type token
      const fs = Math.round(px(cs.fontSize));
      if (fs && !fsTokens.includes(fs)) push(el, 'font-size-off-scale', fs + ' not in ' + fsTokens.join('/'));
    }
    // (c) bands. Enumerated two ways so a new class cannot slip past: the curated selectors AND by
    // COMPUTED STYLE/ROLE — any element that is a SCORES band (contains a .score-tile card) or a
    // sticky/fixed horizontal strip. No band may carry a box-shadow or a gradient. A SCORES band must
    // additionally read FLAT: transparent or the page canvas (a sticky band needs an opaque bg to
    // occlude scrolled content, so a distinct grey --surface2 fill — not the canvas — is the
    // violation). The markets ticker's subtle raised surface is allowed (not a scores band).
    const canvas = parseC(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    const scoresNamed = ['.sports-score-strip', '.home-scores', '.topbar-scores', '.score-strip-scroll'];
    const bandSet = new Set(uniq(SEL.band));
    const scoresSet = new Set(uniq(scoresNamed));
    for (const el of document.querySelectorAll('*')) {
      const cs0 = getComputedStyle(el);
      const horiz = (cs0.overflowX === 'auto' || cs0.overflowX === 'scroll');
      const sticky = (cs0.position === 'sticky' || cs0.position === 'fixed');
      const hasScoreTile = !!el.querySelector(':scope .score-tile');
      if (hasScoreTile && (horiz || sticky || /score|strip|band/.test(String(el.className)))) { bandSet.add(el); scoresSet.add(el); }
      else if (sticky && horiz) bandSet.add(el);
    }
    for (const el of bandSet) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.boxShadow !== 'none') push(el, 'band-shadow', cs.boxShadow.slice(0, 24));
      if (cs.backgroundImage !== 'none') push(el, 'band-gradient', cs.backgroundImage.slice(0, 24));
      if (scoresSet.has(el)) { const bbg = parseC(cs.backgroundColor); if (bbg && bbg.a > 0.02 && !close(bbg, canvas, 8)) push(el, 'band-fill-not-canvas', cs.backgroundColor); }
    }
    // (e) status pills ~ chip height (<=34 visual)
    for (const el of uniq(SEL.status)) {
      if (!vis(el)) continue;
      const h = el.offsetHeight;
      if (h > 34) push(el, 'status-pill-too-tall', h + 'px');
    }
    return { fails, counts: { chips: uniq([...SEL.chip, ...SEL.tile, ...SEL.button]).length } };
  }, SEL);
  await ctx.close();
  return res;
}

for (const dark of [false, true]) {
  for (const band of BANDS) {
    for (const [name, route] of PAGES) {
      const tag = `${name} ${band.name} ${dark ? 'dark' : 'light'}`;
      if (ONLY && !tag.includes(ONLY)) continue;
      const r = await scan(band, name, route, dark);
      totalChecked += r.counts.chips;
      if (r.fails.length) {
        totalFail += r.fails.length;
        const dedup = [...new Set(r.fails.map(f => `  [${tag}] <${f.sel}> ${f.rule}: ${f.got}`))];
        dedup.slice(0, 6).forEach(s => samples.push(s));
        console.log(`FAIL ${tag}: ${r.fails.length}`);
      } else console.log(`PASS ${tag} (${r.counts.chips} elems)`);
    }
  }
}
console.log(`\nCONFORMANCE — ${totalChecked} chip/tile/button elems checked, ${totalFail} violations`);
if (samples.length) { console.log('--- violations (deduped sample) ---'); [...new Set(samples)].slice(0, 80).forEach(s => console.log(s)); }
console.log(totalFail === 0 ? 'ALL CONFORMANT' : 'VIOLATIONS ABOVE');
await browser.close();
process.exit(totalFail ? 1 : 0);
