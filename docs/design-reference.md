# MyNewsHub2 — Curated Design Reference

> **Source:** selected rows from [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> (`src/ui-ux-pro-max/data/*.csv`, commit `f3ac195`). The full skill and its CLI are **not** installed —
> this is a hand-picked static reference of only the parts relevant to a Vite + React news aggregator.

## How to use this file

**Before any future UI / layout prompt, check this file for a relevant rule first** — rather than
re-deriving best practice from scratch or waiting for a bug report. It is a **lookup / checklist** to
consult when relevant, **not** something to re-read cover to cover each time.

The repo's own `src/styles/tokens.css` and existing conventions remain the **source of truth**. Sections 1–3
below are **comparison references only** — captured so a future "should we change X?" question has a concrete
external data point to weigh against, not a mandate to switch. Section 4 (UX rules) is the operative part:
those are the ones to actually apply.

---

## 1. Product design system reference

From `products.csv`, rows 66 (News/Media Platform) and 67 (Magazine/Blog):

| Field | News/Media Platform (row 66) | Magazine/Blog (row 67) |
|---|---|---|
| Keywords | content, entertainment, media, news, platform, streaming, video | articles, blog, content, magazine, posts, writing |
| Primary style | **Minimalism & Swiss Style + Flat Design** | Swiss Modernism 2.0 + Motion-Driven |
| Secondary styles | **Dark Mode (OLED)**, **Accessible & Ethical** | Minimalism & Swiss Style, Aurora UI |
| Landing pattern | **Hero-Centric Design + Feature-Rich** | **Storytelling-Driven + Hero-Centric** |
| Dashboard style | Media Analytics Dashboard | Content Analytics |
| Color focus | Brand colors + High contrast + Category colors | Editorial colors + Brand primary + Clean white |
| Key considerations | Article layout · Breaking news · Categories · Search · Subscription · Mobile reading · Fast loading | Article showcase · Category navigation · Author profiles · Newsletter signup · Related content · Typography-focused |

**Combined core-feature checklist** (both rows): article layout · breaking news · categories · search ·
subscription · mobile reading · fast loading · author profiles · newsletter signup · related content ·
typography-focused.

**Why this is here:** it independently confirms the direction the repo already took — Swiss/minimal + flat,
first-class dark mode (`tokens.css` treats dark as a peer, not an inversion), high contrast, and **category
colors** (our per-category badges, incl. the Pass L Energy subsectors). "Breaking news" as a named pattern
maps to our `--red` signal-only token and the breaking ticker. Treat the feature list as a coverage checklist
when scoping new work (e.g. author profiles / newsletter signup are on the list but light in the app today).

---

## 2. Color palette reference (comparison only — do NOT switch to it)

From `colors.csv`, row 66 (News/Media Platform) — the **full token set**, captured verbatim for comparison:

| Token | Value | | Token | Value |
|---|---|---|---|---|
| Primary | `#DC2626` (breaking red) | | Card | `#FFFFFF` |
| On Primary | `#FFFFFF` | | Card Foreground | `#450A0A` |
| Secondary | `#EF4444` | | Muted | `#F0EDF1` |
| On Secondary | `#000000` | | Muted Foreground | `#475569` |
| Accent | `#1E40AF` (link blue) | | Border | `#FECACA` |
| On Accent | `#FFFFFF` | | Destructive | `#DC2626` |
| Background | `#FEF2F2` | | On Destructive | `#FFFFFF` |
| Foreground | `#450A0A` | | Ring | `#DC2626` |
| | | | Notes | Breaking red + link blue |

**Why this is here:** the *philosophy* matches ours — one link-blue accent + a reserved breaking-red — but
the *values* deliberately differ, and that difference is the point of keeping this as a reference, not a target:

- Our `--accent` is a deep editorial blue `#12558c` (theirs is a brighter `#1E40AF`); our breaking `--red` is
  `#c8102e` (theirs `#DC2626`). Both are "restrained blue + signal red," reached independently.
- Their `Background #FEF2F2` is a **pink-tinted red wash**; we deliberately use warm newsprint `#f5f3ee`
  (FT-paper), because a red-tinted ground would make the breaking-red signal compete with the page itself.
- Our tokens stay the source of truth. If a future prompt asks "is our palette too muted vs. category norms?",
  this row is the concrete comparison — brighter primaries + higher-chroma border (`#FECACA`) are the industry
  reference; our lower-chroma warm neutrals are the intentional divergence.

---

## 3. Typography pairing reference (reference point, not an instruction to change fonts)

From `typography.csv`, row 14 — **"News Editorial"**:

- **Headings:** Newsreader · **Body:** Roboto · Category: Serif + Sans
- Mood: news, editorial, journalism, trustworthy, readable, informative
- Best for: news sites, blogs, magazines, journalism, content-heavy sites
- Import: `@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');`
- Note (verbatim): *"Newsreader designed for long-form reading. Roboto for UI."*

**Why this is here:** the app currently pairs **Archivo** (heavy, tight headlines) + **Public Sans / Inter**
(body/UI), with **Playfair Display** as the serif. That's a strong, punchy pairing tuned for scannable
headlines. `Newsreader` is a serif *engineered for long-form reading* — so if we ever add a genuine long-form
reading surface (full article reader, briefing long-read), Newsreader-for-body is the reference worth testing
against Public Sans there. Not a reason to touch the current type scale (`--fs-hero … --fs-meta`) now.

---

## 4. UX guideline rules — the operative section (verbatim)

Extracted from `ux-guidelines.csv`. Columns: **Category · Issue · Severity · Description · Do · Don't ·
Code (Good) · Code (Bad)**. These are the exact cluster of issues this project has already hit and fixed by
hand — keep them as a pre-flight checklist so the *next* one is caught before it ships.

### Row 19 — Layout · Content Jumping — **Severity: High**
- **Description:** Images, badges, validation text and skeleton replacements can shift nearby content when they update.
- **Do:** Reserve appropriate space or keep async states in a stable content-driven container.
- **Don't:** Insert compact text or media without a layout strategy.
- **Code (Good):** `aspect-ratio` for media; stable count slot for badges.
- **Code (Bad):** Badge insertion pushes toolbar actions.
- **Repo tie-in:** exactly the broken-image-placeholder chase — `.toh-img-ph` sits *under* the real image so a
  failed load never collapses the slot; `.snap-thumb`/`.snap-skel-thumb` reserve a fixed box. Skeletons mirror
  card height on purpose. Watch new badges (Pass L Energy subsector, "N new stories") for stable slots.

### Row 65 — Responsive · Breakpoint Testing — **Severity: Medium**
- **Description:** Test at all common screen sizes.
- **Do:** Test at 320, 375, 414, 768, 1024, 1440. — **Don't:** Only test on your device.
- **Code (Good):** Multiple device testing. **(Bad):** Single device development.
- **Repo tie-in:** the Pass K State-of-Play regression (present in DOM, `0×0` hidden at ≤1100px) only surfaced
  because we checked desktop / iPad(820) / mobile(390) independently. Keep the 3-width sweep for any sidebar or
  chip change.

### Row 66 — Responsive · Touch Friendly — **Severity: High**
- **Description:** Mobile layouts need touch-sized targets.
- **Do:** Increase touch targets on mobile. — **Don't:** Same tiny buttons on mobile.
- **Code (Good):** Larger buttons on mobile. **(Bad):** Desktop-sized targets on mobile.
- **Repo tie-in:** `.pc-subtab`/`.sport-tab` bump to `min-height:44px` at ≤640px; keep that floor for the new
  `.ttp-chip` and any future pill.

### Row 67 — Responsive · Readable Font Size — **Severity: High**
- **Description:** Text must be readable on all devices.
- **Do:** Minimum 16px body text on mobile. — **Don't:** Tiny text on mobile.
- **Code (Good):** `text-base` or larger. **(Bad):** `text-xs` for body text.
- **Repo tie-in:** the Pass E font-sizing work. Our `--fs-body` is 13px and `--fs-meta` 11px — **below** this
  16px guidance. That is a deliberate dense-newswire tradeoff, but flag it if a "hard to read on mobile"
  complaint ever lands: headline/lead sizes carry the readability, meta stays compact.

### Row 68 — Responsive · Viewport Meta — **Severity: High**
- **Description:** Set viewport for mobile devices.
- **Do:** Use `width=device-width, initial-scale=1`. — **Don't:** Missing or incorrect viewport.
- **Code (Good):** `<meta name='viewport' …>`. **(Bad):** No viewport meta tag.
- **Repo tie-in:** verify `index.html` keeps this; low-risk but a silent mobile-breaker if dropped.

### Row 69 — Responsive · Horizontal Scroll — **Severity: High**
- **Description:** Avoid horizontal scrolling.
- **Do:** Ensure content fits viewport width. — **Don't:** Content wider than viewport.
- **Code (Good):** `max-w-full overflow-x-hidden`. **(Bad):** Horizontal scrollbar on mobile.
- **Repo tie-in:** the page body must never scroll sideways; *intentional* horizontal scroll is scoped to
  contained rails (`.score-strip-scroll`, `.sport-tabs`, `.mkt-rail-inner`, Houston/`.snap` rows) with their
  own `overflow-x:auto`. New wide content goes in its own scroll container, never the page.

### Row 70 — Responsive · Image Scaling — **Severity: Medium**
- **Description:** Images should scale with container.
- **Do:** Use `max-width: 100%` on images. — **Don't:** Fixed width images overflow.
- **Code (Good):** `max-w-full h-auto`. **(Bad):** `width='800'` fixed.
- **Repo tie-in:** the artifact skeleton sets `img{max-width:100%}` globally; `.snap-thumb` uses a capped
  fixed box with `object-fit:cover` on purpose (headline-forward cards), which is compatible — the cap is the
  container, not the intrinsic image width.

### Row 71 — Responsive · Table Handling — **Severity: Medium**
- **Description:** Tables can overflow on mobile.
- **Do:** Use horizontal scroll or card layout. — **Don't:** Wide tables breaking layout.
- **Code (Good):** `overflow-x-auto` wrapper. **(Bad):** Table overflows viewport.
- **Repo tie-in:** the Markets `.fin-table` (watchlist / movers). Keep any new data table in an `overflow-x`
  wrapper or flip it to the stacked-card treatment the movers already use at ≤1024px.

### Row 113 — Content · Essential Text Truncation — **Severity: Critical**
- **Description:** Headings, actions, errors, safety text and distinguishing names need complete access.
- **Do:** Wrap, stack, resize, or provide a visible full-detail path. — **Don't:** Clamp essential meaning only to make cards uniform.
- **Code (Good):** Action label wraps or opens full details. **(Bad):** Primary action shown only as an unexplained ellipsis.
- **Repo tie-in:** headlines use `-webkit-line-clamp` **but** every clamped card opens the full item (reader /
  Full Coverage), so meaning is never lost to the clamp — that's the "visible full-detail path." Never clamp a
  *button label* or an error to a bare ellipsis.

### Row 114 — Content · Compact Label Semantics — **Severity: High**
- **Description:** Badges communicate state while chips or tags represent values or actions.
- **Do:** Choose static or interactive markup from the label's meaning and ownership. — **Don't:** Make every pill clickable or encode status with color alone.
- **Code (Good):** `<span class='status'>Pending</span>`. **(Bad):** `<div class='pill' onclick='toggle()'>Pending</div>`.
- **Repo tie-in:** distinguishes our **state badges** (category label, `LIVE`, subsector) — static `<span>` —
  from **interactive chips** (`.ttp-chip`, `.pc-subtab`, follow stars) which are/should be buttons. Don't make a
  status badge clickable or a filter chip a bare `<div>`.

### Row 115 — Layout · Chip Collection Reflow — **Severity: High**
- **Description:** Filter chips and editable value collections must preserve labels when space or text size changes.
- **Do:** Wrap the collection, or use an operable `+n` disclosure for hidden overflow. — **Don't:** Force all chips into one clipped row or hide overflow values.
- **Code (Good):** `<div class='chip-list'>{chips}</div>` with `flex-wrap`. **(Bad):** `<div class='chip-list' style='height:32px;overflow:hidden'>`.
- **Repo tie-in:** `.ttp-chips`, `.following-chips` use `flex-wrap:wrap`; the Following module keeps a `+ Add`
  affordance. Keep chip rails wrapping (or add a real `+n` disclosure) — never a fixed-height clipped row.

### Row 116 — Content · Compact Label Overflow — **Severity: High**
- **Description:** A badge/chip/pill label should stay whole on one line when practical and disclose unavoidable truncation.
- **Do:** Bound only unpredictable values; use `nowrap` with a shrinkable label; expose full text to keyboard, pointer and touch. — **Don't:** Let one compact label wrap to a second line or use a hover-only tooltip.
- **Code (Good):** Flexible label with `min-width:0` and an operable full-value disclosure. **(Bad):** Fixed-width badge wraps to a second line or clips with title-only recovery.
- **Repo tie-in:** chips use `white-space:nowrap`; the sidebar State-of-Play/Across rows use `min-width:0` +
  ellipsis. Avoid hover-only (`title=`) as the *only* way to recover a truncated compact label — bad on touch.

### Row 117 — Accessibility · Compact Control Semantics — **Severity: Critical**
- **Description:** Interactive chips need a native role, accessible name, state, keyboard operation, and visible focus.
- **Do:** Prefer a `<button>` and expose pressed/selected state matching the visible label. — **Don't:** Use a clickable div or reveal the only action on hover.
- **Code (Good):** `<button aria-pressed='true'>Open now</button>`. **(Bad):** `<div class='selected' onclick='toggle()'>Open now</div>`.
- **Repo tie-in:** the strongest single upgrade available here — several interactive chips are `<span onClick>`
  (e.g. `.ttp-chip`, `.following-chip`). Migrating them to `<button>` with `aria-pressed` on the active/followed
  state (the follow star already toggles) is the concrete a11y follow-up when chips are next touched.

### Row 118 — Accessibility · Contextual Live Badge Updates — **Severity: High**
- **Description:** Async badge/count changes should announce a meaningful contextual status without moving focus.
- **Do:** Use one appropriate atomic status message (e.g. "3 items in cart"). — **Don't:** Announce a bare number or make every badge a competing live region.
- **Code (Good):** `<span role='status' aria-atomic='true'>3 items in cart</span>`. **(Bad):** `<span aria-live='polite'>3</span>`.
- **Repo tie-in:** the "↑ N new stories" pill and the live scoreboard are the live-updating surfaces. If they
  get announced, use one atomic `role='status'` phrase ("3 new stories") — not a bare number, and not a live
  region on every count badge.

---

## 5. React-specific notes (only what's not already established here)

From `data/stacks/react.csv`. This repo is **Vite + React 18, plain JS (no TypeScript), no RSC/Next, hand-rolled
CSS + design tokens, single large `App.jsx` with co-located module folders.** Rows already satisfied or
inapplicable are skipped; these are the ones worth keeping in view:

- **Clean up effects (row 6, High) — already our convention, keep it.** Every data-fetching effect returns
  cleanup: an `alive` flag + `clearTimeout`/`AbortController` (`XPulse`, `fetchDiscover` callers,
  `teamWideItems`). New effects must match — a fetch without an `alive`/abort guard is the bug pattern to avoid.
- **Specify dependencies correctly (row 7, High).** We use targeted `// eslint-disable-next-line
  react-hooks/exhaustive-deps` in a few memo/effect spots (team scan, gap fetch). That's acceptable *only* where
  the omitted dep is intentionally stable; prefer complete deps first.
- **Avoid unnecessary Effects — derive with useMemo (row 8, High).** Already the pattern (`topicItems`,
  `teamItems`, `dedupedFeed`, `catBadge` inputs). Don't reach for an Effect to compute derived feed state.
- **Stable, unique keys (row 10, High).** Several lists key by array index (`key={i}`). Harmless for static
  rendered slices, but when a list can reorder/insert (feeds, chips), prefer a stable id (`a.link`) to avoid
  state/DOM mismatches. Watch for this when adding interactivity to a list.
- **Virtualize long lists >100 items (row 37, High).** Feeds are currently capped (`.slice(0,20..30)`), so this
  hasn't bitten — but if a view ever renders the full unbounded feed, window it rather than mounting hundreds of
  cards.
- **Memoize context values (row 34, High).** `FollowSourceContext` is the one context; ensure its `value` is a
  memoized object so provider re-renders don't churn every consumer chip.
- **Error boundaries + async error surfacing (rows 39/40, High).** The API layer is fail-soft by design (returns
  `[]`/`null`, never throws to the UI) — that already covers async. A top-level error boundary around the app
  shell would catch render-time errors (worth adding; not present today).
- **Semantic HTML / focus / labels / live regions (rows 43–46).** Reinforces UX rows 117–118 above — the chip
  `<span>`→`<button>` migration and atomic `role='status'` for the "N new" pill are the concrete items.
- **Explicitly skipped as inapplicable:** TypeScript rows (22, 47–50 — repo is JS); React 19 / RSC / Compiler /
  `forwardRef`-deprecation / `useEffectEvent` (rows 54, 56–61 — repo is React 18). Revisit only on a React 19 +
  TS migration.

---

_Reference only — no app code is changed by adding this file. Update it if the source skill's rows change or if
one of these guidelines gets promoted into an actual code fix._
