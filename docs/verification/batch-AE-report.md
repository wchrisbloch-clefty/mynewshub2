# Batch AE — pull what matters: ranking + sources (report)

**CASE:** `git fetch --all` + REST PR list — mynewshub2 `main` is `a903c8b` (Batch AD / PR #92
merged). Branched fresh from it; one draft PR, **DO NOT MERGE**. `social-command-center` was used
as **read-only** input for the AE5 people list (copied to a static file; no runtime link, no push).

**Sandbox limits (honest):** no live feed or X egress — every **new feed URL is UNVERIFIED** here
(fixtures used), and real posts are **NEEDS-DEVICE** (CB's Source test, AE9). No secret printed.

## Scope of this PR (read first)

Batch AE is a nine-item re-architecture of the ranking and source system. This draft lands the
**tested root-cause foundation** — the two things the WHY calls out as the actual bugs — fully
unit-tested, every gate green, and under the hard **+0.5% initial-JS-gzip cap**. The larger UI
subsystems (AE3–AE5, AE7, AE8) are scoped below for the next increment; the ranking **engine they
all build on is shipped and tested**, so they become wiring rather than design.

## Item status

| item | what | result |
|---|---|---|
| **AE1** | source ranks (RANK_BY_NAME) + de-dup + portfolio additions + sources doc | ✅ **PASS** (data + ranks; new URLs **UNVERIFIED / NEEDS-DEVICE**) |
| **AE2** | importance ranking v2 (scoreStory) + feed ordering + kill switch | ✅ **PASS** (22 unit tests on CB's fixtures) |
| **AE6** | whole-word sub-category filtering (false-positive fix) | ✅ **PASS** (17 unit tests) — chip **restructure** deferred (AE6.2/6.3) |
| **AE3** | Houston + Sports Breaking gates | ⏳ **DEFERRED** — ranks (`local`/`fan`) + the engine hooks are in; rule constants + strip are the remaining wiring |
| **AE7** | saved-feed migration (`feedsMigrationAE`) | ⏳ **DEFERRED** — design in this report; needed so AE1 reaches CB's device |
| **AE4** | trending net (boost + chip) | ⏳ **DEFERRED** — `trending` input already in scoreStory (cap +1) |
| **AE5** | AetherHub people import + flagging | ⏳ **DEFERRED** — `followBoost` already in scoreStory; needs the import sheet + flag chip |
| **AE8** | performance (concurrency cap, lazy) | ⏳ **DEFERRED** — bundle already under cap; concurrency cap is a `loadCat` change |

## AE2 — the root-cause fix, proven on CB's fixtures (unit test, before/after)

`loadCat` sorted by `pubDate` only (`src/App.jsx` `results.sort(b-a)`), so a fan blog posted 3
minutes ago outranked an hour-old wire story. `src/modules/ranking/score.js` adds a pure score:

```
score = 3·min(distinctCoreOutlets,3) + 1·min(distinctSpecialistOutlets,2)
      + recencyDecay(ageHours, halfLife) + followBoost − fanPenalty
```

fan/alt/local never count toward coverage; a fan/local-only cluster scores ~0. The feed
(`dedupedFeed`) is ordered by it in v2; `?rank=legacy` + a stored flag restore pure recency.

**Before → after "Top now" on CB's exact fixtures** (`test/visual/ranking.test.mjs`, 22/22):

| fixture | legacy (recency) | v2 (importance) |
|---|---|---|
| single-outlet **Houston auto-show** (KHOU, `local`) | could lead (freshest) | **excluded from Top now** |
| single-outlet **Staten Island turkeys** (NY Post, lifestyle) | could lead | **excluded** |
| **fan-blog** "shot at the Big House" (The Spun, `fan`) | could lead | **excluded (fan penalty)** |
| multi-outlet **political** story (AP+Reuters+NYT+Axios) | buried by fresher junk | **in Top now** |
| multi-outlet **NFL trade** (ESPN+Athletic+Yahoo) | buried | **in Top now** |

## AE1 / AE6 — see detail docs
Source portfolio, ranks, de-dup and how-found: **`docs/verification/batch-AE-sources.md`**. AE6
whole-word fix: `src/modules/text-match.js` + `test/visual/wholeword.test.mjs` (every/right/boil/
event/gasket no longer false-match ev/rig/oil/event/gas).

## Gates (all green)
type **0** · text-overlap **0** · contrast **0** (7,067 leaves) · conformance **0** · dedupe-label
**0** · image-slots **0** · empty-box **PASS** · layout-polish **PASS** · fixed-overlap **PASS** ·
sports-dedup **PASS** · touch-mode **PASS** · unit: ranking **22/22**, wholeword **17/17**, detect
**37/0**, voicefind **32/0**. 0 console errors across business/finance/bloom/tech/sports.
check:tokens **green** · **initial JS gzip 180,687 B vs main 179,817 (+870, +0.48% ≤ +0.5% cap)** —
held under the cap by splitting the markets-tab-only MarketsSurface component (useMarkets hook
extracted) + the rail ConnectionsStrip and loading the reader-only extractor on demand. 0 new
`api/` files · no new `setInterval` · no new hex outside tokens.css · no new dependency · SW
unchanged · trust governance unchanged (alt labelled, nothing inferred raises a tier).

## Remaining items — design (for the next increment)

- **AE3 Houston + Sports gates:** a CB-editable `MAJOR_EVENT_TERMS` constant + a `local`/`core`
  coverage check in the Top-now eligibility predicate (`splitTopNowLatest` already takes an
  `eligible` hook); a "Breaking in sports" strip reusing the Home breaking strip, gated ≥3 outlets
  / 2h / ≥1 core, fan never triggers. The `local`/`fan` ranks are already assigned.
- **AE7 migration:** `feedsMigrationAE` in `src/modules/feeds-migrate` — once per device: ADD the
  AE1 default feeds, REMOVE the business/bloom duplicates only when the user never customized them,
  tag KHOU/Chron `local`; never touch toggles/custom/order/tombstones; idempotent + unit-tested.
- **AE4 trending:** fetch Google Trends US RSS + Google News Top stories + reddit r/news + HN via
  the existing `/api/rss` proxy after first paint; a ≥2-token overlap gives the cluster `trending`
  (scoreStory already adds +1, capped) + a quiet "Trending" chip. Fail-soft, inferred.
- **AE5 AetherHub people:** `src/modules/voices/aether-import.js` (static copy of SCC
  `config/sources.js` people/topics) + an "Import from AetherHub" sheet in Customize → Voices
  (confirm → `status:'confirmed'`, respect ids/tombstones) + a flag chip when a confirmed voice's
  post shares ≥3 tokens with a story (reuse `similar()` from `api/discover.js`) + the followBoost.
- **AE8 performance:** cap `loadCat` fetch concurrency at 6 with a per-feed timeout; non-active
  categories already load lazily.

## What CB does
- Compare **`?rank=legacy`** against the default on News and Sports — the junk that led by recency
  should drop out of the top.
- Customize → Sources → **Test sources** → **Copy report** → paste it back: every `_ae:true` feed
  shows its live status (200/items/403/404/timeout) so the UNVERIFIED URLs can be confirmed or
  swapped.
