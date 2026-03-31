# Sift — Architecture

**Version:** 2.1
**Date:** March 31, 2026
**Live:** siftnews.kristenmartino.ai

---

## System architecture

```
                    ┌──────────────────────────┐
                    │       User (browser)      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │       VERCEL (Hobby)      │
                    │                           │
                    │  Next.js 15 (App Router)  │
                    │  ┌─────────────────────┐  │
                    │  │ /api/news?cat=X     │──┼──▶ Postgres (read)
                    │  │ /api/news/topic?q=X │──┼──▶ Postgres (vector search)
                    │  │ /api/news/stream    │──┼──▶ Postgres + SSE
                    │  │ /api/compare        │──┼──▶ Railway (proxy)
                    │  │ /api/cron/refresh   │──┼──▶ Railway (trigger)
                    │  └─────────────────────┘  │
                    │                           │
                    │  Clerk (auth)              │
                    │  Sentry (errors)           │
                    │  Vercel Analytics          │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   RAILWAY (~$5/mo)       │          │  NEON POSTGRES (free)    │
│                          │          │  (standalone)            │
│  FastAPI + LangGraph     │          │                          │
│  ┌────────────────────┐  │          │  articles (+ pgvector)   │
│  │ /pipeline/refresh  │──┼──────▶   │  custom_topics           │
│  │   RSS → Claude     │  │          │  bookmarks               │
│  │   → Voyage → DB    │  │          │  pipeline_state          │
│  ├────────────────────┤  │          │                          │
│  │ /analyze/compare   │──┼──────▶   │                          │
│  │   LangGraph:       │  │          │                          │
│  │   fan-out → merge  │  │          │                          │
│  └────────────────────┘  │          │                          │
│                          │          │                          │
│  Claude Haiku (summary)  │          │                          │
│  Voyage AI (embeddings)  │          │                          │
└──────────────────────────┘          └──────────────────────────┘
```

---

## Data flow: fixed category (90% of requests)

```
User opens Sift → clicks "Technology"
  → GET /api/news?category=technology
  → Next.js route queries Postgres:
      SELECT * FROM articles
      WHERE category = 'technology'
      ORDER BY published_date DESC
      LIMIT 10
  → Returns JSON in <50ms
  → Client renders article cards with staggered animation
```

No AI calls. No caching logic. Pure database read. This is why cold starts don't matter.

---

## Data flow: custom topic

```
User types "AI policy in European healthcare"
  → GET /api/news/topic?q=AI+policy+European+healthcare
  → Next.js route:
      1. Embed query via Voyage AI (<50ms)
      2. Vector similarity search in Postgres:
         SELECT *, 1 - (embedding <=> $1) AS similarity
         FROM articles
         WHERE 1 - (embedding <=> $1) > 0.35
         ORDER BY similarity DESC
         LIMIT 10
      3. If >= 3 results → return immediately
      4. If < 3 results → fallback to Claude web_search
         → Summarize + embed results
         → Store in Postgres for future queries
         → Return to user
  → Client renders results
```

---

## Data flow: background pipeline (every 10 min)

```
Railway asyncio scheduler fires (or Vercel cron fallback)
  → LangGraph pipeline workflow:

      ┌──────────┐
      │ fetch_rss │  Fetch all RSS feeds (~100+ feeds, <5s total)
      └─────┬─────┘
            ▼
      ┌────────────┐
      │ deduplicate │  Check source_url against Postgres
      └─────┬──────┘   Skip articles already indexed
            ▼
      ┌───────────────┐
      │ summarize     │  Batch new articles → Claude Haiku
      │ (Claude)      │  "Summarize these 5 articles in 1-2 sentences each"
      └─────┬─────────┘  (~2-3s per batch of 5)
            ▼
      ┌──────────────┐
      │ embed         │  Batch article texts → Voyage AI
      │ (Voyage)      │  Generate 1024-dim embeddings
      └─────┬────────┘   (<1s per batch)
            ▼
      ┌──────────┐
      │ store     │  Upsert into Postgres
      └─────┬────┘   Update pipeline_state table
            ▼
          DONE        Total: ~5-10s per refresh cycle
```

---

## Data flow: multi-source comparison

```
User clicks "Compare coverage" on a story
  → POST /api/compare { topic: "Fed rate decision" }
  → Next.js proxies to Railway: POST /analyze/compare
  → LangGraph comparison workflow:

      ┌──────────────┐
      │  START        │
      │  (topic)      │
      └──────┬───────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
  ┌─────┐ ┌─────┐ ┌─────┐
  │ Src │ │ Src │ │ Src │  Parallel Claude web_search
  │ REU │ │ BBC │ │ AP  │  "Search [outlet] for: [topic]"
  └──┬──┘ └──┬──┘ └──┬──┘
     └────┬───┘───┬───┘
          ▼       │
    ┌─────────────▼──┐
    │ extract_claims  │  Pull key facts from each source
    └──────┬─────────┘
           ▼
    ┌──────────────┐
    │ compare      │  Find agreements, disputes, unique angles
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │ format       │  Structure as comparison JSON
    └──────────────┘
```

---

## Why this architecture

| Principle | How it's applied |
|-----------|-----------------|
| AI out of request path | Background pipeline generates; API routes serve from DB |
| Right tool for each job | Next.js for frontend + simple reads; LangGraph for multi-step workflows |
| Single source of truth | Postgres stores everything; no in-memory cache to lose |
| Cost scales with content, not users | Claude costs are fixed (~$4/mo for pipeline). 1 user or 10,000 users costs the same. Total: ~$9/mo. |
| Progressive enhancement | Fixed categories work without auth. Custom topics and comparison require sign-in. |
| Graceful degradation | If pipeline fails, articles are stale but still served. If comparison fails, user gets an error, not a crash. |

---

## Technology choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 15 (App Router) | Best React DX, Vercel-native, TypeScript |
| Backend | Python FastAPI | LangGraph requires Python; FastAPI is async and fast |
| Orchestration | LangGraph | Genuine need: pipeline has sequential steps, comparison has fan-out/merge |
| AI (summaries) | Claude Haiku 4.5 | Cheapest, fast enough for news summaries |
| AI (search) | Claude + web_search | Used in comparison workflow and custom topic fallback |
| Embeddings | Voyage AI (voyage-3-lite) | Free 50M tokens/mo, high-quality retrieval embeddings |
| Database | Neon PostgreSQL + pgvector | Relational + vector search in one; auto-suspend, pooled connections |
| Auth | Clerk | 5-min setup, free to 10K MAU, polished UI |
| Hosting (web) | Vercel (Hobby) | Preview deploys, CDN, auto-deploy from GitHub |
| Hosting (api) | Railway | Persistent process for LangGraph, $5/mo |
| Monitoring | Sentry + Vercel Analytics | Errors + usage, both free tier |

---

## Scaling path

| Users | What changes | Cost |
|-------|-------------|------|
| 1-1K | Nothing. Current architecture handles it. | ~$9/mo |
| 1K-10K | Add Postgres connection pooling (PgBouncer). Increase pipeline frequency. | ~$50/mo |
| 10K-50K | Upgrade Neon plan. Add Redis for hot cache layer. Multiple Railway instances. | ~$200/mo |
| 50K+ | Dedicated Postgres. Background workers on dedicated compute. You have revenue. | $500+ |
