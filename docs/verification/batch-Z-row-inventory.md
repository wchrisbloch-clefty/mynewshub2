# Batch Z · Z3 — Row anatomy inventory & the collapse to THREE

Goal: every list row on every page is ONE of three token-driven anatomies —
**LEAD**, **STANDARD** (headline + thumbnail + meta), **COMPACT** (headline +
meta, no thumbnail). This document inventories every row that renders a
story / episode / item in a list, maps it to one of the three, and records the
token unification applied so the three are genuinely token-driven (not just
"looks about the same").

Font tokens (src/styles/tokens.css): `--fs-lead` 22→26 · `--fs-headline`
16→18 · `--fs-subhead` 14→16 · `--fs-title` 15 (fixed) · `--fs-body` 13→15 ·
`--fs-meta` 11→13 · `--fs-label` 11 (fixed, UPPERCASE eyebrows/kickers only).

## The three anatomies (computed-style signature)

The conformance scanner (`test/visual/conformance.test.mjs`, ANATOMY block)
classifies every live story-row by two computed properties:

| Anatomy   | Title tier (largest text leaf) | Thumbnail? | Meta line |
|-----------|--------------------------------|------------|-----------|
| **LEAD**    | ≥ 20px (`--fs-lead`+)         | optional (hero) | `--fs-meta` |
| **STANDARD**| 13–18px                        | **yes**    | `--fs-meta` |
| **COMPACT** | 11–18px                        | **no**     | `--fs-meta` |

Rules the scanner asserts, for every category × {phone, iPad, desktop} ×
{light, dark}:
1. every story-row classifies into exactly one of the three (title in a valid
   tier; no 19–21px "tweener" titles);
2. its meta line resolves to the **`--fs-meta`** token (the ONE meta rule — a
   row may not use `--fs-label` for source·time meta; `--fs-label` is reserved
   for UPPERCASE category eyebrows/kickers);
3. the set of distinct anatomies present on a page is a subset of
   {LEAD, STANDARD, COMPACT}, i.e. **≤ 3 anatomies per page**.

LEAD vs the rest is title-size; STANDARD vs COMPACT is the **thumbnail** (the
two tiers overlap in title size on purpose — the thumbnail is the discriminant,
so the headline can stay the same size whether or not an image is present).

## Inventory — every live row, mapped

### Shared primitives (used across pages)
| Component / class | File | Page(s) | Anatomy |
|---|---|---|---|
| `FeedCard` `.fc` (thumb 160×107, title `--fs-title`) | App.jsx:6387 / CSS :2129 | FeedPage (all cats), Sports list | STANDARD |
| `SnapshotCard` `.snap-lead-hero` / `.snap-lead-noimg` | modules/snapshot-card | MobileHome lead, Sports team feed | LEAD |
| `SnapshotCard` `.snap-card` (thumb 112×84, title 16–18) | modules/snapshot-card | MobileHome section row-1 & Houston, Sports | STANDARD |
| `StateOfPlay` `.sop-item` (boxed, no thumb, title `--fs-body`) | modules/state-of-play | desktop/iPad rail, SoP page, Sports | COMPACT |

### Desktop / iPad Home (`FeedPage`)
| Row | File | Anatomy |
|---|---|---|
| `TopOfHourStrip` `.toh-card-lead` (16:9 overlay, `--fs-lead`) | App.jsx:8826 | LEAD |
| `TopOfHourStrip` `.toh-compact-row` (thumb 112×84, `--fs-subhead`) | App.jsx:8852 | STANDARD |
| `TopOfHourStrip` `.toh-text-row` (no thumb, `--fs-subhead`) | App.jsx:8841 | COMPACT |
| `HoustonRow` `.houston-card` (16:9 top image, `--fs-body`) | App.jsx:8711 | STANDARD (rail card) |
| `AcrossHub` `.gf-item` (thumb 80×60) | App.jsx:8736 | STANDARD |
| `.sb-across-item` (no thumb, `--fs-body`) | App.jsx:7400 | COMPACT |
| `.trend-row` (num + title + src) | App.jsx:7337 | COMPACT |

### MobileHome (phone ≤640)
| Row | File | Anatomy |
|---|---|---|
| `SnapshotCard` lead (text-first on phone) | MobileHome.jsx | LEAD |
| `SnapshotCard` section row-1 | MobileHome.jsx:115 | STANDARD |
| `CompactRow` `.mh-compact` (Top-stories, section rows 2-3, Podcasts) | MobileHome.jsx:60 | COMPACT |
| `.mh-brk-row` (breaking one-liner strip) | MobileHome.jsx | COMPACT (strip) |

### Sports / Podcasts / State of Play
| Row | File | Anatomy |
|---|---|---|
| `.sports-hero` | SportsPage.jsx:439 | LEAD |
| `.gn-card` in `.gn-row` (thumb 92×64) | SportsPage.jsx:472 | STANDARD |
| `.web-result` (no thumb) | SportsPage.jsx:503 | COMPACT |
| `PodCard` `.pod-card` (episode, no thumb, title `--fs-body`) | PodcastsPage.jsx:89 | STANDARD→COMPACT* |
| `.sop-item` (SoP page) | StateOfPlayPage.jsx:54 | COMPACT |

\* `.pod-card` has no thumbnail, so by the thumbnail discriminant it is COMPACT;
it carries an action bar but that does not change its row anatomy.

## Token unification applied (Z3)

The change needed to make the three anatomies token-driven was the **meta
line**: several row types used `--fs-label` (fixed 11px) for their source·time
meta instead of the `--fs-meta` meta token (11→13px), so on desktop their meta
was a different size from `.fc`/`.sop-item`/`.mh-compact`. The conformance
ANATOMY block (one-meta-token rule) flagged every one across the cat × band ×
theme grid; all were unified to `--fs-meta`:

- `.houston-card-meta` (App.jsx:1771)
- `.sb-across-src` (App.jsx:2492)
- `.trend-src` (App.jsx:2524)
- `.pod-meta` (App.jsx:2942)
- `.gn-card-meta` (App.jsx:5368)
- `.toh-card-lead .toh-meta` (App.jsx:5794)
- `.sports-hero-source` (App.jsx:3644) — LEAD source leaf
- `.gn-card-source` (App.jsx:3154, 5107, and the `.business`/`.finance` mono
  override 4856) — STANDARD source leaf
- `.sop-sidebar .sop-item-time` (StateOfPlay.css:62) — COMPACT time leaf in the
  rail

(The base `.sop-item-time`, `.snap-source`/`.snap-time`, `.fc-source`/`.fc-date`
and `.mh-compact-meta` already used `--fs-meta` — the stragglers were the rail
and page-local variants.)

Title tiers already map cleanly: LEAD titles are all ≥22px (`--fs-lead` and the
no-image lead clamp), STANDARD/COMPACT titles all fall in 13–18px
(`--fs-title` / `--fs-subhead` / `--fs-body`), and the thumbnail separates the
two. No "tweener" (19–21px) title exists, so nothing needed resizing.

## Dead / legacy row CSS (defined, no JSX call site — not rendered, excluded
from the live scan; candidates for deletion in the bundle pass Z7)

`.gn-lead` / `.gn-lead-solo` (App.jsx:3092, 4795) · `HeroBand`
`.hero-band-*` (App.jsx:7920) · `TodayItem` `.today-item` (App.jsx:6622) ·
`TrendingCarousel` `.trending-card` (App.jsx:7783). The `.rn-item` /
`RightNowStrip` (App.jsx:7708) is an inline ticker, not a headline+meta list
row, so it is excluded by design.
