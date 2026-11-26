// AH2: patch the fallback fields (and Watcher Guru's dead primary URL) onto SAVED feeds — the AG1
// fallback never fired for these because they carried no fallbackUrl, or the derived GNews domain was
// wrong. Lives in its own lazy chunk (applied in an effect after first paint, not in the sync feed
// initializer), so it stays out of the initial bundle. Add-only + idempotent: copies each field from
// DEFAULT_FEEDS by feed name; Watcher Guru's URL is adopted only if the user still has the dead feed
// URL (a user edit is left alone).
const AH_PATCH = {
  'Axios Markets': ['fallbackUrl'], 'Horse Race Nation': ['fallbackUrl'],
  'Data Center Frontier': ['mergeFallbackUrl'], 'VentureBeat': ['mergeFallbackUrl'],
  'Watcher Guru': ['url', 'fallbackUrl'],
};

export function migrateFeedsAH(saved, defaults) {
  if (!saved || typeof saved !== 'object' || !defaults || typeof defaults !== 'object') return { feeds: saved, changed: false };
  const defByName = {};
  for (const cat of Object.keys(defaults)) for (const f of defaults[cat] || []) if (f && f.name) defByName[f.name] = f;
  const next = JSON.parse(JSON.stringify(saved));
  let changed = false;
  for (const cat of Object.keys(next)) {
    for (const f of next[cat] || []) {
      const fields = f && AH_PATCH[f.name]; const d = f && defByName[f.name];
      if (!fields || !d) continue;
      for (const key of fields) {
        if (key === 'url') { if (f.url !== d.url && /watcher\.guru\/news\/feed/.test(f.url || '')) { f.url = d.url; changed = true; } }
        else if (d[key] && f[key] !== d[key]) { f[key] = d[key]; changed = true; }
      }
    }
  }
  return { feeds: next, changed };
}
