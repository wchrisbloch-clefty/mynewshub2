# Batch AH — Accept-all voices, the last 3 dead feeds + fallback gaps, rank/sub consistency (report)

**CASE:** `git fetch --all` + REST PR list — **PR #93 is OPEN** (not merged), so AH commits were added
to its branch `claude/vigilant-gates-D9cTB-AE`, one per item. **DO NOT MERGE.** `social-command-center`
read-only. No new `api/` file. No secrets.

**Sandbox:** no live feed/X egress — fixtures/mocks throughout; real feeds + X = **NEEDS-DEVICE**.

## Item status
| item | what | result |
|---|---|---|
| **AH1** | "Accept all voices" (scopes, confirm sheet, undo) | ✅ **PASS** (bulk-accept 6/6 + smoke) |
| **AH2** | fix the 3 dead feeds + the fallback trigger + thin-merge | ✅ **PASS** (feed-fetch 10/10, migrate 6/6, Test-all smoke) |
| **AH3** | rank + sub-key consistency | ✅ **PASS** (sub-rank 23/23) |
| **AH4** | confirm AG4 (trending) + AG5.3 (voice flags) landed | ✅ **BOTH LANDED** (see below) |

## AH1 — Accept all voices
Customize → Voices → Suggested voices now has **Accept all (N)** + scope buttons (**People**, **Orgs**,
and per-category **<cat> (N)**). Tap → a confirm sheet ("Add N voices … Nothing posts or loads from X
until you tap a voice. Handles are checked later.") [Add them] [Cancel] → **"N added"** with **[Undo]**
(10s window; Undo restores the previous list, and it persists even after Accept-all empties the queue).
Bulk voices are `status:'unconfirmed'`, `confirmedBy:'accept-all'`, followed by NAME, **no per-person
handle prompt** (handles resolve lazily later via Lane 1). Tombstoned ids never re-added; duplicates
skipped + counted. Org seeds duplicating a news source are marked **"already a source"**. Governance
unchanged; **0 network on accept** beyond saving prefs (asserted). The bulk logic + panel UI are in
lazy chunks. Smoke: Accept all → **0 → 121 voices**, "121 added", Undo → 0, **0 network requests**,
0 console errors.

## AH2 — the three dead feeds + the fallback gap (before → after)
The AG1 fallback DID fire on 0-items; these never recovered because the *derived* GNews domain was
wrong, or the feed is dead. The rule now fires on non-200 / 200+0-items / timeout(code 0), a thin
primary merges, and a fallback that also returns 0 items is a NEUTRAL "no items" (not red).

| feed | before | after | how |
|---|---|---|---|
| **Axios Markets** | 404, usedFallback:false | ok, items, **usedFallback:true** | fallbackUrl = GNews `site:axios.com markets` (derived `site:api.axios.com` was wrong) |
| **Watcher Guru** | 200 + 0 items | ok, items, loads directly | own feed now redirects to HTML (verified) → GNews `site:watcherguru.com` is the PRIMARY (name keeps alt rank) |
| **Horse Race Nation** | code 0, usedFallback:false | ok, items, **usedFallback:true** | fallbackUrl = GNews `site:horseracingnation.com` (the real domain) |
| **Data Center Frontier** | 2 items | **2 → 5** (merged) | mergeFallbackUrl = GNews on the publisher name, dedup by link |
| **VentureBeat** | 8 items | **8 → 11** (merged) | mergeFallbackUrl = GNews on the publisher name, dedup by link |

The whole fetch-with-fallback rule is a pure, unit-tested module; existing users (saved feeds lack the
new fields) are patched by a lazy, idempotent `migrateFeedsAH` after first paint (add-only; Watcher
Guru's URL adopted only if the user still has the dead one). The Test-all report distinguishes
**ok / no-items / failed** (so a tried-but-empty feed is no longer counted red).

## AH3 — rank + sub-key consistency
- **Sub keys:** the Tech "Stay current" chip used a hardcoded 4-name set, so **Simon Willison** and
  **One Useful Thing** never appeared. `normalizeSub` canonicalizes to `staycurrent` (accepts
  `stay-current` as an alias) and the chip now derives its sources from the feeds' normalized `sub`, so
  all **6** stay-current feeds land. **Sub-key audit:** the only drift was stay-current↔staycurrent;
  energy keys (upstream/midstream/downstream/power/datacenter/clean/policy) are already consistent.
- **Rank:** the Google News fallback keeps the primary feed's NAME, so `rankOf(source)` already equals
  the declared rank for every fallback-served feed (Guardian, Yahoo Finance, SI, Bleacher Report,
  ESPN) — asserted. **ESPN** top-headlines → `core` (was `specialist` while its league feeds are core).
- **Fox News → `core`** for parity with CNN/ABC/CBS/NBC. **REVERSIBLE** — remove `'Fox News'` from CORE
  in `rank.js` to revert. NY Post stays `specialist`; Daily Wire/ZeroHedge/Watcher Guru stay `alt`.

## AH4 — AG4 (trending) + AG5.3 (voice flags): BOTH LANDED
Both are on the branch (shipped in the previous session, commits d0b3d09 and 6a70366):
- **AG4 trending** — a lazy trending module fetches Google Trends after first paint; a headline sharing
  ≥2 meaningful tokens gets a neutral **"Trending"** chip in "Also moving". Tests: `trending` 10/10,
  `also-moving` covers the `trendingHas → "Trending"` case. Live Trends data = NEEDS-DEVICE.
- **AG5.3 voice flags** — a lazy matcher flags a story **"Yergin · 2h ↗"** when a confirmed voice's
  recent post shares ≥3 tokens with the headline, feeding "Also moving". Tests: `voice-flag` 9/9,
  `also-moving` covers the `voiceFlag → "Yergin · 2h ↗"` case. Live voice posts = NEEDS-DEVICE.
  (Scoped follow-ups still open, as noted in the AG report: AG4's +1 ranking boost, AG5.3's on-card chip
  on every matching story, and the "Watching: ERCOT" row.)

## Bundle
The +1.1% cap (main 179,817 → **181,795 B**) held. Every new AH feature's logic/UI sits in a lazy chunk
(feed-fetch rule + proxy fetch + GNews helper; migrateFeedsAH; bulk-accept + the panel UI). A handful of
redundant / false-hitting energy keywords were dropped to seat the last few bytes (`green`,
`powering ai`, the `data-center` duplicate, `server farm`, `ppa`). **Final initial JS gzip 181,795 B
(= the cap).**

## Gates
Unit (16 suites): ranking · wholeword · migrate 6/6 · voicefind · sports-breaking · across-outlets ·
also-moving · aether-import · trending 10/10 · voice-flag 9/9 · feed-fetch 10/10 · sub-rank 23/23 ·
bulk-accept 6/6 · top-stories/select · state-of-play/select — **ALL PASS**. check:tokens **PASS**.
Visual suite (390 / 820 / 1194 / 1440, light + dark): _finalized in the commit that closes this report._

## What CB does
- Preview → **Customize → Voices → Accept all → confirm** (expect 105+ added, Undo available).
- **Customize → Sources → Test all sources → Copy report → paste to Booth** (expect 120 ok, 0 red —
  Axios/Horse Race Nation show "via Google News", Watcher Guru loads, DCF/VentureBeat show merged counts).
- Open **AI & Tech → Stay current** (expect **6** feeds).
