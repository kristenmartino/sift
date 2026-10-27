import { NextRequest, NextResponse } from "next/server";
import { getOutletProfilesMap, resolveOutletForSourceName } from "@/lib/db";
import { badRequest } from "@/lib/apiResponses";

/** Read-only curated ratings for Compare, including outlets absent from the feed. */
export async function GET(request: NextRequest) {
  const sources = request.nextUrl.searchParams.getAll("source");
  if (!sources.length || sources.length > 5 || sources.some((source) => !source.trim() || source.length > 200)) {
    return badRequest("Provide one to five source names, each 1–200 characters");
  }
  const outletMap = await getOutletProfilesMap();
  if (!outletMap.size) return NextResponse.json({ error: "Outlet ratings unavailable" }, {
    status: 503, headers: { "Cache-Control": "no-store" },
  });
  const outlets = Object.fromEntries(sources.map((source) => [
    source.trim().toLowerCase(), resolveOutletForSourceName(outletMap, source),
  ]));
  return NextResponse.json({ outlets }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=3600" },
  });
}
