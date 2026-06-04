# Sift — Architecture Decision Register

**Last updated:** June 3, 2026
**Status:** D1–D30 settled (v1 production live); D31–D35 added for v1.5 / v2 direction (May 2026); D36–D45 added June 2026 (editorial theme, content + source quality, native + agentic scope)

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
| D16 | Background refresh | Railway asyncio scheduler (every 30 min) + Vercel cron fallback | $0 | SETTLED |
| D17 | Model selection | Haiku 4.5 (upgrade to Sonnet is one-line change) | ~$4/mo | SETTLED |
| D22 | Compare source picker | Collapsed-by-default chip selector, 12 curated outlets | $0 | SETTLED |
| D23 | Compare source list | Curated outlets, not freeform input | $0 | SETTLED |
| D24 | Compare source limits | Min 2, max 5 sources per comparison | $0 | SETTLED |
| D25 | Per-source timeout | 20s timeout per source in compare workflow | $0 | SETTLED |

| D26 | Story threading architecture | 4-node LangGraph workflow (not 5) | ~$52/mo | SETTLED |
| D27 | Clustering method | LLM-as-judge (not embedding similarity) | $0 (batched) | SETTLED |
| D28 | Entity extraction visibility | Entity tags visible in UI on StoryCard | $0 | SETTLED |
| D29 | Story ID stability | SHA256 hash of sorted article IDs | $0 | SETTLED |
| D30 | Pipeline-time vs request-time | Pipeline-time — zero user-facing latency | $0 | SETTLED |
| D31 | Project state mgmt scaffolding | STATUS.md + CLAUDE.md per repo; V0–V4 milestone tiers | $0 | SETTLED (May 2026) |
| D32 | iOS plan v1 status | Under review — parity-shaped scope, premature canonical API, missing KPIs | $0 | OPEN (May 2026) |
| D33 | Canonical /v1/* mobile API in sift-api | Deferred — reuse Next.js routes for now, collapse later | $0 | DEFERRED (May 2026) |
| D34 | github-projects MCP server | Installed via .mcp.json + .claude/settings.json (Projects v2 tools for future sessions) | $0 | SETTLED (May 2026) |
| D35 | Topic-search AI ownership | Move AI calls + DB writes to `sift-api`, phased; current Next.js route grandfathered | $0 | SETTLED (May 2026) |
| D36 | App-wide editorial theme | Un-scope `.sift-landing` to one global token layer (both themes); delete stone/indigo — not fork | $0 | SETTLED; 2E QA left (Jun 2026) |
| D37 | Rating treatments (§3) | Neutral + sourced: lean by position, party by letter, factual by neutral meter — never hue; reject MBFC credibility/bias-scale | $0 | SETTLED rule (Jun 2026) |
| D38 | "Every word is gold" | Fix copy at generation (rubric + LLM-judge, sift-api#90); reject the frontend overlap-suppressor on the evidence | $0 | SETTLED; gate in flight (Jun 2026) |
| D39 | Outlet count | Derive live from `outlet_profiles`; say "curated," drop the number on a DB miss | $0 | SETTLED (Jun 2026) |
| D40 | Outlet-data integrity | Prune drifted prod rows; seed CSV is no longer prod's source of truth → authoritative seeder | $0 | SETTLED; seeder open #93 (Jun 2026) |
| D41 | sift-mcp → sift-api | Merge into one service, two transports (REST + MCP), shared handlers | $0 | DECIDED, phased (May 2026) |
| D42 | Mobile protocol | REST/SSE only; agent loop server-side, MCP internal; hosted MCP deferred | $0 | SETTLED (May 2026) |
| D43 | Agentic surfaces | Refined Compare (`lens`) + Ask Sift in v1.5 (web + Android); depends on D41 | $0 to decide | SETTLED scope; build in flight (May 2026) |
| D44 | Source expansion | Grow ~50 → ~200 by empirical set-cover; "curated AND rated," factual floor + resolvable/ingestable gates | $0 to decide | DECIDED, in design (Jun 2026) |
| D45 | Rank by civic impact | Rank by civic impact + reader accessibility (paywall) signal, not coverage volume; validate empirically | $0 to decide | DECIDED, in design (Jun 2026) |

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
│  │    → Story threading per category:                │   │
│  │        Entity extract → LLM cluster → Synthesize  │   │
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
│            embedding (vector), story_id, entities,      │
│            created_at                                   │
│                                                         │
│  stories: id, headline, summary, category, framings,    │
│           entities, article_count, published_date,      │
│           synthesis_status                              │
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

Railway's FastAPI service runs an asyncio background task that refreshes every 30 minutes in production. A Vercel cron route also exists as a manual fallback. This avoids the $20/mo Vercel Pro requirement.

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

Phase 5:  Cross-source story threading (4-node LangGraph)          ✓
          Entity extraction + LLM clustering + synthesis            ✓
          StoryCard component with entity tags + framings           ✓
          FeedItem rendering (stories + articles merged)            ✓
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

### D22. Compare source picker — collapsed by default
**Decision:** Add a chip selector UI for choosing which outlets to compare, collapsed behind a "Comparing: Reuters, BBC, AP — Change" toggle.

- Default 3 sources (Reuters, BBC, AP) preserves current behavior — zero friction for quick comparisons
- Expanded state shows 12 curated outlets as toggleable chips
- Alternative considered: always-visible source grid. Rejected because it clutters the compare form for the common case (most users accept defaults)
- Alternative considered: freeform text input. Rejected because Claude web_search reliability varies with arbitrary outlet names

### D23. Compare source list — curated, not freeform
**Decision:** 12 pre-selected outlets spanning wire services (Reuters, AP), broadcast (BBC, CNN, Al Jazeera, NPR), print (Guardian, NYT, Washington Post, Economist, FT), and digital-native (Axios).

- Each outlet tested against Claude's `web_search` tool for reliable results
- Geographic and editorial diversity: US, UK, Middle East, wire services
- Matches sources already in the RSS feed list for consistency
- Labels are abbreviated for chip display (NYT, AP, Wash. Post, FT, Economist)

### D24. Compare source limits — min 2, max 5
**Decision:** Minimum 2 sources (comparison needs at least 2), maximum 5 (caps latency and cost).

- Each source triggers a Claude web_search call (~$0.004 each)
- 5 sources run in parallel but Claude rate limits may serialize them
- Backend already validates `len(sources) > 5` → 400 error
- Frontend disables unselected chips when 5 are selected, disables submit when < 2

### D25. Per-source timeout — 20 seconds
**Decision:** Wrap each source's Claude API call in `asyncio.wait_for(_, timeout=20)`.

- Without per-source timeout, one slow/stuck source blocks the entire comparison
- 20s is generous for a single web_search + summary call (typically 5-12s)
- On timeout, source returns empty and is logged as an error — remaining sources still produce results
- Graceful degradation: 3/5 sources succeeding is better than 0/5 from a global timeout

---

### D26. Story threading architecture — 4-node LangGraph workflow
**Decision:** 4-node pipeline: Fetch -> Entity Extract -> LLM Cluster -> Synthesize+Store
**Changed from:** 5-node (with separate ranking node)

We considered three approaches:

1. **Simple embedding cosine similarity** (~90% accuracy distinguishing same-event vs same-topic). Low cost, but fails on cases like "EU AI Act vote" vs "US AI executive order" which embed similarly but are different events.

2. **Full 5-node LangGraph workflow** with a separate ranking node. The ranking node would sort stories by importance — but this is just SQL `ORDER BY article_count DESC, published_date DESC`. An LLM call for ranking is over-engineering.

3. **4-node workflow** (chosen). Drops the ranking node. Each remaining node earns its place:
   - Node 1 (Fetch): DB query, not an LLM call — pulls 48h articles per category
   - Node 2 (Entity Extract): Extracts people/orgs/locations. **Only justified because entities are visible in the UI** as tags on StoryCard
   - Node 3 (LLM Cluster): The core differentiator — LLM-as-judge distinguishes same-event from same-topic (~97% accuracy)
   - Node 4 (Synthesize+Store): Unified headline, merged summary, per-source framing analysis with tone

**Cost:** All prompts batched (one call per category per node, not per article). ~$0.012 per pipeline run, ~$1.73/day, ~$52/month. vs $345/month if we made per-article calls.

**Why this matters for a portfolio:** Good judgment > raw complexity. A hiring manager who sees a 5-node workflow where one node is a SQL ORDER BY will question your engineering taste. Four nodes where each earns its place shows you know when to reach for an LLM and when not to.

---

### D27. Clustering method — LLM-as-judge, not embedding similarity
**Decision:** Use Claude Haiku as a clustering judge rather than vector cosine similarity.

**The problem:** Embedding similarity catches same-topic (~90%) but struggles with same-event. Two articles about "EU AI regulation" embed very similarly even if one is about the EU AI Act vote and the other is about a US executive order. These are the same broad topic but different specific events.

**LLM-as-judge approach:** The prompt explicitly instructs Claude to distinguish same-event from same-topic:
> "same event" means the same specific occurrence -- not just the same broad topic. "EU votes on AI Act" and "US issues AI executive order" are DIFFERENT events.

This achieves ~97% accuracy on event-level clustering. The enrichment from entity extraction (Node 2) further helps — shared people, organizations, and locations are strong signals.

**Alternative considered:** Two-pass hybrid (embedding pre-filter + LLM refinement). Rejected because the article volume per category (max 50) is small enough that a single LLM call handles it. The two-pass approach adds complexity without benefit at this scale.

---

### D28. Entity extraction visibility — tags shown on StoryCard
**Decision:** Entity tags (people, organizations, locations) are displayed as pill-shaped tags directly on the StoryCard component.

Entity extraction (Node 2) is only justified if it produces user-visible value. Without the tags, Node 2 would be a hidden intermediate step — technically impressive but invisible to users. Showing the tags:
- Gives users at-a-glance context (who/where/what org is involved)
- Makes the multi-step AI pipeline tangible — users can see the extracted data
- Helps with the LLM clustering step (enriched articles cluster more accurately)

Tags are limited to 6 visible per card with a "+N" overflow indicator.

---

### D29. Story ID stability — SHA256 of sorted article IDs
**Decision:** `story_id = SHA256(sorted_article_ids.join("|"))[:16]`

**Why hashed:** If the same cluster of articles is re-processed, the story ID stays the same. This enables `ON CONFLICT (id) DO UPDATE` for upserts — re-running the pipeline updates existing stories rather than creating duplicates.

**Why sorted:** Article order in a cluster is non-deterministic (LLM output varies). Sorting the article IDs before hashing ensures the same set of articles always produces the same story ID regardless of cluster order.

**Re-clustering handling:** At the start of each synthesis run, all `story_id` assignments for the category are cleared (`SET story_id = NULL`), then re-assigned. This handles cases where articles move between clusters across runs.

---

### D30. Pipeline-time processing, not request-time
**Decision:** Story threading runs as part of the background pipeline, triggered after the store node completes. Users never wait for clustering/synthesis.

**Flow:**
```
Pipeline store_node completes
  -> For each category with new articles:
     -> run_story_threading(category)
        -> Fetch -> Extract -> Cluster -> Synthesize+Store
```

**Why not request-time:** The 4-node workflow takes 5-15 seconds (three Claude Haiku calls). Adding that to a user page load would make the app feel sluggish. By running at pipeline-time, the API route is a pure DB read:
- `GET /api/news?category=top` returns pre-computed `stories[]` alongside standalone `articles[]`
- Frontend merges them into a `FeedItem[]` sorted by date
- StoryCards render inline with ArticleCards — stories surface naturally

**Graceful degradation:** If a category has no multi-source coverage, the API returns an empty `stories[]` array and the UI shows only ArticleCards. No special handling needed.

---

## v1.5 / v2 direction (May 2026 onward)

The next four decisions are added after the v1 production launch. They steer v1.5 (civic-literacy pivot, in flight) and v2 (native clients, planned). Some are settled and net-additive (D31, D34); some are open or actively deferred (D32, D33).

---

### D31. Project state management — STATUS.md + CLAUDE.md per repo, V0–V4 milestone tiers
**Decision:** Adopt per-repo `STATUS.md` (repo root) for active state + `CLAUDE.md` (repo root) for agent orientation. Roadmap tiers labeled `tier-v1` / `tier-v1.5` / `tier-v2` / `tier-v3` / `tier-v4`. Plus a SessionStart hook that auto-loads `STATUS.md` into the agent context.

**Why:**
- High velocity (10+ PRs/week sustained) means context loss between sessions is real. `STATUS.md` is the always-fresh "Active focus / Open question / Next 3 / Blocked-on / Recent decisions" surface.
- Per-repo `CLAUDE.md` codifies the pre-session ritual + end-of-PR doc-impact check. Standardizes what agents do on session start and PR close.
- V1–V4 milestone tiers fit Sift's lifecycle better than OKRs at this stage: v1 shipped, v1.5 civic-literacy pivot in flight, v2 native clients, v3+ speculative.
- SessionStart hook (`.claude/settings.json`) injects `STATUS.md` content into every new session — eliminates "stale context" failures.

**Where it lands:** root-level `STATUS.md` + `CLAUDE.md` in both `sift` and `sift-api`. GitHub Issues stay actionable units; user-level Project ("Kristen Portfolio" — `users/kristenmartino/projects/3`) visualizes status across repos. Labels: `effort-{day,week,weeks}` + `tier-v{1,1.5,2,3,4}`.

**Cost:** $0 — pure docs + hook config.

---

### D32. iOS plan v1 status — under review (parity-shaped scope critique)
**Decision (status: OPEN):** Mark the original iOS app plan as **"under review"** pending revision. Don't start native implementation against the current v1 plan.

**The plan as drafted:** native Swift / SwiftUI, focused reader MVP, single canonical `/v1/*` API in `sift-api`, four iOS-native features (push, widget, share extension, offline cache), 8-week TestFlight timeline. See [`docs/IOS_APP_PLAN.md`](./IOS_APP_PLAN.md) for the full plan as written.

**The critique (cross-functional, 12 voices):** Full text in [`docs/IOS_APP_ASSESSMENT.md`](./IOS_APP_ASSESSMENT.md). Key findings:

1. **Scope is parity-shaped, not MVP-shaped.** Four iOS-native features + a full reader + a new API surface + auth + bookmarks sync in 8 weeks is a parity build with extra steps.
2. **Canonical `/v1/*` API is premature.** "What mature publishers do" is correct in steady state, wrong for pre-PMF (see D33).
3. **KPIs and monetization missing.** Health metrics (crash-free rate, p95 latency) are present; success metrics (D30 retention, push CTR, share-extension WAU) are absent.
4. **Design work isn't started.** No screens, flows, or wireframes referenced — the civic-literacy primer doesn't translate to iPhone-sized progressive disclosure as-is.
5. **Apple Developer enrollment lead time isn't budgeted.** Can take 4–8 weeks for new entities; iOS work would slip silently.
6. **Civic-literacy pivot (v1.5) is in flight.** Shipping iOS now means shipping a snapshot of an in-flight product.

**Direction (still open):** Revise toward either (a) **share-extension-only MVP** (4 weeks, one feature, validates the "what's the actual story?" gesture) or (b) **defer native entirely** until web civic-literacy pivot is shipped (Q3 2026+). Final call dependent on D34 (platform-first call — see [`docs/IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md)).

---

### D33. Canonical `/v1/*` mobile API in `sift-api` — deferred
**Decision (status: DEFERRED):** Don't build the `/v1/feed`, `/v1/topic`, `/v1/articles/:id`, `/v1/widget/today` endpoints proposed in the iOS plan. Native clients (when built) read from existing Next.js routes; add Edge caching if cold starts hurt.

**Why:**
- "Real companies have one canonical API" is true at maturity, not at pre-PMF. With one client (web) and one API (Next.js routes), building a second API runs two read paths in parallel for months.
- The Next.js routes can be migrated to a canonical surface later, after a second client validates the need.
- Net-new endpoints required for actual *new* functionality in v2: `POST /v1/devices/register`, `POST /v1/share/sift-this`, `GET /v1/widget/today`. Those land in `sift-api` when the native client work begins — not before.

**Reconsider when:** web is being migrated to read from `sift-api` regardless, OR a third client (e.g., Android, watchOS) is in flight. At that point, the dedup math flips and one canonical API surface is worth the migration cost.

**Cost (avoided):** ~2 weeks of net-new Python endpoints that would have been pure rename of existing TypeScript handlers.

---

### D34. github-projects MCP server — installed for Claude Code sessions
**Decision:** Add `.mcp.json` + `.claude/settings.json` enabling the official `github-mcp-server` (HTTP variant at `https://api.githubcopilot.com/mcp/`) as a project-scoped MCP server in both `sift` and `sift-api`.

**Why:**
- The default Claude Code web harness exposes a useful subset of GitHub tools (`mcp__github__*`) — files, issues, PRs, branches, labels — but lacks **Projects v2 mutations** (`addProjectV2ItemById`, `updateProjectV2ItemFieldValue`).
- Future sessions in either repo now have full Projects v2 + broader official tool surface (releases, advanced search, workflow dispatch, etc.).
- Repeats per repo because MCP server configs are repo-scoped via `.mcp.json`.

**Auth:** Bearer token from env var `GITHUB_PROJECTS_TOKEN` (set once in Claude Code web env vars, applies to both repos). PAT scopes: classic `project` (full) + `repo` — *or* fine-grained `Contents/Issues/PRs: Read+write` + `Projects: Read+write` (account-level).

**Cost:** $0 — uses GitHub Copilot API quota (free for personal accounts within reasonable limits).

**Naming:** server named `github-projects` (not `github`) to coexist with the existing harness server without name collision.

---

### D35. Topic-search AI ownership — AI + writes move to `sift-api` (phased)
**Decision (status: SETTLED, May 2026):** Topic-search AI (Claude web-search fallback, Voyage embedding/classification) and the DB writes it performs move into `sift-api`, **phased**. `sift` keeps presentation/SSE streaming and the Postgres *read* (vector search) until the full search API exists. The current `sift/app/api/news/topic/route.ts` is **grandfathered, not the target architecture** — no new AI / search / write work goes in the frontend.

**Why:**
- The route violates the documented split (D2, D7, D30): the Next.js frontend holds both AI keys (`ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`), calls Claude + Voyage on the request path, and **writes articles to Postgres** (`insertArticle`) — the write path `sift-api` owns.
- **Android v1 + Ask Sift** (sift-api#63, approved v1.5) ship native; a native client can't run Next.js route handlers, so AI-in-the-frontend forces Android to couple to the web deployment or duplicate the logic. A `sift-api` search API serves web *and* Android.
- **Cost ceiling** (sift-api#70) instruments one place instead of the backend pipeline plus two frontend AI routes.
- Moving AI off Vercel shrinks the secret surface and removes the latent Vercel `maxDuration` trap from the AI path.

**Phasing:**
- **Slice 1 — sift-api#79:** `POST /v1/search/fallback` — Claude fallback + embed/classify + article writes move to `sift-api`; the frontend route relays. Removes `ANTHROPIC_API_KEY` + all DB writes from `sift`. Fixes the `published_date: new Date()` freshness bug as part of the move.
- **Slice 2 — sift-api#80:** full `POST /v1/search` (query embedding + vector search) when Android / Ask Sift needs a clean API; frontend becomes a thin SSE relay. Removes `VOYAGE_API_KEY` from `sift`. Gated; likely post-Sprint-2.
- **Not the migration:** the `/api/news/topic` `maxDuration` Vercel-timeout fix (sift#124) is an immediate, independent frontend bug — ship it now.

**Related:** `sift/app/api/topics/generate/route.ts` is a second frontend-AI route (custom-topic generation via Claude) — revisit under this same principle when its slice comes up. `sift-api`'s own README/CLAUDE split wording reconciles when the code moves (Slice 1).

**Reconsider when:** never for "keep AI in the frontend"; the only open variable is the *timing* of Slice 2, gated on native-client work.

**Cost:** $0 to decide. Slices ~1 effort-week each.

---

## v1.5 — content, theme & native batch (May–June 2026)

D36–D45 record ~2 weeks of cross-repo decisions (2026-05-20 through 2026-06-03) that previously lived only in the `sift` / `sift-api` `STATUS.md` files. Two threads run through them: the **native + agentic** architecture calls (D41–D43, settled 2026-05-20) and the **editorial-theme + content/source-quality** work on the web (D36–D40, D44–D45, early June). The STATUS files now point here instead of duplicating these.

---

### D36. App-wide editorial theme — un-scope to a global token layer (not fork)
**Decision (status: SETTLED, June 2026):** Promote the homepage reskin's editorial design tokens out of their `.sift-landing` scope into a single **global semantic token layer** — two full maps (light + warm-dark) under `[data-theme]` — migrate every surface onto it, and delete the legacy stone/indigo palette. One system, one source of truth.

**Changed from:** the Phase-1 homepage reskin (2026-05-31), which deliberately scoped the editorial palette under `.sift-landing` so it wouldn't leak while shipping one page safely. That scoping was right for shipping one page; it's the wrong long-term structure.

**Considered and rejected:**
- **(B) Keep both palettes; migrate only some surfaces.** Leaves Sift permanently two-toned and doubles maintenance.

**How it shipped (sub-phased, with a review gate between each):**
- **2A** — promote tokens to the global layer + build the §3 neutral primitives, then re-point the homepage at the global names with **zero visual change** (pixel-parity verified first). [#144]
- **2B** — the `/news` reader; warm dark (`#15120C`, not pure black) preserved for long reading. [#144]
- **2C** — civic index + dossiers. [#145]
- **2D** — retire **all** legacy stone/indigo tokens (the global layer is now the only source of truth) + migrate methodology / colophon / legal + the shared masthead. [#146]
- **2E** — QA (AA contrast in both themes, neutrality audit, reduced-motion, responsive) — **remaining**.

A Tailwind v3→v4 cascade-layer regression was fixed in the same work: the universal reset `* { margin:0; padding:0 }` was unlayered and, under v4's native cascade layers, beat every layered utility regardless of specificity — silently killing `/news` spacing. Moved into `@layer base`.

**Source:** `SIFT_THEME_MIGRATION.md` §1–§2, §7; sift #144 / #145 / #146; STATUS 2026-06-01.
**Cost:** $0 — design tokens + migration.

---

### D37. Rating treatments are neutral and sourced (the §3 brand rule)
**Decision (status: SETTLED rule, June 2026):** Sift cites AllSides / MBFC verbatim, links the source, and never editorializes about which side is more or less reliable — applied **symmetrically** — and the UI must encode that:
- **Political lean is never hue-coded.** AllSides buckets and party tags (R / D / I) render in neutral ink; lean is shown by **position** (a 5-tick glyph), party by a neutral letter chip. No red/blue.
- **Factual-reporting tier is a neutral fill-level meter**, not green-good / red-bad.
- **Every rating chip cites + links its source** (AllSides / MBFC) with a last-verified date.
- Built as shared primitives — `OutletChip`, `LeanGlyph`, `FactualChip`, `PartyTag` — so the reader, the comparison view, and all dossiers share one neutral, sourced treatment, bound onto clustered-story sources so provenance reads identically on Top Stories and `/news` [#147].

**Considered and rejected** (each re-introduces the good/bad, lean-as-value framing §3 exists to remove):
- **MBFC credibility score** — folds political lean into the number (~30% weight) plus traffic + country; penalizes left/right outlets.
- **MBFC's own bias scale** (Extreme Left → Extreme Right / "Least Biased") and the **"Questionable" flag** (a one-sided negative badge).
- Keep **AllSides** for bias.

**Shipping now (no new data):** plain-language `Bias rating:` / `Factual Reporting:` labels with the source named on hover + link [#147]; a `/methodology` "how we rate sources" section filed.

**Open tail (→ OQ5):** MBFC **country + press-freedom** ratings (RSF / Freedom House) are the §3-clean expansion — environmental, symmetric across the spectrum, cited, most valuable for international sources. "Pursue when prioritized" (likely a paid MBFC license + ToS review); lives on the outlet dossier, **never** folded into a composite score.

**Source:** `SIFT_THEME_MIGRATION.md` §3; STATUS 2026-06-01 (the theme entry + the rating-system question); sift #144 / #147.
**Cost:** $0 to decide.

---

### D38. "Every word is gold" — fix copy at generation, not with a frontend overlap-suppressor
**Decision (status: SETTLED principle; generation gate in flight, June 2026):** Every AI line (summary / "why it matters" / the "What you should know first" primer) and every static string must be **specific, verifiable, neutral, and mission-aligned** — never trite or a headline restatement. Each card element must answer a *different* question or be cut; rendering nothing beats rendering filler.

**The method (empirical, not vibes):** audited 500 live articles, measuring how much `whyItMatters` / `contextPrimer.background` restate vs. add to title + summary (a lexical-novelty proxy). Findings: `whyItMatters` is inconsistent but **not** wholesale-trite (~3/5 land a real stake; ~20% restate; ~17% lean on vague-significance clichés) and fails in **two** directions — restating **and** editorializing; `contextPrimer.background` validated (93% add real context).

**Considered and rejected:**
- **A frontend overlap-suppressor** (a client-side lexical-overlap check that hides near-duplicate lines). Rejected **on the evidence**: lexical overlap can't catch the dominant editorial-fluff failure or paraphrased restatement.

**Instead:** keep `whyItMatters` + `contextPrimer`; **fix quality at generation time** via a two-sided rubric ("must add information not already in the headline/summary; specific, verifiable, neutral; else return null") + an LLM-judge eval → **sift-api#90**.

**Static-copy slice:** dropped the dead `landing.*` block (0 use, superseded by `landingReskin`) [#154]. The same audit surfaced the stale outlet count (→ D39) and outlet-table drift (→ D40).

**Source:** STATUS 2026-06-01 (a) + 2026-06-02; sift #150 (issue) / #154; sift-api #90.
**Cost:** $0 to decide.

---

### D39. Outlet count is derived live ("curated," not "reads from N")
**Decision (status: SETTLED, June 2026):** Replace the hardcoded "~50 outlets" copy (it had drifted into **28 places** while the curated set grew to ~77) with a single **live count** computed from `outlet_profiles` — the same source as the public outlet list — so it can't drift again.

**Truthfulness:** `outlet_profiles` has no active/ingested field, so it proves a **curated** set, not a *read* one — copy says **"curated outlets,"** not "reads from N sources." On a DB miss (`n ≤ 0`) the copy **drops the number** rather than printing "0".

**How:** `lib/outletStats.ts` (pure, client-safe) + a graceful `getOutletStats()` server helper; centralized phrasing in `lib/copy.ts`; landing / `/methodology` / `/colophon` derive from already-fetched data (no new fetches); page metadata reworded count-free. [#155]

**Source:** STATUS 2026-06-02; sift #153 (issue) / #155 (PR).
**Cost:** $0.

---

### D40. Outlet-data integrity — prune drift; the seed CSV is no longer prod's source of truth
**Decision (status: SETTLED cleanup; authoritative seeder OPEN, June 2026):** Treat prod `outlet_profiles` as drift-prone and reconcile it.
- **Cleanup (shipped):** pruned 5 rows that had drifted into prod but were never in the seed CSV (the seeder is upsert-only and never prunes): deduped `bbc` → canonical `bbc-news` and `bloomberg-news` → `bloomberg` (aliases + `articles.entity_links` repointed to the canonical first), and dropped the 3 excluded Yahoo verticals (`yahoo-news` / `-finance` / `-sports`, which contradicted `/methodology`'s aggregator exclusion). 77 → 72, via an idempotent, transactional, dry-run-first script. This makes sift's live outlet count (D39) self-correct on the next ISR revalidate.
- **Process finding (→ sift-api#93):** prod has ~15 legit outlets (al-jazeera, espn, le-monde…) **not** in the seed CSV, and `seed_outlet_profiles.py` is upsert-only, so the CSV is no longer prod's source of truth. An **authoritative seeder** is the foundation for the deliberate source expansion (D44).

**Source:** sift-api STATUS 2026-06-03; sift-api #91 (issue) / #94 (PR) / #93 (follow-up); surfaced by sift #153.
**Cost:** $0.

---

### D41. `sift-mcp` merges into `sift-api` — one service, two transports
**Decision (status: DECIDED, phased — Phase 0 pending; May 2026):** Consolidate `sift-mcp` into `sift-api` as a single Python service exposing **two transports** — REST (HTTP) and MCP (stdio + optional HTTP/SSE) — backed by shared, transport-agnostic handlers. Resolves the standing "should `sift-mcp` merge into `sift-api`?" open question (sift-mcp strategic-Q #2 / sift-api strategic-Q #3) in favor of merging.

**Why:**
- Real (not theoretical) duplication: the web compare path (`app/api/compare/route.ts` → sift-api `/analyze/compare`) and sift-mcp's `compare_outlets` already drift.
- The agentic surfaces (D43) want the tool handlers in one place rather than duplicated or reached via an internal MCP client.
- Merging collapses sift-mcp #4's hosting work into a route mount — no new Railway service, subdomain, env-var set, or DNS.
- Net effort ~7–10 days vs ~2 weeks for the two-service path, plus ongoing duplication-tax savings.

**Phases** (full spec in `sift-api/docs/MERGE_MCP_INTO_API.md`):
- **Phase 0** — merge source via `git subtree` (preserve history), wire the MCP transport mount into FastAPI, add a stdio entrypoint; confirm all 5 tools work via both transports. One PR.
- **Phase 1** — cost-cap primitives in a shared `app/caps.py` (closes sift-mcp #2); both transports benefit.
- **Phase 2** — Bearer auth on the `/mcp` mount + tokens table (supersedes sift-mcp #4), only if external MCP traffic is real.
- **Cleanup** — archive `sift-mcp` with a redirect README (preserves issue history); update Claude Desktop / Code wiring to the new entrypoint.

**Prerequisites:** land sift-api #54 (DMCA audit) before any public MCP transport; a ~30-min spike to confirm the `mcp` Python SDK mounts cleanly as an ASGI sub-app.

**Reconsider when:** MCP traffic ever needs to scale independently of REST (theoretical at current volume) — the handler-module split keeps re-extraction cheap.

**Source:** `sift-api/docs/MERGE_MCP_INTO_API.md`; sift-api #62; STATUS 2026-05-20.
**Cost:** $0 to decide; net ~3–5 days saved on v0.5.

---

### D42. Mobile is REST-only — hosted MCP deferred indefinitely
**Decision (status: SETTLED, May 2026):** Every mobile data/AI feature calls **REST/SSE** on `sift-api`. Even the agentic surfaces (Ask Sift, Refined Compare) run the agent loop **server-side**, with MCP as internal plumbing — there is **no MCP transport on the device**. The hosted HTTP/SSE MCP (sift-mcp #4) is deferred indefinitely.

**Why:** the per-feature protocol worksheet in `sift-api/docs/MOBILE_PROTOCOL_DECISION.md` yields **zero** "MCP (public)" features — pre-computed content → REST; server-side LLM → REST + internal MCP; on-device LLM → the native Anthropic SDK with a tool-handler hitting REST, not an embedded MCP client. Getting this wrong would cost 1–2 weeks of misplaced hosting/auth infrastructure.

**Consequence:** this is *why* D41's public-transport phase (Phase 2) is gated on real external demand rather than on the mobile launch — mobile doesn't need it.

**Source:** `sift-api/docs/MOBILE_PROTOCOL_DECISION.md`; STATUS 2026-05-20; reinforced by sift-api #62 / #63.
**Cost:** $0 (avoids ~1–2 weeks of misplaced infra).

---

### D43. Refined Compare + Ask Sift — agentic surfaces in v1.5 (web + Android)
**Decision (status: SETTLED scope; build in flight; May 2026):** Ship two specialized **server-side agent loops** over the shared 5-tool surface (post-D41):
- **Refined Compare** — `POST /api/compare` with a `lens` parameter (SSE), returning structured per-outlet framings. Same endpoint as the deterministic compare; the backend routes on `lens` presence.
- **Ask Sift** — `POST /api/ask` (SSE), open-ended conversational chat with citations.

Both share tool handlers, the cost-cap pool, the Anthropic SDK pattern, and SSE; they differ in system prompt and output schema.

**Scope call (retiered v1.6 → v1.5, 2026-05-20):** these ship in **Android v1**, not as a v1.1 add-on. Rationale: without Ask Sift, native mobile is a polished reader competing with Apple News / Artifact; **with** it, mobile is a civic-literacy agent on the phone — the wedge that justifies building native at all. Timeline impact ~10 → ~12 weeks.

**Depends on:** D41 (merge — hard prereq, so the loops don't duplicate the 5 tools), D42 (REST/SSE transport). Cost caps: per-turn $0.50 hard / per-user-day $5 signed–$2 anon / global $50/day (alarm at $30); a kill-switch env var disables both agent paths.

**Source:** sift-api #63 (the live spec); STATUS 2026-05-20 (the Refined Compare, Ask Sift, and REST-only entries). *Note: `docs/ASK_SIFT_PLAN.md` / `docs/REFINED_COMPARE_PLAN.md`, referenced from #63 and the STATUS files, are not present on `sift-api` main — issue #63 is the authoritative spec.*
**Cost:** $0 to decide; build ~2 wk backend + ~1 wk web + ~1 wk Android.

---

### D44. Source expansion to ~200 — empirical selection, "curated AND rated"
**Decision (status: DECIDED, in design; June 2026):** Grow the curated outlet set from ~50 → ~200, choosing outlets **data-drivenly** (a reproducible scoring + selection procedure) rather than by hand. The set stays **"curated AND rated,"** not AllSides-scale breadth. (Execution is `sift-api` / data — `outlet_profiles`, `source_name_aliases`, ingestion; tracked at sift#151.)

**Candidate universe:** AllSides + MBFC's already-rated outlets, so every candidate ships with a bias + factual rating.

**Hard gates (deterministic):** an MBFC **factual floor** (exclude Low / Very-Low / Questionable); **resolvable + ingestable** — AllSides + MBFC ratings, a correct `source_name_aliases` entry, and a working feed (per the NYT non-resolution bug, a source with no alias renders cards with no ratings).

**Empirical scoring + selection:** reach / authority (Similarweb traffic), spectrum-balance contribution (move the L/C/R distribution toward symmetric per §3 / D37), category-coverage contribution, international / press-freedom diversity, marginal novelty (de-prioritize pure syndication overlap), and feed reliability — combined by a **greedy set-cover** that maximizes the weighted objective under a spectrum-symmetry constraint until ~200. Validated by re-running a coverage-gap analysis.

**Depends on:** the authoritative seeder (D40 / sift-api#93) as the data foundation; pairs with the civic-impact ranking eval (D45).

**Source:** STATUS 2026-06-01 (b); sift #151.
**Cost:** $0 to decide.

---

### D45. Rank by civic impact — including reader accessibility (paywall) — not coverage volume
**Decision (status: DECIDED, in design; June 2026):** Rank the feed by **civic impact**, not by coverage volume (which would magnify mainstream bias — the trap raw clicks fall into). Evaluate empirically rather than by gut:
- a **human importance gold-set** (rank ↔ importance correlation + a high-importance / low-volume "burial" rate),
- **depth-engagement** signals (compare / dossier / bookmark opens — **not** raw clicks),
- a **Sift-native impact proxy** (stories tied to a bill / policy / dossier).

**Reader accessibility / paywall signal (added 2026-06-03):** include whether a story's sources are **freely reachable** as a ranking input — when a high-impact story is available from a non-paywalled source, prefer surfacing that source so readers can actually reach the reporting instead of hitting a paywall at every turn. This needs a per-outlet **access field** (e.g. free / metered / hard paywall), which does not exist today — capture it alongside the outlet-schema / authoritative-seeder work (D40 / sift-api#93). It also answers the previously-noted "paywalled outlets in the feed" open question from the iOS plan.

**Pairs with:** D44 (both want a labeled / measured baseline) and D37 (accessibility and neutrality are both "serve the reader" signals, not editorial value judgments).

**Source:** STATUS 2026-06-01 (d); the accessibility / paywall extension is a 2026-06-03 decision recorded here.
**Cost:** $0 to decide.

---

## Open questions (May 2026)

Tracked here so they don't get lost between session restarts. Promoted to settled decisions when resolved.

| # | Question | Where to decide |
|---|----------|-----------------|
| OQ1 | Native platform first — iOS vs Android vs PWA-only? | Lean: Android-first while iOS enrollment processes. See [`docs/IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md). |
| OQ2 | DMCA fair-use posture for AI summarization on Railway | Audit + methodology update in flight (sift-api#54) |
| OQ3 | Monetization — when, what, and at what tier | Not until v1.5 KPIs validate D30 ≥ 20% |
| OQ4 | Cross-platform vs native-per-platform if both ship | Decide after platform-first is settled |
| OQ5 | Outlet ratings beyond AllSides bias + MBFC factual — how far? | MBFC country + press-freedom (RSF / Freedom House) is the §3-clean next step; pursue when prioritized (paid license + ToS). See D37. |
