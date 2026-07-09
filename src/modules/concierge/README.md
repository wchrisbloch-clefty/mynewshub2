# Concierge (grounded chat)

A floating chat assistant with two modes: a **grounded concierge** that answers only from retrieved feed context, and an **Analyze** mode for pasted text.

**What it does:** for a question it classifies intent and retrieves the relevant clustered feed data (via the retrieval module), hands only that to an injected LLM call, and shows the answer with an optional "Open in app" deep link. Analyze mode summarizes / extracts / bias-checks arbitrary pasted text.

**What it needs:** `<ChatBot arts={arts} onNavigate={fn} fetchSummary={fn} resolveDeepLink={fn} />`. React 18. All app-specific behavior is injected: `fetchSummary({type,title,content,mode})→{summary,error}` (the LLM/provider call), `resolveDeepLink({entities,category})→path|null` (entity→route), and `onNavigate(path)`. Retrieval is imported from the sibling module. Styling: co-located `Concierge.css` + design tokens.

**What it returns:** the chat launcher + drawer UI. Reuse anywhere by wiring the three callbacks and passing your feed data as `arts`.
