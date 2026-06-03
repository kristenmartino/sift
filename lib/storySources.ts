// Per-outlet source units for clustered stories — joins a story's synthesized
// framings with its underlying articles so the StoryCard can render ONE row per
// outlet carrying everything that matters: provenance (lean + factual), how the
// outlet framed the story, and a link to its actual headline(s).
//
// Pure + framework-free so the join + spread logic is unit-testable on its own;
// StoryCard / SourceRow stay declarative. See components/SourceRow.tsx.

import { bucketize, type CrossSpectrumBucket } from "./crossSpectrum";
import type { Article, OutletAllSidesRating, StoryFraming } from "./types";

/**
 * One outlet's complete contribution to a clustered story.
 *   - `framing`   : the LLM-synthesized "how they framed it" line, or null when
 *                   this source has no framing (it only contributed article(s)).
 *   - `articles`  : every article this outlet published in the cluster, newest
 *                   first. `articles[0]` is the representative headline.
 */
export interface SourceUnit {
  sourceName: string;
  outlet: Article["outlet"];
  framing: string | null;
  articles: Article[];
}

/** ms since epoch for an article's publish date; missing/invalid sorts last. */
function publishedMs(a: Article): number {
  if (!a.publishedDate) return -Infinity;
  const t = Date.parse(a.publishedDate);
  return Number.isNaN(t) ? -Infinity : t;
}

/** Newest-first, stable for equal timestamps. */
function byNewest(a: Article, b: Article): number {
  return publishedMs(b) - publishedMs(a);
}

/**
 * Build one SourceUnit per outlet for a clustered story.
 *
 * Framed sources come first, in the framings' original (LLM-chosen) order,
 * de-duped by sourceName so a single outlet that published several near-
 * duplicate articles is never counted as multiple outlets. Sources that only
 * contributed articles (no framing) follow, in first-appearance order, so no
 * article is ever dropped from the card.
 *
 * The outlet profile is taken from the framing when present, else from the
 * source's first article — both resolve through the same source_name_aliases
 * path at the API boundary, so they agree when both exist.
 */
export function buildSourceUnits(
  framings: StoryFraming[],
  articles: Article[],
): SourceUnit[] {
  // Group articles by source, newest-first within each source.
  const articlesBySource = new Map<string, Article[]>();
  for (const article of articles) {
    const list = articlesBySource.get(article.sourceName);
    if (list) list.push(article);
    else articlesBySource.set(article.sourceName, [article]);
  }
  for (const list of articlesBySource.values()) list.sort(byNewest);

  const units: SourceUnit[] = [];
  const sourcesSeen = new Set<string>();

  // 1) Framed sources, de-duped, in framing order.
  for (const framing of framings) {
    if (sourcesSeen.has(framing.sourceName)) continue;
    sourcesSeen.add(framing.sourceName);
    const srcArticles = articlesBySource.get(framing.sourceName) ?? [];
    units.push({
      sourceName: framing.sourceName,
      outlet: framing.outlet ?? srcArticles[0]?.outlet ?? null,
      framing: framing.framing,
      articles: srcArticles,
    });
  }

  // 2) Sources that only contributed articles (no framing), first-seen order.
  for (const article of articles) {
    if (sourcesSeen.has(article.sourceName)) continue;
    sourcesSeen.add(article.sourceName);
    units.push({
      sourceName: article.sourceName,
      outlet: article.outlet ?? null,
      framing: null,
      articles: articlesBySource.get(article.sourceName) ?? [],
    });
  }

  return units;
}

/**
 * Count of source units per political-lean bucket — the at-a-glance "coverage
 * spread" cue. `unknown` = no resolved outlet, or an outlet whose AllSides
 * rating is mixed/absent (i.e. not placeable on the L/C/R axis). NEUTRAL by
 * construction: positions, never hues (SIFT_THEME_MIGRATION.md §3).
 */
export interface LeanSpread {
  left: number;
  center: number;
  right: number;
  unknown: number;
  /** Distinct buckets with at least one outlet (excludes `unknown`). */
  bucketsCovered: number;
  total: number;
}

export function leanSpreadFromRatings(
  ratings: (OutletAllSidesRating | null | undefined)[],
): LeanSpread {
  const spread: LeanSpread = {
    left: 0,
    center: 0,
    right: 0,
    unknown: 0,
    bucketsCovered: 0,
    total: ratings.length,
  };
  for (const rating of ratings) {
    const bucket: CrossSpectrumBucket | null = bucketize(rating);
    if (bucket) spread[bucket] += 1;
    else spread.unknown += 1;
  }
  spread.bucketsCovered =
    (spread.left > 0 ? 1 : 0) +
    (spread.center > 0 ? 1 : 0) +
    (spread.right > 0 ? 1 : 0);
  return spread;
}

/** Spread across a story's source units (one entry per outlet). */
export function summarizeLeanSpread(units: SourceUnit[]): LeanSpread {
  return leanSpreadFromRatings(units.map((u) => u.outlet?.allSidesRating));
}
