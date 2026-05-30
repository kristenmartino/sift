# Sift — Architecture Decision Register

**Last updated:** May 20, 2026
**Status:** D1–D30 settled (v1 production live); D31–D34 added for v1.5 / v2 direction (May 2026)

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

## Open questions (May 2026)

Tracked here so they don't get lost between session restarts. Promoted to settled decisions when resolved.

| # | Question | Where to decide |
|---|----------|-----------------|
| OQ1 | Native platform first — iOS vs Android vs PWA-only? | Lean: Android-first while iOS enrollment processes. See [`docs/IOS_VS_ANDROID.md`](./IOS_VS_ANDROID.md). |
| OQ2 | DMCA fair-use posture for AI summarization on Railway | Audit + methodology update in flight (sift-api#54) |
| OQ3 | Monetization — when, what, and at what tier | Not until v1.5 KPIs validate D30 ≥ 20% |
| OQ4 | Cross-platform vs native-per-platform if both ship | Decide after platform-first is settled |
