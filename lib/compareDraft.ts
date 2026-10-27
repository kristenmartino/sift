import { COMPARE_SOURCES } from "./constants";
import { resolveCompareSource, type CompareSource } from "./compareSources";

export interface CompareDraft {
  topic: string;
  sources: string[];
}

/** Encode only a complete supported draft; never substitute a different topic. */
export function compareDraftReturnTo({ topic, sources }: CompareDraft, choices: readonly CompareSource[] = COMPARE_SOURCES): string | null {
  const trimmed = topic.trim();
  if (trimmed.length < 3 || trimmed.length > 200 || sources.length < 2 || sources.length > 5
    || new Set(sources).size !== sources.length
    || sources.some((key) => !resolveCompareSource(key, choices))) return null;
  const keys = sources.map((key) => resolveCompareSource(key, choices)!.key);
  if (new Set(keys).size !== keys.length) return null;
  return `/news?${new URLSearchParams({ compare: trimmed, sources: keys.join(",") }).toString()}`;
}

export function compareDraftSignInHref(draft: CompareDraft, choices: readonly CompareSource[] = COMPARE_SOURCES): string | null {
  const returnTo = compareDraftReturnTo(draft, choices);
  return returnTo ? `/sign-in?${new URLSearchParams({ redirect_url: returnTo }).toString()}` : null;
}
