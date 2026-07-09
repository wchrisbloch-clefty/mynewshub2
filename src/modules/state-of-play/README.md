# State of Play

A scannable "what's driving the day" strip: the hottest clustered stories as numbered, tappable headlines.

**What it does:** ranks a clustered article list by heat (via the sibling clustering module) and renders the top 5 as a compact strip. Renders nothing below 3 items.

**What it needs:** `<StateOfPlay items={clusters} meta={{ color, label }} onRead={fn} formatDate?={fn} />`. React 18. Category theming (accent color + label) and date formatting are **injected** — no dependency on any app CATS table or util. Styling: co-located `StateOfPlay.css` + design tokens (`src/styles/tokens.css`).

**What it returns:** a `<section>` element (or `null`). Reuse elsewhere by passing any clustered list plus a `{color,label}` and an `onRead` handler.
