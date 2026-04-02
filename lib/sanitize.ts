/**
 * Sanitize untrusted text content (article titles, summaries, source names)
 * by stripping all HTML tags. This prevents stored XSS from external sources
 * like RSS feeds and Claude web search results.
 *
 * Order of operations matters:
 * 1. Decode HTML entities first (so &lt;script&gt; becomes <script>)
 * 2. Strip all HTML tags (removes <script> and any other tags)
 * 3. Result is plain text safe for storage and rendering
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function stripHtml(text: string): string {
  // Decode entities first so encoded tags become real tags
  const decoded = decodeEntities(text);
  // Then strip all tags from the decoded result
  return decoded.replace(/<[^>]*>/g, "").trim();
}

/**
 * Validate that a string is a safe HTTP(S) URL.
 * Rejects javascript:, data:, vbscript:, and other dangerous schemes.
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
