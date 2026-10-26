import { articleContentLabel } from "./articlePresentation";
import { parseContextPrimer } from "./primer";

interface LandingCandidate {
  source_url: string;
  published_date: Date | string | null;
  context_primer: unknown;
  is_opinion?: boolean;
  is_roundup?: boolean;
  genre?: string | null;
}

/** Choose among a bounded, already-ranked pool, preserving its order on ties. */
export function selectLandingArticle<T extends LandingCandidate>(
  rows: readonly T[],
  now = Date.now(),
): T | null {
  const eligible = rows.filter((row) => {
    try {
      const url = new URL(row.source_url);
      if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    } catch { return false; }
    const label = articleContentLabel({
      sourceUrl: row.source_url,
      isOpinion: row.is_opinion,
      isRoundup: row.is_roundup,
      genre: row.genre === "feature" || row.genre === "soft" ? row.genre : "news",
    });
    if (label === "Opinion" || label === "Digest") return false;
    if (row.published_date === null) return true;
    const published = new Date(row.published_date).getTime();
    return Number.isFinite(published) && published <= now && published >= now - 30 * 86_400_000;
  });
  const recent = eligible.filter((row) => row.published_date !== null &&
    new Date(row.published_date).getTime() >= now - 7 * 86_400_000);
  return recent.find((row) => Boolean(parseContextPrimer(row.context_primer)?.background.trim()))
    ?? recent[0] ?? eligible[0] ?? null;
}

/** Public demos use a known, nonfuture publisher date within seven days. */
export function isRecentLandingPublication(date: Date | string | null, now = Date.now()): boolean {
  const published = date === null ? NaN : new Date(date).getTime();
  return Number.isFinite(published) && published <= now && published >= now - 7 * 86_400_000;
}
