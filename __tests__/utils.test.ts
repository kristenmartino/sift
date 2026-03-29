import {
  estimateReadTime,
  timeAgo,
  extractSourceDomain,
  stableHash,
} from "@/lib/utils";

// ─── estimateReadTime ───────────────────────────────────

describe("estimateReadTime", () => {
  it("returns 1 for empty string", () => {
    expect(estimateReadTime("")).toBe(1);
  });

  it("returns 1 for null/undefined", () => {
    expect(estimateReadTime(null)).toBe(1);
    expect(estimateReadTime(undefined)).toBe(1);
  });

  it("returns 1 for whitespace-only string", () => {
    expect(estimateReadTime("   \n\t  ")).toBe(1);
  });

  it("returns 1 for short text", () => {
    expect(estimateReadTime("Hello world")).toBe(1);
  });

  it("returns 2 for 400 words", () => {
    const text = "word ".repeat(400);
    expect(estimateReadTime(text)).toBe(2);
  });

  it("rounds up correctly", () => {
    const text = "word ".repeat(201);
    expect(estimateReadTime(text)).toBe(2); // 201/200 = 1.005 → ceil = 2
  });
});

// ─── timeAgo ────────────────────────────────────────────

describe("timeAgo", () => {
  it('returns "Recently" for null', () => {
    expect(timeAgo(null)).toBe("Recently");
  });

  it('returns "Recently" for invalid date', () => {
    expect(timeAgo("not-a-date")).toBe("Recently");
  });

  it('returns "Just now" for current time', () => {
    expect(timeAgo(new Date().toISOString())).toBe("Just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it('returns "Recently" for future dates', () => {
    const future = new Date(Date.now() + 100000).toISOString();
    expect(timeAgo(future)).toBe("Recently");
  });
});

// ─── extractSourceDomain ────────────────────────────────

describe("extractSourceDomain", () => {
  it("extracts capitalized domain name", () => {
    expect(extractSourceDomain("https://www.reuters.com/article/123")).toBe("Reuters");
  });

  it("strips www prefix", () => {
    expect(extractSourceDomain("https://www.nytimes.com/2024/article")).toBe("Nytimes");
  });

  it("handles URLs without www", () => {
    expect(extractSourceDomain("https://bbc.co.uk/news")).toBe("Bbc");
  });

  it('returns "News" for invalid URLs', () => {
    expect(extractSourceDomain("not-a-url")).toBe("News");
  });

  it('returns "News" for empty string', () => {
    expect(extractSourceDomain("")).toBe("News");
  });
});

// ─── stableHash ─────────────────────────────────────────

describe("stableHash", () => {
  it("returns same hash for same input", () => {
    const url = "https://reuters.com/article/123";
    expect(stableHash(url)).toBe(stableHash(url));
  });

  it("returns different hash for different input", () => {
    expect(stableHash("https://a.com")).not.toBe(stableHash("https://b.com"));
  });

  it("returns a non-empty string", () => {
    const hash = stableHash("test");
    expect(hash.length).toBeGreaterThan(0);
    expect(typeof hash).toBe("string");
  });

  it("handles empty string", () => {
    expect(stableHash("")).toBe("0");
  });
});
