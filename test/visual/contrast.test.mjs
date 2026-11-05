// W1: dark+light contrast scanner. For every text-bearing leaf it computes the foreground colour
// against the first OPAQUE ancestor background (falling back to the page canvas), and fails WCAG AA:
// 4.5:1 normal text, 3:1 for large text (>=24px, or >=19px when bold >=700). Text drawn over a
// photo/gradient (no opaque ancestor until the canvas) is covered by the dedicated O7 hero-contrast
// test and is skipped here (marked on-media). Uses the shared real-shape fixtures; needs the dist
// server (BASE, default :8137). Runs Home/Energy/Sports/Business/Briefing/State-of-Play at
// 390/820/1194, light + dark.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const PAGES = [['home','general'],['energy','bloom'],['sports','sports'],['business','business'],['briefing','briefing'],['sop','stateofplay']];
const WIDTHS = [390, 820, 1194];

const browser = await chromium.launch();
let totalLeaves = 0, totalFail = 0;
const failSamples = [];

async function scan(w, route, dark) {
  const ctx = await browser.newContext({ viewport:{width:w,height:1100}, deviceScaleFactor:1, isMobile:w<=640, hasTouch:w<=640 });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.goto(BASE, { waitUntil:'domcontentloaded' });
  await p.waitForFunction(()=>typeof window.__nav==='function',{timeout:12000}).catch(()=>{});
  if (route !== 'general') await p.evaluate(r=>window.__nav(r), route).catch(()=>{});
  await p.evaluate(d=>document.documentElement.classList.toggle('dark', d), dark);
  await p.waitForTimeout(1500);
  const res = await p.evaluate(() => {
    function parse(s){ const m=(s||'').match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(',').map(parseFloat); return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]}; }
    function lum(c){ const f=x=>{x/=255; return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
    function cr(a,b){ const l1=lum(a),l2=lum(b),hi=Math.max(l1,l2),lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }
    function blend(fg,bg){ const a=fg.a; return {r:fg.r*a+bg.r*(1-a), g:fg.g*a+bg.g*(1-a), b:fg.b*a+bg.b*(1-a), a:1}; }
    const canvas = parse(getComputedStyle(document.body).backgroundColor) || {r:255,g:255,b:255,a:1};
    function opaqueBg(el){
      let cur=el, acc=null;
      while(cur){
        const st=getComputedStyle(cur);
        // on-media: a CSS background-image, OR an overlay container that also holds an <img>/<video>
        // (the Top Stories hero / media-card pattern — text absolutely positioned over a photo).
        if(st.backgroundImage !== 'none') return {onImage:true};
        if(cur!==el && (cur.querySelector(':scope > img, :scope > video, :scope > picture') || /(\b|-)(img|media|photo|cover|hero|thumb|grad)(\b|-)/.test(String(cur.className)))) {
          // only treat as on-image when the text sits in the SAME positioned overlay as the media
          if(getComputedStyle(cur).position !== 'static') return {onImage:true};
        }
        // a covering ::before/::after pill (e.g. the active nav-tab accent pill) is the real bg
        for(const pe of ['::before','::after']){
          const ps=getComputedStyle(cur,pe);
          if(ps.content && ps.content!=='none' && ps.position!=='static'){
            const pbc=parse(ps.backgroundColor);
            if(pbc && pbc.a>=0.999){ acc = acc? blend(acc,pbc): pbc; return {bg:acc}; }
          }
        }
        const bc=parse(st.backgroundColor);
        if(bc && bc.a>0){ acc = acc? blend(acc,bc): bc; if(bc.a>=0.999) return {bg:acc}; }
        cur=cur.parentElement;
      }
      return {bg: acc? blend(acc,canvas): canvas};
    }
    const out=[]; let leaves=0;
    const walk=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen=new Set(); let n;
    while(n=walk.nextNode()){
      const txt=n.nodeValue.trim(); if(txt.length<1) continue;
      const el=n.parentElement; if(!el||seen.has(el)) continue; seen.add(el);
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0) continue;
      const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
      // skip decorative single-glyph icons (lucide, arrows) and short logo-badge glyphs (the
      // social-platform badges 𝕏 / in / IG / ▶ are brand logos, not reading text).
      if(txt.length===1 && !/[0-9A-Za-z]/.test(txt)) continue;
      const cls0=String(el.className);
      if(/(-icon\b|-badge\b|plat-icon|-glyph|wordmark)/.test(cls0) && txt.length<=3) continue;
      const fgc=parse(cs.color); if(!fgc) continue;
      const ob=opaqueBg(el);
      leaves++;
      if(ob.onImage) continue; // on-media text -> O7 hero-contrast test
      const fg=fgc.a<1? blend(fgc, ob.bg): fgc;
      const ratio=cr(fg, ob.bg);
      const fs=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight,10)>=700;
      const large = fs>=24 || (fs>=19 && bold);
      const floor = large? 3.0 : 4.5;
      if(ratio < floor - 0.05){
        out.push({cls:(el.className?String(el.className):el.tagName).slice(0,34), txt:txt.slice(0,18), ratio:+ratio.toFixed(2), floor, fg:cs.color, bg:`rgb(${Math.round(ob.bg.r)}, ${Math.round(ob.bg.g)}, ${Math.round(ob.bg.b)})`});
      }
    }
    return {leaves, fails:out};
  });
  await ctx.close();
  return res;
}

for (const dark of [false, true]) {
  for (const w of WIDTHS) {
    for (const [name, route] of PAGES) {
      const r = await scan(w, route, dark);
      totalLeaves += r.leaves; totalFail += r.fails.length;
      const tag = `${name} ${w} ${dark?'dark':'light'}`;
      if (r.fails.length) {
        for (const f of r.fails) failSamples.push(`  [${tag}] <.${f.cls}> "${f.txt}" ${f.ratio}:1 (need ${f.floor}) fg=${f.fg} bg=${f.bg}`);
        console.log(`FAIL ${tag}: ${r.fails.length}`);
      } else console.log(`PASS ${tag} (${r.leaves} leaves)`);
    }
  }
}
console.log(`\nCONTRAST SCANNER — ${totalLeaves} text leaves scanned, ${totalFail} failures`);
if (failSamples.length) { console.log('--- failures (deduped) ---'); [...new Set(failSamples)].slice(0,250).forEach(s=>console.log(s)); }
console.log(totalFail===0 ? 'ALL PASS' : 'FAILURES ABOVE');
await browser.close();
process.exit(totalFail ? 1 : 0);
