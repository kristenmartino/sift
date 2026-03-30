import { NextRequest, NextResponse } from "next/server";

const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";
const SIFT_API_KEY = process.env.SIFT_API_KEY || "dev-key";

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const res = await fetch(`${SIFT_API_URL}/pipeline/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pipeline-Key": SIFT_API_KEY,
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
      { triggered: false, error: String(err) },
      { status: 502 }
    );
  }
}
