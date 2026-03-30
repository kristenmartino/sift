import { NextRequest, NextResponse } from "next/server";
import { getArticlesByCategory, getLastRefreshed } from "@/lib/db";
import type { CategoryId, Article, NewsApiResponse, NewsApiError } from "@/lib/types";

// ─── Valid Categories ───────────────────────────────────

const VALID_CATEGORIES = new Set<string>([
  "top", "technology", "business", "science", "energy", "world", "health",
  "politics", "sports", "entertainment",
]);

// ─── Route Handler ──────────────────────────────────────

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") as CategoryId;
  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json<NewsApiError>(
      {
        error: "Invalid category",
        details: `Must be one of: ${[...VALID_CATEGORIES].join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const [rows, lastRefreshed] = await Promise.all([
      getArticlesByCategory(category),
      getLastRefreshed(category),
    ]);

    const articles: Article[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary || "",
      sourceUrl: row.source_url,
      sourceName: row.source_name,
      publishedDate: row.published_date ? row.published_date.toISOString() : null,
      imageUrl: row.image_url,
      category: row.category as CategoryId,
      readTime: row.read_time || 1,
    }));

    return NextResponse.json<NewsApiResponse>({
      articles,
      cached: false,
      fetchedAt: lastRefreshed ? lastRefreshed.toISOString() : new Date().toISOString(),
    });
  } catch (err) {
    console.error("Database query error:", err);
    return NextResponse.json<NewsApiError>(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
