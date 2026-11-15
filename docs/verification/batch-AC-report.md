# Batch AC — X-layer health (Aether), Voices source finder (Firecrawl), Top-stories thumbnails

**CASE (both repos, `git fetch --all` + PR list):**
- **mynewshub2** — `main` is `2e69cce` (Batch AA+AB merged as **#90**). Branch
  `claude/vigilant-gates-D9cTB` was reset fresh from that `main` (the prior PR merged, so this is
  a new change, not stacked on merged history). AC2 + AC3 land here as **one draft PR**, one
  commit per item. **DO NOT MERGE.**
- **whatishappening-hub** — accessible (attached to the session). `main` is `d7671e7`. AC1 landed
  as its **own draft PR #2** (`claude/ac1-x-layer-health`). **DO NOT MERGE.**

**Sandbox limits (stated honestly):** no WebKit (real-device Safari = **NEEDS-DEVICE**); no live
X / feed / Firecrawl egress (real Firecrawl + real X = **NEEDS-DEVICE**, run on fixtures/mocks).
No secret value is printed anywhere in this report. Everything run on Chromium desktop + touch
emulation, light + dark.

## Item status

| item | what | result |
|---|---|---|
| **AC1** | AetherHub X-layer honest status + probe + diagnosis (whatishappening-hub PR #2) | ✅ **PASS** (diagnosis + status mapping + 4/4 unit tests) · live probe response **NEEDS-DEVICE** |
| **AC2** | Voices source finder (Firecrawl) — server `kind=voicefind` + client finder sheet | ✅ **PASS** (32/32 unit tests, fail-soft, under bundle) · real Firecrawl **NEEDS-DEVICE** |
| **AC3** | Thumbnails on Top-stories rows 1–2 (phone + iPad-portrait; desktop already has them) | ✅ **PASS** (CLS, conformance, image-slots green) |
| **AC4** | this report + gate suite | ✅ this doc |

## AC1 — the diagnosis answers (verbatim, no secrets)

The parked symptom — *"AetherHub X handles need `TWITTER_AUTH_TOKEN`, 23 sources degraded"* —
**does not exist in the current whatishappening-hub code and never has.**

1. **Every place a `TWITTER_AUTH_TOKEN` / X credential is read:** none. `grep` across
   `app/ components/ lib/` and `git log -S "TWITTER_AUTH_TOKEN"` across all history find zero reads
   of any X session token or credential; there is no `aether` vertical.
2. **What request the X layer makes:** `xSnippets()` in `lib/engine/reaction.ts` calls the
   **keyless** web-search path (`web-search.ts`: Google News RSS → DuckDuckGo) with a `site:x.com`
   query and shows the snippets. It never fetches an x.com page and never authenticates.
3. **What produces "needs TWITTER_AUTH_TOKEN":** nothing — the string exists nowhere. If the
   keyless search returns nothing, the X take is simply absent (never "needs a token").
4. **What "23 sources degraded" counts:** the only source-health machinery is
   `app/api/diagnose/route.ts`, which fetches each vertical's **RSS sources** and marks `403/429/401`
   as `blocked` (a feed walling this datacenter IP, e.g. Reddit). That is RSS feeds, **not** X and
   **not** a credential. Its headline deliberately avoids the word "degraded".
5. **missing / expired-rejected / rate-limited:** N/A — there is no credential. For RSS, `blocked`
   conflates 401/403/429 and does not distinguish them.

**What AC1 shipped instead of guessing:** a pure `classifyXLayer()` → one neutral status
(`reachable` / `search-empty` / `probe-failed`, `usesCredential` always false), surfaced as one
on-demand `reactions` check in `/api/diagnose` (one keyless probe, no polling/`setInterval`, no
secret). Fallback table (AC1.4): keep the supported keyless path; a session-token route is a
ToS/brittleness regression; paid xAI live-search is the only supported upgrade — out of scope.
Unit tests assert no state ever claims a token is needed. Full write-up in that PR's
`docs/x-layer-diagnosis.md`.

## AC2 — Voices source finder (Firecrawl)

- **Server** `lib/voices/handler-find.js`, dispatched as `kind=voicefind` from `api/signals.js`
  (one import + one line; **no new `api/` file**). Firecrawl **v2** via `fetch` with
  `FIRECRAWL_API_KEY` (env only): ONE `/v2/search` (limit 5) → at most TWO `/v2/scrape` JSON-schema
  calls (**hard cap 3 Firecrawl calls**), ≤8 candidates deduped by `voiceId` against existing
  voices + tombstones. Fail-soft: no key → `{enabled:false,note}`; any error/timeout(8s) → empty
  list + named failure, always HTTP 200. GET + `s-maxage=86400`; `guard()`+`allowOrigin()` like the
  sibling voice kinds. **No secret is ever read into a response** (asserted by test).
- **Client:** a "Find voices for <category>" ghost button (44px) in Customize → Voices; a result
  sheet (`VoiceFinderModal`, reusing the ResolveModal shell + one row anatomy) — name, role, reason,
  **Evidence ↗** link, a neutral **"Suggested · unverified"** chip, and **Add**. Add creates a
  `status:'seed'` voice (NOT followed) and opens the **existing E2 confirm flow** — nothing
  auto-accepted, handles never guessed. 7-day localStorage cache per (category, focus) + 60s
  cooldown + on-demand only (0 network on render/scroll). Cache/cooldown/fetch logic is a lazy
  module so it costs the entry chunk nothing.
- **Unit tests** (`test/visual/voicefind.test.mjs`, **32/32**): schema mapping, within-batch +
  tombstone + existing dedupe, 8-cap, `voiceId` parity with the client model, hard 3-call cap, and
  **the key is never echoed** (mocked-fetch pass over the full handler).
- **NEEDS-DEVICE:** real Firecrawl results — CB adds `FIRECRAWL_API_KEY` in Vercel (see below).

## AC3 — thumbnails on Top-stories rows 1–2

- **Phone + iPad-portrait** (`MobileHome`, which renders ≤640 and, with the iPad-sections flag,
  641–900): Top-stories rows 1–2 render the **STANDARD** anatomy (headline left, **72px** thumbnail
  right, `TOPIC · Source · time`) **when the story has a usable image** (reuses `hasUsableImage` +
  the X/Y generic-card/blank detection + the SnapshotCard image guards). Rows 3–5 stay **COMPACT**.
  A row with no usable image (or a runtime 404/blank) renders COMPACT — no blank gap, no placeholder.
- **Desktop / iPad-landscape** (`TopOfHourStrip`): already renders a hero image + thumbnailed
  compact rows, so per the spec ("same rule … no layout change beyond that") it is left unchanged.
- **CLS:** the 72px thumb slot is fixed (image lazy-loads into reserved space); the Top-stories
  reserve was raised 430→500px so the taller committed block is shift-free. Phone Home CLS (10 runs):
  **390 max 0.0156, 375 max 0.0150** — both ≤ 0.03 (down from 0.0286 before the reserve fix).
- Conformance **0 violations** (still ≤3 anatomies: LEAD + STANDARD + COMPACT); image-slots **0**.

## Gates (final AC build) — all green
type **0** · conformance **0** (≤3 anatomies) · contrast **0** (7,109 leaves) · text-overlap **0**
(all width×theme×page cells) · empty-box **0** · image-slots **0** · dedupe-label **0** ·
layout-polish **0** · fixed-overlap **0** (0 console errors) · sports-dedup PASS · p5-sports-index
PASS · o7-hero-contrast PASS · touch-mode PASS · sop-up-front PASS · detect **37/0** ·
font-network **0** · unit tests: voicefind **32/0** (mynewshub2), x-layer **4/0** (whatishappening-hub).
check:tokens **green** (inline styles back to baseline 212) · initial JS gzip **179,617 B vs main
179,817 B (−200)** · phone-Home CLS 390 **0.0156** / 375 **0.0150** (10 runs, ≤0.03).

## Before / after screenshots (`docs/verification/batch-AC/`)
- **AC3** phone Home 390, light + dark — `before-home-390-{light,dark}.png` (Top-stories text-only)
  vs `after-home-390-{light,dark}.png` (rows 1–2 now carry a 72px thumbnail when they have an
  image; the no-image row stays COMPACT). Fixture images are a solid-colour SVG stand-in, so a
  thumbnail renders as a filled block — real photos in production.
- **AC2** Voices finder sheet (mocked Firecrawl), 390 + 1194, light + dark —
  `after-finder-{390,1194}-{light,dark}.png`: three candidates, each with name · type, a neutral
  **SUGGESTED · UNVERIFIED** chip, role, reason, an **Evidence ↗** link, and **Add**.

## Hard constraints
0 new `api/` files · new server code in `lib/voices/` dispatched as a `kind` · no new `setInterval`
· no new hex outside tokens.css · no new dependency · SW unchanged · initial JS gzip ≤ main ·
check:tokens green · trust governance unchanged (finder output labelled unverified, never
auto-followed, handles never guessed).

## What CB does and confirms
1. **Aether (whatishappening-hub):** there is **no `TWITTER_AUTH_TOKEN`** to set — the X layer needs
   no credential. After PR #2 deploys, open `/api/diagnose?token=<EXPORT_TOKEN>` (value already in
   Vercel; do not paste it) and look for the **`x-layer`** check under a new `reactions` group:
   expect *reachable via web search* or the neutral *web search returned nothing*. The RSS "blocked"
   feeds are a separate, pre-existing datacenter-IP wall, not an X problem.
2. **NewsHub (mynewshub2):** add **`FIRECRAWL_API_KEY`** in the Vercel dashboard, redeploy, then
   open Customize → Voices → **"Find voices for News"**. Sample request to try on the preview:
   `/api/signals?kind=voicefind&category=general` → expect candidates labelled
   **"Suggested · unverified"** with Evidence links (empty/soft on any error; never an error page).
3. **iPhone:** Top-stories rows 1–2 show small thumbnails, no dead gaps, and the page does not jump
   while the images load.

## Caveats (honest)
- Real-device Safari, real Firecrawl results, and the live `/api/diagnose` X-layer probe are all
  **NEEDS-DEVICE / MOCKED** (no WebKit, no live egress in the sandbox).
- AC3 rare-case note: when neither of the top two stories has a usable image (uncommon), the 500px
  reserve leaves a small bounded gap below Top-stories; this never breaches the CLS cap.
