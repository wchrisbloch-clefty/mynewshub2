# Clustering / Dedup Engine

Pure, framework-free story clustering. Groups articles that cover the same event and ranks them by "heat."

**What it does:** de-duplicates a raw article list into clusters (title bigram Jaccard ≥ 0.28 within a 6-hour window), scores each by heat (source breadth × 12 + recency 0–48), and extracts trending topic labels from the hottest clusters.

**What it needs:** an array of articles where each has `{ title, source, pubDate }`. No app state, no UI, no network — every other field is passed through untouched. Uses only `Date.now()`.

**What it returns:** `clusterStories(articles)` → the deduped articles annotated with `_clusterSize` and `_clusterSources[]`; `heatScore(article)` → a number; `hotClusterTopics(items, n=5)` → an array of topic-label strings, hottest first. Also exports the shared `TREND_STOP` stopword set.
