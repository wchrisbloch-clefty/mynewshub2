// ─── URL ROUTING ──────────────────────────────────────────────────────────────
// Pure, framework-free path <-> route primitives. The URL is the single source of
// truth: /:category/:subcategory?/:tertiary?. No app state, no history side effects
// here — the host app owns pushState/popstate orchestration and just uses these
// helpers to read and build paths.
//
// Public interface:
//   ROUTE_CATS                       -> string[] of valid top-level categories
//   parseRoute(pathname?)            -> { category, subcategory, tertiary }
//   buildPath(category, sub?, tert?) -> string  (a leading-slash URL path)

export const ROUTE_CATS = ['general','business','finance','bloom','tech','sports','popculture','comedy','briefing','podcasts','sources','saved'];

export function parseRoute(pathname) {
  const path = pathname != null ? pathname
    : (typeof window === 'undefined' ? '/' : window.location.pathname);
  const parts = path.split('/').filter(Boolean);
  let category = (parts[0] || 'general').toLowerCase();
  if (!ROUTE_CATS.includes(category)) category = 'general';
  const subcategory = parts[1] ? decodeURIComponent(parts[1]).toLowerCase() : null;
  const tertiary = parts[2] ? decodeURIComponent(parts[2]).toLowerCase() : null;
  return { category, subcategory, tertiary };
}

export function buildPath(category, subcategory = null, tertiary = null) {
  let path = `/${category}`;
  if (subcategory) path += `/${encodeURIComponent(subcategory)}`;
  if (subcategory && tertiary) path += `/${encodeURIComponent(tertiary)}`;
  return path;
}
