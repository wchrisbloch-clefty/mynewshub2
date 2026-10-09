// ─── OPINION / ANALYSIS LABEL (F8) ────────────────────────────────────────────
// RULES ONLY — never AI, and the label is NEVER read by tiering or ranking
// (grep-verifiable: nothing in provenance/clustering reads `opinionLabel` or
// `_opinion`). A story is labelled from, in order:
//   1) its URL path segment (/opinion/ /opinions/ /commentary/ /editorial/ /column/
//      /op-ed/ → "Opinion"; /analysis/ → "Analysis"),
//   2) a configured opinion `section` on the item (opinion/commentary/editorial →
//      "Opinion"; analysis → "Analysis"),
//   3) the editable OPINION_SOURCES list below (always-opinion outlets → "Opinion").
// Edit THIS ONE constant to add/remove always-opinion sources.

export const OPINION_SOURCES = new Set([
  'The Atlantic', 'Vox', 'Slate', 'National Review', 'The Nation', 'Jacobin',
  'Project Syndicate', 'The American Conservative', 'The Bulwark',
]);

const OPINION_PATH_RE  = /\/(opinion|opinions|commentary|editorial|editorials|column|columns|op-ed|oped)(\/|$)/i;
const ANALYSIS_PATH_RE = /\/(analysis)(\/|$)/i;

export function opinionLabel(a) {
  if (!a) return null;
  const url = a.link || a.url || '';
  let path = '';
  try { path = new URL(url, 'https://x.invalid').pathname; } catch { path = String(url); }
  if (ANALYSIS_PATH_RE.test(path)) return 'Analysis';
  if (OPINION_PATH_RE.test(path)) return 'Opinion';
  const section = String(a.section || '').toLowerCase();
  if (section === 'opinion' || section === 'commentary' || section === 'editorial') return 'Opinion';
  if (section === 'analysis') return 'Analysis';
  if (a.source && OPINION_SOURCES.has(a.source)) return 'Opinion';
  return null;
}
