import { useState, useEffect, useCallback, useRef } from "react";

const SK='v12_';
function load(k,def){try{const v=localStorage.getItem(SK+k);return v?JSON.parse(v):def;}catch{return def;}}
function save(k,v){try{localStorage.setItem(SK+k,JSON.stringify(v));}catch{}}

const CATS={
  general:{label:'General',color:'#1d4ed8',bg:'#eff6ff',emoji:'🌐'},
  sports:{label:'Sports',color:'#d97706',bg:'#fef3c7',emoji:'🏆'},
  business:{label:'Business',color:'#16a34a',bg:'#f0fdf4',emoji:'⚡'},
  finance:{label:'Finance',color:'#7c3aed',bg:'#f5f3ff',emoji:'📈'},
  bloom:{label:'Bloom Energy',color:'#0369a1',bg:'#e0f2fe',emoji:'🔋'},
  houston:{label:'Houston',color:'#b45309',bg:'#fffbeb',emoji:'🤠'},
  briefing:{label:'Briefing',color:'#92400e',bg:'#fef3c7',emoji:'☀️'},
  podcasts:{label:'Podcasts',color:'#e11d48',bg:'#fff1f2',emoji:'🎙️'},
  social:{label:'Social',color:'#0ea5e9',bg:'#e0f2fe',emoji:'📱'},
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

function readTime(desc){
  if(!desc)return'1 min';
  return`${Math.max(1,Math.round((desc||'').split(' ').length/200))} min read`;
}

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
    const r=await Promise.race([fetch(`/api/rss?url=${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    if(r.ok){const txt=await r.text();const items=parseXML(txt);if(items.length>0)return items;}
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`),new Promise((_,rej)=>setTimeout(()=>rej('t'),8000))]);
    const d=await r.json();
    if(d.status==='ok'&&d.items?.length>0){
      return d.items.map(i=>({
        title:(i.title||'').trim(),link:i.link||'',
        desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,350),
        pubDate:i.pubDate||'',img:i.thumbnail||extractImg(i.description||'')||'',duration:i.itunes_duration||''
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
  return[];
}

async function fetchPodcast(url){
  try{
    const r=await Promise.race([fetch(`/api/rss?url=${encodeURIComponent(url)}`),new Promise((_,rej)=>setTimeout(()=>rej('t'),12000))]);
    if(r.ok){const txt=await r.text();const items=parseXML(txt);if(items.length>0)return items;}
  }catch{}
  try{
    const r=await Promise.race([fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=10`),new Promise((_,rej)=>setTimeout(()=>rej('t'),12000))]);
    const d=await r.json();
    if(d.status==='ok'&&d.items?.length>0){
      return d.items.map(i=>({
        title:(i.title||'').trim(),link:i.link||i.enclosure?.link||'',
        desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim().slice(0,400),
        pubDate:i.pubDate||'',img:i.thumbnail||d.feed?.image||'',duration:i.itunes_duration||''
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
    if(diff<604800)return`${dayName} · ${mon} ${date}`;
    return`${mon} ${date}`;
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

const DEFAULT_YT_CHANNELS=[
  {name:'ESPN',channelId:'UCiWLfSweyRNmLpgEHekhoAg',category:'sports',emoji:'🏈'},
  {name:'NFL',channelId:'UCB12jqis1Ml8NQoOzLjycBg',category:'sports',emoji:'🏈'},
  {name:'MLB',channelId:'UCoLrcjPV5PbUrUyXf5MJ7Xw',category:'sports',emoji:'⚾'},
  {name:'Bleacher Report',channelId:'UCNSxRCbCkFYmCqQxn0xMHBQ',category:'sports',emoji:'🏆'},
  {name:'Kentucky Athletics',channelId:'UCqr_Kp7GCmN0KHFiXcwmIoA',category:'sports',emoji:'🔵'},
  {name:'Houston Astros',channelId:'UCZFNnLMjfBaFaOBLDLzNGLw',category:'sports',emoji:'⭐'},
  {name:'Fox News',channelId:'UCXIJgqnII2ZOINSWNOGFThA',category:'news',emoji:'🦊'},
  {name:'Fox Business',channelId:'UCF9IOB2TExg3QIBupFtBDxg',category:'news',emoji:'📈'},
  {name:'Newsmax',channelId:'UCx6h-dWzJ5NpAlja1YsApdg',category:'news',emoji:'📡'},
  {name:'Breitbart',channelId:'UCysEngjfeIYapEER9K8aikQ',category:'news',emoji:'🔴'},
  {name:'Epoch Times',channelId:'UC0q_0GVd3KCLT5KRXmW4GFQ',category:'news',emoji:'📰'},
  {name:'Tim Pool',channelId:'UCG749Dj4V2fKa143f8sE60Q',category:'news',emoji:'🎩'},
  {name:'Redacted',channelId:'UCf7pMDKGvvfTbSoKzHaAqsA',category:'news',emoji:'📢'},
  {name:'Tucker Carlson',channelId:'UCNjKf5DkSgSWWm5_xCu9jXQ',category:'news',emoji:'🦅'},
  {name:'Russell Brand',channelId:'UCo3HvSHyMxBShmdSrWe-C-A',category:'news',emoji:'🎭'},
  {name:'Jimmy Dore',channelId:'UC3M7l8ved_rYQ45AVzS0RGA',category:'news',emoji:'🎤'},
  {name:'Matt Walsh',channelId:'UCnf5N4G4_m8x7M30s0fL9rQ',category:'news',emoji:'✝️'},
  {name:'Glenn Beck',channelId:'UCyVZ9bBIyGFJRyXMNYAhBhQ',category:'news',emoji:'📻'},
  {name:'Timcast IRL',channelId:'UCe02lGcO-ahAURWuxAJnjdA',category:'news',emoji:'⏱️'},
  {name:'CNBC',channelId:'UCvJJ_dzjViJCoLf5uKUTwoA',category:'business',emoji:'💹'},
  {name:'Bloomberg',channelId:'UCIALMKvObZNtJ6AmdCLP7Lg',category:'business',emoji:'📊'},
  {name:'Bloom Energy',channelId:'UCyC3mAfSGJb2-woJMHMjEAg',category:'business',emoji:'🔋'},
  {name:'Patrick Bet-David',channelId:'UCZFv3YtBD7nHfuRKKiOuFyA',category:'business',emoji:'💼'},
  {name:'Valuetainment',channelId:'UCnqv3pfaYorwvsqpia6lMrg',category:'business',emoji:'💰'},
  {name:'Lex Fridman',channelId:'UCSHZKyawb77ixDdsGog4iWA',category:'tech',emoji:'🤖'},
  {name:'Two Minute Papers',channelId:'UCbfYPyITQ-7l4upoX8nvctg',category:'tech',emoji:'📄'},
  {name:'AI Explained',channelId:'UCNJ1Ymd5yFuUPtn21xtRbbw',category:'tech',emoji:'🧠'},
  {name:'Fireship',channelId:'UCsBjURrPoezykLs9EqgamOA',category:'tech',emoji:'🔥'},
  {name:'My First Million',channelId:'UCuZTEW7HmYBYFjXBJKn3o1g',category:'entrepreneur',emoji:'💡'},
  {name:'Gary Vee',channelId:'UCktlDNRTv9plsRbv45rBgaw',category:'entrepreneur',emoji:'🍷'},
  {name:'Alex Hormozi',channelId:'UCg6IE5tCQzByFBWzj7UNtBw',category:'entrepreneur',emoji:'💪'},
  {name:'Joe Rogan',channelId:'UCnxGkOGNMqe8UqkJsVKwrdg',category:'podcasts',emoji:'🟢'},
  {name:'Ben Shapiro',channelId:'UCnQC_G5Yjc2jCQpvNwznBXQ',category:'podcasts',emoji:'🔵'},
  {name:'All-In Podcast',channelId:'UCESLZhusAkFfsNsApnjF_Cg',category:'podcasts',emoji:'💰'},
  {name:'Candace Owens',channelId:'UCD3A_pR3PooOOXHm4F4lEAA',category:'podcasts',emoji:'🎤'},
  {name:'Morning Wire',channelId:'UCSTJcXGMFgHlSq2gTLIXNBA',category:'podcasts',emoji:'☀️'},
  {name:'Andrew Schulz',channelId:'UCzWQYUVCpZqtN93H8RR44Qw',category:'podcasts',emoji:'🔥'},
];

const YT_CATEGORIES=[
  {id:'all',label:'All',emoji:'📱'},
  {id:'news',label:'News & Politics',emoji:'🗞️'},
  {id:'sports',label:'Sports',emoji:'🏆'},
  {id:'business',label:'Business',emoji:'⚡'},
  {id:'tech',label:'Tech & AI',emoji:'🤖'},
  {id:'entrepreneur',label:'Entrepreneurship',emoji:'💡'},
  {id:'podcasts',label:'Podcasts',emoji:'🎙️'},
];

const DEFAULT_TWITTER=[
  {handle:'HoustonTexans',label:'Houston Texans',emoji:'🏈',category:'sports'},
  {handle:'astros',label:'Houston Astros',emoji:'⭐',category:'sports'},
  {handle:'KentuckyMBB',label:'Kentucky Basketball',emoji:'🔵',category:'sports'},
  {handle:'ClemsonFB',label:'Clemson Football',emoji:'🐅',category:'sports'},
  {handle:'BloomEnergy',label:'Bloom Energy',emoji:'🔋',category:'business'},
  {handle:'ExxonMobil',label:'ExxonMobil',emoji:'⚡',category:'business'},
  {handle:'Lex_Fridman',label:'Lex Fridman',emoji:'🤖',category:'tech'},
  {handle:'TimPool',label:'Tim Pool',emoji:'🎩',category:'news'},
  {handle:'TuckerCarlson',label:'Tucker Carlson',emoji:'🦅',category:'news'},
  {handle:'PatrickBetDavid',label:'Patrick Bet-David',emoji:'💼',category:'business'},
  {handle:'AlexHormozi',label:'Alex Hormozi',emoji:'💪',category:'entrepreneur'},
  {handle:'realDonaldTrump',label:'Donald Trump',emoji:'🇺🇸',category:'news'},
];

const DEFAULT_LINKEDIN=[
  {name:'Bloom Energy',url:'https://www.linkedin.com/company/bloom-energy',emoji:'🔋',category:'energy'},
  {name:'ExxonMobil',url:'https://www.linkedin.com/company/exxonmobil',emoji:'⚡',category:'energy'},
  {name:'Valero Energy',url:'https://www.linkedin.com/company/valero-energy',emoji:'🛢️',category:'energy'},
  {name:'Marathon Petroleum',url:'https://www.linkedin.com/company/marathon-petroleum',emoji:'⛽',category:'energy'},
  {name:'Chevron',url:'https://www.linkedin.com/company/chevron',emoji:'🔵',category:'energy'},
  {name:'Stepan Company',url:'https://www.linkedin.com/company/stepan-company',emoji:'🧪',category:'energy'},
  {name:'OpenAI',url:'https://www.linkedin.com/company/openai',emoji:'🤖',category:'tech'},
  {name:'Anthropic',url:'https://www.linkedin.com/company/anthropic',emoji:'🧠',category:'tech'},
  {name:'NVIDIA',url:'https://www.linkedin.com/company/nvidia',emoji:'💚',category:'tech'},
  {name:'Microsoft',url:'https://www.linkedin.com/company/microsoft',emoji:'🪟',category:'tech'},
];

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
  {name:'Bloomberg',url:'https://feeds.bloomberg.com/politics/news.rss',emoji:'📊',color:'#1d4ed8',desc:'Markets & politics'},
  {name:'Morning Brew',url:'https://feeds.feedburner.com/morningbrew/uqaH',emoji:'☕',color:'#2563eb',desc:'Business & tech digest'},
  {name:'Morning Wire',url:'https://feeds.megaphone.fm/BVDWV8747925072',emoji:'📻',color:'#7c3aed',desc:'Daily Wire briefing'},
  {name:'API Brief',url:'https://feeds.feedburner.com/ApiToday',emoji:'🛢️',color:'#92400e',desc:'American Petroleum Institute'},
];

const HOUSTON_FEEDS=[
  {name:'KHOU Houston',url:'https://www.khou.com/feeds/syndication/rss/news',on:true},
  {name:'Click2Houston',url:'https://www.click2houston.com/rss/news.rss',on:true},
  {name:'Chron.com',url:'https://www.chron.com/rss/feed/News-270.php',on:true},
  {name:'Axios Houston',url:'https://api.axios.com/feed/houston/',on:true},
];

const DEFAULT_KW={
  general:['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NCAAB','NCAAF','recruiting'],
  business:['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  briefing:['energy','Houston','economy','markets','AI','tariffs','Fed','oil','gas','tech','petroleum','pipeline'],
  houston:['Houston','Harris County','HISD','mayor','Astros','Texans','weather','flooding','rodeo'],
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
    {name:'Golf Channel',url:'https://www.golfchannel.com/rss/news',on:true},
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
  ],
};

const WX_CODES={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',80:'Showers',95:'Thunderstorm'};
const WX_EMOJI={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',80:'🌦️',95:'⛈️'};
const SPORT_TABS=[{id:'mlb',label:'MLB',emoji:'⚾'},{id:'nfl',label:'NFL',emoji:'🏈'},{id:'ncaab',label:'NCAAB',emoji:'🏀'},{id:'ncaaf',label:'NCAAF',emoji:'🏈'},{id:'golf',label:'Golf',emoji:'⛳'}];

const css=`
*{box-sizing:border-box;margin:0;padding:0;}
:root{--bg:#f0f2f5;--surface:#fff;--surface2:#f8f9fa;--border:#e2e5ea;--border2:#f0f2f5;--text:#0d1117;--text2:#57606a;--text3:#8b949e;--nav:#fff;--search:#f0f2f5;--accent:#1d4ed8;--hero-h:420px;--card-radius:12px;}
.dark{--bg:#0d1117;--surface:#161b22;--surface2:#21262d;--border:#30363d;--border2:#21262d;--text:#e6edf3;--text2:#8b949e;--text3:#484f58;--nav:#161b22;--search:#21262d;}
html{scroll-behavior:smooth;}
body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;color:var(--text);transition:background 0.2s;}
.hub{min-height:100vh;}
.topbar{background:var(--nav);border-bottom:1px solid var(--border);padding:0 16px;position:sticky;top:0;z-index:300;box-shadow:0 1px 8px rgba(0,0,0,0.06);}
.topbar-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:10px;height:52px;}
.logo{font-size:17px;font-weight:800;color:var(--text);flex-shrink:0;letter-spacing:-0.5px;}
.logo span{color:#1d4ed8;}
.logo-dot{width:6px;height:6px;border-radius:50%;background:#e11d48;display:inline-block;margin-left:2px;vertical-align:middle;}
.nav-tabs{display:flex;gap:1px;flex:1;overflow-x:auto;scrollbar-width:none;}
.nav-tabs::-webkit-scrollbar{display:none;}
.nav-tab{background:transparent;border:none;color:var(--text3);padding:6px 11px;cursor:pointer;font-size:12px;font-weight:500;white-space:nowrap;font-family:inherit;border-radius:8px;transition:all 0.12s;}
.nav-tab.active{color:var(--accent);background:#eff6ff;font-weight:600;}
.nav-tab:hover:not(.active){color:var(--text2);background:var(--search);}
.topbar-right{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.search-wrap{position:relative;}
.search{background:var(--search);border:1px solid var(--border);color:var(--text);border-radius:20px;padding:6px 12px 6px 32px;font-size:12px;width:150px;font-family:inherit;transition:width 0.2s;}
.search:focus{outline:none;border-color:var(--accent);width:200px;}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--text3);pointer-events:none;}
.btn-icon{background:var(--search);border:1px solid var(--border);color:var(--text2);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:13px;font-family:inherit;}
.btn-blue{background:var(--accent);border:none;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;}
.compact-toggle{background:var(--search);border:1px solid var(--border);color:var(--text2);border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-family:inherit;font-weight:500;}
.wx-bar{background:linear-gradient(135deg,#1e3a5f,#0369a1);padding:6px 16px;overflow-x:auto;scrollbar-width:none;}
.wx-bar::-webkit-scrollbar{display:none;}
.wx-inner{max-width:1400px;margin:0 auto;display:flex;gap:20px;align-items:center;}
.wx-city{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.wx-emoji{font-size:18px;}
.wx-info{display:flex;flex-direction:column;}
.wx-name{font-size:10px;color:rgba(255,255,255,0.7);font-weight:500;text-transform:uppercase;letter-spacing:0.06em;}
.wx-temp{font-size:15px;font-weight:700;color:#fff;}
.wx-cond{font-size:10px;color:rgba(255,255,255,0.8);}
.wx-divider{width:1px;height:28px;background:rgba(255,255,255,0.2);flex-shrink:0;}
.wx-detail{font-size:10px;color:rgba(255,255,255,0.75);display:flex;align-items:center;gap:4px;}
.wx-add{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;font-family:inherit;}
.ticker{background:#0d1117;padding:5px 0;overflow:hidden;}
.ticker-inner{display:flex;align-items:center;}
.ticker-label{background:#e11d48;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;letter-spacing:0.08em;white-space:nowrap;flex-shrink:0;margin-right:12px;}
.ticker-track{display:flex;white-space:nowrap;animation:ticker 40s linear infinite;}
.ticker-track:hover{animation-play-state:paused;}
@keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.ticker-item{font-size:11px;color:#e6edf3;padding:0 24px;display:inline-block;cursor:pointer;}
.ticker-sep{color:#e11d48;padding:0 4px;}
.breaking{background:#dc2626;display:none;padding:6px 16px;}
.breaking.show{display:block;}
.breaking-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:10px;}
.breaking-badge{background:#fff;color:#dc2626;font-size:9px;font-weight:800;border-radius:4px;padding:2px 6px;animation:pulse-badge 1.5s infinite;}
@keyframes pulse-badge{0%,100%{opacity:1;}50%{opacity:0.7;}}
.breaking-text{font-size:11px;color:#fff;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.breaking-x{background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:14px;}
.hero-carousel{position:relative;height:var(--hero-h);overflow:hidden;background:#0d1117;}
.hero-slide{position:absolute;inset:0;opacity:0;transition:opacity 0.6s ease;}
.hero-slide.active{opacity:1;}
.hero-bg{width:100%;height:100%;object-fit:cover;display:block;}
.hero-bg-ph{width:100%;height:100%;background:linear-gradient(135deg,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;font-size:64px;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.4) 50%,rgba(0,0,0,0.1) 100%);}
.hero-content{position:absolute;bottom:0;left:0;right:0;padding:24px 28px;}
.hero-cat{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border-radius:4px;padding:2px 8px;margin-bottom:10px;}
.hero-title{font-size:clamp(18px,3vw,28px);font-weight:800;color:#fff;line-height:1.25;margin-bottom:8px;letter-spacing:-0.3px;text-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer;}
.hero-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.hero-src{font-size:11px;color:rgba(255,255,255,0.8);font-weight:500;}
.hero-date{font-size:11px;color:rgba(255,255,255,0.6);}
.hero-acts{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.hero-act{background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.25);color:#fff;border-radius:6px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500;transition:all 0.12s;}
.hero-act:hover{background:rgba(255,255,255,0.25);}
.hero-act.ai{border-color:#a78bfa;color:#a78bfa;}
.hero-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);border:none;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;}
.hero-nav.prev{left:14px;}
.hero-nav.next{right:14px;}
.hero-dots{position:absolute;bottom:14px;right:20px;display:flex;gap:5px;}
.hero-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.4);cursor:pointer;transition:all 0.2s;}
.hero-dot.active{background:#fff;width:18px;border-radius:3px;}
.main{max-width:1400px;margin:0 auto;padding:16px;display:grid;grid-template-columns:1fr 300px;gap:16px;}
.main-feed{display:flex;flex-direction:column;gap:16px;}
.sidebar-col{display:flex;flex-direction:column;gap:14px;}
.trending-bar{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);padding:10px 14px;display:flex;align-items:center;gap:10px;overflow-x:auto;scrollbar-width:none;}
.trending-bar::-webkit-scrollbar{display:none;}
.trending-lbl{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;flex-shrink:0;}
.trend-chip{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;color:var(--text2);transition:all 0.12s;flex-shrink:0;}
.trend-chip:hover,.trend-chip.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.follow-section{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);padding:14px;}
.follow-title{font-size:11px;font-weight:700;color:var(--text);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em;}
.follow-pills{display:flex;flex-wrap:wrap;gap:6px;}
.follow-pill{display:flex;align-items:center;gap:5px;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface2);color:var(--text2);transition:all 0.12s;}
.follow-pill:hover{border-color:var(--accent);color:var(--accent);}
.follow-pill.following{background:var(--accent);color:#fff;border-color:var(--accent);}
.section{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;}
.section-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border2);}
.section-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--text);}
.section-dot{width:8px;height:8px;border-radius:50%;}
.section-count{font-size:10px;color:var(--text3);background:var(--surface2);border-radius:10px;padding:1px 7px;border:1px solid var(--border);}
.section-actions{display:flex;gap:6px;align-items:center;}
.see-all{font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-family:inherit;font-weight:500;}
.h-row{display:flex;gap:10px;overflow-x:auto;padding:12px 16px;scrollbar-width:none;}
.h-row::-webkit-scrollbar{display:none;}
.h-arrow{background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;flex-shrink:0;align-self:center;}
.h-arrow:hover{background:var(--accent);color:#fff;border-color:var(--accent);}
.pic-card{flex-shrink:0;width:220px;border-radius:10px;overflow:hidden;cursor:pointer;position:relative;background:#1e293b;transition:transform 0.15s,box-shadow 0.15s;}
.pic-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.15);}
.pic-card.wide{width:280px;}
.pic-card-img{width:100%;height:140px;object-fit:cover;display:block;}
.pic-card-img-ph{width:100%;height:140px;display:flex;align-items:center;justify-content:center;font-size:36px;background:linear-gradient(135deg,#1e293b,#0f172a);}
.pic-card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 55%,rgba(0,0,0,0) 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:10px;}
.pic-card-cat{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-radius:4px;padding:2px 6px;margin-bottom:5px;align-self:flex-start;}
.pic-card-title{font-size:12px;font-weight:700;color:#fff;line-height:1.3;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,0.5);}
.pic-card-meta{display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap;}
.pic-card-src{font-size:10px;color:rgba(255,255,255,0.75);font-weight:500;}
.pic-card-time{font-size:9px;color:rgba(255,255,255,0.55);}
.pic-card-acts{display:flex;gap:4px;margin-top:6px;}
.pic-act{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:4px;padding:2px 7px;font-size:9px;cursor:pointer;font-family:inherit;}
.pic-act:hover{background:rgba(255,255,255,0.3);}
.pic-act.saved{border-color:#f59e0b;color:#f59e0b;}
.pic-act.ai{border-color:#a78bfa;color:#a78bfa;}
.feed-card{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all 0.12s;display:flex;flex-direction:column;}
.feed-card:hover{border-color:#bfdbfe;box-shadow:0 2px 16px rgba(29,78,216,0.08);}
.feed-hero-wrap{position:relative;overflow:hidden;}
.feed-hero-img{width:100%;height:200px;object-fit:cover;display:block;transition:transform 0.3s;}
.feed-card:hover .feed-hero-img{transform:scale(1.02);}
.feed-hero-ph{width:100%;height:120px;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,var(--surface2),var(--bg));}
.feed-hero-gradient{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);}
.feed-cat-badge{position:absolute;top:10px;left:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;border-radius:4px;padding:2px 7px;}
.feed-read-badge{position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);color:#fff;font-size:9px;border-radius:4px;padding:2px 6px;}
.feed-card-body{padding:12px 14px 14px;flex:1;display:flex;flex-direction:column;}
.feed-top-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;}
.feed-av{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;flex-shrink:0;}
.feed-src{font-size:11px;font-weight:600;}
.feed-date{font-size:10px;color:var(--text3);margin-left:auto;}
.feed-title{font-size:15px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:6px;letter-spacing:-0.2px;}
.feed-desc{font-size:12px;color:var(--text2);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;flex:1;}
.feed-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-top:auto;}
.feed-kws{display:flex;gap:4px;flex-wrap:wrap;}
.feed-acts{display:flex;gap:3px;}
.act-b{background:none;border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;transition:all 0.12s;}
.act-b:hover{border-color:var(--accent);color:var(--accent);}
.act-b.al{border-color:var(--accent);color:var(--accent);background:#eff6ff;}
.act-b.as{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.act-b.ad{border-color:#ef4444;color:#ef4444;background:#fef2f2;}
.act-b.ai{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.kw-tag{font-size:9px;border-radius:8px;padding:1px 5px;font-weight:500;}
.alert-tag{background:#fef2f2;color:#dc2626;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;}
.summary-box{background:var(--bg);border:1px solid #7c3aed;border-radius:8px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--text2);line-height:1.6;}
.summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
.compact-card{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.compact-card:hover{background:var(--surface2);}
.compact-card:last-child{border-bottom:none;}
.compact-thumb{width:56px;height:42px;border-radius:6px;object-fit:cover;flex-shrink:0;}
.compact-thumb-ph{width:56px;height:42px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--surface2);}
.compact-body{flex:1;min-width:0;}
.compact-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.3;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.compact-meta{font-size:10px;color:var(--text3);display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
.compact-acts{display:flex;gap:3px;margin-top:4px;}
.mini-act{background:none;border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-size:9px;cursor:pointer;color:var(--text3);font-family:inherit;}
.mini-act.al{border-color:var(--accent);color:var(--accent);}
.mini-act.as{border-color:#f59e0b;color:#f59e0b;}
.scores-section{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;}
.scores-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border2);background:linear-gradient(135deg,#0d1117,#1e293b);}
.scores-title{font-size:13px;font-weight:700;color:#fff;}
.scores-refresh{font-size:10px;color:rgba(255,255,255,0.6);}
.sport-tabs{display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--border);}
.sport-tabs::-webkit-scrollbar{display:none;}
.sport-tab{background:none;border:none;padding:8px 14px;font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;color:var(--text3);border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.12s;}
.sport-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600;}
.scores-list{padding:0;}
.score-card{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border2);gap:10px;}
.score-card:last-child{border-bottom:none;}
.score-teams{flex:1;display:flex;flex-direction:column;gap:4px;}
.score-team{display:flex;align-items:center;gap:8px;}
.score-team-emoji{font-size:16px;width:24px;text-align:center;}
.score-team-name{font-size:12px;font-weight:600;color:var(--text);flex:1;}
.score-team-score{font-size:14px;font-weight:800;color:var(--text);min-width:24px;text-align:right;}
.score-team-score.winning{color:#16a34a;}
.score-status{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0;}
.score-status.live{background:#fef2f2;color:#dc2626;animation:pulse-live 1.5s infinite;}
.score-status.final{background:var(--surface2);color:var(--text3);}
.score-status.sched{background:#eff6ff;color:var(--accent);}
@keyframes pulse-live{0%,100%{opacity:1;}50%{opacity:0.6;}}
.scores-empty{padding:20px;text-align:center;font-size:12px;color:var(--text3);}
.side-block{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);padding:14px;}
.side-title{font-size:11px;font-weight:700;color:var(--text);margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border2);text-transform:uppercase;letter-spacing:0.06em;}
.trend-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.trend-row:last-child{border-bottom:none;}
.trend-n{font-size:14px;font-weight:800;color:var(--border);min-width:18px;line-height:1.2;}
.trend-t{font-size:11px;font-weight:500;color:var(--text);line-height:1.3;}
.trend-s{font-size:10px;color:var(--text3);margin-top:1px;}
.kw-chip{display:inline-block;border-radius:20px;padding:4px 10px;font-size:11px;margin:2px;cursor:pointer;font-weight:500;transition:all 0.12s;border:1px solid transparent;}
.kw-chip.kw-active{outline:2px solid currentColor;outline-offset:1px;font-weight:600;}
.social-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.social-row:last-child{border-bottom:none;}
.social-av{width:26px;height:26px;border-radius:50%;background:#1d9bf0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;flex-shrink:0;}
.social-name{font-size:11px;color:var(--text);font-weight:500;}
.social-arr{font-size:10px;color:var(--text3);margin-left:auto;}
.read-later-item{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.read-later-item:last-child{border-bottom:none;}
.rl-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:4px;}
.rl-title{font-size:11px;color:var(--text);line-height:1.3;flex:1;}
.rl-src{font-size:10px;color:var(--text3);}
.saved-empty{text-align:center;padding:60px 20px;color:var(--text3);}
.read-later-banner{background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:var(--card-radius);padding:12px 16px;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
.rl-banner-icon{font-size:24px;}
.rl-banner-text{flex:1;}
.rl-banner-title{font-size:13px;font-weight:600;color:#fff;}
.rl-banner-sub{font-size:11px;color:rgba(255,255,255,0.8);}
.brief-page{display:grid;grid-template-columns:1fr 260px;gap:16px;}
.brief-banner{background:linear-gradient(135deg,#92400e,#d97706);border-radius:var(--card-radius);padding:14px 18px;margin-bottom:12px;display:flex;align-items:center;gap:12px;}
.brief-banner-icon{font-size:28px;}
.brief-banner-body{flex:1;}
.brief-banner-title{font-size:13px;font-weight:600;color:#fff;margin-bottom:2px;}
.brief-banner-sub{font-size:11px;color:rgba(255,255,255,0.85);}
.brief-source-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;}
.brief-tab-btn{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500;color:var(--text2);transition:all 0.12s;}
.brief-tab-btn.active{background:#fffbeb;border-color:#d97706;font-weight:600;color:#92400e;}
.brief-card{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all 0.12s;margin-bottom:10px;}
.brief-card:hover{border-color:#fcd34d;}
.brief-card-img{width:100%;height:160px;object-fit:cover;display:block;}
.brief-card-img-ph{width:100%;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--surface2);}
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
.pod-show-header{background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:var(--card-radius);padding:14px 18px;display:flex;align-items:center;gap:12px;}
.pod-show-emoji{font-size:28px;}
.pod-show-info{flex:1;}
.pod-show-name{font-size:13px;font-weight:700;color:#fff;}
.pod-show-host{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;}
.pod-card{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;transition:all 0.12s;}
.pod-card:hover{border-color:#fda4af;}
.pod-card-img{width:100%;height:140px;object-fit:cover;display:block;}
.pod-card-img-ph{width:100%;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--surface2);}
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
.mini-player{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;margin-top:8px;display:flex;align-items:center;gap:10px;}
.mini-player audio{flex:1;height:28px;accent-color:#e11d48;}
.pod-sidebar{display:flex;flex-direction:column;gap:10px;}
.pod-show-list{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);padding:14px;}
.pod-show-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.pod-show-item:last-child{border-bottom:none;}
.pod-show-item-emoji{font-size:18px;width:28px;text-align:center;}
.pod-show-item-info{flex:1;min-width:0;}
.pod-show-item-name{font-size:12px;font-weight:600;color:var(--text);}
.pod-show-item-ep{font-size:10px;color:var(--text3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pod-show-item-dot{width:6px;height:6px;border-radius:50%;background:#e11d48;flex-shrink:0;}
.social-page{max-width:1400px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:16px;}
.social-header{background:linear-gradient(135deg,#0369a1,#0ea5e9);border-radius:var(--card-radius);padding:16px 20px;display:flex;align-items:center;gap:14px;}
.social-header-icon{font-size:32px;}
.social-header-body{flex:1;}
.social-header-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;}
.social-header-sub{font-size:12px;color:rgba(255,255,255,0.85);}
.social-network-section{background:var(--surface);border-radius:var(--card-radius);border:1px solid var(--border);overflow:hidden;}
.social-net-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border2);cursor:pointer;}
.social-net-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--text);}
.social-net-badge{font-size:10px;background:var(--surface2);color:var(--text3);border-radius:10px;padding:1px 8px;border:1px solid var(--border);}
.social-net-toggle{font-size:12px;color:var(--text3);transition:transform 0.2s;}
.social-net-toggle.open{transform:rotate(180deg);}
.yt-filter-tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:10px 16px;border-bottom:1px solid var(--border2);}
.yt-filter-tabs::-webkit-scrollbar{display:none;}
.yt-filter-tab{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:3px 10px;font-size:11px;cursor:pointer;white-space:nowrap;color:var(--text2);font-family:inherit;font-weight:500;transition:all 0.12s;flex-shrink:0;}
.yt-filter-tab.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.yt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:14px 16px;}
.yt-card{background:var(--surface2);border-radius:10px;border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all 0.12s;}
.yt-card:hover{border-color:#bfdbfe;box-shadow:0 2px 12px rgba(29,78,216,0.08);transform:translateY(-1px);}
.yt-thumb{width:100%;height:148px;object-fit:cover;display:block;}
.yt-thumb-ph{width:100%;height:148px;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,#1e293b,#0f172a);}
.yt-card-body{padding:10px 12px 12px;}
.yt-channel-row{display:flex;align-items:center;gap:6px;margin-bottom:5px;}
.yt-channel-emoji{font-size:14px;}
.yt-channel-name{font-size:10px;font-weight:600;color:#e11d48;}
.yt-card-date{font-size:10px;color:var(--text3);margin-left:auto;}
.yt-card-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.yt-card-desc{font-size:11px;color:var(--text2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;}
.yt-card-acts{display:flex;gap:4px;flex-wrap:wrap;}
.yt-act{background:none;border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:10px;cursor:pointer;color:var(--text3);font-family:inherit;transition:all 0.12s;}
.yt-act:hover{border-color:#e11d48;color:#e11d48;}
.yt-act.watch{border-color:#e11d48;color:#e11d48;background:#fff1f2;}
.yt-act.ai{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.yt-act.saved{border-color:#f59e0b;color:#f59e0b;background:#fffbeb;}
.tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;padding:14px 16px;}
.tw-card{background:var(--surface2);border-radius:10px;border:1px solid var(--border);padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:all 0.12s;}
.tw-card:hover{border-color:#1d9bf0;}
.tw-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1d9bf0,#0369a1);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;}
.tw-handle{font-size:13px;font-weight:700;color:var(--text);}
.tw-label{font-size:11px;color:var(--text2);}
.tw-cat{font-size:9px;color:var(--text3);background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1px 7px;}
.tw-open{font-size:11px;color:#1d9bf0;font-weight:500;}
.li-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding:14px 16px;}
.li-card{background:var(--surface2);border-radius:10px;border:1px solid var(--border);padding:14px;cursor:pointer;transition:all 0.12s;}
.li-card:hover{border-color:#0a66c2;}
.li-top{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.li-emoji{font-size:24px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a66c2,#0369a1);border-radius:8px;}
.li-info{flex:1;}
.li-name{font-size:13px;font-weight:700;color:var(--text);}
.li-cat{font-size:10px;color:var(--text3);}
.li-open{font-size:11px;color:#0a66c2;font-weight:500;}
.li-oauth-banner{background:linear-gradient(135deg,#0a66c2,#0369a1);border-radius:10px;padding:12px 16px;margin:14px 16px;display:flex;align-items:center;gap:12px;}
.li-oauth-text{flex:1;}
.li-oauth-title{font-size:12px;font-weight:600;color:#fff;margin-bottom:2px;}
.li-oauth-sub{font-size:10px;color:rgba(255,255,255,0.8);}
.li-oauth-btn{background:#fff;color:#0a66c2;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}
.social-add-form{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border2);}
.social-add-input{flex:1;border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.social-add-input:focus{outline:none;border-color:var(--accent);}
.social-add-btn{background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
.yt-loading{padding:24px;text-align:center;font-size:12px;color:var(--text3);}
.panel-overlay{position:fixed;inset:0;background:rgba(13,17,23,0.6);backdrop-filter:blur(4px);z-index:500;display:none;align-items:center;justify-content:center;padding:20px;}
.panel-overlay.open{display:flex;}
.panel{background:var(--surface);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.2);}
.panel-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.panel-htitle{font-size:15px;font-weight:700;color:var(--text);}
.panel-x{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);}
.panel-body{padding:18px 20px;}
.p-sec{margin-bottom:22px;}
.p-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;}
.p-row{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid var(--border2);gap:8px;}
.p-row:last-of-type{border-bottom:none;}
.p-name{flex:1;font-size:12px;color:var(--text);}
.p-count{font-size:10px;color:var(--text3);white-space:nowrap;}
.p-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:0 2px;}
.p-del:hover{color:#dc2626;}
.tog{width:34px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.tog.on{background:var(--accent);}.tog.off{background:#cbd5e1;}
.tog::after{content:'';width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.2);}
.tog.on::after{left:16px;}.tog.off::after{left:2px;}
.hdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hg{background:#16a34a;}.hy{background:#d97706;}.hr{background:#dc2626;}.hx{background:#94a3b8;}
.hlegend{display:flex;gap:14px;margin-bottom:10px;font-size:10px;color:var(--text3);flex-wrap:wrap;}
.hlegend span{display:flex;align-items:center;gap:4px;}
.p-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:4px 10px;font-size:11px;margin:2px;font-weight:500;}
.p-kw{background:#eff6ff;color:#1d4ed8;}.p-alert{background:#fef2f2;color:#dc2626;}.p-so{background:#f0fdf4;color:#166534;}
.p-chip-x{background:none;border:none;cursor:pointer;font-size:11px;opacity:0.6;}
.p-add{display:flex;gap:6px;margin-top:8px;}
.p-input{flex:1;border:1px solid var(--border);border-radius:8px;padding:7px 12px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.p-input:focus{outline:none;border-color:var(--accent);}
.p-add-btn{background:var(--accent);border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:11px;cursor:pointer;font-weight:600;font-family:inherit;white-space:nowrap;}
.p-alert-btn{background:#dc2626;border:none;color:#fff;border-radius:8px;padding:7px 14px;font-size:11px;cursor:pointer;font-weight:600;font-family:inherit;}
.p-save{width:100%;background:#0d1117;border:none;color:#fff;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;margin-top:6px;font-family:inherit;}
.alert-info{background:var(--surface2);border-radius:8px;padding:10px 12px;border:1px solid var(--border);margin-bottom:10px;font-size:11px;color:var(--text2);}
.no-art{text-align:center;padding:60px 20px;}
.no-art-msg{font-size:13px;color:var(--text2);margin-bottom:12px;}
.refresh-btn{border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-size:12px;font-weight:600;color:#fff;}
.kw-cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;}
.kw-cat-tab{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:500;}
.kw-cat-tab.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.add-src-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:10px;}
.add-src-lbl{font-size:10px;font-weight:600;color:var(--text2);margin-bottom:8px;}
.p-input-sm{border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);width:100%;margin-bottom:6px;}
.p-input-sm:focus{outline:none;border-color:var(--accent);}
.test-btn{background:var(--surface2);border:1px solid var(--border);color:var(--text2);border-radius:6px;padding:5px 10px;font-size:10px;cursor:pointer;font-family:inherit;}
.tresult{font-size:10px;margin-top:6px;padding:5px 8px;border-radius:5px;}
.tok{background:#f0fdf4;color:#16a34a;}.tfail{background:#fef2f2;color:#dc2626;}.tload{background:var(--surface2);color:var(--text3);}
.loading-state{padding:24px;text-align:center;font-size:11px;color:var(--text3);}
@media(max-width:900px){.main{grid-template-columns:1fr;padding:10px;}.sidebar-col{display:none;}.pod-page{grid-template-columns:1fr;}.pod-sidebar{display:none;}.brief-page{grid-template-columns:1fr;}.brief-sidebar{display:none;}:root{--hero-h:320px;}.pic-card{width:180px;}.pic-card.wide{width:220px;}.yt-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.topbar-inner{height:46px;}.search{width:110px;}:root{--hero-h:260px;}.hero-content{padding:16px;}.hero-title{font-size:16px;}.pic-card{width:160px;}.yt-grid{grid-template-columns:1fr;}.tw-grid{grid-template-columns:1fr 1fr;}.li-grid{grid-template-columns:1fr;}}
`;
function ScoresSection(){
  const[sport,setSport]=useState('mlb');
  const[scores,setScores]=useState({});
  const[loading,setLoading]=useState({});
  const[lastUpdate,setLastUpdate]=useState(null);
  const timerRef=useRef(null);
  const fetchScores=useCallback(async(sportId)=>{
    setLoading(l=>({...l,[sportId]:true}));
    try{
      const sportMap={mlb:'baseball/mlb',nfl:'football/nfl',ncaab:'basketball/mens-college-basketball',ncaaf:'football/college-football',golf:'golf/pga'};
      const resp=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportMap[sportId]}/scoreboard`);
      if(!resp.ok)throw new Error('failed');
      const data=await resp.json();
      const events=(data.events||[]).slice(0,8).map(e=>{
        const comp=e.competitions?.[0];
        const home=comp?.competitors?.find(c=>c.homeAway==='home');
        const away=comp?.competitors?.find(c=>c.homeAway==='away');
        const detail=comp?.status?.type?.shortDetail||comp?.status?.type?.description||'';
        const isLive=comp?.status?.type?.state==='in';
        const isFinal=comp?.status?.type?.completed;
        return{id:e.id,homeTeam:home?.team?.shortDisplayName||'',homeScore:home?.score||'',awayTeam:away?.team?.shortDisplayName||'',awayScore:away?.score||'',detail,isLive,isFinal,homeWinning:isFinal&&parseInt(home?.score||0)>parseInt(away?.score||0),awayWinning:isFinal&&parseInt(away?.score||0)>parseInt(home?.score||0)};
      });
      setScores(s=>({...s,[sportId]:events}));setLastUpdate(new Date());
    }catch{setScores(s=>({...s,[sportId]:[]}));}
    setLoading(l=>({...l,[sportId]:false}));
  },[]);
  useEffect(()=>{fetchScores(sport);if(timerRef.current)clearInterval(timerRef.current);timerRef.current=setInterval(()=>fetchScores(sport),90000);return()=>{if(timerRef.current)clearInterval(timerRef.current);};},[sport,fetchScores]);
  const games=scores[sport]||[];
  return(
    <div className="scores-section">
      <div className="scores-head"><div className="scores-title">🏟️ Live Scores</div><div className="scores-refresh">{lastUpdate?`Updated ${fmtDate(lastUpdate)}`:'Auto-refreshes 90s'}</div></div>
      <div className="sport-tabs">{SPORT_TABS.map(s=><button key={s.id} className={`sport-tab${sport===s.id?' active':''}`} onClick={()=>setSport(s.id)}>{s.emoji} {s.label}</button>)}</div>
      <div className="scores-list">
        {loading[sport]?<div className="scores-empty">Loading...</div>:games.length===0?<div className="scores-empty">{sport==='ncaaf'?'NCAAF season Aug-Jan':'No games today'}</div>:
        games.map((g,i)=>(
          <div key={i} className="score-card">
            <div className="score-teams">
              <div className="score-team"><span className="score-team-emoji">✈️</span><span className="score-team-name">{g.awayTeam}</span>{g.awayScore!==''&&<span className={`score-team-score${g.awayWinning?' winning':''}`}>{g.awayScore}</span>}</div>
              <div className="score-team"><span className="score-team-emoji">🏠</span><span className="score-team-name">{g.homeTeam}</span>{g.homeScore!==''&&<span className={`score-team-score${g.homeWinning?' winning':''}`}>{g.homeScore}</span>}</div>
            </div>
            <div className={`score-status${g.isLive?' live':g.isFinal?' final':' sched'}`}>{g.isLive?'● LIVE':g.isFinal?'Final':g.detail||'Soon'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherBar(){
  const[weather,setWeather]=useState([]);
  const[cities,setCities]=useState(()=>load('wx_cities',[{name:'Houston, TX',lat:29.7604,lon:-95.3698},{name:'Louisville, KY',lat:38.2527,lon:-85.7585}]));
  useEffect(()=>{
    const fetchAll=async()=>{
      const results=await Promise.all(cities.map(async city=>{
        try{
          const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph`);
          const d=await r.json();const c=d.current;
          return{name:city.name,temp:Math.round(c.temperature_2m),wind:Math.round(c.windspeed_10m),humidity:c.relativehumidity_2m,emoji:WX_EMOJI[c.weathercode]||'🌤️',cond:WX_CODES[c.weathercode]||'Clear'};
        }catch{return{name:city.name,temp:'--',wind:'--',humidity:'--',emoji:'🌤️',cond:'--'};}
      }));
      setWeather(results);
    };
    fetchAll();const t=setInterval(fetchAll,600000);return()=>clearInterval(t);
  },[cities]);
  return(
    <div className="wx-bar">
      <div className="wx-inner">
        {weather.map((w,i)=>(
          <React.Fragment key={w.name}>
            {i>0&&<div className="wx-divider"/>}
            <div className="wx-city"><span className="wx-emoji">{w.emoji}</span><div className="wx-info"><span className="wx-name">{w.name}</span><span className="wx-temp">{w.temp}°F</span><span className="wx-cond">{w.cond}</span></div></div>
            <div className="wx-detail">💧{w.humidity}% 💨{w.wind}mph</div>
          </React.Fragment>
        ))}
        <div className="wx-divider"/>
        <button className="wx-add" onClick={()=>{const name=prompt('City name:');const lat=parseFloat(prompt('Latitude:'));const lon=parseFloat(prompt('Longitude:'));if(name&&!isNaN(lat)&&!isNaN(lon)){const u=[...cities,{name,lat,lon}];setCities(u);save('wx_cities',u);}}}>+ Add City</button>
      </div>
    </div>
  );
}

function SocialPage({getSummary,summaries,sumLoading,saveArt,isSaved,readLaterArt,isReadLater}){
  const[ytChannels,setYtChannels]=useState(()=>load('yt_channels',DEFAULT_YT_CHANNELS));
  const[twitterAccounts,setTwitterAccounts]=useState(()=>load('tw_accounts',DEFAULT_TWITTER));
  const[linkedinPages,setLinkedinPages]=useState(()=>load('li_pages',DEFAULT_LINKEDIN));
  const[ytVideos,setYtVideos]=useState({});
  const[ytLoading,setYtLoading]=useState(false);
  const[ytFilter,setYtFilter]=useState('all');
  const[ytOpen,setYtOpen]=useState(true);
  const[twOpen,setTwOpen]=useState(true);
  const[liOpen,setLiOpen]=useState(true);
  const[newTwHandle,setNewTwHandle]=useState('');
  const[newTwLabel,setNewTwLabel]=useState('');
  const[newYtUrl,setNewYtUrl]=useState('');
  const[newYtName,setNewYtName]=useState('');
  const[newLiName,setNewLiName]=useState('');
  const[newLiUrl,setNewLiUrl]=useState('');
  const loadYt=useCallback(async()=>{
    setYtLoading(true);
    await Promise.allSettled(ytChannels.slice(0,20).map(async ch=>{
      try{
        const items=await fetchRSS(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`);
        if(items.length>0)setYtVideos(v=>({...v,[ch.channelId]:items.slice(0,4).map(i=>({...i,channelName:ch.name,channelEmoji:ch.emoji,category:ch.category,channelId:ch.channelId}))}));
      }catch{}
    }));
    setYtLoading(false);
  },[ytChannels]);
  useEffect(()=>{loadYt();},[]);
  const allVideos=Object.values(ytVideos).flat().sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
  const filteredVideos=ytFilter==='all'?allVideos:allVideos.filter(v=>v.category===ytFilter);
  const artId=(a)=>btoa((a.link||'x').slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);
  const addTwitter=()=>{if(!newTwHandle.trim())return;const handle=newTwHandle.replace('@','').trim();const u=[...twitterAccounts,{handle,label:newTwLabel.trim()||handle,emoji:'🐦',category:'custom'}];setTwitterAccounts(u);save('tw_accounts',u);setNewTwHandle('');setNewTwLabel('');};
  const addYoutube=()=>{if(!newYtUrl.trim()||!newYtName.trim())return;const match=newYtUrl.match(/channel\/([A-Za-z0-9_-]+)/);const channelId=match?match[1]:'UC'+Math.random().toString(36).slice(2,20);const u=[...ytChannels,{name:newYtName.trim(),channelId,category:'custom',emoji:'📺'}];setYtChannels(u);save('yt_channels',u);setNewYtUrl('');setNewYtName('');};
  const addLinkedin=()=>{if(!newLiName.trim())return;const u=[...linkedinPages,{name:newLiName.trim(),url:newLiUrl.trim()||'https://www.linkedin.com',emoji:'💼',category:'custom'}];setLinkedinPages(u);save('li_pages',u);setNewLiName('');setNewLiUrl('');};
  const removeTwitter=(i)=>{const u=twitterAccounts.filter((_,j)=>j!==i);setTwitterAccounts(u);save('tw_accounts',u);};
  const removeLinkedin=(i)=>{const u=linkedinPages.filter((_,j)=>j!==i);setLinkedinPages(u);save('li_pages',u);};
  return(
    <div className="social-page">
      <div className="social-header">
        <div className="social-header-icon">📱</div>
        <div className="social-header-body"><div className="social-header-title">Social Dashboard</div><div className="social-header-sub">YouTube · Twitter/X · LinkedIn — fully customizable</div></div>
        <button className="hero-act" onClick={loadYt}>↺ Refresh YouTube</button>
      </div>
      <div className="social-network-section">
        <div className="social-net-head" onClick={()=>setYtOpen(o=>!o)}>
          <div className="social-net-title"><span style={{fontSize:18}}>▶️</span> YouTube<span className="social-net-badge">{ytChannels.length} channels · {allVideos.length} videos</span></div>
          <span className={`social-net-toggle${ytOpen?' open':''}`}>▾</span>
        </div>
        {ytOpen&&(
          <>
            <div className="yt-filter-tabs">{YT_CATEGORIES.map(c=><button key={c.id} className={`yt-filter-tab${ytFilter===c.id?' active':''}`} onClick={()=>setYtFilter(c.id)}>{c.emoji} {c.label}</button>)}</div>
            {ytLoading&&!filteredVideos.length?<div className="yt-loading">Loading YouTube feeds...</div>:filteredVideos.length===0?<div className="yt-loading">No videos yet — tap ↺ Refresh above</div>:(
              <div className="yt-grid">
                {filteredVideos.slice(0,24).map((v,i)=>{
                  const id=artId(v);
                  return(
                    <div key={i} className="yt-card">
                      {v.img?<img className="yt-thumb" src={v.img} loading="lazy" alt=""/>:<div className="yt-thumb-ph">{v.channelEmoji}</div>}
                      <div className="yt-card-body">
                        <div className="yt-channel-row"><span className="yt-channel-emoji">{v.channelEmoji}</span><span className="yt-channel-name">{v.channelName}</span><span className="yt-card-date">{fmtDate(v.pubDate)}</span></div>
                        <div className="yt-card-title">{v.title}</div>
                        {v.desc&&<div className="yt-card-desc">{v.desc}</div>}
                        {sumLoading[id]&&<div style={{fontSize:10,color:'#7c3aed',margin:'4px 0'}}>Generating AI summary...</div>}
                        {summaries[id]&&<div className="summary-box" style={{marginBottom:6}}><div className="summary-lbl">AI Summary</div>{summaries[id]}</div>}
                        <div className="yt-card-acts">
                          <button className="yt-act watch" onClick={()=>window.open(v.link,'_blank')}>▶ Watch</button>
                          <button className={`yt-act ai${summaries[id]||sumLoading[id]?' saved':''}`} onClick={e=>getSummary(id,v.title,v.desc,e)}>{sumLoading[id]?'...':summaries[id]?'Hide AI':'✨ AI'}</button>
                          <button className={`yt-act${isSaved(v)?' saved':''}`} onClick={e=>saveArt({...v,cat:'social'},e)}>{isSaved(v)?'✓':'Save'}</button>
                          <button className={`yt-act${isReadLater(v)?' saved':''}`} onClick={e=>readLaterArt({...v,cat:'social'},e)}>Later</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="social-add-form">
              <input className="social-add-input" placeholder="Channel name" value={newYtName} onChange={e=>setNewYtName(e.target.value)}/>
              <input className="social-add-input" placeholder="YouTube channel URL" value={newYtUrl} onChange={e=>setNewYtUrl(e.target.value)}/>
              <button className="social-add-btn" onClick={addYoutube}>+ Add</button>
            </div>
          </>
        )}
      </div>
      <div className="social-network-section">
        <div className="social-net-head" onClick={()=>setTwOpen(o=>!o)}>
          <div className="social-net-title"><span style={{fontSize:18}}>𝕏</span> Twitter / X<span className="social-net-badge">{twitterAccounts.length} accounts</span></div>
          <span className={`social-net-toggle${twOpen?' open':''}`}>▾</span>
        </div>
        {twOpen&&(
          <>
            <div style={{padding:'10px 16px 4px',fontSize:11,color:'var(--text3)'}}>Tap any card to open their profile. Full feed integration coming next session.</div>
            <div className="tw-grid">
              {twitterAccounts.map((acc,i)=>(
                <div key={i} className="tw-card" onClick={()=>window.open(`https://twitter.com/${acc.handle}`)}>
                  <div className="tw-avatar">{acc.emoji||acc.handle.slice(0,2).toUpperCase()}</div>
                  <div className="tw-handle">@{acc.handle}</div>
                  <div className="tw-label">{acc.label}</div>
                  <div className="tw-cat">{acc.category}</div>
                  <div className="tw-open">Open on X ↗</div>
                  <button style={{background:'none',border:'none',color:'var(--text3)',fontSize:10,cursor:'pointer',marginTop:2}} onClick={e=>{e.stopPropagation();removeTwitter(i);}}>Remove</button>
                </div>
              ))}
            </div>
            <div className="social-add-form">
              <input className="social-add-input" placeholder="@handle" value={newTwHandle} onChange={e=>setNewTwHandle(e.target.value)}/>
              <input className="social-add-input" placeholder="Display name" value={newTwLabel} onChange={e=>setNewTwLabel(e.target.value)}/>
              <button className="social-add-btn" onClick={addTwitter}>+ Add</button>
            </div>
          </>
        )}
      </div>
      <div className="social-network-section">
        <div className="social-net-head" onClick={()=>setLiOpen(o=>!o)}>
          <div className="social-net-title"><span style={{fontSize:18}}>💼</span> LinkedIn<span className="social-net-badge">{linkedinPages.length} pages</span></div>
          <span className={`social-net-toggle${liOpen?' open':''}`}>▾</span>
        </div>
        {liOpen&&(
          <>
            <div className="li-oauth-banner">
              <div style={{fontSize:24}}>🔗</div>
              <div className="li-oauth-text"><div className="li-oauth-title">Connect your LinkedIn account</div><div className="li-oauth-sub">See your personal feed — OAuth login coming next session</div></div>
              <button className="li-oauth-btn" onClick={()=>alert('LinkedIn OAuth coming next session!')}>Connect →</button>
            </div>
            <div className="li-grid">
              {linkedinPages.map((pg,i)=>(
                <div key={i} className="li-card" onClick={()=>window.open(pg.url,'_blank')}>
                  <div className="li-top"><div className="li-emoji">{pg.emoji}</div><div className="li-info"><div className="li-name">{pg.name}</div><div className="li-cat">{pg.category}</div></div></div>
                  <div className="li-open">Open on LinkedIn ↗</div>
                  <button style={{background:'none',border:'none',color:'var(--text3)',fontSize:10,cursor:'pointer',marginTop:6}} onClick={e=>{e.stopPropagation();removeLinkedin(i);}}>Remove</button>
                </div>
              ))}
            </div>
            <div className="social-add-form">
              <input className="social-add-input" placeholder="Company or person name" value={newLiName} onChange={e=>setNewLiName(e.target.value)}/>
              <input className="social-add-input" placeholder="LinkedIn URL" value={newLiUrl} onChange={e=>setNewLiUrl(e.target.value)}/>
              <button className="social-add-btn" onClick={addLinkedin}>+ Add</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function NewsHub(){
  const[tab,setTab]=useState('today');
  const[search,setSearch]=useState('');
  const[activeKw,setActiveKw]=useState('');
  const[compact,setCompact]=useState(()=>load('compact',false));
  const[dark,setDark]=useState(()=>load('dark',false));
  const[saved,setSaved]=useState(()=>load('saved',[]));
  const[readLater,setReadLater]=useState(()=>load('readlater',[]));
  const[likes,setLikes]=useState(()=>load('likes',{}));
  const[clicks,setClicks]=useState(()=>load('clicks',{}));
  const[kw,setKw]=useState(()=>load('kw',DEFAULT_KW));
  const[following,setFollowing]=useState(()=>load('following',['Houston','Astros','Energy','AI','Trump','Fed']));
  const[alerts,setAlerts]=useState(()=>load('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','hurricane','breaking']));
  const[social,setSocial]=useState(()=>load('social',['@HoustonTexans','@astros','@KentuckyMBB','@ClemsonFB','@BloomEnergy']));
  const[feeds,setFeeds]=useState(()=>load('feeds',DEFAULT_FEEDS));
  const[arts,setArts]=useState({general:[],sports:[],business:[],finance:[],bloom:[],houston:[]});
  const[loading,setLoading]=useState({general:false,sports:false,business:false,finance:false,bloom:false,houston:false});
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
  const[heroIdx,setHeroIdx]=useState(0);
  const heroTimer=useRef(null);
  const[newKwVal,setNewKwVal]=useState('');
  const[newAlert,setNewAlert]=useState('');
  const[newSocial,setNewSocial]=useState('');
  const[kwTab,setKwTab]=useState('general');

  useEffect(()=>{save('dark',dark);document.body.className=dark?'dark':'';},[dark]);
  useEffect(()=>{save('compact',compact);},[compact]);
  useEffect(()=>{save('saved',saved);},[saved]);
  useEffect(()=>{save('readlater',readLater);},[readLater]);
  useEffect(()=>{save('likes',likes);},[likes]);
  useEffect(()=>{save('following',following);},[following]);

  const kwScore=(a,cat)=>{const ks=kw[cat]||[];return ks.filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase())).length;};
  const dedupe=(arr)=>{const seen=new Set();return arr.filter(a=>{const k=(a.title||'').slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});};

  const sorted=useCallback((cat)=>{
    let f=arts[cat]||[];
    if(activeKw)f=f.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));
    else if(search)f=f.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search.toLowerCase()));
    const deduped=dedupe(f);
    const bySource={};
    deduped.forEach(a=>{if(!bySource[a.source])bySource[a.source]=[];bySource[a.source].push(a);});
    Object.keys(bySource).forEach(src=>{bySource[src].sort((a,b)=>{const d=kwScore(b,cat)-kwScore(a,cat);if(d!==0)return d;return new Date(b.pubDate)-new Date(a.pubDate);});});
    const srcKeys=Object.keys(bySource).sort((a,b)=>{const topA=bySource[a][0],topB=bySource[b][0];const d=kwScore(topB,cat)-kwScore(topA,cat);if(d!==0)return d;return new Date(topB.pubDate)-new Date(topA.pubDate);});
    const result=[];const maxLen=Math.max(0,...srcKeys.map(k=>bySource[k].length));
    for(let i=0;i<maxLen;i++){srcKeys.forEach(src=>{if(bySource[src]?.[i])result.push(bySource[src][i]);});}
    return result;
  },[arts,search,activeKw]);

  const allBriefArts=useCallback(()=>{
    let all=[];
    BRIEFING_FEEDS.forEach(f=>{(briefArts[f.name]||[]).forEach(a=>all.push({...a,briefSource:f.name,briefEmoji:f.emoji,briefColor:f.color}));});
    all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    if(search)all=all.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(search.toLowerCase()));
    return dedupe(all);
  },[briefArts,search]);

  const heroArts=useCallback(()=>{
    const all=[];
    ['general','sports','business','finance','bloom','houston'].forEach(cat=>{sorted(cat).filter(a=>a.img).slice(0,3).forEach(a=>all.push({...a,cat}));});
    allBriefArts().filter(a=>a.img).slice(0,2).forEach(a=>all.push({...a,cat:'briefing'}));
    all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    return dedupe(all).slice(0,8);
  },[sorted,allBriefArts]);

  const trendingKws=useCallback(()=>{
    const wordCount={};
    const stop=new Set(['the','a','an','in','on','at','to','for','of','and','or','is','are','was','were','be','been','has','have','had','that','this','with','from','by','as','its','it','but','not','we','he','she','they','you','i','our','your','their','will','can','may','would','could','should','after','before','about','over','under','more','also','just','than','then','when','where','what','who','which','how','why','new','first','last','one','two','three','all','some','many','most','no','us','up','out','if','so','do','did','does','being','into','through','during','while','since','between','both','each','few','other','such','only','same','too','very','there']);
    [...Object.values(arts).flat(),...Object.values(briefArts).flat()].forEach(a=>{
      (a.title||'').split(/\s+/).forEach(w=>{const c=w.replace(/[^a-zA-Z]/g,'').toLowerCase();if(c.length>3&&!stop.has(c))wordCount[c]=(wordCount[c]||0)+1;});
    });
    return Object.entries(wordCount).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w])=>w.charAt(0).toUpperCase()+w.slice(1));
  },[arts,briefArts]);

  const tickerHeadlines=useCallback(()=>dedupe([...sorted('general').slice(0,5),...sorted('sports').slice(0,3),...sorted('business').slice(0,3)]).slice(0,12),[sorted]);

  const kwMatch=(a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase()));
  const isAlert=(a)=>alerts.some(al=>(a.title+(a.desc||'')).toLowerCase().includes(al.toLowerCase()));
  const isSaved=(a)=>saved.some(s=>s.link===a.link);
  const isReadLater=(a)=>readLater.some(s=>s.link===a.link);
  const clickArt=(a)=>{setClicks(c=>({...c,[a.source]:(c[a.source]||0)+1}));window.open(a.link,'_blank');};
  const likeArt=(link,v,e)=>{e?.stopPropagation();setLikes(l=>{const prev=l[link]||0;if(prev===v){const n={...l};delete n[link];return n;}return{...l,[link]:v};});};
  const saveArt=(a,e)=>{e?.stopPropagation();setSaved(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,a]);};
  const readLaterArt=(a,e)=>{e?.stopPropagation();setReadLater(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[...s,{...a,savedAt:new Date().toISOString()}]);};
  const toggleFollow=(kw)=>setFollowing(f=>f.includes(kw)?f.filter(x=>x!==kw):[...f,kw]);

  const getSummary=async(id,title,desc,e)=>{
    e?.stopPropagation();
    if(summaries[id]){setSummaries(s=>{const n={...s};delete n[id];return n;});return;}
    setSumLoading(l=>({...l,[id]:true}));
    try{
      const resp=await fetch('/api/summarize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,content:desc||''})});
      const data=await resp.json();
      setSummaries(s=>({...s,[id]:data.summary||'Summary unavailable.'}));
    }catch{setSummaries(s=>({...s,[id]:'Could not generate summary. Set ANTHROPIC_API_KEY in Vercel.'}));}
    setSumLoading(l=>({...l,[id]:false}));
  };

  const loadCat=useCallback(async(cat)=>{
    if(loading[cat])return;
    setLoading(l=>({...l,[cat]:true}));
    const results=[];const healthUp={};
    const feedList=cat==='houston'?HOUSTON_FEEDS:(feeds[cat]||[]);
    await Promise.allSettled(feedList.filter(f=>f.on).map(async f=>{
      const t0=Date.now();const items=await fetchRSS(f.url);const elapsed=Date.now()-t0;
      healthUp[f.name]=items.length>0?(elapsed<5000?'green':'yellow'):'red';
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    setHealth(h=>({...h,...healthUp}));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLoading(l=>({...l,[cat]:false}));
    const hit=results.find(a=>isAlert(a));if(hit)setBreaking(hit);
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
    ['general','sports','business','finance','bloom','houston'].forEach(c=>loadCat(c));
    loadBriefings();loadPodcasts();
  },[]);

  useEffect(()=>{
    const ha=heroArts();if(!ha.length)return;
    heroTimer.current=setInterval(()=>setHeroIdx(i=>(i+1)%ha.length),6000);
    return()=>{if(heroTimer.current)clearInterval(heroTimer.current);};
  },[heroArts]);

  const refreshAll=()=>{
    setArts({general:[],sports:[],business:[],finance:[],bloom:[],houston:[]});
    setLoading({general:false,sports:false,business:false,finance:false,bloom:false,houston:false});
    setHealth({});setBriefArts({});setBriefLoading({});
    setPodEps({});setPodLoading({});setActiveKw('');setSearch('');setHeroIdx(0);
    setTimeout(()=>{['general','sports','business','finance','bloom','houston'].forEach(c=>loadCat(c));loadBriefings();loadPodcasts();},100);
  };

  const artId=(a)=>btoa((a.link||'x').slice(0,40)).replace(/[^a-z0-9]/gi,'').slice(0,12);

  const PicCard=({a,cat,wide})=>{
    const cc=CATS[cat]||CATS.general;const id=artId(a);const[imgErr,setImgErr]=useState(false);
    return(
      <div className={`pic-card${wide?' wide':''}`} onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="pic-card-img" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="pic-card-img-ph">{cc.emoji}</div>}
        <div className="pic-card-overlay">
          <span className="pic-card-cat" style={{background:cc.color+'cc',color:'#fff'}}>{cc.label}</span>
          <div className="pic-card-title">{a.title}</div>
          <div className="pic-card-meta"><span className="pic-card-src">{a.source}</span><span className="pic-card-time">{fmtDate(a.pubDate)}</span></div>
          <div className="pic-card-acts">
            <button className={`pic-act${isSaved(a)?' saved':''}`} onClick={e=>saveArt(a,e)}>{isSaved(a)?'✓ Saved':'Save'}</button>
            <button className={`pic-act${isReadLater(a)?' saved':''}`} onClick={e=>readLaterArt(a,e)}>Later</button>
            <button className="pic-act ai" onClick={e=>getSummary(id,a.title,a.desc,e)}>{sumLoading[id]?'..':summaries[id]?'Hide AI':'AI'}</button>
          </div>
          {sumLoading[id]&&<div style={{marginTop:6,fontSize:10,color:'#c4b5fd'}}>Generating...</div>}
          {summaries[id]&&<div style={{marginTop:6,background:'rgba(0,0,0,0.6)',borderRadius:6,padding:'6px 8px',fontSize:10,color:'#e9d5ff',lineHeight:1.5}}>{summaries[id]}</div>}
        </div>
      </div>
    );
  };

  const HSection=({cat,title,emoji,color})=>{
    const arts2=sorted(cat);const rowRef=useRef(null);
    const scroll=(dir)=>{if(rowRef.current)rowRef.current.scrollBy({left:dir*240,behavior:'smooth'});};
    if(arts2.length===0&&loading[cat])return(<div className="section"><div className="section-head"><div className="section-label"><div className="section-dot" style={{background:color}}/>{emoji} {title}</div></div><div className="loading-state">Loading {title}...</div></div>);
    if(arts2.length===0)return null;
    return(
      <div className="section">
        <div className="section-head">
          <div className="section-label"><div className="section-dot" style={{background:color}}/>{emoji} {title}<span className="section-count">{arts2.length}</span></div>
          <div className="section-actions"><button className="h-arrow" onClick={()=>scroll(-1)}>←</button><button className="h-arrow" onClick={()=>scroll(1)}>→</button><button className="see-all" onClick={()=>{setTab(cat);setActiveKw('');setSearch('');}}>See All</button></div>
        </div>
        <div className="h-row" ref={rowRef}>{arts2.slice(0,12).map((a,i)=><PicCard key={i} a={a} cat={cat} wide={i===0}/>)}</div>
      </div>
    );
  };

  const FeedCard=({a,cat})=>{
    const cc=CATS[cat]||CATS.general;const kws=kwMatch(a,cat);const id=artId(a);const[imgErr,setImgErr]=useState(false);
    return(
      <div className="feed-card" onClick={()=>clickArt(a)}>
        <div className="feed-hero-wrap">
          {a.img&&!imgErr?<img className="feed-hero-img" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="feed-hero-ph">{cc.emoji}</div>}
          {a.img&&!imgErr&&<div className="feed-hero-gradient"/>}
          <span className="feed-cat-badge" style={{background:cc.color,color:'#fff'}}>{cc.emoji} {cc.label}</span>
          <span className="feed-read-badge">{readTime(a.desc)}</span>
        </div>
        <div className="feed-card-body">
          <div className="feed-top-row"><div className="feed-av" style={{background:cc.bg,color:cc.color}}>{(a.source||'?').slice(0,2).toUpperCase()}</div><span className="feed-src" style={{color:cc.color}}>{a.source}</span>{isAlert(a)&&<span className="alert-tag">ALERT</span>}<span className="feed-date">{fmtDate(a.pubDate)}</span></div>
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
              <button className={`act-b${isReadLater(a)?' as':''}`} onClick={e=>readLaterArt(a,e)}>Later</button>
              <button className={`act-b${summaries[id]||sumLoading[id]?' ai':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
              <button className="act-b" onClick={e=>{e.stopPropagation();clickArt(a);}}>Read</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CompactCard=({a,cat})=>{
    const cc=CATS[cat]||CATS.general;const id=artId(a);const[imgErr,setImgErr]=useState(false);
    return(
      <div className="compact-card" onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="compact-thumb" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="compact-thumb-ph">{cc.emoji}</div>}
        <div className="compact-body">
          <div className="compact-title">{isAlert(a)&&<span className="alert-tag" style={{marginRight:4}}>ALERT</span>}{a.title}</div>
          <div className="compact-meta"><span style={{color:cc.color,fontWeight:600}}>{a.source}</span><span>{fmtDate(a.pubDate)}</span><span>{readTime(a.desc)}</span></div>
          <div className="compact-acts">
            <button className={`mini-act${likes[a.link]===1?' al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
            <button className={`mini-act${isSaved(a)?' as':''}`} onClick={e=>saveArt(a,e)}>Save</button>
            <button className={`mini-act${isReadLater(a)?' as':''}`} onClick={e=>readLaterArt(a,e)}>Later</button>
            <button className={`mini-act${summaries[id]||sumLoading[id]?' al':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
          </div>
          {sumLoading[id]&&<div style={{fontSize:10,color:'#7c3aed',marginTop:4}}>Generating...</div>}
          {summaries[id]&&<div style={{fontSize:10,color:'var(--text2)',marginTop:4,lineHeight:1.5,background:'var(--surface2)',borderRadius:6,padding:'4px 8px'}}>{summaries[id]}</div>}
        </div>
      </div>
    );
  };

  const CatPage=({cat})=>{
    const cc=CATS[cat]||CATS.general;const arts2=sorted(cat);const catKws=kw[cat]||[];
    return(
      <div className="main">
        <div className="main-feed">
          {activeKw&&(<div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--border)'}}><span style={{fontSize:12,color:'var(--text2)'}}>Filtered: <strong>"{activeKw}"</strong> — {arts2.length} results</span><button onClick={()=>setActiveKw('')} style={{marginLeft:'auto',background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'2px 8px',fontSize:11,cursor:'pointer',color:'var(--text3)'}}>Clear ✕</button></div>)}
          {arts2.length===0?(<div className="no-art"><p className="no-art-msg">{loading[cat]?`Loading ${cc.label}...`:activeKw?`No "${activeKw}" articles`:'No articles yet'}</p>{!loading[cat]&&<button className="refresh-btn" style={{background:cc.color}} onClick={refreshAll}>Refresh</button>}</div>):
          compact?(<div className="section">{arts2.slice(0,30).map((a,i)=><CompactCard key={i} a={a} cat={cat}/>)}</div>):
          (<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>{arts2.slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat={cat}/>)}</div>)}
        </div>
        <div className="sidebar-col">
          <div className="side-block"><div className="side-title">🔥 Trending in {cc.label}</div>{arts2.slice(0,8).map((a,i)=>(<div key={i} className="trend-row" onClick={()=>clickArt(a)}><div className="trend-n">{i+1}</div><div><div className="trend-t">{a.title.slice(0,60)}{a.title.length>60?'...':''}</div><div className="trend-s">{a.source} · {fmtDate(a.pubDate)}</div></div></div>))}</div>
          <div className="side-block"><div className="side-title">{cc.emoji} Keywords</div>{catKws.map((k,i)=>(<span key={i} className={`kw-chip${activeKw===k?' kw-active':''}`} style={{background:cc.bg,color:cc.color}} onClick={()=>setActiveKw(prev=>prev===k?'':k)}>{k}</span>))}</div>
          <ScoresSection/>
        </div>
      </div>
    );
  };

  const BriefCard=({a})=>{
    const crossTags=detectCrossTags(a.title,a.desc);const id=artId(a);const[imgErr,setImgErr]=useState(false);
    const srcInfo=BRIEFING_FEEDS.find(f=>f.name===a.briefSource)||{color:'#92400e',emoji:'☀️'};
    return(
      <div className="brief-card" onClick={()=>clickArt(a)}>
        {a.img&&!imgErr?<img className="brief-card-img" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="brief-card-img-ph">{srcInfo.emoji}</div>}
        <div className="brief-card-body">
          <div className="brief-card-top"><div className="brief-src-dot" style={{background:srcInfo.color}}/><span className="brief-src-name" style={{color:srcInfo.color}}>{a.briefSource||a.source}</span>{isAlert(a)&&<span className="alert-tag">ALERT</span>}<span className="brief-card-date">{fmtDate(a.pubDate)}</span></div>
          <div className="brief-card-title">{a.title}</div>
          {a.desc&&<div className="brief-card-desc">{a.desc}</div>}
          {sumLoading[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="summary-box"><div className="summary-lbl">AI Summary</div>{summaries[id]}</div>}
          <div className="brief-card-footer">
            <div className="brief-cross-tags">{crossTags.map((t,i)=>{const cc=CATS[t.cat];return<span key={i} className="cross-tag" style={{background:cc.bg,color:cc.color}} onClick={e=>{e.stopPropagation();setTab(t.cat);setActiveKw(t.word);}}>{cc.emoji} {t.word}</span>;})}</div>
            <div className="brief-acts">
              <button className={`act-b${likes[a.link]===1?' al':''}`} onClick={e=>likeArt(a.link,1,e)}>Up</button>
              <button className={`act-b${isSaved(a)?' as':''}`} onClick={e=>saveArt(a,e)}>Save</button>
              <button className={`act-b${isReadLater(a)?' as':''}`} onClick={e=>readLaterArt(a,e)}>Later</button>
              <button className={`act-b${summaries[id]||sumLoading[id]?' ai':''}`} onClick={e=>getSummary(id,a.title,a.desc,e)}>AI</button>
              <button className="act-b" onClick={e=>{e.stopPropagation();clickArt(a);}}>Read</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PodCard=({ep,idx})=>{
    const id=`pod_${ep.show}_${idx}`;const isSv=isSaved({...ep,link:ep.link||ep.show+idx});const[imgErr,setImgErr]=useState(false);const[showPlayer,setShowPlayer]=useState(false);
    const audioUrl=ep.link&&(ep.link.includes('.mp3')||ep.link.includes('.m4a')||ep.link.includes('.ogg'))?ep.link:null;
    return(
      <div className="pod-card">
        {ep.img&&!imgErr?<img className="pod-card-img" src={ep.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>:<div className="pod-card-img-ph">{ep.showEmoji}</div>}
        <div className="pod-card-body">
          <div className="pod-card-top"><div className="pod-card-num">{idx+1}</div><div className="pod-card-info"><div className="pod-card-show">{ep.showEmoji} {ep.show}</div><div className="pod-card-title" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>{ep.title}</div><div className="pod-card-meta"><span>{fmtDate(ep.pubDate)}</span>{ep.duration&&<span>{fmtDuration(ep.duration)}</span>}<span style={{color:'#e11d48',fontWeight:500}}>{ep.host}</span></div></div></div>
          {ep.desc&&<div className="pod-card-desc">{ep.desc}</div>}
          {showPlayer&&audioUrl&&<div className="mini-player"><span style={{fontSize:10,color:'var(--text3)'}}>▶</span><audio controls src={audioUrl} style={{flex:1,height:28}}/></div>}
          {sumLoading[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Summary</div><em style={{color:'var(--text3)'}}>Generating...</em></div>}
          {summaries[id]&&<div className="pod-summary"><div className="pod-summary-lbl">AI Episode Summary</div>{summaries[id]}</div>}
          <div className="pod-card-footer">
            <button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen ↗</button>
            {audioUrl&&<button className={`pod-btn${showPlayer?' ai-active':''}`} onClick={()=>setShowPlayer(p=>!p)}>{showPlayer?'Hide Player':'▶ Play'}</button>}
            <button className={`pod-btn${summaries[id]||sumLoading[id]?' ai-active':''}`} onClick={e=>getSummary(id,ep.title,ep.desc,e)}>{sumLoading[id]?'Summarizing...':summaries[id]?'Hide AI':'AI Summary'}</button>
            <button className={`pod-btn${isSv?' saved-btn':''}`} onClick={e=>saveArt({...ep,link:ep.link||ep.show+idx,source:ep.show,cat:'podcasts'},e)}>{isSv?'✓ Saved':'Save'}</button>
          </div>
        </div>
      </div>
    );
  };

  const heroes=heroArts();

  const HeroCarousel=()=>{
    if(!heroes.length)return<div className="hero-carousel"><div className="hero-bg-ph">📰</div><div className="hero-overlay"/></div>;
    return(
      <div className="hero-carousel">
        {heroes.map((a,i)=>{
          const cc=CATS[a.cat]||CATS.general;const id=artId(a);const[imgErr,setImgErr]=useState(false);
          return(
            <div key={i} className={`hero-slide${i===heroIdx?' active':''}`}>
              {a.img&&!imgErr?<img className="hero-bg" src={a.img} onError={()=>setImgErr(true)} alt=""/>:<div className="hero-bg-ph">{cc.emoji}</div>}
              <div className="hero-overlay"/>
              <div className="hero-content">
                <span className="hero-cat" style={{background:cc.color,color:'#fff'}}>{cc.emoji} {cc.label}</span>
                <div className="hero-title" onClick={()=>clickArt(a)}>{a.title}</div>
                <div className="hero-meta"><span className="hero-src">{a.source}</span><span className="hero-date">{fmtDate(a.pubDate)}</span></div>
                <div className="hero-acts">
                  <button className="hero-act" onClick={()=>clickArt(a)}>Read ↗</button>
                  <button className={`hero-act${isSaved(a)?' as':''}`} onClick={e=>saveArt(a,e)}>{isSaved(a)?'✓ Saved':'Save'}</button>
                  <button className={`hero-act${isReadLater(a)?' as':''}`} onClick={e=>readLaterArt(a,e)}>Read Later</button>
                  <button className="hero-act ai" onClick={e=>getSummary(id,a.title,a.desc,e)}>{sumLoading[id]?'Generating...':summaries[id]?'Hide AI':'✨ AI Summary'}</button>
                </div>
                {sumLoading[id]&&<div style={{marginTop:8,fontSize:11,color:'#c4b5fd'}}>Generating AI summary...</div>}
                {summaries[id]&&<div style={{marginTop:8,background:'rgba(0,0,0,0.65)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#e9d5ff',lineHeight:1.6,maxWidth:600}}>{summaries[id]}</div>}
              </div>
            </div>
          );
        })}
        <button className="hero-nav prev" onClick={()=>{setHeroIdx(i=>(i-1+heroes.length)%heroes.length);if(heroTimer.current)clearInterval(heroTimer.current);}}>‹</button>
        <button className="hero-nav next" onClick={()=>{setHeroIdx(i=>(i+1)%heroes.length);if(heroTimer.current)clearInterval(heroTimer.current);}}>›</button>
        <div className="hero-dots">{heroes.map((_,i)=><div key={i} className={`hero-dot${i===heroIdx?' active':''}`} onClick={()=>setHeroIdx(i)}/>)}</div>
      </div>
    );
  };

  const TickerBar=()=>{
    const items=tickerHeadlines();if(!items.length)return null;
    const doubled=[...items,...items];
    return(
      <div className="ticker"><div className="ticker-inner"><div className="ticker-label">LIVE</div><div style={{overflow:'hidden',flex:1}}><div className="ticker-track">{doubled.map((a,i)=><span key={i} className="ticker-item" onClick={()=>clickArt(a)}>{a.title}<span className="ticker-sep"> · </span></span>)}</div></div></div>
    );
  };

  const TodayPage=()=>(
    <div className="main">
      <div className="main-feed">
        {trendingKws().length>0&&(
          <div className="trending-bar">
            <span className="trending-lbl">Trending</span>
            {trendingKws().map((t,i)=><span key={i} className={`trend-chip${activeKw===t?' active':''}`} onClick={()=>setActiveKw(prev=>prev===t?'':t)}>{t}</span>)}
          </div>
        )}
        <div className="follow-section">
          <div className="follow-title">Your Topics</div>
          <div className="follow-pills">
            {['Houston','Astros','Texans','Energy','Oil','AI','Trump','Fed','Kentucky','Clemson','Braves','Markets','LNG','ERCOT','Bloom Energy','Real Estate','NFL','MLB','Data Center','Geopolitics','Entrepreneurship'].map(t=>(
              <span key={t} className={`follow-pill${following.includes(t)?' following':''}`} onClick={()=>toggleFollow(t)}>{following.includes(t)?'✓':'+'}  {t}</span>
            ))}
          </div>
        </div>
        <HSection cat="general"  title="General News" emoji="🌐" color="#1d4ed8"/>
        <HSection cat="houston"  title="Houston Local" emoji="🤠" color="#b45309"/>
        <HSection cat="sports"   title="Sports"        emoji="🏆" color="#d97706"/>
        <HSection cat="business" title="Business"      emoji="⚡" color="#16a34a"/>
        <HSection cat="finance"  title="Finance"       emoji="📈" color="#7c3aed"/>
        <HSection cat="bloom"    title="Bloom Energy"  emoji="🔋" color="#0369a1"/>
      </div>
      <div className="sidebar-col">
        <ScoresSection/>
        {readLater.length>0&&(<div className="side-block"><div className="side-title">📌 Read Later ({readLater.length})</div>{readLater.slice(0,5).map((a,i)=>(<div key={i} className="read-later-item" onClick={()=>clickArt(a)}><div className="rl-dot"/><div><div className="rl-title">{a.title.slice(0,60)}{a.title.length>60?'...':''}</div><div className="rl-src">{a.source}</div></div></div>))}{readLater.length>5&&<div style={{fontSize:10,color:'var(--text3)',marginTop:6}}>{readLater.length-5} more in Saved tab</div>}</div>)}
        <div className="side-block"><div className="side-title">🔥 Trending Now</div>{sorted('general').slice(0,6).map((a,i)=>(<div key={i} className="trend-row" onClick={()=>clickArt(a)}><div className="trend-n">{i+1}</div><div><div className="trend-t">{a.title.slice(0,55)}{a.title.length>55?'...':''}</div><div className="trend-s">{a.source} · {fmtDate(a.pubDate)}</div></div></div>))}</div>
        <div className="side-block"><div className="side-title">🚨 Alerts</div>{alerts.map((a,i)=><span key={i} style={{display:'inline-block',background:'#fef2f2',color:'#dc2626',borderRadius:20,padding:'3px 9px',fontSize:10,margin:2,fontWeight:500}}>{a}</span>)}</div>
        <div className="side-block"><div className="side-title">Social</div>{social.map((h,i)=>(<div key={i} className="social-row" onClick={()=>window.open(`https://twitter.com/${h.replace('@','')}`)}>  <div className="social-av">{h.replace('@','').slice(0,2).toUpperCase()}</div><span className="social-name">{h}</span><span className="social-arr">→</span></div>))}</div>
      </div>
    </div>
  );

  const PodcastsPage=()=>{
    const allEps=[];
    PODCAST_FEEDS.forEach(p=>{(podEps[p.name]||[]).slice(0,3).forEach(e=>allEps.push({...e,show:p.name,host:p.host,showEmoji:p.emoji}));});
    allEps.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({...e,show:activePod.name,host:activePod.host,showEmoji:activePod.emoji})):allEps;
    const isLoad=activePod?podLoading[activePod.name]:PODCAST_FEEDS.some(p=>podLoading[p.name]);
    return(
      <div className="pod-page">
        <div className="pod-col">
          <div className="pod-show-header"><div className="pod-show-emoji">{activePod?activePod.emoji:'🎙️'}</div><div className="pod-show-info"><div className="pod-show-name">{activePod?activePod.name:'All Podcasts'}</div><div className="pod-show-host">{activePod?`Hosted by ${activePod.host}`:`${PODCAST_FEEDS.length} shows · AI summaries · Inline player`}</div></div>{activePod&&<button style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11,fontFamily:'inherit'}} onClick={()=>setActivePod(null)}>All Shows</button>}</div>
          {isLoad&&!displayEps.length?<div className="loading-state" style={{padding:40}}>Loading episodes...</div>:displayEps.length===0?<div className="loading-state" style={{padding:40}}>No episodes yet.<br/><button style={{marginTop:12,background:'#e11d48',border:'none',color:'#fff',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:12,fontFamily:'inherit'}} onClick={loadPodcasts}>Retry</button></div>:displayEps.slice(0,20).map((ep,i)=><PodCard key={i} ep={ep} idx={i}/>)}
        </div>
        <div className="pod-sidebar">
          <div className="pod-show-list">
            <div className="side-title">Shows</div>
            <div className="pod-show-item" onClick={()=>setActivePod(null)} style={{background:!activePod?'var(--surface2)':''}}><div className="pod-show-item-emoji">🎙️</div><div className="pod-show-item-info"><div className="pod-show-item-name" style={{color:!activePod?'#e11d48':''}}>All Shows</div><div className="pod-show-item-ep">Latest from all {PODCAST_FEEDS.length} shows</div></div>{!activePod&&<div className="pod-show-item-dot"/>}</div>
            {PODCAST_FEEDS.map((p,i)=>{const eps=podEps[p.name]||[];const latest=eps[0];const isActive=activePod?.name===p.name;return(<div key={i} className="pod-show-item" onClick={()=>setActivePod(isActive?null:p)} style={{background:isActive?'var(--surface2)':''}}><div className="pod-show-item-emoji">{p.emoji}</div><div className="pod-show-item-info"><div className="pod-show-item-name" style={{color:isActive?'#e11d48':''}}>{p.name}</div><div className="pod-show-item-ep">{podLoading[p.name]?'Loading...':(latest?latest.title.slice(0,38)+'...':'No episodes yet')}</div></div>{eps.length>0&&<span style={{fontSize:9,color:'#16a34a',fontWeight:600,flexShrink:0}}>{eps.length}ep</span>}{isActive&&<div className="pod-show-item-dot"/>}</div>);})}
          </div>
        </div>
      </div>
    );
  };

  const BriefingPage=()=>{
    const allArts=allBriefArts();const filtered=activeBriefSource==='all'?allArts:allArts.filter(a=>a.briefSource===activeBriefSource);
    const isAnyLoading=BRIEFING_FEEDS.some(f=>briefLoading[f.name]);const totalLoaded=BRIEFING_FEEDS.reduce((n,f)=>n+(briefArts[f.name]||[]).length,0);
    return(
      <div className="brief-page">
        <div>
          <div className="brief-banner"><div className="brief-banner-icon">☀️</div><div className="brief-banner-body"><div className="brief-banner-title">Morning Briefing</div><div className="brief-banner-sub">{BRIEFING_FEEDS.length} sources · {totalLoaded} articles</div></div>{isAnyLoading&&<div style={{fontSize:11,color:'rgba(255,255,255,0.8)'}}>Loading...</div>}</div>
          <div className="brief-source-tabs"><button className={`brief-tab-btn${activeBriefSource==='all'?' active':''}`} style={{color:'#92400e'}} onClick={()=>setActiveBriefSource('all')}>☀️ All ({allArts.length})</button>{BRIEFING_FEEDS.map(f=>{const count=(briefArts[f.name]||[]).length;const isLoad=briefLoading[f.name];return(<button key={f.name} className={`brief-tab-btn${activeBriefSource===f.name?' active':''}`} style={{color:f.color}} onClick={()=>setActiveBriefSource(activeBriefSource===f.name?'all':f.name)}>{f.emoji} {f.name} {isLoad?'…':`(${count})`}</button>);})}</div>
          {filtered.length===0?(<div className="no-art"><p className="no-art-msg">{isAnyLoading?'Loading briefings...':'No briefing articles yet'}</p>{!isAnyLoading&&<button className="refresh-btn" style={{background:'#92400e'}} onClick={loadBriefings}>Retry</button>}</div>):filtered.map((a,i)=><BriefCard key={i} a={a}/>)}
        </div>
        <div className="brief-sidebar"><div className="side-block" style={{border:'1px solid #fcd34d'}}><div className="side-title" style={{color:'#92400e'}}>☀️ Sources</div>{BRIEFING_FEEDS.map((f,i)=>{const count=(briefArts[f.name]||[]).length;const isLoad=briefLoading[f.name];return(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border2)'}}><span style={{fontSize:14}}>{f.emoji}</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:600,color:f.color}}>{f.name}</div><div style={{fontSize:10,color:'var(--text3)'}}>{f.desc}</div></div><span style={{fontSize:10,color:isLoad?'#3b82f6':count>0?'#16a34a':'var(--text3)',fontWeight:600,flexShrink:0}}>{isLoad?'…':count>0?`${count}`:'—'}</span></div>);})}</div></div>
      </div>
    );
  };

  const SavedPage=()=>{
    const[savedTab,setSavedTab]=useState('saved');const items=savedTab==='saved'?saved:readLater;
    return(
      <div className="main">
        <div className="main-feed">
          {readLater.length>0&&(<div className="read-later-banner"><div className="rl-banner-icon">📌</div><div className="rl-banner-text"><div className="rl-banner-title">Read Later — {readLater.length} article{readLater.length!==1?'s':''}</div><div className="rl-banner-sub">Articles flagged to read when you have time</div></div></div>)}
          <div style={{display:'flex',gap:8,marginBottom:12}}><button onClick={()=>setSavedTab('saved')} className={`brief-tab-btn${savedTab==='saved'?' active':''}`}>🔖 Saved ({saved.length})</button><button onClick={()=>setSavedTab('later')} className={`brief-tab-btn${savedTab==='later'?' active':''}`}>📌 Read Later ({readLater.length})</button></div>
          {items.length===0?(<div className="saved-empty"><div style={{fontSize:28,marginBottom:10}}>{savedTab==='saved'?'🔖':'📌'}</div><div style={{fontSize:13,fontWeight:500,color:'var(--text2)',marginBottom:4}}>{savedTab==='saved'?'No saved items yet':'No read later items'}</div><div style={{fontSize:11,color:'var(--text3)'}}>Tap Save or Later on any article</div></div>):
          compact?(<div className="section">{items.map((a,i)=>a.cat==='podcasts'?<PodCard key={i} ep={a} idx={i}/>:<CompactCard key={i} a={a} cat={a.cat||'general'}/>)}</div>):
          (<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>{items.map((a,i)=>a.cat==='podcasts'?<PodCard key={i} ep={a} idx={i}/>:<FeedCard key={i} a={a} cat={a.cat||'general'}/>)}</div>)}
        </div>
        <div className="sidebar-col"><ScoresSection/></div>
      </div>
    );
  };

  const CustomizePanel=()=>{
    const[lf,setLf]=useState(JSON.parse(JSON.stringify(feeds)));
    const[lk,setLk]=useState(JSON.parse(JSON.stringify(kw)));
    const[la,setLa]=useState([...alerts]);const[ls,setLs]=useState([...social]);
    const[srcCat,setSrcCat]=useState('general');const[newName,setNewName]=useState('');const[newUrl,setNewUrl]=useState('');const[testState,setTestState]=useState({});
    const saveAll=()=>{setFeeds(lf);save('feeds',lf);setKw(lk);save('kw',lk);setAlerts(la);save('alerts',la);setSocial(ls);save('social',ls);setShowPanel(false);refreshAll();};
    const testFeed=async(url,key)=>{setTestState(s=>({...s,[key]:'loading'}));const items=await fetchRSS(url);setTestState(s=>({...s,[key]:items.length>0?`ok ${items.length} articles`:'fail'}));};
    const addSrc=()=>{if(!newName.trim()||!newUrl.trim())return;setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcCat])n[srcCat]=[];n[srcCat].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});setNewName('');setNewUrl('');};
    const hdot=(name)=>{const h=health[name];return h==='green'?'hg':h==='yellow'?'hy':h==='red'?'hr':'hx';};
    const cnt=(cat,name)=>(arts[cat]||[]).filter(a=>a.source===name).length;
    const catLabels={general:'🌐 General',sports:'🏆 Sports',business:'⚡ Business',finance:'📈 Finance',bloom:'🔋 Bloom',briefing:'☀️ Briefing'};
    return(
      <div className="panel-overlay open">
        <div className="panel">
          <div className="panel-head"><span className="panel-htitle">⚙️ Customize Hub</span><button className="panel-x" onClick={()=>setShowPanel(false)}>✕</button></div>
          <div className="panel-body">
            <div className="p-sec"><div className="p-lbl">Breaking News Alerts</div><div className="alert-info">Red banner fires when any headline contains these words.</div><div>{la.map((a,i)=><span key={i} className="p-chip p-alert">{a}<button className="p-chip-x" style={{color:'#dc2626'}} onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>×</button></span>)}</div><div className="p-add"><input className="p-input" placeholder="Add alert word..." value={newAlert} onChange={e=>setNewAlert(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/><button className="p-alert-btn" onClick={()=>{if(newAlert.trim()){setLa(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button></div></div>
            <div className="p-sec"><div className="p-lbl">Keywords by Category</div><div className="kw-cat-tabs">{Object.keys(catLabels).map(c=><button key={c} className={`kw-cat-tab${kwTab===c?' active':''}`} onClick={()=>setKwTab(c)}>{catLabels[c]}</button>)}</div><div>{(lk[kwTab]||[]).map((k,i)=><span key={i} className="p-chip p-kw">{k}<button className="p-chip-x" onClick={()=>setLk(prev=>{const n={...prev};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}>×</button></span>)}</div><div className="p-add"><input className="p-input" placeholder={`Add ${kwTab} keyword...`} value={newKwVal} onChange={e=>setNewKwVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newKwVal.trim()){setLk(prev=>{const n={...prev};n[kwTab]=[...(n[kwTab]||[]),newKwVal.trim()];return n;});setNewKwVal('');}}}/>  <button className="p-add-btn" onClick={()=>{if(newKwVal.trim()){setLk(prev=>{const n={...prev};n[kwTab]=[...(n[kwTab]||[]),newKwVal.trim()];return n;});setNewKwVal('');}}}>Add</button></div></div>
            {Object.keys(DEFAULT_FEEDS).map(cat=>(
              <div key={cat} className="p-sec">
                <div className="p-lbl">{CATS[cat]?.emoji} {CATS[cat]?.label} Sources</div>
                <div className="hlegend"><span><span className="hdot hg"/>Loaded</span><span><span className="hdot hy"/>Slow</span><span><span className="hdot hr"/>Failed</span><span><span className="hdot hx"/>Pending</span></div>
                {(lf[cat]||[]).map((f,i)=>{const tk=`${cat}_${i}`;const ts=testState[tk];const c=cnt(cat,f.name);return(<div key={i}><div className="p-row"><span className={`hdot ${hdot(f.name)}`}/><span className="p-name">{f.name}</span>{c>0&&<span className="p-count">{c} art</span>}<button className="test-btn" onClick={()=>testFeed(f.url,tk)}>Test</button><button className={`tog${f.on?' on':' off'}`} onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[cat][i].on=!n[cat][i].on;return n;})}/><button className="p-del" onClick={()=>setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));n[cat].splice(i,1);return n;})}>✕</button></div>{ts&&<div className={`tresult${ts==='loading'?' tload':ts.startsWith('ok')?' tok':' tfail'}`}>{ts==='loading'?'Testing...':(ts.startsWith('ok')?'✓ '+ts.replace('ok ',''):'✗ Failed')}</div>}</div>);})}
                <div className="add-src-box"><div className="add-src-lbl">+ Add source to {CATS[cat]?.label}</div><input className="p-input-sm" placeholder="Source name" value={srcCat===cat?newName:''} onChange={e=>{setSrcCat(cat);setNewName(e.target.value);}}/><input className="p-input-sm" placeholder="RSS URL" value={srcCat===cat?newUrl:''} onChange={e=>{setSrcCat(cat);setNewUrl(e.target.value);}}/><div style={{display:'flex',gap:6}}><button className="test-btn" style={{flex:1}} onClick={()=>{const u=(srcCat===cat?newUrl:'').trim();if(u)testFeed(u,`new_${cat}`);}}>Test URL</button><button className="p-add-btn" style={{flex:1}} onClick={()=>{setSrcCat(cat);addSrc();}}>Add Source</button></div>{testState[`new_${cat}`]&&<div className={`tresult${testState[`new_${cat}`]==='loading'?' tload':testState[`new_${cat}`].startsWith('ok')?' tok':' tfail'}`}>{testState[`new_${cat}`]==='loading'?'Testing...':(testState[`new_${cat}`].startsWith('ok')?'✓ '+testState[`new_${cat}`].replace('ok ',''):'✗ Failed')}</div>}</div>
              </div>
            ))}
            <div className="p-sec"><div className="p-lbl">Social Follows</div><div>{ls.map((s,i)=><span key={i} className="p-chip p-so">{s}<button className="p-chip-x" style={{color:'#166534'}} onClick={()=>setLs(x=>x.filter((_,j)=>j!==i))}>×</button></span>)}</div><div className="p-add"><input className="p-input" placeholder="@handle" value={newSocial} onChange={e=>setNewSocial(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}/><button className="p-add-btn" onClick={()=>{if(newSocial.trim()){setLs(x=>[...x,newSocial.trim()]);setNewSocial('');}}}>Add</button></div></div>
            <button className="p-save" onClick={saveAll}>Save & Refresh</button>
          </div>
        </div>
      </div>
    );
  };

  const mainCats=['general','sports','business','finance','bloom','houston'];

  return(
    <>
      <style>{css}</style>
      <div className={`hub${dark?' dark':''}`}>
        <div className="topbar">
          <div className="topbar-inner">
            <div className="logo">My<span>News</span>Hub<span className="logo-dot"/></div>
            <div className="nav-tabs">
              {[
                {id:'today',label:'Today'},
                {id:'general',label:'🌐 General'},
                {id:'sports',label:'🏆 Sports'},
                {id:'business',label:'⚡ Business'},
                {id:'finance',label:'📈 Finance'},
                {id:'bloom',label:'🔋 Bloom'},
                {id:'houston',label:'🤠 Houston'},
                {id:'briefing',label:'☀️ Briefing'},
                {id:'podcasts',label:'🎙️ Podcasts'},
                {id:'social',label:'📱 Social'},
                {id:'saved',label:'🔖 Saved'},
              ].map(t=>(
                <button key={t.id} className={`nav-tab${tab===t.id?' active':''}`}
                  onClick={()=>{setTab(t.id);setActiveKw('');setSearch('');if(mainCats.includes(t.id)&&!(arts[t.id]||[]).length)loadCat(t.id);}}>
                  {t.label}{t.id==='saved'&&(saved.length+readLater.length)>0?` (${saved.length+readLater.length})`:''}
                </button>
              ))}
            </div>
            <div className="topbar-right">
              <div className="search-wrap"><span className="search-icon">🔍</span><input className="search" placeholder="Search..." value={search} onChange={e=>{setSearch(e.target.value);setActiveKw('');}}/></div>
              <button className="compact-toggle" onClick={()=>setCompact(c=>!c)}>{compact?'📰 Full':'📋 Compact'}</button>
              <button className="btn-icon" onClick={refreshAll}>↺</button>
              <button className="btn-icon" onClick={()=>setDark(d=>!d)}>{dark?'☀':'🌙'}</button>
              <button className="btn-blue" onClick={()=>setShowPanel(true)}>⚙️ Customize</button>
            </div>
          </div>
        </div>
        <WeatherBar/>
        {breaking&&(<div className="breaking show"><div className="breaking-inner"><span className="breaking-badge">BREAKING</span><span className="breaking-text">{breaking.title} — {breaking.source}</span><button className="breaking-x" onClick={()=>setBreaking(null)}>✕</button></div></div>)}
        {(tab==='today'||mainCats.includes(tab))&&<HeroCarousel/>}
        <TickerBar/>
        {tab==='today'&&<TodayPage/>}
        {mainCats.includes(tab)&&<CatPage cat={tab}/>}
        {tab==='briefing'&&<div style={{maxWidth:1400,margin:'0 auto',padding:16}}><BriefingPage/></div>}
        {tab==='podcasts'&&<div style={{maxWidth:1400,margin:'0 auto',padding:16}}><PodcastsPage/></div>}
        {tab==='social'&&<SocialPage getSummary={getSummary} summaries={summaries} sumLoading={sumLoading} saveArt={saveArt} isSaved={isSaved} readLaterArt={readLaterArt} isReadLater={isReadLater}/>}
        {tab==='saved'&&<SavedPage/>}
        {showPanel&&<CustomizePanel/>}
      </div>
    </>
  );
}
