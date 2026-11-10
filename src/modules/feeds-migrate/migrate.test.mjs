// AA5.1 unit tests for the one-time Z2 feed reconcile.
import { migrateFeedsZ2 } from './index.js';
let fail = 0;
const eq = (got, want, msg) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`); };

// 1) Old saved config (the four feeds still in general) → migrated to their category, flags preserved.
const oldCfg = {
  general: [
    { name: 'BBC News', url: 'b', on: true },
    { name: 'TechCrunch', url: 't', on: false },        // user had DISABLED it
    { name: 'CNBC Top News', url: 'c', on: true },
    { name: 'Morning Brew', url: 'm', on: true },
    { name: 'Bloomberg', url: 'bl', on: true },
    { name: 'My Custom Feed', url: 'x', on: true, custom: true },
  ],
  tech: [{ name: 'Ars Technica', url: 'a', on: true }],
  business: [{ name: 'WSJ', url: 'w', on: true }],
  finance: [{ name: 'FT', url: 'f', on: true }],
};
const { feeds: m, changed } = migrateFeedsZ2(oldCfg);
eq(changed, true, 'AA5.1: a stale config reports changed=true');
eq(m.general.map(f => f.name), ['BBC News', 'My Custom Feed'], 'AA5.1: the four move out of general; BBC + custom stay');
eq(m.tech.some(f => f.name === 'TechCrunch'), true, 'AA5.1: TechCrunch → tech');
eq(m.tech.find(f => f.name === 'TechCrunch').on, false, 'AA5.1: user-disabled TechCrunch stays disabled');
eq(m.business.map(f => f.name).sort(), ['CNBC Top News', 'Morning Brew', 'WSJ'], 'AA5.1: CNBC + Morning Brew → business (WSJ kept)');
eq(m.finance.map(f => f.name).sort(), ['Bloomberg', 'FT'], 'AA5.1: Bloomberg → finance (FT kept)');
eq(m.general.find(f => f.name === 'My Custom Feed').custom, true, 'AA5.1: a custom feed is untouched');

// 2) Idempotent — running it on the already-migrated config changes nothing.
const { changed: changed2 } = migrateFeedsZ2(m);
eq(changed2, false, 'AA5.1: already-migrated → changed=false (idempotent)');

// 3) A user who moved Bloomberg back to general is respected on a SECOND migration pass (no re-move
//    is the host-level FEEDS_MIG_V guard; the function itself would move it, which is why the host
//    gates on the version). Here we assert the function only touches feeds in their `from` bucket:
const partial = { general: [{ name: 'BBC News', on: true }], tech: [{ name: 'TechCrunch', on: true }] };
const { changed: changed3 } = migrateFeedsZ2(partial);
eq(changed3, false, 'AA5.1: nothing in `from` to move → changed=false (TechCrunch already in tech)');

// 4) Dedupe — if the target already has the feed, it is not duplicated.
const dup = { general: [{ name: 'Bloomberg', on: true }], finance: [{ name: 'Bloomberg', on: false }] };
const { feeds: md } = migrateFeedsZ2(dup);
eq(md.finance.filter(f => f.name === 'Bloomberg').length, 1, 'AA5.1: target dedupes by name (no duplicate Bloomberg)');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
