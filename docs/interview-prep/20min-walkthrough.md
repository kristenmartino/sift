# 20-minute technical walkthrough

The deep-dive version for a technical interview. Pace: ~5 min per major section, with whiteboard breaks. The interviewer is going to interrupt — anticipate the questions in each section and answer them inline.

---

## Opening: the product (~2 min)

Same as [`2min-overview.md`](./2min-overview.md). Pause for questions after.

**Anticipate:**

- *"How do you decide which outlets to include?"* — Methodology page at `/methodology`. 100+ RSS feeds across 10 categories, expanded over time. Outlet selection is documented and symmetric: any outlet with reliable RSS + AllSides/MBFC rating is eligible. No editorial veto power. Methodology is public.
- *"How do you avoid bias?"* — Sift doesn't compute political lean. It surfaces AllSides + MBFC ratings verbatim with citations. The methodology page makes this explicit. Editorial inputs (which dossiers exist, which feeds are in the pool) are documented.

## The architecture (~5 min, whiteboard)

Whiteboard cue: 3 boxes + 1 database.

```
[Vercel: Next.js 15]  →  [Neon Postgres + pgvector]  ←  [Railway: FastAPI + LangGraph]
                              ↑                                ↑
                              └──── user reads ─────────┐      └── pipeline writes
                                                        │              │
[Browser / iPhone]  ←─────────────────────────────────  │              ↓
                                                                  [Claude, Voyage, RSS]
```

Walk through:

1. **Vercel hosts Next.js 15** (App Router, TypeScript). Owns user reads + UI. Server Components fetch from Postgres directly — **no client-side fetch in the browse path.**
2. **Railway hosts FastAPI + LangGraph.** Long-running process — LangGraph workflows need this; Vercel functions cold-start poorly for multi-step orchestration. asyncio scheduler runs pipeline every 10 min. On-demand compare workflow.
3. **Neon Postgres + pgvector** is the single source of truth. Articles + embeddings + dossiers + bookmarks in one DB. pgvector handles both structured queries and vector cosine in the same `WHERE`.

Plus external services: **Claude Haiku 4.5** for summaries + compare. **Voyage AI** for embeddings (free 50M tokens/mo). **Clerk** for auth.

**Anticipate:**

- *"Why two repos?"* — Frontend ships daily; pipeline ships weekly. Different release cadences. Also: different runtimes (TypeScript vs Python). And the pipeline needs a persistent process for LangGraph state, which Vercel functions can't host.
- *"Why Postgres for vectors instead of Pinecone or Weaviate?"* — At Sift's scale (~10K articles), pgvector + partial indexes serves all 30 query shapes under 200ms in production. One database to operate. Vector + structured queries in the same statement (`WHERE category = 'politics' AND embedding <=> $1 < 0.3`). Pinecone would be a separate service to monitor for marginal speed gain. Revisit at ~1M articles.
- *"Why LangGraph instead of bare async or LangChain?"* — Typed state, structured error handling, retry. Pipeline is 5 nodes; compare is 4. Both are easier to reason about as a graph than as nested async functions. The compare workflow has explicit fan-out/merge that benefits from the framework. LangChain monolith was rejected because we only need the workflow primitives, not the full toolkit.

## The pipeline workflow (~4 min)

Whiteboard cue: 5 nodes in sequence + a side branch.

```
fetch_rss → deduplicate → summarize → embed → store
                                                ↓
                                         (per category)
                                                ↓
                          fetch → entity_extract → llm_cluster → synthesize+store
                                  (story threading — 4 nodes)
```

- **fetch_rss** — pulls from 100+ feeds across 10 categories. `feedparser` library. Image URLs extracted from `enclosure` / `media:content` / `media:thumbnail`.
- **deduplicate** — checks against Postgres by `source_url` UNIQUE constraint. Skip if seen.
- **summarize** — batched Claude Haiku calls. ~50 articles per batch. Prompt instructs Claude to write 2–3 paragraph summaries in editorial voice.
- **embed** — Voyage AI `voyage-3-lite`, 1024 dimensions. Batched.
- **store** — `INSERT ... ON CONFLICT DO NOTHING` into `articles` table with the embedding.

Followed by **story threading** (cross-source clustering) — a 4-node workflow per category that groups articles about the same event. Uses **LLM-as-judge**, not embedding similarity — embedding catches same-topic but struggles with same-event. ("EU AI Act vote" and "US AI executive order" embed similarly but are different events.) Claude Haiku judges with ~97% precision.

**Anticipate:**

- *"What if RSS lags breaking news?"* — Tradeoff acknowledged. ~10-minute lag for most outlets. Topic search has Claude `web_search` fallback for niche/breaking queries the indexed pool hasn't seen.
- *"Cost?"* — ~$4/mo Claude. Batched. Per-article cost ~$0.001. Voyage free tier covers all embeddings. Total infra: ~$9/mo current.
- *"Why LLM-as-judge for clustering instead of embedding cosine?"* — Embedding catches same-topic (~90% accuracy). LLM judges distinguish same-event from same-topic (~97%). At Sift's article volume per category (max 50 in a 48h window), a single LLM call handles it. Embedding-prefilter + LLM-refine was rejected — added complexity, no benefit at this scale.

## The civic-literacy layer (~4 min)

This is the differentiator — walk through carefully.

**Dossiers** — curated tables for politicians, organizations, bills, outlets. Hand-curated for accuracy. ~500 politicians (all sitting Congress members via GovTrack scrape), ~50 orgs (think tanks + PACs across spectrum), ~30 bills (active), ~50 outlets (the ones in the feed pool).

**Entity linking** — at ingestion, the pipeline's `entity_linker_llm.py` node resolves mentions in article text to dossier entries. **LLM-gated, A/B-able** — currently rolling out from experimental to default. Stored in `articles.entity_links` JSONB.

**"What you should know first" primer** — AI-generated panel above each article with key terms + context the article assumes you know. Generated at ingestion, no live LLM call. Persisted as `articles.context_primer` JSONB. Expandable in UI.

**Cross-spectrum framing** — when multiple outlets covered the same event (from story threading), Sift shows each outlet's framing bucketed by AllSides political lean.

**Anticipate:**

- *"How do you keep the dossiers current?"* — Funding data is OpenSecrets cycle data, refreshed by cycle. Voting records are GovTrack-sourced and updated periodically. FARA is manual quarterly review. Methodology page documents the cadence.
- *"How accurate is the entity linker?"* — ~85% precision on the LLM-gated rollout. The A/B comparison lets us measure pre/post the fix. Promotion to default-on is gated on hitting target (tracked in sift-api#53).
- *"What stops a politician from gaming the lobbying data?"* — Nothing — that's why the data is from public OpenSecrets filings, not Sift's claims. Sift surfaces what's filed. The methodology link is on every dossier.
- *"How do you handle a publisher sending a DMCA takedown?"* — Pre-drafted counter-notice template; methodology page documents the transformative-use posture; host-portability check confirms `sift-api` deploys cleanly to Fly.io as fallback. Risk audit shows Sift's Railway footprint is low (RSS-sourced summaries, no body HTML stored at rest); real exposure is publisher-direct, which is a separate process.

## The honest retrospective (~3 min)

What I'd change with hindsight — leads with the biggest miss to demonstrate self-awareness:

1. **Started with Claude `web_search` for both discovery and summary.** Took 2 months to learn that's the wrong split. Burned ~$200 in API spend during the wrong-path period. Now: RSS for discovery, Claude only for the summarization it's uniquely good at.

2. **No instrumentation from day 1.** PostHog wired in retroactively. v1 has no D30 retention curves. v1.5 is where analytics actually lands. Lesson: ship analytics before features.

3. **Generic aggregator first, civic-literacy second.** In hindsight, the civic angle was always the differentiator. v2 of the iOS plan revision now has civic-literacy as headline, not footnote — applying that lesson back.

4. **Flirted with a "canonical `/v1/*` API" in the iOS plan.** The cross-functional assessment correctly pushed back — that's the move at maturity, not pre-PMF. Avoided proliferation.

## Where it's going (~2 min)

**v1.5 — civic-literacy pivot — closing out:** dossier coverage parity, entity linker promotion, primer instrumentation. KPIs: D30 retention ≥ 20%, ≥ 40% of sessions tap a primer or entity chip.

**v2 — native client — open platform question.** iOS plan exists but is under review (cross-functional critique flagged parity-shaped scope + premature API). Current lean: Android-first while iOS Apple Developer enrollment processes — turns the enrollment wait into a shipped Android v1.

**Long tail:** multi-source compare native UX, watchOS complications, iPad-optimized layout, daily-briefing audio narrated by Claude.

## Q&A primer

If they ask about anything not covered: *"Happy to dive in — what aspect interests you?"*

If they get philosophical: *"Civic literacy is a public good. Aggregators commodify attention. Sift tries to commodify context. That's the bet."*

If they ask about engineering practice: 60% of merged PRs land within 24 hours of opening. STATUS.md + CLAUDE.md per repo. Per-repo `feed-perf` CI guard catches query regressions before they ship. SessionStart hook auto-loads project state into agent context.

---

*The links in [`docs/HOW_IT_WORKS.md`](../HOW_IT_WORKS.md) go deeper on any layer. Read this doc 2–3 times before an interview. Don't memorize phrasing — internalize the structure.*
