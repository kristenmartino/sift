# Sift: 0→1 Product Story

## Building an AI-Curated News Aggregator from Concept to Production

---

### Situation

The news aggregation market is saturated with products that solve the same problem the same way: pull headlines from RSS feeds or wire services, rank by recency or clicks, and dump them into a reverse-chronological feed. The result is a commodity experience — every app shows the same Reuters and AP stories in roughly the same order. Meanwhile, generative AI had unlocked a fundamentally different approach to content curation — one where an AI model could search the web in real time, evaluate source quality, and synthesize original summaries — but no consumer product had shipped this as the primary content pipeline.

I saw a gap: a lightweight, fast news reader where every article summary is AI-generated from live web search, not regurgitated from syndication feeds. The core thesis was that AI-curated news could deliver three things traditional aggregators couldn't: broader source diversity (the model searches beyond the usual wire services), contextual summaries written for comprehension rather than clicks, and topic coverage shaped by structured subtopics rather than editorial bias.

The constraints were real. I was building solo, funding my own API costs, and targeting a portfolio-ready product that demonstrated both product thinking and hands-on AI engineering. The product needed to work end-to-end — not as a demo, but as something a real user could open daily and get value from.

---

### Task

Design, build, and ship a production-grade news aggregator that uses Claude's web search capability as the primary content engine. Specifically:

**Product goals:**

Deliver a daily-driver news reader across 7 categories (Top Stories, Technology, Business, Science, Energy, World, Health) where every summary is AI-generated from real-time web search results. Articles must link to original sources so the product adds value without replacing journalism. The interface needed to feel fast and polished despite the inherent latency of AI-powered content generation.

**Technical goals:**

Build a full-stack application with a React frontend, server-side API proxy (keeping API keys off the client), persistent user state (bookmarks, theme preferences), and a robust error handling system that gracefully manages the unpredictable nature of LLM responses — including model refusals, malformed JSON, timeouts, and empty results.

**Portfolio goals:**

Demonstrate the complete product development lifecycle: requirements analysis, architectural decisions with documented rationale, iterative debugging with root cause analysis, test coverage, and a production deployment plan. Show that I can take a product from zero to one, not just build features on an existing codebase.

---

### Action

**Discovery and API spike.** I started by exploring the Anthropic Messages API's web_search tool — the core technical bet for the product. This turned out to be the most consequential phase of the project. I discovered that the model would refuse to format web search results as structured JSON when prompted with rigid extraction commands like "Return ONLY a JSON array." The model interpreted this as a request to fabricate structured data from unstructured search snippets, which conflicted with its instruction-following behavior. This was a critical insight: the entire content pipeline depended on reliable structured output from an API that wasn't designed for structured output.

**Prompt engineering breakthrough.** I solved the model refusal problem by reframing the prompt from data extraction to summarization. Instead of commanding "format these search results as JSON," I positioned the task as "search for news about this topic, then summarize the top 5 stories you found." The key phrase was "it's fine to summarize in your own words and make reasonable guesses for any missing fields." This aligned with the model's strengths — summarization and synthesis — rather than fighting against its guardrails. The JSON format was presented as a helpful structure for the summary, not as a rigid extraction template.

**Iterative architecture.** I built the product in three distinct phases, each informed by what broke in the previous one:

*Phase 1 — Working prototype (single-file React artifact):* Built the complete UI and API integration in a single 831-line React component to validate the core experience. This phase proved the product thesis — AI-curated summaries were substantively different from wire service headlines — but revealed significant technical debt. Silent error handling (`catch { return [] }`) masked failures, non-unique article IDs broke bookmarks, and the API key was exposed client-side.

*Phase 2 — Hardened error handling:* After the prototype surfaced 6+ debugging iterations caused by compounding silent failures, I rebuilt the error pipeline. Every API failure mode got a specific handler: HTTP errors, empty response blocks, malformed JSON, model refusals, and timeouts. I built a 3-strategy JSON parser that handles clean arrays, prose-wrapped JSON, and individual scattered objects — because the model's response format varied unpredictably across calls. I added diagnostic error messages, AbortController-based timeouts, and a slow-loading indicator.

*Phase 3 — Production migration (Next.js):* Decomposed the monolith into a proper Next.js 15 application with TypeScript, Tailwind CSS, and a server-side API route. This addressed every production blocker from the prototype: API key moved to server-side environment variables, bookmarks persist via localStorage, article IDs use deterministic URL hashing, and the codebase is testable. I wrote 30+ unit tests covering utilities, API response parsing, and component rendering — with particular depth on the JSON parser that had caused the most debugging time.

**Structured subtopic coverage.** To ensure broad coverage within each category, I designed a subtopic system where each category defines a primary topic and 2-4 subtopics. The prompt explicitly instructs the model to "search across these subtopics for broad coverage" and "include at least one story from each subtopic if possible." For the Energy category, this means separate searches across grid/utilities, renewables, energy prices, and specific companies — the functional equivalent of boolean OR operators in a traditional search API, translated into natural language instructions for the AI.

**Architecture for future complexity.** I designed a hybrid architecture that keeps simple operations simple (single API call for basic news fetch stays in Next.js) while planning a separate Python/FastAPI service with LangGraph for features that genuinely need multi-step orchestration: multi-source comparison (parallel searches across outlets → claim extraction → synthesis), topic clustering, and AI summary customization. This distinction — knowing when orchestration frameworks add value versus when they add unnecessary complexity — was a deliberate architectural decision documented in the project's decision log.

---

### Result

**Shipped product:**

Sift is a production AI-curated news aggregator live at siftnews.kristenmartino.ai, serving 10 categories with 100+ RSS sources, AI summaries from Claude Haiku 4.5, vector-powered topic search, and multi-source comparison. The interface features text-first article cards with RSS images, named dark/light themes ("Late Edition" / "Newsprint"), persistent bookmarks with Clerk sync, SSE streaming for topic search, and a diamond brand mark. Articles link to original sources.

**Architecture (v2):**

The v2 architecture split the system into three services: Next.js frontend on Vercel (reads from Postgres, serves UI), Python FastAPI + LangGraph on Railway (background pipeline + comparison workflow), and Neon Postgres with pgvector (shared source of truth). Content pipeline runs every 10 minutes via asyncio scheduler. User requests are pure database reads (<50ms). Multi-source comparison uses a LangGraph workflow with fan-out web search across outlets. Topic search uses Voyage AI embeddings with pgvector cosine similarity and Claude web search fallback. Total cost: ~$9/month.

**Technical outcomes:**

Two repositories totaling ~5,000+ lines across 50+ source files. The Next.js frontend includes 7 custom hooks, SSE streaming, Clerk auth, and CI via GitHub Actions. The Python backend includes two LangGraph workflows (pipeline + comparison), 100+ RSS feeds, and CI with ruff + pytest. Neon Postgres stores articles with 1024-dim Voyage AI embeddings and an IVFFlat index for fast similarity search. 21 architectural decisions documented with rationale.

**Measurable improvements over v1 prototype:**

Architecture: AI moved from request path to background pipeline (<50ms reads vs 10-20s Claude calls). Scale: 7 categories → 10 categories, ~56 RSS feeds → 100+ feeds. Features: added topic search (vector + fallback), multi-source comparison (LangGraph fan-out), landing page, brand identity. Cost: reduced from projected ~$30/mo to actual ~$9/mo by using Vercel Hobby + Neon free tier + Railway asyncio scheduler. Deployment: full CI/CD with auto-deploy on both repos.

**Key lessons documented:**

The single most impactful lesson was that API behavior discovery should happen before integration, not during debugging. A 2-hour spike on the Anthropic web_search tool's response format and refusal patterns would have prevented 6+ hours of debugging caused by compounding failures from an untested prompt change. The second lesson was that prompt engineering is product design — the shift from "format as JSON" to "summarize in your own words" wasn't a technical fix, it was a reframing of what we were asking the AI to do. The third lesson was about deployment: Railway auto-injects PORT environment variables that override user settings, and model IDs like `claude-haiku-4-5-20251001` require the full date suffix — both discovered through production debugging.
