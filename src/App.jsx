// MyNewsHub v17 — Session 3: Editorial polish + Ghost treatment everywhere
// ─────────────────────────────────────────────────────────────────────────────
// Builds on v16 mobile foundation. Same desktop+mobile behaviors. Today page
// is restructured for clear MSN-style hierarchy; Ghost design language extended
// across feed cards, podcast/social blocks, finance, and right-rail.
//
// Changes from v16:
//  ── Today page restructure (hierarchy = density gradient) ──
//  • Large hero (single lead story, MSN-style)
//  • AI Morning Briefing folded BENEATH hero as a tight bold paragraph (no card)
//  • RightNowStrip — ghost treatment (no border, no surface bg)
//  • FollowingStrip — compact, single line per entity
//  • ONE TrendingCarousel (sidebar trending removed on Today — was duplicate)
//  • Vertical category sections preserved with cleaner ghost block headers
//  • Today sidebar removed; Today uses single-column main flow
//
//  ── Ghost treatment extended ──
//  • Podcast cards lose all borders/bg at rest
//  • Social follow blocks borderless, typography-only
//  • Finance page table + watchlist Ghost-ified
//  • Section dividers replaced by whitespace (36px) + caps labels
//
//  ── Mobile polish ──
//  • Hero cap 280→240px on mobile
//  • Verified 44px+ tap targets across action buttons
//
//  ── Infra ──
//  • Storage key v16_ → v17_ with migration from v16/v15/v14
//  • All v16 features preserved: Following entities, swipe, PTR, auto-hide
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from ‘react’;

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATS = {
general:  { label:‘General’,      color:’#1d4ed8’, bg:’#eff6ff’, emoji:‘🌐’ },
sports:   { label:‘Sports’,       color:’#d97706’, bg:’#fef3c7’, emoji:‘🏆’ },
business: { label:‘Business’,     color:’#16a34a’, bg:’#f0fdf4’, emoji:‘⚡’ },
finance:  { label:‘Finance’,      color:’#7c3aed’, bg:’#f5f3ff’, emoji:‘📈’ },
bloom:    { label:‘Bloom Energy’, color:’#0369a1’, bg:’#e0f2fe’, emoji:‘🔋’ },
comedy:   { label:‘Comedy’,       color:’#db2777’, bg:’#fdf2f8’, emoji:‘😂’ },
};

// Order for mobile swipe-left/right navigation between categories.
// Matches the mobile chip bar order so swiping feels like advancing the chips.
const SWIPE_ORDER = [‘today’,‘general’,‘sports’,‘business’,‘finance’,‘bloom’,‘comedy’];

const TICKERS = [
{ sym:‘BE’,   label:‘Bloom Energy’, color:’#60a5fa’ },
{ sym:‘CL=F’, label:‘Crude Oil’,    color:’#4ade80’ },
{ sym:‘BTC’,  label:‘Bitcoin’,      color:’#fbbf24’ },
];

const PODCAST_FEEDS = [
{ name:‘Joe Rogan Experience’, host:‘Joe Rogan’,         url:‘https://feeds.megaphone.fm/GLT1412515089’,   emoji:‘🟢’ },
{ name:‘Ben Shapiro Show’,     host:‘Ben Shapiro’,       url:‘https://feeds.megaphone.fm/BVDWV5370667266’, emoji:‘🔵’ },
{ name:‘Tucker Carlson Show’,  host:‘Tucker Carlson’,    url:‘https://feeds.megaphone.fm/RSV1597324942’,   emoji:‘🦅’ },
{ name:‘Candace’,              host:‘Candace Owens’,     url:‘https://feeds.megaphone.fm/candace’,         emoji:‘🎤’ },
{ name:‘Morning Wire’,         host:‘Daily Wire’,        url:‘https://feeds.megaphone.fm/BVDWV8747925072’, emoji:‘☀️’ },
{ name:‘All-In Podcast’,       host:‘Chamath & Besties’, url:‘https://allinchamathjason.libsyn.com/rss’,   emoji:‘💰’ },
{ name:‘Flagrant’,             host:‘Andrew Schulz’,     url:‘https://feeds.megaphone.fm/APPI6857213837’,  emoji:‘🔥’ },
];

const DEFAULT_KW = {
general:  [‘Houston’,‘Texas’,‘Trump’,‘Congress’,‘White House’,‘geopolitical’,‘AI’,‘tech’,‘Iran’,‘tariffs’],
sports:   [‘Texans’,‘Rockets’,‘Astros’,‘Braves’,‘Kentucky’,‘Clemson’,‘NFL’,‘MLB’,‘NBA’,‘CFB’,‘recruiting’,‘transfer portal’],
business: [‘energy’,‘oil’,‘gas’,‘data center’,‘ERCOT’,‘LNG’,‘power grid’,‘onshoring’,‘AI’,‘infrastructure’],
finance:  [‘investing’,‘real estate’,‘stock market’,‘interest rates’,‘Fed’,‘inflation’,‘crypto’,‘portfolio’],
bloom:    [‘Bloom Energy’,‘fuel cell’,‘hydrogen’,‘microgrid’,‘distributed power’,‘data center’,‘onshoring’,‘industrial energy’,‘utility’,‘ERCOT’],
comedy:   [‘satire’,‘parody’,‘humor’,‘comedy’],
};

const DEFAULT_FEEDS = {
general: [
{ name:‘BBC News’,          url:‘https://feeds.bbci.co.uk/news/rss.xml’,                                    on:true },
{ name:‘Reuters Top News’,  url:‘https://feeds.reuters.com/reuters/topNews’,                                on:true },
{ name:‘CNBC Top News’,     url:‘https://www.cnbc.com/id/100003114/device/rss/rss.html’,                    on:true },
{ name:‘Fox News’,          url:‘https://moxie.foxnews.com/google-publisher/latest.xml’,                    on:true },
{ name:‘NY Post’,           url:‘https://nypost.com/feed/’,                                                 on:true },
{ name:‘The Hill’,          url:‘https://thehill.com/homenews/feed/’,                                       on:true },
{ name:‘TechCrunch’,        url:‘https://techcrunch.com/feed/’,                                             on:true },
{ name:‘Washington Times’,  url:‘https://www.washingtontimes.com/rss/headlines/news/’,                      on:true },
{ name:‘The Guardian US’,   url:‘https://www.theguardian.com/us/rss’,                                       on:true },
{ name:‘Axios’,             url:‘https://api.axios.com/feed/’,                                              on:true },
{ name:‘Breitbart’,         url:‘https://feeds.feedburner.com/breitbart’,                                   on:true },
{ name:‘KHOU Houston’,      url:‘https://www.khou.com/feeds/syndication/rss/news’,                          on:true },
{ name:‘Click2Houston’,     url:‘https://www.click2houston.com/rss/news.rss’,                               on:true },
{ name:‘Chron.com’,         url:‘https://www.chron.com/rss/feed/News-270.php’,                              on:true },
{ name:‘Morning Brew’,      url:‘https://www.morningbrew.com/feed’,                                         on:true },
{ name:‘Morning Wire’,      url:‘https://feeds.megaphone.fm/BVDWV8747925072’,                               on:true },
],
sports: [
{ name:‘ESPN NFL’,             url:‘https://www.espn.com/espn/rss/nfl/news’,                                on:true },
{ name:‘ESPN NBA’,             url:‘https://www.espn.com/espn/rss/nba/news’,                                on:true },
{ name:‘ESPN MLB’,             url:‘https://www.espn.com/espn/rss/mlb/news’,                                on:true },
{ name:‘ESPN CFB’,             url:‘https://www.espn.com/espn/rss/ncf/news’,                                on:true },
{ name:‘ESPN CBB’,             url:‘https://www.espn.com/espn/rss/ncb/news’,                                on:true },
{ name:‘CBS Sports NFL’,       url:‘https://www.cbssports.com/rss/headlines/nfl’,                           on:true },
{ name:‘CBS Sports NBA’,       url:‘https://www.cbssports.com/rss/headlines/nba’,                           on:true },
{ name:‘CBS Sports MLB’,       url:‘https://www.cbssports.com/rss/headlines/mlb’,                           on:true },
{ name:‘CBS Sports CFB’,       url:‘https://www.cbssports.com/rss/headlines/college-football’,              on:true },
{ name:‘CBS Sports CBB’,       url:‘https://www.cbssports.com/rss/headlines/college-basketball’,            on:true },
{ name:‘Pro Football Talk’,    url:‘https://www.nbcsports.com/profootballtalk.rss’,                         on:true },
{ name:‘Bleacher Report’,      url:‘https://feeds.bleacherreport.com/articles/feed’,                        on:true },
{ name:‘247Sports’,            url:‘https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/’, on:true },
{ name:‘Kentucky Sports Radio’,url:‘https://kentuckysportsradio.com/feed/’,                                 on:true },
{ name:‘On3 Recruiting’,       url:‘https://www.on3.com/feed/’,                                             on:true },
{ name:‘The Spun’,             url:‘https://thespun.com/.rss/full/’,                                        on:true },
],
business: [
{ name:‘Reuters Business’,       url:‘https://feeds.reuters.com/reuters/businessNews’,                      on:true },
{ name:‘CNBC Energy’,            url:‘https://www.cnbc.com/id/10000664/device/rss/rss.html’,                on:true },
{ name:‘Oilprice.com’,           url:‘https://oilprice.com/rss/main’,                                       on:true },
{ name:‘Utility Dive’,           url:‘https://www.utilitydive.com/feeds/news/’,                             on:true },
{ name:‘Data Center Dynamics’,   url:‘https://www.datacenterdynamics.com/en/rss/’,                          on:true },
{ name:‘Power Magazine’,         url:‘https://www.powermag.com/feed/’,                                      on:true },
{ name:‘Rigzone’,                url:‘https://www.rigzone.com/news/rss/rigzone_latest.aspx’,                on:true },
{ name:‘MIT Tech Review’,        url:‘https://www.technologyreview.com/feed/’,                              on:true },
{ name:‘AI News’,                url:‘https://artificialintelligence-news.com/feed/’,                       on:true },
{ name:‘Canary Media’,           url:‘https://www.canarymedia.com/rss’,                                     on:true },
{ name:‘The Guardian Business’,  url:‘https://www.theguardian.com/business/rss’,                            on:true },
{ name:‘CNBC Tech’,              url:‘https://www.cnbc.com/id/19854910/device/rss/rss.html’,                on:true },
],
finance: [
{ name:‘MarketWatch’,   url:‘https://feeds.marketwatch.com/marketwatch/topstories/’,                        on:true },
{ name:‘Yahoo Finance’, url:‘https://finance.yahoo.com/news/rssindex’,                                      on:true },
{ name:‘Kiplinger’,     url:‘https://www.kiplinger.com/rss/all’,                                            on:true },
{ name:‘Motley Fool’,   url:‘https://www.fool.com/feeds/index.aspx’,                                        on:true },
{ name:‘Investopedia’,  url:‘https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline’, on:true },
{ name:‘BiggerPockets’, url:‘https://www.biggerpockets.com/blog/feed’,                                      on:true },
{ name:‘CNBC Finance’,  url:‘https://www.cnbc.com/id/10000664/device/rss/rss.html’,                         on:true },
],
bloom: [
{ name:‘Oilprice.com’,          url:‘https://oilprice.com/rss/main’,                                        on:true },
{ name:‘Utility Dive’,          url:‘https://www.utilitydive.com/feeds/news/’,                               on:true },
{ name:‘Data Center Dynamics’,  url:‘https://www.datacenterdynamics.com/en/rss/’,                            on:true },
{ name:‘Power Magazine’,        url:‘https://www.powermag.com/feed/’,                                        on:true },
{ name:‘Reuters Business’,      url:‘https://feeds.reuters.com/reuters/businessNews’,                        on:true },
{ name:‘CNBC Energy’,           url:‘https://www.cnbc.com/id/10000664/device/rss/rss.html’,                  on:true },
{ name:‘MIT Tech Review’,       url:‘https://www.technologyreview.com/feed/’,                                on:true },
{ name:‘Canary Media’,          url:‘https://www.canarymedia.com/rss’,                                       on:true },
{ name:‘Rigzone’,               url:‘https://www.rigzone.com/news/rss/rigzone_latest.aspx’,                   on:true },
],
comedy: [
{ name:‘The Babylon Bee’, url:‘https://babylonbee.com/feed’,  on:true },
{ name:‘The Onion’,       url:‘https://www.theonion.com/rss’, on:true },
],
};

const DEFAULT_SOCIAL = {
general: {
twitter:   [’@Bloomberg’,’@Reuters’,’@WSJ’,’@FoxNews’,’@CNN’,’@CNBC’,’@BBCWorld’,’@DailyWire’,’@HoustonChron’,’@Axios’],
linkedin:  [],
instagram: [],
youtube:   [‘AssociatedPress’,‘CNBC’,‘BloombergTelevision’],
},
sports: {
twitter:   [’@HoustonTexans’,’@HoustonRockets’,’@astros’,’@Braves’,’@KentuckyMBB’,’@UKFootball’,’@ClemsonFB’,’@247Sports’,’@Rivals’,’@On3Sports’,’@espn’],
linkedin:  [],
instagram: [’@houstontexans’,’@houstonrockets’,’@astros’,’@braves’,’@kentuckymbb’,’@ukfootball’,’@clemsonfootball’,’@espn’,’@nfl’,’@mlb’,’@nba’],
youtube:   [‘ESPN’,‘NFL’,‘NBA’,‘MLB’],
},
business: {
twitter:   [’@OilandGasJnl’,’@HartEnergy’,’@UtilityDive’,’@EENewsUpdates’,’@POWERmagazine’,’@DCDnews’,’@Rigzone’,’@OpenAI’,’@nvidia’],
linkedin:  [‘Marathon Petroleum’,‘ExxonMobil’,‘Chevron’,‘Shell’,‘NRG Energy’,‘Bloom Energy’,‘Google DeepMind’,‘NVIDIA’,‘Microsoft’],
instagram: [],
youtube:   [‘bloomenergy’,‘Bloomberg’,‘CNBC’],
},
finance: {
twitter:   [’@MarketWatch’,’@YahooFinance’,’@Kiplinger’,’@MotleyFool’,’@Investopedia’,’@BiggerPockets’,’@CNBC’,’@FinancialTimes’],
linkedin:  [‘Marathon Petroleum’,‘Bloom Energy’],
instagram: [],
youtube:   [‘BloombergTelevision’,‘CNBCtelevision’,‘YahooFinance’],
},
bloom: {
twitter:   [’@BloomEnergy’,’@UtilityDive’,’@POWERmagazine’,’@DCDnews’,’@CanaryMediaInc’],
linkedin:  [‘Bloom Energy’,‘Marathon Petroleum’,‘ExxonMobil’,‘NRG Energy’],
instagram: [’@bloomenergy’],
youtube:   [‘bloomenergy’],
},
comedy: {
twitter:   [’@TheBabylonBee’,’@TheOnion’,’@ClickHole’],
linkedin:  [],
instagram: [’@thebabylonbee’,’@theonion’],
youtube:   [‘TheBabylonBee’,‘TheOnion’],
},
};

const SCORE_TEAMS = [
{ team:‘Texans’,       sport:‘football’,   league:‘nfl’,                       match:‘Houston Texans’,    emoji:‘🏈’ },
{ team:‘Rockets’,      sport:‘basketball’, league:‘nba’,                       match:‘Houston Rockets’,   emoji:‘🏀’ },
{ team:‘Astros’,       sport:‘baseball’,   league:‘mlb’,                       match:‘Houston Astros’,    emoji:‘⚾’ },
{ team:‘Braves’,       sport:‘baseball’,   league:‘mlb’,                       match:‘Atlanta Braves’,    emoji:‘⚾’ },
{ team:‘UK Basketball’,sport:‘basketball’, league:‘mens-college-basketball’,   match:‘Kentucky’,          emoji:‘🏀’ },
{ team:‘UK Football’,  sport:‘football’,   league:‘college-football’,          match:‘Kentucky’,          emoji:‘🏈’ },
{ team:‘Clemson FB’,   sport:‘football’,   league:‘college-football’,          match:‘Clemson’,           emoji:‘🏈’ },
];

const LEAGUES = [
{ key:‘nfl’, label:‘NFL’,       sport:‘football’,   league:‘nfl’,                     emoji:‘🏈’, accent:’#1d4ed8’ },
{ key:‘nba’, label:‘NBA’,       sport:‘basketball’, league:‘nba’,                     emoji:‘🏀’, accent:’#dc2626’ },
{ key:‘mlb’, label:‘MLB’,       sport:‘baseball’,   league:‘mlb’,                     emoji:‘⚾’, accent:’#1d4ed8’ },
{ key:‘cfb’, label:‘College FB’,sport:‘football’,   league:‘college-football’,        emoji:‘🏈’, accent:’#7c3aed’ },
{ key:‘cbb’, label:‘College BB’,sport:‘basketball’, league:‘mens-college-basketball’, emoji:‘🏀’, accent:’#d97706’ },
];

const SK = ‘v17_’;
const OLD_SKS = [‘v16_’,‘v15_’,‘v14_’];

const DEFAULT_URGENT = [
‘breaking’,‘hurricane’,‘earthquake’,‘tornado’,‘wildfire’,
‘explosion’,‘evacuation’,‘shooting’,‘tsunami’,‘pandemic’,
‘recall’,‘outage’,‘market crash’,‘flash flood’,‘state of emergency’,
];

const INDICES = [
{ sym:’^GSPC’, label:‘S&P 500’,   short:‘S&P’ },
{ sym:’^DJI’,  label:‘Dow Jones’, short:‘DOW’ },
{ sym:’^IXIC’, label:‘Nasdaq’,    short:‘NDQ’ },
];

const DEFAULT_WATCHLIST = [
{ sym:‘BE’,    name:‘Bloom Energy’ },
{ sym:‘MPC’,   name:‘Marathon Petroleum’ },
{ sym:‘XOM’,   name:‘Exxon Mobil’ },
{ sym:‘CVX’,   name:‘Chevron’ },
{ sym:‘NVDA’,  name:‘NVIDIA’ },
{ sym:‘MSFT’,  name:‘Microsoft’ },
{ sym:‘GOOGL’, name:‘Alphabet’ },
];

// ─── FOLLOWING (Yahoo Sports “My Teams” pattern, generalized) ────────────────
// The user’s tracked entities — companies, teams, tickers, topics. Each entity
// has a set of match terms (what to search for in article titles/descriptions)
// and an optional category that its articles belong to. The Today page’s
// FollowingStrip shows the latest headline per entity, turning the app from
// “news by topic” into “news about things I care about.”
// kind: ‘company’ | ‘team’ | ‘topic’ — drives the icon and (later) the entity page.
// ticker: optional stock symbol for companies (enables live price in strip)
const DEFAULT_FOLLOWING = [
{ id:‘bloom’,    name:‘Bloom Energy’,        kind:‘company’, ticker:‘BE’,  emoji:‘🔋’,
match:[‘Bloom Energy’,‘fuel cell’,‘solid oxide’,‘SOFC’] },
{ id:‘mpc’,      name:‘Marathon Petroleum’,  kind:‘company’, ticker:‘MPC’, emoji:‘⛽’,
match:[‘Marathon Petroleum’,‘MPC’,‘Marathon refining’] },
{ id:‘xom’,      name:‘ExxonMobil’,          kind:‘company’, ticker:‘XOM’, emoji:‘🛢️’,
match:[‘ExxonMobil’,‘Exxon’,‘XOM’] },
{ id:‘texans’,   name:‘Houston Texans’,      kind:‘team’,                   emoji:‘🏈’,
match:[‘Texans’,‘Houston Texans’] },
{ id:‘astros’,   name:‘Houston Astros’,      kind:‘team’,                   emoji:‘⚾’,
match:[‘Astros’,‘Houston Astros’] },
{ id:‘uk’,       name:‘Kentucky Basketball’, kind:‘team’,                   emoji:‘🏀’,
match:[‘Kentucky basketball’,‘UK Wildcats’,‘Kentucky Wildcats’] },
{ id:‘ai_dc’,    name:‘AI Data Centers’,     kind:‘topic’,                  emoji:‘🧠’,
match:[‘data center’,‘hyperscale’,‘AI infrastructure’,‘GPU cluster’] },
{ id:‘ercot’,    name:‘ERCOT / TX Grid’,     kind:‘topic’,                  emoji:‘⚡’,
match:[‘ERCOT’,‘Texas grid’,‘Texas power’,‘PUC’] },
];

const DEFAULT_WEATHER_CITIES = [
{ name:‘Houston’,    lat:29.7604, lon:-95.3698, tz:‘America/Chicago’,  slug:‘Houston+TX’ },
{ name:‘Louisville’, lat:38.2527, lon:-85.7585, tz:‘America/New_York’, slug:‘Louisville+KY’ },
];

const WX_CODES  = {0:‘Clear’,1:‘Mostly Clear’,2:‘Partly Cloudy’,3:‘Overcast’,45:‘Foggy’,48:‘Icy Fog’,51:‘Light Drizzle’,53:‘Drizzle’,55:‘Heavy Drizzle’,61:‘Light Rain’,63:‘Rain’,65:‘Heavy Rain’,71:‘Light Snow’,73:‘Snow’,75:‘Heavy Snow’,80:‘Showers’,81:‘Heavy Showers’,95:‘Thunderstorm’,99:‘Severe Storm’};
const WX_EMOJI = {0:‘☀️’,1:‘🌤️’,2:‘⛅’,3:‘☁️’,45:‘🌫️’,48:‘🌫️’,51:‘🌦️’,53:‘🌦️’,55:‘🌧️’,61:‘🌧️’,63:‘🌧️’,65:‘⛈️’,71:‘🌨️’,73:‘❄️’,75:‘❄️’,80:‘🌦️’,81:‘🌧️’,95:‘⛈️’,99:‘🌪️’};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
function ld(k, d) {
try {
let v = localStorage.getItem(SK + k);
if (v === null) {
for (const prefix of OLD_SKS) {
const old = localStorage.getItem(prefix + k);
if (old !== null) { localStorage.setItem(SK + k, old); v = old; break; }
}
}
return v ? JSON.parse(v) : d;
} catch { return d; }
}
function sv(k, v) { try { localStorage.setItem(SK + k, JSON.stringify(v)); } catch {} }

// ─── IMAGE EXTRACTION ─────────────────────────────────────────────────────────
function extractImage(item, descHTML) {
if (!item) return ‘’;
const mc = item.querySelector(‘content[url], [*|content][url]’);
if (mc?.getAttribute(‘url’)) return mc.getAttribute(‘url’);
const mt = item.querySelector(’thumbnail[url], [*|thumbnail][url]’);
if (mt?.getAttribute(‘url’)) return mt.getAttribute(‘url’);
const enc = item.querySelector(‘enclosure[type^=“image”]’);
if (enc?.getAttribute(‘url’)) return enc.getAttribute(‘url’);
const iu = item.querySelector(‘image url’);
if (iu?.textContent) return iu.textContent.trim();
if (descHTML) {
const m = descHTML.match(/<img[^>]+src=[”’]([^"']+)[”’]/i);
if (m) return m[1];
}
return ‘’;
}
function extractImageFromJson(i) {
if (i.thumbnail && i.thumbnail.length > 10) return i.thumbnail;
if (i.enclosure?.link && /.(jpg|jpeg|png|webp|gif)/i.test(i.enclosure.link)) return i.enclosure.link;
const html = i.content || i.description || ‘’;
const m = html.match(/<img[^>]+src=[”’]([^"']+)[”’]/i);
return m ? m[1] : ‘’;
}

// ─── RSS FETCH ────────────────────────────────────────────────────────────────
function parseXML(txt) {
const p = new DOMParser(), x = p.parseFromString(txt, ‘text/xml’);
const items = Array.from(x.querySelectorAll(‘item’)).slice(0, 15);
if (!items.length) return [];
return items.map(i => {
const descRaw = i.querySelector(‘description’)?.textContent || i.querySelector(‘summary’)?.textContent || ‘’;
const desc = descRaw.replace(/<[^>]*>/g,’’).replace(/&/g,’&’).replace(/ /g,’ ‘).trim().slice(0,300);
return {
title:   (i.querySelector(‘title’)?.textContent || ‘’).trim(),
link:    i.querySelector(‘link’)?.textContent || ‘’,
desc, pubDate: i.querySelector(‘pubDate’)?.textContent || ‘’,
img:     extractImage(i, descRaw),
duration:i.querySelector(‘duration’)?.textContent || ‘’,
};
});
}
async function fetchWithTimeout(url, ms=8000) {
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), ms);
try { return await fetch(url, {signal:ctrl.signal}); } finally { clearTimeout(timer); }
}
async function fetchRSS(url) {
try {
const r = await fetchWithTimeout(`/api/rss?url=${encodeURIComponent(url)}`, 10000);
if (r.ok) { const items = parseXML(await r.text()); if (items.length) return {items, reason:’’}; }
} catch {}
try {
const r = await fetchWithTimeout(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
if (r.ok) {
const d = await r.json();
if (d.items?.length > 0) return {
items: d.items.map(i => ({
title:(i.title||’’).trim(), link:i.link,
desc:(i.description||i.content||’’).replace(/<[^>]*>/g,’’).replace(/&/g,’&’).replace(/ /g,’ ‘).trim().slice(0,300),
pubDate:i.pubDate, img:extractImageFromJson(i), duration:i.itunes_duration||’’,
})), reason:’’,
};
}
} catch {}
try {
const r = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
if (r.ok) { const d = await r.json(); if (d.contents) { const items = parseXML(d.contents); if (items.length) return {items, reason:’’}; } }
} catch {}
try {
const r = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(url)}`);
if (r.ok) { const items = parseXML(await r.text()); if (items.length) return {items, reason:’’}; }
} catch {}
return {items:[], reason:‘All proxies failed’};
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
function fmtDate(d) {
if (!d) return ‘’;
try {
const dt = new Date(d); if (isNaN(dt.getTime())) return ‘’;
const now = new Date(), diff = Math.floor((now-dt)/1000);
const days=[‘Sun’,‘Mon’,‘Tue’,‘Wed’,‘Thu’,‘Fri’,‘Sat’];
const months=[‘Jan’,‘Feb’,‘Mar’,‘Apr’,‘May’,‘Jun’,‘Jul’,‘Aug’,‘Sep’,‘Oct’,‘Nov’,‘Dec’];
const h=dt.getHours()%12||12, m=String(dt.getMinutes()).padStart(2,‘0’), ampm=dt.getHours()>=12?‘PM’:‘AM’;
if (diff < 60) return ‘Just now’;
if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
if (diff < 86400) return `${days[dt.getDay()]} ${h}:${m} ${ampm}`;
return `${months[dt.getMonth()]} ${dt.getDate()} · ${h}:${m} ${ampm}`;
} catch { return ‘’; }
}
function fmtDuration(s) {
if (!s) return ‘’;
const parts = s.split(’:’).map(Number);
if (parts.length===3) { const [h,m]=parts; return h>0?`${h}h ${m}m`:`${m}m`; }
if (parts.length===2) return `${parts[0]}m`;
const tot=parseInt(s); if (isNaN(tot)) return s;
const h=Math.floor(tot/3600), m=Math.floor((tot%3600)/60);
return h>0?`${h}h ${m}m`:`${m}m`;
}

// ─── WEATHER / QUOTES / SCORES ───────────────────────────────────────────────
async function fetchWeatherCity(city) {
try {
const r = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=${encodeURIComponent(city.tz)}`);
const d = await r.json(), c = d.current;
return {name:city.name, slug:city.slug, temp:Math.round(c.temperature_2m), code:c.weathercode, wind:Math.round(c.windspeed_10m), desc:WX_CODES[c.weathercode]||‘Unknown’, emoji:WX_EMOJI[c.weathercode]||‘🌡️’};
} catch { return null; }
}
async function fetchAllWeather(cities) {
return (await Promise.all(cities.map(fetchWeatherCity))).filter(Boolean);
}
async function fetchQuote(sym) {
try {
const r = await fetchWithTimeout(`/api/quote?sym=${encodeURIComponent(sym)}`,7000);
if (r.ok) { const d=await r.json(); if (typeof d.price===‘number’) return {price:d.price,chg:d.chg,pct:d.pct}; }
} catch {}
try {
const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
const r=await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
const d=await r.json(), data=JSON.parse(d.contents), meta=data.chart.result[0].meta;
const price=meta.regularMarketPrice, prev=meta.previousClose||meta.chartPreviousClose;
return {price, chg:price-prev, pct:((price-prev)/prev)*100};
} catch { return null; }
}
async function fetchScoreboard(sport, league) {
try {
const r = await fetchWithTimeout(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`,10000);
if (!r.ok) return [];
const d = await r.json();
return (d.events||[]).map(ev => {
const comp=ev.competitions?.[0];
const home=comp?.competitors?.find(c=>c.homeAway===‘home’);
const away=comp?.competitors?.find(c=>c.homeAway===‘away’);
return {
id:ev.id, name:ev.name, short:ev.shortName, date:ev.date,
status:ev.status?.type?.description||’’, state:ev.status?.type?.state||’’,
homeName:home?.team?.shortDisplayName||’’, homeAbbr:home?.team?.abbreviation||’’,
homeLogo:home?.team?.logo||’’, homeScore:home?.score||’’,
awayName:away?.team?.shortDisplayName||’’, awayAbbr:away?.team?.abbreviation||’’,
awayLogo:away?.team?.logo||’’, awayScore:away?.score||’’,
link:ev.links?.[0]?.href||’’,
};
});
} catch { return []; }
}
async function fetchAllScores() {
const results = {};
await Promise.allSettled(LEAGUES.map(async L => {
const games = await fetchScoreboard(L.sport, L.league);
games.sort((a,b) => {
const order={in:0,pre:1,post:2};
const oa=order[a.state]??3, ob=order[b.state]??3;
return oa!==ob ? oa-ob : new Date(a.date)-new Date(b.date);
});
results[L.key] = games;
}));
return results;
}
function favoriteIn(game) {
if (!game) return null;
const txt=((game.homeName||’’)+’ ‘+(game.awayName||’’)+’ ‘+(game.short||’’)+’ ‘+(game.name||’’)).toLowerCase();
return SCORE_TEAMS.find(t=>txt.includes(t.match.toLowerCase()))||null;
}

// ─── SOCIAL HELPERS ───────────────────────────────────────────────────────────
function socialUrl(platform, handle) {
const h = handle.replace(/^@/,’’);
switch(platform) {
case ‘twitter’:   return `https://twitter.com/${h}`;
case ‘linkedin’:  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(h)}`;
case ‘instagram’: return `https://www.instagram.com/${h.toLowerCase()}`;
case ‘youtube’:   return `https://www.youtube.com/@${h}`;
default:          return ‘#’;
}
}
const SOCIAL_META = {
twitter:   {label:‘X / Twitter’, color:’#000000’, bg:’#f4f4f5’, icon:‘𝕏’},
linkedin:  {label:‘LinkedIn’,    color:’#0a66c2’, bg:’#e8f2fb’, icon:‘in’},
instagram: {label:‘Instagram’,   color:’#e1306c’, bg:’#fdeff5’, icon:‘IG’},
youtube:   {label:‘YouTube’,     color:’#ff0000’, bg:’#fee’,    icon:‘▶’},
};

// ─── CUSTOM HOOKS (Yahoo-style mobile interactions) ──────────────────────────

// Returns true when viewport is mobile-sized (≤640px). Used to gate
// swipe/auto-hide/pull-to-refresh behaviors — pointless on desktop and
// expensive to wire up unconditionally.
function useIsMobile() {
const [isMobile, setIsMobile] = useState(() =>
typeof window !== ‘undefined’ ? window.matchMedia(’(max-width: 640px)’).matches : false
);
useEffect(() => {
if (typeof window === ‘undefined’) return;
const mq = window.matchMedia(’(max-width: 640px)’);
const handler = e => setIsMobile(e.matches);
if (mq.addEventListener) mq.addEventListener(‘change’, handler);
else mq.addListener(handler);
return () => {
if (mq.removeEventListener) mq.removeEventListener(‘change’, handler);
else mq.removeListener(handler);
};
}, []);
return isMobile;
}

// Auto-hide header on scroll-down / reveal on scroll-up. The Medium/Yahoo
// pattern: content gets max screen real estate while scrolling, header
// reappears the instant the user shows intent to navigate (scroll up).
// 6px threshold ignores jitter; 80px start threshold prevents hide when
// barely below the fold.
function useScrollDirection(enabled) {
const [hidden, setHidden] = useState(false);
const lastY = useRef(0);
const ticking = useRef(false);
useEffect(() => {
if (!enabled) { setHidden(false); return; }
const onScroll = () => {
if (ticking.current) return;
ticking.current = true;
requestAnimationFrame(() => {
const y = window.scrollY;
const delta = y - lastY.current;
if (Math.abs(delta) > 6) {
if (delta > 0 && y > 80) setHidden(true);
else if (delta < 0) setHidden(false);
lastY.current = y;
}
ticking.current = false;
});
};
window.addEventListener(‘scroll’, onScroll, { passive: true });
return () => window.removeEventListener(‘scroll’, onScroll);
}, [enabled]);
return hidden;
}

// Horizontal swipe detection — returns touch handlers to spread onto an
// element. Fires onSwipe(‘left’|‘right’) when user completes a decisive
// horizontal swipe. Requires horizontal dx to dominate dy by 1.8× and
// exceed threshold, so vertical scrolls still feel native and don’t trigger
// accidental category changes.
function useSwipe(onSwipe, { threshold = 60, enabled = true } = {}) {
const state = useRef({ x: 0, y: 0, active: false });
const onTouchStart = (e) => {
if (!enabled) return;
const t = e.touches[0];
state.current = { x: t.clientX, y: t.clientY, active: true };
};
const onTouchEnd = (e) => {
if (!enabled || !state.current.active) return;
const t = (e.changedTouches && e.changedTouches[0]) || null;
state.current.active = false;
if (!t) return;
const dx = t.clientX - state.current.x;
const dy = t.clientY - state.current.y;
if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.8) {
onSwipe(dx > 0 ? ‘right’ : ‘left’);
}
};
return { onTouchStart, onTouchEnd };
}

// Pull-to-refresh. Activates only when scrollY is near 0 (user is at
// top of page). Drag down → progress indicator; release past threshold
// → fires onRefresh(). Uses 0.55 resistance curve so the drag doesn’t
// feel 1:1 sluggish, capped at 140px so the indicator never flies off.
function usePullToRefresh(onRefresh, { threshold = 70, enabled = true } = {}) {
const [pulling, setPulling] = useState(false);
const [distance, setDistance] = useState(0);
const state = useRef({ startY: 0, active: false });

useEffect(() => {
if (!enabled) return;
const onTouchStart = (e) => {
if (window.scrollY > 4) { state.current.active = false; return; }
state.current = { startY: e.touches[0].clientY, active: true };
};
const onTouchMove = (e) => {
if (!state.current.active) return;
const dy = e.touches[0].clientY - state.current.startY;
if (dy > 0 && window.scrollY <= 4) {
const pulled = Math.min(dy * 0.55, 140);
setPulling(true);
setDistance(pulled);
} else if (dy < 0) {
setPulling(false);
setDistance(0);
}
};
const onTouchEnd = () => {
if (!state.current.active) return;
state.current.active = false;
if (distance >= threshold) onRefresh();
setPulling(false);
setDistance(0);
};
window.addEventListener(‘touchstart’, onTouchStart, { passive: true });
window.addEventListener(‘touchmove’, onTouchMove, { passive: true });
window.addEventListener(‘touchend’, onTouchEnd, { passive: true });
return () => {
window.removeEventListener(‘touchstart’, onTouchStart);
window.removeEventListener(‘touchmove’, onTouchMove);
window.removeEventListener(‘touchend’, onTouchEnd);
};
}, [enabled, onRefresh, distance, threshold]);

return { pulling, distance };
}

// ─── AI SUMMARY ───────────────────────────────────────────────────────────────
async function fetchAISummary({type, title, content, mode=‘summary’}) {
try {
const r = await fetch(’/api/summarize’, {
method:‘POST’, headers:{‘Content-Type’:‘application/json’},
body: JSON.stringify({type,title,content,mode}),
signal: AbortSignal.timeout(mode===‘takeaways’?18000:12000),
});
if (!r.ok) {
const e=await r.json().catch(()=>({}));
const detail=e.error||`HTTP ${r.status}`;
if (r.status===500&&/API_KEY/i.test(detail)) return {summary:’’,error:‘No AI provider configured.’};
if (r.status===504) return {summary:’’,error:‘Timed out — try again.’};
return {summary:’’,error:`Unavailable (${detail.slice(0,100)})`};
}
const data=await r.json();
return {summary:data.summary||’’, error:’’, provider:data.provider||’’};
} catch(err) {
return {summary:’’,error:err.name===‘TimeoutError’?‘Timed out’:‘Network error’};
}
}

function TakeawaysContent({text}) {
if (!text) return null;
const lines = text.split(’\n’).filter(l=>l.trim());
return (
<div className="takeaways-list">
{lines.map((line,i) => {
const m = line.match(/**(\d+).\s*([^*]+)**\s*[—–-]\s*(.*)/);
if (m) return (
<div key={i} className="takeaway-item">
<span className="takeaway-num">{m[1]}</span>
<div><span className="takeaway-head">{m[2].trim()}</span><span className="takeaway-body"> — {m[3].trim()}</span></div>
</div>
);
return <div key={i} className="takeaway-item"><div style={{fontSize:‘12px’,color:‘var(–text2)’,lineHeight:1.55}}>{line.replace(/**/g,’’)}</div></div>;
})}
</div>
);
}

// ─── SOURCE URL MAP ───────────────────────────────────────────────────────────
const SOURCE_URLS = {
‘BBC News’:‘https://www.bbc.com/news’,‘Reuters Top News’:‘https://www.reuters.com’,
‘CNBC Top News’:‘https://www.cnbc.com’,‘Fox News’:‘https://www.foxnews.com’,
‘NY Post’:‘https://nypost.com’,‘The Hill’:‘https://thehill.com’,
‘TechCrunch’:‘https://techcrunch.com’,‘Washington Times’:‘https://www.washingtontimes.com’,
‘The Guardian US’:‘https://www.theguardian.com/us’,‘Axios’:‘https://www.axios.com’,
‘Breitbart’:‘https://www.breitbart.com’,‘KHOU Houston’:‘https://www.khou.com’,
‘Click2Houston’:‘https://www.click2houston.com’,‘Chron.com’:‘https://www.chron.com’,
‘ESPN NFL’:‘https://www.espn.com/nfl’,‘ESPN NBA’:‘https://www.espn.com/nba’,
‘ESPN MLB’:‘https://www.espn.com/mlb’,‘ESPN CFB’:‘https://www.espn.com/college-football’,
‘ESPN CBB’:‘https://www.espn.com/mens-college-basketball’,
‘CBS Sports NFL’:‘https://www.cbssports.com/nfl’,‘CBS Sports NBA’:‘https://www.cbssports.com/nba’,
‘CBS Sports MLB’:‘https://www.cbssports.com/mlb’,‘CBS Sports CFB’:‘https://www.cbssports.com/college-football’,
‘CBS Sports CBB’:‘https://www.cbssports.com/college-basketball’,
‘Pro Football Talk’:‘https://profootballtalk.nbcsports.com’,‘Bleacher Report’:‘https://bleacherreport.com’,
‘247Sports’:‘https://247sports.com’,‘Kentucky Sports Radio’:‘https://kentuckysportsradio.com’,
‘On3 Recruiting’:‘https://www.on3.com’,‘The Spun’:‘https://thespun.com’,
‘Reuters Business’:‘https://www.reuters.com/business’,‘CNBC Energy’:‘https://www.cnbc.com/energy’,
‘Oilprice.com’:‘https://oilprice.com’,‘Utility Dive’:‘https://www.utilitydive.com’,
‘Data Center Dynamics’:‘https://www.datacenterdynamics.com’,‘Power Magazine’:‘https://www.powermag.com’,
‘Rigzone’:‘https://www.rigzone.com’,‘MIT Tech Review’:‘https://www.technologyreview.com’,
‘AI News’:‘https://artificialintelligence-news.com’,‘Canary Media’:‘https://www.canarymedia.com’,
‘The Guardian Business’:‘https://www.theguardian.com/business’,‘CNBC Tech’:‘https://www.cnbc.com/technology’,
‘MarketWatch’:‘https://www.marketwatch.com’,‘Yahoo Finance’:‘https://finance.yahoo.com’,
‘Kiplinger’:‘https://www.kiplinger.com’,‘Motley Fool’:‘https://www.fool.com’,
‘Investopedia’:‘https://www.investopedia.com’,‘BiggerPockets’:‘https://www.biggerpockets.com’,
‘CNBC Finance’:‘https://www.cnbc.com’,‘The Babylon Bee’:‘https://babylonbee.com’,
‘The Onion’:‘https://www.theonion.com’,
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
// Ghost design principles:
//   • Cards invisible at rest — no border, no shadow, no background
//   • Hierarchy through typography only: size, weight, color, spacing
//   • Chrome removed everywhere possible; structure implied by whitespace
//   • Utility strip = whisper bar: slim, low-contrast, stays out of the way
//   • Breaking banner: flush inline strip, not a bolted slab
//   • Sidebar: no card boxes — section label + list only
//   • Scoreboard keeps structural box (it IS a widget, not editorial content)
const GLOBAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
:root{
–bg:#f9fafb;–surface:#ffffff;–surface2:#f3f4f6;
–border:#e5e7eb;–border2:#f3f4f6;
–text:#111827;–text2:#374151;–text3:#9ca3af;–text4:#d1d5db;
–accent:#1d4ed8;–accent-bg:#eff6ff;
–red:#dc2626;–green:#16a34a;–amber:#d97706;
–radius:12px;–radius-sm:8px;
–shadow-sm:0 1px 3px rgba(0,0,0,0.05);
–shadow-md:0 4px 16px rgba(0,0,0,0.08);
–shadow-lg:0 8px 32px rgba(0,0,0,0.12);
}
.dark{
–bg:#0f0f1a;–surface:#18182a;–surface2:#222235;
–border:#2d2d45;–border2:#1c1c30;
–text:#f0f0f8;–text2:#a8a8c0;–text3:#5c5c78;–text4:#2e2e48;
–accent:#60a5fa;–accent-bg:#1e2d4a;
–red:#f87171;–green:#4ade80;–amber:#fbbf24;
–shadow-sm:0 1px 3px rgba(0,0,0,0.3);
–shadow-md:0 4px 16px rgba(0,0,0,0.4);
–shadow-lg:0 8px 32px rgba(0,0,0,0.5);
}

body{
background:var(–bg);
font-family:-apple-system,BlinkMacSystemFont,‘Inter’,‘Segoe UI’,sans-serif;
-webkit-font-smoothing:antialiased;color:var(–text);
font-size:15px;line-height:1.5;
}
.hub{background:var(–bg);min-height:100vh;}

/* ═══════════════════════════════════════════
WHISPER BAR (utility strip)
Goal: present but unobtrusive — data visible
when you look, invisible when you don’t
═══════════════════════════════════════════ */
.topbar-wrap{position:sticky;top:0;z-index:300;}

.whisper-bar{
background:rgba(15,15,26,0.92);
backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
border-bottom:1px solid rgba(255,255,255,0.04);
height:30px;padding:0 24px;
display:flex;align-items:center;overflow:hidden;
}
.whisper-inner{
max-width:1400px;margin:0 auto;width:100%;
display:flex;align-items:center;gap:16px;
}
.wx-pill{
display:flex;align-items:center;gap:6px;
font-size:11px;color:rgba(200,200,220,0.55);
white-space:nowrap;flex-shrink:0;padding:2px 8px;
border-radius:4px;text-decoration:none;transition:color 0.15s;
}
.wx-pill:hover{color:rgba(200,200,220,0.85);}
.wx-city{font-weight:600;color:rgba(220,220,240,0.75);font-size:10px;text-transform:uppercase;letter-spacing:0.05em;}
.wx-temp{font-weight:600;color:rgba(230,230,250,0.8);font-variant-numeric:tabular-nums;}
.wx-desc{color:rgba(160,160,180,0.45);}
.whisper-div{width:1px;height:12px;background:rgba(255,255,255,0.08);flex-shrink:0;}
.ticker-row{display:flex;gap:4px;align-items:center;overflow-x:auto;scrollbar-width:none;flex:1;}
.ticker-row::-webkit-scrollbar{display:none;}
.ticker-item{
display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;
padding:2px 8px;border-radius:4px;transition:background 0.12s;flex-shrink:0;
}
.ticker-item:hover{background:rgba(255,255,255,0.05);}
.ticker-sym{font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-0.1px;}
.ticker-price{font-size:11px;color:rgba(180,180,200,0.6);font-variant-numeric:tabular-nums;}
.ticker-chg{font-size:10px;font-weight:600;font-variant-numeric:tabular-nums;}
.ticker-up{color:#4ade80;}.ticker-down{color:#f87171;}

/* ═══════════════════════════════════════════
BREAKING BANNER — inline, not bolted-on
Slides in below whisper bar, same visual
language as the topbar, not a separate slab
═══════════════════════════════════════════ */
.breaking-bar{
background:rgba(185,28,28,0.92);
backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
height:26px;display:flex;align-items:center;overflow:hidden;
border-bottom:1px solid rgba(0,0,0,0.1);
}
.breaking-bar.hidden{display:none;}
.breaking-label{
background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);
color:#fff;font-size:8px;font-weight:800;letter-spacing:0.12em;
padding:2px 10px;white-space:nowrap;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.15);
}
.breaking-ticker{flex:1;overflow:hidden;margin:0 10px;}
.breaking-ticker-inner{
display:inline-flex;gap:56px;
animation:ticker-scroll 90s linear infinite;white-space:nowrap;
}
.breaking-ticker-inner:hover{animation-play-state:paused;}
@keyframes ticker-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.breaking-item{
font-size:11px;color:rgba(255,255,255,0.9);font-weight:500;
cursor:pointer;display:inline-flex;align-items:center;gap:8px;
}
.breaking-item:hover{color:#fff;}
.breaking-sep{color:rgba(255,255,255,0.3);font-size:9px;}
.breaking-close{
background:none;border:none;color:rgba(255,255,255,0.5);
cursor:pointer;font-size:13px;padding:0 12px;flex-shrink:0;line-height:1;
}
.breaking-close:hover{color:#fff;}

/* ═══════════════════════════════════════════
NAV BAR
═══════════════════════════════════════════ */
.nav-bar{
background:var(–surface);
border-bottom:1px solid var(–border);
padding:0 24px;
}
.nav-bar-inner{
max-width:1400px;margin:0 auto;
display:flex;align-items:center;gap:12px;height:50px;
}
.logo-wrap{flex-shrink:0;line-height:1;}
.logo{font-size:19px;font-weight:900;color:var(–text);letter-spacing:-1px;}
.logo span{color:var(–accent);}
.logo-tag{font-size:7.5px;color:var(–text3);letter-spacing:0.14em;text-transform:uppercase;font-weight:600;}
.nav-tabs{
display:flex;gap:0;flex:1;overflow-x:auto;scrollbar-width:none;
margin-left:14px;padding-left:14px;border-left:1px solid var(–border);
}
.nav-tabs::-webkit-scrollbar{display:none;}
.nav-tab{
background:transparent;border:none;color:var(–text3);
padding:10px 13px;cursor:pointer;font-size:13px;font-weight:600;
white-space:nowrap;font-family:inherit;border-bottom:2px solid transparent;
transition:color 0.12s,border-color 0.12s;letter-spacing:-0.1px;
}
.nav-tab.active{color:var(–text);border-bottom-color:var(–text);}
.nav-tab:hover:not(.active){color:var(–text2);}
/* Per-tab active accent colors */
.nav-tab.t-general.active{color:#1d4ed8;border-bottom-color:#1d4ed8;}
.nav-tab.t-sports.active{color:#d97706;border-bottom-color:#d97706;}
.nav-tab.t-business.active{color:#16a34a;border-bottom-color:#16a34a;}
.nav-tab.t-finance.active{color:#7c3aed;border-bottom-color:#7c3aed;}
.nav-tab.t-bloom.active{color:#0369a1;border-bottom-color:#0369a1;}
.nav-tab.t-comedy.active{color:#db2777;border-bottom-color:#db2777;}
.nav-tab.t-podcasts.active{color:#e11d48;border-bottom-color:#e11d48;}
.nav-right{display:flex;gap:6px;align-items:center;flex-shrink:0;}
.search-input{
background:var(–surface2);border:1px solid var(–border);color:var(–text);
border-radius:var(–radius-sm);padding:7px 13px;font-size:13px;width:130px;
font-family:inherit;transition:all 0.15s;
}
.search-input:focus{outline:none;border-color:var(–accent);box-shadow:0 0 0 3px var(–accent-bg);width:170px;}
.nav-btn{
background:transparent;border:1px solid var(–border);color:var(–text3);
border-radius:var(–radius-sm);padding:6px 11px;cursor:pointer;
font-size:13px;font-family:inherit;font-weight:500;transition:all 0.12s;
}
.nav-btn:hover{border-color:var(–text3);color:var(–text);}
.nav-btn-blue{
background:var(–accent);border:none;color:#fff;
border-radius:var(–radius-sm);padding:6px 14px;cursor:pointer;
font-size:13px;font-weight:700;font-family:inherit;transition:opacity 0.12s;
}
.nav-btn-blue:hover{opacity:0.88;}

/* ═══════════════════════════════════════════
PAGE SHELL
═══════════════════════════════════════════ */
.page{max-width:1400px;margin:0 auto;padding:28px 24px;}
.page-grid{display:grid;grid-template-columns:1fr 288px;gap:48px;align-items:start;}
.feed-col{display:flex;flex-direction:column;gap:0;}

/* Page header row: label + customize button */
.page-header-row{
display:flex;align-items:center;justify-content:space-between;
margin-bottom:28px;
}
.page-header{
font-size:11px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.1em;
}
.page-customize-btn{
background:none;border:none;color:var(–text3);
font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
display:flex;align-items:center;gap:3px;padding:0;transition:color 0.12s;
}
.page-customize-btn:hover{color:var(–accent);}

.empty-state{text-align:center;padding:60px 20px;color:var(–text3);}
.empty-icon{font-size:28px;margin-bottom:10px;}
.empty-msg{font-size:13px;color:var(–text2);margin-bottom:14px;}
.refresh-btn{
background:var(–accent);border:none;color:#fff;
border-radius:8px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;
}

/* ═══════════════════════════════════════════
GHOST FEED CARD
No border, no shadow, no bg at rest.
Pure typography hierarchy.
═══════════════════════════════════════════ */
.fc{
background:transparent;border:none;padding:20px 0;cursor:pointer;
transition:background 0.15s;border-radius:var(–radius-sm);
border-bottom:1px solid var(–border2);
}
.fc:last-child{border-bottom:none;}
.fc:hover{background:var(–surface2);margin:0 -14px;padding:20px 14px;}
.fc:active{transform:scale(0.998);}

.fc-meta{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
.fc-source{
font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;
}
.fc-dot{color:var(–text4);font-size:10px;}
.fc-date{font-size:11px;color:var(–text3);font-variant-numeric:tabular-nums;margin-left:auto;white-space:nowrap;}
.fc-topic{
font-size:9px;font-weight:700;border-radius:4px;padding:2px 7px;
letter-spacing:0.05em;text-transform:uppercase;
}
.fc-alert-badge{
font-size:9px;font-weight:800;background:rgba(220,38,38,0.08);color:var(–red);
border-radius:4px;padding:2px 7px;letter-spacing:0.05em;
animation:pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge{0%,100%{opacity:1;}50%{opacity:0.55;}}

.fc-body{display:flex;gap:18px;align-items:flex-start;}
.fc-thumb{
width:112px;height:74px;border-radius:var(–radius-sm);
object-fit:cover;flex-shrink:0;background:var(–surface2);
}
.fc-thumb-ph{
width:112px;height:74px;border-radius:var(–radius-sm);flex-shrink:0;
display:flex;align-items:center;justify-content:center;font-size:22px;background:var(–surface2);
}
.fc-text{flex:1;min-width:0;}
.fc-title{
font-size:17px;font-weight:800;color:var(–text);line-height:1.25;
letter-spacing:-0.5px;margin-bottom:6px;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.fc-desc{
font-size:13px;color:var(–text3);line-height:1.55;font-weight:400;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}

/* AI + actions row */
.fc-actions{
display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap;
}
.fc-act{
background:none;border:1px solid var(–border);border-radius:20px;
padding:4px 11px;font-size:11px;cursor:pointer;color:var(–text3);
font-family:inherit;font-weight:600;transition:all 0.12s;display:flex;align-items:center;gap:4px;
}
.fc-act:hover{border-color:var(–accent);color:var(–accent);background:var(–accent-bg);}
.fc-act:active{transform:scale(0.96);}
.fc-act.saved{border-color:var(–amber);color:var(–amber);background:#fffbeb;}
.fc-act.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.fc-act.disc-on{border-color:#0ea5e9;color:#0ea5e9;background:#f0f9ff;}
.fc-read-link{
margin-left:auto;font-size:10px;color:var(–text3);
text-decoration:none;font-weight:600;display:flex;align-items:center;gap:2px;
transition:color 0.1s;
}
.fc-read-link:hover{color:var(–accent);}

/* AI panels */
.fc-ai-panel{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.fc-summary{background:var(–surface2);border-radius:8px;padding:10px 12px;}
.fc-summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;}
.fc-summary-text{font-size:12px;color:var(–text2);line-height:1.6;}
.fc-takeaways{background:var(–surface2);border-radius:8px;padding:12px 14px;border-left:2px solid #7c3aed;}
.fc-takeaways-lbl{font-size:9px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.takeaways-list{display:flex;flex-direction:column;gap:8px;}
.takeaway-item{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.5;color:var(–text2);}
.takeaway-num{font-size:14px;font-weight:900;color:#4f46e5;min-width:18px;flex-shrink:0;line-height:1.3;}
.takeaway-head{font-weight:700;color:var(–text);}
.takeaway-body{font-weight:400;}

/* Discussion panel */
.fc-disc{margin-top:10px;background:var(–surface2);border-radius:8px;padding:10px 12px;}
.fc-disc-lbl{font-size:9px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.fc-disc-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(–border2);text-decoration:none;color:var(–text);font-size:11px;transition:color 0.1s;}
.fc-disc-item:last-child{border-bottom:none;}
.fc-disc-item:hover{color:#0284c7;}
.fc-disc-platform{font-size:8px;font-weight:800;border-radius:3px;padding:2px 5px;color:#fff;flex-shrink:0;text-transform:uppercase;}
.fc-disc-platform.reddit{background:#ff4500;}
.fc-disc-platform.hn{background:#ff6600;}
.fc-disc-sub{font-weight:600;color:var(–text2);flex-shrink:0;}
.fc-disc-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;}
.fc-disc-stats{margin-left:auto;font-size:10px;color:var(–text3);white-space:nowrap;flex-shrink:0;}

/* Related sources */
.fc-more{margin-top:8px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.fc-more-lbl{font-size:10px;color:var(–text3);}
.fc-more-src{
font-size:10px;font-weight:600;border-radius:4px;padding:1px 6px;cursor:pointer;
border:1px solid var(–border);color:var(–text3);background:none;font-family:inherit;transition:all 0.1s;
}
.fc-more-src:hover{border-color:var(–accent);color:var(–accent);}

/* ═══════════════════════════════════════════
GHOST SIDEBAR
No card boxes. Section labels + list only.
Scoreboard keeps its box (it’s a widget).
═══════════════════════════════════════════ */
.sidebar{display:flex;flex-direction:column;gap:28px;min-width:0;}

/* Ghost sidebar section */
.gs-section{display:flex;flex-direction:column;gap:0;}
.gs-label{
font-size:10px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.1em;
margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;
}
.gs-clear{background:none;border:none;color:var(–accent);cursor:pointer;font-size:10px;font-weight:500;font-family:inherit;padding:0;}
.gs-clear:hover{text-decoration:underline;}

/* Filter active pill */
.gs-filter{
background:var(–accent-bg);border-radius:6px;padding:6px 10px;
display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;
}
.gs-filter-label{font-size:11px;font-weight:600;color:var(–accent);}
.gs-filter-x{background:none;border:none;color:var(–accent);cursor:pointer;font-size:13px;line-height:1;padding:0;}

/* Keyword chips */
.kw-chips{display:flex;flex-wrap:wrap;gap:4px;}
.kw-chip{
font-size:10px;font-weight:600;border-radius:20px;padding:3px 10px;cursor:pointer;
border:1px solid transparent;display:inline-block;transition:opacity 0.12s;
}
.kw-chip:hover{opacity:0.75;}
.kw-chip.active{border-color:currentColor;}

/* Trend list */
.trend-row{
display:flex;align-items:flex-start;gap:12px;
padding:9px 0;border-bottom:1px solid var(–border2);cursor:pointer;transition:opacity 0.12s;
}
.trend-row:last-child{border-bottom:none;}
.trend-row:hover{opacity:0.7;}
.trend-num{
font-size:16px;font-weight:900;color:var(–text4);
min-width:20px;line-height:1;flex-shrink:0;font-variant-numeric:tabular-nums;
}
.trend-body{flex:1;min-width:0;}
.trend-title{
font-size:12px;font-weight:700;color:var(–text);line-height:1.35;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px;
}
.trend-src{font-size:10px;color:var(–text3);display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.trend-cat-badge{
font-size:8px;font-weight:700;border-radius:4px;padding:1px 5px;
letter-spacing:0.03em;text-transform:uppercase;
}

/* Source list */
.src-row{
display:flex;align-items:center;gap:8px;padding:7px 0;
border-bottom:1px solid var(–border2);cursor:pointer;transition:opacity 0.12s;
}
.src-row:last-child{border-bottom:none;}
.src-row:hover{opacity:0.7;}
.src-row.active-src{opacity:1;}
.health-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.h-green{background:#16a34a;}.h-yellow{background:#d97706;}.h-red{background:#dc2626;}.h-gray{background:#9ca3af;}
.src-name{font-size:11px;font-weight:500;color:var(–text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.src-count{font-size:10px;color:var(–text3);}

/* ═══════════════════════════════════════════
SCOREBOARD — keeps structural box
═══════════════════════════════════════════ */
.sb-box{
background:var(–surface);border-radius:var(–radius);
border:1px solid var(–border);overflow:hidden;
}
.sb-box-head{
padding:10px 14px 8px;border-bottom:1px solid var(–border2);
display:flex;align-items:center;justify-content:space-between;
}
.sb-box-title{font-size:11px;font-weight:700;color:var(–text2);text-transform:uppercase;letter-spacing:0.07em;}
.sb-box-sub{font-size:9px;color:var(–text3);text-transform:uppercase;letter-spacing:0.05em;}
.sb-empty{padding:12px 14px;font-size:11px;color:var(–text3);text-align:center;font-style:italic;}
.sb-league{border-bottom:1px solid var(–border2);}
.sb-league:last-child{border-bottom:none;}
.sb-league-head{
width:100%;background:none;border:none;display:flex;align-items:center;gap:8px;
padding:9px 14px;cursor:pointer;font-family:inherit;text-align:left;font-size:11px;
transition:background 0.1s;
}
.sb-league-head:hover{background:var(–bg);}
.sb-league-meta{margin-left:auto;display:flex;gap:5px;align-items:center;font-size:10px;color:var(–text3);}
.sb-league-fav{background:#fef3c7;color:#92400e;border-radius:6px;padding:1px 5px;font-weight:700;font-size:9px;}
.sb-chevron{color:var(–text3);font-size:10px;width:12px;text-align:center;}
.sb-games{padding:4px 10px 8px;display:flex;flex-direction:column;gap:5px;}
.sb-game{
background:var(–bg);border:1px solid var(–border);border-radius:6px;
padding:7px 10px;cursor:pointer;transition:border-color 0.1s;
}
.sb-game:hover{border-color:var(–accent);}
.sb-game.fav{border-color:#f59e0b;background:#fffbeb;}
.dark .sb-game.fav{background:rgba(245,158,11,0.07);}
.sb-game.live{border-color:var(–red);background:#fef2f2;}
.dark .sb-game.live{background:rgba(220,38,38,0.1);}
.sb-game.fav.live{border-color:var(–red);}
.sb-game-row{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:1px 0;}
.sb-side{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}
.sb-logo{width:15px;height:15px;object-fit:contain;flex-shrink:0;}
.sb-abbr{font-size:11px;font-weight:600;color:var(–text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-num{font-size:13px;font-weight:800;color:var(–text);flex-shrink:0;min-width:22px;text-align:right;font-variant-numeric:tabular-nums;}
.sb-num.winner{color:var(–green);}
.sb-num.loser{color:var(–text3);font-weight:500;}
.sb-status{font-size:9px;margin-top:4px;text-transform:uppercase;letter-spacing:0.04em;display:flex;align-items:center;gap:4px;}
.sb-status.live{color:var(–red);font-weight:700;}
.sb-status.final{color:var(–text3);}
.sb-status.pre{color:var(–accent);}
.sb-fav-star{color:#f59e0b;font-size:10px;}
.sb-more{padding:5px;text-align:center;font-size:10px;color:var(–text3);font-style:italic;}

/* ═══════════════════════════════════════════
MORNING BRIEFING — ghost card
Single overview paragraph, no category rows
═══════════════════════════════════════════ */
.briefing{
margin-bottom:24px;
background:var(–surface);border-radius:var(–radius);
border:1px solid var(–border);overflow:hidden;
}
.briefing-head{
display:flex;align-items:center;justify-content:space-between;
padding:14px 18px 12px;border-bottom:1px solid var(–border2);
}
.briefing-left{display:flex;align-items:center;gap:10px;}
.briefing-icon{font-size:18px;}
.briefing-title{font-size:14px;font-weight:800;color:var(–text);letter-spacing:-0.3px;}
.briefing-date{font-size:10px;color:var(–text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:1px;}
.briefing-refresh{
background:none;border:1px solid var(–border);color:var(–text3);
border-radius:6px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;
font-family:inherit;transition:all 0.12s;
}
.briefing-refresh:hover{border-color:var(–text2);color:var(–text);}
.briefing-refresh:disabled{opacity:0.5;cursor:wait;}
/* Body: single punchy paragraph */
.briefing-body{padding:14px 18px 16px;}
.briefing-overview{font-size:13px;color:var(–text2);line-height:1.65;font-weight:400;}
.briefing-overview strong{color:var(–text);font-weight:700;}
.briefing-loading{font-size:12px;color:var(–text3);font-style:italic;padding:14px 18px 16px;}
.briefing-err{font-size:11px;color:var(–red);padding:8px 18px 12px;}

/* ═══════════════════════════════════════════
HERO ROW (unchanged structurally)
═══════════════════════════════════════════ */
.hero-row{display:grid;grid-template-columns:1fr 320px;gap:16px;margin-bottom:24px;}
.hero-lead{
background:var(–surface);border-radius:14px;border:1px solid var(–border);
overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.15s;
box-shadow:var(–shadow-sm);
}
.hero-lead:hover{box-shadow:var(–shadow-md);transform:translateY(-1px);}
.hero-lead:active{transform:scale(0.998);}
.hero-lead-img{
width:100%;aspect-ratio:2.2/1;background-size:cover;background-position:center top;
background-color:var(–surface2);position:relative;
}
.hero-lead-badge{
position:absolute;top:14px;left:14px;color:#fff;font-size:10px;font-weight:800;
padding:4px 10px;border-radius:5px;letter-spacing:0.06em;text-transform:uppercase;
background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);
}
.hero-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;}
.hero-dot{
width:8px;height:8px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.6);
background:transparent;cursor:pointer;transition:all 0.2s;padding:0;
}
.hero-dot.active{background:#fff;border-color:#fff;}
.hero-dot:hover{border-color:#fff;}
.hero-arrow{
position:absolute;top:50%;transform:translateY(-50%);
background:rgba(0,0,0,0.3);color:#fff;border:none;
width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;
font-weight:300;display:flex;align-items:center;justify-content:center;
transition:background 0.15s;backdrop-filter:blur(4px);line-height:1;
}
.hero-arrow:hover{background:rgba(0,0,0,0.55);}
.hero-prev{left:12px;}.hero-next{right:12px;}
.hero-lead-text{padding:18px 20px 20px;}
.hero-lead-title{
font-size:24px;font-weight:900;color:var(–text);line-height:1.2;
letter-spacing:-0.6px;margin:0 0 8px;
display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.hero-lead-desc{
font-size:13px;color:var(–text2);line-height:1.55;margin:0 0 10px;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:400;
}
.hero-lead-meta{display:flex;align-items:center;gap:5px;font-size:11px;color:var(–text3);}
.hero-lead-source{font-weight:700;color:var(–text2);text-transform:uppercase;font-size:10px;letter-spacing:0.03em;}
.hero-side{
background:var(–surface);border-radius:14px;border:1px solid var(–border);
display:flex;flex-direction:column;overflow:hidden;box-shadow:var(–shadow-sm);
}
.hero-side-label{
font-size:9px;font-weight:700;color:var(–text3);text-transform:uppercase;
letter-spacing:0.1em;padding:12px 14px 8px;
}
.hero-side-item{
display:flex;gap:10px;padding:9px 14px;border-top:1px solid var(–border2);
cursor:pointer;transition:background 0.12s;
}
.hero-side-item:hover{background:var(–surface2);}
.hero-side-thumb{width:56px;height:42px;object-fit:cover;border-radius:5px;flex-shrink:0;}
.hero-side-body{flex:1;min-width:0;}
.hero-side-title{
font-size:12px;font-weight:700;color:var(–text);line-height:1.3;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px;
}
.hero-side-meta{font-size:9px;color:var(–text3);}

/* ═══════════════════════════════════════════
TODAY PAGE
═══════════════════════════════════════════ */
.today-main{display:grid;grid-template-columns:1fr 280px;gap:36px;align-items:start;}
.today-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.today-block{
background:var(–surface);border-radius:var(–radius);border:1px solid var(–border);
overflow:hidden;
}
.today-block-head{
padding:11px 14px 9px;border-bottom:1px solid var(–border2);
display:flex;align-items:center;justify-content:space-between;
}
.today-block-label{font-size:11px;font-weight:800;display:flex;align-items:center;gap:5px;}
.today-block-count{
font-size:9px;color:var(–text3);background:var(–surface2);
border-radius:8px;padding:1px 6px;font-weight:700;font-variant-numeric:tabular-nums;
}
.today-see-all{font-size:10px;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700;transition:opacity 0.1s;}
.today-see-all:hover{opacity:0.65;}
.today-item{
padding:9px 14px;border-bottom:1px solid var(–border2);cursor:pointer;
display:flex;gap:8px;align-items:flex-start;transition:background 0.1s;
}
.today-item:last-child{border-bottom:none;}
.today-item:hover{background:var(–surface2);}
.today-thumb{width:48px;height:36px;border-radius:4px;object-fit:cover;flex-shrink:0;}
.today-thumb-ph{width:48px;height:36px;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;background:var(–surface2);}
.today-item-body{flex:1;min-width:0;}
.today-item-title{font-size:11px;font-weight:600;color:var(–text);line-height:1.35;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.today-item-src{font-size:10px;color:var(–text3);}
.today-item-wrap{border-bottom:1px solid var(–border2);}
.today-item-wrap:last-child{border-bottom:none;}
.today-item-wrap .today-item{border-bottom:none;}
.today-ai-btn{
background:none;border:1px solid var(–border);color:var(–text3);border-radius:4px;
padding:2px 6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;
flex-shrink:0;align-self:flex-start;transition:all 0.1s;
}
.today-ai-btn:hover{border-color:#7c3aed;color:#7c3aed;}
.today-ai-btn.on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.today-ai-btn:disabled{cursor:wait;opacity:0.6;}
.today-summary{padding:0 14px 10px 70px;font-size:11px;color:var(–text2);line-height:1.55;}
.today-bloom-row{grid-column:1/-1;}
.bloom-strip{display:grid;grid-template-columns:repeat(4,1fr);}
.bloom-strip-item{padding:10px 14px;border-right:1px solid var(–border2);cursor:pointer;transition:background 0.1s;}
.bloom-strip-item:last-child{border-right:none;}
.bloom-strip-item:hover{background:var(–surface2);}
.bloom-strip-title{font-size:11px;font-weight:600;color:var(–text);line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bloom-strip-src{font-size:10px;color:#0369a1;font-weight:500;}
.bloom-strip-date{font-size:9px;color:var(–text3);margin-top:2px;}

/* ═══════════════════════════════════════════
FINANCE PAGE
═══════════════════════════════════════════ */
.fin-header{
background:var(–surface);border:1px solid var(–border);border-radius:12px;
padding:14px 18px 12px;margin-bottom:14px;box-shadow:var(–shadow-sm);
}
.fin-header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px;flex-wrap:wrap;}
.fin-header-title{font-size:17px;font-weight:800;color:var(–text);letter-spacing:-0.4px;}
.fin-header-sub{font-size:11px;color:var(–text2);margin-top:3px;display:flex;align-items:center;gap:6px;}
.fin-status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;}
.fin-refresh{
background:var(–surface2);border:1px solid var(–border);color:var(–text2);
border-radius:6px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
transition:all 0.12s;
}
.fin-refresh:hover{border-color:var(–accent);color:var(–accent);}
.fin-refresh:disabled{cursor:wait;opacity:0.6;}
.fin-indices{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.fin-index{background:var(–surface2);border-radius:8px;padding:10px 14px;border-left:3px solid var(–border);}
.fin-index.up{border-left-color:var(–green);}
.fin-index.down{border-left-color:var(–red);}
.fin-index-label{font-size:10px;font-weight:700;color:var(–text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;}
.fin-index-price{font-size:20px;font-weight:800;color:var(–text);font-variant-numeric:tabular-nums;letter-spacing:-0.5px;line-height:1.1;font-family:‘SF Mono’,‘Cascadia Code’,‘Consolas’,monospace;}
.fin-index-chg{font-size:11px;font-weight:600;margin-top:3px;display:flex;gap:5px;align-items:center;font-variant-numeric:tabular-nums;}
.fin-index.up .fin-index-chg{color:var(–green);}
.fin-index.down .fin-index-chg{color:var(–red);}
.fin-index-pct{background:rgba(0,0,0,0.05);border-radius:3px;padding:1px 5px;font-size:10px;}
.dark .fin-index-pct{background:rgba(255,255,255,0.07);}
.fin-grid{display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start;}
.fin-main{display:flex;flex-direction:column;gap:14px;min-width:0;}
.fin-watchlist,.fin-news{background:var(–surface);border:1px solid var(–border);border-radius:10px;overflow:hidden;}
.fin-section-head{display:flex;justify-content:space-between;align-items:center;padding:11px 16px;border-bottom:1px solid var(–border2);}
.fin-section-title{font-size:13px;font-weight:800;color:var(–text);letter-spacing:-0.2px;}
.fin-news{padding:14px;}
.fin-news .fin-section-head{margin:-14px -14px 10px;border-radius:10px 10px 0 0;background:var(–surface2);}
.fin-table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;}
.fin-table thead th{background:var(–surface2);font-size:9px;font-weight:700;color:var(–text3);text-transform:uppercase;letter-spacing:0.07em;padding:9px 12px;border-bottom:1px solid var(–border);}
.fin-table tbody tr{cursor:pointer;transition:background 0.08s;border-bottom:1px solid var(–border2);}
.fin-table tbody tr:hover{background:var(–surface2);}
.fin-table tbody tr:last-child{border-bottom:none;}
.fin-table td{padding:10px 12px;font-size:12px;color:var(–text);}
.fin-sym{font-weight:800;font-family:‘SF Mono’,‘Cascadia Code’,‘Consolas’,monospace;letter-spacing:-0.3px;color:var(–accent);}
.fin-name{color:var(–text2);font-size:11px;}
.fin-px{font-family:‘SF Mono’,‘Cascadia Code’,‘Consolas’,monospace;text-align:right;font-weight:600;letter-spacing:-0.2px;}
.fin-up{color:var(–green);}
.fin-down{color:var(–red);}
.fin-pct-pill{background:rgba(22,163,74,0.1);border-radius:4px;padding:2px 5px;font-size:11px;font-weight:700;}
.fin-down .fin-pct-pill{background:rgba(220,38,38,0.1);}
.fin-empty{padding:28px;text-align:center;color:var(–text3);font-style:italic;font-size:12px;}

/* ═══════════════════════════════════════════
SOCIAL FOLLOWS (per category)
═══════════════════════════════════════════ */
.social-block{margin-top:32px;}
.social-block-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.social-block-title{font-size:10px;font-weight:700;color:var(–text3);text-transform:uppercase;letter-spacing:0.1em;}
.social-block-sub{font-size:10px;color:var(–text3);}
.social-platforms{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
.social-plat{background:var(–surface2);border-radius:8px;padding:10px 12px;}
.social-plat-head{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
.social-plat-icon{width:16px;height:16px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;}
.social-plat-label{font-size:10px;font-weight:700;color:var(–text);}
.social-plat-count{font-size:9px;color:var(–text3);margin-left:auto;}
.social-handles{display:flex;flex-wrap:wrap;gap:4px;}
.social-handle{
font-size:10px;font-weight:500;color:var(–text2);background:var(–surface);
border:1px solid var(–border);border-radius:10px;padding:2px 8px;
text-decoration:none;transition:all 0.1s;
}
.social-handle:hover{transform:translateY(-1px);border-color:currentColor;}

/* Social Page */
.social-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;}
.social-page-title{font-size:17px;font-weight:800;color:var(–text);letter-spacing:-0.4px;}
.social-page-sub{font-size:12px;color:var(–text2);margin-top:2px;}
.social-page-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;}
.social-cat-block{background:var(–surface);border-radius:var(–radius);border:1px solid var(–border);overflow:hidden;}
.social-cat-head{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(–border2);}
.social-cat-plat{padding:10px 14px;border-bottom:1px solid var(–border2);}
.social-cat-plat:last-child{border-bottom:none;}
.social-cat-plat-head{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
.social-cat-plat .social-handles{display:flex;flex-wrap:wrap;gap:4px;}
.social-cat-plat .social-handle{font-size:10px;padding:3px 8px;}

/* ═══════════════════════════════════════════
PODCAST PAGE
═══════════════════════════════════════════ */
.pod-page{display:grid;grid-template-columns:1fr 268px;gap:32px;}
.pod-col{display:flex;flex-direction:column;gap:10px;}
.pod-header{
background:linear-gradient(135deg,#e11d48,#f43f5e);border-radius:10px;
padding:14px 18px;display:flex;align-items:center;gap:12px;
}
.pod-header-emoji{font-size:26px;}
.pod-header-name{font-size:13px;font-weight:700;color:#fff;}
.pod-header-sub{font-size:11px;color:rgba(255,255,255,0.75);margin-top:2px;}
.pod-card{
background:var(–surface);border-radius:10px;border:1px solid var(–border);
padding:14px;transition:border-color 0.15s;
}
.pod-card:hover{border-color:#fda4af;}
.pod-card-top{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;}
.pod-num{font-size:20px;font-weight:800;color:var(–text4);min-width:26px;line-height:1;}
.pod-body{flex:1;min-width:0;}
.pod-show{font-size:10px;font-weight:600;color:#e11d48;margin-bottom:2px;}
.pod-title{font-size:13px;font-weight:700;color:var(–text);line-height:1.35;margin-bottom:4px;cursor:pointer;}
.pod-title:hover{color:#e11d48;}
.pod-meta{font-size:10px;color:var(–text3);display:flex;gap:8px;flex-wrap:wrap;}
.pod-desc{font-size:11px;color:var(–text2);line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pod-actions{display:flex;gap:6px;flex-wrap:wrap;}
.pod-btn{border:1px solid var(–border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:500;background:none;color:var(–text2);transition:all 0.12s;}
.pod-btn:hover{border-color:#e11d48;color:#e11d48;}
.pod-btn.saved{border-color:var(–amber);color:var(–amber);background:#fffbeb;}
.pod-shows{background:var(–surface);border-radius:10px;border:1px solid var(–border);padding:14px;}
.pod-show-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(–border2);cursor:pointer;}
.pod-show-item:last-child{border-bottom:none;}
.pod-show-item:hover .pod-show-name{color:#e11d48;}
.pod-show-emoji{font-size:16px;width:24px;text-align:center;}
.pod-show-name{font-size:12px;font-weight:600;color:var(–text);transition:color 0.1s;}
.pod-show-ep{font-size:10px;color:var(–text3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}
.pod-show-dot{width:5px;height:5px;border-radius:50%;background:#e11d48;flex-shrink:0;margin-left:auto;}
.saved-empty{text-align:center;padding:80px 20px;}

/* ═══════════════════════════════════════════
CUSTOMIZE PANEL
═══════════════════════════════════════════ */
.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px);}
.cp-panel{background:var(–surface);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:var(–shadow-lg),0 0 0 1px rgba(0,0,0,0.05);}
.cp-head{padding:16px 20px;border-bottom:1px solid var(–border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(–surface);z-index:10;}
.cp-title{font-size:14px;font-weight:700;color:var(–text);}
.cp-x{background:none;border:none;font-size:18px;cursor:pointer;color:var(–text3);line-height:1;}
.cp-body{padding:16px 20px;display:flex;flex-direction:column;gap:20px;}
.cp-sec{}
.cp-lbl{font-size:9px;font-weight:700;color:var(–text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.cp-desc{font-size:11px;color:var(–text2);line-height:1.5;margin-bottom:8px;}
.cp-cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;}
.cp-cat-tab{background:var(–surface2);border:1px solid var(–border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(–text2);font-weight:500;transition:all 0.1s;}
.cp-cat-tab.active{background:var(–accent);color:#fff;border-color:var(–accent);}
.cp-sec-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(–border2);}
.cp-sec-tab{background:var(–surface2);border:1px solid var(–border);border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:inherit;color:var(–text2);font-weight:600;transition:all 0.1s;}
.cp-sec-tab.active{background:var(–text);color:var(–bg);border-color:var(–text);}
.cp-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
.cp-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:500;}
.cp-chip-kw{background:var(–accent-bg);color:var(–accent);}
.cp-chip-alert{background:#fef2f2;color:var(–red);}
.cp-chip-social{background:var(–surface2);border:1px solid var(–border);color:var(–text2);}
.cp-chip-x{background:none;border:none;cursor:pointer;font-size:12px;opacity:0.5;line-height:1;padding:0;}
.cp-chip-x:hover{opacity:1;}
.cp-add{display:flex;gap:6px;}
.cp-input{flex:1;border:1px solid var(–border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;color:var(–text);background:var(–surface);}
.cp-input:focus{outline:none;border-color:var(–accent);}
.cp-btn{background:var(–accent);border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
.cp-btn-red{background:var(–red);}
.cp-src-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(–border2);}
.cp-src-row:last-child{border-bottom:none;}
.cp-health{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.cp-h-green{background:var(–green);}.cp-h-yellow{background:var(–amber);}.cp-h-red{background:var(–red);}.cp-h-gray{background:#9ca3af;}
.cp-src-name{flex:1;font-size:12px;color:var(–text);}
.cp-src-count{font-size:10px;color:var(–text3);}
.cp-test-btn{background:var(–surface2);border:1px solid var(–border);border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;font-family:inherit;color:var(–text2);white-space:nowrap;}
.cp-tog{width:30px;height:17px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.cp-tog.on{background:var(–accent);}.cp-tog.off{background:#cbd5e1;}
.cp-tog::after{content:’’;width:13px;height:13px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;}
.cp-tog.on::after{left:15px;}.cp-tog.off::after{left:2px;}
.cp-del{background:none;border:none;color:var(–text3);cursor:pointer;font-size:13px;padding:0 1px;line-height:1;}
.cp-del:hover{color:var(–red);}
.cp-test-result{font-size:10px;padding:4px 8px;border-radius:5px;margin-top:4px;}
.cp-test-ok{background:#f0fdf4;color:var(–green);}
.cp-test-fail{background:#fef2f2;color:var(–red);}
.cp-test-load{background:var(–surface2);color:var(–text3);font-style:italic;}
.cp-add-src{background:var(–surface2);border:1px solid var(–border);border-radius:8px;padding:12px;margin-top:8px;display:flex;flex-direction:column;gap:6px;}
.cp-add-src-title{font-size:10px;font-weight:600;color:var(–text2);margin-bottom:2px;}
.cp-input-sm{border:1px solid var(–border);border-radius:6px;padding:5px 9px;font-size:11px;font-family:inherit;color:var(–text);background:var(–surface);width:100%;}
.cp-input-sm:focus{outline:none;border-color:var(–accent);}
.cp-save{width:100%;background:var(–text);border:none;color:var(–bg);border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:-0.1px;transition:opacity 0.12s;}
.cp-save:hover{opacity:0.88;}
.cp-legend{display:flex;gap:10px;font-size:10px;color:var(–text3);margin-bottom:8px;flex-wrap:wrap;}
.cp-legend-item{display:flex;align-items:center;gap:4px;}
.cp-plat-tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;}
.cp-plat-tab{background:var(–surface2);border:1px solid var(–border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(–text2);font-weight:500;transition:all 0.1s;}
.cp-plat-tab.active{background:var(–text);color:var(–bg);border-color:var(–text);}

/* ═══════════════════════════════════════════
SOURCE FOOTER
═══════════════════════════════════════════ */
.src-footer{margin-top:32px;padding-top:16px;border-top:1px solid var(–border2);}
.src-footer-label{font-size:9px;font-weight:700;color:var(–text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
.src-footer-links{display:flex;flex-wrap:wrap;gap:2px 0;align-items:center;}
.src-footer-link{font-size:10px;color:var(–text3);text-decoration:none;padding:2px 7px;border-radius:4px;transition:color 0.1s,background 0.1s;font-weight:500;white-space:nowrap;}
.src-footer-link:hover{color:var(–text);background:var(–surface2);}
.src-footer-sep{font-size:9px;color:var(–text4);user-select:none;}

/* ═══════════════════════════════════════════
v17 ADDITIONS — Ghost editorial polish
═══════════════════════════════════════════ */

/* MORNING BRIEFING INLINE — no card, just typography under hero */
.briefing-inline{
margin: 24px 0 32px;
padding: 0;
border: none;
background: transparent;
}
.briefing-inline-head{
display:flex;align-items:center;justify-content:space-between;
margin-bottom:10px;
}
.briefing-inline-label{
font-size:11px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.12em;
}
.briefing-inline-refresh{
background:none;border:none;color:var(–text3);
font-size:14px;cursor:pointer;padding:4px 8px;border-radius:6px;
transition:color 0.15s,background 0.15s;
font-family:inherit;
}
.briefing-inline-refresh:hover:not(:disabled){color:var(–accent);background:var(–surface2);}
.briefing-inline-refresh:disabled{opacity:0.5;cursor:wait;}
.briefing-inline-body{
font-size:17px;line-height:1.6;color:var(–text);
font-weight:400;letter-spacing:-0.2px;
margin:0;
/* Editorial weight: looks like a newspaper lede paragraph */
font-family: ui-serif, Georgia, ‘Times New Roman’, serif;
}
.briefing-inline-body strong{font-weight:700;color:var(–text);}
.briefing-inline-empty{
font-size:13px;color:var(–text3);font-style:italic;margin:0;
}

/* TODAY page — single column, no sidebar, generous whitespace */
.today-flow{display:block;max-width:920px;margin:0 auto;}
.today-section{margin-bottom:36px;}
.today-section-head{
display:flex;align-items:baseline;justify-content:space-between;
margin-bottom:14px;padding:0;
}
.today-section-label{
font-size:11px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.12em;
display:flex;align-items:baseline;gap:8px;
}
.today-section-cat{color:var(–text);font-weight:800;}
.today-section-link{
background:none;border:none;color:var(–text3);
font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
padding:4px 0;transition:color 0.15s;
}
.today-section-link:hover{color:var(–accent);}

/* Ghost feed item — used in Today section lists */
.gf-item{
display:flex;gap:14px;align-items:flex-start;
padding:14px 0;cursor:pointer;
border-bottom:1px solid var(–border2);
transition:background 0.15s;
}
.gf-item:last-child{border-bottom:none;}
.gf-item:hover{background:var(–surface2);margin:0 -12px;padding:14px 12px;border-radius:8px;border-bottom-color:transparent;}
.gf-item:hover + .gf-item{border-top-color:transparent;}
.gf-thumb,.gf-thumb-ph{
width:80px;height:60px;flex-shrink:0;
border-radius:6px;background-size:cover;background-position:center;
background-color:var(–surface2);
}
.gf-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.gf-title{
font-size:14px;font-weight:600;color:var(–text);
line-height:1.35;letter-spacing:-0.2px;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.gf-meta{
font-size:11px;color:var(–text3);
display:flex;align-items:center;gap:6px;
}
.gf-meta-cat{font-weight:700;}

/* GHOST treatment overrides — strip card chrome from secondary blocks */
.rn-strip{background:transparent;border:none;padding:8px 0;border-radius:0;}
.follow-card{background:transparent;border:none;padding:6px 0;}
.follow-card:hover{transform:none;border:none;background:var(–surface2);padding:6px 8px;margin:-0 -8px;border-radius:6px;}
.trending-card{background:transparent;border:none;padding:8px 0;}
.trending-card:hover{transform:none;border:none;background:var(–surface2);padding:8px 10px;margin:0 -10px;border-radius:8px;}

/* Podcast cards — Ghost */
.pod-card{background:transparent!important;border:none!important;box-shadow:none!important;}
.pod-card:hover{background:var(–surface2)!important;}

/* Social blocks — Ghost */
.social-block{background:transparent!important;border:none!important;}

/* Finance Ghost */
.fin-table{background:transparent;border:none;}
.fin-table thead th{background:transparent;border-bottom:1px solid var(–border);}
.fin-row{border-bottom:1px solid var(–border2);}

/* Topbar auto-hide (mobile scroll-direction aware) */
.topbar-wrap{transition:transform 0.28s cubic-bezier(.4,0,.2,1);}
.topbar-wrap.hidden{transform:translateY(-100%);}

/* Prevent rubber-band conflict with pull-to-refresh */
body{overscroll-behavior-y:contain;}

/* ─── MOBILE TOPBAR (hidden on desktop, shown ≤640px) ─── */
.mobile-top{display:none;background:var(–surface);border-bottom:1px solid var(–border);}
.mobile-header{display:flex;align-items:center;justify-content:space-between;padding:0 12px;height:48px;}
.mobile-logo{font-size:17px;font-weight:900;color:var(–text);letter-spacing:-0.8px;line-height:1;}
.mobile-logo span{color:var(–accent);}
.mobile-logo-sub{font-size:8px;color:var(–text3);letter-spacing:0.14em;text-transform:uppercase;font-weight:700;margin-top:1px;}
.mobile-actions{display:flex;gap:4px;align-items:center;}
.mobile-icon-btn{
background:none;border:none;width:40px;height:40px;border-radius:8px;
display:flex;align-items:center;justify-content:center;
cursor:pointer;color:var(–text2);font-size:18px;
transition:background 0.12s;padding:0;
-webkit-tap-highlight-color:transparent;
}
.mobile-icon-btn:active{background:var(–surface2);}

/* Horizontal chip bar — Yahoo News scrollable pills */
.chip-bar{
display:flex;gap:0;align-items:center;
padding:0 4px;height:44px;
overflow-x:auto;scrollbar-width:none;
-webkit-overflow-scrolling:touch;
scroll-snap-type:x proximity;
border-top:1px solid var(–border2);
}
.chip-bar::-webkit-scrollbar{display:none;}
.chip{
flex-shrink:0;scroll-snap-align:start;
background:none;border:none;
padding:8px 14px;margin:0 2px;
font-size:13px;font-weight:600;font-family:inherit;
color:var(–text3);cursor:pointer;white-space:nowrap;
border-radius:20px;min-height:32px;
display:flex;align-items:center;gap:5px;
transition:color 0.15s,background 0.15s;
-webkit-tap-highlight-color:transparent;
}
.chip:active{background:var(–surface2);}
.chip.active{color:#fff;font-weight:700;}

/* Mobile search slide-in */
.mobile-search{display:none;padding:8px 12px;border-top:1px solid var(–border2);}
.mobile-search.open{display:block;}
.mobile-search-input{
width:100%;padding:10px 14px;
background:var(–surface2);border:1px solid var(–border);
border-radius:22px;font-size:14px;font-family:inherit;color:var(–text);
}
.mobile-search-input:focus{outline:none;border-color:var(–accent);}

/* ─── BOTTOM TAB BAR (mobile only) ─── */
.bottom-tabs{
display:none;
position:fixed;bottom:0;left:0;right:0;
background:var(–surface);border-top:1px solid var(–border);
z-index:400;height:56px;
padding-bottom:env(safe-area-inset-bottom, 0);
}
.bottom-tabs-inner{display:grid;grid-template-columns:repeat(4,1fr);height:100%;}
.bottom-tab{
background:none;border:none;
display:flex;flex-direction:column;align-items:center;justify-content:center;
gap:3px;cursor:pointer;font-family:inherit;
color:var(–text3);transition:color 0.12s;padding:6px 4px;
-webkit-tap-highlight-color:transparent;
}
.bottom-tab:active{background:var(–surface2);}
.bottom-tab-icon{font-size:20px;line-height:1;}
.bottom-tab-label{font-size:10px;font-weight:600;letter-spacing:0.01em;}
.bottom-tab.active{color:var(–accent);}

/* ─── MENU SHEET (bottom-sheet for overflow nav) ─── */
.menu-sheet-overlay{
position:fixed;inset:0;background:rgba(0,0,0,0.35);
z-index:500;display:flex;align-items:flex-end;
backdrop-filter:blur(3px);animation:fade-in 0.15s ease-out;
}
@keyframes fade-in{from{opacity:0;}to{opacity:1;}}
.menu-sheet{
background:var(–surface);width:100%;max-height:80vh;overflow-y:auto;
border-radius:16px 16px 0 0;
padding:8px 0 calc(env(safe-area-inset-bottom, 0) + 12px);
animation:sheet-up 0.22s cubic-bezier(.4,0,.2,1);
}
@keyframes sheet-up{from{transform:translateY(100%);}to{transform:translateY(0);}}
.menu-sheet-grab{width:36px;height:4px;border-radius:2px;background:var(–text4);margin:8px auto 14px;}
.menu-sheet-head{padding:0 20px 10px;font-size:11px;color:var(–text3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;border-bottom:1px solid var(–border2);margin-bottom:4px;}
.menu-sheet-item{
display:flex;align-items:center;gap:14px;
padding:14px 20px;cursor:pointer;
color:var(–text);font-size:15px;font-weight:600;
transition:background 0.1s;min-height:52px;
border:none;background:none;width:100%;text-align:left;font-family:inherit;
-webkit-tap-highlight-color:transparent;
}
.menu-sheet-item:active{background:var(–surface2);}
.menu-sheet-item-emoji{font-size:20px;width:24px;text-align:center;}
.menu-sheet-item-label{flex:1;}
.menu-sheet-item.active .menu-sheet-item-label{color:var(–accent);}
.menu-sheet-item-chevron{color:var(–text3);font-size:14px;}
.menu-sheet-divider{height:1px;background:var(–border2);margin:6px 0;}

/* ─── PULL-TO-REFRESH INDICATOR ─── */
.ptr-indicator{
position:fixed;top:0;left:50%;transform:translateX(-50%);
z-index:250;width:36px;height:36px;border-radius:50%;
background:var(–surface);border:1px solid var(–border);
box-shadow:var(–shadow-md);
display:flex;align-items:center;justify-content:center;
color:var(–accent);font-size:16px;font-weight:700;
pointer-events:none;transition:opacity 0.15s;
}
.ptr-indicator.hidden{opacity:0;}
.ptr-indicator.refreshing .ptr-spin{animation:spin 0.8s linear infinite;}
@keyframes spin{from{transform:rotate(0);}to{transform:rotate(360deg);}}

/* ─── RIGHT NOW STRIP (urgent + scores + market moves unified) ─── */
.rn-strip{
background:var(–surface);border:1px solid var(–border);border-radius:var(–radius);
padding:10px 14px;margin-bottom:20px;
display:flex;align-items:center;gap:14px;
overflow-x:auto;scrollbar-width:none;
}
.rn-strip::-webkit-scrollbar{display:none;}
.rn-label{
font-size:10px;font-weight:800;color:var(–red);
text-transform:uppercase;letter-spacing:0.1em;
white-space:nowrap;flex-shrink:0;
display:flex;align-items:center;gap:5px;
}
.rn-pulse{width:6px;height:6px;border-radius:50%;background:var(–red);animation:pulse-badge 1.4s ease-in-out infinite;}
.rn-items{display:flex;gap:18px;align-items:center;flex:1;min-width:0;}
.rn-item{
display:flex;align-items:center;gap:6px;
font-size:12px;white-space:nowrap;cursor:pointer;flex-shrink:0;
padding:4px 0;color:var(–text2);
transition:color 0.12s;
}
.rn-item:hover{color:var(–text);}
.rn-item-kind{font-size:13px;}
.rn-item-text{font-weight:600;}
.rn-item-val{font-weight:700;font-variant-numeric:tabular-nums;}
.rn-item-val.up{color:var(–green);}
.rn-item-val.down{color:var(–red);}
.rn-divider{width:1px;height:14px;background:var(–border);flex-shrink:0;}
.rn-empty{font-size:12px;color:var(–text3);font-style:italic;}

/* ─── FOLLOWING STRIP (Yahoo Sports “My Teams” generalized) ─── */
.follow-strip{margin-bottom:24px;}
.follow-head{
display:flex;align-items:center;justify-content:space-between;
margin-bottom:10px;padding:0 2px;
}
.follow-title{
font-size:11px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.1em;
display:flex;align-items:center;gap:6px;
}
.follow-edit{background:none;border:none;color:var(–text3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;padding:0;transition:color 0.12s;}
.follow-edit:hover{color:var(–accent);}
.follow-row{
display:flex;gap:10px;
overflow-x:auto;scrollbar-width:none;
-webkit-overflow-scrolling:touch;
scroll-snap-type:x proximity;
padding:2px 0 4px;
margin:0 -2px;
}
.follow-row::-webkit-scrollbar{display:none;}
.follow-card{
flex-shrink:0;scroll-snap-align:start;
background:var(–surface);border:1px solid var(–border);
border-radius:var(–radius);padding:10px 12px;
min-width:220px;max-width:260px;
cursor:pointer;transition:border-color 0.15s,transform 0.15s;
display:flex;flex-direction:column;gap:6px;
}
.follow-card:hover{border-color:var(–accent);transform:translateY(-1px);}
.follow-card-head{display:flex;align-items:center;gap:8px;}
.follow-card-emoji{font-size:18px;line-height:1;}
.follow-card-name{font-size:12px;font-weight:800;color:var(–text);letter-spacing:-0.2px;}
.follow-card-kind{
font-size:8px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.08em;margin-left:auto;
}
.follow-card-ticker{
font-size:10px;font-weight:700;color:var(–accent);
font-family:‘SF Mono’,‘Cascadia Code’,‘Consolas’,monospace;
font-variant-numeric:tabular-nums;margin-left:auto;
display:flex;align-items:center;gap:4px;
}
.follow-card-ticker.up{color:var(–green);}
.follow-card-ticker.down{color:var(–red);}
.follow-card-headline{
font-size:12px;font-weight:600;color:var(–text2);line-height:1.4;
display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.follow-card-empty{font-size:11px;color:var(–text3);font-style:italic;}
.follow-card-meta{font-size:10px;color:var(–text3);margin-top:auto;}

/* ─── TRENDING INLINE CAROUSEL (moved from sidebar on Today) ─── */
.trending-inline{margin-bottom:28px;}
.trending-inline-head{
display:flex;align-items:center;justify-content:space-between;
margin-bottom:10px;padding:0 2px;
}
.trending-inline-title{
font-size:11px;font-weight:700;color:var(–text3);
text-transform:uppercase;letter-spacing:0.1em;
}
.trending-row{
display:flex;gap:12px;
overflow-x:auto;scrollbar-width:none;
-webkit-overflow-scrolling:touch;
scroll-snap-type:x proximity;
padding:2px 0 4px;margin:0 -2px;
}
.trending-row::-webkit-scrollbar{display:none;}
.trending-card{
flex-shrink:0;scroll-snap-align:start;
width:260px;background:var(–surface);
border:1px solid var(–border);border-radius:var(–radius);
padding:12px;cursor:pointer;
transition:border-color 0.15s,transform 0.15s;
display:flex;flex-direction:column;gap:8px;
}
.trending-card:hover{border-color:var(–accent);transform:translateY(-1px);}
.trending-card-meta{display:flex;align-items:center;gap:6px;}
.trending-card-badge{
font-size:8px;font-weight:700;border-radius:4px;padding:1px 6px;
letter-spacing:0.04em;text-transform:uppercase;
}
.trending-card-num{font-size:14px;font-weight:900;color:var(–text4);font-variant-numeric:tabular-nums;}
.trending-card-title{
font-size:13px;font-weight:700;color:var(–text);line-height:1.35;letter-spacing:-0.2px;
display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.trending-card-src{font-size:10px;color:var(–text3);margin-top:auto;}

/* ─── LAST UPDATED (per-feed timestamp) ─── */
.last-updated{
font-size:10px;color:var(–text3);font-weight:500;
display:inline-flex;align-items:center;gap:4px;
}
.last-updated-dot{width:5px;height:5px;border-radius:50%;background:var(–green);}
.last-updated-dot.stale{background:var(–amber);}

/* Swipe hint — brief toast when user changes category on mobile */
.swipe-hint{
position:fixed;bottom:calc(56px + env(safe-area-inset-bottom, 0) + 12px);
left:50%;transform:translateX(-50%);
background:rgba(17,24,39,0.9);color:#fff;
font-size:11px;font-weight:600;padding:6px 14px;border-radius:16px;
z-index:350;pointer-events:none;
animation:hint-fade 2.2s ease-out forwards;
display:flex;align-items:center;gap:6px;
}
@keyframes hint-fade{
0%{opacity:0;transform:translateX(-50%) translateY(6px);}
15%{opacity:1;transform:translateX(-50%) translateY(0);}
80%{opacity:1;}
100%{opacity:0;transform:translateX(-50%) translateY(-6px);}
}

/* ═══════════════════════════════════════════
RESPONSIVE
═══════════════════════════════════════════ */
@media (max-width:1100px){
.page{padding:18px 16px;}
.page-grid{gap:32px;}
}
@media (max-width:900px){
.page-grid,.pod-page,.today-main,.fin-grid{grid-template-columns:1fr!important;gap:20px;}
.hero-row{grid-template-columns:1fr;}
.today-grid{grid-template-columns:1fr;}
.bloom-strip{grid-template-columns:1fr 1fr;}
.sidebar{order:2;}.feed-col{order:1;}
.nav-bar-inner{gap:6px;}
.logo{font-size:16px;}
.search-input{width:80px;}
.fin-indices{grid-template-columns:1fr;}
}

/* ═══════════════════════════════════════════
MOBILE (≤640px) — Yahoo pattern
═══════════════════════════════════════════ */
@media (max-width:640px){
/* Swap desktop topbar for mobile topbar + bottom tabs */
.whisper-bar{display:none;}
.nav-bar{display:none;}
.mobile-top{display:block;}
.bottom-tabs{display:block;}
/* Reserve space so content isn’t hidden behind bottom tabs */
body{padding-bottom:calc(56px + env(safe-area-inset-bottom, 0));}

.page{padding:12px 12px 20px;}

/* Hero — shorter + full-bleed on mobile (friend was right; 200px tall hero
wastes the fold. 16/10 at full-width ≈ ~220px on typical phones.) */
.hero-row{grid-template-columns:1fr;gap:12px;margin:-12px -12px 16px;}
.hero-lead{border-radius:0;border-left:none;border-right:none;box-shadow:none;}
.hero-lead:hover{box-shadow:none;transform:none;}
.hero-lead-img{aspect-ratio:16/10;max-height:240px;}
.hero-lead-text{padding:14px 14px 16px;}
.hero-lead-title{font-size:19px;letter-spacing:-0.4px;-webkit-line-clamp:2;}
.hero-lead-desc{-webkit-line-clamp:2;font-size:13px;}
.hero-arrow{width:30px;height:30px;font-size:16px;}
.hero-prev{left:8px;}.hero-next{right:8px;}
.hero-side{display:none;} /* drop secondary hero sidebar — noise on mobile */

.breaking-bar{height:24px;}
.breaking-item{font-size:10px;}
.breaking-ticker-inner{animation-duration:60s;gap:40px;}

/* Right Now strip — tighter on mobile */
.rn-strip{padding:8px 12px;margin-bottom:14px;gap:10px;border-radius:10px;}
.rn-items{gap:12px;}
.rn-item{font-size:11px;}

/* Following strip — slightly smaller cards for mobile */
.follow-strip{margin-bottom:18px;}
.follow-card{min-width:180px;max-width:210px;padding:9px 11px;}
.follow-card-name{font-size:11px;}
.follow-card-headline{font-size:11px;-webkit-line-clamp:2;}

/* Trending carousel — same pattern on mobile */
.trending-inline{margin-bottom:20px;}
.trending-card{width:220px;padding:11px;}
.trending-card-title{font-size:12px;}

/* Bloom 1-col */
.bloom-strip{grid-template-columns:1fr;}
.bloom-strip-item{border-right:none;border-bottom:1px solid var(–border2);}
.bloom-strip-item:last-child{border-bottom:none;}

/* FEED CARDS — Yahoo image-first pattern: big photo on top, tight title */
.fc{padding:14px 0;}
.fc:hover{background:transparent;margin:0;padding:14px 0;}
.fc:active{background:var(–surface2);}
.fc-body{flex-direction:column-reverse;gap:10px;}
.fc-thumb,.fc-thumb-ph{width:100%;height:200px;border-radius:10px;}
.fc-title{font-size:16px;-webkit-line-clamp:3;letter-spacing:-0.3px;line-height:1.3;}
.fc-desc{display:none;} /* cleaner mobile — title carries the weight */
.fc-meta{margin-bottom:8px;order:-1;}
.fc-act{padding:8px 13px;font-size:12px;min-height:44px;border-radius:22px;}
.fc-actions{gap:6px;margin-top:10px;}
.fc-read-link{font-size:11px;margin-left:auto;min-height:44px;display:flex;align-items:center;}

/* Morning briefing */
.briefing{margin-bottom:16px;border-radius:10px;}
.briefing-head{padding:11px 14px 9px;}
.briefing-title{font-size:13px;}
.briefing-body{padding:11px 14px 13px;}
.briefing-overview{font-size:13px;line-height:1.6;}

/* Today page */
.today-main{gap:12px;}
.today-grid{gap:10px;}
.today-block-head{padding:10px 12px 8px;}
.today-item{padding:10px 12px;min-height:52px;}
.today-thumb,.today-thumb-ph{width:56px;height:42px;}
.today-item-title{font-size:12px;}
.today-ai-btn{padding:8px 12px;font-size:13px;min-height:44px;min-width:44px;}

/* Social / scoreboard */
.social-page-grid{grid-template-columns:1fr;}
.social-page-header{flex-direction:column;align-items:stretch;}
.sb-games{padding:4px 6px 8px;}
.sb-league-head{padding:10px 12px;min-height:44px;}
.sidebar{gap:20px;margin-top:20px;}

/* Podcast */
.pod-page{gap:20px;}
.pod-card{padding:12px;}
.pod-btn{padding:8px 12px;font-size:11px;min-height:44px;}
.pod-show-item{padding:12px 0;min-height:44px;}

/* Customize bottom-sheet */
.cp-overlay{padding:0;align-items:flex-end;}
.cp-panel{max-width:100%;max-height:92vh;border-radius:16px 16px 0 0;}
.cp-cat-tab,.cp-plat-tab{padding:8px 12px;font-size:11px;min-height:36px;}
.cp-chip{padding:5px 11px;font-size:11px;min-height:28px;}
.cp-input,.cp-input-sm{padding:9px 12px;font-size:13px;min-height:44px;}
.cp-btn{padding:9px 13px;font-size:12px;min-height:44px;}
.cp-save{padding:13px;font-size:14px;min-height:48px;}

/* Finance table */
.fin-table td{padding:9px 8px;font-size:11px;}
.fin-table thead th{padding:7px 8px;}
.fin-name{display:none;}
.fin-table thead th:nth-child(2){display:none;}

.page-customize-btn{font-size:12px;min-height:40px;}
}

@media (max-width:380px){
.fc-thumb,.fc-thumb-ph{height:170px;}
.hero-lead-title{font-size:17px;}
.follow-card{min-width:160px;max-width:180px;}
.trending-card{width:200px;}
}

@media (hover:none){
button,a,.src-row,.trend-row,.today-item,.fc,.pod-card{-webkit-tap-highlight-color:rgba(29,78,216,0.08);}
}
`;

// ─── DIVERSITY-AWARE TRENDING ─────────────────────────────────────────────────
// Returns up to `limit` articles with at most `maxPerCat` from each category.
// This fixes the “all sports” sidebar bug when sports is heavily loaded.
function diverseTrending(arts, kw, limit = 8, maxPerCat = 2) {
const allKws = Object.values(kw).flat().map(k => k.toLowerCase());
const all = Object.values(arts).flat();
const seen = new Set();
const deduped = all.filter(a => {
const k = a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’);
if (seen.has(k)) return false; seen.add(k); return true;
});
deduped.sort((a,b) => {
const aTxt=(a.title+’ ‘+(a.desc||’’)).toLowerCase();
const bTxt=(b.title+’ ‘+(b.desc||’’)).toLowerCase();
const aKw=allKws.filter(k=>aTxt.includes(k)).length;
const bKw=allKws.filter(k=>bTxt.includes(k)).length;
if (bKw!==aKw) return bKw-aKw;
return new Date(b.pubDate)-new Date(a.pubDate);
});
// Enforce per-category cap
const catCounts = {};
const result = [];
for (const a of deduped) {
const cat = a.cat || ‘general’;
if (!catCounts[cat]) catCounts[cat] = 0;
if (catCounts[cat] >= maxPerCat) continue;
catCounts[cat]++;
result.push(a);
if (result.length >= limit) break;
}
return result;
}

// ─── FEED CARD ────────────────────────────────────────────────────────────────
function FeedCard({a, cat, isSaved, onSave, onRead, relatedSources}) {
const [imgErr, setImgErr] = useState(false);
const [aiState, setAiState] = useState(‘closed’);
const [summary, setSummary] = useState(’’);
const [takeaways, setTakeaways] = useState(’’);
const [aiErr, setAiErr] = useState(’’);
const [loadingAI, setLoadingAI] = useState(false);
const [showDisc, setShowDisc] = useState(false);
const [disc, setDisc] = useState(null);
const [loadingDisc, setLoadingDisc] = useState(false);
const cc = CATS[cat]||CATS.general;
const topKw = a.matchedKw?.[0]||null;

const handleAI = async (e) => {
e.stopPropagation();
if (aiState===‘closed’) {
if (summary) { setAiState(‘summary’); return; }
setAiState(‘summary’); setLoadingAI(true);
const {summary:s,error} = await fetchAISummary({type:‘article’,title:a.title,content:a.desc||’’,mode:‘summary’});
if (s) setSummary(s); else setAiErr(error||‘Unavailable’);
setLoadingAI(false);
} else if (aiState===‘summary’) {
if (takeaways) { setAiState(‘takeaways’); return; }
setAiState(‘takeaways’); setLoadingAI(true);
const {summary:t,error} = await fetchAISummary({type:‘article’,title:a.title,content:a.desc||’’,mode:‘takeaways’});
if (t) setTakeaways(t); else setAiErr(error||‘Unavailable’);
setLoadingAI(false);
} else { setAiState(‘closed’); }
};

const handleDisc = async (e) => {
e.stopPropagation();
if (showDisc) { setShowDisc(false); return; }
if (disc) { setShowDisc(true); return; }
setShowDisc(true); setLoadingDisc(true);
const results = {reddit:[],hn:[]};
try {
const q = encodeURIComponent(a.title.slice(0,80));
const r = await fetch(`https://www.reddit.com/search.json?q=${q}&sort=relevance&limit=3&t=week`,{signal:AbortSignal.timeout(6000)});
if (r.ok) {
const d = await r.json();
results.reddit = (d?.data?.children||[]).filter(c=>c.data?.num_comments>0).slice(0,3).map(c=>({
title:c.data.title, sub:c.data.subreddit_name_prefixed,
ups:c.data.ups, comments:c.data.num_comments,
url:`https://reddit.com${c.data.permalink}`,
}));
}
} catch {}
try {
const q = encodeURIComponent(a.title.slice(0,80));
const r = await fetch(`https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=3`,{signal:AbortSignal.timeout(6000)});
if (r.ok) {
const d = await r.json();
results.hn = (d?.hits||[]).filter(h=>h.num_comments>0).slice(0,3).map(h=>({
title:h.title, points:h.points, comments:h.num_comments,
url:`https://news.ycombinator.com/item?id=${h.objectID}`,
}));
}
} catch {}
setDisc(results); setLoadingDisc(false);
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
? <img className=“fc-thumb” src={a.img} loading=“lazy” onError={()=>setImgErr(true)} alt=””/>
: <div className="fc-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
<div className="fc-text">
<div className="fc-title">{a.title}</div>
{a.desc && <div className="fc-desc">{a.desc}</div>}
</div>
</div>
{aiState!==‘closed’ && (
<div className=“fc-ai-panel” onClick={e=>e.stopPropagation()}>
<div className="fc-summary">
<div className="fc-summary-lbl">✦ AI Summary</div>
{loadingAI && !summary
? <div style={{fontSize:‘11px’,color:‘var(–text3)’,fontStyle:‘italic’}}>Generating summary…</div>
: aiErr && !summary
? <div style={{fontSize:‘11px’,color:‘var(–red)’}}>{aiErr}</div>
: <div className="fc-summary-text">{summary}</div>}
</div>
{aiState===‘takeaways’ && (
<div className="fc-takeaways">
<div className="fc-takeaways-lbl">📋 Key Takeaways</div>
{loadingAI && !takeaways
? <div style={{fontSize:‘11px’,color:‘var(–text3)’,fontStyle:‘italic’}}>Analyzing article…</div>
: aiErr && !takeaways
? <div style={{fontSize:‘11px’,color:‘var(–red)’}}>{aiErr}</div>
: <TakeawaysContent text={takeaways}/>}
</div>
)}
</div>
)}
{showDisc && (
<div className=“fc-disc” onClick={e=>e.stopPropagation()}>
<div className="fc-disc-lbl">💬 What People Are Saying</div>
{loadingDisc
? <div style={{fontSize:‘11px’,color:‘var(–text3)’,fontStyle:‘italic’}}>Searching discussions…</div>
: (!disc||(disc.reddit.length===0&&disc.hn.length===0))
? <div style={{fontSize:‘11px’,color:‘var(–text3)’}}>No discussions found on Reddit or HN for this story.</div>
: <>
{disc.reddit.map((r,i)=>(
<a key={`r${i}`} className=“fc-disc-item” href={r.url} target=”_blank” rel=“noreferrer” onClick={e=>e.stopPropagation()}>
<span className="fc-disc-platform reddit">Reddit</span>
<span className="fc-disc-sub">{r.sub}</span>
<span className="fc-disc-stats">▲{r.ups} · {r.comments} comments</span>
</a>
))}
{disc.hn.map((h,i)=>(
<a key={`h${i}`} className=“fc-disc-item” href={h.url} target=”_blank” rel=“noreferrer” onClick={e=>e.stopPropagation()}>
<span className="fc-disc-platform hn">HN</span>
<span className="fc-disc-title">{h.title}</span>
<span className="fc-disc-stats">{h.points}pts · {h.comments} comments</span>
</a>
))}
</>}
</div>
)}
{relatedSources && relatedSources.length > 0 && (
<div className=“fc-more” onClick={e=>e.stopPropagation()}>
<span className="fc-more-lbl">Also covering:</span>
{relatedSources.slice(0,4).map((s,i)=>(
<button key={i} className=“fc-more-src” onClick={()=>s.link&&window.open(s.link,’_blank’)}>{s.source}</button>
))}
</div>
)}
<div className=“fc-actions” onClick={e=>e.stopPropagation()}>
<button className={`fc-act ${isSaved?'saved':''}`} onClick={e=>{e.stopPropagation();onSave(a);}}>
{isSaved?‘★ Saved’:‘☆ Save’}
</button>
<button className={`fc-act ${aiState!=='closed'?'ai-on':''}`} onClick={handleAI} disabled={loadingAI}>
✦ {loadingAI?‘Thinking…’:aiState===‘closed’?‘AI Summary’:aiState===‘summary’?‘Key Takeaways’:‘Hide AI’}
</button>
<button className={`fc-act ${showDisc?'disc-on':''}`} onClick={handleDisc} disabled={loadingDisc}>
💬 {loadingDisc?‘Searching…’:showDisc?‘Hide’:‘Pulse’}
</button>
<a className=“fc-read-link” href={a.link} target=”_blank” rel=“noreferrer” onClick={e=>{e.stopPropagation();onRead(a);}}>Read →</a>
</div>
</div>
);
}

// ─── TODAY ITEM ───────────────────────────────────────────────────────────────
function TodayItem({a, cc, onRead}) {
const [showSum, setShowSum] = useState(false);
const [sum, setSum] = useState(’’);
const [err, setErr] = useState(’’);
const [loading, setLoading] = useState(false);
const [imgErr, setImgErr] = useState(false);

const handleAI = async (e) => {
e.stopPropagation();
if (showSum) { setShowSum(false); return; }
if (sum||err) { setShowSum(true); return; }
setShowSum(true); setLoading(true);
const {summary, error} = await fetchAISummary({type:‘article’,title:a.title,content:a.desc||’’});
if (summary) setSum(summary); else setErr(error||‘Summary unavailable’);
setLoading(false);
};

return (
<div className="today-item-wrap">
<div className=“today-item” onClick={()=>onRead(a)}>
{a.img && !imgErr
? <img className=“today-thumb” src={a.img} loading=“lazy” onError={()=>setImgErr(true)} alt=””/>
: <div className="today-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
<div className="today-item-body">
<div className="today-item-title">{a.title}</div>
<div className="today-item-src">{a.source} · {fmtDate(a.pubDate)}</div>
</div>
<button className={`today-ai-btn ${showSum?'on':''}`} title=“AI Summary” onClick={handleAI} disabled={loading}>
{loading?’…’:‘✦’}
</button>
</div>
{showSum && (
<div className=“today-summary” onClick={e=>e.stopPropagation()}>
{loading ? <em style={{color:‘var(–text3)’}}>Generating summary…</em>
: err ? <span style={{color:‘var(–red)’}}>{err}</span>
: sum}
</div>
)}
</div>
);
}

// ─── MORNING BRIEFING (single overview paragraph) ─────────────────────────────
function MorningBriefing({arts, onRead}) {
const [text, setText] = useState(’’);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(’’);

const dateStr = new Date().toLocaleDateString(‘en-US’,{weekday:‘long’,month:‘long’,day:‘numeric’});

const generate = async () => {
setLoading(true); setError(’’);
// Build a dense context: top 2 headlines per category, unlabelled — let AI synthesize freely
const lines = Object.entries(arts).flatMap(([cat, list]) =>
(list||[]).slice(0,2).map(a => `${CATS[cat]?.emoji||''} ${a.title}`)
).join(’\n’);

```
const {summary, error:err} = await fetchAISummary({
  type:'article',
  title:`News Overview — ${dateStr}`,
  content:`Write a single punchy paragraph (3-5 sentences) synthesizing today's biggest stories across all categories. Be direct, informative, and specific — name the actual stories. No bullet points, no category headers. Just one tight paragraph a busy professional would want to read.\n\nHeadlines:\n${lines}`,
  mode:'summary',
});
if (summary) setText(summary.trim());
else setError(err||'Could not generate briefing');
setLoading(false);
```

};

useEffect(() => {
const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
if (total > 10 && !text && !loading) generate();
}, [arts]);

return (
<div className="briefing">
<div className="briefing-head">
<div className="briefing-left">
<span className="briefing-icon">☕</span>
<div>
<div className="briefing-title">Today’s Briefing</div>
<div className="briefing-date">{dateStr}</div>
</div>
</div>
<button className="briefing-refresh" onClick={generate} disabled={loading}>
{loading?‘Generating…’:‘↺ Refresh’}
</button>
</div>
{error && <div className="briefing-err">{error}</div>}
{text
? <div className="briefing-body"><p className=“briefing-overview” dangerouslySetInnerHTML={{__html: text.replace(/**([^*]+)**/g,’<strong>$1</strong>’)}}/></div>
: !loading ? <div className="briefing-loading">Loading articles before generating briefing…</div>
: <div className="briefing-loading">Writing overview…</div>}
</div>
);
}

// ─── MORNING BRIEFING INLINE (v17) ────────────────────────────────────────────
// Ghost-treatment briefing — no card, no border, no surface bg. Just a bold
// label and a single paragraph. Lives directly beneath the hero on Today.
// Uses the same fetchAISummary pipeline as the original MorningBriefing.
function MorningBriefingInline({arts}) {
const [text, setText] = useState(’’);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(’’);
const dateStr = new Date().toLocaleDateString(‘en-US’,{weekday:‘long’,month:‘long’,day:‘numeric’});

const generate = useCallback(async () => {
setLoading(true); setError(’’);
const lines = Object.entries(arts).flatMap(([cat, list]) =>
(list||[]).slice(0,2).map(a => `${CATS[cat]?.emoji||''} ${a.title}`)
).join(’\n’);
const {summary, error:err} = await fetchAISummary({
type:‘article’,
title:`News Overview — ${dateStr}`,
content:`Write a single punchy paragraph (3-5 sentences) synthesizing today's biggest stories across all categories. Be direct, informative, and specific — name the actual stories. No bullet points, no category headers. Just one tight paragraph a busy professional would want to read.\n\nHeadlines:\n${lines}`,
mode:‘summary’,
});
if (summary) setText(summary.trim());
else setError(err||‘Could not generate briefing’);
setLoading(false);
}, [arts, dateStr]);

useEffect(() => {
const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
if (total > 10 && !text && !loading) generate();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [arts]);

return (
<section className="briefing-inline">
<div className="briefing-inline-head">
<span className="briefing-inline-label">☕ The Briefing · {dateStr}</span>
<button className="briefing-inline-refresh" onClick={generate} disabled={loading} title="Regenerate">
{loading?’…’:‘↺’}
</button>
</div>
{text
? <p className=“briefing-inline-body” dangerouslySetInnerHTML={{__html: text.replace(/**([^*]+)**/g,’<strong>$1</strong>’)}}/>
: error
? <p className="briefing-inline-empty">{error}</p>
: loading
? <p className="briefing-inline-empty">Synthesizing today’s headlines…</p>
: <p className="briefing-inline-empty">Loading…</p>}
</section>
);
}

// ─── SCOREBOARD ───────────────────────────────────────────────────────────────
function Scoreboard({scores, loading, compact=false}) {
const [expanded, setExpanded] = useState(() => {
const init={};
LEAGUES.forEach(L=>{init[L.key]=[‘nfl’,‘nba’,‘mlb’].includes(L.key);});
return init;
});

const renderGame = (g, isFav) => {
const live=g.state===‘in’, final=g.state===‘post’;
const h=parseInt(g.homeScore)||0, aw=parseInt(g.awayScore)||0;
const homeWin=final&&h>aw, awayWin=final&&aw>h;
return (
<div key={g.id} className={`sb-game ${isFav?'fav':''} ${live?'live':''}`} onClick={()=>g.link&&window.open(g.link,’_blank’)}>
<div className="sb-game-row">
<div className="sb-side">
{g.awayLogo&&<img className=“sb-logo” src={g.awayLogo} alt=”” onError={e=>e.target.style.display=‘none’}/>}
<span className="sb-abbr">{g.awayAbbr||g.awayName}</span>
</div>
<span className={`sb-num ${awayWin?'winner':final?'loser':''}`}>{g.awayScore||’—’}</span>
</div>
<div className="sb-game-row">
<div className="sb-side">
{g.homeLogo&&<img className=“sb-logo” src={g.homeLogo} alt=”” onError={e=>e.target.style.display=‘none’}/>}
<span className="sb-abbr">{g.homeAbbr||g.homeName}</span>
</div>
<span className={`sb-num ${homeWin?'winner':final?'loser':''}`}>{g.homeScore||’—’}</span>
</div>
<div className={`sb-status ${live?'live':final?'final':'pre'}`}>
{isFav&&<span className="sb-fav-star">★</span>}
{live?‘● LIVE · ‘:’’}{g.status||fmtDate(g.date)}
</div>
</div>
);
};

if (loading&&(!scores||Object.keys(scores).length===0)) {
return <div className="sb-box"><div className="sb-box-head"><span className="sb-box-title">🏆 Scoreboard</span></div><div className="sb-empty">Loading scores…</div></div>;
}

return (
<div className="sb-box">
<div className="sb-box-head">
<span className="sb-box-title">🏆 Scoreboard</span>
<span className="sb-box-sub">Today · ESPN</span>
</div>
{LEAGUES.map(L => {
const games = scores[L.key]||[];
const sorted = […games].sort((a,b)=>{
const fa=favoriteIn(a)?0:1, fb=favoriteIn(b)?0:1;
return fa!==fb ? fa-fb : 0;
});
const favCount = sorted.filter(g=>favoriteIn(g)).length;
const isOpen = expanded[L.key];
const visible = compact
? sorted.filter(g=>favoriteIn(g)).concat(sorted.filter(g=>!favoriteIn(g)).slice(0,2)).slice(0,4)
: sorted;
return (
<div key={L.key} className="sb-league">
<button className=“sb-league-head” onClick={()=>setExpanded(s=>({…s,[L.key]:!s[L.key]}))}>
<span style={{color:L.accent,fontWeight:700}}>{L.emoji} {L.label}</span>
<span className="sb-league-meta">
{games.length===0
? <span style={{color:‘var(–text3)’,fontStyle:‘italic’}}>No games today</span>
: <><span>{games.length} {games.length===1?‘game’:‘games’}</span>{favCount>0&&<span className="sb-league-fav">★ {favCount}</span>}</>}
</span>
<span className="sb-chevron">{isOpen?‘▾’:‘▸’}</span>
</button>
{isOpen&&games.length>0&&(
<div className="sb-games">
{visible.map(g=>renderGame(g,favoriteIn(g)))}
{compact&&sorted.length>visible.length&&<div className="sb-more">+{sorted.length-visible.length} more games</div>}
</div>
)}
</div>
);
})}
</div>
);
}

// ─── GHOST SIDEBAR ────────────────────────────────────────────────────────────
function Sidebar({cat, arts, kw, health, activeKw, setActiveKw, activeSource, setActiveSource, onRead, scores, scoresLoading, showScoreboard}) {
const cc = CATS[cat]||CATS.general;
const catKws = kw[cat]||[];
const catArts = arts[cat]||[];
const srcCounts = {};
catArts.forEach(a=>{srcCounts[a.source]=(srcCounts[a.source]||0)+1;});
const sources = […new Set(catArts.map(a=>a.source))];
// Trending for category sidebar: use diversity only for general/today;
// for a specific category page, just show that category’s top articles
const trending = catArts.slice(0,8);

return (
<div className="sidebar">
{(activeKw||activeSource) && (
<div className="gs-filter">
{activeKw && <><span className="gs-filter-label">🔍 {activeKw}</span><button className=“gs-filter-x” onClick={()=>setActiveKw(null)}>✕</button></>}
{activeSource && <><span className="gs-filter-label" style={{color:cc.color}}>📰 {activeSource}</span><button className=“gs-filter-x” style={{color:cc.color}} onClick={()=>setActiveSource(null)}>✕</button></>}
</div>
)}

```
  {showScoreboard && <Scoreboard scores={scores} loading={scoresLoading}/>}

  {trending.length > 0 && (
    <div className="gs-section">
      <div className="gs-label">{cc.emoji} Trending</div>
      {trending.map((a,i)=>(
        <div key={i} className="trend-row" onClick={()=>onRead(a)}>
          <div className="trend-num">{i+1}</div>
          <div className="trend-body">
            <div className="trend-title">{a.title}</div>
            <div className="trend-src">{a.source} · {fmtDate(a.pubDate)}</div>
          </div>
        </div>
      ))}
    </div>
  )}

  {catKws.length > 0 && (
    <div className="gs-section">
      <div className="gs-label">
        Topics
        {activeKw && <button className="gs-clear" onClick={()=>setActiveKw(null)}>Clear</button>}
      </div>
      <div className="kw-chips">
        {catKws.map((k,i)=>(
          <span key={i} className={`kw-chip ${activeKw===k?'active':''}`} style={{background:cc.bg,color:cc.color}} onClick={()=>setActiveKw(activeKw===k?null:k)}>{k}</span>
        ))}
      </div>
    </div>
  )}

  {sources.length > 0 && (
    <div className="gs-section">
      <div className="gs-label">
        Sources
        {activeSource && <button className="gs-clear" onClick={()=>setActiveSource(null)}>Clear</button>}
      </div>
      {sources.map((name,i)=>{
        const h=health[name];
        const cls=h==='green'?'h-green':h==='yellow'?'h-yellow':h==='red'?'h-red':'h-gray';
        return (
          <div key={i} className={`src-row ${activeSource===name?'active-src':''}`} onClick={()=>setActiveSource(activeSource===name?null:name)}>
            <span className={`health-dot ${cls}`} title={h||'Pending'}/>
            <span className="src-name" style={{fontWeight:activeSource===name?700:500, color:activeSource===name?cc.color:''}}>{name}</span>
            <span className="src-count">{srcCounts[name]||0}</span>
          </div>
        );
      })}
    </div>
  )}
</div>
```

);
}

// ─── SOCIAL FOLLOWS ───────────────────────────────────────────────────────────
function SocialFollows({cat, social}) {
const catSocial = social[cat];
if (!catSocial) return null;
const platforms = Object.keys(catSocial).filter(p=>catSocial[p]&&catSocial[p].length>0);
if (!platforms.length) return null;
return (
<div className="social-block">
<div className="social-block-head">
<span className="social-block-title">🔗 Social Follows</span>
<span className="social-block-sub">Tap to open</span>
</div>
<div className="social-platforms">
{platforms.map(p=>{
const meta=SOCIAL_META[p];
const handles=catSocial[p];
return (
<div key={p} className="social-plat">
<div className="social-plat-head">
<div className="social-plat-icon" style={{background:meta.color}}>{meta.icon}</div>
<span className="social-plat-label">{meta.label}</span>
<span className="social-plat-count">{handles.length}</span>
</div>
<div className="social-handles">
{handles.map((h,i)=>(
<a key={i} className="social-handle" href={socialUrl(p,h)} target="_blank" rel="noreferrer" style={{color:meta.color}}>{h}</a>
))}
</div>
</div>
);
})}
</div>
</div>
);
}

// ─── SOURCE FOOTER ────────────────────────────────────────────────────────────
function SourceFooter({cat, feeds, arts}) {
let sources = [];
if (!cat) {
const seen=new Set();
Object.values(feeds).flat().forEach(f=>{if(f.on&&!seen.has(f.name)&&SOURCE_URLS[f.name]){seen.add(f.name);sources.push(f);}});
const counts={}; Object.values(arts).flat().forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});
sources.sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0)); sources=sources.slice(0,20);
} else {
const counts={}; (arts[cat]||[]).forEach(a=>{counts[a.source]=(counts[a.source]||0)+1;});
sources=(feeds[cat]||[]).filter(f=>f.on&&SOURCE_URLS[f.name]).sort((a,b)=>(counts[b.name]||0)-(counts[a.name]||0));
}
if (!sources.length) return null;
return (
<div className="src-footer">
<div className="src-footer-label">Sources</div>
<div className="src-footer-links">
{sources.map((f,i)=>(
<span key={f.name} style={{display:‘inline-flex’,alignItems:‘center’}}>
<a className="src-footer-link" href={SOURCE_URLS[f.name]} target="_blank" rel="noreferrer">{f.name}</a>
{i<sources.length-1&&<span className="src-footer-sep">·</span>}
</span>
))}
</div>
</div>
);
}

// ─── CUSTOMIZE PANEL ──────────────────────────────────────────────────────────
const CAT_LABELS = {general:‘🌐 General’,sports:‘🏆 Sports’,business:‘⚡ Business’,finance:‘📈 Finance’,bloom:‘🔋 Bloom’,comedy:‘😂 Comedy’};
const PLAT_LABELS = {twitter:‘𝕏’,linkedin:‘in’,instagram:‘IG’,youtube:‘▶’};

function CustomizePanel({feeds, kw, alerts, urgent, social, watchlist, health, arts, initialTab, initialCat, onClose, onSave}) {
const [lf, setLf] = useState(JSON.parse(JSON.stringify(feeds)));
const [lk, setLk] = useState(JSON.parse(JSON.stringify(kw)));
const [la, setLa] = useState([…alerts]);
const [lu, setLu] = useState([…(urgent||[])]);
const [lw, setLw] = useState(JSON.parse(JSON.stringify(watchlist||[])));
const [newSym, setNewSym] = useState(’’);
const [newSymName, setNewSymName] = useState(’’);
const [ls, setLs] = useState(JSON.parse(JSON.stringify(social)));
const [secTab, setSecTab] = useState(initialTab||‘keywords’);
const [kwTab, setKwTab] = useState(initialCat||‘general’);
const [srcTab, setSrcTab] = useState(initialCat||‘general’);
const [socCat, setSocCat] = useState(initialCat||‘general’);
const [socPlat, setSocPlat] = useState(‘twitter’);
const [newKw, setNewKw] = useState(’’);
const [newAlert, setNewAlert] = useState(’’);
const [newName, setNewName] = useState(’’);
const [newUrl, setNewUrl] = useState(’’);
const [newHandle, setNewHandle] = useState(’’);
const [testState, setTestState] = useState({});

const testFeed = async (url, key) => {
setTestState(s=>({…s,[key]:‘loading’}));
const {items,reason} = await fetchRSS(url);
setTestState(s=>({…s,[key]:items.length>0?`ok:${items.length} articles`:`fail:${reason||'empty'}`}));
};
const addSource = () => {
if (!newName.trim()||!newUrl.trim()) return;
setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcTab])n[srcTab]=[];n[srcTab].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});
setNewName(’’); setNewUrl(’’);
};
const addHandle = () => {
const h=newHandle.trim(); if (!h) return;
setLs(prev=>{
const n=JSON.parse(JSON.stringify(prev));
if(!n[socCat])n[socCat]={twitter:[],linkedin:[],instagram:[],youtube:[]};
if(!n[socCat][socPlat])n[socCat][socPlat]=[];
const formatted=socPlat===‘linkedin’?h:(h.startsWith(’@’)?h:’@’+h);
if(!n[socCat][socPlat].includes(formatted))n[socCat][socPlat].push(formatted);
return n;
});
setNewHandle(’’);
};
const removeHandle = idx => {
setLs(prev=>{const n=JSON.parse(JSON.stringify(prev));n[socCat][socPlat].splice(idx,1);return n;});
};
const countBySource = (cat,name) => (arts[cat]||[]).filter(a=>a.source===name).length;

const TestResult = ({tkey}) => {
const ts=testState[tkey]; if(!ts) return null;
const isOk=ts.startsWith(‘ok’), isLoad=ts===‘loading’;
const msg=isLoad?‘Testing…’:isOk?`✓ ${ts.replace('ok:','')}`:`✗ ${ts.replace('fail:','Failed — ')}`;
return <div className={`cp-test-result ${isLoad?'cp-test-load':isOk?'cp-test-ok':'cp-test-fail'}`}>{msg}</div>;
};

return (
<div className="cp-overlay" onClick={onClose}>
<div className=“cp-panel” onClick={e=>e.stopPropagation()}>
<div className="cp-head"><span className="cp-title">Customize</span><button className="cp-x" onClick={onClose}>✕</button></div>
<div className="cp-body">
<div className="cp-sec-tabs">
{[‘keywords’,‘alerts’,‘sources’,‘social’,‘watchlist’].map(t=>(
<button key={t} className={`cp-sec-tab ${secTab===t?'active':''}`} onClick={()=>setSecTab(t)}>
{t===‘keywords’?‘Keywords’:t===‘alerts’?‘Alerts’:t===‘sources’?‘Sources’:t===‘social’?‘Social’:‘📈 Watchlist’}
</button>
))}
</div>

```
      {secTab==='keywords' && (
        <div className="cp-sec">
          <div className="cp-lbl">Keywords by Category</div>
          <div className="cp-desc">Keywords boost matching articles to the top and appear as clickable topic chips in the sidebar.</div>
          <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${kwTab===c?'active':''}`} onClick={()=>setKwTab(c)}>{CAT_LABELS[c]}</button>)}</div>
          <div className="cp-chips">
            {(lk[kwTab]||[]).map((k,i)=><span key={i} className="cp-chip cp-chip-kw">{k}<button className="cp-chip-x" onClick={()=>setLk(p=>{const n={...p};n[kwTab]=n[kwTab].filter((_,j)=>j!==i);return n;})}>✕</button></span>)}
            {(lk[kwTab]||[]).length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No keywords yet</span>}
          </div>
          <div className="cp-add">
            <input className="cp-input" placeholder={`Add ${kwTab} keyword…`} value={newKw} onChange={e=>setNewKw(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}}/>
            <button className="cp-btn" onClick={()=>{if(newKw.trim()){setLk(p=>{const n={...p};n[kwTab]=[...(n[kwTab]||[]),newKw.trim()];return n;});setNewKw('');}}} >Add</button>
          </div>
        </div>
      )}

      {secTab==='alerts' && (
        <div className="cp-sec">
          <div className="cp-lbl">Breaking News Ticker Words</div>
          <div className="cp-desc">Red scrolling ticker fires only on these words. Keep short and urgent-only — disasters, major incidents, crashes. Routine words create noise.</div>
          <div className="cp-chips">
            {lu.map((u,i)=><span key={i} className="cp-chip cp-chip-alert">{u}<button className="cp-chip-x" onClick={()=>setLu(x=>x.filter((_,j)=>j!==i))}>✕</button></span>)}
            {lu.length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No urgent words — ticker off</span>}
          </div>
          <div className="cp-add">
            <input className="cp-input" placeholder="Add urgent word (e.g. hurricane)…" value={newAlert} onChange={e=>setNewAlert(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&newAlert.trim()){setLu(x=>[...x,newAlert.trim()]);setNewAlert('');}}}/>
            <button className="cp-btn cp-btn-red" onClick={()=>{if(newAlert.trim()){setLu(x=>[...x,newAlert.trim()]);setNewAlert('');}}}>Add</button>
          </div>
          <div style={{marginTop:'18px'}}>
            <div className="cp-lbl">Keyword Highlights</div>
            <div className="cp-desc">Articles matching these show a badge but don't trigger the ticker. Use for routine tracking: team names, company names, etc.</div>
            <div className="cp-chips">
              {la.map((a,i)=><span key={i} className="cp-chip cp-chip-kw">{a}<button className="cp-chip-x" onClick={()=>setLa(x=>x.filter((_,j)=>j!==i))}>✕</button></span>)}
            </div>
          </div>
        </div>
      )}

      {secTab==='sources' && (
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
            const cnt=countBySource(srcTab,f.name); const tk=`${srcTab}_${i}`;
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
            <input className="cp-input-sm" placeholder="RSS URL (https://…)" value={newUrl} onChange={e=>setNewUrl(e.target.value)}/>
            <div style={{display:'flex',gap:'6px'}}>
              <button className="cp-test-btn" style={{flex:1,padding:'5px'}} onClick={()=>newUrl.trim()&&testFeed(newUrl.trim(),`new_${srcTab}`)}>Test URL</button>
              <button className="cp-btn" style={{flex:1}} onClick={addSource}>Add Source</button>
            </div>
            <TestResult tkey={`new_${srcTab}`}/>
          </div>
        </div>
      )}

      {secTab==='social' && (
        <div className="cp-sec">
          <div className="cp-lbl">Social Follows by Category</div>
          <div className="cp-desc">Accounts you want one-tap access to. These are links — click opens the account on the platform.</div>
          <div className="cp-cat-tabs">{Object.keys(CAT_LABELS).map(c=><button key={c} className={`cp-cat-tab ${socCat===c?'active':''}`} onClick={()=>setSocCat(c)}>{CAT_LABELS[c]}</button>)}</div>
          <div className="cp-plat-tabs">
            {['twitter','linkedin','instagram','youtube'].map(p=>(
              <button key={p} className={`cp-plat-tab ${socPlat===p?'active':''}`} onClick={()=>setSocPlat(p)}>
                {PLAT_LABELS[p]} {SOCIAL_META[p].label}
              </button>
            ))}
          </div>
          <div className="cp-chips">
            {(ls[socCat]?.[socPlat]||[]).map((h,i)=>(
              <span key={i} className="cp-chip cp-chip-social">{h}<button className="cp-chip-x" onClick={()=>removeHandle(i)}>✕</button></span>
            ))}
            {(ls[socCat]?.[socPlat]||[]).length===0&&<span style={{fontSize:'11px',color:'var(--text3)'}}>No accounts yet</span>}
          </div>
          <div className="cp-add">
            <input className="cp-input" placeholder={socPlat==='linkedin'?'Company or person name…':'Handle (e.g. HoustonTexans)'} value={newHandle}
              onChange={e=>setNewHandle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addHandle();}}/>
            <button className="cp-btn" onClick={addHandle}>Add</button>
          </div>
        </div>
      )}

      {secTab==='watchlist' && (
        <div className="cp-sec">
          <div className="cp-lbl">Watchlist Symbols</div>
          <div className="cp-desc">Stocks shown on the Finance page. Click any row to open Yahoo Finance.</div>
          {lw.map((w,i)=>(
            <div key={i} className="cp-src-row">
              <span style={{fontWeight:700,fontFamily:'monospace',color:'var(--accent)',fontSize:'12px',minWidth:'50px'}}>{w.sym}</span>
              <span className="cp-src-name">{w.name}</span>
              <button className="cp-del" onClick={()=>setLw(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
            </div>
          ))}
          {lw.length===0&&<div style={{fontSize:'11px',color:'var(--text3)',padding:'10px 0'}}>No symbols yet</div>}
          <div className="cp-add-src" style={{marginTop:'10px'}}>
            <div className="cp-add-src-title">+ Add symbol</div>
            <input className="cp-input-sm" placeholder="Symbol (e.g. AAPL)" value={newSym} onChange={e=>setNewSym(e.target.value.toUpperCase())}/>
            <input className="cp-input-sm" placeholder="Name (e.g. Apple Inc)" value={newSymName} onChange={e=>setNewSymName(e.target.value)}/>
            <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
              if(newSym.trim()&&newSymName.trim()){setLw(prev=>[...prev,{sym:newSym.trim(),name:newSymName.trim()}]);setNewSym('');setNewSymName('');}
            }}>Add to Watchlist</button>
          </div>
        </div>
      )}

      <button className="cp-save" onClick={()=>onSave({feeds:lf,kw:lk,alerts:la,urgent:lu,social:ls,watchlist:lw})}>Save & Refresh</button>
    </div>
  </div>
</div>
```

);
}

// ─── MOBILE COMPONENTS (v16) ──────────────────────────────────────────────────

// Bottom-sheet drawer for overflow nav destinations + actions. Triggered by
// the “More” button in the bottom tab bar. Groups secondary destinations
// (Finance, Bloom, Comedy, Podcasts, Social) and actions (refresh, theme,
// customize) so the bottom tab bar can stay focused on the 3 primary
// destinations a mobile user actually uses for quick check-ins.
function MenuSheet({ tab, onTabChange, onClose, onCustomize, onRefresh, dark, setDark }) {
const items = [
{ key:‘finance’,  emoji:‘📈’, label:‘Finance’ },
{ key:‘bloom’,    emoji:‘🔋’, label:‘Bloom Energy’ },
{ key:‘comedy’,   emoji:‘😂’, label:‘Comedy’ },
{ key:‘podcasts’, emoji:‘🎙️’, label:‘Podcasts’ },
{ key:‘social’,   emoji:‘🔗’, label:‘Social’ },
];
return (
<div className="menu-sheet-overlay" onClick={onClose}>
<div className=“menu-sheet” onClick={e=>e.stopPropagation()}>
<div className="menu-sheet-grab"/>
<div className="menu-sheet-head">More sections</div>
{items.map(it => (
<button key={it.key}
className={`menu-sheet-item ${tab===it.key?'active':''}`}
onClick={() => { onTabChange(it.key); onClose(); }}>
<span className="menu-sheet-item-emoji">{it.emoji}</span>
<span className="menu-sheet-item-label">{it.label}</span>
<span className="menu-sheet-item-chevron">›</span>
</button>
))}
<div className="menu-sheet-divider"/>
<div className="menu-sheet-head">Actions</div>
<button className=“menu-sheet-item” onClick={() => { onRefresh(); onClose(); }}>
<span className="menu-sheet-item-emoji">↺</span>
<span className="menu-sheet-item-label">Refresh all feeds</span>
</button>
<button className=“menu-sheet-item” onClick={() => setDark(d=>!d)}>
<span className="menu-sheet-item-emoji">{dark?‘☀️’:‘🌙’}</span>
<span className="menu-sheet-item-label">{dark?‘Light mode’:‘Dark mode’}</span>
</button>
<button className=“menu-sheet-item” onClick={() => { onCustomize(); onClose(); }}>
<span className="menu-sheet-item-emoji">⚙</span>
<span className="menu-sheet-item-label">Customize</span>
<span className="menu-sheet-item-chevron">›</span>
</button>
</div>
</div>
);
}

// Fixed bottom tab bar with 4 thumb-reachable slots:
//   Today | Feed | Saved | More
// “Feed” intelligently targets the last-visited news category if you’re
// already on one (mirrors Yahoo Sports “Following” behavior — tapping doesn’t
// throw you off your current context). Hidden on desktop via CSS.
function BottomTabBar({ tab, onTabChange, onMenuOpen, savedCount, lastFeedTab }) {
const inFeed = [‘general’,‘sports’,‘business’,‘finance’,‘bloom’,‘comedy’].includes(tab);
const feedTarget = inFeed ? tab : (lastFeedTab || ‘general’);
const tabs = [
{ key:‘today’,  emoji:‘🏠’, label:‘Today’,  active: tab === ‘today’ },
{ key:‘feed’,   emoji:‘📰’, label:‘Feed’,   active: inFeed, target: feedTarget },
{ key:‘saved’,  emoji:‘★’,  label:savedCount>0?`Saved (${savedCount})`:‘Saved’, active: tab === ‘saved’ },
{ key:‘menu’,   emoji:‘☰’,  label:‘More’,   isMenu: true },
];
return (
<nav className="bottom-tabs">
<div className="bottom-tabs-inner">
{tabs.map(t => (
<button key={t.key}
className={`bottom-tab ${t.active?'active':''}`}
onClick={() => { if (t.isMenu) onMenuOpen(); else onTabChange(t.target || t.key); }}>
<span className="bottom-tab-icon">{t.emoji}</span>
<span className="bottom-tab-label">{t.label}</span>
</button>
))}
</div>
</nav>
);
}

// Circular pull-to-refresh spinner. Rotates proportionally to pull distance
// (0 to threshold = 0° to 360°), then snaps to continuous spin when the
// actual refresh is in flight. `top` follows the finger so it feels attached.
function PtrIndicator({ distance, threshold, refreshing }) {
const visible = distance > 10 || refreshing;
const progress = Math.min(distance / threshold, 1);
const top = refreshing ? 18 : Math.max(distance - 36, -20);
return (
<div className={`ptr-indicator ${!visible?'hidden':''} ${refreshing?'refreshing':''}`}
style={{ top:`${top}px`, transform:`translateX(-50%) rotate(${progress * 360}deg)` }}>
<span className={refreshing?‘ptr-spin’:’’}>↻</span>
</div>
);
}

// RIGHT NOW strip — unified “what’s happening this minute” row sitting
// above the hero on Today. Merges three live signals:
//   1. Urgent news headlines (from breakingItems / urgent words)
//   2. Favorite-team live games (ESPN scores, state === ‘in’)
//   3. Big watchlist moves (>=2% up or down)
// One glanceable row. Caps total items at 6 so it doesn’t become a ticker.
function RightNowStrip({ breakingItems, scores, marketData, watchlist, onOpen, onNavigate }) {
const items = useMemo(() => {
const out = [];

```
// Live games involving favorite teams
Object.values(scores || {}).flat().forEach(g => {
  if (g.state !== 'in') return;
  const fav = favoriteIn(g);
  if (!fav) return;
  out.push({
    kind:'score', key:`g${g.id}`, emoji:fav.emoji,
    text:`${g.awayAbbr||g.awayName} ${g.awayScore} — ${g.homeScore} ${g.homeAbbr||g.homeName}`,
    sub:g.status, link:g.link,
  });
});

// Watchlist big movers (≥2% abs)
(watchlist || []).forEach(w => {
  const q = marketData?.[w.sym];
  if (!q || Math.abs(q.pct) < 2) return;
  out.push({
    kind:'market', key:`m${w.sym}`,
    emoji: q.chg >= 0 ? '📈' : '📉',
    text: w.sym,
    val: `${q.chg >= 0 ? '▲':'▼'} ${Math.abs(q.pct).toFixed(2)}%`,
    valClass: q.chg >= 0 ? 'up' : 'down',
    link: `https://finance.yahoo.com/quote/${encodeURIComponent(w.sym)}`,
  });
});

// Urgent breaking items (already deduped + urgent-filtered upstream)
(breakingItems || []).slice(0, 3).forEach((b, i) => {
  out.push({
    kind:'urgent', key:`b${i}`, emoji:'🚨',
    text: b.title.length > 54 ? b.title.slice(0, 52) + '…' : b.title,
    sub: b.source,
    article: b,
  });
});

return out.slice(0, 6);
```

}, [breakingItems, scores, marketData, watchlist]);

if (items.length === 0) return null;

return (
<div className="rn-strip">
<span className="rn-label">
<span className="rn-pulse"/>
Right Now
</span>
<div className="rn-items">
{items.map((it, i) => (
<span key={it.key} className=“rn-item” onClick={() => {
if (it.article) onOpen(it.article);
else if (it.link) window.open(it.link, ‘_blank’);
}}>
<span className="rn-item-kind">{it.emoji}</span>
<span className="rn-item-text">{it.text}</span>
{it.val && <span className={`rn-item-val ${it.valClass||''}`}>{it.val}</span>}
{it.sub && <span style={{color:‘var(–text3)’,fontSize:‘10px’}}>· {it.sub}</span>}
{i < items.length - 1 && <span className="rn-divider" style={{marginLeft:10}}/>}
</span>
))}
</div>
</div>
);
}

// FOLLOWING strip — the Yahoo Sports “My Teams” insight, generalized.
// For each entity the user follows (Bloom Energy, Texans, MPC, ERCOT, etc.),
// find the latest article matching any of the entity’s `match` terms. Render
// as a horizontal scroll of small cards. Tap → filter the Feed to that entity.
// For company entities with a ticker, show live price/change alongside the name.
function FollowingStrip({ following, arts, marketData, onFilter, onEdit }) {
// Flatten all articles across categories once
const allArts = useMemo(() => Object.values(arts || {}).flat(), [arts]);

// Find latest matching headline per entity
const hydrated = useMemo(() => {
return (following || []).map(ent => {
const terms = (ent.match || []).map(t => t.toLowerCase());
const latest = allArts
.filter(a => {
const txt = (a.title + ’ ’ + (a.desc || ‘’)).toLowerCase();
return terms.some(t => txt.includes(t));
})
.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))[0];
const q = ent.ticker ? marketData?.[ent.ticker] : null;
return { …ent, latest, quote: q };
});
}, [following, allArts, marketData]);

if (!hydrated.length) return null;

return (
<div className="follow-strip">
<div className="follow-head">
<span className="follow-title">⭐ Following</span>
<button className="follow-edit" onClick={onEdit}>⚙ Edit</button>
</div>
<div className="follow-row">
{hydrated.map(ent => {
const up = ent.quote && ent.quote.chg >= 0;
return (
<div key={ent.id} className=“follow-card” onClick={() => onFilter(ent)}>
<div className="follow-card-head">
<span className="follow-card-emoji">{ent.emoji}</span>
<span className="follow-card-name">{ent.name}</span>
{ent.quote
? <span className={`follow-card-ticker ${up?'up':'down'}`}>
{ent.ticker} {up?‘▲’:‘▼’}{Math.abs(ent.quote.pct).toFixed(1)}%
</span>
: <span className="follow-card-kind">{ent.kind}</span>}
</div>
{ent.latest
? <>
<div className="follow-card-headline">{ent.latest.title}</div>
<div className="follow-card-meta">{ent.latest.source} · {fmtDate(ent.latest.pubDate)}</div>
</>
: <div className="follow-card-empty">No recent coverage</div>}
</div>
);
})}
</div>
</div>
);
}

// TRENDING inline carousel — moved from sidebar to above-the-fold on Today.
// Uses the existing diverseTrending() function so no category dominates.
// Scrollable on both desktop and mobile. Each card shows rank + category
// badge + title + source. Tap → read article.
function TrendingCarousel({ arts, kw, onRead }) {
const stories = useMemo(() => diverseTrending(arts, kw, 10, 2), [arts, kw]);
if (!stories.length) return null;
return (
<div className="trending-inline">
<div className="trending-inline-head">
<span className="trending-inline-title">🔥 Trending across the hub</span>
</div>
<div className="trending-row">
{stories.map((a, i) => {
const cc = CATS[a.cat] || CATS.general;
return (
<div key={i} className=“trending-card” onClick={() => onRead(a)}>
<div className="trending-card-meta">
<span className="trending-card-num">{i+1}</span>
<span className="trending-card-badge" style={{background:cc.bg,color:cc.color}}>{cc.emoji} {cc.label}</span>
</div>
<div className="trending-card-title">{a.title}</div>
<div className="trending-card-src">{a.source} · {fmtDate(a.pubDate)}</div>
</div>
);
})}
</div>
</div>
);
}

// Last-updated timestamp for feeds. Shows a green dot if refreshed
// within the last 10 minutes, amber otherwise. Clickable could trigger
// refresh (passed via onRefresh prop).
function LastUpdated({ timestamp, onRefresh }) {
if (!timestamp) return null;
const ageMin = (Date.now() - timestamp) / 60000;
const stale = ageMin > 10;
let label;
if (ageMin < 1) label = ‘Just now’;
else if (ageMin < 60) label = `${Math.floor(ageMin)}m ago`;
else label = `${Math.floor(ageMin/60)}h ago`;
return (
<span className=“last-updated” onClick={onRefresh} style={onRefresh?{cursor:‘pointer’}:{}}>
<span className={`last-updated-dot ${stale?'stale':''}`}/>
Updated {label}
</span>
);
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
// Renders BOTH desktop (whisper + nav) AND mobile (compact header + chip bar)
// in DOM. CSS media queries decide which is visible. `hidden` prop drives
// the auto-hide-on-scroll-down behavior (mobile only — drives translate).
function TopBar({tab, setTab, search, setSearch, dark, setDark,
onCustomize, onRefresh, breakingItems, onTickerClick,
hidden, mobileSearchOpen, onMobileSearchToggle}) {
const [wxList, setWxList] = useState([]);
const [quotes, setQuotes] = useState({});
const [showBreaking, setShowBreaking] = useState(true);

useEffect(()=>{
fetchAllWeather(DEFAULT_WEATHER_CITIES).then(setWxList);
TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(prev=>({…prev,[t.sym]:q}))));
const iv=setInterval(()=>{TICKERS.forEach(t=>fetchQuote(t.sym).then(q=>q&&setQuotes(prev=>({…prev,[t.sym]:q}))));},300000);
return ()=>clearInterval(iv);
},[]);

const hasBreaking = breakingItems&&breakingItems.length>0;
const tickerItems = hasBreaking?[…breakingItems,…breakingItems]:[];

const ALL_TABS = [‘today’,‘general’,‘sports’,‘business’,‘finance’,‘bloom’,‘comedy’,‘podcasts’,‘social’,‘saved’];
const TAB_LABELS = {today:‘Today’,bloom:‘Bloom Energy’,podcasts:‘Podcasts’,social:‘Social’,saved:‘Saved’,comedy:‘Comedy’};
const TAB_CLASS  = {general:‘t-general’,sports:‘t-sports’,business:‘t-business’,finance:‘t-finance’,bloom:‘t-bloom’,comedy:‘t-comedy’,podcasts:‘t-podcasts’};

// Mobile chip bar: primary news categories only. Secondary destinations
// (Finance, Bloom, Comedy, Podcasts, Social) live in the More sheet.
const MOBILE_CHIPS = [
{ key:‘today’,    label:‘Today’,    color:‘var(–text)’ },
{ key:‘general’,  label:‘General’,  color:CATS.general.color },
{ key:‘sports’,   label:‘Sports’,   color:CATS.sports.color },
{ key:‘business’, label:‘Business’, color:CATS.business.color },
{ key:‘finance’,  label:‘Finance’,  color:CATS.finance.color },
{ key:‘bloom’,    label:‘Energy’,   color:CATS.bloom.color },
{ key:‘comedy’,   label:‘Comedy’,   color:CATS.comedy.color },
];

// Keep the active chip scrolled into view when tab changes (swipe or tap)
const chipBarRef = useRef(null);
useEffect(() => {
if (!chipBarRef.current) return;
const active = chipBarRef.current.querySelector(’.chip.active’);
if (active && active.scrollIntoView) {
active.scrollIntoView({ behavior:‘smooth’, inline:‘center’, block:‘nearest’ });
}
}, [tab]);

return (
<div className={`topbar-wrap ${hidden?'hidden':''}`}>
{/* ━━━ DESKTOP: whisper bar ━━━ */}
<div className="whisper-bar">
<div className="whisper-inner">
{wxList.map((wx,i)=>(
<a key={i} className=“wx-pill” href={`https://weather.com/weather/today/l/${encodeURIComponent(wx.slug)}`} target=”_blank” rel=“noreferrer”>
<span>{wx.emoji}</span>
<span className="wx-city">{wx.name}</span>
<span className="wx-temp">{wx.temp}°</span>
<span className="wx-desc">{wx.desc}</span>
</a>
))}
{wxList.length>0&&<div className="whisper-div"/>}
<div className="ticker-row">
{TICKERS.map(t=>{
const q=quotes[t.sym]; const up=q?q.chg>=0:null;
return (
<div key={t.sym} className=“ticker-item” onClick={()=>onTickerClick&&onTickerClick(t)}>
<span className="ticker-sym" style={{color:t.color}}>{t.sym}</span>
{q
? <><span className="ticker-price">${q.price.toLocaleString(‘en-US’,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
<span className={`ticker-chg ${up?'ticker-up':'ticker-down'}`}>{up?‘▲’:‘▼’} {Math.abs(q.pct).toFixed(2)}%</span></>
: <span className="ticker-price"> — </span>}
</div>
);
})}
</div>
</div>
</div>

```
  {/* ━━━ Breaking (both layouts) ━━━ */}
  {hasBreaking && showBreaking && (
    <div className="breaking-bar">
      <div className="breaking-label">BREAKING</div>
      <div className="breaking-ticker">
        <div className="breaking-ticker-inner">
          {tickerItems.map((item,i)=>(
            <span key={i} className="breaking-item" onClick={()=>item.link&&window.open(item.link,'_blank')}>
              {item.title} <span style={{opacity:0.6,fontSize:'10px'}}>· {item.source}</span>
              <span className="breaking-sep">◆</span>
            </span>
          ))}
        </div>
      </div>
      <button className="breaking-close" onClick={()=>setShowBreaking(false)}>✕</button>
    </div>
  )}

  {/* ━━━ DESKTOP: nav bar ━━━ */}
  <div className="nav-bar">
    <div className="nav-bar-inner">
      <div className="logo-wrap">
        <div className="logo">My<span>News</span>Hub</div>
        <div className="logo-tag">Your daily briefing</div>
      </div>
      <div className="nav-tabs">
        {ALL_TABS.map(t=>(
          <button key={t} className={`nav-tab ${TAB_CLASS[t]||''} ${tab===t?'active':''}`}
            onClick={()=>{setTab(t);setSearch('');}}>
            {TAB_LABELS[t]||(t.charAt(0).toUpperCase()+t.slice(1))}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <input className="search-input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value.toLowerCase())}/>
        <button className="nav-btn" onClick={onRefresh} title="Refresh">↺</button>
        <button className="nav-btn" onClick={()=>setDark(d=>!d)} title="Toggle theme">{dark?'☀️':'🌙'}</button>
        <button className="nav-btn-blue" onClick={onCustomize}>Customize</button>
      </div>
    </div>
  </div>

  {/* ━━━ MOBILE: compact header + chip bar ━━━ */}
  <div className="mobile-top">
    <div className="mobile-header">
      <div>
        <div className="mobile-logo">My<span>News</span>Hub</div>
        <div className="mobile-logo-sub">Daily briefing</div>
      </div>
      <div className="mobile-actions">
        <button className="mobile-icon-btn" onClick={onMobileSearchToggle} title="Search">🔍</button>
        <button className="mobile-icon-btn" onClick={onRefresh} title="Refresh">↺</button>
      </div>
    </div>
    {mobileSearchOpen && (
      <div className="mobile-search open">
        <input
          className="mobile-search-input"
          placeholder="Search articles…"
          value={search}
          onChange={e=>setSearch(e.target.value.toLowerCase())}
          autoFocus
        />
      </div>
    )}
    <div className="chip-bar" ref={chipBarRef}>
      {MOBILE_CHIPS.map(c => {
        const isActive = tab === c.key;
        return (
          <button key={c.key}
            className={`chip ${isActive?'active':''}`}
            style={isActive ? { background:c.color } : {}}
            onClick={()=>{ setTab(c.key); }}>
            {c.label}
          </button>
        );
      })}
    </div>
  </div>
</div>
```

);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
const [tab, setTab]           = useState(‘today’);
const [search, setSearch]     = useState(’’);
const [dark, setDark]         = useState(()=>ld(‘dark’,false));
const [saved, setSaved]       = useState(()=>ld(‘saved’,[]));
const [clicks, setClicks]     = useState(()=>ld(‘clicks’,{}));
const [kw, setKw]             = useState(()=>ld(‘kw’,DEFAULT_KW));
const [alerts, setAlerts]     = useState(()=>ld(‘alerts’,[‘Texans’,‘Astros’,‘Kentucky’,‘Clemson’,‘ERCOT’,‘Bloom Energy’,‘fuel cell’,‘hurricane’,‘earthquake’,‘breaking’]));
const [feeds, setFeeds]       = useState(()=>ld(‘feeds’,DEFAULT_FEEDS));
const [urgent, setUrgent]     = useState(()=>ld(‘urgent’,DEFAULT_URGENT));
const [watchlist, setWatchlist]= useState(()=>ld(‘watchlist’,DEFAULT_WATCHLIST));
const [marketData, setMarketData] = useState({});
const [marketLoading, setMarketLoading] = useState(false);
const [social, setSocial]     = useState(()=>ld(‘social’,DEFAULT_SOCIAL));
const [arts, setArts]         = useState({general:[],sports:[],business:[],finance:[],bloom:[],comedy:[]});
const [loading, setLoading]   = useState({general:false,sports:false,business:false,finance:false,bloom:false,comedy:false});
const [health, setHealth]     = useState({});
const [podEps, setPodEps]     = useState({});
const [podLoading, setPodLoading] = useState({});
const [activePod, setActivePod]   = useState(null);
const [showPanel, setShowPanel]   = useState(false);
const [panelInitial, setPanelInitial] = useState({tab:‘keywords’,cat:‘general’});
const [activeKw, setActiveKw]     = useState(null);
const [activeSrc, setActiveSrc]   = useState(null);
const [scores, setScores]         = useState({});
const [scoresLoading, setScoresLoading] = useState(false);

// ── v16 mobile + editorial state ──
const [following, setFollowing]       = useState(() => ld(‘following’, DEFAULT_FOLLOWING));
const [menuOpen, setMenuOpen]         = useState(false);
const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
const [refreshing, setRefreshing]     = useState(false);
const [lastUpdated, setLastUpdated]   = useState({}); // per-cat timestamp
const [lastFeedTab, setLastFeedTab]   = useState(‘general’);
const isMobile                        = useIsMobile();
const headerHidden                    = useScrollDirection(isMobile);

useEffect(()=>{sv(‘dark’,dark);document.body.className=dark?‘dark’:’’;},[dark]);
useEffect(()=>{sv(‘saved’,saved);},[saved]);
useEffect(()=>{sv(‘clicks’,clicks);},[clicks]);
useEffect(()=>{sv(‘following’,following);},[following]);

const breakingItems = useMemo(()=>{
const seen=new Set();
return Object.values(arts).flat()
.filter(a=>{const txt=(a.title+’ ‘+(a.desc||’’)).toLowerCase();return urgent.some(u=>txt.includes(u.toLowerCase()));})
.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’);if(seen.has(k))return false;seen.add(k);return true;})
.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))
.slice(0,5);
},[arts,urgent]);

const kwMatch = useCallback(
(a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||’’)).toLowerCase().includes(k.toLowerCase())),
[kw]
);
const dedupe = arr=>{const seen=new Set();return arr.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’);if(seen.has(k))return false;seen.add(k);return true;});};

const specificCatKeys = useMemo(()=>{
const keys=new Set();
[‘sports’,‘business’,‘finance’,‘bloom’,‘comedy’].forEach(c=>{
(arts[c]||[]).forEach(a=>{if(a.link)keys.add(a.link);if(a.title)keys.add(a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’));});
});
return keys;
},[arts]);

const sorted = useCallback((cat)=>{
let arr=arts[cat]||[];
if(search) arr=arr.filter(a=>(a.title+(a.desc||’’)).toLowerCase().includes(search));
if(activeKw) arr=arr.filter(a=>(a.title+(a.desc||’’)).toLowerCase().includes(activeKw.toLowerCase()));
if(activeSrc) arr=arr.filter(a=>a.source===activeSrc);
arr=dedupe(arr);
if(cat===‘general’) {
arr=arr.filter(a=>{
if(a.link&&specificCatKeys.has(a.link))return false;
const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’);
return !specificCatKeys.has(k);
});
}
arr.sort((a,b)=>{const ka=kwMatch(a,cat).length,kb=kwMatch(b,cat).length;if(kb!==ka)return kb-ka;return new Date(b.pubDate)-new Date(a.pubDate);});
return arr.map(a=>({…a,matchedKw:kwMatch(a,cat),isAlert:urgent.some(u=>(a.title+(a.desc||’’)).toLowerCase().includes(u.toLowerCase()))}));
},[arts,search,activeKw,activeSrc,kwMatch,urgent,specificCatKeys]);

const loadCat = useCallback(async (cat)=>{
setLoading(l=>({…l,[cat]:true}));
const results=[],hUpdates={};
await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
const t0=Date.now();const{items}=await fetchRSS(f.url);const ms=Date.now()-t0;
hUpdates[f.name]=items.length>0?(ms<4000?‘green’:‘yellow’):‘red’;
items.forEach(i=>{if(i.title&&i.link)results.push({…i,source:f.name,cat});});
}));
setHealth(h=>({…h,…hUpdates}));
results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
setArts(a=>({…a,[cat]:results}));
setLastUpdated(prev => ({…prev, [cat]: Date.now()}));
setLoading(l=>({…l,[cat]:false}));
},[feeds]);

const loadPod = useCallback(async (pod)=>{
setPodLoading(l=>({…l,[pod.name]:true}));
const{items}=await fetchRSS(pod.url);
setPodEps(p=>({…p,[pod.name]:items.map(e=>({…e,show:pod.name,host:pod.host,emoji:pod.emoji}))}));
setPodLoading(l=>({…l,[pod.name]:false}));
},[]);

const loadScores = useCallback(async ()=>{
setScoresLoading(true);
setScores(await fetchAllScores());
setScoresLoading(false);
},[]);

const loadMarketData = useCallback(async ()=>{
setMarketLoading(true);
const allSyms=[…INDICES.map(i=>i.sym),…watchlist.map(w=>w.sym)];
const results={};
await Promise.allSettled(allSyms.map(async sym=>{const q=await fetchQuote(sym);if(q)results[sym]=q;}));
setMarketData(prev=>({…prev,…results}));
setMarketLoading(false);
},[watchlist]);

const refreshAll = useCallback(async ()=>{
setArts({general:[],sports:[],business:[],finance:[],bloom:[],comedy:[]});
setLoading({general:false,sports:false,business:false,finance:false,bloom:false,comedy:false});
setHealth({});setPodEps({});setPodLoading({});
// Small delay to let the UI render the cleared state, then fan out
await new Promise(r => setTimeout(r, 80));
await Promise.allSettled([
…Object.keys(DEFAULT_FEEDS).map(c=>loadCat(c)),
…PODCAST_FEEDS.map(p=>loadPod(p)),
loadScores(),
loadMarketData(),
]);
}, [loadCat, loadPod, loadScores, loadMarketData]);

useEffect(()=>{
Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));
PODCAST_FEEDS.forEach(p=>loadPod(p));
loadScores();
loadMarketData(); // preload so FollowingStrip + RightNowStrip have ticker data
const iv=setInterval(loadScores,120000);
return ()=>clearInterval(iv);
// eslint-disable-next-line react-hooks/exhaustive-deps
},[]);

const onRead  = a=>{setClicks(c=>({…c,[a.source]:(c[a.source]||0)+1}));window.open(a.link,’_blank’);};
const onSave  = a=>setSaved(s=>s.some(x=>x.link===a.link)?s.filter(x=>x.link!==a.link):[…s,a]);
const isSavedFn = a=>saved.some(s=>s.link===a.link);

const handleTickerClick = t=>{
setSearch(t.label.toLowerCase());
const catMap={‘Bloom Energy’:‘bloom’,‘Crude Oil’:‘business’,‘Bitcoin’:‘finance’};
if(catMap[t.label])setTab(catMap[t.label]);
};

const handleCustomizeSave = ({feeds:nf,kw:nk,alerts:na,urgent:nu,social:ns,watchlist:nw})=>{
setFeeds(nf);sv(‘feeds’,nf);
setKw(nk);sv(‘kw’,nk);
setAlerts(na);sv(‘alerts’,na);
if(nu){setUrgent(nu);sv(‘urgent’,nu);}
setSocial(ns);sv(‘social’,ns);
if(nw){setWatchlist(nw);sv(‘watchlist’,nw);}
setShowPanel(false);refreshAll();
};

const openCustomize = (initialTab=‘keywords’,initialCat=‘general’)=>{
setPanelInitial({tab:initialTab,cat:initialCat});setShowPanel(true);
};

const handleTabChange = t=>{
setTab(t);setSearch(’’);setActiveKw(null);setActiveSrc(null);
setMobileSearchOpen(false);
// Remember last-viewed news category so the bottom “Feed” tab returns here
const CAT_TABS = [‘general’,‘sports’,‘business’,‘finance’,‘bloom’,‘comedy’];
if (CAT_TABS.includes(t)) setLastFeedTab(t);
if(![‘today’,‘saved’,‘podcasts’,‘social’].includes(t)&&!(arts[t]||[]).length)loadCat(t);
if(t===‘finance’)loadMarketData();
};

// Pull-to-refresh wiring (mobile only — hook gates itself by scrollY=0 too)
const { distance: ptrDistance } = usePullToRefresh(
async () => {
setRefreshing(true);
try { await refreshAll(); } finally { setRefreshing(false); }
},
{ enabled: isMobile, threshold: 70 }
);

// Swipe left/right between categories on mobile. Only active on news-ish
// pages where changing category makes sense (not on Customize, podcasts, etc.)
const swipeHandlers = useSwipe(
(dir) => {
const idx = SWIPE_ORDER.indexOf(tab);
if (idx === -1) return;
const next = dir === ‘left’ ? idx + 1 : idx - 1;
if (next >= 0 && next < SWIPE_ORDER.length) handleTabChange(SWIPE_ORDER[next]);
},
{ enabled: isMobile && SWIPE_ORDER.includes(tab) }
);

const getRelated = (a,cat)=>{
const matched=kwMatch(a,cat);if(!matched.length)return[];
return(arts[cat]||[]).filter(x=>x.link!==a.link&&matched.some(k=>(x.title+(x.desc||’’)).toLowerCase().includes(k.toLowerCase()))).slice(0,4);
};

const NEWS_CATS = [‘general’,‘sports’,‘business’,‘bloom’,‘comedy’];

// ─── FEED PAGE ─────────────────────────────────────────────────────────
const FeedPage = ({cat}) => {
const cc=CATS[cat]; const items=sorted(cat); const isLoading=loading[cat];
const heroItems=items.filter(a=>a.img);
const catLead=heroItems[0]||null;
const catSide=heroItems.slice(1,6);
const feedItems=catLead?items.filter(a=>a.link!==catLead.link):items;

```
return (
  <div className="page">
    {catLead && !activeKw && !activeSrc && (
      <div className="hero-row">
        <article className="hero-lead" style={{borderTop:`3px solid ${cc.color}`}} onClick={()=>onRead(catLead)}>
          <div className="hero-lead-img" style={{backgroundImage:`url(${catLead.img})`}}>
            <div className="hero-lead-badge">{cc.emoji} {cc.label}</div>
          </div>
          <div className="hero-lead-text">
            <h1 className="hero-lead-title">{catLead.title}</h1>
            {catLead.desc&&<p className="hero-lead-desc">{catLead.desc}</p>}
            <div className="hero-lead-meta">
              <span className="hero-lead-source">{catLead.source}</span>
              <span>·</span><span>{fmtDate(catLead.pubDate)}</span>
            </div>
          </div>
        </article>
        {catSide.length>0&&(
          <aside className="hero-side" style={{borderTop:`3px solid ${cc.color}`}}>
            <div className="hero-side-label">{cc.emoji} Latest in {cc.label}</div>
            {catSide.map((s,i)=>(
              <div key={i} className="hero-side-item" onClick={()=>onRead(s)}>
                {s.img&&<img className="hero-side-thumb" src={s.img} loading="lazy" onError={e=>e.target.style.display='none'} alt=""/>}
                <div className="hero-side-body">
                  <div className="hero-side-title">{s.title}</div>
                  <div className="hero-side-meta">{s.source} · {fmtDate(s.pubDate)}</div>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    )}
    <div className="page-grid">
      <div className="feed-col">
        <div className="page-header-row">
          <span className="page-header">
            {cc.emoji} {cc.label}{feedItems.length>0?` — ${feedItems.length} articles`:''}
            {lastUpdated[cat] && <span style={{marginLeft:'10px'}}><LastUpdated timestamp={lastUpdated[cat]} onRefresh={() => loadCat(cat)}/></span>}
          </span>
          <button className="page-customize-btn" onClick={()=>openCustomize('sources',cat)}>⚙ Customize</button>
        </div>
        {(activeKw||activeSrc)&&(
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
            {activeKw&&<span style={{background:cc.bg,color:cc.color,borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'5px'}}>🔍 {activeKw}<button onClick={()=>setActiveKw(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
            {activeSrc&&<span style={{background:'var(--surface2)',color:'var(--text2)',borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',gap:'5px'}}>📰 {activeSrc}<button onClick={()=>setActiveSrc(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
          </div>
        )}
        {isLoading&&!feedItems.length
          ?<div className="empty-state"><div className="empty-icon">{cc.emoji}</div><div className="empty-msg">Loading {cc.label}…</div></div>
          :feedItems.length===0
            ?<div className="empty-state"><div className="empty-icon">📭</div><div className="empty-msg">{activeKw||activeSrc?'No articles match this filter':'No articles loaded yet'}</div><button className="refresh-btn" onClick={refreshAll}>Refresh</button></div>
            :feedItems.slice(0,20).map((a,i)=><FeedCard key={i} a={a} cat={cat} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,cat)}/>)
        }
        <SocialFollows cat={cat} social={social}/>
        <SourceFooter cat={cat} feeds={feeds} arts={arts}/>
      </div>
      <Sidebar cat={cat} arts={arts} kw={kw} health={health}
        activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
        activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
        onRead={onRead} scores={scores} scoresLoading={scoresLoading}
        showScoreboard={cat==='sports'}/>
    </div>
  </div>
);
```

};

// ─── TODAY PAGE ────────────────────────────────────────────────────────
const TodayPage = () => {
const allRecent = useMemo(()=>{
const allKws=Object.values(kw).flat().map(k=>k.toLowerCase());
const seen=new Set();
return Object.entries(arts)
.flatMap(([cat,list])=>(list||[]).map(a=>({…a,_cat:cat})))
.filter(a=>a.title&&a.link&&a.img)
.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,’’);if(seen.has(k))return false;seen.add(k);return true;})
.sort((a,b)=>{
const aTxt=(a.title+’ ‘+(a.desc||’’)).toLowerCase();
const bTxt=(b.title+’ ‘+(b.desc||’’)).toLowerCase();
const aKw=allKws.filter(k=>aTxt.includes(k)).length;
const bKw=allKws.filter(k=>bTxt.includes(k)).length;
if(bKw!==aKw)return bKw-aKw;
return new Date(b.pubDate)-new Date(a.pubDate);
});
},[arts,kw]);

```
const heroStories=allRecent.slice(0,5);
const [heroIdx,setHeroIdx]=useState(0);
const [paused,setPaused]=useState(false);

useEffect(()=>{
  if(paused||heroStories.length<=1)return;
  const iv=setInterval(()=>setHeroIdx(i=>(i+1)%heroStories.length),12000);
  return ()=>clearInterval(iv);
},[paused,heroStories.length]);

const lead=heroStories[heroIdx];

// Per-category top items for the section list (3 each — generous Ghost density)
const sectionCats = ['general','sports','business','finance','bloom'];

return (
  <div className="page">
    <div className="today-flow">

      {/* ── HERO — single MSN-style lead, no side rail ── */}
      {lead && (
        <article
          className="hero-lead"
          style={{marginBottom:'8px'}}
          onClick={()=>onRead(lead)}
          onMouseEnter={()=>setPaused(true)}
          onMouseLeave={()=>setPaused(false)}
        >
          <div className="hero-lead-img" style={{backgroundImage:`url(${lead.img})`}}>
            <div className="hero-lead-badge" style={{background:(CATS[lead._cat]?.color||'#1d4ed8')+'cc'}}>
              {CATS[lead._cat]?.emoji} {CATS[lead._cat]?.label||'News'}
            </div>
            {heroStories.length>1&&(
              <>
                <button className="hero-arrow hero-prev" onClick={e=>{e.stopPropagation();setHeroIdx(i=>(i-1+heroStories.length)%heroStories.length);}}>‹</button>
                <button className="hero-arrow hero-next" onClick={e=>{e.stopPropagation();setHeroIdx(i=>(i+1)%heroStories.length);}}>›</button>
                <div className="hero-dots">
                  {heroStories.map((_,i)=>(
                    <button key={i} className={`hero-dot ${i===heroIdx?'active':''}`} onClick={e=>{e.stopPropagation();setHeroIdx(i);}}/>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="hero-lead-text">
            <h1 className="hero-lead-title">{lead.title}</h1>
            {lead.desc&&<p className="hero-lead-desc">{lead.desc}</p>}
            <div className="hero-lead-meta">
              <span className="hero-lead-source">{lead.source}</span>
              <span>·</span><span>{fmtDate(lead.pubDate)}</span>
            </div>
          </div>
        </article>
      )}

      {/* ── AI BRIEFING — folded directly below hero, no card chrome ── */}
      <MorningBriefingInline arts={arts}/>

      {/* ── RIGHT NOW — slim, ghost-treated ── */}
      <RightNowStrip
        breakingItems={breakingItems}
        scores={scores}
        marketData={marketData}
        watchlist={watchlist}
        onOpen={onRead}
        onNavigate={handleTabChange}
      />

      {/* ── FOLLOWING — Yahoo Sports My Teams pattern, compact ── */}
      <FollowingStrip
        following={following}
        arts={arts}
        marketData={marketData}
        onFilter={(ent) => {
          if (ent.match && ent.match.length) setActiveKw(ent.match[0]);
          if (ent.kind === 'team') handleTabChange('sports');
          else if (ent.kind === 'company' && ent.id === 'bloom') handleTabChange('bloom');
          else if (ent.kind === 'company') handleTabChange('business');
          else handleTabChange('general');
        }}
        onEdit={() => openCustomize('keywords','general')}
      />

      {/* ── TRENDING — single carousel, the only one on the page ── */}
      <TrendingCarousel arts={arts} kw={kw} onRead={onRead}/>

      {/* ── CATEGORY SECTIONS — vertical, Ghost ── */}
      {sectionCats.map(cat => {
        const cc = CATS[cat];
        const items = sorted(cat).slice(0, 3);
        const total = (arts[cat]||[]).length;
        return (
          <section key={cat} className="today-section">
            <div className="today-section-head">
              <span className="today-section-label">
                <span className="today-section-cat">{cc.emoji} {cc.label}</span>
                {total > 0 && <span style={{color:'var(--text4)'}}>· {total}</span>}
              </span>
              <button className="today-section-link" onClick={()=>handleTabChange(cat)}>
                See all →
              </button>
            </div>
            {loading[cat]
              ? <div style={{padding:'14px 0',fontSize:'12px',color:'var(--text3)'}}>Loading…</div>
              : items.length === 0
                ? <div style={{padding:'14px 0',fontSize:'12px',color:'var(--text3)'}}>No articles yet</div>
                : items.map((a, i) => (
                    <div key={i} className="gf-item" onClick={()=>onRead(a)}>
                      {a.img
                        ? <div className="gf-thumb" style={{backgroundImage:`url(${a.img})`}}/>
                        : <div className="gf-thumb-ph"/>}
                      <div className="gf-body">
                        <div className="gf-title">{a.title}</div>
                        <div className="gf-meta">
                          <span className="gf-meta-cat" style={{color:cc.color}}>{a.source}</span>
                          <span>·</span>
                          <span>{fmtDate(a.pubDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
          </section>
        );
      })}

      <SourceFooter feeds={feeds} arts={arts}/>
    </div>
  </div>
);
```

};

// ─── PODCASTS PAGE ─────────────────────────────────────────────────────
const PodcastsPage = () => {
const allEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,3).map(e=>({…e,show:p.name,host:p.host,emoji:p.emoji}))).sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({…e,show:activePod.name,host:activePod.host,emoji:activePod.emoji})):allEps;

```
const PodCard = ({ep, idx}) => {
  const [podAiState,setPodAiState]=useState('closed');
  const [podSum,setPodSum]=useState('');
  const [podTake,setPodTake]=useState('');
  const [podErr,setPodErr]=useState('');
  const [loadPod,setLoadPod]=useState(false);
  const sv2=isSavedFn({...ep,link:ep.link||ep.show+idx});

  const handlePodAI = async () => {
    if(podAiState==='closed'){
      if(podSum){setPodAiState('summary');return;}
      setPodAiState('summary');setLoadPod(true);
      const{summary:s,error}=await fetchAISummary({type:'podcast',title:ep.title,content:ep.desc||'',mode:'summary'});
      if(s)setPodSum(s);else setPodErr(error||'Unavailable');
      setLoadPod(false);
    }else if(podAiState==='summary'){
      if(podTake){setPodAiState('takeaways');return;}
      setPodAiState('takeaways');setLoadPod(true);
      const{summary:t,error}=await fetchAISummary({type:'podcast',title:ep.title,content:ep.desc||'',mode:'takeaways'});
      if(t)setPodTake(t);else setPodErr(error||'Unavailable');
      setLoadPod(false);
    }else{setPodAiState('closed');}
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
      {podAiState!=='closed'&&(
        <div className="fc-ai-panel" style={{margin:'10px 0 0'}}>
          <div className="fc-summary">
            <div className="fc-summary-lbl">✦ AI Summary</div>
            {loadPod&&!podSum?<div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Generating summary…</div>
            :podErr&&!podSum?<div style={{fontSize:'11px',color:'var(--red)'}}>{podErr}</div>
            :<div className="fc-summary-text">{podSum}</div>}
          </div>
          {podAiState==='takeaways'&&(
            <div className="fc-takeaways">
              <div className="fc-takeaways-lbl">📋 Key Takeaways</div>
              {loadPod&&!podTake?<div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Analyzing episode…</div>
              :podErr&&!podTake?<div style={{fontSize:'11px',color:'var(--red)'}}>{podErr}</div>
              :<TakeawaysContent text={podTake}/>}
            </div>
          )}
        </div>
      )}
      <div className="pod-actions">
        <button className="pod-btn" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>Listen</button>
        <button className={`pod-btn ${podAiState!=='closed'?'ai-on':''}`} onClick={handlePodAI} disabled={loadPod}>
          ✦ {loadPod?'Thinking…':podAiState==='closed'?'AI Summary':podAiState==='summary'?'Key Takeaways':'Hide AI'}
        </button>
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
            <div className="pod-header-sub">{activePod?`Hosted by ${activePod.host}`:`${PODCAST_FEEDS.length} shows`}</div>
          </div>
        </div>
        {displayEps.length===0?<div className="empty-state"><div className="empty-msg">Loading episodes…</div></div>
        :displayEps.slice(0,20).map((ep,i)=><PodCard key={i} ep={ep} idx={i}/>)}
      </div>
      <div className="sidebar">
        <div className="pod-shows">
          <div style={{fontSize:'10px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid var(--border2)'}}>Shows</div>
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
                <div style={{flex:1,minWidth:0}}>
                  <div className="pod-show-name" style={{color:isA?'#e11d48':''}}>{p.name}</div>
                  <div className="pod-show-ep">{podLoading[p.name]?'Loading…':(latest?latest.title.slice(0,36)+'…':'No episodes yet')}</div>
                </div>
                {isA&&<div className="pod-show-dot"/>}
              </div>
            );
          })}
        </div>
        {allEps.length>0&&(
          <div className="gs-section">
            <div className="gs-label">🔥 Trending Episodes</div>
            {allEps.slice(0,6).map((ep,i)=>(
              <div key={i} className="trend-row" onClick={()=>ep.link&&window.open(ep.link,'_blank')}>
                <div className="trend-num">{i+1}</div>
                <div className="trend-body">
                  <div className="trend-title">{ep.title}</div>
                  <div className="trend-src">{ep.show} · {fmtDate(ep.pubDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
```

};

const SavedPage = () => (
<div className="page">
{saved.length===0
?<div className=“empty-state” style={{paddingTop:‘80px’}}><div className="empty-icon">☆</div><div className="empty-msg">No saved items yet<br/><span style={{fontSize:‘11px’,color:‘var(–text3)’}}>Tap Save on any article or episode</span></div></div>
:<div className="page-grid"><div className="feed-col"><span className=“page-header” style={{marginBottom:‘24px’,display:‘block’}}>Saved — {saved.length} items</span>{saved.map((a,i)=><FeedCard key={i} a={a} cat={a.cat||‘general’} isSaved={true} onSave={onSave} onRead={onRead}/>)}</div></div>
}
</div>
);

// ─── FINANCE PAGE ──────────────────────────────────────────────────────
const FinancePage = () => {
const items=sorted(‘finance’);
const marketStatus=useMemo(()=>{
const now=new Date();
const et=new Date(now.toLocaleString(‘en-US’,{timeZone:‘America/New_York’}));
const day=et.getDay(),hr=et.getHours(),min=et.getMinutes(),mins=hr*60+min;
const isWd=day>=1&&day<=5;
if(isWd&&mins>=570&&mins<960)return{state:‘open’,label:‘Markets Open’,color:‘var(–green)’};
if(isWd&&mins>=240&&mins<570)return{state:‘pre’,label:‘Pre-Market’,color:‘var(–amber)’};
if(isWd&&mins>=960&&mins<1200)return{state:‘after’,label:‘After Hours’,color:‘var(–amber)’};
return{state:‘closed’,label:‘Markets Closed’,color:‘var(–text3)’};
},[]);

```
const fmtPrice=n=>n==null?'—':n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtChg=n=>n==null?'':(n>=0?'+':'')+n.toFixed(2);
const fmtPct=n=>n==null?'':(n>=0?'+':'')+n.toFixed(2)+'%';

return (
  <div className="page">
    <div className="fin-header">
      <div className="fin-header-top">
        <div>
          <div className="fin-header-title">📈 Markets</div>
          <div className="fin-header-sub">
            <span className="fin-status-dot" style={{background:marketStatus.color}}/>
            <span style={{color:marketStatus.color,fontWeight:600}}>{marketStatus.label}</span>
            <span style={{color:'var(--text3)',marginLeft:8}}>· Quotes via Yahoo Finance · 5min cache</span>
          </div>
        </div>
        <button className="fin-refresh" onClick={loadMarketData} disabled={marketLoading}>
          {marketLoading?'⟳ Loading…':'↺ Refresh'}
        </button>
      </div>
      <div className="fin-indices">
        {INDICES.map(idx=>{
          const q=marketData[idx.sym];const up=q&&q.chg>=0;
          return (
            <div key={idx.sym} className={`fin-index ${q?(up?'up':'down'):''}`}>
              <div className="fin-index-label">{idx.label}</div>
              <div className="fin-index-price">{q?fmtPrice(q.price):'—'}</div>
              <div className="fin-index-chg">
                {q?<><span>{up?'▲':'▼'} {fmtChg(q.chg)}</span><span className="fin-index-pct">{fmtPct(q.pct)}</span></>:<span style={{color:'var(--text3)'}}>Loading…</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <div className="fin-grid">
      <div className="fin-main">
        <section className="fin-watchlist">
          <div className="fin-section-head">
            <span className="fin-section-title">⭐ My Watchlist</span>
            <button className="page-customize-btn" onClick={()=>openCustomize('watchlist','finance')}>⚙ Edit</button>
          </div>
          <table className="fin-table">
            <thead><tr>
              <th style={{textAlign:'left'}}>Symbol</th>
              <th style={{textAlign:'left'}}>Name</th>
              <th style={{textAlign:'right'}}>Price</th>
              <th style={{textAlign:'right'}}>Change</th>
              <th style={{textAlign:'right'}}>%</th>
            </tr></thead>
            <tbody>
              {watchlist.length===0&&<tr><td colSpan={5} className="fin-empty">No symbols yet — add some in Customize</td></tr>}
              {watchlist.map(w=>{
                const q=marketData[w.sym];const up=q&&q.chg>=0;
                return (
                  <tr key={w.sym} onClick={()=>window.open(`https://finance.yahoo.com/quote/${encodeURIComponent(w.sym)}`,'_blank')}>
                    <td className="fin-sym">{w.sym}</td>
                    <td className="fin-name">{w.name}</td>
                    <td className="fin-px">{q?fmtPrice(q.price):<em style={{color:'var(--text3)'}}>—</em>}</td>
                    <td className={`fin-px ${up?'fin-up':q?'fin-down':''}`}>{q?fmtChg(q.chg):''}</td>
                    <td className={`fin-px ${up?'fin-up':q?'fin-down':''}`}>
                      {q&&<span className="fin-pct-pill">{up?'▲':'▼'} {fmtPct(q.pct).replace('+','').replace('-','')}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section className="fin-news">
          <div className="fin-section-head">
            <span className="fin-section-title">📰 Finance News</span>
            <button className="page-customize-btn" onClick={()=>openCustomize('sources','finance')}>⚙ Sources</button>
          </div>
          {loading.finance&&!items.length
            ?<div className="empty-state"><div className="empty-icon">📈</div><div className="empty-msg">Loading Finance…</div></div>
            :items.length===0
              ?<div className="empty-state"><div className="empty-icon">📭</div><div className="empty-msg">No articles loaded yet</div><button className="refresh-btn" onClick={refreshAll}>Refresh</button></div>
              :items.slice(0,15).map((a,i)=><FeedCard key={i} a={a} cat="finance" isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,'finance')}/>)
          }
          <SocialFollows cat="finance" social={social}/>
          <SourceFooter cat="finance" feeds={feeds} arts={arts}/>
        </section>
      </div>
      <Sidebar cat="finance" arts={arts} kw={kw} health={health}
        activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
        activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
        onRead={onRead} scores={scores} scoresLoading={scoresLoading} showScoreboard={false}/>
    </div>
  </div>
);
```

};

// ─── SOCIAL PAGE ───────────────────────────────────────────────────────
const SocialPage = () => {
const totalAccounts=Object.values(social).reduce((n,cat)=>n+Object.values(cat).reduce((m,arr)=>m+(arr?.length||0),0),0);
return (
<div className="page">
<div className="social-page-header">
<div>
<div className="social-page-title">🔗 Social Follows</div>
<div className="social-page-sub">{totalAccounts} accounts across {Object.keys(social).length} categories — tap any handle to open</div>
</div>
<button className=“page-customize-btn” onClick={()=>openCustomize(‘social’,‘general’)}>⚙ Edit Social</button>
</div>
<div className="social-page-grid">
{Object.keys(CATS).map(cat=>{
const cc=CATS[cat];
const catSocial=social[cat]||{};
const platforms=Object.keys(catSocial).filter(p=>catSocial[p]&&catSocial[p].length>0);
const total=platforms.reduce((n,p)=>n+catSocial[p].length,0);
return (
<div key={cat} className=“social-cat-block” style={{borderTop:`3px solid ${cc.color}`}}>
<div className="social-cat-head">
<span style={{color:cc.color,fontWeight:700,fontSize:‘13px’}}>{cc.emoji} {cc.label}</span>
<span style={{fontSize:‘10px’,color:‘var(–text3)’}}>{total} accounts</span>
</div>
{platforms.length===0
?<div style={{padding:‘16px 14px’,fontSize:‘11px’,color:‘var(–text3)’,fontStyle:‘italic’}}>No accounts yet — add some in Customize</div>
:platforms.map(p=>{
const meta=SOCIAL_META[p];const handles=catSocial[p];
return (
<div key={p} className="social-cat-plat">
<div className="social-cat-plat-head">
<div className="social-plat-icon" style={{background:meta.color}}>{meta.icon}</div>
<span className="social-plat-label">{meta.label}</span>
<span className="social-plat-count">{handles.length}</span>
</div>
<div className="social-handles">
{handles.map((h,i)=>(
<a key={i} className=“social-handle” href={socialUrl(p,h)} target=”_blank” rel=“noreferrer” style={{color:meta.color,borderColor:meta.color+‘33’}}>{h}</a>
))}
</div>
</div>
);
})}
</div>
);
})}
</div>
</div>
);
};

// ─── RENDER ────────────────────────────────────────────────────────────
return (
<>
<style>{GLOBAL_CSS}</style>
<div className={`hub${dark?' dark':''}`} {…swipeHandlers}>
<TopBar tab={tab} setTab={handleTabChange} search={search} setSearch={setSearch}
dark={dark} setDark={setDark}
onCustomize={()=>openCustomize(‘keywords’,‘general’)} onRefresh={refreshAll}
breakingItems={breakingItems} onTickerClick={handleTickerClick}
hidden={headerHidden}
mobileSearchOpen={mobileSearchOpen}
onMobileSearchToggle={() => setMobileSearchOpen(o => !o)}/>

```
    {/* Pull-to-refresh indicator (mobile, touch-only) */}
    {isMobile && <PtrIndicator distance={ptrDistance} threshold={70} refreshing={refreshing}/>}

    {tab==='today'&&<TodayPage/>}
    {NEWS_CATS.includes(tab)&&<FeedPage cat={tab}/>}
    {tab==='finance'&&<FinancePage/>}
    {tab==='podcasts'&&<PodcastsPage/>}
    {tab==='social'&&<SocialPage/>}
    {tab==='saved'&&<SavedPage/>}

    {/* Mobile overflow menu sheet */}
    {menuOpen && (
      <MenuSheet
        tab={tab}
        onTabChange={handleTabChange}
        onClose={() => setMenuOpen(false)}
        onCustomize={() => openCustomize('keywords','general')}
        onRefresh={refreshAll}
        dark={dark}
        setDark={setDark}
      />
    )}

    {/* Mobile bottom tab bar */}
    <BottomTabBar
      tab={tab}
      onTabChange={handleTabChange}
      onMenuOpen={() => setMenuOpen(true)}
      savedCount={saved.length}
      lastFeedTab={lastFeedTab}
    />

    {showPanel&&<CustomizePanel feeds={feeds} kw={kw} alerts={alerts} urgent={urgent}
      social={social} watchlist={watchlist} health={health} arts={arts}
      initialTab={panelInitial.tab} initialCat={panelInitial.cat}
      onClose={()=>setShowPanel(false)} onSave={handleCustomizeSave}/>}
  </div>
</>
```

);
}
