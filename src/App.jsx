import { useState, useEffect, useCallback, useRef } from "react";

const CATS={
  general:{label:'General',color:'#1d4ed8',bg:'#eff6ff',emoji:'🌐'},
  sports:{label:'Sports',color:'#d97706',bg:'#fef3c7',emoji:'🏆'},
  business:{label:'Business',color:'#16a34a',bg:'#f0fdf4',emoji:'⚡'},
  finance:{label:'Finance',color:'#7c3aed',bg:'#f5f3ff',emoji:'📈'},
  bloom:{label:'Bloom Energy',color:'#0369a1',bg:'#e0f2fe',emoji:'🔋'},
  comedy:{label:'Comedy',color:'#db2777',bg:'#fdf2f8',emoji:'😂'},
};
const TICKERS=[
  {sym:'BE',label:'Bloom Energy',color:'#38bdf8'},
  {sym:'CL=F',label:'Crude Oil',color:'#4ade80'},
  {sym:'BTC',label:'Bitcoin',color:'#fbbf24'},
];
const PODCAST_FEEDS=[
  {name:'Joe Rogan Experience',host:'Joe Rogan',url:'https://feeds.megaphone.fm/GLT1412515089',emoji:'🟢'},
  {name:'Ben Shapiro Show',host:'Ben Shapiro',url:'https://feeds.megaphone.fm/BVDWV5370667266',emoji:'🔵'},
  {name:'Tucker Carlson Show',host:'Tucker Carlson',url:'https://feeds.megaphone.fm/RSV1597324942',emoji:'🦅'},
  {name:'Candace',host:'Candace Owens',url:'https://feeds.megaphone.fm/candace',emoji:'🎤'},
  {name:'Morning Wire',host:'Daily Wire',url:'https://feeds.megaphone.fm/BVDWV8747925072',emoji:'☀️'},
  {name:'All-In Podcast',host:'Chamath & Besties',url:'https://allinchamathjason.libsyn.com/rss',emoji:'💰'},
  {name:'Flagrant',host:'Andrew Schulz',url:'https://feeds.megaphone.fm/APPI6857213837',emoji:'🔥'},
];
const DEFAULT_KW={
  general:['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB','recruiting','transfer portal'],
  business:['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  comedy:['satire','parody','humor','comedy'],
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
    {name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',on:true},
    {name:'On3 Recruiting',url:'https://www.on3.com/feed/',on:true},
    {name:'The Spun',url:'https://thespun.com/.rss/full/',on:true},
    {name:'TwinSpires Blog',url:'https://www.twinspires.com/edge/feed/',on:true},
    {name:'Equibase News',url:'https://www.equibase.com/premium/eqbRSSFeed.cfm?type=General',on:true},
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
  ],
  comedy:[
    {name:'The Babylon Bee',url:'https://babylonbee.com/feed',on:true},
    {name:'The Onion',url:'https://www.theonion.com/rss',on:true},
  ],
};
const TEAM_URLS={
  'Texans':'https://www.espn.com/nfl/team/_/name/hou/houston-texans',
  'Astros':'https://www.espn.com/mlb/team/_/name/hou/houston-astros',
  'Braves':'https://www.espn.com/mlb/team/_/name/atl/atlanta-braves',
  'Kentucky':'https://www.espn.com/mens-college-basketball/team/_/id/96/kentucky-wildcats',
  'Clemson':'https://www.espn.com/college-football/team/_/id/228/clemson-tigers',
  'Cowboys':'https://www.espn.com/nfl/team/_/name/dal/dallas-cowboys',
  'Lakers':'https://www.espn.com/nba/team/_/name/lal/los-angeles-lakers',
  'Chiefs':'https://www.espn.com/nfl/team/_/name/kc/kansas-city-chiefs',
  'Yankees':'https://www.espn.com/mlb/team/_/name/nyy/new-york-yankees',
  'Alabama':'https://www.espn.com/college-football/team/_/id/333/alabama-crimson-tide',
};
const DEFAULT_FOLLOWED_TEAMS=['Texans','Astros','Braves','Kentucky','Clemson'];
const SOURCE_URLS={
  'BBC News':'https://www.bbc.com/news','Reuters Top News':'https://www.reuters.com','Reuters Business':'https://www.reuters.com/business',
  'CNBC Top News':'https://www.cnbc.com','CNBC Energy':'https://www.cnbc.com/energy','CNBC Tech':'https://www.cnbc.com/technology','CNBC Finance':'https://www.cnbc.com/finance',
  'Fox News':'https://www.foxnews.com','NY Post':'https://nypost.com','The Hill':'https://thehill.com','TechCrunch':'https://techcrunch.com',
  'Washington Times':'https://www.washingtontimes.com','The Guardian US':'https://www.theguardian.com/us','The Guardian Business':'https://www.theguardian.com/business',
  'Axios':'https://www.axios.com','Breitbart':'https://www.breitbart.com','KHOU Houston':'https://www.khou.com','Click2Houston':'https://www.click2houston.com','Chron.com':'https://www.chron.com',
  'ESPN NFL':'https://www.espn.com/nfl','ESPN MLB':'https://www.espn.com/mlb','ESPN CFB':'https://www.espn.com/college-football','ESPN CBB':'https://www.espn.com/mens-college-basketball',
  'CBS Sports NFL':'https://www.cbssports.com/nfl','CBS Sports MLB':'https://www.cbssports.com/mlb','CBS Sports CFB':'https://www.cbssports.com/college-football','CBS Sports CBB':'https://www.cbssports.com/college-basketball',
  'Pro Football Talk':'https://profootballtalk.nbcsports.com','Bleacher Report':'https://bleacherreport.com','247Sports':'https://247sports.com',
  'Kentucky Sports Radio':'https://kentuckysportsradio.com','On3 Recruiting':'https://www.on3.com','The Spun':'https://thespun.com',
  'TwinSpires Blog':'https://www.twinspires.com','Equibase News':'https://www.equibase.com',
  'Oilprice.com':'https://oilprice.com','Utility Dive':'https://www.utilitydive.com','Data Center Dynamics':'https://www.datacenterdynamics.com',
  'Power Magazine':'https://www.powermag.com','Rigzone':'https://www.rigzone.com','MIT Tech Review':'https://www.technologyreview.com',
  'AI News':'https://artificialintelligence-news.com','Canary Media':'https://www.canarymedia.com',
  'MarketWatch':'https://www.marketwatch.com','Yahoo Finance':'https://finance.yahoo.com','Kiplinger':'https://www.kiplinger.com',
  'Motley Fool':'https://www.fool.com','Investopedia':'https://www.investopedia.com','BiggerPockets':'https://www.biggerpockets.com',
  'The Babylon Bee':'https://babylonbee.com','The Onion':'https://www.theonion.com',
};

const SK='v12_';
function ld(k,d){try{const v=localStorage.getItem(SK+k);return v?JSON.parse(v):d;}catch{return d;}}
function sv(k,v){try{localStorage.setItem(SK+k,JSON.stringify(v));}catch{}}

function parseXML(txt){
  const p=new DOMParser(),x=p.parseFromString(txt,'text/xml');
  const items=Array.from(x.querySelectorAll('item')).slice(0,20);
  if(!items.length)return[];
  return items.map(i=>{
    const desc=(i.querySelector('description')?.textContent||i.querySelector('summary')?.textContent||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300);
    const imgEl=i.querySelector('enclosure[type^="image"]');
    const mediaImg=i.getElementsByTagNameNS('http://search.yahoo.com/mrss/','content')?.[0]?.getAttribute('url')||'';
    const img=imgEl?.getAttribute('url')||mediaImg||i.querySelector('image url')?.textContent||'';
    return{title:(i.querySelector('title')?.textContent||'').trim(),link:i.querySelector('link')?.textContent||'',desc,pubDate:i.querySelector('pubDate')?.textContent||'',img,duration:i.querySelector('duration')?.textContent||''};
  });
}
async function fetchRSS(url){
  try{const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=20`);const d=await r.json();if(d.items?.length>0)return d.items.map(i=>({title:(i.title||'').trim(),link:i.link,desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300),pubDate:i.pubDate,img:i.thumbnail||'',duration:i.itunes_duration||''}));}catch{}
  try{const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);const d=await r.json();if(d.contents){const items=parseXML(d.contents);if(items.length)return items;}}catch{}
  try{const r=await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);const txt=await r.text();const items=parseXML(txt);if(items.length)return items;}catch{}
  return[];
}
const WX_CODES={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',63:'Rain',65:'Heavy Rain',80:'Showers',95:'Thunderstorm'};
const WX_EMOJI={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',61:'🌧️',63:'🌧️',65:'⛈️',80:'🌦️',95:'⛈️'};
async function fetchWeather(){
  try{const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=29.7604&longitude=-95.3698&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FChicago');const d=await r.json();const c=d.current;return{temp:Math.round(c.temperature_2m),wind:Math.round(c.windspeed_10m),desc:WX_CODES[c.weathercode]||'',emoji:WX_EMOJI[c.weathercode]||'🌡️'};}catch{return null;}
}
async function fetchQuote(sym){
  try{const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;const r=await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);const d=await r.json();const data=JSON.parse(d.contents);const meta=data.chart.result[0].meta;const price=meta.regularMarketPrice,prev=meta.previousClose||meta.chartPreviousClose;return{price,chg:price-prev,pct:((price-prev)/prev)*100};}catch{return null;}
}
function fmtDate(d){
  if(!d)return'';
  try{const dt=new Date(d);if(isNaN(dt.getTime()))return'';const now=new Date(),diff=Math.floor((now-dt)/1000);const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];const h=dt.getHours()%12||12,m=String(dt.getMinutes()).padStart(2,'0'),ampm=dt.getHours()>=12?'PM':'AM';if(diff<60)return'Just now';if(diff<3600)return`${Math.floor(diff/60)}m ago`;if(diff<86400)return`${days[dt.getDay()]} ${h}:${m} ${ampm}`;return`${months[dt.getMonth()]} ${dt.getDate()} · ${h}:${m} ${ampm}`;}catch{return'';}
}
function fmtDur(s){if(!s)return'';const parts=s.split(':').map(Number);if(parts.length===3){const[h,m]=parts;return h>0?`${h}h ${m}m`:`${m}m`;}if(parts.length===2)return`${parts[0]}m`;const tot=parseInt(s);if(isNaN(tot))return s;const h=Math.floor(tot/3600),m=Math.floor((tot%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`;}

const CSS=`
*{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#f0f2f5;--surface:#fff;--border:#e2e8f0;--border2:#f1f5f9;--text:#0f172a;--text2:#475569;--text3:#94a3b8;--accent:#1d4ed8;--radius:12px;}
.dark{--bg:#0a0f1e;--surface:#111827;--border:#1e2d3d;--border2:#162032;--text:#f1f5f9;--text2:#94a3b8;--text3:#475569;}
body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;}
.hub{min-height:100vh;background:var(--bg);}
.ustrip{background:linear-gradient(90deg,#0a0f1e 0%,#0f172a 100%);padding:0 24px;height:38px;display:flex;align-items:center;border-bottom:1px solid #1e2d3d;}
.ustrip-in{max-width:1400px;margin:0 auto;width:100%;display:flex;align-items:center;gap:0;}
.wx-block{display:flex;align-items:center;gap:8px;padding-right:20px;border-right:1px solid #1e2d3d;margin-right:20px;flex-shrink:0;}
.wx-emoji{font-size:14px;}.wx-temp{font-size:13px;font-weight:700;color:#f1f5f9;letter-spacing:-.3px;}.wx-desc{font-size:11px;color:#64748b;margin-left:2px;}.wx-wind{font-size:10px;color:#475569;}
.ticker-row{display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none;flex:1;}
.ticker-row::-webkit-scrollbar{display:none;}
.ticker-pill{display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;cursor:pointer;transition:background .15s;flex-shrink:0;border:1px solid transparent;}
.ticker-pill:hover{background:#1e2d3d;border-color:#2d3f54;}
.ticker-sym{font-size:11px;font-weight:800;letter-spacing:.02em;}.ticker-price{font-size:11px;color:#94a3b8;font-weight:500;}.ticker-chg{font-size:10px;font-weight:700;display:flex;align-items:center;gap:2px;}
.t-up{color:#4ade80;}.t-dn{color:#f87171;}
.ticker-divider{width:1px;height:16px;background:#1e2d3d;margin:0 4px;flex-shrink:0;}
.ustrip-right{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0;}
.ustrip-time{font-size:11px;color:#475569;font-weight:500;}
.break-strip{background:#dc2626;height:30px;display:flex;align-items:center;overflow:hidden;}
.break-badge{background:#fff;color:#dc2626;font-size:9px;font-weight:900;letter-spacing:.1em;padding:2px 10px;border-radius:0 4px 4px 0;white-space:nowrap;flex-shrink:0;text-transform:uppercase;}
.break-ticker{flex:1;overflow:hidden;margin:0 12px;}
.break-inner{display:inline-flex;gap:48px;animation:bticker 40s linear infinite;white-space:nowrap;}
.break-inner:hover{animation-play-state:paused;}
@keyframes bticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.break-item{font-size:11px;color:#fff;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:10px;}
.break-item:hover{text-decoration:underline;}.break-dot{color:rgba(255,255,255,.4);font-size:8px;}
.break-close{background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:16px;padding:0 14px;line-height:1;flex-shrink:0;}
.navbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 24px;position:sticky;top:0;z-index:200;box-shadow:0 1px 3px rgba(0,0,0,.06);}
.navbar-in{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:12px;height:52px;}
.logo{font-size:18px;font-weight:900;color:var(--text);flex-shrink:0;letter-spacing:-1px;}.logo em{color:#1d4ed8;font-style:normal;}
.navtabs{display:flex;gap:2px;flex:1;overflow-x:auto;scrollbar-width:none;border-left:1px solid var(--border);margin-left:10px;padding-left:10px;}
.navtabs::-webkit-scrollbar{display:none;}
.navtab{background:transparent;border:none;color:var(--text3);padding:6px 13px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;font-family:inherit;border-radius:8px;transition:all .15s;}
.navtab.act{color:#1d4ed8;background:#eff6ff;}.navtab.bloom.act{color:#0369a1;background:#e0f2fe;}.navtab.pod.act{color:#e11d48;background:#fff1f2;}.navtab.comedy.act{color:#db2777;background:#fdf2f8;}
.navtab:hover:not(.act){color:var(--text2);background:var(--bg);}
.navr{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.srch-wrap{position:relative;}
.srch{background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:20px;padding:6px 14px 6px 32px;font-size:12px;width:140px;font-family:inherit;transition:width .2s;}
.srch:focus{outline:none;border-color:#1d4ed8;width:200px;}
.srch-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:12px;pointer-events:none;}
.nbtn{background:var(--bg);border:1px solid var(--border);color:var(--text2);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;}
.nbtn-blue{background:#1d4ed8;border:none;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;}
.page{max-width:1400px;margin:0 auto;padding:20px 24px;}
.page-grid{display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start;}
.feed-col{display:flex;flex-direction:column;gap:12px;}
@media(max-width:900px){.page-grid{grid-template-columns:1fr;}.sidebar{display:none;}}
@media(max-width:600px){.page{padding:12px 14px;}}
.hero-wrap{border-radius:var(--radius);overflow:hidden;background:var(--surface);border:1px solid var(--border);margin-bottom:4px;}
.hero-main{position:relative;cursor:pointer;display:block;}
.hero-img{width:100%;height:320px;object-fit:cover;display:block;}
.hero-img-ph{width:100%;height:320px;display:flex;align-items:center;justify-content:center;font-size:64px;}
.hero-gradient{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.3) 50%,transparent 100%);}
.hero-content{position:absolute;bottom:0;left:0;right:0;padding:20px 22px;}
.hero-cat-tag{display:inline-block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:20px;margin-bottom:8px;}
.hero-title{font-size:22px;font-weight:800;color:#fff;line-height:1.25;letter-spacing:-.4px;margin-bottom:8px;text-shadow:0 1px 4px rgba(0,0,0,.4);}
.hero-meta{font-size:11px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:8px;}
.hero-source{font-weight:700;color:rgba(255,255,255,.9);}
.hero-acts{position:absolute;top:12px;right:12px;display:flex;gap:6px;}
.hero-act-btn{background:rgba(0,0,0,.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:600;}
.hero-act-btn:hover{background:rgba(0,0,0,.7);}.hero-act-btn.saved{border-color:#fbbf24;color:#fbbf24;}
.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--border);}
.hg-item{padding:14px 16px;cursor:pointer;display:flex;gap:12px;align-items:flex-start;border-right:1px solid var(--border);border-bottom:1px solid var(--border);transition:background .12s;}
.hg-item:nth-child(2n){border-right:none;}.hg-item:nth-last-child(-n+2){border-bottom:none;}.hg-item:hover{background:var(--bg);}
.hg-thumb{width:64px;height:48px;border-radius:7px;object-fit:cover;flex-shrink:0;}.hg-thumb-ph{width:64px;height:48px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;}
.hg-body{flex:1;min-width:0;}.hg-src{font-size:10px;font-weight:700;margin-bottom:3px;}.hg-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}.hg-date{font-size:10px;color:var(--text3);margin-top:3px;}
@media(max-width:600px){.hero-img,.hero-img-ph{height:220px;}.hero-title{font-size:16px;}.hero-grid{grid-template-columns:1fr;}.hg-item{border-right:none;}}
.fc{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);padding:14px 16px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;gap:0;}
.fc:hover{border-color:#bfdbfe;box-shadow:0 2px 12px rgba(29,78,216,.08);transform:translateY(-1px);}
.fc.bloom:hover{border-color:#bae6fd;}.fc.comedy:hover{border-color:#fbcfe8;}.fc.selected{border-color:#1d4ed8;box-shadow:0 0 0 2px #bfdbfe;}
.fc-top{display:flex;align-items:center;gap:6px;margin-bottom:9px;flex-wrap:wrap;}
.fc-src{font-size:11px;font-weight:700;}.fc-date{font-size:10px;color:var(--text3);margin-left:auto;white-space:nowrap;}
.fc-tag{font-size:9px;font-weight:700;border-radius:10px;padding:2px 8px;text-transform:uppercase;}
.fc-alert{font-size:9px;font-weight:800;background:#fef2f2;color:#dc2626;border-radius:4px;padding:1px 6px;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
.fc-body{display:flex;gap:13px;align-items:flex-start;}
.fc-thumb{width:80px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;}.fc-ph{width:80px;height:60px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;}
.fc-text{flex:1;min-width:0;}
.fc-title{font-size:14px;font-weight:700;color:var(--text);line-height:1.3;letter-spacing:-.2px;margin-bottom:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.fc-desc{font-size:12px;color:var(--text2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.fc-bottom{display:flex;align-items:center;gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid var(--border2);}
.fc-btn{background:none;border:1px solid var(--border);border-radius:6px;padding:3px 10px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;font-weight:600;transition:all .12s;}
.fc-btn:hover{border-color:#1d4ed8;color:#1d4ed8;}.fc-btn.saved{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}.fc-btn.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}.fc-btn.sel-on{border-color:#1d4ed8;color:#1d4ed8;background:#eff6ff;}
.fc-read{margin-left:auto;font-size:10px;color:var(--text3);text-decoration:none;font-weight:600;}
.fc-read:hover{color:#1d4ed8;}
.fc-sum{margin-top:10px;background:var(--bg);border:1px solid #ddd6fe;border-radius:9px;padding:11px 13px;}
.fc-sum-lbl{font-size:9px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;}
.fc-sum-txt{font-size:12px;color:var(--text2);line-height:1.65;}
.fc-also{margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}.fc-also-lbl{font-size:10px;color:var(--text3);font-weight:500;}
.fc-also-src{font-size:10px;font-weight:700;border-radius:5px;padding:2px 7px;cursor:pointer;border:1px solid var(--border);color:var(--text2);background:none;font-family:inherit;}
.fc-also-src:hover{border-color:#1d4ed8;color:#1d4ed8;}
@media(max-width:600px){.fc-thumb,.fc-ph{width:64px;height:48px;border-radius:6px;}.fc-title{font-size:13px;}}
.sidebar{display:flex;flex-direction:column;gap:12px;}
.sb{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;}
.sb-hd{padding:12px 16px 10px;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;}
.sb-ttl{font-size:10px;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;}
.sb-act{font-size:10px;color:#1d4ed8;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700;}
.fpill{border-radius:8px;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
.fpill-lbl{font-size:11px;font-weight:700;}.fpill-x{background:none;border:none;cursor:pointer;font-size:14px;line-height:1;padding:0;}
.kw-wrap{padding:10px 14px 13px;}.kw-chips{display:flex;flex-wrap:wrap;gap:5px;}
.kw-chip{font-size:10px;font-weight:700;border-radius:20px;padding:4px 11px;cursor:pointer;transition:all .12s;border:1.5px solid transparent;display:inline-block;}
.kw-chip:hover{opacity:.8;}.kw-chip.act{border-color:currentColor;}
.src-list{padding:4px 0;}
.src-row{display:flex;align-items:center;gap:9px;padding:8px 16px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .1s;}
.src-row:last-child{border-bottom:none;}.src-row:hover,.src-row.src-on{background:var(--bg);}
.hdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hg2{background:#16a34a;}.hy2{background:#d97706;}.hr2{background:#dc2626;}.hgr2{background:#94a3b8;}
.src-nm{font-size:11px;font-weight:600;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.src-ct{font-size:10px;color:var(--text3);font-weight:500;}
.trend-list{padding:4px 0;}
.trend-row{display:flex;align-items:flex-start;gap:11px;padding:9px 16px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .1s;}
.trend-row:last-child{border-bottom:none;}.trend-row:hover{background:var(--bg);}
.trend-n{font-size:18px;font-weight:900;color:var(--border);min-width:22px;line-height:1;flex-shrink:0;}.trend-b{flex:1;min-width:0;}
.trend-t{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:2px;}
.trend-s{font-size:10px;color:var(--text3);}
.teams-strip{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);padding:12px 16px;display:flex;gap:8px;align-items:center;overflow-x:auto;scrollbar-width:none;}
.teams-strip::-webkit-scrollbar{display:none;}
.team-pill{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:var(--bg);border:1.5px solid var(--border);cursor:pointer;white-space:nowrap;font-size:12px;font-weight:700;color:var(--text2);transition:all .15s;flex-shrink:0;}
.team-pill:hover,.team-pill.followed{border-color:#d97706;color:#d97706;background:#fef3c7;}
.teams-strip-lbl{font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;flex-shrink:0;}
.src-footer{margin-top:20px;padding-top:14px;border-top:1px solid var(--border2);}
.sf-lbl{font-size:9px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px;}
.sf-links{display:flex;flex-wrap:wrap;gap:4px 2px;}
.sf-link{font-size:10px;color:var(--text3);text-decoration:none;padding:2px 8px;border-radius:5px;transition:all .1s;font-weight:600;}
.sf-link:hover{color:var(--text);background:var(--border2);}.sf-sep{font-size:9px;color:var(--border);user-select:none;}
.selbar{background:#1d4ed8;border-radius:var(--radius);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;}
.selbar-t{font-size:13px;font-weight:700;color:#fff;}.selbar-btns{display:flex;gap:7px;}
.selbtn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:7px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;}
.selbtn:hover{background:rgba(255,255,255,.25);}.selbtn-done{background:#fff;color:#1d4ed8;border-color:#fff;}
.empty{text-align:center;padding:60px 20px;color:var(--text3);}
.empty-icon{font-size:36px;margin-bottom:12px;}.empty-msg{font-size:13px;color:var(--text2);margin-bottom:16px;font-weight:500;}
.rfbtn{background:#1d4ed8;border:none;color:#fff;border-radius:9px;padding:9px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
.cp-ov{position:fixed;inset:0;background:rgba(10,15,30,.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
.cp{background:var(--surface);border-radius:16px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.25);}
.cp-hd{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.cp-ttl{font-size:15px;font-weight:800;color:var(--text);}.cp-x{background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3);line-height:1;}
.cp-body{padding:18px 22px;display:flex;flex-direction:column;gap:22px;}
.cp-sec-ttl{font-size:9px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:10px;}
.cp-desc{font-size:11px;color:var(--text2);line-height:1.55;margin-bottom:10px;}
.cp-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:11px;}
.cp-tab{background:var(--bg);border:1.5px solid var(--border);border-radius:7px;padding:4px 11px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:600;transition:all .1s;}
.cp-tab.act{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.cp-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;}
.cp-chip{display:inline-flex;align-items:center;gap:4px;border-radius:20px;padding:4px 11px;font-size:11px;font-weight:600;}
.cp-kw{background:#eff6ff;color:#1d4ed8;}.cp-al{background:#fef2f2;color:#dc2626;}.cp-tm{background:#fef3c7;color:#d97706;}
.cp-cx{background:none;border:none;cursor:pointer;font-size:13px;opacity:.5;line-height:1;padding:0;}.cp-cx:hover{opacity:1;}
.cp-add{display:flex;gap:7px;}
.cp-inp{flex:1;border:1.5px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.cp-inp:focus{outline:none;border-color:#1d4ed8;}
.cp-btn{background:#1d4ed8;border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}
.cp-btn-r{background:#dc2626;}.cp-btn-amber{background:#d97706;}
.cp-src-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border2);}.cp-src-row:last-child{border-bottom:none;}
.cp-src-nm{flex:1;font-size:12px;color:var(--text);}.cp-src-ct{font-size:10px;color:var(--text3);}
.cp-test{background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:3px 9px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:600;}
.cp-tog{width:32px;height:18px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
.cp-tog.on{background:#1d4ed8;}.cp-tog.off{background:#cbd5e1;}
.cp-tog::after{content:'';width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left .15s;}
.cp-tog.on::after{left:16px;}.cp-tog.off::after{left:2px;}
.cp-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;padding:0;line-height:1;}.cp-del:hover{color:#dc2626;}
.cp-tr{font-size:10px;padding:4px 9px;border-radius:6px;margin-top:5px;font-weight:500;}
.cp-tr-ok{background:#f0fdf4;color:#16a34a;}.cp-tr-fail{background:#fef2f2;color:#dc2626;}.cp-tr-load{background:var(--bg);color:var(--text3);font-style:italic;}
.cp-addsrc{background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:14px;margin-top:10px;display:flex;flex-direction:column;gap:7px;}
.cp-addsrc-t{font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;}
.cp-inp-sm{border:1.5px solid var(--border);border-radius:7px;padding:6px 10px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);width:100%;}
.cp-inp-sm:focus{outline:none;border-color:#1d4ed8;}
.cp-legend{display:flex;gap:14px;font-size:10px;color:var(--text3);margin-bottom:10px;flex-wrap:wrap;}.cp-legend-i{display:flex;align-items:center;gap:5px;}
.cp-save{width:100%;background:#0f172a;border:none;color:#fff;border-radius:10px;padding:13px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;}
.dark .cp-save{background:#f1f5f9;color:#0f172a;}
.team-modal-ov{position:fixed;inset:0;background:rgba(10,15,30,.7);z-index:700;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
.team-modal{background:var(--surface);border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.3);}
.team-modal-hd{padding:20px 22px 16px;background:linear-gradient(135deg,#d97706,#f59e0b);display:flex;align-items:center;gap:14px;}
.team-modal-emoji{font-size:36px;}.team-modal-name{font-size:18px;font-weight:900;color:#fff;}.team-modal-sub{font-size:12px;color:rgba(255,255,255,.8);margin-top:2px;}
.team-modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:10px;}
.team-modal-link{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg);border-radius:10px;cursor:pointer;text-decoration:none;border:1px solid var(--border);transition:all .15s;}
.team-modal-link:hover{border-color:#d97706;background:#fef3c7;}
.team-modal-link-icon{font-size:20px;width:32px;text-align:center;}
.team-modal-link-name{font-size:13px;font-weight:700;color:var(--text);}.team-modal-link-sub{font-size:11px;color:var(--text3);margin-top:1px;}
.team-modal-close{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:var(--text2);margin-top:4px;}
.pod-page{display:grid;grid-template-columns:1fr 280px;gap:20px;}
.pod-col{display:flex;flex-direction:column;gap:12px;}
.pod-hdr{background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:var(--radius);padding:16px 20px;display:flex;align-items:center;gap:14px;}
.pod-hdr-name{font-size:14px;font-weight:800;color:#fff;}.pod-hdr-sub{font-size:11px;color:rgba(255,255,255,.8);margin-top:2px;}
.pod-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);padding:16px;transition:border-color .15s;}
.pod-card:hover{border-color:#fda4af;}
.pod-top{display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;}
.pod-num{font-size:24px;font-weight:900;color:var(--border);min-width:30px;line-height:1;}.pod-body{flex:1;min-width:0;}
.pod-show{font-size:10px;font-weight:800;color:#e11d48;margin-bottom:3px;text-transform:uppercase;letter-spacing:.04em;}
.pod-ttl{font-size:14px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:5px;cursor:pointer;}.pod-ttl:hover{color:#e11d48;}
.pod-meta{font-size:10px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap;}
.pod-desc{font-size:11px;color:var(--text2);line-height:1.55;margin-top:7px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pod-acts{display:flex;gap:7px;flex-wrap:wrap;}
.pod-btn{border:1.5px solid var(--border);border-radius:7px;padding:5px 12px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:700;background:none;color:var(--text2);transition:all .12s;}
.pod-btn:hover{border-color:#e11d48;color:#e11d48;}.pod-btn.ai{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}.pod-btn.sv{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.pod-sum{background:var(--bg);border:1px solid #ddd6fe;border-radius:9px;padding:12px 14px;margin-top:12px;font-size:12px;color:var(--text2);line-height:1.65;}
.pod-sum-lbl{font-size:9px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;}
.pod-shows{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);padding:16px;}
.pshow-item{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px solid var(--border2);cursor:pointer;}.pshow-item:last-child{border-bottom:none;}.pshow-item:hover .pshow-nm{color:#e11d48;}
.pshow-emoji{font-size:20px;width:30px;text-align:center;}.pshow-nm{font-size:12px;font-weight:700;color:var(--text);transition:color .1s;}
.pshow-ep{font-size:10px;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;}
.pshow-dot{width:7px;height:7px;border-radius:50%;background:#e11d48;flex-shrink:0;margin-left:auto;}
@media(max-width:900px){.pod-page{grid-template-columns:1fr;}}
`;

function TopBar({tab,setTab,search,setSearch,dark,setDark,onCustomize,onRefresh,breakingItems,onTickerClick}){
  const[wx,setWx]=useState(null);
  const[quotes,setQuotes]=useState({});
  const[showBreaking,setShowBreaking]=useState(true);
  const[time,setTime]=useState(new Date());
  useEffect(()=>{
    fetchWeather().then(setWx);
    TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(p=>({...p,[t.sym]:q}))));
    const iv=setInterval(()=>TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(p=>({...p,[t.sym]:q})))),300000);
    const tv=setInterval(()=>setTime(new Date()),30000);
    return()=>{clearInterval(iv);clearInterval(tv);};
  },[]);
  const hasBreaking=breakingItems&&breakingItems.length>0;
  const tickerDup=hasBreaking?[...breakingItems,...breakingItems]:[];
  const TABS=['today','general','sports','business','finance','bloom','comedy','podcasts','saved'];
  const LABELS={today:'Today',bloom:'Bloom',podcasts:'Podcasts',saved:'Saved',comedy:'Comedy'};
  const fmtTime=d=>{let h=d.getHours(),m=String(d.getMinutes()).padStart(2,'0'),ap=h>=12?'PM':'AM';h=h%12||12;return`${h}:${m} ${ap}`;};
  return(
    <>
      <div className="ustrip">
        <div className="ustrip-in">
          {wx&&<div className="wx-block"><span className="wx-emoji">{wx.emoji}</span><span className="wx-temp">{wx.temp}°F</span><span className="wx-desc">{wx.desc}</span><span className="wx-wind">· {wx.wind}mph</span></div>}
          <div className="ticker-row">
            {TICKERS.map((t,i)=>{
              const q=quotes[t.sym],up=q?q.chg>=0:null;
              return(
                <span key={t.sym} style={{display:'contents'}}>
                  {i>0&&<div className="ticker-divider"/>}
                  <div className="ticker-pill" onClick={()=>onTickerClick&&onTickerClick(t)}>
                    <span className="ticker-sym" style={{color:t.color}}>{t.sym}</span>
                    {q?<><span className="ticker-price">${q.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span className={`ticker-chg ${up?'t-up':'t-dn'}`}>{up?'▲':'▼'}{Math.abs(q.pct).toFixed(2)}%</span></>:<span className="ticker-price" style={{color:'#475569'}}>—</span>}
                  </div>
                </span>
              );
            })}
          </div>
          <div className="ustrip-right"><span className="ustrip-time">Houston · {fmtTime(time)}</span></div>
        </div>
      </div>
      {hasBreaking&&showBreaking&&(
        <div className="break-strip">
          <div className="break-badge">Breaking</div>
          <div className="break-ticker"><div className="break-inner">
            {tickerDup.map((item,i)=><span key={i} className="break-item" onClick={()=>item.link&&window.open(item.link,'_blank')}>{item.title}<span style={{opacity:.5,fontSize:'10px'}}>— {item.source}</span><span className="break-dot">◆</span></span>)}
          </div></div>
          <button className="break-close" onClick={()=>setShowBreaking(false)}>✕</button>
        </div>
      )}
      <div className="navbar">
        <div className="navbar-in">
          <div className="logo">My<em>News</em>Hub</div>
          <div className="navtabs">
            {TABS.map(t=><button key={t} className={`navtab ${tab===t?'act':''} ${t==='bloom'?'bloom':''} ${t==='podcasts'?'pod':''} ${t==='comedy'?'comedy':''}`} onClick={()=>{setTab(t);setSearch('');}}>
              {LABELS[t]||(t.charAt(0).toUpperCase()+t.slice(1))}
            </button>)}
          </div>
          <div className="navr">
            <div className="srch-wrap"><span className="srch-icon">⌕</span><input className="srch" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
            <button className="nbtn" onClick={onRefresh}>↺</button>
            <button className="nbtn" onClick={()=>setDark(d=>!d)}>{dark?'☀️':'🌙'}</button>
            <button className="nbtn-blue" onClick={onCustomize}>Customize</button>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroSection({articles,cat,onRead,onSave,isSavedFn}){
  const[imgErr,setImgErr]=useState(false);
  if(!articles||articles.length===0)return null;
  const cc=CATS[cat]||CATS.general;
  const hero=articles[0];
  const grid=articles.slice(1,5);
  return(
    <div className="hero-wrap">
      <div className="hero-main" onClick={()=>onRead(hero)}>
        {hero.img&&!imgErr?<img className="hero-img" src={hero.img} onError={()=>setImgErr(true)} alt=""/>:<div className="hero-img-ph" style={{background:`linear-gradient(135deg,${cc.color}22,${cc.bg})`}}>{cc.emoji}</div>}
        <div className="hero-gradient"/>
        <div className="hero-content">
          <div className="hero-cat-tag" style={{background:cc.color,color:'#fff'}}>{cc.emoji} {cc.label}</div>
          <div className="hero-title">{hero.title}</div>
          <div className="hero-meta"><span className="hero-source">{hero.source}</span><span>·</span><span>{fmtDate(hero.pubDate)}</span></div>
        </div>
        <div className="hero-acts" onClick={e=>e.stopPropagation()}>
          <button className={`hero-act-btn ${isSavedFn(hero)?'saved':''}`} onClick={e=>{e.stopPropagation();onSave(hero);}}>{isSavedFn(hero)?'★ Saved':'☆ Save'}</button>
          <button className="hero-act-btn" onClick={e=>{e.stopPropagation();onRead(hero);}}>Read →</button>
        </div>
      </div>
      {grid.length>0&&(
        <div className="hero-grid">
          {grid.map((a,i)=>{
            const[ie,setIe]=useState(false);
            return(
              <div key={i} className="hg-item" onClick={()=>onRead(a)}>
                {a.img&&!ie?<img className="hg-thumb" src={a.img} onError={()=>setIe(true)} alt=""/>:<div className="hg-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
                <div className="hg-body">
                  <div className="hg-src" style={{color:cc.color}}>{a.source}</div>
                  <div className="hg-title">{a.title}</div>
                  <div className="hg-date">{fmtDate(a.pubDate)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeedCard({a,cat,isSaved,onSave,onRead,relatedSources,selectMode,isSelected,onSelect}){
  const[showSum,setShowSum]=useState(false);
  const[summary,setSummary]=useState('');
  const[loadSum,setLoadSum]=useState(false);
  const[imgErr,setImgErr]=useState(false);
  const cc=CATS[cat]||CATS.general;
  const topKw=a.matchedKw?.[0]||null;
  const handleAI=async e=>{
    e.stopPropagation();
    if(showSum){setShowSum(false);return;}
    if(summary){setShowSum(true);return;}
    setShowSum(true);setLoadSum(true);
    try{
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Summarize this news article in 2-3 concise sentences. Be direct and factual. Title: ${a.title}. Content: ${a.desc||''}`}]})});
      const data=await resp.json();setSummary(data.content?.[0]?.text||'Summary unavailable.');
    }catch{setSummary('Summary unavailable.');}
    setLoadSum(false);
  };
  return(
    <div className={`fc ${cat} ${isSelected?'selected':''}`} onClick={()=>selectMode?onSelect&&onSelect(a):onRead(a)}>
      <div className="fc-top">
        <span className="fc-src" style={{color:cc.color}}>{a.source}</span>
        {a.isAlert&&<span className="fc-alert">● ALERT</span>}
        {topKw&&<span className="fc-tag" style={{background:cc.bg,color:cc.color}}>{topKw}</span>}
        <span className="fc-date">{fmtDate(a.pubDate)}</span>
      </div>
      <div className="fc-body">
        {a.img&&!imgErr?<img className="fc-thumb" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="fc-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="fc-text"><div className="fc-title">{a.title}</div>{a.desc&&<div className="fc-desc">{a.desc}</div>}</div>
      </div>
      {showSum&&<div className="fc-sum" onClick={e=>e.stopPropagation()}><div className="fc-sum-lbl">✦ AI Summary</div><div className="fc-sum-txt">{loadSum?'Generating...':summary}</div></div>}
      {relatedSources&&relatedSources.length>0&&<div className="fc-also" onClick={e=>e.stopPropagation()}><span className="fc-also-lbl">Also covering:</span>{relatedSources.slice(0,4).map((s,i)=><button key={i} className="fc-also-src" onClick={()=>s.link&&window.open(s.link,'_blank')}>{s.source}</button>)}</div>}
      <div className="fc-bottom" onClick={e=>e.stopPropagation()}>
        {selectMode?<button className={`fc-btn ${isSelected?'sel-on':''}`} onClick={()=>onSelect&&onSelect(a)}>{isSelected?'✓ Selected':'Select'}</button>
        :<><button className={`fc-btn ${isSaved?'saved':''}`} onClick={e=>{e.stopPropagation();onSave(a);}}>{isSaved?'★ Saved':'☆ Save'}</button>
        <button className={`fc-btn ${showSum?'ai-on':''}`} onClick={handleAI}>✦ {loadSum?'Thinking...':showSum?'Hide AI':'AI Summary'}</button></>}
        <a className="fc-read" href={a.link} target="_blank" rel="noreferrer" onClick={e=>{e.stopPropagation();onRead(a);}}>Read → {a.source}</a>
      </div>
    </div>
  );
}

function TeamModal({team,onClose}){
  if(!team)return null;
  const espnUrl=TEAM_URLS[team]||`https://www.espn.com/search/results?q=${encodeURIComponent(team)}`;
  const yahooUrl=`https://sports.yahoo.com/search/players/?query=${encodeURIComponent(team)}`;
  const googleNews=`https://news.google.com/search?q=${encodeURIComponent(team)}+sports`;
  const links=[
    {icon:'🏟️',name:'Team Page — ESPN',sub:'Schedule, roster, stats, news',url:espnUrl},
    {icon:'🏈',name:'Team Page — Yahoo Sports',sub:'Scores, standings, fantasy',url:yahooUrl},
    {icon:'📰',name:'Latest News',sub:'Google News — recent coverage',url:googleNews},
  ];
  return(
    <div className="team-modal-ov" onClick={onClose}>
      <div className="team-modal" onClick={e=>e.stopPropagation()}>
        <div className="team-modal-hd"><div className="team-modal-emoji">🏆</div><div><div className="team-modal-name">{team}</div><div className="team-modal-sub">Tap a link to visit</div></div></div>
        <div className="team-modal-body">
          {links.map((l,i)=><a key={i} className="team-modal-link" href={l.url} target="_blank" rel="noreferrer"><div className="team-modal-link-icon">{l.icon}</div><div><div className="team-modal-link-name">{l.name}</div><div className="team-modal-link-sub">{l.sub}</div></div><span style={{fontSize:'12px',color:'var(--text3)',marginLeft:'auto'}}>→</span></a>)}
          <button className="team-modal-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({cat,arts,kw,health,activeKw,setActiveKw,activeSource,setActiveSource,onRead,followedTeams,onTeamClick,breakingItems}){
  const cc=CATS[cat]||CATS.general;
  const catKws=kw[cat]||[];
  const catArts=arts[cat]||[];
  const srcCounts={};catArts.forEach(a=>{srcCounts[a.source]=(srcCounts[a.source]||0)+1;});
  const sources=[...new Set(catArts.map(a=>a.source))];
  const trending=catArts.slice(0,10);
  const isSports=cat==='sports';
  const HDot=({name})=>{const h=health[name];const cls=h==='green'?'hg2':h==='yellow'?'hy2':h==='red'?'hr2':'hgr2';return<span className={`hdot ${cls}`} title={h||'Pending'}/>;};
  return(
    <div className="sidebar">
      {activeKw&&<div className="fpill" style={{background:'#eff6ff',border:'1px solid #bfdbfe'}}><span className="fpill-lbl" style={{color:'#1d4ed8'}}>🔍 {activeKw}</span><button className="fpill-x" style={{color:'#1d4ed8'}} onClick={()=>setActiveKw(null)}>✕</button></div>}
      {activeSource&&<div className="fpill" style={{background:cc.bg,border:`1px solid ${cc.color}55`}}><span className="fpill-lbl" style={{color:cc.color}}>📰 {activeSource}</span><button className="fpill-x" style={{color:cc.color}} onClick={()=>setActiveSource(null)}>✕</button></div>}
      {isSports&&followedTeams&&followedTeams.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl">My Teams</span></div>
        <div style={{padding:'10px 14px 12px',display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {followedTeams.map((t,i)=><button key={i} className="team-pill followed" onClick={()=>onTeamClick&&onTeamClick(t)}><span>🏆</span>{t}</button>)}
        </div></div>
      )}
      {isSports&&trending.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl">🏆 Trending in Sports</span></div>
        <div className="trend-list">{trending.slice(0,8).map((a,i)=><div key={i} className="trend-row" onClick={()=>onRead(a)}><div className="trend-n">{i+1}</div><div className="trend-b"><div className="trend-t">{a.title}</div><div className="trend-s">{a.source} · {fmtDate(a.pubDate)}</div></div></div>)}</div></div>
      )}
      {breakingItems&&breakingItems.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl" style={{color:'#dc2626'}}>🔴 Breaking</span></div>
        <div className="trend-list">{breakingItems.slice(0,4).map((a,i)=><div key={i} className="trend-row" onClick={()=>onRead(a)}><div className="trend-n" style={{color:'#dc2626',fontSize:'10px',minWidth:'auto',fontWeight:'900'}}>●</div><div className="trend-b"><div className="trend-t">{a.title}</div><div className="trend-s">{a.source}</div></div></div>)}</div></div>
      )}
      {catKws.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl">{cc.emoji} Topics</span>{activeKw&&<button className="sb-act" onClick={()=>setActiveKw(null)}>Clear</button>}</div>
        <div className="kw-wrap"><div className="kw-chips">{catKws.map((k,i)=><span key={i} className={`kw-chip ${activeKw===k?'act':''}`} style={{background:cc.bg,color:cc.color}} onClick={()=>setActiveKw(activeKw===k?null:k)}>{k}</span>)}</div></div></div>
      )}
      {sources.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl">Sources</span>{activeSource&&<button className="sb-act" onClick={()=>setActiveSource(null)}>Clear</button>}</div>
        <div className="src-list">{sources.map((name,i)=><div key={i} className={`src-row ${activeSource===name?'src-on':''}`} onClick={()=>setActiveSource(activeSource===name?null:name)}><HDot name={name}/><span className="src-nm" style={{fontWeight:activeSource===name?700:500,color:activeSource===name?cc.color:''}}>{name}</span><span className="src-ct">{srcCounts[name]||0}</span></div>)}</div></div>
      )}
      {!isSports&&trending.length>0&&(
        <div className="sb"><div className="sb-hd"><span className="sb-ttl">Trending</span></div>
        <div className="trend-list">{trending.slice(0,8).map((a,i)=><div key={i} className="trend-row" onClick={()=>onRead(a)}><div className="trend-n">{i+1}</div><div className="trend-b"><div className="trend-t">{a.title}</div><div className="trend-s">{a.source} · {fmtDate(a.pubDate)}</div></div></div>)}</div></div>
      )}
    </div>
  );
}

function SourceFooter({cat,feeds,arts}){
  let sources=[];
  if(!cat){const seen=new Set();Object.values(feeds).flat().forEach(f=>{if(f.on&&!seen.has(f.name)&&SOURCE_URLS[f.name]){seen.add(f.name);sources.push(f);}});const allArts=Object.values(arts).flat(),counts={};allArts.forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});sources.sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0));sources=sources.slice(0,18);}
  else{const catArts=arts[cat]||[],counts={};catArts.forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});sources=(feeds[cat]||[]).filter(f=>f.on&&SOURCE_URLS[f.name]).sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0));}
  if(!sources.length)return null;
  return(
    <div className="src-footer"><div className="sf-lbl">Sources</div><div className="sf-links">
      {sources.map((f,i)=><span key={f.name} style={{display:'inline-flex',alignItems:'center'}}><a className="sf-link" href={SOURCE_URLS[f.name]} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>{f.name}</a>{i<sources.length-1&&<span className="sf-sep">·</span>}</span>)}
    </div></div>
  );
}

const CAT_LABELS={general:'🌐 General',sports:'🏆 Sports',business:'⚡ Business',finance:'📈 Finance',bloom:'🔋 Bloom',comedy:'😂 Comedy'};
function CustomizePanel({feeds,kw,alerts,health,arts,followedTeams,onClose,onSave}){
  const[lf,setLf]=useState(JSON.parse(JSON.stringify(feeds)));
  const[lk,setLk]=useState(JSON.parse(JSON.stringify(kw)));
  const[la,setLa]=useState([...alerts]);
  const[lt,setLt]=useState([...followedTeams]);
  const[activeSection,setActiveSection]=useState('keywords');
  const[kwTab,setKwTab]=useState('general');
  const[srcTab,setSrcTab]=useState('general');
  const[newKw,setNewKw]=useState('');
  const[newAlert,setNewAlert]=useState('');
  const[newTeam,setNewTeam]=useState('');
  const[newName,setNewName]=useState('');
  const[newUrl,setNewUrl]=useState('');
  const[testState,setTestState]=useState({});
  const testFeed=async(url,key)=>{setTestState(s=>({...s,[key]:'loading'}));const items=await fetchRSS(url);setTestState(s=>({...s,[key]:items.length>0?`ok:${items.length} articles`:'fail'}));};
  const addSource=()=>{if(!newName.trim()||!newUrl.trim())return;setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcTab])n[srcTab]=[];n[srcTab].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});setNewName('');setNewUrl('');};
  const countBySrc=(cat,name)=>(arts[cat]||[]).filter(a=>a.source===name).length;
  const TR=({tkey})=>{const ts=testState[tkey];if(!ts)return null;return<div className={`cp-tr ${ts==='loading'?'cp-tr-load':ts.startsWith('ok')?'cp-tr-ok':'cp-tr-fail'}`}>{ts==='loading'?'Testing...':(ts.startsWith('ok')?`✓ ${ts.replace('ok:','')}`:'✗ Failed')}</div>;};
  const SECTIONS=[{id:'keywords',label:'Keywords'},{id:'alerts',label:'Alerts'},{id:'teams',label:'My Teams'},{id:'sources',label:'Sources'}];
  return(
    <div className="cp-ov" onClick={onClose}>
      <div className="cp" onClick={e=>e.stopPropagation()}>
        <div className="cp-hd"><span className="cp-ttl">Customize Hub</span><button className="cp-x" onClick={onClose}>✕</button></div>
        <div style={{padding:'0 22px',borderBottom:'1px solid var(--border)',display:'flex',gap:'4px'}}>
          {SECTIONS.map(s=><button key={s.id} onClick={()=>setActiveSection(s.id)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'12px',fontWeight:'700',color:activeSection===s.id?'#1d4ed8':'var(--text3)',padding:'10px 12px',borderBottom:activeSection===s.id?'2px solid #1d4ed8':'2px solid transparent',transition:'all .15s'}}>{s.label}</button>)}
        </div>
        <div className="cp-body">
          {activeSection==='keywords'&&<div>
            <div className="cp-sec-ttl">Keywords by Category</div>
            <div className="cp-desc">Keywords boost matching articles to the top of each feed and appear as clickable topic chips in the sidebar.</div>
            <div className="cp-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-tab ${kwTab===c?'act':''}`} onClick={()=>setKwTab(c)}>{CAT_LABELS[c]}</button>)}</div>
            <div className="cp-chips">{(lk[kwTab]||[]).map((k,i)=><span key={i} className="cp-chip cp-kw">{k}<button className="cp-cx" onClick={()=>setLk(p=>{const n={...p};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}>✕</button></span>)}{!(lk[kwTab]||[]).length&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No keywords yet</span>}</div>
            <div className="cp-add"><input className="cp-inp" placeholder={`Add ${kwTab} keyword...`} value={newKw} onChange={e=>setNewKw(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}}/><button className="cp-btn" onClick={()=>{if(newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}}>Add</button></div>
          </div>}
          {activeSection==='alerts'&&<div>
            <div className="cp-sec-ttl">Breaking News Alerts</div>
            <div className="cp-desc">Red scrolling ticker appears when these words hit any headline.</div>
            <div className="cp-chips">{la.map((a,i)=><span key={i} className="cp-chip cp-al">{a}<button className="cp-cx" onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>✕</button></span>)}</div>
            <div className="cp-add"><input className="cp-inp" placeholder="Add alert word..." value={newAlert} onChange={e=>setNewAlert(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/>
            <button className="cp-btn cp-btn-r" onClick={()=>{if(newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button></div>
          </div>}
          {activeSection==='teams'&&<div>
            <div className="cp-sec-ttl">My Teams</div>
            <div className="cp-desc">Your followed teams appear at the top of the Sports sidebar and in a strip above the Sports feed. Tap any team to see their ESPN page, schedule, roster, and latest news.</div>
            <div className="cp-chips">{lt.map((t,i)=><span key={i} className="cp-chip cp-tm">{t}<button className="cp-cx" onClick={()=>setLt(x=>x.filter((_,j)=>j!==i))}>✕</button></span>)}{!lt.length&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No teams followed yet</span>}</div>
            <div className="cp-add"><input className="cp-inp" placeholder="Team name (e.g. Texans, Lakers...)" value={newTeam} onChange={e=>setNewTeam(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newTeam.trim()){setLt(x=>[...x,newTeam.trim()]);setNewTeam('');}}}/>
            <button className="cp-btn cp-btn-amber" onClick={()=>{if(newTeam.trim()){setLt(x=>[...x,newTeam.trim()]);setNewTeam('');}}}>Follow</button></div>
            <div style={{marginTop:'14px',padding:'10px 12px',background:'var(--bg)',borderRadius:'8px',fontSize:'11px',color:'var(--text2)',lineHeight:'1.6'}}><strong>Tip:</strong> Tap any team pill in Sports to open ESPN schedule, roster, and news.</div>
          </div>}
          {activeSection==='sources'&&<div>
            <div className="cp-sec-ttl">Sources</div>
            <div className="cp-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-tab ${srcTab===c?'act':''}`} onClick={()=>setSrcTab(c)}>{CAT_LABELS[c]}</button>)}</div>
            <div className="cp-legend"><span className="cp-legend-i"><span className="hdot hg2"/>Loaded</span><span className="cp-legend-i"><span className="hdot hy2"/>Slow</span><span className="cp-legend-i"><span className="hdot hr2"/>Failed</span><span className="cp-legend-i"><span className="hdot hgr2"/>Pending</span></div>
            {(lf[srcTab]||[]).map((f,i)=>{const h=health[f.name];const hcls=h==='green'?'hg2':h==='yellow'?'hy2':h==='red'?'hr2':'hgr2';const tk=`${srcTab}_${i}`;return(
              <div key={i}><div className="cp-src-row"><span className={`hdot ${hcls}`}/><span className="cp-src-nm">{f.name}</span><span className="cp-src-ct">{countBySrc(srcTab,f.name)||''}</span>
              <button className="cp-test" onClick={()=>testFeed(f.url,tk)}>Test</button>
              <button className={`cp-tog ${f.on?'on':'off'}`} onClick={()=>setLf(p=>{const n=JSON.parse(JSON.stringify(p));n[srcTab][i].on=!n[srcTab][i].on;return n;})}/>
              <button className="cp-del" onClick={()=>setLf(p=>{const n=JSON.parse(JSON.stringify(p));n[srcTab].splice(i,1);return n;})}>✕</button></div><TR tkey={tk}/></div>
            );})}
            <div className="cp-addsrc">
              <div className="cp-addsrc-t">+ Add custom source to {CAT_LABELS[srcTab]}</div>
              <input className="cp-inp-sm" placeholder="Source name" value={newName} onChange={e=>setNewName(e.target.value)}/>
              <input className="cp-inp-sm" placeholder="RSS feed URL" value={newUrl} onChange={e=>setNewUrl(e.target.value)}/>
              <div style={{display:'flex',gap:'7px'}}><button className="cp-test" style={{flex:1,padding:'6px'}} onClick={()=>newUrl.trim()&&testFeed(newUrl.trim(),`new_${srcTab}`)}>Test URL</button><button className="cp-btn" style={{flex:1}} onClick={addSource}>Add Source</button></div>
              <TR tkey={`new_${srcTab}`}/>
            </div>
          </div>}
          <button className="cp-save" onClick={()=>onSave({feeds:lf,kw:lk,alerts:la,followedTeams:lt})}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const[tab,setTab]=useState('today');
  const[search,setSearch]=useState('');
  const[dark,setDark]=useState(()=>ld('dark',false));
  const[saved,setSaved]=useState(()=>ld('saved',[]));
  const[clicks,setClicks]=useState(()=>ld('clicks',{}));
  const[kw,setKw]=useState(()=>ld('kw',DEFAULT_KW));
  const[alerts,setAlerts]=useState(()=>ld('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','fuel cell','hurricane','earthquake','breaking']));
  const[feeds,setFeeds]=useState(()=>ld('feeds',DEFAULT_FEEDS));
  const[followedTeams,setFollowedTeams]=useState(()=>ld('teams',DEFAULT_FOLLOWED_TEAMS));
  const[arts,setArts]=useState({general:[],sports:[],business:[],finance:[],bloom:[],comedy:[]});
  const[loading,setLoading]=useState({general:false,sports:false,business:false,finance:false,bloom:false,comedy:false});
  const[health,setHealth]=useState({});
  const[podEps,setPodEps]=useState({});
  const[podLoading,setPodLoading]=useState({});
  const[activePod,setActivePod]=useState(null);
  const[showPanel,setShowPanel]=useState(false);
  const[activeKw,setActiveKw]=useState(null);
  const[activeSrc,setActiveSrc]=useState(null);
  const[selectMode,setSelectMode]=useState(false);
  const[selected,setSelected]=useState([]);
  const[teamModal,setTeamModal]=useState(null);

  useEffect(()=>{sv('dark',dark);document.body.className=dark?'dark':'';},[dark]);
  useEffect(()=>{sv('saved',saved);},[saved]);
  useEffect(()=>{sv('clicks',clicks);},[clicks]);

  const breakingItems=Object.values(arts).flat().filter(a=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase())));
  const kwMatch=(a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase()));
  const dedupe=arr=>{const seen=new Set();return arr.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});};

  const sorted=useCallback((cat)=>{
    let arr=arts[cat]||[];
    if(search)arr=arr.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search));
    if(activeKw)arr=arr.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));
    if(activeSrc)arr=arr.filter(a=>a.source===activeSrc);
    arr=dedupe(arr);
    arr.sort((a,b)=>{const ka=kwMatch(a,cat).length,kb=kwMatch(b,cat).length;if(kb!==ka)return kb-ka;return new Date(b.pubDate)-new Date(a.pubDate);});
    return arr.map(a=>({...a,matchedKw:kwMatch(a,cat),isAlert:alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase()))}));
  },[arts,search,activeKw,activeSrc,kw,alerts]);

  const loadCat=useCallback(async(cat)=>{
    if(loading[cat])return;
    setLoading(l=>({...l,[cat]:true}));
    const results=[],hUpd={};
    await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
      const t0=Date.now(),items=await fetchRSS(f.url),ms=Date.now()-t0;
      hUpd[f.name]=items.length>0?(ms<4000?'green':'yellow'):'red';
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    setHealth(h=>({...h,...hUpd}));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLoading(l=>({...l,[cat]:false}));
  },[feeds,loading]);

  const loadPod=useCallback(async(pod)=>{
    if(podLoading[pod.name])return;
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
  const onSelect=a=>setSelected(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,a]);
  const shareSelected=()=>{const text=selected.map(a=>`${a.title}\n${a.link}`).join('\n\n');if(navigator.share){navigator.share({text}).catch(()=>{});}else{navigator.clipboard.writeText(text).then(()=>alert('Copied!'));}};
  const handleTickerClick=t=>{setSearch(t.label.toLowerCase());const map={'Bloom Energy':'bloom','Crude Oil':'business','Bitcoin':'finance'};if(map[t.label])handleTabChange(map[t.label]);};
  const handleCustomizeSave=({feeds:nf,kw:nk,alerts:na,followedTeams:nt})=>{setFeeds(nf);sv('feeds',nf);setKw(nk);sv('kw',nk);setAlerts(na);sv('alerts',na);setFollowedTeams(nt);sv('teams',nt);setShowPanel(false);refreshAll();};
  const handleTabChange=t=>{setTab(t);setSearch('');setActiveKw(null);setActiveSrc(null);setSelectMode(false);setSelected([]);if(!['today','saved','podcasts'].includes(t)&&!(arts[t]||[]).length)loadCat(t);};
  const getRelated=(a,cat)=>{const matched=kwMatch(a,cat);if(!matched.length)return[];return(arts[cat]||[]).filter(x=>x.link!==a.link&&matched.some(k=>(x.title+(x.desc||'')).toLowerCase().includes(k.toLowerCase()))).slice(0,4);};
  const NEWS_CATS=['general','sports','business','finance','bloom','comedy'];

  const FeedPage=({cat})=>{
    const cc=CATS[cat];
    const items=sorted(cat);
    const heroItems=items.slice(0,5);
    const feedItems=items.slice(5,25);
    const isLoading=loading[cat];
    const isSports=cat==='sports';
    return(
      <div className="page">
        {selectMode&&<div className="selbar" style={{marginBottom:'14px'}}><span className="selbar-t">{selected.length} selected</span><div className="selbar-btns"><button className="selbtn" onClick={()=>setSelected([])}>Clear</button>{selected.length>0&&<button className="selbtn" onClick={shareSelected}>Share {selected.length}</button>}<button className="selbtn selbtn-done" onClick={()=>{setSelectMode(false);setSelected([]);}}>Done</button></div></div>}
        {isSports&&followedTeams.length>0&&<div className="teams-strip" style={{marginBottom:'14px'}}><span className="teams-strip-lbl">My Teams</span>{followedTeams.map((t,i)=><button key={i} className="team-pill followed" onClick={()=>setTeamModal(t)}><span>🏆</span>{t}</button>)}<button className="team-pill" style={{marginLeft:'auto',fontSize:'11px',color:'var(--text3)'}} onClick={()=>setShowPanel(true)}>+ Follow</button></div>}
        <div className="page-grid">
          <div className="feed-col">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'2px'}}>
              <span style={{fontSize:'10px',fontWeight:'800',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.09em'}}>{cc.emoji} {cc.label}{items.length>0?` — ${items.length} articles`:''}</span>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <button style={{fontSize:'10px',fontWeight:'700',background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'3px 9px',cursor:'pointer',color:'var(--text3)',fontFamily:'inherit'}} onClick={()=>{setSelectMode(!selectMode);setSelected([]);}}>{selectMode?'Cancel':'Select'}</button>
              </div>
            </div>
            {(activeKw||activeSrc)&&<div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'4px'}}>
              {activeKw&&<span style={{background:cc.bg,color:cc.color,borderRadius:'20px',padding:'4px 12px',fontSize:'10px',fontWeight:'700',display:'inline-flex',alignItems:'center',gap:'6px'}}>🔍 {activeKw}<button onClick={()=>setActiveKw(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'13px',padding:0}}>✕</button></span>}
              {activeSrc&&<span style={{background:'var(--bg)',color:'var(--text2)',borderRadius:'20px',padding:'4px 12px',fontSize:'10px',fontWeight:'700',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',gap:'6px'}}>📰 {activeSrc}<button onClick={()=>setActiveSrc(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'13px',padding:0}}>✕</button></span>}
            </div>}
            {isLoading&&!items.length?<div className="empty"><div className="empty-icon">{cc.emoji}</div><div className="empty-msg">Loading {cc.label}...</div></div>
            :items.length===0?<div className="empty"><div className="empty-icon">📭</div><div className="empty-msg">{activeKw||activeSrc?'No articles match this filter':'No articles loaded yet'}</div><button className="rfbtn" onClick={refreshAll}>Refresh</button></div>
            :<>
              {!activeKw&&!activeSrc&&!search&&heroItems.length>0&&<HeroSection articles={heroItems} cat={cat} onRead={onRead} onSave={onSave} isSavedFn={isSavedFn}/>}
              {(activeKw||activeSrc||search?items:feedItems).slice(0,20).map((a,i)=><FeedCard key={i} a={a} cat={cat} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,cat)} selectMode={selectMode} isSelected={selected.some(x=>x.link===a.link)} onSelect={onSelect}/>)}
            </>}
            <SourceFooter cat={cat} feeds={feeds} arts={arts}/>
          </div>
          <Sidebar cat={cat} arts={arts} kw={kw} health={health} activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}} activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}} onRead={onRead} followedTeams={followedTeams} onTeamClick={setTeamModal} breakingItems={breakingItems.filter(a=>a.cat===cat)}/>
        </div>
      </div>
    );
  };

  const TodayPage=()=>{
    const cats=['general','sports','business','finance'];
    return(
      <div className="page">
        {sorted('general').length>0&&<div style={{marginBottom:'20px'}}><HeroSection articles={sorted('general').slice(0,5)} cat="general" onRead={onRead} onSave={onSave} isSavedFn={isSavedFn}/></div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
          {cats.map(cat=>{
            const cc=CATS[cat],items=sorted(cat).slice(0,4),total=(arts[cat]||[]).length;
            return(
              <div key={cat} style={{background:'var(--surface)',borderRadius:'var(--radius)',border:'1px solid var(--border)',overflow:'hidden'}}>
                <div style={{padding:'10px 14px 8px',borderBottom:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'11px',fontWeight:'800',color:cc.color,display:'flex',alignItems:'center',gap:'5px'}}>{cc.emoji} {cc.label}<span style={{fontSize:'9px',color:'var(--text3)',background:'var(--bg)',borderRadius:'8px',padding:'1px 6px',border:'1px solid var(--border)',fontWeight:'600',marginLeft:'2px'}}>{total}</span></span>
                  <button style={{fontSize:'10px',fontWeight:'700',color:cc.color,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>handleTabChange(cat)}>All →</button>
                </div>
                {loading[cat]?<div style={{padding:'20px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>Loading...</div>
                :items.length===0?<div style={{padding:'20px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>No articles yet</div>
                :items.map((a,i)=>{
                  const[ie,setIe]=useState(false);
                  return(<div key={i} style={{padding:'9px 14px',borderBottom:i<items.length-1?'1px solid var(--border2)':'none',cursor:'pointer',display:'flex',gap:'9px',alignItems:'flex-start',transition:'background .1s'}} onMouseOver={e=>e.currentTarget.style.background='var(--bg)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} onClick={()=>onRead(a)}>
                    {a.img&&!ie?<img style={{width:'50px',height:'38px',borderRadius:'6px',objectFit:'cover',flexShrink:0}} src={a.img} loading="lazy" onError={()=>setIe(true)} alt=""/>:<div style={{width:'50px',height:'38px',borderRadius:'6px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',background:cc.bg}}>{cc.emoji}</div>}
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:'11px',fontWeight:'600',color:'var(--text)',lineHeight:'1.35',marginBottom:'2px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.title}</div><div style={{fontSize:'10px',color:'var(--text3)'}}>{a.source} · {fmtDate(a.pubDate)}</div></div>
                  </div>);
                })}
              </div>
            );
          })}
        </div>
        <div style={{background:'var(--surface)',borderRadius:'var(--radius)',border:'1.5px solid #bae6fd',overflow:'hidden',marginBottom:'14px'}}>
          <div style={{padding:'10px 14px 8px',borderBottom:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:'11px',fontWeight:'800',color:'#0369a1'}}>🔋 Bloom Energy & Power Intelligence<span style={{fontSize:'9px',color:'var(--text3)',background:'var(--bg)',borderRadius:'8px',padding:'1px 6px',border:'1px solid var(--border)',fontWeight:'600',marginLeft:'6px'}}>{(arts.bloom||[]).length}</span></span>
            <button style={{fontSize:'10px',fontWeight:'700',color:'#0369a1',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}} onClick={()=>handleTabChange('bloom')}>All →</button>
          </div>
          {loading.bloom?<div style={{padding:'16px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>Loading...</div>
          :sorted('bloom').length===0?<div style={{padding:'16px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>No articles yet</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
            {sorted('bloom').slice(0,4).map((a,i)=><div key={i} style={{padding:'10px 14px',borderRight:i<3?'1px solid var(--border2)':'none',cursor:'pointer',transition:'background .1s'}} onMouseOver={e=>e.currentTarget.style.background='var(--bg)'} onMouseOut={e=>e.currentTarget.style.background='transparent'} onClick={()=>onRead(a)}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text)',lineHeight:'1.35',marginBottom:'4px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{a.title}</div>
              <div style={{fontSize:'10px',color:'#0369a1',fontWeight:'600'}}>{a.source}</div>
              <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px'}}>{fmtDate(a.pubDate)}</div>
            </div>)}
          </div>}
        </div>
        <SourceFooter feeds={feeds} arts={arts}/>
      </div>
    );
  };

  const PodcastsPage=()=>{
    const allEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,3).map(e=>({...e,show:p.name,host:p.host,emoji:p.emoji}))).sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({...e,show:activePod.name,host:activePod.host,emoji:activePod.emoji})):allEps;
    const PodCard=({ep,idx})=>{
      const[showSum,setShowSum]=useState(false);const[podSum,setPodSum]=useState('');const[loadSum,setLoadSum]=useState(false);
      const sv2=isSavedFn({...ep,link:ep.link||ep.show+idx});
      const handleAI=async()=>{if(showSum){setShowSum(false);return;}if(podSum){setShowSum(true);return;}setShowSum(true);setLoadSum(true);try{const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`Summarize this podcast episode in 2-3 sentences. Title: ${ep.title}. Description: ${ep.desc||''}`}]})});const data=await resp.json();setPodSum(data.content?.[0]?.text||'Summary unavailable.');}catch{setPodSum('Summary unavailable.');}setLoadSum(false);};
      return(<div className="pod-card"><div className="pod-top"><div className="pod-num">{idx+1}</div><div className="pod-body"><div className="pod-show">{ep.emoji} {ep.show}</div><div className="pod-ttl" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>{ep.title}</div><div className="pod-meta"><span>{fmtDate(ep.pubDate)}</span>{ep.duration&&<span>{fmtDur(ep.duration)}</span>}</div>{ep.desc&&<div className="pod-desc">{ep.desc}</div>}</div></div>
      {showSum&&<div className="pod-sum"><div className="pod-sum-lbl">✦ AI Summary</div>{loadSum?'Generating...':podSum}</div>}
      <div className="pod-acts"><button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen</button><button className={`pod-btn ${showSum?'ai':''}`} onClick={handleAI}>{loadSum?'Thinking...':showSum?'Hide AI':'✦ AI Summary'}</button><button className={`pod-btn ${sv2?'sv':''}`} onClick={()=>onSave({...ep,link:ep.link||ep.show+idx,source:ep.show,cat:'podcasts'})}>{sv2?'★ Saved':'☆ Save'}</button></div></div>);
    };
    return(<div className="page"><div className="pod-page"><div className="pod-col">
      <div className="pod-hdr"><div style={{fontSize:'32px'}}>{activePod?activePod.emoji:'🎙️'}</div><div><div className="pod-hdr-name">{activePod?activePod.name:'All Podcasts'}</div><div className="pod-hdr-sub">{activePod?`Hosted by ${activePod.host}`:`${PODCAST_FEEDS.length} shows · AI summaries available`}</div></div></div>
      {displayEps.length===0?<div className="empty"><div className="empty-msg">Loading episodes...</div></div>:displayEps.slice(0,20).map((ep,i)=><PodCard key={i} ep={ep} idx={i}/>)}
    </div>
    <div><div className="pod-shows">
      <div style={{fontSize:'10px',fontWeight:'800',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'10px',paddingBottom:'10px',borderBottom:'1px solid var(--border2)'}}>Shows</div>
      <div className="pshow-item" onClick={()=>setActivePod(null)}><div className="pshow-emoji">🎙️</div><div style={{flex:1,minWidth:0}}><div className="pshow-nm" style={{color:!activePod?'#e11d48':''}}>All Shows</div><div className="pshow-ep">Latest from all {PODCAST_FEEDS.length} podcasts</div></div>{!activePod&&<div className="pshow-dot"/>}</div>
      {PODCAST_FEEDS.map((p,i)=>{const eps=podEps[p.name]||[],latest=eps[0],isA=activePod?.name===p.name;return(<div key={i} className="pshow-item" onClick={()=>setActivePod(isA?null:p)}><div className="pshow-emoji">{p.emoji}</div><div style={{flex:1,minWidth:0}}><div className="pshow-nm" style={{color:isA?'#e11d48':''}}>{p.name}</div><div className="pshow-ep">{podLoading[p.name]?'Loading...':(latest?latest.title.slice(0,38)+'...':'No episodes yet')}</div></div>{isA&&<div className="pshow-dot"/>}</div>);})}
    </div></div></div></div>);
  };

  const SavedPage=()=>(<div className="page">{saved.length===0?<div className="empty" style={{padding:'80px 20px'}}><div className="empty-icon">☆</div><div className="empty-msg">No saved items yet</div><div style={{fontSize:'11px',color:'var(--text3)'}}>Tap Save on any article or episode</div></div>:<div className="page-grid"><div className="feed-col"><span style={{fontSize:'10px',fontWeight:'800',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'4px',display:'block'}}>Saved — {saved.length} items</span>{saved.map((a,i)=><FeedCard key={i} a={a} cat={a.cat||'general'} isSaved={true} onSave={onSave} onRead={onRead}/>)}</div></div>}</div>);

  return(
    <><style>{CSS}</style>
    <div className={`hub${dark?' dark':''}`}>
      <TopBar tab={tab} setTab={handleTabChange} search={search} setSearch={setSearch} dark={dark} setDark={setDark} onCustomize={()=>setShowPanel(true)} onRefresh={refreshAll} breakingItems={breakingItems} onTickerClick={handleTickerClick}/>
      {tab==='today'&&<TodayPage/>}
      {NEWS_CATS.includes(tab)&&<FeedPage cat={tab}/>}
      {tab==='podcasts'&&<PodcastsPage/>}
      {tab==='saved'&&<SavedPage/>}
      {showPanel&&<CustomizePanel feeds={feeds} kw={kw} alerts={alerts} health={health} arts={arts} followedTeams={followedTeams} onClose={()=>setShowPanel(false)} onSave={handleCustomizeSave}/>}
      {teamModal&&<TeamModal team={teamModal} onClose={()=>setTeamModal
{tab==='podcasts'&&<PodcastsPage/>}
      {tab==='saved'&&<SavedPage/>}
      {showPanel&&<CustomizePanel feeds={feeds} kw={kw} alerts={alerts} health={health} arts={arts} followedTeams={followedTeams} onClose={()=>setShowPanel(false)} onSave={handleCustomizeSave}/>}
      {teamModal&&<TeamModal team={teamModal} onClose={()=>setTeamModal(null)}/>}
    </div></>
  );
}
