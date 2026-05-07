/**
 * Estimate reading time in minutes from text content.
 * Handles empty/whitespace-only strings correctly.
 */
export function estimateReadTime(text: string | undefined | null): number {
  if (!text || !text.trim()) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago").
 */
export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Recently";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return "Recently";
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Extract a display-friendly domain name from a URL.
 * "https://www.reuters.com/article/123" -> "Reuters"
 */
export function extractSourceDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "News";
  }
}

/**
 * Generate a stable hash from a string.
 * Used for deterministic article IDs that survive refresh.
 */
export function stableHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format a USD amount compactly for narrow columns: "$574K", "$1.5M".
 *
 * - Below $10,000: full locale string with commas, e.g. "$7,470"
 * - $10K to <$1M: rounded to the nearest thousand, e.g. "$574K"
 * - $1M and up: rounded to one decimal of millions, e.g. "$1.5M" or "$1M"
 *
 * Returns "" for null/undefined, non-finite, or negative input — the
 * dossier hides the column entirely in those cases anyway.
 */
export function formatUsdCompact(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return "";
  if (amount < 10_000) return `$${amount.toLocaleString("en-US")}`;
  if (amount < 1_000_000) {
    const k = Math.round(amount / 1_000);
    // Guard the rounding bump: e.g. $999,750 → 1000K — promote to "$1M"
    if (k >= 1000) return "$1M";
    return `$${k}K`;
  }
  return `$${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
