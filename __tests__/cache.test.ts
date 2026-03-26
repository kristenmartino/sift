/**
 * @jest-environment node
 *
 * Tests for the two-tier stale-while-revalidate cache and disk persistence
 * in the /api/news route handler.
 *
 * These tests exercise behaviors that the pure-logic tests in api.test.ts
 * cannot cover: the actual route serving stale data while triggering a
 * background refresh, the in-flight coalescing that prevents duplicate
 * Anthropic API calls, and the disk cache load/save functions.
 *
 * Disk-cache tests use the real filesystem (writing to /tmp/sift-cache, which
 * matches the hardcoded CACHE_FILE in route.ts). This is simpler and more
 * realistic than trying to mock Node.js built-in modules.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────
//
// jest.mock calls are hoisted above all imports by Babel. The route module is
// loaded when the `import … from "…/route"` below is resolved, which triggers
// `new Anthropic()`. We declare `mockCreate` with `let` and wrap it in a
// lambda so the variable is read at call-time rather than at closure-creation
// time (avoiding the temporal dead zone).

// eslint-disable-next-line prefer-const
let mockCreate: jest.Mock;

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: (...args: unknown[]) => mockCreate(...args) },
  })),
}));

// ─── Imports ──────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { NextRequest } from "next/server";
import { join } from "path";
import { CACHE_TTL_MS, STALE_TTL_MS } from "@/lib/constants";
import type { Article } from "@/lib/types";
import { GET, cache, loadCacheFromDisk, saveCacheToDisk } from "../app/api/news/route";

// ─── Constants & Helpers ──────────────────────────────────────────────────

const CACHE_DIR = join("/tmp", "sift-cache");
const CACHE_FILE = join(CACHE_DIR, "news.json");

const MOCK_ARTICLES_JSON = JSON.stringify([
  {
    title: "Cache Test Article",
    summary: "Summary for cache testing.",
    source_url: "https://example.com/cache-test-article",
    source_name: "Example",
    published_date: null,
    image_url: null,
  },
]);

const ANTHROPIC_SUCCESS = {
  content: [{ type: "text", text: MOCK_ARTICLES_JSON }],
  stop_reason: "end_turn",
};

/** Build a GET request with a unique per-call IP to stay below rate limit. */
let _ipCounter = 1;
function makeRequest(category = "technology") {
  const octet = (_ipCounter++ % 254) + 1;
  return new NextRequest(`http://localhost/api/news?category=${category}`, {
    headers: { "x-forwarded-for": `203.0.113.${octet}` },
  });
}

/** Flush all pending microtasks and one round of macrotasks. */
function flushPromises() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: "test-id",
    title: "Test Article",
    summary: "Test summary.",
    sourceUrl: "https://example.com/article",
    sourceName: "Example",
    publishedDate: null,
    imageUrl: null,
    category: "technology",
    readTime: 1,
    ...overrides,
  };
}

function writeDiskCache(data: Record<string, unknown>) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
}

function removeDiskCache() {
  if (existsSync(CACHE_FILE)) unlinkSync(CACHE_FILE);
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────

beforeEach(() => {
  cache.clear();
  removeDiskCache();
  mockCreate = jest.fn().mockResolvedValue(ANTHROPIC_SUCCESS);
  // Suppress OG-image fetch calls from the background enrichment step
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  process.env.ANTHROPIC_API_KEY = "test-key";
});

afterEach(() => {
  cache.clear();
  removeDiskCache();
  delete process.env.ANTHROPIC_API_KEY;
});

// ─── Disk cache persistence ────────────────────────────────────────────────

describe("Disk cache persistence", () => {
  it("saveCacheToDisk writes cache entries as JSON to disk", async () => {
    const article = makeArticle();
    const fetchedAt = Date.now();
    cache.set("technology", { articles: [article], fetchedAt });

    await saveCacheToDisk();

    expect(existsSync(CACHE_FILE)).toBe(true);
    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    expect(parsed).toHaveProperty("technology");
    expect(parsed.technology.fetchedAt).toBe(fetchedAt);
    expect(parsed.technology.articles).toHaveLength(1);
  });

  it("saveCacheToDisk includes all categories currently in cache", async () => {
    cache.set("technology", { articles: [], fetchedAt: Date.now() });
    cache.set("business", { articles: [], fetchedAt: Date.now() });

    await saveCacheToDisk();

    const parsed = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    expect(Object.keys(parsed)).toEqual(expect.arrayContaining(["technology", "business"]));
  });

  it("loadCacheFromDisk loads entries that are within STALE_TTL", () => {
    const fetchedAt = Date.now() - 1000; // 1 s ago — well within STALE_TTL
    writeDiskCache({ technology: { articles: [], fetchedAt } });

    cache.clear();
    loadCacheFromDisk();

    expect(cache.has("technology")).toBe(true);
    expect(cache.get("technology")!.fetchedAt).toBe(fetchedAt);
  });

  it("loadCacheFromDisk skips entries older than STALE_TTL", () => {
    const fetchedAt = Date.now() - STALE_TTL_MS - 5000; // expired
    writeDiskCache({ technology: { articles: [], fetchedAt } });

    cache.clear();
    loadCacheFromDisk();

    expect(cache.has("technology")).toBe(false);
  });

  it("loadCacheFromDisk does not throw when cache file is missing", () => {
    // CACHE_FILE was already removed in beforeEach
    expect(() => loadCacheFromDisk()).not.toThrow();
    expect(cache.size).toBe(0);
  });

  it("loadCacheFromDisk does not throw on corrupt JSON and leaves cache empty", () => {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, "{ not valid json {{{{", "utf-8");

    cache.clear();
    expect(() => loadCacheFromDisk()).not.toThrow();
    expect(cache.size).toBe(0);
  });

  it("data round-trips through saveCacheToDisk and loadCacheFromDisk", async () => {
    const article = makeArticle({ title: "Round-trip Article" });
    const fetchedAt = Date.now() - 1000;
    cache.set("technology", { articles: [article], fetchedAt });

    await saveCacheToDisk();
    cache.clear();
    loadCacheFromDisk();

    expect(cache.has("technology")).toBe(true);
    expect(cache.get("technology")!.articles[0].title).toBe("Round-trip Article");
  });
});

// ─── Stale-while-revalidate route behavior ────────────────────────────────

describe("Stale-while-revalidate route behavior", () => {
  it("returns fresh cached response without calling Anthropic", async () => {
    cache.set("technology", {
      articles: [makeArticle()],
      fetchedAt: Date.now() - 1000, // 1 s old — still fresh
    });

    const res = await GET(makeRequest("technology"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("serves stale cache immediately (without waiting for Anthropic)", async () => {
    cache.set("technology", {
      articles: [makeArticle()],
      fetchedAt: Date.now() - CACHE_TTL_MS - 5000, // stale
    });

    const res = await GET(makeRequest("technology"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cached).toBe(true);
    expect(body.articles).toHaveLength(1);
  });

  it("triggers exactly one background refresh when serving stale cache", async () => {
    cache.set("technology", {
      articles: [makeArticle()],
      fetchedAt: Date.now() - CACHE_TTL_MS - 5000, // stale
    });

    await GET(makeRequest("technology"));
    await flushPromises();

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent stale requests into a single Anthropic call", async () => {
    const staleEntry = {
      articles: [makeArticle()],
      fetchedAt: Date.now() - CACHE_TTL_MS - 5000,
    };
    cache.set("technology", staleEntry);

    // Three concurrent requests for the same stale category
    await Promise.all([
      GET(makeRequest("technology")),
      GET(makeRequest("technology")),
      GET(makeRequest("technology")),
    ]);
    await flushPromises();

    // In-flight coalescing ensures only one Anthropic call is made
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("updates the cache with fresh data after background refresh", async () => {
    const staleFetchedAt = Date.now() - CACHE_TTL_MS - 5000;
    cache.set("technology", {
      articles: [makeArticle()],
      fetchedAt: staleFetchedAt,
    });

    await GET(makeRequest("technology"));
    await flushPromises();

    const updated = cache.get("technology");
    expect(updated).toBeDefined();
    expect(updated!.fetchedAt).toBeGreaterThan(staleFetchedAt);
  });

  it("fetches from Anthropic and returns cached: false when no cache exists", async () => {
    const res = await GET(makeRequest("technology"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.articles).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("persists freshly fetched results to disk", async () => {
    await GET(makeRequest("technology"));
    await flushPromises();

    // saveCacheToDisk is called after OG image enrichment finishes
    expect(existsSync(CACHE_FILE)).toBe(true);
  });
});
