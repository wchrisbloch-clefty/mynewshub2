# Batch X — per-category / per-sub-category conformance matrix (X8)

Every category and sub-topic chip/tile system from the config (`CATS` + the
`EN_SUBTABS`/`PC_SUBTABS`/`SPORT_TABS`/`TEAM_CHIPS` arrays — see
`docs/design/conformance-X0.md`), checked across all device bands, light + dark, by the reusable
suites. A cell is **PASS** when the machine gate passed for that surface; the gate that proves it is
named in the column header. No category is silently skipped.

Gates: **chip/tile/status/section-rule** = `conformance.test.mjs` (0 violations / 1,128 elements);
**label rule** = `dedupe-label.test.mjs` (0 redundant category labels on a category page) + the X2b
kwMatch verification on mixed surfaces; **dedupe** = `dedupe-label.test.mjs` (one story per page);
**image slots** = `image-slots.test.mjs` (0 generic-card / 0 naturalWidth-0 / 0 empty indent);
**fixed overlap** = `fixed-overlap.test.mjs` (no floating element over text); **lead / row** =
the shared `SourceImage` + `SnapshotCard`/`HeroBand` + `FeedCard` row path.

| category / sub-topic | chip look | tile look | status pill | label rule | lead | row type | dedupe | image slots | fixed overlap |
|---|---|---|---|---|---|---|---|---|---|
| **News** (general / Home) | PASS | — | PASS | PASS (mixed, kwMatch-verified) | PASS (navy fallback) | text-only when no img | PASS | PASS | PASS |
| **Business & Markets** (chips All/Business/Markets) | PASS (was `.sport-tab` grey → outline) | PASS | PASS | PASS (0 redundant "Business & Markets") | PASS | PASS | PASS | PASS | PASS |
| **Energy** (Power/Oil&Gas/Clean Energy/Markets/Policy) | PASS (`.pc-subtab`, 13px) | — | PASS | PASS (0 redundant "Energy") | PASS | PASS | PASS | PASS | PASS |
| **AI & Tech** | PASS (generic FeedPage, no subtabs) | — | PASS | PASS (0 redundant "AI & Tech") | PASS | PASS | PASS | PASS | PASS |
| **Sports** (league tiles + My Teams chips) | PASS (`.sport-tab` outline) | PASS (radius-md, zero-count hidden) | PASS | PASS (0 redundant "Sports") | PASS | PASS | PASS | PASS | PASS |
| **Health & Longevity** | PASS (generic FeedPage) | — | PASS | PASS (0 redundant "Health") | PASS | PASS | PASS | PASS | PASS |
| **Pop Culture** (Shows/Music/Books/Comedy) | PASS (`.pc-subtab`, 13px) | — | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Comedy** (folds into Pop Culture subtab) | PASS | — | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| topic keyword pills (`.kw-chip`) | PASS (44px hit) | — | — | — | — | — | — | — | PASS |
| trending pills (`.ttp-chip`, rail) | PASS | — | — | — | — | — | — | — | PASS |
| Briefing source pills (`.briefing-src-pill`) | PASS | — | PASS | — | PASS (thumbs via SourceImage) | — | — | PASS | PASS |
| Search filters (`.active-filter-chip`) | PASS | — | — | — | — | — | — | — | PASS |
| Customize chips (`.cp-briefing-src`) | PASS | — | — | — | — | — | — | — | PASS |
| Voices tiles (`.voices-tile`) | PASS | PASS | — | — | — | — | — | — | PASS |

**Secondary buttons** (one row, every page): Show all N, Open full view ("See all >" link), Ask,
Save, Customize, Analyze, Load more — all on the one SecondaryButton look (1px `--border`,
transparent, radius-md) per `conformance.test.mjs`.

**Scores band** (Sports / Home): no fill-shadow bevel; a scheduled card shows its kickoff time, never
"—" (X5c).

No category could not comply. The only items reported as partial (and why) are in
`docs/verification/batch-X-report.md`: X4b one-`<Lead>`-component consolidation, X5a dead-gap floors
(CLS-limited), X5b/d/e (phone lead ghost icons / Sports chrome merge / Show-all row) — none of which
is a conformance failure; they are layout refinements beyond the gate set.
