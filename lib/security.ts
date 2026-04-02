import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that mutation requests (POST, PUT, DELETE, PATCH) originate
 * from the same site by checking the Origin or Referer header.
 * Returns null if valid, or a 403 response if the check fails.
 */
export function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check Origin header first (most reliable)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return null;
    } catch {
      // invalid origin
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return null;
    } catch {
      // invalid referer
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // No Origin or Referer — allow for non-browser clients (cURL, cron, etc.)
  // Browsers always send Origin on cross-origin requests
  return null;
}
