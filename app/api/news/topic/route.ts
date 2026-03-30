import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { searchArticlesByEmbedding, insertArticle } from "@/lib/db";
import { stableHash, estimateReadTime } from "@/lib/utils";
import type { Article, CategoryId, TopicSearchResponse } from "@/lib/types";

const SIMILARITY_THRESHOLD = 0.35;
const MIN_STRONG_RESULTS = 3;
const MAX_RESULTS = 10;

// ─── Embedding Cache (in-memory, per-process) ───────────

const embeddingCache = new Map<string, { embedding: number[]; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCachedEmbedding(query: string): number[] | null {
  const entry = embeddingCache.get(query.toLowerCase());
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    embeddingCache.delete(query.toLowerCase());
    return null;
  }
  return entry.embedding;
}

function setCachedEmbedding(query: string, embedding: number[]) {
  // Cap cache size to prevent unbounded growth
  if (embeddingCache.size > 500) {
    const oldest = embeddingCache.keys().next().value;
    if (oldest) embeddingCache.delete(oldest);
  }
  embeddingCache.set(query.toLowerCase(), { embedding, ts: Date.now() });
}

// ─── Route Handler ──────────────────────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2 || query.length > 200) {
    return NextResponse.json(
      { error: "Query must be 2-200 characters" },
      { status: 400 }
    );
  }

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
    }));

    const matchQuality: "strong" | "weak" =
      articles.length >= MIN_STRONG_RESULTS ? "strong" : "weak";

    // 4. If < 3 results, kick off Claude web_search in background
    //    Results get embedded and stored in Postgres for next search
    let fallbackUsed = false;
    if (articles.length < MIN_STRONG_RESULTS) {
      fallbackUsed = true;
      webSearchFallback(query).catch((err) =>
        console.error("Background web search fallback error:", err)
      );
    }

    return NextResponse.json<TopicSearchResponse>({
      articles,
      matchQuality,
      fallbackUsed,
      query,
    });
  } catch (err) {
    console.error("Topic search error:", err);
    return NextResponse.json(
      { error: "Search failed", details: String(err) },
      { status: 500 }
    );
  }
}

// ─── Voyage AI Embedding ────────────────────────────────

async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
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
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
        max_uses: 5,
      },
    ],
    messages: [
      {
        role: "user",
        content: `Search the web for recent news about: "${query}"

Find 3-5 relevant, recent news articles. For each article, provide:
1. title - the actual article headline
2. summary - a 2-3 sentence summary of the article
3. source_url - the URL of the article
4. source_name - the publication name (e.g., "Reuters", "TechCrunch")

Return your findings as a JSON array with this exact structure:
[{"title": "...", "summary": "...", "source_url": "...", "source_name": "..."}]

Return ONLY the JSON array, no other text.`,
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
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
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

  // Build return array and store in Postgres
  const articles: Article[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const a = parsed[i];
    if (!a.title || !a.source_url) continue;

    const id = stableHash(a.source_url + a.title);
    articles.push({
      id,
      title: a.title,
      summary: a.summary || "",
      sourceUrl: a.source_url,
      sourceName: a.source_name || "Web",
      publishedDate: new Date().toISOString(),
      imageUrl: null,
      category: "top" as CategoryId,
      readTime: estimateReadTime(a.summary),
    });

    // Store in Postgres (fire and forget)
    if (embeddings[i]) {
      insertArticle({
        id,
        title: a.title,
        summary: a.summary || "",
        source_url: a.source_url,
        source_name: a.source_name || "Web",
        category: "top",
        embedding: embeddings[i],
        published_date: new Date(),
        read_time: estimateReadTime(a.summary),
      }).catch((err) =>
        console.error("Failed to store fallback article:", err)
      );
    }
  }

  return articles;
}
