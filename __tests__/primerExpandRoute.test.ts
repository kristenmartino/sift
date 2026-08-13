/**
 * @jest-environment node
 *
 * Route tests for POST /api/primer/expand — the primer-funnel beacon.
 *
 * The route's job is to be unbreakable from the client's side: a malformed
 * body, a missing session header, or a dead analytics table all still end
 * in 204, because the client fires and forgets while the panel opens. The
 * only non-204 is the rate limiter. Input validation is the other half —
 * `surface` is an allow-list and `articleId` is length-capped, so a client
 * can't write arbitrary strings into the analytics table.
 *
 * The DB writer (`logPrimerExpand`) is mocked; its own behavior is covered
 * in __tests__/analyticsLog.test.ts.
 */
import { NextRequest } from "next/server";

const mockLogPrimerExpand = jest.fn<Promise<string | null>, [unknown]>();

jest.mock("@/lib/primerAnalyticsLog", () => ({
  logPrimerExpand: (row: unknown) => mockLogPrimerExpand(row),
}));

import { POST } from "@/app/api/primer/expand/route";

const ORIGINAL_FLAG = process.env.SEARCH_LOGGING_ENABLED;
const ORIGINAL_SECRET = process.env.SEARCH_IP_SECRET;

/**
 * The limiter's window is module-global and shared across tests, so each
 * request uses a distinct IP to stay well inside the 60/min per-IP budget.
 * The global 600/min cap is far above this suite's request count.
 */
let ipCounter = 0;

function post(
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  ipCounter += 1;
  return POST(
    new NextRequest("https://siftnews.io/api/primer/expand", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": `10.0.0.${ipCounter}`,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  mockLogPrimerExpand.mockReset();
  mockLogPrimerExpand.mockResolvedValue("row-id");
  delete process.env.SEARCH_LOGGING_ENABLED;
  delete process.env.SEARCH_IP_SECRET;
});

afterAll(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.SEARCH_LOGGING_ENABLED;
  else process.env.SEARCH_LOGGING_ENABLED = ORIGINAL_FLAG;
  if (ORIGINAL_SECRET === undefined) delete process.env.SEARCH_IP_SECRET;
  else process.env.SEARCH_IP_SECRET = ORIGINAL_SECRET;
});

describe("POST /api/primer/expand — happy path", () => {
  it("returns 204 with no body and records the event", async () => {
    const res = await post({ articleId: "abc123", surface: "feed" });
    expect(res.status).toBe(204);
    await expect(res.text()).resolves.toBe("");
    expect(mockLogPrimerExpand).toHaveBeenCalledTimes(1);
  });

  it("passes through the session header and classified user agent", async () => {
    await post(
      { articleId: "abc123", surface: "bookmarks" },
      {
        "x-sift-session-id": "sess-42",
        "user-agent": "Mozilla/5.0 (iPhone) Mobile/15E148",
      },
    );
    expect(mockLogPrimerExpand).toHaveBeenCalledWith({
      articleId: "abc123",
      surface: "bookmarks",
      sessionId: "sess-42",
      ipHash: null,
      userAgentClass: "mobile",
    });
  });

  it("hashes the client IP when a secret is configured, never storing it raw", async () => {
    process.env.SEARCH_IP_SECRET = "test-secret";
    await post({ articleId: "abc123", surface: "feed" });
    const row = mockLogPrimerExpand.mock.calls[0][0] as { ipHash: string };
    expect(row.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(row.ipHash).not.toContain("10.0.0.");
  });
});

describe("POST /api/primer/expand — input validation", () => {
  it("nulls a surface outside the allow-list", async () => {
    await post({ articleId: "abc123", surface: "email-digest" });
    expect(mockLogPrimerExpand).toHaveBeenCalledWith(
      expect.objectContaining({ surface: null, articleId: "abc123" }),
    );
  });

  it("nulls a non-string surface and a non-string articleId", async () => {
    await post({ articleId: 42, surface: { feed: true } });
    expect(mockLogPrimerExpand).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: null, surface: null }),
    );
  });

  it("nulls an articleId longer than 64 characters", async () => {
    await post({ articleId: "x".repeat(65), surface: "feed" });
    expect(mockLogPrimerExpand).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: null }),
    );
  });

  it("accepts an articleId exactly at the 64-character cap", async () => {
    const id = "x".repeat(64);
    await post({ articleId: id, surface: "feed" });
    expect(mockLogPrimerExpand).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: id }),
    );
  });

  it("still logs an all-null event for an unparseable body", async () => {
    const res = await post("}{ not json");
    expect(res.status).toBe(204);
    expect(mockLogPrimerExpand).toHaveBeenCalledWith({
      articleId: null,
      surface: null,
      sessionId: null,
      ipHash: null,
      userAgentClass: "unknown",
    });
  });
});

describe("POST /api/primer/expand — degradation", () => {
  it("204s without writing when the analytics kill switch is set", async () => {
    process.env.SEARCH_LOGGING_ENABLED = "false";
    const res = await post({ articleId: "abc123", surface: "feed" });
    expect(res.status).toBe(204);
    expect(mockLogPrimerExpand).not.toHaveBeenCalled();
  });

  it("204s when the write returns null (table missing, insert failed)", async () => {
    mockLogPrimerExpand.mockResolvedValue(null);
    const res = await post({ articleId: "abc123", surface: "feed" });
    expect(res.status).toBe(204);
  });

  it("falls back to 'unknown' when no client IP header is present", async () => {
    const res = await POST(
      new NextRequest("https://siftnews.io/api/primer/expand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId: "abc123", surface: "feed" }),
      }),
    );
    expect(res.status).toBe(204);
    expect(mockLogPrimerExpand).toHaveBeenCalledWith(
      expect.objectContaining({ ipHash: null }),
    );
  });
});

describe("POST /api/primer/expand — rate limiting", () => {
  it("429s with a Retry-After once one IP passes 60 expands a minute", async () => {
    const flood = () =>
      POST(
        new NextRequest("https://siftnews.io/api/primer/expand", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-real-ip": "203.0.113.9",
          },
          body: JSON.stringify({ articleId: "abc123", surface: "feed" }),
        }),
      );

    for (let i = 0; i < 60; i++) {
      expect((await flood()).status).toBe(204);
    }
    const res = await flood();
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    await expect(res.json()).resolves.toEqual({ error: "Too many requests" });
    expect(mockLogPrimerExpand).toHaveBeenCalledTimes(60);
  });
});
