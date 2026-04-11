// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const CATS = {
  general:  { label:'General',      color:'#1d4ed8', bg:'#eff6ff', emoji:'🌐' },
  sports:   { label:'Sports',       color:'#d97706', bg:'#fef3c7', emoji:'🏆' },
  business: { label:'Business',     color:'#16a34a', bg:'#f0fdf4', emoji:'⚡' },
  finance:  { label:'Finance',      color:'#7c3aed', bg:'#f5f3ff', emoji:'📈' },
  bloom:    { label:'Bloom Energy', color:'#0369a1', bg:'#e0f2fe', emoji:'🔋' },
  comedy:   { label:'Comedy',       color:'#db2777', bg:'#fdf2f8', emoji:'😂' },
};

// ─── TICKERS ──────────────────────────────────────────────────────────────────
export const TICKERS = [
  { sym:'BE',   label:'Bloom Energy', color:'#0369a1' },
  { sym:'CL=F', label:'Crude Oil',    color:'#16a34a' },
  { sym:'BTC',  label:'Bitcoin',      color:'#d97706' },
];

// ─── PODCAST FEEDS ────────────────────────────────────────────────────────────
export const PODCAST_FEEDS = [
  { name:'Joe Rogan Experience', host:'Joe Rogan',        url:'https://feeds.megaphone.fm/GLT1412515089',   emoji:'🟢' },
  { name:'Ben Shapiro Show',     host:'Ben Shapiro',      url:'https://feeds.megaphone.fm/BVDWV5370667266', emoji:'🔵' },
  { name:'Tucker Carlson Show',  host:'Tucker Carlson',   url:'https://feeds.megaphone.fm/RSV1597324942',   emoji:'🦅' },
  { name:'Candace',              host:'Candace Owens',    url:'https://feeds.megaphone.fm/candace',         emoji:'🎤' },
  { name:'Morning Wire',         host:'Daily Wire',       url:'https://feeds.megaphone.fm/BVDWV8747925072', emoji:'☀️' },
  { name:'All-In Podcast',       host:'Chamath & Besties',url:'https://allinchamathjason.libsyn.com/rss',   emoji:'💰' },
  { name:'Flagrant',             host:'Andrew Schulz',    url:'https://feeds.megaphone.fm/APPI6857213837',  emoji:'🔥' },
];

// ─── DEFAULT KEYWORDS ─────────────────────────────────────────────────────────
export const DEFAULT_KW = {
  general:  ['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:   ['Texans','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB','recruiting','transfer portal'],
  business: ['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:  ['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:    ['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  comedy:   ['satire','parody','humor','comedy'],
};

// ─── DEFAULT FEEDS ────────────────────────────────────────────────────────────
export const DEFAULT_FEEDS = {
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
    { name:'ESPN NFL',            url:'https://www.espn.com/espn/rss/nfl/news',                                 on:true },
    { name:'ESPN MLB',            url:'https://www.espn.com/espn/rss/mlb/news',                                 on:true },
    { name:'ESPN CFB',            url:'https://www.espn.com/espn/rss/ncf/news',                                 on:true },
    { name:'ESPN CBB',            url:'https://www.espn.com/espn/rss/ncb/news',                                 on:true },
    { name:'CBS Sports NFL',      url:'https://www.cbssports.com/rss/headlines/nfl',                            on:true },
    { name:'CBS Sports MLB',      url:'https://www.cbssports.com/rss/headlines/mlb',                            on:true },
    { name:'CBS Sports CFB',      url:'https://www.cbssports.com/rss/headlines/college-football',               on:true },
    { name:'CBS Sports CBB',      url:'https://www.cbssports.com/rss/headlines/college-basketball',             on:true },
    { name:'Pro Football Talk',   url:'https://www.nbcsports.com/profootballtalk.rss',                          on:true },
    { name:'Bleacher Report',     url:'https://feeds.bleacherreport.com/articles/feed',                         on:true },
    { name:'247Sports',           url:'https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/', on:true },
    { name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',                                 on:true },
    { name:'On3 Recruiting',      url:'https://www.on3.com/feed/',                                              on:true },
    { name:'The Spun',            url:'https://thespun.com/.rss/full/',                                         on:true },
    { name:'TwinSpires Blog',     url:'https://www.twinspires.com/edge/feed/',                                  on:true },
    { name:'Equibase News',       url:'https://www.equibase.com/premium/eqbRSSFeed.cfm?type=General',           on:true },
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
    { name:'The Babylon Bee', url:'https://babylonbee.com/feed',                                                on:true },
    { name:'The Onion',       url:'https://www.theonion.com/rss',                                               on:true },
  ],
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = 'v11_';
export function load(k, def) {
  try { const v = localStorage.getItem(SK+k); return v ? JSON.parse(v) : def; } catch { return def; }
}
export function save(k, v) {
  try { localStorage.setItem(SK+k, JSON.stringify(v)); } catch {}
}

// ─── RSS FETCH ────────────────────────────────────────────────────────────────
function parseXML(txt) {
  const p = new DOMParser(), x = p.parseFromString(txt, 'text/xml');
  const items = Array.from(x.querySelectorAll('item')).slice(0, 15);
  if (!items.length) return [];
  return items.map(i => {
    const desc = (i.querySelector('description')?.textContent || i.querySelector('summary')?.textContent || '')
      .replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim().slice(0, 300);
    const imgEl = i.querySelector('enclosure[type^="image"]');
    const img = imgEl?.getAttribute('url') || i.querySelector('image url')?.textContent || '';
    return {
      title: (i.querySelector('title')?.textContent || '').trim(),
      link:  i.querySelector('link')?.textContent || '',
      desc, pubDate: i.querySelector('pubDate')?.textContent || '',
      img,  duration: i.querySelector('duration')?.textContent || '',
    };
  });
}

export async function fetchRSS(url) {
  // Proxy 1: rss2json
  try {
    const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
    const d = await r.json();
    if (d.items?.length > 0) return d.items.map(i => ({
      title:   (i.title || '').trim(),
      link:    i.link,
      desc:    (i.description || i.content || '').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300),
      pubDate: i.pubDate,
      img:     i.thumbnail || '',
      duration:i.itunes_duration || '',
    }));
  } catch {}
  // Proxy 2: allorigins
  try {
    const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const d = await r.json();
    if (d.contents) { const items = parseXML(d.contents); if (items.length) return items; }
  } catch {}
  // Proxy 3: corsproxy
  try {
    const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const txt = await r.text();
    const items = parseXML(txt); if (items.length) return items;
  } catch {}
  return [];
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d); if (isNaN(dt.getTime())) return '';
    const now = new Date(), diff = Math.floor((now - dt) / 1000);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = dt.getHours() % 12 || 12, m = String(dt.getMinutes()).padStart(2,'0'), ampm = dt.getHours() >= 12 ? 'PM' : 'AM';
    const timeStr = `${h}:${m} ${ampm}`;
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)  return `${days[dt.getDay()]} ${timeStr}`;
    return `${months[dt.getMonth()]} ${dt.getDate()} · ${timeStr}`;
  } catch { return ''; }
}

export function fmtDuration(s) {
  if (!s) return '';
  const parts = s.split(':').map(Number);
  if (parts.length === 3) { const [h,m] = parts; return h > 0 ? `${h}h ${m}m` : `${m}m`; }
  if (parts.length === 2) return `${parts[0]}m`;
  const tot = parseInt(s); if (isNaN(tot)) return s;
  const h = Math.floor(tot/3600), m = Math.floor((tot%3600)/60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
