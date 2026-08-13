/**
 * Tests for `enrichLinksWithContext` (lib/civicContext.ts) — the batched
 * chip-enrichment pass. `__tests__/civicContext.test.ts` covers the JSONB
 * parser it leans on; this covers the batching contract itself, which is
 * what the feed depends on: one query per render, politician chips only,
 * in-place mutation, and a missing table degrading to "no context" rather
 * than a failed page render.
 *
 * `lib/db` is mocked so no pg Pool (or DATABASE_URL) is involved.
 */
const mockQuery = jest.fn();

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: (...args: unknown[]) => mockQuery(...args) },
}));

import {
  enrichArticleEntityLinks,
  enrichLinksWithContext,
} from "@/lib/civicContext";
import type { Article, EntityLink } from "@/lib/types";

function link(
  type: EntityLink["type"],
  canonicalId: string,
  surfaceForm = canonicalId,
): EntityLink {
  return { type, canonicalId, surfaceForm };
}

const SCHUMER_INDUSTRIES = [
  { industry: "Attorneys & law firms", amount_usd: 573700 },
  { industry: "Securities & investment", amount_usd: 412000 },
  { industry: "Real estate", amount_usd: 289000 },
  { industry: "Pro-Israel", amount_usd: 120000 },
];

beforeEach(() => {
  mockQuery.mockReset();
});

describe("enrichLinksWithContext — when it queries at all", () => {
  it("skips the query entirely for an empty link list", async () => {
    await enrichLinksWithContext([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("skips the query when no chip is a politician", async () => {
    const links = [link("org", "brookings"), link("bill", "hr-5376-117")];
    await enrichLinksWithContext(links);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(links.every((l) => l.civicContext === undefined)).toBe(true);
  });

  it("batches one query for many chips and de-duplicates repeated ids", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    await enrichLinksWithContext([
      link("politician", "S000148", "Chuck Schumer"),
      link("politician", "S000148", "Schumer"),
      link("politician", "P000197", "Nancy Pelosi"),
      link("org", "brookings"),
    ]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][1]).toEqual([["S000148", "P000197"]]);
  });
});

describe("enrichLinksWithContext — attaching context", () => {
  it("attaches the top 3 industries, in order, to the matching chip", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          bioguide_id: "S000148",
          top_industries_current_cycle: SCHUMER_INDUSTRIES,
        },
      ],
    });
    const links = [link("politician", "S000148", "Chuck Schumer")];
    await enrichLinksWithContext(links);
    expect(links[0].civicContext).toEqual({
      type: "politician",
      topIndustries: SCHUMER_INDUSTRIES.slice(0, 3),
    });
  });

  it("enriches every chip sharing a canonical id", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          bioguide_id: "S000148",
          top_industries_current_cycle: SCHUMER_INDUSTRIES,
        },
      ],
    });
    const links = [
      link("politician", "S000148", "Chuck Schumer"),
      link("politician", "S000148", "Schumer"),
    ];
    await enrichLinksWithContext(links);
    expect(links[1].civicContext).toEqual(links[0].civicContext);
  });

  it("returns void — the caller reads the mutated array", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          bioguide_id: "S000148",
          top_industries_current_cycle: SCHUMER_INDUSTRIES,
        },
      ],
    });
    const links = [link("politician", "S000148")];
    await expect(enrichLinksWithContext(links)).resolves.toBeUndefined();
    expect(links[0].civicContext).toBeDefined();
  });

  it("leaves a chip bare when its row is absent from the result", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const links = [link("politician", "P000197", "Nancy Pelosi")];
    await enrichLinksWithContext(links);
    expect(links[0].civicContext).toBeUndefined();
  });

  it("leaves a chip bare when the politician has no PAC data", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { bioguide_id: "P000197", top_industries_current_cycle: [] },
        { bioguide_id: "S000148", top_industries_current_cycle: null },
      ],
    });
    const links = [link("politician", "P000197"), link("politician", "S000148")];
    await enrichLinksWithContext(links);
    expect(links[0].civicContext).toBeUndefined();
    expect(links[1].civicContext).toBeUndefined();
  });

  it("ignores malformed JSONB rather than propagating a parse error", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { bioguide_id: "S000148", top_industries_current_cycle: "not-an-array" },
      ],
    });
    const links = [link("politician", "S000148")];
    await expect(enrichLinksWithContext(links)).resolves.toBeUndefined();
    expect(links[0].civicContext).toBeUndefined();
  });

  it("never touches non-politician chips, even when their id matches a row", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          bioguide_id: "S000148",
          top_industries_current_cycle: SCHUMER_INDUSTRIES,
        },
      ],
    });
    const links = [
      link("politician", "S000148"),
      link("org", "S000148"),
    ];
    await enrichLinksWithContext(links);
    expect(links[0].civicContext).toBeDefined();
    expect(links[1].civicContext).toBeUndefined();
  });
});

describe("enrichLinksWithContext — error posture", () => {
  it("degrades silently when politician_profiles doesn't exist yet", async () => {
    mockQuery.mockRejectedValue(
      new Error('relation "politician_profiles" does not exist'),
    );
    const links = [link("politician", "S000148")];
    await expect(enrichLinksWithContext(links)).resolves.toBeUndefined();
    expect(links[0].civicContext).toBeUndefined();
  });

  it("rethrows any other query failure — a broken DB is not a missing column", async () => {
    mockQuery.mockRejectedValue(new Error("connection terminated"));
    await expect(
      enrichLinksWithContext([link("politician", "S000148")]),
    ).rejects.toThrow("connection terminated");
  });
});

describe("enrichArticleEntityLinks", () => {
  function article(links: EntityLink[]): Article {
    return {
      id: "a1",
      title: "t",
      summary: "s",
      sourceUrl: "https://example.com/a",
      sourceName: "Example",
      publishedDate: null,
      imageUrl: null,
      category: "politics",
      readTime: 2,
      entityLinks: links,
    };
  }

  it("skips the query entirely when no article carries a link", async () => {
    await enrichArticleEntityLinks([article([])], []);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("enriches links across every group it is handed", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          bioguide_id: "S000148",
          top_industries_current_cycle: SCHUMER_INDUSTRIES,
        },
      ],
    });
    const a = article([link("politician", "S000148")]);
    const b = article([link("politician", "S000148")]);
    await enrichArticleEntityLinks([a], [b]);
    expect(a.entityLinks?.[0].civicContext).toBeDefined();
    expect(b.entityLinks?.[0].civicContext).toBeDefined();
  });

  it("warns and resolves when enrichment throws — the feed still renders", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("connection terminated"));
    const a = article([link("politician", "S000148")]);
    await expect(enrichArticleEntityLinks([a])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    expect(a.entityLinks?.[0].civicContext).toBeUndefined();
    warn.mockRestore();
  });
});
