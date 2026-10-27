/** @jest-environment node */
import { NextRequest } from "next/server";
const mockMap = jest.fn();
jest.mock("@/lib/db", () => ({ getOutletProfilesMap: () => mockMap(), resolveOutletForSourceName: (map: Map<string, unknown>, name: string) => map.get(name.trim().toLowerCase()) ?? null }));
import { GET } from "@/app/api/compare/outlets/route";
const profile = { name: "Associated Press", allSidesRating: "lean-left", mbfcFactual: "high" };
beforeEach(() => { mockMap.mockReset(); mockMap.mockResolvedValue(new Map([["ap", profile], ["associated press", profile]])); });
it("uses the curated alias map and returns null for an unknown source", async () => {
  const res = await GET(new NextRequest("https://sift.test/api/compare/outlets?source=AP&source=unknown"));
  expect(await res.json()).toEqual({ outlets: { ap: profile, unknown: null } });
  expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
});
it.each(["", "?source=", "?" + new URLSearchParams(Array.from({ length: 6 }, () => ["source", "AP"])).toString(), "?source=" + "a".repeat(201)])("rejects invalid input before reading the DB: %s", async (query) => {
  expect((await GET(new NextRequest("https://sift.test/api/compare/outlets" + query))).status).toBe(400);
  expect(mockMap).not.toHaveBeenCalled();
});
it("does not cache a temporarily unavailable rating map", async () => {
  mockMap.mockResolvedValue(new Map());
  const res = await GET(new NextRequest("https://sift.test/api/compare/outlets?source=AP"));
  expect(res.status).toBe(503);
  expect(res.headers.get("Cache-Control")).toBe("no-store");
});
