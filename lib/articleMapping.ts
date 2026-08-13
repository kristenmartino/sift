/**
 * DB row → `Article` mapping, shared by every read surface that returns
 * articles: /api/news, /api/news/topic, /api/bookmarks and the outlet dossier
 * page. Each of those carried its own copy of the same twenty-line object
 * literal, so a new column meant four edits and a field silently missing from
 * whichever copy was forgotten.
 *
 * The optional fields are spread conditionally rather than set to undefined —
 * the API contract is "absent when unknown", which the client distinguishes
 * from an explicit null (see lib/types.ts).
 */
import { resolveOutletForSourceName } from "./db";
import type { DbArticle } from "./db";
import { parseEntityLinks } from "./entityLinks";
import { attachPrimerTermLinks, parseContextPrimer } from "./primer";
import { sanitizeUrl, stripHtml } from "./sanitize";
import type { Article, ArticleTone, CategoryId, EntityLink, OutletProfile } from "./types";

const BAD_SUMMARIES = ["unable to provide summary"];

/** Drops pipeline apology text and strips HTML from external summary copy. */
export function cleanSummary(raw: string | null): string {
  if (!raw) return "";
  if (BAD_SUMMARIES.some((b) => raw.toLowerCase().startsWith(b))) return "";
  return stripHtml(raw);
}

export interface CleanImageOptions {
  /**
   * Rewrite Contentful CDN URLs (VentureBeat et al) to a usable width. Their
   * feeds ship 300px thumbnails that look broken in a card.
   */
  upgradeCdnThumbnails?: boolean;
}

/** Rejects non-HTTP(S) schemes; optionally upsizes known CDN thumbnails. */
export function cleanImageUrl(
  raw: string | null,
  { upgradeCdnThumbnails = false }: CleanImageOptions = {}
): string | null {
  if (!raw) return null;
  const safe = sanitizeUrl(raw);
  if (!safe || !upgradeCdnThumbnails) return safe;
  try {
    const url = new URL(safe);
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

function isArticleTone(v: unknown): v is ArticleTone {
  return v === "grim" || v === "neutral" || v === "light";
}

export interface MapArticleRowOptions {
  outlet?: OutletProfile | null;
  entityLinks?: EntityLink[];
  /**
   * Include the ranking/labelling columns (tone, is_opinion, is_roundup,
   * genre). Only the feed's standalone articles carry them — the bookmark and
   * vector-search queries don't select those columns.
   */
  includeLabels?: boolean;
  /** Text/image cleaners. Off for surfaces that trust already-stored copy. */
  clean?: boolean;
  image?: CleanImageOptions;
}

/** Maps one article row, resolving its primer against the given entity links. */
export function mapArticleRow(
  row: DbArticle,
  { outlet = null, entityLinks = [], includeLabels = false, clean = true, image }: MapArticleRowOptions = {}
): Article {
  // Phase 3.G.4 — link primer terms to dossiers when their text contains a
  // curated entity surface form (FCC, Schumer, IRA, etc.).
  const primer = attachPrimerTermLinks(parseContextPrimer(row.context_primer), entityLinks);
  return {
    id: row.id,
    title: row.title,
    summary: clean ? cleanSummary(row.summary) : row.summary || "",
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    publishedDate: row.published_date ? row.published_date.toISOString() : null,
    imageUrl: clean ? cleanImageUrl(row.image_url, image) : row.image_url,
    category: row.category as CategoryId,
    readTime: row.read_time || 1,
    ...(row.why_it_matters ? { whyItMatters: row.why_it_matters } : {}),
    ...(row.importance_score ? { importanceScore: row.importance_score } : {}),
    ...(includeLabels && isArticleTone(row.tone) ? { tone: row.tone } : {}),
    ...(includeLabels && row.is_opinion ? { isOpinion: true } : {}),
    ...(includeLabels && row.is_roundup ? { isRoundup: true } : {}),
    ...(includeLabels && row.genre && row.genre !== "news"
      ? { genre: row.genre as "feature" | "soft" }
      : {}),
    ...(primer ? { contextPrimer: primer } : {}),
    ...(outlet ? { outlet } : {}),
    ...(entityLinks.length > 0 ? { entityLinks } : {}),
  };
}

export interface MapArticleRowsOptions extends Omit<MapArticleRowOptions, "outlet" | "entityLinks"> {
  /** Curated outlet provenance, keyed by lowercased source-name alias. */
  outletMap?: Map<string, OutletProfile>;
  /** Raw entity_links JSONB per article id, as returned by getArticleEntityLinks. */
  entityLinksMap?: Map<string, unknown>;
}

/** Maps a batch of rows, resolving outlet + entity links for each. */
export function mapArticleRows(
  rows: DbArticle[],
  { outletMap, entityLinksMap, ...options }: MapArticleRowsOptions = {}
): Article[] {
  return rows.map((row) =>
    mapArticleRow(row, {
      ...options,
      outlet: outletMap ? resolveOutletForSourceName(outletMap, row.source_name) : null,
      entityLinks: entityLinksMap ? parseEntityLinks(entityLinksMap.get(row.id)) : [],
    })
  );
}
