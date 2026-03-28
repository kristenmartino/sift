# Sift — Product Requirements Document

**Version:** 2.0
**Date:** March 28, 2026
**Author:** Martino
**Domain:** siftnews.ai

---

## Vision

Sift is a news reader where AI does the reading for you. Open it, see 5 stories that matter across any topic, each with a concise summary written for comprehension — not a headline written for clicks. Close it. 60 seconds. That's the experience.

## Value proposition

**For users:** "Open Sift. In 60 seconds, know what's happening across tech, business, science, energy, world news, and health. Create your own topics — 'AI in healthcare,' 'Florida utilities,' anything. Every summary is AI-written. Every comparison is multi-source."

**For hiring managers:** "I built a hybrid AI system from 0 to 1: Next.js frontend on Vercel, Python/LangGraph backend on Railway, Postgres with pgvector, background content pipeline, multi-source comparison via fan-out search, custom topics via vector similarity — all for $30/month."

---

## What makes Sift different

1. **AI summaries from RSS feeds** — not raw publisher descriptions, not chatbot Q&A. A curated reading experience.
2. **Custom topics via vector search** — type anything, get instant results from a pre-built article index. Falls back to Claude web_search for niche queries.
3. **Multi-source comparison** — see how Reuters, BBC, and AP covered the same story, with agreements and disputes identified.
4. **Background pipeline** — content is always fresh. User requests are pure database reads. No loading spinners.
5. **Domain-specific coverage** — Energy category with grid, renewables, utilities, NextEra, FPL coverage that no mainstream aggregator provides.

---

## Target users

1. **Primary:** Professionals who want a morning news scan across multiple domains in 60 seconds
2. **Secondary:** People interested in niche topics (energy/utilities, AI policy) underserved by mainstream aggregators
3. **Tertiary:** Hiring managers evaluating AI engineering skills

---

## Architecture summary

Two services, one database:

- **Next.js on Vercel Pro** — frontend, API routes (Postgres reads), Clerk auth, Vercel Cron
- **Python FastAPI + LangGraph on Railway** — background pipeline (RSS → Claude → Voyage → Postgres), multi-source comparison
- **Vercel Postgres (Neon) + pgvector** — single source of truth for articles, embeddings, custom topics, bookmarks

Content pipeline runs every 10-15 minutes via Vercel Cron. User requests never touch Claude — they read from Postgres in <50ms.

Total cost: ~$30/month.

Full technical details: SIFT_ARCHITECTURE_v2.md and SIFT_TECHNICAL_SPEC.md.

---

## Feature specification

### Tier 0 — Ship blockers (Week 1-2)

| ID | Feature | Effort |
|---|---|---|
| S0 | Postgres schema + migrations | 2 hr |
| S1 | Python FastAPI service scaffold on Railway | 3 hr |
| S2 | LangGraph pipeline workflow (RSS → Claude → Voyage → store) | 6 hr |
| S3 | RSS feed integration (28 feeds, 7 categories) | 4 hr |
| S4 | Next.js API routes rewrite (Postgres reads) | 3 hr |
| S5 | Card redesign — text-first + RSS images | 3 hr |
| S6 | Vercel Cron configuration | 30 min |
| S7 | Clerk auth integration | 1 hr |

### Tier 1 — Core product (Week 2-3)

| ID | Feature | Effort |
|---|---|---|
| T1 | Custom topics — vector search + fallback | 6 hr |
| T2 | SSE streaming for article delivery | 4 hr |
| T3 | LangGraph comparison workflow | 6 hr |
| T4 | Bookmarks synced to Postgres (via Clerk user ID) | 2 hr |
| T5 | Landing page at siftnews.ai | 4 hr |

### Tier 2 — Differentiation (Week 3-4)

| ID | Feature | Effort |
|---|---|---|
| T6 | Morning briefing — single paragraph top 3 stories | 3 hr |
| T7 | "Why this matters" context line per article | 3 hr |
| T8 | Share article (copy link + native share) | 1 hr |
| T9 | Trend detection — "this topic appeared 4 of 5 days" | 4 hr |
| T10 | Favicon + OG image + visual identity | 3 hr |

### Tier 3 — Portfolio showcase (Post-launch)

| ID | Feature | Effort |
|---|---|---|
| T11 | Summary customization (ELI5 / Technical / Executive) | 3 hr |
| T12 | Semantic search across past articles | 4 hr |
| T13 | Daily digest email | 6 hr |
| T14 | Reading analytics dashboard | 4 hr |
| T15 | Multi-language support | 4 hr |

---

## Card design

**Mixed layout — RSS images when available, text-first when not.**

Cards with images: image at top, content below. Standard news card pattern.

Cards without images: thin category color accent bar at top (3px, category color), no image area at all. Badge, headline in Playfair Display, AI summary, source metadata. Clean editorial layout.

Both card types coexist in the grid. No gradient fallbacks, no placeholder icons, no OG scraping.

---

## Non-goals

- Not a real-time ticker (refreshes every 10-15 min, not live)
- Not a social platform (no comments, no voting)
- Not a full-text reader (links to original sources)
- Not a chatbot (browse, don't interrogate)

---

## Competitive landscape

| Product | Sift's advantage |
|---|---|
| Google News | Sift provides AI summaries, not just headlines |
| Apple News | Sift doesn't need publisher deals |
| Feedly | Sift handles source discovery automatically |
| Perplexity Daily | Sift is purpose-built for browsing, not search |
| Hacker News | Sift covers 7 domains + custom topics, with summaries |

---

## Build sequence

```
Week 1:  Python service + Postgres + LangGraph pipeline + RSS
Week 2:  Next.js rewrite (DB reads) + card redesign + Clerk + SSE
Week 3:  Comparison workflow + custom topics + landing page
Week 4:  QA + monitoring + deploy to production + share with 10 people
```

---

## Open questions (for Stark)

1. **Custom topics — what's the UI?** Freeform text field? Suggested topics? Both?
2. **Comparison — where does it live?** Button on each article? Separate tab? Triggered by detecting the same story across categories?
3. **Monetization — ever?** Custom topics and comparison could be premium features behind Clerk auth. But this is portfolio-first.
