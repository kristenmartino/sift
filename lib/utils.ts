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
