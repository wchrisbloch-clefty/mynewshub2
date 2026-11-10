# Batch AB — close out AA: font caching, optical sizes, real-header proof

**CASE:** `git fetch --all` + PR list — **PR #90 (Batch AA) is OPEN** (draft). Added
commits AB1–AB4 to its branch `claude/vigilant-gates-D9cTB`, one per item, **DO NOT
MERGE**. Sandbox: no WebKit (Safari = NEEDS-DEVICE); the static server does not apply
`vercel.json`, so the real cache-header response is MOCKED here (curl commands below).
Everything run desktop + touch emulation, light + dark, every category page.

## Item status

| item | what | result |
|---|---|---|
| **AB1** | year-long immutable caching for fonts | ✅ **PASS** (config + runtime) / **NEEDS-DEVICE** (real header) |
| **AB2** | ship the serif optical-size axis (opsz) | ✅ **PASS** — opsz fits the budget and is effective |
| **AB3** | real-network font proof | ✅ **PASS** (5 pages) / **MOCKED** (real header) |
| **AB4** | report + device checklist | ✅ this doc |

## AB1 — cache headers + content-hash

- `vercel.json` gained a `headers` rule: `/fonts/(.*)` →
  `Cache-Control: public, max-age=31536000, immutable`. SPA rewrite unchanged, `/api`
  still excluded, same-origin (no CORS).
- The four woff2 are **content-hashed** (`inter-latin-wght.f052ee44.woff2`, …) by a new,
  re-runnable script (`scripts/hash-fonts.mjs` / `npm run hash:fonts`) that also rewrites
  the `@font-face` urls and the two `<link rel="preload">` hrefs to match — so the files
  are safe to serve immutable and the preload hrefs equal the `@font-face` hrefs.
- **PASS:** only the two preloaded latin files are requested on load, Inter + Source Serif
  load, **0 "preloaded but not used" warnings**, 0 console errors; `vercel.json` is valid
  JSON with the font header + api-excluded rewrite.
- **NEEDS-DEVICE (real response header):**
  ```
  curl -sI "https://<preview>/fonts/inter-latin-wght.f052ee44.woff2"           | grep -i cache-control
  curl -sI "https://<preview>/fonts/inter-latin-ext-wght.48f540fb.woff2"       | grep -i cache-control
  curl -sI "https://<preview>/fonts/source-serif-4-latin-wght.0804a88d.woff2"  | grep -i cache-control
  curl -sI "https://<preview>/fonts/source-serif-4-latin-ext-wght.944119dd.woff2" | grep -i cache-control
  # expect each: cache-control: public, max-age=31536000, immutable
  ```

## AB2 — optical sizes for the serif (measured, then shipped)

AA dropped opsz "to stay under 130KB", but first paint was 97KB — there was room. Built a
roman subset WITH both axes (`scripts/build-opsz-serif.py`, from the same `--no-save`
`@fontsource-variable/source-serif-4` source AA3 used; **package.json untouched**),
keeping the latin + latin-ext ranges, limiting **wght to the product's {400–700}** and
**opsz to 8–40pt** (covers every role size, 11–36px).

**Bytes (latin roman, woff2):**

| build | bytes | first paint (Inter 48,444 + serif) |
|---|---|---|
| wght-only (before AB2) | 49,308 B | 97,752 B ≈ 97.8 KB |
| opsz+wght **200–900** | 122,200 B | 170,644 B — over budget |
| **opsz+wght 400–700, opsz 8–40 (shipped)** | **80,868 B** | **129,312 B ≈ 129.3 KB ≤ 130 KB** |

(latin-ext — on demand, not preloaded — is 57,188 B.)

**opsz is effective.** With `font-optical-sizing: auto`, the same headline at 36px renders
a *different* cut than `:none` — advance −20px and higher-contrast serifs (the **display**
cut) — while at 15px it stays on the **text** cut (+14px). Before/after crops at 390 and
1194 accompany this PR (`before` = the text cut the wght-only file always showed; `after`
= the display cut). This is exactly the booth's concern — 30–36px hero/lead headlines no
longer use the heavier text cut.

**No regressions:** weight set unchanged {400,500,600,700} (@font-face range corrected to
`400 700`); font metrics unchanged (em 1000, asc 1036, desc −335), so the Times-New-Roman
metric fallback still fits — **font-swap CLS delta +0.0004 (1194) / +0.0005 (1440)** with
fonts delayed 3s, and 0.0005 / 0.0029 at 390 / 820 (all ≤ 0.01). 0 google requests.

## AB3 — real-network proof

`test/visual/font-network.test.mjs` over **Home, Business, Sports, Podcasts, Reader**:
**0** requests to googleapis/gstatic on any page, no self-hosted woff2 requested twice,
every woff2 response 200/304, 0 console errors; `vercel.json` asserts the `/fonts`
immutable header + the api-excluded rewrite. **ALL PASS.** The real immutable response
header is **MOCKED** (sandbox static server) — the curl commands above confirm it on the
preview.

## Gates (final AB build)
type 0 · conformance 0 · text-overlap 0 · contrast 0 · dedupe-label PASS · fixed-overlap
0 · check:tokens green (font-size literals 0) · initial JS gzip **179,637 B (−196 vs
main)** · font-swap CLS ≤0.01 at 390/820/1194/1440 · font-network ALL PASS.

## Hard constraints
0 api files · no new setInterval · no new hex outside tokens.css · **no new font family
or dependency** (same two self-hosted families; the fontsource package was `--no-save` and
is gone; package.json only gained the `hash:fonts` script) · SW unchanged · initial JS
gzip ≤ main · check:tokens green · all gates green on all three bands, light + dark.

## What CB confirms
- **iPad / iPhone:** hero and lead headlines look crisper at large sizes (the display cut);
  no text jump on a cold load; **no console errors**; on a second visit the four fonts are
  served from cache (the immutable header) — no re-check, no fallback flash on a flaky
  connection.
- **Desktop:** same crisper large type; `curl -I` shows `max-age=31536000, immutable` on
  the four `/fonts/*.woff2`.

## Caveats
- Real cache-header response + real-device Safari = **NEEDS-DEVICE / MOCKED** (no WebKit,
  no Vercel static layer in the sandbox).
