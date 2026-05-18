/**
 * POST /api/primer/expand — record a panel-expand click.
 *
 * Phase 1 primer-funnel instrumentation. The "What you should know
 * first" panel has had three rounds of content iteration with zero
 * signal on whether anyone opens it. This route is the dark-vision
 * gear: every expand fires once; aggregations let us see the rate.
 *
 * Request shape (JSON):
 *   { articleId?: string, surface?: 'feed' | 'bookmarks' }
 *
 * Response: 204 on success; 4xx on bad input; never blocks user
 * experience (client fires-and-forgets).
 *
 * Privacy posture mirrors /api/news/topic (search analytics):
 *   - IPs HMAC-hashed via shared SEARCH_IP_SECRET, never raw
 *   - session_id read from x-sift-session-id header (localStorage)
 *   - UA classified to mobile|desktop|bot|unknown
 *   - Rate-limited per IP + globally to prevent abuse
 */
import { NextRequest, NextResponse } from "next/server";

import {
  classifyUserAgent,
  extractClientIp,
  hashIp,
  isLoggingEnabled,
} from "@/lib/searchAnalytics";
import { logPrimerExpand } from "@/lib/primerAnalyticsLog";
import { rateLimit } from "@/lib/rate-limit";

const VALID_SURFACES = new Set(["feed", "bookmarks"]);

export async function POST(request: NextRequest) {
  // Kill switch: if analytics are disabled (env var), 204 silently.
  // Don't tell the client; the UI doesn't care either way.
  if (!isLoggingEnabled()) {
    return new NextResponse(null, { status: 204 });
  }

  // Rate limit: ~one expand per second per IP is more than humanly
  // reasonable. Global cap prevents a single client from exhausting
  // the global rate budget. Same posture as /api/news/topic.
  const rawIp = extractClientIp(request.headers);
  const ip = rawIp ?? "unknown";
  const perIp = rateLimit(`primer-expand:${ip}`, {
    maxRequests: 60,
    windowMs: 60_000,
  });
  const global = rateLimit("primer-expand:global", {
    maxRequests: 600,
    windowMs: 60_000,
  });
  if (!perIp.allowed || !global.allowed) {
    const retryMs = Math.max(perIp.retryAfterMs, global.retryAfterMs);
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryMs / 1000)) } },
    );
  }

  let body: { articleId?: unknown; surface?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — we still log the event with null fields.
  }

  const articleId =
    typeof body.articleId === "string" && body.articleId.length <= 64
      ? body.articleId
      : null;
  const surface =
    typeof body.surface === "string" && VALID_SURFACES.has(body.surface)
      ? body.surface
      : null;
  const sessionId = request.headers.get("x-sift-session-id");
  const userAgent = request.headers.get("user-agent");

  // Fire-and-forget INSERT. `await` so we surface server-side failures
  // (vs background-promise leaks), but the function itself never
  // throws — failures are caught + logged inside.
  await logPrimerExpand({
    articleId,
    surface,
    sessionId,
    ipHash: hashIp(rawIp),
    userAgentClass: classifyUserAgent(userAgent),
  });

  return new NextResponse(null, { status: 204 });
}
