import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchArticlesByEmbedding, insertArticle } from "@/lib/db";
import { stableHash, estimateReadTime } from "@/lib/utils";
import { stripHtml, sanitizeUrl } from "@/lib/sanitize";
import type { Article, CategoryId } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";

const SIMILARITY_THRESHOLD = 0.35;
const MIN_STRONG_RESULTS = 3;
const MAX_RESULTS = 10;

function getVoyageApiKey(): string {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY environment variable is not set");
  return key;
}

// ─── Category classification for fallback articles ──────

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  technology:
    "Technology news: software engineering, hardware devices, artificial intelligence, machine learning, programming, cybersecurity, tech startups, smartphones, cloud computing, robotics, semiconductors",
  business:
    "Wall Street and finance news: stock market, corporate earnings, mergers and acquisitions, IPOs, venture capital, banking, interest rates, Federal Reserve, employment data, GDP, inflation, corporate strategy, trade policy, institutional investing",
  science:
    "Scientific research: physics, chemistry, biology, space exploration, NASA, astronomy, peer-reviewed papers, laboratory research, geology, paleontology",
  energy:
    "Energy industry: renewable energy, solar, wind, nuclear power, oil prices, natural gas, battery technology, electric vehicles, carbon emissions, climate policy",
  world:
    "International news: foreign affairs, diplomacy, wars, military conflicts, international elections, government policy, immigration, United Nations, human rights, sanctions",
  health:
    "Health and medicine: medical research, clinical trials, disease outbreaks, pharmaceuticals, mental health, nutrition, vaccines, public health, FDA approvals",
  politics:
    "Politics: elections, voting, political parties, legislation, Congress, Senate, governors, campaigns, lobbying, political debate, government policy, Supreme Court, executive orders",
  sports:
    "Sports news: NFL, NBA, MLB, NHL, soccer, tennis, golf, Olympics, college sports, esports, player trades, game results, championships, athletics",
  entertainment:
    "Entertainment news: movies, TV shows, streaming, music, celebrities, awards, box office, concerts, video games, books, theater, pop culture, Hollywood, consumer product launches, brand collaborations, viral consumer trends",
  top:
    "General interest: breaking news, cross-cutting stories that transcend a single topic, lifestyle, food, travel, arts, fashion, viral stories",
};

let categoryEmbeddingsCache: { embeddings: number[][]; categories: string[] } | null = null;

async function getCategoryEmbeddings(): Promise<{ embeddings: number[][]; categories: string[] }> {
  if (categoryEmbeddingsCache) return categoryEmbeddingsCache;

  const categories = Object.keys(CATEGORY_DESCRIPTIONS);
  const texts = categories.map((c) => CATEGORY_DESCRIPTIONS[c]);
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getVoyageApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: "voyage-3-lite", input_type: "document" }),
  });
  if (!res.ok) throw new Error(`Voyage category embed error: ${res.status}`);
  const data = await res.json();
  const embeddings = data.data.map((d: { embedding: number[] }) => d.embedding);
  categoryEmbeddingsCache = { embeddings, categories };
  return categoryEmbeddingsCache;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

const MIN_MARGIN = 0.03;

function classifyCategory(articleEmbedding: number[], catEmbeddings: number[][], categories: string[]): CategoryId {
  const topIdx = categories.indexOf("top");
  let bestIdx = 0;
  let bestSim = -1;
  for (let i = 0; i < catEmbeddings.length; i++) {
    const sim = cosineSim(articleEmbedding, catEmbeddings[i]);
    if (sim > bestSim) {
      bestSim = sim;
      bestIdx = i;
    }
  }
  // If winner is "top" or doesn't beat "top" by enough margin, default to "top"
  if (bestIdx === topIdx) return "top" as CategoryId;
  const topSim = cosineSim(articleEmbedding, catEmbeddings[topIdx]);
  if (bestSim - topSim < MIN_MARGIN) return "top" as CategoryId;
  return categories[bestIdx] as CategoryId;
}

// ─── Embedding Cache (in-memory, per-process) ───────────

const embeddingCache = new Map<string, { embedding: number[]; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCachedEmbedding(query: string): number[] | null {
  const key = normalizeQuery(query);
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    embeddingCache.delete(key);
    return null;
  }
  return entry.embedding;
}

function setCachedEmbedding(query: string, embedding: number[]) {
  const key = normalizeQuery(query);
  // Cap cache size to prevent unbounded growth
  if (embeddingCache.size > 500) {
    const oldest = embeddingCache.keys().next().value;
    if (oldest) embeddingCache.delete(oldest);
  }
  embeddingCache.set(key, { embedding, ts: Date.now() });
}

// ─── SSE Helpers ────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── Route Handler (SSE streaming) ─────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2 || query.length > 200) {
    return NextResponse.json(
      { error: "Query must be 2-200 characters" },
      { status: 400 }
    );
  }

  // Rate limit by IP + global fallback to prevent abuse
  // Use x-real-ip (set by reverse proxy) over x-forwarded-for (user-spoofable)
  const ip = request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const perIp = rateLimit(`topic-search:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  const global = rateLimit("topic-search:global", { maxRequests: 200, windowMs: 60_000 });
  if (!perIp.allowed || !global.allowed) {
    const retryMs = Math.max(perIp.retryAfterMs, global.retryAfterMs);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryMs / 1000)) } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      let totalArticles = 0;
      let fallbackUsed = false;

      try {
        // 1. Embed the query (with cache)
        let embedding = getCachedEmbedding(query);
        if (!embedding) {
          embedding = await embedQuery(query);
          setCachedEmbedding(query, embedding);
        }

        // 2. Vector similarity search in Postgres
        const rows = await searchArticlesByEmbedding(
          embedding,
          SIMILARITY_THRESHOLD,
          MAX_RESULTS
        );

        // 3. Map DB rows to Article type
        const articles: Article[] = rows.map((row) => ({
          id: row.id,
          title: row.title,
          summary: row.summary || "",
          sourceUrl: row.source_url,
          sourceName: row.source_name,
          publishedDate: row.published_date
            ? row.published_date.toISOString()
            : null,
          imageUrl: row.image_url,
          category: row.category as CategoryId,
          readTime: row.read_time || 1,
          ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
          ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
        }));

        // 4. Stream vector results immediately
        if (articles.length > 0) {
          controller.enqueue(
            sseEvent("results", { articles, source: "vector" })
          );
        }
        totalArticles = articles.length;

        // 5. If < 3 results, run Claude web_search fallback
        if (articles.length < MIN_STRONG_RESULTS) {
          fallbackUsed = true;
          controller.enqueue(sseEvent("fallback-start", {}));

          try {
            const fallbackArticles = await webSearchFallback(query);
            // Dedupe against vector results
            const seenIds = new Set(articles.map((a) => a.id));
            const newArticles = fallbackArticles.filter(
              (a) => !seenIds.has(a.id)
            );

            if (newArticles.length > 0) {
              controller.enqueue(
                sseEvent("results", {
                  articles: newArticles,
                  source: "web-search",
                })
              );
              totalArticles += newArticles.length;
            }
          } catch (err) {
            console.error("Web search fallback error:", err);
          }
        }

        // 6. Done
        const matchQuality: "strong" | "weak" =
          totalArticles >= MIN_STRONG_RESULTS ? "strong" : "weak";

        controller.enqueue(
          sseEvent("done", { matchQuality, fallbackUsed, query })
        );
      } catch (err) {
        console.error("Topic search error:", err);
        controller.enqueue(
          sseEvent("error", { message: "Topic search failed" })
        );
      } finally {
        controller.close();
      }
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

// ─── Voyage AI Embedding ────────────────────────────────

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getVoyageApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text],
      model: "voyage-3-lite",
      input_type: "query",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

// ─── Claude Web Search Fallback ─────────────────────────

async function webSearchFallback(query: string): Promise<Article[]> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
        max_uses: 2,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Search the web for recent news articles related to:
<user_query>${query}</user_query>

If the query is vague or broad (like a single word), interpret it generously — find interesting recent news stories that relate to the theme.

Find 3-5 real, recent news articles from reputable sources. For each article provide:
- title: the actual headline
- summary: 2-3 sentence summary
- source_url: the full URL
- source_name: publication name (e.g. "Reuters", "BBC")

You MUST respond with ONLY a JSON array, no explanation or apology:
[{"title": "...", "summary": "...", "source_url": "...", "source_name": "..."}]

If you truly cannot find any articles, respond with an empty array: []`,
      },
    ],
  });

  // Extract JSON from response — Claude may return multiple text blocks
  const textBlocks = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text);

  if (textBlocks.length === 0) return [];

  let parsed: Array<{
    title: string;
    summary: string;
    source_url: string;
    source_name: string;
  }> | null = null;

  for (const text of textBlocks) {
    try {
      const jsonStr = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      // Try to find a JSON array in the text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const candidate = JSON.parse(arrayMatch[0]);
        if (Array.isArray(candidate) && candidate.length > 0 && candidate[0].title) {
          parsed = candidate;
          break;
        }
      }
    } catch {
      continue;
    }
  }

  if (!parsed) {
    console.error("Failed to parse Claude web search response. Text blocks:", JSON.stringify(textBlocks.map(t => t.substring(0, 500))));
    console.error("All content block types:", response.content.map(b => b.type));
    return [];
  }

  // Embed fallback articles for future vector search
  let embeddings: number[][] = [];
  try {
    const textsToEmbed = parsed.map((a) => `${a.title}. ${a.summary}`);
    const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getVoyageApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: textsToEmbed,
        model: "voyage-3-lite",
        input_type: "document",
      }),
    });
    if (embRes.ok) {
      const embData = await embRes.json();
      embeddings = embData.data.map(
        (d: { embedding: number[] }) => d.embedding
      );
    }
  } catch (err) {
    console.error("Failed to embed fallback articles:", err);
  }

  // Classify articles into proper categories using embeddings
  let catData: { embeddings: number[][]; categories: string[] } | null = null;
  if (embeddings.length > 0) {
    try {
      catData = await getCategoryEmbeddings();
    } catch (err) {
      console.error("Failed to load category embeddings:", err);
    }
  }

  // Build return array and store in Postgres
  const articles: Article[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const a = parsed[i];
    if (!a.title || !a.source_url) continue;

    // Sanitize external data before storage and display
    const safeTitle = stripHtml(a.title);
    const safeSummary = stripHtml(a.summary || "");
    const safeSourceUrl = sanitizeUrl(a.source_url);
    const safeSourceName = stripHtml(a.source_name || "Web");
    if (!safeTitle || !safeSourceUrl) continue;

    const category: CategoryId =
      catData && embeddings[i]
        ? classifyCategory(embeddings[i], catData.embeddings, catData.categories)
        : ("top" as CategoryId);

    const id = stableHash(safeSourceUrl + safeTitle);
    articles.push({
      id,
      title: safeTitle,
      summary: safeSummary,
      sourceUrl: safeSourceUrl,
      sourceName: safeSourceName,
      publishedDate: new Date().toISOString(),
      imageUrl: null,
      category,
      readTime: estimateReadTime(safeSummary),
    });

    // Store in Postgres (fire and forget)
    if (embeddings[i]) {
      insertArticle({
        id,
        title: safeTitle,
        summary: safeSummary,
        source_url: safeSourceUrl,
        source_name: safeSourceName,
        category,
        embedding: embeddings[i],
        published_date: new Date(),
        read_time: estimateReadTime(safeSummary),
      }).catch((err) =>
        console.error("Failed to store fallback article:", err)
      );
    }
  }

  return articles;
}
