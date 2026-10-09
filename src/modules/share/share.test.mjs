// G2 unit tests. Run: node src/modules/share/share.test.mjs  (exits non-zero on failure)
import { buildShareStrings, buildBriefingExcerpt } from './share-utils.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('FAIL', name); } };

// ── Encoding: 6 nasty titles → mailto/sms strings parse back to the original. ──
const nasty = [
  'Fed & Markets: "rate cut" soon?',
  'C#, F# and the #1 language',
  'Emoji test 🚀📈 and em—dash',
  "O'Brien said 100% — really?",
  'Tabs\tand\nnewlines in title',
  'A'.repeat(300), // 300-char title
];
console.log('── encoding ──');
for (const title of nasty) {
  const url = 'https://mynewshub2.vercel.app/article?id=1&x=2#top';
  const source = 'Reuters & Co';
  const { mailto, sms } = buildShareStrings({ title, url, source });
  // mailto: decode subject + body
  const sub = decodeURIComponent(mailto.match(/subject=([^&]*)/)[1]);
  const body = decodeURIComponent(mailto.match(/body=(.*)$/)[1]);
  const smsBody = decodeURIComponent(sms.match(/body=(.*)$/)[1]);
  const okSub = sub === title;
  const okBody = body === `${title} — ${source}\n${url}` && body.includes(url);
  const okSms = smsBody === `${title} ${url}`;
  // the raw strings must be safe (no stray & that would split params inside encoded parts)
  const okSafe = mailto.startsWith('mailto:?subject=') && sms.startsWith('sms:?&body=');
  ok('mailto subject roundtrip: ' + title.slice(0, 24), okSub);
  ok('mailto body roundtrip:    ' + title.slice(0, 24), okBody);
  ok('sms body roundtrip:       ' + title.slice(0, 24), okSms);
  ok('scheme safe:              ' + title.slice(0, 24), okSafe);
  console.log(`  "${title.slice(0, 30)}${title.length > 30 ? '…' : ''}" -> subject/body/sms all roundtrip ${okSub && okBody && okSms ? '✓' : '✗'}`);
}

// ── Briefing excerpt: 7-item fixture → <= 1200 chars, exactly 5 numbered items. ──
console.log('── briefing excerpt ──');
const seven = Array.from({ length: 7 }, (_, i) => ({
  title: `Headline number ${i} about the economy, elections, markets and the day ahead`,
  desc: 'A reasonably long one-line summary of the story that could blow the SMS budget if we were not careful about capping it sensibly here.',
  source: 'Reuters',
}));
const ex = buildBriefingExcerpt(seven, { date: 'Thursday, October 9', site: 'https://mynewshub2.vercel.app' });
const numbered = (ex.match(/^\d+\. /gm) || []).length;
ok('excerpt <= 1200 chars', ex.length <= 1200);
ok('excerpt has exactly 5 items', numbered === 5);
ok('excerpt has date header', ex.startsWith('MyNewsHub — Thursday, October 9'));
ok('excerpt ends with site link', ex.trim().endsWith('https://mynewshub2.vercel.app'));
console.log(`  length=${ex.length}, items=${numbered}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
