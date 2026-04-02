import { NextRequest, NextResponse } from "next/server";
import { getStoriesWithArticles, getLastRefreshed } from "@/lib/db";
import { stripHtml, sanitizeUrl } from "@/lib/sanitize";
import type { CategoryId, Article, Story, StoryFraming, EntitySet, NewsApiResponse, NewsApiError } from "@/lib/types";

const BAD_SUMMARIES = ["unable to provide summary"];

function cleanSummary(raw: string | null): string {
  if (!raw) return "";
  if (BAD_SUMMARIES.some((b) => raw.toLowerCase().startsWith(b))) return "";
  return stripHtml(raw);
}

function cleanImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  const safe = sanitizeUrl(raw);
  if (!safe) return null;
  try {
    const url = new URL(safe);
    // Contentful CDN (VentureBeat etc): upgrade tiny thumbnails to usable size
    if (url.hostname.includes("ctfassets.net")) {
      url.searchParams.set("w", "800");
      url.searchParams.set("q", "80");
      return url.toString();
    }
    return safe;
  } catch {
    return null;
  }
}

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
    const [{ stories: dbStories, storyArticles, standaloneArticles }, lastRefreshed] = await Promise.all([
      getStoriesWithArticles(category),
      getLastRefreshed(category),
    ]);

    // Map standalone articles
    const articles: Article[] = standaloneArticles.map((row) => ({
      id: row.id,
      title: row.title,
      summary: cleanSummary(row.summary),
      sourceUrl: row.source_url,
      sourceName: row.source_name,
      publishedDate: row.published_date ? row.published_date.toISOString() : null,
      imageUrl: cleanImageUrl(row.image_url),
      category: row.category as CategoryId,
      readTime: row.read_time || 1,
      ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
      ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
    }));

    // Map stories with nested articles
    const stories: Story[] = dbStories.map((s) => {
      const childRows = storyArticles[s.id] || [];
      const childArticles: Article[] = childRows.map((row) => ({
        id: row.id,
        title: row.title,
        summary: cleanSummary(row.summary),
        sourceUrl: row.source_url,
        sourceName: row.source_name,
        publishedDate: row.published_date ? row.published_date.toISOString() : null,
        imageUrl: cleanImageUrl(row.image_url),
        category: row.category as CategoryId,
        readTime: row.read_time || 1,
        ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
        ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
      }));

      // Parse JSONB framings
      const rawFramings = Array.isArray(s.framings) ? s.framings : [];
      const framings: StoryFraming[] = (rawFramings as Record<string, string>[]).map((f) => ({
        sourceName: f.source_name || "",
        framing: f.framing || "",
        tone: (f.tone || "neutral") as StoryFraming["tone"],
      }));

      // Parse JSONB entities
      const rawEntities = Array.isArray(s.entities) ? s.entities : [];
      const entities: EntitySet[] = (rawEntities as Record<string, unknown>[]).map((e) => ({
        people: (e.people as string[]) || [],
        organizations: (e.organizations as string[]) || [],
        locations: (e.locations as string[]) || [],
        eventDescription: (e.event_description as string) || "",
      }));

      return {
        id: s.id,
        headline: s.headline,
        summary: s.summary,
        category: s.category as CategoryId,
        framings,
        entities,
        articleCount: s.article_count,
        imageUrl: cleanImageUrl(s.representative_image_url),
        publishedDate: s.published_date ? s.published_date.toISOString() : null,
        articles: childArticles,
      };
    });

    return NextResponse.json<NewsApiResponse>({
      articles,
      stories,
      cached: false,
      fetchedAt: lastRefreshed ? lastRefreshed.toISOString() : new Date().toISOString(),
    });
  } catch (err) {
    console.error("Database query error:", err);
    return NextResponse.json<NewsApiError>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
