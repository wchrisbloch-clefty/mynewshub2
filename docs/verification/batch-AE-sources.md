# Batch AE — source portfolio, tiers, and de-duplication (AE1)

**Every NEW feed URL below is UNVERIFIED in the sandbox** (no live feed egress here). It is
marked `_ae:true` in `DEFAULT_FEEDS` and shows in the `?debug=1` Copy-report with its live status
once **CB's device runs the Source test (AE9)**. "How found" is the publisher's own documented
feed path or a Google News `site:` search where the publisher has no public RSS (AP/Reuters/API).

## Rank vs tier (two different things)
`RANK_BY_NAME` / `rankOf()` in `src/modules/ranking/rank.js` is the **coverage rank** the importance
ranker uses — `core | specialist | fan | alt | local` — NOT the trust `tier`
(verified/reported/inferred). Unknown/custom feeds default to `specialist` (never `core`). Only
non-default ranks are listed (core/fan/alt/local); every other outlet is `specialist` by default.

## De-duplication (AE1.2) — one home category per feed
Removed the seven energy/data-center feeds that sat in **both** `business` and `bloom` from
`business` (kept in `bloom`): Oilprice, Utility Dive, Data Center Dynamics, Power Magazine,
Rigzone, Canary Media. **MIT Tech Review** removed from both `business` and `bloom` → **tech only**.
Cross-category visibility is preserved by the existing clustering / Top-stories rules. KHOU + Chron
stay fetched (they power the Houston Local strip) but are ranked `local`, so the ranker keeps them
out of News Top now / lead / Breaking unless the Houston gate opens (AE3).

## Added feeds (UNVERIFIED) — in this PR

| category | feed | rank | how found |
|---|---|---|---|
| general | AP (Google News) | core | Google News `site:apnews.com` (AP has no public RSS) |
| general | Reuters (Google News) | core | Google News `site:reuters.com` (Reuters discontinued public RSS) |
| general | CBS News | core | cbsnews.com documented feed `/latest/rss/main` |
| general | ABC News | core | abcnews.go.com feeds `/abcnews/topstories` |
| general | NBC News | core | nbcnews.com feeds `/nbcnews/public/news` |
| general | CNN | core | cnn.com `rss/cnn_topstories.rss` |
| general | The New York Times | core | nytimes.com services feed `HomePage.xml` |
| general | Wall Street Journal | core | Dow Jones public RSS `RSSWorldNews` |
| general | Politico | core | politico.com `rss/politicopicks.xml` |
| general | Google News — Top stories | specialist | news.google.com top RSS |
| general | **The Daily Wire** | **alt** | dailywire.com `feeds/rss.xml` — labelled "alternative perspective" |
| business | Reuters Business (Google News) | core | Google News `site:reuters.com business` |
| business | WSJ Business | core | Dow Jones public RSS `WSJcomUSBusiness` |
| business | Axios Markets | core | api.axios.com `feed/business` |
| business | **ZeroHedge** | **alt** | feedburner `zerohedge/feed` — alt lane + X @zerohedge (AE5) |
| business | **Watcher Guru** | **alt** | watcher.guru `news/feed` — alt lane + X @WatcherGuru (AE5) |
| bloom | Natural Gas Intelligence | specialist | naturalgasintel.com `/feed/` (midstream) |
| bloom | Hydrocarbon Processing | specialist | hydrocarbonprocessing.com `/rss` (downstream) |
| bloom | EIA Today in Energy | core (verified) | eia.gov `rss/todayinenergy.xml` (policy) |
| bloom | American Petroleum Institute (Google News) | core | Google News `site:api.org` (policy) |
| tech | Techmeme | core | techmeme.com `feed.xml` |
| tech | Simon Willison | specialist | simonwillison.net atom (stay-current) |
| tech | One Useful Thing | specialist | oneusefulthing.org `/feed` (stay-current) |
| sports | The Athletic | core | Google News `site:nytimes.com/athletic` |
| sports | Fox Sports | core | foxsports.com `feedout/syndicatedContent` |
| sports | Sports Illustrated | core | si.com `rss/si_topstories.rss` |
| sports | Bleacher Report | core | bleacherreport.com `articles/feed` |
| sports | Google News — Sports | specialist | news.google.com SPORTS topic RSS |

Existing fan-rank reclassifications (no URL change): **The Spun, OutKick, 247Sports, On3** → `fan`
(never lead Top now / trigger Breaking); racing + golf feeds → `specialist`, shown only under their
own chips (AE6).

## Deferred to a follow-up (verified-URL-pending, under the +0.5% bundle cap)
These are in the target list but were held back so the branch stays within the initial-JS-gzip cap
(+791 B / +0.44% with the set above). Add once another chunk is trimmed or the cap is raised:
- **NEWS specialist already present:** Fox News, The Hill, Washington Times, Breitbart, NY Post.
- **Energy:** World Oil, Oil & Gas Journal, Offshore Magazine (upstream); Pipeline & Gas Journal,
  Hart Midstream (midstream); DOE, FERC (policy); ERCOT news (utilities).
- **Business:** CNBC Top/Business already present; FT (free feed if one exists).
- **AI&TECH stay-current:** TLDR AI, Hugging Face, Import AI, Latent Space, Hard Fork.
- **Houston local (AE3):** Houston Public Media, ABC13/KTRK, KPRC, Fox 26, Houston Business Journal.
- **The Hormuz Letter (X):** CB gave no handle and it could not be verified — resolve via the Voices
  ResolveModal / finder and confirm in the AE5 import sheet; **never guessed**.

## AF5 — remaining feeds resolved (every URL verified or UNVERIFIED)
Shipped into DEFAULT_FEEDS (`_ae:true`, carried to devices by migrateFeedsAE at FEEDS_MIG_V=4):

**VERIFIED** (returned `<item>`s over the agent proxy):
- TLDR AI — `https://tldr.tech/api/rss/ai` (tech, sub:stay-current) — tier:verified
- Hugging Face — `https://huggingface.co/blog/feed.xml` (tech, sub:stay-current) — tier:verified
- Import AI — `https://importai.substack.com/feed` (tech, sub:stay-current) — tier:verified

**UNVERIFIED** (URL serves `application/rss+xml` 200 but item-level pending CB's device Source test;
shipped without the verified tier, so the Copy report confirms or swaps them):
- Latent Space — `https://www.latent.space/feed` (tech, sub:stay-current)
- World Oil — `https://www.worldoil.com/rss?feed=news` (bloom, sub:upstream) — URL from worldoil.com/rss-list
- Oil & Gas Journal — `…/__rss/website-scheduled-content.xml?input={"sectionAlias":"general-interest"}` (bloom, sub:upstream)
- Oil & Gas Journal — Pipelines — `…?input={"sectionAlias":"pipelines-transportation"}` (bloom, sub:midstream)

**NOT SHIPPED — no working URL found (never guessed):**
- Offshore Magazine — offshore-mag.com/rss 404s; Endeavor section alias unknown.
- Pipeline & Gas Journal — pgjonline.com/feed 404s; no public RSS endpoint located.
- Hart Energy — hartenergy.com/feed 404s; no public RSS endpoint located.
- Hard Fork — no first-party RSS URL could be resolved.
Resolve these on CB's device (or a later finder pass) before adding — a guessed 404 URL only
pollutes the Source test.

## AF6 — X-only voices (names only; handles resolved on Accept, never stored)
Added to SEED_VOICES as `status:'seed'`, `_xOnly:true`, never auto-followed:
- **ZeroHedge** (business) — CB-named handle **@zerohedge** (prefilled by the resolve modal on Accept).
- **Watcher Guru** (business) — CB-named handle **@WatcherGuru** (prefilled on Accept).
- **The Hormuz Letter** (bloom) — Voices finder returns **@HormuzLetter** as the sole consistent
  candidate across 6 independent sources (njtmulder, RapsonEnergy, Reuters repost, r/oil, etc.).
  Surfaced for CB to confirm on Accept; the handle is NOT stored in seeds.js (never guessed).
