# Sift

**The news, with footnotes.** An AI-powered news aggregator with a civic-literacy layer on top. Sift reads from ~50 vetted outlets across the political spectrum, AI-summarizes the day's stories across 10 categories, lets you search any topic or compare coverage across sources — *and* adds the civic footnotes the news assumes you already have: an adaptive *"what you should know first"* primer, inline glossary tooltips, structured dossiers on every politician / organization / bill / outlet, cross-spectrum framing — all sourced from public records.

**Live:** [siftnews.kristenmartino.ai](https://siftnews.kristenmartino.ai)

> **Direction:** Sift is mid-pivot from a general-audience news aggregator to a civic-literacy news app. See [`plans/sift-civic-literacy.md`](../../.claude/plans/sift-civic-literacy.md) for the active plan. The pre-pivot product is preserved at git tag `v1-general-audience`. A possible future "Sift Pro" tier (paid power-user / professional intelligence) is documented but deferred — see [`plans/sift-ib-pivot.md`](../../.claude/plans/sift-ib-pivot.md).

## Architecture

```
Browser --> Vercel (Next.js) --reads--> Neon Postgres (pgvector)
                |
                +----- refresh /30min --> Railway (FastAPI + LangGraph) --writes--> Neon Postgres
                +----- /api/compare ---> Railway
```

- **sift** (this repo): Next.js 15 frontend on Vercel — reads from Postgres, serves UI
- **sift-api**: Python FastAPI + LangGraph on Railway — background pipeline + comparison workflow
- **Database**: Neon Postgres (pgvector) — shared source of truth

## Foundation (the reader surface)

- **10 categories**: Top, Technology, Business, Science, Energy, World, Health, Politics, Sports, Entertainment.
- **AI summaries**: every article summarized by Claude Haiku 4.5 in the background pipeline — user requests never touch Claude.
- **Topic search**: vector similarity (Voyage AI embeddings + pgvector), SSE streaming, Claude web-search fallback for niche queries.
- **Multi-source comparison**: LangGraph workflow — fan-out search across outlets, extract claims, compare framings. Described, not labeled.
- **Bookmarks**: localStorage + Clerk server sync.
- **Dark/light themes**: "Late Edition" (dark) and "Newsprint" (light) with warm editorial tones.
- **SiftLogo**: diamond mark brand identity across all touchpoints.
- **Auth**: Clerk (free to 10K MAU).

## Civic-literacy layer (what makes Sift Sift)

- **"What you should know first"**: an adaptive primer above each story — key terms and context the article assumes you already have. AI-generated at ingest, expandable for complex policy.
- **Inline glossary**: civic terms surface contextually inside the article — defined where the reader needs them. Chip tooltips with previews; click-through to the full dossier.
- **Civic dossiers**: every politician, organization, bill, and outlet links to a structured dossier — committee assignments, top industries by PAC contributions, ownership, funding, FARA registration, voting records, AllSides + MBFC ratings. Sourced from OpenSecrets, GovTrack, ProPublica Nonprofit Explorer, FARA, Vote Smart, and FEC. Citations on every page.
- **Cross-spectrum framing**: how outlets across left / center / right framed the same story. Sift surfaces AllSides + MBFC ratings verbatim — never computes its own.
- **Methodology**: source curation policy and symmetric-application rules public at `/methodology`.
- **Civic dossier index**: searchable, filterable view of curated politicians, organizations, and bills at `/civic`.

## Architecture move — AI split by SLA

- **Browse path**: pre-computed in a background pipeline; frontend reads from Postgres in ~50ms. The whole category-browsing experience is a database read.
- **Live AI path**: multi-source compare and topic search run AI live (fan-out, claim extraction, web search) and accept ~10–15s, streaming as they go. Different work, different SLA.

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Add: DATABASE_URL, ANTHROPIC_API_KEY, VOYAGE_API_KEY, SIFT_API_URL, SIFT_API_KEY, CRON_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
sift/
├── app/
│   ├── api/
│   │   ├── news/route.ts          # Category articles (Postgres read)
│   │   ├── news/topic/route.ts    # Topic search (vector + SSE + fallback)
│   │   ├── compare/route.ts       # Proxy to Railway compare endpoint
│   │   ├── cron/refresh/route.ts  # Pipeline trigger (Railway)
│   │   └── bookmarks/route.ts     # Bookmark sync (Clerk + Postgres)
│   ├── sign-in/                   # Clerk auth pages
│   ├── sign-up/
│   ├── globals.css                # Theme variables (Newsprint / Late Edition)
│   ├── layout.tsx                 # Root layout, metadata, theme script
│   ├── page.tsx                   # Landing page
│   ├── icon.tsx                   # Diamond mark favicon
│   ├── apple-icon.tsx             # Diamond mark apple icon
│   ├── opengraph-image.tsx        # OG image with diamond mark
│   └── manifest.ts               # PWA manifest
├── components/
│   ├── NewsAggregator.tsx         # Main app (state, layout, tabs)
│   ├── ArticleCard.tsx            # Article display
│   ├── SiftLogo.tsx               # Brand mark (full/compact/mark/wordmark)
│   ├── LandingPage.tsx            # Marketing landing page
│   ├── TopicSearch.tsx            # Search input + SSE consumer
│   ├── CompareView.tsx            # Comparison results
│   ├── SkeletonCard.tsx           # Loading placeholder
│   ├── ErrorState.tsx             # Error UI
│   └── AuthButtons.tsx            # Clerk sign-in/out
├── lib/
│   ├── constants.ts               # Categories, colors (semantic), gradients
│   ├── hooks.ts                   # useNewsLoader, useBookmarks, useTheme, useTopicSearch, useCompare
│   ├── types.ts                   # TypeScript interfaces
│   ├── db.ts                      # Neon serverless Postgres client
│   ├── sse.ts                     # SSE event parser
│   └── utils.ts                   # Hash, parse, time, domain helpers
├── __tests__/                     # Jest + RTL
└── docs/                          # Architecture, decisions, specs
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres pooled connection string |
| `ANTHROPIC_API_KEY` | Yes | Claude API key (topic search fallback) |
| `VOYAGE_API_KEY` | Yes | Voyage AI key (topic search embeddings) |
| `SIFT_API_URL` | Yes | Railway sift-api URL |
| `SIFT_API_KEY` | Yes | Shared secret for pipeline trigger |
| `CRON_SECRET` | Yes | Cron endpoint auth |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth (optional) |
| `CLERK_SECRET_KEY` | No | Clerk auth (optional) |

## Scripts

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run test         # Jest tests
npm run test:coverage
```

## Deployment

Auto-deploys to Vercel on push to `main`. CI runs on every PR via GitHub Actions (`tsc --noEmit`).

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties
- **Database**: Neon Postgres + pgvector
- **Auth**: Clerk
- **AI**: Claude Haiku 4.5 (summaries + comparison), Voyage AI (embeddings)
- **Testing**: Jest + React Testing Library
- **Hosting**: Vercel
- **CI**: GitHub Actions
