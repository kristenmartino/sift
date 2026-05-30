# Sift — Project Plan & Status

**Date:** February 23, 2026
**Last Updated:** March 31, 2026
**Status:** Production live at siftnews.kristenmartino.ai — all features shipped
**Stack:** Next.js 15 / TypeScript / Tailwind CSS / Python FastAPI + LangGraph / Neon Postgres + pgvector

---

## Current state — Production (March 31, 2026)

### Frontend (sift/) — live on Vercel

| Layer | Implementation | Status |
|-------|---------------|--------|
| UI Framework | React + Next.js 15 App Router | **Live** |
| State Management | Custom hooks + localStorage + Clerk sync | **Live** |
| API Integration | Postgres reads (categories), SSE streaming (topics), Railway proxy (compare) | **Live** |
| Styling | Tailwind CSS + CSS custom properties (Newsprint/Late Edition themes) | **Live** |
| Brand Identity | SiftLogo component (diamond mark, 4 variants) | **Live** |
| Topic Search | Voyage AI embeddings + pgvector + Claude web search fallback | **Live** |
| Multi-Source Compare | Proxied to Railway LangGraph workflow | **Live** |
| Auth | Clerk (sign-in, bookmarks sync) | **Live** |
| Testing | Jest + RTL | Passing |
| CI/CD | GitHub Actions (tsc) + Vercel auto-deploy | **Live** |

### Backend (sift-api/) — live on Railway

| Layer | Implementation | Status |
|-------|---------------|--------|
| FastAPI server | Health, CORS, lifespan DB pool, background scheduler | **Live** |
| LangGraph pipeline | fetch_rss → deduplicate → summarize → embed → store | **Live** |
| LangGraph compare | search_sources → extract_and_compare → format_response | **Live** |
| RSS feeds | 100+ feeds across 10 categories | **Live** |
| Claude Haiku 4.5 | Batch summaries + comparison analysis + web search | **Live** |
| Voyage AI embeddings | voyage-3-lite, 1024-dim | **Live** |
| Background refresh | asyncio scheduler, every 30 minutes | **Live** |
| CI/CD | GitHub Actions (ruff + pytest) + Railway auto-deploy | **Live** |

### Database — Neon Postgres (free tier)

| Table | Purpose | Status |
|-------|---------|--------|
| articles | News articles + embeddings + summaries | **Live** (IVFFlat index) |
| custom_topics | User-defined topic queries | **Live** |
| bookmarks | User bookmarks (Clerk ID) | **Live** |
| pipeline_state | Last refresh timestamps | **Live** |

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

## Build sequence — all complete

| # | Task | Status |
|---|------|--------|
| 1 | Postgres schema + migrations | **Done** |
| 2 | Python FastAPI service scaffold | **Done** |
| 3 | LangGraph pipeline workflow (RSS → Claude → Voyage → store) | **Done** |
| 4 | RSS feed integration (100+ feeds, 10 categories) | **Done** |
| 5 | Next.js API routes rewrite (Postgres reads) | **Done** |
| 6 | Card redesign — text-first + RSS images | **Done** |
| 7 | Background refresh (Railway asyncio scheduler) | **Done** |
| 8 | Clerk auth integration | **Done** |
| 9 | Custom topics — vector search + web search fallback (SSE) | **Done** |
| 10 | SSE streaming for topic search | **Done** |
| 11 | LangGraph comparison workflow | **Done** |
| 12 | Landing page | **Done** |
| 13 | 3 new categories (politics, sports, entertainment) | **Done** |
| 14 | Production deploy (Vercel + Railway + Neon) | **Done** |
| 15 | CI/CD (GitHub Actions both repos) | **Done** |
| 16 | Brand identity (B4 color story + B2 SiftLogo) | **Done** |

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
| 3/29/26 | Neon Postgres (standalone) over Vercel Postgres | More control, same tech, free tier |
| 3/29/26 | Railway asyncio scheduler over Vercel Cron | Avoids Pro plan requirement |
| 3/30/26 | 10 categories (added politics, sports, entertainment) | Broader coverage, portfolio showcase |
| 3/30/26 | Production deploy: Vercel + Railway + Neon | siftnews.kristenmartino.ai live |
| 3/31/26 | B4: Named color palettes (Newsprint / Late Edition) | Warm editorial tones, semantic category colors |
| 3/31/26 | B2: SiftLogo diamond mark component | Replaces hardcoded text everywhere |
