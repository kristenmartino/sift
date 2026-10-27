import { compareDraftReturnTo, type CompareDraft } from "./compareDraft";
import type { CompareSource } from "./compareSources";

const REFRESH_KEY = "sift-compare-session-refresh";

/** Refresh navigation lets Clerk renew an expired API cookie without its reader SDK.
 * Only retry a validated, already submitted draft once per minute. Authentication
 * still runs on the destination page and API; signed-out readers never retry.
 */
export function compareSessionRefreshTarget(
  userId: string | null, draft: CompareDraft, choices: readonly CompareSource[],
  storage: Pick<Storage, "getItem" | "setItem">, now = Date.now(),
): string | null {
  if (!userId) return null;
  const target = compareDraftReturnTo(draft, choices);
  if (!target) return null;
  try {
    const previous = JSON.parse(storage.getItem(REFRESH_KEY) ?? "null");
    if (previous && typeof previous.at === "number" && now - previous.at < 60_000) return null;
    storage.setItem(REFRESH_KEY, JSON.stringify({ at: now }));
    return target;
  } catch {
    return null;
  }
}
