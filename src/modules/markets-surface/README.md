# Markets Surface

A drop-in markets view: a sticky, horizontally-scrollable index ticker rail plus a gainers / losers / most-active movers block (tabs on mobile, three side-by-side columns at ≥1024px).

**What it does:** `useMarkets()` owns a single request to a consolidated markets endpoint (default `/api/markets`) with a 60s auto-refresh that only fires while the tab is visible. `<MarketsSurface>` renders the rail + movers from that payload.

**What it needs:** `const { data, loading, error, refresh } = useMarkets({ endpoint? })`, then `<MarketsSurface mkt={data} loading={loading} error={error} />`. The payload shape is `{ indices[], gainers[], losers[], actives[] }` (each item `{ symbol, name, price, pct }`). React 18. Styling: co-located `MarketsSurface.css` + design tokens (`src/styles/tokens.css`); ships its own shimmer keyframe and `--pos`/`--neg` direction colors, so it has no dependency on the host app's classes.

**What it returns:** the hook returns state + a `refresh()`; the component returns a fragment (ticker rail + movers). Reuse anywhere by pointing `endpoint` at a payload of the same shape.
