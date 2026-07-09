# Snapshot Card

A deduped story card — category accent bar, source/breaking meta, Archivo headline, snippet, "N sources" row, and a Save button.

**What it does:** renders one clustered article as a compact, tappable card. Clicking the card fires `onRead`; the Save button fires `onSave`.

**What it needs:** `<SnapshotCard a={article} meta={{ color, bg }} isSaved onSave onRead formatDate?={fn} />`. React 18. Category theming (`meta`) and date formatting are **injected** — no dependency on any app CATS table or util. Styling: co-located `SnapshotCard.css` + design tokens (`src/styles/tokens.css`); `.snap-feed` is the flex list container consumers wrap cards in.

**What it returns:** an `<article>` element. Reuse anywhere by passing an article, a `{color,bg}` meta, and save/read handlers.
