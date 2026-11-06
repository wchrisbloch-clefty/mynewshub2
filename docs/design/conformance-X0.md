# X0 — UI conformance audit (one look for every category and sub-category)

Enumerated FROM THE CONFIG (`CATS` at `src/App.jsx:100`, plus the per-page sub-topic arrays), not
hard-coded. For each category and sub-category this lists which chip / tile / button / band / row /
label / status component renders, and at which breakpoints. The machine check is
`test/visual/conformance.test.mjs` (equivalence classes by computed style). It FAILS on `main` today
and must PASS after X3.

## Device bands (CSS px)
- **Phone ≤640:** 360, 390×844, 390×664, 430.
- **iPad / tablet 641–1280:** 820, 1024, 1100, 1180, 1194×834, 1280.
- **Desktop ≥1281:** 1440, 1680.

## Categories (from `CATS`, `src/App.jsx:100`)

| key | label | nav band | sub-topics / tiles |
|---|---|---|---|
| general | News | main nav | — (Home is the mixed feed) |
| business | Business & Markets | main nav | chips: All / Business / Markets (merged biz+finance) |
| finance | Markets | folded into Business | — |
| bloom | Energy | main nav | Power, Oil & Gas, Clean Energy, Markets, Policy |
| tech | AI & Tech | main nav | (sub-topics if any) |
| sports | Sports | main nav | league tiles + "My Teams" team chips |
| popculture | Pop Culture | More | (sub-topics if any) |
| comedy | Comedy | More | — |
| health | Health & Longevity | More | (sub-topics if any) |

Also surfaced: Briefing, Search filters, Customize-sheet chips, topic keyword pills, Voices.

## Sub-topic systems (from config arrays)

| system | array (file:line) | render | class | look on main |
|---|---|---|---|---|
| Business chips (All/Business/Markets) | inline literal, `App.jsx:9275-9281` | reuses Sports pill | `.sport-tab` | **old** (grey fill + bevel) |
| Energy sub-topics | `EN_SUBTABS` `App.jsx:8927-8934` | `.pc-subtabs.en-subtabs` | `.pc-subtab` | new outline (but 12px off-scale) |
| Pop Culture sub-topics | `PC_SUBTABS` `App.jsx:8913-8919` | `.pc-subtabs` | `.pc-subtab` | new outline (12px off-scale) |
| Sports league tiles | `SPORT_TABS` `SportsPage.jsx:234-244` | `.sport-tabs.sport-index` | `.sport-tab` | **old** |
| Sports "My Teams" chips | followed teams `SportsPage.jsx:311-322` | `.my-teams-ribbon` | `.sport-tab` | **old** |
| Sports team-chip rail | `TEAM_CHIPS` `App.jsx:454-460` | `SportsPage.jsx:325-340` | `.sport-tab` | **old** |
| Sports "My Teams" shelf | `App.jsx:518-556` | `.teams-shelf` | `.team-card` | own look |
| Topic keyword pills | `catKws` | `App.jsx:9557-9569` | `.kw-chip` | new (hit <44 on phone) |
| Trending pills (rail) | — | `App.jsx:7348-7368` | `.ttp-chip` | new outline |
| Customize briefing chips | `CustomizePanel.jsx:455-459` | — | `.cp-briefing-src` | — |
| Briefing source pills | `App.jsx:6732-6733` | — | `.briefing-src-pill` | new outline |
| Search active filters | `App.jsx:9400-9401` | — | `.active-filter-chip` | new outline |
| Voices tiles | `VoicesStrip.jsx:35-43` | — | `.voices-tile` | own look |

Health, AI & Tech, Comedy route through the generic `FeedPage` (`App.jsx:8869`) with **no** sub-topic
chips. "More" is a nav overflow sheet (Briefing/Podcasts/Sources/Saved, `.more-sheet-item`). There are
no World / Opinion / Science / Local *categories* in `CATS` (Opinion is a per-story badge; Local is the
Houston row). So the full set of sub-topic chip systems is the table above — all migrated in X3.

**The core inconsistency:** four "secondary pill" rules — `.pc-subtab`, `.ttp-chip`, `.kw-chip` (the
new outline look) and **`.sport-tab`** (the old look: `background:var(--surface2)`, `1.5px` border,
`box-shadow` on active, fixed `16px` radius, `12px/700` off-scale). `.sport-tab` backs the Business
chips AND every Sports tile/team chip — it is the main C1 offender. Secondary buttons use three radius
values (`.snap-ask/.snap-save` 8px vs `.nav-btn-*` `--radius-md` vs `.page-customize-btn` no border).

## X2b — topic-label root cause (for the audit record)

There is **no content classifier** for ordinary feed articles. A story's `.cat` is stamped = the
category of the feed it was fetched from (`loadCat` `App.jsx:10051`; poll `:10072`; wide-discovery
`:8979`), or an explicit per-feed `cat:` override (`App.jsx:1417-1430`, e.g. On3/NIL forced
`cat:'sports'`, EnergyWire/ERCOT forced `cat:'business'`). `TopicTag` (`modules/topic-tag/index.jsx`)
renders that stored `a.cat` verbatim, only on mixed surfaces (Top Stories strip + State of Play rows);
`FeedCard` rows show the matched keyword, not the category. So a tornado story from **The Spun** reads
SPORTS because The Spun sits in `feeds.sports` → `cat:'sports'`. Fixed in X2b with existing utilities
only; see the report.

## Component families and their CURRENT look (main)

The conformance scanner groups interactive elements into equivalence classes and checks each by
computed style. Confirmed on `main`:

| family | selector(s) | current look on main | target (X3) |
|---|---|---|---|
| sub-topic chips (Business, Energy, etc.) | `.sport-tab`, `.chip`, `.pill` | **grey fill `rgb(237,237,234)` + `box-shadow` bevel + 12px off-scale** (Business/Sports) vs transparent outline (Energy) | `Chip`: transparent, 1px `--border`, radius-full, 13/500, no shadow, selected = accent fill |
| Sports league tiles / team chips | `.sport-tab`, `.team-card`, (tile classes) | grey fill / bevel (old) | `Tile`: same border/bg/shadow rules, radius-md, grid ≥641 |
| secondary buttons | `.sport-league-all-btn` ("Show all N"), `.see-all`, `.load-more` | grey-filled "Show all 5" | `SecondaryButton`: 1px `--border`, transparent, radius-md |
| scores band | `.status-strip`, `.ss-ticker`, `.topbar-scores` | fill + separators | `Band`: no fill, no shadow, hairline bottom |
| status pills | `.last-updated`, `.feed-degraded` | already 1px border/no fill, but **36px tall on phone** (`@media(max-width:640px){.last-updated{min-height:36px}}`) | `StatusPill`: 32px, same as chip |
| section rules | (dividers under TOP STORIES / STATE OF PLAY) | heavier than box borders in places | one `--border` 1px rule |

_(The detailed per-site `file:line` map — every render site and the exact migration target — is
compiled below from the X0 component sweep.)_

## Machine check — `test/visual/conformance.test.mjs`

For each category page × device band × light/dark it asserts:
- **(a) chip / tile:** rest background transparent; 1px `--border`; `box-shadow:none`; no gradient;
  font-size on the type scale (11/13/14/16); selected = accent fill + `--on-accent`; ≥44px hit on
  `(hover:none)`; pills radius-full, tiles radius-md.
- **(b) secondary button:** same border / bg / radius.
- **(c) band:** no fill, no shadow, hairline bottom.
- **(d)** no `box-shadow` on any non-overlay element (sheets / toasts / modals / chat panel allowed).
- **(e)** status pills same visual height as chips (≤34px).
- **(f)** section rule = 1px `--border`.

### Failing output on `main`

`CONFORMANCE — 1196 chip/tile/button elems checked, **940 violations**` across 7 pages × 4 bands ×
light/dark. Top offenders (deduped):

```
<.sport-tab>            rest-bg-not-transparent: rgb(237, 237, 234)   (Business chips + Sports tiles)
<.sport-tab.active>    box-shadow: rgba(17, 17, 19, 0.04) 0px 1px     (bevel)
<.sport-tab>            font-size-off-scale: 12 not in 11/13/14/16
<.page-customize-btn>  no-1px-border: bw=0 ;  font-size-off-scale: 12
<.last-updated>         status-pill-too-tall: 44px                     (phone min-height, C2)
<.pc-subtab>            font-size-off-scale: 12                        (Energy / Pop Culture chips)
<.sop-showall>          rest-bg-not-transparent ;  <.sop-fullview> no-1px-border
<.kw-chip>              hit<44: 27                                     (keyword pill touch target)
<.snap-ask>/<.snap-save> hit<44: 40
```

Must reach `ALL CONFORMANT` after X3. The full run is pasted in `docs/verification/batch-X-report.md`.
