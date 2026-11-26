// AG4: trending token match — >=2 meaningful shared tokens, stopword/short filtering, fetch via the
// app RSS loader. (The live fetch is NEEDS-DEVICE; the token logic is what gates the chip + boost.)
import { trendTokens, isTrending, fetchTrending, TRENDING_URL } from '../../src/modules/trending/index.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };

const toks = trendTokens(['Permian Basin earthquake', 'Federal Reserve rate decision', 'the a of']);
ok(toks.has('permian') && toks.has('earthquake') && toks.has('federal') && toks.has('reserve'), 'meaningful tokens kept');
ok(!toks.has('the') && !toks.has('a') && !toks.has('of'), 'stopwords/short words dropped');

// >=2 shared tokens → trending
ok(isTrending({ title: 'Permian Basin earthquake rattles West Texas oilfields' }, toks), 'two shared tokens → trending');
// only ONE shared token → not trending
ok(!isTrending({ title: 'Permian output climbs to a record this quarter' }, toks), 'one shared token → not trending');
// no overlap → not trending
ok(!isTrending({ title: 'Local council debates a new park budget tonight' }, toks), 'no overlap → not trending');
// empty token set → never trending
ok(!isTrending({ title: 'Federal Reserve rate decision looms' }, new Set()), 'empty token set → not trending');
ok(!isTrending(null, toks), 'null article → not trending (no throw)');

// fetchTrending uses the app RSS loader (mock) + the Google Trends URL
let askedUrl = '';
const fakeRSS = async (url) => { askedUrl = url; return { items: [{ title: 'Astros trade rumor' }, { title: 'ERCOT grid alert' }] }; };
const terms = await fetchTrending(fakeRSS);
ok(askedUrl === TRENDING_URL, 'fetchTrending hits the Google Trends RSS url via the proxy loader');
ok(terms.length === 2 && terms.includes('ERCOT grid alert'), 'fetchTrending returns the term titles');
// a failing loader is silent
ok((await fetchTrending(async () => { throw new Error('x'); })).length === 0, 'a failed fetch returns [] (fail-soft)');

console.log(`\nTRENDING — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
