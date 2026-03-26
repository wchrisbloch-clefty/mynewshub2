import { useState, useEffect, useCallback } from "react";

const CATS={
  general:{label:'General',color:'#1d4ed8',bg:'#eff6ff',emoji:'🌐'},
  sports:{label:'Sports',color:'#d97706',bg:'#fef3c7',emoji:'🏆'},
  business:{label:'Business',color:'#16a34a',bg:'#f0fdf4',emoji:'⚡'},
  finance:{label:'Finance',color:'#7c3aed',bg:'#f5f3ff',emoji:'📈'},
  bloom:{label:'Bloom Energy',color:'#0369a1',bg:'#e0f2fe',emoji:'🔋'},
  podcasts:{label:'Podcasts',color:'#e11d48',bg:'#fff1f2',emoji:'🎙️'}
};

const PODCAST_FEEDS=[
  {name:'Joe Rogan Experience',host:'Joe Rogan',url:'https://feeds.megaphone.fm/GLT1412515089',emoji:'🟢'},
  {name:'Ben Shapiro Show',host:'Ben Shapiro',url:'https://feeds.megaphone.fm/BVDWV5370667266',emoji:'🔵'},
  {name:'Tucker Carlson Show',host:'Tucker Carlson',url:'https://feeds.megaphone.fm/RSV1597324942',emoji:'🦅'},
  {name:'Candace',host:'Candace Owens',url:'https://feeds.megaphone.fm/candace',emoji:'🎤'},
  {name:'Morning Wire',host:'Daily Wire',url:'https://feeds.megaphone.fm/BVDWV8747925072',emoji:'☀️'},
  {name:'All-In Podcast',host:'Chamath & Besties',url:'https://allinchamathjason.libsyn.com/rss',emoji:'💰'},
  {name:'Flagrant',host:'Andrew Schulz',url:'https://feeds.megaphone.fm/APPI6857213837',emoji:'🔥'},
];

const DEFAULT_FEEDS={
  general:[
    {name:'BBC News',url:'https://feeds.bbci.co.uk/news/rss.xml',on:true},
    {name:'NPR News',url:'https://feeds.npr.org/1001/rss.xml',on:true},
    {name:'The Hill',url:'https://thehill.com/homenews/feed/',on:true},
    {name:'TechCrunch',url:'https://techcrunch.com/feed/',on:true},
    {name:'Fox News',url:'https://moxie.foxnews.com/google-publisher/latest.xml',on:true},
    {name:'NY Post',url:'https://nypost.com/feed/',on:true},
    {name:'CNBC',url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',on:true},
    {name:'Houston Chronicle',url:'https://www.chron.com/rss/feed/Top-News-201.php',on:true},
    {name:'Politico',url:'https://www.politico.com/rss/politicopicks.xml',on:true},
    {name:'Reuters',url:'https://feeds.reuters.com/reuters/topNews',on:true},
  ],
  sports:[
    {name:'ESPN NFL',url:'https://www.espn.com/espn/rss/nfl/news',on:true},
    {name:'ESPN MLB',url:'https://www.espn.com/espn/rss/mlb/news',on:true},
    {name:'ESPN CFB',url:'https://www.espn.com/espn/rss/ncf/news',on:true},
    {name:'ESPN CBB',url:'https://www.espn.com/espn/rss/ncb/news',on:true},
    {name:'CBS Sports NFL',url:'https://www.cbssports.com/rss/headlines/nfl',on:true},
    {name:'CBS Sports MLB',url:'https://www.cbssports.com/rss/headlines/mlb',on:true},
    {name:'Pro Football Talk',url:'https://profootballtalk.nbcsports.com/feed/',on:true},
    {name:'247Sports',url:'https://247sports.com/feeds/articles/rss/',on:true},
    {name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',on:true},
    {name:'Bleacher Report',url:'https://bleacherreport.com/articles/feed',on:true},
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
  ],
  finance:[
    {name:'MarketWatch',url:'https://feeds.marketwatch.com/marketwatch/topstories/',on:true},
    {name:'Yahoo Finance',url:'https://finance.yahoo.com/news/rssindex',on:true},
    {name:'Kiplinger',url:'https://www.kiplinger.com/rss/all',on:true},
    {name:'Motley Fool',url:'https://www.fool.com/feeds/index.aspx',on:true},
    {name:'Seeking Alpha',url:'https://seekingalpha.com/feed.xml',on:true},
    {name:'BiggerPockets',url:'https://www.biggerpockets.com/blog/feed',on:true},
    {name:'Investopedia',url:'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',on:true},
  ],
  bloom:[
    {name:'Motley Fool',url:'https://www.fool.com/feeds/index.aspx',on:true},
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
    {name:'Investopedia',url:'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',on:true},
  ]
};

const SK='v8_';
function load(k,def){try{const v=localStorage.getItem(SK+k);return v?JSON.parse(v):def;}catch{return def;}}
function save(k,v){try{localStorage.setItem(SK+k,JSON.stringify(v));}catch{}}

async function fetchRSS(url){
  try{
    const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
    const d=await r.json();
    if(d.items&&d.items.length>0)return d.items.map(i=>({
      title:(i.title||'').trim(),link:i.link,
      desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300),
      pubDate:i.pubDate,img:i.thumbnail||'',duration:i.itunes_duration||''
    }));
  }catch{}
  try{
    const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const d=await r.json();
    if(d.contents){
      const p=new DOMParser(),x=p.parseFromString(d.contents,'text/xml');
      const items=Array.from(x.querySelectorAll('item')).slice(0,15);
      if(items.length>0)return items.map(i=>({
        title:(i.querySelector('title')?.textContent||'').trim(),
        link:i.querySelector('link')?.textContent||i.querySelector('enclosure')?.getAttribute('url')||'',
        desc:(i.querySelector('description')?.textContent||i.querySelector('summary')?.textContent||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().slice(0,300),
        pubDate:i.querySelector('pubDate')?.textContent||'',
        img:i.querySelector('image url')?.textContent||'',
        duration:i.querySelector('duration')?.textContent||''
      }));
    }
  }catch{}
  try{
    const r=await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const txt=await r.text();
    const p=new DOMParser(),x=p.parseFromString(txt,'text/xml');
    const items=Array.from(x.querySelectorAll('item')).slice(0,15);
    if(items.length>0)return items.map(i=>({
      title:(i.querySelector('title')?.textContent||'').trim(),
      link:i.querySelector('link')?.textContent||'',
      desc:(i.querySelector('description')?.textContent||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().slice(0,300),
      pubDate:i.querySelector('pubDate')?.textContent||'',
      img:'',duration:i.querySelector('duration')?.textContent||''
    }));
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
.nav-tab:hover:not(.active){color:var(--text2);}
.topbar-right{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.search{background:var(--search);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 10px;font-size:12px;width:120px;font-family:inherit;}
.search:focus{outline:1px solid #1d4ed8;}
.btn-icon{background:var(--search);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:13px;font-family:inherit;}
.btn-blue{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:500;font-family:inherit;}
.breaking{background:#dc2626;display:none;padding:6px 20px;}
.breaking.show{display:block;}
.breaking-inner{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:10px;}
.breaking-badge{background:#fff;color:#dc2626;font-size:9px;font-weight:700;border-radius:4px;padding:2px 6px;letter-spacing:0.05em;white-space:nowrap;}
.breaking-text{font-size:11px;color:#fff;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.breaking-x{background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:14px;line-height:1;}
.ts-bar{background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;}
.ts-inner{max-width:1300px;margin:0 auto;display:flex;}
.ts-item{flex:1;min-width:130px;padding:10px 14px;border-right:1px solid var(--border);cursor:pointer;transition:background 0.12s;}
.ts-item:last-child{border-right:none;}
.ts-item:hover{background:var(--bg);}
.ts-cat{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;}
.ts-title{font-size:11px;font-weight:500;color:var(--text);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
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
.thumb-sm{width:56px;height:42px;border-radius:6px;object-fit:cover;flex-shrink:0;}
.thumb-ph{width:56px;height:42px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;}
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
.bloom-strip-item{padding:10px 14px;border-right:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.bloom-strip-item:last-child{border-right:none;}
.bloom-strip-item:hover{background:var(--bg);}
.bloom-strip-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bloom-strip-meta{font-size:10px;color:#0369a1;font-weight:500;}
.bloom-strip-date{font-size:9px;color:var(--text3);margin-top:2px;}
.cat-page{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.feed-col{display:flex;flex-direction:column;gap:8px;}
.feed-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;cursor:pointer;transition:all 0.12s;display:flex;gap:12px;align-items:flex-start;}
.feed-card:hover{border-color:#bfdbfe;box-shadow:0 1px 8px rgba(29,78,216,0.06);}
.feed-card.bloom-card:hover{border-color:#bae6fd;}
.feed-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;}
.feed-body{flex:1;min-width:0;}
.feed-top-row{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;}
.feed-src{font-size:11px;font-weight:600;}
.feed-date{font-size:10px;color:var(--text3);}
.feed-title{font-size:14px;font-weight:700;color:var(--text);line-height:1.35;margin:5px 0 4px;letter-spacing:-0.1px;}
.feed-desc{font-size:12px;color:var(--text2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;}
.feed-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;}
.feed-kws{display:flex;gap:4px;flex-wrap:wrap;}
.feed-acts{display:flex;gap:3px;}
.act-b{background:none;border:1px solid var(--border);border-radius:5px;padding:2px 7px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;}
.act-b:hover{border-color:#1d4ed8;color:#1d4ed8;}
.act-b.al{border-color:#1d4ed8;color:#1d4ed8;background:#eff6ff;}
.act-b.as{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.act-b.ad{border-color:#ef4444;color:#ef4444;background:#fef2f2;}
.act-b.ai{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.feed-img{width:80px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;}
.feed-img-ph{width:80px;height:60px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;}
.summary-box{background:var(--bg);border:1px solid #7c3aed;border-radius:8px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--text2);line-height:1.6;}
.summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
.pod-page{display:grid;grid-template-columns:1fr 280px;gap:16px;}
.pod-col{display:flex;flex-direction:column;gap:10px;}
.pod-show-header{background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:12px;}
.pod-show-emoji{font-size:28px;}
.pod-show-info{flex:1;}
.pod-show-name{font-size:13px;font-weight:700;color:#fff;}
.pod-show-host{font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px;}
.pod-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;transition:all 0.12s;}
.pod-card:hover{border-color:#fda4af;}
.pod-card-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
.pod-card-num{font-size:22px;font-weight:800;color:var(--border);min-width:28px;line-height:1;}
.pod-card-body{flex:1;min-width:0;}
.pod-card-show{font-size:10px;font-weight:600;color:#e11d48;margin-bottom:2px;}
.pod-card-title{font-size:14px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:4px;cursor:pointer;}
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
.kw-chip{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:20px;padding:3px 9px;font-size:10px;margin:2px;cursor:pointer;font-weight:500;}
.bloom-kw{background:#e0f2fe;color:#0369a1;}
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
.panel{background:var(--surface);border-radius:14px;width:100%;max-width:460px;max-height:88vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,0.15);}
.panel-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.panel-htitle{font-size:14px;font-weight:600;color:var(--text);}
.panel-x{background:none;border:none;font-size:16px;cursor:pointer;color:var(--text3);line-height:1;}
.panel-body{padding:18px 20px;}
.p-sec{margin-bottom:18px;}
.p-lbl{font-size:9px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.p-row{display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--border2);}
.p-name{flex:1;font-size:12px;color:var(--text);}
.tog{width:32px;height:18px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.tog.on{background:#1d4ed8;}
.tog.off{background:#cbd5e1;}
.tog::after{content:'';width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;}
.tog.on::after{left:16px;}
.tog.off::after{left:2px;}
.p-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:3px 9px;font-size:11px;margin:2px;font-weight:500;}
.p-kw{background:#eff6ff;color:#1d4ed8;}
.p-alert{background:#fef2f2;color:#dc2626;}
.p-so{background:#f0fdf4;color:#166534;}
.p-chip-x{background:none;border:none;cursor:pointer;font-size:11px;opacity:0.6;}
.p-add{display:flex;gap:6px;margin-top:8px;}
.p-input{flex:1;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.p-input:focus{outline:none;border-color:#1d4ed8;}
.p-add-btn{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:500;font-family:inherit;}
.p-alert-btn{background:#dc2626;border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:500;font-family:inherit;}
.p-save{width:100%;background:#0f172a;border:none;color:#fff;border-radius:8px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;margin-top:6px;font-family:inherit;}
.alert-info{background:var(--bg);border-radius:8px;padding:10px 12px;border:1px solid var(--border);margin-bottom:10px;font-size:11px;color:var(--text2);}
.bloom-note{background:#e0f2fe;border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:10px;color:#0369a1;font-weight:500;}
.no-art{text-align:center;padding:60px 20px;}
.no-art-msg{font-size:13px;color:var(--text2);margin-bottom:12px;}
.refresh-btn{border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:12px;font-weight:500;color:#fff;}
`;

export default function NewsHub(){
  const[tab,setTab]=useState('today');
  const[search,setSearch]=useState('');
  const[dark,setDark]=useState(()=>load('dark',false));
  const[saved,setSaved]=useState(()=>load('saved',[]));
  const[likes,setLikes]=useState(()=>load('likes',{}));
  const[clicks,setClicks]=useState(()=>load('clicks',{}));
  const[scores,setScores]=useState(()=>load('scores',{}));
  const[kw,setKw]=useState(()=>load('kw',['Houston','Texans','Astros','Kentucky','Clemson','energy','AI','investing','ERCOT','LNG','Bloom Energy','fuel cell','data center','onshoring','hydrogen','microgrid']));
  const[alerts,setAlerts]=useState(()=>load('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','fuel cell','hurricane','earthquake','breaking']));
  const[social,setSocial]=useState(()=>load('social',['@HoustonTexans','@astros','@KentuckyMBB','@ClemsonFB','@Bloomberg','@OilandGasJnl','@BloomEnergy']));
  const[feeds,setFeeds]=useState(()=>load('feeds',DEFAULT_FEEDS));
  const[arts,setArts]=useState({general:[],sports:[],business:[],finance:[],bloom:[]});
  const[loading,setLoading]=useState({general:false,sports:false,business:false,finance:false,bloom:false});
  const[podEps,setPodEps]=useState({});
  const[podLoading,setPodLoading]=useState({});
  const[activePod,setActivePod]=useState(null);
  const[summaries,setSummaries]=useState({});
  const[summaryLoading,setSummaryLoading]=useState({});
  const[breaking,setBreaking]=useState(null);
  const[showPanel,setShowPanel]=useState(false);
  const[newKw,setNewKw]=useState('');
  const[newAlert,setNewAlert]=useState('');
  const[newSocial,setNewSocial]=useState('');

  useEffect(()=>{save('dark',dark);document.body.className=dark?'dark':'';},[dark]);
  useEffect(()=>{save('saved',saved);},[saved]);
  useEffect(()=>{save('likes',likes);},[likes]);
  useEffect(()=>{save('clicks',clicks);},[clicks]);
  useEffect(()=>{save('scores',scores);},[scores]);

  const kwScore=(a)=>kw.filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase())).length;
  const sc=useCallback((a)=>(scores[a.link]||0)+kwScore(a)*3+(clicks[a.source]||0)*2,[scores,kw,clicks]);
  const dedupe=(arr)=>{const seen=new Set();return arr.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});};

  const sorted=useCallback((cat)=>{
    const f=search?(arts[cat]||[]).filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search)):(arts[cat]||[]);
    const deduped=dedupe(f);
    const bySource={};
    deduped.forEach(a=>{if(!bySource[a.source])bySource[a.source]=[];bySource[a.source].push(a);});
    Object.keys(bySource).forEach(src=>{bySource[src].sort((a,b)=>{const d=kwScore(b)-kwScore(a);if(d!==0)return d;return new Date(b.pubDate)-new Date(a.pubDate);});});
    const srcKeys=Object.keys(bySource).sort((a,b)=>{const topA=bySource[a][0],topB=bySource[b][0];const d=kwScore(topB)-kwScore(topA);if(d!==0)return d;return new Date(topB.pubDate)-new Date(topA.pubDate);});
    const result=[];
    const maxLen=Math.max(...srcKeys.map(k=>bySource[k].length));
    for(let i=0;i<maxLen;i++){srcKeys.forEach(src=>{if(bySource[src][i])result.push(bySource[src][i]);});}
    return result;
  },[arts,search,sc]);

  const kwMatch=(a)=>kw.filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase()));
  const isAlert=(a)=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase()));
  const isSaved=(a)=>saved.some(s=>s.link===a.link);

  const clickArt=(a)=>{setClicks(c=>({...c,[a.source]:(c[a.source]||0)+1}));setScores(s=>({...s,[a.link]:(s[a.link]||0)+3}));window.open(a.link,'_blank');};
  const likeArt=(link,v,e)=>{e?.stopPropagation();setLikes(l=>{const prev=l[link]||0;if(prev===v){const n={...l};delete n[link];return n;}return{...l,[link]:v};});setScores(s=>{const prev=likes[link]||0;return{...s,[link]:(s[link]||0)-prev*5+v*5};});};
  const saveArt=(a,e)=>{e?.stopPropagation();setSaved(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,a]);};

  const getSummary=async(id,title,desc,e)=>{
    e?.stopPropagation();
    if(summaries[id]){setSummaries(s=>{const n={...s};delete n[id];return n;});return;}
    setSummaryLoading(l=>({...l,[id]:true}));
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Summarize this in 2-3 concise sentences. Be direct and factual. Title: ${title}. Content: ${desc||''}`}]})});
      const data=await resp.json();
      setSummaries(s=>({...s,[id]:data.content?.[0]?.text||'Summary unavailable.'}));
    }catch{setSummaries(s=>({...s,[id]:'Summary unavailable.'}));}
    setSummaryLoading(l=>({...l,[id]:false}));
  };

  const loadCat=useCallback(async(cat)=>{
    if(loading[cat])return;
    setLoading(l=>({...l,[cat]:true}));
    const results=[];
    await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
      const items=await fetchRSS(f.url);
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLoading(l=>({...l,[cat]:false}));
    const hit=results.find(a=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase())));
    if(hit)setBreaking(hit);
  },[feeds,alerts,loading]);

  const loadPodcast=useCallback(async(pod)=>{
    if(podLoading[pod.name])return;
    setPodLoading(l=>({...l,[pod.name]:true}));
    const eps=await fetchRSS(pod.url);
    setPodEps(p=>({...p,[pod.name]:eps.map(e=>({...e,show:pod.name,host:pod.host,showEmoji:pod.emoji}))}));
    setPodLoading(l=>({...l,[pod.name]:false}));
  },[podLoading]);

  useEffect(()=>{
    Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));
    PODCAST_FEEDS.forEach(p=>loadPodcast(p));
  },[]);

  const refreshAll=()=>{
    setArts({general:[],sports:[],business:[],finance:[],bloom:[]});
    setLoading({general:false,sports:false,business:false,finance:false,bloom:false});
    setPodEps({});setPodLoading({});
    setTimeout(()=>{
      Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));
      PODCAST_FEEDS.forEach(p=>loadPodcast(p));
    },100);
  };

  const MiniActs=({a})=>(
    <div className="mini-acts">
      <button className={`mini-act ${likes[a.link]===1?'al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
      <button className={`mini-act ${likes[a.link]===-1?'ad':''}`} onClick={e=>likeArt(a.link,-1,e)}>Dn</button>
      <button className={`mini-act ${isSaved(a)?'as':''}`} onClick={e=>saveArt(a,e)}>Sv</button>
    </div>
  );

  const FullActs=({a})=>{
    const id=btoa(a.link.slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);
    return(
      <div className="feed-acts">
        <button className={`act-b ${likes[a.link]===1?'al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
        <button className={`act-b ${likes[a.link]===-1?'ad':''}`} onClick={e=>likeArt(a.link,-1,e)}>Down</button>
        <button className={`act-b ${isSaved(a)?'as':''}`} onClick={e=>saveArt(a,e)}>Save</button>
        <button className={`act-b ${summaries[id]||summaryLoading[id]?'ai':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
        <button className="act-b" onClick={()=>clickArt(a)}>Read</button>
      </div>
    );
  };

  const HeroRow=({a,cat})=>{
    const cc=CATS[cat],kws=kwMatch(a),alert=isAlert(a);
    return(
      <div className="hero-row" onClick={()=>clickArt(a)}>
        {a.img?<img className="thumb-sm" src={a.img} loading="lazy" onError={e=>e.target.style.display='none'} alt=""/>:<div className="thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="hero-body">
          <div className="hero-title">{alert&&<span style={{color:'#dc2626',fontSize:'9px',fontWeight:'700',marginRight:'4px'}}>ALERT</span>}{a.title}</div>
          <div className="hero-meta"><span style={{color:cc.color,fontWeight:'600'}}>{a.source}</span>{kws.slice(0,2).map(k=><span key={k} className="kw-tag" style={{background:cc.bg,color:cc.color}}>{k}</span>)}</div>
          <div className="hero-date">{fmtDate(a.pubDate)}</div>
          <MiniActs a={a}/>
        </div>
      </div>
    );
  };

  const FeedCard=({a,cat})=>{
    const cc=CATS[cat],kws=kwMatch(a),alert=isAlert(a);
    const init=(a.source||'?').slice(0,2).toUpperCase();
    const id=btoa(a.link.slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);
    return(
      <div className={`feed-card ${cat==='bloom'?'bloom-card':''}`} onClick={()=>clickArt(a)}>
        <div className="feed-av" style={{background:cc.bg,color:cc.color}}>{init}</div>
        <div className="feed-body">
          <div className="feed-top-row">
            <span className="feed-src" style={{color:cc.color}}>{a.source}</span>
            {alert&&<span style={{background:'#fef2f2',color:'#dc2626',borderRadius:'4px',padding:'1px 5px',fontSize:'9px',fontWeight:'700'}}>ALERT</span>}
            <span className="feed-date">{fmtDate(a.pubDate)}</span>
          </div>
          <div className="feed-title">{a.title}</div>
          {a.desc&&<div className="feed-desc">{a.desc}</div>}
          {summaryLoading[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div>{summaries[id]}</div>}
          <div className="feed-footer">
            <div className="feed-kws">{kws.slice(0,3).map(k=><span key={k} className="kw-tag" style={{background:cc.bg,color:cc.color}}>{k}</span>)}</div>
            <FullActs a={a}/>
          </div>
        </div>
        {a.img?<img className="feed-img" src={a.img} loading="lazy" onError={e=>e.target.style.display='none'} alt=""/>:<div className="feed-img-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
      </div>
    );
  };

  const PodCard=({ep,idx})=>{
    const id=`pod_${ep.show}_${idx}`;
    const isSv=isSaved({...ep,link:ep.link||ep.show+idx});
    return(
      <div className="pod-card">
        <div className="pod-card-top">
          <div className="pod-card-num">{idx+1}</div>
          <div className="pod-card-body">
            <div className="pod-card-show">{ep.showEmoji} {ep.show}</div>
            <div className="pod-card-title" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>{ep.title}</div>
            <div className="pod-card-meta">
              <span>{fmtDate(ep.pubDate)}</span>
              {ep.duration&&<span>{fmtDuration(ep.duration)}</span>}
              <span style={{color:'#e11d48',fontWeight:'500'}}>{ep.host}</span>
            </div>
            {ep.desc&&<div className="pod-card-desc">{ep.desc}</div>}
          </div>
        </div>
        {summaryLoading[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating summary...</em></div>}
        {summaries[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Episode Summary</div>{summaries[id]}</div>}
        <div className="pod-card-footer">
          <button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen</button>
          <button className={`pod-btn ${summaries[id]||summaryLoading[id]?'ai-active':''}`} onClick={e=>getSummary(id,ep.title,ep.desc,e)}>
            {summaryLoading[id]?'Summarizing...':summaries[id]?'Hide Summary':'AI Summary'}
          </button>
          <button className={`pod-btn ${isSv?'saved-btn':''}`} onClick={e=>saveArt({...ep,link:ep.link||ep.show+idx,source:ep.show,cat:'podcasts'},e)}>
            {isSv?'Saved':'Save'}
          </button>
        </div>
      </div>
    );
  };

  const PodcastsPage=()=>{
    const allEps=[];
    PODCAST_FEEDS.forEach(p=>{
      (podEps[p.name]||[]).slice(0,3).forEach(e=>allEps.push({...e,show:p.name,host:p.host,showEmoji:p.emoji}));
    });
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
          </div>
          {isLoading&&!displayEps.length?<div className="loading-state" style={{padding:'40px'}}>Loading episodes...</div>:
          displayEps.length===0?<div className="loading-state" style={{padding:'40px'}}>No episodes yet — tap R to refresh</div>:
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
              const eps=podEps[p.name]||[];
              const latest=eps[0];
              const isActive=activePod?.name===p.name;
              return(
                <div key={i} className="pod-show-item" onClick={()=>setActivePod(isActive?null:p)} style={{background:isActive?'var(--bg)':''}}>
                  <div className="pod-show-item-emoji">{p.emoji}</div>
                  <div className="pod-show-item-info">
                    <div className="pod-show-item-name" style={{color:isActive?'#e11d48':''}}>{p.name}</div>
                    <div className="pod-show-item-ep">{podLoading[p.name]?'Loading...':(latest?latest.title.slice(0,40)+'...':'No episodes yet')}</div>
                  </div>
                  {isActive&&<div className="pod-show-item-dot"></div>}
                </div>
              );
            })}
          </div>
          <div className="side-block">
            <div className="side-title">About AI Summaries</div>
            <div style={{fontSize:'11px',color:'var(--text2)',lineHeight:'1.6'}}>Tap <strong>AI Summary</strong> on any episode for a 2-3 sentence Claude-powered summary of what the episode covers — without listening first.</div>
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
        {ld?<div className="loading-state">Loading...</div>:arts2.length===0?<div className="loading-state">No articles yet — tap R</div>:(
          <div className="bloom-strip">
            {arts2.slice(0,4).map((a,i)=>(
              <div key={i} className="bloom-strip-item" onClick={()=>clickArt(a)}>
                <div className="bloom-strip-title">{a.title}</div>
                <div className="bloom-strip-meta">{a.source}</div>
                <div className="bloom-strip-date">{fmtDate(a.pubDate)}</div>
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
    const allPodEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,1).map(e=>({...e,show:p.name,emoji:p.emoji})));
    const latestPod=allPodEps.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))[0];
    return(
      <div className="ts-bar">
        <div className="ts-inner">
          {!hasAny?<div className="ts-item"><div className="ts-cat" style={{color:'var(--text3)'}}>Loading...</div></div>:
          newsCats.map(cat=>{
            const cc=CATS[cat],top=sorted(cat)[0];
            if(!top)return<div key={cat} className="ts-item"><div className="ts-cat" style={{color:cc.color}}>{cc.emoji} {cc.label}</div></div>;
            return<div key={cat} className="ts-item" onClick={()=>clickArt(top)}>
              <div className="ts-cat" style={{color:cc.color}}>{cc.emoji} {cc.label}</div>
              <div className="ts-title">{top.title}</div>
              <div className="ts-src">{top.source} · {fmtDate(top.pubDate)}</div>
            </div>;
          })}
          {latestPod&&<div className="ts-item" onClick={()=>setTab('podcasts')}>
            <div className="ts-cat" style={{color:'#e11d48'}}>{latestPod.emoji} Podcast</div>
            <div className="ts-title">{latestPod.title}</div>
            <div className="ts-src">{latestPod.show} · {fmtDate(latestPod.pubDate)}</div>
          </div>}
        </div>
      </div>
    );
  };

  const Sidebar=({cat})=>{
    const arts2=sorted(cat);
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
        </div>
        {cat==='bloom'&&<div className="side-block" style={{border:'1px solid #bae6fd'}}><div className="side-title" style={{color:'#0369a1'}}>About This Feed</div><div style={{fontSize:'11px',color:'var(--text2)',lineHeight:'1.6'}}>Tracks Bloom Energy (NYSE: BE), fuel cells, distributed power, AI data center power, onshoring, industrial energy, oil and gas, and utility-scale solutions.</div></div>}
        <div className="side-block"><div className="side-title">Keywords</div>{kw.map((k,i)=><span key={i} className={`kw-chip ${cat==='bloom'?'bloom-kw':''}`} onClick={()=>setSearch(k)}>{k}</span>)}</div>
        <div className="side-block"><div className="side-title">Alert Keywords</div>{alerts.map((a,i)=><span key={i} style={{display:'inline-block',background:'#fef2f2',color:'#dc2626',borderRadius:'20px',padding:'3px 9px',fontSize:'10px',margin:'2px',fontWeight:'500'}}>{a}</span>)}</div>
        <div className="side-block"><div className="side-title">Social</div>{social.map((h,i)=><div key={i} className="social-row" onClick={()=>window.open(`https://twitter.com/${h.replace('@','')}`)}>
          <div className="social-av">{h.replace('@','').slice(0,2).toUpperCase()}</div>
          <span className="social-name">{h}</span><span className="social-arr">go</span>
        </div>)}</div>
      </div>
    );
  };

  const CustomizePanel=()=>{
    const[lf,setLf]=useState(JSON.parse(JSON.stringify(feeds)));
    const[lk,setLk]=useState([...kw]);
    const[la,setLa]=useState([...alerts]);
    const[ls,setLs]=useState([...social]);
    const saveAll=()=>{setFeeds(lf);save('feeds',lf);setKw(lk);save('kw',lk);setAlerts(la);save('alerts',la);setSocial(ls);save('social',ls);setShowPanel(false);refreshAll();};
    return(
      <div className="panel-overlay open">
        <div className="panel">
          <div className="panel-head"><span className="panel-htitle">Customize Hub</span><button className="panel-x" onClick={()=>setShowPanel(false)}>X</button></div>
          <div className="panel-body">
            <div className="p-sec">
              <div className="p-lbl">Breaking News Alerts</div>
              <div className="alert-info">Red banner appears when these words hit any headline.</div>
              <div>{la.map((a,i)=><span key={i} className="p-chip p-alert">{a}<button className="p-chip-x" style={{color:'#dc2626'}} onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>x</button></span>)}</div>
              <div className="p-add"><input className="p-input" placeholder="e.g. Bloom Energy, ERCOT..." value={newAlert} onChange={e=>setNewAlert(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/><button className="p-alert-btn" onClick={()=>{if(newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button></div>
            </div>
            {Object.keys(DEFAULT_FEEDS).map(cat=>(
              <div key={cat} className="p-sec">
                <div className="p-lbl">{CATS[cat].emoji} {CATS[cat].label}</div>
                {cat==='bloom'&&<div className="bloom-note">Tracks: Bloom Energy, fuel cells, data center power, onshoring, industrial energy, oil and gas, utilities</div>}
                {(lf[cat]||[]).map((f,i)=><div key={i} className="p-row"><span className="p-name">{f.name}</span><button className={`tog ${f.on?'on':'off'}`} onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[cat][i].on=!n[cat][i].on;return n;})}></button></div>)}
              </div>
            ))}
            <div className="p-sec"><div className="p-lbl">Tracking Keywords</div><div>{lk.map((k,i)=><span key={i} className="p-chip p-kw">{k}<button className="p-chip-x" onClick={()=>setLk(x=>x.filter((_,j)=>j!==i))}>x</button></span>)}</div><div className="p-add"><input className="p-input" placeholder="Add keyword..." value={newKw} onChange={e=>setNewKw(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newKw.trim()){setLk(x=>[...x,newKw.trim()]);setNewKw('');}}}/><button className="p-add-btn" onClick={()=>{if(newKw.trim()){setLk(x=>[...x,newKw.trim()]);setNewKw('');}}}>Add</button></div></div>
            <div className="p-sec"><div className="p-lbl">Social Follows</div><div>{ls.map((s,i)=><span key={i} className="p-chip p-so">{s}<button className="p-chip-x" style={{color:'#166534'}} onClick={()=>setLs(x=>x.filter((_,j)=>j!==i))}>x</button></span>)}</div><div className="p-add"><input className="p-input" placeholder="@handle" value={newSocial} onChange={e=>setNewSocial(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}/><button className="p-add-btn" onClick={()=>{if(newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}>Add</button></div></div>
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
              {['today','general','sports','business','finance','bloom','podcasts','saved'].map(t=>(
                <button key={t} className={`nav-tab${tab===t?' active':''} ${t==='bloom'?'bloom-tab':''} ${t==='podcasts'?'pod-tab':''}`}
                  onClick={()=>{setTab(t);setSearch('');if(!['today','saved','podcasts'].includes(t)&&!(arts[t]||[]).length)loadCat(t);}}>
                  {t==='today'?'Today':t==='bloom'?'Bloom Energy':t==='podcasts'?'Podcasts':t==='saved'?'Saved':t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
            <div className="topbar-right">
              <input className="search" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value.toLowerCase())}/>
              <button className="btn-icon" onClick={refreshAll} title="Refresh">R</button>
              <button className="btn-icon" onClick={()=>setDark(d=>!d)} title="Dark mode">{dark?'L':'D'}</button>
              <button className="btn-blue" onClick={()=>setShowPanel(true)}>Customize</button>
            </div>
          </div>
        </div>
        {breaking&&<div className="breaking show"><div className="breaking-inner"><span className="breaking-badge">BREAKING</span><span className="breaking-text">{breaking.title} — {breaking.source}</span><button className="breaking-x" onClick={()=>setBreaking(null)}>X</button></div></div>}
        <TopStories/>
        <div className="main">
          {tab==='today'&&<div className="today-grid">{mainCats.map(c=><CatBlock key={c} cat={c}/>)}<BloomBlock/></div>}
          {mainCats.includes(tab)&&(
            loading[tab]?<div style={{textAlign:'center',padding:'60px',fontSize:'13px',color:'var(--text3)'}}>Loading...</div>:
            sorted(tab).length===0?<div className="no-art"><p className="no-art-msg">No articles found</p><button className="refresh-btn" style={{background:'#1d4ed8'}} onClick={refreshAll}>Refresh Now</button></div>:
            <div className="cat-page"><div className="feed-col"><div style={{fontSize:'10px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'4px'}}>{CATS[tab].emoji} Top Stories — {sorted(tab).length} articles</div>{sorted(tab).slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat={tab}/>)}</div><Sidebar cat={tab}/></div>
          )}
          {tab==='bloom'&&(
            loading.bloom?<div style={{textAlign:'center',padding:'60px',fontSize:'13px',color:'var(--text3)'}}>Loading...</div>:
            sorted('bloom').length===0?<div className="no-art"><p className="no-art-msg">No articles found</p><button className="refresh-btn" style={{background:'#0369a1'}} onClick={refreshAll}>Refresh Now</button></div>:
            <div className="cat-page"><div className="feed-col"><div className="bloom-banner"><div style={{fontSize:'28px'}}>🔋</div><div className="bloom-banner-body"><div className="bloom-banner-title">Bloom Energy and Power Intelligence</div><div className="bloom-banner-sub">Fuel cells · Data center power · Onshoring · Industrial energy · {sorted('bloom').length} articles</div></div></div>{sorted('bloom').slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat="bloom"/>)}</div><Sidebar cat="bloom"/></div>
          )}
          {tab==='podcasts'&&<PodcastsPage/>}
          {tab==='saved'&&(
            saved.length===0?<div className="saved-empty"><div style={{fontSize:'28px',marginBottom:'10px'}}>S</div><div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)',marginBottom:'4px'}}>No saved items</div><div style={{fontSize:'11px'}}>Tap Save on any article or episode</div></div>:
            <div className="cat-page"><div className="feed-col"><div style={{fontSize:'10px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'4px'}}>Saved — {saved.length} items</div>{saved.map((a,i)=>a.cat==='podcasts'?<PodCard key={i} ep={a} idx={i}/>:<FeedCard key={i} a={a} cat={a.cat||'general'}/>)}</div></div>
          )}
        </div>
        {showPanel&&<CustomizePanel/>}
      </div>
    </>
  );
}
