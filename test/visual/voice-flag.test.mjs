// AG5.3: voice-flag matcher — a confirmed voice's recent post sharing >=3 meaningful tokens with a
// headline flags that story ("Yergin · 2h ↗"). Pure; live posts = NEEDS-DEVICE.
import { voiceFlagFor, shortVoiceName } from '../../src/modules/voice-flag/index.js';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };

ok(shortVoiceName('Daniel Yergin') === 'Yergin', 'shortVoiceName: "Daniel Yergin" → "Yergin"');
ok(shortVoiceName('@DanielYergin') === 'DanielYergin', 'shortVoiceName strips @');

const tiles = [
  { who: 'Daniel Yergin', title: 'Permian pipeline constraints are reshaping crude export flows', age: '2h' },
  { who: 'Doug Sheridan', title: 'ERCOT grid reserves look thin heading into the heat wave', age: '5h' },
];

// >=3 shared meaningful tokens → flagged with the voice's last name + age
const hit = voiceFlagFor({ title: 'Permian pipeline constraints squeeze crude export flows again' }, tiles);
ok(hit && hit.name === 'Yergin' && hit.ago === '2h', 'headline sharing >=3 tokens → { name:"Yergin", ago:"2h" }');

// only 2 shared tokens → no flag
ok(voiceFlagFor({ title: 'Pipeline flows steady this week across the basin' }, tiles) === null, 'two shared tokens → no flag');

// no overlap → null
ok(voiceFlagFor({ title: 'City council approves a new library wing downtown' }, tiles) === null, 'no overlap → null');

// matches the second voice (ERCOT grid reserves heat)
const h2 = voiceFlagFor({ title: 'ERCOT warns grid reserves thin as the heat wave builds' }, tiles);
ok(h2 && h2.name === 'Sheridan', 'second voice matched → "Sheridan"');

// guards
ok(voiceFlagFor({ title: 'Short title' }, tiles) === null, 'headline with <3 meaningful tokens → null');
ok(voiceFlagFor({ title: 'anything here really' }, []) === null, 'no tiles → null');
ok(voiceFlagFor(null, tiles) === null, 'null article → null (no throw)');

console.log(`\nVOICE-FLAG — ${fail} failures, ${pass} passed`);
console.log(fail === 0 ? 'ALL PASS' : 'FAILURES ABOVE');
process.exit(fail ? 1 : 0);
