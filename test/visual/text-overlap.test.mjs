// O0: generic text-overlap test. Fails if two text-bearing leaf elements intersect by >1px,
// unless allow-listed (hero/lead text over its own media, image placeholder labels, badges,
// the chat button — handled in O3). Runs the real-shape fixtures across widths + themes + pages.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';
const BASE=(process.env.BASE||'http://localhost:8137')+'/?debug=1';
const WIDTHS = [[390,844],[430,932],[820,1180],[1024,1366],[1100,900],[1101,900],[1180,900],[1194,834],[1280,900],[1440,900]];
const PAGES = ['general','business','bloom','sports','briefing','stateofplay'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let totalFails = 0, railTotal = 0; const railSample = [];
async function run(w,h,route,dark) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:w<=430, hasTouch:w<=430, colorScheme:dark?'dark':'light' });
  const p = await ctx.newPage();
  if (dark) await p.addInitScript(()=>{try{localStorage.setItem('dark','true')}catch{}});
  await installRealFixtures(p,{delayMax:150});
  await p.goto(BASE,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(1600);
  if (route!=='general'){ await p.evaluate(r=>window.__nav(r),route).catch(()=>{}); await p.waitForTimeout(1600); }
  const pairs = await p.evaluate(() => {
    const ALLOW = (el)=> el.closest('.toh-card-lead,.snap-lead,.snap-hero,.mh-lead,.hero-band,.sports-hero,.gn-lead,.ph-label,.cat-tag,.toh-cat,.snap-badge,.chatbot-fab,.chat-fab,[class*="chat"],.toh-img-ph,.bottom-tabs,.topbar-wrap,.header-scroll,.nav-bar,.nav-wrap,.topbar-scores,.more-sheet,.mobile-search,.score-strip-scroll,.ss-ticker,.home-scores-scroll,.sports-score-strip,.bottom-topics-chips,.chip-bar,.trending-now-row');
    const vis = el => { const s=getComputedStyle(el); if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.1) return false; const r=el.getBoundingClientRect(); return r.width>1&&r.height>1; };
    // text-bearing leaves: has non-space text, and no child ELEMENT carrying its own visible text
    const leaves=[];
    const all=document.querySelectorAll('.hub *');
    for (const el of all) {
      const tag=el.tagName; if(/^(SCRIPT|STYLE|SVG|PATH|IMG|BUTTON)$/.test(tag)) {}
      const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
      if (own.length<2) continue;
      if (!vis(el)) continue;
      // leaf-ish: skip if it has a child element that itself is a text leaf (avoid container double-count)
      leaves.push(el);
    }
    const box=el=>el.getBoundingClientRect();
    const out=[];
    for (let i=0;i<leaves.length;i++){ for(let j=i+1;j<leaves.length;j++){
      const a=leaves[i], c=leaves[j];
      if (a.contains(c)||c.contains(a)) continue;
      const ra=box(a), rb=box(c);
      const ox=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left);
      const oy=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top);
      if (ox>1 && oy>1 && ox*oy>4) {
        if (ALLOW(a)||ALLOW(c)) continue;
        const lbl=e=>{const t=(e.className&&typeof e.className==='string')?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):e.tagName.toLowerCase(); return t+' "'+([...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim().slice(0,22))+'"';};
        const rail=(a.closest('.sidebar')||c.closest('.sidebar'))?'RAIL ':''; out.push(`${rail}${lbl(a)}  ∩  ${lbl(c)}  [${Math.round(ox)}x${Math.round(oy)}px]`);
      }
    }}
    return [...new Set(out)];
  });
  await ctx.close();
  const tag=`${w}x${h} ${route} ${dark?'dark':'light'}`;
  const railp=pairs.filter(x=>x.startsWith('RAIL')); if (pairs.length){ totalFails += pairs.length; railTotal += railp.length; const show=railp.length?railp:pairs; if(railp.length && railSample.length<12){ railSample.push(`[${tag}]`); show.slice(0,3).forEach(x=>railSample.push('   '+x)); } }
  return pairs.length;
}
let gridFails=0;
for (const dark of [false,true]) for (const [w,h] of WIDTHS) for (const route of PAGES) { const n=await run(w,h,route,dark); if(n) gridFails++; }
console.log(`\n=== O0 OVERLAP — ${totalFails} total, ${railTotal} in the RAIL, across ${gridFails} cells ===`);
railSample.forEach(s=>console.log(s));
console.log(totalFails?`\nFAIL (${totalFails} overlaps)`:'\nPASS: no unexpected text overlaps');
await b.close();
process.exit(totalFails?1:0);
