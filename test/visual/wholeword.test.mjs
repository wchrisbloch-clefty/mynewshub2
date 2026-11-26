// AE6.1: whole-word sub-category matching. The old substring filter lit up short keys INSIDE
// other words; these lock in that it no longer does.
import { wholeWordMatch, anyWholeWord } from '../../src/modules/text-match.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };

// ── the required false hits must NOT match ──────────────────────────────────────
ok(!wholeWordMatch('every day the market moves', 'ev'), "'ev' does not match 'every'");
ok(!wholeWordMatch('a big event downtown', 'ev'), "'ev' does not match 'event'");
ok(!wholeWordMatch('turn right at the light', 'rig'), "'rig' does not match 'right'");
ok(!wholeWordMatch('boil the water first', 'oil'), "'oil' does not match 'boil'");
ok(!wholeWordMatch('wrap it in foil', 'oil'), "'oil' does not match 'foil'");
ok(!wholeWordMatch('the gasket failed', 'gas'), "'gas' does not match 'gasket'");
ok(!wholeWordMatch('subtv guidelines', 'tv'), "'tv' does not match 'subtv'");

// ── real whole-word / phrase hits MUST match ────────────────────────────────────
ok(wholeWordMatch('new EV charger installed', 'ev'), "'ev' matches 'EV' (case-insensitive, whole word)");
ok(wholeWordMatch('oil prices climb', 'oil'), "'oil' matches 'oil'");
ok(wholeWordMatch('offshore drilling rig moved', 'rig'), "'rig' matches 'rig'");
ok(wholeWordMatch('a clean energy push', 'clean energy'), "phrase 'clean energy' matches");
ok(!wholeWordMatch('cleanenergyllc press release', 'clean energy'), "phrase does not match when fused");
ok(wholeWordMatch('new gas pipeline approved', 'gas'), "'gas' matches 'gas' (whole word)");

// ── anyWholeWord over a keyword list ────────────────────────────────────────────
ok(anyWholeWord('Netflix renews the hit series', ['movie', 'tv', 'series']), "anyWholeWord hits 'series'");
ok(!anyWholeWord('every meeting ran long', ['ev', 'tv']), "anyWholeWord no false hit on 'ev'/'tv'");
ok(!anyWholeWord('', ['oil']), 'empty text no match');
ok(!anyWholeWord('text', []), 'empty keyword list no match');

// ── AF4.1: Houston major-event gate (same whole-word helper over the CB-editable term list) ──────
const MAJOR = ['hurricane','tropical storm','flood','flooding','tornado','explosion','refinery fire',
  'evacuation','state of emergency','mass shooting','power outage','grid emergency'];
ok(anyWholeWord('Hurricane barrels toward the Texas coast', MAJOR), 'hurricane opens the Houston gate');
ok(anyWholeWord('Refinery fire forces evacuation in Pasadena', MAJOR), 'refinery fire + evacuation open the gate');
ok(anyWholeWord('Grid emergency declared as demand spikes', MAJOR), 'grid emergency opens the gate');
ok(!anyWholeWord('Houston Auto Show opens at NRG Center this weekend', MAJOR), 'auto show stays local-only (gate shut)');
ok(!anyWholeWord('City approves new floodlight budget', MAJOR), "'floodlight' does not fire 'flood'");

console.log(`\nWHOLEWORD — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
