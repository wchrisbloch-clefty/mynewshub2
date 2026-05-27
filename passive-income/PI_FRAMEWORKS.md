# CB Decision Frameworks — Master Reference

All mental models, execution filters, and decision tools in one place. Every idea, product, and platform gets evaluated through the relevant framework before action is taken.

> This document is referenced by all other PI_ documents. When evaluating any idea or build decision, start here.

---

## Framework 1 — The Autonomous Filter
*Source: CB passive income operating principle*

**The Gate**: Before any idea progresses past intake, it must answer YES to this question:
> "Does this generate revenue while CB is asleep, without CB's active time per dollar after setup?"

- **YES** → Evaluate further
- **NO** → Restructure into a product form first, or shelf it
- **PARTIAL** → Only proceed if the active component compresses over time and can be staffed or automated

**Examples:**
- Workshop → NO → restructure as async course
- Consulting → NO → restructure as templates, SaaS, or community
- Landscaping service → NO → restructure as AI agent subscription app
- Newsletter → YES → write once, auto-deliver, auto-bill

---

## Framework 2 — The Builder Filter
*Source: CB analytical framework*

Five-question pass/fail. All five must pass to pursue.

| Question | Pass Condition |
|---|---|
| Painful problem? | Real, recurring pain — not a nice-to-have |
| Underserved? | Market is not already dominated by a well-funded incumbent |
| MVP without a dev team? | CB can build or launch a version alone or with AI |
| Revenue under 90 days? | A paying customer is possible within 3 months |
| Scalable without CB's linear time? | Income grows without proportional time increase |

**Bonus question (from podcast):** Sellable? Does recurring revenue create an exit multiple (3–5x revenue for SaaS/agency)?

---

## Framework 3 — The Three-Layer Cake
*Source: The Koerner Office podcast — Brandon Doyle / David AI*

Every business or product CB builds that involves customer acquisition must have all three layers defined before development starts. Missing a layer collapses conversion.

```
┌─────────────────────────────────────────────────────┐
│  TOP LAYER — THE CLOSE                              │
│  The irreplaceable human moment where trust         │
│  converts to revenue. Phone call, direct message,  │
│  personal email. CB or a trusted person.            │
├─────────────────────────────────────────────────────┤
│  MIDDLE LAYER — THE FRICTION SIGNAL                 │
│  The deliberately expensive, human-feeling          │
│  touchpoint that signals legitimacy. Physical       │
│  mail, custom-built asset, personal video.          │
│  "All the people in their inbox are not real."      │
├─────────────────────────────────────────────────────┤
│  BOTTOM LAYER — THE AGENT                           │
│  The autonomous work. Scraping, building,           │
│  delivering, tracking. AI + automation does this.   │
│  CB is not in the loop.                             │
└─────────────────────────────────────────────────────┘
```

**The rule**: Skip a layer and your conversion collapses. Stack all three and you compound. Add a fourth friction layer and you multiply.

**Self-quiz for every new business CB designs:**
1. What is my agent layer? (What does automation handle?)
2. What is my friction signal? (What makes me real and trustworthy?)
3. What is my close? (What is the single human moment that converts?)
4. What is my fourth hard thing? (What would 10x my close rate that competitors won't do?)

**Conversion math (from the podcast — Utah home services play):**
| Stack | Approx. Closes from 350 leads |
|---|---|
| Cold email only | ~1 |
| Postcards only | ~4 |
| Postcards + custom-built website | ~10 |
| Postcards + website + phone call | 17–20 |
| All three + hand delivery (4th hard thing) | 70+ (estimated) |

---

## Framework 4 — Compounding Hard Things
*Source: The Koerner Office podcast — Brandon Doyle*

> *"If you compound your difficult things, you compound your wins."*

Each friction layer competitors won't copy is exponential, not additive. The "expensive" path (postcards + builds + calls) was 17–20x cheaper per customer than the "cheap" path (cold email).

**Application rule**: When designing any acquisition strategy, ask: what are the two or three things in this process that most competitors will skip because they seem too hard or too expensive? Do all of them. That gap is the moat.

**Applies to**: Sales outreach, product launch, customer onboarding, community building.

---

## Framework 5 — Email-First / Form Factor Rule
*Source: The Koerner Office podcast — Brandon Doyle (DreamTales.ai)*

> *"People don't want another app. Go where they already are."*

**The flag**: Before specifying any consumer product as an app, ask: can this be delivered as an email, a text, or inside a tool the user already opens daily?

- Email delivered at a set time = higher engagement than an app requiring a visit
- iMessage / SMS = highest open rate of any channel
- Existing tools (Slack, Gmail, calendar) = zero friction adoption

**When to build an app anyway**: When the interaction requires a visual interface that email cannot replicate (maps, video, real-time data display, camera use). Otherwise — email first, app later.

**Product-level flag (CB's personality setting)**: If a consumer AI product is being specced as an app and the core value could be delivered as a daily email, flag it. Make the team justify the app before building it.

| Product | Can it be email-first? | Verdict |
|---|---|---|
| Landscaping agent | YES — daily care reminder as email | Lead with email, app is v2 |
| Sports intelligence | PARTIAL — scores need real-time, tips can be email | Email digest + live dashboard |
| Food/chef agent | YES — daily recipe email at 5 PM | Lead with email |
| Personalized morning note | YES — this IS an email product | Never build an app for this |
| News hub | NO — real-time multi-feed requires interface | App/web is correct |
| T&C review | NO — in-context browser action | Extension is correct |

---

## Framework 6 — Token Cost Optimization
*Source: The Koerner Office podcast — Brandon Doyle / OpenClaw*

> 350 websites built for "a handful of cents each" by routing to Chinese open-source models (DeepSeek, Qwen, Kimi).

**The rule**: Route tasks to the cheapest model that delivers acceptable quality. Reserve premium models (Claude Sonnet/Opus) for tasks requiring highest reasoning quality. Use free or near-free models (Groq/Llama, Gemini Flash, DeepSeek) for volume, formatting, and extraction tasks.

**CB's existing implementation**: `api/summarize.js` already does this — Groq → Gemini → Claude fallback chain. This IS the cost optimization pattern. Extend this architecture to all new agent builds.

| Task Type | Recommended Model | Cost |
|---|---|---|
| Bulk content generation, formatting | DeepSeek, Qwen, Groq/Llama | Near zero |
| Extraction, classification, summarization | Gemini Flash, Groq | Free tier |
| Highest-quality reasoning, nuanced analysis | Claude Sonnet | Paid — reserve for this |
| Real-time, fast responses | Groq (700 tok/s) | Free |

---

## Framework 7 — The Houston Play Template
*Source: The Koerner Office podcast — adapted for CB*

The specific execution template for the local small business outreach play. Applies to Houston HVAC, plumbing, electrical, roofing, landscaping, and industrial services.

**Three-Layer Cake applied:**
- **Agent layer**: Scrape Google Business Profiles → build websites → trigger Lob.com postcard
- **Friction signal**: Physical postcard with QR code to the custom-built website
- **Close**: Phone call to QR scanners (intent-filtered list) — CB or sales person

**Economics (podcast benchmark):**
- 350 targets → ~$420 total cost → 17–20 paying customers → ~$8K MRR
- ~20% postcard scan rate → 90% of closes came from scanners
- Cost per acquired customer: ~$21–$25
- Payback period: under one week at $300+/month packages

**CB's edge over the podcast's play:**
- Houston network = pre-warmed relationships (faster close, higher trust)
- Energy industry adjacency = natural in with HVAC, electrical, industrial services
- AI mastery = better product delivery for what customers actually pay for

**Self-quiz before running:**
1. What is my Houston agent layer? (scrape → build → mail)
2. What is my friction signal? (postcard + website, or do I add something CB-specific?)
3. What is my close? (phone call, or does CB's network allow a direct intro?)
4. What is my fourth hard thing? (hand-delivery? personalizing the website with their logo and real photos?)

---

## Applying the Frameworks — Quick Reference

| Decision | Framework to Use |
|---|---|
| Should I pursue this idea? | Builder Filter + Autonomous Filter |
| How do I structure the sales/acquisition for this product? | Three-Layer Cake |
| What's my 4th hard thing? | Compounding Hard Things |
| Should this be an app or email? | Email-First / Form Factor Rule |
| Which AI model for which task? | Token Cost Optimization |
| Running the Houston play? | Houston Play Template |
