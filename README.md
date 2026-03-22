# Sift

AI-curated news aggregator powered by Claude and the Anthropic web_search tool. Surfaces the top stories across 7 categories with real-time summaries.

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd sift
npm install

# 2. Configure API key
cp .env.local.example .env.local
# Edit .env.local and add your API key

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
sift/
├── app/
│   ├── api/news/route.ts    # Server-side API proxy
│   ├── globals.css           # Tailwind + CSS variables
│   ├── layout.tsx            # Root layout, metadata, skip-nav
│   └── page.tsx              # Home page
├── components/
│   ├── NewsAggregator.tsx    # Main orchestrator (state, layout)
│   ├── ArticleCard.tsx       # Individual article display
│   ├── CardImage.tsx         # Image with gradient fallback
│   ├── ErrorState.tsx        # Error UI with retry
│   └── SkeletonCard.tsx      # Loading placeholder
├── lib/
│   ├── constants.ts          # Categories, colors, timing, storage keys
│   ├── hooks.ts              # useNewsLoader, useBookmarks, useTheme
│   ├── types.ts              # TypeScript interfaces (single source of truth)
│   └── utils.ts              # Pure functions (hash, parse, time, domain)
└── __tests__/
    ├── utils.test.ts          # Unit tests for all utility functions
    ├── api.test.ts            # API route integration tests
    └── ErrorState.test.tsx    # Component rendering tests
```

### Data Flow

```
User clicks category
  → useNewsLoader dispatches fetch to /api/news?category=X
  → API route checks in-memory cache (15min TTL)
  → If miss: calls news API for fresh articles
  → Returns normalized Article[] to client
  → Client renders ArticleCard grid with animations
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| Server-side API proxy | API key never reaches the client |
| Structured subtopics per category | Broad coverage across each domain |
| Stable URL-based IDs | Bookmarks survive page refresh |
| CSS variables for theming | Dark/light toggle without class rewrite |

## Git Workflow

```bash
main              # always deployable, Vercel auto-deploys
 └── dev          # daily work, merge to main when stable
      ├── feat/*  # new features (feat/search, feat/streaming)
      └── fix/*   # bug fixes (fix/mobile-layout, fix/parser)
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
vercel env add NEWS_API_KEY
vercel --prod
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWS_API_KEY` | Yes | Your NewsAPI key |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS custom properties
- **Testing:** Jest + React Testing Library
- **Deployment:** Vercel (recommended)
