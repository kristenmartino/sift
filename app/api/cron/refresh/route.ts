import { NextRequest, NextResponse } from "next/server";

const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  // Verify cron secret — always required
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
