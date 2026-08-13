/**
 * @jest-environment node
 *
 * Route tests for GET /api/compare/daily — the signed-out door onto one
 * real comparison a day.
 *
 * Two things matter here and neither is visible from the payload: the
 * caching headers (the row changes once per UTC day, so a hit must be
 * shared and long-lived, and the 404 must be cached briefly rather than
 * hammering Postgres before the first generation lands) and the 404 shape
 * the client branches on.
 */
import type { DailyCompareExample } from "@/lib/types";

const mockGetDailyCompareExample = jest.fn<
  Promise<DailyCompareExample | null>,
  []
>();

jest.mock("@/lib/db", () => ({
  getDailyCompareExample: () => mockGetDailyCompareExample(),
}));

import { GET } from "@/app/api/compare/daily/route";

const EXAMPLE: DailyCompareExample = {
  topic: "Federal Reserve rate decision",
  comparison: "Three outlets, three emphases.",
  sources_checked: ["Reuters", "Wall Street Journal", "Fox Business"],
  claims: [],
  duration_ms: 12_400,
  generatedAt: "2026-08-12T00:00:00.000Z",
};

beforeEach(() => {
  mockGetDailyCompareExample.mockReset();
});

describe("GET /api/compare/daily", () => {
  it("returns the example as-is", async () => {
    mockGetDailyCompareExample.mockResolvedValue(EXAMPLE);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(EXAMPLE);
  });

  it("caches a hit at the shared edge for 15 minutes, stale for an hour", async () => {
    mockGetDailyCompareExample.mockResolvedValue(EXAMPLE);
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=900, stale-while-revalidate=3600",
    );
  });

  it("404s with a short cache when no example has been generated yet", async () => {
    mockGetDailyCompareExample.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "No daily example yet" });
    expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=300");
  });

  it("reads once per request — no in-route memoization to go stale", async () => {
    mockGetDailyCompareExample.mockResolvedValue(EXAMPLE);
    await GET();
    await GET();
    expect(mockGetDailyCompareExample).toHaveBeenCalledTimes(2);
  });

  it("propagates a DB failure rather than serving an empty comparison", async () => {
    mockGetDailyCompareExample.mockRejectedValue(new Error("connection refused"));
    await expect(GET()).rejects.toThrow("connection refused");
  });
});
