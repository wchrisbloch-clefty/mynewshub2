# Routing

Pure path ⇄ route primitives for a URL-as-source-of-truth SPA. No app state, no history side effects.

**What it does:** parses a pathname into `{ category, subcategory, tertiary }` (validating the category against a known list) and builds a URL path back from those parts.

**What it needs:** nothing app-specific. `parseRoute(pathname?)` reads `window.location.pathname` by default (pass a string to parse anything). `buildPath(category, sub?, tert?)` returns a leading-slash path. `ROUTE_CATS` is the valid category list.

**What it returns:** `parseRoute` → `{ category, subcategory, tertiary }`; `buildPath` → a string. The host app owns `history.pushState`/`popstate` and feed orchestration; it uses these helpers to read/write the path. (That stateful `navigate`/`applyRoute` glue is intentionally *not* here — see the PR's coupling notes.)
