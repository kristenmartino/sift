# Sift

A civic-literacy news app for the American public. Sift reads hundreds of vetted sources, surfaces the civic context the news assumes you already know, compares how outlets across the political spectrum frame the same story, and shows the financial and political ties behind every entity — all linked to public records.

**Live:** [siftnews.kristenmartino.ai](https://siftnews.kristenmartino.ai)

> **Direction:** Sift is mid-pivot from a general-audience news aggregator to a civic-literacy news app. See [`plans/sift-civic-literacy.md`](../../.claude/plans/sift-civic-literacy.md) for the active plan. The pre-pivot product is preserved at git tag `v1-general-audience`. A possible future "Sift Pro" tier (paid power-user / professional intelligence) is documented but deferred — see [`plans/sift-ib-pivot.md`](../../.claude/plans/sift-ib-pivot.md).

## Architecture

```
Browser --> Vercel (Next.js) --reads--> Neon Postgres (pgvector)
                |
                +----- cron /10min ----> Railway (FastAPI + LangGraph) --writes--> Neon Postgres
                +----- /api/compare ---> Railway
```

- **sift** (this repo): Next.js 15 frontend on Vercel — reads from Postgres, serves UI
- **sift-api**: Python FastAPI + LangGraph on Railway — background pipeline + comparison workflow
- **Database**: Neon Postgres (pgvector) — shared source of truth

## Features (current)

- **10 categories**: Top, Technology, Business, Science, Energy, World, Health, Politics, Sports, Entertainment
- **AI summaries**: Every article summarized by Claude Haiku 4.5
- **Topic search**: Vector similarity (Voyage AI embeddings + pgvector), SSE streaming, Claude web search fallback
- **Multi-source comparison**: LangGraph workflow — fan-out web search across outlets, extract claims, compare
- **Bookmarks**: localStorage + Clerk server sync
- **Dark/light themes**: "Late Edition" (dark) and "Newsprint" (light) with warm editorial tones
- **SiftLogo**: Diamond mark brand identity across all touchpoints
- **Auth**: Clerk (free to 10K MAU)

## Features (civic-literacy MVP, in progress — see plan)

- **Background primer**: *"What you should know first"* + 3–5 term definitions, AI-generated at ingest
- **Cross-spectrum comparison**: how outlets across left / center / right framed the same story, with AllSides + MBFC ratings shown for each outlet
- **Reading-level adjuster**: Simpler / Standard / Detailed slider, Claude-rewritten and cached
- **Inline glossary with financial AND political context**: hover any entity (outlet, politician, think tank, pundit, bill) for an externally-sourced dossier — ownership, donors, voting records, foreign funding (FARA), interest-group ratings. All linked to AllSides, MBFC, OpenSecrets, GovTrack, ProPublica Nonprofit Explorer, FARA, Vote Smart, and FEC
- **Methodology**: source curation policy and symmetric-application rules public at `/methodology`

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
