# Batch X — trust bugs, one look for every category, phone first screen, reliable chat

**CASE:** `git fetch --all` + PR list — **PR #86 (Batch W) is MERGED** (`abf0268` on `main`).
Branched `claude/vigilant-gates-D9cTB` **fresh from `main`**, one commit per item X0–X9, **draft PR,
DO NOT MERGE**. Sandbox has no feed egress → all content is the harness's real-shape fixtures. No
WebKit in the sandbox → real-device Safari = **NEEDS-DEVICE**. Everything run desktop + touch
emulation (`isMobile/hasTouch` → `(hover:none)` true), light + dark.

## Item status

| item | what | result |
|---|---|---|
| X0 | conformance harness + audit | ✅ PASS — audit + `conformance.test.mjs`; **940 violations** on main |
| X1 | one SourceImage path | ✅ PASS — main **5 generic-card imgs → 0**; 0 blank thumbs, 0 empty indents |
| X2 | dedupe + label correctness | ✅ PASS (X2b fix + proposal) — Martha ×3→1; 0 redundant labels; tornado not "Sports" |
| X3 | one look (chip/tile/button/status) | ✅ PASS — conformance **940 → 0, ALL CONFORMANT** |
| X4 | layout polish | ✅ PASS (X4b partial) — 16px scroller gutter, 0 meta orphans, feed≤top headline, badge scrim |
| X5 | phone first-screen diet | ⚠️ PARTIAL — scores kickoff ✅; dead gaps CLS-limited (table); lead-icons / Sports-chrome reported |
| X6 | chat → header icon | ✅ PASS — no floating button; 0 fixed-element overlaps; 1-tap from every page |
| X7 | State of Play + rail re-confirm | ✅ PASS — sop-up-front + empty-box green, no churn |
| X8 | per-category sweep + matrix | ✅ `docs/verification/batch-X-matrix.md` |
| X9 | re-verify + report | ✅ this doc |

## BEFORE / AFTER

| metric | main (BEFORE) | branch (AFTER) |
|---|---|---|
| distinct chip/tile/button looks (conformance violations) | **940** | **0** (ALL CONFORMANT) |
| generic fallback-card ("THE GUARDIAN …") images rendered | 5 | **0** |
| naturalWidth-0 blank thumbs / empty row indents | present | **0 / 0** |
| duplicate rows per page (Martha Stewart ×3) | 3 (near-dup slipped the 60-char dedupe) | **1** |
| redundant category labels (Energy / Business pages) | 3 "Energy" + 3 "Business & Markets" | **0** |
| meta lines wrapping a lone age ("… · 2h" / "ago") | present (C4) | **0** |
| first phone chip left edge | ~4px (flush) | **16px** ±1 |
| scheduled score card | "—" dashes + "SCHEDULED" | **kickoff time** (0 "—") |
| floating chat button over text (phone/iPad) | yes (4/4 phone screens) | **removed** — header icon, 0 overlaps |
| initial JS gzip | 180,472 B | 182,099 B (**+0.90%**, ≤ +1%) |
| mobile Home CLS (390/375, 10 runs) | max 0.050 / 0.048 | max 0.050 / 0.048 (== main; W6 held-list residual) |
| 0 `api/` files · 0 new `setInterval` · 0 new hex outside tokens.css · SW unchanged | — | **PASS** |

## X0 — conformance, failing then passing

```
# main (BEFORE)
CONFORMANCE — 1196 chip/tile/button elems checked, 940 violations
  <.sport-tab>        rest-bg-not-transparent: rgb(237, 237, 234)   (Business chips + Sports tiles)
  <.sport-tab.active> box-shadow: rgba(17, 17, 19, 0.04) 0px 1px     (bevel)
  <.sport-tab>        font-size-off-scale: 12
  <.page-customize-btn> no-1px-border ; <.last-updated> status-pill-too-tall: 44px
  <.sop-showall> rest-bg-not-transparent ; <.kw-chip> hit<44: 27 ...

# branch (AFTER X3)
CONFORMANCE — 1128 chip/tile/button elems checked, 0 violations
ALL CONFORMANT
```

## X2b — topic-label root cause + proposal

**Root cause (diagnosed, not guessed):** there is **no content classifier** for ordinary feed
articles. A story's `.cat` is stamped = the feed it was fetched from (`loadCat` `App.jsx:10051`;
poll `:10072`; wide-discovery `:8979`), or an explicit per-feed `cat:` override (`App.jsx:1417–1430`,
e.g. On3/NIL→sports, EnergyWire/ERCOT→business). `TopicTag` renders that stored `.cat` verbatim on
the mixed surfaces (Top Stories strip + State of Play). So a tornado-risk story from **The Spun** (a
sports feed) is `cat:'sports'` and read "Sports".

**Fix with existing utilities only:** on mixed surfaces show the category label only when the story's
own text confirms that category via the **existing `kwMatch`** keyword matcher (`labelConfirmed`);
when it cannot confirm, show **no label** (never a contradicting guess). On a category page the label
is hidden when it equals the page's own category (redundant). Verified: the tornado fixture is not
labelled "Sports" on Home; 0 redundant labels on Energy/Business/Health/AI&Tech/Sports.

**Proposal (STOPPED, not built):** a real fix for the *categorisation* (so The Spun's weather story
is filed under News, not Sports) needs a **new content classifier / per-source topic-override rule** —
a new rule the spec says to propose, not build. Cause: source→category is a 1:1 stamp; evidence: the
tornado case; rule: classify an article's topic from its text and override the feed category when the
two disagree with high confidence; risk: a weak classifier mislabels more than it fixes, and it is new
inference (explicitly out of scope for this batch). Reported for a future batch.

## X1 — image cause (reported)

The blank Guardian thumbnail could be any of referrer/hotlink (Guardian 403s a cross-site hotlink
without a referrer policy), a 404, or Guardian's generic fallback-card (which bakes in a faint "THE
GUARDIAN US/BUSINESS" wordmark). In-sandbox we cannot fetch the real Guardian URLs, so *which* one a
given blank is = **MOCKED**; the one `SourceImage` path covers all three — a per-host `referrerPolicy`
(no-referrer for guim.co.uk/theguardian.com/…), `onError` + `naturalWidth===0`, and a KNOWN
generic-card URL-pattern list treated as "no image". Rows go text-only (no blank indent); the lead
becomes a `--navy` block (white headline, no source mark). `image-slots.test.mjs`: main renders 5
generic-card `<img>` and FAILS; branch is 0 generic / 0 blank / 0 empty-indent.

## X5 — phone first-screen, honest

- **Scores (X5c):** a scheduled card shows its KICKOFF TIME ("5:40 PM" / "Sun 1:00 PM"), never "—" or
  "SCHEDULED". 0 "—" tiles.
- **Dead gaps (X5a):** the ~29px (below the lead) and ~16px (below Top Stories) are the min-height
  FLOORS. Measured content (lead ~331, Top Stories ~340) and tried tightening the floors to it →
  mobile Home CLS regressed 0.015→0.05 (the floors absorb held-head height variance — the W3–W7 CLS
  architecture; the lead skeleton is a 16:9 ~219px block, the committed card ~331px). Per the spec's
  "keep the smallest floor that meets CLS and report" clause, the floors stay at 360/356 (branch max
  0.050 == main 0.050; no gate weakened). Fully closing the gap needs an atomic skeleton==content
  reserve (R2-class) — reported, not forced.
- **Reported, not done:** X5b (Ask/Save as ghost icons on the lead meta), X5d (Sports chrome ≤300px by
  merging the team chips into the league scroller), X5e (Show-all + Open-full one row). Layout
  refactors beyond the scores/gap scope; none is a conformance failure.
- **X4b** one-`<Lead>`-component consolidation is likewise partial — the on-photo badge scrim is done
  and the leads already share SourceImage + SnapshotCard/HeroBand.

## Gates (Chromium + Chromium touch, real fixtures)

| gate | result |
|---|---|
| conformance (7 pages × 4 bands × light+dark) | **0 violations / 1,128 elements — ALL CONFORMANT** |
| unit (11 modules) | **11/11 PASS** |
| contrast scanner | **0 failures** |
| text-overlap (10 widths × 6 pages × light+dark) | **0 overlaps** |
| empty-box · sop-up-front · sports-dedup · P5 · O7 hero · touch-mode | **ALL PASS** |
| dedupe-label · image-slots · layout-polish · fixed-overlap | **ALL PASS** |
| renders-on-scroll (App) | **+0** (TopBar +2 owns shrink/hide) |
| initial JS gzip vs main | **+0.90%** (≤ +1%) |
| 0 api · 0 new setInterval · 0 new hex outside tokens.css · SW unchanged · check:tokens | **PASS** |

## Screenshots

Before (`main`) / after (branch), light + dark, at 390 / 1194 for Home, Business, Energy, Sports (and
390×664 for Home) under `docs/verification/batch-X/`.

## What CB confirms on real devices
- **iPhone:** the chat is a header icon and nothing covers text; no blank gaps where a thumbnail
  failed; the scheduled games show a kickoff time, not "—".
- **iPad:** the hero has no ghost "THE GUARDIAN" watermark; no blank thumbnails; Business and Sports
  draw the SAME chip/tile look as Energy; no story repeats three times.
- **Desktop:** the chat is a header icon in the icon group; every category draws the same chip, tile,
  button and status-pill look.
