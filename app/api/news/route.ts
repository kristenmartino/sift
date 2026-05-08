import { NextRequest, NextResponse } from "next/server";
import {
  getStoriesWithArticles,
  getLastRefreshed,
  getOutletProfilesMap,
  resolveOutletForSourceName,
  getArticleEntityLinks,
} from "@/lib/db";
import { parseContextPrimer, attachPrimerTermLinks } from "@/lib/primer";
import { parseEntityLinks } from "@/lib/entityLinks";
import { enrichLinksWithContext } from "@/lib/civicContext";
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
    const [{ stories: dbStories, storyArticles, standaloneArticles }, lastRefreshed, outletMap] =
      await Promise.all([
        getStoriesWithArticles(category),
        getLastRefreshed(category),
        getOutletProfilesMap(),
      ]);

    // Phase 3.H: batch-fetch entity_links JSONB for every article touched
    // by this request, in one query. Defensive: returns an empty Map if
    // the column doesn't exist yet (pre-Phase-3.G prod).
    const allArticleIds = [
      ...standaloneArticles.map((r) => r.id),
      ...Object.values(storyArticles).flat().map((r) => r.id),
    ];
    const entityLinksMap = await getArticleEntityLinks(allArticleIds);

    // Map standalone articles
    const articles: Article[] = standaloneArticles.map((row) => {
      const rawPrimer = parseContextPrimer(row.context_primer);
      const outlet = resolveOutletForSourceName(outletMap, row.source_name);
      const entityLinks = parseEntityLinks(entityLinksMap.get(row.id));
      // Phase 3.G.4 — link primer terms to dossiers when their text
      // contains a curated entity surface form (FCC, Schumer, IRA, etc.).
      const primer = attachPrimerTermLinks(rawPrimer, entityLinks);
      return {
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
        ...(primer ? { contextPrimer: primer } : {}),
        ...(outlet ? { outlet } : {}),
        ...(entityLinks.length > 0 ? { entityLinks } : {}),
      };
    });

    // Map stories with nested articles
    const stories: Story[] = dbStories.map((s) => {
      const childRows = storyArticles[s.id] || [];
      const childArticles: Article[] = childRows.map((row) => {
        const rawPrimer = parseContextPrimer(row.context_primer);
        const outlet = resolveOutletForSourceName(outletMap, row.source_name);
        const entityLinks = parseEntityLinks(entityLinksMap.get(row.id));
        const primer = attachPrimerTermLinks(rawPrimer, entityLinks);
        return {
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
          ...(primer ? { contextPrimer: primer } : {}),
          ...(outlet ? { outlet } : {}),
          ...(entityLinks.length > 0 ? { entityLinks } : {}),
        };
      });

      // (entity-link enrichment runs once across all articles below,
      // before the response is returned — see `enrichLinksWithContext`.)

      // Parse JSONB framings (validate types, sanitize external text)
      const rawFramings = Array.isArray(s.framings) ? s.framings : [];
      const framings: StoryFraming[] = (rawFramings as unknown[])
        .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
        .map((f) => {
          const sourceName = stripHtml(String(f.source_name ?? ""));
          const outlet = resolveOutletForSourceName(outletMap, sourceName);
          return {
            sourceName,
            framing: stripHtml(String(f.framing ?? "")),
            tone: (typeof f.tone === "string" ? f.tone : "neutral") as StoryFraming["tone"],
            ...(outlet ? { outlet } : {}),
          };
        });

      // Parse JSONB entities (validate types, sanitize external text)
      const rawEntities = Array.isArray(s.entities) ? s.entities : [];
      const toStrings = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").map(stripHtml) : [];
      const entities: EntitySet[] = (rawEntities as unknown[])
        .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
        .map((e) => ({
          people: toStrings(e.people),
          organizations: toStrings(e.organizations),
          locations: toStrings(e.locations),
          eventDescription: stripHtml(String(e.event_description ?? "")),
        }));

      return {
        id: s.id,
        headline: stripHtml(s.headline),
        summary: stripHtml(s.summary),
        category: s.category as CategoryId,
        framings,
        entities,
        articleCount: s.article_count,
        imageUrl: cleanImageUrl(s.representative_image_url),
        publishedDate: s.published_date ? s.published_date.toISOString() : null,
        articles: childArticles,
      };
    });

    // Phase 3.G.3 — civic-context tooltip enrichment.
    // One batched query across every politician chip on the page (typical
    // homepage: 0-30 chips; we de-dupe by canonical_id inside). Mutates
    // the EntityLink[] references in place so the article objects pick up
    // `civicContext` without us needing to re-thread anything. Tolerant
    // of missing tables (returns silently) — chips still navigate to the
    // right dossier even when enrichment is unavailable.
    const allLinks = [
      ...articles.flatMap((a) => a.entityLinks ?? []),
      ...stories.flatMap((s) => s.articles.flatMap((a) => a.entityLinks ?? [])),
    ];
    if (allLinks.length > 0) {
      try {
        await enrichLinksWithContext(allLinks);
      } catch (err) {
        // Don't break the feed if enrichment fails — chips just render
        // without tooltips.
        console.warn("civicContext enrichment failed:", err);
      }
    }

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
