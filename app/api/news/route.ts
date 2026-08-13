import { NextRequest, NextResponse } from "next/server";
import {
  getStoriesWithArticles,
  getLastRefreshed,
  getOutletProfilesMap,
  resolveOutletForSourceName,
  getArticleEntityLinks,
} from "@/lib/db";
import { cleanImageUrl, mapArticleRows } from "@/lib/articleMapping";
import { enrichArticleEntityLinks } from "@/lib/civicContext";
import { VALID_CATEGORIES } from "@/lib/constants";
import { countOccupiedBuckets } from "@/lib/crossSpectrum";
import { stripHtml } from "@/lib/sanitize";
import type { CategoryId, Article, Story, StoryFraming, EntitySet, NewsApiResponse, NewsApiError } from "@/lib/types";

// Contentful-CDN thumbnails (VentureBeat et al) get upsized for the feed's
// card imagery; see lib/articleMapping.ts.
const IMAGE_OPTIONS = { upgradeCdnThumbnails: true } as const;

/**
 * `{ key: n }` when the DB gave a real number, `{}` otherwise.
 *
 * `pg` returns NUMERIC as a string and an aggregate over all-NULL rows as
 * `null`, and `Number(null)` is `0` — which for a ranking multiplier is not
 * "unknown" but "score this zero". Absent beats guessed here: every consumer
 * already has to handle an older payload without the field.
 */
function spreadIfNumber(
  key: string,
  raw: string | number | null | undefined
): Record<string, number> {
  if (raw === null || raw === undefined || raw === "") return {};
  const n = Number(raw);
  return Number.isFinite(n) ? { [key]: n } : {};
}

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
    const articles: Article[] = mapArticleRows(standaloneArticles, {
      outletMap,
      entityLinksMap,
      includeLabels: true,
      image: IMAGE_OPTIONS,
    });

    // Map stories with nested articles
    const stories: Story[] = dbStories.map((s) => {
      const childRows = storyArticles[s.id] || [];
      const childArticles: Article[] = mapArticleRows(childRows, {
        outletMap,
        entityLinksMap,
        image: IMAGE_OPTIONS,
      });

      // (entity-link enrichment runs once across all articles below,
      // before the response is returned — see `enrichArticleEntityLinks`.)

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

      // Ranking v2 stage 1: distinct L/C/R buckets among this story's
      // framings (0-3). The client re-rank applies a small corroboration
      // bonus per bucket beyond the first — cross-spectrum coverage is
      // stronger evidence a story matters than three same-lane outlets.
      // Stage 4: opinion-backed framings don't count toward the spectrum
      // bonus. A framing counts only when its outlet contributed at least
      // one REPORTED member article — op-eds across lanes are disagreement,
      // not corroboration (sift-api#200, overrule pattern one).
      const reportedSources = new Set(
        childRows.filter((r) => !r.is_opinion).map((r) => r.source_name)
      );
      const spectrumBuckets = countOccupiedBuckets(
        framings.filter((f) => reportedSources.has(f.sourceName))
      );

      return {
        id: s.id,
        headline: stripHtml(s.headline),
        summary: stripHtml(s.summary),
        category: s.category as CategoryId,
        framings,
        entities,
        articleCount: s.article_count,
        outletCount: s.outlet_count,
        imageUrl: cleanImageUrl(s.representative_image_url, IMAGE_OPTIONS),
        publishedDate: s.published_date ? s.published_date.toISOString() : null,
        articles: childArticles,
        // A story is grim when at least half its live members are (D48).
        ...(Number(s.grim_share ?? 0) >= 0.5 ? { tone: "grim" as const } : {}),
        // Stage 7: the mean member importance, and the best member the floor
        // may lift the story to. Both are OMITTED rather than defaulted when
        // the query has no number to give — the client re-rank already
        // defines what "no importance signal" means (neutral, floor off), and
        // a second definition here is how the two ends drifted apart: this
        // read `?? 3` while the client read `?? 2.5`, so the same missing
        // value scored 1.2x on one side of the boundary and 1.0x on the other.
        ...spreadIfNumber("avgImportance", s.avg_importance),
        ...spreadIfNumber("maxImportance", s.max_importance),
        ...(Number(s.opinion_share ?? 0) >= 0.5 ? { isOpinion: true } : {}),
        ...(spectrumBuckets > 0 ? { spectrumBuckets } : {}),
      };
    });

    // Phase 3.G.3 — civic-context tooltip enrichment.
    // One batched query across every politician chip on the page (typical
    // homepage: 0-30 chips; we de-dupe by canonical_id inside). Mutates
    // the EntityLink[] references in place so the article objects pick up
    // `civicContext` without us needing to re-thread anything. Tolerant
    // of missing tables (returns silently) — chips still navigate to the
    // right dossier even when enrichment is unavailable.
    await enrichArticleEntityLinks(
      articles,
      stories.flatMap((s) => s.articles),
    );

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
