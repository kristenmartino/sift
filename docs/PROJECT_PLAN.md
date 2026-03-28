# Sift — Project Plan & Status

**Date:** February 23, 2026
**Last Updated:** March 28, 2026
**Status:** v2 architecture in progress — Claude web_search live, migrating to RSS hybrid pipeline
**Stack:** Next.js 15 / TypeScript / Tailwind CSS / Anthropic Claude (`web_search`)

---

## Current state (v1.5 — Claude web_search)

The app is live on `localhost:3000` with Anthropic Claude `web_search` as the content engine. All 7 categories load AI-generated summaries. This is the bridge between v1 (NewsAPI) and v2 (RSS hybrid pipeline).

### What's working

| Layer | Implementation | Status |
|-------|---------------|--------|
| UI Framework | React components in Next.js App Router | Working |
| State Management | Custom hooks + localStorage | Working |
| API Integration | Server-side Claude `web_search` | Working |
| Styling | Tailwind CSS + CSS custom properties | Working |
| Caching | In-memory Map + persistent disk (`/tmp/sift-cache/`) | Working |
| Stale-while-revalidate | 30-min fresh TTL + 60-min stale TTL | Working |
| Image pipeline | Claude → OG scraping (7 patterns) → HEAD validation | Working |
| Citation stripping | Removes `<cite>` markup from Claude responses | Working |
| Rate limiting | In-memory, 30 req/min per IP | Working |
| Testing | Jest + RTL, 80 test cases | Passing |
| Dark/light mode | CSS variables + localStorage toggle | Working |
| Bookmarks | localStorage persistence | Working |

### File map

```
sift/                      (26 source files, 2,601 LOC)
├── app/
│   ├── api/news/route.ts       512 LOC  ← Claude web_search + OG enrichment
│   ├── globals.css              73 LOC  ← Tailwind + CSS vars + reset
│   ├── layout.tsx               30 LOC  ← Metadata, skip-nav, fonts
│   └── page.tsx                  5 LOC  ← Thin wrapper
├── components/
│   ├── NewsAggregator.tsx      255 LOC  ← Main orchestrator
│   ├── ArticleCard.tsx         124 LOC  ← Card with badge, bookmark, meta
│   ├── CardImage.tsx            64 LOC  ← Image with gradient fallback
│   ├── SkeletonCard.tsx         41 LOC  ← Loading placeholder
│   ├── ErrorState.tsx           23 LOC  ← Error UI with retry
│   └── index.ts                  5 LOC  ← Barrel exports
├── lib/
│   ├── hooks.ts                156 LOC  ← useNewsLoader, useBookmarks, useTheme
│   ├── utils.ts                135 LOC  ← Parse, hash, time, domain, citations
│   ├── types.ts                 84 LOC  ← All TypeScript interfaces
│   ├── constants.ts             87 LOC  ← Categories, colors, timing
│   └── cache.ts                 54 LOC  ← In-memory + disk cache
├── __tests__/
│   ├── utils.test.ts           300 LOC  ← 25 tests: parser, hash, time, domain
│   ├── cache.test.ts           291 LOC  ← Cache TTL, disk persistence
│   ├── api.test.ts             254 LOC  ← API response parsing scenarios
│   └── ErrorState.test.tsx      22 LOC  ← Component rendering tests
├── docs/                        ← Architecture, PRD, decisions, specs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── jest.config.ts
├── next.config.js
├── .env.local.example
├── .gitignore
└── README.md
```

---

## v2 migration plan

The v2 architecture moves from Claude web_search (in the request path) to a background RSS pipeline. See these docs for full details:

- **[PRD.md](PRD.md)** — Product requirements, feature tiers, card design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture, data flows, scaling path
- **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** — Service map, DB schema, API contracts, RSS feeds
- **[DECISIONS.md](DECISIONS.md)** — 17 architectural decisions, all locked

### v2 build sequence

1. Postgres schema + migrations
2. Python FastAPI service scaffold on Railway
3. LangGraph pipeline workflow (RSS → Claude → Voyage → store)
4. RSS feed integration (28 feeds, 7 categories)
5. Next.js API routes rewrite (Postgres reads)
6. Card redesign — text-first + RSS images
7. Vercel Cron configuration
8. Clerk auth integration
9. Custom topics — vector search + fallback
10. SSE streaming for article delivery
11. LangGraph comparison workflow
12. Landing page at siftnews.ai

---

## Bugs fixed

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
