# mynewshub2
Updated March 2026

## AI cascade operations

The summarize cascade (`api/summarize.js`) tries providers in order:
**Groq 70b → Groq 8b → Gemini → Grok → Perplexity → Claude**.

**Model IDs live in one place: `lib/ai-models.js`.** Every ID carries the date it was last
confirmed working. No provider function anywhere in `api/` hardcodes a model string.

**When a provider starts failing, check the registry before rotating the key.** A provider
returning a non-ok response for a model that worked yesterday is almost always a retired or
renamed model, not a bad key. `GET /api/health` tells the two apart: it makes a real 1-token
call per provider and returns one of three states — `ok`, `key-present-call-failed`,
`key-missing` — with the HTTP status, a response time against that step's cascade budget, and
the `confirmed` date for each model. A key problem is 401/403 across every model for that
provider; a model problem is 404/400 on one model while its siblings still answer. Use
`?fresh=1` to skip the 60s cache, `?provider=<step>` to probe one.

**Bump `PROMPT_VERSION` in the same commit as any change to `buildSystem()`.** Summaries are
cached for 24h with a 7-day stale-while-revalidate window, so an unbumped prompt change keeps
serving pre-improvement summaries for up to a week with nothing to tell them apart. The
version rides in the request URL (`?pv=`), the response body (`promptVersion`), and the
`X-Prompt-Version` header, so cached entries from an old prompt are always identifiable.

**A failed cascade reports what each provider actually did.** The 502 body carries an
`attempts` array — `provider`, `model`, `reason` (`no-key` / `http-error` / `timeout` /
`network-error` / `empty-response`), `status`, and `ms` per attempt. "No keys configured" and
"everything timed out" are different failures and now look different.
