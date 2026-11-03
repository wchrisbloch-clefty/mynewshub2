# Batch M — M0: audit confirmation ("before" numbers, main @ 390px)

Measured on `main` (b55c5a1, includes #78) at 390×844, mobile emulation, with route-interception
fixtures (per-category feed with/without images, long titles, duplicates, a breaking item, live +
scheduled scores). Playwright headless. These are the baseline the mobile commits improve on.

> **Audit file note:** `mynewshub2-audit-and-mobile-plan.md` (the A1–A12 findings) is **not present**
> in the repo or workspace. These measurements re-derive the mobile "before" state directly; the
> M*/P* items below are executed from the finding descriptions embedded in the Batch M brief.

## Header + chips (sticky vs scroll-away)
| element | height |
|---|---|
| `.header-scroll` (scores + markets + weather, scrolls away) | 151px |
| `.topbar-wrap` (sticky: mobile-header 48 + chip-bar 44) | **93px** |
| `.chip-bar` | 44px |
| total header footprint at scroll 0 (`stickyBottom`) | 244px |

The sticky header is already ≤100px (93px). The 151px scroll-away scores/markets/weather block sits
**above** the sticky nav, so it dominates the first viewport before any content.

## Bottom tab bar
- Tabs (5): **Home / Feed / Sources / Saved / More** — all **inline `<svg>`** (not lucide).
- Label font size: **8.5px** (target ≥11px).
- Bar height 56px; each tab 55px tall.

## Sub-44px tap targets (390px, Home with content)
| selector | count | min size |
|---|---|---|
| `a.social-handle` | 13 | 46×21 |
| `a.src-footer-link` | 13 | 38×19 |
| `button.snap-save` | 4 | 32×44 |
| `button.mobile-icon-btn` | 3 | 40×40 |
| `button.sidebar-sec-collapse` | 3 | 366×13 |
| `button.home-scores-see-all` | 1 | 44×11 |
| `button.mobile-icon-btn.mobile-ticker-toggle` | 1 | 40×40 |
| `button.last-updated` | 1 | 145×36 |
| `button.page-customize-btn` | 1 | 77×40 |
| `button.xp-trigger` | 1 | 366×35 |

## Layout shift (CLS) with fixtures
Images in the fixtures are inline data-URIs (load instantly), so these numbers capture
**layout/module-mount** shift, not slow-image shift; before/after use the same fixtures so the
comparison is fair. Measured via `PerformanceObserver('layout-shift')`.

| page | CLS |
|---|---|
| Home | **0.00** |
| Business | **0.201** |

**On the audit's CLS claim (evidence):** the brief cites "0.09–0.15" on mobile Home/Business.
Re-measured with real feed content, **Home is 0.00** (Top Stories/State-of-Play reserve their space)
while **Business is 0.201** — worse than the cited range, driven by the duplicated State-of-Play DOM
(`.sop-hoist` + `.sop-mobile`) and the markets strip mounting above content. The finding's direction
holds for category pages; Home is already fine. Target after M4: ≤0.05 on Home and every chip page.

(An earlier draft of this doc reported Home 0.27 / Business 1.38; those were measured before the
test fixtures served feed data, so they reflected skeleton→empty-state churn, not real content, and
are superseded by the numbers above.)
