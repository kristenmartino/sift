/**
 * Tests for lib/searchAnalytics — Phase 1 search-funnel instrumentation.
 *
 * The INSERT itself goes through pg.Pool and isn't unit-tested here
 * (mocking the pool with the right semantics is heavier than the function
 * it would test). Covered: normalization, token counting, user-agent
 * classification, IP hashing (determinism + secret-required posture),
 * and the kill-switch env var.
 */
import {
  classifyUserAgent,
  countTokens,
  extractClientIp,
  hashIp,
  isLoggingEnabled,
  normalizeQuery,
} from "@/lib/searchAnalytics";

describe("normalizeQuery", () => {
  it("lowercases", () => {
    expect(normalizeQuery("SCHUMER")).toBe("schumer");
  });

  it("collapses whitespace runs", () => {
    expect(normalizeQuery("housing   policy")).toBe("housing policy");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeQuery("  schumer  ")).toBe("schumer");
  });

  it("handles empty / whitespace-only", () => {
    expect(normalizeQuery("")).toBe("");
    expect(normalizeQuery("   ")).toBe("");
  });

  it("preserves internal punctuation (we want apostrophes/hyphens in rollups)", () => {
    expect(normalizeQuery("Schumer's stance")).toBe("schumer's stance");
    expect(normalizeQuery("Build Back Better")).toBe("build back better");
  });
});

describe("countTokens", () => {
  it("counts whitespace-separated words", () => {
    expect(countTokens("schumer")).toBe(1);
    expect(countTokens("housing policy")).toBe(2);
    expect(countTokens("how does the filibuster work")).toBe(5);
  });

  it("returns 0 for empty input", () => {
    expect(countTokens("")).toBe(0);
  });
});

describe("classifyUserAgent", () => {
  it("returns 'unknown' for empty / null", () => {
    expect(classifyUserAgent(null)).toBe("unknown");
    expect(classifyUserAgent(undefined)).toBe("unknown");
    expect(classifyUserAgent("")).toBe("unknown");
  });

  it("classifies common bots", () => {
    expect(classifyUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe("bot");
    expect(classifyUserAgent("Mozilla/5.0 (compatible; bingbot/2.0)")).toBe("bot");
    expect(classifyUserAgent("python-requests/2.28.0")).toBe("bot");
    expect(classifyUserAgent("curl/7.81.0")).toBe("bot");
  });

  it("classifies mobile UAs", () => {
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe("mobile");
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36",
      ),
    ).toBe("mobile");
  });

  it("classifies desktop UAs", () => {
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0",
      ),
    ).toBe("desktop");
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
      ),
    ).toBe("desktop");
  });

  it("treats bot regex as winning over mobile (a 'mobile-bot' is still a bot)", () => {
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (Linux; Android 13) compatible; Googlebot-Mobile",
      ),
    ).toBe("bot");
  });
});

describe("hashIp", () => {
  const ORIGINAL_SECRET = process.env.SEARCH_IP_SECRET;

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.SEARCH_IP_SECRET;
    else process.env.SEARCH_IP_SECRET = ORIGINAL_SECRET;
  });

  it("returns null when ip is missing", () => {
    process.env.SEARCH_IP_SECRET = "test-secret";
    expect(hashIp(null)).toBeNull();
    expect(hashIp("")).toBeNull();
  });

  it("returns null when secret is not configured (safe default)", () => {
    delete process.env.SEARCH_IP_SECRET;
    expect(hashIp("203.0.113.42")).toBeNull();
  });

  it("hashes deterministically given (ip, secret)", () => {
    process.env.SEARCH_IP_SECRET = "test-secret";
    const a = hashIp("203.0.113.42");
    const b = hashIp("203.0.113.42");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it("different IPs hash differently", () => {
    process.env.SEARCH_IP_SECRET = "test-secret";
    expect(hashIp("203.0.113.42")).not.toBe(hashIp("198.51.100.1"));
  });

  it("rotating the secret rotates the hash (anti-reidentification)", () => {
    process.env.SEARCH_IP_SECRET = "secret-1";
    const h1 = hashIp("203.0.113.42");
    process.env.SEARCH_IP_SECRET = "secret-2";
    const h2 = hashIp("203.0.113.42");
    expect(h1).not.toBe(h2);
  });
});

describe("isLoggingEnabled", () => {
  const ORIGINAL = process.env.SEARCH_LOGGING_ENABLED;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.SEARCH_LOGGING_ENABLED;
    else process.env.SEARCH_LOGGING_ENABLED = ORIGINAL;
  });

  it("defaults to enabled when env var is unset", () => {
    delete process.env.SEARCH_LOGGING_ENABLED;
    expect(isLoggingEnabled()).toBe(true);
  });

  it("disables when env var is exactly 'false'", () => {
    process.env.SEARCH_LOGGING_ENABLED = "false";
    expect(isLoggingEnabled()).toBe(false);
  });

  it("stays enabled for any other value (fail-open on misconfig)", () => {
    process.env.SEARCH_LOGGING_ENABLED = "FALSE"; // case-sensitive
    expect(isLoggingEnabled()).toBe(true);
    process.env.SEARCH_LOGGING_ENABLED = "no";
    expect(isLoggingEnabled()).toBe(true);
    process.env.SEARCH_LOGGING_ENABLED = "0";
    expect(isLoggingEnabled()).toBe(true);
  });
});

describe("extractClientIp", () => {
  it("prefers x-real-ip over x-forwarded-for", () => {
    const h = new Headers({
      "x-real-ip": "203.0.113.42",
      "x-forwarded-for": "spoofed.bad.host, 198.51.100.1",
    });
    expect(extractClientIp(h)).toBe("203.0.113.42");
  });

  it("falls back to x-forwarded-for first hop", () => {
    const h = new Headers({
      "x-forwarded-for": "203.0.113.42, 198.51.100.1",
    });
    expect(extractClientIp(h)).toBe("203.0.113.42");
  });

  it("returns null when neither header is present", () => {
    expect(extractClientIp(new Headers())).toBeNull();
  });
});
