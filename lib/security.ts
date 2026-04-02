import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that mutation requests (POST, PUT, DELETE, PATCH) originate
 * from the same site by checking Origin, Referer, and Sec-Fetch-Site headers.
 * Returns null if valid, or a 403 response if the check fails.
 */
export function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  // Sec-Fetch-Site is set by browsers and cannot be spoofed by JS.
  // If present, use it as the primary CSRF check.
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) {
    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      return null;
    }
    // "cross-site" — block
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check Origin header (most reliable after Sec-Fetch-Site)
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

  // No Sec-Fetch-Site, no Origin, no Referer.
  // Non-browser clients (cURL, cron) don't send these headers — allow.
  // Browsers always send at least one of Sec-Fetch-Site or Origin on
  // cross-origin requests, so this path is safe.
  return null;
}
