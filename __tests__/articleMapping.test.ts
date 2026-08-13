/**
 * @jest-environment node
 *
 * Shared DB row → Article mapping (lib/articleMapping.ts). These assertions
 * encode the API contract the client relies on: optional fields are ABSENT
 * when unknown, never null, and the label columns only appear where the
 * calling query actually selects them.
 */

import type { DbArticle } from "@/lib/db";

// lib/db throws at import without DATABASE_URL; only the pure alias lookup is
// needed here.
jest.mock("@/lib/db", () => ({
  resolveOutletForSourceName: (
    map: Map<string, unknown>,
    sourceName: string | null | undefined,
  ) => (sourceName ? map.get(sourceName.trim().toLowerCase()) ?? null : null),
}));

import {
  cleanImageUrl,
  cleanSummary,
  mapArticleRow,
  mapArticleRows,
} from "@/lib/articleMapping";
import type { OutletProfile } from "@/lib/types";

function row(overrides: Partial<DbArticle> = {}): DbArticle {
  return {
    id: "a1",
    title: "Headline",
    summary: "Summary.",
    source_url: "https://reuters.com/1",
    source_name: "Reuters",
    image_url: null,
    category: "technology",
    published_date: new Date("2026-01-02T03:04:05.000Z"),
    read_time: 4,
    why_it_matters: null,
    importance_score: null,
    tone: null,
    is_opinion: false,
    is_roundup: false,
    genre: null,
    created_at: new Date("2026-01-02T03:04:05.000Z"),
    context_primer: null,
    reading_levels: null,
    ...overrides,
  };
}

describe("cleanSummary", () => {
  it("strips HTML from external copy", () => {
    expect(cleanSummary("<b>bold</b> claim")).toBe("bold claim");
  });

  it("drops pipeline apology text", () => {
    expect(cleanSummary("Unable to provide summary for this article")).toBe("");
  });

  it("maps a missing summary to an empty string", () => {
    expect(cleanSummary(null)).toBe("");
  });
});

describe("cleanImageUrl", () => {
  it("rejects non-HTTP schemes", () => {
    expect(cleanImageUrl("javascript:alert(1)")).toBeNull();
    expect(cleanImageUrl(null)).toBeNull();
  });

  it("leaves CDN thumbnails alone unless asked to upsize", () => {
    const url = "https://images.ctfassets.net/x/y.jpg?w=300";
    expect(cleanImageUrl(url)).toBe(url);
    const upgraded = cleanImageUrl(url, { upgradeCdnThumbnails: true });
    expect(upgraded).toContain("w=800");
    expect(upgraded).toContain("q=80");
  });

  it("passes through non-CDN hosts when upsizing", () => {
    expect(
      cleanImageUrl("https://reuters.com/p.jpg", { upgradeCdnThumbnails: true }),
    ).toBe("https://reuters.com/p.jpg");
  });
});

describe("mapArticleRow", () => {
  it("omits unknown optional fields rather than nulling them", () => {
    const article = mapArticleRow(row());
    expect(article).toEqual({
      id: "a1",
      title: "Headline",
      summary: "Summary.",
      sourceUrl: "https://reuters.com/1",
      sourceName: "Reuters",
      publishedDate: "2026-01-02T03:04:05.000Z",
      imageUrl: null,
      category: "technology",
      readTime: 4,
    });
  });

  it("defaults a zero read time to one minute", () => {
    expect(mapArticleRow(row({ read_time: 0 })).readTime).toBe(1);
  });

  it("only emits label fields when the caller selected them", () => {
    const labelled = row({ tone: "grim", is_opinion: true, genre: "feature" });
    expect(mapArticleRow(labelled)).not.toHaveProperty("tone");
    const withLabels = mapArticleRow(labelled, { includeLabels: true });
    expect(withLabels.tone).toBe("grim");
    expect(withLabels.isOpinion).toBe(true);
    expect(withLabels.genre).toBe("feature");
  });

  it("ignores an unrecognized tone and the default genre", () => {
    const article = mapArticleRow(row({ tone: "spicy", genre: "news" }), {
      includeLabels: true,
    });
    expect(article).not.toHaveProperty("tone");
    expect(article).not.toHaveProperty("genre");
  });

  it("skips the cleaners when clean is false", () => {
    const article = mapArticleRow(row({ summary: "<b>raw</b>" }), {
      clean: false,
    });
    expect(article.summary).toBe("<b>raw</b>");
  });

  it("drops a script-bearing source URL even when clean is false", () => {
    const unsafe = row({ source_url: "javascript:alert(1)" });
    expect(mapArticleRow(unsafe).sourceUrl).toBe("");
    expect(mapArticleRow(unsafe, { clean: false }).sourceUrl).toBe("");
  });

  it("attaches entity links and outlet provenance when present", () => {
    const outlet = { slug: "reuters", name: "Reuters" } as OutletProfile;
    const entityLinks = [
      {
        type: "politician" as const,
        canonicalId: "S000148",
        surfaceForm: "Schumer",
      },
    ];
    const article = mapArticleRow(row(), { outlet, entityLinks });
    expect(article.outlet).toBe(outlet);
    expect(article.entityLinks).toBe(entityLinks);
  });
});

describe("mapArticleRows", () => {
  it("resolves each row's outlet by lowercased source-name alias", () => {
    const outlet = { slug: "reuters", name: "Reuters" } as OutletProfile;
    const articles = mapArticleRows([row(), row({ id: "a2", source_name: "Nowhere" })], {
      outletMap: new Map([["reuters", outlet]]),
    });
    expect(articles[0].outlet).toBe(outlet);
    expect(articles[1]).not.toHaveProperty("outlet");
  });

  it("degrades to no links when the entity-links lookup is missing", () => {
    const [article] = mapArticleRows([row()]);
    expect(article).not.toHaveProperty("entityLinks");
  });
});
