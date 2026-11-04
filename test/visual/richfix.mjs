// T4: a RICHER fixture that serves each verticals' stories from SEVERAL feeds, so distinct source
// names survive (the app tags every item with its feed's name, and State of Play caps 2 per
// publisher — so a single-feed fixture can only ever yield 2 ranked rows). Each listed feed returns
// 3 distinct multi-line headlines; a category draws from 4-6 feeds, so >=12 stories from >=4 sources
// remain after dedupe — enough for a real State of Play card (>=3 rows) plus a breaking row.
const IMG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect fill="#5a6b7c" width="320" height="180"/></svg>').toString('base64');
const now = Date.now();
const iso = m => new Date(now + m * 60000).toISOString();

// feedUrl -> category. The app resolves source from its own config by URL, so we only choose the
// URLs (its feed list) and return distinct stories per URL.
const FEEDS = {
  // sports — 6 feeds
  'https://www.cbssports.com/rss/headlines/nfl': 'sports',
  'https://www.cbssports.com/rss/headlines/nba': 'sports',
  'https://www.cbssports.com/rss/headlines/mlb': 'sports',
  'https://www.cbssports.com/rss/headlines/college-football': 'sports',
  'https://www.nbcsports.com/profootballtalk.rss': 'sports',
  'https://sports.yahoo.com/rss/': 'sports',
  // business — 4 feeds
  'https://feeds.npr.org/1006/rss.xml': 'business',
  'https://www.cnbc.com/id/10001147/device/rss/rss.html': 'business',
  'https://www.theguardian.com/business/rss': 'business',
  'https://www.cnbc.com/id/19854910/device/rss/rss.html': 'business',
  // energy (bloom) — 5 feeds
  'https://oilprice.com/rss/main': 'bloom',
  'https://www.utilitydive.com/feeds/news/': 'bloom',
  'https://www.datacenterdynamics.com/en/rss/': 'bloom',
  'https://www.powermag.com/feed/': 'bloom',
  'https://www.cnbc.com/id/19836768/device/rss/rss.html': 'bloom',
  // health — 4 feeds
  'https://www.sciencedaily.com/rss/health_medicine.xml': 'health',
  'https://feeds.megaphone.fm/hubermanlab': 'health',
  'https://peterattiadrive.libsyn.com/rss': 'health',
  'https://podcast.foundmyfitness.com/rss': 'health',
  // general (so Home still has a lead/top)
  'https://feeds.bbci.co.uk/news/rss.xml': 'general',
  'https://feeds.npr.org/1001/rss.xml': 'general',
  'https://www.theguardian.com/us/rss': 'general',
  'https://api.axios.com/feed/': 'general',
};

// distinct multi-line headlines per category (>=18 so 3 go to each of up to 6 feeds)
const HEADS = {
  sports: [
    'Rookie Quarterback Throws Four Touchdowns in a Statement Win That Shakes the Playoff Picture',
    'Star Forward Ruled Out Indefinitely After Scans Confirm the Injury Everyone Feared Most',
    'Trade Deadline Blockbuster Sends an All-Star Guard Across the Conference in a Three-Team Deal',
    'Longtime Coach Steps Down After Two Decades, Ending an Era That Defined the Whole Program',
    'Underdog Upsets the Top Seed in an Overtime Thriller Decided by a Controversial Final Call',
    'Saving the FSU Standard: Inside the Quiet Rebuild That Could Define the Next Decade in Tallahassee',
    'Bryant Visits Quinnipiac Following Harvey’s 20-Point Game in a Marquee Non-Conference Test',
    'Marathon Record Falls on a Cool Morning as the Elite Field Pushes a Blistering Early Pace Downtown',
    'Veteran Closer Signs a Record Deal, Reshaping the Bullpen Market for Every Contender This Winter',
    'Freshman Phenom Commits to the In-State Program Over a Dozen Blue-Blood Scholarship Offers',
    'League Expands Replay Review After a Blown Call Decides a Nationally Televised Rivalry Game',
    'Hall of Fame Class Announced, and One Glaring Omission Has the Whole Sport Talking Tonight',
    'Franchise Unveils a New Stadium Plan With a Retractable Roof and a Downtown Entertainment District',
    'Golf’s Young Star Surges on the Back Nine to Claim a First Major in Dramatic Fashion',
    'Point Guard Returns From Injury and Drops a Triple-Double in His Very First Game Back',
    'Expansion Draft Sets the Table as the Newest Franchise Builds Its Inaugural Roster From Scratch',
    'Scandal Rocks the Conference as an Investigation Opens Into Recruiting Violations at Two Schools',
    'Record Crowd Packs the Arena for a Playoff Atmosphere in the Middle of the Regular Season',
  ],
  business: [
    'Regional Bank Merger Clears Its Final Hurdle as Regulators Sign Off on the Contested Combination',
    'Quarterly Earnings Beat Expectations but Guidance Disappoints, Sending Shares Lower After Hours',
    'Activist Investor Builds a Stake and Pushes for a Breakup of the Sprawling Industrial Conglomerate',
    'Retail Sales Surprise to the Upside, Complicating the Central Bank’s Rate-Cut Calculus for Winter',
    'Small Manufacturers Warn New Tariffs Could Erase Their Thin Margins by the End of the Year',
    'Startup Raises a Record Round to Scale Carbon-Capture Hardware Despite a Cooling Venture Market',
    'Supply-Chain Snarls Ease as Port Throughput Returns to Pre-Pandemic Levels Across the Gulf Coast',
    'Ten-Year Treasury Yield Slides as Traders Price In a Softer Labor Market and Cooling Inflation',
    'Chipmaker Guides Higher on AI Demand, Then Warns of a Supply Crunch Lasting Into Next Year',
    'Airline Posts a Profit but Flags Weaker Corporate Travel Heading Into a Softer Fourth Quarter',
    'Major Retailer Shutters Dozens of Stores as It Pivots Spending Toward E-commerce and Logistics',
    'Private Equity Firm Takes a Software Maker Private in the Year’s Largest Leveraged Buyout',
  ],
  bloom: [
    'Texas Grid Operator Sets Another Winter Demand Record as a Cold Snap Grips the Entire State',
    'Offshore Wind Developer Scraps a Project, Citing Rising Costs and a Tangle of Permitting Delays',
    'LNG Export Terminal Wins Approval to Expand, Over the Objections of Nearby Coastal Residents',
    'Nuclear Startup Signs a Deal to Power Data Centers With Small Modular Reactors by the Decade’s End',
    'Solar Installers Rush to Finish Projects Before a Key Federal Credit Begins to Phase Out',
    'Pipeline Company Settles a Spill Case for Millions and Agrees to Independent Third-Party Monitoring',
    'Energy Secretary Tours a Storage Facility, Pledging Faster Review of Grid-Scale Battery Permits',
    'Data-Center Boom Strains Local Grids as Utilities Scramble to Add Capacity Fast Enough to Keep Up',
    'Oil Majors Post Mixed Results as Refining Margins Slip and Natural-Gas Prices Stay Stubbornly Soft',
    'Regulators Approve a Transmission Line to Carry Wind Power From the Plains to Distant City Markets',
    'Battery Recycler Opens Its First Plant, Betting on a Coming Wave of Retired Electric-Vehicle Packs',
    'Hydrogen Hub Lands Federal Funding as the Region Bets on a New Clean-Fuel Manufacturing Corridor',
  ],
  health: [
    'Large Trial Finds the New Weight-Loss Drug Cuts Cardiac Events, Reshaping Prevention Guidelines',
    'Sleep Researchers Link Consistent Bedtimes to Sharper Memory and a Lower Long-Term Dementia Risk',
    'Zone 2 Training Gains Traction as Studies Tie Aerobic Base Work to Better Metabolic Health Markers',
    'Protein Timing Study Challenges the Old Advice, Finding Total Daily Intake Matters More Than Windows',
    'Omega-3 Supplementation Shows a Modest Benefit for Inflammation in a Large Multi-Year Cohort Study',
    'Sauna Use Associated With Lower Cardiovascular Mortality in a Decades-Long Finnish Population Study',
    'Continuous Glucose Monitors Go Mainstream as Healthy Adults Adopt Them to Fine-Tune Their Diets',
    'VO2 Max Emerges as a Top Predictor of Longevity, Prompting a Rethink of Routine Fitness Testing',
    'Resistance Training Twice a Week Linked to Preserved Muscle and Independence in Older Adults',
    'Gut-Microbiome Study Connects Fiber Diversity to Mood, Adding Weight to the Diet-Brain Hypothesis',
    'New Alzheimer’s Blood Test Flags Risk Years Early, Raising Hard Questions About When to Screen',
    'Intermittent Fasting Trial Finds Benefits Fade Without Strength Work to Protect Lean Body Mass',
  ],
  general: [
    'City Council Approves a Sweeping Flood-Control Bond After Nine Hours of Public Testimony Downtown',
    'Federal Judge Blocks a New Rule, Sending the Dispute Back to a Divided Federal Appeals Court',
    'Statewide Teacher Shortage Deepens as Districts Compete for a Shrinking Pool of New Applicants',
    'Historic Courthouse Reopens After a Four-Year, Budget-Busting Restoration Finally Concludes at Last',
    'Transit Agency Unveils a Plan to Extend Light Rail to Two Long-Underserved Neighborhoods',
    'Democrats Win a Texas Oil Regulator Seat for the First Time Since 1990 in an Upset That Rattles Austin',
    'Major Explosion and Emergency Evacuation Reported Near the Ship Channel in the Overnight Hours',
    'Mayor Proposes a Budget That Boosts Police and Parks While Holding the Property-Tax Rate Flat',
  ],
};

const SRC = ['A', 'B', 'C', 'D', 'E', 'F'];
// deterministically hand each feed its own slice of the category's headlines
function storiesForFeed(url, cat, feedIndexInCat) {
  const heads = HEADS[cat] || HEADS.general;
  const out = [];
  for (let k = 0; k < 3; k++) {
    const idx = (feedIndexInCat * 3 + k) % heads.length;
    const t = heads[idx];
    const noImg = (feedIndexInCat + k) % 4 === 2; // a few missing-image rows
    out.push({ title: t, link: `${url}#${k}`, pubDate: iso(-8 - feedIndexInCat * 7 - k * 3), img: noImg ? '' : IMG, desc: `Standfirst for a real-shape headline that wraps to a second line in the excerpt area.` });
  }
  // the first feed of each category also carries a qualifying breaking story
  if (feedIndexInCat === 0) out.push({ title: heads[heads.length - 1], link: `${url}#brk`, pubDate: iso(-5), img: IMG, desc: 'breaking', _breaking: true });
  return out;
}

export async function installRichFixtures(page, { delayMax = 0 } = {}) {
  const D = () => delayMax ? new Promise(res => setTimeout(res, Math.random() * delayMax)) : Promise.resolve();
  // index feeds within their category so each gets a distinct slice
  const perCat = {};
  const feedIndex = {};
  for (const [url, cat] of Object.entries(FEEDS)) { perCat[cat] = perCat[cat] || []; feedIndex[url] = perCat[cat].length; perCat[cat].push(url); }

  await page.route('**/api/**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], status: 200 }) }); });
  await page.route('**api.open-meteo.com**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ current: { temperature_2m: 61, weathercode: 1, windspeed_10m: 7, apparent_temperature: 60 }, daily: { time: ['2026-11-04', '2026-11-05', '2026-11-06'], temperature_2m_max: [66, 70, 64], temperature_2m_min: [55, 57, 52], weather_code: [1, 2, 61] } }) }); });
  await page.route('**site.api.espn.com**', async r => { await D(); const u = r.request().url(); if (/\/scoreboard/.test(u)) { const m = u.match(/sports\/[^/]+\/([^/]+)\/scoreboard/); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(scoresJSON(m ? m[1] : '')) }); } return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ articles: [] }) }); });
  await page.route('**allorigins**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contents: '' }) }); });
  await page.route('**/api/discover**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) }); });
  await page.route('**/api/quote**', async r => { await D(); const s = new URL(r.request().url()).searchParams.get('sym') || 'X'; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ price: 200 + s.length, chg: -1.2, pct: -0.6 }) }); });
  await page.route('**/api/prediction-markets**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ markets: [] }) }); });
  await page.route('**/api/signals**', async r => { await D(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], results: [] }) }); });
  await page.route('**/api/feed**', async r => {
    await D();
    const u = new URL(r.request().url());
    const feedUrl = u.searchParams.get('url') || '';
    const cat = FEEDS[feedUrl];
    if (cat && feedIndex[feedUrl] != null) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: storiesForFeed(feedUrl, cat, feedIndex[feedUrl]), status: 200 }) });
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], status: 200 }) });
  });
}

function scoresJSON(league) {
  if (league !== 'nfl') return { events: [] };
  const g = (id, st, away, home, as_, hs, status, date) => ({ id: String(id), name: `${away} at ${home}`, shortName: `${away.slice(0, 3).toUpperCase()} @ ${home.slice(0, 3).toUpperCase()}`, date, status: { type: { description: status, state: st } }, links: [{ href: '#' }], competitions: [{ competitors: [{ homeAway: 'home', team: { shortDisplayName: home, abbreviation: home.slice(0, 3).toUpperCase(), logo: '' }, score: String(hs) }, { homeAway: 'away', team: { shortDisplayName: away, abbreviation: away.slice(0, 3).toUpperCase(), logo: '' }, score: String(as_) }] }] });
  return { events: [g(1, 'in', 'Buffalo Bills', 'Kansas City Chiefs', 17, 21, 'Q3 4:12', iso(0)), g(2, 'in', 'Houston Texans', 'Dallas Cowboys', 24, 20, 'Q4 1:05', iso(0)), g(3, 'post', 'Philadelphia Eagles', 'New York Giants', 31, 17, 'Final', iso(-180))] };
}
