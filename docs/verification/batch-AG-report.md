# Batch AG — fix dead feeds, "Across outlets" glance, "Also moving", AetherHub people (report)

**CASE:** `git fetch --all` + REST PR list — **PR #93 (AE+AF) is OPEN** (not merged), so AG commits
were added to its branch `claude/vigilant-gates-D9cTB-AE`, one per item. **DO NOT MERGE.**
`social-command-center` read-only (read, never written). No secrets committed. No new `api/` file.

**Sandbox:** no live feed/X egress — fixtures/mocks throughout; real feeds = **NEEDS-DEVICE**.

## Item status
| item | what | result |
|---|---|---|
| **AG1** | feed fallback (via Google News) + "Test all sources" + Copy report | ✅ **PASS** (fixtures) |
| **AG6.1** | fix the "Show alternative perspective" empty-square glyph | ✅ **PASS** (SVG checkbox, default ON) |
| **AG2** | "Right now across outlets" glance (+ ESPN / NBC Sports feeds) | ✅ **PASS** (8/8 + smoke) |
| **AG3** | "Also moving" strip (behind-the-scenes) | ✅ **PASS** (7/7 + dedup smoke) |
| **AG5.1** | AetherHub people → import roster (23 people + handles) | ✅ **PASS** (11/11; inert module) |
| **AG4** | trending boost | ⛔ **CAP-BLOCKED** (needs initial fetch+match; 7 B headroom) |
| **AG5.2** | "Import from AetherHub" sheet | ⛔ **CAP-BLOCKED** (SEED_VOICES is initial) |
| **AG5.3** | voice-signal flags → "Also moving" | ⛔ **CAP-BLOCKED** (needs initial matching) |
| **AG6.2** | leave 9to5/Platformer/Stratechery/NME/Baseball America/DRF off | ✅ **done** (unchanged — still off) |

## AG1 — dead feeds rescued + one-tap proof
- `fetchRSS` gained a **one-shot fallback**: primary non-200 / 0-items / timeout → try an explicit
  per-feed `fallbackUrl`, else a **Google News `site:<domain>` search** (every GNews site:/topic feed
  loaded on CB's device). Items keep the feed's original `name`, so rank/sub/alt still apply; the
  source is flagged **"via Google News"**. **This rescues EXISTING users whose saved URL is broken,
  with no migration** — the loader derives the fallback from whatever URL it is given.
- Primary-URL fixes (new users): **Politico** → `rss.politico.com/politics-news.xml`; **Hacker News**
  → `hnrss.org/frontpage`; **American Petroleum Institute** → GNews **name** search (`"American
  Petroleum Institute"`, since `site:api.org` returned nothing). All other red feeds (Axios Markets,
  Watcher Guru, Yahoo Finance, Data Center Frontier, Hydrocarbon Processing, VentureBeat, Sports
  Illustrated, Bleacher Report, 247Sports, BloodHorse, Horse Race Nation, Golf Monthly) ride the
  automatic GNews fallback — no per-feed edit needed.
- **"Test all sources"** (Customize → Sources): tests every enabled feed across all categories,
  concurrency ≤ 6, live pass/fail grouped by category with "via Google News" flags, **0 network on
  panel open** (tap only). **Copy report** = plain JSON (feed, category, status, items, code, reason,
  usedFallback, via, rank, sub, alt — **no secrets**). Uses the existing `/api/feed` proxy.
- **Root-cause fix:** `CustomizePanel` referenced `fetchRSS` as a free global (undefined in its module
  scope → every Test threw and was swallowed). It is now a prop — which also repairs the long-broken
  **per-row Test** button.
- **Removed** the redundant `allorigins` last-resort from `fetchRSS` (the GNews fallback is a better
  different-host path); that reclaimed the bytes to seat AG1 under the cap.
- **Proof (fixtures):** failing primary → GNews fallback → items + "via Google News" — Test-all on the
  full feed set: **116 ok / 2 fail / 92 via fallback**; Copy report JSON shape + **no secrets**; 0
  console errors. Which URLs actually work on CB's device = **NEEDS-DEVICE** (that is what Copy report
  is for — tap it on the preview and paste it back).

## AG6.1 — alt toggle glyph
The `☑/☐` unicode glyphs aren't in CB's device font → rendered as an empty square. Swapped for lucide
`CheckSquare`/`Square` SVGs (always render); default ON. Proven: the control now renders a real
`<svg>` and Daily Wire/ZeroHedge items appear when ON, vanish when OFF (AF2.3's alt-governance test
still green).

## AG2 — "Right now across outlets"
A compact, collapsible per-category glance: one row per **pinned outlet** → its lead headline + time,
tap to read. No thumbnails. Lazy chunk. **Honesty:** RSS is newest-first, so the row reads "latest ·
<time>" unless the outlet is a known top-stories feed (Fox/CNN/ABC/NBC/CBS/AP/Reuters/BBC/NPR/GNews/
ESPN). A silent/failed outlet shows a neutral **"unavailable"** row — never an error wall; empty → the
section renders nothing (no empty box). Alt outlets keep the chip and obey the toggle. Default open on
iPad/desktop; collapsed to 4 + "See all outlets" on phone. AG2.2 added ESPN top-headlines + NBC Sports
feeds (FEEDS_MIG_V 4→5). **Scope:** rendered on FeedPage categories (News/Business/Energy/Tech); a
Sports-page glance needs a representative-picking rule for the league-split ESPN/CBS feeds — scoped as
an AG2 follow-up (the new single ESPN/NBC Sports feeds are in place for it).

## AG3 — "Also moving"
A strip under Top now (before Latest): up to 5 stories that didn't make Top now or the glance, but
qualify by **≥2 distinct outlets** or a match to CB's **keywords / followed teams**, each with a
neutral "why" chip ("2 outlets", "Your keyword: ERCOT", "Your team: …"), labelled **inferred**. A
fan/alt/local-ONLY cluster needs **≥2 distinct ranks** to qualify (so a lone fan blog or single alt
post can't surface); max 2/publisher; the pool excludes Top Stories / Breaking / State of Play /
Houston (AF4.1 gate respected) and Top now, and Also-moving's keys are excluded from Latest — no story
is duplicated across surfaces. Hooks for AG4 ("Trending" chip) and AG5 ("Yergin · 2h ↗") are in the
selector, dark until those items land. Proof: 7/7 unit (incl. the three required negatives — Houston
auto-show / "Staten Island turkeys" / fan-blog "Big House" never appear); in-browser the strip renders
nothing when Top now has already claimed the covered stories (dedup holds), 0 errors, no empty box.

## AG5.1 — AetherHub people roster
All 23 AetherHub people (10 X + 13 YouTube) copied with real handles into `aether-import.js`, categories
mapped, Ancient Mysteries parked in Pop Culture + flagged, ERCOT topic watch captured. `mergeAether()`
is add-only / de-dupes by name / respects tombstones / keeps `status:'seed'` / carries each X handle
for the resolve prefill. 11/11 tested. **Nothing is auto-followed and no handle is silently stored** —
CB confirms on import.

## Bundle (the hard wall)
The +1.1% cap (main 179,817 → **181,795 B**) is effectively exhausted. AG1+AG2+AG3 landed under it only
by: removing the redundant allorigins block (−658 B), keeping all three features' UI + CSS in lazy
chunks, de-duplicating the Energy chip keywords (terms already covered by the Upstream/Midstream/
Downstream chips), and trimming the Tech chip keywords back to the lean set. **Final initial JS gzip
181,788 B — 7 B headroom.** AG5.1's module is inert (0 bundle).

**Why AG4 / AG5.2 / AG5.3 are cap-blocked (per the ROUTER "STOP the item and report exact bytes"):**
each needs code in the **initial** chunk (AG4: a trending fetch + token-match in the feed pipeline;
AG5.2: SEED_VOICES is imported into the initial chunk, so adding 23 people ≈ +400 B; AG5.3:
voice-signal matching in the feed pipeline) and there are **7 B** of headroom. Landing them needs
either a cap change (CB's call) or a lazy-split of an existing initial module (e.g. moving SEED_VOICES
behind the lazy Voices path, ~the lever for AG5.2/5.3). The AG5.1 roster + mergeAether are ready to
wire in the moment there is room.

## Gates
Unit: ranking · wholeword · migrate · voicefind · sports-breaking · across-outlets 8/8 · also-moving
7/7 · aether-import 11/11 · top-stories/select · state-of-play/select — **ALL PASS**. check:tokens
**PASS**. Visual suite (390 / 820 / 1194 / 1440, light + dark): _see the commit that finalizes this
report._

## What CB does
- Preview → **Customize → Sources → Test all sources → Copy report → paste to Booth** (this is how we
  learn which of the still-UNVERIFIED URLs work; the fallback already keeps the red ones loading "via
  Google News").
- Look at **News / Business / Energy / Tech**: the **"Right now across outlets"** glance (what each
  outlet leads with) and **"Also moving"** (what's moving behind the scenes). Say which outlet is
  missing from the pinned list or which headline feels wrong.
- Decide on the **cap** for AG4 (trending) + AG5.2/5.3 (AetherHub import sheet + voice flags): a small
  cap bump, or approve lazy-splitting SEED_VOICES to make room.
