import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { reportError } from "@/lib/observability";
import { rateLimit } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/security";
import { SIFT_API_KEY, SIFT_API_URL } from "@/lib/siftApi";
import {
  parseJsonBody,
  tooManyRequests,
  unauthorized,
} from "@/lib/apiResponses";

// The compare workflow runs ~20–30s (up to ~90s on the backend), far past
// Vercel's ~10s default function timeout — without this the proxy is killed by
// the platform before a real comparison returns. Raise it to the Hobby max so
// the proxy can actually wait, and abort the upstream fetch a few seconds under
// that cap so the client gets a clean 504 instead of a platform timeout.
export const maxDuration = 60; // seconds — Vercel Hobby maximum
const COMPARE_TIMEOUT_MS = 55_000; // abort upstream just under maxDuration

const compareSchema = z.object({
  topic: z.string().min(3).max(500),
  sources: z.array(z.string().max(200)).max(5).optional(),
});

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  // Rate limit: 5 comparisons per minute per user
  const rl = rateLimit(`compare:${userId}`, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) return tooManyRequests(rl.retryAfterMs);

  try {
    const { data: body, response } = await parseJsonBody(
      request,
      compareSchema,
      "Topic must be 3-500 characters"
    );
    if (response) return response;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

    // Streaming pass-through: when the client asks for SSE, pipe the
    // backend's /stream variant straight down (same wire format as the topic
    // route). Errors before the stream opens (401/429/503) still surface as
    // normal JSON below. Once piping starts the 55s timer is cleared by the
    // finally — a hung upstream is then bounded by maxDuration (60s), and
    // the backend's own 50s ceiling ends healthy streams well before either.
    const wantsStream =
      request.headers.get("accept")?.includes("text/event-stream") ?? false;

    try {
      const upstreamPath = wantsStream
        ? "/v1/analyze/compare/stream"
        : "/v1/analyze/compare";
      const res = await fetch(`${SIFT_API_URL}${upstreamPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pipeline-Key": SIFT_API_KEY,
        },
        body: JSON.stringify({
          topic: body.topic.trim(),
          sources: body.sources || undefined,
        }),
        signal: controller.signal,
      });

      if (wantsStream && res.ok && res.body) {
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }

      clearTimeout(timeout);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        // The upstream `detail` can embed connection strings, so it stays in
        // the server log and out of the Sentry event (and the response body —
        // see __tests__/compare.test.ts).
        console.error("Compare service detail:", errorBody.detail);
        reportError("api.compare.upstream", new Error(`compare service ${res.status}`), {
          extra: { status: res.status },
        });
        const status = res.status >= 400 && res.status < 500 ? 400 : 502;
        return NextResponse.json(
          { error: "Comparison service unavailable" },
          { status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Comparison timed out. Try a more specific topic." },
        { status: 504 }
      );
    }
    reportError("api.compare.proxy", err);
    return NextResponse.json(
      { error: "Failed to connect to comparison service" },
      { status: 502 }
    );
  }
}
