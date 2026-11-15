# Batch AD (mynewshub2) — AD2 wording + AD3 Top-stories floor

**CASE (both repos):**
- **mynewshub2** (this repo): `main` was `2e69cce`; **PR #91 (Batch AC) merged** as `019b13c`, so
  this branches fresh from the new `main`. **AD2 + AD3** land here, one commit each.
- **social-command-center** ("AetherHub"): **AD1** (the real X-layer fix) lands there as its own
  draft PR. `whatishappening-hub` is **not touched**.

**Sandbox:** no WebKit (Safari = NEEDS-DEVICE), no live egress (fixtures). Chromium desktop +
touch, light + dark. No secret printed anywhere.

## Item status

| item | what | result |
|---|---|---|
| **AD2** | mynewshub2 Voices wording — plain X text for CB | ✅ **PASS** (wording only, no behaviour change) |
| **AD3** | Top-stories floor only while loading (finish AC3 properly) | ✅ **PASS** (blank 0 for 0/1/2 images; CLS ≤ 0.03) |

## AD2 — Voices X wording

`lib/voices/handler-test.js` reported X as the cryptic **"unverifiable on free instance"** — not
clear to a non-developer. X isn't broken: it's just not probed via the free RSSHub instance, and
the live X take comes from **xAI on tap** (`api/signals` `kind=xpulse`). Changed the X test row to
read **"open on X — live pull via xAI when you tap"**. No new call, no behaviour change — the row
still counts as `unverifiable` in the summary; only the words changed. (Not skipped: the old
wording genuinely wasn't clear.)

## AD3 — reserve only while loading, then size to content

AC3 raised `.mh-topstories` to a **permanent** `min-height:500px`; when rows 1–2 had no image the
committed block is shorter than 500, leaving ~33–70px of dead space below Top stories (the Batch Y
lesson: reserve only while loading).

**Fix:** the permanent floor is gone. While loading, a `.mh-topstories-loading` class reserves the
height (500px, the median committed height), and `SectionSkeleton` now mirrors the committed
anatomy — **2 thumbnail rows + 3 compact + the "Show all" footer** (new `thumbRows`/`footer` props)
— so the loading shape matches what commits. Once committed, the block **sizes to content** (no
floor beyond the pre-existing harmless `.mh-section` 360px base, which is below any 5-row
Top-stories height), so there is **no blank gap** whatever the image count.

### Before / after (measured, phone fixtures)

| rows 1–2 images | committed height | blank BELOW Top stories — **before** (perm. 500 floor) | blank — **after** (size to content) |
|---|---:|---:|---:|
| 0 images | ~387–467px | ~33–113px dead space | **0px** |
| 1 image (default fixture) | 501px | ~0px | **0px** (measured 360/390×844/390×664/430) |
| 2 images | ~406–535px | 0 / small | **0px** |

**Phone Home CLS (10 runs, loading-only reserve):** 390 **max 0.0283 / avg 0.0126**, 375 **max
0.0156 / avg 0.0097** — both ≤ 0.03. (The residual is the pre-existing breaking→general handoff,
W6; the Top-stories reserve matches the common committed height so it adds ~1px.)

## Gates (final AD build)
conformance **0** (≤3 anatomies) · image-slots **0** · empty-box **PASS** · text-overlap **0** ·
check:tokens **green** · initial JS gzip **179,616 B vs main 179,817 (−201)** · phone-Home CLS 390
**0.0283** / 375 **0.0156** (10 runs, ≤0.03) · blank below Top stories **0px** at 360/390×844/390×664/430
for 0/1/2-image rows.

## Hard constraints
0 new `api/` files · no new `setInterval` · no new hex outside tokens.css · no new dependency ·
SW unchanged · initial JS gzip **179,616 B vs main 179,817 (−201)** · `check:tokens` green.

## What CB sees
- **Voices** (Customize → Voices → Test voices): an X voice now reads **"open on X — live pull via
  xAI when you tap"** instead of "unverifiable on free instance".
- **iPhone Home:** Top stories has **no dead gap** below it when the top rows have no image, and the
  page does not jump as it loads.
