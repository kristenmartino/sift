import { COMPARE_SOURCES } from "./constants";

export interface CompareDraft {
  topic: string;
  sources: string[];
}

/** Encode only a complete supported draft; never substitute a different topic. */
export function compareDraftReturnTo({ topic, sources }: CompareDraft): string | null {
  const trimmed = topic.trim();
  if (trimmed.length < 3 || trimmed.length > 200 || sources.length < 2 || sources.length > 5
    || new Set(sources).size !== sources.length
    || sources.some((key) => !COMPARE_SOURCES.some((source) => source.key === key))) return null;
  return `/news?${new URLSearchParams({ compare: trimmed, sources: sources.join(",") }).toString()}`;
}

export function compareDraftSignInHref(draft: CompareDraft): string | null {
  const returnTo = compareDraftReturnTo(draft);
  return returnTo ? `/sign-in?${new URLSearchParams({ redirect_url: returnTo }).toString()}` : null;
}
