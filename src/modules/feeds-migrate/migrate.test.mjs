// AA5.1 unit tests for the one-time Z2 feed reconcile.
import { migrateFeedsZ2 } from './index.js';
import { migrateFeedsAH } from './ah.js';
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

// ── AF1: AE add-only migration ──────────────────────────────────────────────────
import { migrateFeedsAE } from './index.js';
const PRE_BIZ = ['NPR Business','CNBC Business','CNBC Top News','Morning Brew','Oilprice.com',
  'Utility Dive','Data Center Dynamics','Power Magazine','Rigzone','MIT Tech Review','Canary Media',
  'The Guardian Business','CNBC Tech'];
const DEF = {
  general: [{name:'BBC News',url:'b',on:true},
    {name:'CBS News',url:'cbs',on:true,_ae:true},
    {name:'The Daily Wire',url:'dw',on:true,_ae:true,_alt:true}],
  business: [...PRE_BIZ.map(n=>({name:n,url:n,on:true})), {name:'WSJ Business',url:'wsjb',on:true,_ae:true}],
  bloom: [{name:'EIA Today in Energy',url:'eia',on:true,_ae:true,sub:'policy',tier:'verified'}],
};
const savedPreAE = {
  general: [{name:'BBC News',url:'b',on:false}, {name:'My Custom',url:'cust',on:true,custom:true}], // BBC user-disabled
  business: PRE_BIZ.map(n=>({name:n,url:n,on:true})), // pristine
  bloom: [],
};
const r1 = migrateFeedsAE(savedPreAE, DEF);
eq(r1.added, 4, 'AF1: adds the 4 _ae feeds (CBS, Daily Wire, WSJ Business, EIA)');
eq(r1.feeds.general.some(f=>f.name==='CBS News'), true, 'AF1: new CBS News added to general');
eq(r1.feeds.general.find(f=>f.name==='The Daily Wire')._alt, true, 'AF1: _alt flag carried on added feed');
eq(r1.feeds.general.find(f=>f.name==='BBC News').on, false, 'AF1: user-disabled BBC stays disabled');
eq(r1.feeds.general.some(f=>f.name==='My Custom'&&f.custom), true, 'AF1: custom feed untouched');
eq(r1.feeds.business.some(f=>f.name==='WSJ Business'), true, 'AF1: WSJ Business added to business');
eq(r1.feeds.business.some(f=>f.name==='Oilprice.com'), false, 'AF1: dup removed from pristine business');
eq(r1.feeds.business.some(f=>f.name==='MIT Tech Review'), false, 'AF1: MIT Tech Review removed from business');
eq(r1.feeds.business.some(f=>f.name==='NPR Business'), true, 'AF1: non-dup business feed kept');
eq(r1.feeds.bloom.find(f=>f.name==='EIA Today in Energy').sub, 'policy', 'AF1: sub hint carried on added feed');
// re-run → idempotent
const r2 = migrateFeedsAE(r1.feeds, DEF);
eq(r2.added, 0, 'AF1: re-run adds nothing (idempotent)');
eq(JSON.stringify(r2.feeds), JSON.stringify(r1.feeds), 'AF1: re-run leaves feeds unchanged');
// removed-by-user _ae feed is NOT re-added when running once on a config that already dropped it
const droppedCBS = JSON.parse(JSON.stringify(r1.feeds));
droppedCBS.general = droppedCBS.general.filter(f=>f.name!=='CBS News');
eq(migrateFeedsAE(droppedCBS, DEF).feeds.general.some(f=>f.name==='CBS News'), true,
   'AF1: (note) a single run re-adds a dropped _ae feed — the once-per-device guard prevents this in practice');
// edited business → dupes NOT removed
const editedBiz = { business: PRE_BIZ.map((n,i)=>({name:n,url:n,on:i!==0})) }; // user turned one off
eq(migrateFeedsAE(editedBiz, DEF).feeds.business.some(f=>f.name==='Oilprice.com'), true,
   'AF1: edited business list keeps its dups (not pristine)');

// ── AH2: dead-feed fallback patch ────────────────────────────────────────────
const AH_DEF = {
  business: [{ name: 'Axios Markets', url: 'https://api.axios.com/feed/business', fallbackUrl: 'GN-axios' }],
  bloom: [{ name: 'Watcher Guru', url: 'https://news.google.com/rss/search?q=watcherguru', fallbackUrl: 'GN-wg' }],
  tech: [{ name: 'VentureBeat', url: 'https://venturebeat.com/feed/', mergeFallbackUrl: 'GN-vb' }],
};
// saved feeds lack the fallback fields + still have Watcher Guru's old dead URL
const savedAH = {
  business: [{ name: 'Axios Markets', url: 'https://api.axios.com/feed/business', on: true }],
  bloom: [{ name: 'Watcher Guru', url: 'https://watcher.guru/news/feed', on: true }],
  tech: [{ name: 'VentureBeat', url: 'https://venturebeat.com/feed/', on: true }],
};
const ah = migrateFeedsAH(savedAH, AH_DEF);
eq(ah.feeds.business[0].fallbackUrl, 'GN-axios', 'AH2: Axios Markets gets the fallbackUrl');
eq(ah.feeds.tech[0].mergeFallbackUrl, 'GN-vb', 'AH2: VentureBeat gets the mergeFallbackUrl');
eq(ah.feeds.bloom[0].url, 'https://news.google.com/rss/search?q=watcherguru', 'AH2: Watcher Guru adopts the GNews primary (old dead URL)');
eq(ah.feeds.business[0].on, true, 'AH2: the user on/off flag is preserved');
// idempotent: re-run changes nothing
eq(migrateFeedsAH(ah.feeds, AH_DEF).changed, false, 'AH2: re-run is idempotent (no change)');
// a user who kept a custom Watcher Guru URL is left alone
const custom = { bloom: [{ name: 'Watcher Guru', url: 'https://my.custom/rss', on: true }] };
eq(migrateFeedsAH(custom, AH_DEF).feeds.bloom[0].url, 'https://my.custom/rss', 'AH2: a user-edited URL is not overwritten');

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`);
process.exit(fail === 0 ? 0 : 1);
