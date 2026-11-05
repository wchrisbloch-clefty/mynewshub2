# Batch U — U0 design-system audit (BEFORE baseline)

Branch off `main` (PR #83 / Batch T merged). No behaviour change in this commit — this is the
measurement the Batch U ratchet (U1) guards and the BEFORE column for U9. Regenerate with
`node scripts/token-audit.mjs --summary`; machine counts in `scripts/token-baseline.json`.

## (a) Token-bypass counts (src/, excluding tokens.css for hex)

| metric | count | notes |
|---|---|---|
| distinct hex literals outside `tokens.css` | **64** | target: drive toward tokens; ratchet forbids increase |
| inline `style={{` | **246** | ratchet forbids increase |
| distinct `font-size` px literals | **26** | 7, 8, 9, 10, 10.5, 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 21, 22, 24, 26, 27, 28, 30, 32, 34, 36 |
| …of which **< 11px** | **5** (7×3, 8×11, 9×62, 10×134, 10.5×1 = **211 uses**) | U6 raises the floor to 11 |
| distinct `border-radius` px literals | **17** | 1,2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,999 — ratchet will allow only {0,4,8,12,9999} |
| distinct `font-weight` values | **7** | 300×1, 400×10, 500×33, 600×90, 700×199, 800×114, 900×19 (U-spec wants 400/500/600, 700 for wordmark) |
| `!important` | **20** | ratchet forbids new ones |

## (b) Where a category / sub-topic ICON renders (all lucide unless noted)

| surface | symbol / file | icon | viewport | note |
|---|---|---|---|---|
| **Energy sub-topic chips** | `EN_SUBTABS` (App.jsx ~8859), rendered ~9213 `<t.icon size=14 strokeWidth=2.2>` | LayoutGrid/Zap/Droplet/Leaf/TrendingUp/Scale | all | **CB #1** — icon per chip |
| **Pop-culture sub-topic chips** | `PC_SUBTABS` (~8845), rendered ~9267 | LayoutGrid/Film/Music/BookOpen/Laugh | all | same pattern |
| **Sports league chips** | `SPORT_TABS` (SportsPage), `.sport-tab` `<t.icon size=14>` | Trophy on "All" only | all | one icon (acceptable) |
| Header utility buttons | `.nav-icon-btn` etc. | Search/RefreshCw/Moon/User | ≥641 | keep (icons w/o words) |
| More sheet | `MenuSheet` | **emoji**, not lucide | ≤640 | replace w/ CatIcon or keep text |
| Customize sheet | `CustomizePanel` `.cp-chip-x` | XIcon 13 | all | keep (controls) |
| Ask / Save | SnapshotCard / StateOfPlay | inline `<svg>` | all | keep |
| Sports team pills | `TeamLogo` | logo/initials | all | keep |

Chip icon sizes/strokes are ad-hoc (`size=14 strokeWidth=2.2`, `size=13`, `size=16`) → U3 unifies on one `CatIcon`.

## (c) Where a category colour (`cc.color` / `--cat-*`) is applied

| place | selector / line | on a… | verdict |
|---|---|---|---|
| **feed source name** | `.fc-source style={{color:cc.color}}` (App.jsx ~6347) | **source name** | **DEFECT (CB #3)** — U3 moves source to `--text3` |
| feed topic tag | `.fc-topic {background:cc.bg,color:cc.color}` (~6354) | label-ish chip | ok-ish; becomes TopicLabel |
| Perspectives kicker | `.persp-kicker {color:cc.color}` (~8736) | label | ok (a label) |
| active-keyword chip | inline `{background:cc.bg,color:cc.color}` (~9326, 9490) | filter chip | ok (chip) |
| stats category chip | `.stats-cat-chip {background:cc.bg,color:cc.color}` (~10495) | chip | ok (chip) |
| ENERGY lead-photo label | amber `--cat-bloom-text` over the dark lead image | **label on photo** | **weak contrast (CB #3)** — U3 uses `--on-media` |
| TopicTag (S13) | `.topic-tag {color:var(--cat-X-text)}` | label | correct (the model to extend) |

**category colour on a source name, a button, a background, or body text:** only the source name
(the defect above). Everything else is on a label or a chip.

## (d) Distinct "pill / chip / badge", icon-button, and secondary-button looks

**Pill/chip looks (distinct):**
1. `.chip` (mobile category chip) — border + fill, pill radius.
2. `.pc-subtab` / `.en-subtab` (sub-topic) — border + fill + **icon**; active = **hardcoded `#db2777`** (pop) / `--accent` (energy).
3. `.sport-tab` (league/tiles, P5) — outlined tile + count; active navy.
4. `.src-pill` (Sources rail) — dot + name + count.
5. `.sop-item-sources` "N sources" tag.
6. `.cp-chip` (Customize keyword/alert/social) — border + x.
7. status-line pills — eyebrow pill, green-dot "Updated" pill, **peach filled** "N unavailable" pill (CB #5).
8. `.sources-tag`, `.gap-tag`, `.badge`, `.snap-tag`, `.stats-cat-chip` — assorted.

**Icon-button looks (distinct):** header `.nav-icon-btn` (bordered square); `.nav-btn` (bordered);
`.nav-btn-blue` (navy fill); `.page-customize-btn` (gear). → CB #2: three looks + two navy fills.

**Secondary-button looks (distinct):** Analyze (grey fill), Customize (navy fill), Ask/Save (ghost
/ boxed). → U4 unifies to ONE secondary style (1px border, transparent, navy only on the active nav pill).

## Defects named by CB (to fix in U3–U6)
1. sub-topic chips are busy (icon + fill + border) → U3 text-only.
2. three header button looks, two navy fills → U4 one language.
3. source names amber (category colour); ENERGY label weak on photo → U3.
4. State of Play box-in-box; first row heavier; comment icon each → U5.
5. status line: three pill styles, peach fill, second Customize → U5.
6. a feed-row headline renders ~26px sans bold, larger than the ~20px serif Top Stories → U5 (hierarchy).
7. sub-11px uppercase (tagline, markets label) → U6 floor.
