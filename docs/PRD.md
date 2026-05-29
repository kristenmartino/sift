# Sift — Product Requirements Document

**Version:** 3.0 (civic-literacy)
**Date:** May 18, 2026
**Author:** Martino
**Domain:** siftnews.kristenmartino.ai
**Status:** Production live; civic-literacy MVP shipped, in iteration

---

## Vision

**A news aggregator with civic footnotes.** Sift is an AI-powered news aggregator across 10 categories — with a civic-literacy layer on top. Open it, read today's stories across categories. Search any topic. Compare how outlets covered the same story. And on every story, click any name — senator, lobbying group, bill — to get who they are, what they've done, and what they want. Sourced from public records.

## Value proposition

**For readers:** Open Sift. Today's stories across 10 categories — Top, Tech, Business, Science, Energy, World, Health, Politics, Sports, Entertainment, each AI-summarized. Search any topic. Compare coverage across outlets. And on every story: *"What you should know first,"* an inline glossary for civic terms, and structured dossiers on the politicians, organizations, and bills involved. *Read the headline; learn the civics as you go.*

**For hiring managers:** I built an AI-powered news aggregator + civic-literacy layer end-to-end — Next.js + Postgres frontend on Vercel, Python FastAPI + LangGraph backend on Railway. The architectural move that matters is splitting AI by SLA: the browse path (categories, summaries, dossiers, primers) is pre-computed in a background pipeline and served from Postgres in ~50ms; the live AI path (multi-source compare, topic search) runs on request and streams, accepting ~10–15s because the user is asking for analysis, not browsing.

---

## What makes Sift different

The product is two layers stacked, plus an architectural move that makes both work:

### Foundation — AI-powered news aggregator

1. **10 categories** from ~50 vetted outlets across the political spectrum.
2. **AI summaries** on every article, pre-computed in the background pipeline.
3. **Topic search** via vector similarity (Voyage AI + pgvector), SSE streaming, with Claude web-search fallback for niche queries.
4. **Multi-source comparison** via LangGraph fan-out: pulls coverage across outlets, extracts claims, shows side-by-side framing.
5. **Bookmarks** (Clerk-synced), dark/light themes, auth.

### Differentiator — civic-literacy layer

6. **"What you should know first"** — adaptive primer above each story; key terms and context the article assumes you already have.
7. **Inline glossary** — civic terms surface contextually inside the article, with chip tooltips and click-through to the full dossier.
8. **Civic dossiers** — every politician, organization, bill, and news outlet has a structured page sourced from public records (OpenSecrets, GovTrack, ProPublica Nonprofit Explorer, FARA, FEC, Vote Smart). News stories link out to them inline.
9. **Cross-spectrum framing** — when multiple outlets cover the same story, what each Left / Center / Right outlet chose to emphasize. AllSides + MBFC ratings shown verbatim — Sift never computes its own.

### Architecture move — AI split by SLA

10. **Browse path:** pre-computed in a background pipeline; frontend reads from Postgres in ~50ms. The whole category-browsing experience is a database read.
11. **Live AI path:** multi-source compare and topic search run live, accept ~10–15s, and stream as they go. Different work, different SLA.

---

## Target users

1. **Primary:** Engaged citizens who follow politics but don't already know who every senator, lobbying body, or think tank is — and want to. The "I read the news and feel like I'm missing context" reader.
2. **Secondary:** Civic-literacy educators, journalists, and policy folks who need quick context on the players and history behind a story.
3. **Tertiary:** Hiring managers evaluating product, design, and engineering judgment.

---

## Architecture summary

Two services, one database:

- **Next.js on Vercel** — frontend, API routes (Postgres reads), Clerk auth, civic dossier pages, methodology page, SSE streaming for topic search.
- **Python FastAPI + LangGraph on Railway** — background pipeline: primer generation, entity extraction, entity linking to dossiers, summarization, story synthesis, story clustering, civic context generation, batched API client, cross-source comparison workflow, usage tracking.
- **Neon Postgres + pgvector** — single source of truth for articles, embeddings, entity dossiers, bookmarks.

Pipeline runs every 30 minutes via asyncio scheduler on Railway. User requests never touch Claude — they read from Postgres in <50ms.

Full technical details: `ARCHITECTURE.md` and `TECHNICAL_SPEC.md`.

---

## Feature specification

### Foundation (the reader surface — shipped)

| ID | Feature |
|---|---|
| F1 | 10-category news feed (Top, Tech, Business, Science, Energy, World, Health, Politics, Sports, Entertainment) |
| F2 | AI article summaries in the background pipeline (Claude Haiku 4.5) |
| F3 | Topic search via vector similarity (Voyage AI + pgvector) with SSE streaming + Claude web-search fallback |
| F4 | Multi-source comparison (LangGraph fan-out → claim extraction → side-by-side framing) |
| F5 | Bookmarks (localStorage + Clerk server sync) |
| F6 | Dark/light themes ("Late Edition" / "Newsprint") |
| F7 | Auth (Clerk, free to 10K MAU) |
| F8 | Landing page + methodology page |
| F9 | SiftLogo brand mark across touchpoints |

### Civic-literacy layer (shipped + in iteration)

| ID | Feature | Status |
|---|---|---|
| C1 | Background primer — *"What you should know first"* + key terms, AI-generated at ingest | Shipped |
| C2 | Inline glossary — civic terms surface contextually inside articles, with chip tooltips and dossier click-through | Shipped (Phase 3.G + 3.H) |
| C3 | Politician dossiers — committee assignments, top industries by PAC contributions, interest-group ratings, external links to GovTrack / OpenSecrets / Vote Smart / Ballotpedia / Wikipedia | Shipped (Phase 3.C) |
| C4 | Organization dossiers — political lean, finances, major funders, FARA registration, external links to ProPublica Nonprofit Explorer / IRS 990 / FARA / official site | Shipped (Phase 3.D) |
| C5 | Bill dossiers — status, sponsor, cosponsors, lobbying spend, external links to GovTrack / Congress.gov / OpenSecrets | Shipped (Phase 3.E) |
| C6 | Outlet dossiers — ownership, funding, AllSides political-lean rating, MBFC factual-reporting rating, recent stories | Shipped (Phase 2.B + 2.C) |
| C7 | Cross-spectrum compare — three-bucket (L / C / R) framing comparison, AllSides-rated | Shipped (Phase 2.C.2) |
| C8 | Civic dossier index — searchable, filterable, all entity types | Shipped (Phase 3.I) |
| C9 | Reading-level adjuster — Simpler / Standard / Detailed slider, Claude-rewritten and cached | In design |
| C10 | Primer expansion instrumentation — measure what users actually expand | In progress |
| C11 | Per-paragraph primer triggering — surface primers in the reading flow, not above the fold | Next |

### Non-goals

- Not a chatbot interface. Browse, don't interrogate.
- Not a trust-judgment layer. Sift surfaces AllSides + MBFC ratings verbatim; it does not compute its own.
- Not a propaganda decoder. (Different product, different corpus, different audience.)
- Not a real-time ticker. Refreshes every 30 minutes.
- Not a full-text reader. Links to original sources.
- Not a social platform. No comments, no voting.

---

## Competitive landscape

| Product | What it does | Where Sift differs |
|---|---|---|
| Apple News / Google News | Aggregates headlines + summaries from publishers | Sift adds civic dossiers + inline glossary + adaptive primers — context the news assumes the reader already has |
| Perplexity Discover | AI-curated news with web-search-style summaries | Sift is structured around an entity-dossier graph, not a retrieval/chat loop |
| NewsGuard / AllSides / Ad Fontes | Site-level trust/bias ratings | Sift surfaces those ratings inline (verbatim) and adds entity-level context around them |
| OpenSecrets / GovTrack / ProPublica | Public-records databases by entity type | Sift threads them together at point-of-reading, so the reader doesn't have to leave the article |
| Civic-education content (Civics 101, Ground News context blocks) | Standalone civic content | Sift integrates civic context directly into the news reading flow |

---

## Open questions

1. **Glossary scope.** Currently civic-only. Could extend to financial, scientific, or technical terms. Where to draw the line?
2. **Primer triggering granularity.** Article-level (current) vs. per-paragraph vs. user-paced. Empirical question, needs the instrumentation now landing.
3. **Dossier coverage.** ~600 sitting members of Congress + curated orgs + landmark bills. Where's the next expansion — historical politicians, state-level, lobbying firms, federal agencies?
4. **Monetization.** Portfolio-first for now. The structural feature most likely to support paid: research-grade exports (PDF dossier packets, custom briefings) for institutional users.
