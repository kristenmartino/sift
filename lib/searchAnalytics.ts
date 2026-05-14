/**
 * Search-funnel instrumentation — Phase 1 (pure helpers).
 *
 * This module is the testable, DB-free half of the search-analytics
 * surface: query normalization, token counting, user-agent classification,
 * IP hashing, IP extraction, and the kill-switch env-var check. The
 * DB-touching `logSearchQuery` lives in `./searchAnalyticsLog` so jsdom
 * tests can import these pure helpers without dragging in `pg`.
 *
 * Privacy posture (matches /privacy):
 *   - Raw IPs are NEVER stored. We HMAC-SHA256 them with a server-side
 *     secret (`SEARCH_IP_SECRET`); without the secret the field is null.
 *   - Query text IS stored verbatim — needed for top-query rollups and
 *     to build a real eval set for any future retrieval changes.
 *   - 90-day retention via `scripts/cleanup_old_search_queries.py` in
 *     sift-api (run periodically).
 *   - session_id is a localStorage UUID set client-side; not a cookie,
 *     not tied to Clerk auth.
 *
 * Kill switch: set `SEARCH_LOGGING_ENABLED=false` to disable instantly
 * (e.g. if the INSERT ever surfaces DB pressure). Default is enabled.
 */
import { createHmac } from "crypto";

export interface SearchAnalyticsRow {
  query: string;
  queryNorm: string;
  queryTokenCount: number;
  resultCountVector: number;
  resultCountTotal: number;
  fallbackUsed: boolean;
  latencyMsTotal: number;
  latencyMsEmbed?: number | null;
  latencyMsVector?: number | null;
  latencyMsFallback?: number | null;
  sessionId?: string | null;
  ipHash?: string | null;
  userAgentClass?: string | null;
  matchedEntityType?: string | null;
  matchedEntityId?: string | null;
}

/**
 * Normalize a raw query string for top-query GROUP BY rollups.
 *   "  Schumer's STANCE  " → "schumer's stance"
 */
export function normalizeQuery(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Rough word-count of the normalized query. Used as a "name vs question"
 * signal in analytics (1-3 tokens trend entity-lookup; 5+ trends long-form).
 */
export function countTokens(normalized: string): number {
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

/**
 * Coarse User-Agent classifier — three buckets that matter for product
 * decisions, plus an unknown bucket. Deliberately permissive on the bot
 * regex so crawlers don't poison the "what humans search for" signal.
 */
export function classifyUserAgent(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const u = ua.toLowerCase();
  if (/bot|crawl|spider|scrape|http-client|wget|curl|python-requests/.test(u)) {
    return "bot";
  }
  if (/mobile|android|iphone|ipad|opera mini/.test(u)) {
    return "mobile";
  }
  if (/mozilla|chrome|safari|edge|firefox/.test(u)) {
    return "desktop";
  }
  return "unknown";
}

/**
 * HMAC-SHA256(ip, server_secret). Returns null when no secret is configured
 * — we'd rather drop the field than expose raw IPs by accident. The hash
 * is deterministic for a given (ip, secret), so analytics queries can still
 * count distinct IPs across rows without learning what those IPs are.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const secret = process.env.SEARCH_IP_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

/**
 * Server-side feature flag. Setting SEARCH_LOGGING_ENABLED=false in the
 * environment turns this off in a redeploy. Default is on.
 */
export function isLoggingEnabled(): boolean {
  return process.env.SEARCH_LOGGING_ENABLED !== "false";
}

/**
 * Extract the most trustworthy client IP from the request headers. Prefers
 * `x-real-ip` (set by Vercel / reverse proxy) over `x-forwarded-for` (which
 * a user can spoof on direct requests).
 */
export function extractClientIp(headers: Headers): string | null {
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  );
}
