// O0 real-shape fixtures: multi-line real headlines (2–3 lines at rail width), varied source
// counts, populated rail modules (Connections/Across/Trending/Sources/Prediction Markets),
// a missing-image row, and a 12-game score strip. Same route interface as mfix.
const IMG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect fill="#5a6b7c" width="320" height="180"/></svg>').toString('base64');
const now = Date.now();
const iso = m => new Date(now + m * 60000).toISOString();
const PRIMARY = {
  general:'https://feeds.bbci.co.uk/news/rss.xml', sports:'https://www.cbssports.com/rss/headlines/nfl',
  business:'https://feeds.npr.org/1006/rss.xml', finance:'https://feeds.marketwatch.com/marketwatch/topstories/',
  bloom:'https://www.cnbc.com/id/19836768/device/rss/rss.html', popculture:'https://variety.com/feed/',
  tech:'https://www.theverge.com/rss/index.xml', comedy:'https://babylonbee.com/feed',
  health:'https://www.sciencedaily.com/rss/health_medicine.xml',
};
const urlToCat = Object.fromEntries(Object.entries(PRIMARY).map(([c,u])=>[u,c]));
const LABEL = { general:'News', sports:'Sports', business:'Business', finance:'Markets', bloom:'Energy', popculture:'Pop Culture', tech:'AI & Tech', comedy:'Comedy', health:'Health' };
// Real-shape multi-line headlines (observed from CB's screenshots + realistic desk copy).
const HEADS = {
  general: ['Democrats Win Texas Oil Regulator Seat for First Time Since 1990 in Upset That Rattles Austin',
    'City Council Approves Sweeping Flood-Control Bond After Nine Hours of Public Testimony Downtown',
    'John Frieda Heiress Pledges Half Her Fortune to Gulf Coast Wetlands Restoration Effort',
    'Major Explosion and Emergency Evacuation Reported Near the Ship Channel Overnight',
    'Federal Judge Blocks New Rule, Sending the Dispute Back to a Divided Appeals Court',
    'Houston Transit Agency Unveils Plan to Extend Light Rail to Two Underserved Neighborhoods',
    'Statewide Teacher Shortage Deepens as Districts Compete for a Shrinking Pool of Applicants',
    'Historic Courthouse Reopens After a Four-Year, Budget-Busting Restoration Finally Concludes'],
  business: ['UAE-Controlled Moeve Sells Algerian Upstream Assets in a Deal Worth Several Billion Dollars',
    'Regional Bank Merger Clears Final Hurdle as Regulators Sign Off on the Contested Combination',
    'Quarterly Earnings Beat Expectations but Guidance Disappoints, Sending Shares Lower After Hours',
    'Supply-Chain Snarls Ease as Port Throughput Returns to Pre-Pandemic Levels Across the Gulf',
    'Startup Raises Record Round to Scale Carbon-Capture Hardware Despite a Cooling Venture Market',
    'Retail Sales Surprise to the Upside, Complicating the Central Bank’s Rate-Cut Calculus',
    'Activist Investor Builds Stake and Pushes for Breakup of the Sprawling Industrial Conglomerate',
    'Small Manufacturers Warn New Tariffs Could Erase Thin Margins by the End of the Year'],
  bloom: ['Texas Grid Operator Sets Another Winter Demand Record as Cold Snap Grips the State',
    'Offshore Wind Developer Scraps Project, Citing Rising Costs and a Tangle of Permitting Delays',
    'LNG Export Terminal Wins Approval to Expand, Over the Objections of Coastal Residents',
    'Pipeline Company Settles Spill Case for Millions and Agrees to Independent Monitoring',
    'Solar Installers Rush to Finish Projects Before a Key Federal Credit Begins to Phase Out',
    'Oil Majors Post Mixed Results as Refining Margins Slip and Natural-Gas Prices Stay Soft',
    'Nuclear Startup Signs Deal to Power Data Centers With Small Modular Reactors by 2030',
    'Energy Secretary Tours Storage Facility, Pledging Faster Review of Grid-Scale Battery Permits'],
  sports: ['Bryant Visits Quinnipiac Following Harvey’s 20-Point Game in a Marquee Non-Conference Test',
    'Saving the FSU Standard: Inside the Quiet Rebuild That Could Define the Next Decade in Tallahassee',
    'Rookie Quarterback Throws Four Touchdowns in a Statement Win That Shakes Up the Playoff Picture',
    'Star Forward Ruled Out Indefinitely After Scans Confirm the Injury Everyone Feared',
    'Longtime Coach Steps Down After Two Decades, Ending an Era That Defined the Program',
    'Underdog Upsets Top Seed in Overtime Thriller Decided by a Controversial Final Call',
    'Trade Deadline Blockbuster Sends All-Star Guard Across the Conference in a Three-Team Deal',
    'Marathon Record Falls on a Cool Morning as the Elite Field Pushes a Blistering Early Pace'],
};
const SOURCES_POOL = ['Click2Houston','Houston Chronicle','Reuters','Associated Press','BBC News','NPR','MarketWatch','CNBC','The Guardian US','Bloomberg'];
function catItems(cat) {
  const L = LABEL[cat]; const heads = HEADS[cat] || HEADS.general; const items = [];
  heads.forEach((t, i) => {
    const src = SOURCES_POOL[i % SOURCES_POOL.length];
    const noImg = i === 2 || i === 5; // missing-image rows
    items.push({ title: t, link: `https://ex.com/${cat}/${i}`, pubDate: iso(-10 - i*18), img: noImg ? '' : IMG, desc: `${L} standfirst for a real-shape headline that also wraps to a second line in the excerpt area.`, source: src });
    // duplicate some stories across 2–4 "sources" so State of Play shows "N sources" clusters
    if (i < 4) for (let k = 1; k <= (i + 1); k++) items.push({ title: t, link: `https://ex.com/${cat}/${i}/s${k}`, pubDate: iso(-11 - i*18), img: noImg?'':IMG, desc: 'dup source', source: SOURCES_POOL[(i + k) % SOURCES_POOL.length] });
  });
  // a qualifying breaking story
  items.push({ title: `${heads[3]}`, link: `https://ex.com/${cat}/brk`, pubDate: iso(-6), img: IMG, desc: 'breaking', source: 'Reuters', _breaking: true });
  // a promo that must be filtered
  items.push({ title: `DraftKings promo code: Bet $20, Get $350 in Bonus Bets (${L})`, link:`https://ex.com/${cat}/promo`, pubDate: iso(-15), img: IMG, desc:'promo', source:'DraftKings' });
  return items;
}

// Z1: GENERAL is a MERGE of many publishers (real-shape). The app stamps each item's source = the
// feed's configured name, so a single general feed makes the whole Home pool one publisher and
// capByPublisher would correctly cap Top Stories at 2. Route each general headline across several of
// the real general feed URLs (distinct links per feed so clustering sees multiple outlets) to model
// the real multi-publisher Home pool. The top headlines are carried by 3 feeds (multi-outlet).
const GENERAL_FEED_IDX = {
  'https://feeds.bbci.co.uk/news/rss.xml': 0,
  'https://feeds.npr.org/1001/rss.xml': 1,
  'https://moxie.foxnews.com/google-publisher/latest.xml': 2,
  'https://nypost.com/feed/': 3,
  'https://thehill.com/homenews/feed/': 4,
  'https://www.washingtontimes.com/rss/headlines/news/': 5,
  'https://www.theguardian.com/us/rss': 6,
  'https://api.axios.com/feed/': 7,
};
const N_GENERAL_FEEDS = 8;
// headline 0 (the lead) and 1 are widely covered (3 outlets each); the rest are single-outlet, so
// the breaking strip stays small (the 3-outlet non-lead + the strong-term story) and Top stories
// fills with the remaining diverse-publisher general headlines.
const generalFeedsForHead = i => { const n = i < 2 ? 3 : 1; return Array.from({ length: n }, (_, k) => (i + k) % N_GENERAL_FEEDS); };
function generalItemsForFeed(fi) {
  const items = [];
  HEADS.general.forEach((t, i) => {
    if (!generalFeedsForHead(i).includes(fi)) return;
    const noImg = i === 2 || i === 5;
    items.push({ title: t, link: `https://ex.com/general/${i}/f${fi}`, pubDate: iso(-10 - i * 18), img: noImg ? '' : IMG, desc: 'News standfirst for a real-shape headline that also wraps to a second line in the excerpt area.' });
  });
  // the one genuinely-breaking story (strong term) + the promo come from the primary feed only.
  if (fi === 0) {
    items.push({ title: HEADS.general[3], link: 'https://ex.com/general/brk', pubDate: iso(-6), img: IMG, desc: 'breaking', _breaking: true });
    items.push({ title: 'DraftKings promo code: Bet $20, Get $350 in Bonus Bets (News)', link: 'https://ex.com/general/promo', pubDate: iso(-15), img: IMG, desc: 'promo' });
  }
  return items;
}
function scoresJSON(league){
  if (league!=='nfl') return { events: [] };
  const g=(id,st,away,home,as_,hs,status,date)=>({id:String(id),name:`${away} at ${home}`,shortName:`${away.slice(0,3).toUpperCase()} @ ${home.slice(0,3).toUpperCase()}`,date,status:{type:{description:status,state:st}},links:[{href:'#'}],competitions:[{competitors:[{homeAway:'home',team:{shortDisplayName:home,abbreviation:home.slice(0,3).toUpperCase(),logo:''},score:String(hs)},{homeAway:'away',team:{shortDisplayName:away,abbreviation:away.slice(0,3).toUpperCase(),logo:''},score:String(as_)}]}]});
  return { events: [
    g(1,'in','Buffalo Bills','Kansas City Chiefs',17,21,'Q3 4:12',iso(0)),
    g(2,'in','Houston Texans','Dallas Cowboys',24,20,'Q4 1:05',iso(0)),
    g(3,'pre','Green Bay Packers','Chicago Bears',0,0,'8:20 PM ET',iso(120)),
    g(4,'post','Philadelphia Eagles','New York Giants',31,17,'Final',iso(-180)),
    g(5,'in','Michigan State Spartans','Ohio State Buckeyes',14,28,'Q2 7:40',iso(0)),
    g(6,'pre','Los Angeles Rams','San Francisco 49ers',0,0,'4:25 PM ET',iso(90)),
    g(7,'post','Miami Dolphins','New York Jets',20,10,'Final',iso(-200)),
    g(8,'in','Denver Broncos','Las Vegas Raiders',13,9,'Q3 2:11',iso(0)),
    g(9,'pre','Baltimore Ravens','Cincinnati Bengals',0,0,'1:00 PM ET',iso(60)),
    g(10,'post','Seattle Seahawks','Arizona Cardinals',27,24,'Final',iso(-240)),
    g(11,'pre','Minnesota Vikings','Detroit Lions',0,0,'8:15 PM ET',iso(150)),
    g(12,'in','Jacksonville Jaguars','Tennessee Titans',21,17,'Q4 0:48',iso(0)),
  ] };
}
const PM = { markets: [
  { question: 'Will the Fed cut rates at the next meeting?', probability: 62, source: 'Polymarket', url:'#', matched:true },
  { question: 'Will the Texas oil regulator seat flip stand after the recount?', probability: 48, source: 'Kalshi', url:'#', matched:true },
  { question: 'Will an LNG export expansion be approved this quarter?', probability: 71, source: 'Polymarket', url:'#', matched:false },
  { question: 'Will the regional bank merger close before year end?', probability: 55, source: 'Kalshi', url:'#', matched:true },
]};
export async function installRealFixtures(page, { emptyCats = [], failCats = [], noScores = false, delayMax = 0 } = {}) {
  const D = () => delayMax ? new Promise(res=>setTimeout(res, Math.random()*delayMax)) : Promise.resolve();
  await page.route('**/api/**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: [], status:200 }) }); });
  await page.route('**api.open-meteo.com**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ current:{ temperature_2m:61, weathercode:1, windspeed_10m:7, apparent_temperature:60 }, daily:{ time:['2026-11-04','2026-11-05','2026-11-06'], temperature_2m_max:[66,70,64], temperature_2m_min:[55,57,52], weather_code:[1,2,61] } }) }); });
  await page.route('**site.api.espn.com**', async r => { await D(); const u=r.request().url(); if(/\/scoreboard/.test(u)){ const m=u.match(/sports\/[^/]+\/([^/]+)\/scoreboard/); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(noScores?{events:[]}:scoresJSON(m?m[1]:'')) }); } return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ articles: [] }) }); });
  await page.route('**allorigins**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ contents:'' }) }); });
  await page.route('**/api/discover**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: [] }) }); });
  await page.route('**/api/quote**', async r => { await D(); const s=new URL(r.request().url()).searchParams.get('sym')||'X'; return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ price:200+s.length, chg:-1.2, pct:-0.6 }) }); });
  await page.route('**/api/prediction-markets**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(PM) }); });
  await page.route('**/api/signals**', async r => { await D(); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: [], results: [] }) }); });
  await page.route('**/api/feed**', async r => { await D(); const u=new URL(r.request().url()); const feedUrl=u.searchParams.get('url')||'';
    // Z1: general is multi-publisher — route each general feed URL to its slice of the headlines.
    if (feedUrl in GENERAL_FEED_IDX) { if (!emptyCats.includes('general') && !failCats.includes('general')) return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: generalItemsForFeed(GENERAL_FEED_IDX[feedUrl]), status:200 }) }); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items:[], status:200 }) }); }
    const cat=urlToCat[feedUrl]; if(cat&&failCats.includes(cat)) return r.fulfill({ status:500, contentType:'application/json', body: JSON.stringify({ items:[], status:503 }) }); if(cat&&!emptyCats.includes(cat)) return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: catItems(cat), status:200 }) }); return r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({ items: [], status:200 }) }); });
}
export { PRIMARY, LABEL };
