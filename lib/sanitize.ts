/**
 * Sanitize untrusted text content (article titles, summaries, source names)
 * by stripping all HTML tags. This prevents stored XSS from external sources
 * like RSS feeds and Claude web search results.
 */
export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&lt;/g, "<")   // Decode common entities for readability
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .trim();
}

/**
 * Validate that a string is a safe HTTP(S) URL.
 * Rejects javascript:, data:, and other dangerous schemes.
 */
export function sanitizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
