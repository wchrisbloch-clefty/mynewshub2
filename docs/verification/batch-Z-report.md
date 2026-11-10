# Batch Z — one "Top Stories", headlines-first News, one row format, best-in-class scroll

**ROUTER / CASE:** PR #88 (Batch Y) is **MERGED** into `main` (`0610806`). This branch
`claude/vigilant-gates-D9cTB` carries Batch Z on top of that merged history, one
commit per item, **draft PR, DO NOT MERGE** (merge is the user's call). Sandbox has no
feed egress → all content is the harness's real-shape fixtures; no WebKit → real-device
Safari = **NEEDS-DEVICE**. Everything run desktop + touch emulation
(`isMobile/hasTouch` → `(hover:none)` true), light + dark, across the phone/iPad/desktop
device bands.

## Item status

| item | what | result |
|---|---|---|
| Z0 | remove the hero picture on the phone lead (text-first) | ✅ PASS — phone lead renders text-first (kicker, large serif headline, deck, Source·time, ghost Ask/Save, hairline); **0 lead-image request at 390**; text-only skeleton; first Top-stories row reachable; CLS held |
| Z1 | ONE "Top stories" list (`selectTopStories`) | ✅ PASS — new pure selector (rankClusters general-first, ≤2/publisher, breaking dedupe via `sameStory`, promo/satire filtered); unit tests green; **deleted** the phone SoP card + TOP_ORDER round-robin (the double dip); 5 rows + "Show all"; **0 duplicate** across lead/breaking/top/sections at 3 bands |
| Z2 | headlines-first News (per-feed `cat:` + pool rule) | ✅ PASS — per-feed overrides (TechCrunch→tech, Bloomberg→finance, Morning Brew/CNBC→business) as **config, not inference**; pool rule general-first, non-general only if ≥3 outlets/breaking, max ONE; **≥4/6 general**, ≤2/publisher, no single-outlet niche breaking |
| Z3 | one row format (3 token-driven anatomies) | ✅ PASS — `batch-Z-row-inventory.md` maps every row to LEAD/STANDARD/COMPACT; conformance **ANATOMY** gate asserts ≤3/page + one `--fs-meta` meta token + no tweener titles, **0 violations** all cat×band×theme; unified 9 stray meta leaves to `--fs-meta` |
| Z4 | phone chrome diet + best-in-class scroll | ✅ PASS — scores+weather **one band**; chrome above first headline **244→217px** (≤220); scores-band reserve fixed the dominant 17px shift → **CLS 390 0.028 / 375 0.015** (20 runs); **scroll place-keeping** restores within 8px (1352→1352); **"N new stories" pill** made real (staged refresh, 0 shift, fixed-position); bottom-tab bar documented PROPOSE-ONLY |
| Z5 | podcast parity (one action set) | ✅ PASS — `PodCard` hoisted to module scope (panel survives re-render); every episode gets Summary/Takeaways/Explain/Ask/Listen/Summarize/Share/Save; **honest source ladder** (transcript on tap → show notes ≥PREVIEW_MIN → "none"); `/api/listen` **only on tap** (0 on render/scroll); 120-char-notes episode still offers Summary; phone Home Podcasts section (latest 3, lazy, collapses empty); **zero new api/ files** |
| Z6 | re-verify all gates per category → matrix | ✅ `batch-Z-matrix.md` — all gates green every category |
| Z7 | bundle (initial JS gzip ≤ +0.5% vs main) | ✅ PASS — **−0.64%** (179,833 B vs main 180,999 B): lazy-split `<MobileHome/>` off the initial chunk |
| Z8 | report + before/after + screenshots + draft PR | ✅ this doc |

## BEFORE / AFTER

| metric | main `0610806` (BEFORE) | branch (AFTER) |
|---|---|---|
| phone Home "Top stories" source | TOP_ORDER round-robin **+** State-of-Play card (the **double dip** — both from the same pool) | **ONE** `selectTopStories` list; SoP card + round-robin **deleted** |
| phone lead | 16:9 hero image + headline | **text-first** — no hero image on phone (kept ≥641); 0 lead-image network at 390 |
| row anatomies per page | up to 5 (title sizes 13/14/15/16/18/30, meta 11/12/13/15) | **≤3** (LEAD/STANDARD/COMPACT), one `--fs-meta` meta token — locked by conformance |
| phone chrome above first headline @390×844 | 244px (scores band + separate weather band) | **217px** — weather merged into the scores band |
| phone Home CLS (worst band, 20 runs) | 375 ~0.031 | **375 0.015 / 390 0.028** (scores-band reserve killed the 17px shift) |
| Back scroll restore | browser `auto` → lands short (lazy content) | **manual, per-entry** — restores within a couple of px (1352→1352) |
| "N new stories" pill | vestigial (nothing populated `pendingNew`) | **live** on phone Home — staged refresh (0 shift), applies on tap |
| podcast episode features | panel remounts closed; ≥500-char gate; no Explain/Ask/Share | **one shared action set**, no gate, honest source ladder, panel survives re-render |
| initial JS gzip vs main | 180,999 B | **179,833 B (−0.64%**, a net DECREASE) |
| conformance violations (7 pages × 4 bands × light+dark) | 0 | **0** — now also incl. the Z3 row-anatomy gate |

## Machine-gate run (Z6, final build)

```
conformance      — 1148 chip/tile/button elems, 0 violations · ALL CONFORMANT (incl. Z3 ANATOMY)
text-overlap     — 0 unexpected overlaps
empty-box        — 0 empty bordered boxes
touch-mode       — ALL PASS (≥44px hit on hover:none)
contrast         — 7127 text leaves, 0 failures
layout-polish    — 0 failures
fixed-overlap    — 0 overlap/launcher failures, 0 console errors
o7-hero-contrast — ALL PASS
p5-sports-index  — ALL PASS
sop-up-front     — ALL PASS
sports-dedup     — ALL PASS
detect           — 37/37
check:tokens     — PASS (inline styles 223→218; all ratchets ≤ baseline)
CLS (20 runs)    — Home 390 max 0.028 / 375 max 0.015 (≤0.03)
initial JS gzip  — 179,833 B = −0.64% vs main (≤ +0.5%)
```

## Screenshots

Captured at 390 / 820 / 1194 / 1440 for Home / Business / Sports, light + dark
(24 shots). The phone Home 390 shot shows the whole Batch-Z intent on one screen:
the merged scores+weather band, the text-first lead, the single "TOP STORIES" list
with one COMPACT row format, and the bottom tab bar. (Fixtures, so content is
representative, not live; Safari = NEEDS-DEVICE.)

## Honest caveats

- The literal spec phrase "single shared AiPanel component" (Z5) was delivered as
  **feature parity** — the podcast panel was brought to the same action set / source
  ladder / preview labelling as articles — rather than by extracting one shared
  component out of App.jsx's article panel. Same behaviour, not one file.
- Bottom-tab-bar (Z4) was **propose-only**: a 5-slot bottom bar already ships, so the
  doc records two refinements to weigh rather than new work.
- Real-device Safari/WebKit and live feeds remain **NEEDS-DEVICE** (sandbox has no
  WebKit and no feed egress).
