// S7: rankHomeTop — national (widely-covered) general stories beat niche single-outlet
// trade/sports items, and at most one non-general story is allowed (only if well-covered).
import { rankHomeTop } from './select.js';
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

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
