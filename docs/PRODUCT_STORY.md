# Sift: 0→1 Product Story

## A News Aggregator with Civic Footnotes — How Sift Found Its Shape

---

### The bet

The news-aggregation market is saturated. Apple News, Google News, Perplexity Discover, every wire-feed reader — they converged on the same shape: pull headlines, summarize, list by recency. I started Sift believing the gap was upstream of the reader: that AI-curated summaries from live web search, AI-powered topic search across categories, and multi-source comparison could deliver three things wire feeds couldn't — broader source diversity, summaries written for comprehension rather than clicks, and topic coverage shaped by structured subtopics rather than editorial choice.

That was the hypothesis I wrote into the first PRD. It assumed the bottleneck for serious readers was volume and selection — *more, better, fresher.* I built v1 around it: AI summaries from Claude's web-search tool, 7 categories (later 10), 100+ feeds, all generated live at click time.

---

### The test

The prototype shipped. The architecture got harder than I expected. Claude's web-search tool refused to format results as rigid JSON, so I reframed the prompt from data extraction to summarization — the model could "summarize the top five stories you found" but not "return a JSON array of search snippets." I built a three-strategy JSON parser to handle the unpredictable response shapes. I migrated from a single-file React artifact to Next.js with server-side API keys, deterministic article IDs, and 30+ tests. Phase 2 hardened the error pipeline; Phase 3 split the system into a Python/LangGraph backend on Railway and a Next.js frontend on Vercel reading from Neon Postgres. Every story summary, every topic search, every cross-source comparison ran through the pipeline.

I used the product daily. So did the friends I asked to try it. That's when two things broke the original hypothesis.

---

### The surprise

**Latency.** Live web-search-driven generation cost 15+ seconds per category load. I patched this by moving the AI off the user's critical path: a background pipeline writes to Postgres on a schedule, the frontend serves enriched content from cache. Live browse latency went from 15s to ~50ms. (Multi-source compare and topic search still take ~10–15s — they run AI live and accept the latency because the user is asking for analysis, not browsing. Two paths by SLA.)

**The AI-summary layer alone wasn't the differentiator.** Multi-source comparison was supposed to be the headline feature. In production, when the corpus is curated mainstream sources, the "different framings" are usually surface variations of the same coverage. The compare view kept producing outputs that were technically interesting and substantively dull. Asking AI to compare three wire descriptions of the same Senate vote tells the reader they all said roughly the same thing — which a reader could see by skimming the three headlines.

The bottleneck wasn't volume, source diversity, or cross-source disagreement. The bottleneck was that **most readers don't know who the players are.** They can read five outlets on the same vote and still not know who the senator is, what the bill does, what the relevant lobbying body wants, or how the framing has shifted from the last time the question came up. The thing they actually need is not better summaries — it's the political, organizational, and legislative scaffolding around each story.

---

### The revision

So I kept the aggregator and added a civic-literacy layer on top.

The aggregator continues to do what an aggregator does — 10 categories, ~50 outlets, AI summaries pre-computed in the background pipeline, topic search via vector similarity with SSE streaming, multi-source comparison via LangGraph fan-out. That's the daily-driver experience that builds the habit. The AI work is still there, just split by SLA: the browse path is pre-computed and serves from Postgres in ~50ms; multi-source compare and topic search run live and accept ~10–15s.

What got added is the civic-literacy layer:

- **"What you should know first"** — an adaptive primer above each story. Key terms and context the article assumes the reader already has, AI-generated at ingest, expandable when the story sits on top of complex policy.
- **Inline glossary** — civic terms surface contextually inside the article. Chip pills with tooltip previews; click-through to the full dossier.
- **Civic dossiers** for politicians (committee assignments, top industries by PAC contributions, interest-group ratings, links to GovTrack / OpenSecrets / Vote Smart), organizations (political lean, finances, major funders, FARA registration, links to ProPublica Nonprofit Explorer / IRS 990 / FARA), bills (status, sponsor, cosponsors, lobbying spend, links to GovTrack / Congress.gov / OpenSecrets), and news outlets (ownership, funding, AllSides political-lean, MBFC factual-reporting). All sourced from public records.
- **Cross-spectrum framing** — when multiple outlets cover the same story, what each chose to emphasize. AllSides and MBFC ratings shown verbatim — Sift never computes its own.

The combination is what changed. An aggregator without civic context is a commodity — every news app shows the same Reuters and AP stories. A civic-context tool without the daily news flow is a research database — useful when you need it, not a daily-driver. *Aggregator + civic footnotes* is what makes Sift Sift.

The pipeline grew from a single summarization step to ten services on Railway: primer generation, entity extraction, entity linking to dossiers, summarization, story synthesis, story clustering, civic-context generation, batched API client, cross-source comparison workflow, usage tracking. The AI is still load-bearing — but it's infrastructure in service of both layers, not the product itself.

I also built things I didn't ship. An early version had TrustSignal, PropagandaTag, and ExtremistFlag — judgment-layer features for rating source quality. Applied to a mainstream-source corpus, they produced nothing meaningful: every outlet looked roughly trustworthy because they roughly are. Worse, applying them would have meant making claims I couldn't defend at the corpus level. I left them out of the shipped surface. (The genuinely useful version of that layer applies to *propaganda* outlets, not mainstream ones — a different product on a different corpus with a different audience.)

---

### What I learned

Three things, in order of how much they changed my thinking:

1. **Product-shape questions reveal themselves only in contact with reality.** The "compare three wire descriptions of the same Senate vote" UX failure didn't show up in design review. It showed up in usage. The right move was to take the framing instinct ("readers want to compare outlets") seriously enough to ship it — then take the failure seriously enough to add a layer when it landed flat.

2. **Engineering decisions can quietly shape product hypotheses.** When the original architecture hit 15s latency on every click, the engineering fix (move AI off the critical path) was correct. But the patch also meant the AI was no longer visible to users as a product feature, which forced a sharper question: if the AI runs in the background, what is the product the user actually sees? The answer became civic literacy.

3. **The aggregator was the foundation; the civic-literacy layer is the moat.** Building a working AI-powered news aggregator with 10 categories, vector-search topic discovery, and multi-source compare is real engineering — but it's an engineering problem with a known shape. Building the dossier graph, the inline glossary, the public-records pipeline, the methodology is the part that hasn't been done at this resolution. Both layers matter; one is the daily-driver, the other is what makes the daily-driver worth opening.

---

### What's next

The civic layer is dense; making the article surface heavier would undo it. The next moves are about precision, not addition — per-paragraph primer triggering (instrumentation in flight), observation-mode cross-spectrum compare, deeper dossier coverage on the entities that show up most often, methodology that scales as the corpus grows. Same direction; tighter execution.

The product is the aggregator that adds the civic context the news assumes you already have. *Read the headline; learn the civics as you go.*
