# Sift — Architecture

**Version:** 3.0
**Date:** August 18, 2026
**Live:** [siftnews.io](https://siftnews.io) (siftnews.kristenmartino.ai 308-redirects here)

> **How to read this.** Version 2.1 of this file described the system as of
> March 2026 and was still being cited in August, by which point it was wrong
> about the shape of the system and not merely its numbers — a 5-node pipeline
> that has 8 nodes, a feed ordered by `published_date` that is ranked on seven
> factors, four tables where there are 21. The diagrams below have been redrawn
> against `main`. Where a figure moves on its own (spend, row counts), this file
> now names the script or table to derive it from rather than quoting a number
> that will rot.

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
                    │  Next.js 16 (App Router)  │
                    │  ┌─────────────────────┐  │
                    │  │ /api/news?cat=X     │──┼──▶ Postgres (ranked read)
                    │  │ /api/news/topic?q=X │──┼──▶ Postgres (vector search)
                    │  │ /api/news/stream    │──┼──▶ Postgres + SSE
                    │  │ /api/compare        │──┼──▶ Railway (proxy, SSE)
                    │  │ /api/primer/expand  │──┼──▶ Postgres
                    │  │ /api/bookmarks      │──┼──▶ Postgres
                    │  │ /api/cron/refresh   │──┼──▶ Railway (trigger)
                    │  └─────────────────────┘  │
                    │  Pages: /news /politician  │
                    │  /org /bill /outlet /term  │
                    │  /glossary /civic /agencies│
                    │                           │
                    │  Clerk (auth)              │
                    │  Sentry (errors)           │
                    │  Vercel Analytics          │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   RAILWAY                │          │  NEON POSTGRES           │
│                          │          │  21 tables, + pgvector   │
│  FastAPI + LangGraph     │          │                          │
│  ┌────────────────────┐  │          │  articles  stories       │
│  │ /pipeline/refresh  │──┼──────▶   │  api_batches             │
│  │   8-node ingest    │  │          │  ai_usage_daily          │
│  ├────────────────────┤  │          │  politician_/org_/bill_/ │
│  │ batch poller (60s) │──┼──────▶   │  outlet_/term_profiles   │
│  ├────────────────────┤  │          │  entity_aliases          │
│  │ incremental        │──┼──────▶   │  bookmarks custom_topics │
│  │   threading        │  │          │  pipeline_state …        │
│  ├────────────────────┤  │          │                          │
│  │ /analyze/compare   │──┼──────▶   │                          │
│  │   + /compare/stream│  │          │                          │
│  └────────────────────┘  │          │                          │
│                          │          │                          │
│  Claude Haiku 4.5         │          │                          │
│  Voyage AI (embeddings)  │          │                          │
└──────────────────────────┘          └───────────▲──────────────┘
                                                  │ read-only
                                      ┌───────────┴──────────────┐
                                      │  sift-mcp (FastMCP)       │
                                      │  5 tools for AI clients   │
                                      └──────────────────────────┘
```

**Four surfaces, one source of truth.** Vercel owns everything a reader sees and
reads Postgres directly. Railway owns the background pipeline, story threading,
the on-demand compare workflow, and **every write**. Neon holds all persistent
state. A separate MCP server exposes the same database read-only to AI clients.

The split exists because two SLAs cannot share one process: browsing is an
indexed read that must be instant, and the generation behind it takes minutes.
See `docs/DECISIONS.md` for why each boundary sits where it does.

---

## Data flow: fixed category (90% of requests)

```
User opens Sift → clicks "Technology"
  → GET /api/news?category=technology
  → Next.js route runs two indexed queries against Postgres:
      1. stories   — threaded events, ranked on corroboration × importance
      2. articles  — the standalone pool, ranked and de-duplicated against (1)
  → Merge, return JSON
  → Client renders story and article cards
```

No AI calls. No caching logic. Pure database read. This is why cold starts don't matter.

**Ranking is not recency.** It was `ORDER BY published_date DESC` until August
2026; it is now seven factors multiplying one core, all in `lib/db.ts` with the
evidence for each constant in the comment above it:

```
standalone:  importance × e^(−age_days)
             × grim 0.6        (tone='grim' AND importance ≤ 3)
             × civic 1.0–1.3   (+0.1 per weighted dossier link, capped at 3)
             × opinion 0.6     (outlet-declared op-ed)
             × roundup 0.4     (program episodes, briefs)
             × low-imp 0.35    (importance ≤ 2, in `top` only)
             × non-news 0.5    (genre = feature | soft)

stories:     GREATEST( (1 + 2.0 × ln(1 + DISTINCT outlets)) × mean_importance/2.5,
                       max_member_importance  when ≥ 4 )
```

Two guards that are not obvious. A 30-day floor sits alongside the decay: decay
alone makes an old row unrankable, but Postgres still fetches and sorts it, so
the floor is what makes old rows *unread*. And no single outlet may hold more
than 6 of a category's 50 standalone slots — NY Post held 23 of 50 in `top` the
day that was added.

Ranking accuracy is measured, not asserted: `sift-api/scripts/eval_ranking_pairs.py`
scores blind hand-labeled pairs. See `docs/RANKING_SIGNALS.md` for the model and
the results, including the ones that are not wins.

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

## Data flow: background pipeline (every 30 min)

Eight nodes, strictly linear, in `sift-api/workflows/pipeline_workflow.py`.
Three of them do not wait for an answer — see the deferred lane below.

```
Railway asyncio scheduler fires (or Vercel cron fallback)
  → LangGraph pipeline workflow:

      ┌───────────────┐
      │ fetch_rss     │  59 feeds / 56 outlets, ≤10 entries each. Free.
      └──────┬────────┘  Prefers the article body over the RSS teaser
             ▼           (≥100 words AND ≥3× its length).
      ┌───────────────┐
      │ deduplicate   │  source_url OR content_hash, one round-trip. Free.
      └──────┬────────┘  Last free gate before anything costs money.
             ▼
      ┌───────────────┐
      │ summarize     │  Claude Haiku 4.5, 5 articles/call.
      │ (Claude)      │  Summary AND category in one call — the model has
      └──────┬────────┘  already read the article; labelling it separately
             ▼           pays twice for the same comprehension.
      ┌───────────────┐
      │ context       │  Batch API job, half price. Returns FOUR keys:
      │ (deferred)    │  why-it-matters, importance 1–5, tone, genre.
      └──────┬────────┘  Node returns empty; results land minutes later.
             ▼
      ┌───────────────┐
      │ primer        │  Batch API job. Background paragraph + 0–4 glossary
      │ (deferred)    │  terms. Zero terms is a legitimate answer.
      └──────┬────────┘
             ▼
      ┌───────────────┐
      │ embed         │  Voyage voyage-3-lite → 512-dim vectors in pgvector.
      │ (Voyage)      │  Returns None on failure, never a zero vector: a zero
      └──────┬────────┘  is a real point in the space and would surface as a
             ▼           plausible hit for any query.
      ┌───────────────┐
      │ link_entities │  Which dossiers is this article actually about?
      │ (Claude)      │  A free regex pre-gate drops ~74% of calls first;
      └──────┬────────┘  survivors carry a narrowed roster, not all 856 rows.
             ▼
      ┌───────────────┐
      │ store         │  Upsert on source_url. title / image_url /
      └──────┬────────┘  published_date deliberately NOT updated on conflict.
             ▼           Submits the entity-extraction batch; triggers threading.
           DONE
```

The row is servable the moment `store` commits, with `why_it_matters`,
`context_primer` and `entities` still NULL. Those columns are nullable and the
read path treats absent as normal — which is what lets the expensive work happen
after the article is already in front of a reader.

---

## Data flow: the deferred lane

```
Batch poller (services/batch_poller.py), event-driven, 60s between real polls
  → for each row in api_batches WHERE status = 'processing':
      → Anthropic Batch API ended?
          → map results back to articles via the batch's custom_id manifest
          → PROVE the indices are exactly {1..n} before writing anything
          → patch the columns in place
```

Idle means *blocked*, not sleeping — the loop waits on a signal rather than
re-querying, which is what lets the Neon compute suspend.

The index proof is not defensive programming for its own sake. On 2026-07-30
articles were found carrying **other articles' summaries**, written by a path
that reported success: a batch of five returning indices 1,2,3,4 is either a
skip (the other four are right) or a shift (all four are wrong), and nothing in
the response says which. So a misaligned sub-batch is rejected whole and every
affected URL is logged by name. See `sift-api/services/index_alignment.py`.

---

## Data flow: story threading

Recognising that four outlets covered one event is a separate problem from
deduplication, solved separately. Since 2026-08-10 it consumes a queue rather
than rescanning a window (`sift-api/workflows/incremental_threading.py`):

```
new article, entities landed
  → story_matcher   pgvector nearest neighbours — FREE, no model call
                    (SIMILARITY_THRESHOLD 0.60, TOP_K 10, 48h window)
  → story_confirmer ONE Claude call per run: attach / create / neither
  → story_synthesizer  headline, neutral summary, per-outlet framing + tone
                    — runs only when a story's OUTLET SET changes
```

A story id is derived once from its seed members and never changes as it grows.
Under the previous scheme the id was a hash of the current membership, so gaining
an outlet *replaced* the story and orphaned the old row — 99.5% of the table had
no members before this was fixed. Clusters with fewer than 2 distinct outlets are
dropped: "how four outlets covered this" was sometimes four posts from one
outlet.

See `docs/DECISIONS.md` D26/D27 for the architecture and the measured clustering
accuracy, including the caveat that has to be quoted with it.

---

## Data flow: multi-source comparison

The one path where a reader's click spends money. Three nodes, in
`sift-api/workflows/compare_workflow.py`.

```
User picks a topic and a set of outlets
  → POST /api/compare  (or /api/compare/stream for progress)
  → Next.js proxies to Railway: POST /v1/analyze/compare[/stream]

      ┌────────────────────┐
      │ search_sources      │  Parallel fan-out, one Claude call per outlet
      │                     │  with the web_search tool. PER_SOURCE_TIMEOUT 20s.
      └─────────┬──────────┘
                ▼
      ┌────────────────────┐
      │ extract_and_compare │  ONE call over all of it. 3–8 claims, each tagged
      │                     │  unanimous | majority | disputed | unique.
      └─────────┬──────────┘
                ▼
      ┌────────────────────┐
      │ format_response     │  Pure validation. No model call.
      └────────────────────┘
```

**Claims come back disputed-first**, because the disputed ones are why anyone
ran the comparison.

Two things guard the one endpoint where a reader's text enters a paid prompt:
outlet names are validated against an allowlist built from the database itself,
and the topic string is sanitised before it reaches the model.

**Four timeouts, deliberately ordered:** backend 50s < proxy abort 55s < Vercel
`maxDuration` 60s < client 65s. Invert any pair and the reader gets a platform
error page instead of an application error that explains what happened.

The `/stream` variant emits Server-Sent Events per stage so a ~15s wait is
narrated rather than blank. One comparison is also generated per day and cached
(`services/daily_compare.py`), so a signed-out reader sees the real feature on
today's news instead of a screenshot.

---

## Why this architecture

| Principle | How it's applied |
|-----------|-----------------|
| AI out of request path | Background pipeline generates; API routes serve from DB |
| Right tool for each job | Next.js for frontend + simple reads; LangGraph for multi-step workflows |
| Single source of truth | Postgres stores everything; no in-memory cache to lose |
| Cost scales with content, not users | Claude costs scale with articles ingested, not readers — 1 user or 10,000 costs the same. The *figures* that used to sit here (~$4/mo, ~$9/mo total) were March 2026 and wrong by more than an order of magnitude by August. Re-derive rather than quote: `sift-api/scripts/verify_cost_baseline.py` (model spend), `sift-api/scripts/verify_neon_idle.py` (Neon). See `docs/DECISIONS.md` D54. |
| Progressive enhancement | Fixed categories work without auth. Custom topics and comparison require sign-in. |
| Graceful degradation | If pipeline fails, articles are stale but still served. If comparison fails, user gets an error, not a crash. |

---

## Technology choices

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 16 (App Router) | Best React DX, Vercel-native, TypeScript |
| Backend | Python FastAPI | LangGraph requires Python; FastAPI is async and fast |
| Orchestration | LangGraph | Genuine need: pipeline has sequential steps, comparison has fan-out/merge |
| AI (summaries) | Claude Haiku 4.5 | Cheapest, fast enough for news summaries |
| AI (search) | Claude + web_search | Used in comparison workflow and custom topic fallback |
| Embeddings | Voyage AI (voyage-3-lite), **512-dim** | Free 50M tokens/mo, high-quality retrieval embeddings |
| Database | Neon PostgreSQL + pgvector | Relational + vector search in one; auto-suspend, pooled connections |
| Auth | Clerk | 5-min setup, free to 10K MAU, polished UI |
| Hosting (web) | Vercel (Hobby) | Preview deploys, CDN, auto-deploy from GitHub |
| Hosting (api) | Railway | Persistent process for LangGraph, the batch poller and threading |
| Monitoring | Sentry + Vercel Analytics | Errors + usage, both free tier |
| Agent surface | sift-mcp (FastMCP) | 5 read-only tools over the same Postgres |
| Deferred work | Anthropic Batch API | Flat 50% off for anything a reader is not waiting on |

---

## Scaling path

**Cost here does not scale with users.** Model spend scales with *articles
ingested* — one reader or ten thousand costs the same — so the row that matters
is not in this table. Per 1,000 articles, all in, spend went **$5.38 → $2.69**
across August via incremental threading and linker roster narrowing. Re-derive
from `sift-api/scripts/verify_cost_baseline.py`; do not quote a monthly figure
from this file, which has been wrong by an order of magnitude before.

What adding *sources* costs is measured separately in
`sift-api/docs/SOURCE_SCALING.md`, and it names the two changes that should
precede any expansion.

| Users | What changes |
|-------|-------------|
| 1-1K | Nothing. Current architecture handles it. |
| 1K-10K | Postgres connection pooling (PgBouncer). Possibly a faster pipeline cadence. |
| 10K-50K | Upgrade the Neon plan. A hot cache layer. Multiple Railway instances. |
| 50K+ | Dedicated Postgres. Background workers on dedicated compute. You have revenue. |

The binding constraint today is none of these. It is `MAX_ENTRIES_PER_FEED`, and
the threading queue — both content-side, both reached long before user load
matters.
