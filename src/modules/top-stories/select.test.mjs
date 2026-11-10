// S7: rankHomeTop — national (widely-covered) general stories beat niche single-outlet
// trade/sports items, and at most one non-general story is allowed (only if well-covered).
import { rankHomeTop, selectTopStories } from './select.js';
let fail = 0;
const eq = (got, want, msg) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`); };

const now = Date.now();
const iso = m => new Date(now + m * 60000).toISOString();
// Modeled on CB's News page: two national general clusters, plus niche single-outlet items.
const pool = [
  { key: 'gop',      cat: 'general',    clusterSize: 5, pubDate: iso(-30) }, // GOP ousted — national
  { key: 'treasury', cat: 'business',   clusterSize: 4, pubDate: iso(-20) }, // 10yr yield — widely covered biz
  { key: 'dcd',      cat: 'business',   clusterSize: 1, pubDate: iso(-5) },  // DCD Studio interview — niche trade
  { key: 'anzalone', cat: 'sports',     clusterSize: 1, pubDate: iso(-2) },  // weekly-award blurb — niche
  { key: 'gospel',   cat: 'popculture', clusterSize: 1, pubDate: iso(-1) },  // Billboard gospel airplay — niche
  { key: 'flood',    cat: 'general',    clusterSize: 3, pubDate: iso(-40) }, // flood bond — national
  { key: 'teacher',  cat: 'general',    clusterSize: 2, pubDate: iso(-50) }, // teacher shortage — national
  { key: 'court',    cat: 'general',    clusterSize: 3, pubDate: iso(-60) }, // courthouse — national
  { key: 'transit',  cat: 'general',    clusterSize: 2, pubDate: iso(-70) }, // light rail — national
];

// With the lead already a general story (nonGeneralUsed 0), 5 slots and enough general supply:
const picked = rankHomeTop(pool, { max: 5, nonGeneralUsed: 0 });
// Expect: the widely-covered general + the ONE allowed non-general (treasury, 4 outlets), filled
// with remaining general; the single-outlet niche items (dcd/anzalone/gospel) never take a slot.
eq(picked.slice(0, 2), ['gop', 'treasury'], 'widest general + the ONE well-covered non-general lead');
const nonGeneralCount = picked.filter(k => ['treasury', 'dcd', 'anzalone', 'gospel'].includes(k)).length;
eq(nonGeneralCount <= 1, true, 'at most ONE non-general story in the top 5');
eq(['dcd', 'anzalone', 'gospel'].some(k => picked.includes(k)), false, 'niche single-outlet items never take a prime slot when national supply exists');

// A niche non-general item is NOT admitted when it is single-outlet and not breaking:
const onlyNiche = rankHomeTop([
  { key: 'g1', cat: 'general', clusterSize: 2, pubDate: iso(-10) },
  { key: 'niche', cat: 'sports', clusterSize: 1, pubDate: iso(0) },
], { max: 2, nonGeneralUsed: 0 });
eq(onlyNiche[0], 'g1', 'general beats a fresher single-outlet niche item');

// Breaking non-general IS allowed even at 1 outlet:
const brk = rankHomeTop([
  { key: 'g', cat: 'general', clusterSize: 2, pubDate: iso(-10) },
  { key: 'brk', cat: 'sports', clusterSize: 1, pubDate: iso(0), breaking: true },
], { max: 2, nonGeneralUsed: 0 });
eq(brk.includes('brk'), true, 'breaking non-general is admitted even at one outlet');

// ─── Z1: selectTopStories — the ONE merged list ────────────────────────────────────────────────
const art = (title, cat, source, cs, min, extra = {}) => ({ title, cat, source, link: `l/${title.replace(/\s/g, '')}/${source}`, _clusterSize: cs, pubDate: iso(-min), ...extra });
// A realistic cross-category pool: several general headlines from different publishers, a couple of
// well-covered non-general stories, a niche single-outlet non-general, a promo, a satire item, and a
// multi-outlet variant set (same title, different publishers).
const general = [
  art('National Election Upset Rattles the Capital', 'general', 'BBC News', 4, 30),
  art('City Approves Flood-Control Bond After Testimony', 'general', 'NPR News', 3, 25),
  art('Court Blocks New Rule in a Divided Ruling', 'general', 'The Hill', 2, 20),
  art('Transit Agency Unveils Light-Rail Extension', 'general', 'Axios', 1, 15),
  art('Teacher Shortage Deepens Across the State', 'general', 'The Guardian US', 1, 12),
  art('Historic Courthouse Reopens After Restoration', 'general', 'Fox News', 1, 10),
];
const nonGeneral = [
  art('Big Regional Bank Merger Clears Final Hurdle', 'business', 'Reuters', 5, 18),  // well-covered
  art('DCD Studio Interview on a New Release', 'business', 'TradeMag', 1, 5),          // niche single-outlet
  art('Weekly Award Blurb for a Role Player', 'sports', 'LocalSports', 1, 2),          // niche single-outlet
];
const promo = art('Promo Code: Bet $20, Get $350 in Bonus Bets', 'general', 'DraftKings', 1, 1);
const satire = art('Area Man Heroically Saves Nation From Boredom', 'general', 'The Onion', 1, 1);
const breaking = [art('Major Explosion Reported Near the Ship Channel', 'general', 'BBC News', 3, 6)];
const allCats = [...general, ...nonGeneral, promo, satire, ...breaking];
const res = selectTopStories({ general, allCats, breaking, max: 6, minOutlets: 3 });
const titles = res.map(r => r.title);
eq(res.length >= 5, true, 'Z1: the merged list fills (>=5 of 6)');
eq(titles.length === new Set(titles).size, true, 'Z1: no story appears twice in the list');
eq(res.some(r => /Explosion/.test(r.title)), false, 'Z1: a breaking story never repeats in the list');
eq(res.some(r => /Promo Code/.test(r.title)), false, 'Z1: promo is filtered out');
eq(res.some(r => /Area Man/.test(r.title)), false, 'Z1: satire is filtered out');
eq(res.filter(r => (r.cat || 'general') !== 'general').length <= 1, true, 'Z1: at most ONE non-general row');
eq(res.some(r => /DCD Studio|Weekly Award/.test(r.title)), false, 'Z1: a niche single-outlet non-general never takes a slot');
eq(res.filter(r => (r.cat || 'general') === 'general').length >= 4, true, 'Z1: the list is general-dominated (>=4 general)');
// <=2 per publisher: build a pool with 4 BBC general stories
const bbcPool = Array.from({ length: 4 }, (_, i) => art(`BBC Story Number ${i}`, 'general', 'BBC News', 1, i));
const capped = selectTopStories({ general: bbcPool, allCats: bbcPool, breaking: [], max: 6 });
eq(capped.filter(r => r.source === 'BBC News').length <= 2, true, 'Z1: at most TWO rows per publisher');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
