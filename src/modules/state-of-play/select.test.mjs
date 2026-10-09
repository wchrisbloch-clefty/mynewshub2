// I0.7 fixture test — a Breaking story must NOT repeat in State of Play's numbered
// list (dedupe by cluster id). Run: node src/modules/state-of-play/select.test.mjs
import { selectStateOfPlay } from './select.js';
import { clusterKey, sameStory } from '../clustering/index.js';

const t = (mins) => new Date(Date.now() - mins * 60000).toISOString();
const a = (id, title, source, mins, extra = {}) => ({ id, title, source, link: 'https://ex.com/' + id, pubDate: t(mins), ...extra });

// The hurricane story is BREAKING and also present (from other outlets) in the ranked
// feed — the exact "repeats in the numbered list" bug. One variant is entity-encoded to
// prove clusterKey normalization catches near-identical headlines bigram clustering misses.
const HURRICANE = 'Hurricane Milton makes landfall on the Gulf Coast';
const HURRICANE_ENC = 'Hurricane Milton makes landfall on the Gulf Coast &#8212; evacuations ordered';

const breakingItems = [
  a('BRK', HURRICANE, 'AP', 2, { _breakingWhy: 'hurricane' }),
];

const items = [
  // Same cluster as breaking, different outlets (must be dropped from numbered list).
  a('H1', HURRICANE, 'Reuters', 6, { _clusterSize: 4 }),
  a('H2', HURRICANE_ENC, 'CNN', 8, { _clusterSize: 2 }),
  // Distinct stories that SHOULD appear in the numbered list.
  a('S1', 'Fed holds interest rates steady as inflation cools', 'Bloomberg', 20, { _clusterSize: 3 }),
  a('S2', 'City council approves new transit budget downtown', 'NPR', 30, { _clusterSize: 2 }),
  a('S3', 'Tech giant unveils on-device AI chip for phones', 'The Verge', 40, { _clusterSize: 2 }),
  a('S4', 'Local team clinches playoff berth in overtime', 'ESPN', 50, { _clusterSize: 1 }),
];

// A gap row that duplicates a numbered story (must be dropped) + a genuinely new one.
const gapItems = [
  a('G1', 'Fed holds interest rates steady as inflation cools', 'FT', 22, { outlets: ['FT'], outletCount: 3 }),
  a('G2', 'Regional drought prompts new water restrictions', 'KUT', 60, { outlets: ['KUT'], outletCount: 5 }),
];

const { breaking, top, gaps } = selectStateOfPlay({ items, breakingItems, gapItems });

const brk = breakingItems[0];
const keysOf = arr => arr.map(x => clusterKey(x.title));

let fails = 0;
const check = (name, cond, detail = '') => { console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!cond) fails++; };

console.log('State of Play dedup (I0.7):');
check('hurricane shows exactly once as breaking', breaking.filter(b => sameStory(b, brk)).length === 1);
// Strong check: NO story in the same cluster as the breaking item (incl. the near-
// identical encoded variant H2) may appear in the numbered list.
check('hurricane cluster does NOT repeat in numbered list', !top.some(a => sameStory(a, brk)),
  `top = [${top.map(x => x.id).join(', ')}]`);
check('numbered list still fills with distinct stories', top.length >= 3 && new Set(keysOf(top)).size === top.length,
  `${top.length} rows`);
const fedStory = items.find(x => x.id === 'S1');
check('gap duplicate of a numbered story dropped', !gaps.some(g => sameStory(g, fedStory)),
  `gaps = [${gaps.map(x => x.id).join(', ')}]`);
check('genuinely-new gap survives', gaps.some(g => g.id === 'G2'));

// Global: no story appears in more than one of the three sections.
const all = [...breaking, ...top, ...gaps];
let dupPairs = 0;
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (sameStory(all[i], all[j])) dupPairs++;
check('no story appears in two sections', dupPairs === 0, `${dupPairs} duplicate pairs across ${all.length} rows`);

console.log(fails ? `\nFAIL (${fails})` : '\nPASS: breaking never repeats below; cross-section dedup holds');
process.exit(fails ? 1 : 0);
