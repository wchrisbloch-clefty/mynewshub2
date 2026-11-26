// AG3: "Also moving" selector — multi-outlet / keyword / team qualifiers, fan-alt-local guard,
// exclude-keys, max 2 per publisher.
import { selectAlsoMoving } from '../../src/modules/also-moving/select.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const sk = a => (a.title || '').slice(0, 60).toLowerCase().replace(/\s+/g, '');
const art = (source, title, extra = {}) => ({ source, title, link: title, desc: '', _clusterSize: 1, ...extra });

// (a) a 2-outlet story that is nobody's lead → appears with "2 outlets"
const twoOutlet = art('Reuters (Google News)', 'Quiet policy shift moves through committee today', { _clusterSize: 2, _clusterSources: ['Reuters (Google News)', 'CNN'] });
let rows = selectAlsoMoving([twoOutlet], { storyKey: sk });
ok(rows.length === 1 && rows[0].why === '2 outlets', '2-outlet story qualifies with "2 outlets"');

// fan-blog single outlet ("Big House") → excluded (fan, single rank)
const fanBlog = art('The Spun', 'Big House rumor swirls on a fan blog tonight');
ok(selectAlsoMoving([fanBlog], { storyKey: sk }).length === 0, 'single fan-blog story is excluded');

// quirky single mainstream story with no coverage/keyword ("Staten Island turkeys") → excluded
const quirky = art('NBC News', 'Staten Island turkeys wander into a parking lot');
ok(selectAlsoMoving([quirky], { storyKey: sk }).length === 0, 'single-outlet non-matching story is excluded');

// (c) keyword match surfaces a single-outlet story with "Your keyword: ERCOT"
const kw = art('Rigzone', 'ERCOT warns of tight grid conditions this week');
rows = selectAlsoMoving([kw], { storyKey: sk, kwMatch: (a) => (/ercot/i.test(a.title) ? ['ERCOT'] : []) });
ok(rows.length === 1 && rows[0].why === 'Your keyword: ERCOT', 'keyword match → "Your keyword: ERCOT"');

// exclude-keys respected (already shown in Top now / glance)
ok(selectAlsoMoving([twoOutlet], { storyKey: sk, excludeKeys: new Set([sk(twoOutlet)]) }).length === 0, 'excluded key does not reappear');

// max 2 per publisher
const p = (t) => art('CNBC Top News', t, { _clusterSize: 2, _clusterSources: ['CNBC Top News', 'WSJ Business'] });
rows = selectAlsoMoving([p('Alpha story moves widely today'), p('Beta story moves widely today'), p('Gamma story moves widely today')], { storyKey: sk });
ok(rows.length === 2, 'at most 2 per publisher');

// (b) AG4 trending: a single-outlet story flagged by trendingHas → "Trending" chip
const trend = art('NPR News', 'A single-outlet story that happens to be trending now');
rows = selectAlsoMoving([trend], { storyKey: sk, trendingHas: (a) => /trending/i.test(a.title) });
ok(rows.length === 1 && rows[0].why === 'Trending', 'trendingHas → "Trending" chip (AG4 hook)');

// (d) AG5.3 voice flag: a single-outlet story a confirmed voice flagged → "Yergin · 2h ↗" chip
const vf = art('Oilprice.com', 'A single-outlet energy story a voice just posted about');
rows = selectAlsoMoving([vf], { storyKey: sk, voiceFlag: () => ({ name: 'Yergin', ago: '2h' }) });
ok(rows.length === 1 && rows[0].why === 'Yergin · 2h ↗', 'voiceFlag → "Yergin · 2h ↗" chip (AG5.3 hook)');

// fan/alt/local with >=2 DISTINCT ranks qualifies (e.g. a local + a core outlet)
const mixed = art('KHOU Houston', 'Grid story carried by a core outlet too', { _clusterSize: 2, _clusterSources: ['KHOU Houston', 'Reuters (Google News)'] });
ok(selectAlsoMoving([mixed], { storyKey: sk }).length === 1, 'local+core (2 distinct ranks) qualifies');

console.log(`\nALSO-MOVING — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
