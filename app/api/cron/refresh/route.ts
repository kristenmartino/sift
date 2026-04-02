import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";
try {
  const u = new URL(SIFT_API_URL);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
} catch {
  throw new Error(`Invalid SIFT_API_URL: ${SIFT_API_URL}`);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  // Verify cron secret — always required
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;
  if (!constantTimeEqual(authHeader, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siftApiKey = process.env.SIFT_API_KEY;
  if (!siftApiKey) {
    console.error("SIFT_API_KEY environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
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

    return NextResponse.json({
      triggered: true,
      timestamp: new Date().toISOString(),
      results: data.results,
      duration_ms: data.duration_ms,
    });
  } catch (err) {
    console.error("Pipeline trigger failed:", err);
    return NextResponse.json(
      { triggered: false, error: "Pipeline trigger failed" },
      { status: 502 }
    );
  }
}
