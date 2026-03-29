# Sift — Project Plan & Status

**Date:** February 23, 2026
**Last Updated:** March 28, 2026
**Status:** Week 1 complete — Python pipeline live, 479 articles in Postgres, starting Week 2
**Stack:** Next.js 15 / TypeScript / Tailwind CSS / Python FastAPI + LangGraph / Postgres + pgvector

---

## Current state

### v1.5 frontend (sift/) — working, pending v2 rewrite

The Next.js app is live on `localhost:3000` with Claude `web_search` as the content engine. All 7 categories load AI-generated summaries. This will be rewritten in Week 2 to read from Postgres instead.

| Layer | Implementation | Status |
|-------|---------------|--------|
| UI Framework | React components in Next.js App Router | Working |
| State Management | Custom hooks + localStorage | Working |
| API Integration | Server-side Claude `web_search` | Working (to be replaced) |
| Styling | Tailwind CSS + CSS custom properties | Working |
| Caching | In-memory Map + persistent disk (`/tmp/sift-cache/`) | Working (to be replaced) |
| Image pipeline | Claude → OG scraping → HEAD validation | Working (to be simplified) |
| Testing | Jest + RTL, 80 test cases | Passing |
| Dark/light mode | CSS variables + localStorage toggle | Working |
| Bookmarks | localStorage persistence | Working |

### v2 backend (sift-api/) — Week 1 complete

The Python FastAPI + LangGraph pipeline service is built and tested end-to-end. Running locally on `localhost:8000` with Docker Postgres on `localhost:5432`.

| Layer | Implementation | Status |
|-------|---------------|--------|
| FastAPI server | Health endpoint, CORS, lifespan DB pool | **Done** |
| Postgres schema | 4 tables: articles, custom_topics, bookmarks, pipeline_state | **Done** |
| Docker Compose | pgvector/pgvector:pg16 on port 5432 | **Done** |
| LangGraph pipeline | fetch_rss → deduplicate → summarize → embed → store | **Done** |
| RSS feeds | 56 feeds across 7 categories | **Done** |
| Claude summarization | Haiku 4.5 batch summaries, 3-strategy JSON parser | **Done** |
| Voyage AI embeddings | voyage-3-lite, 1024-dim (needs API key) | **Scaffolded** |
| Pipeline auth | X-Pipeline-Key header validation | **Done** |
| Deduplication | Batch URL check against Postgres | **Done** |
| Dockerfile + Railway config | Production-ready | **Done** |
| Tests | 40 passing (RSS, summarizer, health, router) | **Passing** |
| Git repo | 3 commits on main | **Done** |

**Pipeline results (full run):**
- 479 articles stored across all 7 categories
- All with AI summaries from Claude Haiku
- Zero errors
- Deduplication verified: second run skips all existing articles
- ~6.5 minutes for full 56-feed refresh

### File maps

```
sift/                          (26 source files, 2,601 LOC)
├── app/
│   ├── api/news/route.ts           512 LOC  ← Claude web_search (to be rewritten)
│   ├── globals.css                  73 LOC
│   ├── layout.tsx                   30 LOC
│   └── page.tsx                      5 LOC
├── components/
│   ├── NewsAggregator.tsx          255 LOC
│   ├── ArticleCard.tsx             124 LOC
│   ├── CardImage.tsx                64 LOC
│   ├── SkeletonCard.tsx             41 LOC
│   ├── ErrorState.tsx               23 LOC
│   └── index.ts                      5 LOC
├── lib/
│   ├── hooks.ts                    156 LOC
│   ├── utils.ts                    135 LOC
│   ├── types.ts                     84 LOC
│   ├── constants.ts                 87 LOC
│   └── cache.ts                     54 LOC  ← to be removed
├── __tests__/                       867 LOC (80 tests)
└── docs/

sift-api/                      (16 source files, ~1,200 LOC)
├── app/
│   ├── main.py                      FastAPI app, health endpoint
│   ├── config.py                    pydantic-settings
│   ├── db.py                        asyncpg connection pool
│   ├── models.py                    Pydantic schemas
│   └── routers/
│       ├── pipeline.py              POST /pipeline/refresh
│       └── compare.py               POST /analyze/compare (stub)
├── workflows/
│   ├── pipeline_workflow.py         LangGraph: 5-node state graph
│   └── compare_workflow.py          stub
├── services/
│   ├── rss.py                       56 RSS feeds, feedparser, image extraction
│   ├── summarizer.py                Claude Haiku batch summarization
│   ├── embedder.py                  Voyage AI embeddings
│   └── deduplicator.py              Postgres dedup check
├── tests/                           40 tests
├── docker-compose.yml               Postgres 16 + pgvector
├── init.sql                         DB schema
├── Dockerfile
└── railway.toml
```

---

## v2 build sequence

| # | Task | Status |
|---|------|--------|
| 1 | Postgres schema + migrations | **Done** |
| 2 | Python FastAPI service scaffold | **Done** |
| 3 | LangGraph pipeline workflow (RSS → Claude → Voyage → store) | **Done** |
| 4 | RSS feed integration (56 feeds, 7 categories) | **Done** |
| 5 | Next.js API routes rewrite (Postgres reads) | Pending (Week 2) |
| 6 | Card redesign — text-first + RSS images | Pending (Week 2) |
| 7 | Vercel Cron configuration | Pending (Week 2) |
| 8 | Clerk auth integration | Pending (Week 2) |
| 9 | Custom topics — vector search + fallback | Pending (Week 3) |
| 10 | SSE streaming for article delivery | Pending (Week 2) |
| 11 | LangGraph comparison workflow | Pending (Week 3) |
| 12 | Landing page at siftnews.ai | Pending (Week 3) |

---

## What's next: Week 2

Rewrite the Next.js frontend to read from Postgres instead of calling Claude directly. This is the core v2 shift — AI moves out of the request path.

**Key changes:**
1. **New `lib/db.ts`** — Postgres client (Neon serverless driver or @vercel/postgres)
2. **Rewrite `app/api/news/route.ts`** — `SELECT * FROM articles WHERE category = $1 ORDER BY published_date DESC LIMIT 7` instead of Claude web_search
3. **Add `app/api/cron/refresh/route.ts`** — Vercel Cron handler that triggers Railway pipeline
4. **Remove `lib/cache.ts`** — Postgres is the cache now
5. **Simplify `CardImage.tsx`** — RSS images or text-first, no OG scraping
6. **Update `ArticleCard.tsx`** — text-first variant for articles without images
7. **Add Clerk auth** — ClerkProvider, middleware, sign-in/sign-up pages
8. **Update tests** — adapt to Postgres reads instead of Claude mocks

---

## Bugs fixed (v1 → v1.5)

| # | Bug | Fix |
|---|-----|-----|
| B1 | Non-unique IDs (`Date.now()` in `.map()`) | `stableHash(source_url)` for deterministic IDs |
| B2 | Hex+alpha (`catColor + "18"`) | `rgba(${color.rgb}, 0.08)` via CATEGORY_COLORS |
| B3 | `transition: "all"` causing jank | Specific `transform, box-shadow` transitions |
| B4 | `<cite>` tags in summaries from Claude | `stripCitations()` in normalizeArticle |
| B5 | No `noopener` on `window.open` | Added `"noopener"` parameter |
| B6 | `<link>` re-inserted every render | Moved to `globals.css` `@import` |
| B7 | `palette` object recreated every render | Moved to `CATEGORY_COLORS` module constant |
| B8 | AbortController shared across categories | Per-category Map of controllers |
| B9 | HMR breaks refs (null → Set/Map) | Runtime type guards on ref access |
| B10 | `request.ip` doesn't exist on NextRequest | Use x-forwarded-for / x-real-ip |
| B11 | `cache` export conflicts with Next.js reserved names | Extracted to lib/cache.ts |
| B12 | Images blocked by `Sift/1.0` User-Agent | Browser User-Agent for HEAD requests |

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2/23/26 | Anthropic web_search over NewsAPI | Single API, AI summaries, no extra keys |
| 2/23/26 | "Summarize" prompt framing | Model refuses rigid JSON from search snippets |
| 2/23/26 | Next.js 15 App Router | Best React DX, built-in API routes, Vercel deploy |
| 2/23/26 | Tailwind CSS | Matches Next.js ecosystem, design token support |
| 2/23/26 | Jest + RTL over Vitest | Next.js native support, wider ecosystem |
| 3/25/26 | Migrate from NewsAPI to Claude web_search | Full control, AI-native content engine |
| 3/28/26 | 3-layer image pipeline | Claude → OG scraping → HEAD validation |
| 3/28/26 | Persistent disk cache | Cold start: 20s → <400ms |
| 3/28/26 | v2: RSS hybrid + Postgres + LangGraph | Background pipeline, <50ms reads (see DECISIONS.md) |
| 3/28/26 | 56 RSS feeds (expanded from 28) | Added Axios, Hacker News, Economist, ArXiv, etc. |
