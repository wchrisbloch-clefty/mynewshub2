// S0: the gap Batch O missed — run the geometry assertions under TOUCH EMULATION (isMobile +
// hasTouch), where the M5/N1 (hover:none)/(pointer:coarse) min-height rules actually apply.
// Chromium desktop emulation never triggers those, so every earlier gate measured the wrong
// geometry. Each assertion here FAILS on current main in touch mode and must PASS after S1–S13.
// WebKit/Safari is unavailable in this container, so this is Chromium-touch; real Safari = NEEDS-DEVICE.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const VIEWPORTS = [
  { w: 390, h: 844, dpr: 3, name: 'iPhone 390' },
  { w: 430, h: 932, dpr: 3, name: 'iPhone 430' },
  { w: 834, h: 1194, dpr: 2, name: 'iPad portrait 834' },
  { w: 1194, h: 834, dpr: 2, name: 'iPad landscape 1194' },
];
const browser = await chromium.launch();
let fails = 0;
const log = (ok, msg) => { if (ok === false) fails++; console.log(`${ok === null ? 'SKIP' : ok ? 'PASS' : 'FAIL'}  ${msg}`); };

async function open(v, route = 'general') {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  if (route !== 'general') { await p.evaluate(r => window.__nav && window.__nav(r), route).catch(() => {}); }
  await p.waitForTimeout(1600);
  return { ctx, p };
}

for (const v of VIEWPORTS) {
  const tag = `[${v.name}]`;
  const { ctx, p } = await open(v, 'general');
  const media = await p.evaluate(() => ({ hoverNone: matchMedia('(hover:none)').matches, coarse: matchMedia('(pointer:coarse)').matches }));
  console.log(`\n=== ${v.name} (${v.w}x${v.h} dpr${v.dpr})  hover:none=${media.hoverNone} pointer:coarse=${media.coarse} ===`);
  if (!media.hoverNone || !media.coarse) log(false, `${tag} touch media queries active (hover:none & pointer:coarse)`);

  // ---- a) header bands aligned, not crossing ----
  const bands = await p.evaluate(() => {
    const r = s => { const e = document.querySelector(s); return e ? (b => ({ t: b.top, b: b.bottom, h: b.height }))(e.getBoundingClientRect()) : null; };
    const centerOf = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return (b.top + b.bottom) / 2; };
    const scores = r('.topbar-scores');
    const markets = r('.status-strip');
    const label = centerOf('.ss-flag-markets');
    const val = centerOf('.ss-tk-val');
    const wx = centerOf('.ss-weather .rnw-label') ?? centerOf('.ss-weather');
    // content overflow: do any .status-strip descendants extend past the strip box?
    let overflow = 0;
    const strip = document.querySelector('.status-strip');
    if (strip) { const sb = strip.getBoundingClientRect(); strip.querySelectorAll('*').forEach(el => { const b = el.getBoundingClientRect(); if (b.height && b.bottom > sb.bottom + 1.5) overflow = Math.max(overflow, b.bottom - sb.bottom); }); }
    return { scores, markets, label, val, wx, overflow };
  });
  const marketsShown = bands.markets && bands.markets.h > 0; // on the phone the markets band is display:none
  if (bands.scores && marketsShown) log(bands.scores.b <= bands.markets.t + 1, `${tag} a: Scores band bottom (${bands.scores.b.toFixed(1)}) <= Markets band top (${bands.markets.t.toFixed(1)})`);
  else log(null, `${tag} a: markets band hidden here (phone) — band-stack check N/A`);
  const centers = [bands.label, bands.val, bands.wx].filter(x => x != null);
  if (marketsShown && centers.length >= 2) { const spread = Math.max(...centers) - Math.min(...centers); log(spread <= 2, `${tag} a: MARKETS/ticker/weather share one center within 2px (spread ${spread.toFixed(1)})`); }
  else log(null, `${tag} a: not enough visible band labels to compare centers`);
  if (marketsShown) log(bands.overflow <= 1.5, `${tag} a: no band content overflows its row box (max overflow ${bands.overflow.toFixed(1)}px)`);
  else log(null, `${tag} a: markets band hidden — overflow check N/A`);

  // ---- e) no clipped glyphs in ticker / right-now ----
  const clip = await p.evaluate(() => {
    const over = sel => [...document.querySelectorAll(sel)].filter(e => e.scrollWidth > e.clientWidth + 1).length;
    return { tk: over('.ss-tk'), rnw: over('.rnw-cities, .rnw-city, .ss-weather .rnw-label') };
  });
  log(clip.tk === 0, `${tag} e: no clipped ticker item (${clip.tk} clipped)`);

  // ---- d) hero/lead right edge === viewport width ----
  if (v.w <= 430) {
    const hero = await p.evaluate(() => { const e = document.querySelector('.snap-lead-hero .snap-hero-media, .mh-lead img, .snap-lead .snap-thumb'); return e ? e.getBoundingClientRect().right : null; });
    if (hero != null) log(Math.abs(hero - v.w) <= 0.5, `${tag} d: hero right edge (${hero.toFixed(1)}) === viewport width (${v.w})`);
    else log(null, `${tag} d: no phone hero found`);
  }

  // ---- f) launcher visible at rest ----
  await p.waitForTimeout(600);
  const fab = await p.evaluate(() => { const e = document.querySelector('.chat-fab'); if (!e) return { found: false }; const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return { found: true, inView: b.top >= 0 && b.bottom <= innerHeight + 0.5 && b.left >= 0 && b.right <= innerWidth + 0.5, hidden: s.visibility === 'hidden' || +s.opacity < 0.1 || e.classList.contains('chat-fab-hidden') }; });
  if (!fab.found) log(false, `${tag} f: chat launcher element exists`);
  else log(fab.inView && !fab.hidden, `${tag} f: launcher visible at rest (inView=${fab.inView} hidden=${fab.hidden})`);

  // ---- b) State of Play rows: gap + left-edge drift (rail on iPad, card on phone) ----
  const sop = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.sop-item')].filter(r => r.querySelector('.sop-item-title') && r.getBoundingClientRect().height > 2).slice(0, 8);
    if (!rows.length) return null;
    const data = rows.map(r => { const t = r.querySelector('.sop-item-title').getBoundingClientRect(); const m = r.querySelector('.sop-item-meta'); const mr = m ? m.getBoundingClientRect() : null; return { titleLeft: t.left, titleBottom: t.bottom, metaTop: mr ? mr.top : null }; });
    const gaps = data.filter(d => d.metaTop != null).map(d => d.metaTop - d.titleBottom);
    const lefts = data.map(d => d.titleLeft);
    // the "dead gap" CB sees comes from a touch-inflated in-row button (sop-ask/sop-save) forcing
    // the meta row to 44px. Measure the tallest such button box — S1 makes the VISUAL box compact
    // (<=34px) and moves the 44px target to an ::after, so this flips from FAIL to PASS.
    let btnH = 0; document.querySelectorAll('.sop-item .sop-ask, .sop-item .sop-save, .sop-item .sop-row-menu-btn').forEach(b => { btnH = Math.max(btnH, b.getBoundingClientRect().height); });
    return { n: data.length, maxGap: gaps.length ? Math.max(...gaps) : null, leftDrift: Math.max(...lefts) - Math.min(...lefts), btnH };
  });
  if (!sop) log(null, `${tag} b: no State of Play rows found`);
  else {
    if (sop.maxGap != null) log(sop.maxGap <= 8, `${tag} b: SoP meta.top - title.bottom <= 8px (max ${sop.maxGap.toFixed(1)})`);
    log(sop.leftDrift <= 1, `${tag} b: SoP row title left edges identical (drift ${sop.leftDrift.toFixed(1)}px across ${sop.n} rows)`);
    if (sop.btnH > 0) log(sop.btnH <= 34, `${tag} b: SoP in-row button box not touch-inflated (${sop.btnH.toFixed(0)}px, <=34 means 44px target is on ::after)`);
  }

  await ctx.close();
}

// ---- c) sticky offsets on phone Sports (scores strip must sit below the chip bar) ----
{
  const v = VIEWPORTS[0];
  const { ctx, p } = await open(v, 'sports');
  const res = await p.evaluate(async () => {
    const out = [];
    for (const y of [0, 150, 400, 800, 1400]) {
      window.scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); await new Promise(r => setTimeout(r, 60));
      const chip = document.querySelector('.pill-bar'); const strip = document.querySelector('.sports-score-strip');
      if (chip && strip) { const cb = chip.getBoundingClientRect(), sb = strip.getBoundingClientRect(); out.push({ y, ok: sb.top >= cb.bottom - 0.5, overlap: (cb.bottom - sb.top) }); }
    }
    return out;
  });
  const bad = res.filter(r => !r.ok);
  if (!res.length) log(null, `[phone Sports] c: chip bar / scores strip not both present`);
  else log(bad.length === 0, `[phone Sports] c: sticky scores strip sits below chip bar at all scroll stops (${bad.length} overlap, worst ${bad.length ? Math.max(...bad.map(b => b.overlap)).toFixed(1) : 0}px)`);
  await ctx.close();
}

await browser.close();
console.log(fails === 0 ? '\nTOUCH-MODE: ALL PASS' : `\nTOUCH-MODE: ${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
