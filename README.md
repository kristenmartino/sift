# Sift

AI-curated news aggregator powered by Claude and the Anthropic `web_search` tool. Surfaces the top stories across 7 categories with real-time, AI-generated summaries from live web search.

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd sift
npm install

# 2. Configure API key
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
sift/
├── app/
│   ├── api/news/route.ts    # Server-side API proxy (Claude web_search)
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
  → API route checks two-tier cache (30min fresh / 60min stale)
  → If miss: calls Claude with web_search tool for AI-curated articles
  → Claude searches the web, summarizes top stories as JSON
  → extractJsonArray() parses LLM output (3-strategy robust parser)
  → Returns normalized Article[] to client
  → Client renders ArticleCard grid with animations
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| Claude web_search over NewsAPI | AI-generated summaries, broader source diversity, no syndication dependency |
| "Summarize" prompt framing | Avoids model refusals from rigid JSON extraction commands |
| Server-side API proxy | API key never reaches the client |
| Two-tier stale-while-revalidate cache | Near-instant repeat loads despite AI latency |
| 3-strategy JSON parser | Handles LLM output variability (prose-wrapped, markdown-fenced, truncated) |
| Stable URL-based IDs | Bookmarks survive page refresh |
| CSS variables for theming | Dark/light toggle without class rewrite |

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
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **AI Engine:** Anthropic Claude + web_search tool
- **Styling:** Tailwind CSS + CSS custom properties
- **Testing:** Jest + React Testing Library
- **Deployment:** Vercel (recommended)
