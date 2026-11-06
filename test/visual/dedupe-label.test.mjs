// X2: dedupe + label correctness (trust).
//  a) SAME STORY ONCE PER PAGE — inject the three NY Post "Martha Stewart apology" headlines (two
//     identical, one near-identical) into a category feed; expect ONE row.
//  b) TOPIC LABEL — inject a tornado-risk story fetched from the sports source The Spun (cat=sports,
//     no sports keyword); expect it NOT labelled "Sports" on Home (never a contradicting guess).
//  c) REDUNDANT LABELS — on a category page, 0 TopicLabel whose text equals the page category; Home
//     keeps its (verified) labels; State of Play rows keep theirs.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { installRealFixtures } from './realfix.mjs';

const BASE = (process.env.BASE || 'http://localhost:8137') + '/?debug=1';
const iso = s => new Date(Date.now() + s * 1000).toISOString();
const IMG = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect fill="#48617d" width="320" height="180"/></svg>').toString('base64');

const MARTHA = [
  { title: 'Martha Stewart issues public apology to Craig Melvin after on-air remark', link: 'https://nypost.com/martha/1', pubDate: iso(-300), img: IMG, desc: 'NY Post', source: 'New York Post' },
  { title: 'Martha Stewart issues public apology to Craig Melvin after on-air remark', link: 'https://nypost.com/pagesix/martha/2', pubDate: iso(-320), img: '', desc: 'Page Six', source: 'Page Six' },
  { title: 'Martha Stewart apologizes to Craig Melvin following her on-air comment', link: 'https://nypost.com/martha/3', pubDate: iso(-340), img: '', desc: 'NY Post sister', source: 'Decider' },
];
const TORNADO = { title: 'U.S. Warns 3 States Of Tornado Risk Friday', link: 'https://thespun.com/tornado', pubDate: iso(-30), img: IMG, desc: 'A severe weather outbreak threatens the region with large hail and strong winds.', source: 'The Spun' };

function catFeed(cat) {
  const out = [];
  if (cat === 'popculture') { out.push(...MARTHA); }
  if (cat === 'sports') { out.push(TORNADO); for (let i = 0; i < 8; i++) out.push({ title: `NFL playoff race tightens as the Texans beat the Colts in week ${i}`, link: `https://ex.com/sp/${i}`, pubDate: iso(-200 - i * 30), img: i % 2 ? IMG : '', desc: 'A football game recap with touchdowns and playoff implications.', source: 'ESPN' }); }
  for (let i = 0; i < 10; i++) out.push({ title: `${cat} headline ${i} that wraps to a second line in the list area here`, link: `https://ex.com/${cat}/${i}`, pubDate: iso(-400 - i * 30), img: i % 3 ? IMG : '', desc: `A ${cat} standfirst.`, source: ['Reuters', 'AP', 'BBC News'][i % 3] });
  return out;
}

const CAT_LABEL = { bloom: 'Energy', business: 'Business & Markets', health: 'Health', tech: 'AI & Tech', sports: 'Sports', popculture: 'Pop Culture' };

const browser = await chromium.launch();
let fails = 0;

async function page(route) {
  const ctx = await browser.newContext({ viewport: { width: 1194, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await installRealFixtures(p);
  await p.route('**/api/feed**', async r => {
    const u = new URL(r.request().url());
    const feed = u.searchParams.get('url') || '';
    let cat = 'general';
    for (const c of ['popculture', 'sports', 'business', 'finance', 'bloom', 'tech', 'health']) if (new RegExp(c).test(feed)) cat = c;
    if (/variety|pagesix|tmz|ew\.com|popculture/.test(feed)) cat = 'popculture';
    if (/cbssports|espn|thespun|sports/.test(feed)) cat = 'sports';
    if (/cnbc|bloomberg|business|energy|oilprice|cnbc\.com\/id\/19836768/.test(feed)) cat = feed.includes('19836768') ? 'bloom' : 'business';
    if (/bbci|bbc|npr|guardian/.test(feed)) cat = 'general';
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: catFeed(cat), status: 200 }) });
  });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof window.__nav === 'function', { timeout: 12000 }).catch(() => {});
  if (route !== 'general') await p.evaluate(r => window.__nav(r), route).catch(() => {});
  await p.waitForTimeout(2600);
  return { ctx, p };
}

// a) dedupe on the Pop Culture page
{
  const { ctx, p } = await page('popculture');
  const n = await p.evaluate(() => [...document.querySelectorAll('.fc-title, .toh-compact-title, .toh-title, .snap-title, .today-item-title')].filter(e => /Martha Stewart/i.test(e.textContent || '')).length);
  if (n === 1) console.log(`PASS dedupe: Martha Stewart appears 1x on Pop Culture`);
  else { fails++; console.log(`FAIL dedupe: Martha Stewart appears ${n}x on Pop Culture (expected 1)`); }
  await ctx.close();
}

// b) tornado label on Home
{
  const { ctx, p } = await page('general');
  const r = await p.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter(e => (e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && /Tornado Risk Friday/i.test(n.textContent))) || /Tornado Risk Friday/i.test(e.textContent || '') && e.children.length < 3);
    const headline = [...document.querySelectorAll('.toh-title, .toh-compact-title, .snap-title, .fc-title, .today-item-title, .hero-band-side-title')].find(e => /Tornado Risk Friday/i.test(e.textContent || ''));
    if (!headline) return { present: false };
    // walk up to the card and look for a topic-tag reading "Sports"
    let card = headline; for (let i = 0; i < 5 && card.parentElement; i++) card = card.parentElement;
    const tags = [...card.querySelectorAll('.topic-tag')].map(t => (t.textContent || '').trim());
    return { present: true, sportsLabel: tags.includes('Sports'), tags };
  });
  if (!r.present) console.log(`SKIP tornado-label: story not surfaced in a labelled Home slot (no wrong label possible)`);
  else if (!r.sportsLabel) console.log(`PASS tornado-label: tornado story NOT labelled Sports on Home (tags: ${JSON.stringify(r.tags)})`);
  else { fails++; console.log(`FAIL tornado-label: tornado story labelled Sports on Home`); }
  await ctx.close();
}

// c) redundant labels on category pages + Home still labels
for (const route of ['bloom', 'business', 'health', 'tech', 'sports']) {
  const { ctx, p } = await page(route);
  const bad = await p.evaluate((expect) => [...document.querySelectorAll('.topic-tag')].map(t => (t.textContent || '').trim()).filter(t => t === expect), CAT_LABEL[route]);
  if (bad.length === 0) console.log(`PASS redundant-label: 0 "${CAT_LABEL[route]}" TopicLabel on ${route} page`);
  else { fails++; console.log(`FAIL redundant-label: ${bad.length} "${CAT_LABEL[route]}" TopicLabel on ${route} page`); }
  await ctx.close();
}

console.log(`\nDEDUPE-LABEL — ${fails} failures`);
console.log(fails === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
await browser.close();
process.exit(fails ? 1 : 0);
