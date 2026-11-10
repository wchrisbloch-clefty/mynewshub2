#!/usr/bin/env node
// AB1: content-hash the self-hosted font files so they can be served immutable + cached for a year.
// public/ files are copied verbatim by Vite (never hashed), so we hash them ourselves: rename each
// woff2 to <base>.<8-hex>.woff2 and rewrite the @font-face urls (src/styles/fonts.css) and the two
// <link rel="preload"> hrefs (index.html) to match. Re-runnable: it strips any existing hash first,
// so after a font file changes (e.g. the AB2 opsz build) just run `npm run hash:fonts` again.
import { readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FONT_DIR = join(ROOT, 'public', 'fonts');
const FONTS_CSS = join(ROOT, 'src', 'styles', 'fonts.css');
const INDEX_HTML = join(ROOT, 'index.html');

// base name (no hash, no ext) -> current filename on disk
const HASH_RE = /\.[0-9a-f]{8}\.woff2$/;
const baseOf = f => f.replace(/\.woff2$/, '').replace(/\.[0-9a-f]{8}$/, '');

const files = readdirSync(FONT_DIR).filter(f => f.endsWith('.woff2'));
let css = readFileSync(FONTS_CSS, 'utf8');
let html = readFileSync(INDEX_HTML, 'utf8');
const renames = [];

for (const f of files) {
  const base = baseOf(f);
  const hash = createHash('sha256').update(readFileSync(join(FONT_DIR, f))).digest('hex').slice(0, 8);
  const next = `${base}.${hash}.woff2`;
  if (f !== next) { renameSync(join(FONT_DIR, f), join(FONT_DIR, next)); }
  // rewrite any reference to this base (hashed or not) -> the new hashed name, in both files
  const refRe = new RegExp(`/fonts/${base.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:\\.[0-9a-f]{8})?\\.woff2`, 'g');
  css = css.replace(refRe, `/fonts/${next}`);
  html = html.replace(refRe, `/fonts/${next}`);
  renames.push(`${f} -> ${next}`);
}

writeFileSync(FONTS_CSS, css);
writeFileSync(INDEX_HTML, html);
console.log('hashed fonts:\n  ' + renames.join('\n  '));
