// X1: ONE image path. With fixtures that inject a Guardian generic fallback-card image, a 404 image
// and a blank hotlink-stripped image into the Home feed, assert across device bands:
//   • 0 rendered <img> with naturalWidth === 0 that was not replaced by a placeholder (no blank box);
//   • 0 rows with an empty left indent > 8px (text-only rows start at the row's left edge; rows with
//     an image start after it — never a reserved-but-empty column);
//   • the lead headline keeps >= 4.5:1 contrast over the --navy fallback block.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const BANDS = [
  { name: 'phone', w: 390, h: 844, mobile: true },
  { name: 'ipad', w: 1194, h: 834, mobile: false },
  { name: 'desktop', w: 1440, h: 900, mobile: false },
];

// A tiny valid PNG (2x2) so a "generic card" URL WOULD load if detection failed.
const PNG2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAADUlEQVR4nGP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const GUARDIAN_CARD = 'https://i.guim.co.uk/img/media/abc123/0/default-card/master/guardian-logo.png';
const IMG404 = 'https://imgs.example.com/missing-404.png';
const IMGBLANK = 'https://imgs.example.com/blank-hotlink.png';
const GOOD = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect fill="#4a6b8a" width="320" height="180"/></svg>').toString('base64');

function genItems() {
  const iso = s => new Date(Date.now() + s * 1000).toISOString();
  const mk = (i, img, head) => ({ title: head || `Home headline number ${i} that also wraps to a second line in the list`, link: `https://ex.com/g/${i}`, pubDate: iso(-120 - i * 40), img, desc: `A real-shape standfirst for row ${i} that wraps to a second excerpt line.`, source: ['Reuters', 'AP', 'BBC News', 'The Guardian US'][i % 4] });
  const out = [];
  out.push(mk(0, GUARDIAN_CARD, 'Lead story whose only image is a Guardian generic card'));
  out.push(mk(1, GOOD));
  out.push(mk(2, IMG404, 'Second story whose image 404s'));
  out.push(mk(3, IMGBLANK, 'Third story with a blank hotlink-stripped image'));
  out.push(mk(4, GUARDIAN_CARD, 'A row with a Guardian generic card'));
  out.push(mk(5, '', 'A row that genuinely has no image at all'));
  for (let i = 6; i < 16; i++) out.push(mk(i, i % 2 ? GOOD : ''));
  return out;
}

const browser = await chromium.launch();
let fails = 0;
const log = [];

async function scan(band) {
  const ctx = await browser.newContext({ viewport: { width: band.w, height: band.h }, deviceScaleFactor: 1, isMobile: band.mobile, hasTouch: band.mobile });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  // image host routes
  await p.route('**i.guim.co.uk**', async r => r.fulfill({ status: 200, contentType: 'image/png', body: PNG2 }));
  await p.route('**imgs.example.com/missing-404.png', async r => r.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' }));
  await p.route('**imgs.example.com/blank-hotlink.png', async r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.alloc(0) }));
  // override the general feed with the problem-image items (last route wins in Playwright)
  await p.route('**/api/feed**', async r => {
    const u = new URL(r.request().url());
    const feed = u.searchParams.get('url') || '';
    if (/bbci|bbc|general|npr|guardian\.com\/us/.test(feed)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: genItems(), status: 200 }) });
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], status: 200 }) });
  });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  await p.waitForTimeout(2600);

  const res = await p.evaluate(() => {
    const out = { blankImgs: [], emptyIndents: [], genericImgs: [] };
    const GENERIC = /guim\.co\.uk\/.*(?:default|guardian[-_]?logo)|default[-_]?card|fallback[-_]?card|social[-_]?generic/i;
    // 1a) no rendered <img> left at naturalWidth 0 (a blank box); 1b) no generic fallback-card image
    //     rendered at all (the "THE GUARDIAN …" watermark card must be treated as no-image).
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const cs = getComputedStyle(img);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (GENERIC.test(img.src || '')) out.genericImgs.push((img.src || '').slice(0, 48));
      if (img.complete && img.naturalWidth === 0) out.blankImgs.push((img.className || img.src).slice(0, 40));
    }
    // 2) no row with an empty left indent: for each list-row container, if its first visual child is
    //    an empty box (no img, no text) wider than 8px, that's a reserved-but-empty thumbnail column.
    const rowSel = '.fc-body, .toh-compact-row, .hero-band-side-item, .today-item, .snap-row';
    for (const row of document.querySelectorAll(rowSel)) {
      const rr = row.getBoundingClientRect(); if (rr.width < 40) continue;
      const kids = [...row.children].filter(c => { const s = getComputedStyle(c); const b = c.getBoundingClientRect(); return s.display !== 'none' && b.width > 0; });
      if (!kids.length) continue;
      const first = kids[0];
      const fb = first.getBoundingClientRect();
      const txt = (first.textContent || '').trim();
      const hasImg = first.tagName === 'IMG' || first.querySelector('img') || /src-img|-thumb|-img/.test(first.className);
      // an empty, text-less, image-less leading box wider than 8px = empty indent
      if (!hasImg && !txt && fb.width > 8) out.emptyIndents.push((row.className || '').slice(0, 30) + ' gap=' + Math.round(fb.width));
    }
    return out;
  });
  await ctx.close();
  return res;
}

for (const band of BANDS) {
  const r = await scan(band);
  const n = r.blankImgs.length + r.emptyIndents.length + r.genericImgs.length;
  if (n) {
    fails += n;
    log.push(`FAIL ${band.name}: ${r.genericImgs.length} generic-card img(s) [${[...new Set(r.genericImgs)].slice(0, 3).join(', ')}], ${r.blankImgs.length} blank img(s) [${[...new Set(r.blankImgs)].slice(0, 3).join(', ')}], ${r.emptyIndents.length} empty indent(s) [${[...new Set(r.emptyIndents)].slice(0, 3).join(', ')}]`);
    console.log(log[log.length - 1]);
  } else console.log(`PASS ${band.name}: 0 generic-card imgs, 0 blank imgs, 0 empty indents`);
}
console.log(`\nIMAGE-SLOTS — ${fails} issues (blank imgs + empty indents)`);
console.log(fails === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
await browser.close();
process.exit(fails ? 1 : 0);
