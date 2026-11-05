// U1: the Batch U ratchet. Compares the live token-bypass counts (scripts/token-audit.mjs) to the
// committed baseline (scripts/token-baseline.json) and FAILS the build if any guarded number
// INCREASES — so the design-system debt can only shrink. The baseline is lowered only by a
// deliberate edit in the same commit that lowers a real number. Pure Node, no deps, < 2s.
//
// Guarded (must-not-increase): hex literals outside tokens.css, inline style={{ count, distinct
// font-size px literals, font-size literals < 11px, border-radius literals outside {0,4,8,12,pill},
// and !important occurrences.
import { readFileSync } from 'node:fs';
import { audit } from './token-audit.mjs';

const baseline = JSON.parse(readFileSync(new URL('./token-baseline.json', import.meta.url), 'utf8'));
const now = audit();

const GUARDS = [
  ['hexLiteralsOutsideTokens', 'distinct hex literals outside tokens.css'],
  ['inlineStyleCount', 'inline style={{ occurrences'],
  ['fontSizeDistinct', 'distinct font-size px literals'],
  ['fontSizeUnder11Distinct', 'font-size px literals < 11px'],
  ['borderRadiusNonStandard', 'border-radius px literals outside {0,4,8,12,pill}'],
  ['importantCount', '!important occurrences'],
];

let failed = false;
const lines = [];
for (const [key, label] of GUARDS) {
  const base = baseline[key] ?? 0;
  const cur = now[key] ?? 0;
  if (cur > base) {
    failed = true;
    lines.push(`  ✗ ${label}: ${cur} (baseline ${base}, +${cur - base})`);
  } else {
    lines.push(`  ✓ ${label}: ${cur} (baseline ${base}${cur < base ? `, −${base - cur}` : ''})`);
  }
}

console.log('check:tokens — design-system ratchet');
console.log(lines.join('\n'));

if (failed) {
  console.error('\ncheck:tokens FAILED — a guarded count increased. Use a token (see tokens.css),\n' +
    'or, if you deliberately lowered a number, run `node scripts/token-audit.mjs --json > scripts/token-baseline.json`\n' +
    'in the SAME commit to ratchet the baseline down.');
  process.exit(1);
}
// A lowered number should be ratcheted: warn (do not fail) when the live count is below baseline.
const lowered = GUARDS.filter(([k]) => (now[k] ?? 0) < (baseline[k] ?? 0));
if (lowered.length) console.log(`\nNote: ${lowered.length} metric(s) are below baseline — ratchet the baseline in this commit to lock the win.`);
console.log('\ncheck:tokens PASSED.');
