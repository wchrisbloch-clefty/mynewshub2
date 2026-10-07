# Voices — configuration & cost

Voices flags what followed people/orgs/teams post across X, Instagram, LinkedIn, TikTok,
YouTube and Reddit. Tiles are always labelled **inferred** (social/discussion); velocity
only orders them, it never raises a trust tier. Clicking a tile opens the platform — there
is no in-app reader and no AI summarisation anywhere in this feature.

## Env vars
| Var | Purpose | Notes |
|---|---|---|
| `SEARCH_PROVIDER` | `serper` (default) or `brave` | **Brave is PAID/metered — it has no free tier (metered billing since Feb 2026).** Serper has a one-time free allowance. |
| `SEARCH_API_KEY` | key for the chosen provider | No key → discovery + Lane 1 are OFF (fail-soft); manual handle entry still works. |
| `YOUTUBE_API_KEY` | YouTube Data API tiles + Test | Quota-guarded. |
| `RSSHUB_BASE_URL` | default `https://rsshub.app` | Instagram / TikTok / LinkedIn-company lanes (best-effort, 429-aware). |
| `VOICES_LANE1` | override for the search lane | Defaults **ON** when `SEARCH_API_KEY` exists, **OFF** without it. `0` forces off, `1` forces on. |

## Lanes
- **Lane 1 (search snippets):** top **3 voices per category** (user's order), one search per
  voice. Gated by `VOICES_LANE1`.
- **Lane 2 (free/best-effort):** YouTube Data API; RSSHub for Instagram/TikTok/LinkedIn-company.
- **Reddit:** the existing `/api/signals?kind=discussions` lane (auto).
- **X:** the existing x-pulse lane — **click-to-load only** (it costs money); never auto-fetched.

## Caching (no new infrastructure)
- `/api/voices-resolve` (GET) and `/api/voices-signals` set `s-maxage=86400,
  stale-while-revalidate=86400` — 24h CDN cache, no KV. `voices-resolve` is a GET keyed by
  name/type so repeat discovery is free; `voices-signals` is POST (CDNs generally don't cache
  POST), so its repeat cost is bounded by the client's load-once-per-category behaviour.

## Cost projection (Serper, current free allowance)
See the PR report for the live number and the Serper pricing source link.
