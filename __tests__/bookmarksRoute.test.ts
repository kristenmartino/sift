/**
 * @jest-environment node
 *
 * Route tests for /api/bookmarks — the signed-in bookmark store.
 *
 * Two shapes share the GET: the id list the client syncs against, and the
 * hydrated `?full=1` article list. Both are per-user, both 401 before the DB,
 * and a failure in either is a reported 500 — an empty `{ ids: [] }` on a
 * broken query would read to the client as "you have no bookmarks".
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn<Promise<{ userId: string | null }>, []>();
const mockGetBookmarks = jest.fn();
const mockGetBookmarkedArticles = jest.fn();
const mockGetOutletProfilesMap = jest.fn();
const mockGetArticleEntityLinks = jest.fn();
const mockAddBookmark = jest.fn();
const mockRemoveBookmark = jest.fn();
const mockEnrich = jest.fn();
const mockReportError = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  getBookmarks: (...args: unknown[]) => mockGetBookmarks(...args),
  getBookmarkedArticles: (...args: unknown[]) => mockGetBookmarkedArticles(...args),
  getOutletProfilesMap: (...args: unknown[]) => mockGetOutletProfilesMap(...args),
  getArticleEntityLinks: (...args: unknown[]) => mockGetArticleEntityLinks(...args),
  addBookmark: (...args: unknown[]) => mockAddBookmark(...args),
  removeBookmark: (...args: unknown[]) => mockRemoveBookmark(...args),
  resolveOutletForSourceName: () => null,
}));

jest.mock("@/lib/civicContext", () => ({
  enrichArticleEntityLinks: (...args: unknown[]) => mockEnrich(...args),
}));

jest.mock("@/lib/observability", () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

import { GET, POST, DELETE } from "@/app/api/bookmarks/route";

const ROW = {
  id: "a1",
  title: "Senate passes the bill",
  summary: "It passed.",
  source_url: "https://example.com/a1",
  source_name: "Reuters",
  image_url: null,
  category: "politics",
  published_date: new Date("2026-08-01T00:00:00.000Z"),
  read_time: 3,
  why_it_matters: "Because.",
  importance_score: 0.5,
  tone: "neutral",
  is_opinion: false,
  is_roundup: false,
  genre: null,
  context_primer: null,
  reading_levels: null,
  created_at: new Date("2026-08-01T00:00:00.000Z"),
};

function get(url = "https://siftnews.io/api/bookmarks"): NextRequest {
  return new NextRequest(url);
}

function mutate(
  method: "POST" | "DELETE",
  body: unknown,
  headers: Record<string, string> = { "sec-fetch-site": "same-origin" },
): NextRequest {
  return new NextRequest("https://siftnews.io/api/bookmarks", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  mockAuth.mockReset().mockResolvedValue({ userId: "user_1" });
  mockGetBookmarks.mockReset().mockResolvedValue(["a1", "a2"]);
  mockGetBookmarkedArticles.mockReset().mockResolvedValue([ROW]);
  mockGetOutletProfilesMap.mockReset().mockResolvedValue(new Map());
  mockGetArticleEntityLinks.mockReset().mockResolvedValue(new Map());
  mockAddBookmark.mockReset().mockResolvedValue(undefined);
  mockRemoveBookmark.mockReset().mockResolvedValue(undefined);
  mockEnrich.mockReset().mockResolvedValue(undefined);
  mockReportError.mockReset();
});

describe("GET /api/bookmarks", () => {
  it("401s without touching the DB when there's no session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await GET(get())).status).toBe(401);
    expect(mockGetBookmarks).not.toHaveBeenCalled();
  });

  it("returns the caller's bookmark ids", async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ids: ["a1", "a2"] });
    expect(mockGetBookmarks).toHaveBeenCalledWith("user_1");
  });

  it("hydrates full articles and enriches their chips with ?full=1", async () => {
    const res = await GET(get("https://siftnews.io/api/bookmarks?full=1"));
    expect(res.status).toBe(200);
    const { articles } = (await res.json()) as {
      articles: Array<{ id: string; sourceName: string }>;
    };
    expect(articles).toHaveLength(1);
    expect(articles[0]).toMatchObject({ id: "a1", sourceName: "Reuters" });
    expect(mockGetArticleEntityLinks).toHaveBeenCalledWith(["a1"]);
    expect(mockEnrich).toHaveBeenCalledTimes(1);
  });

  it("500s and reports rather than reporting an empty bookmark list", async () => {
    mockGetBookmarks.mockRejectedValue(new Error("connection terminated"));
    const res = await GET(get());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Internal server error" });
    expect(mockReportError).toHaveBeenCalledWith("api.bookmarks.GET", expect.any(Error));
  });
});

describe("POST /api/bookmarks", () => {
  it("403s a cross-site request before checking the session", async () => {
    const res = await POST(mutate("POST", { articleId: "a1" }, { "sec-fetch-site": "cross-site" }));
    expect(res.status).toBe(403);
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("401s without a session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await POST(mutate("POST", { articleId: "a1" }))).status).toBe(401);
    expect(mockAddBookmark).not.toHaveBeenCalled();
  });

  it("adds the bookmark for the caller", async () => {
    const res = await POST(mutate("POST", { articleId: "a1" }));
    expect(res.status).toBe(200);
    expect(mockAddBookmark).toHaveBeenCalledWith("user_1", "a1");
  });

  it("400s a body without an articleId", async () => {
    const res = await POST(mutate("POST", {}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "articleId required" });
  });

  it("500s and reports when the write fails", async () => {
    mockAddBookmark.mockRejectedValue(new Error("deadlock detected"));
    expect((await POST(mutate("POST", { articleId: "a1" }))).status).toBe(500);
    expect(mockReportError).toHaveBeenCalledWith("api.bookmarks.POST", expect.any(Error));
  });
});

describe("DELETE /api/bookmarks", () => {
  it("403s a cross-site request", async () => {
    const res = await DELETE(
      mutate("DELETE", { articleId: "a1" }, { "sec-fetch-site": "cross-site" }),
    );
    expect(res.status).toBe(403);
  });

  it("401s without a session", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await DELETE(mutate("DELETE", { articleId: "a1" }))).status).toBe(401);
    expect(mockRemoveBookmark).not.toHaveBeenCalled();
  });

  it("removes the bookmark for the caller", async () => {
    const res = await DELETE(mutate("DELETE", { articleId: "a1" }));
    expect(res.status).toBe(200);
    expect(mockRemoveBookmark).toHaveBeenCalledWith("user_1", "a1");
  });

  it("500s and reports when the delete fails", async () => {
    mockRemoveBookmark.mockRejectedValue(new Error("connection terminated"));
    expect((await DELETE(mutate("DELETE", { articleId: "a1" }))).status).toBe(500);
    expect(mockReportError).toHaveBeenCalledWith("api.bookmarks.DELETE", expect.any(Error));
  });
});
