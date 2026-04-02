import { useState, useEffect, useCallback } from "react";

const CATS={
  general:{label:'General',color:'#1d4ed8',bg:'#eff6ff',emoji:'🌐'},
  sports:{label:'Sports',color:'#d97706',bg:'#fef3c7',emoji:'🏆'},
  business:{label:'Business',color:'#16a34a',bg:'#f0fdf4',emoji:'⚡'},
  finance:{label:'Finance',color:'#7c3aed',bg:'#f5f3ff',emoji:'📈'},
  bloom:{label:'Bloom Energy',color:'#0369a1',bg:'#e0f2fe',emoji:'🔋'},
  briefing:{label:'Morning Briefing',color:'#b45309',bg:'#fffbeb',emoji:'☀️'},
  podcasts:{label:'Podcasts',color:'#e11d48',bg:'#fff1f2',emoji:'🎙️'}
};

const CROSS_TAGS={
  business:['energy','oil','gas','ERCOT','LNG','power','refinery','petrochemical','industrial','data center','onshoring','infrastructure','pipeline','utility','grid'],
  finance:['market','stock','Fed','inflation','interest rate','investing','economy','GDP','earnings','portfolio','S&P','Nasdaq','crypto','real estate'],
  general:['Houston','Texas','Trump','Congress','White House','Iran','tariff','geopolitical','election','policy'],
  bloom:['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','clean energy','renewable'],
  sports:['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB'],
};

function detectCrossTags(title,desc){
  const text=(title+(desc||'')).toLowerCase();
  const tags=[];
  Object.entries(CROSS_TAGS).forEach(([cat,words])=>{
    words.forEach(w=>{if(text.includes(w.toLowerCase()))tags.push({cat,word:w});});
  });
  const seen=new Set();
  return tags.filter(t=>{if(seen.has(t.cat))return false;seen.add(t.cat);return true;});
}

const PODCAST_FEEDS=[
  {name:'Joe Rogan Experience',host:'Joe Rogan',url:'https://feeds.megaphone.fm/GLT1412515089',emoji:'🟢'},
  {name:'Ben Shapiro Show',host:'Ben Shapiro',url:'https://feeds.megaphone.fm/BVDWV5370667266',emoji:'🔵'},
  {name:'Tucker Carlson Show',host:'Tucker Carlson',url:'https://feeds.megaphone.fm/RSV1597324942',emoji:'🦅'},
  {name:'Candace',host:'Candace Owens',url:'https://feeds.megaphone.fm/candace',emoji:'🎤'},
  {name:'Morning Wire Podcast',host:'Daily Wire',url:'https://feeds.megaphone.fm/BVDWV8747925072',emoji:'☀️'},
  {name:'All-In Podcast',host:'Chamath & Besties',url:'https://allinchamathjason.libsyn.com/rss',emoji:'💰'},
  {name:'Flagrant',host:'Andrew Schulz',url:'https://feeds.megaphone.fm/APPI6857213837',emoji:'🔥'},
];

const BRIEFING_FEEDS=[
  {name:'Axios News',url:'https://api.axios.com/feed/',emoji:'📰',color:'#e05c1a',desc:'Top stories from Axios'},
  {name:'Axios Energy',url:'https://api.axios.com/feed/energy/',emoji:'⚡',color:'#e05c1a',desc:'Energy & climate news'},
  {name:'Axios Houston',url:'https://api.axios.com/feed/houston/',emoji:'🤠',color:'#e05c1a',desc:'Houston local news'},
  {name:'Bloomberg Morning Briefing',url:'https://feeds.bloomberg.com/politics/news.rss',emoji:'📊',color:'#1d4ed8',desc:'Markets & politics'},
  {name:'Morning Brew',url:'https://feeds.feedburner.com/morningbrew/uqaH',emoji:'☕',color:'#2563eb',desc:'Business & tech digest'},
  {name:'Morning Wire',url:'https://feeds.megaphone.fm/BVDWV8747925072',emoji:'📻',color:'#7c3aed',desc:'Daily Wire briefing'},
  {name:'API Brief',url:'https://feeds.feedburner.com/ApiToday',emoji:'🛢️',color:'#92400e',desc:'American Petroleum Institute'},
];

const DEFAULT_KW={
  general:['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB','recruiting','transfer portal'],
  business:['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  briefing:['energy','Houston','economy','markets','AI','tariffs','Fed','oil','gas','tech','petroleum','pipeline'],
};

const DEFAULT_FEEDS={
  general:[
    {name:'BBC News',url:'https://feeds.bbci.co.uk/news/rss.xml',on:true},
    {name:'Reuters Top News',url:'https://feeds.reuters.com/reuters/topNews',on:true},
    {name:'CNBC Top News',url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',on:true},
    {name:'Fox News',url:'https://moxie.foxnews.com/google-publisher/latest.xml',on:true},
    {name:'NY Post',url:'https://nypost.com/feed/',on:true},
    {name:'The Hill',url:'https://thehill.com/homenews/feed/',on:true},
    {name:'TechCrunch',url:'https://techcrunch.com/feed/',on:true},
    {name:'Washington Times',url:'https://www.washingtontimes.com/rss/headlines/news/',on:true},
    {name:'The Guardian US',url:'https://www.theguardian.com/us/rss',on:true},
    {name:'Axios',url:'https://api.axios.com/feed/',on:true},
    {name:'Breitbart',url:'https://feeds.feedburner.com/breitbart',on:true},
    {name:'KHOU Houston',url:'https://www.khou.com/feeds/syndication/rss/news',on:true},
    {name:'Click2Houston',url:'https://www.click2houston.com/rss/news.rss',on:true},
    {name:'Chron.com',url:'https://www.chron.com/rss/feed/News-270.php',on:true},
  ],
  sports:[
    {name:'ESPN NFL',url:'https://www.espn.com/espn/rss/nfl/news',on:true},
    {name:'ESPN MLB',url:'https://www.espn.com/espn/rss/mlb/news',on:true},
    {name:'ESPN CFB',url:'https://www.espn.com/espn/rss/ncf/news',on:true},
    {name:'ESPN CBB',url:'https://www.espn.com/espn/rss/ncb/news',on:true},
    {name:'CBS Sports NFL',url:'https://www.cbssports.com/rss/headlines/nfl',on:true},
    {name:'CBS Sports MLB',url:'https://www.cbssports.com/rss/headlines/mlb',on:true},
    {name:'CBS Sports CFB',url:'https://www.cbssports.com/rss/headlines/college-football',on:true},
    {name:'CBS Sports CBB',url:'https://www.cbssports.com/rss/headlines/college-basketball',on:true},
    {name:'Pro Football Talk',url:'https://www.nbcsports.com/profootballtalk.rss',on:true},
    {name:'Bleacher Report',url:'https://feeds.bleacherreport.com/articles/feed',on:true},
    {name:'247Sports',url:'https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/',on:true},
    {name:'Rivals',url:'https://n.rivals.com//feed',on:true},
    {name:'On3 Recruiting',url:'https://www.on3.com/feed/',on:true},
    {name:'NCAA Basketball',url:'https://www.ncaa.com/news/basketball-men/d1/rss.xml',on:true},
    {name:'NCAA Football',url:'https://www.ncaa.com/news/football/fbs/rss.xml',on:true},
    {name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',on:true},
    {name:'The Spun',url:'https://thespun.com/.rss/full/',on:true},
    {name:'Yardbarker',url:'https://www.yardbarker.com/rss/sport_merge_nfl',on:true},
  ],
  business:[
    {name:'Reuters Business',url:'https://feeds.reuters.com/reuters/businessNews',on:true},
    {name:'CNBC Energy',url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',on:true},
    {name:'Oilprice.com',url:'https://oilprice.com/rss/main',on:true},
    {name:'Utility Dive',url:'https://www.utilitydive.com/feeds/news/',on:true},
    {name:'Data Center Dynamics',url:'https://www.datacenterdynamics.com/en/rss/',on:true},
    {name:'Power Magazine',url:'https://www.powermag.com/feed/',on:true},
    {name:'Rigzone',url:'https://www.rigzone.com/news/rss/rigzone_latest.aspx',on:true},
    {name:'MIT Tech Review',url:'https://www.technologyreview.com/feed/',on:true},
    {name:'AI News',url:'https://artificialintelligence-news.com/feed/',on:true},
    {name:'Canary Media',url:'https://www.canarymedia.com/rss',on:true},
    {name:'The Guardian Business',url:'https://www.theguardian.com/business/rss',on:true},
    {name:'CNBC Tech',url:'https://www.cnbc.com/id/19854910/device/rss/rss.html',on:true},
  ],
  finance:[
    {name:'MarketWatch',url:'https://feeds.marketwatch.com/marketwatch/topstories/',on:true},
    {name:'Yahoo Finance',url:'https://finance.yahoo.com/news/rssindex',on:true},
    {name:'Reuters Finance',url:'https://feeds.reuters.com/reuters/businessNews',on:true},
    {name:'Kiplinger',url:'https://www.kiplinger.com/rss/all',on:true},
    {name:'Motley Fool',url:'https://www.fool.com/feeds/index.aspx',on:true},
    {name:'Investopedia',url:'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',on:true},
    {name:'BiggerPockets',url:'https://www.biggerpockets.com/blog/feed',on:true},
    {name:'CNBC Finance',url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',on:true},
  ],
  bloom:[
    {name:'Oilprice.com',url:'https://oilprice.com/rss/main',on:true},
    {name:'Utility Dive',url:'https://www.utilitydive.com/feeds/news/',on:true},
    {name:'Data Center Dynamics',url:'https://www.datacenterdynamics.com/en/rss/',on:true},
    {name:'Power Magazine',url:'https://www.powermag.com/feed/',on:true},
    {name:'Reuters Business',url:'https://feeds.reuters.com/reuters/businessNews',on:true},
    {name:'CNBC Energy',url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',on:true},
    {name:'MIT Tech Review',url:'https://www.technologyreview.com/feed/',on:true},
    {name:'Canary Media',url:'https://www.canarymedia.com/rss',on:true},
    {name:'Rigzone',url:'https://www.rigzone.com/news/rss/rigzone_latest.aspx',on:true},
    {name:'AI News',url:'https://artificialintelligence-news.com/feed/',on:true},
    {name:'Motley Fool',url:'https://www.fool.com/feeds/index.aspx',on:true},
    {name:'Investopedia',url:'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',on:true},
  ]
};

const SK='v11_';
function load(k,def){try{const v=localStorage.getItem(SK+k);return v?JSON.parse(v):def;}catch{return def;}}
function save(k,v){try{localStorage.setItem(SK+k,JSON.stringify(v));}catch{}}

function extractImg(html){
  if(!html)return'';
  const m=html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?m[1]:'';
}

function parseXML(txt){
  try{
    const p=new DOMParser(),x=p.parseFromString(txt,'text/xml');
    const items=Array.from(x.querySelectorAll('item')).slice(0,15);
    if(!items.length)return[];
    return items.map(i=>{
      const desc=(i.querySelector('description')?.textContent||i.querySelector('summary')?.textContent||'');
      const cleanDesc=desc.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim().slice(0,350);
      const img=i.querySelector('enclosure')?.getAttribute('url')||i.querySelector('image url')?.textContent||i.querySelector('thumbnail')?.textContent||extractImg(desc)||'';
      const dur=i.querySelector('duration')?.textContent||i.querySelector('itunes\\:duration')?.textContent||'';
      return{
        title:(i.querySelector('title')?.textContent||'').trim(),
        link:i.querySelector('link')?.textContent||i.querySelector('enclosure')?.getAttribute('url')||'',
        desc:cleanDesc,pubDate:i.querySelector('pubDate')?.textContent||i.querySelector('published')?.textContent||'',
        img,duration:dur
      };
    }).filter(i=>i.title&&i.link);
  }catch{return[];}
}

async function fetchRSS(url){
  try{
    const r=await Promise.race([fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    const d=await r.json();
    if(d.status==='ok'&&d.items?.length>0){
      return d.items.map(i=>({
        title:(i.title||'').trim(),link:i.link||'',
        desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,350),
        pubDate:i.pubDate||'',img:i.thumbnail||extractImg(i.description||'')||'',
        duration:i.itunes_duration||''
      })).filter(i=>i.title&&i.link);
    }
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    const d=await r.json();
    if(d.contents){const items=parseXML(d.contents);if(items.length>0)return items;}
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    const txt=await r.text();
    const items=parseXML(txt);if(items.length>0)return items;
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://www.toptal.com/developers/feed2json/to-json?url=${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    const d=await r.json();
    if(d.items?.length>0){
      return d.items.map(i=>({
        title:(i.title||'').trim(),link:i.url||i.id||'',
        desc:(i.content_html||i.content_text||i.summary||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().slice(0,350),
        pubDate:i.date_published||i.date_modified||'',
        img:i.image||extractImg(i.content_html||'')||'',duration:''
      })).filter(i=>i.title&&i.link);
    }
  }catch{}
  return[];
}

async function fetchPodcast(url){
  try{
    const r=await Promise.race([fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`),new Promise((_,rej)=>setTimeout(()=>rej('t'),12000))]);
    const d=await r.json();
    if(d.status==='ok'&&d.items?.length>0){
      return d.items.map(i=>({
        title:(i.title||'').trim(),link:i.link||i.enclosure?.link||'',
        desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().slice(0,400),
        pubDate:i.pubDate||'',img:i.thumbnail||d.feed?.image||'',
        duration:i.itunes_duration||''
      })).filter(i=>i.title);
    }
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),12000))]);
    const d=await r.json();
    if(d.contents){const items=parseXML(d.contents);if(items.length>0)return items;}
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),12000))]);
    const txt=await r.text();
    const items=parseXML(txt);if(items.length>0)return items;
  }catch{}
  return[];
}

function fmtDate(d){
  if(!d)return'';
  try{
    const dt=new Date(d);if(isNaN(dt.getTime()))return'';
    const now=new Date(),diff=Math.floor((now-dt)/1000);
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayName=days[dt.getDay()],mon=months[dt.getMonth()],date=dt.getDate();
    let h=dt.getHours(),m=dt.getMinutes(),ampm=h>=12?'PM':'AM';
    h=h%12||12;const mm=m<10?'0'+m:m;const timeStr=`${h}:${mm} ${ampm}`;
    if(diff<60)return'Just now';
    if(diff<3600)return`${Math.floor(diff/60)}m ago`;
    if(diff<86400)return`${dayName} ${timeStr}`;
    if(diff<604800)return`${dayName} ${timeStr} · ${mon} ${date}`;
    return`${mon} ${date} · ${timeStr}`;
  }catch{return'';}
}

function fmtDuration(s){
  if(!s)return'';
  const parts=s.split(':').map(Number);
  if(parts.length===3){const[h,m]=parts;return h>0?`${h}h ${m}m`:`${m}m`;}
  if(parts.length===2){const[m]=parts;return`${m}m`;}
  const tot=parseInt(s);if(isNaN(tot))return s;
  const h=Math.floor(tot/3600),m=Math.floor((tot%3600)/60);
  return h>0?`${h}h ${m}m`:`${m}m`;
}

const css=`
*{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#f8f9fa;--surface:#fff;--border:#e8e8e8;--border2:#f1f5f9;--text:#0f172a;--text2:#64748b;--text3:#94a3b8;--nav:#fff;--search:#f1f5f9;}
.dark{--bg:#0f172a;--surface:#1e293b;--border:#334155;--border2:#253347;--text:#f1f5f9;--text2:#94a3b8;--text3:#475569;--nav:#1e293b;--search:#0f172a;}
body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transition:background 0.2s;}
.hub{background:var(--bg);min-height:100vh;}
.topbar{background:var(--nav);border-bottom:1px solid var(--border);padding:0 20px;position:sticky;top:0;z-index:200;}
.topbar-inner{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:12px;height:50px;}
.logo{font-size:16px;font-weight:700;color:var(--text);flex-shrink:0;letter-spacing:-0.3px;}
.logo span{color:#1d4ed8;}
.nav-tabs{display:flex;gap:2px;flex:1;overflow-x:auto;border-left:1px solid var(--border);margin-left:8px;padding-left:8px;}
.nav-tab{background:transparent;border:none;color:var(--text3);padding:6px 12px;cursor:pointer;font-size:12px;font-weight:500;white-space:nowrap;font-family:inherit;border-radius:6px;transition:all 0.12s;}
.nav-tab.active{color:#1d4ed8;background:#eff6ff;}
.nav-tab.bloom-tab.active{color:#0369a1;background:#e0f2fe;}
.nav-tab.pod-tab.active{color:#e11d48;background:#fff1f2;}
.nav-tab.brief-tab.active{color:#b45309;background:#fffbeb;}
.nav-tab:hover:not(.active){color:var(--text2);}
.topbar-right{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.search{background:var(--search);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 10px;font-size:12px;width:130px;font-family:inherit;}
.search:focus{outline:1px solid #1d4ed8;}
.btn-icon{background:var(--search);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:13px;font-family:inherit;}
.btn-blue{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:500;font-family:inherit;}
.breaking{background:#dc2626;display:none;padding:6px 20px;}
.breaking.show{display:block;}
.breaking-inner{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:10px;}
.breaking-badge{background:#fff;color:#dc2626;font-size:9px;font-weight:700;border-radius:4px;padding:2px 6px;letter-spacing:0.05em;white-space:nowrap;}
.breaking-text{font-size:11px;color:#fff;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.breaking-x{background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:14px;}
.ts-bar{background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;}
.ts-inner{max-width:1300px;margin:0 auto;display:flex;}
.ts-item{flex:1;min-width:130px;padding:10px 14px;border-right:1px solid var(--border);cursor:pointer;transition:background 0.12s;position:relative;overflow:hidden;}
.ts-item:last-child{border-right:none;}
.ts-item:hover{background:var(--bg);}
.ts-item-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.13;}
.ts-item-content{position:relative;z-index:1;}
.ts-cat{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;}
.ts-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.ts-src{font-size:10px;color:var(--text3);margin-top:2px;}
.main{max-width:1300px;margin:0 auto;padding:16px 20px;}
.today-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.bloom-row{grid-column:1/-1;}
.cat-block{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;}
.cat-block.bloom-block{border-color:#bae6fd;border-width:1.5px;}
.cat-block-head{padding:12px 14px 10px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.cat-block-label{font-size:11px;font-weight:600;display:flex;align-items:center;gap:6px;}
.cat-dot{width:6px;height:6px;border-radius:50%;}
.cat-badge{font-size:9px;color:var(--text3);background:var(--bg);border-radius:8px;padding:1px 6px;border:1px solid var(--border);}
.see-all{font-size:11px;color:#1d4ed8;background:none;border:none;cursor:pointer;font-family:inherit;}
.hero-row{padding:10px 14px;border-bottom:1px solid var(--border2);cursor:pointer;display:flex;gap:10px;align-items:flex-start;transition:background 0.1s;}
.hero-row:hover{background:var(--bg);}
.hero-row:last-child{border-bottom:none;}
.thumb-sm{width:64px;height:48px;border-radius:6px;object-fit:cover;flex-shrink:0;}
.thumb-ph{width:64px;height:48px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;}
.hero-body{flex:1;min-width:0;}
.hero-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.hero-meta{font-size:10px;color:var(--text3);display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.hero-date{font-size:10px;color:var(--text3);margin-top:2px;}
.kw-tag{font-size:9px;border-radius:8px;padding:1px 5px;font-weight:500;}
.mini-acts{display:flex;gap:3px;margin-top:5px;}
.mini-act{background:none;border:1px solid var(--border);border-radius:5px;padding:1px 6px;font-size:9px;cursor:pointer;color:var(--text3);font-family:inherit;}
.mini-act.al{border-color:#1d4ed8;color:#1d4ed8;background:#eff6ff;}
.mini-act.as{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.mini-act.ad{border-color:#ef4444;color:#ef4444;background:#fef2f2;}
.loading-state{padding:24px;text-align:center;font-size:11px;color:var(--text3);}
.bloom-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.bloom-strip-item{padding:10px 14px;border-right:1px solid var(--border2);cursor:pointer;transition:background 0.1s;position:relative;overflow:hidden;}
.bloom-strip-item:last-child{border-right:none;}
.bloom-strip-item:hover{background:var(--bg);}
.bloom-strip-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.1;}
.bloom-strip-content{position:relative;z-index:1;}
.bloom-strip-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bloom-strip-meta{font-size:10px;color:#0369a1;font-weight:500;}
.bloom-strip-date{font-size:9px;color:var(--text3);margin-top:2px;}
.cat-page{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.feed-col{display:flex;flex-direction:column;gap:10px;}
.feed-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all 0.12s;}
.feed-card:hover{border-color:#bfdbfe;box-shadow:0 2px 12px rgba(29,78,216,0.08);}
.feed-card.bloom-card:hover{border-color:#bae6fd;}
.feed-hero-img{width:100%;height:180px;object-fit:cover;display:block;}
.feed-hero-ph{width:100%;height:100px;display:flex;align-items:center;justify-content:center;font-size:36px;}
.feed-card-body{padding:12px 14px 14px;}
.feed-top-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
.feed-av{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;}
.feed-src{font-size:11px;font-weight:600;}
.feed-date{font-size:10px;color:var(--text3);margin-left:auto;}
.feed-title{font-size:15px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:6px;letter-spacing:-0.2px;}
.feed-desc{font-size:12px;color:var(--text2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;}
.feed-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
.feed-kws{display:flex;gap:4px;flex-wrap:wrap;}
.feed-acts{display:flex;gap:3px;}
.act-b{background:none;border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;}
.act-b:hover{border-color:#1d4ed8;color:#1d4ed8;}
.act-b.al{border-color:#1d4ed8;color:#1d4ed8;background:#eff6ff;}
.act-b.as{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.act-b.ad{border-color:#ef4444;color:#ef4444;background:#fef2f2;}
.act-b.ai{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.alert-tag{background:#fef2f2;color:#dc2626;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;}
.summary-box{background:var(--bg);border:1px solid #7c3aed;border-radius:8px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--text2);line-height:1.6;}
.summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
.brief-page{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.brief-banner{background:linear-gradient(135deg,#b45309,#d97706);border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;gap:12px;}
.brief-banner-icon{font-size:28px;}
.brief-banner-body{flex:1;}
.brief-banner-title{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;}
.brief-banner-sub{font-size:11px;color:rgba(255,255,255,0.85);}
.brief-source-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;}
.brief-tab-btn{background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500;color:var(--text2);transition:all 0.12s;}
.brief-tab-btn.active{background:#fffbeb;border-color:#d97706;font-weight:600;}
.brief-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all 0.12s;margin-bottom:10px;}
.brief-card:hover{border-color:#fcd34d;box-shadow:0 2px 12px rgba(180,83,9,0.08);}
.brief-card-img{width:100%;height:160px;object-fit:cover;display:block;}
.brief-card-img-ph{width:100%;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px;}
.brief-card-body{padding:12px 14px 14px;}
.brief-card-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
.brief-src-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.brief-src-name{font-size:11px;font-weight:600;}
.brief-card-date{font-size:10px;color:var(--text3);margin-left:auto;}
.brief-card-title{font-size:14px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:6px;}
.brief-card-desc{font-size:12px;color:var(--text2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;}
.brief-card-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
.brief-cross-tags{display:flex;gap:4px;flex-wrap:wrap;}
.cross-tag{font-size:10px;border-radius:20px;padding:2px 8px;font-weight:500;cursor:pointer;transition:opacity 0.1s;}
.cross-tag:hover{opacity:0.75;}
.brief-acts{display:flex;gap:3px;}
.brief-sidebar{display:flex;flex-direction:column;gap:10px;}
.pod-page{display:grid;grid-template-columns:1fr 280px;gap:16px;}
.pod-col{display:flex;flex-direction:column;gap:10px;}
.pod-show-header{background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:12px;}
.pod-show-emoji{font-size:28px;}
.pod-show-info{flex:1;}
.pod-show-name{font-size:13px;font-weight:700;color:#fff;}
.pod-show-host{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;}
.pod-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;transition:all 0.12s;}
.pod-card:hover{border-color:#fda4af;}
.pod-card-img{width:100%;height:140px;object-fit:cover;display:block;}
.pod-card-img-ph{width:100%;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--bg);}
.pod-card-body{padding:12px 14px 14px;}
.pod-card-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
.pod-card-num{font-size:20px;font-weight:800;color:var(--border);min-width:26px;line-height:1;}
.pod-card-info{flex:1;min-width:0;}
.pod-card-show{font-size:10px;font-weight:600;color:#e11d48;margin-bottom:2px;}
.pod-card-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:4px;cursor:pointer;}
.pod-card-title:hover{color:#e11d48;}
.pod-card-meta{font-size:10px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap;}
.pod-card-desc{font-size:12px;color:var(--text2);line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pod-card-footer{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.pod-btn{border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:500;background:none;color:var(--text2);transition:all 0.12s;}
.pod-btn:hover{border-color:#e11d48;color:#e11d48;}
.pod-btn.ai-active{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.pod-btn.saved-btn{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.pod-summary{background:var(--bg);border:1px solid #7c3aed;border-radius:8px;padding:12px;margin-top:10px;font-size:12px;color:var(--text2);line-height:1.65;}
.pod-summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
.pod-sidebar{display:flex;flex-direction:column;gap:10px;}
.pod-show-list{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;}
.pod-show-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.pod-show-item:last-child{border-bottom:none;}
.pod-show-item-emoji{font-size:18px;width:28px;text-align:center;}
.pod-show-item-info{flex:1;min-width:0;}
.pod-show-item-name{font-size:12px;font-weight:600;color:var(--text);}
.pod-show-item-ep{font-size:10px;color:var(--text3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pod-show-item-dot{width:6px;height:6px;border-radius:50%;background:#e11d48;flex-shrink:0;}
.sidebar{display:flex;flex-direction:column;gap:10px;}
.side-block{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;}
.side-title{font-size:11px;font-weight:600;color:var(--text);margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border2);}
.trend-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.trend-row:last-child{border-bottom:none;}
.trend-n{font-size:14px;font-weight:700;color:var(--border);min-width:18px;line-height:1;}
.trend-t{font-size:11px;font-weight:500;color:var(--text);line-height:1.3;}
.trend-s{font-size:10px;color:var(--text3);margin-top:1px;}
.kw-chip{display:inline-block;border-radius:20px;padding:3px 9px;font-size:10px;margin:2px;cursor:pointer;font-weight:500;transition:opacity 0.1s;}
.kw-chip:hover{opacity:0.75;}
.kw-chip.kw-active{outline:2px solid currentColor;outline-offset:1px;}
.social-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.social-row:last-child{border-bottom:none;}
.social-av{width:24px;height:24px;border-radius:50%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;}
.social-name{font-size:11px;color:var(--text);}
.social-arr{font-size:10px;color:var(--text3);margin-left:auto;}
.saved-empty{text-align:center;padding:60px 20px;color:var(--text3);}
.bloom-banner{background:linear-gradient(135deg,#0369a1,#0ea5e9);border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;gap:12px;}
.bloom-banner-body{flex:1;}
.bloom-banner-title{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;}
.bloom-banner-sub{font-size:11px;color:rgba(255,255,255,0.85);}
.panel-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.4);z-index:500;display:none;align-items:center;justify-content:center;padding:20px;}
.panel-overlay.open{display:flex;}
.panel{background:var(--surface);border-radius:14px;width:100%;max-width:500px;max-height:88vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,0.15);}
.panel-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.panel-htitle{font-size:14px;font-weight:600;color:var(--text);}
.panel-x{background:none;border:none;font-size:16px;cursor:pointer;color:var(--text3);}
.panel-body{padding:18px 20px;}
.p-sec{margin-bottom:20px;}
.p-lbl{font-size:9px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.p-row{display:flex;align-items:center;padding:7px 0;border-bottom:1px solid var(--border2);gap:8px;}
.p-row:last-of-type{border-bottom:none;}
.p-name{flex:1;font-size:12px;color:var(--text);}
.p-count{font-size:10px;color:var(--text3);white-space:nowrap;}
.p-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:0 2px;}
.p-del:hover{color:#dc2626;}
.tog{width:32px;height:18px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.tog.on{background:#1d4ed8;}.tog.off{background:#cbd5e1;}
.tog::after{content:'';width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;}
.tog.on::after{left:16px;}.tog.off::after{left:2px;}
.hdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hg{background:#16a34a;}.hy{background:#d97706;}.hr{background:#dc2626;}.hx{background:#94a3b8;}
.hlegend{display:flex;gap:12px;margin-bottom:10px;font-size:10px;color:var(--text3);flex-wrap:wrap;}
.hlegend span{display:flex;align-items:center;gap:4px;}
.p-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:3px 9px;font-size:11px;margin:2px;font-weight:500;}
.p-kw{background:#eff6ff;color:#1d4ed8;}.p-alert{background:#fef2f2;color:#dc2626;}.p-so{background:#f0fdf4;color:#166534;}
.p-chip-x{background:none;border:none;cursor:pointer;font-size:11px;opacity:0.6;}
.p-add{display:flex;gap:6px;margin-top:8px;}
.p-input{flex:1;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.p-input:focus{outline:none;border-color:#1d4ed8;}
.p-add-btn{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:500;font-family:inherit;white-space:nowrap;}
.p-alert-btn{background:#dc2626;border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:500;font-family:inherit;}
.p-save{width:100%;background:#0f172a;border:none;color:#fff;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;margin-top:6px;font-family:inherit;}
.alert-info{background:var(--bg);border-radius:8px;padding:10px 12px;border:1px solid var(--border);margin-bottom:10px;font-size:11px;color:var(--text2);}
.bloom-note{background:#e0f2fe;border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:10px;color:#0369a1;font-weight:500;}
.no-art{text-align:center;padding:60px 20px;}
.no-art-msg{font-size:13px;color:var(--text2);margin-bottom:12px;}
.refresh-btn{border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:500;color:#fff;}
.kw-cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;}
.kw-cat-tab{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:500;}
.kw-cat-tab.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.add-src-box{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:10px;}
.add-src-lbl{font-size:10px;font-weight:600;color:var(--text2);margin-bottom:8px;}
.p-input-sm{border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);width:100%;margin-bottom:6px;}
.p-input-sm:focus{outline:none;border-color:#1d4ed8;}
.test-btn{background:var(--search);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:5px 10px;font-size:10px;cursor:pointer;font-family:inherit;}
.tresult{font-size:10px;margin-top:6px;padding:5px 8px;border-radius:5px;}
.tok{background:#f0fdf4;color:#16a34a;}.tfail{background:#fef2f2;color:#dc2626;}.tload{background:var(--bg);color:var(--text3);}
.clear-kw-btn{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;font-family:inherit;margin-bottom:6px;}
`;

export default function NewsHub(){
  const[tab,setTab]=useState('today');
  const[search,setSearch]=useState('');
  const[activeKw,setActiveKw]=useState('');
  const[dark,setDark]=useState(()=>load('dark',false));
  const[saved,setSaved]=useState(()=>load('saved',[]));
  const[likes,setLikes]=useState(()=>load('likes',{}));
  const[clicks,setClicks]=useState(()=>load('clicks',{}));
  const[scores,setScores]=useState(()=>load('scores',{}));
  const[kw,setKw]=useState(()=>load('kw',DEFAULT_KW));
  const[alerts,setAlerts]=useState(()=>load('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','hurricane','breaking']));
  const[social,setSocial]=useState(()=>load('social',['@HoustonTexans','@astros','@KentuckyMBB','@ClemsonFB','@BloomEnergy']));
  const[feeds,setFeeds]=useState(()=>load('feeds',DEFAULT_FEEDS));
  const[arts,setArts]=useState({general:[],sports:[],business:[],finance:[],bloom:[]});
  const[loading,setLoading]=useState({general:false,sports:false,business:false,finance:false,bloom:false});
  const[health,setHealth]=useState({});
  const[briefArts,setBriefArts]=useState({});
  const[briefLoading,setBriefLoading]=useState({});
  const[activeBriefSource,setActiveBriefSource]=useState('all');
  const[podEps,setPodEps]=useState({});
  const[podLoading,setPodLoading]=useState({});
  const[activePod,setActivePod]=useState(null);
  const[summaries,setSummaries]=useState({});
  const[sumLoading,setSumLoading]=useState({});
  const[breaking,setBreaking]=useState(null);
  const[showPanel,setShowPanel]=useState(false);
  const[newKwTab,setNewKwTab]=useState('general');
  const[newKwVal,setNewKwVal]=useState('');
  const[newAlert,setNewAlert]=useState('');
  const[newSocial,setNewSocial]=useState('');

  useEffect(()=>{save('dark',dark);document.body.className=dark?'dark':'';},[dark]);
  useEffect(()=>{save('saved',saved);},[saved]);
  useEffect(()=>{save('likes',likes);},[likes]);
  useEffect(()=>{save('clicks',clicks);},[clicks]);
  useEffect(()=>{save('scores',scores);},[scores]);

  const kwScore=(a,cat)=>{const ks=kw[cat]||[];return ks.filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase())).length;};
  const sc=useCallback((a)=>(scores[a.link]||0)+kwScore(a,a.cat)*3+(clicks[a.source]||0)*2,[scores,kw,clicks]);
  const dedupe=(arr)=>{const seen=new Set();return arr.filter(a=>{const k=(a.title||'').slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});};

  const sorted=useCallback((cat)=>{
    let f=arts[cat]||[];
    if(activeKw){f=f.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));}
    else if(search){f=f.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search.toLowerCase()));}
    const deduped=dedupe(f);
    const bySource={};
    deduped.forEach(a=>{if(!bySource[a.source])bySource[a.source]=[];bySource[a.source].push(a);});
    Object.keys(bySource).forEach(src=>{bySource[src].sort((a,b)=>{const d=kwScore(b,cat)-kwScore(a,cat);if(d!==0)return d;return new Date(b.pubDate)-new Date(a.pubDate);});});
    const srcKeys=Object.keys(bySource).sort((a,b)=>{const topA=bySource[a][0],topB=bySource[b][0];const d=kwScore(topB,cat)-kwScore(topA,cat);if(d!==0)return d;return new Date(topB.pubDate)-new Date(topA.pubDate);});
    const result=[];
    const maxLen=Math.max(0,...srcKeys.map(k=>bySource[k].length));
    for(let i=0;i<maxLen;i++){srcKeys.forEach(src=>{if(bySource[src]?.[i])result.push(bySource[src][i]);});}
    return result;
  },[arts,search,activeKw,sc]);

  const allBriefArts=useCallback(()=>{
    let all=[];
    BRIEFING_FEEDS.forEach(f=>{(briefArts[f.name]||[]).forEach(a=>all.push({...a,briefSource:f.name,briefEmoji:f.emoji,briefColor:f.color}));});
    all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    if(search)all=all.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search.toLowerCase()));
    return dedupe(all);
  },[briefArts,search]);

  const kwMatch=(a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase()));
  const isAlert=(a)=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase()));
  const isSaved=(a)=>saved.some(s=>s.link===a.link);

  const clickArt=(a)=>{setClicks(c=>({...c,[a.source]:(c[a.source]||0)+1}));setScores(s=>({...s,[a.link]:(s[a.link]||0)+3}));window.open(a.link,'_blank');};
  const likeArt=(link,v,e)=>{e?.stopPropagation();setLikes(l=>{const prev=l[link]||0;if(prev===v){const n={...l};delete n[link];return n;}return{...l,[link]:v};});};
  const saveArt=(a,e)=>{e?.stopPropagation();setSaved(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,a]);};

  const getSummary=async(id,title,desc,e)=>{
    e?.stopPropagation();
    if(summaries[id]){setSummaries(s=>{const n={...s};delete n[id];return n;});return;}
    setSumLoading(l=>({...l,[id]:true}));
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Summarize this in 2-3 concise sentences. Be direct and factual. Title: ${title}. Content: ${desc||''}`}]})});
      const data=await resp.json();
      setSummaries(s=>({...s,[id]:data.content?.[0]?.text||'Summary unavailable.'}));
    }catch{setSummaries(s=>({...s,[id]:'Could not generate summary.'}));}
    setSumLoading(l=>({...l,[id]:false}));
  };

  const loadCat=useCallback(async(cat)=>{
    if(loading[cat])return;
    setLoading(l=>({...l,[cat]:true}));
    const results=[];const healthUp={};
    await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
      const t0=Date.now();
      const items=await fetchRSS(f.url);
      const elapsed=Date.now()-t0;
      healthUp[f.name]=items.length>0?(elapsed<5000?'green':'yellow'):'red';
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    setHealth(h=>({...h,...healthUp}));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLoading(l=>({...l,[cat]:false}));
    const hit=results.find(a=>isAlert(a));
    if(hit)setBreaking(hit);
  },[feeds,alerts,loading]);

  const loadBriefings=useCallback(async()=>{
    await Promise.allSettled(BRIEFING_FEEDS.map(async f=>{
      if(briefLoading[f.name])return;
      setBriefLoading(l=>({...l,[f.name]:true}));
      const items=await fetchRSS(f.url);
      setBriefArts(prev=>({...prev,[f.name]:items.map(i=>({...i,source:f.name,cat:'briefing'}))}));
      setBriefLoading(l=>({...l,[f.name]:false}));
    }));
  },[briefLoading]);

  const loadPodcasts=useCallback(async()=>{
    await Promise.allSettled(PODCAST_FEEDS.map(async pod=>{
      if(podLoading[pod.name])return;
      setPodLoading(l=>({...l,[pod.name]:true}));
      const eps=await fetchPodcast(pod.url);
      setPodEps(p=>({...p,[pod.name]:eps.map(e=>({...e,show:pod.name,host:pod.host,showEmoji:pod.emoji}))}));
      setPodLoading(l=>({...l,[pod.name]:false}));
    }));
  },[]);

  useEffect(()=>{
    Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));
    loadBriefings();
    loadPodcasts();
  },[]);

  const refreshAll=()=>{
    setArts({general:[],sports:[],business:[],finance:[],bloom:[]});
    setLoading({general:false,sports:false,business:false,finance:false,bloom:false});
    setHealth({});setBriefArts({});setBriefLoading({});
    setPodEps({});setPodLoading({});setActiveKw('');setSearch('');
    setTimeout(()=>{Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));loadBriefings();loadPodcasts();},100);
  };

  const toggleKw=(k)=>{setActiveKw(prev=>prev===k?'':k);setSearch('');};

  const MiniActs=({a})=>(
    <div className="mini-acts">
      <button className={`mini-act ${likes[a.link]===1?'al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
      <button className={`mini-act ${likes[a.link]===-1?'ad':''}`} onClick={e=>likeArt(a.link,-1,e)}>Dn</button>
      <button className={`mini-act ${isSaved(a)?'as':''}`} onClick={e=>saveArt(a,e)}>Sv</button>
    </div>
  );

  const HeroRow=({a,cat})=>{
    const cc=CATS[cat],kws=kwMatch(a,cat),alert=isAlert(a);
    const[imgErr,setImgErr]=useState(false);
    return(
      <div className="hero-row" onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="thumb-sm" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="hero-body">
          <div className="hero-title">{alert&&<span className="alert-tag" style={{marginRight:'4px'}}>ALERT</span>}{a.title}</div>
          <div className="hero-meta"><span style={{color:cc.color,fontWeight:'600'}}>{a.source}</span>{kws.slice(0,2).map(k=><span key={k} className="kw-tag" style={{background:cc.bg,color:cc.color}}>{k}</span>)}</div>
          <div className="hero-date">{fmtDate(a.pubDate)}</div>
          <MiniActs a={a}/>
        </div>
      </div>
    );
  };

  const FeedCard=({a,cat})=>{
    const cc=CATS[cat],kws=kwMatch(a,cat),alert=isAlert(a);
    const init=(a.source||'?').slice(0,2).toUpperCase();
    const id=btoa((a.link||'x').slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);
    const[imgErr,setImgErr]=useState(false);
    return(
      <div className={`feed-card${cat==='bloom'?' bloom-card':''}`} onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="feed-hero-img" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="feed-hero-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="feed-card-body">
          <div className="feed-top-row">
            <div className="feed-av" style={{background:cc.bg,color:cc.color}}>{init}</div>
            <span className="feed-src" style={{color:cc.color}}>{a.source}</span>
            {alert&&<span className="alert-tag">ALERT</span>}
            <span className="feed-date">{fmtDate(a.pubDate)}</span>
          </div>
          <div className="feed-title">{a.title}</div>
          {a.desc&&<div className="feed-desc">{a.desc}</div>}
          {sumLoading[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div>{summaries[id]}</div>}
          <div className="feed-footer">
            <div className="feed-kws">{kws.slice(0,3).map(k=><span key={k} className="kw-tag" style={{background:cc.bg,color:cc.color}}>{k}</span>)}</div>
            <div className="feed-acts">
              <button className={`act-b${likes[a.link]===1?' al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
              <button className={`act-b${likes[a.link]===-1?' ad':''}`} onClick={e=>likeArt(a.link,-1,e)}>Down</button>
              <button className={`act-b${isSaved(a)?' as':''}`} onClick={e=>saveArt(a,e)}>Save</button>
              <button className={`act-b${summaries[id]||sumLoading[id]?' ai':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
              <button className="act-b" onClick={e=>{e.stopPropagation();clickArt(a);}}>Read</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BriefCard=({a})=>{
    const crossTags=detectCrossTags(a.title,a.desc);
    const id=btoa((a.link||'x').slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);
    const[imgErr,setImgErr]=useState(false);
    const srcInfo=BRIEFING_FEEDS.find(f=>f.name===a.briefSource)||{color:'#b45309',emoji:'☀️'};
    const alert=isAlert(a);
    return(
      <div className="brief-card" onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="brief-card-img" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="brief-card-img-ph" style={{background:'#fffbeb'}}>{srcInfo.emoji}</div>}
        <div className="brief-card-body">
          <div className="brief-card-top">
            <div className="brief-src-dot" style={{background:srcInfo.color}}></div>
            <span className="brief-src-name" style={{color:srcInfo.color}}>{a.briefSource||a.source}</span>
            {alert&&<span className="alert-tag">ALERT</span>}
            <span className="brief-card-date">{fmtDate(a.pubDate)}</span>
          </div>
          <div className="brief-card-title">{a.title}</div>
          {a.desc&&<div className="brief-card-desc">{a.desc}</div>}
          {sumLoading[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div>{summaries[id]}</div>}
          <div className="brief-card-footer">
            <div className="brief-cross-tags">
              {crossTags.map((t,i)=>{
                const cc=CATS[t.cat];
                return<span key={i} className="cross-tag" style={{background:cc.bg,color:cc.color}} onClick={e=>{e.stopPropagation();setTab(t.cat);setActiveKw(t.word);}} title={`Filter ${cc.label} by "${t.word}"`}>{cc.emoji} {t.word}</span>;
              })}
            </div>
            <div className="brief-acts">
              <button className={`act-b${likes[a.link]===1?' al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
              <button className={`act-b${isSaved(a)?' as':''}`} onClick={e=>saveArt(a,e)}>Save</button>
              <button className={`act-b${summaries[id]||sumLoading[id]?' ai':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
              <button className="act-b" onClick={e=>{e.stopPropagation();clickArt(a);}}>Read</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BriefingPage=()=>{
    const allArts=allBriefArts();
    const filtered=activeBriefSource==='all'?allArts:allArts.filter(a=>a.briefSource===activeBriefSource);
    const isAnyLoading=BRIEFING_FEEDS.some(f=>briefLoading[f.name]);
    const totalLoaded=BRIEFING_FEEDS.reduce((n,f)=>n+(briefArts[f.name]||[]).length,0);
    return(
      <div className="brief-page">
        <div>
          <div className="brief-banner">
            <div className="brief-banner-icon">☀️</div>
            <div className="brief-banner-body">
              <div className="brief-banner-title">Morning Briefing</div>
              <div className="brief-banner-sub">{BRIEFING_FEEDS.length} sources · {totalLoaded} articles · Tap colored tags to jump to that category</div>
            </div>
            {isAnyLoading&&<div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>Loading...</div>}
          </div>
          <div className="brief-source-tabs">
            <button className={`brief-tab-btn${activeBriefSource==='all'?' active':''}`} style={{color:'#b45309'}} onClick={()=>setActiveBriefSource('all')}>
              ☀️ All ({allArts.length})
            </button>
            {BRIEFING_FEEDS.map(f=>{
              const count=(briefArts[f.name]||[]).length;
              const isLoad=briefLoading[f.name];
              return(
                <button key={f.name} className={`brief-tab-btn${activeBriefSource===f.name?' active':''}`} style={{color:f.color}} onClick={()=>setActiveBriefSource(activeBriefSource===f.name?'all':f.name)}>
                  {f.emoji} {f.name.replace('Bloomberg Morning Briefing','Bloomberg').replace('Morning Brew','M.Brew').replace('Morning Wire','M.Wire')} {isLoad?'…':`(${count})`}
                </button>
              );
            })}
          </div>
          {filtered.length===0?(
            <div className="no-art">
              <p className="no-art-msg">{isAnyLoading?'Loading briefings...':'No briefing articles loaded yet'}</p>
              {!isAnyLoading&&<button className="refresh-btn" style={{background:'#b45309'}} onClick={loadBriefings}>Retry Now</button>}
            </div>
          ):filtered.map((a,i)=><BriefCard key={i} a={a}/>)}
        </div>
        <div className="brief-sidebar">
          <div className="side-block" style={{border:'1px solid #fcd34d'}}>
            <div className="side-title" style={{color:'#b45309'}}>☀️ Your Briefing Sources</div>
            {BRIEFING_FEEDS.map((f,i)=>{
              const count=(briefArts[f.name]||[]).length;
              const isLoad=briefLoading[f.name];
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border2)'}}>
                  <span style={{fontSize:'14px'}}>{f.emoji}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'11px',fontWeight:'600',color:f.color}}>{f.name}</div>
                    <div style={{fontSize:'10px',color:'var(--text3)'}}>{f.desc}</div>
                  </div>
                  <span style={{fontSize:'10px',color:isLoad?'#3b82f6':count>0?'#16a34a':'var(--text3)',fontWeight:'600',flexShrink:0}}>
                    {isLoad?'…':count>0?`${count} art`:'—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="side-block">
            <div className="side-title">Cross-Category Tags</div>
            <div style={{fontSize:'11px',color:'var(--text2)',lineHeight:'1.7',marginBottom:'8px'}}>
              Colored pills on each card show which of your feeds it relates to. Tap any pill to jump to that category filtered by that keyword.
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
              {Object.entries(CATS).filter(([k])=>k!=='briefing'&&k!=='podcasts').map(([k,v])=>(
                <span key={k} style={{background:v.bg,color:v.color,borderRadius:'20px',padding:'2px 8px',fontSize:'10px',fontWeight:'500'}}>{v.emoji} {v.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PodCard=({ep,idx})=>{
    const id=`pod_${ep.show}_${idx}`;
    const isSv=isSaved({...ep,link:ep.link||ep.show+idx});
    const[imgErr,setImgErr]=useState(false);
    return(
      <div className="pod-card">
        {ep.img&&!imgErr?<img className="pod-card-img" src={ep.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="pod-card-img-ph">{ep.showEmoji}</div>}
        <div className="pod-card-body">
          <div className="pod-card-top">
            <div className="pod-card-num">{idx+1}</div>
            <div className="pod-card-info">
              <div className="pod-card-show">{ep.showEmoji} {ep.show}</div>
              <div className="pod-card-title" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>{ep.title}</div>
              <div className="pod-card-meta">
                <span>{fmtDate(ep.pubDate)}</span>
                {ep.duration&&<span>{fmtDuration(ep.duration)}</span>}
                <span style={{color:'#e11d48',fontWeight:'500'}}>{ep.host}</span>
              </div>
            </div>
          </div>
          {ep.desc&&<div className="pod-card-desc">{ep.desc}</div>}
          {sumLoading[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Episode Summary</div>{summaries[id]}</div>}
          <div className="pod-card-footer">
            <button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen</button>
            <button className={`pod-btn${summaries[id]||sumLoading[id]?' ai-active':''}`} onClick={e=>getSummary(id,ep.title,ep.desc,e)}>
              {sumLoading[id]?'Summarizing...':summaries[id]?'Hide Summary':'AI Summary'}
            </button>
            <button className={`pod-btn${isSv?' saved-btn':''}`} onClick={e=>saveArt({...ep,link:ep.link||ep.show+idx,source:ep.show,cat:'podcasts'},e)}>
              {isSv?'Saved':'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PodcastsPage=()=>{
    const allEps=[];
    PODCAST_FEEDS.forEach(p=>{(podEps[p.name]||[]).slice(0,3).forEach(e=>allEps.push({...e,show:p.name,host:p.host,showEmoji:p.emoji}));});
    allEps.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({...e,show:activePod.name,host:activePod.host,showEmoji:activePod.emoji})):allEps;
    const isLoading=activePod?podLoading[activePod.name]:PODCAST_FEEDS.some(p=>podLoading[p.name]);
    return(
      <div className="pod-page">
        <div className="pod-col">
          <div className="pod-show-header">
            <div className="pod-show-emoji">{activePod?activePod.emoji:'🎙️'}</div>
            <div className="pod-show-info">
              <div className="pod-show-name">{activePod?activePod.name:'All Podcasts — Latest Episodes'}</div>
              <div className="pod-show-host">{activePod?`Hosted by ${activePod.host}`:`${PODCAST_FEEDS.length} shows · AI summaries on every episode`}</div>
            </div>
            {activePod&&<button style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:'6px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit'}} onClick={()=>setActivePod(null)}>All Shows</button>}
          </div>
          {isLoading&&!displayEps.length?<div className="loading-state" style={{padding:'40px'}}>Loading podcast episodes — up to 20 seconds on first load...</div>:
          displayEps.length===0?<div className="loading-state" style={{padding:'40px'}}>No episodes loaded yet.<br/><button style={{marginTop:'12px',background:'#e11d48',border:'none',color:'#fff',borderRadius:'8px',padding:'8px 16px',cursor:'pointer',fontSize:'12px',fontFamily:'inherit'}} onClick={loadPodcasts}>Retry Loading</button></div>:
          displayEps.slice(0,20).map((ep,i)=><PodCard key={i} ep={ep} idx={i}/>)}
        </div>
        <div className="pod-sidebar">
          <div className="pod-show-list">
            <div className="side-title">Shows</div>
            <div className="pod-show-item" onClick={()=>setActivePod(null)} style={{background:!activePod?'var(--bg)':''}}>
              <div className="pod-show-item-emoji">🎙️</div>
              <div className="pod-show-item-info">
                <div className="pod-show-item-name" style={{color:!activePod?'#e11d48':''}}>All Shows</div>
                <div className="pod-show-item-ep">Latest from all {PODCAST_FEEDS.length} podcasts</div>
              </div>
              {!activePod&&<div className="pod-show-item-dot"></div>}
            </div>
            {PODCAST_FEEDS.map((p,i)=>{
              const eps=podEps[p.name]||[];const latest=eps[0];const isActive=activePod?.name===p.name;
              return(
                <div key={i} className="pod-show-item" onClick={()=>setActivePod(isActive?null:p)} style={{background:isActive?'var(--bg)':''}}>
                  <div className="pod-show-item-emoji">{p.emoji}</div>
                  <div className="pod-show-item-info">
                    <div className="pod-show-item-name" style={{color:isActive?'#e11d48':''}}>{p.name}</div>
                    <div className="pod-show-item-ep">{podLoading[p.name]?'Loading...':(latest?latest.title.slice(0,38)+'...':'No episodes yet')}</div>
                  </div>
                  {eps.length>0&&<span style={{fontSize:'9px',color:'#16a34a',fontWeight:'600',flexShrink:0}}>{eps.length}ep</span>}
                  {isActive&&<div className="pod-show-item-dot"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const BloomBlock=()=>{
    const arts2=sorted('bloom'),total=(arts.bloom||[]).length,ld=loading.bloom;
    return(
      <div className="cat-block bloom-block bloom-row">
        <div className="cat-block-head">
          <div className="cat-block-label"><div className="cat-dot" style={{background:'#0369a1'}}></div><span style={{color:'#0369a1'}}>Bloom Energy and Power Intelligence</span><span className="cat-badge">{total}</span></div>
          <button className="see-all" style={{color:'#0369a1'}} onClick={()=>setTab('bloom')}>All articles</button>
        </div>
        {ld?<div className="loading-state">Loading...</div>:arts2.length===0?<div className="loading-state">No articles yet — tap ↺</div>:(
          <div className="bloom-strip">
            {arts2.slice(0,4).map((a,i)=>(
              <div key={i} className="bloom-strip-item" onClick={()=>clickArt(a)}>
                {a.img&&<div className="bloom-strip-bg" style={{backgroundImage:`url(${a.img})`}}></div>}
                <div className="bloom-strip-content">
                  <div className="bloom-strip-title">{a.title}</div>
                  <div className="bloom-strip-meta">{a.source}</div>
                  <div className="bloom-strip-date">{fmtDate(a.pubDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CatBlock=({cat})=>{
    const cc=CATS[cat],arts2=sorted(cat).slice(0,5),total=(arts[cat]||[]).length,ld=loading[cat];
    return(
      <div className="cat-block">
        <div className="cat-block-head">
          <div className="cat-block-label"><div className="cat-dot" style={{background:cc.color}}></div><span style={{color:cc.color}}>{cc.label}</span><span className="cat-badge">{total}</span></div>
          <button className="see-all" onClick={()=>setTab(cat)}>All</button>
        </div>
        {ld?<div className="loading-state">Loading...</div>:arts2.length?arts2.map((a,i)=><HeroRow key={i} a={a} cat={cat}/>):<div className="loading-state">No articles yet</div>}
      </div>
    );
  };

  const TopStories=()=>{
    const newsCats=['general','sports','business','finance','bloom'];
    const hasAny=newsCats.some(c=>(arts[c]||[]).length>0);
    const allBrief=allBriefArts();
    const topBrief=allBrief[0];
    const allPodEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,1).map(e=>({...e,show:p.name,emoji:p.emoji})));
    const latestPod=allPodEps.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))[0];
    return(
      <div className="ts-bar">
        <div className="ts-inner">
          {!hasAny?<div className="ts-item"><div className="ts-item-content"><div className="ts-cat" style={{color:'var(--text3)'}}>Loading feeds...</div></div></div>:
          newsCats.map(cat=>{
            const cc=CATS[cat],top=sorted(cat)[0];
            if(!top)return<div key={cat} className="ts-item"><div className="ts-item-content"><div className="ts-cat" style={{color:cc.color}}>{cc.emoji} {cc.label}</div></div></div>;
            return<div key={cat} className="ts-item" onClick={()=>clickArt(top)}>
              {top.img&&<div className="ts-item-bg" style={{backgroundImage:`url(${top.img})`}}></div>}
              <div className="ts-item-content">
                <div className="ts-cat" style={{color:cc.color}}>{cc.emoji} {cc.label}</div>
                <div className="ts-title">{top.title}</div>
                <div className="ts-src">{top.source} · {fmtDate(top.pubDate)}</div>
              </div>
            </div>;
          })}
          {topBrief&&<div className="ts-item" onClick={()=>setTab('briefing')}>
            {topBrief.img&&<div className="ts-item-bg" style={{backgroundImage:`url(${topBrief.img})`}}></div>}
            <div className="ts-item-content">
              <div className="ts-cat" style={{color:'#b45309'}}>☀️ Briefing</div>
              <div className="ts-title">{topBrief.title}</div>
              <div className="ts-src">{topBrief.briefSource} · {fmtDate(topBrief.pubDate)}</div>
            </div>
          </div>}
          {latestPod&&<div className="ts-item" onClick={()=>setTab('podcasts')}>
            {latestPod.img&&<div className="ts-item-bg" style={{backgroundImage:`url(${latestPod.img})`}}></div>}
            <div className="ts-item-content">
              <div className="ts-cat" style={{color:'#e11d48'}}>{latestPod.emoji} Podcast</div>
              <div className="ts-title">{latestPod.title}</div>
              <div className="ts-src">{latestPod.show} · {fmtDate(latestPod.pubDate)}</div>
            </div>
          </div>}
        </div>
      </div>
    );
  };

  const Sidebar=({cat})=>{
    const cc=CATS[cat],arts2=sorted(cat),catKws=kw[cat]||[];
    return(
      <div className="sidebar">
        <div className="side-block">
          <div className="side-title">Trending</div>
          {arts2.slice(0,8).map((a,i)=>(
            <div key={i} className="trend-row" onClick={()=>clickArt(a)}>
              <div className="trend-n">{i+1}</div>
              <div><div className="trend-t">{a.title.slice(0,60)}{a.title.length>60?'...':''}</div><div className="trend-s">{a.source} · {fmtDate(a.pubDate)}</div></div>
            </div>
          ))}
          {arts2.length===0&&<div style={{fontSize:'11px',color:'var(--text3)'}}>Loading articles...</div>}
        </div>
        {cat==='bloom'&&<div className="side-block" style={{border:'1px solid #bae6fd'}}><div className="side-title" style={{color:'#0369a1'}}>About This Feed</div><div style={{fontSize:'11px',color:'var(--text2)',lineHeight:'1.6'}}>Tracks Bloom Energy (NYSE: BE), fuel cells, distributed power, AI data center power, onshoring, industrial energy, oil & gas, and utility-scale solutions.</div></div>}
        <div className="side-block">
          <div className="side-title">{cc.emoji} {cc.label} Keywords</div>
          {activeKw&&<button className="clear-kw-btn" style={{color:cc.color}} onClick={()=>setActiveKw('')}>✕ Clear: "{activeKw}"</button>}
          {catKws.map((k,i)=>(
            <span key={i} className={`kw-chip${activeKw===k?' kw-active':''}`} style={{background:cc.bg,color:cc.color}} onClick={()=>toggleKw(k)}>{k}</span>
          ))}
          {catKws.length===0&&<div style={{fontSize:'11px',color:'var(--text3)'}}>No keywords — add in Customize</div>}
        </div>
        <div className="side-block"><div className="side-title">Alert Keywords</div>{alerts.map((a,i)=><span key={i} style={{display:'inline-block',background:'#fef2f2',color:'#dc2626',borderRadius:'20px',padding:'3px 9px',fontSize:'10px',margin:'2px',fontWeight:'500'}}>{a}</span>)}</div>
        <div className="side-block"><div className="side-title">Social</div>{social.map((h,i)=><div key={i} className="social-row" onClick={()=>window.open(`https://twitter.com/${h.replace('@','')}`)}>
          <div className="social-av">{h.replace('@','').slice(0,2).toUpperCase()}</div>
          <span className="social-name">{h}</span><span className="social-arr">→</span>
        </div>)}</div>
      </div>
    );
  };

  const CustomizePanel=()=>{
    const[lf,setLf]=useState(JSON.parse(JSON.stringify(feeds)));
    const[lk,setLk]=useState(JSON.parse(JSON.stringify(kw)));
    const[la,setLa]=useState([...alerts]);
    const[ls,setLs]=useState([...social]);
    const[kwTab,setKwTab]=useState('general');
    const[srcCat,setSrcCat]=useState('general');
    const[newName,setNewName]=useState('');
    const[newUrl,setNewUrl]=useState('');
    const[testState,setTestState]=useState({});
    const saveAll=()=>{setFeeds(lf);save('feeds',lf);setKw(lk);save('kw',lk);setAlerts(la);save('alerts',la);setSocial(ls);save('social',ls);setShowPanel(false);refreshAll();};
    const testFeed=async(url,key)=>{
      setTestState(s=>({...s,[key]:'loading'}));
      const items=await fetchRSS(url);
      setTestState(s=>({...s,[key]:items.length>0?`ok ${items.length} articles loaded`:'fail'}));
    };
    const addSrc=()=>{
      if(!newName.trim()||!newUrl.trim())return;
      setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcCat])n[srcCat]=[];n[srcCat].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});
      setNewName('');setNewUrl('');
    };
    const catLabels={general:'🌐 General',sports:'🏆 Sports',business:'⚡ Business',finance:'📈 Finance',bloom:'🔋 Bloom',briefing:'☀️ Briefing'};
    const hdot=(name)=>{const h=health[name];return h==='green'?'hg':h==='yellow'?'hy':h==='red'?'hr':'hx';};
    const cnt=(cat,name)=>(arts[cat]||[]).filter(a=>a.source===name).length;
    return(
      <div className="panel-overlay open">
        <div className="panel">
          <div className="panel-head"><span className="panel-htitle">Customize Hub</span><button className="panel-x" onClick={()=>setShowPanel(false)}>✕</button></div>
          <div className="panel-body">
            <div className="p-sec">
              <div className="p-lbl">Breaking News Alerts</div>
              <div className="alert-info">Red banner fires when any headline contains these words.</div>
              <div>{la.map((a,i)=><span key={i} className="p-chip p-alert">{a}<button className="p-chip-x" style={{color:'#dc2626'}} onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>×</button></span>)}</div>
              <div className="p-add"><input className="p-input" placeholder="Add alert word..." value={newAlert} onChange={e=>setNewAlert(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/><button className="p-alert-btn" onClick={()=>{if(newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button></div>
            </div>
            <div className="p-sec">
              <div className="p-lbl">Keywords by Category</div>
              <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'10px'}}>Keywords boost matching articles to the top of each category. Click any keyword chip in the sidebar to filter by it.</div>
              <div className="kw-cat-tabs">{Object.keys(catLabels).map(c=><button key={c} className={`kw-cat-tab${kwTab===c?' active':''}`} onClick={()=>setKwTab(c)}>{catLabels[c]}</button>)}</div>
              <div>{(lk[kwTab]||[]).map((k,i)=><span key={i} className="p-chip p-kw">{k}<button className="p-chip-x" onClick={()=>setLk(prev=>{const n={...prev};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}>×</button></span>)}</div>
              <div className="p-add">
                <input className="p-input" placeholder={`Add ${kwTab} keyword...`} value={newKwVal} onChange={e=>setNewKwVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newKwVal.trim()){setLk(prev=>{const n={...prev};n[kwTab]=[...(n[kwTab]||[]),newKwVal.trim()];return n;});setNewKwVal('');}}}/>
                <button className="p-add-btn" onClick={()=>{if(newKwVal.trim()){setLk(prev=>{const n={...prev};n[kwTab]=[...(n[kwTab]||[]),newKwVal.trim()];return n;});setNewKwVal('');}}}>Add</button>
              </div>
            </div>
            {Object.keys(DEFAULT_FEEDS).map(cat=>(
              <div key={cat} className="p-sec">
                <div className="p-lbl">{CATS[cat].emoji} {CATS[cat].label} Sources</div>
                {cat==='bloom'&&<div className="bloom-note">Tracks Bloom Energy, fuel cells, data center power, onshoring, industrial energy, utilities</div>}
                <div className="hlegend">
                  <span><span className="hdot hg"></span>Loaded</span>
                  <span><span className="hdot hy"></span>Slow</span>
                  <span><span className="hdot hr"></span>Failed</span>
                  <span><span className="hdot hx"></span>Pending</span>
                </div>
                {(lf[cat]||[]).map((f,i)=>{
                  const tk=`${cat}_${i}`;const ts=testState[tk];const c=cnt(cat,f.name);
                  return(
                    <div key={i}>
                      <div className="p-row">
                        <span className={`hdot ${hdot(f.name)}`} title={health[f.name]||'not loaded'}></span>
                        <span className="p-name">{f.name}</span>
                        {c>0&&<span className="p-count">{c} art</span>}
                        <button className="test-btn" onClick={()=>testFeed(f.url,tk)}>Test</button>
                        <button className={`tog${f.on?' on':' off'}`} onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[cat][i].on=!n[cat][i].on;return n;})}></button>
                        <button className="p-del" onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[cat].splice(i,1);return n;})}>✕</button>
                      </div>
                      {ts&&<div className={`tresult${ts==='loading'?' tload':ts.startsWith('ok')?' tok':' tfail'}`}>{ts==='loading'?'Testing...':(ts.startsWith('ok')?'✓ '+ts.replace('ok ',''):'✗ Failed — source may be blocked or invalid')}</div>}
                    </div>
                  );
                })}
                <div className="add-src-box">
                  <div className="add-src-lbl">+ Add custom source to {CATS[cat].label}</div>
                  <input className="p-input-sm" placeholder="Source name (e.g. Houston Biz Journal)" value={srcCat===cat?newName:''} onChange={e=>{setSrcCat(cat);setNewName(e.target.value);}}/>
                  <input className="p-input-sm" placeholder="RSS URL (e.g. https://example.com/feed)" value={srcCat===cat?newUrl:''} onChange={e=>{setSrcCat(cat);setNewUrl(e.target.value);}}/>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button className="test-btn" style={{flex:1}} onClick={()=>{const u=(srcCat===cat?newUrl:'').trim();if(u)testFeed(u,`new_${cat}`);}}>Test URL</button>
                    <button className="p-add-btn" style={{flex:1}} onClick={()=>{setSrcCat(cat);addSrc();}}>Add Source</button>
                  </div>
                  {testState[`new_${cat}`]&&<div className={`tresult${testState[`new_${cat}`]==='loading'?' tload':testState[`new_${cat}`].startsWith('ok')?' tok':' tfail'}`}>{testState[`new_${cat}`]==='loading'?'Testing...':(testState[`new_${cat}`].startsWith('ok')?'✓ '+testState[`new_${cat}`].replace('ok ',''):'✗ Failed — URL may be blocked or invalid')}</div>}
                </div>
              </div>
            ))}
            <div className="p-sec">
              <div className="p-lbl">Social Follows</div>
              <div>{ls.map((s,i)=><span key={i} className="p-chip p-so">{s}<button className="p-chip-x" style={{color:'#166534'}} onClick={()=>setLs(x=>x.filter((_,j)=>j!==i))}>×</button></span>)}</div>
              <div className="p-add"><input className="p-input" placeholder="@handle" value={newSocial} onChange={e=>setNewSocial(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}/><button className="p-add-btn" onClick={()=>{if(newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}>Add</button></div>
            </div>
            <button className="p-save" onClick={saveAll}>Save and Refresh</button>
          </div>
        </div>
      </div>
    );
  };

  const mainCats=['general','sports','business','finance'];

  return(
    <>
      <style>{css}</style>
      <div className={`hub${dark?' dark':''}`}>
        <div className="topbar">
          <div className="topbar-inner">
            <div className="logo">My<span>News</span>Hub</div>
            <div className="nav-tabs">
              {['today','general','sports','business','finance','bloom','briefing','podcasts','saved'].map(t=>(
                <button key={t} className={`nav-tab${tab===t?' active':''} ${t==='bloom'?'bloom-tab':''} ${t==='podcasts'?'pod-tab':''} ${t==='briefing'?'brief-tab':''}`}
                  onClick={()=>{setTab(t);setActiveKw('');setSearch('');if(!['today','saved','podcasts','briefing'].includes(t)&&!(arts[t]||[]).length)loadCat(t);}}>
                  {t==='today'?'Today':t==='bloom'?'Bloom Energy':t==='podcasts'?'🎙️ Podcasts':t==='briefing'?'☀️ Briefing':t==='saved'?'Saved':t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <div className="topbar-right">
              <input className="search" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setActiveKw('');}}/>
              <button className="btn-icon" onClick={refreshAll} title="Refresh">↺</button>
              <button className="btn-icon" onClick={()=>setDark(d=>!d)} title="Dark mode">{dark?'☀':'🌙'}</button>
              <button className="btn-blue" onClick={()=>setShowPanel(true)}>Customize</button>
            </div>
          </div>
        </div>
        {breaking&&<div className="breaking show"><div className="breaking-inner"><span className="breaking-badge">BREAKING</span><span className="breaking-text">{breaking.title} — {breaking.source}</span><button className="breaking-x" onClick={()=>setBreaking(null)}>✕</button></div></div>}
        <TopStories/>
        <div className="main">
          {tab==='today'&&<div className="today-grid">{mainCats.map(c=><CatBlock key={c} cat={c}/>)}<BloomBlock/></div>}
          {mainCats.includes(tab)&&(
            loading[tab]&&!(arts[tab]||[]).length?<div style={{textAlign:'center',padding:'60px',fontSize:'13px',color:'var(--text3)'}}>Loading {CATS[tab].label}...</div>:
            sorted(tab).length===0?<div className="no-art">
              <p className="no-art-msg">{activeKw?`No "${activeKw}" articles found`:'No articles loaded yet'}</p>
              <button className="refresh-btn" style={{background:activeKw?'#64748b':'#1d4ed8'}} onClick={activeKw?()=>setActiveKw(''):refreshAll}>{activeKw?'Clear Filter':'Refresh Now'}</button>
            </div>:
            <div className="cat-page">
              <div className="feed-col">
                <div style={{fontSize:'10px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'4px'}}>
                  {CATS[tab].emoji} {activeKw?`"${activeKw}" in ${CATS[tab].label} — ${sorted(tab).length} results`:`Top Stories — ${sorted(tab).length} articles`}
                </div>
                {sorted(tab).slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat={tab}/>)}
              </div>
              <Sidebar cat={tab}/>
            </div>
          )}
          {tab==='bloom'&&(
            loading.bloom&&!(arts.bloom||[]).length?<div style={{textAlign:'center',padding:'60px',fontSize:'13px',color:'var(--text3)'}}>Loading Bloom Energy feed...</div>:
            sorted('bloom').length===0?<div className="no-art"><p className="no-art-msg">{activeKw?`No "${activeKw}" Bloom articles`:'No articles loaded yet'}</p><button className="refresh-btn" style={{background:activeKw?'#64748b':'#0369a1'}} onClick={activeKw?()=>setActiveKw(''):refreshAll}>{activeKw?'Clear Filter':'Refresh Now'}</button></div>:
            <div className="cat-page">
              <div className="feed-col">
                <div className="bloom-banner"><div style={{fontSize:'28px'}}>🔋</div><div className="bloom-banner-body"><div className="bloom-banner-title">Bloom Energy and Power Intelligence</div><div className="bloom-banner-sub">Fuel cells · Data center power · Onshoring · Industrial energy · {sorted('bloom').length} articles{activeKw?` · Filtered: "${activeKw}"`:''}</div></div></div>
                {sorted('bloom').slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat="bloom"/>)}
              </div>
              <Sidebar cat="bloom"/>
            </div>
          )}
          {tab==='briefing'&&<BriefingPage/>}
          {tab==='podcasts'&&<PodcastsPage/>}
          {tab==='saved'&&(
            saved.length===0?<div className="saved-empty"><div style={{fontSize:'28px',marginBottom:'10px'}}>🔖</div><div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)',marginBottom:'4px'}}>No saved items yet</div><div style={{fontSize:'11px'}}>Tap Save on any article or episode</div></div>:
            <div className="cat-page"><div className="feed-col"><div style={{fontSize:'10px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'4px'}}>Saved — {saved.length} items</div>{saved.map((a,i)=>a.cat==='podcasts'?<PodCard key={i} ep={a} idx={i}/>:<FeedCard key={i} a={a} cat={a.cat||'general'}/>)}</div></div>
          )}
        </div>
        {showPanel&&<CustomizePanel/>}
      </div>
    </>
  );
}
