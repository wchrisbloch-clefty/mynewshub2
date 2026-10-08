// F8 unit test for the rules-only Opinion/Analysis label. No test runner required:
//   node src/modules/opinion/opinion.test.mjs
// Exits non-zero on any failure. 12 URLs — 6 that must be labelled, 6 that must not.
import { opinionLabel } from './index.js';

const cases = [
  // ----- 6 that SHOULD be labelled -----
  { a: { link: 'https://nytimes.com/2026/01/02/opinion/the-economy.html', source: 'NYT' }, expect: 'Opinion' },
  { a: { link: 'https://wsj.com/articles/commentary/markets-today', source: 'WSJ' }, expect: 'Opinion' },
  { a: { link: 'https://bbc.com/news/analysis/uk-politics-123', source: 'BBC' }, expect: 'Analysis' },
  { a: { link: 'https://guardian.com/world/column/the-week', source: 'Guardian' }, expect: 'Opinion' },
  { a: { link: 'https://example.com/story/123', source: 'The Atlantic' }, expect: 'Opinion' },        // OPINION_SOURCES
  { a: { link: 'https://news.site/world/123', source: 'Local', section: 'Editorial' }, expect: 'Opinion' }, // section

  // ----- 6 that should NOT be labelled (null) -----
  { a: { link: 'https://nytimes.com/2026/01/02/business/the-economy.html', source: 'NYT' }, expect: null },
  { a: { link: 'https://reuters.com/markets/us/stocks-rise', source: 'Reuters' }, expect: null },
  { a: { link: 'https://bbc.com/news/world-us-canada-999', source: 'BBC' }, expect: null },
  { a: { link: 'https://example.com/opinionated-take/123', source: 'X' }, expect: null }, // "opinionated" != /opinion/
  { a: { link: 'https://site.com/analysis-paralysis/1', source: 'Y' }, expect: null },    // "analysis-paralysis" != /analysis/
  { a: { link: 'https://npr.org/2026/01/02/health/vaccine', source: 'NPR', section: 'news' }, expect: null },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const got = opinionLabel(c.a);
  const ok = got === c.expect;
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  expect=${String(c.expect).padEnd(8)} got=${String(got).padEnd(8)}  ${c.a.link}`);
}
console.log(`\n${pass}/${cases.length} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
