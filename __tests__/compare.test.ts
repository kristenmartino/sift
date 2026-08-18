/**
 * @jest-environment node
 *
 * Contract test for the /api/compare proxy route. Locks the frontend half of
 * the compare contract aligned in sift#114 / sift#122 (and sift-api#77 / #78):
 * auth required, CSRF-gated, rate-limited per user, max 5 sources, forwards to
 * the preferred /v1/analyze/compare route with the pipeline key, trims the
 * topic, and never leaks backend error detail.
 *
 * WHAT IS AND IS NOT MOCKED, and why it matters here more than elsewhere.
 *
 * This file previously mocked `@/lib/rate-limit` and `@/lib/security` and then
 * asserted on the values it had just configured on those mocks — `mockRateLimit`
 * was never referenced by a single assertion, and there was no 429 test at all.
 * Verified 2026-08-17: with the entire limiter (`route.ts:34-36`) deleted, all
 * six tests passed. So did `"X-Pipeline-Key": ""`, because the header was only
 * asserted with `toBeDefined()` and `SIFT_API_KEY` defaults to `""`.
 *
 * That is worth guarding properly: every request here is a 20-90s LLM job on
 * the backend, so the limiter is both the abuse vector and the cost ceiling.
 *
 * The limiter and the CSRF gate now run for real. Only two things are stubbed:
 * Clerk's `auth` (no session to be had in a unit test) and `@/lib/siftApi`,
 * which is import-time config, not behaviour — stubbing it is what lets the
 * pipeline-key header be asserted by exact value instead of mere presence.
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn<Promise<{ userId: string | null }>, []>();
jest.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

// Import-time config, not logic. Fixed values so the forwarded URL and the
// pipeline key can be asserted exactly.
jest.mock("@/lib/siftApi", () => ({
  SIFT_API_URL: "https://api.test.local",
  SIFT_API_KEY: "test-pipeline-key",
}));

import { POST } from "../app/api/compare/route";

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const BACKEND_OK = {
  topic: "Federal Reserve",
  comparison: "Sources broadly agree.",
  sources_checked: ["reuters", "bbc"],
  claims: [],
  duration_ms: 1234,
};

/**
 * The real limiter's store is module-global and survives across tests in a
 * file, and the route keys it on `compare:${userId}` at 5/min. Each test
 * therefore gets a fresh user id, exactly as primerExpandRoute.test.ts walks
 * the IP — otherwise the sixth request of the *file* would 429 and the failure
 * would land on whichever test happened to run last.
 */
let userCounter = 0;
function freshUser(): string {
  userCounter += 1;
  return `user_${userCounter}`;
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost/api/compare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // What a browser sends on a same-origin fetch; the real checkCsrf reads it.
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockFetch.mockReset();
  mockAuth.mockResolvedValue({ userId: freshUser() });
  // A fresh Response per call, not a shared one: a body can only be read once,
  // and the rate-limit tests below drive the route five times in a row.
  mockFetch.mockImplementation(
    async () =>
      new Response(JSON.stringify(BACKEND_OK), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
});

describe("POST /api/compare contract", () => {
  it("rejects unauthenticated requests with 401 and never calls the backend", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ topic: "Federal Reserve" }));
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("honors the CSRF gate before doing anything else", async () => {
    const res = await POST(
      makeRequest({ topic: "Federal Reserve" }, { "sec-fetch-site": "cross-site" }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    // The ordering half of the claim in this test's name: the gate has to run
    // before the session lookup, not merely somewhere before the fetch.
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects more than 5 sources with 400 and does not call the backend", async () => {
    const res = await POST(
      makeRequest({
        topic: "Federal Reserve",
        sources: ["a", "b", "c", "d", "e", "f"],
      }),
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forwards to the preferred /v1/analyze/compare route with the X-Pipeline-Key header", async () => {
    const res = await POST(
      makeRequest({ topic: "Federal Reserve", sources: ["reuters", "bbc"] }),
    );
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toBe("https://api.test.local/v1/analyze/compare");
    const headers = options.headers as Record<string, string>;
    // By value, not `toBeDefined()`: SIFT_API_KEY falls back to "" when unset
    // (lib/siftApi.ts), and "" is defined — so presence proves nothing.
    expect(headers["X-Pipeline-Key"]).toBe("test-pipeline-key");

    const body = await res.json();
    expect(body.comparison).toBe(BACKEND_OK.comparison);
  });

  it("trims the topic before forwarding to the backend", async () => {
    await POST(makeRequest({ topic: "   Federal Reserve   " }));
    const [, options] = mockFetch.mock.calls[0];
    const forwarded = JSON.parse(options.body as string);
    expect(forwarded.topic).toBe("Federal Reserve");
  });

  it("does not leak backend error detail to the client", async () => {
    mockFetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ detail: "secret db connection string here" }),
          { status: 500 },
        ),
    );
    const res = await POST(makeRequest({ topic: "Federal Reserve" }));
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(body.error).toBe("Comparison service unavailable");
  });
});

describe("POST /api/compare rate limiting", () => {
  it("429s with a Retry-After once one user passes 5 comparisons a minute", async () => {
    const userId = freshUser();
    mockAuth.mockResolvedValue({ userId });

    for (let i = 0; i < 5; i++) {
      expect((await POST(makeRequest({ topic: "Federal Reserve" }))).status).toBe(200);
    }

    const res = await POST(makeRequest({ topic: "Federal Reserve" }));
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({ error: "Too many requests" });
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    // The ceiling is a spend ceiling: the sixth request must not reach the
    // backend, where it would start another 20-90s LLM job.
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it("meters each user separately, so one user cannot exhaust another's budget", async () => {
    const heavy = freshUser();
    mockAuth.mockResolvedValue({ userId: heavy });
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ topic: "Federal Reserve" }));
    }
    expect((await POST(makeRequest({ topic: "Federal Reserve" }))).status).toBe(429);

    // A second user is unaffected — this is what pins the limiter key to the
    // session. Keyed on a constant instead of `userId`, the line below 429s.
    mockAuth.mockResolvedValue({ userId: freshUser() });
    expect((await POST(makeRequest({ topic: "Federal Reserve" }))).status).toBe(200);
  });
});
