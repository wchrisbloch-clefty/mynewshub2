# Batch Y — per-category / per-surface re-verification matrix (Y6)

Every category and sub-topic chip/tile/label/lead/image system re-checked across all device bands,
light + dark, by the reusable suites, after the Batch-Y changes. A cell is **PASS** when the machine
gate passed for that surface; the gate that proves it is named in the column header. No category is
silently skipped.

Gates: **chip/tile/status/band/section-rule** = `conformance.test.mjs` (0 violations, incl. the Y2
sticky-band + scores-card fill/shadow checks); **lead skeleton / ghost actions** = `SnapshotCard` +
`conformance` (ghost `.snap-lead-act` not in the button class, 0 violations); **image slots** =
`image-slots.test.mjs` + `detect.test.mjs` (0 generic-card / 0 blank / strict detection 37/37);
**label rule** = Y4 audit (`labelConfirmed`/`kwMatch`, desktop only — phone reported STOP);
**dedupe** = `dedupe-label.test.mjs`; **overlap** = `text-overlap` + `fixed-overlap`; **Show-all row /
foot** = `StateOfPlay` one-row foot.

| category / sub-topic | chip look | tile look | status pill | scores band | lead | label rule | image slots | overlap |
|---|---|---|---|---|---|---|---|---|
| **News** (general / Home) | PASS | — | PASS | PASS (home strip flat, Y2) | PASS (skeleton parity; ghost Ask/Save) | PASS (desktop kwMatch-verified; phone STOP, reported) | PASS | PASS |
| **Business & Markets** | PASS | PASS | PASS | — | PASS | PASS | PASS | PASS |
| **Energy** (Power/Oil&Gas/Clean/Markets/Policy) | PASS | — | PASS | — | PASS | PASS | PASS | PASS |
| **AI & Tech** | PASS | — | PASS | — | PASS | PASS | PASS | PASS |
| **Sports** (league tiles + My Teams chips) | PASS | PASS (radius-md) | PASS | PASS (flat `--bg`, no shadow/bevel — Y2; chrome ≤300 @390, Y1) | PASS (hero full-bleed on phone, Y2) | PASS | PASS | PASS |
| **Health & Longevity** | PASS | — | PASS | — | PASS | PASS | PASS | PASS |
| **Pop Culture** (Shows/Music/Books/Comedy) | PASS | — | PASS | — | PASS | PASS | PASS | PASS |
| **Comedy** (folds into Pop Culture) | PASS | — | PASS | — | PASS | PASS | PASS | PASS |
| topic keyword pills (`.kw-chip`) | PASS (44px hit) | — | — | — | — | — | — | PASS |
| trending pills (`.ttp-chip`) | PASS | — | — | — | — | — | — | PASS |
| Briefing source pills (`.briefing-src-pill`) | PASS | — | PASS | — | PASS (thumbs via SourceImage) | — | PASS | PASS |
| Search filters (`.active-filter-chip`) | PASS | — | — | — | — | — | — | PASS |
| Customize chips (`.cp-briefing-src`) | PASS | — | — | — | — | — | — | PASS |
| Voices tiles (`.voices-tile`) | PASS | PASS | — | — | — | — | — | PASS |

**Secondary buttons** (one row, every page): Show all N, Open full view, Ask, Save, Customize,
Analyze, Load more — all on the one SecondaryButton look per `conformance.test.mjs`. On the phone lead,
Ask/Save are the Y1.2 **ghost icons** (`.snap-lead-act`) — a deliberate hero affordance, outside the
SecondaryButton equivalence class, so conformance is unaffected.

**State of Play foot** (phone Home + SoP card): "Show all N" + "Open full view →" on ONE 44px row
(Y1.4), not stacked.

**Scores band** (Sports / Home): flat page-canvas fill, no shadow/bevel, hairline bottom only (Y2);
a scheduled card shows its kickoff time, never "—" (X5c, unchanged). Sports chrome ≤ 300px at 390×844
(Y1).

**Images:** every cover/thumb/lead goes through the one `SourceImage`/`detect` path; a generic
fallback-card URL (exact host+path/filename shape, Y3.2) renders no image (text-only row or `--navy`
lead block); a legit photo whose media id merely contains "default" renders normally.

Items reported as partial/stop (and why), detailed in `batch-Y-report.md`: **Y1** lead dead-gap +
breaking-strip-top (held at the main floor — dropping it amplifies the out-of-scope breaking-slot CLS
spike, R2) and the Sports team-chip-into-league-scroller merge (≤300 target already met); **Y4** the
phone-Home label-confirmation extension (64–78% suppression > 20% → STOP, needs a real classifier).
None is a conformance or overlap failure.
