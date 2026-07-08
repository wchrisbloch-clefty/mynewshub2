# Query-Aware Retrieval

Turns a natural-language question into relevant, structured feed context — the retrieval half of a "grounded concierge."

**What it does:** classifies the question's intent (`markets` / `trending` / `entity` / `general`) and category, extracts keywords, then selects the most relevant clustered stories (keyword-filtered, ranked by relevance + cluster size + recency). Also formats that into a compact block ready to hand an LLM.

**What it needs:** `retrieveFeedContext(question, arts, opts?)` where `arts` is `{ [category]: article[] }` (each article `{ title, source, pubDate, desc?, link? }`). Depends only on the sibling **clustering** module. The one app-specific concern — mapping an entity to an in-app URL — is **injected** via `opts.resolveDeepLink({ entities, category })`, so the module has no hard dependency on any routing scheme or entity table.

**What it returns:** `{ intent, category, entities?, topics?, clusters[], deepLink }` where each cluster carries `{ title, source, link, clusterSize, sources[], ageLabel }`. `buildFeedContextBlock(ctx)` returns a string (empty when nothing matched → caller can render an honest "not in feed" state).
