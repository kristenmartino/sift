import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const SIFT_API_URL = process.env.SIFT_API_URL || "http://localhost:8000";
const COMPARE_TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.topic || typeof body.topic !== "string" || body.topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Topic must be at least 3 characters" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);

    try {
      const res = await fetch(`${SIFT_API_URL}/analyze/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: body.topic.trim(),
          sources: body.sources || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorBody.detail || `Comparison service error (${res.status})` },
          { status: res.status }
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
