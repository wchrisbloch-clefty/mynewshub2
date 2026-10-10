// I0.8 fixture test — satire exclusion (rules only) + one-story-<=1-bridge.
// Run: node src/modules/satire/satire.test.mjs
import { isSatire, partitionSatire } from './index.js';
import { qualifyBreaking } from '../breaking/index.js';
import { selectStateOfPlay } from '../state-of-play/select.js';
import { findConnections } from '../connections/connections.js';

const t = (mins) => new Date(Date.now() - mins * 60000).toISOString();
let fails = 0;
const check = (name, cond, detail = '') => { console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!cond) fails++; };

// ── Part 1: satire detection by source name AND by URL host ──────────────────
console.log('Satire detection (rules only):');
const onionHurricane = { title: 'Hurricane Upgraded To Category 6 After Meteorologists Run Out Of Adjectives', source: 'The Onion', link: 'https://www.theonion.com/hurricane-cat-6', cat: 'general', pubDate: t(5) };
check('Onion hurricane flagged by source name', isSatire(onionHurricane));
check('Babylon Bee flagged by URL host', isSatire({ title: 'Congress Passes Bill', source: 'BabBee', link: 'https://babylonbee.com/news/x', cat: 'general', pubDate: t(5) }));
check('ClickHole flagged by source name', isSatire({ title: 'This Man', source: 'ClickHole', link: 'https://ex.com/a', cat: 'general', pubDate: t(5) }));
check('real Reuters hurricane NOT flagged', !isSatire({ title: 'Hurricane Milton makes landfall on Gulf Coast', source: 'Reuters', link: 'https://reuters.com/world/x', cat: 'general', pubDate: t(5) }));
check('report names the hurricane source', onionHurricane.source === 'The Onion');

// ── Part 2: the satirical hurricane never surfaces as Breaking ───────────────
console.log('\nBreaking excludes satire (partition before qualify):');
const feed = [
  onionHurricane,
  { title: 'Hurricane Milton makes landfall on Gulf Coast, evacuations ordered', source: 'Reuters', link: 'https://reuters.com/world/milton', cat: 'general', pubDate: t(4) },
  { title: 'Hurricane Milton: thousands flee as storm intensifies', source: 'AP', link: 'https://apnews.com/milton', cat: 'general', pubDate: t(6) },
  { title: 'Hurricane Milton tracks toward Tampa Bay', source: 'CNN', link: 'https://cnn.com/milton', cat: 'general', pubDate: t(8) },
];
const { satire, rest } = partitionSatire(feed);
check('partition holds back exactly the Onion item', satire.length === 1 && satire[0].source === 'The Onion');
const brk = qualifyBreaking(rest, { now: Date.now() });
check('no satire in Breaking output', !brk.some(b => isSatire(b)), `${brk.length} breaking`);

// ── State of Play excludes satire too ────────────────────────────────────────
console.log('\nState of Play excludes satire:');
const sop = selectStateOfPlay({
  items: feed.map(a => ({ ...a, _clusterSize: 3 })),
  breakingItems: [onionHurricane],
  gapItems: [onionHurricane],
});
const allSop = [...sop.breaking, ...sop.top, ...sop.gaps];
check('no satire anywhere in State of Play', !allSop.some(a => isSatire(a)), `${allSop.length} rows`);

// ── Part 3: one story appears in <=1 bridge ──────────────────────────────────
console.log('\nConnections: each story in <=1 bridge:');
const KW = { tech: ['OpenAI', 'data center', 'AI'], bloom: ['power grid', 'ERCOT'], business: ['energy', 'oil'], general: ['Texas', 'White House'] };
const CATL = { tech: 'AI & Tech', bloom: 'Energy', business: 'Business', general: 'News' };
const a = (id, cat, source, title, mins) => ({ id, cat, source, title, link: 'https://ex.com/' + id, pubDate: t(mins), desc: '' });
const items = [
  // HUB shares {power grid,Texas} with A and {energy,OpenAI} with B — eligible for TWO bridges.
  a('HUB', 'tech', 'The Verge', 'OpenAI data center strains the Texas power grid amid new energy rules', 5),
  a('A', 'bloom', 'Reuters', 'Texas power grid faces record demand as data center load climbs', 10),
  a('B', 'business', 'WSJ', 'OpenAI energy deal values power-hungry data center firms', 15),
  // Independent bridge that shares NO story with the above.
  a('C', 'general', 'NPR', 'White House briefs Texas officials on grid resilience', 20),
  a('D', 'bloom', 'Bloomberg', 'Texas grid operator ERCOT warns White House of winter risk', 25),
  // A satire item that would otherwise bridge — must be excluded.
  a('SAT', 'general', 'The Onion', 'Texas Power Grid Achieves Sentience, Demands Energy Rights', 3),
];
items.find(x => x.id === 'SAT').link = 'https://theonion.com/grid';
const conns = findConnections(items, { kw: KW, max: 10, catLabel: c => CATL[c] || c });
console.log('  bridges:');
for (const c of conns) console.log(`    ${c.bridge} — [${c.members.map(m => m.id).join(',')}] shared: ${c.shared.join(', ')}`);
// Invariant: no link appears in two kept bridges.
const linkCounts = new Map();
for (const c of conns) for (const m of c.members) linkCounts.set(m.link, (linkCounts.get(m.link) || 0) + 1);
const maxPer = Math.max(0, ...linkCounts.values());
check('no story appears in more than one bridge', maxPer <= 1, `max memberships = ${maxPer}`);
check('satire story never appears in a bridge', ![...linkCounts.keys()].some(l => l.includes('theonion.com')));
check('at least one real bridge survives', conns.length >= 1, `${conns.length} bridges`);

console.log(fails ? `\nFAIL (${fails})` : '\nPASS: satire excluded from Breaking/SoP/Connections; each story in <=1 bridge');
process.exit(fails ? 1 : 0);
