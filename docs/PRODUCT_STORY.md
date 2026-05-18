# Sift: 0→1 Product Story

## Civic Literacy in a News Reader — How Sift Found Its Shape

---

### The bet

The news-aggregation market is saturated. Apple News, Google News, Perplexity Discover, every wire-feed reader — they converged on the same shape: pull headlines, summarize, list by recency. I started Sift believing the gap was upstream of the reader: that AI-curated summaries from live web search could deliver three things wire feeds couldn't — broader source diversity, summaries written for comprehension rather than clicks, and topic coverage shaped by structured subtopics rather than editorial choice.

That was the hypothesis I wrote into the first PRD. It assumed the bottleneck for serious readers was volume and selection — *more, better, fresher.* I built v1 around it: AI summaries from Claude's web-search tool, 7 categories, 100+ feeds, all generated live at click time.

---

### The test

The prototype shipped. The architecture got harder than I expected. Claude's web-search tool refused to format results as rigid JSON, so I reframed the prompt from data extraction to summarization — the model could "summarize the top five stories you found" but not "return a JSON array of search snippets." I built a three-strategy JSON parser to handle the unpredictable response shapes. I migrated from a single-file React artifact to Next.js with server-side API keys, deterministic article IDs, and 30+ tests. Phase 2 hardened the error pipeline; Phase 3 split the system into a Python/LangGraph backend on Railway and a Next.js frontend on Vercel reading from Neon Postgres. Every story summary, every topic search, every cross-source comparison ran through the pipeline.

I used the product daily. So did the friends I asked to try it. That's when two things broke the original hypothesis.

---

### The surprise

**Latency.** Live web-search-driven generation cost 15+ seconds per category load. I patched this by moving the AI off the user's critical path: a background pipeline writes to Postgres on a schedule, the frontend serves enriched content from cache. Live latency went from 15s to ~50ms. Architecturally clean. But the patch surfaced a deeper question: if the AI work doesn't have to happen at click time, what's it actually *for* — and what is the user supposed to see that's distinctive?

**The substantive disagreement wasn't where I thought.** Multi-source comparison was supposed to be the headline feature. In production, when the corpus is curated mainstream sources (Reuters, AP, BBC, NYT, WSJ, Bloomberg, etc.), the "different framings" are usually surface variations of the same coverage. The compare view kept producing outputs that were technically interesting and substantively dull. Asking AI to compare three wire descriptions of the same Senate vote tells the reader they all said roughly the same thing — which a reader could see by skimming the three headlines.

The bottleneck wasn't volume, source diversity, or cross-source disagreement. The bottleneck was that **most readers don't know who the players are.** They can read five outlets on the same vote and still not know who the senator is, what the bill does, what the relevant lobbying body wants, or how the framing has shifted from the last time the question came up. The thing they actually need is not more articles — it's the political, organizational, and legislative scaffolding embedded around each story.

---

### The revision

That insight reshaped the product. The hypothesis I started with — *an AI-curated alternative to wire-feed aggregators* — turned out not to point at the right differentiator. The differentiator was never the AI. It was **civic decoding.** Sift isn't "news synthesized by AI." It's *news that teaches you the politics behind it as you read.*

The AI is still load-bearing. The pipeline grew from a single summarization step to ten services on Railway: primer generation, entity extraction, entity linking to dossiers, summarization, story synthesis, story clustering, civic-context generation, batched API client, cross-source comparison workflow, usage tracking. But the AI is infrastructure now, not the product. The product is the reader being able to follow a story without first having to research who everyone is.

Concretely, that meant building four surfaces:

- **Civic dossiers** for politicians (committee assignments, top industries by PAC contributions, interest-group ratings, links to GovTrack / OpenSecrets / Vote Smart), organizations (political lean, finances, major funders, FARA registration, links to ProPublica Nonprofit Explorer / IRS 990 / FARA), bills (status, sponsor, cosponsors, lobbying spend, links to GovTrack / Congress.gov / OpenSecrets), and news outlets (ownership, funding, AllSides political-lean, MBFC factual-reporting). All sourced from public records.
- **Inline glossary** for civic terms inside the article itself — chip pills with tooltip previews and click-through to the full dossier.
- **Adaptive primers** that expand when a story sits on top of complex policy.
- **Cross-spectrum framing** that describes what each outlet emphasized rather than labeling them. AllSides and MBFC ratings shown verbatim — Sift never computes its own.

I also built things I didn't ship. An early version had TrustSignal, PropagandaTag, and ExtremistFlag — judgment-layer features for rating source quality. Applied to a mainstream-source corpus, they produced nothing meaningful: every outlet looked roughly trustworthy because they roughly are. Worse, applying them would have meant making claims I couldn't defend at the corpus level. I left them out of the shipped surface. (The genuinely useful version of that layer applies to *propaganda* outlets, not mainstream ones — a different product on a different corpus with a different audience.)

---

### What I learned

Three things, in order of how much they changed my thinking:

1. **Product-shape questions reveal themselves only in contact with reality.** The "compare three wire descriptions of the same Senate vote" UX failure didn't show up in design review. It showed up in usage. The right move was to take the framing instinct ("readers want to compare outlets") seriously enough to ship it — then take the failure seriously enough to redirect the product when it landed flat.

2. **Engineering decisions can quietly undo product hypotheses.** When the original architecture hit 15s latency on every click, the engineering fix (move AI off the critical path) was correct. But it also rendered the original "AI-curated alternative" framing thinner than I realized — the AI was no longer visible to users as a product feature. The fix solved the symptom; the framing needed to follow.

3. **The civic-literacy layer was always the unfakeable part.** Anyone with an API key can build "AI summaries of the news." Building the dossier graph, the inline glossary, the public-records pipeline, the methodology — none of that is something to spin up over a weekend. It's the part of Sift that has cost the most and matters the most. It's also the part a hiring manager can verify by reading a dossier and clicking the citation.

---

### What's next

The next version is about making the civic layer denser without making the article surface heavier — per-paragraph primer triggering, observation-mode cross-spectrum compare, deeper dossier coverage on the entities that show up most often, methodology that scales as the corpus grows. Same direction; tighter execution.

The product is for the reader who wants to follow what's happening without already knowing the players. *Read the headline; learn the civics as you go.*
