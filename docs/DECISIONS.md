# Sift — Architecture Decision Register

**Last updated:** March 31, 2026
**Status:** All decisions implemented — production live at siftnews.kristenmartino.ai

---

## Summary of decisions

| # | Decision | Choice | Cost | Status |
|---|----------|--------|------|--------|
| D1 | Content engine | RSS hybrid (RSS discovery + Claude Haiku summaries) | ~$4/mo | SETTLED |
| D2 | Hosting | Vercel (frontend) + Railway (Python backend) | ~$5/mo | SETTLED |
| D3 | Caching / persistence | Neon Postgres + pgvector as source of truth | $0 (free tier) | SETTLED |
| D4 | Prompt strategy | "Summarize" framing with structured subtopics | $0 | SETTLED |
| D5 | Card design | Mixed — RSS images when available, text-first accent bar when not | $0 | SETTLED |
| D6 | Content source identity | Anthropic API (not NewsAPI) — this IS the product | $0 | SETTLED |
| D7 | Content pipeline | Background pipeline — AI out of request path | $0 | SETTLED |
| D8 | Database | Vercel Postgres + pgvector | $0 (free tier) | SETTLED |
| D9 | Custom topics | Vector search + prompt rewrite fallback for misses | ~$0.003/miss | SETTLED |
| D10 | Authentication | Clerk (free to 10K MAU) | $0 | SETTLED |
| D11 | LangGraph | Build now — pipeline AND multi-source comparison | $5/mo (Railway) | SETTLED |
| D12 | Monitoring | Sentry + Vercel Analytics (both) | $0 | SETTLED |
| D13 | Streaming | Build as part of initial launch (SSE article delivery) | $0 | SETTLED |
| D14 | Embedding provider | Voyage AI (free 50M tokens/mo) | $0 | SETTLED |
| D15 | Image handling | RSS feed images only — no OG scraping, no proxy | $0 | SETTLED |
| D16 | Background refresh | Railway asyncio scheduler (every 10 min) + Vercel cron fallback | $0 | SETTLED |
| D17 | Model selection | Haiku 4.5 (upgrade to Sonnet is one-line change) | ~$4/mo | SETTLED |

**Total estimated monthly cost: ~$30-50/mo**

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL PRO ($20/mo)                   │
│                                                         │
│  ┌──────────┐    ┌──────────────────────┐               │
│  │  Next.js  │───▶│  /api/news           │──▶ Postgres   │
│  │  React    │    │  (DB read only)      │   (pgvector)  │
│  │  Frontend │    │  <50ms response      │               │
│  │          │    └──────────────────────┘               │
│  │          │    ┌──────────────────────┐               │
│  │          │───▶│  /api/compare         │──▶ Railway     │
│  │          │    │  (proxy to Python)    │   Python svc   │
│  └──────────┘    └──────────────────────┘               │
│                                                         │
│  ┌──────────────────────────────────────┐               │
│  │  Vercel Cron (every 10-15 min)       │               │
│  │  Triggers pipeline refresh           │───▶ Railway    │
│  └──────────────────────────────────────┘               │
│                                                         │
│  Clerk (auth) · Sentry (errors) · Analytics (usage)     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  RAILWAY ($5/mo)                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  FastAPI + LangGraph                              │   │
│  │                                                   │   │
│  │  POST /pipeline/refresh                           │   │
│  │    → Fetch RSS feeds (instant)                    │   │
│  │    → Claude Haiku summarize (2-3s per batch)      │   │
│  │    → Voyage AI embed (< 1s)                       │   │
│  │    → Upsert into Postgres                         │   │
│  │                                                   │   │
│  │  POST /analyze/compare                            │   │
│  │    → LangGraph: fan-out search 3 outlets          │   │
│  │    → Extract claims                               │   │
│  │    → Compare & synthesize                         │   │
│  │    → Return comparison                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL POSTGRES / NEON (free tier)          │
│                                                         │
│  articles: id, title, summary, source_url, source_name, │
│            image_url, category, published_date,         │
│            embedding (vector), created_at               │
│                                                         │
│  users: managed by Clerk (external)                     │
│  custom_topics: user_id, name, query, embedding         │
│  bookmarks: user_id, article_id                         │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed decisions

### D1. Content engine
**Decision:** RSS hybrid — RSS feeds for article discovery, Claude Haiku for AI summaries
**Changed from:** Claude doing both search AND summary in one call

**How it works:**
1. Background pipeline fetches RSS feeds from major publishers (instant, free)
2. Claude Haiku receives article titles/URLs and generates AI summaries (2-3s per batch)
3. Articles + summaries stored in Postgres
4. User requests are pure database reads (<50ms)

**Why this is better than the previous approach:**
- RSS is instant and free (vs 10-20s Claude web_search)
- RSS provides reliable image URLs, publication dates, source attribution
- Claude focuses only on summarization (what it's best at) rather than search + summarize
- AI summaries are the differentiator — RSS is just the discovery mechanism
- Fallback: if RSS misses a category (e.g., niche Energy topics), fall back to Claude web_search for that category

**RSS feed sources (initial set):**
- Reuters, AP, BBC, CNN, NPR (general news)
- TechCrunch, Ars Technica, The Verge, Wired (technology)
- Bloomberg, CNBC, Financial Times (business)
- Nature, Science, New Scientist (science)
- Utility Dive, E&E News, Solar Power World (energy)
- Al Jazeera, The Guardian, DW (world)
- STAT News, Health Affairs, WebMD (health)

---

### D2. Hosting
**Decision:** Vercel Pro ($20/mo) for Next.js frontend + Railway ($5/mo) for Python/LangGraph backend
**Changed from:** Railway only

**Why the split:**
- With background pipeline + Postgres, API routes are just DB reads — cold starts don't matter (~20ms query, not 15s Claude call)
- Vercel Pro gives us: Cron (pipeline triggers), Analytics (usage visibility), preview deploys (PR review), auto-SSL, CDN
- Railway hosts the Python FastAPI + LangGraph service as a persistent process (LangGraph workflows need long-running processes)
- This is the hybrid architecture from ARCHITECTURE.md, executed for real

---

### D3. Caching / persistence
**Decision:** Vercel Postgres (Neon) + pgvector as the single source of truth
**Changed from:** In-memory cache + disk persistence

**Why:**
- Articles persist across deploys, crashes, and cold starts
- pgvector enables semantic search for custom topics
- No Redis needed — Postgres handles both structured queries and vector similarity
- Free tier: 256MB storage (thousands of articles)
- In-memory cache can still be used as a hot layer in the Next.js API route for frequently accessed categories

---

### D4. Prompt strategy
**Decision:** "Summarize" framing with structured subtopics
**Unchanged from original**

Now applied specifically to the summary step: Claude receives article titles and URLs from RSS, and writes summaries. Not searching anymore.

---

### D5. Card design
**Decision:** Mixed — RSS images when available, text-first cards with category accent bar when not

**Implementation:**
- If RSS feed provides an image URL → show image card (image top, content below)
- If no image → show text-first card with thin category color bar at top, no image area
- No gradient fallbacks, no OG scraping, no placeholder icons
- Cards with and without images coexist in the grid (like NYT homepage)
- Featured card (first article) uses larger typography whether or not it has an image

---

### D6. Content source identity
**Decision:** Anthropic API — this IS the product
**Unchanged.** The RSS hybrid still uses Claude for summaries. "AI-Curated" still means something.

---

### D7. Content pipeline
**Decision:** Background pipeline — AI runs on a schedule, never in the user's request path

**Flow:**
```
Vercel Cron (every 10-15 min)
  → POST /pipeline/refresh to Railway
  → LangGraph pipeline:
      1. Fetch RSS feeds for all 10 categories
      2. Deduplicate against existing articles in Postgres
      3. Batch new articles → Claude Haiku for summaries
      4. Batch new articles → Voyage AI for embeddings
      5. Upsert into Postgres with category tags
  → User requests: SELECT from Postgres, <50ms
```

**Key insight (from Claude Code):** "The difference between a toy and a product is where the AI runs."

---

### D8. Database
**Decision:** Vercel Postgres + pgvector

**Schema:**
```sql
articles:
  id TEXT PRIMARY KEY
  title TEXT NOT NULL
  summary TEXT
  source_url TEXT UNIQUE
  source_name TEXT
  image_url TEXT
  category TEXT NOT NULL
  published_date TIMESTAMPTZ
  embedding VECTOR(1024)  -- Voyage AI dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()

  INDEX idx_category_created (category, created_at DESC)
  -- FTS index on (title, summary) for keyword search

custom_topics:
  id TEXT PRIMARY KEY
  user_id TEXT NOT NULL  -- Clerk user ID
  name TEXT NOT NULL
  query TEXT NOT NULL
  embedding VECTOR(1024)
  created_at TIMESTAMPTZ DEFAULT NOW()

bookmarks:
  user_id TEXT NOT NULL
  article_id TEXT NOT NULL
  created_at TIMESTAMPTZ DEFAULT NOW()
  PRIMARY KEY (user_id, article_id)
```

---

### D9. Custom topics
**Decision:** Vector search over pre-built article index + Claude web_search fallback for misses

**How it works:**
1. User types "AI policy in European healthcare"
2. Embed query with Voyage AI (<50ms)
3. Vector similarity search against article embeddings in Postgres
4. If ≥3 good matches (similarity > threshold) → return results instantly
5. If <3 matches → fall back to Claude web_search for that specific query, then cache results

**Why combo:** Instant results 90% of the time (broad article pool covers most topics). Claude fallback catches niche/emerging topics the index hasn't seen yet.

---

### D10. Authentication
**Decision:** Clerk (free to 10K MAU)

**Why:** 5-minute setup, polished UI out of the box, free at portfolio scale. Manages user state for custom topics and cross-device bookmark sync. If costs become an issue at scale, migration to NextAuth is moderate effort.

---

### D11. LangGraph
**Decision:** Build now — both pipeline orchestration AND multi-source comparison

**Two LangGraph workflows:**

**Pipeline workflow (runs on cron):**
```
START → fetch_rss → deduplicate → summarize_batch → embed_batch → store → END
```
Sequential, but LangGraph gives error handling, retry, and state management.

**Comparison workflow (on-demand, user-triggered):**
```
START → fan_out_search (3 outlets parallel) → extract_claims → compare_synthesize → format → END
```
This is the portfolio centerpiece — genuine multi-step AI orchestration with fan-out/merge.

**Service:** Python FastAPI on Railway ($5/mo). Connects to same Vercel Postgres instance.

---

### D12. Monitoring
**Decision:** Sentry (error tracking) + Vercel Analytics (usage/performance)

Both free. Set up at deploy time. ~30 minutes total.

---

### D13. Streaming
**Decision:** Build SSE streaming for article delivery as part of initial launch

When a user loads a category for the first time (or custom topic with Claude fallback), articles stream in one by one via server-sent events rather than waiting for all results. Cached reads are still instant.

---

### D14. Embedding provider
**Decision:** Voyage AI (free 50M tokens/mo)

High-quality retrieval embeddings. Free tier covers thousands of articles. No second AI vendor cost. Switching providers is a one-function change if needed later.

---

### D15. Image handling
**Decision:** RSS feed images only — no OG scraping, no proxy, no SSRF concerns

RSS feeds include image URLs via `enclosure`, `media:content`, or `media:thumbnail` tags. Use them when present. When absent, show text-first card (D5). Entire OG scraping pipeline can be removed from codebase.

---

### D16. Background refresh
**Decision:** Railway asyncio scheduler (primary) + Vercel cron route (fallback)
**Changed from:** Vercel Cron (requires Pro plan)

Railway's FastAPI service runs an asyncio background task that refreshes every 10 minutes in production. A Vercel cron route also exists as a manual fallback. This avoids the $20/mo Vercel Pro requirement.

---

### D17. Model selection
**Decision:** Haiku 4.5 for summaries (upgrade to Sonnet is one-line change)

With the RSS hybrid, Claude is only summarizing, not searching. Haiku is sufficient for news summaries. Upgrade path: change model string in the pipeline's summarize step.

---

## Cost summary (actual, March 2026)

| Component | Monthly cost |
|-----------|-------------|
| Vercel (Hobby plan) | $0 |
| Railway (Python service) | ~$5 |
| Neon Postgres (free tier) | $0 |
| Claude Haiku 4.5 API (~10 cats x 6 refreshes/hr) | ~$4 |
| Voyage AI embeddings (free tier) | $0 |
| Clerk auth (free to 10K MAU) | $0 |
| Domain (subdomain of kristenmartino.ai) | $0 |
| **Total** | **~$9/mo** |

---

## Build sequence (actual)

All phases complete. Production live at siftnews.kristenmartino.ai as of March 31, 2026.

```
Phase 1:  Postgres schema + Python FastAPI + LangGraph pipeline     ✓
          RSS feed integration (100+ feeds, 10 categories)          ✓
          Claude Haiku summaries + Voyage AI embeddings              ✓

Phase 2:  Next.js API routes rewrite (Postgres reads)               ✓
          Card redesign (text-first + RSS images)                    ✓
          Clerk auth + bookmarks sync                                ✓
          SSE streaming for topic search                             ✓
          3 new categories (politics, sports, entertainment)         ✓

Phase 3:  LangGraph comparison workflow (web search fan-out)        ✓
          Topic search (vector + web search fallback)               ✓
          Landing page + OG image + favicon                         ✓
          Dark/light themes (Newsprint / Late Edition)              ✓

Phase 4:  Deploy to production (Vercel + Railway + Neon)            ✓
          CI/CD (GitHub Actions on both repos)                      ✓
          DNS (siftnews.kristenmartino.ai)                          ✓
          Brand identity (SiftLogo diamond mark, color story)       ✓
```

---

## What gets removed from current codebase

| Item | Why |
|------|-----|
| OG image scraping (enrichWithOgImages, SSRF checks) | Replaced by RSS feed images |
| In-memory cache (Map + stale-while-revalidate) | Replaced by Postgres |
| Disk cache (/tmp/sift-cache/) | Replaced by Postgres |
| Direct Anthropic API call in route.ts | Moved to Python pipeline |
| NEWSAPI_CATEGORIES in constants.ts | Vestigial from NewsAPI swap |
| saveCacheToDisk() (and the 4x bug) | No longer needed |

---

## Decision dependencies (resolved)

```
D7 (Pipeline) ──→ D8 (Postgres) ──→ D9 (Custom topics)
     │                                      │
     └──→ D16 (Vercel Cron)          D10 (Clerk auth)
     │                                      │
     └──→ D14 (Voyage embeddings)    D11 (LangGraph on Railway)
                                            │
                                     D2 (Vercel + Railway split)

All dependencies resolved. No blockers.
```

---

### D18. Database provider
**Decision:** Neon free tier (standalone) instead of Vercel Postgres
**Changed from:** Vercel Postgres (which is Neon under the hood)

Standalone Neon gives more control: 0.5 GiB storage, pgvector native, connection pooling, auto-suspend. Both Vercel (pooled) and Railway (direct) connect to the same Neon instance. Pooled connection for serverless functions, direct for long-running Railway service.

---

### D19. Domain
**Decision:** siftnews.kristenmartino.ai (subdomain) instead of siftnews.ai
**Changed from:** siftnews.ai (separate domain)

Uses existing portfolio domain via CNAME to Vercel. Zero cost, consistent branding under the portfolio umbrella.

---

### D20. Categories — expanded to 10
**Decision:** Added Politics, Sports, Entertainment to the original 7

Each category has 8-11 RSS feeds. Expanded total from ~56 feeds to 100+ feeds. Category colors have semantic meaning (e.g., energy = teal for sustainability, politics = indigo for authority).

---

### D21. Brand identity
**Decision:** Named theme palettes + SVG diamond brand mark

- Themes: "Late Edition" (dark, warm stone tones) and "Newsprint" (light, warm paper)
- Brand mark: SVG diamond rendered at all sizes via SiftLogo component with full/compact/mark/wordmark variants
- Category colors: each chosen for semantic meaning, not decoration
