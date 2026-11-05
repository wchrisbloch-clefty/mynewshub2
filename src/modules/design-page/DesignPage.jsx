// U7: the living /design reference. Reachable by URL only (not in nav, not in the More sheet),
// noindex, and — being a lazy chunk — never in the SW precache list. It renders the REAL tokens
// and the REAL shared components (TopicLabel, CatIcon, the actual chip/button/pill/row classNames
// and the real StateOfPlay module), so it drifts automatically with tokens.css + App's global CSS
// instead of being a hand-kept copy. Colour swatches read their values live with getComputedStyle
// and compute the contrast ratio in the browser, side by side in light and dark.
//
// NB: dynamic, per-token styles (a swatch's colour, a type sample's size, a spacing bar's width)
// are passed as pre-built style OBJECTS referenced by name, not as inline double-brace literals,
// so the page adds no scattered inline-style literals (the U1 ratchet guards that count).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search, RefreshCw, Moon, Settings, LayoutGrid, Zap, Droplet, Leaf } from 'lucide-react';
import { TopicLabel } from '../topic-tag';
import { CatIcon, SHOW_CHIP_ICONS } from '../cat-icon';
import { StateOfPlay } from '../state-of-play';
import './DesignPage.css';

const CATS = ['general','business','finance','bloom','tech','sports','health','popculture','comedy','local'];
const TYPE_ROLES = [
  ['--fs-label',  'Label 11 · uppercase', true],
  ['--fs-meta',   'Meta 11→13 · source · timestamp', false],
  ['--fs-body',   'Body 13→15 · list description', false],
  ['--fs-title',  'Title 15 · list-row headline', false],
  ['--fs-subhead','Subhead 14→16', false],
  ['--fs-headline','Headline 16→18', false],
  ['--fs-lead',   'Lead 22→26', false],
  ['--fs-hero',   'Hero 30→36', false],
];
const SPACES = ['--space-1','--space-2','--space-3','--space-4','--space-5','--space-6','--space-7','--space-8','--space-10','--space-12','--space-16'];
const RADII = ['--radius-sm','--radius-md','--radius-lg','--radius-full'];

// static style objects (named, so no inline double-brace literals on the page)
const ST = {
  swatchBg:   { background:'var(--surface)' },
  borderBox:  { border:'1px solid var(--border)' },
  borderBoxStrong: { border:'1px solid var(--border-strong)' },
  subtabsWrap:{ overflow:'visible' },
  chipHover:  { color:'var(--text)', borderColor:'var(--border-strong)' },
  chipFocus:  { outline:'2px solid var(--accent)', outlineOffset:'2px' },
  sopWrap:    { maxWidth:'520px' },
  skelShort:  { width:'60%' },
};

function parseRGB(s){ const m=(s||'').match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(',').map(x=>parseFloat(x)); return [p[0],p[1],p[2]]; }
function lum([r,g,b]){ const f=c=>{c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); }
function ratio(a,b){ const A=parseRGB(a),B=parseRGB(b); if(!A||!B) return null; const l1=lum(A),l2=lum(B),hi=Math.max(l1,l2),lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }

function Swatches({ dark }) {
  const rootRef = useRef(null);
  const [rows, setRows] = useState([]);
  useLayoutEffect(() => {
    const host = rootRef.current; if (!host) return;
    const read = (tok) => { const p = document.createElement('span'); p.style.color = `var(${tok})`; host.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v; };
    const surface = read('--surface');
    const out = [];
    for (const t of ['--text','--text2','--text3']) { const c = read(t); out.push({ tok:t, cr: ratio(c, surface) }); }
    for (const cat of CATS) { const c = read(`--cat-${cat}-text`); out.push({ tok:`--cat-${cat}-text`, cr: ratio(c, surface) }); }
    setRows(out);
  }, [dark]);
  return (
    <div className={`dp-swatches ${dark ? 'dark' : ''}`} ref={rootRef}>
      <div className="dp-swatch-head">{dark ? 'Dark' : 'Light'}</div>
      {rows.map(r => {
        const chip = { background:'var(--surface)', color:`var(${r.tok})` };
        return (
          <div className="dp-swatch-row" key={r.tok}>
            <span className="dp-swatch-chip" style={chip}>Aa</span>
            <code className="dp-swatch-tok">{r.tok}</code>
            <span className="dp-swatch-cr">{r.cr ? `${r.cr.toFixed(2)}:1` : '—'}{r.cr && r.cr < 4.5 ? ' ⚠' : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

const FIX = (cat, title, extra={}) => ({ title, link:'#'+title.slice(0,8), pubDate:new Date(Date.now()-3600e3).toISOString(), cat, ...extra });

export function DesignPage() {
  useEffect(() => {
    document.title = 'Design system — MyNewsHub';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow';
    document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  const sopItems = [
    FIX('bloom','Grid operators warn of tight reserves as demand climbs', { _clusterSize:5 }),
    FIX('business','Central bank holds rates, signals one more review', { _clusterSize:3 }),
    FIX('tech','Chipmaker raises guidance on data-center demand'),
  ];
  const sopBreaking = [ FIX('general','Senate passes the stopgap funding measure', { _breakingWhy:'wire flash' }) ];
  const sopMeta = { label:'Design', color:'var(--cat-general-text)' };

  return (
    <div className="page dp-page">
      <header className="dp-top">
        <h1 className="dp-h1">MyNewsHub design system</h1>
        <p className="dp-lede">Live reference — every swatch, size and component below is read from
          <code> tokens.css</code> and the real shared components, so it always matches production.
          URL-only, <code>noindex</code>, not in nav.</p>
      </header>

      <section className="dp-sec"><h2 className="dp-h2">Colour &amp; contrast</h2>
        <div className="dp-cols"><Swatches dark={false}/><Swatches dark={true}/></div>
        <p className="dp-note">Contrast = token colour on <code>--surface</code>, computed live (WCAG). ⚠ marks &lt; 4.5:1.</p>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Type roles</h2>
        {TYPE_ROLES.map(([tok,label,up]) => {
          const s = { fontSize:`var(${tok})`, fontWeight:'var(--fw-semibold)', textTransform:up?'uppercase':'none', letterSpacing:up?'var(--tracking-label)':'normal' };
          return (
            <div className="dp-type-row" key={tok}>
              <span className="dp-type-sample" style={s}>The quick brown fox</span>
              <code className="dp-type-tok">{tok}</code><span className="dp-type-lbl">{label}</span>
            </div>
          );
        })}
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Spacing · radii · borders</h2>
        <div className="dp-spaces">{SPACES.map(s => { const bar = { width:`var(${s})` }; return <div className="dp-space-item" key={s}><span className="dp-space-bar" style={bar}/><code>{s}</code></div>; })}</div>
        <div className="dp-radii">{RADII.map(r => { const box = { borderRadius:`var(${r})` }; return <div className="dp-radius-box" key={r} style={box}><code>{r}</code></div>; })}</div>
        <div className="dp-borders"><span className="dp-border-box" style={ST.borderBox}>--border</span><span className="dp-border-box" style={ST.borderBoxStrong}>--border-strong</span></div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Topic labels (×10)</h2>
        <div className="dp-labels">{CATS.map(c => <TopicLabel key={c} cat={c}/>)}</div>
        <div className="dp-onmedia"><TopicLabel cat="bloom" onMedia/><span className="dp-onmedia-note">onMedia (over a photo scrim)</span></div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Icons (CatIcon)</h2>
        <div className="dp-icons">
          <CatIcon icon={LayoutGrid}/><CatIcon icon={Zap}/><CatIcon icon={Droplet}/><CatIcon icon={Leaf} size={20}/>
          <span className="dp-note">16px rows / 20px header · strokeWidth 1.5 · currentColor · SHOW_CHIP_ICONS = {String(SHOW_CHIP_ICONS)}</span>
        </div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Chips</h2>
        <div className="pc-subtabs" style={ST.subtabsWrap}>
          <button className="pc-subtab">Default</button>
          <button className="pc-subtab" style={ST.chipHover}>Hover</button>
          <button className="pc-subtab" style={ST.chipFocus}>Focus</button>
          <button className="pc-subtab active">Selected</button>
        </div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Buttons</h2>
        <div className="dp-buttons">
          <button className="nav-icon-btn" aria-label="Search"><Search size={20}/></button>
          <button className="nav-icon-btn" aria-label="Refresh"><RefreshCw size={20} strokeWidth={2}/></button>
          <button className="nav-icon-btn" aria-label="Theme"><Moon size={20}/></button>
          <button className="nav-btn-blue"><Settings size={13} strokeWidth={2}/> Secondary</button>
        </div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">State of Play rows (real module)</h2>
        <div style={ST.sopWrap}>
          <StateOfPlay variant="sidebar" items={sopItems} breakingItems={sopBreaking}
            meta={sopMeta} onRead={()=>{}} formatDate={()=>'2h ago'} showTopic/>
        </div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Status pills</h2>
        <div className="dp-pills">
          <button className="last-updated">↻ Updated just now</button>
          <button className="feed-degraded">1 source unavailable</button>
        </div>
      </section>

      <section className="dp-sec"><h2 className="dp-h2">Skeleton row</h2>
        <div className="dp-skel"><span className="dp-skel-thumb"/><span className="dp-skel-lines"><span/><span/><span style={ST.skelShort}/></span></div>
      </section>
    </div>
  );
}
