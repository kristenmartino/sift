import { NextResponse } from "next/server";

import { getDailyCompareExample } from "@/lib/db";

/**
 * The anonymous daily compare example. Public and cheap — one Postgres read
 * of a row that changes once per UTC day, so it gets a long shared cache.
 * Signed-out visitors in /news compare mode fetch this; the landing page
 * reads the same row server-side via lib/db.
 */
export async function GET() {
  const example = await getDailyCompareExample();
  if (!example) {
    return NextResponse.json(
      { error: "No daily example yet" },
      { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }
  return NextResponse.json(example, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
