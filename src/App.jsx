// MyNewsHub v26 — AI unified panel + search rebuild + General hero layout + gap fixes (read state, clustering, velocity trending, share, paywall, keyboard shortcuts, PWA, stats)
// ─────────────────────────────────────────────────────────────────────────────
// Builds on v25a. Completes the unified-design system. v25a established the
// foundation (NBC sans typography, modern pill bar, ~225 lines orphan cleanup);
// v25b adds the Google News grid pattern, per-vertical accents, simpler sidebar,
// and brings Business in line with Markets' Bloomberg treatment.
//
// Changes from v25a:
//
//  ── Google News grid (.gn-grid) ──
//  • New universal layout class for "list of articles" views
//  • Lead card (large with image, full-width) + 3-column equal grid below
//  • Applied to: General homepage, Sports article feed (below score strip),
//    Markets news section, Pop Culture, Bloom Energy
//  • Cards in the grid are unified .fc cards — same structure everywhere
//
//  ── Per-vertical accents (thin layer, not full replacement) ──
//  • General: neutral (homepage baseline, no extra accent)
//  • Sports: dark navy score strip + purple sport tabs preserved (signature)
//  • Markets: orange Bloomberg accent preserved + extended to Business
//  • Pop Culture: pink #db2777 top-border on cards, slightly bigger images
//  • Briefing: left-bar Morning Brew style (kept from v22b)
//  • Bloom Energy: blue #0369a1 light accent
//
//  ── Sidebar simplification ──
//  • Tabbed sidebar (Trending|Latest|Business|Sports) → single trending column
//  • Topics + Sources collapsible kept from v22a
//  • Less visual noise, one clear job per rail
//
//  ── Business Bloomberg styling ──
//  • Business page now uses same orange #fa7800 accent + dense card treatment
//    as Markets
//  • Cards stay unified .fc structure but with Bloomberg-style top accent
//
//  ── Storage ──
//  • Storage v25a_ → v25b_, migration from v25a/v24/v23/v22
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATS = {
  general:    { label:'General',      color:'#1d4ed8', bg:'#eff6ff', emoji:'🌐' },
  sports:     { label:'Sports',       color:'#d97706', bg:'#fef3c7', emoji:'🏆' },
  business:   { label:'Business',     color:'#16a34a', bg:'#f0fdf4', emoji:'⚡' },
  finance:    { label:'Markets',      color:'#7c3aed', bg:'#f5f3ff', emoji:'📈' },
  bloom:      { label:'Energy',       color:'#0369a1', bg:'#e0f2fe', emoji:'🔋' },
  tech:       { label:'AI & Tech',    color:'#6366f1', bg:'#eef2ff', emoji:'🤖' },
  popculture: { label:'Pop Culture',  color:'#db2777', bg:'#fdf2f8', emoji:'✨' },
  comedy:     { label:'Comedy',       color:'#a855f7', bg:'#faf5ff', emoji:'😂' },
};

// Order for mobile swipe-left/right navigation between categories.
// Matches the mobile chip bar order so swiping feels like advancing the chips.
// v24a: Swipe order matches the mobile chip bar order. Today is removed;
// General is the home position so swipes start from there.
const SWIPE_ORDER = ['general','business','finance','bloom','tech','sports','popculture'];

const TICKERS = [
  { sym:'BE',   label:'Bloom Energy', color:'#60a5fa' },
  { sym:'CL=F', label:'Crude Oil',    color:'#4ade80' },
  { sym:'BTC',  label:'Bitcoin',      color:'#fbbf24' },
];

const PODCAST_FEEDS = [
  { name:'Joe Rogan Experience', host:'Joe Rogan',         url:'https://feeds.megaphone.fm/GLT1412515089',   emoji:'🟢' },
  { name:'Ben Shapiro Show',     host:'Ben Shapiro',       url:'https://feeds.megaphone.fm/BVDWV5370667266', emoji:'🔵' },
  { name:'Tucker Carlson Show',  host:'Tucker Carlson',    url:'https://feeds.megaphone.fm/RSV1597324942',   emoji:'🦅' },
  { name:'Candace',              host:'Candace Owens',     url:'https://feeds.megaphone.fm/candace',         emoji:'🎤' },
  { name:'Morning Wire',         host:'Daily Wire',        url:'https://feeds.megaphone.fm/BVDWV8747925072', emoji:'☀️' },
  { name:'All-In Podcast',       host:'Chamath & Besties', url:'https://allinchamathjason.libsyn.com/rss',   emoji:'💰' },
  { name:'Flagrant',             host:'Andrew Schulz',     url:'https://feeds.megaphone.fm/APPI6857213837',  emoji:'🔥' },
  { name:'NPR Politics',         host:'NPR',               url:'https://feeds.npr.org/510310/podcast.xml',   emoji:'📻' },
  { name:'Marketplace',          host:'APM',               url:'https://feeds.publicradio.org/public_feeds/marketplace-pm/rss/rss', emoji:'📈' },
  { name:'Freakonomics Radio',   host:'Stephen Dubner',    url:'https://feeds.simplecast.com/Y8lFbOT4',      emoji:'🎓' },
  { name:'Masters of Scale',     host:'Reid Hoffman',      url:'https://feeds.simplecast.com/3NwB90JG',      emoji:'🚀' },
  { name:'Acquired',             host:'Ben & David',       url:'https://feeds.simplecast.com/jeNJI0r9',      emoji:'💡' },
];

const DEFAULT_KW = {
  general:    ['Houston','Texas','Trump','Congress','White House','geopolitical','AI','tech','Iran','tariffs'],
  sports:     ['Texans','Rockets','Astros','Braves','Kentucky','Clemson','NFL','MLB','NBA','CFB','recruiting','transfer portal'],
  business:   ['energy','oil','gas','data center','ERCOT','LNG','power grid','onshoring','AI','infrastructure'],
  finance:    ['investing','real estate','stock market','interest rates','Fed','inflation','crypto','portfolio'],
  bloom:      ['Bloom Energy','fuel cell','hydrogen','microgrid','distributed power','data center','onshoring','industrial energy','utility','ERCOT'],
  tech:       ['AI','artificial intelligence','OpenAI','Anthropic','Google','Apple','Microsoft','NVIDIA','semiconductor','startup','LLM','AGI','robotics','chip'],
  popculture: ['celebrity','movie','TV','streaming','Hollywood','music','album','box office','Grammy','Billboard','viral','red carpet'],
  comedy:     ['satire','parody','humor','comedy'],
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
    { name:'Morning Brew',      url:'https://www.morningbrew.com/feed',                                         on:true },
    { name:'Morning Wire',      url:'https://feeds.megaphone.fm/BVDWV8747925072',                               on:true },
    { name:'Bloomberg',         url:'https://feeds.bloomberg.com/markets/news.rss',                              on:true },
  ],
  sports: [
    { name:'The Ringer',           url:'https://www.theringer.com/rss/index.xml',                              on:true },
    { name:'Athlon Sports',        url:'https://athlonsports.com/feed',                                        on:true },
    { name:'ESPN NFL',             url:'https://www.espn.com/espn/rss/nfl/news',                                on:true },
    { name:'ESPN NBA',             url:'https://www.espn.com/espn/rss/nba/news',                                on:true },
    { name:'ESPN MLB',             url:'https://www.espn.com/espn/rss/mlb/news',                                on:true },
    { name:'ESPN CFB',             url:'https://www.espn.com/espn/rss/ncf/news',                                on:true },
    { name:'ESPN CBB',             url:'https://www.espn.com/espn/rss/ncb/news',                                on:true },
    { name:'CBS Sports NFL',       url:'https://www.cbssports.com/rss/headlines/nfl',                           on:true },
    { name:'CBS Sports NBA',       url:'https://www.cbssports.com/rss/headlines/nba',                           on:true },
    { name:'CBS Sports MLB',       url:'https://www.cbssports.com/rss/headlines/mlb',                           on:true },
    { name:'CBS Sports CFB',       url:'https://www.cbssports.com/rss/headlines/college-football',              on:true },
    { name:'CBS Sports CBB',       url:'https://www.cbssports.com/rss/headlines/college-basketball',            on:true },
    { name:'Pro Football Talk',    url:'https://www.nbcsports.com/profootballtalk.rss',                         on:true },
    { name:'Bleacher Report',      url:'https://feeds.bleacherreport.com/articles/feed',                        on:true },
    { name:'OutKick',              url:'https://www.outkick.com/feed/',                                              on:true },
    { name:'D1Baseball',           url:'https://d1baseball.com/feed/',                                              on:true },
    { name:'Baseball America',     url:'https://www.baseballamerica.com/feed/',                                      on:false },
    { name:'247Sports',            url:'https://247sports.com/Page/College-Sports-News-and-Recruiting-100021/Feeds/', on:true },
    { name:'Kentucky Sports Radio',url:'https://kentuckysportsradio.com/feed/',                                 on:true },
    { name:'On3 Recruiting',       url:'https://www.on3.com/feed/',                                             on:true },
    { name:'The Spun',             url:'https://thespun.com/.rss/full/',                                        on:true },
    { name:'Paulick Report',       url:'https://www.paulickreport.com/feed/',                                    on:true },
    { name:'BloodHorse',           url:'https://www.bloodhorse.com/horse-racing/feed/',                          on:true },
    { name:'Thoroughbred Daily News', url:'https://www.thoroughbreddailynews.com/feed/',                         on:true },
    { name:'Horse Race Nation',    url:'https://horseracenation.com/feed/',                                      on:true },
    { name:'Daily Racing Form',    url:'https://www.drf.com/news/rss/news',                                      on:false },
    { name:'GolfWeek',             url:'https://golfweek.usatoday.com/feed/',                                     on:true },
    { name:'Golf Digest',          url:'https://www.golfdigest.com/rss/rss-sports',                               on:true },
    { name:'Golf Channel',         url:'https://www.golfchannel.com/feeds/rss.aspx',                              on:true },
    { name:'No Laying Up',         url:'https://nolayingup.com/feed/',                                            on:true },
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
    { name:'CNBC Finance',  url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',                         on:true },
  ],
  bloom: [
    { name:'Oilprice.com',          url:'https://oilprice.com/rss/main',                                        on:true },
    { name:'Utility Dive',          url:'https://www.utilitydive.com/feeds/news/',                               on:true },
    { name:'Data Center Dynamics',  url:'https://www.datacenterdynamics.com/en/rss/',                            on:true },
    { name:'Power Magazine',        url:'https://www.powermag.com/feed/',                                        on:true },
    { name:'Reuters Business',      url:'https://feeds.reuters.com/reuters/businessNews',                        on:true },
    { name:'CNBC Energy',           url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',                  on:true },
    { name:'MIT Tech Review',       url:'https://www.technologyreview.com/feed/',                                on:true },
    { name:'Canary Media',          url:'https://www.canarymedia.com/rss',                                       on:true },
    { name:'Rigzone',               url:'https://www.rigzone.com/news/rss/rigzone_latest.aspx',                   on:true },
  ],
  popculture: [
    { name:'Variety',           url:'https://variety.com/feed/',                                  on:true },
    { name:'Entertainment Weekly', url:'https://ew.com/feed/',                                    on:true },
    { name:'Vulture',           url:'https://www.vulture.com/rss/index.xml',                      on:true },
    { name:'Hollywood Reporter',url:'https://www.hollywoodreporter.com/feed/',                    on:true },
    { name:'Vanity Fair',       url:'https://www.vanityfair.com/feed/rss',                        on:true },
    { name:'BuzzFeed Celebrity',url:'https://www.buzzfeed.com/celebrity.xml',                     on:true },
    { name:'Rolling Stone',     url:'https://www.rollingstone.com/feed/',                         on:true },
    { name:'Pitchfork',         url:'https://pitchfork.com/rss/news/',                            on:true },
    { name:'Billboard',         url:'https://www.billboard.com/feed/',                            on:true },
    { name:'Deadline',          url:'https://deadline.com/feed/',                                 on:true },
    { name:'Screen Rant',       url:'https://screenrant.com/feed/',                               on:true },
    { name:'NME',               url:'https://www.nme.com/feed/',                                  on:false },
  ],
  tech: [
    { name:'TechCrunch',        url:'https://techcrunch.com/feed/',                               on:true },
    { name:'The Verge',         url:'https://www.theverge.com/rss/index.xml',                     on:true },
    { name:'Wired',             url:'https://www.wired.com/feed/rss',                             on:true },
    { name:'Ars Technica',      url:'https://feeds.arstechnica.com/arstechnica/index',            on:true },
    { name:'VentureBeat',       url:'https://venturebeat.com/feed/',                              on:true },
    { name:'MIT Tech Review',   url:'https://www.technologyreview.com/feed/',                     on:true },
    { name:'AI News',           url:'https://artificialintelligence-news.com/feed/',              on:true },
    { name:'Hacker News',       url:'https://news.ycombinator.com/rss',                           on:true },
    { name:'IEEE Spectrum',     url:'https://spectrum.ieee.org/feeds/feed.rss',                   on:true },
    { name:'9to5Google',        url:'https://9to5google.com/feed/',                               on:false },
    { name:'9to5Mac',           url:'https://9to5mac.com/feed/',                                  on:false },
  ],
  comedy: [
    { name:'The Babylon Bee', url:'https://babylonbee.com/feed',  on:true },
    { name:'The Onion',       url:'https://www.theonion.com/rss', on:true },
  ],
};

const DEFAULT_SOCIAL = {
  general: {
    twitter:   ['@Bloomberg','@Reuters','@WSJ','@FoxNews','@CNN','@CNBC','@BBCWorld','@DailyWire','@HoustonChron','@Axios'],
    linkedin:  [],
    instagram: [],
    youtube:   ['AssociatedPress','CNBC','BloombergTelevision'],
  },
  sports: {
    twitter:   ['@HoustonTexans','@HoustonRockets','@astros','@Braves','@KentuckyMBB','@UKFootball','@ClemsonFB','@247Sports','@Rivals','@On3Sports','@espn'],
    linkedin:  [],
    instagram: ['@houstontexans','@houstonrockets','@astros','@braves','@kentuckymbb','@ukfootball','@clemsonfootball','@espn','@nfl','@mlb','@nba'],
    youtube:   ['ESPN','NFL','NBA','MLB'],
  },
  business: {
    twitter:   ['@OilandGasJnl','@HartEnergy','@UtilityDive','@EENewsUpdates','@POWERmagazine','@DCDnews','@Rigzone','@OpenAI','@nvidia'],
    linkedin:  ['Marathon Petroleum','ExxonMobil','Chevron','Shell','NRG Energy','Bloom Energy','Google DeepMind','NVIDIA','Microsoft'],
    instagram: [],
    youtube:   ['bloomenergy','Bloomberg','CNBC'],
  },
  finance: {
    twitter:   ['@MarketWatch','@YahooFinance','@Kiplinger','@MotleyFool','@Investopedia','@BiggerPockets','@CNBC','@FinancialTimes'],
    linkedin:  ['Marathon Petroleum','Bloom Energy'],
    instagram: [],
    youtube:   ['BloombergTelevision','CNBCtelevision','YahooFinance'],
  },
  bloom: {
    twitter:   ['@BloomEnergy','@UtilityDive','@POWERmagazine','@DCDnews','@CanaryMediaInc'],
    linkedin:  ['Bloom Energy','Marathon Petroleum','ExxonMobil','NRG Energy'],
    instagram: ['@bloomenergy'],
    youtube:   ['bloomenergy'],
  },
  popculture: {
    twitter:   ['@Variety','@EW','@Vulture','@THR','@VanityFair','@RollingStone','@pitchfork'],
    linkedin:  [],
    instagram: ['@variety','@ew','@vultureinsta','@hollywoodreporter','@vanityfair','@rollingstone'],
    youtube:   ['Variety','EW','Vulture'],
  },
  comedy: {
    twitter:   ['@TheBabylonBee','@TheOnion','@ClickHole'],
    linkedin:  [],
    instagram: ['@thebabylonbee','@theonion'],
    youtube:   ['TheBabylonBee','TheOnion'],
  },
};

// v23: Each team now has an espnUrl + teamUrl so the favorite-team pills can
// expose external links. Users can edit/extend this list via the Customize
// panel "Sports Teams" tab; the array below is the default seed.
const SCORE_TEAMS = [
  { team:'Texans',        sport:'football',   league:'nfl',                       match:'Houston Texans',    emoji:'🏈',
    espnUrl:'https://www.espn.com/nfl/team/_/name/hou/houston-texans',
    teamUrl:'https://www.houstontexans.com/' },
  { team:'Rockets',       sport:'basketball', league:'nba',                       match:'Houston Rockets',   emoji:'🏀',
    espnUrl:'https://www.espn.com/nba/team/_/name/hou/houston-rockets',
    teamUrl:'https://www.nba.com/rockets/' },
  { team:'Astros',        sport:'baseball',   league:'mlb',                       match:'Houston Astros',    emoji:'⚾',
    espnUrl:'https://www.espn.com/mlb/team/_/name/hou/houston-astros',
    teamUrl:'https://www.mlb.com/astros' },
  { team:'Braves',        sport:'baseball',   league:'mlb',                       match:'Atlanta Braves',    emoji:'⚾',
    espnUrl:'https://www.espn.com/mlb/team/_/name/atl/atlanta-braves',
    teamUrl:'https://www.mlb.com/braves' },
  { team:'UK Basketball', sport:'basketball', league:'mens-college-basketball',   match:'Kentucky',          emoji:'🏀',
    espnUrl:'https://www.espn.com/mens-college-basketball/team/_/id/96/kentucky-wildcats',
    teamUrl:'https://ukathletics.com/sports/mens-basketball/' },
  { team:'UK Football',   sport:'football',   league:'college-football',          match:'Kentucky',          emoji:'🏈',
    espnUrl:'https://www.espn.com/college-football/team/_/id/96/kentucky-wildcats',
    teamUrl:'https://ukathletics.com/sports/football/' },
  { team:'Clemson FB',    sport:'football',   league:'college-football',          match:'Clemson',           emoji:'🏈',
    espnUrl:'https://www.espn.com/college-football/team/_/id/228/clemson-tigers',
    teamUrl:'https://clemsontigers.com/sports/football/' },
];

const LEAGUES = [
  { key:'nfl', label:'NFL',       sport:'football',   league:'nfl',                     emoji:'🏈', accent:'#1d4ed8' },
  { key:'nba', label:'NBA',       sport:'basketball', league:'nba',                     emoji:'🏀', accent:'#dc2626' },
  { key:'mlb', label:'MLB',       sport:'baseball',   league:'mlb',                     emoji:'⚾', accent:'#1d4ed8' },
  { key:'cfb', label:'College FB',sport:'football',   league:'college-football',        emoji:'🏈', accent:'#7c3aed' },
  { key:'cbb', label:'College BB',sport:'basketball', league:'mens-college-basketball', emoji:'🏀', accent:'#d97706' },
];

const SK = 'v26_';
const OLD_SKS = ['v25b_','v25a_','v24_','v23_'];

// Domains known to require subscriptions — articles get a lock badge
const PAYWALL_DOMAINS = new Set([
  'wsj.com','ft.com','bloomberg.com','economist.com','nytimes.com',
  'washingtonpost.com','theathletic.com','barrons.com','hbr.org',
  'businessinsider.com','foreignpolicy.com','thetimes.co.uk',
]);

// v22b: Briefing 3-tier methodology constants.
// Tier 1: priority briefing sources — articles from these get pulled first
// and labeled as "anchor" content for the AI synthesis.
// Tier 2: per-category top headlines, deduped against Tier 1.
// Tier 3: time-aware refresh — auto-regenerate if briefing is >90min stale.
const BRIEFING_PRIORITY_SOURCES = ['Axios','Morning Brew','Morning Wire','Bloomberg'];
const BRIEFING_EXCLUDE_CATS = ['comedy']; // satire dilutes professional briefing voice
const BRIEFING_STALE_MS = 90 * 60 * 1000; // 90 minutes

const DEFAULT_URGENT = [
  'breaking','hurricane','earthquake','tornado','wildfire',
  'explosion','evacuation','shooting','tsunami','pandemic',
  'recall','outage','market crash','flash flood','state of emergency',
];

const INDICES = [
  { sym:'^GSPC', label:'S&P 500',     short:'S&P' },
  { sym:'^DJI',  label:'Dow Jones',   short:'DOW' },
  { sym:'^IXIC', label:'Nasdaq',      short:'NDQ' },
  { sym:'NG=F',  label:'Natural Gas', short:'Gas' },
];

const DEFAULT_WATCHLIST = [
  { sym:'BE',    name:'Bloom Energy' },
  { sym:'MPC',   name:'Marathon Petroleum' },
  { sym:'XOM',   name:'Exxon Mobil' },
  { sym:'CVX',   name:'Chevron' },
  { sym:'NVDA',  name:'NVIDIA' },
  { sym:'MSFT',  name:'Microsoft' },
  { sym:'GOOGL', name:'Alphabet' },
  { sym:'ASML',  name:'ASML Holding NV' },
];

const DEFAULT_WEATHER_CITIES = [
  { name:'Houston',    lat:29.7604, lon:-95.3698, tz:'America/Chicago',  slug:'Houston+TX' },
  { name:'Louisville', lat:38.2527, lon:-85.7585, tz:'America/New_York', slug:'Louisville+KY' },
];

const WX_CODES  = {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',80:'Showers',81:'Heavy Showers',95:'Thunderstorm',99:'Severe Storm'};
const WX_EMOJI = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'⛈️',71:'🌨️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',95:'⛈️',99:'🌪️'};

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
  if (!item) return '';
  const mc = item.querySelector('content[url], [*|content][url]');
  if (mc?.getAttribute('url')) return mc.getAttribute('url');
  const mt = item.querySelector('thumbnail[url], [*|thumbnail][url]');
  if (mt?.getAttribute('url')) return mt.getAttribute('url');
  const enc = item.querySelector('enclosure[type^="image"]');
  if (enc?.getAttribute('url')) return enc.getAttribute('url');
  const iu = item.querySelector('image url');
  if (iu?.textContent) return iu.textContent.trim();
  if (descHTML) {
    const m = descHTML.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) return m[1];
  }
  return '';
}
function extractImageFromJson(i) {
  if (i.thumbnail && i.thumbnail.length > 10) return i.thumbnail;
  if (i.enclosure?.link && /\.(jpg|jpeg|png|webp|gif)/i.test(i.enclosure.link)) return i.enclosure.link;
  const html = i.content || i.description || '';
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

// ─── RSS FETCH ────────────────────────────────────────────────────────────────
function parseXML(txt) {
  const p = new DOMParser(), x = p.parseFromString(txt, 'text/xml');
  const items = Array.from(x.querySelectorAll('item')).slice(0, 15);
  if (!items.length) return [];
  return items.map(i => {
    const descRaw = i.querySelector('description')?.textContent || i.querySelector('summary')?.textContent || '';
    const desc = descRaw.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300);
    return {
      title:   (i.querySelector('title')?.textContent || '').trim(),
      link:    i.querySelector('link')?.textContent || '',
      desc, pubDate: i.querySelector('pubDate')?.textContent || '',
      img:     extractImage(i, descRaw),
      duration:i.querySelector('duration')?.textContent || '',
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
    if (r.ok) { const items = parseXML(await r.text()); if (items.length) return {items, reason:''}; }
  } catch {}
  try {
    const r = await fetchWithTimeout(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=15`);
    if (r.ok) {
      const d = await r.json();
      if (d.items?.length > 0) return {
        items: d.items.map(i => ({
          title:(i.title||'').trim(), link:i.link,
          desc:(i.description||i.content||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim().slice(0,300),
          pubDate:i.pubDate, img:extractImageFromJson(i), duration:i.itunes_duration||'',
        })), reason:'',
      };
    }
  } catch {}
  try {
    const r = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (r.ok) { const d = await r.json(); if (d.contents) { const items = parseXML(d.contents); if (items.length) return {items, reason:''}; } }
  } catch {}
  try {
    const r = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    if (r.ok) { const items = parseXML(await r.text()); if (items.length) return {items, reason:''}; }
  } catch {}
  return {items:[], reason:'All proxies failed'};
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d); if (isNaN(dt.getTime())) return '';
    const now = new Date(), diff = Math.floor((now-dt)/1000);
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h=dt.getHours()%12||12, m=String(dt.getMinutes()).padStart(2,'0'), ampm=dt.getHours()>=12?'PM':'AM';
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${days[dt.getDay()]} ${h}:${m} ${ampm}`;
    return `${months[dt.getMonth()]} ${dt.getDate()} · ${h}:${m} ${ampm}`;
  } catch { return ''; }
}
function fmtDuration(s) {
  if (!s) return '';
  const parts = s.split(':').map(Number);
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
    return {name:city.name, slug:city.slug, temp:Math.round(c.temperature_2m), code:c.weathercode, wind:Math.round(c.windspeed_10m), desc:WX_CODES[c.weathercode]||'Unknown', emoji:WX_EMOJI[c.weathercode]||'🌡️'};
  } catch { return null; }
}
async function fetchAllWeather(cities) {
  return (await Promise.all(cities.map(fetchWeatherCity))).filter(Boolean);
}
async function fetchQuote(sym) {
  try {
    const r = await fetchWithTimeout(`/api/quote?sym=${encodeURIComponent(sym)}`,7000);
    if (r.ok) { const d=await r.json(); if (typeof d.price==='number') return {price:d.price,chg:d.chg,pct:d.pct}; }
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
      const home=comp?.competitors?.find(c=>c.homeAway==='home');
      const away=comp?.competitors?.find(c=>c.homeAway==='away');
      return {
        id:ev.id, name:ev.name, short:ev.shortName, date:ev.date,
        status:ev.status?.type?.description||'', state:ev.status?.type?.state||'',
        homeName:home?.team?.shortDisplayName||'', homeAbbr:home?.team?.abbreviation||'',
        homeLogo:home?.team?.logo||'', homeScore:home?.score||'',
        awayName:away?.team?.shortDisplayName||'', awayAbbr:away?.team?.abbreviation||'',
        awayLogo:away?.team?.logo||'', awayScore:away?.score||'',
        link:ev.links?.[0]?.href||'',
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
  const txt=((game.homeName||'')+' '+(game.awayName||'')+' '+(game.short||'')+' '+(game.name||'')).toLowerCase();
  return SCORE_TEAMS.find(t=>txt.includes(t.match.toLowerCase()))||null;
}

// v23: parameterized variant accepting any team list (typically the user's
// customized `teams` state). Used by SportsScoreStrip + SportsPage for
// favorite detection that respects the user's customization.
function favoriteInList(game, list) {
  if (!game || !Array.isArray(list)) return null;
  const txt=((game.homeName||'')+' '+(game.awayName||'')+' '+(game.short||'')+' '+(game.name||'')).toLowerCase();
  return list.find(t=>txt.includes((t.match||'').toLowerCase()))||null;
}

// ─── SOCIAL HELPERS ───────────────────────────────────────────────────────────
function socialUrl(platform, handle) {
  const h = handle.replace(/^@/,'');
  switch(platform) {
    case 'twitter':   return `https://twitter.com/${h}`;
    case 'linkedin':  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(h)}`;
    case 'instagram': return `https://www.instagram.com/${h.toLowerCase()}`;
    case 'youtube':   return `https://www.youtube.com/@${h}`;
    default:          return '#';
  }
}
const SOCIAL_META = {
  twitter:   {label:'X / Twitter', color:'#000000', bg:'#f4f4f5', icon:'𝕏'},
  linkedin:  {label:'LinkedIn',    color:'#0a66c2', bg:'#e8f2fb', icon:'in'},
  instagram: {label:'Instagram',   color:'#e1306c', bg:'#fdeff5', icon:'IG'},
  youtube:   {label:'YouTube',     color:'#ff0000', bg:'#fee',    icon:'▶'},
};

// ─── CUSTOM HOOKS (Yahoo-style mobile interactions) ──────────────────────────

// Returns true when viewport is mobile-sized (≤640px). Used to gate
// swipe/auto-hide/pull-to-refresh behaviors — pointless on desktop and
// expensive to wire up unconditionally.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = e => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enabled]);
  return hidden;
}

// Horizontal swipe detection — returns touch handlers to spread onto an
// element. Fires onSwipe('left'|'right') when user completes a decisive
// horizontal swipe. Tracks touchMove to cancel early if vertical scroll
// intent is detected, preventing accidental tab changes while scrolling.
function useSwipe(onSwipe, { threshold = 80, enabled = true } = {}) {
  const state = useRef({ x: 0, y: 0, active: false, cancelled: false });
  const onTouchStart = (e) => {
    if (!enabled) return;
    const t = e.touches[0];
    state.current = { x: t.clientX, y: t.clientY, active: true, cancelled: false };
  };
  const onTouchMove = (e) => {
    if (!enabled || !state.current.active || state.current.cancelled) return;
    const t = e.touches[0];
    const dy = Math.abs(t.clientY - state.current.y);
    const dx = Math.abs(t.clientX - state.current.x);
    // Cancel swipe if vertical scroll intent detected early
    if (dy > 8 && dy > dx * 1.2) state.current.cancelled = true;
  };
  const onTouchEnd = (e) => {
    if (!enabled || !state.current.active) return;
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    state.current.active = false;
    if (!t || state.current.cancelled) return;
    const dx = t.clientX - state.current.x;
    const dy = t.clientY - state.current.y;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 2.5) {
      onSwipe(dx > 0 ? 'right' : 'left');
    }
  };
  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Pull-to-refresh. Activates only when scrollY is near 0 (user is at
// top of page). Drag down → progress indicator; release past threshold
// → fires onRefresh(). Uses 0.55 resistance curve so the drag doesn't
// feel 1:1 sluggish, capped at 140px so the indicator never flies off.
function usePullToRefresh(onRefresh, { threshold = 70, enabled = true } = {}) {
  const [distance, setDistance] = useState(0);
  const distRef = useRef(0); // track distance in ref so touchEnd reads latest value without re-subscribing
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
        distRef.current = pulled;
        setDistance(pulled);
      } else if (dy < 0) {
        distRef.current = 0;
        setDistance(0);
      }
    };
    const onTouchEnd = () => {
      if (!state.current.active) return;
      state.current.active = false;
      if (distRef.current >= threshold) onRefresh();
      distRef.current = 0;
      setDistance(0);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onRefresh, threshold]); // removed 'distance' — was causing listener re-attachment on every move

  return { distance };
}

// ─── AI SUMMARY ───────────────────────────────────────────────────────────────
async function fetchAISummary({type, title, content, mode='summary'}) {
  try {
    const r = await fetch('/api/summarize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type,title,content,mode}),
      signal: AbortSignal.timeout(mode==='briefing-gen'?25000:mode==='takeaways'?18000:20000),
    });
    if (!r.ok) {
      const e=await r.json().catch(()=>({}));
      const detail=e.error||`HTTP ${r.status}`;
      if (r.status===500&&/API_KEY/i.test(detail)) return {summary:'',error:'No AI provider configured.'};
      if (r.status===504) return {summary:'',error:'Timed out — try again.'};
      return {summary:'',error:`Unavailable (${detail.slice(0,100)})`};
    }
    const data=await r.json();
    return {summary:data.summary||'', error:'', provider:data.provider||''};
  } catch(err) {
    return {summary:'',error:err.name==='TimeoutError'?'Timed out':'Network error'};
  }
}

function TakeawaysContent({text}) {
  if (!text) return null;
  const lines = text.split('\n').filter(l=>l.trim());
  return (
    <div className="takeaways-list">
      {lines.map((line,i) => {
        const m = line.match(/\*\*(\d+)\.\s*([^*]+)\*\*\s*[—–-]\s*(.*)/);
        if (m) return (
          <div key={i} className="takeaway-item">
            <span className="takeaway-num">{m[1]}</span>
            <div><span className="takeaway-head">{m[2].trim()}</span><span className="takeaway-body"> — {m[3].trim()}</span></div>
          </div>
        );
        return <div key={i} className="takeaway-item"><div style={{fontSize:'12px',color:'var(--text2)',lineHeight:1.55}}>{line.replace(/\*\*/g,'')}</div></div>;
      })}
    </div>
  );
}

// ─── SOURCE URL MAP ───────────────────────────────────────────────────────────
const SOURCE_URLS = {
  'BBC News':'https://www.bbc.com/news','Reuters Top News':'https://www.reuters.com',
  'CNBC Top News':'https://www.cnbc.com','Fox News':'https://www.foxnews.com',
  'NY Post':'https://nypost.com','The Hill':'https://thehill.com',
  'TechCrunch':'https://techcrunch.com','Washington Times':'https://www.washingtontimes.com',
  'The Guardian US':'https://www.theguardian.com/us','Axios':'https://www.axios.com',
  'Bloomberg':'https://www.bloomberg.com/markets',
  'Breitbart':'https://www.breitbart.com','KHOU Houston':'https://www.khou.com',
  'Click2Houston':'https://www.click2houston.com','Chron.com':'https://www.chron.com',
  'ESPN NFL':'https://www.espn.com/nfl','ESPN NBA':'https://www.espn.com/nba',
  'ESPN MLB':'https://www.espn.com/mlb','ESPN CFB':'https://www.espn.com/college-football',
  'ESPN CBB':'https://www.espn.com/mens-college-basketball',
  'CBS Sports NFL':'https://www.cbssports.com/nfl','CBS Sports NBA':'https://www.cbssports.com/nba',
  'CBS Sports MLB':'https://www.cbssports.com/mlb','CBS Sports CFB':'https://www.cbssports.com/college-football',
  'CBS Sports CBB':'https://www.cbssports.com/college-basketball',
  'Pro Football Talk':'https://profootballtalk.nbcsports.com','Bleacher Report':'https://bleacherreport.com',
  'The Ringer':'https://www.theringer.com','Athlon Sports':'https://athlonsports.com',
  '247Sports':'https://247sports.com','Kentucky Sports Radio':'https://kentuckysportsradio.com',
  'On3 Recruiting':'https://www.on3.com','The Spun':'https://thespun.com',
  'Reuters Business':'https://www.reuters.com/business','CNBC Energy':'https://www.cnbc.com/energy',
  'Oilprice.com':'https://oilprice.com','Utility Dive':'https://www.utilitydive.com',
  'Data Center Dynamics':'https://www.datacenterdynamics.com','Power Magazine':'https://www.powermag.com',
  'Rigzone':'https://www.rigzone.com','MIT Tech Review':'https://www.technologyreview.com',
  'AI News':'https://artificialintelligence-news.com','Canary Media':'https://www.canarymedia.com',
  'The Guardian Business':'https://www.theguardian.com/business','CNBC Tech':'https://www.cnbc.com/technology',
  'MarketWatch':'https://www.marketwatch.com','Yahoo Finance':'https://finance.yahoo.com',
  'Kiplinger':'https://www.kiplinger.com','Motley Fool':'https://www.fool.com',
  'Investopedia':'https://www.investopedia.com','BiggerPockets':'https://www.biggerpockets.com',
  'CNBC Finance':'https://www.cnbc.com','The Babylon Bee':'https://babylonbee.com',
  'The Onion':'https://www.theonion.com',
};

// ─── PAYWALL DETECTOR ────────────────────────────────────────────────────────
function isPaywalled(link) {
  if (!link) return false;
  try {
    const host = new URL(link).hostname.replace('www.','');
    return PAYWALL_DOMAINS.has(host);
  } catch { return false; }
}

// ─── WEB SEARCH — Google News RSS (recent articles) + DuckDuckGo fallback ────
async function fetchWebSearch(query) {
  // Primary: Google News RSS via existing CORS proxy chain — returns real recent articles
  try {
    const gnUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const { items } = await fetchRSS(gnUrl);
    if (items && items.length > 0) {
      return items.slice(0, 8).map(item => ({
        title: item.title,
        desc: item.desc ? item.desc.replace(/<[^>]*>/g, '').slice(0, 200) : '',
        link: item.link,
        source: item.source || 'Google News',
        pubDate: item.pubDate,
      }));
    }
  } catch {}

  // Fallback: DuckDuckGo Instant Answer
  try {
    const r = await fetchWithTimeout(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`, 6000);
    if (r.ok) {
      const d = await r.json();
      const results = [];
      if (d.AbstractText && d.AbstractURL) {
        results.push({ title: d.Heading || query, desc: d.AbstractText, link: d.AbstractURL, source: d.AbstractSource || 'Web' });
      }
      (d.RelatedTopics || []).slice(0, 5).forEach(t => {
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.split(' - ')[0] || t.Text, desc: t.Text, link: t.FirstURL, source: 'DuckDuckGo' });
        }
      });
      if (results.length > 0) return results;
    }
  } catch {}
  return [];
}

// ─── TRENDING TOPICS — derived from loaded article titles ────────────────────
const TREND_STOP = new Set([
  'the','and','for','that','with','this','from','have','will','are','was','were',
  'been','about','into','than','they','their','what','when','where','which','who',
  'said','says','after','before','would','could','should','there','these','those',
  'report','update','first','last','more','also','just','news','new','amid',
]);
function getTrendingTopics(arts, limit = 10) {
  const counts = {};
  Object.values(arts).flat().forEach(a => {
    const words = (a.title || '').toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !TREND_STOP.has(w));
    for (let i = 0; i < words.length - 1; i++) {
      const bg = `${words[i]} ${words[i + 1]}`;
      counts[bg] = (counts[bg] || 0) + 1;
    }
    words.forEach(w => {
      if (w.length > 6) counts[w] = (counts[w] || 0) + 0.4;
    });
  });
  return Object.entries(counts)
    .filter(([, v]) => v >= 1.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

// Source recommendations based on search query
function suggestSourcesForQuery(query) {
  const q = query.toLowerCase();
  const out = [];
  if (/ercot|grid|texas energy|permian/.test(q)) {
    out.push({ name: 'EnergyWire', url: 'https://www.eenews.net/sections/energywire/feed/', cat: 'business' });
    out.push({ name: 'ERCOT Insider', url: 'https://www.ercotinsider.com/feed', cat: 'business' });
  }
  if (/data center|hyperscale|ai infra/.test(q)) {
    out.push({ name: 'Data Center Frontier', url: 'https://www.datacenterfrontier.com/rss', cat: 'business' });
  }
  if (/midstream|pipeline/.test(q)) {
    out.push({ name: 'Pipeline & Gas Journal', url: 'https://pgjonline.com/rss', cat: 'business' });
  }
  if (/macro|fed|rates|treasuries/.test(q)) {
    out.push({ name: 'WSJ Real Time Econ', url: 'https://feeds.a.dj.com/rss/RSSEconomy.xml', cat: 'finance' });
  }
  if (/recruiting|nil|transfer portal/.test(q)) {
    out.push({ name: 'On3 NIL', url: 'https://www.on3.com/nil/feed/', cat: 'sports' });
  }
  return out;
}

// v26: Dynamic "Why It Matters" — built from user's keyword config + teams.
// Returns relevance lines specific to the article. Returns [] when not relevant.
function whyItMatters(article, userKw, userTeams) {
  const title = (article.title || '').toLowerCase();
  const desc = (article.desc || '').toLowerCase();
  const text = title + ' ' + desc;
  const lines = [];

  // Check user's own keywords for direct relevance
  const allUserKws = Object.values(userKw || {}).flat();
  const matchedKws = allUserKws.filter(k => k && text.includes(k.toLowerCase()));
  if (matchedKws.length > 0) {
    lines.push(`Matches your tracked topics: ${matchedKws.slice(0, 3).join(', ')}.`);
  }

  // Check favorite teams
  const favTeams = (userTeams || []).filter(t => t.match && text.includes((t.match || '').toLowerCase()));
  if (favTeams.length > 0) {
    lines.push(`Your team${favTeams.length > 1 ? 's' : ''}: ${favTeams.map(t => t.emoji + ' ' + t.team).join(', ')}.`);
  }

  // Energy / BD pipeline signals
  if (/ercot|grid|peaker|gas|lng|permian|fuel cell|hydrogen|microgrid|distributed power/.test(text)) {
    lines.push('Direct read on energy BD pipeline — watch for RFP signals in 30-60 days.');
  }
  if (/data center|hyperscale|ai infra|nvidia|onshoring/.test(text)) {
    lines.push('Energy + AI intersection — high-conviction growth zone.');
  }

  // Macro signals
  if (/fed|interest rates|yield|treasur|inflation|powell/.test(text)) {
    lines.push('Macro signal — rate path affects both dividend strategy and real estate.');
  }

  // Houston / Texas local
  if (/houston|harris county/.test(text) && !favTeams.length) {
    lines.push('Local impact — may affect business or community.');
  }

  // AI / tech disruption
  if (/\bai\b|chatgpt|openai|anthropic|claude|gemini|llm|artificial intelligence/.test(text)) {
    lines.push('AI / disruption angle — flag for business opportunities filter.');
  }

  return lines.slice(0, 2); // cap at 2 lines to keep the callout tight
}

// ─── STORY CLUSTERING ─────────────────────────────────────────────────────────
// Groups articles covering the same story. Uses bigram Jaccard similarity on
// titles (threshold 0.28) within a 6-hour window. Returns articles with a
// `_clusterSize` and `_clusterSources` so the card can show "3 sources covering this".
function clusterStories(articles) {
  function bigrams(str) {
    const words = str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2);
    const bg = new Set();
    for (let i = 0; i < words.length - 1; i++) bg.add(words[i] + '_' + words[i+1]);
    return bg;
  }
  function jaccard(a, b) {
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const k of a) if (b.has(k)) inter++;
    return inter / (a.size + b.size - inter);
  }

  const sixHoursMs = 6 * 60 * 60 * 1000;
  const clustered = new Set();
  const result = [];

  for (let i = 0; i < articles.length; i++) {
    if (clustered.has(i)) continue;
    const a = articles[i];
    const bgA = bigrams(a.title);
    const cluster = [a];
    const clusterSources = new Set([a.source]);

    for (let j = i + 1; j < articles.length; j++) {
      if (clustered.has(j)) continue;
      const b = articles[j];
      const timeDiff = Math.abs(new Date(a.pubDate) - new Date(b.pubDate));
      if (timeDiff > sixHoursMs) continue;
      if (jaccard(bgA, bigrams(b.title)) >= 0.28) {
        clustered.add(j);
        cluster.push(b);
        clusterSources.add(b.source);
      }
    }

    clustered.add(i);
    result.push({
      ...a,
      _clusterSize: cluster.length,
      _clusterSources: [...clusterSources].slice(0, 5),
    });
  }
  return result;
}

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
/* TIME Magazine + BBC News editorial typography — Playfair Display for serif headlines */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Editorial type scale — TIME/BBC north star */
  --font-serif:'Playfair Display',Georgia,'Times New Roman',serif;
  --font-sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;

  /* BBC News / TIME palette — warm newsprint white, deep navy, crimson */
  --bg:#f8f7f4;--surface:#ffffff;--surface2:#f2f0ec;
  --border:#d6d3ce;--border2:#e8e5e0;
  --text:#1a1a1a;--text2:#3d3a36;--text3:#7c7870;--text4:#c0bdb8;
  /* TIME crimson as primary accent — authoritative, editorial */
  --accent:#c41d25;--accent-bg:#fdf2f2;
  --navy:#0a1628;--navy-light:#1d2d4a;
  --red:#c41d25;--green:#1a6b2a;--amber:#b45309;
  --radius:6px;--radius-sm:3px;
  --shadow-sm:0 1px 4px rgba(0,0,0,0.06);
  --shadow-md:0 4px 20px rgba(0,0,0,0.09);
  --shadow-lg:0 8px 40px rgba(0,0,0,0.13);
}
.dark{
  /* Bloomberg / Reuters-inspired: cool slate, not warm brown — high legibility */
  --bg:#0d1117;--surface:#161d2b;--surface2:#1e2638;
  --border:#2a3347;--border2:#1e2638;
  --text:#e2e8f4;--text2:#8892b0;--text3:#4a5570;--text4:#1e2638;
  --accent:#e84545;--accent-bg:#1a1018;
  --navy:#080c14;--navy-light:#0f1624;
  --red:#e84545;--green:#4ade80;--amber:#fbbf24;
  --shadow-sm:0 1px 4px rgba(0,0,0,0.5);
  --shadow-md:0 4px 20px rgba(0,0,0,0.6);
  --shadow-lg:0 8px 40px rgba(0,0,0,0.7);
}

body{
  background:var(--bg);
  font-family:var(--font-sans);
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  color:var(--text);font-size:15px;line-height:1.5;
}
.hub{background:var(--bg);min-height:100vh;}

/* ═══════════════════════════════════════════
   WHISPER BAR (utility strip)
   Goal: present but unobtrusive — data visible
   when you look, invisible when you don't
═══════════════════════════════════════════ */
.topbar-wrap{position:sticky;top:0;z-index:300;}

/* ═══════════════════════════════════════════
   PILL BAR — editorial data strip
   BBC-clean: navy background, high-contrast data
   Weather shown prominently; indices + tickers scroll
═══════════════════════════════════════════ */
.pill-bar{
  background:var(--navy);
  border-bottom:1px solid rgba(255,255,255,0.05);
  padding:0;
}
/* Light mode: softer data strip — still readable but not jarring */
body:not(.dark) .pill-bar{
  background:#1e2d42;
}
.pill-bar-inner{
  max-width:1400px;margin:0 auto;width:100%;
  display:flex;gap:0;
  overflow-x:auto;scrollbar-width:none;
  -webkit-overflow-scrolling:touch;
}
.pill-bar-inner::-webkit-scrollbar{display:none;}
.pill{
  display:flex;align-items:center;gap:8px;
  flex-shrink:0;padding:8px 18px;
  border-right:1px solid rgba(255,255,255,0.08);
  text-decoration:none;color:rgba(255,255,255,0.9);
  cursor:pointer;
  transition:background 0.12s;
  min-width:130px;
}
.pill:hover{background:rgba(255,255,255,0.06);}
/* Weather pills: blue tint to distinguish from financial data */
.pill-wx{
  min-width:150px;
  background:rgba(37,99,235,0.35);
  border-right-color:rgba(59,130,246,0.25);
}
.pill-wx:hover{background:rgba(37,99,235,0.48);}
.pill-wx .pill-label{color:rgba(147,197,253,0.85);}
.pill-wx .pill-value{color:#bfdbfe;}
.pill-icon{font-size:16px;flex-shrink:0;}
.pill-body{display:flex;flex-direction:column;line-height:1.2;flex:1;min-width:0;}
.pill-label{
  font-family:var(--font-sans);
  font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);
  text-transform:uppercase;letter-spacing:0.1em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.pill-value{
  font-family:var(--font-sans);
  font-size:14px;font-weight:700;color:#fff;
  font-variant-numeric:tabular-nums;letter-spacing:-0.2px;
  margin-top:1px;
}
.pill-sub{font-size:10px;font-weight:400;color:rgba(255,255,255,0.6);letter-spacing:0;}
.pill-chg{
  font-family:var(--font-sans);
  font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;
  padding:2px 7px;border-radius:2px;flex-shrink:0;
}
/* Editorial: green/red on dark navy pops clearly */
.pill-chg.up{color:#4ade80;background:rgba(74,222,128,0.12);}
.pill-chg.down{color:#f87171;background:rgba(248,113,113,0.12);}
/* Dark mode: pill bar needs stronger contrast — navy bg can blend into dark page */
.dark .pill-bar{background:rgba(15,23,42,0.98);border-bottom-color:rgba(255,255,255,0.1);}
.dark .pill-label{color:rgba(255,255,255,0.72);}

/* Old whisper-bar selectors kept as no-ops in case any external CSS still references */
.whisper-bar,.whisper-inner,.wx-pill,.ticker-row,.ticker-item{display:none;}

/* ═══════════════════════════════════════════
   BREAKING BANNER — TIME-style urgent alert strip
   Solid crimson, bold label, smooth scrolling ticker
═══════════════════════════════════════════ */
.breaking-bar{
  background:var(--accent);
  height:28px;display:flex;align-items:center;overflow:hidden;
  border-bottom:1px solid rgba(0,0,0,0.15);
}
.breaking-bar.hidden{display:none;}
.breaking-label{
  /* TIME-style: white ALL-CAPS label on solid red */
  background:rgba(0,0,0,0.2);
  color:#fff;font-size:8px;font-weight:900;letter-spacing:0.2em;
  padding:0 14px;white-space:nowrap;flex-shrink:0;
  border-right:1px solid rgba(255,255,255,0.15);height:100%;
  display:flex;align-items:center;font-family:var(--font-sans);
}
.breaking-ticker{flex:1;overflow:hidden;margin:0 12px;}
.breaking-ticker-inner{
  display:inline-flex;gap:60px;
  animation:ticker-scroll 80s linear infinite;white-space:nowrap;
}
.breaking-ticker-inner:hover{animation-play-state:paused;}
@keyframes ticker-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.breaking-item{
  font-family:var(--font-sans);
  font-size:11px;color:rgba(255,255,255,0.95);font-weight:600;
  cursor:pointer;display:inline-flex;align-items:center;gap:8px;
}
.breaking-item:hover{color:#fff;text-decoration:underline;}
.breaking-sep{color:rgba(255,255,255,0.4);font-size:9px;}
.breaking-close{
  background:none;border:none;color:rgba(255,255,255,0.6);
  cursor:pointer;font-size:14px;padding:0 14px;flex-shrink:0;line-height:1;
}
.breaking-close:hover{color:#fff;}

/* ═══════════════════════════════════════════
   NAV BAR — TIME Magazine editorial masthead
   Red top rule + serif logo + BBC-clean section tabs
═══════════════════════════════════════════ */
.nav-bar{
  background:var(--surface);
  /* TIME: bold crimson top rule — the definitive editorial signal */
  border-top:3px solid var(--accent);
  border-bottom:1px solid var(--border);
  padding:0;
}
.nav-bar-inner{
  max-width:1400px;margin:0 auto;
  display:flex;align-items:center;gap:0;
  height:54px;padding:0 24px;
}
.logo-wrap{flex-shrink:0;line-height:1;padding-right:20px;border-right:1px solid var(--border);}
/* Playfair Display for logo — TIME-magazine DNA */
.logo{
  font-family:var(--font-serif);font-size:20px;font-weight:900;
  color:var(--text);letter-spacing:-0.5px;line-height:1;
}
.logo span{color:var(--accent);}
.logo-tag{
  font-family:var(--font-sans);font-size:7px;color:var(--text3);
  letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin-top:2px;
}
/* BBC-clean section tabs: no box, strong underline on active */
.nav-tabs{
  display:flex;gap:0;flex:1;overflow-x:auto;scrollbar-width:none;
  margin-left:0;padding-left:0;
}
.nav-tabs::-webkit-scrollbar{display:none;}
.nav-tab{
  background:transparent;border:none;color:var(--text3);
  padding:0 14px;height:54px;cursor:pointer;
  font-family:var(--font-sans);font-size:12px;font-weight:700;
  white-space:nowrap;border-bottom:3px solid transparent;
  transition:color 0.12s,border-color 0.12s;letter-spacing:0.04em;
  text-transform:uppercase;
}
.nav-tab.active{color:var(--text);border-bottom-color:var(--accent);}
.nav-tab:hover:not(.active){color:var(--text2);}
/* BBC category color coding — each section has identity */
.nav-tab.t-general.active{color:var(--navy);border-bottom-color:var(--navy);}
.nav-tab.t-sports.active{color:#b45309;border-bottom-color:#b45309;}
.nav-tab.t-business.active{color:#1a6b2a;border-bottom-color:#1a6b2a;}
.nav-tab.t-finance.active{color:#6d28d9;border-bottom-color:#6d28d9;}
.nav-tab.t-bloom.active{color:#0369a1;border-bottom-color:#0369a1;}
.nav-tab.t-tech.active{color:#6366f1;border-bottom-color:#6366f1;}
.nav-tab.t-comedy.active{color:#7c3aed;border-bottom-color:#7c3aed;}
.nav-tab.t-popculture.active{color:#be185d;border-bottom-color:#be185d;}
.nav-tab.t-podcasts.active{color:#c41d25;border-bottom-color:#c41d25;}
.nav-right{display:flex;gap:8px;align-items:center;flex-shrink:0;padding-left:16px;border-left:1px solid var(--border);}
.search-input{
  background:var(--surface2);border:1px solid var(--border);color:var(--text);
  border-radius:var(--radius-sm);padding:7px 13px;font-size:13px;width:130px;
  font-family:var(--font-sans);transition:all 0.15s;
}
.search-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg);width:170px;}
.nav-btn{
  background:transparent;border:1px solid var(--border);color:var(--text3);
  border-radius:var(--radius-sm);padding:6px 11px;cursor:pointer;
  font-size:12px;font-family:var(--font-sans);font-weight:600;transition:all 0.12s;
}
.nav-btn:hover{border-color:var(--text3);color:var(--text);}
.nav-btn-blue{
  background:var(--accent);border:none;color:#fff;
  border-radius:var(--radius-sm);padding:6px 14px;cursor:pointer;
  font-size:12px;font-weight:700;font-family:var(--font-sans);transition:opacity 0.12s;letter-spacing:0.02em;
}
.nav-btn-blue:hover{opacity:0.88;}

/* ═══════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════ */
.page{max-width:1400px;margin:0 auto;padding:28px 24px;}
.page-grid{display:grid;grid-template-columns:1fr 320px;gap:32px;align-items:start;}
.feed-col{display:flex;flex-direction:column;gap:0;}

/* Page header row: label + customize button */
.page-header-row{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:28px;
}
.page-header{
  font-size:11px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;
}
.page-customize-btn{
  background:none;border:none;color:var(--text3);
  font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
  display:flex;align-items:center;gap:3px;padding:0;transition:color 0.12s;
}
.page-customize-btn:hover{color:var(--accent);}

.empty-state{text-align:center;padding:60px 20px;color:var(--text3);}
.empty-icon{font-size:28px;margin-bottom:10px;}
.empty-msg{font-size:13px;color:var(--text2);margin-bottom:14px;}
.refresh-btn{
  background:var(--accent);border:none;color:#fff;
  border-radius:8px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;
}

/* ═══════════════════════════════════════════
   EDITORIAL FEED CARD — TIME + BBC hybrid
   Left accent rule per category (BBC DNA).
   Serif headlines (TIME DNA). Clean whitespace.
═══════════════════════════════════════════ */
.fc{
  background:transparent;border:none;
  padding:20px 0 20px 16px;cursor:pointer;
  transition:background 0.15s;border-radius:0;
  border-bottom:1px solid var(--border2);
  /* BBC-style: left category accent rule — 3px, muted by default */
  border-left:3px solid var(--border2);
  margin-left:0;
}
.fc:last-child{border-bottom:none;}
.fc:hover{
  background:var(--surface2);
  border-left-color:var(--accent); /* accent rule lights up on hover */
}
.fc:active{transform:scale(0.999);}

/* Category-specific left rule colors — BBC section identity */
.fc.general:hover{border-left-color:var(--navy);}
.fc.sports:hover{border-left-color:#b45309;}
.fc.business:hover{border-left-color:#1a6b2a;}
.fc.finance:hover{border-left-color:#6d28d9;}
.fc.bloom:hover{border-left-color:#0369a1;}
.fc.popculture:hover{border-left-color:#be185d;}
.fc.comedy:hover{border-left-color:#7c3aed;}

.fc-meta{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
.fc-source{
  /* BBC: source label = ALL-CAPS, small, high-contrast */
  font-family:var(--font-sans);
  font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;
}
.fc-dot{color:var(--text4);font-size:10px;}
.fc-date{font-size:10px;color:var(--text3);font-variant-numeric:tabular-nums;margin-left:auto;white-space:nowrap;}
.fc-topic{
  font-size:9px;font-weight:700;border-radius:2px;padding:2px 7px;
  letter-spacing:0.06em;text-transform:uppercase;font-family:var(--font-sans);
}
.fc-alert-badge{
  font-size:9px;font-weight:900;background:var(--accent);color:#fff;
  border-radius:2px;padding:2px 8px;letter-spacing:0.1em;
  animation:pulse-badge 2s ease-in-out infinite;font-family:var(--font-sans);
}
@keyframes pulse-badge{0%,100%{opacity:1;}50%{opacity:0.65;}}

.fc-body{display:flex;gap:16px;align-items:flex-start;}
.fc-thumb{
  width:108px;height:72px;border-radius:var(--radius-sm);
  object-fit:cover;flex-shrink:0;background:var(--surface2);
}
.fc-thumb-ph{
  width:108px;height:72px;border-radius:var(--radius-sm);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--surface2);
}
.fc-text{flex:1;min-width:0;}
.fc-title{
  /* TIME Magazine: Playfair Display bold serif headline — the definitive editorial signal */
  font-family:var(--font-serif);
  font-size:18px;font-weight:700;color:var(--text);line-height:1.25;
  letter-spacing:-0.2px;margin-bottom:6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.fc-desc{
  font-family:var(--font-sans);
  font-size:13px;color:var(--text3);line-height:1.55;font-weight:400;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}

/* AI + actions row */
.fc-actions{
  display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap;
}
.fc-act{
  background:none;border:1px solid var(--border);border-radius:20px;
  padding:4px 11px;font-size:11px;cursor:pointer;color:var(--text3);
  font-family:inherit;font-weight:600;transition:all 0.12s;display:flex;align-items:center;gap:4px;
}
.fc-act:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-bg);}
.fc-act:active{transform:scale(0.96);}
.fc-act.saved{border-color:var(--amber);color:var(--amber);background:#fffbeb;}
.fc-act.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.fc-act.disc-on{border-color:#0ea5e9;color:#0ea5e9;background:#f0f9ff;}
.fc-read-link{
  margin-left:auto;font-size:10px;color:var(--text3);
  text-decoration:none;font-weight:600;display:flex;align-items:center;gap:2px;
  transition:color 0.1s;
}
.fc-read-link:hover{color:var(--accent);}

/* AI panels */
.fc-ai-panel{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.fc-summary{background:var(--surface2);border-radius:8px;padding:10px 12px;}
.fc-summary-lbl{font-size:9px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:5px;}
.fc-summary-text{font-size:12px;color:var(--text2);line-height:1.6;}
.fc-takeaways{background:var(--surface2);border-radius:8px;padding:12px 14px;border-left:2px solid #7c3aed;}
.fc-takeaways-lbl{font-size:9px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.takeaways-list{display:flex;flex-direction:column;gap:8px;}
.takeaway-item{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.5;color:var(--text2);}
.takeaway-num{font-size:14px;font-weight:900;color:#4f46e5;min-width:18px;flex-shrink:0;line-height:1.3;}
.takeaway-head{font-weight:700;color:var(--text);}
.takeaway-body{font-weight:400;}

/* Discussion panel */
.fc-disc{margin-top:10px;background:var(--surface2);border-radius:8px;padding:10px 12px;}
.fc-disc-lbl{font-size:9px;font-weight:700;color:#0284c7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.fc-disc-item{display:flex;align-items:center;gap:8px;padding:5px 0;text-decoration:none;color:var(--text);font-size:11px;transition:color 0.1s;}
.fc-disc-item:hover{color:#0284c7;}
.fc-disc-platform{font-size:8px;font-weight:800;border-radius:3px;padding:2px 5px;color:#fff;flex-shrink:0;text-transform:uppercase;}
.fc-disc-platform.reddit{background:#ff4500;}
.fc-disc-platform.hn{background:#ff6600;}
.fc-disc-sub{font-weight:600;color:var(--text2);flex-shrink:0;}
.fc-disc-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;}
.fc-disc-stats{margin-left:auto;font-size:10px;color:var(--text3);white-space:nowrap;flex-shrink:0;}

/* Related sources */
.fc-more{margin-top:8px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;}
.fc-more-lbl{font-size:10px;color:var(--text3);}
.fc-more-src{
  font-size:10px;font-weight:600;border-radius:4px;padding:1px 6px;cursor:pointer;
  border:1px solid var(--border);color:var(--text3);background:none;font-family:inherit;transition:all 0.1s;
}
.fc-more-src:hover{border-color:var(--accent);color:var(--accent);}

/* ═══════════════════════════════════════════
   GHOST SIDEBAR
   No card boxes. Section labels + list only.
   Scoreboard keeps its box (it's a widget).
═══════════════════════════════════════════ */
.sidebar{display:flex;flex-direction:column;gap:28px;min-width:0;}

/* Ghost sidebar section */
.gs-section{display:flex;flex-direction:column;gap:0;}
.gs-label{
  font-size:10px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;
  margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;
}
.gs-clear{background:none;border:none;color:var(--accent);cursor:pointer;font-size:10px;font-weight:500;font-family:inherit;padding:0;}
.gs-collapse-btn{
  background:none;border:none;color:var(--text3);cursor:pointer;
  font-size:10px;font-weight:700;font-family:inherit;padding:0;
  text-transform:uppercase;letter-spacing:0.1em;
  display:inline-flex;align-items:center;gap:6px;
  flex:1;text-align:left;
}
.gs-collapse-btn:hover{color:var(--text);}
.gs-collapse-chevron{font-size:9px;color:var(--text4);}
.gs-clear:hover{text-decoration:underline;}

/* Filter active pill */
.gs-filter{
  background:var(--accent-bg);border-radius:6px;padding:6px 10px;
  display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;
}
.gs-filter-label{font-size:11px;font-weight:600;color:var(--accent);}
.gs-filter-x{background:none;border:none;color:var(--accent);cursor:pointer;font-size:13px;line-height:1;padding:0;}

/* Keyword chips */
.kw-chips{display:flex;flex-wrap:wrap;gap:4px;}
.kw-chip{
  font-size:10px;font-weight:600;border-radius:20px;padding:3px 10px;cursor:pointer;
  border:1px solid transparent;display:inline-block;transition:opacity 0.12s;
}
.kw-chip:hover{opacity:0.75;}
.kw-chip.active{border-color:currentColor;}

/* ── Redesigned sidebar sections ─────────────────────────────── */
.sidebar-section{display:flex;flex-direction:column;gap:0;}
.sidebar-sec-head{
  display:flex;align-items:center;justify-content:space-between;
  padding-bottom:9px;border-bottom:2px solid var(--border);margin-bottom:12px;
}
.sidebar-sec-label{
  font-size:9px;font-weight:800;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.12em;
}
.sidebar-sec-action{
  background:none;border:none;color:var(--accent);cursor:pointer;
  font-size:10px;font-weight:600;font-family:inherit;padding:0;
}
.sidebar-sec-action:hover{text-decoration:underline;}
.sidebar-sec-collapse{
  background:none;border:none;cursor:pointer;font-family:inherit;padding:0;
  display:flex;align-items:center;gap:6px;flex:1;text-align:left;
}

/* Today's Topics chips */
.ttp-chips{display:flex;flex-wrap:wrap;gap:5px;}
.ttp-chip{
  display:inline-flex;align-items:center;gap:4px;
  font-size:11px;font-weight:600;padding:5px 11px;border-radius:20px;
  border:1px solid var(--border);background:var(--surface2);color:var(--text2);
  cursor:pointer;transition:all 0.14s;white-space:nowrap;
}
.ttp-chip:hover{border-color:var(--accent);color:var(--accent);background:var(--surface);}
.ttp-chip.active{color:#fff !important;border-color:transparent !important;}
.ttp-chip.saved{border-style:dashed;}
.ttp-count{font-size:9px;font-weight:700;opacity:0.6;}

/* Sources pill grid */
.src-pills{display:flex;flex-wrap:wrap;gap:5px;}
.src-pill{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11px;font-weight:500;padding:4px 10px;border-radius:20px;
  border:1px solid var(--border);background:var(--surface2);color:var(--text2);
  cursor:pointer;transition:all 0.14s;white-space:nowrap;font-family:inherit;
}
.src-pill:hover{border-color:var(--accent);color:var(--text);}
.src-pill.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.src-pill-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.src-pill-count{font-size:9px;font-weight:700;opacity:0.55;}
.src-show-more{background:none;border:none;color:var(--text3);font-size:10px;cursor:pointer;padding:6px 2px 2px;font-family:inherit;}
.src-show-more:hover{color:var(--text);}

/* Trend list — v18: Ghost, no dividers */
.trend-row{
  display:flex;align-items:flex-start;gap:12px;
  padding:8px 0;cursor:pointer;transition:opacity 0.12s;
}
.trend-row:hover{opacity:0.7;}
.trend-num{
  font-size:16px;font-weight:900;color:var(--text4);
  min-width:20px;line-height:1;flex-shrink:0;font-variant-numeric:tabular-nums;
}
.trend-body{flex:1;min-width:0;}
.trend-title{
  font-size:12px;font-weight:700;color:var(--text);line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px;
}
.trend-src{font-size:10px;color:var(--text3);display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.trend-cat-badge{
  font-size:8px;font-weight:700;border-radius:4px;padding:1px 5px;
  letter-spacing:0.03em;text-transform:uppercase;
}

/* Source list — v18: Ghost, no dividers */
.src-row{
  display:flex;align-items:center;gap:8px;padding:6px 0;
  cursor:pointer;transition:opacity 0.12s;
}
.src-row:hover{opacity:0.7;}
.src-row.active-src{opacity:1;}
.health-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.h-green{background:#16a34a;}.h-yellow{background:#d97706;}.h-red{background:#dc2626;}.h-gray{background:#9ca3af;}
.src-name{font-size:11px;font-weight:500;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.src-count{font-size:10px;color:var(--text3);}

/* ═══════════════════════════════════════════
   SCOREBOARD — keeps structural box
═══════════════════════════════════════════ */
.sb-box{
  background:var(--surface);border-radius:var(--radius);
  border:1px solid var(--border);overflow:hidden;
}
.sb-box-head{
  padding:10px 14px 8px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;
}
.sb-box-title{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.07em;}
.sb-box-sub{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;}
.sb-empty{padding:12px 14px;font-size:11px;color:var(--text3);text-align:center;font-style:italic;}
.sb-league{border-bottom:1px solid var(--border2);}
.sb-league:last-child{border-bottom:none;}
.sb-league-head{
  width:100%;background:none;border:none;display:flex;align-items:center;gap:8px;
  padding:9px 14px;cursor:pointer;font-family:inherit;text-align:left;font-size:11px;
  transition:background 0.1s;
}
.sb-league-head:hover{background:var(--bg);}
.sb-league-meta{margin-left:auto;display:flex;gap:5px;align-items:center;font-size:10px;color:var(--text3);}
.sb-league-fav{background:#fef3c7;color:#92400e;border-radius:6px;padding:1px 5px;font-weight:700;font-size:9px;}
.sb-chevron{color:var(--text3);font-size:10px;width:12px;text-align:center;}
.sb-games{padding:4px 10px 8px;display:flex;flex-direction:column;gap:5px;}
.sb-game{
  background:var(--bg);border:1px solid var(--border);border-radius:6px;
  padding:7px 10px;cursor:pointer;transition:border-color 0.1s;
}
.sb-game:hover{border-color:var(--accent);}
.sb-game.fav{border-color:#f59e0b;background:#fffbeb;}
.dark .sb-game.fav{background:rgba(245,158,11,0.07);}
.sb-game.live{border-color:var(--red);background:#fef2f2;}
.dark .sb-game.live{background:rgba(220,38,38,0.1);}
.sb-game.fav.live{border-color:var(--red);}
.sb-game-row{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:1px 0;}
.sb-side{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}
.sb-logo{width:15px;height:15px;object-fit:contain;flex-shrink:0;}
.sb-abbr{font-size:11px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-num{font-size:13px;font-weight:800;color:var(--text);flex-shrink:0;min-width:22px;text-align:right;font-variant-numeric:tabular-nums;}
.sb-num.winner{color:var(--green);}
.sb-num.loser{color:var(--text3);font-weight:500;}
.sb-status{font-size:9px;margin-top:4px;text-transform:uppercase;letter-spacing:0.04em;display:flex;align-items:center;gap:4px;}
.sb-status.live{color:var(--red);font-weight:700;}
.sb-status.final{color:var(--text3);}
.sb-status.pre{color:var(--accent);}
.sb-fav-star{color:#f59e0b;font-size:10px;}
.sb-more{padding:5px;text-align:center;font-size:10px;color:var(--text3);font-style:italic;}

/* ═══════════════════════════════════════════
   MORNING BRIEFING — TIME editorial card
   Bold left rule, serif section label
═══════════════════════════════════════════ */
.briefing{
  margin-bottom:24px;
  background:var(--surface);border-radius:var(--radius);
  border:1px solid var(--border);overflow:hidden;
  border-top:3px solid var(--accent);
}
.briefing-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 18px 12px;border-bottom:1px solid var(--border2);
}
.briefing-left{display:flex;align-items:center;gap:10px;}
.briefing-icon{font-size:18px;}
.briefing-title{
  font-family:var(--font-serif);
  font-size:15px;font-weight:700;color:var(--text);letter-spacing:0;
}
.briefing-date{
  font-family:var(--font-sans);
  font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;
}
.briefing-refresh{
  background:none;border:1px solid var(--border);color:var(--text3);
  border-radius:var(--radius-sm);padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;
  font-family:var(--font-sans);transition:all 0.12s;
}
.briefing-refresh:hover{border-color:var(--accent);color:var(--accent);}
.briefing-refresh:disabled{opacity:0.5;cursor:wait;}
.briefing-body{padding:14px 18px 16px;}
.briefing-overview{
  font-family:var(--font-sans);
  font-size:13px;color:var(--text2);line-height:1.7;font-weight:400;
}
.briefing-overview strong{color:var(--text);font-weight:700;}
.briefing-loading{font-size:12px;color:var(--text3);font-style:italic;padding:14px 18px 16px;}
.briefing-err{font-size:11px;color:var(--red);padding:8px 18px 12px;}

/* ═══════════════════════════════════════════
   HERO ROW (unchanged structurally)
═══════════════════════════════════════════ */
.hero-row{display:grid;grid-template-columns:1fr 320px;gap:16px;margin-bottom:24px;}
.hero-lead{
  background:var(--surface);border-radius:14px;border:1px solid var(--border);
  overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.15s;
  box-shadow:var(--shadow-sm);
}
.hero-lead:hover{box-shadow:var(--shadow-md);transform:translateY(-1px);}
.hero-lead:active{transform:scale(0.998);}
.hero-lead-img{
  width:100%;aspect-ratio:21/9;background-size:cover;background-position:center top;
  background-color:var(--surface2);position:relative;
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
  /* TIME-style: big bold Playfair Display serif — this is the centrepiece headline */
  font-family:var(--font-serif);
  font-size:26px;font-weight:700;color:var(--text);line-height:1.2;
  letter-spacing:-0.3px;margin:0 0 10px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.hero-lead-desc{
  font-family:var(--font-sans);
  font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 12px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:400;
}
.hero-lead-meta{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3);}
.hero-lead-source{font-weight:800;color:var(--text2);text-transform:uppercase;font-size:10px;letter-spacing:0.08em;}
.hero-side{
  background:var(--surface);border-radius:14px;border:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;box-shadow:var(--shadow-sm);
}
.hero-side-label{
  font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;
  letter-spacing:0.1em;padding:12px 14px 8px;
}
.hero-side-item{
  display:flex;gap:10px;padding:9px 14px;border-top:1px solid var(--border2);
  cursor:pointer;transition:background 0.12s;
}
.hero-side-item:hover{background:var(--surface2);}
.hero-side-thumb{width:56px;height:42px;object-fit:cover;border-radius:5px;flex-shrink:0;}
.hero-side-body{flex:1;min-width:0;}
.hero-side-title{
  font-size:12px;font-weight:700;color:var(--text);line-height:1.3;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px;
}
.hero-side-meta{font-size:9px;color:var(--text3);}

/* ═══════════════════════════════════════════
   TODAY PAGE
═══════════════════════════════════════════ */
.today-main{display:grid;grid-template-columns:1fr 280px;gap:36px;align-items:start;}
.today-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.today-block{
  background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);
  overflow:hidden;
}
.today-block-head{
  padding:11px 14px 9px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;
}
.today-block-label{font-size:11px;font-weight:800;display:flex;align-items:center;gap:5px;}
.today-block-count{
  font-size:9px;color:var(--text3);background:var(--surface2);
  border-radius:8px;padding:1px 6px;font-weight:700;font-variant-numeric:tabular-nums;
}
.today-see-all{font-size:10px;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700;transition:opacity 0.1s;}
.today-see-all:hover{opacity:0.65;}
.today-item{
  padding:9px 14px;border-bottom:1px solid var(--border2);cursor:pointer;
  display:flex;gap:8px;align-items:flex-start;transition:background 0.1s;
}
.today-item:last-child{border-bottom:none;}
.today-item:hover{background:var(--surface2);}
.today-thumb{width:48px;height:36px;border-radius:4px;object-fit:cover;flex-shrink:0;}
.today-thumb-ph{width:48px;height:36px;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;background:var(--surface2);}
.today-item-body{flex:1;min-width:0;}
.today-item-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.today-item-src{font-size:10px;color:var(--text3);}
.today-item-wrap{border-bottom:1px solid var(--border2);}
.today-item-wrap:last-child{border-bottom:none;}
.today-item-wrap .today-item{border-bottom:none;}
.today-ai-btn{
  background:none;border:1px solid var(--border);color:var(--text3);border-radius:4px;
  padding:2px 6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:600;
  flex-shrink:0;align-self:flex-start;transition:all 0.1s;
}
.today-ai-btn:hover{border-color:#7c3aed;color:#7c3aed;}
.today-ai-btn.on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.today-ai-btn:disabled{cursor:wait;opacity:0.6;}
.today-summary{padding:0 14px 10px 70px;font-size:11px;color:var(--text2);line-height:1.55;}
.today-bloom-row{grid-column:1/-1;}
.bloom-strip{display:grid;grid-template-columns:repeat(4,1fr);}
.bloom-strip-item{padding:10px 14px;border-right:1px solid var(--border2);cursor:pointer;transition:background 0.1s;}
.bloom-strip-item:last-child{border-right:none;}
.bloom-strip-item:hover{background:var(--surface2);}
.bloom-strip-title{font-size:11px;font-weight:600;color:var(--text);line-height:1.35;margin-bottom:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.bloom-strip-src{font-size:10px;color:#0369a1;font-weight:500;}
.bloom-strip-date{font-size:9px;color:var(--text3);margin-top:2px;}

/* ═══════════════════════════════════════════
   FINANCE PAGE
═══════════════════════════════════════════ */
/* v22b: MARKETS (Bloomberg-style) — orange accent, denser tables, monospace
   numerics throughout, terminal-like layout. CSS-only, no functional changes. */
.fin-header{
  background:var(--surface);border:1px solid var(--border);
  border-radius:0;border-top:3px solid #fa7800;
  padding:14px 18px 12px;margin-bottom:12px;box-shadow:none;
}
.fin-header-slim .fin-header-top{margin-bottom:0;}
.fin-header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:12px;flex-wrap:wrap;}
.fin-header-title{
  font-size:20px;font-weight:900;color:var(--text);letter-spacing:-0.5px;
}
.fin-header-sub{font-size:11px;color:var(--text2);margin-top:4px;display:flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums;}
.fin-status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;}
.fin-refresh{
  background:transparent;border:1px solid var(--border);color:var(--text2);
  border-radius:0;padding:5px 12px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;
  text-transform:uppercase;letter-spacing:0.06em;transition:all 0.12s;
}
.fin-refresh:hover{border-color:#fa7800;color:#fa7800;}
.fin-refresh:disabled{cursor:wait;opacity:0.6;}
.fin-grid{display:grid;grid-template-columns:1fr 280px;gap:12px;align-items:start;}
.fin-main{display:flex;flex-direction:column;gap:12px;min-width:0;}
.fin-watchlist,.fin-news{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);overflow:hidden;
}
.fin-section-head{
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 16px;
  background:var(--surface);border-bottom:1px solid var(--border);
}
.fin-section-title{
  font-size:12px;font-weight:700;color:var(--text);letter-spacing:0.01em;
}
.fin-news{padding:0;}
.fin-news .fin-section-head{margin:0;border-radius:0;}
.fin-news > *:not(.fin-section-head){padding:0 14px;}
.fin-news > *:not(.fin-section-head):first-of-type{padding-top:14px;}
.fin-news > *:not(.fin-section-head):last-of-type{padding-bottom:14px;}
.fin-table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;}
.fin-table thead th{
  background:var(--surface2);
  font-size:9px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.07em;
  padding:7px 16px;border-bottom:1px solid var(--border);
}
.fin-table tbody tr{cursor:pointer;transition:background 0.1s;border-bottom:1px solid var(--border2);}
.fin-table tbody tr:hover{background:#f0f7ff;}
.dark .fin-table tbody tr:hover{background:rgba(99,102,241,0.08);}
.fin-table tbody tr:last-child{border-bottom:none;}
.fin-table td{
  padding:10px 16px;font-size:13px;color:var(--text);
}
.fin-sym{font-weight:800;font-size:13px;color:#6366f1;letter-spacing:-0.2px;}
.fin-name{color:var(--text3);font-size:11px;font-weight:400;padding-left:0;}
.fin-px{font-variant-numeric:tabular-nums;text-align:right;font-weight:600;font-size:13px;}
.fin-up{color:#16a34a;}
.fin-down{color:#dc2626;}
.fin-pct-pill{
  display:inline-block;
  background:rgba(22,163,74,0.12);border-radius:6px;padding:2px 7px;
  font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;
}
.fin-down .fin-pct-pill{background:rgba(220,38,38,0.1);}
.fin-empty{padding:32px;text-align:center;color:var(--text3);font-style:italic;font-size:12px;}
/* Watchlist compact rows */
.fin-wl-row{cursor:pointer;transition:background 0.1s;}
.fin-wl-row:hover,.fin-wl-row.expanded{background:var(--surface2);}
.fin-wl-row.expanded td{border-bottom:none;}
/* Chart expansion */
.fin-chart-row{background:var(--surface2);}
.fin-chart-cell{padding:0!important;border-bottom:1px solid var(--border);}
.fin-chart-wrap{padding:10px 16px 14px;}
.fin-period-pills{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.fin-period-pill{
  padding:4px 10px;border-radius:16px;font-size:11px;font-weight:700;
  background:var(--surface);border:1px solid var(--border);color:var(--text3);
  cursor:pointer;transition:all 0.12s;font-family:var(--font-sans);
}
.fin-period-pill:hover{border-color:#6366f1;color:#6366f1;}
.fin-period-pill.active{background:#6366f1;color:#fff;border-color:#6366f1;}
.fin-period-row{display:flex;gap:4px;}
.fin-period-btn{padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;background:var(--surface2);border:1px solid var(--border);color:var(--text3);cursor:pointer;font-family:var(--font-sans);}
.fin-period-btn.active{background:#6366f1;color:#fff;border-color:#6366f1;}
.fin-chart-frame{width:100%;height:200px;border:none;border-radius:6px;display:block;}
.fin-chart-ext{
  margin-left:auto;font-size:11px;font-weight:600;color:var(--text3);
  text-decoration:none;padding:4px 8px;border:1px solid var(--border);border-radius:12px;
  transition:all 0.12s;
}
.fin-chart-ext:hover{border-color:#fa7800;color:#fa7800;}

/* ═══════════════════════════════════════════
   SOCIAL FOLLOWS (per category)
═══════════════════════════════════════════ */
.social-block{margin-top:32px;}
.social-block-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.social-block-title{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;}
.social-block-sub{font-size:10px;color:var(--text3);}
.social-platforms{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
.social-plat{background:var(--surface2);border-radius:8px;padding:10px 12px;}
.social-plat-head{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
.social-plat-icon{width:16px;height:16px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;}
.social-plat-label{font-size:10px;font-weight:700;color:var(--text);}
.social-plat-count{font-size:9px;color:var(--text3);margin-left:auto;}
.social-handles{display:flex;flex-wrap:wrap;gap:4px;}
.social-handle{
  font-size:10px;font-weight:500;color:var(--text2);background:var(--surface);
  border:1px solid var(--border);border-radius:10px;padding:2px 8px;
  text-decoration:none;transition:all 0.1s;
}
.social-handle:hover{transform:translateY(-1px);border-color:currentColor;}

/* Social Page */
.social-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap;}
.social-page-title{font-size:17px;font-weight:800;color:var(--text);letter-spacing:-0.4px;}
.social-page-sub{font-size:12px;color:var(--text2);margin-top:2px;}
.social-page-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;}
.social-cat-block{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;}
.social-cat-head{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid var(--border2);}
.social-cat-plat{padding:10px 14px;border-bottom:1px solid var(--border2);}
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
  background:var(--surface);border-radius:10px;border:1px solid var(--border);
  padding:14px;transition:border-color 0.15s;
}
.pod-card:hover{border-color:#fda4af;}
.pod-card-top{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;}
.pod-num{font-size:20px;font-weight:800;color:var(--text4);min-width:26px;line-height:1;}
.pod-body{flex:1;min-width:0;}
.pod-show{font-size:10px;font-weight:600;color:#e11d48;margin-bottom:2px;}
.pod-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:4px;cursor:pointer;}
.pod-title:hover{color:#e11d48;}
.pod-meta{font-size:10px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap;}
.pod-desc{font-size:11px;color:var(--text2);line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.pod-actions{display:flex;gap:6px;flex-wrap:wrap;}
.pod-btn{border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:500;background:none;color:var(--text2);transition:all 0.12s;}
.pod-btn:hover{border-color:#e11d48;color:#e11d48;}
.pod-btn.saved{border-color:var(--amber);color:var(--amber);background:#fffbeb;}
.pod-shows{background:var(--surface);border-radius:10px;border:1px solid var(--border);padding:14px;}
.pod-show-item{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border2);cursor:pointer;}
.pod-show-item:last-child{border-bottom:none;}
.pod-show-item:hover .pod-show-name{color:#e11d48;}
.pod-show-emoji{font-size:16px;width:24px;text-align:center;}
.pod-show-name{font-size:12px;font-weight:600;color:var(--text);transition:color 0.1s;}
.pod-show-ep{font-size:10px;color:var(--text3);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}
.pod-show-dot{width:5px;height:5px;border-radius:50%;background:#e11d48;flex-shrink:0;margin-left:auto;}
.saved-empty{text-align:center;padding:80px 20px;}

/* ═══════════════════════════════════════════
   CUSTOMIZE PANEL
═══════════════════════════════════════════ */
.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px);}
.cp-panel{background:var(--surface);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow-lg),0 0 0 1px rgba(0,0,0,0.05);}
.cp-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--surface);z-index:10;}
.cp-title{font-size:14px;font-weight:700;color:var(--text);}
.cp-x{background:none;border:none;font-size:18px;cursor:pointer;color:var(--text3);line-height:1;}
.cp-body{padding:16px 20px;display:flex;flex-direction:column;gap:20px;}
.cp-sec{}
.cp-lbl{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.cp-desc{font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:8px;}
.cp-cat-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;}
.cp-cat-tab{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:500;transition:all 0.1s;}
.cp-cat-tab.active{background:var(--accent);color:#fff;border-color:var(--accent);}
.cp-sec-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border2);}
.cp-sec-tab{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:600;transition:all 0.1s;}
.cp-sec-tab.active{background:var(--text);color:var(--bg);border-color:var(--text);}
.cp-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
.cp-chip{display:inline-flex;align-items:center;gap:3px;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:500;}
.cp-chip-kw{background:var(--accent-bg);color:var(--accent);}
.cp-chip-alert{background:#fef2f2;color:var(--red);}
.cp-chip-social{background:var(--surface2);border:1px solid var(--border);color:var(--text2);}
.cp-chip-x{background:none;border:none;cursor:pointer;font-size:12px;opacity:0.5;line-height:1;padding:0;}
.cp-chip-x:hover{opacity:1;}
.cp-add{display:flex;gap:6px;}
.cp-input{flex:1;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);}
.cp-input:focus{outline:none;border-color:var(--accent);}
.cp-btn{background:var(--accent);border:none;color:#fff;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
.cp-btn-red{background:var(--red);}
.cp-src-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);}
.cp-src-row:last-child{border-bottom:none;}
.cp-health{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.cp-h-green{background:var(--green);}.cp-h-yellow{background:var(--amber);}.cp-h-red{background:var(--red);}.cp-h-gray{background:#9ca3af;}
.cp-src-name{flex:1;font-size:12px;color:var(--text);}
.cp-src-count{font-size:10px;color:var(--text3);}
.cp-test-btn{background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:3px 8px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);white-space:nowrap;}
.cp-tog{width:30px;height:17px;border-radius:9px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.cp-tog.on{background:var(--accent);}.cp-tog.off{background:#cbd5e1;}
.cp-tog::after{content:'';width:13px;height:13px;background:#fff;border-radius:50%;position:absolute;top:2px;transition:left 0.15s;}
.cp-tog.on::after{left:15px;}.cp-tog.off::after{left:2px;}
.cp-del{background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;padding:0 1px;line-height:1;}
.cp-del:hover{color:var(--red);}
.cp-test-result{font-size:10px;padding:4px 8px;border-radius:5px;margin-top:4px;}
.cp-test-ok{background:#f0fdf4;color:var(--green);}
.cp-test-fail{background:#fef2f2;color:var(--red);}
.cp-test-load{background:var(--surface2);color:var(--text3);font-style:italic;}
.cp-add-src{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px;display:flex;flex-direction:column;gap:6px;}
.cp-add-src-title{font-size:10px;font-weight:600;color:var(--text2);margin-bottom:2px;}
.cp-input-sm{border:1px solid var(--border);border-radius:6px;padding:5px 9px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);width:100%;}
.cp-input-sm:focus{outline:none;border-color:var(--accent);}
.cp-save{width:100%;background:var(--text);border:none;color:var(--bg);border-radius:8px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:-0.1px;transition:opacity 0.12s;}
.cp-save:hover{opacity:0.88;}
.cp-legend{display:flex;gap:10px;font-size:10px;color:var(--text3);margin-bottom:8px;flex-wrap:wrap;}
.cp-legend-item{display:flex;align-items:center;gap:4px;}
.cp-plat-tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;}
.cp-plat-tab{background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-family:inherit;color:var(--text2);font-weight:500;transition:all 0.1s;}
.cp-plat-tab.active{background:var(--text);color:var(--bg);border-color:var(--text);}

/* ═══════════════════════════════════════════
   SOURCE FOOTER
═══════════════════════════════════════════ */
.src-footer{margin-top:32px;padding-top:16px;border-top:1px solid var(--border2);}
.src-footer-label{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
.src-footer-links{display:flex;flex-wrap:wrap;gap:2px 0;align-items:center;}
.src-footer-link{font-size:10px;color:var(--text3);text-decoration:none;padding:2px 7px;border-radius:4px;transition:color 0.1s,background 0.1s;font-weight:500;white-space:nowrap;}
.src-footer-link:hover{color:var(--text);background:var(--surface2);}
.src-footer-sep{font-size:9px;color:var(--text4);user-select:none;}

/* ═══════════════════════════════════════════
   v25b ADDITIONS — Google News grid + per-vertical accents + Business Bloomberg
═══════════════════════════════════════════ */

/* GOOGLE NEWS GRID — universal "list of articles" layout pattern.
   Lead card (full-width, large image) + 3-column equal grid below.
   Used on General homepage, Sports article feed, Markets news, Pop Culture,
   Bloom Energy. Cards inside use the unified .fc class. */
.gn-grid{
  display:flex;flex-direction:column;gap:24px;
  margin-bottom:32px;
}
.gn-lead{
  display:grid;grid-template-columns: 1.6fr 1fr;gap:24px;
  cursor:pointer;
  padding-bottom:24px;border-bottom:1px solid var(--border);
  transition:opacity 0.15s;
}
.gn-lead:hover{opacity:0.92;}
.gn-lead-img{
  width:100%;aspect-ratio:21/9;
  background-size:cover;background-position:center top;
  border-radius:8px;background-color:var(--surface2);
  position:relative;
}
.gn-lead-text{display:flex;flex-direction:column;justify-content:center;}
.gn-lead-title{
  /* NBC bold-display feel */
  font-size:30px;font-weight:900;line-height:1.12;
  letter-spacing:-0.7px;color:var(--text);margin:0 0 12px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-lead-desc{
  font-size:15px;line-height:1.5;color:var(--text2);
  margin:0 0 12px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-lead-meta{
  font-size:11px;color:var(--text3);
  display:flex;align-items:center;gap:6px;
}
.gn-lead-source{
  font-weight:800;color:var(--text2);
  text-transform:uppercase;letter-spacing:0.06em;font-size:10px;
}

/* Grid of equal cards below the lead */
.gn-row{
  display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;
}
.gn-card{
  display:flex;flex-direction:column;gap:10px;cursor:pointer;
  transition:opacity 0.12s;
}
.gn-card:hover{opacity:0.9;}
.gn-card-img{
  width:100%;aspect-ratio:16/7;
  background-size:cover;background-position:center top;
  border-radius:6px;background-color:var(--surface2);
}
.gn-card-img-ph{
  width:100%;aspect-ratio:16/7;
  background:var(--surface2);border-radius:6px;
}
.gn-card-title{
  font-size:15px;font-weight:800;line-height:1.28;
  letter-spacing:-0.3px;color:var(--text);margin:0;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-card-meta{
  font-size:10px;color:var(--text3);
  display:flex;gap:5px;align-items:center;
}
.gn-card-source{
  font-weight:800;color:var(--text2);
  text-transform:uppercase;letter-spacing:0.05em;font-size:9px;
}

/* Per-vertical card top-border accents */
.gn-card.popculture{border-top:3px solid #db2777;padding-top:8px;}
.gn-card.business{border-top:3px solid #fa7800;padding-top:8px;}
.gn-card.finance{border-top:3px solid #fa7800;padding-top:8px;}

/* Sources powering this page footer (replaces old SourceFooter on grids) */
.gn-sources{
  margin-top:32px;padding-top:20px;
  border-top:1px solid var(--border);
  font-size:11px;color:var(--text3);
  text-align:center;line-height:1.6;
}
.gn-sources-label{
  font-weight:800;color:var(--text2);
  text-transform:uppercase;letter-spacing:0.08em;font-size:10px;
  margin-right:8px;
}

/* Mobile: collapse to 1 column */
@media (max-width:900px){
  .gn-lead{grid-template-columns:1fr;gap:14px;}
  .gn-lead-title{font-size:24px;}
  .gn-row{grid-template-columns:repeat(2, 1fr);gap:14px;}
  .gn-card-title{font-size:14px;}
}
@media (max-width:640px){
  .gn-lead{padding-bottom:18px;}
  .gn-lead-title{font-size:22px;-webkit-line-clamp:3;}
  .gn-lead-desc{-webkit-line-clamp:2;font-size:14px;}
  .gn-row{grid-template-columns:1fr;gap:18px;}
  .gn-card{flex-direction:row;gap:12px;}
  .gn-card-img,.gn-card-img-ph{width:120px;height:80px;aspect-ratio:auto;flex-shrink:0;}
  .gn-card-title{-webkit-line-clamp:3;}
}

/* BUSINESS PAGE Bloomberg-style — orange accent + dense feel.
   v25b: matches Markets treatment, applied via .business class on page/cards. */
.fc.business{
  border-top:3px solid #fa7800;
}

/* ═══════════════════════════════════════════
   v24a ADDITIONS — General homepage briefing teaser + cross-cat sections
═══════════════════════════════════════════ */

/* BRIEFING TEASER on General homepage — compact preview that opens full BriefingPage */
.briefing-teaser{
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 0 var(--radius) var(--radius) 0;
  padding: 18px 22px;
  margin-bottom: 28px;
}
.briefing-teaser-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom: 10px;flex-wrap:wrap;gap:8px;
}
.briefing-teaser-label-row{
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;flex:1;min-width:0;
}
.briefing-teaser-label{
  font-size: 12px;font-weight: 800;color: var(--text);
  text-transform: uppercase;letter-spacing: 0.1em;
}
.briefing-teaser-date{
  font-size: 11px;color: var(--text3);font-weight: 500;
}
.briefing-teaser-ts{
  font-size: 10px;color: var(--text3);font-weight: 500;
  font-style: italic;
}
.briefing-teaser-cta{
  background: var(--accent);border: none;color: #fff;
  padding: 7px 14px;border-radius: 6px;
  font-size: 11px;font-weight: 700;cursor: pointer;
  font-family: inherit;letter-spacing: 0.02em;
  transition: opacity 0.15s;
}
.briefing-teaser-cta:hover{opacity: 0.88;}
.briefing-teaser-body{
  font-size: 16px;line-height: 1.55;color: var(--text);
  font-weight: 400;letter-spacing: -0.15px;
  margin: 0;
  font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
}
.briefing-teaser-body strong{font-weight: 700;}
.briefing-teaser-empty{
  font-size: 13px;color: var(--text3);font-style: italic;margin: 0;
}
.briefing-teaser-bullets{
  list-style: none;padding: 0;margin: 12px 0 0 0;
  display: flex;flex-direction: column;gap: 6px;
}
.briefing-teaser-bullets li{
  position: relative;padding-left: 16px;
  font-size: 13px;line-height: 1.5;color: var(--text2);font-weight: 500;
}
.briefing-teaser-bullets li::before{
  content: '';position: absolute;left: 0;top: 7px;
  width: 5px;height: 5px;border-radius: 50%;
  background: var(--accent);
}
.briefing-teaser-bullets li strong{color: var(--text);font-weight: 700;}
.briefing-teaser-footer{
  display:flex;align-items:center;justify-content:space-between;
  margin-top: 14px;padding-top: 12px;
  border-top: 1px solid var(--border2);
  flex-wrap:wrap;gap:8px;
}
.briefing-teaser-sources{
  font-size: 10px;color: var(--text3);font-weight: 500;
}
.briefing-teaser-sources strong{color: var(--text2);font-weight: 700;}
.briefing-teaser-cta-link{
  background: none;border: none;color: var(--accent);
  font-size: 11px;font-weight: 700;cursor: pointer;
  font-family: inherit;padding: 0;
}
.briefing-teaser-cta-link:hover{text-decoration: underline;}

/* CROSS-CATEGORY SECTIONS on General homepage */
.other-cat-sections{
  margin-top: 36px;
}
.other-cat-divider{
  display:flex;align-items:center;justify-content:center;
  margin: 24px 0 28px;padding: 0;position:relative;
}
.other-cat-divider::before{
  content: '';position: absolute;left: 0;right: 0;top: 50%;
  height: 1px;background: var(--border);
}
.other-cat-divider span{
  background: var(--bg);padding: 0 16px;position: relative;
  font-size: 11px;font-weight: 800;color: var(--text3);
  text-transform: uppercase;letter-spacing: 0.12em;
}
.other-cat-section{
  margin-bottom: 28px;
}
.other-cat-head{
  display:flex;align-items:baseline;justify-content:space-between;
  margin-bottom: 12px;
}
.other-cat-label{
  font-size: 12px;font-weight: 800;
  text-transform: uppercase;letter-spacing: 0.08em;
}
.other-cat-link{
  background: none;border: none;color: var(--text3);
  font-size: 11px;font-weight: 600;cursor: pointer;font-family: inherit;
  padding: 0;transition: color 0.15s;
}
.other-cat-link:hover{color: var(--accent);}

/* Mobile briefing teaser */
@media (max-width:640px){
  .briefing-teaser{padding: 14px 16px;margin-bottom: 20px;border-radius: 0 8px 8px 0;}
  .briefing-teaser-body{font-size: 15px;line-height: 1.5;}
  .briefing-teaser-bullets li{font-size: 12px;}
  .briefing-teaser-cta{padding: 8px 14px;font-size: 11px;min-height: 36px;}
  .briefing-teaser-footer{flex-direction: column;align-items: flex-start;gap: 6px;}
  .other-cat-divider span{font-size: 10px;padding: 0 12px;}
}

/* ═══════════════════════════════════════════
   v23 ADDITIONS — Yahoo Sports vertical
═══════════════════════════════════════════ */

/* SPORTS PAGE outer */
.sports-page{padding-top:0;}

/* SCOREBOARD STRIP — Yahoo Sports' signature dark navy bar */
.sports-score-strip{
  background:#0c1c2c;
  margin:-28px -24px 18px;
  padding:14px 24px;
  border-top:1px solid #1a2c3e;
  border-bottom:1px solid #1a2c3e;
}
.sports-score-strip.empty{padding:18px 24px;text-align:center;}
.sports-score-strip-empty{color:rgba(255,255,255,0.5);font-size:11px;font-style:italic;letter-spacing:0.04em;}
.sports-score-strip-inner{
  display:flex;gap:8px;
  overflow-x:auto;scrollbar-width:none;
  -webkit-overflow-scrolling:touch;
  scroll-snap-type:x proximity;
  padding-bottom:2px;
}
.sports-score-strip-inner::-webkit-scrollbar{display:none;}
.sst-tile{
  position:relative;
  flex-shrink:0;scroll-snap-align:start;
  background:#162635;border:1px solid #243446;
  border-radius:7px;padding:8px 10px;
  min-width:130px;cursor:pointer;
  transition:border-color 0.15s, transform 0.1s;
}
.sst-tile:hover{border-color:#3b5168;transform:translateY(-1px);}
.sst-tile.live{border-color:#ef4444;background:#2a1f1f;}
.sst-tile.fav{border-color:#f59e0b;background:#221c10;}
.sst-tile.fav.live{border-color:#ef4444;}
.sst-fav-star{
  position:absolute;top:6px;right:8px;
  color:#fbbf24;font-size:10px;
}
.sst-league-badge{
  font-size:9px;font-weight:800;color:rgba(255,255,255,0.45);
  text-transform:uppercase;letter-spacing:0.1em;margin-bottom:7px;
}
.sst-row{
  display:flex;justify-content:space-between;align-items:center;
  font-size:12px;color:rgba(255,255,255,0.85);
  font-variant-numeric:tabular-nums;padding:2px 0;
}
.sst-team{font-weight:600;letter-spacing:-0.2px;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.sst-team.win{color:#fff;font-weight:800;}
.sst-team.loss{color:rgba(255,255,255,0.4);}
.sst-score{font-weight:900;font-size:14px;color:#fff;min-width:22px;text-align:right;}
.sst-score.win{color:#22c55e;}
.sst-score.loss{color:rgba(255,255,255,0.35);}
.sst-status{
  font-size:9px;color:rgba(255,255,255,0.55);
  text-transform:uppercase;letter-spacing:0.05em;
  margin-top:4px;display:flex;align-items:center;gap:4px;
  border-top:1px solid rgba(255,255,255,0.07);padding-top:4px;
}
.sst-status.live{color:#ef4444;font-weight:700;}
.sst-status.final{color:rgba(255,255,255,0.4);}
.sst-status.pre{color:#60a5fa;}
.sst-live-dot{
  width:5px;height:5px;border-radius:50%;background:#ef4444;
  animation:pulse-badge 1.4s ease-in-out infinite;
}

/* SPORT TABS — ESPN-style larger tabs */
.sport-tabs{
  display:flex;gap:6px;
  padding:0 0 14px 0;
  margin-bottom:16px;
  overflow-x:auto;scrollbar-width:none;
}
.sport-tabs::-webkit-scrollbar{display:none;}
.sport-tab{
  background:var(--surface2);
  border:1.5px solid var(--border);
  border-radius:22px;
  padding:8px 18px;font-size:13px;font-weight:700;
  color:var(--text2);cursor:pointer;font-family:inherit;
  white-space:nowrap;flex-shrink:0;
  transition:all 0.15s;
  display:inline-flex;align-items:center;gap:6px;
  -webkit-tap-highlight-color:transparent;
  min-height:38px;
}
.sport-tab:hover{background:var(--surface);color:var(--text);border-color:var(--text3);}
.sport-tab.active{
  background:#6001d2;color:#fff;border-color:#6001d2;
  box-shadow:0 2px 8px rgba(96,1,210,0.35);
}
.sport-tab-emoji{font-size:15px;}

/* ── LEAGUE HEADER — ESPN-style hero banner ── */
.sport-league-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 24px;margin:0 0 20px 0;
  background:linear-gradient(135deg,#12002a 0%,#2d006b 50%,#1a0048 100%);
  border-radius:12px;color:#fff;
  box-shadow:0 4px 20px rgba(96,1,210,0.3);
  position:relative;overflow:hidden;
}
.sport-league-header::after{
  content:'';position:absolute;right:-20px;top:-20px;
  width:120px;height:120px;border-radius:50%;
  background:rgba(255,255,255,0.04);
}
.dark .sport-league-header{background:linear-gradient(135deg,#0a001a 0%,#1a0040 50%,#0d0024 100%);}
.sport-league-header-left{display:flex;align-items:center;gap:14px;}
.sport-league-emoji{font-size:36px;line-height:1;}
.sport-league-title{font-size:22px;font-weight:900;letter-spacing:-0.5px;margin:0 0 4px 0;color:#fff;}
.sport-league-count{font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;}
.sport-league-sub{font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;}
.sport-league-all-btn{
  font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);
  background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);
  border-radius:20px;padding:7px 16px;cursor:pointer;font-family:inherit;
  transition:background 0.15s,color 0.15s;
  backdrop-filter:blur(4px);
}
.sport-league-all-btn:hover{background:rgba(255,255,255,0.22);color:#fff;}

/* Team Hub — shown when a team pill is active */
.team-hub{
  background:var(--surface);border:1px solid var(--border);
  border-radius:12px;padding:18px 20px;margin-bottom:20px;
  border-left:4px solid #6001d2;
}
.team-hub-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.team-hub-title{font-size:18px;font-weight:800;display:flex;align-items:center;gap:10px;}
.team-hub-links{display:flex;gap:8px;}
.team-hub-link{
  font-size:11px;font-weight:700;padding:5px 12px;border-radius:16px;
  text-decoration:none;border:1px solid var(--border);color:var(--text2);
  transition:all 0.12s;
}
.team-hub-link:hover{border-color:#6001d2;color:#6001d2;}
.team-hub-count{font-size:12px;color:var(--text3);margin-top:2px;}
.team-hub-clear{
  font-size:12px;font-weight:600;color:var(--text3);
  background:none;border:1px solid var(--border);border-radius:14px;
  padding:4px 12px;cursor:pointer;font-family:inherit;
}
.team-hub-clear:hover{color:var(--accent);border-color:var(--accent);}

/* TEAM PILLS row */
.team-pills-row{
  display:flex;align-items:center;gap:10px;
  margin-bottom:18px;flex-wrap:wrap;
}
.team-pills-label{
  font-size:10px;font-weight:800;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;
  flex-shrink:0;
}
.team-pills{
  display:flex;gap:8px;flex-wrap:wrap;flex:1;
}
.team-pill-group{
  display:inline-flex;align-items:stretch;
  border:1px solid var(--border);border-radius:20px;
  overflow:hidden;background:var(--surface);
  transition:border-color 0.15s;
}
.team-pill-group:hover{border-color:#6001d2;}
.team-pill-group.active{border-color:#6001d2;background:#f5edff;}
.dark .team-pill-group.active{background:#2a1d4a;}
.team-pill{
  background:none;border:none;cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 11px;font-size:11px;font-weight:700;color:var(--text);
  -webkit-tap-highlight-color:transparent;
}
.team-pill-group.active .team-pill{color:#6001d2;}
.team-pill-emoji{font-size:14px;}
.team-pill-name{letter-spacing:-0.1px;}
.team-pill-link{
  text-decoration:none;color:var(--text3);
  padding:5px 9px;font-size:10px;font-weight:700;
  border-left:1px solid var(--border);
  display:inline-flex;align-items:center;
  letter-spacing:0.04em;
  transition:color 0.12s, background 0.12s;
}
.team-pill-link:hover{color:#6001d2;background:var(--surface2);}
.team-pills-edit{
  background:none;border:1px dashed var(--border);
  border-radius:20px;padding:5px 12px;
  font-size:10px;font-weight:700;color:var(--text3);
  cursor:pointer;font-family:inherit;
  transition:all 0.15s;
}
.team-pills-edit:hover{border-color:#6001d2;color:#6001d2;border-style:solid;}

/* ACTIVE TEAM NOTICE */
.active-team-notice{
  display:flex;align-items:center;justify-content:space-between;
  background:#f5edff;border:1px solid #ddd0ff;
  border-radius:8px;padding:8px 14px;margin-bottom:18px;
  font-size:12px;color:#6001d2;
}
.dark .active-team-notice{background:#2a1d4a;border-color:#3a2d5a;}
.active-team-notice strong{color:#3f0080;font-weight:800;}
.dark .active-team-notice strong{color:#c4a5ff;}
.active-team-notice button{
  background:none;border:none;color:#6001d2;cursor:pointer;
  font-size:11px;font-weight:700;font-family:inherit;
}

/* SPORTS HERO — Yahoo dense lead with image */
.sports-hero{
  display:grid;grid-template-columns: 1.6fr 1fr;gap:20px;
  margin-bottom:24px;cursor:pointer;
  border-bottom:1px solid var(--border);padding-bottom:24px;
  transition:opacity 0.15s;
}
.sports-hero:hover{opacity:0.92;}
.sports-hero-img{
  width:100%;aspect-ratio:21/9;
  background-size:cover;background-position:center top;
  border-radius:8px;background-color:var(--surface2);
  position:relative;
}
.sports-hero-fav{
  position:absolute;top:12px;left:12px;
  background:#fbbf24;color:#7c2d12;
  font-size:10px;font-weight:900;letter-spacing:0.1em;
  padding:4px 10px;border-radius:3px;
  box-shadow:0 2px 8px rgba(0,0,0,0.2);
}
.sports-hero-text{display:flex;flex-direction:column;justify-content:center;}
.sports-hero-title{
  font-size:26px;font-weight:900;line-height:1.18;
  letter-spacing:-0.5px;color:var(--text);margin:0 0 10px 0;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.sports-hero-desc{
  font-size:14px;line-height:1.5;color:var(--text2);
  margin:0 0 10px 0;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.sports-hero-meta{
  font-size:11px;color:var(--text3);
  display:flex;align-items:center;gap:6px;
}
.sports-hero-source{font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.04em;font-size:10px;}

/* CUSTOMIZE — Teams section */
.cp-team-row{
  border:1px solid var(--border);border-radius:8px;
  padding:10px 12px;margin-bottom:8px;
  background:var(--surface);
}
.cp-team-row-head{
  display:flex;align-items:center;gap:8px;margin-bottom:6px;
}
.cp-team-row-body{
  display:flex;flex-direction:column;gap:3px;line-height:1.4;
}

/* Mobile sports adjustments */
@media (max-width:900px){
  .sports-hero{grid-template-columns:1fr;gap:14px;}
  .sports-hero-title{font-size:22px;}
  .team-pills-row{gap:8px;}
}
@media (max-width:640px){
  .sports-score-strip{margin:-12px -12px 14px;padding:12px;}
  .sst-tile{min-width:118px;padding:9px 11px;}
  .sport-tab{padding:10px 12px;font-size:12px;min-height:44px;}
  .team-pill-group{border-radius:18px;}
  .team-pill{padding:7px 12px;font-size:11px;min-height:36px;}
  .team-pill-link{padding:7px 9px;min-height:36px;}
  .sports-hero{margin-bottom:18px;padding-bottom:18px;}
  .sports-hero-img{aspect-ratio:21/9;max-height:200px;}
  .sports-hero-title{font-size:20px;-webkit-line-clamp:3;}
  .sports-hero-desc{-webkit-line-clamp:2;font-size:13px;}
  .active-team-notice{font-size:11px;padding:7px 12px;}
}

/* ═══════════════════════════════════════════
   v20 ADDITIONS — Briefing page + category trending + live scoreboard
═══════════════════════════════════════════ */

/* BRIEFING PAGE — dedicated digest destination */
.briefing-page-head{
  margin-bottom:24px;
  padding-bottom:20px;
  border-bottom:1px solid var(--border2);
}
.briefing-page-title{
  font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
  font-size: 34px;font-weight: 700;letter-spacing: -0.02em;
  color: var(--text);margin: 0 0 8px 0;line-height: 1.1;
}
.briefing-page-sub{
  font-size: 14px;line-height: 1.5;color: var(--text3);
  margin: 0;max-width: 640px;
}
.briefing-sources{margin-top: 32px;}
.briefing-sources-head{
  display:flex;align-items:baseline;justify-content:space-between;
  margin-bottom:14px;
}
.briefing-sources-label{
  font-size: 11px;font-weight: 700;color: var(--text3);
  text-transform: uppercase;letter-spacing: 0.12em;
}
.briefing-sources-meta{
  font-size: 10px;font-weight: 500;color: var(--text3);
  letter-spacing: 0.02em;
  text-align: right;
}

/* TRENDING IN [CATEGORY] — Feed page editorial strip */
.cat-trending{
  margin: 0 0 28px 0;
  padding: 16px 0 18px;
  border-top: 1px solid var(--border2);
  border-bottom: 1px solid var(--border2);
}
.cat-trending-head{margin-bottom:12px;}
.cat-trending-label{
  font-size: 11px;font-weight: 800;
  text-transform: uppercase;letter-spacing: 0.12em;
}
.cat-trending-row{
  display: grid;grid-template-columns: repeat(3, 1fr);
  gap: 14px 20px;
}
.cat-trending-card{
  display:flex;gap:10px;align-items:flex-start;
  cursor:pointer;padding:4px 0;
  transition: opacity 0.15s;
}
.cat-trending-card:hover{opacity: 0.75;}
.cat-trending-num{
  font-size: 20px;font-weight: 900;line-height: 1;
  min-width: 22px;flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.cat-trending-body{flex:1;min-width:0;}
.cat-trending-title{
  font-size: 13px;font-weight: 700;line-height: 1.35;color: var(--text);
  letter-spacing: -0.15px;margin-bottom: 3px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.cat-trending-meta{font-size: 10px;color: var(--text3);}

/* BOTTOM TOPICS — mid-scroll filter chips */
.bottom-topics{
  margin-top: 36px;padding-top: 24px;
  border-top: 1px solid var(--border2);
}
.bottom-topics-label{
  font-size: 11px;font-weight: 700;color: var(--text3);
  text-transform: uppercase;letter-spacing: 0.12em;
  margin-bottom: 10px;
}
.bottom-topics-chips{
  display: flex;flex-wrap: wrap;gap: 6px;
}

/* MINI SCOREBOARD STRIP — above Sports section on Today */
.mini-sb-strip{
  display: flex;align-items: center;gap: 16px;
  margin-bottom: 14px;padding: 2px 0;
  overflow-x: auto;scrollbar-width: none;
}
.mini-sb-strip::-webkit-scrollbar{display:none;}
.mini-sb-label{
  flex-shrink: 0;
  font-size: 11px;font-weight: 800;color: var(--text3);
  text-transform: uppercase;letter-spacing: 0.1em;
}
.mini-sb-items{
  display: flex;gap: 18px;flex: 1;min-width: 0;
}
.mini-sb-item{
  display: inline-flex;align-items: center;gap: 8px;
  font-size: 12px;white-space: nowrap;cursor: pointer;
  color: var(--text2);flex-shrink: 0;
  transition: color 0.15s;
}
.mini-sb-item:hover{color: var(--text);}
.mini-sb-item.live .mini-sb-teams{font-weight: 700;color: var(--text);}
.mini-sb-dot{
  width: 6px;height: 6px;border-radius: 50%;
  background: var(--red);flex-shrink: 0;
  animation: pulse-badge 1.4s ease-in-out infinite;
}
.mini-sb-teams{
  font-weight: 600;font-variant-numeric: tabular-nums;
}
.mini-sb-score{font-weight: 800;color: var(--text);}
.mini-sb-sep{color: var(--text4);margin: 0 5px;}
.mini-sb-status{
  font-size: 10px;color: var(--text3);text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* BLOOMBERG ACCENT BAR — subtle 2px color under section headers on Today */
.today-section-accent{
  height: 2px;width: 40px;border-radius: 1px;
  margin: -6px 0 12px 0;
  opacity: 0.85;
}

/* MOBILE overrides for v20 additions */
@media (max-width:900px){
  .cat-trending-row{grid-template-columns: repeat(2, 1fr);gap: 12px 16px;}
  .briefing-page-title{font-size: 28px;}
}
@media (max-width:640px){
  .cat-trending{padding: 14px 0 14px;margin-bottom: 20px;}
  .cat-trending-row{grid-template-columns: 1fr;gap: 12px;}
  .cat-trending-title{font-size: 13px;-webkit-line-clamp: 2;}
  .briefing-page-head{padding-bottom: 14px;margin-bottom: 18px;}
  .briefing-page-title{font-size: 24px;}
  .briefing-page-sub{font-size: 13px;}
  .briefing-sources{margin-top: 24px;}
  .mini-sb-strip{gap: 12px;margin-bottom: 10px;}
  .mini-sb-items{gap: 14px;}
  .mini-sb-item{font-size: 11px;}
  .mini-sb-status{font-size: 9px;}
  .bottom-topics{margin-top: 28px;padding-top: 18px;}
}

/* BriefingArticleItem — slim expandable row with AI/Share actions */
.ba-item{border-bottom:1px solid var(--border);}
.ba-main{display:flex;gap:10px;padding:12px 0;cursor:pointer;align-items:flex-start;}
.ba-main:hover .gf-title{color:var(--accent);}
.ba-actions{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;}
.ba-btn{font-size:10px;padding:3px 8px;border-radius:12px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:pointer;white-space:nowrap;transition:background 0.12s,color 0.12s;}
.ba-btn:hover,.ba-btn.on{background:var(--accent);color:#fff;border-color:var(--accent);}
.ba-panel{padding:8px 12px 12px;font-size:13px;color:var(--text2);line-height:1.55;background:var(--surface2);border-radius:0 0 6px 6px;margin-bottom:4px;}

/* MenuSheet search + trending */
.ms-search-wrap{padding:8px 16px 4px;}
.ms-search-input{width:100%;padding:8px 12px;border-radius:20px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:14px;outline:none;}
.ms-trending{padding:6px 16px 10px;display:flex;gap:6px;flex-wrap:wrap;}
.ms-trending-chip{font-size:11px;padding:3px 10px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);color:var(--text2);cursor:pointer;white-space:nowrap;}
.ms-trending-chip:hover{background:var(--accent);color:#fff;border-color:var(--accent);}

/* ═══════════════════════════════════════════
   v19 ADDITIONS — Editorial top band + enhanced briefing + tabbed sidebar
═══════════════════════════════════════════ */

/* HERO BAND — Yahoo News / NBC News 2-column top band */
.hero-band{
  display:grid;grid-template-columns: 1.5fr 1fr;
  gap:20px;margin-bottom:36px;
}
.hero-band-lead{
  position:relative;cursor:pointer;
  border-radius:var(--radius);overflow:hidden;
  background:var(--surface2);
  transition:transform 0.2s ease, box-shadow 0.2s ease;
}
.hero-band-lead:hover{
  transform:translateY(-2px);
  box-shadow:var(--shadow-md);
}
.hero-band-img{
  position:relative;width:100%;
  aspect-ratio: 16/10;
  background-size:cover;background-position:center;
  min-height:360px;
}
/* Gradient overlay — dark at bottom so white text has contrast */
.hero-band-grad{
  position:absolute;inset:0;pointer-events:none;
  background: linear-gradient(to top,
    rgba(0,0,0,0.82) 0%,
    rgba(0,0,0,0.55) 30%,
    rgba(0,0,0,0.15) 60%,
    rgba(0,0,0,0) 100%);
}
.hero-band-text-overlay{
  position:absolute;left:0;right:0;bottom:0;
  padding: 22px 24px 24px;
  color:#fff;z-index:2;
}
.hero-band-badge{
  display:inline-block;
  /* v22b MSN polish: brighter, more punch */
  font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;
  color:#fff;padding:5px 11px;border-radius:3px;
  margin-bottom:14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
/* EDITORIAL SERIF TITLE — the core polish lever */
.hero-band-title{
  font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
  /* v22b MSN polish: bigger hero, more weight, more presence */
  font-size: 36px;font-weight: 800;line-height: 1.12;
  letter-spacing: -0.025em;
  color: #fff;margin: 0 0 12px 0;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.hero-band-desc{
  font-size:15px;line-height:1.5;
  color:rgba(255,255,255,0.92);margin:0 0 12px 0;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.hero-band-meta{
  display:flex;align-items:center;gap:6px;
  font-size:11px;color:rgba(255,255,255,0.85);
  font-weight:500;
}
.hero-band-source{font-weight:700;}
.hero-band-dots{
  position:absolute;bottom:14px;right:16px;z-index:3;
  display:flex;gap:5px;
}
.hero-band-dot{
  width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;
  background:rgba(255,255,255,0.4);padding:0;
  transition:background 0.2s;
  -webkit-tap-highlight-color:transparent;
}
.hero-band-dot.active{background:#fff;}
.hero-band-dot:hover{background:rgba(255,255,255,0.7);}

/* Side rail — 5 secondary headlines */
.hero-band-side{
  display:flex;flex-direction:column;
  gap:2px;
}
.hero-band-side-label{
  font-size:11px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.12em;
  margin-bottom:12px;padding-bottom:10px;
  border-bottom:1px solid var(--border);
}
.hero-band-side-item{
  display:flex;gap:12px;align-items:flex-start;
  /* v22b MSN polish: tighter rows, more density */
  padding:10px 0;cursor:pointer;
  transition:background 0.15s;
  border-radius:6px;
  border-bottom:1px solid var(--border2);
}
.hero-band-side-item:last-child{border-bottom:none;}
.hero-band-side-item:hover{background:var(--surface2);margin:0 -10px;padding:10px 10px;}
.hero-band-side-thumb{
  /* v22b MSN polish: slightly bigger thumbs for more visual punch */
  width:80px;height:60px;object-fit:cover;border-radius:5px;flex-shrink:0;
}
.hero-band-side-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.hero-band-side-title{
  font-size:14px;font-weight:700;color:var(--text);
  line-height:1.32;letter-spacing:-0.2px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.hero-band-side-meta{
  font-size:10px;color:var(--text3);
  display:flex;align-items:center;gap:5px;
}

/* ENHANCED BRIEFING — bullets, timestamp, prominent button */
.briefing-inline-label-row{
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;flex:1;min-width:0;
}
.briefing-inline-label{
  font-size:11px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.12em;
}
.briefing-inline-date{
  font-size:11px;color:var(--text3);font-weight:500;
}
.briefing-inline-ts{
  font-size:10px;color:var(--text3);font-weight:500;
  display:inline-flex;align-items:center;gap:4px;
  margin-left:auto;
}
.briefing-inline-ts-dot{
  width:5px;height:5px;border-radius:50%;
  background:var(--green);
}
.briefing-inline-ts-dot.stale{background:var(--amber);}
.briefing-inline-refresh-btn{
  flex-shrink:0;
  background:var(--surface2);border:none;
  color:var(--text);font-size:11px;font-weight:700;
  padding:7px 12px;border-radius:6px;cursor:pointer;
  font-family:inherit;transition:background 0.15s,color 0.15s;
  letter-spacing:0.02em;min-height:32px;
}
.briefing-inline-refresh-btn:hover:not(:disabled){
  background:var(--accent);color:#fff;
}
.briefing-inline-refresh-btn:disabled{opacity:0.6;cursor:wait;}
.briefing-inline-bullets{
  list-style:none;padding:0;margin:14px 0 0 0;
  display:flex;flex-direction:column;gap:7px;
}
.briefing-inline-bullets li{
  position:relative;padding-left:16px;
  font-size:14px;line-height:1.5;color:var(--text2);font-weight:500;
}
.briefing-inline-bullets li::before{
  content:'';position:absolute;left:0;top:8px;
  width:5px;height:5px;border-radius:50%;
  background:var(--accent);
}
.briefing-inline-bullets li strong{color:var(--text);font-weight:700;}

/* v25b: TABBED SIDEBAR CSS removed — single trending column now (see Sidebar component) */

/* MOBILE overrides for v19 additions */
@media (max-width:900px){
  .hero-band{grid-template-columns:1fr;gap:16px;}
  .hero-band-img{min-height:unset;aspect-ratio:16/10;max-height:380px;}
  .hero-band-title{font-size:28px;font-weight:800;}
}
@media (max-width:640px){
  .hero-band{gap:12px;margin-bottom:24px;}
  .hero-band-lead{border-radius:10px;}
  .hero-band-img{aspect-ratio:16/10;max-height:260px;min-height:200px;}
  .hero-band-text-overlay{padding:16px 14px 16px;}
  .hero-band-title{font-size:20px;letter-spacing:-0.015em;-webkit-line-clamp:3;}
  .hero-band-desc{-webkit-line-clamp:2;font-size:13px;}
  .hero-band-badge{font-size:9px;padding:3px 7px;margin-bottom:8px;}
  .hero-band-side-label{display:none;} /* redundant under hero on mobile */
  .hero-band-side-thumb{width:64px;height:48px;}
  .hero-band-side-title{font-size:13px;-webkit-line-clamp:2;}
  .hero-band-side-item{padding:10px 0;min-height:52px;}
  .briefing-inline-head{flex-wrap:wrap;gap:10px;}
  .briefing-inline-label-row{width:100%;}
  .briefing-inline-ts{margin-left:auto;}
  .briefing-inline-refresh-btn{min-height:36px;padding:8px 12px;}
  .briefing-inline-bullets li{font-size:13px;}
}



/* MORNING BRIEFING INLINE — no card, just typography under hero */
.briefing-inline{
  /* v22b: Now the top section of Today. Gets a stronger frame with a left
     accent bar to read like Morning Brew / Axios feature article. */
  margin: 0 0 32px;
  padding: 20px 24px;
  border: none;
  border-left: 4px solid var(--accent);
  background: var(--surface);
  border-radius: 0 var(--radius) var(--radius) 0;
}
.briefing-inline-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;
}
.briefing-inline-label{
  font-size:12px;font-weight:800;color:var(--text);
  text-transform:uppercase;letter-spacing:0.1em;
}
.briefing-inline-sources{
  display:flex;flex-wrap:wrap;gap:6px;
  margin:0 0 14px 0;
}
.briefing-src-pill{
  font-size:10px;font-weight:600;color:var(--text3);
  background:var(--surface2);border:1px solid var(--border);
  border-radius:12px;padding:3px 8px;
  letter-spacing:0.02em;white-space:nowrap;
}
.briefing-inline-refresh{
  background:none;border:none;color:var(--text3);
  font-size:14px;cursor:pointer;padding:4px 8px;border-radius:6px;
  transition:color 0.15s,background 0.15s;
  font-family:inherit;
}
.briefing-inline-refresh:hover:not(:disabled){color:var(--accent);background:var(--surface2);}
.briefing-inline-refresh:disabled{opacity:0.5;cursor:wait;}
.briefing-inline-body{
  /* v22b: bumped readability — better leading, brighter text */
  font-size:17px;line-height:1.62;color:var(--text);
  font-weight:400;letter-spacing:-0.2px;
  margin:0;
  font-family: 'Inter', 'Helvetica Neue', system-ui, sans-serif;
}
.briefing-inline-body strong{font-weight:700;color:var(--text);}
.briefing-inline-empty{
  font-size:13px;color:var(--text3);font-style:italic;margin:0;
}

/* TODAY page — single column, no sidebar, generous whitespace */
.today-flow{display:block;max-width:1080px;margin:0 auto;}
.today-section{margin-bottom:36px;}
.today-section-head{
  display:flex;align-items:baseline;justify-content:space-between;
  margin-bottom:14px;padding:0;
}
.today-section-label{
  font-size:11px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.12em;
  display:flex;align-items:baseline;gap:8px;
}
.today-section-cat{color:var(--text);font-weight:800;}
.today-section-link{
  background:none;border:none;color:var(--text3);
  font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
  padding:4px 0;transition:color 0.15s;
}
.today-section-link:hover{color:var(--accent);}

/* Ghost feed item — used in Today section lists. v18: borderless, gap-based. */
.gf-item{
  display:flex;gap:14px;align-items:flex-start;
  padding:12px 0;cursor:pointer;
  transition:background 0.15s;
  border-radius:8px;
}
.gf-item:hover{background:var(--surface2);margin:0 -12px;padding:12px;}
.gf-thumb,.gf-thumb-ph{
  width:80px;height:60px;flex-shrink:0;
  border-radius:6px;background-size:cover;background-position:center;
  background-color:var(--surface2);
}
.gf-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.gf-title{
  font-size:14px;font-weight:600;color:var(--text);
  line-height:1.35;letter-spacing:-0.2px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.gf-meta{
  font-size:11px;color:var(--text3);
  display:flex;align-items:center;gap:6px;
}
.gf-meta-cat{font-weight:700;}

/* GHOST treatment overrides — strip card chrome from secondary blocks */
.rn-strip{background:transparent;border:none;padding:8px 0;border-radius:0;}
.follow-card{background:transparent;border:none;padding:6px 0;}
.follow-card:hover{transform:none;border:none;background:var(--surface2);padding:6px 8px;margin:-0 -8px;border-radius:6px;}
.trending-card{background:transparent;border:none;padding:8px 0;}
.trending-card:hover{transform:none;border:none;background:var(--surface2);padding:8px 10px;margin:0 -10px;border-radius:8px;}

/* Podcast cards — Ghost */
.pod-card{background:transparent!important;border:none!important;box-shadow:none!important;}
.pod-card:hover{background:var(--surface2)!important;}

/* Social blocks — Ghost */
.social-block{background:transparent!important;border:none!important;}

/* Finance Ghost */
.fin-table{background:transparent;border:none;}
.fin-table thead th{background:transparent;border-bottom:1px solid var(--border);}
.fin-row{border-bottom:1px solid var(--border2);}



/* Topbar auto-hide (mobile scroll-direction aware) */
.topbar-wrap{transition:transform 0.28s cubic-bezier(.4,0,.2,1);}
.topbar-wrap.hidden{transform:translateY(-100%);}

/* Prevent rubber-band conflict with pull-to-refresh */
body{overscroll-behavior-y:contain;}

/* ─── MOBILE TOPBAR (hidden on desktop, shown ≤640px) ─── */
.mobile-top{display:none;background:var(--surface);border-bottom:1px solid var(--border);}
.mobile-header{display:flex;align-items:center;justify-content:space-between;padding:0 12px;height:48px;}
.mobile-logo{font-size:17px;font-weight:900;color:var(--text);letter-spacing:-0.8px;line-height:1;}
.mobile-logo span{color:var(--accent);}
.mobile-logo-sub{font-size:8px;color:var(--text3);letter-spacing:0.14em;text-transform:uppercase;font-weight:700;margin-top:1px;}
.mobile-actions{display:flex;gap:4px;align-items:center;}

/* v22: weather + ticker strip — mobile/iPad. Slim 28px horizontal scrollable row. */
.mobile-strip{
  display:flex;align-items:center;gap:14px;
  height:28px;padding:0 12px;
  border-top:1px solid var(--border2);
  overflow-x:auto;scrollbar-width:none;
  -webkit-overflow-scrolling:touch;
  background:var(--surface2);
}
.mobile-strip::-webkit-scrollbar{display:none;}
.mobile-strip-item{
  display:inline-flex;align-items:center;gap:5px;
  font-size:11px;white-space:nowrap;flex-shrink:0;
  text-decoration:none;color:var(--text2);cursor:pointer;
  padding:2px 0;
}
.mobile-strip-item.wx:active{opacity:0.7;}
.mobile-strip-item.tk:active{opacity:0.7;}
.mobile-strip-city{font-weight:700;color:var(--text);font-size:10px;text-transform:uppercase;letter-spacing:0.04em;}
.mobile-strip-temp{font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;}
.mobile-strip-sym{font-weight:800;font-size:11px;letter-spacing:-0.2px;font-variant-numeric:tabular-nums;}
.mobile-strip-chg{font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text3);}
.mobile-strip-chg.up{color:var(--green);}
.mobile-strip-chg.down{color:var(--red);}
.mobile-strip-div{width:1px;height:14px;background:var(--border);flex-shrink:0;}
.mobile-icon-btn{
  background:none;border:none;width:40px;height:40px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:var(--text2);font-size:18px;
  transition:background 0.12s;padding:0;
  -webkit-tap-highlight-color:transparent;
}
.mobile-icon-btn:active{background:var(--surface2);}

/* Horizontal chip bar — Yahoo News scrollable pills */
.chip-bar{
  display:flex;gap:0;align-items:center;
  padding:0 4px;height:44px;
  overflow-x:auto;scrollbar-width:none;
  -webkit-overflow-scrolling:touch;
  scroll-snap-type:x proximity;
  border-top:1px solid var(--border2);
}
.chip-bar::-webkit-scrollbar{display:none;}
.chip{
  flex-shrink:0;scroll-snap-align:start;
  background:none;border:none;
  padding:8px 14px;margin:0 2px;
  font-size:13px;font-weight:600;font-family:inherit;
  color:var(--text3);cursor:pointer;white-space:nowrap;
  border-radius:20px;min-height:32px;
  display:flex;align-items:center;gap:5px;
  transition:color 0.15s,background 0.15s;
  -webkit-tap-highlight-color:transparent;
}
.chip:active{background:var(--surface2);}
.chip.active{color:#fff;font-weight:700;}

/* Mobile search slide-in */
.mobile-search{display:none;padding:8px 12px;border-top:1px solid var(--border2);}
.mobile-search.open{display:block;}
.mobile-search-input{
  width:100%;padding:10px 14px;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:22px;font-size:14px;font-family:inherit;color:var(--text);
}
.mobile-search-input:focus{outline:none;border-color:var(--accent);}

/* ─── BOTTOM TAB BAR (mobile only) ─── */
.bottom-tabs{
  display:none;
  position:fixed;bottom:0;left:0;right:0;
  background:var(--surface);border-top:1px solid var(--border);
  z-index:400;height:56px;
  padding-bottom:env(safe-area-inset-bottom, 0);
}
.bottom-tabs-inner{display:grid;grid-template-columns:repeat(4,1fr);height:100%;}
.bottom-tab{
  background:none;border:none;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;cursor:pointer;font-family:inherit;
  color:var(--text3);transition:color 0.12s;padding:6px 4px;
  -webkit-tap-highlight-color:transparent;
}
.bottom-tab:active{background:var(--surface2);}
.bottom-tab-icon{font-size:20px;line-height:1;}
.bottom-tab-label{font-size:10px;font-weight:600;letter-spacing:0.01em;}
.bottom-tab.active{color:var(--accent);}

/* ─── MENU SHEET (bottom-sheet for overflow nav) ─── */
.menu-sheet-overlay{
  position:fixed;inset:0;background:rgba(0,0,0,0.35);
  z-index:500;display:flex;align-items:flex-end;
  backdrop-filter:blur(3px);animation:fade-in 0.15s ease-out;
}
@keyframes fade-in{from{opacity:0;}to{opacity:1;}}
.menu-sheet{
  background:var(--surface);width:100%;max-height:80vh;overflow-y:auto;
  border-radius:16px 16px 0 0;
  padding:8px 0 calc(env(safe-area-inset-bottom, 0) + 12px);
  animation:sheet-up 0.22s cubic-bezier(.4,0,.2,1);
}
@keyframes sheet-up{from{transform:translateY(100%);}to{transform:translateY(0);}}
.menu-sheet-grab{width:36px;height:4px;border-radius:2px;background:var(--text4);margin:8px auto 14px;}
.menu-sheet-head{padding:0 20px 10px;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;border-bottom:1px solid var(--border2);margin-bottom:4px;}
.menu-sheet-item{
  display:flex;align-items:center;gap:14px;
  padding:14px 20px;cursor:pointer;
  color:var(--text);font-size:15px;font-weight:600;
  transition:background 0.1s;min-height:52px;
  border:none;background:none;width:100%;text-align:left;font-family:inherit;
  -webkit-tap-highlight-color:transparent;
}
.menu-sheet-item:active{background:var(--surface2);}
.menu-sheet-item-emoji{font-size:20px;width:24px;text-align:center;}
.menu-sheet-item-label{flex:1;}
.menu-sheet-item.active .menu-sheet-item-label{color:var(--accent);}
.menu-sheet-item-chevron{color:var(--text3);font-size:14px;}
.menu-sheet-divider{height:1px;background:var(--border2);margin:6px 0;}

/* ─── PULL-TO-REFRESH INDICATOR ─── */
.ptr-indicator{
  position:fixed;top:0;left:50%;transform:translateX(-50%);
  z-index:250;width:36px;height:36px;border-radius:50%;
  background:var(--surface);border:1px solid var(--border);
  box-shadow:var(--shadow-md);
  display:flex;align-items:center;justify-content:center;
  color:var(--accent);font-size:16px;font-weight:700;
  pointer-events:none;transition:opacity 0.15s;
}
.ptr-indicator.hidden{opacity:0;}
.ptr-indicator.refreshing .ptr-spin{animation:spin 0.8s linear infinite;}
@keyframes spin{from{transform:rotate(0);}to{transform:rotate(360deg);}}

/* ─── RIGHT NOW STRIP (urgent + scores + market moves unified) ─── */
.rn-strip{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
  padding:10px 14px;margin-bottom:20px;
  display:flex;align-items:center;gap:14px;
  overflow-x:auto;scrollbar-width:none;
}
.rn-strip::-webkit-scrollbar{display:none;}
.rn-label{
  font-size:10px;font-weight:800;color:var(--red);
  text-transform:uppercase;letter-spacing:0.1em;
  white-space:nowrap;flex-shrink:0;
  display:flex;align-items:center;gap:5px;
}
.rn-pulse{width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse-badge 1.4s ease-in-out infinite;}
.rn-items{display:flex;gap:18px;align-items:center;flex:1;min-width:0;}
.rn-item{
  display:flex;align-items:center;gap:6px;
  font-size:12px;white-space:nowrap;cursor:pointer;flex-shrink:0;
  padding:4px 0;color:var(--text2);
  transition:color 0.12s;
}
.rn-item:hover{color:var(--text);}
.rn-item.urgent{color:var(--red);}
.rn-item.urgent .rn-item-text{font-weight:700;color:var(--red);}
.rn-item-kind{font-size:13px;}
.rn-item-text{font-weight:600;}
.rn-item-val{font-weight:700;font-variant-numeric:tabular-nums;}
.rn-item-val.up{color:var(--green);}
.rn-item-val.down{color:var(--red);}
.rn-divider{width:1px;height:14px;background:var(--border);flex-shrink:0;}
.rn-empty{font-size:12px;color:var(--text3);font-style:italic;}

/* ─── FOLLOWING STRIP (Yahoo Sports "My Teams" generalized) ─── */
.follow-strip{margin-bottom:24px;}
.follow-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;padding:0 2px;
}
.follow-title{
  font-size:11px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;
  display:flex;align-items:center;gap:6px;
}
.follow-edit{background:none;border:none;color:var(--text3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;padding:0;transition:color 0.12s;}
.follow-edit:hover{color:var(--accent);}
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
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:10px 12px;
  min-width:220px;max-width:260px;
  cursor:pointer;transition:border-color 0.15s,transform 0.15s;
  display:flex;flex-direction:column;gap:6px;
}
.follow-card:hover{border-color:var(--accent);transform:translateY(-1px);}
.follow-card-head{display:flex;align-items:center;gap:8px;}
.follow-card-emoji{font-size:18px;line-height:1;}
.follow-card-name{font-size:12px;font-weight:800;color:var(--text);letter-spacing:-0.2px;}
.follow-card-kind{
  font-size:8px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.08em;margin-left:auto;
}
.follow-card-ticker{
  font-size:10px;font-weight:700;color:var(--accent);
  font-family:'SF Mono','Cascadia Code','Consolas',monospace;
  font-variant-numeric:tabular-nums;margin-left:auto;
  display:flex;align-items:center;gap:4px;
}
.follow-card-ticker.up{color:var(--green);}
.follow-card-ticker.down{color:var(--red);}
.follow-card-headline{
  font-size:12px;font-weight:600;color:var(--text2);line-height:1.4;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.follow-card-empty{font-size:11px;color:var(--text3);font-style:italic;}
.follow-card-meta{font-size:10px;color:var(--text3);margin-top:auto;}

/* ─── TRENDING INLINE CAROUSEL (moved from sidebar on Today) ─── */
.trending-inline{margin-bottom:28px;}
.trending-inline-head{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;padding:0 2px;
}
.trending-inline-title{
  font-size:11px;font-weight:700;color:var(--text3);
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
  width:260px;background:var(--surface);
  border:1px solid var(--border);border-radius:var(--radius);
  padding:12px;cursor:pointer;
  transition:border-color 0.15s,transform 0.15s;
  display:flex;flex-direction:column;gap:8px;
}
.trending-card:hover{border-color:var(--accent);transform:translateY(-1px);}
.trending-card-meta{display:flex;align-items:center;gap:6px;}
.trending-card-badge{
  font-size:8px;font-weight:700;border-radius:4px;padding:1px 6px;
  letter-spacing:0.04em;text-transform:uppercase;
}
.trending-card-num{font-size:14px;font-weight:900;color:var(--text4);font-variant-numeric:tabular-nums;}
.trending-card-title{
  font-size:13px;font-weight:700;color:var(--text);line-height:1.35;letter-spacing:-0.2px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.trending-card-src{font-size:10px;color:var(--text3);margin-top:auto;}

/* ─── LAST UPDATED (per-feed timestamp) ─── */
.last-updated{
  font-size:10px;color:var(--text3);font-weight:500;
  display:inline-flex;align-items:center;gap:4px;
}
.last-updated-dot{width:5px;height:5px;border-radius:50%;background:var(--green);}
.last-updated-dot.stale{background:var(--amber);}

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
/* v20: Sidebar collapse at 1100px so iPad landscape (1180px) gets full 2-col
   but cramped widths collapse early. iPad portrait (810px) still hits the
   900px block below for nav/logo tightening. */
@media (max-width:1100px){
  .page-grid,.pod-page,.today-main,.fin-grid{grid-template-columns:1fr!important;gap:20px;}
  .hero-row{grid-template-columns:1fr;}
  .today-grid{grid-template-columns:1fr;}
  .sidebar{order:2;}.feed-col{order:1;}
  .fin-indices{grid-template-columns:1fr;}
}
@media (max-width:900px){
  .bloom-strip{grid-template-columns:1fr 1fr;}
  .nav-bar-inner{gap:6px;}
  .logo{font-size:16px;}
  .search-input{width:80px;}
}

/* ═══════════════════════════════════════════
   MOBILE (≤640px) — editorial vertical flow
   BBC News mobile: full-width cards, large serif
   headlines, clear category labels, generous spacing
═══════════════════════════════════════════ */
@media (max-width:640px){
  .whisper-bar{display:none;}
  .nav-bar{display:none;}
  .mobile-top{display:block;}
  .bottom-tabs{display:block;}

  /* Pill bar: compact on mobile — 4 pills visible */
  .pill-bar{padding:0;}
  .pill{min-width:110px;padding:7px 12px;gap:7px;}
  .pill-icon{font-size:15px;}
  .pill-label{font-size:8px;}
  .pill-value{font-size:13px;}
  .pill-chg{font-size:9px;padding:1px 5px;}

  body{padding-bottom:calc(58px + env(safe-area-inset-bottom, 0));}
  .page{padding:14px 14px 24px;}

  /* Hero — full-bleed on mobile for maximum impact */
  .hero-row{grid-template-columns:1fr;gap:12px;margin:-12px -12px 16px;}
  .hero-lead{border-radius:0;border-left:none;border-right:none;box-shadow:none;}
  .hero-lead:hover{box-shadow:none;transform:none;}
  .hero-lead-img{aspect-ratio:16/9;max-height:200px;}
  .hero-lead-text{padding:14px 14px 16px;}
  /* Smaller but still serif on mobile — BBC pattern */
  .hero-lead-title{font-size:21px;letter-spacing:-0.2px;-webkit-line-clamp:3;}
  .hero-lead-desc{-webkit-line-clamp:2;font-size:13px;}
  .hero-arrow{width:30px;height:30px;font-size:16px;}
  .hero-prev{left:8px;}.hero-next{right:8px;}
  .hero-side{display:none;}

  .breaking-bar{height:26px;}
  .breaking-item{font-size:10px;}
  .breaking-ticker-inner{animation-duration:55s;gap:36px;}

  .rn-strip{padding:8px 12px;margin-bottom:14px;gap:10px;border-radius:6px;}
  .rn-items{gap:12px;}
  .rn-item{font-size:11px;}

  .follow-strip{margin-bottom:18px;}
  .follow-card{min-width:180px;max-width:210px;padding:9px 11px;}
  .follow-card-name{font-size:11px;}
  .follow-card-headline{font-size:11px;-webkit-line-clamp:2;}

  .trending-inline{margin-bottom:20px;}
  .trending-card{width:220px;padding:11px;}
  .trending-card-title{font-size:12px;}

  .bloom-strip{grid-template-columns:1fr;}
  .bloom-strip-item{border-right:none;border-bottom:1px solid var(--border2);}
  .bloom-strip-item:last-child{border-bottom:none;}

  /* FEED CARDS — Yahoo News mobile: small left thumb + compact headline right */
  .fc{
    padding:13px 0 13px 12px;
    border-left-width:3px;
    margin-left:0;
  }
  .fc:hover{background:var(--surface2);border-left-color:var(--accent);}
  .fc:active{background:var(--surface2);}
  /* Horizontal layout: thumb left, text right — Yahoo News pattern */
  .fc-body{flex-direction:row;gap:8px;align-items:flex-start;}
  .fc-thumb,.fc-thumb-ph{width:90px;height:68px;flex-shrink:0;border-radius:6px;}
  .fc-text{flex:1;min-width:0;}
  .fc-title{font-size:15px;-webkit-line-clamp:3;letter-spacing:0;line-height:1.3;font-weight:700;}
  .fc-desc{display:none;}
  .fc-meta{margin-bottom:5px;order:-1;font-size:10px;}
  .fc-act{padding:6px 10px;font-size:11px;min-height:36px;border-radius:18px;}
  .fc-mobile-more-btn{background:var(--surface2);color:var(--text2);}
  .fc-actions{gap:4px;margin-top:6px;flex-wrap:wrap;}
  .fc-read-link{font-size:11px;margin-left:auto;min-height:36px;display:flex;align-items:center;}

  /* Morning briefing */
  .briefing{margin-bottom:18px;border-radius:var(--radius);}
  .briefing-head{padding:13px 16px 11px;}
  .briefing-title{font-size:15px;}
  .briefing-body{padding:13px 16px 15px;}
  .briefing-overview{font-size:13px;line-height:1.7;}

  .today-main{gap:12px;}
  .today-grid{gap:10px;}
  .today-block-head{padding:10px 12px 8px;}
  .today-item{padding:10px 12px;min-height:52px;}
  .today-thumb,.today-thumb-ph{width:56px;height:42px;}
  .today-item-title{font-size:12px;}
  .today-ai-btn{padding:8px 12px;font-size:13px;min-height:44px;min-width:44px;}

  .social-page-grid{grid-template-columns:1fr;}
  .social-page-header{flex-direction:column;align-items:stretch;}
  .sb-games{padding:4px 6px 8px;}
  .sb-league-head{padding:10px 12px;min-height:44px;}
  .sidebar{display:none;} /* sidebar hidden on mobile — content only */

  .pod-page{gap:20px;}
  .pod-card{padding:12px;}
  .pod-btn{padding:8px 12px;font-size:11px;min-height:44px;}
  .pod-show-item{padding:12px 0;min-height:44px;}

  .cp-overlay{padding:0;align-items:flex-end;}
  .cp-panel{max-width:100%;max-height:92vh;border-radius:16px 16px 0 0;}
  .cp-cat-tab,.cp-plat-tab{padding:8px 12px;font-size:11px;min-height:36px;}
  .cp-chip{padding:7px 12px;font-size:11px;min-height:36px;}
  .cp-input,.cp-input-sm{padding:9px 12px;font-size:13px;min-height:44px;}
  .cp-btn{padding:9px 13px;font-size:12px;min-height:44px;}
  .cp-save{padding:13px;font-size:14px;min-height:48px;}

  .fin-table td{padding:9px 8px;font-size:11px;}
  .fin-table thead th{padding:7px 8px;}
  .fin-name{display:none;}
  .fin-table thead th:nth-child(2){display:none;}

  .page-customize-btn{font-size:12px;min-height:40px;}
}

@media (max-width:380px){
  .fc-thumb,.fc-thumb-ph{width:78px;height:60px;}
  .fc-title{font-size:14px;}
  .hero-lead-title{font-size:17px;}
  .follow-card{min-width:160px;max-width:180px;}
  .trending-card{width:200px;}
}

@media (hover:none){
  button,a,.src-row,.trend-row,.today-item,.fc,.pod-card{-webkit-tap-highlight-color:rgba(29,78,216,0.08);}
}

/* ── iPad / tablet (641px–1024px) ──────────────────────────────────────────── */
@media (min-width:641px) and (max-width:1024px){
  .page{padding:20px 18px;}
  .page-grid{grid-template-columns:1fr;gap:20px;}
  .home-hero-row{grid-template-columns:1fr;gap:16px;}
  .home-hero-side{max-width:100%;}
  .gn-grid{grid-template-columns:1fr 1fr;gap:16px;}
  /* Use 16/9 aspect + max-height to prevent overflow on iPad portrait (810px) */
  .gn-card-img,.gn-card-img-ph{aspect-ratio:16/9;height:auto;max-height:170px;}
  .gn-lead-img{aspect-ratio:16/9;height:auto;max-height:220px;}
  .gn-lead-title{font-size:26px;}
  .gn-lead-solo .gn-lead-title{font-size:28px;}
  .fc-title{font-size:16px;}
  .fc-thumb,.fc-thumb-ph{width:120px;height:90px;}
  .sport-tabs{gap:6px;}
  .sport-tab{padding:7px 12px;font-size:13px;}
  .sidebar{display:none;}
  /* Show slimmed sidebar on iPad landscape (≥900px) */
}

/* ═══════════════════════════════════════════
   v26 ADDITIONS
═══════════════════════════════════════════ */

/* Ghost card: fixed padding always (no layout jump on hover) */
.fc{padding:20px 14px;margin:0 -14px;}
.fc:hover{background:var(--surface2);}

/* Already-read state — muted but still visible */
.fc-read{opacity:0.6;}
.fc-read .fc-title{color:var(--text2);}

/* Breaking news: bigger serif + crimson — TIME urgent treatment */
.fc-title-breaking{
  font-size:21px!important;font-weight:900!important;
  color:var(--accent)!important; /* crimson for breaking — TIME signature */
}

/* Paywall badge */
.fc-paywall-badge{font-size:11px;cursor:default;flex-shrink:0;}

/* Cluster badge — "N sources" indicator */
.fc-cluster-badge{
  font-size:9px;font-weight:700;color:#7c3aed;background:#f5f3ff;
  border-radius:4px;padding:2px 7px;letter-spacing:0.04em;cursor:default;
}
.dark .fc-cluster-badge{background:#2d1f5a;color:#a78bfa;}

/* Category placeholder image with gradient */
.gn-card-img-ph{
  display:flex;align-items:center;justify-content:center;
  font-size:22px;
}

/* v26: Why It Matters — gold callout under AI panel */
.fc-why{background:linear-gradient(135deg,#fbf5e8 0%,#f9eed2 100%);border-left:3px solid #b8893d;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:8px;}
.dark .fc-why{background:linear-gradient(135deg,#2a1f0a 0%,#1f1505 100%);}
.fc-why-lbl{font-size:9px;font-weight:700;color:#b8893d;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
.fc-why-line{font-size:12px;line-height:1.45;color:#5a4a1f;margin-bottom:4px;}
.dark .fc-why-line{color:#d4b878;}
.fc-why-line:last-child{margin-bottom:0;}

/* v26: General homepage 2-col hero (lead left, briefing right)
   TIME-style: big serif headline left, editorial briefing right */
.home-hero-row{display:grid;grid-template-columns:1.7fr 1fr;gap:28px;margin-bottom:36px;padding-bottom:28px;border-bottom:2px solid var(--border);}
.home-hero-side .briefing-teaser{margin-bottom:0;height:100%;}
.gn-lead-solo{cursor:pointer;transition:opacity 0.15s;}
.gn-lead-solo:hover{opacity:0.92;}
.gn-lead-solo .gn-lead-img{border-radius:var(--radius);margin-bottom:16px;}
/* TIME-magazine lead headline: largest Playfair Display on the page */
.gn-lead-solo .gn-lead-title{
  font-family:var(--font-serif);
  font-size:32px;font-weight:700;line-height:1.15;letter-spacing:-0.3px;
  color:var(--text);margin:0 0 12px;max-width:720px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-lead-solo .gn-lead-desc{
  font-family:var(--font-sans);
  font-size:15px;line-height:1.6;color:var(--text2);margin:0 0 12px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-lead-solo .gn-lead-meta{font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px;font-family:var(--font-sans);}
@media (max-width:900px){.home-hero-row{grid-template-columns:1fr;gap:16px;}.gn-lead-solo .gn-lead-title{font-size:26px;}}
@media (max-width:640px){.home-hero-row{margin-bottom:20px;padding-bottom:18px;}.gn-lead-solo .gn-lead-title{font-size:22px;-webkit-line-clamp:3;}}

/* v26: Sticky filter pill */
.sticky-filter{position:sticky;top:96px;z-index:5;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--border2);}
@media (max-width:640px){.sticky-filter{top:88px;}}

/* v26: Web search fallback + source recommendations */
.web-fallback{margin-top:20px;}
.web-result{display:block;padding:12px 14px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;text-decoration:none;color:inherit;transition:border-color 0.12s;}
.web-result:hover{border-color:var(--accent);background:var(--surface2);}
.web-result-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;}
.web-result-desc{font-size:12px;color:var(--text2);line-height:1.45;margin-bottom:6px;}
.web-result-src{font-size:10px;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;}
.source-recs{margin-top:20px;padding:14px;background:linear-gradient(135deg,#fbf5e8 0%,#f9eed2 100%);border-left:3px solid #b8893d;border-radius:0 8px 8px 0;}
.dark .source-recs{background:linear-gradient(135deg,#2a1f0a 0%,#1f1505 100%);}
.source-rec-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
.source-rec-btn{background:#fff;color:#b8893d;border:1px solid #b8893d;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
.source-rec-btn:hover{background:#b8893d;color:#fff;}
.dark .source-rec-btn{background:transparent;color:#d4b878;border-color:#d4b878;}

/* v26: Reading stats panel */
.stats-panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px 24px;margin-bottom:28px;}
.stats-head{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;}
.stats-grid{display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap;}
.stat-block{text-align:center;min-width:60px;}
.stat-num{font-size:28px;font-weight:900;color:var(--text);letter-spacing:-1px;font-variant-numeric:tabular-nums;}
.stat-label{font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;}
.stats-sub-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
.stats-sources{margin-bottom:14px;}
.stats-source-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.stats-source-name{font-size:12px;font-weight:600;color:var(--text2);width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;}
.stats-source-bar{height:4px;background:var(--accent);border-radius:2px;opacity:0.6;min-width:4px;transition:width 0.3s;}
.stats-source-cnt{font-size:11px;color:var(--text3);font-variant-numeric:tabular-nums;margin-left:4px;}
.stats-cats{}
.stats-cat-chips{display:flex;gap:6px;flex-wrap:wrap;}
.stats-cat-chip{font-size:11px;font-weight:600;border-radius:12px;padding:3px 10px;}

/* v26: Business + Finance card terminal-feel source label */
.gn-card.business .gn-card-source,.gn-card.finance .gn-card-source{
  font-family:'SF Mono','Cascadia Code','Consolas',monospace;letter-spacing:0;font-size:9px;
}

/* Dark mode: Bloomberg slate override */
.dark{
  --bg:#0d1117;--surface:#161d2b;--surface2:#1e2638;
  --border:#2a3347;--border2:#1e2638;
  --text:#e2e8f4;--text2:#8892b0;--text3:#4a5570;--text4:#1e2638;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:0 8px 32px rgba(0,0,0,0.6);
}

/* Skeleton loading shimmer for feed cards */
@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
.fc-skeleton{padding:20px 14px;border-bottom:1px solid var(--border2);}
.fc-skeleton-line{height:14px;border-radius:4px;background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:8px;}
.fc-skeleton-title{height:18px;width:80%;border-radius:4px;background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:10px;}

/* Keyboard hint */
kbd{display:inline-block;padding:1px 5px;border:1px solid var(--border);border-radius:3px;font-family:inherit;font-size:10px;color:var(--text3);background:var(--surface2);}

/* ═══════════════════════════════════════════
   v27 EDITORIAL ENHANCEMENTS
   TIME/BBC design refresh
═══════════════════════════════════════════ */

/* SECTION DIVIDER — editorial rule between sections (BBC pattern) */
.ed-section-head{
  display:flex;align-items:baseline;gap:12px;
  margin-bottom:20px;padding-bottom:10px;
  border-bottom:2px solid var(--text);
}
.ed-section-label{
  font-family:var(--font-sans);
  font-size:11px;font-weight:800;color:var(--text);
  text-transform:uppercase;letter-spacing:0.1em;
}
.ed-section-kicker{
  font-family:var(--font-sans);
  font-size:10px;font-weight:500;color:var(--text3);
}

/* LISTEN BUTTON — Web Speech TTS */
.fc-listen-btn{
  background:none;border:1px solid var(--border);
  border-radius:20px;padding:4px 11px;
  font-size:11px;cursor:pointer;color:var(--text3);
  font-family:var(--font-sans);font-weight:600;
  transition:all 0.12s;display:inline-flex;align-items:center;gap:5px;
}
.fc-listen-btn:hover{border-color:#0369a1;color:#0369a1;background:#f0f9ff;}
.fc-listen-btn.listening{border-color:#0369a1;color:#0369a1;background:#e0f2fe;animation:listen-pulse 1.4s ease-in-out infinite;}
@keyframes listen-pulse{0%,100%{box-shadow:0 0 0 0 rgba(3,105,161,0.3);}50%{box-shadow:0 0 0 4px rgba(3,105,161,0.08);}}
.listen-wave{display:inline-flex;align-items:center;gap:2px;height:12px;}
.listen-bar{width:2px;background:currentColor;border-radius:1px;animation:wave-bounce 1s ease-in-out infinite;}
.listen-bar:nth-child(1){height:4px;animation-delay:0s;}
.listen-bar:nth-child(2){height:8px;animation-delay:0.15s;}
.listen-bar:nth-child(3){height:12px;animation-delay:0.3s;}
.listen-bar:nth-child(4){height:8px;animation-delay:0.45s;}
.listen-bar:nth-child(5){height:4px;animation-delay:0.6s;}
@keyframes wave-bounce{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}

/* VOICE SELECTOR (audio settings) */
.voice-select{
  background:var(--surface2);border:1px solid var(--border);color:var(--text);
  border-radius:var(--radius-sm);padding:4px 8px;font-size:11px;
  font-family:var(--font-sans);cursor:pointer;
}

/* VIDEO FEATURE COMPONENT */
.video-feature{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);overflow:hidden;
  margin-top:32px;margin-bottom:0;
  max-width:680px;
}
.video-feature-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 16px;border-bottom:1px solid var(--border2);
}
.video-feature-label{
  font-family:var(--font-sans);
  font-size:10px;font-weight:800;color:var(--accent);
  text-transform:uppercase;letter-spacing:0.12em;
  display:flex;align-items:center;gap:6px;
}
.video-feature-label::before{content:'▶';font-size:8px;}
.video-feature-title{
  font-family:var(--font-serif);
  font-size:16px;font-weight:700;color:var(--text);
}
.video-embed{position:relative;padding-bottom:45%;height:0;overflow:hidden;}
.video-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;}
.video-embed-ph{
  position:relative;padding-bottom:45%;height:0;
  background:var(--navy);display:flex;align-items:center;justify-content:center;
  cursor:pointer;overflow:hidden;
}
.video-embed-ph-inner{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;
}
.video-play-btn{
  width:64px;height:64px;border-radius:50%;
  background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);
  border:2px solid rgba(255,255,255,0.4);
  display:flex;align-items:center;justify-content:center;
  font-size:24px;color:#fff;cursor:pointer;
  transition:all 0.2s;
}
.video-play-btn:hover{background:rgba(255,255,255,0.25);transform:scale(1.05);}
.video-play-caption{
  font-family:var(--font-sans);
  font-size:13px;color:rgba(255,255,255,0.8);font-weight:500;
  text-align:center;padding:0 24px;max-width:400px;
}
.video-tabs{
  display:flex;gap:0;padding:0 16px;border-bottom:1px solid var(--border2);
  overflow-x:auto;scrollbar-width:none;
}
.video-tabs::-webkit-scrollbar{display:none;}
.video-tab{
  background:transparent;border:none;color:var(--text3);
  padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;
  font-family:var(--font-sans);border-bottom:2px solid transparent;
  white-space:nowrap;transition:all 0.12s;
}
.video-tab.active{color:var(--accent);border-bottom-color:var(--accent);}
.video-tab:hover:not(.active){color:var(--text2);}

/* WEATHER WIDGET — improved editorial style */
.weather-widget{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:16px 18px;margin-bottom:20px;
  border-top:3px solid #0369a1;
}
.weather-widget-head{
  font-family:var(--font-sans);
  font-size:9px;font-weight:800;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;
}
.weather-city-row{
  display:flex;align-items:center;gap:12px;
  padding:8px 0;border-bottom:1px solid var(--border2);
}
.weather-city-row:last-child{border-bottom:none;}
.weather-city-emoji{font-size:22px;width:28px;text-align:center;flex-shrink:0;}
.weather-city-body{flex:1;min-width:0;}
.weather-city-name{
  font-family:var(--font-sans);
  font-size:11px;font-weight:700;color:var(--text);
  text-transform:uppercase;letter-spacing:0.06em;
}
.weather-city-desc{
  font-family:var(--font-sans);
  font-size:11px;color:var(--text3);margin-top:1px;
}
.weather-city-temp{
  font-family:var(--font-sans);
  font-size:22px;font-weight:700;color:var(--text);
  font-variant-numeric:tabular-nums;
}
.weather-city-wind{
  font-family:var(--font-sans);
  font-size:10px;color:var(--text3);font-weight:500;
  text-align:right;margin-top:2px;
}

/* PAGE SECTION HEADER — editorial rule style */
.page-header{
  font-family:var(--font-sans);
  font-size:10px;font-weight:800;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.12em;
}

/* Trend row titles — use serif for editorial sidebar feel */
.trend-title{
  font-family:var(--font-serif);
  font-size:13px;font-weight:700;color:var(--text);line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:3px;
}

/* Hero lead badge — editorial category label */
.hero-lead-badge{
  position:absolute;top:14px;left:14px;color:#fff;
  font-family:var(--font-sans);
  font-size:9px;font-weight:800;
  padding:4px 10px;border-radius:2px;letter-spacing:0.12em;text-transform:uppercase;
  background:var(--accent);
}

/* Scoreboard: editorial navy header */
.sb-box{
  background:var(--surface);border-radius:var(--radius);
  border:1px solid var(--border);overflow:hidden;
}
.sb-box-head{
  padding:10px 14px 8px;border-bottom:1px solid var(--border2);
  display:flex;align-items:center;justify-content:space-between;
  background:var(--navy);
}
.sb-box-title{
  font-family:var(--font-sans);
  font-size:11px;font-weight:800;color:rgba(255,255,255,0.9);
  text-transform:uppercase;letter-spacing:0.08em;
}
.sb-box-sub{font-size:9px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;}

/* MOBILE CHIP BAR — editorial category pills */
.chip-bar{
  display:flex;gap:0;overflow-x:auto;scrollbar-width:none;
  background:var(--navy);border-bottom:1px solid rgba(255,255,255,0.08);
  padding:0;
}
.chip-bar::-webkit-scrollbar{display:none;}
.chip{
  flex-shrink:0;background:transparent;border:none;
  color:rgba(255,255,255,0.6);
  padding:10px 16px;font-size:11px;font-weight:700;cursor:pointer;
  font-family:var(--font-sans);
  text-transform:uppercase;letter-spacing:0.06em;
  border-bottom:2px solid transparent;
  transition:all 0.12s;white-space:nowrap;
}
.chip.active{color:#fff;border-bottom-color:#fff;}
.chip:hover:not(.active){color:rgba(255,255,255,0.85);}

/* MOBILE HEADER — editorial masthead */
.mobile-header{
  background:var(--surface);
  border-top:3px solid var(--accent);
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 16px;border-bottom:1px solid var(--border);
}
.mobile-logo{
  font-family:var(--font-serif);
  font-size:20px;font-weight:700;color:var(--text);line-height:1;
}
.mobile-logo span{color:var(--accent);}
.mobile-logo-sub{
  font-family:var(--font-sans);
  font-size:8px;color:var(--text3);letter-spacing:0.16em;text-transform:uppercase;margin-top:2px;
}
.mobile-icon-btn{
  background:transparent;border:1px solid var(--border);color:var(--text3);
  border-radius:var(--radius-sm);padding:6px 10px;
  font-size:14px;cursor:pointer;font-family:var(--font-sans);transition:all 0.12s;
}
.mobile-icon-btn:hover{color:var(--text);border-color:var(--text3);}
.mobile-actions{display:flex;gap:6px;}

/* BOTTOM TABS — editorial section icons */
.bottom-tabs{
  position:fixed;bottom:0;left:0;right:0;
  background:var(--surface);
  border-top:2px solid var(--accent);
  display:flex;z-index:200;
  padding-bottom:env(safe-area-inset-bottom, 0);
  box-shadow:0 -2px 16px rgba(0,0,0,0.08);
}
.bottom-tab{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:8px 4px 6px;background:transparent;border:none;cursor:pointer;
  font-family:var(--font-sans);
  font-size:9px;font-weight:700;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.06em;gap:3px;
  min-height:52px;transition:color 0.12s;
}
.bottom-tab.active{color:var(--accent);}
.bottom-tab:hover:not(.active){color:var(--text2);}
.bottom-tab-icon{font-size:18px;line-height:1;}

/* Smooth page transitions */
.page{
  animation:page-enter 0.18s ease-out;
}
@keyframes page-enter{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}

/* iPad 2-col: bridge desktop and mobile gracefully */
@media (min-width:641px) and (max-width:1100px){
  .page-grid{grid-template-columns:1fr 260px!important;gap:28px!important;}
  .hero-lead-title{font-size:22px;}
  .fc-title{font-size:17px;}
  .gn-lead-solo .gn-lead-title{font-size:28px;}
}

/* Finance page: editorial serif section headers */
.fin-header-title{
  font-family:var(--font-serif);
  font-size:22px;font-weight:700;color:var(--text);letter-spacing:0;
}

/* Reading stats: editorial typography */
.stat-num{
  font-family:var(--font-serif);
  font-size:32px;font-weight:700;color:var(--text);letter-spacing:-1px;font-variant-numeric:tabular-nums;
}

/* Dark mode: Bloomberg slate — final override */
.dark{
  --bg:#0d1117;--surface:#161d2b;--surface2:#1e2638;
  --border:#2a3347;--border2:#1e2638;
  --text:#e2e8f4;--text2:#8892b0;--text3:#4a5570;--text4:#1e2638;
  --shadow-sm:0 1px 4px rgba(0,0,0,0.4);
  --shadow-md:0 4px 20px rgba(0,0,0,0.5);
  --shadow-lg:0 8px 40px rgba(0,0,0,0.6);
}

/* Podcast card serif title */
.pod-title{
  font-family:var(--font-serif);
  font-size:16px;font-weight:700;color:var(--text);line-height:1.3;
  cursor:pointer;margin-bottom:6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.pod-title:hover{color:var(--accent);}

/* gn-grid: editorial card titles use serif */
.gn-lead-title{
  font-family:var(--font-serif);
  font-size:22px;font-weight:700;line-height:1.2;letter-spacing:-0.2px;
  color:var(--text);margin:0 0 10px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.gn-card-title{
  font-family:var(--font-serif);
  font-size:15px;font-weight:700;line-height:1.3;color:var(--text);
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
  margin-bottom:8px;letter-spacing:-0.1px;
}
.gn-lead-source,.gn-card-source{
  font-family:var(--font-sans);
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;
}

/* Briefing teaser: editorial serif + crimson accent line */
.briefing-teaser{
  border-top:3px solid var(--accent);
  border:1px solid var(--border);border-top:3px solid var(--accent);
  border-radius:var(--radius);padding:16px 18px;
  background:var(--surface);height:100%;
}
.briefing-teaser-label{
  font-family:var(--font-sans);
  font-size:9px;font-weight:800;color:var(--accent);
  text-transform:uppercase;letter-spacing:0.12em;
}
.briefing-teaser-body{
  font-family:var(--font-sans);
  font-size:13px;line-height:1.65;color:var(--text2);margin:12px 0;
}
.briefing-teaser-bullets{
  margin:8px 0 0 16px;
  font-family:var(--font-sans);
  font-size:12px;color:var(--text2);line-height:1.55;
}
.briefing-teaser-bullets li{margin-bottom:5px;}
.briefing-teaser-cta{
  background:var(--accent);color:#fff;border:none;
  border-radius:var(--radius-sm);padding:6px 12px;
  font-size:11px;font-weight:700;cursor:pointer;
  font-family:var(--font-sans);transition:opacity 0.12s;
}
.briefing-teaser-cta:hover{opacity:0.88;}

/* Today block serif label */
.today-block-label{
  font-family:var(--font-serif);
  font-size:13px;font-weight:700;display:flex;align-items:center;gap:5px;
}

/* Sidebar trend numbers — editorial large */
.trend-num{
  font-family:var(--font-serif);
  font-size:18px;font-weight:700;color:var(--accent);
  min-width:22px;line-height:1;flex-shrink:0;font-variant-numeric:tabular-nums;
}

/* Briefing inline: editorial styles */
.briefing-inline{
  background:var(--surface);border:1px solid var(--border);
  border-top:3px solid var(--accent);
  border-radius:var(--radius);padding:20px 24px;margin-bottom:24px;
}
.briefing-inline-label{
  font-family:var(--font-serif);
  font-size:17px;font-weight:700;color:var(--text);
}
.briefing-inline-body{
  font-family:var(--font-sans);
  font-size:14px;line-height:1.7;color:var(--text2);margin:14px 0;
}
.briefing-inline-bullets{
  margin:0 0 4px 18px;
  font-family:var(--font-sans);
  font-size:13px;color:var(--text2);line-height:1.6;
}
.briefing-inline-bullets li{margin-bottom:6px;}

/* FC actions: smooth hover states */
.fc-actions{
  display:flex;align-items:center;gap:6px;margin-top:12px;flex-wrap:wrap;
}
.fc-act{
  background:none;border:1px solid var(--border);border-radius:20px;
  padding:4px 11px;font-size:11px;cursor:pointer;color:var(--text3);
  font-family:var(--font-sans);font-weight:600;transition:all 0.12s;
  display:flex;align-items:center;gap:4px;
}
.fc-act:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-bg);}
.fc-act:active{transform:scale(0.96);}
.fc-act.saved{border-color:var(--amber);color:var(--amber);background:#fffbeb;}
.fc-act.ai-on{border-color:#7c3aed;color:#7c3aed;background:#f5f3ff;}
.fc-act.disc-on{border-color:#0ea5e9;color:#0ea5e9;background:#f0f9ff;}
.fc-read-link{
  margin-left:auto;font-size:10px;color:var(--text3);
  text-decoration:none;font-weight:700;display:flex;align-items:center;gap:2px;
  transition:color 0.1s;font-family:var(--font-sans);letter-spacing:0.02em;
}
.fc-read-link:hover{color:var(--accent);}

/* ═══════════════════════════════════════════
   v28 ADDITIONS — Explain panel, active scores, trending search, responsive
═══════════════════════════════════════════ */

/* LEARNING COMPANION — "Explain This" panel (amber editorial feel) */
.fc-explain{
  margin-top:10px;background:linear-gradient(135deg,#fffbf0 0%,#fef3c7 100%);
  border:1px solid #fde68a;border-radius:8px;padding:12px 14px;
}
.dark .fc-explain{background:linear-gradient(135deg,#2a1f08 0%,#1e1504 100%);border-color:#4a3500;}
.fc-explain-lbl{
  font-size:9px;font-weight:800;color:#b45309;
  text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;
  display:flex;align-items:center;gap:6px;
}
.dark .fc-explain-lbl{color:#fbbf24;}
.fc-explain-section{margin-bottom:10px;}
.fc-explain-section:last-child{margin-bottom:0;}
.fc-explain-head{font-size:11px;font-weight:800;color:#92400e;margin-bottom:3px;}
.dark .fc-explain-head{color:#fbbf24;}
.fc-explain-body{font-size:12px;line-height:1.55;color:#5a3a00;}
.dark .fc-explain-body{color:#d4b878;}
.fc-act.explain-on{border-color:#b45309;color:#b45309;background:#fffbeb;}

/* ACTIVE SCORES STRIP — compact live games on General homepage */
.home-scores{
  margin-bottom:20px;background:var(--surface);
  border:1px solid var(--border);border-radius:var(--radius);
  overflow:hidden;
}
.home-scores-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:8px 14px;background:var(--navy);
}
.home-scores-label{
  font-size:9px;font-weight:800;color:rgba(255,255,255,0.9);
  text-transform:uppercase;letter-spacing:0.12em;
  display:flex;align-items:center;gap:6px;
}
.home-scores-label::before{content:'●';color:var(--green);font-size:7px;animation:score-pulse 2s ease-in-out infinite;}
@keyframes score-pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
.home-scores-see-all{
  font-size:10px;font-weight:600;color:rgba(255,255,255,0.6);
  background:none;border:none;cursor:pointer;font-family:inherit;
}
.home-scores-see-all:hover{color:#fff;}
.home-scores-scroll{
  display:flex;overflow-x:auto;scrollbar-width:none;gap:0;
  -webkit-overflow-scrolling:touch;
}
.home-scores-scroll::-webkit-scrollbar{display:none;}
.hs-tile{
  flex-shrink:0;min-width:148px;padding:10px 14px;
  border-right:1px solid var(--border2);cursor:pointer;
  transition:background 0.12s;
}
.hs-tile:last-child{border-right:none;}
.hs-tile:hover{background:var(--surface2);}
.hs-league{font-size:9px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
.hs-team-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 0;}
.hs-team-name{font-size:12px;font-weight:600;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hs-team-score{font-size:16px;font-weight:900;color:var(--text);font-variant-numeric:tabular-nums;min-width:28px;text-align:right;}
.hs-team-score.winner{color:var(--green);}
.hs-status{font-size:9px;margin-top:5px;text-transform:uppercase;letter-spacing:0.05em;border-top:1px solid var(--border2);padding-top:5px;}
.hs-status.live{color:var(--red);font-weight:700;display:flex;align-items:center;gap:4px;}
.hs-status.live::before{content:'●';animation:score-pulse 1.2s ease-in-out infinite;}
.hs-status.final{color:var(--text3);}
.hs-status.pre{color:#3b82f6;}

/* SEARCH RESULTS BANNER */
.search-results-banner{
  display:flex;align-items:center;justify-content:space-between;
  background:var(--surface);border:1px solid var(--border);
  border-radius:10px;padding:10px 16px;margin-bottom:18px;
  gap:12px;
}
.search-results-text{font-size:13px;color:var(--text2);}
.search-results-text strong{color:var(--text);font-weight:700;}
.search-results-clear{
  font-size:12px;font-weight:600;color:var(--text3);
  background:none;border:1px solid var(--border);border-radius:14px;
  padding:4px 12px;cursor:pointer;font-family:inherit;flex-shrink:0;
  transition:all 0.12s;
}
.search-results-clear:hover{color:var(--accent);border-color:var(--accent);}

/* ── CHATBOT ─────────────────────────────────────────────────── */
.chat-fab{
  position:fixed;bottom:calc(70px + env(safe-area-inset-bottom, 0));right:20px;
  width:52px;height:52px;border-radius:50%;
  background:linear-gradient(135deg,#6001d2,#9333ea);
  color:#fff;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:22px;
  box-shadow:0 4px 20px rgba(96,1,210,0.45);
  z-index:200;transition:transform 0.15s,box-shadow 0.15s;
}
.chat-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(96,1,210,0.6);}
.chat-fab.open{background:linear-gradient(135deg,#444,#222);}
@media (min-width:641px){
  .chat-fab{bottom:24px;}
}
.chat-drawer{
  position:fixed;bottom:0;right:20px;
  width:360px;max-height:540px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:16px 16px 0 0;
  box-shadow:0 -8px 40px rgba(0,0,0,0.18);
  z-index:199;display:flex;flex-direction:column;
  overflow:hidden;
  animation:chat-slide-up 0.25s ease;
}
@media (max-width:640px){
  .chat-drawer{right:0;left:0;width:100%;border-radius:20px 20px 0 0;max-height:70vh;}
}
@keyframes chat-slide-up{from{transform:translateY(60px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.chat-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;
  background:linear-gradient(135deg,#6001d2,#9333ea);
  color:#fff;flex-shrink:0;
}
.chat-header-title{font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;}
.chat-header-title span{font-size:18px;}
.chat-header-sub{font-size:10px;color:rgba(255,255,255,0.7);margin-top:1px;}
.chat-close{background:none;border:none;color:rgba(255,255,255,0.8);cursor:pointer;font-size:18px;padding:4px;}
.chat-messages{
  flex:1;overflow-y:auto;padding:14px 14px 8px;
  display:flex;flex-direction:column;gap:10px;
  scrollbar-width:thin;
}
.chat-msg{
  display:flex;flex-direction:column;gap:2px;
  max-width:88%;
}
.chat-msg.user{align-self:flex-end;}
.chat-msg.bot{align-self:flex-start;}
.chat-bubble{
  padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.5;
}
.chat-msg.user .chat-bubble{
  background:#6001d2;color:#fff;border-radius:16px 16px 4px 16px;
}
.chat-msg.bot .chat-bubble{
  background:var(--surface2);color:var(--text);border:1px solid var(--border);
  border-radius:4px 16px 16px 16px;
}
.chat-msg-time{font-size:9px;color:var(--text3);padding:0 4px;}
.chat-typing{display:flex;gap:4px;padding:8px 12px;align-items:center;}
.chat-typing-dot{
  width:7px;height:7px;border-radius:50%;background:var(--text3);
  animation:typing-bounce 1.2s ease-in-out infinite;
}
.chat-typing-dot:nth-child(2){animation-delay:0.2s;}
.chat-typing-dot:nth-child(3){animation-delay:0.4s;}
@keyframes typing-bounce{0%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}
.chat-quick-btns{
  display:flex;gap:6px;flex-wrap:wrap;
  padding:6px 14px 10px;border-top:1px solid var(--border2);
}
.chat-quick-btn{
  font-size:11px;font-weight:600;padding:5px 11px;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:14px;cursor:pointer;font-family:inherit;color:var(--text2);
  transition:all 0.12s;white-space:nowrap;
}
.chat-quick-btn:hover{background:#6001d2;color:#fff;border-color:#6001d2;}
.chat-input-row{
  display:flex;gap:8px;padding:10px 14px;
  border-top:1px solid var(--border);flex-shrink:0;
}
.chat-input{
  flex:1;padding:9px 12px;font-size:13px;font-family:inherit;
  background:var(--surface2);border:1px solid var(--border);
  border-radius:20px;color:var(--text);outline:none;
  transition:border-color 0.12s;
}
.chat-input:focus{border-color:#6001d2;}
.chat-send{
  width:36px;height:36px;border-radius:50%;
  background:#6001d2;color:#fff;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:16px;
  flex-shrink:0;transition:background 0.12s;align-self:center;
}
.chat-send:hover{background:#7c3aed;}
.chat-send:disabled{background:var(--border);cursor:not-allowed;}

/* ═══ v36: POP CULTURE SUB-TABS ═══ */
.pc-subtabs{
  display:flex;gap:8px;flex-wrap:wrap;
  padding:8px 0 16px;
  overflow-x:auto;scrollbar-width:none;
}
.pc-subtabs::-webkit-scrollbar{display:none;}
.pc-subtab{
  display:inline-flex;align-items:center;gap:5px;
  padding:7px 15px;border-radius:22px;
  background:var(--surface2);border:1.5px solid var(--border);
  font-size:12px;font-weight:600;color:var(--text2);
  cursor:pointer;white-space:nowrap;transition:all 0.14s;
  font-family:var(--font-sans);
}
.pc-subtab:hover{background:var(--surface);color:var(--text);border-color:var(--text3);}
.pc-subtab.active{background:#db2777;color:#fff;border-color:#db2777;box-shadow:0 2px 8px rgba(219,39,119,0.35);}
@media(max-width:640px){
  .pc-subtab{padding:8px 12px;font-size:12px;min-height:44px;}
}

/* ═══ v36: RECOMMENDATIONS / FOR YOU ═══ */
.rec-section{border-top:2px solid var(--border);}
.rec-section-sub{font-size:10px;color:var(--text3);margin-left:6px;}
.rec-row{
  display:flex;align-items:flex-start;gap:10px;
  padding:9px 0;border-bottom:1px solid var(--border2);
  cursor:pointer;transition:background 0.1s;border-radius:4px;
}
.rec-row:last-child{border-bottom:none;}
.rec-row:hover{background:var(--surface2);}
.rec-thumb{
  width:52px;height:40px;flex-shrink:0;
  background-size:cover;background-position:center;
  border-radius:4px;
}
.rec-body{flex:1;min-width:0;}
.rec-title{
  font-size:12px;font-weight:600;color:var(--text);
  line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden;
}
.rec-src{font-size:10px;color:var(--text3);margin-top:3px;}

/* ═══ v38: TEAMS SHELF ═══ */
.teams-shelf{margin-top:32px;padding-top:20px;border-top:2px solid var(--border);}
.teams-shelf-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.teams-shelf-label{font-size:12px;font-weight:800;color:var(--text);text-transform:uppercase;letter-spacing:0.06em;}
.teams-shelf-edit{background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--text3);cursor:pointer;font-family:var(--font-sans);}
.teams-shelf-edit:hover{border-color:var(--accent);color:var(--accent);}
.teams-shelf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;}
.team-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;position:relative;transition:box-shadow 0.15s;}
.team-card:hover{box-shadow:var(--shadow-sm);}
.team-card.filtered{border-color:#6001d2;box-shadow:0 0 0 2px rgba(96,1,210,0.18);}
.team-card-btn{width:100%;display:flex;align-items:center;gap:10px;padding:11px 13px;background:none;border:none;cursor:pointer;text-align:left;font-family:var(--font-sans);}
.team-card-btn:hover{background:var(--surface2);}
.team-card-emoji{font-size:20px;flex-shrink:0;}
.team-card-info{flex:1;min-width:0;}
.team-card-name{display:block;font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.team-card-league{display:block;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-top:1px;}
.team-card-arrow{font-size:9px;color:var(--text3);flex-shrink:0;}
.team-card-menu{border-top:1px solid var(--border);display:flex;flex-direction:column;}
.team-menu-item{display:block;padding:9px 14px;font-size:12px;font-weight:600;color:var(--text2);background:none;border:none;cursor:pointer;font-family:var(--font-sans);text-align:left;text-decoration:none;transition:background 0.1s;}
.team-menu-item:hover{background:var(--surface2);color:var(--accent);}
@media(max-width:640px){.teams-shelf-grid{grid-template-columns:repeat(2,1fr);}}

/* ═══ v38: CHAT ANALYZE MODE ═══ */
.chat-mode-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--surface);}
.chat-mode-tab{flex:1;padding:10px;font-size:12px;font-weight:700;background:none;border:none;cursor:pointer;color:var(--text3);font-family:var(--font-sans);border-bottom:2px solid transparent;transition:all 0.12s;}
.chat-mode-tab.active{color:#6001d2;border-bottom-color:#6001d2;}
.chat-analyze{display:flex;flex-direction:column;gap:10px;padding:14px;flex:1;overflow-y:auto;}
.chat-analyze-modes{display:flex;gap:6px;flex-wrap:wrap;}
.chat-analyze-mode-btn{padding:5px 12px;border-radius:16px;font-size:11px;font-weight:700;background:var(--surface2);border:1px solid var(--border);color:var(--text3);cursor:pointer;font-family:var(--font-sans);transition:all 0.12s;}
.chat-analyze-mode-btn.active{background:#6001d2;color:#fff;border-color:#6001d2;}
.chat-analyze-input{border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:13px;font-family:var(--font-sans);color:var(--text);background:var(--surface2);resize:vertical;min-height:100px;outline:none;transition:border-color 0.12s;}
.chat-analyze-input:focus{border-color:#6001d2;}
.chat-analyze-go{background:#6001d2;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font-sans);transition:background 0.12s;}
.chat-analyze-go:hover{background:#7c3aed;}
.chat-analyze-go:disabled{background:var(--border);cursor:not-allowed;}
.chat-analyze-result{background:var(--surface2);border-radius:8px;padding:12px;border-left:3px solid #6001d2;}
.chat-analyze-result-label{font-size:9px;font-weight:800;color:#6001d2;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
.chat-analyze-result-text{font-size:13px;color:var(--text);line-height:1.6;white-space:pre-wrap;}
.chat-analyze-clear{margin-top:8px;background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--text3);cursor:pointer;font-family:var(--font-sans);}

/* ═══ v38: MOBILE IMPROVEMENTS ═══ */
/* gn-card on mobile: compact row layout like Yahoo News */
@media(max-width:640px){
  .gn-row{grid-template-columns:1fr;gap:0;}
  .gn-card{flex-direction:row;gap:12px;padding:12px 0;border-bottom:1px solid var(--border2);border-radius:0;}
  .gn-card:last-child{border-bottom:none;}
  .gn-card-img,.gn-card-img-ph{width:100px;height:72px;aspect-ratio:auto;flex-shrink:0;border-radius:6px;}
  .gn-card-title{font-size:14px;-webkit-line-clamp:3;font-weight:700;}
  .gn-card-meta{font-size:10px;}
  /* gn-grid on mobile: single column lead only, no grid */
  .gn-grid{grid-template-columns:1fr;}
  .gn-lead-img{aspect-ratio:16/9;height:auto;max-height:200px;}
  /* trending bar: horizontal scroll on mobile */
  .trending-bar{flex-wrap:nowrap;overflow-x:auto;padding:10px 0 14px;scrollbar-width:none;}
  .trending-bar::-webkit-scrollbar{display:none;}
  .trending-chip{flex-shrink:0;}
  /* page spacing */
  .page{padding:12px 12px 24px;}
  .page-grid{grid-template-columns:1fr;}
}

/* TRENDING SEARCH BAR — chips when search is empty */
.trending-bar{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:10px 0 16px;
}
.trending-bar-label{
  font-size:9px;font-weight:800;color:var(--text3);
  text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap;
  flex-shrink:0;
}
.trending-chip{
  font-size:11px;font-weight:600;color:var(--text2);
  background:var(--surface2);border:1px solid var(--border);
  border-radius:20px;padding:4px 11px;cursor:pointer;
  transition:all 0.12s;white-space:nowrap;
}
.trending-chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-bg);}

/* WEB SEARCH — improved result cards */
.web-result-meta{
  display:flex;align-items:center;gap:8px;margin-bottom:5px;
}
.web-result-date{font-size:10px;color:var(--text3);}

/* RESPONSIVE FIXES v28 */
/* iPad bridge (641–1100px): improve grid + hero */
@media (min-width:641px) and (max-width:1100px){
  .home-hero-row{grid-template-columns:1fr;gap:16px;}
  .page-grid{grid-template-columns:1fr 220px;gap:20px;}
  .gn-lead{grid-template-columns:1fr;gap:12px;}
  .gn-row{grid-template-columns:repeat(2,1fr);gap:14px;}
  .hero-row{grid-template-columns:1fr 260px;gap:12px;}
  .video-feature{max-width:100%;}
  .pill-bar .pill{min-width:110px;padding:7px 14px;}
  .fin-grid{grid-template-columns:1fr;}
  .pod-page{grid-template-columns:1fr;}
}
/* Mobile: reduce card image heights, fix hero */
@media (max-width:640px){
  .gn-lead-img{aspect-ratio:16/7;max-height:180px;}
  .sports-hero-img{aspect-ratio:16/7;max-height:170px;}
  .hero-lead-img{aspect-ratio:16/7;max-height:180px;}
  .video-feature{max-width:100%;}
  .video-embed,.video-embed-ph{padding-bottom:50%;}
  .home-scores{margin-left:-12px;margin-right:-12px;border-radius:0;border-left:none;border-right:none;}
  .hs-tile{min-width:120px;padding:9px 11px;}
  .trending-bar{padding:8px 0 12px;}
  .trending-chip{font-size:10px;padding:4px 9px;}
  /* Mobile trending section — more prominent at top of feed */
  .trending-section-mobile{
    background:var(--surface);border:1px solid var(--border);
    border-radius:10px;padding:12px 14px;margin-bottom:14px;
  }
  .trending-section-mobile .trending-bar-label{
    font-size:10px;color:var(--accent);display:block;margin-bottom:8px;
  }
  .trending-section-mobile .trending-chip{font-size:11px;padding:5px 12px;}
}

/* ── ARTICLE READER OVERLAY ────────────────────────────────────── */
.article-reader-overlay{
  position:fixed;inset:0;z-index:2000;
  background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);
  display:flex;align-items:flex-start;justify-content:center;
  padding:20px 16px;overflow-y:auto;
}
.article-reader{
  background:var(--surface);border-radius:14px;
  width:100%;max-width:720px;
  box-shadow:0 24px 80px rgba(0,0,0,0.45);
  overflow:hidden;position:relative;
  margin:auto;
}
.article-reader-img{
  width:100%;aspect-ratio:16/7;object-fit:cover;
  background:var(--surface2);
}
.article-reader-body{padding:24px 28px 28px;}
.article-reader-source{
  font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;
  color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:6px;
}
.article-reader-date{color:var(--text3);font-weight:400;text-transform:none;letter-spacing:0;}
.article-reader-title{
  font-family:var(--font-serif);font-size:clamp(20px,3vw,28px);
  font-weight:800;line-height:1.25;color:var(--text1);margin:0 0 12px;
}
.article-reader-desc{
  font-size:15px;line-height:1.65;color:var(--text2);
  border-left:3px solid var(--accent);padding-left:14px;
  margin:0 0 20px;
}
.article-reader-actions{
  display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;
}
.article-reader-btn{
  font-size:12px;font-weight:700;padding:7px 14px;border-radius:6px;
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text2);cursor:pointer;transition:all 0.15s;
}
.article-reader-btn:hover{border-color:var(--accent);color:var(--accent);}
.article-reader-btn.primary{
  background:var(--accent);color:#fff;border-color:var(--accent);
}
.article-reader-btn.primary:hover{opacity:0.88;}
.article-reader-ai-result{
  background:var(--surface2);border-radius:8px;padding:14px 16px;
  font-size:13px;line-height:1.6;color:var(--text1);
  border:1px solid var(--border);margin-top:12px;
  white-space:pre-wrap;
}
.article-reader-close{
  position:absolute;top:14px;right:14px;
  width:32px;height:32px;border-radius:50%;
  background:rgba(0,0,0,0.4);border:none;cursor:pointer;
  color:#fff;font-size:18px;line-height:1;
  display:flex;align-items:center;justify-content:center;
  z-index:1;transition:background 0.15s;
}
.article-reader-close:hover{background:rgba(0,0,0,0.7);}
@media(max-width:640px){
  .article-reader-overlay{padding:0;}
  .article-reader{border-radius:0;min-height:100dvh;}
  .article-reader-body{padding:18px 18px 32px;}
}
`;


// ─── DIVERSITY-AWARE TRENDING (velocity-scored) ───────────────────────────────
// Scores articles by keyword match + publication velocity (articles-per-topic in
// last 1h vs last 3h ratio). A topic with 3 articles in the last hour is hotter
// than one with 10 spread across the day. Caps per-category to avoid Sports domination.
function diverseTrending(arts, kw, limit = 8, maxPerCat = 2) {
  const allKws = Object.values(kw).flat().map(k => k.toLowerCase());
  const all = Object.values(arts).flat();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const threeHours = 3 * oneHour;

  // Build topic velocity: for each keyword, count articles in 1h vs 3h
  const kwVelocity = {};
  for (const k of allKws) {
    const recent1h = all.filter(a => {
      const age = now - new Date(a.pubDate).getTime();
      return age < oneHour && (a.title + ' ' + (a.desc||'')).toLowerCase().includes(k);
    }).length;
    const recent3h = all.filter(a => {
      const age = now - new Date(a.pubDate).getTime();
      return age < threeHours && (a.title + ' ' + (a.desc||'')).toLowerCase().includes(k);
    }).length;
    kwVelocity[k] = recent3h > 0 ? (recent1h / recent3h) : 0;
  }

  const seen = new Set();
  const deduped = all.filter(a => {
    const k = a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
    if (seen.has(k)) return false; seen.add(k); return true;
  });

  deduped.sort((a,b) => {
    const aTxt=(a.title+' '+(a.desc||'')).toLowerCase();
    const bTxt=(b.title+' '+(b.desc||'')).toLowerCase();
    const aKws = allKws.filter(k=>aTxt.includes(k));
    const bKws = allKws.filter(k=>bTxt.includes(k));
    // Velocity bonus: sum velocity scores of matched keywords
    const aVel = aKws.reduce((s,k) => s + (kwVelocity[k]||0), 0);
    const bVel = bKws.reduce((s,k) => s + (kwVelocity[k]||0), 0);
    const aScore = aKws.length * 2 + aVel;
    const bScore = bKws.length * 2 + bVel;
    if (bScore !== aScore) return bScore - aScore;
    return new Date(b.pubDate) - new Date(a.pubDate);
  });

  const catCounts = {};
  const result = [];
  for (const a of deduped) {
    const cat = a.cat || 'general';
    if (!catCounts[cat]) catCounts[cat] = 0;
    if (catCounts[cat] >= maxPerCat) continue;
    catCounts[cat]++;
    result.push(a);
    if (result.length >= limit) break;
  }
  return result;
}

// ─── AUDIO LISTEN (Web Speech API TTS) ───────────────────────────────────────
// Uses the browser's SpeechSynthesis API — free, no API key needed.
// Prefers voices matching Australian English (Siri-adjacent) when available,
// falls back to any English voice, then system default.
function AudioListen({ text, title }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utterRef = useRef(null);

  const getBestVoice = () => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Priority: Australian English (Siri-style) → British English → any English
    return (
      voices.find(v => v.lang === 'en-AU') ||
      voices.find(v => v.lang === 'en-GB') ||
      voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  };

  const handleListen = () => {
    if (!supported) return;
    if (listening) {
      window.speechSynthesis.cancel();
      setListening(false);
      return;
    }
    const content = title ? `${title}. ${text || ''}` : text || '';
    if (!content.trim()) return;
    const utter = new SpeechSynthesisUtterance(content.slice(0, 1200));
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    const voice = getBestVoice();
    if (voice) utter.voice = voice;
    utter.onend = () => setListening(false);
    utter.onerror = () => setListening(false);
    utterRef.current = utter;
    setListening(true);
    window.speechSynthesis.speak(utter);
  };

  if (!supported) return null;

  return (
    <button className={`fc-listen-btn ${listening ? 'listening' : ''}`} onClick={e => { e.stopPropagation(); handleListen(); }} title={listening ? 'Stop reading' : 'Listen to article'}>
      {listening ? (
        <><span className="listen-wave"><span className="listen-bar"/><span className="listen-bar"/><span className="listen-bar"/><span className="listen-bar"/><span className="listen-bar"/></span> Stop</>
      ) : (
        <><span>♪</span> Listen</>
      )}
    </button>
  );
}

// ─── VIDEO FEATURE COMPONENT ──────────────────────────────────────────────────
// Embeds relevant YouTube news videos for context. Tabs cycle between curated
// news channel playlists (AP, Reuters, Bloomberg). No API key needed.
const VIDEO_CHANNELS = [
  { label: 'AP News',    embed: 'https://www.youtube.com/embed?listType=user_uploads&list=AssociatedPress&autoplay=0', title: 'AP News Live' },
  { label: 'Reuters',   embed: 'https://www.youtube.com/embed?listType=user_uploads&list=Reuters&autoplay=0',           title: 'Reuters TV' },
  { label: 'Bloomberg', embed: 'https://www.youtube.com/embed?listType=user_uploads&list=BloombergTelevision&autoplay=0', title: 'Bloomberg Live' },
];

function VideoFeature() {
  const [activeTab, setActiveTab] = useState(0);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="video-feature">
      <div className="video-feature-head">
        <span className="video-feature-label">Watch</span>
        <span className="video-feature-title">{VIDEO_CHANNELS[activeTab].title}</span>
      </div>
      <div className="video-tabs">
        {VIDEO_CHANNELS.map((ch, i) => (
          <button key={i} className={`video-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => { setActiveTab(i); setLoaded(false); }}>
            {ch.label}
          </button>
        ))}
      </div>
      {loaded ? (
        <div className="video-embed">
          <iframe
            src={VIDEO_CHANNELS[activeTab].embed}
            title={VIDEO_CHANNELS[activeTab].title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="video-embed-ph" style={{paddingBottom:'56.25%',position:'relative',background:'#0a1628',cursor:'pointer'}} onClick={() => setLoaded(true)}>
          <div className="video-embed-ph-inner">
            <div className="video-play-btn">▶</div>
            <div className="video-play-caption">
              Watch {VIDEO_CHANNELS[activeTab].title} — click to load
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVE SCORES BAR — compact live/final games for General homepage ────────
function ActiveScoresBar({ scores, onGoToSports }) {
  const activeLeagues = useMemo(() => {
    return Object.entries(scores)
      .map(([key, games]) => {
        const active = (games || []).filter(g => g.state === 'in' || g.state === 'post');
        return { key, games: active.slice(0, 4) };
      })
      .filter(l => l.games.length > 0);
  }, [scores]);

  if (!activeLeagues.length) return null;

  const LEAGUE_LABEL = { nfl:'NFL', nba:'NBA', mlb:'MLB', cfb:'CFB', cbb:'CBB' };

  return (
    <div className="home-scores">
      <div className="home-scores-head">
        <span className="home-scores-label">Live Scores</span>
        <button className="home-scores-see-all" onClick={onGoToSports}>Sports →</button>
      </div>
      <div className="home-scores-scroll">
        {activeLeagues.flatMap(({ key, games }) =>
          games.map((g, i) => {
            const homeWin = g.state === 'post' && parseInt(g.homeScore) > parseInt(g.awayScore);
            const awayWin = g.state === 'post' && parseInt(g.awayScore) > parseInt(g.homeScore);
            return (
              <div key={`${key}-${i}`} className="hs-tile" onClick={() => g.link && window.open(g.link, '_blank')}>
                <div className="hs-league">{LEAGUE_LABEL[key] || key.toUpperCase()}</div>
                <div className="hs-team-row">
                  <span className="hs-team-name">{g.awayAbbr || g.awayName}</span>
                  <span className={`hs-team-score ${awayWin ? 'winner' : ''}`}>{g.awayScore || '–'}</span>
                </div>
                <div className="hs-team-row">
                  <span className="hs-team-name">{g.homeAbbr || g.homeName}</span>
                  <span className={`hs-team-score ${homeWin ? 'winner' : ''}`}>{g.homeScore || '–'}</span>
                </div>
                <div className={`hs-status ${g.state === 'in' ? 'live' : 'final'}`}>
                  {g.state === 'in' ? g.status || 'Live' : 'Final'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── EXPLAIN CONTENT ─────────────────────────────────────────────────────────
function ExplainContent({ text }) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim());
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^\*\*([^*]+)\*\*\s*[—–-]?\s*(.*)/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { head: m[1].trim(), body: m[2].trim() };
    } else if (cur) {
      cur.body += (cur.body ? ' ' : '') + line;
    } else {
      sections.push({ head: null, body: line });
    }
  }
  if (cur) sections.push(cur);
  return (
    <>
      {sections.map((s, i) => (
        <div key={i} className="fc-explain-section">
          {s.head && <div className="fc-explain-head">{s.head}</div>}
          <div className="fc-explain-body">{s.body}</div>
        </div>
      ))}
    </>
  );
}

// ─── FEED CARD ────────────────────────────────────────────────────────────────
function FeedCard({a, cat, isSaved, onSave, onRead, relatedSources, isRead, userKw, userTeams}) {
  const [imgErr, setImgErr] = useState(false);
  const [aiState, setAiState] = useState('closed');
  const [summary, setSummary] = useState('');
  const [takeaways, setTakeaways] = useState('');
  const [aiErr, setAiErr] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [explainText, setExplainText] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  const [disc, setDisc] = useState(null);
  const [loadingDisc, setLoadingDisc] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const cc = CATS[cat]||CATS.general;
  const topKw = a.matchedKw?.[0]||null;
  const paywall = isPaywalled(a.link);
  const readMins = a.desc ? Math.max(1, Math.round(a.desc.split(/\s+/).length / 220)) : null;
  const clusterCount = a._clusterSize > 1 ? a._clusterSize : 0;
  const whyLines = whyItMatters(a, userKw, userTeams);

  const handleAI = async (e) => {
    e.stopPropagation();
    if (aiState !== 'closed') { setAiState('closed'); return; }
    setAiState('open');
    const needSummary = !summary;
    const needTakeaways = !takeaways;
    if (!needSummary && !needTakeaways) return;
    setLoadingAI(true);
    const tasks = [];
    if (needSummary) tasks.push(fetchAISummary({type:'article',title:a.title,content:a.desc||'',mode:'summary'}).then(r=>({k:'s',...r})));
    if (needTakeaways) tasks.push(fetchAISummary({type:'article',title:a.title,content:a.desc||'',mode:'takeaways'}).then(r=>({k:'t',...r})));
    const results = await Promise.all(tasks);
    for (const r of results) {
      if (r.summary) {
        if (r.k==='s') setSummary(r.summary);
        else setTakeaways(r.summary);
      } else if (r.error) {
        setAiErr(r.error);
      }
    }
    setLoadingAI(false);
  };

  const handleExplain = async (e) => {
    e.stopPropagation();
    if (showExplain) { setShowExplain(false); return; }
    if (explainText) { setShowExplain(true); return; }
    setShowExplain(true);
    setLoadingExplain(true);
    const { summary: text, error } = await fetchAISummary({ type: 'article', title: a.title, content: a.desc || '', mode: 'explain' });
    if (text) setExplainText(text);
    else setExplainText(error || 'Could not generate explanation.');
    setLoadingExplain(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, url: a.link });
      } catch {}
    } else {
      try { await navigator.clipboard.writeText(a.link); } catch {}
      // simple fallback: open the link directly
      window.open(a.link, '_blank');
    }
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
    <div className={`fc ${cat}${isRead?' fc-read':''}`} onClick={() => onRead(a)}>
      <div className="fc-meta">
        <span className="fc-source" style={{color:cc.color}}>{a.source}</span>
        {paywall && <span className="fc-paywall-badge" title="Subscription may be required">🔒</span>}
        {a.isAlert && <span className="fc-alert-badge">● BREAKING</span>}
        {topKw && <span className="fc-topic" style={{background:cc.bg,color:cc.color}}>{topKw}</span>}
        {clusterCount > 1 && (
          <span className="fc-cluster-badge" title={`Also covered by: ${a._clusterSources?.join(', ')}`}>
            {clusterCount} sources
          </span>
        )}
        <span className="fc-date">{fmtDate(a.pubDate)}</span>
      </div>
      <div className="fc-body">
        {a.img && !imgErr
          ? <img className="fc-thumb" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>
          : <div className="fc-thumb-ph" style={{background:`linear-gradient(135deg,${cc.bg},${cc.bg}cc)`}}>
              <span style={{fontSize:'22px'}}>{cc.emoji}</span>
            </div>}
        <div className="fc-text">
          <div className={`fc-title${a.isAlert?' fc-title-breaking':''}`}>{a.title}</div>
          {a.desc && <div className="fc-desc">{a.desc}</div>}
        </div>
      </div>
      {aiState!=='closed' && (
        <div className="fc-ai-panel" onClick={e=>e.stopPropagation()}>
          {/* What actually happened */}
          <div className="fc-summary">
            <div className="fc-summary-lbl">✦ What Happened</div>
            {loadingAI && !summary
              ? <div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Generating summary...</div>
              : aiErr && !summary
                ? <div style={{fontSize:'11px',color:'var(--red)'}}>{aiErr}</div>
                : <div className="fc-summary-text">{summary}</div>}
          </div>
          {/* Key points (3 bullets) */}
          <div className="fc-takeaways">
            <div className="fc-takeaways-lbl">📋 Key Points</div>
            {loadingAI && !takeaways
              ? <div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Analyzing article...</div>
              : aiErr && !takeaways
                ? <div style={{fontSize:'11px',color:'var(--red)'}}>{aiErr}</div>
                : <TakeawaysContent text={takeaways}/>}
          </div>
          {/* Why It Matters — only renders if relevant */}
          {whyLines.length > 0 && (
            <div className="fc-why">
              <div className="fc-why-lbl">★ Why It Matters</div>
              {whyLines.map((line, i) => <div key={i} className="fc-why-line">{line}</div>)}
            </div>
          )}
        </div>
      )}
      {showDisc && (
        <div className="fc-disc" onClick={e=>e.stopPropagation()}>
          <div className="fc-disc-lbl">💬 What People Are Saying</div>
          {loadingDisc
            ? <div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>Searching discussions...</div>
            : (!disc||(disc.reddit.length===0&&disc.hn.length===0))
              ? <div style={{fontSize:'11px',color:'var(--text3)'}}>No discussions found on Reddit or HN for this story.</div>
              : <>
                  {disc.reddit.map((r,i)=>(
                    <a key={`r${i}`} className="fc-disc-item" href={r.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
                      <span className="fc-disc-platform reddit">Reddit</span>
                      <span className="fc-disc-sub">{r.sub}</span>
                      <span className="fc-disc-stats">▲{r.ups} · {r.comments} comments</span>
                    </a>
                  ))}
                  {disc.hn.map((h,i)=>(
                    <a key={`h${i}`} className="fc-disc-item" href={h.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
                      <span className="fc-disc-platform hn">HN</span>
                      <span className="fc-disc-title">{h.title}</span>
                      <span className="fc-disc-stats">{h.points}pts · {h.comments} comments</span>
                    </a>
                  ))}
                </>}
        </div>
      )}
      {showExplain && (
        <div className="fc-explain" onClick={e=>e.stopPropagation()}>
          <div className="fc-explain-lbl">🧠 Learning Companion</div>
          {loadingExplain
            ? <div style={{fontSize:'12px',color:'#b45309',fontStyle:'italic'}}>Analyzing context…</div>
            : <ExplainContent text={explainText}/>}
        </div>
      )}
      {relatedSources && relatedSources.length > 0 && (
        <div className="fc-more" onClick={e=>e.stopPropagation()}>
          <span className="fc-more-lbl">Also covering:</span>
          {relatedSources.slice(0,4).map((s,i)=>(
            <button key={i} className="fc-more-src" onClick={()=>s.link&&window.open(s.link,'_blank')}>{s.source}</button>
          ))}
        </div>
      )}
      <div className="fc-actions" onClick={e=>e.stopPropagation()}>
        <button className={`fc-act ${isSaved?'saved':''}`} onClick={e=>{e.stopPropagation();onSave(a);}}>
          {isSaved?'★ Saved':'☆ Save'}
        </button>
        {isMobile ? (
          <>
            <button className="fc-act fc-mobile-more-btn" onClick={e=>{e.stopPropagation();setMobileActionsOpen(o=>!o);}}>
              {mobileActionsOpen ? '✕ Less' : '⋯ More'}
            </button>
            {mobileActionsOpen && (
              <>
                <button className={`fc-act ${aiState!=='closed'?'ai-on':''}`} onClick={handleAI} disabled={loadingAI}>
                  ✦ {loadingAI?'Thinking...':aiState==='closed'?'AI Summary':'Hide AI'}
                </button>
                <button className={`fc-act ${showDisc?'disc-on':''}`} onClick={handleDisc} disabled={loadingDisc}>
                  💬 {loadingDisc?'Searching...':showDisc?'Hide':'Pulse'}
                </button>
                <button className={`fc-act ${showExplain?'explain-on':''}`} onClick={handleExplain} disabled={loadingExplain}>
                  🧠 {loadingExplain?'Analyzing…':showExplain?'Hide':'Explain'}
                </button>
                {navigator.share !== undefined && (
                  <button className="fc-act" onClick={handleShare} title="Share article">↗ Share</button>
                )}
                <AudioListen text={`${a.title}. ${a.desc || ''}`} title={null} />
              </>
            )}
          </>
        ) : (
          <>
            <button className={`fc-act ${aiState!=='closed'?'ai-on':''}`} onClick={handleAI} disabled={loadingAI}>
              ✦ {loadingAI?'Thinking...':aiState==='closed'?'AI Summary':'Hide AI'}
            </button>
            <button className={`fc-act ${showDisc?'disc-on':''}`} onClick={handleDisc} disabled={loadingDisc}>
              💬 {loadingDisc?'Searching...':showDisc?'Hide':'Pulse'}
            </button>
            <button className={`fc-act ${showExplain?'explain-on':''}`} onClick={handleExplain} disabled={loadingExplain}>
              🧠 {loadingExplain?'Analyzing…':showExplain?'Hide':'Explain'}
            </button>
            {navigator.share !== undefined && (
              <button className="fc-act" onClick={handleShare} title="Share article">
                ↗ Share
              </button>
            )}
            <AudioListen text={`${a.title}. ${a.desc || ''}`} title={null} />
          </>
        )}
        <a className="fc-read-link" href={a.link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
          {readMins ? `${readMins} min · ` : ''}Full Story ↗
        </a>
      </div>
    </div>
  );
}

// ─── TODAY ITEM ───────────────────────────────────────────────────────────────
function TodayItem({a, cc, onRead}) {
  const [showSum, setShowSum] = useState(false);
  const [sum, setSum] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const handleAI = async (e) => {
    e.stopPropagation();
    if (showSum) { setShowSum(false); return; }
    if (sum||err) { setShowSum(true); return; }
    setShowSum(true); setLoading(true);
    const {summary, error} = await fetchAISummary({type:'article',title:a.title,content:a.desc||''});
    if (summary) setSum(summary); else setErr(error||'Summary unavailable');
    setLoading(false);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) { try { await navigator.share({title:a.title,url:a.link}); return; } catch {} }
    try { await navigator.clipboard.writeText(a.link); } catch {}
  };

  return (
    <div className="today-item-wrap">
      <div className="today-item" onClick={()=>onRead(a)}>
        {a.img && !imgErr
          ? <img className="today-thumb" src={a.img} loading="lazy" onError={()=>setImgErr(true)} alt=""/>
          : <div className="today-thumb-ph" style={{background:cc.bg}}>{cc.emoji}</div>}
        <div className="today-item-body">
          <div className="today-item-title">{a.title}</div>
          <div className="today-item-src">{a.source} · {fmtDate(a.pubDate)}</div>
        </div>
        <button className={`today-ai-btn ${showSum?'on':''}`} title="AI Summary" onClick={handleAI} disabled={loading}>
          {loading?'…':'✦'}
        </button>
        <button className="today-ai-btn" title="Share" onClick={handleShare} style={{marginLeft:'2px',fontSize:'13px'}}>
          ⤴
        </button>
      </div>
      {showSum && (
        <div className="today-summary" onClick={e=>e.stopPropagation()}>
          {loading ? <em style={{color:'var(--text3)'}}>Generating summary...</em>
          : err ? <span style={{color:'var(--red)'}}>{err}</span>
          : sum}
        </div>
      )}
    </div>
  );
}


// ─── MORNING BRIEFING INLINE (v19 enhanced) ──────────────────────────────────
// Editorial-style briefing: single synthesized paragraph + 3–5 bullet
// takeaways + "Updated Xm ago" timestamp + visible Refresh Digest button.
// Parses AI output for bullet markers (- or • or numbered) and splits into
// paragraph vs. bullets. Ghost treatment — no card, no border, no bg.
function MorningBriefingInline({arts, excludeCats}) {
  const effectiveExclude = excludeCats || BRIEFING_EXCLUDE_CATS;
  const [body, setBody]       = useState('');   // main paragraph
  const [bullets, setBullets] = useState([]);   // array of strings
  const [ts, setTs]           = useState(null); // timestamp of last gen
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const dateStr = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  // Parse AI output: first non-bullet paragraph = body, bullets = takeaways
  const parseBriefing = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const paragraphs = [];
    const bulletLines = [];
    for (const line of lines) {
      // Match -, •, *, or numbered bullets
      const m = line.match(/^(?:[-•*]|\d+[.)])\s+(.+)$/);
      if (m) bulletLines.push(m[1].trim());
      else paragraphs.push(line);
    }
    // Body = joined non-bullet paragraphs (usually just one)
    return { body: paragraphs.join(' '), bullets: bulletLines.slice(0, 5) };
  };

  const generate = useCallback(async () => {
    setLoading(true); setError('');

    // ── TIER 1: Priority briefing sources (Axios, Morning Brew, Morning Wire, Bloomberg) ──
    // Pull the latest 1-2 articles from each priority source. These are
    // labeled as "anchor" content for the AI synthesis.
    const allArts = Object.values(arts).flat();
    const tier1 = [];
    const tier1Keys = new Set(); // dedup keys for Tier 2 to filter against
    BRIEFING_PRIORITY_SOURCES.forEach(srcName => {
      const matches = allArts
        .filter(a => a.source === srcName)
        .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 2);
      matches.forEach(a => {
        tier1.push({...a, _priority: srcName});
        const key = a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
        tier1Keys.add(key);
      });
    });

    // ── TIER 2: Per-category top headlines (dedup against Tier 1) ──
    const tier2 = {};
    Object.entries(arts).forEach(([cat, list]) => {
      if (effectiveExclude.includes(cat)) return;
      const headlines = (list || [])
        .filter(a => {
          const key = a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
          return !tier1Keys.has(key);
        })
        .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 5)
        .map(a => a.title);
      if (headlines.length > 0) tier2[cat] = headlines;
    });

    // Build the structured AI prompt
    const tier1Block = tier1.length > 0
      ? `PRIORITY BRIEFINGS (today's authoritative summaries from Axios, Morning Brew, Morning Wire, Bloomberg):\n${tier1.map(a => `• [${a.source}] ${a.title}`).join('\n')}`
      : '';
    const tier2Block = Object.entries(tier2).map(([cat, hl]) =>
      `${CATS[cat]?.label || cat.toUpperCase()}:\n${hl.map(t => `• ${t}`).join('\n')}`
    ).join('\n\n');

    const prompt = `You are synthesizing a smart professional briefing in the style of Morning Brew + Axios + Bloomberg 5 Things — punchy, specific, no fluff. A busy executive checks this multiple times a day.

${tier1Block}

FRESH HEADLINES BY CATEGORY:
${tier2Block}

OUTPUT FORMAT:
1. A punchy 3-4 sentence opening paragraph synthesizing the day's biggest story or theme. Be specific and name the actual stories. Lead with what changed today, not what's ongoing.
2. 5-7 bullet takeaways covering the most important news across the categories above. Each bullet must:
   - Start with a dash marker (-)
   - Be one specific sentence (no fluff)
   - Name the actual story/people/companies
   - Cover different categories (don't pile up bullets in one area)
   - Reference Tier 1 priority briefings where relevant
Output ONLY the paragraph followed by the bullets. No headers, no labels, no closing remarks.`;

    const {summary, error:err} = await fetchAISummary({
      type:'article',
      title:`News Briefing — ${dateStr}`,
      content: prompt,
      mode:'briefing-gen',
    });
    if (summary) {
      const { body: b, bullets: bs } = parseBriefing(summary.trim());
      setBody(b);
      setBullets(bs);
      setTs(Date.now());
    } else {
      setError(err||'Could not generate briefing');
    }
    setLoading(false);
  }, [arts, dateStr]);

  // Initial generation when feeds load (>10 articles total)
  useEffect(() => {
    const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
    if (total > 10 && !body && !loading) generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arts]);

  // ── TIER 3: time-aware auto-refresh ──
  // If briefing exists but is older than BRIEFING_STALE_MS (90min), regenerate.
  // Re-checks every 5 minutes so a user who leaves the tab open mid-morning
  // gets a fresh briefing by midday without manual refresh.
  useEffect(() => {
    if (!ts || loading) return;
    const checkStale = () => {
      const age = Date.now() - ts;
      if (age > BRIEFING_STALE_MS) {
        const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
        if (total > 10) generate();
      }
    };
    checkStale(); // check immediately on mount/ts-change
    const iv = setInterval(checkStale, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ts]);

  // Freshness indicator: green <30min, amber older
  const tsLabel = useMemo(() => {
    if (!ts) return null;
    const age = (Date.now() - ts) / 60000;
    if (age < 1) return { text: 'Just now', stale: false };
    if (age < 60) return { text: `${Math.floor(age)}m ago`, stale: age >= 30 };
    return { text: `${Math.floor(age/60)}h ago`, stale: true };
  }, [ts]);

  return (
    <section className="briefing-inline">
      <div className="briefing-inline-head">
        <div className="briefing-inline-label-row">
          <span className="briefing-inline-label">☕ The Briefing</span>
          <span className="briefing-inline-date">{dateStr}</span>
          {tsLabel && (
            <span className="briefing-inline-ts">
              <span className={`briefing-inline-ts-dot ${tsLabel.stale?'stale':''}`}/>
              Updated {tsLabel.text}
            </span>
          )}
        </div>
        <button className="briefing-inline-refresh-btn" onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : '↻ Refresh'}
        </button>
      </div>
      <div className="briefing-inline-sources">
        <span className="briefing-src-pill">☕ {BRIEFING_PRIORITY_SOURCES.join(' · ')}</span>
        <span className="briefing-src-pill">📰 Top headlines per category</span>
      </div>
      {body
        ? <p className="briefing-inline-body" dangerouslySetInnerHTML={{__html: body.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}}/>
        : error
          ? <p className="briefing-inline-empty">{error}</p>
          : <p className="briefing-inline-empty">{loading?'Synthesizing today\'s headlines…':'Loading briefing…'}</p>}
      {bullets.length > 0 && (
        <ul className="briefing-inline-bullets">
          {bullets.map((b, i) => (
            <li key={i} dangerouslySetInnerHTML={{__html: b.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}}/>
          ))}
        </ul>
      )}
    </section>
  );
}

// BRIEFING TEASER — v24a — compact preview of the morning briefing for use
// on the General homepage. Shares the same 3-tier methodology as the full
// MorningBriefingInline (Tier 1 priority sources + Tier 2 deduped per-cat),
// but renders only:
//   • The synthesized paragraph (if available)
//   • Up to 3 bullets (vs 5-7 in full)
//   • "View full briefing →" CTA that opens the dedicated BriefingPage
// Generates its own copy independently from the full briefing — they auto-
// share state via the same fetchAISummary cache when the prompt matches.
// Time-aware: regenerates if >90min stale, like the full version.
function BriefingTeaser({arts, excludeCats, onOpenFull}) {
  const effectiveExclude = excludeCats || BRIEFING_EXCLUDE_CATS;
  const [body, setBody]       = useState('');
  const [bullets, setBullets] = useState([]);
  const [ts, setTs]           = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const dateStr = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});

  const parseBriefing = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const paragraphs = [];
    const bulletLines = [];
    for (const line of lines) {
      const m = line.match(/^(?:[-•*]|\d+[.)])\s+(.+)$/);
      if (m) bulletLines.push(m[1].trim());
      else paragraphs.push(line);
    }
    return { body: paragraphs.join(' '), bullets: bulletLines.slice(0, 3) };
  };

  const generate = useCallback(async () => {
    setLoading(true); setError('');
    const allArts = Object.values(arts).flat();
    const tier1 = [];
    const tier1Keys = new Set();
    BRIEFING_PRIORITY_SOURCES.forEach(srcName => {
      allArts
        .filter(a => a.source === srcName)
        .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 2)
        .forEach(a => {
          tier1.push(a);
          tier1Keys.add(a.title.slice(0,60).toLowerCase().replace(/\s+/g,''));
        });
    });
    const tier2 = {};
    Object.entries(arts).forEach(([cat, list]) => {
      if (effectiveExclude.includes(cat)) return;
      const headlines = (list||[])
        .filter(a => !tier1Keys.has(a.title.slice(0,60).toLowerCase().replace(/\s+/g,'')))
        .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 5)
        .map(a => a.title);
      if (headlines.length > 0) tier2[cat] = headlines;
    });
    const tier1Block = tier1.length > 0
      ? `PRIORITY BRIEFINGS:\n${tier1.map(a => `• [${a.source}] ${a.title}`).join('\n')}`
      : '';
    const tier2Block = Object.entries(tier2).map(([cat, hl]) =>
      `${CATS[cat]?.label || cat.toUpperCase()}:\n${hl.map(t => `• ${t}`).join('\n')}`
    ).join('\n\n');

    const prompt = `Synthesize a punchy 3-sentence opening + 3 specific bullet takeaways for a busy executive's morning briefing. Style: Morning Brew + Axios + Bloomberg 5 Things. Be specific and name actual stories.

${tier1Block}

FRESH HEADLINES BY CATEGORY:
${tier2Block}

OUTPUT: 3-sentence paragraph followed by exactly 3 bullets (- markers). No headers.`;

    const {summary, error:err} = await fetchAISummary({
      type:'article',
      title:`Briefing Teaser — ${dateStr}`,
      content: prompt,
      mode:'briefing-gen',
    });
    if (summary) {
      const { body: b, bullets: bs } = parseBriefing(summary.trim());
      setBody(b);
      setBullets(bs);
      setTs(Date.now());
    } else {
      setError(err || 'Could not generate briefing');
    }
    setLoading(false);
  }, [arts, dateStr]);

  useEffect(() => {
    const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
    if (total > 10 && !body && !loading) generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arts]);

  // Time-aware refresh
  useEffect(() => {
    if (!ts || loading) return;
    const checkStale = () => {
      if (Date.now() - ts > BRIEFING_STALE_MS) {
        const total = Object.values(arts).reduce((n,l)=>n+(l?.length||0),0);
        if (total > 10) generate();
      }
    };
    checkStale();
    const iv = setInterval(checkStale, 5 * 60 * 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ts]);

  const tsLabel = useMemo(() => {
    if (!ts) return null;
    const age = (Date.now() - ts) / 60000;
    if (age < 1) return 'Just now';
    if (age < 60) return `${Math.floor(age)}m ago`;
    return `${Math.floor(age/60)}h ago`;
  }, [ts]);

  return (
    <section className="briefing-teaser">
      <div className="briefing-teaser-head">
        <div className="briefing-teaser-label-row">
          <span className="briefing-teaser-label">☕ Today's Briefing</span>
          <span className="briefing-teaser-date">{dateStr}</span>
          {tsLabel && <span className="briefing-teaser-ts">Updated {tsLabel}</span>}
        </div>
        <button className="briefing-teaser-cta" onClick={onOpenFull}>
          View full briefing →
        </button>
      </div>
      {body
        ? <p className="briefing-teaser-body" dangerouslySetInnerHTML={{__html: body.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}}/>
        : error
          ? <p className="briefing-teaser-empty">{error}</p>
          : <p className="briefing-teaser-empty">{loading ? 'Synthesizing today\'s headlines…' : 'Loading briefing…'}</p>}
      {bullets.length > 0 && (
        <ul className="briefing-teaser-bullets">
          {bullets.map((b, i) => (
            <li key={i} dangerouslySetInnerHTML={{__html: b.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}}/>
          ))}
        </ul>
      )}
      <div className="briefing-teaser-footer">
        <span className="briefing-teaser-sources">
          ☕ {BRIEFING_PRIORITY_SOURCES.join(' · ')}
        </span>
        <button className="briefing-teaser-cta-link" onClick={onOpenFull}>Full briefing →</button>
      </div>
    </section>
  );
}

// ─── SCOREBOARD ───────────────────────────────────────────────────────────────
function Scoreboard({scores, loading, compact=false}) {
  const [expanded, setExpanded] = useState(() => {
    const init={};
    LEAGUES.forEach(L=>{init[L.key]=['nfl','nba','mlb'].includes(L.key);});
    return init;
  });

  const renderGame = (g, isFav) => {
    const live=g.state==='in', final=g.state==='post';
    const h=parseInt(g.homeScore)||0, aw=parseInt(g.awayScore)||0;
    const homeWin=final&&h>aw, awayWin=final&&aw>h;
    return (
      <div key={g.id} className={`sb-game ${isFav?'fav':''} ${live?'live':''}`} onClick={()=>g.link&&window.open(g.link,'_blank')}>
        <div className="sb-game-row">
          <div className="sb-side">
            {g.awayLogo&&<img className="sb-logo" src={g.awayLogo} alt="" onError={e=>e.target.style.display='none'}/>}
            <span className="sb-abbr">{g.awayAbbr||g.awayName}</span>
          </div>
          <span className={`sb-num ${awayWin?'winner':final?'loser':''}`}>{g.awayScore||'—'}</span>
        </div>
        <div className="sb-game-row">
          <div className="sb-side">
            {g.homeLogo&&<img className="sb-logo" src={g.homeLogo} alt="" onError={e=>e.target.style.display='none'}/>}
            <span className="sb-abbr">{g.homeAbbr||g.homeName}</span>
          </div>
          <span className={`sb-num ${homeWin?'winner':final?'loser':''}`}>{g.homeScore||'—'}</span>
        </div>
        <div className={`sb-status ${live?'live':final?'final':'pre'}`}>
          {isFav&&<span className="sb-fav-star">★</span>}
          {live?'● LIVE · ':''}{g.status||fmtDate(g.date)}
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
        const sorted = [...games].sort((a,b)=>{
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
            <button className="sb-league-head" onClick={()=>setExpanded(s=>({...s,[L.key]:!s[L.key]}))}>
              <span style={{color:L.accent,fontWeight:700}}>{L.emoji} {L.label}</span>
              <span className="sb-league-meta">
                {games.length===0
                  ? <span style={{color:'var(--text3)',fontStyle:'italic'}}>No games today</span>
                  : <><span>{games.length} {games.length===1?'game':'games'}</span>{favCount>0&&<span className="sb-league-fav">★ {favCount}</span>}</>}
              </span>
              <span className="sb-chevron">{isOpen?'▾':'▸'}</span>
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
function Sidebar({cat, arts, kw, health, activeKw, setActiveKw, activeSource, setActiveSource, onRead, scores, scoresLoading, showScoreboard, recommended}) {
  const cc = CATS[cat]||CATS.general;
  const catKws = kw[cat]||[];
  const catArts = arts[cat]||[];
  const srcCounts = {};
  catArts.forEach(a=>{srcCounts[a.source]=(srcCounts[a.source]||0)+1;});
  const sources = [...new Set(catArts.map(a=>a.source))];

  const [showSources, setShowSources] = useState(false);
  const [showAllSrcs, setShowAllSrcs] = useState(false);
  useEffect(() => { if (activeSource) setShowSources(true); }, [activeSource]);

  // Trending list respects active filters
  const sbItems = useMemo(() => {
    let items = catArts;
    if (activeKw) items = items.filter(a => (a.title+' '+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));
    if (activeSource) items = items.filter(a => a.source === activeSource);
    return items.slice(0, 8).map(a => ({...a, _cat: cat}));
  }, [catArts, cat, activeKw, activeSource]);

  // Today's Topics: merge user keywords + auto-derived trending topics with counts
  const topicItems = useMemo(() => {
    const autoTopics = getTrendingTopics(catArts, 14);
    const allLabels = [...new Set([...catKws, ...autoTopics])];
    return allLabels.map(t => ({
      label: t,
      count: catArts.filter(a => (a.title+' '+(a.desc||'')).toLowerCase().includes(t.toLowerCase())).length,
      isSaved: catKws.includes(t),
    })).filter(t => t.count > 0).sort((a,b) => b.count - a.count).slice(0, 16);
  }, [catArts, catKws]);

  const visibleSrcs = showAllSrcs ? sources : sources.slice(0, 10);

  const handleTopicClick = (label) => {
    setActiveKw(activeKw === label ? null : label);
    setTimeout(() => window.scrollTo({top: 0, behavior: 'smooth'}), 50);
  };

  return (
    <div className="sidebar">
      {(activeKw||activeSource) && (
        <div className="gs-filter">
          {activeKw && <><span className="gs-filter-label">🔍 {activeKw}</span><button className="gs-filter-x" onClick={()=>setActiveKw(null)}>✕</button></>}
          {activeSource && <><span className="gs-filter-label" style={{color:cc.color}}>📰 {activeSource}</span><button className="gs-filter-x" style={{color:cc.color}} onClick={()=>setActiveSource(null)}>✕</button></>}
        </div>
      )}

      {showScoreboard && <Scoreboard scores={scores} loading={scoresLoading}/>}

      {/* Trending headlines */}
      <div className="sidebar-section">
        <div className="sidebar-sec-head">
          <span className="sidebar-sec-label">
            {activeKw ? `🔍 ${activeKw}` : activeSource ? `📰 ${activeSource}` : `🔥 Trending in ${cc.label}`}
          </span>
        </div>
        {sbItems.length === 0
          ? <div style={{padding:'10px 0',fontSize:'11px',color:'var(--text3)'}}>No stories yet</div>
          : sbItems.map((a, i) => (
              <div key={i} className="trend-row" onClick={()=>onRead(a)}>
                <div className="trend-num">{i+1}</div>
                <div className="trend-body">
                  <div className="trend-title">{a.title}</div>
                  <div className="trend-src">{a.source} · {fmtDate(a.pubDate)}</div>
                </div>
              </div>
            ))
        }
      </div>

      {/* Today's Topics Panel — always visible, auto-derived + user keywords */}
      {topicItems.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-sec-head">
            <span className="sidebar-sec-label">Today's Topics</span>
            {activeKw && <button className="sidebar-sec-action" onClick={()=>setActiveKw(null)}>Clear</button>}
          </div>
          <div className="ttp-chips">
            {topicItems.map((t, i) => (
              <span key={i}
                className={`ttp-chip${activeKw===t.label?' active':''}${t.isSaved?' saved':''}`}
                style={activeKw===t.label ? {background:cc.color} : {}}
                onClick={()=>handleTopicClick(t.label)}>
                {t.label}
                <span className="ttp-count">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources — collapsible pill grid */}
      {sources.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-sec-head">
            <button className="sidebar-sec-collapse" onClick={()=>setShowSources(s=>!s)}>
              <span className="sidebar-sec-label">
                {activeSource ? `Source: ${activeSource}` : `Sources · ${sources.length}`}
              </span>
              <span className="gs-collapse-chevron" style={{fontSize:'10px',color:'var(--text4)'}}>{showSources?'▾':'▸'}</span>
            </button>
            {activeSource && showSources && <button className="sidebar-sec-action" onClick={()=>setActiveSource(null)}>Clear</button>}
          </div>
          {showSources && (
            <>
              <div className="src-pills">
                {visibleSrcs.map((name,i)=>{
                  const h=health[name];
                  const dotCls=h==='green'?'h-green':h==='yellow'?'h-yellow':h==='red'?'h-red':'h-gray';
                  return (
                    <button key={i}
                      className={`src-pill${activeSource===name?' active':''}`}
                      onClick={()=>setActiveSource(activeSource===name?null:name)}>
                      <span className={`src-pill-dot ${dotCls}`}/>
                      {name}
                      <span className="src-pill-count">{srcCounts[name]||0}</span>
                    </button>
                  );
                })}
              </div>
              {sources.length > 10 && (
                <button className="src-show-more" onClick={()=>setShowAllSrcs(s=>!s)}>
                  {showAllSrcs ? 'Show less ▴' : `+${sources.length-10} more ▾`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* v36: For You — personalized recommendations based on reading/search history */}
      {recommended && recommended.length > 0 && (
        <div className="sidebar-section rec-section">
          <div className="sidebar-sec-head">
            <span className="sidebar-sec-label">⭐ For You</span>
            <span className="rec-section-sub">Based on your interests</span>
          </div>
          {recommended.slice(0, 5).map((a, i) => (
            <div key={i} className="rec-row" onClick={()=>onRead(a)}>
              {a.img && <div className="rec-thumb" style={{backgroundImage:`url(${a.img})`}}/>}
              <div className="rec-body">
                <div className="rec-title">{a.title}</div>
                <div className="rec-src">{a.source} · {fmtDate(a.pubDate)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
          <span key={f.name} style={{display:'inline-flex',alignItems:'center'}}>
            <a className="src-footer-link" href={SOURCE_URLS[f.name]} target="_blank" rel="noreferrer">{f.name}</a>
            {i<sources.length-1&&<span className="src-footer-sep">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── CUSTOMIZE PANEL ──────────────────────────────────────────────────────────
const CAT_LABELS = {general:'🌐 General',sports:'🏆 Sports',business:'⚡ Business',finance:'📈 Markets',bloom:'🔋 Energy',tech:'🤖 AI & Tech',popculture:'✨ Pop Culture',comedy:'😂 Comedy'};
const PLAT_LABELS = {twitter:'𝕏',linkedin:'in',instagram:'IG',youtube:'▶'};

function CustomizePanel({feeds, kw, alerts, urgent, social, watchlist, teams, health, arts, weatherCities, hiddenIndices, briefingExclude, initialTab, initialCat, onClose, onSave}) {
  const [lf, setLf] = useState(JSON.parse(JSON.stringify(feeds)));
  const [lk, setLk] = useState(JSON.parse(JSON.stringify(kw)));
  const [la, setLa] = useState([...alerts]);
  const [lu, setLu] = useState([...(urgent||[])]);
  const [lw, setLw] = useState(JSON.parse(JSON.stringify(watchlist||[])));
  const [lbe, setLbe] = useState([...(briefingExclude||['comedy'])]);
  const [newSym, setNewSym] = useState('');
  const [newSymName, setNewSymName] = useState('');
  const [ls, setLs] = useState(JSON.parse(JSON.stringify(social)));
  const [lwx, setLwx] = useState(JSON.parse(JSON.stringify(weatherCities||DEFAULT_WEATHER_CITIES)));
  const [lhi, setLhi] = useState([...(hiddenIndices||[])]);
  const [newCityName, setNewCityName] = useState('');
  const [newCityLat, setNewCityLat] = useState('');
  const [newCityLon, setNewCityLon] = useState('');
  // v23: editable favorite teams
  const [lt, setLt] = useState(JSON.parse(JSON.stringify(teams||[])));
  const [newTeam, setNewTeam] = useState({team:'',match:'',sport:'football',league:'nfl',emoji:'🏈',espnUrl:'',teamUrl:''});
  const [secTab, setSecTab] = useState(initialTab||'keywords');
  const [kwTab, setKwTab] = useState(initialCat||'general');
  const [srcTab, setSrcTab] = useState(initialCat||'general');
  const [socCat, setSocCat] = useState(initialCat||'general');
  const [socPlat, setSocPlat] = useState('twitter');
  const [newKw, setNewKw] = useState('');
  const [newAlert, setNewAlert] = useState('');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [testState, setTestState] = useState({});

  const testFeed = async (url, key) => {
    setTestState(s=>({...s,[key]:'loading'}));
    const {items,reason} = await fetchRSS(url);
    setTestState(s=>({...s,[key]:items.length>0?`ok:${items.length} articles`:`fail:${reason||'empty'}`}));
  };
  const addSource = () => {
    if (!newName.trim()||!newUrl.trim()) return;
    setLf(prev=>{const n=JSON.parse(JSON.stringify(prev));if(!n[srcTab])n[srcTab]=[];n[srcTab].push({name:newName.trim(),url:newUrl.trim(),on:true});return n;});
    setNewName(''); setNewUrl('');
  };
  const addHandle = () => {
    const h=newHandle.trim(); if (!h) return;
    setLs(prev=>{
      const n=JSON.parse(JSON.stringify(prev));
      if(!n[socCat])n[socCat]={twitter:[],linkedin:[],instagram:[],youtube:[]};
      if(!n[socCat][socPlat])n[socCat][socPlat]=[];
      const formatted=socPlat==='linkedin'?h:(h.startsWith('@')?h:'@'+h);
      if(!n[socCat][socPlat].includes(formatted))n[socCat][socPlat].push(formatted);
      return n;
    });
    setNewHandle('');
  };
  const removeHandle = idx => {
    setLs(prev=>{const n=JSON.parse(JSON.stringify(prev));n[socCat][socPlat].splice(idx,1);return n;});
  };
  const countBySource = (cat,name) => (arts[cat]||[]).filter(a=>a.source===name).length;

  const TestResult = ({tkey}) => {
    const ts=testState[tkey]; if(!ts) return null;
    const isOk=ts.startsWith('ok'), isLoad=ts==='loading';
    const msg=isLoad?'Testing…':isOk?`✓ ${ts.replace('ok:','')}`:`✗ ${ts.replace('fail:','Failed — ')}`;
    return <div className={`cp-test-result ${isLoad?'cp-test-load':isOk?'cp-test-ok':'cp-test-fail'}`}>{msg}</div>;
  };

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-panel" onClick={e=>e.stopPropagation()}>
        <div className="cp-head"><span className="cp-title">Customize</span><button className="cp-x" onClick={onClose}>✕</button></div>
        <div className="cp-body">
          <div className="cp-sec-tabs">
            {['keywords','alerts','sources','social','watchlist','teams','datastrip','briefing'].map(t=>(
              <button key={t} className={`cp-sec-tab ${secTab===t?'active':''}`} onClick={()=>setSecTab(t)}>
                {t==='keywords'?'Keywords':t==='alerts'?'Alerts':t==='sources'?'Sources':t==='social'?'Social':t==='watchlist'?'📈 Watchlist':t==='teams'?'🏆 Teams':t==='briefing'?'☕ Briefing':'🌤 Data Strip'}
              </button>
            ))}
          </div>

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

          {secTab==='teams' && (
            <div className="cp-sec">
              <div className="cp-lbl">Favorite Teams</div>
              <div className="cp-desc">Teams shown as pills on the Sports page. Match terms are used to filter articles. ESPN/Team URLs power the external links on each pill.</div>
              {lt.map((t,i)=>(
                <div key={i} className="cp-team-row">
                  <div className="cp-team-row-head">
                    <span style={{fontSize:'18px'}}>{t.emoji}</span>
                    <strong style={{fontSize:'12px',color:'var(--text)',flex:1}}>{t.team}</strong>
                    <span style={{fontSize:'10px',color:'var(--text3)'}}>{(t.sport||'').toUpperCase()} · {(t.league||'').toUpperCase()}</span>
                    <button className="cp-del" onClick={()=>setLt(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <div className="cp-team-row-body">
                    <div style={{fontSize:'10px',color:'var(--text3)'}}>Match: <span style={{color:'var(--text2)'}}>{t.match||'(none)'}</span></div>
                    {t.espnUrl && <div style={{fontSize:'10px',color:'var(--text3)'}}>ESPN: <a href={t.espnUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{t.espnUrl.length>50?t.espnUrl.slice(0,50)+'…':t.espnUrl}</a></div>}
                    {t.teamUrl && <div style={{fontSize:'10px',color:'var(--text3)'}}>Team: <a href={t.teamUrl} target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>{t.teamUrl.length>50?t.teamUrl.slice(0,50)+'…':t.teamUrl}</a></div>}
                  </div>
                </div>
              ))}
              {lt.length===0 && <div style={{fontSize:'11px',color:'var(--text3)',padding:'10px 0'}}>No teams yet</div>}
              <div className="cp-add-src" style={{marginTop:'14px'}}>
                <div className="cp-add-src-title">+ Add team</div>
                <input className="cp-input-sm" placeholder="Display name (e.g. Houston Texans)" value={newTeam.team} onChange={e=>setNewTeam(t=>({...t,team:e.target.value}))}/>
                <input className="cp-input-sm" placeholder="Match term used to find articles (e.g. Houston Texans)" value={newTeam.match} onChange={e=>setNewTeam(t=>({...t,match:e.target.value}))}/>
                <div style={{display:'flex',gap:'6px'}}>
                  <select className="cp-input-sm" style={{flex:1}} value={newTeam.sport} onChange={e=>setNewTeam(t=>({...t,sport:e.target.value}))}>
                    <option value="football">Football</option>
                    <option value="basketball">Basketball</option>
                    <option value="baseball">Baseball</option>
                    <option value="hockey">Hockey</option>
                    <option value="soccer">Soccer</option>
                  </select>
                  <select className="cp-input-sm" style={{flex:1}} value={newTeam.league} onChange={e=>setNewTeam(t=>({...t,league:e.target.value}))}>
                    <option value="nfl">NFL</option>
                    <option value="nba">NBA</option>
                    <option value="mlb">MLB</option>
                    <option value="nhl">NHL</option>
                    <option value="college-football">College Football</option>
                    <option value="mens-college-basketball">College Basketball</option>
                    <option value="womens-college-basketball">Women's College Basketball</option>
                  </select>
                  <input className="cp-input-sm" style={{width:'60px'}} placeholder="🏈" value={newTeam.emoji} onChange={e=>setNewTeam(t=>({...t,emoji:e.target.value}))}/>
                </div>
                <input className="cp-input-sm" placeholder="ESPN URL (optional)" value={newTeam.espnUrl} onChange={e=>setNewTeam(t=>({...t,espnUrl:e.target.value}))}/>
                <input className="cp-input-sm" placeholder="Official team URL (optional)" value={newTeam.teamUrl} onChange={e=>setNewTeam(t=>({...t,teamUrl:e.target.value}))}/>
                <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
                  if (newTeam.team.trim() && newTeam.match.trim()) {
                    setLt(prev=>[...prev, {...newTeam, team:newTeam.team.trim(), match:newTeam.match.trim()}]);
                    setNewTeam({team:'',match:'',sport:'football',league:'nfl',emoji:'🏈',espnUrl:'',teamUrl:''});
                  }
                }}>Add Team</button>
              </div>
            </div>
          )}

          {secTab==='datastrip' && (
            <div className="cp-sec">
              <div className="cp-lbl">Weather Cities</div>
              <div className="cp-desc">Choose which cities appear in the top data strip. Uses open-meteo.com (no API key needed).</div>
              {lwx.map((city, i) => (
                <div key={i} className="cp-src-row">
                  <span className="cp-src-name">{city.name} ({city.lat.toFixed(2)}, {city.lon.toFixed(2)})</span>
                  <button className="cp-del" onClick={() => setLwx(prev => prev.filter((_,j) => j !== i))}>✕</button>
                </div>
              ))}
              <div className="cp-add-src" style={{marginTop:'8px'}}>
                <div className="cp-add-src-title">Add a city</div>
                <input className="cp-input-sm" placeholder="City name (e.g. Austin)" value={newCityName} onChange={e=>setNewCityName(e.target.value)}/>
                <div style={{display:'flex',gap:'6px'}}>
                  <input className="cp-input-sm" placeholder="Latitude (e.g. 30.27)" value={newCityLat} onChange={e=>setNewCityLat(e.target.value)}/>
                  <input className="cp-input-sm" placeholder="Longitude (e.g. -97.74)" value={newCityLon} onChange={e=>setNewCityLon(e.target.value)}/>
                </div>
                <button className="cp-btn" style={{width:'100%'}} onClick={()=>{
                  const name=newCityName.trim();
                  const lat=parseFloat(newCityLat);
                  const lon=parseFloat(newCityLon);
                  if (name && !isNaN(lat) && !isNaN(lon)) {
                    const tz = lat > 0 ? (lon > -90 ? 'America/New_York' : 'America/Chicago') : 'UTC';
                    const slug = name.replace(/\s+/g,'+');
                    setLwx(prev=>[...prev,{name,lat,lon,tz,slug}]);
                    setNewCityName(''); setNewCityLat(''); setNewCityLon('');
                  }
                }}>Add City</button>
              </div>
              <div className="cp-lbl" style={{marginTop:'16px'}}>Market Indices in Strip</div>
              <div className="cp-desc">Toggle which indices appear in the data strip. Uncheck any to hide.</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',margin:'8px 0'}}>
                {INDICES.map(idx => (
                  <label key={idx.sym} style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',cursor:'pointer'}}>
                    <input type="checkbox"
                      checked={!lhi.includes(idx.sym)}
                      onChange={e => setLhi(prev => e.target.checked ? prev.filter(s=>s!==idx.sym) : [...prev,idx.sym])}
                    />
                    {idx.label} ({idx.short})
                  </label>
                ))}
              </div>
              <div className="cp-lbl" style={{marginTop:'12px'}}>Watchlist Tickers in Strip</div>
              <div className="cp-desc">Your watchlist tickers also appear — manage them in the Watchlist tab.</div>
              <div style={{fontSize:'11px',color:'var(--text2)',background:'var(--surface2)',borderRadius:'6px',padding:'8px 10px'}}>
                Current watchlist: {lw.map(w=>w.sym).join(' · ') || 'none'}
              </div>
            </div>
          )}

          {secTab==='briefing' && (
            <div className="cp-sec">
              <div className="cp-lbl">☕ Morning Briefing Sources</div>
              <div className="cp-desc">The briefing pulls top headlines from each category. Toggle categories off to exclude them from the briefing synthesis.</div>
              <div className="cp-lbl" style={{marginTop:'14px'}}>Priority Sources (always included when available)</div>
              <div className="cp-desc" style={{marginBottom:'8px'}}>
                {BRIEFING_PRIORITY_SOURCES.map(s=>(
                  <span key={s} style={{display:'inline-block',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'3px 10px',fontSize:'11px',fontWeight:600,marginRight:'6px',marginBottom:'4px'}}>{s}</span>
                ))}
                <div style={{marginTop:'6px',fontSize:'10px',color:'var(--text3)'}}>Make sure these are enabled in your General sources tab for best results.</div>
              </div>
              <div className="cp-lbl" style={{marginTop:'14px'}}>Categories included in briefing</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
                {Object.entries(CAT_LABELS).map(([cat,label])=>{
                  const excluded = lbe.includes(cat);
                  return (
                    <label key={cat} style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer',
                      background:excluded?'var(--surface2)':'var(--surface)',
                      border:`1px solid ${excluded?'var(--border)':'var(--accent)'}`,
                      borderRadius:'20px',padding:'5px 12px',fontSize:'12px',fontWeight:600,
                      color:excluded?'var(--text3)':'var(--text)',transition:'all 0.15s'}}>
                      <input type="checkbox" style={{accentColor:'var(--accent)'}}
                        checked={!excluded}
                        onChange={()=>setLbe(prev=>excluded?prev.filter(c=>c!==cat):[...prev,cat])}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              <div style={{marginTop:'12px',fontSize:'11px',color:'var(--text3)'}}>
                Currently excluded: {lbe.length===0?'none':lbe.map(c=>CAT_LABELS[c]||c).join(', ')}
              </div>
            </div>
          )}

          <button className="cp-save" onClick={()=>onSave({feeds:lf,kw:lk,alerts:la,urgent:lu,social:ls,watchlist:lw,teams:lt,weatherCities:lwx,hiddenIndices:lhi,briefingExclude:lbe})}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE COMPONENTS (v16) ──────────────────────────────────────────────────

// Bottom-sheet drawer for overflow nav destinations + actions. Triggered by
// the "More" button in the bottom tab bar. Groups secondary destinations
// (Finance, Bloom, Comedy, Podcasts, Social) and actions (refresh, theme,
// customize) so the bottom tab bar can stay focused on the 3 primary
// destinations a mobile user actually uses for quick check-ins.
function MenuSheet({ tab, onTabChange, onClose, onCustomize, onRefresh, dark, setDark, search, onSearch, trendingTopics }) {
  const items = [
    { key:'briefing',   emoji:'☕', label:'The Briefing' },
    { key:'podcasts',   emoji:'🎙️', label:'Podcasts' },
  ];
  return (
    <div className="menu-sheet-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={e=>e.stopPropagation()}>
        <div className="menu-sheet-grab"/>
        <div className="ms-search-wrap">
          <input
            className="ms-search-input"
            placeholder="Search news…"
            value={search}
            onChange={e=>{ onSearch(e.target.value); if(e.target.value) onClose(); }}
            onKeyDown={e=>{ if(e.key==='Enter'&&search) onClose(); }}
            autoFocus={false}
          />
        </div>
        {trendingTopics && trendingTopics.length > 0 && (
          <div className="ms-trending">
            {trendingTopics.slice(0,6).map((t,i)=>(
              <span key={i} className="ms-trending-chip" onClick={()=>{ onSearch(t); onClose(); }}>{t}</span>
            ))}
          </div>
        )}
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
        <button className="menu-sheet-item" onClick={() => { onRefresh(); onClose(); }}>
          <span className="menu-sheet-item-emoji">↺</span>
          <span className="menu-sheet-item-label">Refresh all feeds</span>
        </button>
        <button className="menu-sheet-item" onClick={() => setDark(d=>!d)}>
          <span className="menu-sheet-item-emoji">{dark?'☀️':'🌙'}</span>
          <span className="menu-sheet-item-label">{dark?'Light mode':'Dark mode'}</span>
        </button>
        <button className="menu-sheet-item" onClick={() => { onCustomize(); onClose(); }}>
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
// "Feed" intelligently targets the last-visited news category if you're
// already on one (mirrors Yahoo Sports "Following" behavior — tapping doesn't
// throw you off your current context). Hidden on desktop via CSS.
function BottomTabBar({ tab, onTabChange, onMenuOpen, savedCount, lastFeedTab }) {
  // v24a: 'Home' tab routes to General (the new homepage). 'Feed' still
  // routes to last-visited category. If user is already on General, both
  // tabs visually highlight 'Home' so the chip-bar is the way to navigate.
  const inOtherFeed = ['sports','business','finance','bloom','popculture','comedy'].includes(tab);
  const feedTarget = inOtherFeed ? tab : (lastFeedTab && lastFeedTab !== 'general' ? lastFeedTab : 'sports');
  const tabs = [
    { key:'home',   emoji:'🏠', label:'Home',   active: tab === 'general', target:'general' },
    { key:'feed',   emoji:'📰', label:'Feed',   active: inOtherFeed, target: feedTarget },
    { key:'saved',  emoji:'★',  label:savedCount>0?`Saved (${savedCount})`:'Saved', active: tab === 'saved' },
    { key:'menu',   emoji:'☰',  label:'More',   isMenu: true },
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
      <span className={refreshing?'ptr-spin':''}>↻</span>
    </div>
  );
}

// RIGHT NOW strip — unified "what's happening this minute" row sitting
// above the hero on Today. Merges three live signals:
//   1. Urgent news headlines (from breakingItems / urgent words)
//   2. Favorite-team live games (ESPN scores, state === 'in')
//   3. Big watchlist moves (>=2% up or down)
// One glanceable row. Caps total items at 6 so it doesn't become a ticker.
function RightNowStrip({ breakingItems, scores, marketData, watchlist, onOpen, onNavigate }) {
  const items = useMemo(() => {
    const out = [];

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
  }, [breakingItems, scores, marketData, watchlist]);

  if (items.length === 0) return null;

  return (
    <div className="rn-strip">
      <span className="rn-label">
        <span className="rn-pulse"/>
        Breaking & Right Now
      </span>
      <div className="rn-items">
        {items.map((it, i) => (
          <span key={it.key} className={`rn-item ${it.kind==='urgent'?'urgent':''}`} onClick={() => {
            if (it.article) onOpen(it.article);
            else if (it.link) window.open(it.link, '_blank');
          }}>
            <span className="rn-item-kind">{it.emoji}</span>
            <span className="rn-item-text">{it.text}</span>
            {it.val && <span className={`rn-item-val ${it.valClass||''}`}>{it.val}</span>}
            {it.sub && <span style={{color:'var(--text3)',fontSize:'10px'}}>· {it.sub}</span>}
            {i < items.length - 1 && <span className="rn-divider" style={{marginLeft:10}}/>}
          </span>
        ))}
      </div>
    </div>
  );
}

// FollowingStrip removed in v21 per user — low signal, consumed above-fold space.

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
            <div key={i} className="trending-card" onClick={() => onRead(a)}>
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

// MINI SCOREBOARD STRIP — v20 — slim horizontal row of live/recent games
// involving favorite teams. Sits ABOVE the Sports section on Today. Ghost
// treatment: no card chrome, just typography + inline scores. Falls back to
// "Recent" when no games are live.
function MiniScoreboardStrip({ scores, onOpen }) {
  // Flatten all games across leagues; prioritize favorites + live games
  const games = useMemo(() => {
    const all = Object.values(scores || {}).flat();
    if (!all.length) return [];
    const isLive = g => g.state === 'in';
    const isFav  = g => (typeof favoriteIn === 'function' ? !!favoriteIn(g) : false);
    const sortKey = g => (isFav(g) ? 0 : 1) * 10 + (isLive(g) ? 0 : 1);
    return [...all].sort((a,b) => sortKey(a) - sortKey(b)).slice(0, 6);
  }, [scores]);

  if (games.length === 0) return null;

  return (
    <div className="mini-sb-strip">
      <span className="mini-sb-label">🏆 Scores</span>
      <div className="mini-sb-items">
        {games.map(g => {
          const live = g.state === 'in';
          const home = g.homeAbbr || g.homeName || 'HOME';
          const away = g.awayAbbr || g.awayName || 'AWAY';
          return (
            <span key={g.id}
              className={`mini-sb-item ${live?'live':''}`}
              onClick={()=>g.link && window.open(g.link, '_blank')}>
              {live && <span className="mini-sb-dot"/>}
              <span className="mini-sb-teams">
                {away} <span className="mini-sb-score">{g.awayScore}</span>
                <span className="mini-sb-sep">·</span>
                <span className="mini-sb-score">{g.homeScore}</span> {home}
              </span>
              <span className="mini-sb-status">{g.status}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// SPORTS SCORE STRIP — v23 — Yahoo Sports' signature dark-navy horizontal
// score tile strip. Sits at the top of SportsPage. Each tile shows a game
// (live → recent → upcoming priority). Favorites starred + pinned first.
// Click any tile → opens ESPN game page.
function SportsScoreStrip({ scores, teams }) {
  const tiles = useMemo(() => {
    const all = Object.values(scores || {}).flat();
    if (!all.length) return [];
    const isLive = g => g.state === 'in';
    const isFav  = g => !!favoriteInList(g, teams);
    // Chronological: live first, upcoming by start time, finals by recency; favs float up within each group
    return [...all].sort((a, b) => {
      const favDiff = (isFav(b)?1:0) - (isFav(a)?1:0);
      if (favDiff !== 0) return favDiff;
      const stateOrd = g => g.state === 'in' ? 0 : g.state === 'pre' ? 1 : g.state === 'post' ? 2 : 3;
      const soDiff = stateOrd(a) - stateOrd(b);
      if (soDiff !== 0) return soDiff;
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return stateOrd(a) === 2 ? tb - ta : ta - tb; // finals newest first; live/upcoming earliest first
    }).slice(0, 14);
  }, [scores, teams]);

  if (tiles.length === 0) return (
    <div className="sports-score-strip empty">
      <span className="sports-score-strip-empty">No games today across selected leagues</span>
    </div>
  );

  return (
    <div className="sports-score-strip">
      <div className="sports-score-strip-inner">
        {tiles.map(g => {
          const live = g.state === 'in';
          const final = g.state === 'post';
          const fav = favoriteInList(g, teams);
          const home = g.homeAbbr || g.homeName || 'HOME';
          const away = g.awayAbbr || g.awayName || 'AWAY';
          const h = parseInt(g.homeScore)||0, a = parseInt(g.awayScore)||0;
          const homeWin = final && h>a, awayWin = final && a>h;
          return (
            <div key={g.id}
              className={`sst-tile ${live?'live':''} ${fav?'fav':''}`}
              onClick={()=>g.link && window.open(g.link, '_blank')}>
              {fav && <span className="sst-fav-star">★</span>}
              {g.league && <div className="sst-league-badge">{g.league.toUpperCase()}</div>}
              <div className="sst-row">
                <span className={`sst-team ${awayWin?'win':final?'loss':''}`}>{away}</span>
                <span className={`sst-score ${awayWin?'win':final?'loss':''}`}>{g.awayScore || '—'}</span>
              </div>
              <div className="sst-row">
                <span className={`sst-team ${homeWin?'win':final?'loss':''}`}>{home}</span>
                <span className={`sst-score ${homeWin?'win':final?'loss':''}`}>{g.homeScore || '—'}</span>
              </div>
              <div className={`sst-status ${live?'live':final?'final':'pre'}`}>
                {live && <span className="sst-live-dot"/>}
                {g.status || (final?'FINAL':fmtDate(g.date))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// HERO BAND — v19 — Yahoo News / NBC News two-column top band.
// Desktop: hero left (~60%) with gradient overlay + serif title sitting
// on the photo, vertical stack of 5 secondary headlines on right (~40%).
// Mobile: single-column, headlines below hero.
// Purpose: put 5 headlines on screen WITH the hero so user gets density
// + snapshot the moment the page opens.
function HeroBand({ heroStories, heroIdx, setHeroIdx, paused, setPaused, onRead }) {
  const lead = heroStories[heroIdx];
  if (!lead) return null;
  // Secondary headlines = the rest of the ranked set (up to 5)
  const secondary = heroStories.slice(0, 6).filter((_, i) => i !== heroIdx).slice(0, 5);

  return (
    <div
      className="hero-band"
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
    >
      {/* LEFT: large lead */}
      <article className="hero-band-lead" onClick={()=>onRead(lead)}>
        <div className="hero-band-img" style={{backgroundImage:`url(${lead.img})`}}>
          <div className="hero-band-grad"/>
          <div className="hero-band-text-overlay">
            <div className="hero-band-badge" style={{background:(CATS[lead._cat]?.color||'#1d4ed8')}}>
              {CATS[lead._cat]?.emoji} {CATS[lead._cat]?.label||'News'}
            </div>
            <h1 className="hero-band-title">{lead.title}</h1>
            {lead.desc && <p className="hero-band-desc">{lead.desc}</p>}
            <div className="hero-band-meta">
              <span className="hero-band-source">{lead.source}</span>
              <span>·</span>
              <span>{fmtDate(lead.pubDate)}</span>
            </div>
          </div>
          {heroStories.length > 1 && (
            <div className="hero-band-dots">
              {heroStories.slice(0,5).map((_,i)=>(
                <button key={i}
                  className={`hero-band-dot ${i===heroIdx?'active':''}`}
                  onClick={e=>{e.stopPropagation();setHeroIdx(i);}}
                  aria-label={`Story ${i+1}`}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* RIGHT: secondary headline stack */}
      <aside className="hero-band-side">
        <div className="hero-band-side-label">More top stories</div>
        {secondary.map((s, i) => (
          <div key={i} className="hero-band-side-item" onClick={()=>onRead(s)}>
            {s.img && (
              <img
                className="hero-band-side-thumb"
                src={s.img}
                loading="lazy"
                alt=""
                onError={e=>{e.target.style.display='none';}}
              />
            )}
            <div className="hero-band-side-body">
              <div className="hero-band-side-title">{s.title}</div>
              <div className="hero-band-side-meta">
                <span style={{color:CATS[s._cat]?.color,fontWeight:700}}>{CATS[s._cat]?.label}</span>
                <span>·</span>
                <span>{s.source}</span>
              </div>
            </div>
          </div>
        ))}
      </aside>
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
  if (ageMin < 1) label = 'Just now';
  else if (ageMin < 60) label = `${Math.floor(ageMin)}m ago`;
  else label = `${Math.floor(ageMin/60)}h ago`;
  return (
    <span className="last-updated" onClick={onRefresh} style={onRefresh?{cursor:'pointer'}:{}}>
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
                 hidden, mobileSearchOpen, onMobileSearchToggle, weatherCities, hiddenIndices}) {
  const [wxList, setWxList] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [showBreaking, setShowBreaking] = useState(true);
  const cities = weatherCities || DEFAULT_WEATHER_CITIES;

  useEffect(()=>{
    fetchAllWeather(cities).then(setWxList);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[JSON.stringify(cities)]);

  useEffect(()=>{
    // v25: also fetch indices (S&P, DOW, Nasdaq) for the pill bar
    const allSyms = [...TICKERS.map(t=>t.sym), ...INDICES.map(i=>i.sym)];
    const fetchAll = () => allSyms.forEach(sym =>
      fetchQuote(sym).then(q=>q&&setQuotes(prev=>({...prev,[sym]:q})))
    );
    fetchAll();
    const iv=setInterval(fetchAll, 300000);
    return ()=>clearInterval(iv);
  },[]);

  const hasBreaking = breakingItems&&breakingItems.length>0;
  const tickerItems = hasBreaking?[...breakingItems,...breakingItems]:[];

  // v24a: Desktop nav per user: General · Business · Markets · Bloom · Sports · Pop Culture · Briefing · Podcasts · Saved
  const ALL_TABS = ['general','business','finance','bloom','tech','sports','popculture','briefing','podcasts','saved'];
  const TAB_LABELS = {bloom:'Energy',finance:'Markets',tech:'AI & Tech',popculture:'Pop Culture',podcasts:'Podcasts',saved:'Saved',briefing:'Briefing'};
  const TAB_CLASS  = {general:'t-general',sports:'t-sports',business:'t-business',finance:'t-finance',bloom:'t-bloom',tech:'t-tech',popculture:'t-popculture',podcasts:'t-podcasts'};

  // v24a Mobile chip bar per user: General · Business · Markets · Energy · Sports · Pop Culture
  // Briefing lives in the More menu; surfaced via teaser on General page.
  const MOBILE_CHIPS = [
    { key:'general',    label:'General',    color:CATS.general.color },
    { key:'business',   label:'Business',   color:CATS.business.color },
    { key:'finance',    label:'Markets',    color:CATS.finance.color },
    { key:'bloom',      label:'Energy',     color:CATS.bloom.color },
    { key:'tech',       label:'AI & Tech',  color:CATS.tech.color },
    { key:'sports',     label:'Sports',     color:CATS.sports.color },
    { key:'popculture', label:'Pop Culture',color:CATS.popculture.color },
  ];

  // Keep the active chip scrolled into view when tab changes (swipe or tap)
  const chipBarRef = useRef(null);
  useEffect(() => {
    if (!chipBarRef.current) return;
    const active = chipBarRef.current.querySelector('.chip.active');
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    }
  }, [tab]);

  return (
    <div className={`topbar-wrap ${hidden?'hidden':''}`}>
      {/* v25: Pill bar — replaces the cramped whisper bar. Bigger pills with
          color-coded change indicators. Horizontal scroll on narrow viewports.
          Shows weather + indices + tickers in priority order. */}
      <div className="pill-bar">
        <div className="pill-bar-inner">
          {wxList.map((wx,i)=>(
            <a key={`wx-${i}`} className="pill pill-wx"
               href={`https://weather.com/weather/today/l/${encodeURIComponent(wx.slug)}`}
               target="_blank" rel="noreferrer">
              <span className="pill-icon">{wx.emoji}</span>
              <div className="pill-body">
                <div className="pill-label">{wx.name}</div>
                <div className="pill-value">{wx.temp}°<span className="pill-sub"> {wx.desc}</span></div>
              </div>
            </a>
          ))}
          {INDICES.filter(idx=>!(hiddenIndices||[]).includes(idx.sym)).map(idx=>{
            const q=quotes[idx.sym]; const up=q?q.chg>=0:null;
            return (
              <div key={idx.sym} className="pill pill-idx" onClick={()=>q&&window.open(`https://finance.yahoo.com/quote/${encodeURIComponent(idx.sym)}`,'_blank')}>
                <div className="pill-body">
                  <div className="pill-label">{idx.short}</div>
                  <div className="pill-value">
                    {q ? q.price.toLocaleString('en-US',{maximumFractionDigits:0}) : '—'}
                  </div>
                </div>
                {q && (
                  <span className={`pill-chg ${up?'up':'down'}`}>
                    {up?'▲':'▼'} {Math.abs(q.pct).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
          {TICKERS.map(t=>{
            const q=quotes[t.sym]; const up=q?q.chg>=0:null;
            return (
              <div key={t.sym} className="pill pill-tk" onClick={()=>onTickerClick&&onTickerClick(t)}>
                <div className="pill-body">
                  <div className="pill-label" style={{color:t.color}}>{t.sym}</div>
                  <div className="pill-value">
                    {q ? `$${q.price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'}
                  </div>
                </div>
                {q && (
                  <span className={`pill-chg ${up?'up':'down'}`}>
                    {up?'▲':'▼'} {Math.abs(q.pct).toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ━━━ Breaking (both layouts). v22: hidden on Today since RightNowStrip
            already surfaces urgent items there — keeps breaking ticker available
            on every other page where RightNow doesn't render. ━━━ */}
      {hasBreaking && showBreaking && tab !== 'today' && (
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

        {/* v25: mobile-strip removed — pill-bar above the nav adapts to mobile
            via responsive CSS. Single horizontal scroll source for weather +
            tickers + indices on all viewports. */}

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
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ─── CHATBOT COMPONENT ───────────────────────────────────────────────────────
function ChatBot({ arts }) {
  const [open, setOpen] = useState(false);
  const [chatMode, setChatMode] = useState('chat'); // 'chat' | 'analyze'
  const [msgs, setMsgs] = useState([
    { role:'bot', text:"Hi! I'm your AI news assistant. Ask me anything about today's stories, markets, or sports.", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzeMode, setAnalyzeMode] = useState('summary');
  const [analyzeResult, setAnalyzeResult] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && chatMode === 'chat') messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, open, chatMode]);

  const QUICK = ["What's trending today?", "Sports update?", "Markets summary", "Top tech news"];
  const ANALYZE_MODES = [
    { key:'summary',   label:'Summarize' },
    { key:'takeaways', label:'Key Points' },
    { key:'bias',      label:'Bias Check' },
    { key:'related',   label:'Related Context' },
  ];

  const buildContext = () => {
    const headlines = [];
    Object.entries(arts).forEach(([cat, items]) => {
      (items || []).slice(0, 5).forEach(a => {
        headlines.push(`[${cat.toUpperCase()}] ${a.title}`);
      });
    });
    return headlines.slice(0, 40).join('\n');
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    const t = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setMsgs(m => [...m, { role:'user', text:q, time:t }]);
    setInput('');
    setLoading(true);
    const ctx = buildContext();
    const prompt = `You are a smart news briefing assistant. Current headlines:\n${ctx}\n\nUser question: ${q}\n\nAnswer concisely in 2-4 sentences, referencing specific stories when relevant.`;
    const { summary, error } = await fetchAISummary({ type:'article', title:'User Question', content:prompt, mode:'summary' });
    const t2 = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    setMsgs(m => [...m, { role:'bot', text: error ? `Sorry, I couldn't fetch that. Try again.` : (summary || 'No response.'), time:t2 }]);
    setLoading(false);
  };

  const analyze = async () => {
    const txt = analyzeText.trim();
    if (!txt || loading) return;
    setLoading(true);
    setAnalyzeResult('');
    const modePrompts = {
      summary:   'Summarize this article in 3-5 sentences, hitting the key facts.',
      takeaways: 'List the 5 most important takeaways from this article as bullet points.',
      bias:      'Analyze the bias and framing in this article. What perspective does it favor? What might it omit?',
      related:   'What broader context, history, or related topics should a reader understand about this article?',
    };
    const prompt = `${modePrompts[analyzeMode]}\n\nARTICLE:\n${txt}`;
    const { summary, error } = await fetchAISummary({ type:'article', title:'Article Analysis', content:prompt, mode:analyzeMode });
    setAnalyzeResult(error ? 'Analysis failed — please try again.' : (summary || 'No result.'));
    setLoading(false);
  };

  return (
    <>
      <button className={`chat-fab ${open?'open':''}`} onClick={() => setOpen(o => !o)} aria-label="Chat assistant">
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chat-drawer">
          <div className="chat-header">
            <div>
              <div className="chat-header-title"><span>✨</span> AI News Assistant</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-mode-tabs">
            <button className={`chat-mode-tab${chatMode==='chat'?' active':''}`} onClick={()=>setChatMode('chat')}>💬 Ask</button>
            <button className={`chat-mode-tab${chatMode==='analyze'?' active':''}`} onClick={()=>setChatMode('analyze')}>📋 Analyze</button>
          </div>
          {chatMode === 'chat' ? (
            <>
              <div className="chat-messages">
                {msgs.map((m, i) => (
                  <div key={i} className={`chat-msg ${m.role}`}>
                    <div className="chat-bubble">{m.text}</div>
                    <span className="chat-msg-time">{m.time}</span>
                  </div>
                ))}
                {loading && (
                  <div className="chat-msg bot">
                    <div className="chat-bubble" style={{padding:'10px 14px'}}>
                      <div className="chat-typing">
                        <div className="chat-typing-dot"/><div className="chat-typing-dot"/><div className="chat-typing-dot"/>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>
              {msgs.length <= 2 && (
                <div className="chat-quick-btns">
                  {QUICK.map(q => <button key={q} className="chat-quick-btn" onClick={() => send(q)}>{q}</button>)}
                </div>
              )}
              <div className="chat-input-row">
                <input className="chat-input" placeholder="Ask about today's news…" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}/>
                <button className="chat-send" onClick={() => send()} disabled={!input.trim() || loading}>➤</button>
              </div>
            </>
          ) : (
            <div className="chat-analyze">
              <div className="chat-analyze-modes">
                {ANALYZE_MODES.map(m => (
                  <button key={m.key} className={`chat-analyze-mode-btn${analyzeMode===m.key?' active':''}`}
                    onClick={()=>setAnalyzeMode(m.key)}>{m.label}</button>
                ))}
              </div>
              <textarea className="chat-analyze-input"
                placeholder="Paste article text or URL here…"
                value={analyzeText}
                onChange={e=>setAnalyzeText(e.target.value)}
                rows={5}
              />
              <button className="chat-analyze-go" onClick={analyze} disabled={!analyzeText.trim() || loading}>
                {loading ? 'Analyzing…' : '✨ Analyze'}
              </button>
              {analyzeResult && (
                <div className="chat-analyze-result">
                  <div className="chat-analyze-result-label">{ANALYZE_MODES.find(m=>m.key===analyzeMode)?.label}</div>
                  <div className="chat-analyze-result-text">{analyzeResult}</div>
                  <button className="chat-analyze-clear" onClick={()=>{setAnalyzeResult('');setAnalyzeText('');}}>Clear</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── ARTICLE READER ───────────────────────────────────────────────────────────
function ArticleReader({ article, onClose }) {
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState(null);

  const runAI = async (mode) => {
    setAiMode(mode);
    setAiLoading(true);
    setAiResult('');
    const result = await fetchAISummary({ type: mode, title: article.title, content: article.desc || article.title, mode: 'groq' });
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="article-reader-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="article-reader">
        <button className="article-reader-close" onClick={onClose} aria-label="Close">×</button>
        {article.img && <img className="article-reader-img" src={article.img} alt="" loading="lazy"/>}
        <div className="article-reader-body">
          <div className="article-reader-source">
            {article.source}
            {article.pubDate && <span className="article-reader-date">· {fmtDate(article.pubDate)}</span>}
          </div>
          <h2 className="article-reader-title">{article.title}</h2>
          {article.desc && <p className="article-reader-desc">{article.desc}</p>}
          <div className="article-reader-actions">
            <a className="article-reader-btn primary" href={article.link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
              Open Full Article ↗
            </a>
            <button className="article-reader-btn" onClick={() => runAI('summary')}>✦ Summarize</button>
            <button className="article-reader-btn" onClick={() => runAI('takeaways')}>Key Points</button>
            <button className="article-reader-btn" onClick={() => runAI('bias')}>Bias Check</button>
          </div>
          {aiLoading && <div className="article-reader-ai-result" style={{color:'var(--text3)'}}>Analyzing with AI…</div>}
          {!aiLoading && aiResult && (
            <div className="article-reader-ai-result">
              <div style={{fontWeight:700,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--accent)',marginBottom:'8px'}}>
                {aiMode === 'summary' ? 'Summary' : aiMode === 'takeaways' ? 'Key Points' : 'Bias Check'}
              </div>
              {aiResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab]           = useState('general');
  const [search, setSearch]     = useState('');
  const [dark, setDark]         = useState(()=>ld('dark',false));
  const [saved, setSaved]       = useState(()=>ld('saved',[]));
  const [clicks, setClicks]     = useState(()=>ld('clicks',{}));
  const [readLinks, setReadLinks] = useState(()=>new Set(ld('readLinks',[])));
  const [readerArticle, setReaderArticle] = useState(null);
  const [webResults, setWebResults] = useState([]);
  const [webLoading, setWebLoading] = useState(false);
  const [sourceRecs, setSourceRecs] = useState([]);
  const [kw, setKw]             = useState(()=>ld('kw',DEFAULT_KW));
  const [alerts, setAlerts]     = useState(()=>ld('alerts',['Texans','Astros','Kentucky','Clemson','ERCOT','Bloom Energy','fuel cell','hurricane','earthquake','breaking']));
  const [feeds, setFeeds]       = useState(()=>ld('feeds',DEFAULT_FEEDS));
  const [urgent, setUrgent]     = useState(()=>ld('urgent',DEFAULT_URGENT));
  const [watchlist, setWatchlist]= useState(()=>ld('watchlist',DEFAULT_WATCHLIST));
  // v23: customizable favorite teams. Defaults to SCORE_TEAMS; user can add/remove via Customize.
  const [teams, setTeams]       = useState(()=>ld('teams', SCORE_TEAMS));
  const [weatherCities, setWeatherCities] = useState(()=>ld('weatherCities', DEFAULT_WEATHER_CITIES));
  const [hiddenIndices, setHiddenIndices] = useState(()=>ld('hiddenIndices',[]));
  const [briefingExclude, setBriefingExclude] = useState(()=>ld('briefingExclude',['comedy']));
  const [marketData, setMarketData] = useState({});
  const [marketLoading, setMarketLoading] = useState(false);
  const [social, setSocial]     = useState(()=>ld('social',DEFAULT_SOCIAL));
  const [arts, setArts]         = useState({general:[],sports:[],business:[],finance:[],bloom:[],tech:[],popculture:[],comedy:[]});
  const [loading, setLoading]   = useState({general:false,sports:false,business:false,finance:false,bloom:false,tech:false,popculture:false,comedy:false});
  const [health, setHealth]     = useState({});
  const [podEps, setPodEps]     = useState({});
  const [podLoading, setPodLoading] = useState({});
  const [activePod, setActivePod]   = useState(null);
  const [showPanel, setShowPanel]   = useState(false);
  const [panelInitial, setPanelInitial] = useState({tab:'keywords',cat:'general'});
  const [activeKw, setActiveKw]     = useState(null);
  const [activeSrc, setActiveSrc]   = useState(null);
  const [scores, setScores]         = useState({});
  const [scoresLoading, setScoresLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState(()=>ld('searchHistory',[]));
  const [srcWebResults, setSrcWebResults] = useState([]);
  const [srcWebLoading, setSrcWebLoading] = useState(false);

  // ── v16 mobile + editorial state ──
  const [menuOpen, setMenuOpen]         = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [lastUpdated, setLastUpdated]   = useState({}); // per-cat timestamp
  const [lastFeedTab, setLastFeedTab]   = useState('general');
  const isMobile                        = useIsMobile();
  const headerHidden                    = useScrollDirection(isMobile);

  useEffect(()=>{sv('dark',dark);document.body.className=dark?'dark':'';},[dark]);
  useEffect(()=>{sv('saved',saved);},[saved]);
  useEffect(()=>{sv('clicks',clicks);},[clicks]);
  useEffect(()=>{sv('readLinks',[...readLinks]);},[readLinks]);

  // v36: Interest profile derived from reading history + saves + searches
  const interestProfile = useMemo(() => {
    const freq = {};
    const STOP = new Set(['the','and','for','a','an','to','in','of','on','is','it','at','by','or','be','as','with','this','that','from','are','was','were','has','have','had','but','not','can','will','their','they','we','you','all','said']);
    const addWords = (text, weight=1) => {
      if (!text) return;
      text.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).forEach(w => {
        if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + weight;
      });
    };
    saved.forEach(a => { addWords(a.title, 3); addWords(a.desc, 1); });
    [...readLinks].forEach(link => {
      const all = Object.values(arts).flat();
      const a = all.find(x => x.link === link);
      if (a) { addWords(a.title, 2); addWords(a.desc, 1); }
    });
    searchHistory.forEach(q => addWords(q, 4));
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w])=>w);
  }, [saved, readLinks, searchHistory, arts]);

  // v36: Recommended articles — score all unread/unsaved articles by interest profile
  const recommended = useMemo(() => {
    if (interestProfile.length === 0) return [];
    const all = Object.values(arts).flat();
    const scored = all.map(a => {
      if ((a.link && readLinks.has(a.link)) || saved.some(s=>s.link===a.link)) return null;
      const text = (a.title + ' ' + (a.desc||'')).toLowerCase();
      const score = interestProfile.reduce((s,w) => text.includes(w) ? s+1 : s, 0);
      return score > 0 ? { ...a, _recScore: score } : null;
    }).filter(Boolean);
    scored.sort((a,b) => b._recScore - a._recScore || new Date(b.pubDate) - new Date(a.pubDate));
    return scored.slice(0, 8);
  }, [arts, interestProfile, readLinks, saved]);

  // v20: whole-word urgent match + 6h recency window + cap 8.
  // Whole-word prevents "killed" matching "killed it" or "killing" substrings.
  // 6h window keeps breaking feeling live (was: any time).
  const breakingItems = useMemo(()=>{
    const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const wordBoundary = urgent.map(u => new RegExp(`\\b${u.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'i'));
    const seen = new Set();
    return Object.values(arts).flat()
      .filter(a => {
        const pub = new Date(a.pubDate).getTime();
        return pub > sixHoursAgo; // recency filter
      })
      .filter(a => {
        const txt = a.title + ' ' + (a.desc || '');
        return wordBoundary.some(rx => rx.test(txt));
      })
      .filter(a => {
        const k = a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 8);
  },[arts, urgent]);

  const kwMatch = useCallback(
    (a,cat)=>(kw[cat]||[]).filter(k=>(a.title+(a.desc||'')).toLowerCase().includes(k.toLowerCase())),
    [kw]
  );
  const dedupe = arr=>{const seen=new Set();return arr.filter(a=>{const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');if(seen.has(k))return false;seen.add(k);return true;});};

  const specificCatKeys = useMemo(()=>{
    const keys=new Set();
    ['sports','business','finance','bloom','popculture','comedy'].forEach(c=>{
      (arts[c]||[]).forEach(a=>{if(a.link)keys.add(a.link);if(a.title)keys.add(a.title.slice(0,60).toLowerCase().replace(/\s+/g,''));});
    });
    return keys;
  },[arts]);

  const sorted = useCallback((cat)=>{
    let arr=arts[cat]||[];
    if(search) arr=arr.filter(a=>(a.title+' '+(a.desc||'')+' '+(a.source||'')).toLowerCase().includes(search));
    if(activeKw) arr=arr.filter(a=>(a.title+(a.desc||'')).toLowerCase().includes(activeKw.toLowerCase()));
    if(activeSrc) arr=arr.filter(a=>a.source===activeSrc);
    arr=dedupe(arr);
    if(cat==='general') {
      arr=arr.filter(a=>{
        if(a.link&&specificCatKeys.has(a.link))return false;
        const k=a.title.slice(0,60).toLowerCase().replace(/\s+/g,'');
        return !specificCatKeys.has(k);
      });
    }
    arr.sort((a,b)=>{const ka=kwMatch(a,cat).length,kb=kwMatch(b,cat).length;if(kb!==ka)return kb-ka;return new Date(b.pubDate)-new Date(a.pubDate);});
    return arr.map(a=>({...a,matchedKw:kwMatch(a,cat),isAlert:urgent.some(u=>(a.title+(a.desc||'')).toLowerCase().includes(u.toLowerCase()))}));
  },[arts,search,activeKw,activeSrc,kwMatch,urgent,specificCatKeys]);

  const loadCat = useCallback(async (cat)=>{
    setLoading(l=>({...l,[cat]:true}));
    const results=[],hUpdates={};
    await Promise.allSettled((feeds[cat]||[]).filter(f=>f.on).map(async f=>{
      const t0=Date.now();const{items}=await fetchRSS(f.url);const ms=Date.now()-t0;
      hUpdates[f.name]=items.length>0?(ms<4000?'green':'yellow'):'red';
      items.forEach(i=>{if(i.title&&i.link)results.push({...i,source:f.name,cat});});
    }));
    setHealth(h=>({...h,...hUpdates}));
    results.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    setArts(a=>({...a,[cat]:results}));
    setLastUpdated(prev => ({...prev, [cat]: Date.now()}));
    setLoading(l=>({...l,[cat]:false}));
  },[feeds]);

  const loadPod = useCallback(async (pod)=>{
    setPodLoading(l=>({...l,[pod.name]:true}));
    const{items}=await fetchRSS(pod.url);
    setPodEps(p=>({...p,[pod.name]:items.map(e=>({...e,show:pod.name,host:pod.host,emoji:pod.emoji}))}));
    setPodLoading(l=>({...l,[pod.name]:false}));
  },[]);

  const loadScores = useCallback(async ()=>{
    setScoresLoading(true);
    setScores(await fetchAllScores());
    setScoresLoading(false);
  },[]);

  const loadMarketData = useCallback(async ()=>{
    setMarketLoading(true);
    const allSyms=[...INDICES.map(i=>i.sym),...watchlist.map(w=>w.sym)];
    const results={};
    await Promise.allSettled(allSyms.map(async sym=>{const q=await fetchQuote(sym);if(q)results[sym]=q;}));
    setMarketData(prev=>({...prev,...results}));
    setMarketLoading(false);
  },[watchlist]);

  const refreshAll = useCallback(async ()=>{
    setArts({general:[],sports:[],business:[],finance:[],bloom:[],popculture:[],comedy:[]});
    setLoading({general:false,sports:false,business:false,finance:false,bloom:false,popculture:false,comedy:false});
    setHealth({});setPodEps({});setPodLoading({});
    // Small delay to let the UI render the cleared state, then fan out
    await new Promise(r => setTimeout(r, 80));
    await Promise.allSettled([
      ...Object.keys(DEFAULT_FEEDS).map(c=>loadCat(c)),
      ...PODCAST_FEEDS.map(p=>loadPod(p)),
      loadScores(),
      loadMarketData(),
    ]);
  }, [loadCat, loadPod, loadScores, loadMarketData]);

  useEffect(()=>{
    Object.keys(DEFAULT_FEEDS).forEach(c=>loadCat(c));
    PODCAST_FEEDS.forEach(p=>loadPod(p));
    loadScores();
    loadMarketData(); // preload so RightNowStrip + watchlist widgets have ticker data
    const iv=setInterval(loadScores,120000);
    return ()=>clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const onRead  = a=>{
    setClicks(c=>({...c,[a.source]:(c[a.source]||0)+1}));
    if (a.link) setReadLinks(s=>{const n=new Set(s);n.add(a.link);return n;});
    setReaderArticle(a);
  };
  const onSave  = a=>{
    const wasSaved = saved.some(x=>x.link===a.link);
    setSaved(s=>wasSaved?s.filter(x=>x.link!==a.link):[...s,{...a,savedAt:Date.now()}]);
  };
  const isSavedFn = a=>saved.some(s=>s.link===a.link);
  const isReadFn = a=>a.link&&readLinks.has(a.link);

  const handleTickerClick = t=>{
    setSearch(t.label.toLowerCase());
    const catMap={'Bloom Energy':'bloom','Crude Oil':'business','Bitcoin':'finance'};
    if(catMap[t.label])setTab(catMap[t.label]);
  };

  // v23: persist teams whenever they change
  useEffect(()=>{sv('teams',teams);},[teams]);
  useEffect(()=>{sv('weatherCities',weatherCities);},[weatherCities]);

  // v36: Global search — always fetch web results alongside internal articles
  useEffect(() => {
    if (!search || search.length < 3) {
      setWebResults([]); setSourceRecs([]); return;
    }
    setSourceRecs(suggestSourcesForQuery(search));
    setWebLoading(true);
    fetchWebSearch(search).then(r => { setWebResults(r); setWebLoading(false); });
    // Track search history (last 10 unique queries)
    setSearchHistory(prev => {
      const trimmed = search.trim().toLowerCase();
      if (!trimmed) return prev;
      const next = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 10);
      sv('searchHistory', next);
      return next;
    });
  }, [search]);

  // v38: When a source is active, fetch web results for more coverage from that outlet
  useEffect(() => {
    if (!activeSrc) { setSrcWebResults([]); return; }
    setSrcWebLoading(true);
    fetchWebSearch(`${activeSrc} news latest`).then(r => { setSrcWebResults(r); setSrcWebLoading(false); });
  }, [activeSrc]);

  // Keyboard shortcuts: J/K navigate articles, B bookmark, / focus search, Escape clear
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === '/') {
        e.preventDefault();
        const inp = document.querySelector('.search-input, .mobile-search-input');
        if (inp) inp.focus();
      }
      if (e.key === 'Escape') {
        if (readerArticle) { setReaderArticle(null); return; }
        setSearch(''); setActiveKw(null); setActiveSrc(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [readerArticle]);

  const handleCustomizeSave = ({feeds:nf,kw:nk,alerts:na,urgent:nu,social:ns,watchlist:nw,teams:nt,weatherCities:nwx,hiddenIndices:ni,briefingExclude:nbe})=>{
    setFeeds(nf);sv('feeds',nf);
    setKw(nk);sv('kw',nk);
    setAlerts(na);sv('alerts',na);
    if(nu){setUrgent(nu);sv('urgent',nu);}
    setSocial(ns);sv('social',ns);
    if(nw){setWatchlist(nw);sv('watchlist',nw);}
    if(nt){setTeams(nt);sv('teams',nt);}
    if(nwx){setWeatherCities(nwx);sv('weatherCities',nwx);}
    if(ni!=null){setHiddenIndices(ni);sv('hiddenIndices',ni);}
    if(nbe!=null){setBriefingExclude(nbe);sv('briefingExclude',nbe);}
    setShowPanel(false);refreshAll();
  };

  const openCustomize = (initialTab='keywords',initialCat='general')=>{
    setPanelInitial({tab:initialTab,cat:initialCat});setShowPanel(true);
  };

  const handleTabChange = t=>{
    // v24a: 'briefing' is a dedicated page again. No redirect needed.
    setTab(t);setSearch('');setActiveKw(null);setActiveSrc(null);
    setMobileSearchOpen(false);
    window.scrollTo({top:0, behavior:'instant'}); // always land at top of new page
    // Remember last-viewed news category so the bottom "Feed" tab returns here
    const CAT_TABS = ['general','sports','business','finance','bloom','popculture','comedy'];
    if (CAT_TABS.includes(t)) setLastFeedTab(t);
    if(!['today','saved','podcasts','social'].includes(t)&&!(arts[t]||[]).length)loadCat(t);
    if(t==='finance')loadMarketData();
  };

  // Pull-to-refresh wiring (mobile only — hook gates itself by scrollY=0 too)
  const { distance: ptrDistance } = usePullToRefresh(
    async () => {
      setRefreshing(true);
      try { await refreshAll(); } finally { setRefreshing(false); }
    },
    { enabled: isMobile, threshold: 110 }
  );

  // Swipe left/right between categories on mobile. Only active on news-ish
  // pages where changing category makes sense (not on Customize, podcasts, etc.)
  const swipeHandlers = useSwipe(
    (dir) => {
      const idx = SWIPE_ORDER.indexOf(tab);
      if (idx === -1) return;
      const next = dir === 'left' ? idx + 1 : idx - 1;
      if (next >= 0 && next < SWIPE_ORDER.length) handleTabChange(SWIPE_ORDER[next]);
    },
    { enabled: isMobile && SWIPE_ORDER.includes(tab) }
  );

  const getRelated = (a,cat)=>{
    const matched=kwMatch(a,cat);if(!matched.length)return[];
    return(arts[cat]||[]).filter(x=>x.link!==a.link&&matched.some(k=>(x.title+(x.desc||'')).toLowerCase().includes(k.toLowerCase()))).slice(0,4);
  };

  // Reading stats derived from clicks + readLinks
  const readingStats = useMemo(() => {
    const total = readLinks.size;
    const topSources = Object.entries(clicks)
      .sort((a,b) => b[1]-a[1]).slice(0, 5)
      .map(([src, cnt]) => ({ src, cnt }));
    const catCounts = {};
    Object.values(arts).flat().forEach(a => {
      if (a.link && readLinks.has(a.link)) {
        catCounts[a.cat] = (catCounts[a.cat]||0) + 1;
      }
    });
    const topCats = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return { total, topSources, topCats };
  }, [clicks, readLinks, arts]);

  const NEWS_CATS = ['general','sports','business','bloom','tech','popculture','comedy'];

  // ─── FEED PAGE ─────────────────────────────────────────────────────────
  // ─── SPORTS PAGE (v23) — Yahoo Sports rebuild ──────────────────────────
  // News-first sports vertical: dark scoreboard strip top, sport tabs (All/NFL/
  // NBA/MLB/CFB/CBB), favorite team pills with external links, then prioritized
  // stories feed. Yahoo Sports' actual layout pattern.
  const SportsPage = () => {
    const [sportTab, setSportTab] = useState('all'); // 'all' | 'nfl' | 'nba' | 'mlb' | 'cfb' | 'cbb' | 'cbase'
    const [activeTeam, setActiveTeam] = useState(null); // team obj when filter pill tapped
    const [teamMenuSym, setTeamMenuSym] = useState(null); // team with open popup menu
    const [sportWebResults, setSportWebResults] = useState([]);
    const [sportWebLoading, setSportWebLoading] = useState(false);

    // v36: Fetch web results when a specific league tab is active
    useEffect(() => {
      if (sportTab === 'all') { setSportWebResults([]); return; }
      const SPORT_TAB_QUERIES = {
        nfl: 'NFL football news today', nba: 'NBA basketball news today',
        mlb: 'MLB baseball news today', cfb: 'college football news today',
        cbb: 'college basketball news today', cbase: 'college baseball news today',
        racing: 'horse racing news today', golf: 'PGA Tour golf news today',
      };
      const q = SPORT_TAB_QUERIES[sportTab] || `${sportTab} sports news`;
      setSportWebLoading(true);
      fetchWebSearch(q).then(r => { setSportWebResults(r); setSportWebLoading(false); });
    }, [sportTab]);

    const cc = CATS.sports;
    const allItems = sorted('sports');
    const isLoading = loading.sports;

    // Filter scoreboard by sport tab
    const visibleScores = useMemo(() => {
      if (sportTab === 'all') return scores;
      const leagueKey = sportTab; // already aligned with LEAGUES[].key
      return { [leagueKey]: scores[leagueKey] || [] };
    }, [scores, sportTab]);

    // Filter teams by sport tab — pill rail respects tab
    const visibleTeams = useMemo(() => {
      if (sportTab === 'all') return teams;
      const leagueKey = sportTab;
      const L = LEAGUES.find(x => x.key === leagueKey);
      if (!L) return []; // golf/racing/cbase have no LEAGUE entry — use keyword filter only
      return teams.filter(t => t.sport === L.sport && t.league === L.league);
    }, [teams, sportTab]);

    // Filter+sort stories: optionally team-locked, optionally sport-locked.
    // Favorites float to top: any item mentioning ANY team in `teams` gets
    // boosted unless a specific team filter is active.
    const sportItems = useMemo(() => {
      let items = allItems;
      if (activeTeam) {
        const m = (activeTeam.match || '').toLowerCase();
        items = items.filter(a => (a.title + ' ' + (a.desc||'')).toLowerCase().includes(m));
      } else if (sportTab !== 'all') {
        // Sport-tab filter: keep articles mentioning any team in this sport,
        // OR keep any article from sport-specific kw (broad fallback).
        const teamsInSport = visibleTeams.map(t => (t.match||'').toLowerCase());
        const sportKws = sportTab === 'nfl'    ? ['nfl','football','quarterback','touchdown','super bowl','running back','wide receiver','defensive end','nfc','afc','nfl draft']
                       : sportTab === 'nba'    ? ['nba','basketball','lakers','celtics','warriors','knicks','heat','bulls','playoffs','nba draft','three-pointer','slam dunk']
                       : sportTab === 'mlb'    ? ['mlb','baseball','world series','yankees','dodgers','cubs','home run','pitcher','bullpen','batting average','mlb draft']
                       : sportTab === 'cfb'    ? ['cfb','college football','ncaa football','sec','big ten','acc','pac-12','big 12','cfp','bowl game','heisman']
                       : sportTab === 'cbb'    ? ['cbb','college basketball','ncaa','march madness','final four','ncaa tournament','big east','sweet 16']
                       : sportTab === 'cbase'  ? ['college baseball','ncaa baseball','cws','college world series','super regional','sec baseball','acc baseball','big 12 baseball','d1baseball','college world']
                       : sportTab === 'racing' ? ['horse racing','thoroughbred','derby','stakes','jockey','paddock','furlong','harness racing','horse race','breeders cup','kentucky derby','preakness','belmont']
                       : sportTab === 'golf'   ? ['golf','pga tour','masters','us open golf','british open','ryder cup','tiger woods','golfer','birdie','bogey','fairway','tee shot','pga championship','lpga']
                       : [];
        items = items.filter(a => {
          const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
          return teamsInSport.some(m => m && t.includes(m)) || sportKws.some(k => t.includes(k));
        });
      }
      // Favorite-team prioritization: bubble articles mentioning user's teams to top
      const favMatches = teams.map(t => (t.match||'').toLowerCase()).filter(Boolean);
      const scored = items.map(a => {
        const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
        const favHits = favMatches.filter(m => t.includes(m)).length;
        return { ...a, _favScore: favHits };
      });
      scored.sort((a, b) => {
        if (b._favScore !== a._favScore) return b._favScore - a._favScore;
        return new Date(b.pubDate) - new Date(a.pubDate);
      });
      return scored;
    }, [allItems, activeTeam, sportTab, teams, visibleTeams]);

    // Hero = first article with image
    const heroItems = sportItems.filter(a => a.img);
    const lead = heroItems[0] || null;
    const feedItems = lead ? sportItems.filter(a => a.link !== lead.link) : sportItems;

    const SPORT_TABS = [
      { key:'all',    label:'All' },
      { key:'nfl',    label:'NFL',            emoji:'🏈' },
      { key:'nba',    label:'NBA',            emoji:'🏀' },
      { key:'mlb',    label:'MLB',            emoji:'⚾' },
      { key:'cfb',    label:'NCAAF',          emoji:'🏈' },
      { key:'cbb',    label:'NCAAB',          emoji:'🏀' },
      { key:'cbase',  label:'College Baseball',emoji:'⚾' },
      { key:'racing', label:'Horse Racing',   emoji:'🏇' },
      { key:'golf',   label:'Golf',           emoji:'⛳' },
    ];

    const feedRef = useRef(null);
    const scrollToFeed = () => {
      const el = feedRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };

    return (
      <div className="page sports-page">

        {/* ── SPORT TABS — ESPN pill-style ── */}
        <div className="sport-tabs">
          {SPORT_TABS.map(t => (
            <button key={t.key}
              className={`sport-tab ${sportTab===t.key?'active':''}`}
              onClick={()=>{setSportTab(t.key); setActiveTeam(null); setTimeout(scrollToFeed,80);}}>
              {t.emoji && <span className="sport-tab-emoji">{t.emoji}</span>}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SCOREBOARD STRIP — ESPN dark card style ── */}
        <SportsScoreStrip scores={visibleScores} teams={teams}/>

        {/* ── LEAGUE HEADER — ESPN hero banner (only when league tab active) ── */}
        {sportTab !== 'all' && (() => {
          const lt = SPORT_TABS.find(st => st.key === sportTab);
          return (
            <div className="sport-league-header">
              <div className="sport-league-header-left">
                {lt?.emoji && <span className="sport-league-emoji">{lt.emoji}</span>}
                <div>
                  <h2 className="sport-league-title">{lt?.label}</h2>
                  <div className="sport-league-count">
                    {sportItems.length > 0 ? `${sportItems.length} stories` : 'No stories yet — refresh to load'}
                  </div>
                  <div className="sport-league-sub">Top Stories · Trending News</div>
                </div>
              </div>
              <button className="sport-league-all-btn" onClick={()=>setSportTab('all')}>← All Sports</button>
            </div>
          );
        })()}

        {/* ── TEAM HUB — ESPN team page header when team is active ── */}
        {activeTeam && (
          <div className="team-hub">
            <div className="team-hub-header">
              <div>
                <div className="team-hub-title">{activeTeam.emoji} {activeTeam.team}</div>
                <div className="team-hub-count">{sportItems.length} stories found · {activeTeam.league?.toUpperCase()}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                {activeTeam.espnUrl && <a className="team-hub-link" href={activeTeam.espnUrl} target="_blank" rel="noreferrer">ESPN ↗</a>}
                {activeTeam.teamUrl && <a className="team-hub-link" href={activeTeam.teamUrl} target="_blank" rel="noreferrer">Team Site ↗</a>}
                <button className="team-hub-clear" onClick={()=>setActiveTeam(null)}>✕ Clear</button>
              </div>
            </div>
          </div>
        )}

        {/* ── HERO + FEED ── */}
        <div className="page-grid" ref={feedRef}>
          <div className="feed-col">
            {/* Hero lead article */}
            {lead && (
              <article className="sports-hero" onClick={()=>onRead(lead)}>
                <div className="sports-hero-img" style={{backgroundImage:`url(${lead.img})`}}>
                  {lead._favScore > 0 && <span className="sports-hero-fav">★ MY TEAMS</span>}
                </div>
                <div className="sports-hero-text">
                  <h1 className="sports-hero-title">{lead.title}</h1>
                  {lead.desc && <p className="sports-hero-desc">{lead.desc}</p>}
                  <div className="sports-hero-meta">
                    <span className="sports-hero-source">{lead.source}</span>
                    <span>·</span>
                    <span>{fmtDate(lead.pubDate)}</span>
                  </div>
                </div>
              </article>
            )}

            {/* 3-column story grid — ESPN visual punch for top stories */}
            {feedItems.length > 0 && !activeTeam && (
              <div className="gn-row" style={{marginBottom:'24px'}}>
                {feedItems.slice(0, 6).filter(a=>a.img).slice(0, 3).concat(
                  feedItems.slice(0, 6).filter(a=>!a.img)
                ).slice(0, 3).map((a, i) => (
                  <article key={i} className="gn-card" onClick={()=>onRead(a)}>
                    {a.img
                      ? <div className="gn-card-img" style={{backgroundImage:`url(${a.img})`}}/>
                      : <div className="gn-card-img-ph"/>}
                    <h3 className="gn-card-title">{a.title}</h3>
                    <div className="gn-card-meta">
                      <span className="gn-card-source" style={{color:cc.color}}>{a.source}</span>
                      <span>·</span><span>{fmtDate(a.pubDate)}</span>
                      {a._favScore > 0 && <span style={{marginLeft:'4px',color:'#f59e0b',fontWeight:800}}>★</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {isLoading && !feedItems.length
              ? <div className="empty-state"><div className="empty-icon">🏆</div><div className="empty-msg">Loading sports…</div></div>
              : feedItems.length === 0
                ? <div className="empty-state">
                    <div className="empty-icon">{activeTeam ? activeTeam.emoji : '🏆'}</div>
                    <div className="empty-msg">{activeTeam ? `No stories found for ${activeTeam.team} yet` : 'No articles loaded yet'}</div>
                    <div style={{fontSize:'12px',color:'var(--text3)',marginTop:'6px',marginBottom:'12px'}}>
                      {activeTeam ? 'Try refreshing or check ESPN directly.' : 'Pull to refresh or tap below.'}
                    </div>
                    {activeTeam?.espnUrl && <a href={activeTeam.espnUrl} target="_blank" rel="noreferrer" className="refresh-btn" style={{textDecoration:'none',display:'inline-block'}}>Open on ESPN ↗</a>}
                    <button className="refresh-btn" style={{marginTop:'8px'}} onClick={refreshAll}>Refresh</button>
                  </div>
                : feedItems.slice(activeTeam?0:3, 30).map((a, i) => (
                    <FeedCard key={i} a={a} cat="sports" isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,'sports')} isRead={isReadFn(a)} userKw={kw} userTeams={teams}/>
                  ))
            }

            {/* v36: Web results for active league tab */}
            {sportTab !== 'all' && (sportWebResults.length > 0 || sportWebLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>🌐 From the Web</div>
                {sportWebLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {sportWebResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0,160)}</div>}
                    <div className="web-result-src">{r.source}{r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}</div>
                  </a>
                ))}
              </div>
            )}

            {lastUpdated.sports && (
              <div style={{display:'flex',justifyContent:'flex-end',padding:'8px 0'}}>
                <LastUpdated timestamp={lastUpdated.sports} onRefresh={() => loadCat('sports')}/>
              </div>
            )}
            {/* ── MY TEAMS SHELF — sleek card grid at bottom of sports feed ── */}
            {teams.length > 0 && (
              <div className="teams-shelf">
                <div className="teams-shelf-head">
                  <span className="teams-shelf-label">⭐ My Teams</span>
                  <button className="teams-shelf-edit" onClick={()=>openCustomize('teams','sports')}>⚙ Edit</button>
                </div>
                <div className="teams-shelf-grid">
                  {teams.map(t => {
                    const isFiltered = activeTeam?.team === t.team;
                    const menuOpen = teamMenuSym === t.team;
                    return (
                      <div key={t.team} className={`team-card${isFiltered?' filtered':''}`}>
                        <button className="team-card-btn"
                          onClick={()=>setTeamMenuSym(menuOpen ? null : t.team)}>
                          <span className="team-card-emoji">{t.emoji}</span>
                          <div className="team-card-info">
                            <span className="team-card-name">{t.team}</span>
                            <span className="team-card-league">{t.league?.toUpperCase()}</span>
                          </div>
                          <span className="team-card-arrow">{menuOpen ? '▴' : '▾'}</span>
                        </button>
                        {menuOpen && (
                          <div className="team-card-menu">
                            <button className="team-menu-item" onClick={()=>{
                              setActiveTeam(isFiltered ? null : t); setSportTab('all');
                              setTeamMenuSym(null); setTimeout(scrollToFeed, 80);
                            }}>
                              {isFiltered ? '✕ Clear filter' : '📰 Filter News'}
                            </button>
                            {t.espnUrl && <a className="team-menu-item" href={t.espnUrl} target="_blank" rel="noreferrer">ESPN ↗</a>}
                            {t.teamUrl && <a className="team-menu-item" href={t.teamUrl} target="_blank" rel="noreferrer">Team Site ↗</a>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <SourceFooter cat="sports" feeds={feeds} arts={arts}/>
          </div>

          <Sidebar cat="sports" arts={arts} kw={kw} health={health}
            activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
            activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
            onRead={onRead} scores={scores} scoresLoading={scoresLoading}
            showScoreboard={false} recommended={recommended}/>
        </div>
      </div>
    );
  };

  const FeedPage = ({cat}) => {
    const cc=CATS[cat];
    // Apply story clustering before sorting so cluster metadata is available
    const rawItems=sorted(cat);
    const items=useMemo(()=>clusterStories(rawItems),[rawItems]);
    const isLoading=loading[cat];

    // Sub-tab state — hooks always declared; only active for their respective cats
    const [pcSubTab, setPcSubTab] = useState('all');
    const [pcWebResults, setPcWebResults] = useState([]);
    const [pcWebLoading, setPcWebLoading] = useState(false);
    const [enSubTab, setEnSubTab] = useState('all');
    const [enWebResults, setEnWebResults] = useState([]);
    const [enWebLoading, setEnWebLoading] = useState(false);

    const PC_SUBTABS = [
      { key:'all',         label:'All',         emoji:'✨' },
      { key:'shows',       label:'Shows/Movies', emoji:'🎬' },
      { key:'music',       label:'Music',        emoji:'🎵' },
      { key:'books',       label:'Books',        emoji:'📚' },
      { key:'comedy',      label:'Comedy',       emoji:'😂' },
    ];
    const PC_KWS = {
      shows:  ['movie','film','tv','streaming','netflix','hbo','disney','show','series','premiere','season','episode','cinema','trailer','oscar','emmy','golden globe'],
      music:  ['album','music','song','artist','chart','grammy','billboard','concert','tour','release','single','rapper','singer','playlist','spotify','pop star'],
      books:  ['book','novel','author','bestseller','fiction','reading','publisher','memoir','nonfiction','literary','penguin','bestselling','new book'],
      comedy: ['comedy','comedian','stand-up','funny','humor','joke','sketch','snl','sitcom','comic','parody','satire'],
    };

    const EN_SUBTABS = [
      { key:'all',     label:'All',           emoji:'⚡' },
      { key:'power',   label:'Power',         emoji:'🔌' },
      { key:'oilgas',  label:'Oil & Gas',     emoji:'🛢️' },
      { key:'clean',   label:'Clean Energy',  emoji:'🌿' },
      { key:'markets', label:'Markets',       emoji:'📈' },
      { key:'policy',  label:'Policy',        emoji:'🏛️' },
    ];
    const EN_KWS = {
      power:   ['power','electric','grid','utility','electricity','megawatt','kilowatt','nuclear','coal','natural gas','transmission','substation','generation','powerplant','baseload'],
      oilgas:  ['oil','gas','petroleum','crude','refinery','pipeline','opec','brent','wti','shale','drilling','rig','barrel','lng','upstream','downstream','midstream','gasoline'],
      clean:   ['solar','wind','renewable','clean energy','green','battery','storage','ev','electric vehicle','hydrogen','carbon','emissions','climate','sustainability','net zero','offshore wind'],
      markets: ['commodity','commodities','futures','spot price','energy prices','gas prices','oil prices','supply','demand','export','import','petrochemical','inflation energy'],
      policy:  ['policy','regulation','epa','federal','congress','legislation','tariff','subsidy','permit','department of energy','doe','ferc','administration','executive order','climate bill'],
    };

    // Filter items by pop culture sub-tab
    const pcFilteredItems = useMemo(() => {
      if (cat !== 'popculture' || pcSubTab === 'all') return items;
      const kws = PC_KWS[pcSubTab] || [];
      return items.filter(a => {
        const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
        return kws.some(k => t.includes(k));
      });
    }, [items, cat, pcSubTab]);

    const enFilteredItems = useMemo(() => {
      if (cat !== 'bloom' || enSubTab === 'all') return items;
      const kws = EN_KWS[enSubTab] || [];
      return items.filter(a => {
        const t = (a.title + ' ' + (a.desc||'')).toLowerCase();
        return kws.some(k => t.includes(k));
      });
    }, [items, cat, enSubTab]);

    // v36: Web results for pop culture sub-tab
    useEffect(() => {
      if (cat !== 'popculture' || pcSubTab === 'all') { setPcWebResults([]); return; }
      const queries = {
        shows:'movies TV shows streaming news today', music:'music news trending albums today',
        books:'best books reading news today', comedy:'comedy entertainment news today',
      };
      const q = queries[pcSubTab] || `${pcSubTab} pop culture news today`;
      setPcWebLoading(true);
      fetchWebSearch(q).then(r => { setPcWebResults(r); setPcWebLoading(false); });
    }, [cat, pcSubTab]);

    // v40: Web results for energy sub-tab
    useEffect(() => {
      if (cat !== 'bloom' || enSubTab === 'all') { setEnWebResults([]); return; }
      const queries = {
        power:'power grid electricity utility news today', oilgas:'oil gas petroleum crude news today',
        clean:'clean energy solar wind renewable news today', markets:'energy commodity markets prices today',
        policy:'energy policy regulation government news today',
      };
      const q = queries[enSubTab] || `${enSubTab} energy news today`;
      setEnWebLoading(true);
      fetchWebSearch(q).then(r => { setEnWebResults(r); setEnWebLoading(false); });
    }, [cat, enSubTab]);

    const activeFilteredItems = cat === 'bloom' ? enFilteredItems : pcFilteredItems;
    const heroItems=activeFilteredItems.filter(a=>a.img);
    const catLead=heroItems[0]||null;
    const feedItems=catLead?activeFilteredItems.filter(a=>a.link!==catLead.link):activeFilteredItems;

    const isHome = cat === 'general';
    const catKws = kw[cat] || [];

    const otherCatSections = useMemo(() => {
      if (!isHome) return [];
      const otherCats = ['business','finance','bloom','sports','popculture'];
      return otherCats.map(c => ({
        cat: c,
        cc: CATS[c],
        items: (arts[c] || []).slice(0, 3),
      })).filter(s => s.items.length > 0);
    }, [isHome, arts]);

    return (
      <div className="page">
        {/* Scores strip — General and Sports only; Sports has its own strip */}
        {cat === 'general' && !activeKw && !activeSrc && !search && (
          <ActiveScoresBar scores={scores} onGoToSports={() => handleTabChange('sports')}/>
        )}

        {/* Trending topics — mobile-prominent section above the hero */}
        {isHome && !activeKw && !activeSrc && !search && (() => {
          const topics = getTrendingTopics(arts);
          return topics.length > 0 ? (
            <div className="trending-section-mobile">
              <span className="trending-bar-label">🔥 Trending Now</span>
              <div className="trending-bar" style={{padding:'0',marginTop:'4px'}}>
                {topics.slice(0, 10).map((t, i) => (
                  <span key={i} className="trending-chip" onClick={() => setSearch(t)}>{t}</span>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* v26: General gets 2-col hero (lead | briefing). Other cats: briefing above if no lead. */}
        {isHome && !activeKw && !activeSrc && catLead ? (
          <div className="home-hero-row">
            <div className="home-hero-main">
              <article className="gn-lead-solo" onClick={()=>onRead(catLead)}>
                <div className="gn-lead-img" style={{backgroundImage:`url(${catLead.img})`}}/>
                <div className="gn-lead-text">
                  <h1 className="gn-lead-title">{catLead.title}</h1>
                  {catLead.desc&&<p className="gn-lead-desc">{catLead.desc}</p>}
                  <div className="gn-lead-meta">
                    <span className="gn-lead-source" style={{color:cc.color}}>{catLead.source}</span>
                    <span>·</span><span>{fmtDate(catLead.pubDate)}</span>
                  </div>
                </div>
              </article>
            </div>
            <div className="home-hero-side">
              <BriefingTeaser arts={arts} excludeCats={briefingExclude} onOpenFull={() => handleTabChange('briefing')}/>
            </div>
          </div>
        ) : (
          isHome && !activeKw && !activeSrc && (
            <BriefingTeaser arts={arts} excludeCats={briefingExclude} onOpenFull={() => handleTabChange('briefing')}/>
          )
        )}

        {/* Google News grid (non-General categories keep full-width grid) */}
        {!activeKw && !activeSrc && catLead && !isHome && (
          <div className="gn-grid">
            <article className="gn-lead" onClick={()=>onRead(catLead)}>
              <div className="gn-lead-img" style={{backgroundImage:`url(${catLead.img})`}}/>
              <div className="gn-lead-text">
                <h1 className="gn-lead-title">{catLead.title}</h1>
                {catLead.desc&&<p className="gn-lead-desc">{catLead.desc}</p>}
                <div className="gn-lead-meta">
                  <span className="gn-lead-source" style={{color:cc.color}}>{catLead.source}</span>
                  <span>·</span><span>{fmtDate(catLead.pubDate)}</span>
                </div>
              </div>
            </article>
            <div className="gn-row">
              {feedItems.slice(0, 6).filter(a=>a.img).slice(0, 3).concat(
                feedItems.slice(0, 6).filter(a=>!a.img)
              ).slice(0, 3).map((a, i) => (
                <article key={i} className={`gn-card ${cat}`} onClick={()=>onRead(a)}>
                  {a.img
                    ? <div className="gn-card-img" style={{backgroundImage:`url(${a.img})`}}/>
                    : <div className="gn-card-img-ph" style={{background:`linear-gradient(135deg,${cc.bg},${cc.bg}cc)`}}><span style={{fontSize:'20px'}}>{cc.emoji}</span></div>}
                  <h3 className="gn-card-title">{a.title}</h3>
                  <div className="gn-card-meta">
                    <span className="gn-card-source" style={{color:cc.color}}>{a.source}</span>
                    <span>·</span><span>{fmtDate(a.pubDate)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pop Culture sub-tabs */}
        {cat === 'popculture' && !activeKw && !activeSrc && !search && (
          <div className="pc-subtabs">
            {PC_SUBTABS.map(t => (
              <button key={t.key} className={`pc-subtab ${pcSubTab===t.key?'active':''}`}
                onClick={()=>{setPcSubTab(t.key);window.scrollTo({top:0,behavior:'smooth'});}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Energy sub-tabs */}
        {cat === 'bloom' && !activeKw && !activeSrc && !search && (
          <div className="pc-subtabs">
            {EN_SUBTABS.map(t => (
              <button key={t.key} className={`pc-subtab ${enSubTab===t.key?'active':''}`}
                onClick={()=>{setEnSubTab(t.key);window.scrollTo({top:0,behavior:'smooth'});}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="page-grid">
          <div className="feed-col">
            <div className="page-header-row">
              <span className="page-header" style={{fontFamily:'var(--font-sans)'}}>
                {cc.emoji} {cc.label}{feedItems.length>0?` — ${feedItems.length} articles`:''}
                {lastUpdated[cat] && <span style={{marginLeft:'10px'}}><LastUpdated timestamp={lastUpdated[cat]} onRefresh={() => loadCat(cat)}/></span>}
              </span>
              <button className="page-customize-btn" onClick={()=>openCustomize('sources',cat)}>⚙ Customize</button>
            </div>
            {/* Active search banner — shows result count + clear button */}
            {search && (
              <div className="search-results-banner">
                <span className="search-results-text">
                  {feedItems.length > 0
                    ? <><strong>{feedItems.length} results</strong> for "{search}"</>
                    : <>No results for "<strong>{search}</strong>" — showing web results below</>}
                </span>
                <button className="search-results-clear" onClick={()=>setSearch('')}>✕ Clear</button>
              </div>
            )}
            {(activeKw||activeSrc)&&(
              <div className="sticky-filter" style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
                {activeKw&&<span style={{background:cc.bg,color:cc.color,borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',display:'inline-flex',alignItems:'center',gap:'5px'}}>🔍 {activeKw}<button onClick={()=>setActiveKw(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
                {activeSrc&&<span style={{background:'var(--surface2)',color:'var(--text2)',borderRadius:'20px',padding:'3px 10px',fontSize:'10px',fontWeight:'600',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',gap:'5px'}}>📰 {activeSrc}<button onClick={()=>setActiveSrc(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'12px',padding:0}}>✕</button></span>}
              </div>
            )}
            {isLoading&&!feedItems.length
              ?<div className="empty-state"><div className="empty-icon">{cc.emoji}</div><div className="empty-msg">Loading {cc.label}…</div></div>
              :feedItems.length===0
                ?<div className="empty-state"><div className="empty-icon">📭</div><div className="empty-msg">{activeKw||activeSrc?'No articles match this filter':search?`No internal results for "${search}"`:'No articles loaded yet'}</div><button className="refresh-btn" onClick={refreshAll}>Refresh</button></div>
                :feedItems.slice(activeKw||activeSrc||search?0:3,20).map((a,i)=><FeedCard key={i} a={a} cat={cat} isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,cat)} isRead={isReadFn(a)} userKw={kw} userTeams={teams}/>)
            }

            {/* Pop culture sub-tab web results */}
            {cat === 'popculture' && pcSubTab !== 'all' && (pcWebResults.length > 0 || pcWebLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>🌐 From the Web</div>
                {pcWebLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {pcWebResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0,160)}</div>}
                    <div className="web-result-src">{r.source}{r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}</div>
                  </a>
                ))}
              </div>
            )}

            {/* Energy sub-tab web results */}
            {cat === 'bloom' && enSubTab !== 'all' && (enWebResults.length > 0 || enWebLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>🌐 From the Web</div>
                {enWebLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {enWebResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0,160)}</div>}
                    <div className="web-result-src">{r.source}{r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}</div>
                  </a>
                ))}
              </div>
            )}

            {/* v26: Web search fallback when searching with thin internal results */}
            {search && (webResults.length > 0 || webLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>🌐 From the web</div>
                {webLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {webResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0, 160)}</div>}
                    <div className="web-result-src">
                      {r.source}
                      {r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* v26: Source recommendations when searching */}
            {search && sourceRecs.length > 0 && (
              <div className="source-recs">
                <div className="rail-label" style={{margin:'20px 0 10px'}}>💡 Add a source for "{search}"</div>
                <div className="source-rec-list">
                  {sourceRecs.map((s,i) => (
                    <button key={i} className="source-rec-btn" onClick={()=>{
                      setFeeds(prev => {
                        const next = JSON.parse(JSON.stringify(prev));
                        if (!next[s.cat]) next[s.cat] = [];
                        if (!next[s.cat].some(f => f.url === s.url)) {
                          next[s.cat].push({name: s.name, url: s.url, on: true});
                        }
                        sv('feeds', next);
                        return next;
                      });
                    }}>
                      + Add {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* v38: More from this source — web results when source filter is active */}
            {activeSrc && (srcWebResults.length > 0 || srcWebLoading) && (
              <div className="web-fallback">
                <div className="rail-label" style={{margin:'24px 0 12px'}}>🌐 More from {activeSrc}</div>
                {srcWebLoading && <div style={{fontSize:'12px',color:'var(--text3)',fontStyle:'italic',padding:'10px 0'}}>Searching the web…</div>}
                {srcWebResults.map((r,i) => (
                  <a key={i} className="web-result" href={r.link} target="_blank" rel="noreferrer">
                    <div className="web-result-title">{r.title}</div>
                    {r.desc && <div className="web-result-desc">{r.desc.slice(0,160)}</div>}
                    <div className="web-result-src">{r.source}{r.pubDate && <span className="web-result-date"> · {fmtDate(r.pubDate)}</span>}</div>
                  </a>
                ))}
              </div>
            )}

            {/* v20: Topics chips mirrored at bottom of feed — mid-scroll filter access */}
            {catKws.length > 0 && !activeKw && (
              <div className="bottom-topics">
                <div className="bottom-topics-label">Filter by topic</div>
                <div className="bottom-topics-chips">
                  {catKws.map((k, i) => (
                    <span key={i}
                      className="kw-chip"
                      style={{background:cc.bg,color:cc.color}}
                      onClick={()=>{setActiveKw(k); window.scrollTo({top:0, behavior:'smooth'});}}>
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* v24a: General homepage absorbs Today's "from each category" role.
                3 stories from each other category, with See all links. */}
            {isHome && !activeKw && !activeSrc && otherCatSections.length > 0 && (
              <div className="other-cat-sections">
                <div className="other-cat-divider">
                  <span>Across MyNewsHub</span>
                </div>
                {otherCatSections.map(section => (
                  <section key={section.cat} className="other-cat-section">
                    <div className="other-cat-head">
                      <span className="other-cat-label" style={{color:section.cc.color}}>
                        {section.cc.emoji} {section.cc.label}
                      </span>
                      <button className="other-cat-link" onClick={()=>handleTabChange(section.cat)}>
                        See all in {section.cc.label} →
                      </button>
                    </div>
                    {section.items.map((a, i) => (
                      <div key={i} className="gf-item" onClick={()=>onRead(a)}>
                        {a.img
                          ? <div className="gf-thumb" style={{backgroundImage:`url(${a.img})`}}/>
                          : <div className="gf-thumb-ph"/>}
                        <div className="gf-body">
                          <div className="gf-title">{a.title}</div>
                          <div className="gf-meta">
                            <span>{a.source}</span>
                            <span>·</span>
                            <span>{fmtDate(a.pubDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            )}

            {/* Video Feature — bottom of General homepage feed */}
            {isHome && !activeKw && !activeSrc && !search && <VideoFeature />}
            <SocialFollows cat={cat} social={social}/>
            <SourceFooter cat={cat} feeds={feeds} arts={arts}/>
          </div>
          <Sidebar cat={cat} arts={arts} kw={kw} health={health}
            activeKw={activeKw} setActiveKw={k=>{setActiveKw(k);setActiveSrc(null);}}
            activeSource={activeSrc} setActiveSource={s=>{setActiveSrc(s);setActiveKw(null);}}
            onRead={onRead} scores={scores} scoresLoading={scoresLoading}
            showScoreboard={cat==='sports'} recommended={recommended}/>
        </div>
      </div>
    );
  };

  // ─── BRIEFING PAGE (v20) ───────────────────────────────────────────────
  // Full-page dedicated digest. Uses the same enhanced MorningBriefingInline
  // as before, plus a list of the source headlines that fed the AI and a
  // Customize link so users can adjust feeds driving the digest.
  // ─── BRIEFING PAGE (v24a rewrite) ──────────────────────────────────────
  // Morning Brew-style full read. Renders the same MorningBriefingInline
  // synthesis at top, then explicitly shows the 3-tier source methodology:
  //   Tier 1 — Priority briefing sources (Axios, Morning Brew, Morning Wire,
  //            Bloomberg) with their actual headlines used in the synthesis
  //   Tier 2 — Per-category top headlines (deduped against Tier 1, excluding
  //            Comedy) that fed the AI
  // This makes the briefing transparent: users can see WHAT went in and click
  // through to any source article. Solves the v22b complaint of "what sources?"
  // ── Briefing article row with AI summary, Explain, Listen, Share ──
  const BriefingArticleItem = ({ a }) => {
    const [showSum,setShowSum]     = useState(false);
    const [sum,setSum]             = useState('');
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
      const {summary,error} = await fetchAISummary({type:'article',title:a.title,content:a.desc||''});
      if (summary) setSum(summary); else setSumErr(error||'Unavailable');
      setLoadSum(false);
    };

    const handleExplain = async (e) => {
      e.stopPropagation();
      if (showEx) { setShowEx(false); return; }
      if (exText) { setShowEx(true); return; }
      setShowEx(true); setLoadEx(true);
      const {summary:text} = await fetchAISummary({type:'article',title:a.title,content:a.desc||'',mode:'explain'});
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

    const handleShare = async (e) => {
      e.stopPropagation();
      if (navigator.share) { try { await navigator.share({title:a.title,url:a.link}); return; } catch {} }
      try { await navigator.clipboard.writeText(a.link); } catch {}
    };

    return (
      <div className="ba-item">
        <div className="ba-main" onClick={()=>onRead(a)}>
          {a.img
            ? <div className="gf-thumb" style={{backgroundImage:`url(${a.img})`}}/>
            : <div className="gf-thumb-ph"/>}
          <div className="gf-body">
            <div className="gf-title">{a.title}</div>
            <div className="gf-meta">
              <span>{a.source}</span><span>·</span><span>{fmtDate(a.pubDate)}</span>
            </div>
            <div className="ba-actions" onClick={e=>e.stopPropagation()}>
              <button className={`ba-btn${showSum?' on':''}`} onClick={handleAI}>
                {loadSum?'…':'✦'} {showSum?'Hide':'Summary'}
              </button>
              <button className={`ba-btn${showEx?' on':''}`} onClick={handleExplain}>
                {loadEx?'…':'🧠'} {showEx?'Hide':'Explain'}
              </button>
              <button className={`ba-btn${speaking?' on':''}`} onClick={handleListen}>
                {speaking?'⏹':'🔊'} {speaking?'Stop':'Listen'}
              </button>
              <button className="ba-btn" onClick={handleShare}>⤴ Share</button>
            </div>
          </div>
        </div>
        {showSum&&<div className="ba-panel">{loadSum?<em style={{color:'var(--text3)'}}>Generating…</em>:sumErr?<span style={{color:'var(--red)'}}>{sumErr}</span>:sum}</div>}
        {showEx&&<div className="ba-panel">{loadEx?<em style={{color:'var(--text3)'}}>Analyzing…</em>:<ExplainContent text={exText}/>}</div>}
      </div>
    );
  };

  const BriefingPage = () => {
    // Tier 1: priority briefing sources, latest 2 each
    const tier1 = useMemo(() => {
      const allArts = Object.values(arts).flat();
      const out = [];
      const seen = new Set();
      BRIEFING_PRIORITY_SOURCES.forEach(srcName => {
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
            <h1 className="briefing-page-title">The Briefing</h1>
            <p className="briefing-page-sub">
              A daily synthesis in the spirit of Morning Brew, Axios, and Bloomberg 5 Things —
              built from priority briefing sources plus the top headlines across every category.
              Auto-refreshes every 90 minutes.
            </p>
          </header>

          {/* The synthesized briefing itself (paragraph + bullets) */}
          <MorningBriefingInline arts={arts} excludeCats={briefingExclude}/>

          {/* Tier 1 — Priority briefings */}
          <section className="briefing-sources">
            <div className="briefing-sources-head">
              <span className="briefing-sources-label">Priority briefings</span>
              <span className="briefing-sources-meta">
                {tier1.items.length} articles from {BRIEFING_PRIORITY_SOURCES.join(' · ')}
              </span>
            </div>
            {tier1.items.length === 0
              ? <div style={{padding:'14px 0',fontSize:'12px',color:'var(--text3)'}}>
                  Priority briefing sources haven't loaded yet. Make sure {BRIEFING_PRIORITY_SOURCES.join(', ')} are enabled in your General feeds.
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
                    {cc.emoji} {cc.label}
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
  };


  // ─── PODCASTS PAGE ─────────────────────────────────────────────────────
  const PodcastsPage = () => {
    const allEps=PODCAST_FEEDS.flatMap(p=>(podEps[p.name]||[]).slice(0,3).map(e=>({...e,show:p.name,host:p.host,emoji:p.emoji}))).sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
    const displayEps=activePod?(podEps[activePod.name]||[]).map(e=>({...e,show:activePod.name,host:activePod.host,emoji:activePod.emoji})):allEps;

    const PodCard = ({ep, idx}) => {
      const [podAiState,setPodAiState]=useState('closed');
      const [podSum,setPodSum]=useState('');
      const [podTake,setPodTake]=useState('');
      const [podErr,setPodErr]=useState('');
      const [loadPod,setLoadPod]=useState(false);
      const sv2=isSavedFn({...ep,link:ep.link||ep.show+idx});

      const handlePodAI = async () => {
        if (podAiState !== 'closed') { setPodAiState('closed'); return; }
        setPodAiState('takeaways');
        const needSum = !podSum, needTake = !podTake;
        if (!needSum && !needTake) return;
        setLoadPod(true);
        const tasks = [];
        if (needSum) tasks.push(fetchAISummary({type:'podcast',title:ep.title,content:ep.desc||'',mode:'summary'}).then(r=>({k:'s',...r})));
        if (needTake) tasks.push(fetchAISummary({type:'podcast',title:ep.title,content:ep.desc||'',mode:'takeaways'}).then(r=>({k:'t',...r})));
        const results = await Promise.all(tasks);
        for (const r of results) {
          if (r.summary) { if (r.k==='s') setPodSum(r.summary); else setPodTake(r.summary); }
          else if (r.error) setPodErr(r.error);
        }
        setLoadPod(false);
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
              ✦ {loadPod?'Thinking…':podAiState==='closed'?'AI Summary':'Hide AI'}
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
  };

  const SavedPage = () => (
    <div className="page">
      {/* Reading stats panel */}
      {(readingStats.total > 0 || readingStats.topSources.length > 0) && (
        <div className="stats-panel">
          <div className="stats-head">📊 Your Reading Stats</div>
          <div className="stats-grid">
            <div className="stat-block">
              <div className="stat-num">{readingStats.total}</div>
              <div className="stat-label">Articles read</div>
            </div>
            <div className="stat-block">
              <div className="stat-num">{saved.length}</div>
              <div className="stat-label">Saved</div>
            </div>
            {readingStats.topSources.slice(0,1).map(s => (
              <div key={s.src} className="stat-block">
                <div className="stat-num">{s.cnt}</div>
                <div className="stat-label">from {s.src}</div>
              </div>
            ))}
          </div>
          {readingStats.topSources.length > 0 && (
            <div className="stats-sources">
              <div className="stats-sub-label">Top sources</div>
              {readingStats.topSources.map(s => (
                <div key={s.src} className="stats-source-row">
                  <span className="stats-source-name">{s.src}</span>
                  <span className="stats-source-bar" style={{width:`${Math.min(100,(s.cnt/readingStats.topSources[0].cnt)*100)}%`}}/>
                  <span className="stats-source-cnt">{s.cnt}</span>
                </div>
              ))}
            </div>
          )}
          {readingStats.topCats.length > 0 && (
            <div className="stats-cats">
              <div className="stats-sub-label">Top categories</div>
              <div className="stats-cat-chips">
                {readingStats.topCats.map(([c,cnt]) => {
                  const cc=CATS[c]||CATS.general;
                  return <span key={c} className="stats-cat-chip" style={{background:cc.bg,color:cc.color}}>{cc.emoji} {cc.label} ({cnt})</span>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {saved.length===0
        ?<div className="empty-state" style={{paddingTop:'80px'}}><div className="empty-icon">☆</div><div className="empty-msg">No saved items yet<br/><span style={{fontSize:'11px',color:'var(--text3)'}}>Tap Save on any article or episode</span></div></div>
        :<div className="page-grid"><div className="feed-col"><span className="page-header" style={{marginBottom:'24px',display:'block'}}>Saved — {saved.length} items</span>{saved.map((a,i)=><FeedCard key={i} a={a} cat={a.cat||'general'} isSaved={true} onSave={onSave} onRead={onRead} isRead={isReadFn(a)} userKw={kw} userTeams={teams}/>)}</div></div>
      }
    </div>
  );

  // ─── FINANCE PAGE ──────────────────────────────────────────────────────
  const FinancePage = () => {
    const items=sorted('finance');
    const [expandedSym, setExpandedSym] = useState(null);
    const [chartPeriod, setChartPeriod] = useState('3M');

    const CHART_PERIODS = ['1D','5D','1M','3M','YTD','1Y'];
    const periodToTv = {'1D':'1D','5D':'5D','1M':'1M','3M':'3M','YTD':'YTD','1Y':'12M'};

    const fmtPrice=n=>n==null?'—':n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const fmtChg=n=>n==null?'':(n>=0?'+':'')+n.toFixed(2);
    const fmtPct=n=>n==null?'':(n>=0?'+':'')+n.toFixed(2)+'%';

    return (
      <div className="page">
        <div className="fin-header fin-header-slim">
          <div className="fin-header-top">
            <div>
              <div className="fin-header-title">📈 Markets</div>
              <div className="fin-header-sub">
                <span style={{color:'var(--text3)'}}>Quotes via Yahoo Finance · 5min delay</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {lastUpdated.finance && <LastUpdated timestamp={lastUpdated.finance} onRefresh={() => loadCat('finance')}/>}
              <button className="fin-refresh" onClick={loadMarketData} disabled={marketLoading}>
                {marketLoading?'⟳ Loading…':'↺ Refresh'}
              </button>
            </div>
          </div>
        </div>
        <div className="fin-grid">
          <div className="fin-main">
            <section className="fin-watchlist">
              <div className="fin-section-head">
                <span className="fin-section-title">⭐ My Watchlist</span>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  {expandedSym && (
                    <div className="fin-period-row">
                      {CHART_PERIODS.map(p=>(
                        <button key={p} className={`fin-period-btn${chartPeriod===p?' active':''}`}
                          onClick={e=>{e.stopPropagation();setChartPeriod(p);}}>
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="page-customize-btn" onClick={()=>openCustomize('watchlist','finance')}>⚙ Edit</button>
                </div>
              </div>
              <table className="fin-table">
                <thead><tr>
                  <th style={{textAlign:'left'}}>Symbol</th>
                  <th style={{textAlign:'left',paddingLeft:0}}>Name</th>
                  <th style={{textAlign:'right'}}>Price</th>
                  <th style={{textAlign:'right'}}>Chg</th>
                  <th style={{textAlign:'right'}}>%</th>
                </tr></thead>
                <tbody>
                  {watchlist.length===0&&<tr><td colSpan={5} className="fin-empty">No symbols yet — add some in Customize</td></tr>}
                  {watchlist.map(w=>{
                    const q=marketData[w.sym];const up=q&&q.chg>=0;
                    const isOpen = expandedSym === w.sym;
                    return (
                      <Fragment key={w.sym}>
                        <tr className={`fin-wl-row${isOpen?' expanded':''}`}
                          onClick={()=>setExpandedSym(isOpen ? null : w.sym)}>
                          <td className="fin-sym">{w.sym}</td>
                          <td className="fin-name">{w.name}</td>
                          <td className="fin-px">{q?fmtPrice(q.price):<em style={{color:'var(--text3)'}}>—</em>}</td>
                          <td className={`fin-px ${up?'fin-up':q?'fin-down':''}`}>{q?fmtChg(q.chg):''}</td>
                          <td className={`fin-px ${up?'fin-up':q?'fin-down':''}`}>
                            {q&&<span className="fin-pct-pill">{up?'▲':'▼'} {fmtPct(q.pct).replace('+','').replace('-','')}</span>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="fin-chart-row">
                            <td colSpan={5} className="fin-chart-cell">
                              <div className="fin-chart-wrap">
                                <div className="fin-period-pills">
                                  {CHART_PERIODS.map(p=>(
                                    <button key={p} className={`fin-period-pill${chartPeriod===p?' active':''}`}
                                      onClick={e=>{e.stopPropagation();setChartPeriod(p);}}>
                                      {p}
                                    </button>
                                  ))}
                                  <a className="fin-chart-ext" href={`https://finance.yahoo.com/chart/${w.sym}`}
                                    target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
                                    Yahoo ↗
                                  </a>
                                </div>
                                <iframe
                                  key={`${w.sym}-${chartPeriod}`}
                                  className="fin-chart-frame"
                                  src={`https://www.tradingview.com/mini-symbol-overview/?symbol=${encodeURIComponent(w.sym)}&locale=en&dateRange=${periodToTv[chartPeriod]||'3M'}&colorTheme=${dark?'dark':'light'}&trendLineColor=%231976d2&underLineColor=rgba(55%2C166%2C239%2C0.15)&underLineBottomColor=rgba(255%2C255%2C255%2C0)&isTransparent=false&autosize=true`}
                                  title={`${w.sym} chart`}
                                  scrolling="no"
                                  frameBorder="0"
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
            <section className="fin-news">
              <div className="fin-section-head">
                <span className="fin-section-title">📰 Markets News</span>
                <button className="page-customize-btn" onClick={()=>openCustomize('sources','finance')}>⚙ Sources</button>
              </div>
              {loading.finance&&!items.length
                ?<div className="empty-state"><div className="empty-icon">📈</div><div className="empty-msg">Loading Markets…</div></div>
                :items.length===0
                  ?<div className="empty-state"><div className="empty-icon">📭</div><div className="empty-msg">No articles loaded yet</div><button className="refresh-btn" onClick={refreshAll}>Refresh</button></div>
                  :<>
                    {/* v25b: gn-grid 3-col for first 3 visual cards */}
                    <div className="gn-row" style={{padding:'14px 14px 0'}}>
                      {items.slice(0, 6).filter(a=>a.img).slice(0, 3).concat(
                        items.slice(0, 6).filter(a=>!a.img)
                      ).slice(0, 3).map((a, i) => (
                        <article key={i} className="gn-card finance" onClick={()=>onRead(a)}>
                          {a.img
                            ? <div className="gn-card-img" style={{backgroundImage:`url(${a.img})`}}/>
                            : <div className="gn-card-img-ph"/>}
                          <h3 className="gn-card-title">{a.title}</h3>
                          <div className="gn-card-meta">
                            <span className="gn-card-source" style={{color:'#fa7800'}}>{a.source}</span>
                            <span>·</span><span>{fmtDate(a.pubDate)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                    {items.slice(3, 15).map((a, i) => (
                      <FeedCard key={i} a={a} cat="finance" isSaved={isSavedFn(a)} onSave={onSave} onRead={onRead} relatedSources={getRelated(a,'finance')} isRead={isReadFn(a)} userKw={kw} userTeams={teams}/>
                    ))}
                  </>
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
  };


  // ─── RENDER ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className={`hub${dark?' dark':''}`} {...swipeHandlers}>
        <TopBar tab={tab} setTab={handleTabChange} search={search} setSearch={setSearch}
          dark={dark} setDark={setDark}
          onCustomize={()=>openCustomize('keywords','general')} onRefresh={refreshAll}
          breakingItems={breakingItems} onTickerClick={handleTickerClick}
          hidden={headerHidden}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchToggle={() => setMobileSearchOpen(o => !o)}
          weatherCities={weatherCities}
          hiddenIndices={hiddenIndices}/>

        {/* Pull-to-refresh indicator (mobile, touch-only) */}
        {isMobile && <PtrIndicator distance={ptrDistance} threshold={70} refreshing={refreshing}/>}

        {/* v24a: Today removed (its content folded into General page).
            BriefingPage restored as a dedicated full-read destination. */}
        {tab==='briefing'&&<BriefingPage/>}
        {tab==='sports'&&<SportsPage/>}
        {NEWS_CATS.filter(c=>c!=='sports').includes(tab)&&<FeedPage cat={tab}/>}
        {tab==='finance'&&<FinancePage/>}
        {tab==='podcasts'&&<PodcastsPage/>}
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
            search={search}
            onSearch={setSearch}
            trendingTopics={getTrendingTopics(Object.values(arts).flat(), 8)}
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
          social={social} watchlist={watchlist} teams={teams} health={health} arts={arts}
          weatherCities={weatherCities} hiddenIndices={hiddenIndices}
          briefingExclude={briefingExclude}
          initialTab={panelInitial.tab} initialCat={panelInitial.cat}
          onClose={()=>setShowPanel(false)} onSave={handleCustomizeSave}/>}
      </div>
      {/* Floating AI chatbot — available on all pages */}
      <ChatBot arts={arts}/>
      {/* Inline article reader overlay */}
      {readerArticle && <ArticleReader article={readerArticle} onClose={() => setReaderArticle(null)}/>}
    </>
  );
}
