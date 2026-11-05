// U0: design-token audit. Scans src/ and reports the counts the Batch U ratchet (U1) guards:
// distinct hex literals outside tokens.css, inline style={{ } count, distinct font-size px literals
// (with usage + any < 11px), distinct border-radius px literals, distinct font-weight values, and
// any `!important`. Pure Node, no deps. `--json` prints machine-readable counts for the baseline.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const TOKENS = join(SRC, 'styles', 'tokens.css');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(jsx?|css)$/.test(name) && !/\.test\.mjs$/.test(name)) out.push(p);
  }
  return out;
}

export function audit() {
  const files = walk(SRC);
  const hexOutsideTokens = new Map();   // hex -> count
  let inlineStyleCount = 0;
  const fontSizePx = new Map();         // "NNpx" -> count
  const borderRadiusPx = new Map();     // "NNpx" -> count  (px only; 50%/9999 noted separately)
  const fontWeights = new Map();        // value -> count
  let importantCount = 0;
  const fontSizeUnder11 = new Map();

  for (const file of files) {
    const txt = readFileSync(file, 'utf8');
    const isTokens = file === TOKENS;
    // hex literals (#rgb excluded — only 6/8-digit), outside tokens.css
    if (!isTokens) {
      for (const m of txt.matchAll(/#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g)) {
        const h = m[0].toLowerCase();
        hexOutsideTokens.set(h, (hexOutsideTokens.get(h) || 0) + 1);
      }
    }
    // inline style={{  (JSX)
    for (const _ of txt.matchAll(/style=\{\{/g)) inlineStyleCount++;
    // font-size px literals: CSS `font-size:NNpx` and JSX `fontSize:'NNpx'` / fontSize: "NNpx"
    for (const m of txt.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)) rec(fontSizePx, m[1]);
    for (const m of txt.matchAll(/fontSize\s*:\s*['"]?(\d+(?:\.\d+)?)px/gi)) rec(fontSizePx, m[1]);
    // border-radius px literals
    for (const m of txt.matchAll(/border-radius\s*:\s*([^;}\n]+)/gi)) {
      for (const n of m[1].matchAll(/(\d+(?:\.\d+)?)px/g)) rec(borderRadiusPx, n[1]);
    }
    for (const m of txt.matchAll(/borderRadius\s*:\s*['"]?(\d+(?:\.\d+)?)px/gi)) rec(borderRadiusPx, m[1]);
    // font-weight values (css + jsx) — stored raw (no px suffix)
    for (const m of txt.matchAll(/font-weight\s*:\s*(\d{3}|bold|normal)/gi)) fontWeights.set(m[1], (fontWeights.get(m[1]) || 0) + 1);
    for (const m of txt.matchAll(/fontWeight\s*:\s*['"]?(\d{3}|bold|normal)/gi)) fontWeights.set(m[1], (fontWeights.get(m[1]) || 0) + 1);
    // !important
    for (const _ of txt.matchAll(/!important/g)) importantCount++;
  }
  for (const [k, v] of fontSizePx) { if (parseFloat(k) < 11) fontSizeUnder11.set(k, v); }

  function rec(map, k) { const key = k + 'px'; map.set(key, (map.get(key) || 0) + 1); }

  return {
    hexLiteralsOutsideTokens: hexOutsideTokens.size,
    hexList: [...hexOutsideTokens.entries()].sort((a, b) => b[1] - a[1]),
    inlineStyleCount,
    fontSizeDistinct: fontSizePx.size,
    fontSizeList: [...fontSizePx.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
    fontSizeUnder11Distinct: fontSizeUnder11.size,
    fontSizeUnder11List: [...fontSizeUnder11.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
    borderRadiusDistinct: borderRadiusPx.size,
    borderRadiusList: [...borderRadiusPx.keys()].sort((a, b) => parseFloat(a) - parseFloat(b)),
    fontWeightDistinct: fontWeights.size,
    fontWeightList: [...fontWeights.entries()].sort(),
    importantCount,
    files: files.length,
  };
}

if (process.argv.includes('--json')) {
  const a = audit();
  // the baseline stores only the guarded scalar counts (the ratchet compares these).
  console.log(JSON.stringify({
    hexLiteralsOutsideTokens: a.hexLiteralsOutsideTokens,
    inlineStyleCount: a.inlineStyleCount,
    fontSizeDistinct: a.fontSizeDistinct,
    fontSizeUnder11Distinct: a.fontSizeUnder11Distinct,
    borderRadiusDistinct: a.borderRadiusDistinct,
    importantCount: a.importantCount,
  }, null, 2));
} else if (process.argv.includes('--summary')) {
  const a = audit();
  console.log(`files scanned: ${a.files}`);
  console.log(`hex literals outside tokens.css (distinct): ${a.hexLiteralsOutsideTokens}`);
  console.log(`inline style={{ count: ${a.inlineStyleCount}`);
  console.log(`font-size px literals (distinct): ${a.fontSizeDistinct}  [${a.fontSizeList.map(e => e[0]).join(', ')}]`);
  console.log(`  of which < 11px (distinct): ${a.fontSizeUnder11Distinct}  [${a.fontSizeUnder11List.map(e => `${e[0]}×${e[1]}`).join(', ')}]`);
  console.log(`border-radius px literals (distinct): ${a.borderRadiusDistinct}  [${a.borderRadiusList.join(', ')}]`);
  console.log(`font-weight values (distinct): ${a.fontWeightDistinct}  [${a.fontWeightList.map(e => `${e[0]}×${e[1]}`).join(', ')}]`);
  console.log(`!important count: ${a.importantCount}`);
}
