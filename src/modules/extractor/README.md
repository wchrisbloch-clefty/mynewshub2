# Content Extractor — clean text from any URL

The single extraction path for summarization. Given any URL, it returns the real readable body — never the RSS/description blurb — so downstream Summarize / Key Points run on actual content.

**What it does:** server-side, it fetches the source with a real browser UA and extracts the body:
- **Articles** → readability-lite (strips `<script>/<style>/<nav>/<header>/<footer>/<aside>/<form>`, prefers `<article>`/`<main>`, then paragraph density), entity-decoded, capped to a sensible token budget.
- **YouTube** → the actual caption track (from `ytInitialPlayerResponse`), not the description. No captions → `no-transcript`.
- If the result is under ~500 chars → `too-short` (caller renders "Full text unavailable", never invented filler).

**What it needs:** `extractContent(url, { endpoint?, timeout? })`. No key. The server half is `api/extract.js` (must sit under `api/` for Vercel to route it — a platform constraint, same as x-pulse). Cached ~10 min per URL in memory + `s-maxage` at the edge.

**What it returns:** `{ text, title, source, kind, chars }` on success, or `{ error, kind }` where `error ∈ { 'no-transcript', 'too-short', 'fetch-failed', 'no-url' }`. `extractionFallbackMessage(error)` maps errors to honest user-facing strings. Reuse anywhere you need clean article/video text.
