// AG2: "Across outlets" selector — one lead per pinned outlet, pinned order, most-recent per source,
// isTop flag, null for a silent/failed outlet.
import { selectAcross, PINNED_OUTLETS, TOP_FEEDS } from '../../src/modules/across-outlets/select.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const iso = h => new Date(Date.now() - h * 3600e3).toISOString();
const a = (source, title, h) => ({ source, title, link: title, pubDate: iso(h) });

const items = [
  a('Fox News', 'Fox older story', 5),
  a('Fox News', 'Fox newest lead', 1),      // newest from Fox → the lead
  a('CNN', 'CNN lead story', 2),
  a('The New York Times', 'NYT lead', 3),
  // Politico has nothing
];
const pinned = ['Fox News', 'CNN', 'The New York Times', 'Politico'];
const rows = selectAcross(items, pinned);

ok(rows.length === 4, 'one row per pinned outlet');
ok(rows[0].outlet === 'Fox News' && rows[1].outlet === 'CNN', 'rows follow pinned order');
ok(rows[0].item && rows[0].item.title === 'Fox newest lead', 'picks the most-recent item per source');
ok(rows[3].item === null, 'a silent outlet yields item:null (neutral "unavailable" row)');
ok(rows[0].isTop === true && rows.find(r=>r.outlet==='The New York Times').isTop === false, 'isTop marks only known top-stories feeds');
ok(TOP_FEEDS.has('Fox News') && !TOP_FEEDS.has('The New York Times'), 'TOP_FEEDS membership');
ok(Array.isArray(PINNED_OUTLETS.general) && PINNED_OUTLETS.general.includes('The Daily Wire'), 'general pins include the alt outlet (chip handled in component)');
ok(selectAcross([], pinned).every(r => r.item === null), 'empty input → all null');

console.log(`\nACROSS-OUTLETS — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
