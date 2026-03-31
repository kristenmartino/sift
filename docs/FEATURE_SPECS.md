# Sift — Priority Feature Specs

**Date:** March 22, 2026
**Last Updated:** March 31, 2026
**Status:** Production live at siftnews.kristenmartino.ai — core features shipped, branding in progress
**Goal:** Ship features that prove Sift is a real product built by someone who understands AI architecture, not a tutorial wrapper.

---

## Implementation Status (March 31, 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| **Feature 1**: Custom Topics (freeform) | Not started | Topic search exists (vector + fallback), but no TopicModal or saved topics |
| **Feature 2**: Streaming Article Cards | Partial | SSE streaming works for topic search; category loads are blocking |
| **Feature 3**: Cross-Source Story Threading | Not started | |
| **Feature 4**: "Why This Matters" | Not started | |
| **Feature 5**: Morning Briefing | Not started | |
| **Feature 6**: Trend Detection | Not started | |
| **Feature 7**: Semantic Search/RAG | Done | Topic search via Voyage AI embeddings + pgvector + Claude web search fallback |
| **Feature 8**: Multi-Language | Not started | |
| **Feature 9**: PWA/Offline | Not started | |
| **Feature 10**: Analytics Dashboard | Not started | |
| **B1**: Landing Page | Done | Full marketing page with feature cards |
| **B2**: Logo System | Done | SiftLogo component with diamond mark (full/compact/mark/wordmark) |
| **B3**: Voice/Tone | Not started | |
| **B4**: Color Story | Done | Named palettes (Newsprint/Late Edition), semantic category colors |
| **B5**: 404/Empty States | Not started | |
| **B6**: About Page | Not started | |
| **B7**: OG Images | Done | Dynamic generation with diamond mark |
| **B8**: Email Template | Not started | |
| **B9**: Micro-Interactions | Not started | |

---

## Feature 1: Personalized Custom Topics

### What it is

Users define freeform topics — "Florida utilities," "AI in healthcare," "Series A funding" — and Sift builds a custom feed. The AI interprets natural language, generates smart search queries, and returns relevant articles. This is the feature that makes the AI layer irreplaceable. A traditional news API can't interpret "what's happening with offshore wind permitting in the Northeast" — only an LLM can.

### Why it matters for the portfolio

Proves you understand the difference between "calling an API" and "building an AI product." A hiring manager sees: prompt engineering with user context, dynamic query generation, personalization architecture, and state management for user preferences.

### User Flow

```
1. User clicks "+" next to category pills
2. Modal opens: "What do you want to track?"
3. User types: "Florida utilities and clean energy"
4. Sift generates a preview: "I'll search for: FPL, NextEra Energy,
   Florida Power, clean energy policy Florida, solar installations FL"
   → User sees the AI's interpretation and can refine
5. User confirms → new pill appears in nav: "FL Energy" (AI-generated short label)
6. Articles load with the same card UI as built-in categories
7. Custom topics persist in localStorage (later: user accounts)
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client                                                     │
│  ┌──────────────┐    ┌──────────────────┐                   │
│  │ TopicModal    │───▶│ POST /api/topics │                   │
│  │ (freeform     │    │ /generate        │                   │
│  │  input)       │    └────────┬─────────┘                   │
│  └──────────────┘             │                              │
│                               ▼                              │
│  ┌──────────────────────────────────────────┐                │
│  │ API Route: /api/topics/generate          │                │
│  │                                          │                │
│  │ 1. Send user's raw topic to Claude       │                │
│  │ 2. Claude returns:                       │                │
│  │    - shortLabel: "FL Energy" (≤12 chars) │                │
│  │    - icon: emoji suggestion              │                │
│  │    - searchQueries: string[] (3-5)       │                │
│  │    - description: one-line explanation   │                │
│  │ 3. Return to client for preview          │                │
│  └──────────────────────────────────────────┘                │
│                                                              │
│  On confirm:                                                 │
│  ┌──────────────────────────────────────────┐                │
│  │ GET /api/news?topic=custom&queries=...   │                │
│  │                                          │                │
│  │ Same flow as built-in categories, but    │                │
│  │ uses the AI-generated search queries     │                │
│  │ instead of CATEGORY_QUERIES constants    │                │
│  └──────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### New API Route: `/api/topics/generate`

```typescript
// POST body
interface TopicGenerateRequest {
  rawTopic: string;        // "Florida utilities and clean energy"
  existingTopics?: string[]; // avoid duplicates
}

// Response
interface TopicGenerateResponse {
  shortLabel: string;      // "FL Energy"
  icon: string;            // "⚡"
  searchQueries: string[]; // ["FPL NextEra Energy news", "Florida clean energy policy", ...]
  description: string;     // "Florida utility companies and clean energy developments"
}
```

**Prompt design** (this is where the AI intelligence lives):

```
You are helping a user create a personalized news topic.
They described their interest as: "${rawTopic}"

Generate a topic configuration:
1. shortLabel: A concise label (≤12 characters) for a navigation pill
2. icon: A single emoji that represents this topic
3. searchQueries: 3-5 specific search queries that would find relevant
   current news. Be specific — include company names, policy names,
   geographic areas, and industry terms. Think like a research analyst.
4. description: One sentence explaining what this topic covers.

Respond as JSON only.
```

### Data Model Changes

```typescript
// New type in types.ts
interface CustomTopic {
  id: string;              // crypto.randomUUID()
  rawInput: string;        // what the user typed
  shortLabel: string;      // AI-generated label
  icon: string;            // AI-generated emoji
  searchQueries: string[]; // AI-generated queries
  description: string;
  createdAt: string;       // ISO date
  color: { hex: string; rgb: string }; // assigned from a palette
}

// CategoryId becomes a union
type CategoryId = BuiltInCategory | `custom-${string}`;
```

### Storage

```typescript
// localStorage for now, same pattern as bookmarks
const STORAGE_KEYS = {
  bookmarks: "sift-bookmarks",
  theme: "sift-theme",
  customTopics: "sift-custom-topics",  // NEW
} as const;
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `TopicModal.tsx` | Freeform input + preview + confirm |
| `TopicPill.tsx` | Custom pill in nav (with delete/edit) |
| `AddTopicButton.tsx` | The "+" button that opens the modal |

### Constraints & Edge Cases

- Max 5 custom topics (prevent API abuse)
- Validate that searchQueries are reasonable (no injection)
- Handle AI generating bad labels (fallback to truncated rawInput)
- Custom topic articles go through the same cache as built-in categories
- Delete topic: remove pill, clear cache, keep any bookmarked articles

### Implementation Order

1. Add `CustomTopic` type and `customTopics` localStorage hook
2. Build `/api/topics/generate` route
3. Build `TopicModal` component
4. Wire "+" button into existing category nav
5. Modify `useNewsLoader` to accept custom queries
6. Test with 3 different topic types

**Estimated effort:** 6-8 hours

---

## Feature 2: Streaming Article Cards

### What it is

Instead of a loading spinner for 15-20 seconds, article cards stream in one at a time as the LLM generates them. The user sees the first article within 3-5 seconds and each subsequent card slides in with a staggered animation. Uses server-sent events (SSE) with Anthropic's streaming API.

### Why it matters for the portfolio

This is the most *visually dramatic* technical feature. A hiring manager watching a demo sees cards materializing in real-time and immediately understands: this person knows streaming APIs, server-sent events, incremental parsing, and they care about perceived performance. It's also technically non-trivial — you're parsing partial JSON from a stream, which requires a custom incremental parser.

### Current Flow (blocking)

```
User clicks category
  → 15-20 second spinner
  → All 5 articles appear at once
```

### New Flow (streaming)

```
User clicks category
  → Skeleton card #1 visible immediately
  → ~3s: First article card materializes (fade-slide-in)
  → ~5s: Second article
  → ~7s: Third article
  → ~10s: Fourth article
  → ~12s: Fifth article
  → Each card animates in individually
```

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Client (EventSource)                                        │
│                                                              │
│  const source = new EventSource('/api/news/stream?cat=tech') │
│                                                              │
│  source.onmessage = (e) => {                                 │
│    const article = JSON.parse(e.data);                       │
│    dispatch({ type: 'ADD_ARTICLE', article });               │
│  }                                                           │
│                                                              │
│  source.addEventListener('done', () => source.close());      │
│  source.addEventListener('error', handleError);              │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  API Route: /api/news/stream (SSE)                           │
│                                                              │
│  1. Check cache → if hit, send all articles as rapid events  │
│  2. If miss: call Anthropic streaming API                    │
│  3. Buffer text chunks                                       │
│  4. Incremental JSON parser watches for complete objects:    │
│     - Track bracket depth (string-aware)                     │
│     - When a complete {...} with "title" key is found:       │
│       → normalize it                                         │
│       → send as SSE event: data: {article JSON}\n\n          │
│       → accumulate for cache                                 │
│  5. On stream end: cache all articles, send "done" event     │
└──────────────────────────────────────────────────────────────┘
```

### New API Route: `/api/news/stream`

```typescript
// app/api/news/stream/route.ts
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  // ... validation, rate limiting (same as existing) ...

  // Check cache first
  const cached = cache.get(category);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    // Send cached articles as rapid-fire SSE events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        cached.articles.forEach((article, i) => {
          // Small stagger even for cached results (feels intentional)
          setTimeout(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(article)}\n\n`));
            if (i === cached.articles.length - 1) {
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
              controller.close();
            }
          }, i * 100);
        });
      },
    });
    return new Response(stream, { headers: sseHeaders });
  }

  // Stream from Anthropic
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { /* ... */ },
    body: JSON.stringify({
      /* same as current, but add: */
      stream: true,
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const buffer = new IncrementalArticleParser((article) => {
        // Called each time a complete article object is detected
        const normalized = normalizeArticle(article, category, index++);
        articles.push(normalized);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(normalized)}\n\n`)
        );
      });

      // Read Anthropic's SSE stream
      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse Anthropic SSE format: extract text deltas
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const event = JSON.parse(line.slice(6));
            if (event.type === "content_block_delta"
                && event.delta?.type === "text_delta") {
              buffer.feed(event.delta.text);
            }
          }
        }
      }

      // Flush any remaining buffered content
      buffer.flush();

      // Cache all articles
      cache.set(category, { articles, fetchedAt: Date.now() });

      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Incremental JSON Parser

This is the hard part. The LLM streams text character by character. You need to detect when a complete JSON object (an article) has been emitted — without waiting for the entire array.

```typescript
class IncrementalArticleParser {
  private buffer = "";
  private onArticle: (article: RawArticle) => void;

  constructor(onArticle: (article: RawArticle) => void) {
    this.onArticle = onArticle;
  }

  feed(chunk: string) {
    this.buffer += chunk;
    this.tryExtract();
  }

  private tryExtract() {
    // Find complete JSON objects in the buffer
    // Uses the same string-aware bracket matching from extractJsonArray
    let searchStart = 0;

    while (searchStart < this.buffer.length) {
      const objStart = this.buffer.indexOf("{", searchStart);
      if (objStart === -1) break;

      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = objStart; i < this.buffer.length; i++) {
        const ch = this.buffer[i];
        if (escaped) { escaped = false; continue; }
        if (ch === "\\") { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            // Found a complete object
            const candidate = this.buffer.slice(objStart, i + 1);
            try {
              const obj = JSON.parse(candidate);
              if (obj.title) {
                this.onArticle(obj);
                this.buffer = this.buffer.slice(i + 1);
                searchStart = 0; // restart search in remaining buffer
                return this.tryExtract(); // recurse for multiple objects
              }
            } catch {
              // Not valid JSON yet, keep going
            }
            searchStart = i + 1;
            break;
          }
        }
      }

      // If we got here without finding a closing brace, wait for more data
      if (searchStart <= objStart) break;
    }
  }

  flush() {
    // Try one last extraction with whatever's in the buffer
    this.tryExtract();
  }
}
```

### Client-Side Hook Changes

```typescript
// New hook: useStreamingNews (replaces useNewsLoader for stream-enabled categories)
function useStreamingNews() {
  const [articles, setArticles] = useState<ArticleCache>({});
  const [streaming, setStreaming] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const loadCategory = useCallback((category: CategoryId) => {
    // Close any existing stream
    sourceRef.current?.close();

    setStreaming(true);
    setArticles(prev => ({ ...prev, [category]: [] }));

    const source = new EventSource(`/api/news/stream?category=${category}`);
    sourceRef.current = source;

    source.onmessage = (event) => {
      const article: Article = JSON.parse(event.data);
      setArticles(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), article],
      }));
    };

    source.addEventListener("done", () => {
      setStreaming(false);
      source.close();
    });

    source.onerror = () => {
      setStreaming(false);
      source.close();
    };
  }, []);

  return { articles, streaming, loadCategory };
}
```

### Animation

Each card gets a staggered `animation-delay` based on its index (already in `ArticleCard.tsx`), but now the index is live — the first card appears at index 0 with 0ms delay, the second at 60ms, etc. The `animate-fade-slide-in` keyframe already exists. No CSS changes needed.

### Fallback

Keep the existing `/api/news` (non-streaming) route as a fallback. If EventSource fails (corporate proxies, old browsers), fall back to the blocking fetch. Feature-detect with:

```typescript
const supportsSSE = typeof EventSource !== "undefined";
```

### Tests

```
- IncrementalArticleParser: partial object → no emit
- IncrementalArticleParser: complete object → emits
- IncrementalArticleParser: two objects in one chunk → emits both
- IncrementalArticleParser: object split across chunks → emits on completion
- IncrementalArticleParser: nested braces in strings → handles correctly
- SSE route: cached articles → rapid-fire events
- SSE route: stream interruption → partial results still usable
- Client: EventSource error → falls back to blocking fetch
```

### Implementation Order

1. Build `IncrementalArticleParser` class with tests (pure logic, no network)
2. Build `/api/news/stream` route
3. Build `useStreamingNews` hook
4. Wire into `NewsAggregator` — swap loading state for streaming state
5. Test with real Anthropic API
6. Add EventSource fallback detection

**Estimated effort:** 8-10 hours

---

## Feature 3: Cross-Source Story Threading

### What it is

When Reuters, BBC, and AP all cover the same event, Sift groups them into a single "story" with a synthesized overview and a "Perspectives" toggle showing how each outlet framed it. This is the LangGraph centerpiece — parallel search, entity extraction, merge, and compare.

### Why it matters for the portfolio

This is the feature that demonstrates multi-step AI orchestration. A hiring manager sees: parallel API calls, entity resolution, LLM-as-judge for similarity scoring, a graph-based workflow (LangGraph), and a genuinely useful product feature that no major aggregator does well. This is the one you demo in an interview.

### User Experience

```
Default view: Article cards (as today)

When 2+ articles cover the same event:
┌─────────────────────────────────────────────────────┐
│  📰 Story: EU Announces New AI Regulation Framework │
│  3 sources · Updated 2h ago                         │
│                                                     │
│  [Synthesized Summary]                              │
│  The European Union has proposed comprehensive AI    │
│  legislation that would require...                   │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Reuters │ │  BBC    │ │  AP     │               │
│  │ Neutral │ │ Impact  │ │ Detail  │               │
│  │ framing │ │ framing │ │ framing │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│                                                     │
│  ▾ Show individual articles                         │
└─────────────────────────────────────────────────────┘
```

Clicking "Show individual articles" expands to show each outlet's article card with a highlighted "framing note" — e.g., "Reuters focuses on regulatory timeline. BBC emphasizes impact on UK tech companies."

### Architecture: LangGraph Workflow

This is where the Python FastAPI service comes in. The Next.js app calls it for story threading. The workflow is a directed graph:

```
                    ┌──────────────┐
                    │  User picks  │
                    │  category    │
                    │              │
                    └──────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Node 1: PARALLEL      │
              │  SEARCH                │
              │                        │
              │  Search 3-5 queries    │
              │  simultaneously via    │
              │  Anthropic web_search  │
              │                        │
              │  Output: 15-25 raw     │
              │  article references    │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Node 2: ENTITY        │
              │  EXTRACTION            │
              │                        │
              │  For each article:     │
              │  - Extract key entities│
              │  - Event description   │
              │  - People, orgs, dates │
              │                        │
              │  Output: Article[]     │
              │  with entity metadata  │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Node 3: CLUSTERING    │
              │                        │
              │  LLM-as-judge:         │
              │  "Are these two        │
              │  articles about the    │
              │  same event?"          │
              │                        │
              │  Group into story      │
              │  clusters based on     │
              │  entity overlap +      │
              │  semantic similarity   │
              │                        │
              │  Output: StoryCluster[]│
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Node 4: SYNTHESIS     │
              │                        │
              │  For each cluster:     │
              │  - Merged summary      │
              │  - Framing analysis    │
              │    per source          │
              │  - "Why this matters"  │
              │    one-liner           │
              │                        │
              │  Output: Story[]       │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Node 5: RANK &        │
              │  FORMAT                │
              │                        │
              │  Sort stories by       │
              │  recency + importance  │
              │  Format for API        │
              │  response              │
              └────────────────────────┘
```

### Data Model

```typescript
// A "Story" is a group of related articles with synthesis
interface Story {
  id: string;
  headline: string;           // AI-generated unified headline
  synthesizedSummary: string; // Merged summary across all sources
  whyItMatters: string;       // One-line contextual explainer
  sourceCount: number;
  updatedAt: string;
  perspectives: Perspective[];
  articles: Article[];        // The individual articles in this story
}

interface Perspective {
  sourceName: string;
  sourceUrl: string;
  framingNote: string;        // "Reuters focuses on regulatory timeline"
  tone: "neutral" | "critical" | "supportive" | "analytical";
}

// The API response now includes both standalone articles and stories
interface NewsStreamResponse {
  stories: Story[];           // Grouped multi-source items
  articles: Article[];        // Standalone single-source items
}
```

### FastAPI Service (Python)

```
sift-ai/
├── app/
│   ├── main.py              # FastAPI app
│   ├── graph.py             # LangGraph workflow definition
│   ├── nodes/
│   │   ├── search.py        # Parallel search node
│   │   ├── extract.py       # Entity extraction node
│   │   ├── cluster.py       # Story clustering node
│   │   ├── synthesize.py    # Summary + framing node
│   │   └── rank.py          # Ranking + formatting node
│   ├── models.py            # Pydantic models
│   └── config.py            # Settings
├── tests/
│   ├── test_graph.py
│   ├── test_clustering.py
│   └── fixtures/            # Saved API responses for testing
├── requirements.txt
├── Dockerfile
└── README.md
```

### Key Prompt: Framing Analysis

```
You are analyzing how different news outlets covered the same event.

Event: "${story.headline}"

Source 1 (${articles[0].sourceName}): "${articles[0].summary}"
Source 2 (${articles[1].sourceName}): "${articles[1].summary}"
Source 3 (${articles[2].sourceName}): "${articles[2].summary}"

For each source, provide:
1. framingNote: One sentence on what angle this outlet emphasizes
   (e.g., "Focuses on economic impact" or "Leads with political reaction")
2. tone: One of "neutral", "critical", "supportive", "analytical"

Also provide:
3. synthesizedSummary: A balanced 2-3 sentence summary that incorporates
   the most important facts from all sources
4. whyItMatters: One sentence explaining why a general reader should care

Respond as JSON.
```

### Integration with Next.js

The Next.js app calls the FastAPI service as an upstream:

```typescript
// In /api/news/route.ts or /api/news/stream/route.ts
const SIFT_AI_URL = process.env.SIFT_AI_URL || "http://localhost:8000";

// For categories that support threading:
const response = await fetch(`${SIFT_AI_URL}/api/v1/stories`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ category, queries: CATEGORY_QUERIES[category] }),
});
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `StoryCard.tsx` | The grouped story card (replaces ArticleCard when clustered) |
| `PerspectiveToggle.tsx` | Tab-like toggle between source framings |
| `FramingBadge.tsx` | Small badge showing tone: "Neutral" / "Critical" / etc. |
| `StoryExpander.tsx` | "Show individual articles" accordion |

### Phased Rollout

**Phase 1 (MVP — no FastAPI needed):**
Do the clustering and synthesis in the existing Next.js API route with a second Claude call. After fetching articles for a category, make a second call:

```
"Here are 5 news articles. Group any that cover the same event.
For each group, provide a merged summary and note how each source
framed it differently. Return as JSON."
```

This gets the feature working without the Python service. Less sophisticated but shippable.

**Phase 2 (LangGraph):**
Move the logic to the Python FastAPI service with proper graph orchestration, parallel search, and entity extraction. The Next.js route becomes a thin proxy.

### Implementation Order

1. **Phase 1 MVP:** Add second Claude call in existing route for clustering
2. Build `Story` type and modify API response shape
3. Build `StoryCard` component with perspective toggle
4. Wire into `NewsAggregator` — render stories vs. standalone articles
5. Test with categories that typically have multi-source coverage (Top, World)
6. **Phase 2:** Scaffold FastAPI service with LangGraph
7. Move clustering logic to graph nodes
8. Add entity extraction for better clustering accuracy
9. Deploy FastAPI service (Railway/Fly.io alongside Vercel)

**Estimated effort:** Phase 1: 6-8 hours. Phase 2: 15-20 hours.

---

## Tier 2: Product Depth (Makes Users Come Back)

These turn Sift from a tool you try once into something you open every morning.

---

## Feature 4: "Why This Matters" Context Lines

### What it is

Every article gets a one-line explainer beneath the summary: *"This matters because FPL's parent company NextEra is the largest clean energy producer in the US."* No aggregator does this — connecting a headline to why a specific reader should care. Requires a second LLM pass with user context.

### Why it matters for the portfolio

Shows you understand that information without context is noise. Also demonstrates chained LLM calls where the output of one call (article summaries) becomes the input for a richer second pass. If the user has custom topics, the "why it matters" line can reference their interests — that's personalization at the intelligence layer, not the UI layer.

### Architecture

```
Article summaries arrive (from Feature 2 stream or cache)
  │
  ▼
Second Claude call (batched, all 5 articles at once):
  │
  │  System: "You help readers understand why news matters.
  │           The reader is interested in: ${userTopics}"
  │
  │  User: "For each article, write ONE sentence explaining
  │         why this story matters to a general reader.
  │         If the reader has specific interests, connect
  │         the story to those interests where relevant.
  │         Return as JSON: [{id, whyItMatters}]"
  │
  ▼
Client merges whyItMatters into existing article objects
  → Renders as a subtle italic line below the summary
```

### Data Model Changes

```typescript
// Extend Article
interface Article {
  // ... existing fields ...
  whyItMatters?: string;  // "This matters because..."
}
```

### Prompt Design

The prompt needs two modes — generic (no user context) and personalized (user has custom topics):

```
// Generic mode
"For each article below, write ONE sentence (max 20 words) starting with
'This matters because...' that explains why a general reader should care.
Focus on real-world impact, not just restating the headline."

// Personalized mode
"The reader tracks these topics: ${customTopics.map(t => t.rawInput).join(', ')}.
For each article below, write ONE sentence (max 20 words) explaining why
this story matters. Where relevant, connect it to the reader's interests.
If no connection exists, explain general significance."
```

### UI

The line appears below the summary in `ArticleCard.tsx`, styled distinctly:

```tsx
{article.whyItMatters && (
  <p className="text-[13px] italic text-[var(--accent)] opacity-80 mt-1">
    {article.whyItMatters}
  </p>
)}
```

### Integration with Streaming (Feature 2)

The "why it matters" lines come as a *second pass* after all articles have streamed in. The flow is:

1. Articles stream in one by one (Feature 2)
2. Once all articles are received, fire the "why it matters" batch call
3. As the response arrives, update each card with its context line (subtle fade-in animation)

This creates a nice two-phase loading effect: cards appear, then a moment later each one gets "smarter" with its context line.

### Edge Cases

- If the second call fails, articles still render fine — whyItMatters is optional
- Rate limit the second call: only fire if user has been on the page > 2 seconds (avoid wasting calls on quick category-switching)
- Cache the whyItMatters alongside articles so repeat views don't re-call

**Estimated effort:** 3-4 hours (leverages existing article pipeline)

---

## Feature 5: Morning Briefing

### What it is

A single AI-generated paragraph that synthesizes the top 3 things across all categories: *"Here's what you need to know this morning: The Fed held rates steady for the fourth consecutive meeting, signaling patience on cuts. A 7.1 magnitude earthquake struck central Japan with tsunami warnings issued across the Pacific. And OpenAI announced a $10B infrastructure partnership with Oracle."* One screen, 30 seconds, you're caught up.

### Why it matters for the portfolio

This is a product feature, not a technical one. It demonstrates that you think about *user workflows*, not just data pipelines. The morning briefing is the thing that makes someone set Sift as their homepage. It also shows you can prompt an LLM to synthesize across domains — harder than summarizing within one.

### User Experience

```
┌─────────────────────────────────────────────────────────────┐
│  ☀ Good morning                          March 22, 2026     │
│                                                             │
│  Here's what you need to know today:                        │
│                                                             │
│  The Fed held rates steady for the fourth consecutive       │
│  meeting, signaling patience on cuts despite cooling        │
│  inflation data. A 7.1 magnitude earthquake struck          │
│  central Japan with tsunami warnings issued across the      │
│  Pacific. And OpenAI announced a $10B infrastructure        │
│  partnership with Oracle, the largest AI compute deal       │
│  to date.                                                   │
│                                                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Fed ↗   │ │ Japan ↗  │ │ OpenAI ↗ │  ← linked to        │
│  └─────────┘ └──────────┘ └──────────┘    source articles   │
│                                                             │
│  Updated 6:00 AM · Tap any topic to read more               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture

```
Cron or on-demand trigger (first visit of the day)
  │
  ▼
Fetch top 2-3 articles from each of 3-4 categories
  (use cached results if fresh, otherwise fetch)
  │
  ▼
Single Claude call:
  │
  │  "You are writing a morning news briefing. Synthesize
  │   the most important stories into ONE paragraph of 3-4
  │   sentences. Be concise. Each sentence covers a different
  │   story from a different domain. Write in a confident,
  │   editorial voice — think Bloomberg's morning brief.
  │
  │   Stories:
  │   [top articles across categories]
  │
  │   Return JSON:
  │   {
  │     paragraph: string,
  │     stories: [{ label, articleId, sourceUrl }]
  │   }"
  │
  ▼
Render as hero section above the category grid
```

### API Route: `/api/briefing`

```typescript
// GET /api/briefing
// Returns the morning briefing, cached for 2 hours

interface BriefingResponse {
  paragraph: string;
  stories: {
    label: string;      // "Fed rates" — short chip label
    articleId: string;   // links to full article
    sourceUrl: string;   // external link
  }[];
  generatedAt: string;
  greeting: string;     // "Good morning" / "Good afternoon" / "Good evening"
}
```

### UI Component: `MorningBriefing.tsx`

Rendered at the top of `NewsAggregator.tsx` above the article grid. Shows only on first load or when explicitly toggled. Collapsible after reading.

### Personalization (ties into Feature 1)

If the user has custom topics, the briefing prompt includes them:

```
"The reader is particularly interested in: ${customTopics}.
If any of today's top stories connect to these interests,
prioritize those and note the connection."
```

### Future Extensions

- **Push notification:** "Your Sift briefing is ready" (requires service worker — ties into Feature 9)
- **Email digest:** Daily email with the briefing paragraph (requires email service)
- **Audio briefing:** TTS of the paragraph (browser SpeechSynthesis API for free, ElevenLabs for quality)

**Estimated effort:** 4-5 hours

---

## Feature 6: Trend Detection

### What it is

Track topics over time. If "energy prices" appears in 4 out of 5 days' results, surface it as a trend with a mini-timeline. If a topic spikes from 1 mention to 5, flag it as "emerging." Requires persistence (database) and temporal analysis.

### Why it matters for the portfolio

Demonstrates that you understand data over time, not just data at a point in time. Shows database design, temporal queries, and a meaningful use of persistence. Also shows you think about the *editorial layer* — what makes a news app feel intelligent rather than reactive.

### User Experience

```
Trend bar (above article grid, below briefing):
┌─────────────────────────────────────────────────────────────┐
│  📈 Trending this week                                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AI regulation│  │ Fed rates    │  │ Offshore wind│      │
│  │ ████████░░░  │  │ ██████░░░░░ │  │ ████░░░░░░░ │      │
│  │ 12 mentions  │  │ 8 mentions   │  │ 5 mentions  │      │
│  │ ↑ 3 from     │  │ Steady       │  │ 🆕 Emerging │      │
│  │   last week  │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Architecture

```
Every time articles are fetched:
  │
  ▼
Extract key entities/topics from each article
  (LLM call or lightweight NER)
  │
  ▼
Store in persistence layer:
  { topic: "AI regulation", date: "2026-03-22", count: 3, category: "technology" }
  │
  ▼
On page load, query last 7 days:
  GROUP BY topic, ORDER BY total mentions DESC
  │
  ▼
Compare to previous 7 days for trend direction (↑ ↓ →)
  │
  ▼
Surface top 3-5 trends in UI
```

### Persistence Options

| Option | Pros | Cons | Best for |
|--------|------|------|----------|
| Vercel KV (Redis) | Zero config on Vercel, fast | Limited query flexibility | MVP |
| Vercel Postgres | Real SQL, temporal queries easy | Slightly more setup | Production |
| Supabase | Free tier, real Postgres, auth later | External dependency | If you want accounts |
| SQLite via Turso | Edge-compatible, SQL, cheap | Less known | If you want to show range |

Recommended: **Vercel Postgres** for the portfolio story. It shows you can design a schema and write real queries, not just key-value.

### Schema

```sql
CREATE TABLE topic_mentions (
  id          SERIAL PRIMARY KEY,
  topic       TEXT NOT NULL,           -- "AI regulation"
  category    TEXT NOT NULL,           -- "technology"
  article_id  TEXT NOT NULL,           -- links back to article
  mentioned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mentions_topic_date ON topic_mentions (topic, mentioned_at);
CREATE INDEX idx_mentions_date ON topic_mentions (mentioned_at);

-- Query: trending topics this week vs last week
SELECT
  topic,
  COUNT(*) FILTER (WHERE mentioned_at >= CURRENT_DATE - 7) as this_week,
  COUNT(*) FILTER (WHERE mentioned_at >= CURRENT_DATE - 14
                     AND mentioned_at < CURRENT_DATE - 7) as last_week
FROM topic_mentions
WHERE mentioned_at >= CURRENT_DATE - 14
GROUP BY topic
HAVING COUNT(*) FILTER (WHERE mentioned_at >= CURRENT_DATE - 7) >= 3
ORDER BY this_week DESC
LIMIT 5;
```

### Topic Extraction Prompt

```
"Extract 2-3 key topics from this article as short labels (2-4 words each).
Topics should be specific enough to track over time.
Good: 'AI regulation', 'Fed interest rates', 'offshore wind'
Bad: 'news', 'update', 'report'

Article: ${article.title} — ${article.summary}

Return as JSON: { topics: string[] }"
```

### UI Component: `TrendBar.tsx`

A horizontal scrollable row of trend chips. Each chip shows: topic label, mini spark-line (7 dots for 7 days), mention count, trend direction.

### Implementation Order

1. Set up Vercel Postgres (or chosen DB)
2. Create schema + migration
3. Add topic extraction to article fetch pipeline (piggyback on existing API call)
4. Build `/api/trends` route
5. Build `TrendBar.tsx` component
6. Wire into `NewsAggregator` above article grid

**Estimated effort:** 8-10 hours (includes DB setup)

---

## Tier 3: Technical Showcase (Makes Hiring Managers Dig Deeper)

These are features that might not be the first thing a user notices, but they're the ones a technical interviewer asks about. Each one opens a conversation about a specific area of depth.

---

## Feature 7: Semantic Search Across Past Articles

### What it is

Store articles in a vector database. Let users search "what happened with the Fed last week" and get results ranked by semantic meaning, not keywords. The user types natural language, the query gets embedded, and cosine similarity finds the most relevant articles from the past — even if the exact words don't match.

### Why it matters for the portfolio

RAG (Retrieval-Augmented Generation) is the most in-demand AI pattern in the industry right now. This feature demonstrates: vector embeddings, similarity search, a real vector database, and the full retrieval pipeline. It's the feature a hiring manager at an AI company will ask about in an interview.

### Architecture

```
User types: "what happened with the Fed last week"
  │
  ▼
┌──────────────────────────────────────┐
│  /api/search                         │
│                                      │
│  1. Embed query via Anthropic or     │
│     OpenAI embeddings API            │
│  2. Query vector DB for top 10       │
│     similar articles                 │
│  3. Optional: pass results + query   │
│     to Claude for a synthesized      │
│     answer with citations            │
│  4. Return ranked results            │
└──────────────────────────────────────┘

On article ingest (runs alongside normal fetch):
  │
  ▼
┌──────────────────────────────────────┐
│  Embedding pipeline                  │
│                                      │
│  1. Concatenate title + summary      │
│  2. Generate embedding vector        │
│  3. Upsert to vector DB with        │
│     metadata (date, category,        │
│     source, articleId)               │
└──────────────────────────────────────┘
```

### Vector DB Options

| Option | Pros | Cons | Best for |
|--------|------|------|----------|
| Pinecone | Purpose-built, free tier, hosted | External dependency | Cleanest portfolio signal |
| pgvector (Supabase/Vercel Postgres) | Uses your existing DB, SQL interface | Slightly less performant at scale | If already using Postgres |
| ChromaDB | Open source, local dev friendly | Needs separate hosting | If you want to show OSS stack |

Recommended: **pgvector on Vercel Postgres** if you're already using it for trends (Feature 6), otherwise **Pinecone** for the name recognition on a resume.

### Data Model

```typescript
interface SearchResult {
  article: Article;
  score: number;          // cosine similarity 0-1
  highlight?: string;     // AI-generated relevance explanation
}

interface SearchResponse {
  results: SearchResult[];
  synthesizedAnswer?: string;  // Optional RAG answer
  query: string;
  totalResults: number;
}
```

### Embedding Strategy

Embed `title + " — " + summary` as a single string. This captures both the topic and the nuance. Use Anthropic's Voyage embeddings or OpenAI's `text-embedding-3-small` (cheaper, 1536 dimensions).

### UI

Search bar in the header (replaces or sits alongside category pills):

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 "what happened with the Fed last week"                  │
│                                                             │
│  AI Answer:                                                 │
│  "The Federal Reserve held rates steady at their March      │
│   meeting, citing persistent inflation concerns..."         │
│                                                             │
│  Based on 4 articles:                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Article 1   │ │ Article 2   │ │ Article 3   │           │
│  │ 94% match   │ │ 87% match   │ │ 82% match   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Order

1. Choose vector DB, set up account/schema
2. Add embedding pipeline to article ingest
3. Build `/api/search` route
4. Build search UI (input + results)
5. Add optional RAG synthesis (pass results to Claude for an answer)
6. Backfill: embed existing cached articles

**Estimated effort:** 10-12 hours

---

## Feature 8: Multi-Language Support

### What it is

"Show me what French media is saying about the EU energy policy." Sift searches in French, summarizes in English. One prompt change, massive product impact. Users can also ask for summaries in their preferred language.

### Why it matters for the portfolio

Shows you understand localization at the AI layer — not just i18n string tables. Also demonstrates that Claude is multilingual out of the box, and you know how to leverage that. A hiring manager at a global company immediately sees the value.

### User Experience

```
User sets language preference (or asks per-query):
  "Search in: French"
  "Summarize in: English"

  Result:
  ┌─────────────────────────────────────────────────────────┐
  │  🇫🇷 Le Monde · Translated from French                  │
  │                                                         │
  │  EU Energy Ministers Clash Over 2030 Targets             │
  │  European energy ministers failed to reach consensus     │
  │  on revised 2030 renewable targets, with France and     │
  │  Germany taking opposing positions on nuclear...         │
  │                                                         │
  │  Original: "Les ministres de l'énergie de l'UE..."     │
  │  ┌────────────────────────┐                             │
  │  │ View original article │                             │
  │  └────────────────────────┘                             │
  └─────────────────────────────────────────────────────────┘
```

### Architecture

The change is almost entirely in prompt engineering:

```typescript
// Modified search query generation
function buildUserPrompt(query: string, searchLang?: string, summaryLang?: string): string {
  const langInstruction = searchLang
    ? `Search for news in ${searchLang}. `
    : "";
  const summaryInstruction = summaryLang && summaryLang !== "English"
    ? `Write all summaries in ${summaryLang}.`
    : "Write all summaries in English.";

  return `${langInstruction}Please search for the latest news about: ${query}

After searching, summarize the top 5 stories you found.
${summaryInstruction}
If the original article is in a different language than the summary,
include the original headline in the "original_title" field.

Format as JSON array: [{ title, summary, source_url, source_name,
published_date, image_url, original_title, source_language }]`;
}
```

### Data Model Changes

```typescript
interface Article {
  // ... existing fields ...
  originalTitle?: string;     // "Les ministres de l'énergie de l'UE..."
  sourceLanguage?: string;    // "fr"
}
```

### UI Changes

- Language selector in settings or per-search
- Flag emoji + "Translated from French" badge on cards
- "View original" link on translated articles
- Collapsible original-language title

### Supported Languages (MVP)

Focus on languages with strong news ecosystems: English, French, German, Spanish, Portuguese, Japanese, Mandarin, Arabic. Claude handles all of these natively.

### Implementation Order

1. Add language fields to Article type
2. Modify prompt builder to accept language params
3. Add language selector UI (settings dropdown)
4. Add "Translated from" badge to ArticleCard
5. Test with 3-4 language combinations

**Estimated effort:** 4-5 hours (mostly prompt engineering + light UI)

---

## Feature 9: Offline Reading Queue (PWA)

### What it is

Service worker caches bookmarked articles for offline access. Install prompt for "Add to Home Screen." Sift becomes a Progressive Web App that works on the subway, on a plane, or anywhere without signal. Bookmarked articles are available offline, and new articles sync when connection returns.

### Why it matters for the portfolio

Shows you think about the full user experience, not just the happy path. Service workers, cache strategies, and PWA manifests are bread-and-butter web platform skills that many developers skip. It signals maturity — you've shipped things that need to work in the real world.

### Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Service Worker (sw.js)                                   │
│                                                           │
│  Install event:                                           │
│    Cache app shell (HTML, CSS, JS, fonts)                 │
│                                                           │
│  Fetch event:                                             │
│    ┌─ Is it an API call (/api/news)?                      │
│    │   → Network-first, cache fallback                    │
│    │   → Cache successful responses                       │
│    │                                                      │
│    ├─ Is it a bookmarked article?                         │
│    │   → Cache-first (already saved)                      │
│    │                                                      │
│    └─ Is it an app shell asset?                           │
│        → Cache-first, network fallback                    │
│                                                           │
│  Background sync:                                         │
│    When connection returns, re-fetch stale categories     │
└───────────────────────────────────────────────────────────┘
```

### PWA Manifest

```json
// public/manifest.json
{
  "name": "Sift — AI News",
  "short_name": "Sift",
  "description": "AI-curated news that matters",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Bookmark → Offline Cache Flow

```typescript
// When user bookmarks an article:
function bookmarkArticle(article: Article) {
  // 1. Save to localStorage (existing)
  toggleBookmark(article.id);

  // 2. Cache the article data for offline access
  if ('caches' in window) {
    caches.open('sift-bookmarks-v1').then(cache => {
      cache.put(
        `/api/offline/article/${article.id}`,
        new Response(JSON.stringify(article), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  }
}
```

### Offline Indicator

When the app detects no connection, show a subtle banner:

```
┌─────────────────────────────────────────────────────────────┐
│  📴 You're offline · Showing saved articles                 │
└─────────────────────────────────────────────────────────────┘
```

### Next.js PWA Setup

Use `next-pwa` or `@serwist/next` for service worker integration with the App Router.

### Implementation Order

1. Add PWA manifest + icons
2. Configure service worker with app shell caching
3. Add bookmark → cache bridge
4. Add offline detection + UI indicator
5. Add "Install Sift" prompt (beforeinstallprompt event)
6. Test on mobile with airplane mode

**Estimated effort:** 6-8 hours

---

## Feature 10: Analytics Dashboard

### What it is

Track your own reading habits — which categories you read most, reading time per week, topics trending in your bookmarks, your "reading streak." A recharts-powered page that makes your own data interesting and keeps you coming back.

### Why it matters for the portfolio

Data visualization with real user data. Shows you can build a full product loop: consume content → track engagement → surface insights → drive re-engagement. Also demonstrates charting libraries, local data aggregation, and thoughtful UI for data display.

### User Experience

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Your Reading Stats                                      │
│                                                             │
│  This week: 23 articles read · 45 min estimated reading     │
│  🔥 5-day streak                                            │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │  Category Breakdown          (pie chart)│                │
│  │  ● Technology  38%                      │                │
│  │  ● Business    25%                      │                │
│  │  ● World       18%                      │                │
│  │  ● Science     12%                      │                │
│  │  ● Health       7%                      │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │  Articles Read / Day     (bar chart)    │                │
│  │  Mon ████████  8                        │                │
│  │  Tue ████  4                            │                │
│  │  Wed ██████  6                          │                │
│  │  Thu ███  3                             │                │
│  │  Fri ██  2                              │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │  Your Top Topics This Month             │                │
│  │  1. AI regulation (7 articles)          │                │
│  │  2. Federal Reserve (5 articles)        │                │
│  │  3. Clean energy (4 articles)           │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Data Collection

Track events in localStorage (no server needed for MVP):

```typescript
interface ReadEvent {
  articleId: string;
  category: CategoryId;
  timestamp: string;       // ISO date
  estimatedReadTime: number;
  topics?: string[];       // from entity extraction (Feature 6)
}

// Store in localStorage
const STORAGE_KEYS = {
  // ... existing ...
  readHistory: "sift-read-history",
};
```

### When to Record

Record a "read" event when the user clicks an article (opens external link). This is a proxy for actual reading — not perfect, but honest.

```typescript
// In ArticleCard.tsx onClick handler
onClick={() => {
  recordReadEvent(article);  // NEW
  window.open(article.sourceUrl, "_blank", "noopener");
}}
```

### Charts (recharts)

Already available in the React artifact environment. Use:
- `PieChart` for category breakdown
- `BarChart` for daily reading volume
- `LineChart` for reading streak / trend over time

### UI Route

Add as a new page: `/stats` or as a slide-out panel from a "📊" button in the header.

### Privacy Note

All data stays in localStorage — no server tracking. This is a feature to highlight: "Your reading data never leaves your device."

### Implementation Order

1. Add read event tracking to article click handler
2. Build localStorage aggregation utilities
3. Build `/stats` page with recharts
4. Add navigation to stats from header
5. Add streak tracking logic
6. Polish with category colors matching the existing palette

**Estimated effort:** 6-8 hours

---

## Priority & Sequencing Summary

| Tier | # | Feature | Effort | Depends On |
|------|---|---------|--------|------------|
| **1** | 1 | Personalized Custom Topics | 6-8h | — |
| **1** | 2 | Streaming Article Cards (SSE) | 8-10h | — |
| **1** | 3 | Cross-Source Story Threading | 6-8h (P1) / 15-20h (P2) | — |
| **2** | 4 | "Why This Matters" Context | 3-4h | Feature 2 (streaming) |
| **2** | 5 | Morning Briefing | 4-5h | — |
| **2** | 6 | Trend Detection | 8-10h | Database setup |
| **3** | 7 | Semantic Search (RAG) | 10-12h | Vector DB + Feature 6 DB |
| **3** | 8 | Multi-Language Support | 4-5h | — |
| **3** | 9 | Offline Reading Queue (PWA) | 6-8h | — |
| **3** | 10 | Analytics Dashboard | 6-8h | — |

### Recommended Build Order

```
Weeks 1-3:  Tier 1 features + Sift rebrand (as previously planned)

Week 4: Depth
  Day 1-2:  Feature 4 — "Why This Matters" (quick win, enhances every card)
  Day 3-4:  Feature 5 — Morning Briefing (high product impact, moderate effort)
  Day 5:    Feature 8 — Multi-Language (prompt-only change, big wow factor)

Week 5: Persistence & Intelligence
  Day 1-2:  Database setup (Vercel Postgres)
  Day 3-4:  Feature 6 — Trend Detection
  Day 5:    Feature 10 — Analytics Dashboard (recharts page)

Week 6: Advanced
  Day 1-3:  Feature 7 — Semantic Search / RAG
  Day 4:    Feature 9 — PWA / Offline
  Day 5:    Feature 3 Phase 2 — LangGraph migration

Week 7: Portfolio
  Day 1-2:  STAR-format write-up
  Day 3:    Landing page
  Day 4-5:  Final polish, Lighthouse, deploy production
```

---

## Branding: Every Choice Should Feel Deliberate

Right now Sift looks like a developer built it. It's clean, it works, but it doesn't have an identity. What separates "nice side project" from "this person understands brand" is that every choice — visual, verbal, interactive — feels like it came from a point of view. Branding isn't a logo. It's every choice feeling deliberate.

The specs below are as important as the feature specs above. They're what make a hiring manager think "this person could own a product," not just "this person can code."

---

### B1: Landing Page That Tells a Story

**What it is:** Before someone ever sees the app, they hit a page that says what Sift is, who it's for, and why it exists. Not a README — a real marketing page with a headline, a value prop, a screenshot, and a CTA.

**Why it matters:** Right now the app just... starts. There's no positioning, no narrative, no reason to care. A landing page frames the entire experience before the user touches it. It also shows a hiring manager that you think about acquisition, not just features.

**Page Structure:**

```
Route: / (unauthenticated or first-visit)
Route: /app (the actual news reader)

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ◆ Sift                                          [Try Sift →]  │
│                                                                 │
│                                                                 │
│           Your morning news, read by AI.                        │
│                                                                 │
│    Sift searches hundreds of sources, reads them all,           │
│    and gives you the five stories that matter —                  │
│    in 30 seconds.                                               │
│                                                                 │
│                  [ Start reading →]                              │
│                                                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   [Animated screenshot / demo of cards streaming in]      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                                                 │
│  ── How it works ───────────────────────────────────────────    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  🔍 Search   │  │  🤖 Read     │  │  📰 Deliver  │          │
│  │              │  │              │  │              │          │
│  │  AI searches │  │  Claude      │  │  Five cards, │          │
│  │  hundreds of │  │  reads every │  │  thirty      │          │
│  │  sources in  │  │  result and  │  │  seconds,    │          │
│  │  real time   │  │  separates   │  │  you're      │          │
│  │              │  │  signal from │  │  caught up   │          │
│  │              │  │  noise       │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│                                                                 │
│  ── What makes Sift different ──────────────────────────────    │
│                                                                 │
│  ◆ Your topics, not ours                                        │
│    Track "Florida utilities" or "Series A funding" —            │
│    Sift builds a custom feed for whatever you care about.       │
│                                                                 │
│  ◆ One story, many sources                                      │
│    When Reuters, BBC, and AP cover the same event,              │
│    Sift groups them and shows you how each outlet framed it.    │
│                                                                 │
│  ◆ Context, not just headlines                                  │
│    Every article gets a "why this matters" line connecting       │
│    the headline to what you actually need to know.              │
│                                                                 │
│                                                                 │
│  ── Built with ─────────────────────────────────────────────    │
│                                                                 │
│  Next.js · TypeScript · Claude · Tailwind                       │
│  [View on GitHub →]                                             │
│                                                                 │
│                                                                 │
│  ◆ Sift — Intelligence, distilled.                              │
│  Built by [Your Name]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key copy principles:**
- Lead with the user's problem (too much news, too little time), not the tech
- The headline should work as a tweet: "Your morning news, read by AI."
- The subhead should make the mechanism clear in one sentence
- Feature descriptions should start with the user benefit, not the implementation
- The "Built with" section is for hiring managers — keep it small and at the bottom

**Implementation:**
- `app/page.tsx` → landing page (new)
- `app/app/page.tsx` → the actual news reader (moved)
- Or: conditional render in `page.tsx` based on a "has visited before" flag
- Use Framer Motion or CSS animations for the hero demo
- The streaming demo can be a pre-recorded animation or a live mini-demo

**Estimated effort:** 4-6 hours

---

### B2: Name System & Visual Identity

**The problem:** There's no logo, no wordmark, no favicon, no consistent visual language. The app is a wall of text with an accent color.

**The mark:** The ◆ diamond you're already using as the Top Stories icon becomes the brand mark. It's geometric, it works at every size, and it implies precision — which is what Sift does. It's a sifted, refined point.

**The system:**

```
┌─────────────────────────────────────────────────────────────┐
│  Logo Lockup Variants                                       │
│                                                             │
│  Full:     ◆ Sift                                           │
│            (mark + wordmark, Playfair Display Bold)          │
│                                                             │
│  Compact:  ◆ S                                              │
│            (mark + initial, for tight spaces)                │
│                                                             │
│  Mark:     ◆                                                │
│            (standalone, favicon/app icon)                    │
│                                                             │
│  Wordmark: Sift                                             │
│            (text only, when mark is elsewhere on page)       │
└─────────────────────────────────────────────────────────────┘
```

**Size requirements:**

| Context | Size | Variant |
|---------|------|---------|
| Favicon | 16×16, 32×32 | Mark only (◆) |
| PWA icon | 192×192, 512×512 | Mark only, with background color |
| Header (desktop) | ~28px text | Full lockup (◆ Sift) |
| Header (mobile) | ~24px text | Full lockup (◆ Sift) |
| OG/social card | 1200×630 | Full lockup + tagline |
| Email header | ~200px wide | Full lockup |
| Loading spinner | 48×48 | Mark only, animated rotation |

**Implementation:**
- Create `SiftLogo.tsx` component with `variant` prop: `"full" | "compact" | "mark" | "wordmark"`
- SVG-based so it scales perfectly and inherits theme colors
- The ◆ mark should use `var(--accent)` so it adapts to light/dark mode
- Generate favicon set from the SVG: `/public/favicon.ico`, `/public/icon-192.png`, `/public/icon-512.png`

```tsx
// components/SiftLogo.tsx
interface SiftLogoProps {
  variant?: "full" | "compact" | "mark" | "wordmark";
  size?: number;
}

export default function SiftLogo({ variant = "full", size = 28 }: SiftLogoProps) {
  // SVG mark (diamond)
  const mark = (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="var(--accent)">
      <path d="M12 2L22 12L12 22L2 12Z" />
    </svg>
  );

  if (variant === "mark") return mark;
  if (variant === "wordmark") return (
    <span style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: size }}>
      Sift
    </span>
  );
  // ... full and compact variants
}
```

**Estimated effort:** 2-3 hours

---

### B3: Voice & Tone Guidelines

**The principle:** Every piece of text in the app is a branding opportunity. Right now the copy is functional but generic — it could be any app. After this pass, every string should sound like it came from the same editorial voice: confident, concise, slightly warm, never robotic.

**The voice:** Think Bloomberg meets a smart friend who reads the news for you. Authoritative but approachable. Never cute or jokey. Never stiff or corporate.

**Tone scale:**

```
← Casual ─────────────────────────── Formal →
     ↑
     Sift lives here: conversational authority
     Like a newsroom editor talking to a colleague
```

**Copy audit — every string in the app:**

| Location | Current | Branded |
|----------|---------|---------|
| **Header tagline** | "AI-Curated" | "Intelligence, distilled" |
| **Footer** | "AI-curated news powered by Claude. Articles link to original sources." | "Sift reads hundreds of sources so you don't have to. Every story links to the original." |
| **Error state title** | "Couldn't load articles" | "We hit a snag pulling today's stories" |
| **Error state body** | "Something went wrong." | "Our AI is having a slow morning. Give it another shot — it usually sorts itself out." |
| **Error state button** | "Try Again" | "Try again" (lowercase — less shouty) |
| **Loading (slow)** | "Still searching… this can take up to 30 seconds" | "Still reading through sources… good stories take a moment" |
| **Empty bookmarks title** | "No saved articles yet" | "Nothing saved yet" |
| **Empty bookmarks body** | "Click the star on any article to save it for later" | "Star any article to keep it here. Your reading list, your pace." |
| **Refresh toast** | "Fetching latest stories…" | "Checking for new stories…" |
| **Category: Top Stories** | "Top Stories" | "The Lead" (editorial language) |
| **Briefing greeting** | (doesn't exist) | "Good morning. Here's what matters today." |
| **Streaming status** | (doesn't exist) | "Reading sources…" → "Found 1 story…" → "Found 3 stories…" |
| **Custom topic preview** | (doesn't exist) | "Here's what I'll look for:" (the AI speaking) |
| **Search placeholder** | (doesn't exist) | "What are you looking for?" |
| **404 title** | (doesn't exist) | "This page wandered off" |
| **404 body** | (doesn't exist) | "We looked everywhere — even had the AI search for it. Let's get you back to the stories." |

**Voice rules (for all future copy):**
1. Use "we" for the app, "I" for the AI when it's clearly the AI speaking (e.g., topic preview)
2. Contractions always (we're, don't, it's) — never "do not" or "cannot"
3. No exclamation marks except in genuinely exciting moments (a trend spike, maybe)
4. Periods at the end of sentences, even in buttons if they're full phrases
5. Active voice always: "Sift found 5 stories" not "5 stories were found"
6. Specific > vague: "Reading 200+ sources" not "Searching the web"
7. No jargon in user-facing copy: never say "API," "LLM," "SSE," "cache"

**Implementation:**
- Create `lib/copy.ts` — a single source of truth for all UI strings
- Every component imports copy from this file instead of hardcoding strings
- This also makes future i18n trivial

```typescript
// lib/copy.ts
export const COPY = {
  header: {
    tagline: "Intelligence, distilled",
  },
  footer: {
    main: "Sift reads hundreds of sources so you don't have to. Every story links to the original.",
  },
  error: {
    title: "We hit a snag pulling today's stories",
    body: "Our AI is having a slow morning. Give it another shot — it usually sorts itself out.",
    button: "Try again",
  },
  loading: {
    slow: "Still reading through sources… good stories take a moment",
    refresh: "Checking for new stories…",
    streaming: (count: number) =>
      count === 0 ? "Reading sources…" : `Found ${count} ${count === 1 ? "story" : "stories"}…`,
  },
  bookmarks: {
    emptyTitle: "Nothing saved yet",
    emptyBody: "Star any article to keep it here. Your reading list, your pace.",
  },
  notFound: {
    title: "This page wandered off",
    body: "We looked everywhere — even had the AI search for it. Let's get you back to the stories.",
    button: "Back to Sift",
  },
  search: {
    placeholder: "What are you looking for?",
  },
  briefing: {
    greeting: (hour: number) => {
      if (hour < 12) return "Good morning.";
      if (hour < 17) return "Good afternoon.";
      return "Good evening.";
    },
    intro: "Here's what matters today.",
  },
} as const;
```

**Estimated effort:** 2-3 hours (audit + refactor + write copy)

---

### B4: Color Story with Meaning

**The problem:** The category colors exist but they're arbitrary. There's no explanation, no palette names, no intentionality.

**The solution:** Name the palettes. Tie colors to meaning. Make it feel like a design decision, not a Tailwind default.

**Theme names:**

| Theme | Name | Concept |
|-------|------|---------|
| Light | **Newsprint** | Warm off-white paper tones. Like a quality broadsheet. Not clinical white — the kind of paper that has warmth and texture. |
| Dark | **Late Edition** | Deep ink tones. The late-night newsroom. Dark but not black — there's always warmth in the shadows. |

**Newsprint palette (light mode):**

```css
--bg:             #f5f2ed;     /* Warm paper — not white, not cream */
--card-bg:        #ffffff;     /* Cards are clean white against warm bg */
--text:           #1c1917;     /* Near-black with warm undertone */
--text-secondary: #57534e;     /* Warm gray, not cool */
--text-muted:     #a8a29e;     /* Stone gray */
--border:         #e7e5e4;     /* Barely there — like a fold line */
--accent:         #4338ca;     /* Deep indigo — editorial authority */
--nav-bg:         rgba(245,242,237,0.92);
```

**Late Edition palette (dark mode):**

```css
--bg:             #0c0a09;     /* Near-black with warm undertone */
--card-bg:        #1c1917;     /* Dark stone, not cold gray */
--text:           #f5f5f4;     /* Off-white — easier on eyes than pure white */
--text-secondary: #a8a29e;     /* Stone — readable against dark bg */
--text-muted:     #57534e;     /* Warm mid-gray */
--border:         #292524;     /* Barely visible separation */
--accent:         #818cf8;     /* Lighter indigo for dark bg contrast */
--nav-bg:         rgba(12,10,9,0.92);
```

**Category colors — with meaning:**

| Category | Color | Hex | Why |
|----------|-------|-----|-----|
| The Lead (Top) | Vermilion | `#dc2626` | Breaking news urgency — red is universal for "pay attention" |
| Technology | Electric Blue | `#2563eb` | The color of screens, of interfaces, of the digital world |
| Business | Forest Green | `#059669` | Money, growth, markets — green means "go" in finance |
| Science | Deep Violet | `#7c3aed` | Mystery, discovery, the unknown — historically the color of rare knowledge |
| World | Amber | `#d97706` | The color of old maps, of parchment, of things that span centuries |
| Health | Rose | `#db2777` | Life, vitality, the human body — warm without being clinical |
| Energy | Teal | `#0d9488` | Power, sustainability, the intersection of industry and nature |

**Implementation:**
- Update `DARK_VARS` and `LIGHT_VARS` in `NewsAggregator.tsx`
- Update `globals.css` root defaults
- Add theme name as a data attribute: `<html data-theme="newsprint">` / `<html data-theme="late-edition">`
- Add a comment block in `constants.ts` explaining each category color choice

**Estimated effort:** 1-2 hours (it's mostly CSS variable changes)

---

### B5: Custom 404 & Polished Empty States

**The principle:** These are the moments most developers skip and most designers obsess over. They're where brand lives — because they're the moments where the app has nothing useful to show, and has to rely on personality instead of data.

**404 Page (`app/not-found.tsx`):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                          ◆                                  │
│                                                             │
│              This page wandered off.                        │
│                                                             │
│   We looked everywhere — even had the AI search for it.     │
│   Let's get you back to the stories.                        │
│                                                             │
│                  [ Back to Sift ]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Empty states (each one is a micro-branding moment):**

| State | Current | Branded |
|-------|---------|---------|
| **No bookmarks** | ☆ icon, generic text | ◆ mark (muted), "Nothing saved yet. Star any article to keep it here. Your reading list, your pace." |
| **No results (search)** | (doesn't exist) | ◆ mark, "Nothing matched that search. Try different words — or let the AI surprise you." + "Browse today's stories" link |
| **No articles (category empty)** | Would show error | ◆ mark, "No stories yet for this topic. Check back in a bit — the AI is still looking." |
| **Custom topic empty** | (doesn't exist) | ◆ mark, "Your topic is set up. Stories will appear here as the AI finds them." |
| **Offline** | (doesn't exist) | ◆ mark, "You're offline. Here are your saved articles." If no saved: "You're offline and haven't saved any articles yet. Connect to start reading." |

**Design pattern:** Every empty state uses the same layout:
1. ◆ mark at reduced opacity (0.15) at large size (80px) — this makes it feel branded, not broken
2. Bold headline (Playfair Display, 18px)
3. Body text (Source Sans 3, 14px, text-secondary)
4. Optional CTA button

**Component:**

```tsx
// components/EmptyState.tsx
interface EmptyStateProps {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20 px-5">
      <div className="text-[80px] leading-none mb-6 opacity-[0.15] text-[var(--accent)]">
        ◆
      </div>
      <p className="font-heading text-lg font-bold text-[var(--text-secondary)] mb-2">
        {title}
      </p>
      <p className="text-sm text-[var(--text-muted)] max-w-[360px] mx-auto leading-relaxed mb-5">
        {body}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[var(--accent)] text-white px-7 py-2.5 rounded-full
                     text-sm font-semibold cursor-pointer font-body
                     hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**Estimated effort:** 2-3 hours (component + 404 page + replace all existing empty states)

---

### B6: About Page — Editorial Philosophy

**What it is:** Not a tech stack list — a statement of editorial philosophy. Why AI curation? What's wrong with existing news consumption? What principles guide which stories surface? This is where you demonstrate product thinking and communication skills in one artifact.

**Route:** `/about`

**Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  ◆ Sift                                       [Back to app]│
│                                                             │
│                                                             │
│  Why Sift exists.                                           │
│                                                             │
│  The average person encounters 10,000 headlines a day.      │
│  Most are noise. The ones that matter get buried under      │
│  the ones designed to grab attention.                       │
│                                                             │
│  Sift is an experiment: what happens when you point an      │
│  AI at the entire news landscape and ask it one question —  │
│  "What actually matters today?"                             │
│                                                             │
│                                                             │
│  Our principles.                                            │
│                                                             │
│  ◆ Signal over noise.                                       │
│    Five stories that matter beat fifty that don't.          │
│    We'd rather miss a clickbait headline than surface one.  │
│                                                             │
│  ◆ Sources, not summaries.                                  │
│    Every article links to the original. Sift is a           │
│    starting point, not a destination. We want you reading   │
│    the journalism, not just our summary of it.              │
│                                                             │
│  ◆ Multiple perspectives.                                   │
│    When outlets disagree, that's information. Sift shows    │
│    you how different sources frame the same event so you    │
│    can form your own view.                                  │
│                                                             │
│  ◆ Transparency.                                            │
│    Sift is AI-powered and we don't hide that. The           │
│    summaries are generated, the curation is algorithmic,    │
│    and the source code is open. You should know how your    │
│    news is filtered.                                        │
│                                                             │
│  ◆ Your interests, not ours.                                │
│    Traditional aggregators decide what's important.         │
│    Sift lets you define your own topics because what        │
│    matters to a clean energy analyst in Florida is          │
│    different from what matters to a VC in San Francisco.    │
│                                                             │
│                                                             │
│  How it works.                                              │
│                                                             │
│  Sift uses Claude, an AI by Anthropic, to search hundreds  │
│  of news sources in real time. For each category or topic,  │
│  the AI reads through search results, identifies the most   │
│  significant stories, and writes a concise summary in its   │
│  own words. When multiple outlets cover the same event,     │
│  Sift groups them and surfaces how each one framed it.      │
│                                                             │
│  No articles are stored. No reading data leaves your        │
│  device. Sift has no ads and no tracking.                   │
│                                                             │
│                                                             │
│  Built by [Your Name].                                      │
│                                                             │
│  Sift is a portfolio project that grew into something I     │
│  actually use every morning. It's open source and built     │
│  with Next.js, TypeScript, and the Anthropic API.           │
│                                                             │
│  [GitHub →]  [LinkedIn →]  [Email →]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why this matters for the portfolio:** A hiring manager who clicks through to `/about` sees someone who can articulate a product vision, write clearly, and think about editorial ethics around AI. That's rare. Most portfolio projects have a README; this has a manifesto.

**Estimated effort:** 2-3 hours (mostly writing + layout)

---

### B7: Branded Social Sharing (OG Images)

**The problem:** When someone shares a Sift link on Twitter, Slack, or iMessage, the preview card is generic Next.js metadata. That's free marketing wasted.

**The solution:** Dynamic OG images that show the Sift brand, article title, and category color.

**Default OG image (homepage/sharing the app):**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ◆ Sift                                                     │
│                                                             │
│  Your morning news, read by AI.                             │
│                                                             │
│  sift.app                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
  1200 × 630px, dark bg, white text, accent-colored ◆
```

**Per-article OG image (when sharing a specific article):**

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────┐                                    │
│  │ ● Technology        │  ◆ Sift                            │
│  └─────────────────────┘                                    │
│                                                             │
│  EU Announces Comprehensive                                 │
│  AI Regulation Framework                                    │
│                                                             │
│  3 sources · Updated 2h ago                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
  1200 × 630px, category color accent bar on left edge
```

**Implementation options:**

| Approach | Pros | Cons |
|----------|------|------|
| `@vercel/og` (Next.js ImageResponse) | Built into Vercel, JSX-based, dynamic | Limited styling, no custom fonts without workaround |
| Static default + dynamic per-article | Mix of pre-generated and dynamic | More complex routing |
| Satori (underlying lib of @vercel/og) | Full control, works anywhere | More setup |

Recommended: **`@vercel/og`** with Next.js App Router for dynamic generation.

```typescript
// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title") || "Your morning news, read by AI.";
  const category = request.nextUrl.searchParams.get("category");

  return new ImageResponse(
    (
      <div style={{ /* ... */ }}>
        <div style={{ fontSize: 24, color: "#818cf8" }}>◆ Sift</div>
        <div style={{ fontSize: 48, fontWeight: 800 }}>{title}</div>
        {category && <div style={{ /* category badge */ }}>{category}</div>}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**Metadata in layout:**

```typescript
export const metadata: Metadata = {
  title: "Sift — Intelligence, distilled",
  description: "AI-curated news that reads hundreds of sources and gives you the stories that matter.",
  openGraph: {
    title: "Sift",
    description: "Your morning news, read by AI.",
    images: ["/api/og"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sift",
    description: "Your morning news, read by AI.",
    images: ["/api/og"],
  },
};
```

**Estimated effort:** 3-4 hours

---

### B8: Weekly Email Template

**What it is:** Even if you don't send emails yet, designing a "Weekly Sift" email template that matches the app's visual language shows you think in systems, not screens. The email, the app, the landing page, the social cards — they should all feel like they came from the same place.

**Template design:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ◆ Sift                          Week of March 22, 2026    │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Good morning. Here's your week in five minutes.            │
│                                                             │
│  ─── THE LEAD ──────────────────────────────────────────    │
│                                                             │
│  [Title of #1 story]                                        │
│  Two-sentence summary. Why it matters line.                 │
│  Source: Reuters · Read more →                              │
│                                                             │
│  ─── TECHNOLOGY ────────────────────────────────────────    │
│                                                             │
│  [Title]                                                    │
│  Summary. Why it matters.                                   │
│  Source · Read more →                                       │
│                                                             │
│  ─── BUSINESS ──────────────────────────────────────────    │
│                                                             │
│  [Title]                                                    │
│  Summary. Why it matters.                                   │
│  Source · Read more →                                       │
│                                                             │
│  ─── YOUR TOPICS ───────────────────────────────────────    │
│                                                             │
│  FL Energy: [Title]                                         │
│  Summary. · Source · Read more →                            │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📈 Trending this week: AI regulation (12×), Fed rates (8×)│
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ◆ Sift — Intelligence, distilled.                          │
│  Read more at sift.app · Unsubscribe                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design rules for the email:**
- Same typography feel: serif for headings, sans for body (email-safe fallbacks: Georgia, Arial)
- Same color palette: Newsprint warm tones
- Category colors as left-border accents on each section
- The ◆ mark in the header and footer
- Minimal images — emails should be fast-loading and text-forward
- Mobile-first: single column, 600px max width

**Implementation:**
- Build as an HTML template (React Email or MJML)
- Store in `email-templates/weekly.html`
- Even without a send pipeline, the template itself is a portfolio artifact
- Later: wire to Resend, SendGrid, or AWS SES with a cron job

**Estimated effort:** 3-4 hours (design + HTML template)

---

### B9: Micro-Interactions with Personality

**The principle:** The details are what people remember. A bookmark animation, a loading state, a category switch — each one is a chance to feel *designed* rather than *default*.

**Bookmark animation:**

Current: Star scales up (`transform: scale(1.15)`).
Branded: A two-phase animation — the star pops to 1.3 then settles to 1.15 with a subtle particle burst.

```css
@keyframes bookmark-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  60%  { transform: scale(0.95); }
  100% { transform: scale(1.15); }
}

/* Particle burst via pseudo-element */
@keyframes bookmark-burst {
  0%   { opacity: 1; transform: scale(0.5); }
  100% { opacity: 0; transform: scale(1.5); }
}
```

**Streaming card entrance:**

Current: `fade-slide-in` (opacity + translateY). Already good.
Enhancement: Each card enters with a very slight horizontal stagger — card 1 from center, card 2 from slightly left, card 3 from slightly right — creating a "fanning out" effect.

```css
@keyframes card-enter-left {
  from { opacity: 0; transform: translateY(16px) translateX(-8px); }
  to   { opacity: 1; transform: translateY(0) translateX(0); }
}
@keyframes card-enter-right {
  from { opacity: 0; transform: translateY(16px) translateX(8px); }
  to   { opacity: 1; transform: translateY(0) translateX(0); }
}
```

**Category switch transition:**

Current: Articles just swap instantly.
Branded: Current articles fade out (100ms), new articles stream in (Feature 2) or fade-slide in from below. The category pill underline slides smoothly to the new position (like a tab indicator).

```css
/* Category pill active indicator - animated underline */
.category-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--accent);
  transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Theme toggle transition:**

Current: Variables swap instantly.
Branded: A 200ms cross-fade transition on the root element.

```css
html {
  transition: background-color 0.3s ease, color 0.2s ease;
}
/* Cards and elements transition their backgrounds too */
[class*="bg-[var("] {
  transition: background-color 0.3s ease;
}
```

**Pull-to-refresh (mobile):**

Instead of a generic spinner, show the ◆ mark rotating and pulsing:

```css
@keyframes sift-refresh {
  0%   { transform: rotate(0deg) scale(1); opacity: 0.5; }
  50%  { transform: rotate(180deg) scale(1.1); opacity: 1; }
  100% { transform: rotate(360deg) scale(1); opacity: 0.5; }
}
```

**Story threading expand animation:**

When "Show individual articles" is clicked, the grouped card expands with a smooth height transition, and individual article cards slide in from behind the parent card:

```css
@keyframes story-expand {
  from { max-height: 0; opacity: 0; transform: translateY(-8px); }
  to   { max-height: 500px; opacity: 1; transform: translateY(0); }
}
```

**Hover states with intent:**

Current: Cards lift on hover. Good.
Enhancement: The category color subtly appears as a top-edge glow on hover:

```css
article:hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--category-color);
  opacity: 0.6;
  transition: opacity 0.3s ease;
}
```

**Implementation order:**
1. Theme toggle transition (CSS only — 15 minutes)
2. Category pill indicator animation (CSS + minor JS — 1 hour)
3. Bookmark pop animation (CSS + keyframes — 30 minutes)
4. Card entrance stagger enhancement (CSS — 30 minutes)
5. Category switch fade-out/in (JS state management — 1 hour)
6. Hover glow (CSS — 15 minutes)
7. Pull-to-refresh custom animation (JS + CSS — 2 hours)
8. Story expand animation (CSS — 30 minutes)

**Estimated effort:** 4-6 hours total (can be spread across other work)

---

### Branding Implementation Summary

| # | Deliverable | Effort | When |
|---|-------------|--------|------|
| B1 | Landing page | 4-6h | Week 7 Day 1 |
| B2 | Name system (logo, favicon, icon set) | 2-3h | Week 1 Day 1 (with rename) |
| B3 | Voice & tone (copy audit + `lib/copy.ts`) | 2-3h | Week 1 Day 1 (with rename) |
| B4 | Color story (Newsprint + Late Edition) | 1-2h | Week 1 Day 1 (with rename) |
| B5 | 404 + empty states | 2-3h | Week 3 Day 5 |
| B6 | About page | 2-3h | Week 7 Day 1 (with landing page) |
| B7 | OG image system | 3-4h | Week 3 Day 5 |
| B8 | Email template | 3-4h | Week 7 (if time) |
| B9 | Micro-interactions | 4-6h | Spread across all weeks |
| **Total** | | **~24-34h** | |

The branding work roughly doubles the polish of the app. The most impactful items relative to effort are B3 (voice/tone — changes how every screen reads), B4 (color story — instant visual upgrade), and B2 (name system — makes it look like a real product). Those three can all ship on Day 1 alongside the rename.

---

## Implementation Sequence (Full Roadmap)

```
Week 1: Foundation, Rename & Identity
  Day 1:  Rename to Sift. B2 (logo/favicon/icon set). B4 (Newsprint + Late Edition color palettes).
  Day 2:  B3 (voice & tone audit — create lib/copy.ts, rewrite all UI strings).
          Feature 2 — IncrementalArticleParser + tests.
  Day 3:  Feature 2 — /api/news/stream route + SSE
  Day 4:  Feature 2 — useStreamingNews hook + wire into UI.
          B9 (micro-interactions, pass 1: theme toggle transition, card entrance stagger).
  Day 5:  QA streaming end-to-end. Deploy to Vercel.

Week 2: Personalization & Story Threading
  Day 1:  Feature 1 — CustomTopic type + localStorage hook
  Day 2:  Feature 1 — /api/topics/generate route + TopicModal UI
  Day 3:  Feature 1 — Wire custom topics into nav + news loader
  Day 4:  Feature 3 Phase 1 — Story clustering via second Claude call
  Day 5:  Feature 3 Phase 1 — StoryCard + PerspectiveToggle UI.
          B9 (micro-interactions, pass 2: bookmark pop, category pill indicator, hover glow).

Week 3: Quick Wins + Brand Polish
  Day 1:  Feature 3 — QA story threading across all categories
  Day 2:  Feature 4 — "Why This Matters" context lines
  Day 3:  Feature 5 — Morning Briefing (hero section + /api/briefing)
  Day 4:  Feature 8 — Multi-Language support (prompt changes + UI badges).
          B5 (404 page + all empty states using EmptyState component).
  Day 5:  B7 (OG image system — @vercel/og dynamic images).
          B9 (micro-interactions, pass 3: category switch fade, story expand animation).

Week 4: Persistence & Temporal Intelligence
  Day 1:  Database setup (Vercel Postgres) + schema migration
  Day 2-3: Feature 6 — Trend Detection (entity extraction + /api/trends)
  Day 4:  Feature 6 — TrendBar UI component
  Day 5:  Feature 10 — Analytics Dashboard (read tracking + recharts page)

Week 5: Advanced AI & Full Experience
  Day 1-2: Feature 7 — Semantic Search / RAG (embedding pipeline + vector DB)
  Day 3:  Feature 7 — Search UI + RAG synthesis
  Day 4:  Feature 9 — PWA (service worker, manifest, offline bookmarks).
          B9 (micro-interactions, pass 4: pull-to-refresh custom animation).
  Day 5:  Feature 9 — Install prompt + offline indicator

Week 6: LangGraph & Architecture
  Day 1-2: Feature 3 Phase 2 — Scaffold FastAPI + LangGraph service
  Day 3-4: Feature 3 Phase 2 — Graph nodes (search, extract, cluster, synthesize)
  Day 5:  Feature 3 Phase 2 — Deploy FastAPI (Railway/Fly.io), wire to Next.js

Week 7: Brand, Portfolio & Ship
  Day 1:  B1 (landing page) + B6 (about page) — these share layout/style work
  Day 2:  B8 (weekly email template). STAR-format portfolio write-up.
  Day 3:  Lighthouse audit, WCAG pass, performance tuning
  Day 4:  Final QA across all features + branding, mobile testing
  Day 5:  Deploy production. Share it with the world.
```

---

## What This Proves to a Hiring Manager

| Feature | Technical Signal | Product Signal |
|---------|-----------------|----------------|
| **Tier 1 — AI Features** | | |
| Custom topics | Prompt engineering, dynamic query gen, personalization architecture | AI products need to be personal, not one-size-fits-all |
| Streaming cards | SSE, incremental parsing, streaming APIs, perceived performance | You care about UX, not just functionality |
| Story threading | Multi-step orchestration, entity extraction, LLM-as-judge, LangGraph | You can design complex AI workflows, not just single-call wrappers |
| **Tier 2 — Product Depth** | | |
| "Why it matters" | Chained LLM calls, context-aware prompting, optional personalization | Information without context is noise |
| Morning briefing | Cross-domain synthesis, editorial voice prompting, caching strategy | You think about user workflows — what does someone need at 7 AM? |
| Trend detection | Database design, temporal queries, entity extraction pipeline | An intelligent app learns from its own data over time |
| **Tier 3 — Technical Showcase** | | |
| Semantic search | Vector embeddings, RAG pipeline, similarity scoring, Pinecone/pgvector | Search should understand meaning, not just match keywords |
| Multi-language | Multilingual prompting, translation-layer architecture | Localization at the AI layer, not just string tables |
| Offline/PWA | Service workers, cache strategies, background sync, install prompts | You think about the full lifecycle — including no connectivity |
| Analytics dashboard | Data visualization (recharts), local data aggregation, engagement loops | Users want to understand their own behavior |
| **Branding — Every Choice Deliberate** | | |
| Landing page | Responsive marketing page, animation, routing strategy | You know that products need positioning, not just features |
| Name system & identity | SVG component system, favicon generation, responsive logo variants | You think in systems — 16px to full-width, one coherent mark |
| Voice & tone | Centralized copy architecture (`lib/copy.ts`), future i18n readiness | Every string is a branding moment. You write like a human, not a developer. |
| Color story | CSS custom properties, design token architecture | Colors have meaning. "Newsprint" and "Late Edition" signal intentionality. |
| 404 & empty states | Reusable component patterns, edge-case handling | You obsess over the moments most developers skip |
| About page | Static page routing, editorial writing | You can articulate *why* something exists, not just *how* |
| OG images | Dynamic image generation (@vercel/og), meta tag architecture | Distribution matters. Every shared link is free marketing. |
| Email template | HTML email constraints, cross-client rendering | You think in systems: app, web, email, social — one brand. |
| Micro-interactions | CSS animations, cubic-bezier timing, state-driven transitions | The details are what people remember |
| **Cross-cutting** | | |
| LangGraph backend | Python + TypeScript polyglot, FastAPI, graph-based orchestration | You can architect systems, not just write components |

The full picture says: "I can take a product from 0 to 1 across the entire stack — AI architecture, frontend UX, data persistence, branding — and ship it with the polish of something people would actually pay for. Every choice is deliberate."
