// S3: cleanSourceName — raw hostnames become readable names; brand names pass through.
import { cleanSourceName } from './index.js';
let fail = 0;
const eq = (got, want, msg) => { const ok = got === want; if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}: "${got}"${ok ? '' : ` (want "${want}")`}`); };

eq(cleanSourceName('www.chemengonline.com'), 'ChemEngOnline', 'www host → brand');
eq(cleanSourceName('WWW.CHEMENGONLINE.COM'), 'ChemEngOnline', 'ALL-CAPS host → brand (never raw caps)');
eq(cleanSourceName('foxnews.com'), 'Fox News', 'known host → mapped name');
eq(cleanSourceName('bbc.co.uk'), 'BBC', 'co.uk host → brand');
eq(cleanSourceName('somelocalpaper.com'), 'Somelocalpaper', 'unknown host → Title-Case (not raw)');
eq(cleanSourceName('Reuters'), 'Reuters', 'clean name passes through');
eq(cleanSourceName('Houston Chronicle'), 'Houston Chronicle', 'name with space passes through');
eq(cleanSourceName('CNBC'), 'CNBC', 'acronym passes through');
eq(cleanSourceName(''), '', 'empty stays empty');
// never emits a bare TLD or a leading www.
const probe = ['www.example.com', 'EXAMPLE.ORG', 'news.example.io'].map(cleanSourceName);
eq(probe.some(s => /^www\.|\.(com|org|io)$/i.test(s)), false, 'no output is a raw host (no www./TLD)');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
