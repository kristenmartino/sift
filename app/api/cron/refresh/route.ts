import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

import { internalError, unauthorized } from "@/lib/apiResponses";
import { reportError } from "@/lib/observability";
import { SIFT_API_URL } from "@/lib/siftApi";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  // Verify cron secret — always required
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return internalError("Server misconfigured");
  }
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;
  if (!constantTimeEqual(authHeader, expected)) return unauthorized();

  const siftApiKey = process.env.SIFT_API_KEY;
  if (!siftApiKey) {
    console.error("SIFT_API_KEY environment variable is not set");
    return internalError("Server misconfigured");
  }

  try {
    const res = await fetch(`${SIFT_API_URL}/pipeline/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Key": siftApiKey,
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(300_000), // 5 min timeout for full pipeline
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Pipeline returned error:", res.status, data);
      return NextResponse.json(
        { triggered: false, error: data.detail || "Pipeline error", status: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({
      triggered: true,
      timestamp: new Date().toISOString(),
      results: data.results,
      duration_ms: data.duration_ms,
    });
  } catch (err) {
    reportError("api.cron.refresh", err);
    return NextResponse.json(
      { triggered: false, error: "Pipeline trigger failed" },
      { status: 502 }
    );
  }
}
