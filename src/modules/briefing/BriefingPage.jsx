// ─── THE BRIEFING PAGE ────────────────────────────────────────────────────────
// Extracted from App.jsx (I2). Pure module — every app dependency is passed as a prop
// (its Briefing-only BriefingArticleItem is nested here so it reads the same props).
// ShareControl/buildBriefingExcerpt come from the share module; Sparkles from lucide.
// Styles are the global .briefing-*/.ba-*/.today-* rules. Lazy + idle/hover-prefetched.
import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { ShareControl, buildBriefingExcerpt } from '../share';

export function BriefingPage({ arts, briefingExclude, lastUpdated, briefingSourceList, loadCat, handleTabChange,
  openCustomize, onRead, fetchAISummary, fmtDate, CoverImg, MorningBriefingInline,
  ExplainContent, CATS, DEFAULT_FEEDS, BRIEFING_EXCLUDE_CATS, PREVIEW_LABEL, LastUpdated }) {
  const BriefingArticleItem = ({ a }) => {
    const [showSum,setShowSum]     = useState(false);
    const [sum,setSum]             = useState('');
    const [sumPreview,setSumPreview] = useState(false);
    const [sumErr,setSumErr]       = useState('');
    const [loadSum,setLoadSum]     = useState(false);
    const [showEx,setShowEx]       = useState(false);
    const [exText,setExText]       = useState('');
    const [loadEx,setLoadEx]       = useState(false);
    const [speaking,setSpeaking]   = useState(false);

    const handleAI = async (e) => {
      e.stopPropagation();
      if (showSum) { setShowSum(false); return; }
      if (sum||sumErr) { setShowSum(true); return; }
      setShowSum(true); setLoadSum(true);
      const {summary,error,fromPreview} = await fetchAISummary({type:'article',title:a.title,content:a.desc||'',url:a.link});
      if (summary) { setSum(summary); setSumPreview(!!fromPreview); } else setSumErr(error||'Unavailable');
      setLoadSum(false);
    };

    const handleExplain = async (e) => {
      e.stopPropagation();
      if (showEx) { setShowEx(false); return; }
      if (exText) { setShowEx(true); return; }
      setShowEx(true); setLoadEx(true);
      const {summary:text} = await fetchAISummary({type:'article',title:a.title,content:a.desc||'',mode:'explain',url:a.link});
      setExText(text||'Could not explain.');
      setLoadEx(false);
    };

    const handleListen = (e) => {
      e.stopPropagation();
      if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      const utt = new SpeechSynthesisUtterance(`${a.title}. ${sum||a.desc||''}`);
      utt.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utt); setSpeaking(true);
    };

    return (
      <div className="ba-item">
        <div className="ba-main" onClick={()=>onRead(a)}>
          <div className="gf-thumb"><CoverImg src={a.img} label={a.source}/></div>
          <div className="gf-body">
            <div className="gf-title">{a.title}</div>
            <div className="gf-meta">
              <span>{a.source}</span><span>·</span><span>{fmtDate(a.pubDate)}</span>
            </div>
            <div className="ba-actions" onClick={e=>e.stopPropagation()}>
              <button className={`ba-btn${showSum?' on':''}`} onClick={handleAI}>
                {loadSum?'…':<Sparkles size={13} aria-hidden="true"/>} {showSum?'Hide':'Summary'}
              </button>
              <button className={`ba-btn${showEx?' on':''}`} onClick={handleExplain}>
                {loadEx?'…':''} {showEx?'Hide':'Explain'}
              </button>
              <button className={`ba-btn${speaking?' on':''}`} onClick={handleListen}>
                {speaking?'⏹':''} {speaking?'Stop':'Listen'}
              </button>
              <ShareControl className="ba-share" title={a.title} url={a.link} source={a.source}/>
            </div>
          </div>
        </div>
        {showSum&&<div className="ba-panel">{loadSum?<em style={{color:'var(--text3)'}}>Generating…</em>:sumErr?<span style={{color:'var(--red)'}}>{sumErr}</span>:<>{sumPreview&&<div className="fc-preview-note" style={{marginBottom:'8px'}}>{PREVIEW_LABEL}</div>}{sum}</>}</div>}
        {showEx&&<div className="ba-panel">{loadEx?<em style={{color:'var(--text3)'}}>Analyzing…</em>:<ExplainContent text={exText}/>}</div>}
      </div>
    );
  };

    // Tier 1: priority briefing sources, latest 2 each
    const tier1 = useMemo(() => {
      const allArts = Object.values(arts).flat();
      const out = [];
      const seen = new Set();
      briefingSourceList().forEach(srcName => {
        const matches = allArts
          .filter(a => a.source === srcName)
          .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 2);
        matches.forEach(a => {
          out.push({...a, _priority: srcName});
          seen.add(a.title.slice(0,60).toLowerCase().replace(/\s+/g,''));
        });
      });
      return { items: out, seen };
    }, [arts]);

    // Tier 2: per-category top 5, excluding Comedy + dedup against Tier 1
    const tier2 = useMemo(() => {
      const out = {};
      Object.entries(arts).forEach(([cat, list]) => {
        if (BRIEFING_EXCLUDE_CATS.includes(cat)) return;
        const headlines = (list || [])
          .filter(a => {
            const key = a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
            return !tier1.seen.has(key);
          })
          .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 5);
        if (headlines.length > 0) out[cat] = headlines;
      });
      return out;
    }, [arts, tier1.seen]);

    return (
      <div className="page">
        <div className="today-flow" style={{maxWidth:'780px'}}>
          <header className="briefing-page-head">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
              <h1 className="briefing-page-title">The Briefing</h1>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                {/* G2: share a plain-text briefing excerpt (same ShareControl, text override). */}
                <ShareControl label="Share briefing" title="MyNewsHub — The Briefing"
                  url="https://mynewshub2.vercel.app"
                  text={buildBriefingExcerpt([...tier1.items, ...Object.values(tier2).flat()], {
                    date: new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}),
                    site: 'https://mynewshub2.vercel.app' })}/>
                {/* D6: manual refresh — reloads the feeds the briefing is built from. */}
                <LastUpdated timestamp={lastUpdated.general} onRefresh={() => Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c))}/>
              </div>
            </div>
            <p className="briefing-page-sub">
              A daily synthesis in the spirit of Morning Brew, Axios, and Bloomberg 5 Things —
              built from priority briefing sources plus the top headlines across every category.
              Regenerates when stale (90+ min) each time you open it.
            </p>
          </header>

          {/* The synthesized briefing itself (paragraph + bullets) */}
          <MorningBriefingInline arts={arts} excludeCats={briefingExclude}/>

          {/* Tier 1 — Priority briefings */}
          <section className="briefing-sources">
            <div className="briefing-sources-head">
              <span className="briefing-sources-label">Priority briefings</span>
              <span className="briefing-sources-meta">
                {tier1.items.length} articles from {briefingSourceList().join(' · ')}
              </span>
            </div>
            {tier1.items.length === 0
              ? <div style={{padding:'14px 0',fontSize:'12px',color:'var(--text3)'}}>
                  Priority briefing sources haven't loaded yet. Make sure {briefingSourceList().join(', ')} are enabled in your General feeds.
                </div>
              : tier1.items.map((a, i) => (
                  <BriefingArticleItem key={`t1-${i}`} a={a}/>
                ))}
          </section>

          {/* Tier 2 — Per-category top headlines */}
          {Object.entries(tier2).map(([cat, headlines]) => {
            const cc = CATS[cat] || CATS.general;
            return (
              <section key={cat} className="briefing-sources">
                <div className="briefing-sources-head">
                  <span className="briefing-sources-label" style={{color:cc.color}}>
                    {cc.label}
                  </span>
                  <button className="today-section-link" onClick={()=>handleTabChange(cat)}>
                    See all in {cc.label} →
                  </button>
                </div>
                {headlines.map((a, i) => (
                  <BriefingArticleItem key={`${cat}-${i}`} a={a}/>
                ))}
              </section>
            );
          })}

          <div style={{textAlign:'center',padding:'32px 0 16px',fontSize:'11px',color:'var(--text3)'}}>
            Customize the briefing input by adding sources to General feeds.
            <br/>
            <button className="today-section-link" style={{marginTop:'8px'}} onClick={()=>openCustomize('sources','general')}>
              Customize feeds →
            </button>
          </div>
        </div>
      </div>
    );
}
