import { NextRequest, NextResponse } from "next/server";
import { productEventSchema } from "@/lib/productAnalyticsSchema";
import { logProductEvent } from "@/lib/productAnalyticsLog";
import { classifyUserAgent, extractClientIp, hashIp } from "@/lib/searchAnalytics";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (process.env.PRODUCT_ANALYTICS_ENABLED !== "true" || request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") {
    return new NextResponse(null, { status: 204 });
  }
  // Unlike public read APIs, this write endpoint accepts only same-origin browsers.
  const origin = request.headers.get("origin");
  try {
    const parsedOrigin = new URL(origin ?? "");
    // Next normalizes 127.0.0.1 to localhost internally in development.
    // The browser's Host header retains the actual public host on both local and Vercel requests.
    if (parsedOrigin.host !== (request.headers.get("host") ?? request.nextUrl.host) ||
        parsedOrigin.protocol !== request.nextUrl.protocol) return new NextResponse(null, { status: 403 });
  } catch { return new NextResponse(null, { status: 403 }); }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new NextResponse(null, { status: 415 });
  if (Number(request.headers.get("content-length")) > 4096) return new NextResponse(null, { status: 413 });
  const key = hashIp(extractClientIp(request.headers)) ?? "unknown";
  if (!rateLimit(`product-events:${key}`, { maxRequests: 120, windowMs: 60000 }).allowed ||
      !rateLimit("product-events:global", { maxRequests: 3000, windowMs: 60000 }).allowed) {
    return new NextResponse(null, { status: 429 });
  }
  let event;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4096) return new NextResponse(null, { status: 413 });
    const parsed = productEventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return new NextResponse(null, { status: 400 });
    event = parsed.data;
  } catch { return new NextResponse(null, { status: 400 }); }
  const age = Date.now() - Date.parse(event.occurredAt);
  if (age < -5 * 60000 || age > 24 * 60 * 60000) return new NextResponse(null, { status: 400 });
  const ua = classifyUserAgent(request.headers.get("user-agent"));
  const environment = process.env.VERCEL_ENV === "production" ? "production"
    : process.env.VERCEL_ENV === "preview" ? "preview" : "development";
  const internalIds = new Set((process.env.PRODUCT_ANALYTICS_INTERNAL_BROWSER_IDS ?? "").split(",").map(x => x.trim()).filter(Boolean));
  const result = await logProductEvent(event, { environment,
    isInternal: environment !== "production" || event.internal || internalIds.has(event.browserId),
    trafficClass: ua === "bot" ? "bot" : ua === "unknown" ? "unknown" : "browser" });
  if (result === "unavailable") return new NextResponse(null, { status: 503 });
  if (result === "conflict") return new NextResponse(null, { status: 409 });
  return new NextResponse(null, { status: 204 });
}
