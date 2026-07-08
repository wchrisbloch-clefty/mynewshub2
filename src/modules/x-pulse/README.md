# X Pulse — sentiment layer

Drop-in "street-level X reaction" for any topic. Two halves, reusable with just a topic string + an xAI API key.

**What it does:** given a topic, asks xAI's Grok (Live Search limited to X) for the current sentiment plus a few real recent posts, and renders a small inline card (sentiment pill + up to 3 linked takes). Fails silently — on any error/timeout/empty result it renders nothing, so it never blocks its host.

**What it needs:**
- **Client:** `<XPulse topic="Kentucky" variant?="reader" endpoint?="/api/x-pulse" />` — React 18, `useState`/`useEffect`. Styling via `.x-pulse` / `.xp-*` classes.
- **Server:** `api/x-pulse.js` — a single self-contained Vercel serverless function needing only `XAI_API_KEY`. It must live under `api/` for the platform to route it (that's why it isn't inside this folder — a deploy-platform constraint, not a code dependency).

**What it returns / contract:** the function responds `{ sentiment: 'bullish'|'bearish'|'mixed'|'n/a', takes: [{ text, handle, url }] }` (always HTTP 200, empty on failure); the component consumes exactly that shape. To reuse elsewhere: copy `XPulse.jsx` + `api/x-pulse.js`, set `XAI_API_KEY`, ship the `.x-pulse`/`.xp-*` CSS.
