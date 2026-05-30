/**
 * @jest-environment node
 *
 * Contract test for the /api/compare proxy route. Locks the frontend half of
 * the compare contract aligned in sift#114 / sift#122 (and sift-api#77 / #78):
 * auth required, CSRF-gated, max 5 sources, forwards to the preferred
 * /v1/analyze/compare route with the pipeline key, trims the topic, and never
 * leaks backend error detail.
 *
 * Mocks are declared before importing the route so the handler picks them up.
 */
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({ auth: () => mockAuth() }));

const mockRateLimit = jest.fn();
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

const mockCheckCsrf = jest.fn();
jest.mock("@/lib/security", () => ({
  checkCsrf: (...args: unknown[]) => mockCheckCsrf(...args),
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

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockRateLimit.mockReset();
  mockCheckCsrf.mockReset();
  mockFetch.mockReset();
  // Happy-path defaults: authed, CSRF ok, under rate limit, backend returns ok.
  mockAuth.mockResolvedValue({ userId: "user_1" });
  mockCheckCsrf.mockReturnValue(null);
  mockRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockFetch.mockResolvedValue(
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
    mockCheckCsrf.mockReturnValue(
      new Response(JSON.stringify({ error: "Invalid origin" }), { status: 403 }),
    );
    const res = await POST(makeRequest({ topic: "Federal Reserve" }));
    expect(res.status).toBe(403);
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
    expect(String(url)).toMatch(/\/v1\/analyze\/compare$/);
    const headers = options.headers as Record<string, string>;
    expect(headers["X-Pipeline-Key"]).toBeDefined();

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
    mockFetch.mockResolvedValue(
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
