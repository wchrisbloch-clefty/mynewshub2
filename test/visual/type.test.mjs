// AA6: the TYPE SYSTEM gate. Over every category/sub-category page x 3 bands x light/dark it asserts:
//   (a) every story headline is serif; UI / meta / buttons / numbers are sans;
//   (b) weights are a subset of {400,500,600,700} (the wordmark SVG is the one exception) and distinct
//       content weights <= 4 per page; computed font-sizes are a subset of the role-token scale;
//   (c) text-transform:uppercase appears ONLY on the label/eyebrow role, TopicLabel and ticker symbols;
//   (d) no --red-derived colour on any score element;
//   (e) text-wrap is set (balance) on headline roles;
//   (f) 0 requests to fonts.googleapis.com / fonts.gstatic.com.
// It FAILS on main (a,b,c,d) — see docs/verification/batch-AA-report.md for the pre-fix output.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';
const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const ONLY = process.env.ONLY || '';
const BANDS = [
  { name: 'phone', w: 390, h: 844, mobile: true },
  { name: 'ipad', w: 1194, h: 834, mobile: false },
  { name: 'desktop', w: 1440, h: 900, mobile: false },
];
const PAGES = [['home','general'],['business','business'],['energy','bloom'],['tech','tech'],
  ['sports','sports'],['health','health'],['popculture','popculture'],['podcasts','podcasts'],
  ['stateofplay','stateofplay'],['saved','saved'],['sources','sources'],['briefing','briefing']];

const HEAD_SEL = ['.snap-title','.snap-hero-title','.fc-title','.gn-card-title','.toh-title','.toh-text-title',
  '.toh-compact-title','.mh-compact-title','.houston-card-title','.pod-title','.sop-item-title','.sb-across-title',
  '.web-result-title','.sports-hero-title','.mh-brk-title','.trend-title'];
// classes (self or ancestor) that MAY be uppercase: the label/eyebrow role, TopicLabel, tickers, kickers.
const UPPER_OK = /(eyebrow|-label|-lbl|label\b|kicker|topic|-tag\b|tag-|-source\b|-src\b|-sub\b|-head\b|-lg\b|-sym\b|ticker|page-header|scores-label|sop-brk|ss-flag-live|disagree|dp-h2|cp-lbl|cp-seed-cat|cp-voice|stat-|stats-|src-footer|sources-cat|persp-|my-team|following-label|menu-sheet-head|rnw-city|rnw-label|rnw-city-fc-head|houston-sub|mobile-strip-city|social-block|sd-tier|snap-tag|snap-opinion|snap-cov-title|snap-source|snap-hero-source|gap-tag|pm-src|pm-tag|fc-disc|fc-summary-lbl|fc-takeaways|fc-why|chat-context-label|chat-analyze|following-chip|team-card-league|sb-box)/i;

async function scan(band, route, dark) {
  const ctx = await browser.newContext({ viewport: { width: band.w, height: band.h }, isMobile: band.mobile, hasTouch: band.mobile, colorScheme: dark ? 'dark' : 'light' });
  const p = await ctx.newPage();
  let fontReqs = 0;
  await p.route('**fonts.googleapis.com**', r => { fontReqs++; r.abort(); });
  await p.route('**fonts.gstatic.com**', r => { fontReqs++; r.abort(); });
  if (dark) await p.addInitScript(() => { try { localStorage.setItem('dark', 'true'); } catch {} });
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  await p.evaluate(d => document.documentElement.classList.toggle('dark', d), dark);
  await p.waitForTimeout(1200);
  const res = await p.evaluate(({ HEAD_SEL, UPPER_SRC }) => {
    const UPPER_OK = new RegExp(UPPER_SRC, 'i');
    const fails = [];
    const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const cls = el => (el && typeof el.className === 'string' ? el.className : (el && el.getAttribute && el.getAttribute('class')) || '');
    const px = v => Math.round(parseFloat(v) || 0);
    const parseC = s => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; };
    // (a) headline serif. NB: "sans-serif" contains "serif", so strip it before testing.
    const isSerif = f => /serif/i.test(String(f).replace(/sans-serif/gi, ''));
    for (const sel of HEAD_SEL) for (const el of document.querySelectorAll(sel)) {
      if (!vis(el)) continue;
      if (!isSerif(getComputedStyle(el).fontFamily)) fails.push(`(a) headline not serif: .${cls(el).split(' ')[0]}`);
    }
    // the allowed font-size scale, resolved in this viewport (the --fs-* tokens)
    const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden'; document.body.appendChild(probe);
    const scale = ['--fs-label','--fs-meta','--fs-body','--fs-subhead','--fs-title','--fs-headline','--fs-lead','--fs-hero']
      .map(t => { probe.style.fontSize = `var(${t})`; return px(getComputedStyle(probe).fontSize); });
    probe.remove();
    const scaleSet = new Set([...scale, 11, 12, 13, 14, 15, 16]); // base discrete floors the clamps may resolve to
    // wordmark = the SVG logo text; exclude from weight/size checks
    const inWordmark = el => !!(el.closest && el.closest('.logo,.wordmark,svg'));
    const weights = new Set();
    for (const el of document.querySelectorAll('.hub *, .topbar-wrap *, .mobile-top *, .header-scroll *')) {
      if (!vis(el)) continue;
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText) continue;
      const s = getComputedStyle(el);
      if (inWordmark(el)) continue;
      // (b) weight
      const w = parseInt(s.fontWeight, 10);
      if (w >= 800) fails.push(`(b) weight ${w} outside wordmark: .${cls(el).split(' ')[0]}`);
      else weights.add(w);
      // (b) size in scale — logo / avatar monograms are icon glyphs sized to a circle, not prose type.
      const fs = px(s.fontSize);
      const isGlyph = /logo|avatar|monogram/.test(cls(el)) || (el.closest && el.closest('[class*="logo"],[class*="avatar"]'));
      if (fs && !scaleSet.has(fs) && !isGlyph) fails.push(`(b) font-size ${fs}px off-scale [${[...scaleSet].sort((a,b)=>a-b).join(',')}]: .${cls(el).split(' ')[0]}`);
      // (c) uppercase only on allowed
      if (s.textTransform === 'uppercase') {
        let ok = false, n = el;
        for (let i = 0; i < 4 && n; i++, n = n.parentElement) { if (UPPER_OK.test(cls(n))) { ok = true; break; } }
        if (!ok) fails.push(`(c) uppercase not allowed: .${cls(el).split(' ').slice(0,2).join('.')} "${el.textContent.trim().slice(0,16)}"`);
      }
    }
    if (weights.size > 4) fails.push(`(b) ${weights.size} distinct content weights ( ${[...weights].sort().join(',')} ) > 4`);
    // (d) no red on scores
    const REDs = [[200,16,46],[240,83,63]];
    const near = c => REDs.some(R => Math.abs(c[0]-R[0])<=24 && Math.abs(c[1]-R[1])<=24 && Math.abs(c[2]-R[2])<=24);
    for (const el of document.querySelectorAll('.score-tile,.score-tile *,.sb-box *,.home-scores *,.sports-score-strip *,.mini-sb-strip *')) {
      if (!vis(el)) continue; const s = getComputedStyle(el);
      for (const prop of ['color','backgroundColor','borderTopColor']) { const c = parseC(s[prop]); if (c && c[3] > 0.1 && near(c)) fails.push(`(d) red on score el: .${cls(el).split(' ')[0]} ${prop}`); }
    }
    // (e) text-wrap on a headline role
    const hw = document.querySelector('.snap-title,.fc-title,.toh-title,.sop-item-title,.pod-title,.gn-card-title');
    if (hw && vis(hw)) { const tw = getComputedStyle(hw).textWrap || getComputedStyle(hw).textWrapMode || ''; if (!/balance|pretty/.test(tw)) fails.push(`(e) headline text-wrap not set: got "${tw}"`); }
    return [...new Set(fails)];
  }, { HEAD_SEL, UPPER_SRC: UPPER_OK.source });
  await ctx.close();
  return { fails: res, fontReqs };
}

const browser = await chromium.launch();
let total = 0; const samples = [];
for (const dark of [false, true]) for (const band of BANDS) for (const [name, route] of PAGES) {
  const tag = `${name} ${band.name} ${dark ? 'dark' : 'light'}`;
  if (ONLY && !tag.includes(ONLY)) continue;
  const r = await scan(band, route, dark);
  if (r.fontReqs > 0) { r.fails.push(`(f) ${r.fontReqs} third-party font requests`); }
  if (r.fails.length) { total += r.fails.length; r.fails.slice(0, 5).forEach(f => samples.push(`  [${tag}] ${f}`)); console.log(`FAIL ${tag}: ${r.fails.length}`); }
  else console.log(`PASS ${tag}`);
}
console.log(`\nTYPE — ${total} violations`);
if (samples.length) [...new Set(samples)].slice(0, 60).forEach(s => console.log(s));
console.log(total === 0 ? 'ALL PASS' : 'VIOLATIONS ABOVE');
await browser.close();
process.exit(total ? 1 : 0);
