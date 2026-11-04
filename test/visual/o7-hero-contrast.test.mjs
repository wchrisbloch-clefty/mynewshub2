// O7: hero/lead legibility. The phone/tablet lead renders its headline + source in white over
// the photo, behind a bottom scrim. This test SAMPLES the real rendered pixels behind that text
// (image + scrim composited, text itself hidden) and asserts white passes WCAG 4.5:1 at the
// BRIGHTEST pixel in each text box — tested over a pure-WHITE hero image, the worst case, so a
// pass here holds for any real photo. Chromium only; Safari = NEEDS-DEVICE.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
// Guaranteed-OPAQUE pure-white hero image (SVG rect) — object-fit:cover fills the box with
// solid #fff, the brightest possible photo and the hardest case for white text.
const WHITE_IMG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#ffffff"/></svg>').toString('base64');

const browser = await chromium.launch();
let failures = 0;
const log = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };

for (const dark of [false, true]) {
  for (const [w, h] of [[390, 844], [820, 1180]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await installRealFixtures(page);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.__nav && window.__nav('general'));
    const hero = await page.waitForSelector('.snap-hero-media', { timeout: 15000 }).catch(() => null);
    const tag = `[${dark ? 'dark ' : 'light'} ${w}]`;
    if (!hero) { console.log(`SKIP  ${tag} no overlay hero at this width`); await ctx.close(); continue; }

    // worst case: force the hero image to pure white, then wait for it to paint.
    await page.evaluate((src) => { const im = document.querySelector('.snap-hero-img'); if (im) { im.src = src; } }, WHITE_IMG);
    await page.waitForTimeout(400);

    const boxes = await page.evaluate(() => {
      const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
      return {
        media: r(document.querySelector('.snap-hero-media')),
        title: r(document.querySelector('.snap-hero-title')),
        source: r(document.querySelector('.snap-hero-source')),
      };
    });
    if (!boxes.media || !boxes.title) { console.log(`SKIP  ${tag} hero text not found`); await ctx.close(); continue; }

    // hide the text so we sample ONLY the background (image + scrim) beneath it.
    await page.addStyleTag({ content: '.snap-hero-title,.snap-hero-source,.snap-hero-time,.snap-hero-meta,.snap-opinion,.snap-live{opacity:0 !important;}' });
    await page.waitForTimeout(80);
    const clip = { x: Math.max(0, boxes.media.x), y: Math.max(0, boxes.media.y), width: boxes.media.width, height: boxes.media.height };
    const buf = await page.screenshot({ clip });
    const b64 = buf.toString('base64');

    // decode + sample inside the browser (true rendered pixels).
    const res = await page.evaluate(async ({ b64, boxes }) => {
      const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const sx = img.naturalWidth / boxes.media.width, sy = img.naturalHeight / boxes.media.height;
      const sample = box => {
        if (!box) return null;
        const x0 = Math.max(0, Math.floor((box.x - boxes.media.x) * sx));
        const y0 = Math.max(0, Math.floor((box.y - boxes.media.y) * sy));
        const x1 = Math.min(c.width, Math.ceil((box.x + box.width - boxes.media.x) * sx));
        const y1 = Math.min(c.height, Math.ceil((box.y + box.height - boxes.media.y) * sy));
        const dw = Math.max(1, x1 - x0), dh = Math.max(1, y1 - y0);
        const data = g.getImageData(x0, y0, dw, dh).data;
        let maxL = 0;
        for (let i = 0; i < data.length; i += 4) { const L = lum(data[i], data[i + 1], data[i + 2]); if (L > maxL) maxL = L; }
        return maxL;
      };
      return { titleL: sample(boxes.title), sourceL: sample(boxes.source) };
    }, { b64, boxes });

    // white text L=1.0; contrast = (1+0.05)/(Lbg+0.05) at the brightest background pixel.
    const contrast = L => (1.0 + 0.05) / (L + 0.05);
    const cTitle = contrast(res.titleL);
    const cSource = res.sourceL != null ? contrast(res.sourceL) : null;
    log(cTitle >= 4.5, `${tag} headline white contrast ${cTitle.toFixed(2)}:1 (>=4.5 over pure-white image)`);
    if (cSource != null) log(cSource >= 4.5, `${tag} source white contrast ${cSource.toFixed(2)}:1 (>=4.5)`);

    await ctx.close();
  }
}

await browser.close();
console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
