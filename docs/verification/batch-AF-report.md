# Batch AF — make AE visible on CB's devices (report)

**CASE:** `git fetch --all` + REST PR list — mynewshub2 `main` is `a903c8b`; **PR #93 (Batch AE) is
OPEN** (not merged), so AF commits were added to its branch `claude/vigilant-gates-D9cTB-AE`, one
per item. **DO NOT MERGE.** `social-command-center` untouched. No secrets committed.

**Sandbox:** no live feed/X egress — new feed URLs stay **UNVERIFIED** (CB's Source test), real X
= **NEEDS-DEVICE**. Fixtures used.

## Item status

| item | what | result |
|---|---|---|
| **AF1** | feeds migration — the AE sources reach CB's device | ✅ **PASS** (11 unit tests + wired + smoke) |
| **AF2.2** | ALT lane: "Alternative perspective" chip + Show/Hide toggle | ✅ **PASS** (4 governance tests) |
| **AF3** | Top now / Latest split in the feed + the clustering proof | ✅ **PASS** (eyebrows render, conformance 0) |
| **AF4.3** | News: a single non-core source can't enter Top now | ✅ **PASS** (wired in AF3's Top-now gate) |
| **AF2.1** | sub-chips (Energy Upstream/Midstream/Downstream, Tech Stay-current) | ⏳ **REMAINING** — `sub` hints + whole-word in place; needs the chip UI |
| **AF4.1/4.2** | Houston local gate + "Breaking in sports" strip | ⏳ **REMAINING** — the `splitTopNowLatest` eligibility hook + `local`/`fan` ranks are in |
| **AF5** | finish the source list (~10 feeds) + Copy-report fields | ⏳ **REMAINING** — deferred list in batch-AE-sources.md |
| **AF6** | Hormuz Letter + X-only voices | ⏳ **REMAINING** — resolve via Voices finder; **never guessed** |

## AF1 — migration (the #1 gap, fixed)
New feeds lived only in `DEFAULT_FEEDS`; CB's devices load saved feeds from localStorage, so he saw
none of them. `migrateFeedsAE` (FEEDS_MIG_V 2→3, chained after Z2) is add-only + idempotent: adds
every `_ae:true` default feed (carrying `sub`/`_alt`/`tier`/`on`), never re-adds by url **or** name,
removes the seven business/bloom duplicates only when `business` is still pristine, never touches
toggles/custom/order/tombstones. Customize → Sources shows "N sources added this update".
Tests (`migrate.test.mjs`): pre-AE config → feeds added; re-run → unchanged; user-disabled stays;
custom untouched; edited business keeps its dups.

## AF3 — Top now / Latest, and the booth's clustering concern (answered)
The feed now shows **Top now** (leading eligible stories in 24h, max 2/publisher, cap 6) then
**Latest**, with quiet eyebrow dividers; `?rank=legacy` shows no split.

**The booth asked: does `scoreStory` actually receive clusters, or is coverage always 1?** Proven
with `?debug=1` (`window.__dbg.feedMultiOutlet` / `feedRankSpread`):
- `scoreStory` **does** receive the cluster — `_clusterMembers` survives `onePerCluster`.
- In the **feed**, `feedMultiOutlet ≈ 0` — because the multi-outlet clusters are **claimed by the
  Top Stories strip above the feed**. That is correct: the most-covered stories belong in Top
  Stories, not buried in the feed.
- The feed is therefore **not inert**: it ranks the remainder by **source rank** — a real business
  load shows `{core:2, specialist:3}` and the score puts the 2 core stories first (core=3 vs
  specialist=1 vs fan≈0). A single non-core source cannot enter News Top now (AF4.3).

**Remaining (honest):** the Top Stories STRIP itself still selects via `rankHomeTop`'s clusterSize
heuristic — strongly correlated with the coverage term but not literally `scoreStory`. Routing Top
Stories / Breaking / State of Play through the one `scoreStory` is AF3.1's remaining core; it is a
change to the CLS-stable held-list machinery and is scoped for the next increment.

## AF2.2 — ALT lane
Every `alt`-source item (Daily Wire / ZeroHedge / Watcher Guru) shows a neutral **Alternative
perspective** chip; a **Show alternative perspective** switch (Customize → Sources, default ON,
stored) hides them everywhere when off. Governance (tests, 26/26 ranking): alt never counts
coverage, never enters Top now, never raises a tier.

## Gates (all green)
type **0** · conformance **ALL CONFORMANT** · text-overlap **PASS** · empty-box **PASS** · contrast
**PASS** · unit: ranking **26/26**, wholeword **17/17**, migrate **PASS**, voicefind **32/32**. 0
console errors across business/bloom/sports/finance. The new "Top now/Latest" eyebrows and the alt
chip are neutral labels (conformance treats them as labels, not rows).

## Bundle (held under the hard +0.5% cap, per the ROUTER)
main **179,817** → branch **180,424** = **+607 B (+0.34% ≤ +0.5%)**. Held under by splitting the
rail **StateOfPlay** (~10.8KB, async + isolated from the feed via `.sop-hoist`) off the initial
chunk in AF1 — plus the AE splits (MarketsSurface, ConnectionsStrip, reader-only extractor).
`selectStateOfPlay` stays eager. 0 new `api/` files · no new `setInterval` · no new hex outside
tokens.css · no new dependency · SW unchanged · check:tokens green.

## What CB does
- **Customize → Sources:** see "N sources added this update", tap **Test sources** → **Copy report**
  → paste to Booth (the `_ae:true` feeds' live status confirms/swaps the UNVERIFIED URLs). Toggle
  **Show alternative perspective**.
- Compare the default feed order against **`?rank=legacy`** on News and Sports — the Top-now /
  Latest split shows core-source stories first; legacy is pure recency.
- Tell Booth which headlines still feel wrong (that steers AF3.1 — Top Stories through scoreStory).
