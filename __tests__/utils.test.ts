import {
  estimateReadTime,
  timeAgo,
  extractSourceDomain,
  stableHash,
  formatUsdCompact,
  truncateToSentence,
} from "@/lib/utils";

// ─── truncateToSentence ─────────────────────────────────

describe("truncateToSentence", () => {
  it("returns the text unchanged when within the limit", () => {
    expect(truncateToSentence("Short and sweet.", 100)).toBe("Short and sweet.");
  });

  it("keeps whole sentences and never cuts mid-sentence", () => {
    const t =
      "The body was found by a hiker. The discovery closes a long missing-persons case. It has drawn national attention.";
    const out = truncateToSentence(t, 85);
    expect(out).toBe(
      "The body was found by a hiker. The discovery closes a long missing-persons case.",
    );
    expect(out.endsWith(".")).toBe(true);
  });

  it("does not treat abbreviations / initials as sentence ends", () => {
    const t = "Trump met with the U.S. Senate. Markets rose.";
    expect(truncateToSentence(t, 40)).toBe("Trump met with the U.S. Senate.");
  });

  it("falls back to a clean word boundary + ellipsis for one long sentence", () => {
    const t =
      "This is a single very long sentence that runs on well past the budget without any terminator inside the window";
    const out = truncateToSentence(t, 40);
    expect(out.endsWith("…")).toBe(true);
    // text before the ellipsis is a real prefix, cut on a word boundary
    expect(t.startsWith(out.slice(0, -1))).toBe(true);
    expect(out.length).toBeLessThanOrEqual(42);
  });
});

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

// Pinned goldens. `stableHash` is reimplemented in Python as `stable_hash` in
// sift-api/services/rss.py, and these EXACT values are asserted in
// sift-api/tests/test_rss.py too. The two must never diverge:
//
//   sift-api/workflows/pipeline_workflow.py:337 derives
//     article_id = stable_hash(source_url + title)
//   — the PRIMARY KEY of every `articles` row —
//   and app/api/news/topic/route.ts:578 computes the SAME id here in TS.
//
// Deliberately duplicated literals rather than a shared fixture: sift and
// sift-api are independent git repos, so sharing would need a submodule or a
// sync step for zero extra signal. If either side drifts, exactly one of the
// two suites goes red.
const GOLDEN_STABLE_HASH: Record<string, string> = {
  hello: "1n1e4y",
  world: "1vgtci",
  "": "0",
  "test article url": "p4glh3",
  "https://www.npr.org/2026/06/04/x": "c9vv14",
};

// Two cases were removed here on 2026-08-17: `stableHash(url) === stableHash(url)`
// (a tautology — no implementation of a pure function fails it) and a
// length/typeof check that asserted a type rather than a value. Both were
// fully subsumed by the golden-value test below, which pins the exact hashes
// shared with sift-api's services/rss.py. Don't add them back.
describe("stableHash", () => {
  it("matches the golden values shared with sift-api", () => {
    // Self-guard, and the worked example __tests__/meta.test.ts points at: every
    // assertion below sits inside the loop, so an emptied GOLDEN_STABLE_HASH
    // would run zero of them and still report green — on the test guarding the
    // primary key of every row in `articles`.
    expect(Object.keys(GOLDEN_STABLE_HASH).length).toBeGreaterThanOrEqual(5);

    for (const [input, expected] of Object.entries(GOLDEN_STABLE_HASH)) {
      expect(stableHash(input)).toBe(expected);
    }
  });

  it("renders abs(INT32_MIN) identically to Python", () => {
    // The one boundary where JS's double-based Math.abs and Python's
    // ctypes.c_int32 wrap could part ways.
    expect(Math.abs(-2147483648).toString(36)).toBe("zik0zk");
  });

  it("returns different hash for different input", () => {
    expect(stableHash("https://a.com")).not.toBe(stableHash("https://b.com"));
  });

  it("handles empty string", () => {
    expect(stableHash("")).toBe("0");
  });
});

// ─── formatUsdCompact ────────────────────────────────────

describe("formatUsdCompact", () => {
  it("returns empty string for null/undefined", () => {
    expect(formatUsdCompact(null)).toBe("");
    expect(formatUsdCompact(undefined)).toBe("");
  });

  it("returns empty string for non-finite or negative", () => {
    expect(formatUsdCompact(NaN)).toBe("");
    expect(formatUsdCompact(Infinity)).toBe("");
    expect(formatUsdCompact(-100)).toBe("");
  });

  it("formats sub-$10K with locale commas", () => {
    expect(formatUsdCompact(0)).toBe("$0");
    expect(formatUsdCompact(500)).toBe("$500");
    expect(formatUsdCompact(7_470)).toBe("$7,470");
    expect(formatUsdCompact(9_999)).toBe("$9,999");
  });

  // Regression: previously returned "$0K" for any amount in $10K-$999K
  // because the K-branch divided by 1_000_000 instead of 1_000.
  it("formats $10K through <$1M as rounded thousands", () => {
    expect(formatUsdCompact(10_000)).toBe("$10K");
    expect(formatUsdCompact(82_837)).toBe("$83K");
    expect(formatUsdCompact(108_000)).toBe("$108K");
    expect(formatUsdCompact(193_900)).toBe("$194K");
    expect(formatUsdCompact(573_700)).toBe("$574K");
    expect(formatUsdCompact(950_000)).toBe("$950K");
    expect(formatUsdCompact(999_000)).toBe("$999K");
  });

  it("promotes $999.5K+ to $1M to avoid '$1000K'", () => {
    expect(formatUsdCompact(999_500)).toBe("$1M");
    expect(formatUsdCompact(999_999)).toBe("$1M");
  });

  it("formats $1M and up as rounded millions", () => {
    expect(formatUsdCompact(1_000_000)).toBe("$1M");
    expect(formatUsdCompact(1_500_000)).toBe("$1.5M");
    expect(formatUsdCompact(2_300_000)).toBe("$2.3M");
  });
});
