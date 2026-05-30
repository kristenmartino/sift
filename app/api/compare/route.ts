import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/security";

const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";
try {
  const u = new URL(SIFT_API_URL);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
} catch {
  throw new Error(`Invalid SIFT_API_URL: ${SIFT_API_URL}`);
}
const SIFT_API_KEY = process.env.SIFT_API_KEY || "";
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
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 comparisons per minute per user
  const rl = rateLimit(`compare:${userId}`, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    let body: z.infer<typeof compareSchema>;
    try {
      body = compareSchema.parse(await request.json());
    } catch {
      return NextResponse.json(
        { error: "Topic must be 3-500 characters" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

    try {
      const res = await fetch(`${SIFT_API_URL}/v1/analyze/compare`, {
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

      clearTimeout(timeout);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error("Compare service error:", res.status, errorBody.detail);
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
    console.error("Compare proxy error:", err);
    return NextResponse.json(
      { error: "Failed to connect to comparison service" },
      { status: 502 }
    );
  }
}
