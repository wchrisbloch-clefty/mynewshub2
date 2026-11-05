// V3: reusable "empty bordered container" detector. Fails if any element with a VISIBLE border,
// area > 8000 px^2, and NO text/media descendant is on screen — i.e. an empty bordered box (the
// T4 "never an empty box" rule). W7: ALSO fails a bordered container whose ONLY text is its own
// header (a reserved box showing just its title, e.g. an "Across MyNewsHub" header with no items) —
// that reads as an empty box too. Transient skeletons that resolve within ~1s are allow-listed by
// class. Runs on Home/Energy/Sports/Business/Briefing at the desktop + phone widths CB cares about.
// Uses the shared real-shape fixtures, so it needs the dist server (BASE, default :8137).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const PAGES = [['home','general'],['energy','bloom'],['sports','sports'],['business','business'],['briefing','briefing']];
const WIDTHS = [[1101,900],[1194,900],[1280,900],[1440,900],[390,844],[430,932]];
// classes that are allowed to be briefly empty (skeleton placeholders that resolve <=1s)
const SKELETON_ALLOW = ['skeleton','skel','-reserve','sop-reserve','toh-reserve','reserve'];

const browser = await chromium.launch();
let fails = 0;

async function scan(w, h, route) {
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1, isMobile:w<=640, hasTouch:w<=640 });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil:'domcontentloaded' });
  if (route !== 'general') { await p.evaluate(r => window.__nav && window.__nav(r), route).catch(()=>{}); }
  await p.waitForTimeout(2600); // let skeletons resolve (>1s)
  const boxes = await p.evaluate((allow) => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const bw = parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth)+parseFloat(cs.borderLeftWidth)+parseFloat(cs.borderRightWidth);
      const visibleBorder = bw > 0 && cs.borderStyle !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(cs.borderTopColor) && cs.borderTopColor !== 'transparent';
      if (!visibleBorder) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width * r.height < 8000) continue;
      const cls = el.className ? String(el.className) : '';
      if (allow.some(a => cls.includes(a))) continue;
      const txt = (el.textContent || '').trim();
      const media = el.querySelector('img,svg,video,canvas,picture,input,button,textarea');
      if (txt.length === 0 && !media) { out.push({ cls: cls.slice(0,44), w:Math.round(r.width), h:Math.round(r.height), kind:'empty' }); continue; }
      // W7: header-only box — a bordered container whose only text sits inside a header child
      // (.sidebar-sec-head / *-head / *-header / <header> / h1–h6) and which has no body content.
      const isHeaderNode = (node) => {
        let c = node;
        while (c && c !== el) {
          const cl = String(c.className || '');
          if (/(^|[\s-])(head|header|sec-head|sec-label)([\s-]|$)/.test(cl) || /^H[1-6]$/.test(c.tagName) || c.tagName === 'HEADER') return true;
          c = c.parentElement;
        }
        return false;
      };
      // A collapsed section (an aria-expanded toggle) is NOT an empty box — it has content behind
      // the toggle and a way to reveal it. Only a header with no body AND no way to expand counts.
      const collapsible = el.querySelector('[aria-expanded],[class*="collapse"]');
      const headers = el.querySelectorAll('[class*="-head"],[class*="-header"],header,h1,h2,h3,h4,h5,h6');
      if (headers.length && !collapsible) {
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let bodyText = '', tn;
        while ((tn = tw.nextNode())) { const t = tn.nodeValue.trim(); if (t && !isHeaderNode(tn.parentElement)) bodyText += t; }
        const bodyMedia = [...el.querySelectorAll('img,svg,video,canvas,picture,input,button,textarea')].some(m => !isHeaderNode(m));
        if (bodyText.length === 0 && !bodyMedia) out.push({ cls: cls.slice(0,44), w:Math.round(r.width), h:Math.round(r.height), kind:'header-only' });
      }
    }
    return out;
  }, SKELETON_ALLOW);
  await ctx.close();
  return boxes;
}

for (const [w,h] of WIDTHS) {
  for (const [name,route] of PAGES) {
    const boxes = await scan(w, h, route);
    if (boxes.length) {
      fails++;
      console.log(`FAIL  [${name} ${w}] empty bordered box: ${boxes.map(b=>`<.${b.cls}> ${b.w}x${b.h} (${b.kind})`).join(', ')}`);
    } else {
      console.log(`PASS  [${name} ${w}] no empty bordered container`);
    }
  }
}
console.log(`\nEMPTY-BOX DETECTOR — ${fails===0 ? 'ALL PASS (no empty bordered boxes)' : fails+' FAIL'}`);
await browser.close();
process.exit(fails ? 1 : 0);
