// G6 fixture test. Run: node src/modules/connections/connections.test.mjs
// 30 headlines: 4 true cross-category bridges + 6 false-friend traps + fillers.
import { findConnections } from './connections.js';

// A representative slice of DEFAULT_KW (the real app passes DEFAULT_KW).
const KW = {
  general: ['White House', 'Texas', 'Iran'],
  tech: ['AI', 'OpenAI', 'Apple', 'NVIDIA'],
  bloom: ['data center', 'power grid', 'ERCOT'],
  business: ['energy', 'oil', 'data center', 'power grid'],
  finance: ['interest rates', 'inflation', 'Fed', 'stock market', 'crypto'],
  health: ['metabolic health', 'sleep'],
  sports: ['recruiting', 'transfer portal', 'Rockets'],
  popculture: ['music', 'streaming'],
};
const CATL = { general: 'News', tech: 'AI & Tech', bloom: 'Energy', business: 'Business', finance: 'Finance', health: 'Health', sports: 'Sports', popculture: 'Pop Culture' };
const t = (mins) => new Date(Date.now() - mins * 60000).toISOString();

const F = [
  // ── 4 TRUE BRIDGES ──
  { id: 'B1a', cat: 'tech', source: 'The Verge', title: 'OpenAI data center will test the Texas power grid', pubDate: t(5) },
  { id: 'B1b', cat: 'bloom', source: 'Reuters', title: 'Data center growth strains the power grid, utilities warn', pubDate: t(10) },
  { id: 'B2a', cat: 'general', source: 'NPR', title: 'White House meets OpenAI on AI safety rules', pubDate: t(15) },
  { id: 'B2b', cat: 'tech', source: 'Wired', title: 'OpenAI briefs the White House on frontier models', pubDate: t(20) },
  { id: 'B3a', cat: 'finance', source: 'Bloomberg', title: 'Fed holds as interest rates stay high and inflation lingers', pubDate: t(25) },
  { id: 'B3b', cat: 'business', source: 'WSJ', title: 'Inflation and interest rates weigh on energy plans', pubDate: t(30) },
  { id: 'B4a', cat: 'health', source: 'NYT', title: 'Apple Watch sleep data tied to metabolic health', pubDate: t(35) },
  { id: 'B4b', cat: 'tech', source: 'TechCrunch', title: 'Apple chip powers on-device AI for sleep insights', pubDate: t(40) },

  // ── 6 TRAPS (must NOT produce a connection) ──
  // T1: same company name, only ONE shared entity (Apple) across unrelated stories
  { id: 'T1a', cat: 'popculture', source: 'Variety', title: 'Apple TV renews its hit drama for a third season', pubDate: t(50) },
  { id: 'T1b', cat: 'general', source: 'Food52', title: 'Apple pie recipes trend this autumn', pubDate: t(55) },
  // T2: generic words only → no entities
  { id: 'T2', cat: 'general', source: 'Patch', title: 'New report this week tops the local charts', pubDate: t(60) },
  // T3: same category only (unique pair), not cross-category
  { id: 'T3a', cat: 'sports', source: 'ESPN', title: 'Recruiting and the transfer portal reshape the roster', pubDate: t(65) },
  { id: 'T3b', cat: 'sports', source: 'The Athletic', title: 'Transfer portal recruiting battles heat up', pubDate: t(70) },
  // T4: cross-category but only ONE shared entity (stock market)
  { id: 'T4a', cat: 'finance', source: 'CNBC', title: 'Crypto rally lifts the stock market', pubDate: t(75) },
  { id: 'T4b', cat: 'business', source: 'FT', title: 'Oil majors tap the stock market for capital', pubDate: t(80) },
  // T5: two shared entities but SAME outlet (1 distinct outlet)
  { id: 'T5a', cat: 'tech', source: 'OneWire', title: 'NVIDIA powers a new data center build', pubDate: t(85) },
  { id: 'T5b', cat: 'business', source: 'OneWire', title: 'Data center boom drives NVIDIA sales', pubDate: t(90) },
  // T6: shared term is a generic/stoplisted word only
  { id: 'T6a', cat: 'popculture', source: 'Pitchfork', title: 'The music market booms this year', pubDate: t(95) },
  { id: 'T6b', cat: 'business', source: 'Economist', title: 'Energy market shifts fast this year', pubDate: t(100) },
  // K5 ALIAS traps: two articles that share only ONE person in two surface forms
  // ("President Trump" + "Trump"). Before alias-merge they looked like 2 shared entities
  // and faked a bridge; after merge they share 1 entity -> NO bridge.
  { id: 'T7a', cat: 'general', source: 'NPR', title: 'President Trump speaks as Trump defends the new policy', pubDate: t(102) },
  { id: 'T7b', cat: 'business', source: 'WSJ', title: 'Trump tariffs land as President Trump signs the order', pubDate: t(104) },

  // ── 10 FILLERS (isolated, no cross-category 2-entity overlap) ──
  ...Array.from({ length: 10 }, (_, i) => ({ id: 'F' + i, cat: ['general', 'sports', 'popculture', 'health', 'finance'][i % 5], source: 'Filler' + i, title: `Local update number ${i} about a neighbourhood meeting`, pubDate: t(120 + i) })),
].map(a => ({ ...a, link: 'https://ex.com/' + a.id, desc: '' }));

const got = findConnections(F, { kw: KW, max: 20, catLabel: c => CATL[c] || c });

// A found connection "is" bridge Bn if its member links include both Bn a+b.
const has = (links, a, b) => links.includes('https://ex.com/' + a) && links.includes('https://ex.com/' + b);
const foundLinks = got.map(c => c.members.map(m => m.link));
const bridges = [['B1a', 'B1b'], ['B2a', 'B2b'], ['B3a', 'B3b'], ['B4a', 'B4b']];
const trapIds = ['T1a', 'T1b', 'T2', 'T3a', 'T3b', 'T4a', 'T4b', 'T5a', 'T5b', 'T6a', 'T6b', 'T7a', 'T7b'];

let foundBridges = 0;
for (const [a, b] of bridges) { if (foundLinks.some(ls => has(ls, a, b))) foundBridges++; }
// a trap is "shown" if a connection's members are ENTIRELY trap articles (no real bridge)
const trapsShown = got.filter(c => c.members.every(m => trapIds.includes(m.id))).length;

console.log('Found connections:');
for (const c of got) console.log(`  ${c.bridge} — shared: ${c.shared.join(', ')} — outlets: ${c.outlets} — [${c.members.map(m => m.id).join(',')}]`);
const recall = foundBridges / bridges.length;
const precision = got.length ? (got.length - trapsShown) / got.length : 1;
console.log(`\nTrue bridges found: ${foundBridges}/4   Traps shown: ${trapsShown}`);
console.log(`Recall: ${(recall * 100).toFixed(0)}%   Precision: ${(precision * 100).toFixed(0)}%`);
const passAll = foundBridges === 4 && trapsShown === 0;
console.log(passAll ? '\nPASS: 4/4 bridges found, 0 traps shown' : '\nFAIL');
process.exit(passAll ? 0 : 1);
