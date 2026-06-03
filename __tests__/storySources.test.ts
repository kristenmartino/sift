import { buildSourceUnits, summarizeLeanSpread } from "@/lib/storySources";
import type {
  Article,
  OutletAllSidesRating,
  OutletProfile,
  StoryFraming,
} from "@/lib/types";

function outlet(
  slug: string,
  allSidesRating: OutletAllSidesRating | null,
): OutletProfile {
  return {
    slug,
    name: slug.toUpperCase(),
    parentCompany: null,
    parentCompanyUrl: null,
    foundedYear: null,
    fundingModel: null,
    allSidesRating,
    allSidesUrl: null,
    allSidesLastChecked: null,
    mbfcFactual: "high",
    mbfcUrl: null,
    mbfcLastChecked: null,
    majorFunders: [],
    externalLinks: {},
    notes: null,
  } as OutletProfile;
}

function article(
  id: string,
  sourceName: string,
  publishedDate: string | null,
  outletObj?: OutletProfile | null,
): Article {
  return {
    id,
    title: `${sourceName} — ${id}`,
    summary: "",
    sourceUrl: `https://example.com/${id}`,
    sourceName,
    publishedDate,
    imageUrl: null,
    category: "top",
    readTime: 1,
    outlet: outletObj ?? null,
  } as Article;
}

function framing(
  sourceName: string,
  text: string,
  outletObj?: OutletProfile | null,
): StoryFraming {
  return { sourceName, framing: text, tone: "neutral", outlet: outletObj ?? null };
}

describe("buildSourceUnits — framing ↔ article join", () => {
  it("emits framed sources first, in framing order, de-duped by source", () => {
    const fox = outlet("fox", "lean-right");
    const hill = outlet("hill", "center");
    const framings = [
      framing("Fox News", "national-security angle", fox),
      framing("The Hill", "just the facts", hill),
      framing("Fox News", "duplicate framing", fox), // same outlet again → dropped
    ];
    const articles = [
      article("a1", "Fox News", "2026-06-01T10:00:00Z", fox),
      article("a2", "The Hill", "2026-06-01T09:00:00Z", hill),
    ];
    const units = buildSourceUnits(framings, articles);
    expect(units.map((u) => u.sourceName)).toEqual(["Fox News", "The Hill"]);
    expect(units[0].framing).toBe("national-security angle");
  });

  it("orders each source's articles newest-first (articles[0] is representative)", () => {
    const units = buildSourceUnits(
      [framing("Fox News", "f")],
      [
        article("older", "Fox News", "2026-05-30T00:00:00Z"),
        article("newest", "Fox News", "2026-06-02T00:00:00Z"),
        article("mid", "Fox News", "2026-06-01T00:00:00Z"),
      ],
    );
    expect(units).toHaveLength(1);
    expect(units[0].articles.map((a) => a.id)).toEqual([
      "newest",
      "mid",
      "older",
    ]);
  });

  it("appends sources that only contributed articles (no framing), framing=null", () => {
    const units = buildSourceUnits(
      [framing("Fox News", "f", outlet("fox", "lean-right"))],
      [
        article("a1", "Fox News", "2026-06-01T00:00:00Z"),
        article("a2", "NY Post", "2026-06-01T00:00:00Z", outlet("nyp", "right")),
      ],
    );
    expect(units.map((u) => u.sourceName)).toEqual(["Fox News", "NY Post"]);
    expect(units[1].framing).toBeNull();
    expect(units[1].outlet?.slug).toBe("nyp");
  });

  it("falls back to the article's outlet when the framing has none", () => {
    const units = buildSourceUnits(
      [framing("Fox News", "f", null)],
      [article("a1", "Fox News", null, outlet("fox", "lean-right"))],
    );
    expect(units[0].outlet?.slug).toBe("fox");
  });

  it("never drops an article and is robust to a framing with no matching article", () => {
    const units = buildSourceUnits(
      [framing("Ghost Wire", "framing but no article")],
      [article("a1", "Fox News", "2026-06-01T00:00:00Z")],
    );
    expect(units.map((u) => u.sourceName)).toEqual(["Ghost Wire", "Fox News"]);
    expect(units[0].articles).toHaveLength(0); // framing-only, no link
    expect(units[1].framing).toBeNull();
  });
});

describe("summarizeLeanSpread — coverage cue", () => {
  it("counts units per L/C/R bucket; mixed/none fall to unknown", () => {
    const units = buildSourceUnits(
      [
        framing("Fox News", "f", outlet("fox", "right")),
        framing("The Hill", "f", outlet("hill", "center")),
        framing("NY Post", "f", outlet("nyp", "lean-right")),
        framing("Wire", "f", outlet("wire", "mixed")),
        framing("Blog", "f", null),
      ],
      [],
    );
    const spread = summarizeLeanSpread(units);
    expect(spread).toMatchObject({
      left: 0,
      center: 1,
      right: 2, // right + lean-right
      unknown: 2, // mixed + no-outlet
      total: 5,
    });
    expect(spread.bucketsCovered).toBe(2); // center + right
  });
});
