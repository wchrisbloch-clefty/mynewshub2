import { useState, useEffect, useCallback } from "react";

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATS = {
  general:  { label:'General',      color:'#1d4ed8', bg:'#eff6ff', emoji:'🌐' },
  sports:   { label:'Sports',       color:'#d97706', bg:'#fef3c7', emoji:'🏆' },
  business: { label:'Business',     color:'#16a34a', bg:'#f0fdf4', emoji:'⚡' },
  finance:  { label:'Finance',      color:'#7c3aed', bg:'#f5f3ff', emoji:'📈' },
  bloom:    { label:'Bloom Energy', color:'#0369a1', bg:'#e0f2fe', emoji:'🔋' },
  comedy:   { label:'Comedy',       color:'#db2777', bg:'#fdf2f8', emoji:'😂' },
};

const TICKERS = [
  { sym:'BE',   label:'Bloom Energy', color:'#0369a1' },
  { sym:'CL=F', label:'Crude Oil',    color:'#16a34a' },
  { sym:'BTC',  label:'Bitcoin',      color:'#d97706' },
];

const PODCAST_FEEDS = [
  { name:'Joe Rogan Experience', host:'Joe Rogan',         url:'https://feeds.megaphone.fm/GLT1412515089',   emoji:'🟢' },
  { name:'Ben Shapiro Show',     host:'Ben Shapiro',       url:'https://feeds.megaphone.fm/BVDWV5370667266', emoji:'🔵' },
  { name:'Tucker Carlson Show',  host:'Tucker Carlson',    url:'https://feeds.megaphone.fm/RSV1597324942',   emoji:'🦅' },
  { name:'Candace',              host:'Candace Owens',     url:'https://feeds.megaphone.fm/candace',         emoji:'🎤' },
  { name:'Morning Wire',         host:'Daily Wire',        url:'https://feeds.megaphone.fm/BVDWV8747925072', emoji:'☀️' },
  { name:'All-In Podcast',       host:'Chamath & Besties', url:'https://allinchamathjason.libsyn.com/rss',   emoji:'💰' },
  { name:'Flagrant',             host:'Andrew Schulz',     url:'https://feeds.megaphone.fm/APPI6857213837',  emoji:'🔥' },
];

const DEFAULT_KW = {
  general:  ['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:   ['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB','recruiting','transfer portal'],
  business: ['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:  ['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:    ['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  comedy:   ['satire','parody','humor','comedy'],
};

const DEFAULT_FEEDS = {
  general: [
    { name:'BBC News',          url:'https://feeds.bbci.co.uk/news/rss.xml',                                    on:true },
    { name:'Reuters Top News',  url:'https://feeds.reuters.com/reuters/topNews',                                on:true },
    { name:'CNBC Top News',     url:'https://www.cnbc.com/id/100003114/device/rss/rss.html',                    on:true },
    { name:'Fox News',          url:'https://moxie.foxnews.com/google-publisher/latest.xml',                    on:true },
    { name:'NY Post',           url:'https://nypost.com/feed/',                                                 on:true },
    { name:'The Hill',          url:'https://thehill.com/homenews/feed/',                                       on:true },
    { name:'TechCrunch',        url:'https://techcrunch.com/feed/',                                             on:true },
    { name:'Washington Times',  url:'https://www.washingtontimes.com/rss/headlines/news/',                      on:true },
    { name:'The Guardian US',   url:'https://www.theguardian.com/us/rss',                                       on:true },
    { name:'Axios',             url:'https://api.axios.com/feed/',                                              on:true },
    { name:'Breitbart',         url:'https://feeds.feedburner.com/breitbart',                                   on:true },
    { name:'KHOU Houston',      url:'https://www.khou.com/feeds/syndication/rss/news',                          on:true },
    { name:'Click2Houston',     url:'https://www.click2houston.com/rss/news.rss',                               on:true },
    { name:'Chron.com',         url:'https://www.chron.com/rss/feed/News-270.php',                              on:true },
  ],
  sports: [
    { name:'ESPN NFL',             url:'https://www.espn.com/espn/rss/nfl/news',                                on:true },
    { name:'ESPN MLB',             url:'https://www.espn.com/espn/rss/mlb/news',                                on:true },
    { name:'ESPN CFB',             url:'https://www.espn.com/espn/rss/ncf/news',                                on:true },
    { name:'ESPN CBB',             url:'https://www.espn.com/espn/rss/ncb/news',                                on:true },
    { name:'CBS Sports NFL',       url:'https://www.cbssports.com/rss/headlines/nfl',                           on:true },
    { name:'CBS Sports MLB',       url:'https://www.cbssports.com/rss/headlines/mlb',                           on:true },
    { name:'CBS Sports CFB',       url:'https://www.cbssports.com/rss/headlines/college-football',              on:true },
    { name:'CBS Sports CBB',       url:'https://www.cbssports.com/rss/headlines/college-basketball',            on:true },
    { name:'Pro Football Talk',    url:'https://www.nbcsports.com/profootballtalk.rss',                         on:true },
    { name:'Bleacher Report',      url:'https://feeds.bleacherreport.com/articles/feed',                        on:true },
    { name:'247Sports',            url:'https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/', on:true },
    { name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',                                 on:true },
    { name:'On3 Recruiting',       url:'https://www.on3.com/feed/',                                             on:true },
    { name:'The Spun',             url:'https://thespun.com/.rss/full/',                                        on:true },
  ],
  business: [
    { name:'Reuters Business',       url:'https://feeds.reuters.com/reuters/businessNews',                      on:true },
    { name:'CNBC Energy',            url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',                on:true },
    { name:'Oilprice.com',           url:'https://oilprice.com/rss/main',                                       on:true },
    { name:'Utility Dive',           url:'https://www.utilitydive.com/feeds/news/',                             on:true },
    { name:'Data Center Dynamics',   url:'https://www.datacenterdynamics.com/en/rss/',                          on:true },
    { name:'Power Magazine',         url:'https://www.powermag.com/feed/',                                      on:true },
    { name:'Rigzone',                url:'https://www.rigzone.com/news/rss/rigzone_latest.aspx',                on:true },
    { name:'MIT Tech Review',        url:'https://www.technologyreview.com/feed/',                              on:true },
    { name:'AI News',                url:'https://artificialintelligence-news.com/feed/',                       on:true },
    { name:'Canary Media',           url:'https://www.canarymedia.com/rss',                                     on:true },
    { name:'The Guardian Business',  url:'https://www.theguardian.com/business/rss',                            on:true },
    { name:'CNBC Tech',              url:'https://www.cnbc.com/id/19854910/device/rss/rss.html',                on:true },
  ],
  finance: [
    { name:'MarketWatch',   url:'https://feeds.marketwatch.com/marketwatch/topstories/',                        on:true },
    { name:'Yahoo Finance', url:'https://finance.yahoo.com/news/rssindex',                                      on:true },
    { name:'Kiplinger',     url:'https://www.kiplinger.com/rss/all',                                            on:true },
    { name:'Motley Fool',   url:'https://www.fool.com/feeds/index.aspx',                                        on:true },
    { name:'Investopedia',  url:'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline', on:true },
    { name:'BiggerPockets', url:'https://www.biggerpockets.com/blog/feed',                                      on:true },
    { name:'CNBC Finance',  url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',                        on:true },
  ],
  bloom: [
    { name:'Oilprice.com',          url:'https://oilprice.com/rss/main',                                       on:true },
    { name:'Utility Dive',          url:'https://www.utilitydive.com/feeds/news/',                              on:true },
    { name:'Data Center Dynamics',  url:'https://www.datacenterdynamics.com/en/rss/',                          on:true },
    { name:'Power Magazine',        url:'https://www.powermag.com/feed/',                                       on:true },
    { name:'Reuters Business',      url:'https://feeds.reuters.com/reuters/businessNews',                       on:true },
    { name:'CNBC Energy',           url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',                on:true },
    { name:'MIT Tech Review',       url:'https://www.technologyreview.com/feed/',                               on:true },
    { name:'Canary Media',          url:'https://www.canarymedia.com/rss',                                      on:true },
    { name:'Rigzone',               url:'https://www.rigzone.com/news/rss/rigzone_latest.aspx',                 on:true },
  ],
  comedy: [
    { name:'The Babylon Bee', url:'https://babylonbee.com/feed',  on:true },
    { name:'The Onion',       url:'https://www.theonion.com/rss', on:true },
  ],
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = 'v13_';
function ld(k,d){try{const v=localStorage.getItem(SK+k);return v?JSON.parse(v):d;}catch{return d;}}
function sv(k,v){try{localStorage.setItem(SK+k,JSON.stringify(v));}catch{}}

// ─── RSS FETCH ────────────────────────────────────────────────────────────────
function parseXML(txt) {
  const p = new DOMParser(), x = p.parseFromString(txt,'text/xml');
  const items = Array.from(x.querySelectorAll('item')).slice(0,15);
  if(!items.length) return [];
  return items.map(i => {
    const desc=(i.querySelector('description')?.textContent||i.querySelector('summary')?.textContent||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300);
    const imgEl=i.querySelector('enclosure[type^="image"]');
    const img=imgEl?.getAttribute('url')||i.querySelector('image url')?.textContent||'';
    return { title:(i.querySelector('title')?.textContent||'').trim(), link:i.querySelector('link')?.textContent||'', desc, pubDate:i.querySelector('pubDate')?.textContent||'', img, duration:i.querySelector('duration')?.textContent||'' };
  });
}

async function fetchRSS(url) {
  try {
    const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
    const d=await r.json();
    if(d.items?.length>0) return d.items.map(i=>({title:(i.title||'').trim(),link:i.link,desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300),pubDate:i.pubDate,img:i.thumbnail||'',duration:i.itunes_duration||''}));
  } catch {}
  try {
    const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const d=await r.json();
    if(d.contents){const items=parseXML(d.contents);if(items.length)return items;}
  } catch {}
  try {
    const r=await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const txt=await r.text();
    const items=parseXML(txt);if(items.length)return items;
  } catch {}
  return [];
}

// ─── DATE FORMATTER ───────────────────────────────────────────────────────────
function fmtDate(d) {
  if(!d) return '';
  try {
    const dt=new Date(d);if(isNaN(dt.getTime()))return '';
    const now=new Date(),diff=Math.floor((now-dt)/1000);
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h=dt.getHours()%12||12,m=String(dt.getMinutes()).padStart(2,'0'),ampm=dt.getHours()>=12?'PM':'AM';
    const timeStr=`${h}:${m} ${ampm}`;
    if(diff<60)return 'Just now';
    if(diff<3600)return `${Math.floor(diff/60)}m ago`;
    if(diff<86400)return `${days[dt.getDay()]} ${timeStr}`;
    return `${months[dt.getMonth()]} ${dt.getDate()} · ${timeStr}`;
  } catch{return '';}
}

function fmtDuration(s) {
  if(!s)return '';
  const parts=s.split(':').map(Number);
  if(parts.length===3){const[h,m]=parts;return h>0?`${h}h ${m}m`:`${m}m`;}
  if(parts.length===2)return `${parts[0]}m`;
  const tot=parseInt(s);if(isNaN(tot))return s;
  const h=Math.floor(tot/3600),m=Math.floor((tot%3600)/60);
  return h>0?`${h}h ${m}m`:`${m}m`;
}

// ─── WEATHER ──────────────────────────────────────────────────────────────────
const HOUSTON={lat:29.7604,lon:-95.3698};
const WX_CODES={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Showers',81:'Heavy Showers',95:'Thunderstorm',99:'Severe Storm'};
const WX_EMOJI={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'⛈️',71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',95:'⛈️',99:'🌪️'};

async function fetchWeather() {
  try {
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${HOUSTON.lat}&longitude=${HOUSTON.lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FChicago`);
    const d=await r.json();const c=d.current;
    return{temp:Math.round(c.temperature_2m),code:c.weathercode,wind:Math.round(c.windspeed_10m),desc:WX_CODES[c.weathercode]||'Unknown',emoji:WX_EMOJI[c.weathercode]||'🌡️'};
  } catch{return null;}
}

async function fetchQuote(sym) {
  try {
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
    const proxy=`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const r=await fetch(proxy);const d=await r.json();
    const data=JSON.parse(d.contents);const meta=data.chart.result[0].meta;
    const price=meta.regularMarketPrice,prev=meta.previousClose||meta.chartPreviousClose;
    const chg=price-prev,pct=(chg/prev)*100;
    return{price,chg,pct};
  } catch{return null;}
}

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#f8f9fa;--surface:#fff;--border:#e8e8e8;--border2:#f1f5f9;--text:#0f172a;--text2:#64748b;--text3:#94a3b8;}
.dark{--bg:#0f172a;--surface:#1e293b;--border:#334155;--border2:#253347;--text:#f1f5f9;--text2:#94a3b8;--text3:#475569;}
body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
.hub{background:var(--bg);min-height:100vh;}

/* topbar */
.topbar-wrap{position:sticky;top:0;z-index:300;}
.utility-strip{background:#0f172a;padding:0 20px;display:flex;align-items:center;height:32px;overflow:hidden;}
.utility-strip-inner{max-width:1300px;margin:0 auto;width:100%;display:flex;align-items:center;gap:16px;}
.wx-pill{display:flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;white-space:nowrap;flex-shrink:0;}
.wx-temp{font-weight:600;color:#e2e8f0;}.wx-desc{color:#64748b;}
.strip-div{width:1px;height:14px;background:#1e293b;flex-shrink:0;}
.ticker-row{display:flex;gap:16px;align-items:center;overflow-x:auto;scrollbar-width:none;flex:1;}
.ticker-row::-webkit-scrollbar{display:none;}
.ticker-item{display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;padding:4px 8px;border-radius:4px;transition:background 0.12s;flex-shrink:0;}
.ticker-item:hover{background:#1e293b;}
.ticker-sym{font-size:11px;font-weight:700;color:#e2e8f0;}.ticker-price{font-size:11px;color:#94a3b8;}
.ticker-chg{font-size:10px;font-weight:600;}.ticker-up{color:#4ade80;}.ticker-down{color:#f87171;}
.breaking-strip{background:#dc2626;height:28px;display:flex;align-items:center;overflow:hidden;position:relative;}
.breaking-strip.hidden{display:none;}
.breaking-label{background:#fff;color:#dc2626;font-size:9px;font-weight:800;letter-spacing:0.08em;padding:2px 8px;border-radius:0 4px 4px 0;white-space:nowrap;flex-shrink:0;z-index:2;}
.breaking-ticker{flex:1;overflow:hidden;margin:0 10px;}
.breaking-ticker-inner{display:inline-flex;gap:40px;animation:ticker-scroll 30s linear infinite;white-space:nowrap;}
.breaking-ticker-inner:hover{animation-play-state:paused;}
@keyframes ticker-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.breaking-item{font-size:11px;color:#fff;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:8px;}
.breaking-item:hover{text-decoration:underline;}
.breaking-sep{color:rgba(255,255,255,0.4);font-size:10px;}
.breaking-close{background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:14px;padding:0 12px;flex-shrink:0;line-height:1;}
.breaking-close:hover{color:#fff;}
.nav-bar{background:#fff;border-bottom:1px solid #e8e8e8;padding:0 20px;}
.dark .nav-bar{background:#1e293b;border-color:#334155;}
.nav-bar-inner{max-width:1300px;margin:0 auto;display:flex;align-items:center;gap:10px;height:46px;}
.logo{font-size:15px;font-weight:800;color:#0f172a;flex-shrink:0;letter-spacing:-0.5px;}
.dark .logo{color:#f1f5f9;}.logo span{color:#1d4ed8;}
.nav-tabs{display:flex;gap:2px;flex:1;overflow-x:auto;scrollbar-width:none;border-left:1px solid #e8e8e8;margin-left:8px;padding-left:8px;}
.dark .nav-tabs{border-color:#334155;}.nav-tabs::-webkit-scrollbar{display:none;}
.nav-tab{background:transparent;border:none;color:#94a3b8;padding:5px 11px;cursor:pointer;font-size:12px;font-weight:500;white-space:nowrap;font-family:inherit;border-radius:6px;transition:all 0.12s;}
.nav-tab.active{color:#1d4ed8;background:#eff6ff;}
.nav-tab.bloom-tab.active{color:#0369a1;background:#e0f2fe;}
.nav-tab.pod-tab.active{color:#e11d48;background:#fff1f2;}
.nav-tab.comedy-tab.active{color:#db2777;background:#fdf2f8;}
.nav-tab:hover:not(.active){color:#475569;}
.nav-right{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.search-input{background:#f1f5f9;border:1px solid #e8e8e8;color:#0f172a;border-radius:6px;padding:5px 10px;font-size:12px;width:110px;font-family:inherit;}
.dark .search-input{background:#0f172a;border-color:#334155;color:#f1f5f9;}
.search-input:focus{outline:1px solid #1d4ed8;}
.nav-btn{background:#f1f5f9;border:1px solid #e8e8e8;color:#475569;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;}
.dark .nav-btn{background:#0f172a;border-color:#334155;color:#94a3b8;}
.nav-btn-blue{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;}

/* page layout */
.page{max-width:1300px;margin:0 auto;padding:16px 20px;}
.page-grid{display:grid;grid-template-columns:1fr 260px;gap:16px;align-items:start;}
.feed-col{display:flex;flex-direction:column;gap:8px;}
.page-header{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;}
.empty-state{text-align:center;padding:60px 20px;color:var(--text3);}
.empty-icon{font-size:32px;margin-bottom:10px;}
.empty-msg{font-size:13px;color:var(--text2);margin-bottom:14px;}
.refresh-btn{background:#1d4ed8;border:none;color:#fff;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

/* feed card */
.fc{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:12px 14px;cursor:pointer;transition:border-color 0.12s,box-shadow 0.12s;display:flex;flex-direction:column;gap:0;}
.fc:hover{border-color:#bfdbfe;box-shadow:0 1px 8px rgba(29,78,216,0.07);}
.fc.bloom:hover{border-color:#bae6fd;}.fc.comedy:hover{border-color:#fbcfe8;}
.fc-meta{display:flex;align-items:center;gap:6px;margin-bottom:7px;flex-wrap:wrap;}
.fc-source{font-size:11px;font-weight:700;letter-spacing:-0.1px;}
.fc-date{font-size:10px;color:var(--text3);margin-left:auto;white-space:nowrap;}
.fc-topic{font-size:9px;font-weight:600;border-radius:10px;padding:2px 7px;letter-spacing:0.02em;text-transform:uppercase;}
.fc-alert-badge{font-size:9px;font-weight:700;background:#fef2f2;color:#dc2626;border-radius:4px;padding:1px 5px;letter-spacing:0.04em;}
.fc-body{display:flex;gap:11px;align-items:flex-start;}
.fc-thumb{width:72px;height:54px;border-radius:7px;object-fit:cover;flex-shrink:0;background:var(--bg);}
.fc-thumb-ph{width:72px;height:54px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--bg);}
.fc-text{flex:1;min-width:0;}
.fc-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.35;letter-spacing:-0.15px;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.fc-desc{font-size:11px;color:var(--text2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.fc-actions{display:flex;align-items:center;gap:5px;margin-top:10px;padding-top:9px;border-top:1px solid var(--border2);}
.fc-act{background:none;border:1px solid var(--border);border-radius:5px;padding:3px 9px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;font-weight:500;transition:all 0.1s;display:flex;align-items:center;gap:3px;}
.fc-act:hover{border-color:#1d4ed8;color:#1d4ed8;}
.fc-act.saved{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.fc-act.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.fc-read-link{margin-left:auto;font-size:10px;color:var(--text3);text-decoration:none;font-weight:500;display:flex;align-items:center;gap:3px;}
.fc-read-link:hover{color:#1d4ed8;}
.fc-summary{margin-top:10px;background:var(--bg);border:1px solid #ddd6fe;border-radius:8px;padding:10px 12px;}
.fc-summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;}
.fc-summary-text{font-size:12px;color:var(--text2);line-height:1.6;}
.fc-more{margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.fc-more-lbl{font-size:10px;color:var(--text3);}
.fc-more-src{font-size:10px;font-weight:600;border-radius:4px;padding:1px 6px;cursor:pointer;border:1px solid var(--border);color:var(--text2);background:none;font-family:inherit;transition:all 0.1s;}
.fc-more-src:hover{border-color:#1d4ed8;color:#1d4ed8;}

/* sidebar */
.sidebar{display:flex;flex-direction:column;gap:10px;min-width:0;}
.sb-block{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;}
.sb-head{padding:10px 14px 8px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.sb-title{font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.07em;}
.sb-clear{font-size:10px;color:#1d4ed8;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:500;}
.sb-clear:hover{text-decoration:underline;}
.sb-filter-active{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.sb-filter-label{font-size:11px;font-weight:600;color:#1d4ed8;}
.sb-filter-x{background:none;border:none;color:#1d4ed8;cursor:pointer;font-size:13px;line-height:1;padding:0;}
.kw-wrap{padding:10px 14px 12px;}
.kw-chips{display:flex;flex-wrap:wrap;gap:4px;}
.kw-chip{font-size:10px;font-weight:600;border-radius:20px;padding:3px 10px;cursor:pointer;transition:opacity 0.12s,transform 0.1s;border:1px solid transparent;display:inline-block;}
.kw-chip:hover{opacity:0.8;transform:scale(0.97);}
.kw-chip.active{border-color:currentColor;opacity:1;}
.src-list{padding:4px 0;}
.src-row{display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.src-row:last-child{border-bottom:none;}.src-row:hover{background:var(--bg);}
.src-row.active-src{background:var(--bg);}
.health-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.h-green{background:#16a34a;}.h-yellow{background:#d97706;}.h-red{background:#dc2626;}.h-gray{background:#94a3b8;}
.src-name{font-size:11px;font-weight:500;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.src-count{font-size:10px;color:var(--text3);white-space:nowrap;}
.trend-list{padding:4px 0;}
.trend-row{display:flex;align-items:flex-start;gap:10px;padding:8px 14px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.trend-row:last-child{border-bottom:none;}.trend-row:hover{background:var(--bg);}
.trend-num{font-size:16px;font-weight:800;color:var(--border);min-width:20px;line-height:1.1;flex-shrink:0;}
.trend-body{flex:1;min-width:0;}
.trend-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:2px;}
.trend-src{font-size:10px;color:var(--text3);}

/* Today page */
.today-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.today-block{background:var(--surface);border-radius:10px;border:1px solid var(--border);overflow:hidden;}
.today-block-head{padding:10px 14px 8px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.today-block-label{font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px;}
.today-block-count{font-size:9px;color:var(--text3);background:var(--bg);border-radius:8px;padding:1px 6px;border:1px solid var(--border);}
.today-see-all{font-size:11px;background:none;border:none;cursor:pointer;font-family:inherit;}
.today-item{padding:9px 14px;border-bottom:1px solid var(--border2);cursor:pointer;display:flex;gap:9px;align-items:flex-start;transition:background 0.1s;}
.today-item:last-child{border-bottom:none;}.today-item:hover{background:var(--bg);}
.today-thumb{width:50px;height:38px;border-radius:5px;object-fit:cover;flex-shrink:0;}
.today-thumb-ph{width:50px;height:38px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;}
.today-item-body{flex:1;min-width:0;}
.today-item-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.today-item-src{font-size:10px;color:var(--text3);}
.today-bloom-row{grid-column:1/-1;}
.bloom-strip{display:grid;grid-template-columns:repeat(4,1fr);}
.bloom-strip-item{padding:10px 14px;border-right:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.bloom-strip-item:last-child{border-right:none;}.bloom-strip-item:hover{background:var(--bg);}
.bloom-strip-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bloom-strip-src{font-size:10px;color:#0369a1;font-weight:500;}
.bloom-strip-date{font-size:9px;color:var(--text3);margin-top:2px;}

/* podcast */
.pod-page{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.pod-col{display:flex;flex-direction:column;gap:10px;}
.pod-header{background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:12px;}
.pod-header-emoji{font-size:28px;}.pod-header-name{font-size:13px;font-weight:700;color:#fff;}
.pod-header-sub{font-size:11px;color:rgba(255,255,255,0.8);margin-top:2px;}
.pod-card{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;}
.pod-card:hover{border-color:#fda4af;}
.pod-card-top{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;}
.pod-num{font-size:22px;font-weight:800;color:var(--border);min-width:28px;line-height:1;}
.pod-body{flex:1;min-width:0;}
.pod-show{font-size:10px;font-weight:600;color:#e11d48;margin-bottom:2px;}
.pod-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:4px;cursor:pointer;}
.pod-title:hover{color:#e11d48;}
.pod-meta{font-size:10px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap;}
.pod-desc{font-size:11px;color:var(--text2);line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pod-actions{display:flex;gap:6px;flex-wrap:wrap;}
.pod-btn{border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:500;background:none;color:var(--text2);}
.pod-btn:hover{border-color:#e11d48;color:#e11d48;}
.pod-btn.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.pod-btn.saved{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.pod-summary{background:var(--bg);border:1px solid #ddd6fe;border-radius:8px;padding:10px 12px;margin-top:10px;font-size:12px;color:var(--text2);line-height:1.6;}
.pod-summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;}
.pod-shows{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;}
.pod-show-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.pod-show-item:last-child{border-bottom:none;}.pod-show-item:hover .pod-show-name{color:#e11d48;}
.pod-show-emoji{font-size:18px;width:28px;text-align:center;}
.pod-show-name{font-size:12px;font-weight:600;color:var(--text);transition:color 0.1s;}
.pod-show-ep{font-size:10px;color:var(--text3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.pod-show-dot{width:6px;height:6px;border-radius:50%;background:#e11d48;flex-shrink:0;margin-left:auto;}
.saved-empty{text-align:center;padding:80px 20px;}

/* customize panel */
.cp-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;}
.cp-panel{background:var(--surface);border-radius:14px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2);}
.cp-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.cp-title{font-size:14px;font-weight:700;color:var(--text);}
.cp-x{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);line-height:1;}
.cp-body{padding:16px 20px;display:flex;flex-direction:column;gap:20px;}
.cp-sec{}.cp-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.cp-desc{font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:8px;}
.cp-cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;}
.cp-cat-tab{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:500;transition:all 0.1s;}
.cp-cat-tab.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.cp-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
.cp-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:500;}
.cp-chip-kw{background:#eff6ff;color:#1d4ed8;}.cp-chip-alert{background:#fef2f2;color:#dc2626;}
.cp-chip-x{background:none;border:none;cursor:pointer;font-size:12px;opacity:0.5;line-height:1;padding:0;}
.cp-chip-x:hover{opacity:1;}
.cp-add{display:flex;gap:6px;}
.cp-input{flex:1;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.cp-input:focus{outline:none;border-color:#1d4ed8;}
.cp-btn{background:#1d4ed8;border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
.cp-btn-red{background:#dc2626;}
.cp-src-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);}
.cp-src-row:last-child{border-bottom:none;}
.cp-health{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.cp-h-green{background:#16a34a;}.cp-h-yellow{background:#d97706;}.cp-h-red{background:#dc2626;}.cp-h-gray{background:#94a3b8;}
.cp-src-name{flex:1;font-size:12px;color:var(--text);}
.cp-src-count{font-size:10px;color:var(--text3);}
.cp-test-btn{background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);white-space:nowrap;}
.cp-tog{width:30px;height:17px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.cp-tog.on{background:#1d4ed8;}.cp-tog.off{background:#cbd5e1;}
.cp-tog::after{content:'';width:13px;height:13px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;}
.cp-tog.on::after{left:15px;}.cp-tog.off::after{left:2px;}
.cp-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:0 1px;line-height:1;}
.cp-del:hover{color:#dc2626;}
.cp-test-result{font-size:10px;padding:4px 8px;border-radius:5px;margin-top:4px;}
.cp-test-ok{background:#f0fdf4;color:#16a34a;}.cp-test-fail{background:#fef2f2;color:#dc2626;}.cp-test-load{background:var(--bg);color:var(--text3);font-style:italic;}
.cp-add-src{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px;display:flex;flex-direction:column;gap:6px;}
.cp-add-src-title{font-size:10px;font-weight:600;color:var(--text2);margin-bottom:2px;}
.cp-input-sm{border:1px solid var(--border);border-radius:6px;padding:5px 9px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);width:100%;}
.cp-input-sm:focus{outline:none;border-color:#1d4ed8;}
.cp-save{width:100%;background:#0f172a;border:none;color:#fff;border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:-0.1px;}
.dark .cp-save{background:#f1f5f9;color:#0f172a;}
.cp-legend{display:flex;gap:12px;font-size:10px;color:var(--text3);margin-bottom:8px;flex-wrap:wrap;}
.cp-legend-item{display:flex;align-items:center;gap:4px;}

/* source footer */
.src-footer{margin-top:24px;padding-top:14px;border-top:1px solid var(--border2);}
.src-footer-label{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:8px;}
.src-footer-links{display:flex;flex-wrap:wrap;gap:4px 2px;align-items:center;}
.src-footer-link{font-size:10px;color:var(--text3);text-decoration:none;padding:2px 7px;border-radius:4px;transition:color 0.1s,background 0.1s;font-weight:500;white-space:nowrap;}
.src-footer-link:hover{color:var(--text);background:var(--border2);}
.src-footer-sep{font-size:9px;color:var(--border);user-select:none;}
`;

// ─── SOURCE URL MAP ───────────────────────────────────────────────────────────
const SOURCE_URLS = {
  'BBC News':'https://www.bbc.com/news','Reuters Top News':'https://www.reuters.com','CNBC Top News':'https://www.cnbc.com',
  'Fox News':'https://www.foxnews.com','NY Post':'https://nypost.com','The Hill':'https://thehill.com',
  'TechCrunch':'https://techcrunch.com','Washington Times':'https://www.washingtontimes.com','The Guardian US':'https://www.theguardian.com/us',
  'Axios':'https://www.axios.com','Breitbart':'https://www.breitbart.com','KHOU Houston':'https://www.khou.com',
  'Click2Houston':'https://www.click2houston.com','Chron.com':'https://www.chron.com',
  'ESPN NFL':'https://www.espn.com/nfl','ESPN MLB':'https://www.espn.com/mlb','ESPN CFB':'https://www.espn.com/college-football',
  'ESPN CBB':'https://www.espn.com/mens-college-basketball','CBS Sports NFL':'https://www.cbssports.com/nfl',
  'CBS Sports MLB':'https://www.cbssports.com/mlb','CBS Sports CFB':'https://www.cbssports.com/college-football',
  'CBS Sports CBB':'https://www.cbssports.com/college-basketball','Pro Football Talk':'https://profootballtalk.nbcsports.com',
  'Bleacher Report':'https://bleacherreport.com','247Sports':'https://247sports.com',
  'Kentucky Sports Radio':'https://kentuckysportsradio.com','On3 Recruiting':'https://www.on3.com','The Spun':'https://thespun.com',
  'Reuters Business':'https://www.reuters.com/business','CNBC Energy':'https://www.cnbc.com/energy',
  'Oilprice.com':'https://oilprice.com','Utility Dive':'https://www.utilitydive.com',
  'Data Center Dynamics':'https://www.datacenterdynamics.com','Power Magazine':'https://www.powermag.com',
  'Rigzone':'https://www.rigzone.com','MIT Tech Review':'https://www.technologyreview.com',
  'AI News':'https://artificialintelligence-news.com','Canary Media':'https://www.canarymedia.com',
  'The Guardian Business':'https://www.theguardian.com/business','CNBC Tech':'https://www.cnbc.com/technology',
  'MarketWatch':'https://www.marketwatch.com','Yahoo Finance':'https://finance.yahoo.com',
  'Kiplinger':'https://www.kiplinger.com','Motley Fool':'https://www.fool.com',
  'Investopedia':'https://www.investopedia.com','BiggerPockets':'https://www.biggerpockets.com',
  'CNBC Finance':'https://www.cnbc.com','The Babylon Bee':'https://babylonbee.com','The Onion':'https://www.theonion.com',
};

// ─── FEED CARD COMPONENT ──────────────────────────────────────────────────────
function FeedCard({ a, cat, isSaved, onSave, onRead, relatedSources }) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary]         = useState('');
  const [loadingSum, setLoadingSum]   = useState(false);
  const [imgErr, setImgErr]           = useState(false);
  const cc = CATS[cat] || CATS.general;
  const topKw = a.matchedKw?.[0] || null;

  const handleAI = async e => {
    e.stopPropagation();
    if (showSummary) { setShowSummary(false); return; }
    if (summary) { setShowSummary(true); return; }
    setShowSummary(true); setLoadingSum(true);
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,
          messages:[{role:'user',content:`Summarize this news article in 2-3 concise sentences. Be direct and factual. Title: ${a.title}. Content: ${a.desc||''}`}]})});
      const data = await resp.json();
      setSummary(data.content?.[0]?.text || 'Summary unavailable.');
    } catch { setSummary('Summary unavailable — check connection.'); }
    setLoadingSum(false);
  };

  return (
    <div className={`fc ${cat}`} onClick={() => onRead(a)}>
      <div className="fc-meta">
        <span className="fc-source" style={{color:cc.color}}>{a.source}</span>
        {a.isAlert && <span className="fc-alert-badge">● BREAKING</span>}
        {topKw && <span className="fc-topic" style={{background:cc.bg,color:cc.color}}>{topKw}</span>}
        <span className="fc-date">{fmtDate(a.pubDate)}</span>
      </div>
      <div className="fc-body">
        {a.img && !imgErr
          ? <img className="fc-thumb" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>
          : <div className="fc-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="fc-text">
          <div className="fc-title">{a.title}</div>
          {a.desc && <div className="fc-desc">{a.desc}</div>}
        </div>
      </div>
      {showSummary && (
        <div className="fc-summary" onClick={e=>e.stopPropagation()}>
          <div className="fc-summary-lbl">✦ AI Summary</div>
          {loadingSum ? <div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Generating summary...</div>
                       : <div className="fc-summary-text">{summary}</div>}
        </div>
      )}
      {relatedSources && relatedSources.length > 0 && (
        <div className="fc-more" onClick={e=>e.stopPropagation()}>
          <span className="fc-more-lbl">Also covering:</span>
          {relatedSources.slice(0,4).map((s,i) => (
            <button key={i} className="fc-more-src" onClick={()=>s.link&&window.open(s.link,'_blank')}>{s.source}</button>
          ))}
        </div>
      )}
      <div className="fc-actions" onClick={e=>e.stopPropagation()}>
        <button className={`fc-act ${isSaved?'saved':''}`} onClick={e=>{e.stopPropagation();onSave(a);}}>
          {isSaved?'★ Saved':'☆ Save'}
        </button>
        <button className={`fc-act ${showSummary?'ai-on':''}`} onClick={handleAI}>
          ✦ {loadingSum?'Thinking...':showSummary?'Hide AI':'AI Summary'}
        </button>
        <a className="fc-read-link" href={a.link} target="_blank" rel="noreferrer" onClick={e=>{e.stopPropagation();onRead(a);}}>Read → {a.source}</a>
      </div>
    </div>
  );
}

// ─── SIDEBAR COMPONENT ────────────────────────────────────────────────────────
function Sidebar({ cat, arts, kw, health, activeKw, setActiveKw, activeSource, setActiveSource, onRead }) {
  const cc = CATS[cat] || CATS.general;
  const catKws = kw[cat] || [];
  const catArts = arts[cat] || [];
  const srcCounts = {};
  catArts.forEach(a => { srcCounts[a.source] = (srcCounts[a.source]||0)+1; });
  const sources = [...new Set(catArts.map(a=>a.source))];
  const trending = catArts.slice(0,10);
  const isSports = cat==='sports';

  return (
    <div className="sidebar">
      {activeKw && (
        <div className="sb-filter-active">
          <span className="sb-filter-label">🔍 {activeKw}</span>
          <button className="sb-filter-x" onClick={()=>setActiveKw(null)}>✕ Clear</button>
        </div>
      )}
      {activeSource && (
        <div className="sb-filter-active" style={{background:cc.bg,borderColor:cc.color+'44'}}>
          <span className="sb-filter-label" style={{color:cc.color}}>📰 {activeSource}</span>
          <button className="sb-filter-x" style={{color:cc.color}} onClick={()=>setActiveSource(null)}>✕ Clear</button>
        </div>
      )}
      {isSports && trending.length > 0 && (
        <div className="sb-block">
          <div className="sb-head"><span className="sb-title">🏆 Trending in Sports</span></div>
          <div className="trend-list">
            {trending.slice(0,8).map((a,i) => (
              <div key={i} className="trend-row" onClick={()=>onRead(a)}>
                <div className="trend-num">{i+1}</div>
                <div className="trend-body">
                  <div className="trend-title">{a.title}</div>
                  <div className="trend-src">{a.source} · {fmtDate(a.pubDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {catKws.length > 0 && (
        <div className="sb-block">
          <div className="sb-head">
            <span className="sb-title">{cc.emoji} Topics</span>
            {activeKw && <button className="sb-clear" onClick={()=>setActiveKw(null)}>Clear</button>}
          </div>
          <div className="kw-wrap">
            <div className="kw-chips">
              {catKws.map((k,i) => (
                <span key={i} className={`kw-chip ${activeKw===k?'active':''}`} style={{background:cc.bg,color:cc.color}} onClick={()=>setActiveKw(activeKw===k?null:k)}>{k}</span>
              ))}
            </div>
          </div>
        </div>
      )}
      {sources.length > 0 && (
        <div className="sb-block">
          <div className="sb-head">
            <span className="sb-title">Sources</span>
            {activeSource && <button className="sb-clear" onClick={()=>setActiveSource(null)}>Clear</button>}
          </div>
          <div className="src-list">
            {sources.map((name,i) => {
              const h=health[name];
              const cls=h==='green'?'h-green':h==='yellow'?'h-yellow':h==='red'?'h-red':'h-gray';
              return (
                <div key={i} className={`src-row ${activeSource===name?'active-src':''}`} onClick={()=>setActiveSource(activeSource===name?null:name)}>
                  <span className={`health-dot ${cls}`} title={h||'Pending'}/>
                  <span className="src-name" style={{fontWeight:activeSource===name?700:500,color:activeSource===name?cc.color:''}}>{name}</span>
                  <span className="src-count">{srcCounts[name]||0}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!isSports && trending.length > 0 && (
        <div className="sb-block">
          <div className="sb-head"><span className="sb-title">Trending</span></div>
          <div className="trend-list">
            {trending.slice(0,8).map((a,i) => (
              <div key={i} className="trend-row" onClick={()=>onRead(a)}>
                <div className="trend-num">{i+1}</div>
                <div className="trend-body">
                  <div className="trend-title">{a.title}</div>
                  <div className="trend-src">{a.source} · {fmtDate(a.pubDate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMIZE PANEL ──────────────────────────────────────────────────────────
const CAT_LABELS = { general:'🌐 General',sports:'🏆 Sports',business:'⚡ Business',finance:'📈 Finance',bloom:'🔋 Bloom',comedy:'😂 Comedy' };

function CustomizePanel({ feeds, kw, alerts, health, arts, onClose, onSave }) {
  const [lf,setLf]=useState(JSON.parse(JSON.stringify(feeds)));
  const [lk,setLk]=useState(JSON.parse(JSON.stringify(kw)));
  const [la,setLa]=useState([...alerts]);
  const [kwTab,setKwTab]=useState('general');
  const [srcTab,setSrcTab]=useState('general');
  const [newKw,setNewKw]=useState('');
  const [newAlert,setNewAlert]=useState('');
  const [newName,setNewName]=useState('');
  const [newUrl,setNewUrl]=useState('');
  const [testState,setTestState]=useState({});

  const testFeed = async (url,key) => {
    setTestState(s=>({...s,[key]:'loading'}));
    const items = await fetchRSS(url);
    setTestState(s=>({...s,[key]:items.length>0?`ok:${items.length} articles`:'fail'}));
  };

  const addSource = () => {
    if(!newName.trim()||!newUrl.trim()) return;
    setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcTab])n[srcTab]=[];n[srcTab].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});
    setNewName('');setNewUrl('');
  };

  const countBySource=(cat,name)=>(arts[cat]||[]).filter(a=>a.source===name).length;

  const TestResult=({tkey})=>{
    const ts=testState[tkey];if(!ts)return null;
    return <div className={`cp-test-result ${ts==='loading'?'cp-test-load':ts.startsWith('ok')?'cp-test-ok':'cp-test-fail'}`}>{ts==='loading'?'Testing...':ts.startsWith('ok')?`✓ ${ts.replace('ok:','')}`:'✗ Failed — feed may be blocked'}</div>;
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={e=>e.stopPropagation()}>
        <div className="cp-head"><span className="cp-title">Customize</span><button className="cp-x" onClick={onClose}>✕</button></div>
        <div className="cp-body">
          <div className="cp-sec">
            <div className="cp-lbl">Keywords by Category</div>
            <div className="cp-desc">Keywords boost matching articles to the top and appear as clickable topic tags in the sidebar.</div>
            <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${kwTab===c?'active':''}`} onClick={()=>setKwTab(c)}>{CAT_LABELS[c]}</button>)}</div>
            <div className="cp-chips">
              {(lk[kwTab]||[]).map((k,i)=><span key={i} className="cp-chip cp-chip-kw">{k}<button className="cp-chip-x" onClick={()=>setLk(p=>{const n={...p};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}>✕</button></span>)}
              {(lk[kwTab]||[]).length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No keywords yet</span>}
            </div>
            <div className="cp-add">
              <input className="cp-input" placeholder={`Add ${kwTab} keyword...`} value={newKw} onChange={e=>setNewKw(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}}/>
              <button className="cp-btn" onClick={()=>{ if(newKw.trim()){ setLk(p=>{ const n={...p}; n[kwTab]=[...(n[kwTab]||[]),newKw.trim()]; return n; }); setNewKw(''); } }}>Add</button>
            </div>
          </div>
          <div className="cp-sec">
            <div className="cp-lbl">Breaking News Alerts</div>
            <div className="cp-desc">Red scrolling ticker appears when these words appear in any headline.</div>
            <div className="cp-chips">
              {la.map((a,i)=><span key={i} className="cp-chip cp-chip-alert">{a}<button className="cp-chip-x" onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>✕</button></span>)}
            </div>
            <div className="cp-add">
              <input className="cp-input" placeholder="Add alert word..." value={newAlert} onChange={e=>setNewAlert(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/>
              <button className="cp-btn cp-btn-red" onClick={()=>{if(newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}>Add</button>
            </div>
          </div>
          <div className="cp-sec">
            <div className="cp-lbl">Sources</div>
            <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${srcTab===c?'active':''}`} onClick={()=>setSrcTab(c)}>{CAT_LABELS[c]}</button>)}</div>
            <div className="cp-legend">
              <span className="cp-legend-item"><span className="cp-health cp-h-green"/>Loaded</span>
              <span className="cp-legend-item"><span className="cp-health cp-h-yellow"/>Slow</span>
              <span className="cp-legend-item"><span className="cp-health cp-h-red"/>Failed</span>
              <span className="cp-legend-item"><span className="cp-health cp-h-gray"/>Pending</span>
            </div>
            {(lf[srcTab]||[]).map((f,i)=>{
              const h=health[f.name];
              const hcls=h==='green'?'cp-h-green':h==='yellow'?'cp-h-yellow':h==='red'?'cp-h-red':'cp-h-gray';
              const cnt=countBySource(srcTab,f.name);const tk=`${srcTab}_${i}`;
              return (
                <div key={i}>
                  <div className="cp-src-row">
                    <span className={`cp-health ${hcls}`} title={h||'Pending'}/>
                    <span className="cp-src-name">{f.name}</span>
                    {cnt>0&&<span className="cp-src-count">{cnt}</span>}
                    <button className="cp-test-btn" onClick={()=>testFeed(f.url,tk)}>Test</button>
                    <button className={`cp-tog ${f.on?'on':'off'}`} onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[srcTab][i].on=!n[srcTab][i].on;return n;})}/>
                    <button className="cp-del" onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[srcTab].splice(i,1);return n;})}>✕</button>
                  </div>
                  <TestResult tkey={tk}/>
                </div>
              );
            })}
            <div className="cp-add-src">
              <div className="cp-add-src-title">+ Add custom source to {CAT_LABELS[srcTab]}</div>
              <input className="cp-input-sm" placeholder="Source name" value={newName} onChange={e=>setNewName(e.target.value)}/>
              <input className="cp-input-sm" placeholder="RSS URL (https://...)" value={newUrl} onChange={e=>setNewUrl(e.target.value)}/>
              <div style={{display:'flex',gap:'6px'}}>
                <button className="cp-test-btn" style={{flex:1,padding:'5px'}} onClick={()=>newUrl.trim()&&testFeed(newUrl.trim(),`new_${srcTab}`)}>Test URL</button>
                <button className="cp-btn" style={{flex:1}} onClick={addSource}>Add Source</button>
              </div>
              <TestResult tkey={`new_${srcTab}`}/>
            </div>
          </div>
          <button className="cp-save" onClick={()=>onSave({feeds:lf,kw:lk,alerts:la})}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}

// ─── SOURCE FOOTER ────────────────────────────────────────────────────────────
function SourceFooter({ cat, feeds, arts }) {
  let sources=[];
  if(!cat){
    const seen=new Set();
    Object.values(feeds).flat().forEach(f=>{if(f.on&&!seen.has(f.name)&&SOURCE_URLS[f.name]){seen.add(f.name);sources.push(f);}});
    const allArts=Object.values(arts).flat();const counts={};
    allArts.forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});
    sources.sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0));sources=sources.slice(0,20);
  } else {
    const catArts=arts[cat]||[];const counts={};
    catArts.forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});
    sources=(feeds[cat]||[]).filter(f=>f.on&&SOURCE_URLS[f.name]).sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0));
  }
  if(!sources.length) return null;
  return (
    <div className="src-footer">
      <div className="src-footer-label">Sources</div>
      <div className="src-footer-links">
        {sources.map((f,i)=>(
          <span key={f.name} style={{display:'inline-flex',alignItems:'center'}}>
            <a className="src-footer-link" href={SOURCE_URLS[f.name]} target="_blank" rel="noreferrer">{f.name}</a>
            {i<sources.length-1&&<span className="src-footer-sep">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ tab, setTab, search, setSearch, dark, setDark, onCustomize, onRefresh, breakingItems, onTickerClick }) {
  const [wx, setWx]               = useState(null);
  const [quotes, setQuotes]       = useState({});
  const [showBreaking, setShowBreaking] = useState(true);

  useEffect(()=>{
    fetchWeather().then(setWx);
    TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(prev=>({...prev,[t.sym]:q}))));
    const iv=setInterval(()=>{TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(prev=>({...prev,[t.sym]:q}))));},300000);
    return()=>clearInterval(iv);
  },[]);

  const hasBreaking = breakingItems && breakingItems.length > 0;
  const tickerItems = hasBreaking ? [...breakingItems,...breakingItems] : [];
  const ALL_TABS = ['today','general','sports','business','finance','bloom','comedy','podcasts','saved'];
  const TAB_LABELS = { today:'Today',bloom:'Bloom Energy',podcasts:'Podcasts',saved:'Saved',comedy:'Comedy' };

  return (
    <div className="topbar-wrap">
      <div className="utility-strip">
        <div className="utility-strip-inner">
          {wx&&<div className="wx-pill"><span>{wx.emoji}</span><span className="wx-temp">{wx.temp}°F</span><span className="wx-desc">{wx.desc}</span><span className="wx-desc">· {wx.wind} mph</span></div>}
          {wx&&<div className="strip-div"/>}
          <div className="ticker-row">
            {TICKERS.map(t=>{
              const q=quotes[t.sym];const up=q?q.chg>=0:null;
              return (
                <div key={t.sym} className="ticker-item" onClick={()=>onTickerClick&&onTickerClick(t)}>
                  <span className="ticker-sym" style={{color:t.color}}>{t.sym}</span>
                  {q?(<><span className="ticker-price">${q.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span className={`ticker-chg ${up?'ticker-up':'ticker-down'}`}>{up?'▲':'▼'} {Math.abs(q.pct).toFixed(2)}%</span></>):<span className="ticker-price">—</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {hasBreaking && showBreaking && (
        <div className="breaking-strip">
          <div className="breaking-label">BREAKING</div>
          <div className="breaking-ticker">
            <div className="breaking-ticker-inner">
              {tickerItems.map((item,i)=>(
                <span key={i} className="breaking-item" onClick={()=>item.link&&window.open(item.link,'_blank')}>
                  {item.title} · <span style={{opacity:0.7,fontSize:'10px'}}>{item.source}</span>
                  <span className="breaking-sep">◆</span>
                </span>
              ))}
            </div>
          </div>
          <button className="breaking-close" onClick={()=>setShowBreaking(false)}>✕</button>
        </div>
      )}
      <div className="nav-bar">
        <div className="nav-bar-inner">
          <div className="logo">My<span>News</span>Hub</div>
          <div className="nav-tabs">
            {ALL_TABS.map(t=>(
              <button key={t} className={`nav-tab ${tab===t?'active':''} ${t==='bloom'?'bloom-tab':''} ${t==='podcasts'?'pod-tab':''} ${t==='comedy'?'comedy-tab':''}`} onClick={()=>{setTab(t);setSearch('');}}>
                {TAB_LABELS[t]||(t.charAt(0).toUpperCase()+t.slice(1))}
              </button>
            ))}
          </div>
          <div className="nav-right">
            <input className="search-input" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value.toLowerCase())}/>
            <button className="nav-btn" onClick={onRefresh} title="Refresh">↺</button>
            <button className="nav-btn" onClick={()=>setDark(d=>!d)} title="Theme">{dark?'☀️':'🌙'}</button>
            <button className="nav-btn-blue" onClick={onCustomize}>Customize</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]           = useState('today');
  const [search,setSearch]     = useState('');
  const [dark,setDark]         = useState(()=>ld('dark',false));
  const [saved,setSaved]       = useState(()=>ld('saved',[]));
  const [clicks,setClicks]     = useState(()=>ld('clicks',{}));
  const [kw,setKw]             = useState(()=>ld('kw',DEFAULT_KW));
  const [alerts,setAlerts]     = useState(()=>ld('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','fuel cell','hurricane','earthquake','breaking']));
  const [feeds,setFeeds]       = useState(()=>ld('feeds',DEFAULT_FEEDS));
  const [arts,setArts]         = useState({general:[],sports:[],business:[],finance:[],bloom:[],comedy:[]});
  const [loading,setLoading]   = useState({general:false,sports:false,business:false,finance:false,bloom:false,comedy:false});
  const [health,setHealth]     = useState({});
  const [podEps,setPodEps]     = useState({});
  const [podLoading,setPodLoading] = useState({});
  const [activePod,setActivePod]   = useState(null);
  const [showPanel,setShowPanel]   = useState(false);
  const [activeKw,setActiveKw]     = useState(null);
  const [activeSrc,setActiveSrc]   = useState(null);

  useEffect(()=>{ sv('dark',dark); document.body.className=dark?'dark':''; },[dark]);
  useEffect(()=>{ sv('saved',saved); },[saved]);
  useEffect(()=>{ sv('clicks',clicks); },[clicks]);

  const breakingItems = Object.values(arts).flat().filter(a=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase())));

  const kwMatch=(a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase()));

  const dedupe=arr=>{
    const seen=new Set();
    return arr.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});
  };

  const sorted=useCallback((cat)=>{
    let arr=arts[cat]||[];
    if(search) arr=arr.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search));
    if(activeKw) arr=arr.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));
    if(activeSrc) arr=arr.filter(a=>a.source===activeSrc);
    arr=dedupe(arr);
    arr.sort((a,b)=>{const ka=kwMatch(a,cat).length,kb=kwMatch(b,cat).length;if(kb!==ka)return kb-ka;return new Date(b.pubDate)-new Date(a.pubDate);});
    return arr.map(a=>({...a,matchedKw:kwMatch(a,cat),isAlert:alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase()))}));
  },[arts,search,activeKw,activeSrc,kw,alerts]);

  const loadCat=useCallback(async(cat)=>{
    if(loading[cat]) return;
    setLoading(l=>({...l,[cat]:true}));
    const results=[],hUpdates={};
    await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
      const t0=Date.now();const items=await fetchRSS(f.url);const ms=Date.now()-t0;
      hUpdates[f.name]=items.length>0?(ms<4000?'green':'yellow'):'red';
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    setHealth(h=>({...h,...hUpdates}));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLoading(l=>({...l,[cat]:false}));
  },[feeds,loading]);

  const loadPod=useCallback(async(pod)=>{
    if(podLoading[pod.name]) return;
    setPodLoading(l=>({...l,[pod.name]:true}));
    const eps=await fetchRSS(pod.url);
    setPodEps(p=>({...p,[pod.name]:eps.map(e=>({...e,show:pod.name,host:pod.host,emoji:pod.emoji}))}));
    setPodLoading(l=>({...l,[pod.name]:false}));
  },[podLoading]);

  const refreshAll=()=>{
    setArts({general:[],sports:[],business:[],finance:[],bloom:[],comedy:[]});
    setLoading({general:false,sports:false,business:false,finance:false,bloom:false,comedy:false});
    setHealth({});setPodEps({});setPodLoading({});
    setTimeout(()=>{Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));PODCAST_FEEDS.forEach(p=>loadPod(p));},80);
  };

  useEffect(()=>{Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));PODCAST_FEEDS.forEach(p=>loadPod(p));},[]);

  const onRead=a=>{setClicks(c=>({...c,[a.source]:(c[a.source]||0)+1}));window.open(a.link,'_blank');};
  const onSave=a=>setSaved(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,a]);
  const isSavedFn=a=>saved.some(s=>s.link===a.link);

  const handleTickerClick=t=>{
    setSearch(t.label.toLowerCase());
    const catMap={'Bloom Energy':'bloom','Crude Oil':'business','Bitcoin':'finance'};
    if(catMap[t.label]) setTab(catMap[t.label]);
  };

  const handleCustomizeSave=({feeds:nf,kw:nk,alerts:na})=>{
    setFeeds(nf);sv('feeds',nf);setKw(nk);sv('kw',nk);setAlerts(na);sv('alerts',na);
    setShowPanel(false);refreshAll();
  };

  const handleTabChange=t=>{
    setTab(t);setSearch('');setActiveKw(null);setActiveSrc(null);
    if(!['today','saved','podcasts'].includes(t)&&!(arts[t]||[]).length) loadCat(t);
  };

  const getRelated=(a,cat)=>{
    const matched=kwMatch(a,cat);if(!matched.length)return[];
    return(arts[cat]||[]).filter(x=>x.link!==a.link&&matched.some(k=>(x.title+(x.desc||'')).toLowerCase().includes(k.toLowerCase()))).slice(0,4);
  };

  const NEWS_CATS=['general','sports','business','finance','bloom','comedy'];

  // ─── FEED PAGE ────────────────────────────────────────────────────────────
  const FeedPage=({cat})=>{
    const cc=CATS[cat];const items=sorted(cat);const isLoading=loading[cat];
    return (
      <div className="page">
        <div className="page-grid">
          <div className="feed-col">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
              <span className="page-header">{cc.emoji} {cc.label} {items.length>0?`— ${items.length} articles`:''}</span>
            </div>
            {(activeKw||activeSrc)&&(
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
                {activeKw&&<span style={{background:cc.bg,color:cc.color,borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'5px'}}>🔍 {activeKw} <button onClick={()=>setActiveKw(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
                {activeSrc&&<span style={{background:'var(--bg)',color:'var(--text2)',borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',gap:'5px'}}>📰 {activeSrc} <button onClick={()=>setActiveSrc(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
              </div>
            )}
            {isLoading&&!items.length
              ?<div className="empty-state"><div className="empty-icon">{cc.emoji}</div><div className="empty-msg">Loading {cc.label}...</div></div>
              :items.length===0
                ?<div className="empty-state"><div className="empty-icon">📭</div><div className="empty-msg">{activeKw||activeSrc?'No articles match this filter':'No articles loaded yet'}</div><button className="refresh-btn" onClick={refreshAll}>Refresh</button></div>
                :items.slice(0,20).map((a,i)=><FeedCard key={i} a={a} cat={cat} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,cat)}/>)
            }
            <SourceFooter cat={cat} feeds={feeds} arts={arts}/>
          </div>
          <Sidebar cat={cat} arts={arts} kw={kw} health={health} activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}} activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}} onRead={onRead}/>
        </div>
      </div>
    );
  };

  // ─── TODAY PAGE ───────────────────────────────────────────────────────────
  const TodayPage=()=>(
    <div className="page">
      <div className="today-grid">
        {['general','sports','business','finance'].map(cat=>{
          const cc=CATS[cat],items=sorted(cat).slice(0,4),total=(arts[cat]||[]).length;
          return (
            <div key={cat} className="today-block">
              <div className="today-block-head">
                <div className="today-block-label"><span style={{color:cc.color}}>{cc.emoji} {cc.label}</span><span className="today-block-count">{total}</span></div>
                <button className="today-see-all" style={{color:cc.color}} onClick={()=>handleTabChange(cat)}>All →</button>
              </div>
              {loading[cat]?<div style={{padding:'20px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>Loading...</div>
              :items.length===0?<div style={{padding:'20px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>No articles yet</div>
              :items.map((a,i)=>(
                <div key={i} className="today-item" onClick={()=>onRead(a)}>
                  {a.img?<img className="today-thumb" src={a.img} loading="lazy" onError={e=>e.target.style.display='none'} alt=""/>
                  :<div className="today-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
                  <div className="today-item-body">
                    <div className="today-item-title">{a.title}</div>
                    <div className="today-item-src">{a.source} · {fmtDate(a.pubDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        <div className="today-block today-bloom-row" style={{borderColor:'#bae6fd',borderWidth:'1.5px'}}>
          <div className="today-block-head">
            <div className="today-block-label"><span style={{color:'#0369a1'}}>🔋 Bloom Energy & Power Intelligence</span><span className="today-block-count">{(arts.bloom||[]).length}</span></div>
            <button className="today-see-all" style={{color:'#0369a1'}} onClick={()=>handleTabChange('bloom')}>All →</button>
          </div>
          {loading.bloom?<div style={{padding:'16px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>Loading...</div>
          :sorted('bloom').length===0?<div style={{padding:'16px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>No articles yet</div>
          :<div className="bloom-strip">
            {sorted('bloom').slice(0,4).map((a,i)=>(
              <div key={i} className="bloom-strip-item" onClick={()=>onRead(a)}>
                <div className="bloom-strip-title">{a.title}</div>
                <div className="bloom-strip-src">{a.source}</div>
                <div className="bloom-strip-date">{fmtDate(a.pubDate)}</div>
              </div>
            ))}
          </div>}
        </div>
      </div>
      <SourceFooter feeds={feeds} arts={arts}/>
    </div>
  );

  // ─── PODCASTS PAGE ────────────────────────────────────────────────────────
  const PodcastsPage=()=>{
    const allEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,3).map(e=>({...e,show:p.name,host:p.host,emoji:p.emoji}))).sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({...e,show:activePod.name,host:activePod.host,emoji:activePod.emoji})):allEps;

    const PodCard=({ep,idx})=>{
      const [showSum,setShowSum]=useState(false);const [podSum,setPodSum]=useState('');const [loadSum,setLoadSum]=useState(false);
      const sv2=isSavedFn({...ep,link:ep.link||ep.show+idx});
      const handlePodAI=async()=>{
        if(showSum){setShowSum(false);return;}if(podSum){setShowSum(true);return;}
        setShowSum(true);setLoadSum(true);
        try{const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Summarize this podcast episode in 2-3 sentences. Title: ${ep.title}. Description: ${ep.desc||''}`}]})});const data=await resp.json();setPodSum(data.content?.[0]?.text||'Summary unavailable.');}
        catch{setPodSum('Summary unavailable.');}
        setLoadSum(false);
      };
      return (
        <div className="pod-card">
          <div className="pod-card-top">
            <div className="pod-num">{idx+1}</div>
            <div className="pod-body">
              <div className="pod-show">{ep.emoji} {ep.show}</div>
              <div className="pod-title" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>{ep.title}</div>
              <div className="pod-meta"><span>{fmtDate(ep.pubDate)}</span>{ep.duration&&<span>{fmtDuration(ep.duration)}</span>}</div>
              {ep.desc&&<div className="pod-desc">{ep.desc}</div>}
            </div>
          </div>
          {showSum&&<div className="pod-summary"><div className="pod-summary-lbl">✦ AI Summary</div>{loadSum?'Generating...':podSum}</div>}
          <div className="pod-actions">
            <button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen</button>
            <button className={`pod-btn ${showSum?'ai-on':''}`} onClick={handlePodAI}>{loadSum?'Thinking...':showSum?'Hide AI':'✦ AI Summary'}</button>
            <button className={`pod-btn ${sv2?'saved':''}`} onClick={()=>onSave({...ep,link:ep.link||ep.show+idx,source:ep.show,cat:'podcasts'})}>{sv2?'★ Saved':'☆ Save'}</button>
          </div>
        </div>
      );
    };

    return (
      <div className="page">
        <div className="pod-page">
          <div className="pod-col">
            <div className="pod-header">
              <div className="pod-header-emoji">{activePod?activePod.emoji:'🎙️'}</div>
              <div>
                <div className="pod-header-name">{activePod?activePod.name:'All Podcasts'}</div>
                <div className="pod-header-sub">{activePod?`Hosted by ${activePod.host}`:`${PODCAST_FEEDS.length} shows · AI summaries available`}</div>
              </div>
            </div>
            {displayEps.length===0?<div className="empty-state"><div className="empty-msg">Loading episodes...</div></div>
            :displayEps.slice(0,20).map((ep,i)=><PodCard key={i} ep={ep} idx={i}/>)}
          </div>
          <div>
            <div className="pod-shows">
              <div style={{fontSize:'10px',fontWeight:'700',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid var(--border2)'}}>Shows</div>
              <div className="pod-show-item" onClick={()=>setActivePod(null)}>
                <div className="pod-show-emoji">🎙️</div>
                <div><div className="pod-show-name" style={{color:!activePod?'#e11d48':''}}>All Shows</div><div className="pod-show-ep">Latest from all {PODCAST_FEEDS.length} podcasts</div></div>
                {!activePod&&<div className="pod-show-dot"/>}
              </div>
              {PODCAST_FEEDS.map((p,i)=>{
                const eps=podEps[p.name]||[];const latest=eps[0];const isA=activePod?.name===p.name;
                return (
                  <div key={i} className="pod-show-item" onClick={()=>setActivePod(isA?null:p)}>
                    <div className="pod-show-emoji">{p.emoji}</div>
                    <div style={{flex:1,minWidth:0}}><div className="pod-show-name" style={{color:isA?'#e11d48':''}}>{p.name}</div><div className="pod-show-ep">{podLoading[p.name]?'Loading...':(latest?latest.title.slice(0,38)+'...':'No episodes yet')}</div></div>
                    {isA&&<div className="pod-show-dot"/>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SavedPage=()=>(
    <div className="page">
      {saved.length===0
        ?<div className="saved-empty"><div style={{fontSize:'32px',marginBottom:'12px'}}>☆</div><div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)'}}>No saved items yet</div><div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>Tap Save on any article or episode</div></div>
        :<div className="page-grid"><div className="feed-col"><span className="page-header">Saved — {saved.length} items</span>{saved.map((a,i)=><FeedCard key={i} a={a} cat={a.cat||'general'} isSaved={true} onSave={onSave} onRead={onRead}/>)}</div></div>
      }
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className={`hub${dark?' dark':''}`}>
        <TopBar tab={tab} setTab={handleTabChange} search={search} setSearch={setSearch} dark={dark} setDark={setDark} onCustomize={()=>setShowPanel(true)} onRefresh={refreshAll} breakingItems={breakingItems} onTickerClick={handleTickerClick}/>
        {tab==='today'&&<TodayPage/>}
        {NEWS_CATS.includes(tab)&&<FeedPage cat={tab}/>}
        {tab==='podcasts'&&<PodcastsPage/>}
        {tab==='saved'&&<SavedPage/>}
        {showPanel&&<CustomizePanel feeds={feeds} kw={kw} alerts={alerts} health={health} arts={arts} onClose={()=>setShowPanel(false)} onSave={handleCustomizeSave}/>}
      </div>
    </>
  );
}
