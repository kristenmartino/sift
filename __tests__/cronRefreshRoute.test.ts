/**
 * @jest-environment node
 *
 * Route tests for GET /api/cron/refresh — the Vercel-cron trigger for the
 * sift-api pipeline.
 *
 * It is the one route a stranger can reach with only a guessed header, so the
 * auth ladder is the contract: a missing server secret is a 500 (never an open
 * door), a wrong bearer is a 401 compared in constant time, and only then does
 * it POST upstream. A dead upstream is a reported 502 — a `{ triggered: true }`
 * on a failed trigger would leave the feed stale with a green cron log.
 */
import { NextRequest } from "next/server";

const mockReportError = jest.fn();

jest.mock("@/lib/observability", () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

import { GET } from "@/app/api/cron/refresh/route";

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
const ORIGINAL_API_KEY = process.env.SIFT_API_KEY;

function call(authorization?: string): Promise<Response> {
  return GET(
    new NextRequest("https://siftnews.io/api/cron/refresh", {
      headers: authorization ? { authorization } : {},
    }),
  );
}

let fetchSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  process.env.CRON_SECRET = "cron-secret";
  process.env.SIFT_API_KEY = "pipeline-key";
  mockReportError.mockReset();
  fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ results: { articles: 12 }, duration_ms: 4200 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  fetchSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

afterAll(() => {
  if (ORIGINAL_CRON_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
  if (ORIGINAL_API_KEY === undefined) delete process.env.SIFT_API_KEY;
  else process.env.SIFT_API_KEY = ORIGINAL_API_KEY;
});

describe("GET /api/cron/refresh — authorization", () => {
  it("500s rather than running unauthenticated when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const res = await call("Bearer cron-secret");
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Server misconfigured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("401s a missing, wrong, and same-length-but-wrong bearer", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect((await call("Bearer cron-secreT")).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("500s when SIFT_API_KEY is unset, after the bearer checks out", async () => {
    delete process.env.SIFT_API_KEY;
    const res = await call("Bearer cron-secret");
    expect(res.status).toBe(500);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/refresh — triggering the pipeline", () => {
  it("POSTs with the pipeline key and passes the results through", async () => {
    const res = await call("Bearer cron-secret");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      triggered: true,
      results: { articles: 12 },
      duration_ms: 4200,
    });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/pipeline\/refresh$/);
    expect((init.headers as Record<string, string>)["X-Pipeline-Key"]).toBe("pipeline-key");
  });

  it("502s with the upstream detail when the pipeline itself errors", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ detail: "embedder unavailable" }), { status: 503 }),
    );
    const res = await call("Bearer cron-secret");
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      triggered: false,
      error: "embedder unavailable",
      status: 503,
    });
  });

  it("502s and reports when the upstream is unreachable", async () => {
    fetchSpy.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const res = await call("Bearer cron-secret");
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      triggered: false,
      error: "Pipeline trigger failed",
    });
    expect(mockReportError).toHaveBeenCalledWith("api.cron.refresh", expect.any(Error));
  });
});
