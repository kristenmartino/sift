import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { reportError } from "@/lib/observability";
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new NextResponse(null, { status: 503 });
  const digest = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${secret}`))) {
    return new NextResponse(null, { status: 401 });
  }
  try {
    const result = await pool.query("DELETE FROM product_events WHERE received_at < now() - interval '90 days'");
    return NextResponse.json({ deleted: result.rowCount });
  } catch {
    reportError("productAnalytics.retention", new Error("cleanup_failed"), { level: "warning" });
    return new NextResponse(null, { status: 503 });
  }
}
