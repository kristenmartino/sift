import {
  bucketize,
  groupFramingsByBucket,
  shouldRenderCrossSpectrum,
  CROSS_SPECTRUM_BUCKETS,
} from "@/lib/crossSpectrum";
import type {
  OutletAllSidesRating,
  OutletProfile,
  StoryFraming,
} from "@/lib/types";

// ─── Test fixtures ────────────────────────────────────────

function makeOutlet(
  slug: string,
  rating: OutletAllSidesRating | null,
): OutletProfile {
  return {
    slug,
    name: slug.replace(/-/g, " "),
    parentCompany: null,
    parentCompanyUrl: null,
    foundedYear: null,
    fundingModel: null,
    allSidesRating: rating,
    allSidesUrl: null,
    allSidesLastChecked: null,
    mbfcFactual: null,
    mbfcUrl: null,
    mbfcLastChecked: null,
    majorFunders: [],
    externalLinks: {},
    notes: null,
  };
}

function makeFraming(
  sourceName: string,
  rating: OutletAllSidesRating | null,
): StoryFraming {
  return {
    sourceName,
    framing: `${sourceName} took this angle.`,
    tone: "neutral",
    outlet: rating === null
      ? null
      : makeOutlet(sourceName.toLowerCase(), rating),
  };
}

// ─── bucketize ─────────────────────────────────────────────

describe("bucketize", () => {
  it("groups left + lean-left under 'left'", () => {
    expect(bucketize("left")).toBe("left");
    expect(bucketize("lean-left")).toBe("left");
  });

  it("groups right + lean-right under 'right'", () => {
    expect(bucketize("right")).toBe("right");
    expect(bucketize("lean-right")).toBe("right");
  });

  it("returns 'center' only for literal center", () => {
    expect(bucketize("center")).toBe("center");
  });

  it("returns null for 'mixed' (intentionally unbucketable)", () => {
    expect(bucketize("mixed")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(bucketize(null)).toBeNull();
    expect(bucketize(undefined)).toBeNull();
  });
});

describe("CROSS_SPECTRUM_BUCKETS", () => {
  it("is left → center → right (stable column order)", () => {
    expect([...CROSS_SPECTRUM_BUCKETS]).toEqual(["left", "center", "right"]);
  });
});

// ─── groupFramingsByBucket ─────────────────────────────────

describe("groupFramingsByBucket", () => {
  it("places each framing in the correct bucket", () => {
    const groups = groupFramingsByBucket([
      makeFraming("Vox", "left"),
      makeFraming("NPR", "center"),
      makeFraming("WSJ", "lean-right"),
    ]);
    expect(groups.left.map((f) => f.sourceName)).toEqual(["Vox"]);
    expect(groups.center.map((f) => f.sourceName)).toEqual(["NPR"]);
    expect(groups.right.map((f) => f.sourceName)).toEqual(["WSJ"]);
    expect(groups.unbucketed).toEqual([]);
  });

  it("preserves input order within each bucket", () => {
    const groups = groupFramingsByBucket([
      makeFraming("Atlantic", "lean-left"),
      makeFraming("Vox", "left"),
      makeFraming("Mother Jones", "left"),
    ]);
    expect(groups.left.map((f) => f.sourceName)).toEqual([
      "Atlantic",
      "Vox",
      "Mother Jones",
    ]);
  });

  it("collects mixed-rated outlets in unbucketed", () => {
    const groups = groupFramingsByBucket([
      makeFraming("Some Outlet", "mixed"),
    ]);
    expect(groups.unbucketed.map((f) => f.sourceName)).toEqual(["Some Outlet"]);
    expect(groups.left).toEqual([]);
    expect(groups.center).toEqual([]);
    expect(groups.right).toEqual([]);
  });

  it("collects framings with no outlet match in unbucketed", () => {
    const groups = groupFramingsByBucket([
      makeFraming("Unmatched Outlet", null),
    ]);
    expect(groups.unbucketed.map((f) => f.sourceName)).toEqual([
      "Unmatched Outlet",
    ]);
  });

  it("handles an empty input array", () => {
    expect(groupFramingsByBucket([])).toEqual({
      left: [],
      center: [],
      right: [],
      unbucketed: [],
    });
  });
});

// ─── shouldRenderCrossSpectrum ──────────────────────────────

describe("shouldRenderCrossSpectrum", () => {
  it("returns true when ≥3 framings span all 3 buckets", () => {
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("NPR", "center"),
        makeFraming("WSJ", "lean-right"),
      ]),
    ).toBe(true);
  });

  it("returns true when ≥3 framings span exactly 2 buckets", () => {
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("Mother Jones", "left"),
        makeFraming("WSJ", "lean-right"),
      ]),
    ).toBe(true);
  });

  it("returns false when only 2 framings, even if cross-bucket", () => {
    // The plan-recommended Moderate threshold is ≥3 framings; a 2-framing
    // disagreement still falls back to the flat list view.
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("WSJ", "right"),
      ]),
    ).toBe(false);
  });

  it("returns false when 3 framings all sit in one bucket", () => {
    // 3 Lean-Left outlets isn't editorially cross-spectrum.
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("Mother Jones", "left"),
        makeFraming("Atlantic", "lean-left"),
      ]),
    ).toBe(false);
  });

  it("returns false when unbucketed framings can't substitute for L/C/R diversity", () => {
    // Vox (Left) + 2 unbucketed = 1 occupied bucket, not 2.
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("Mixed Outlet", "mixed"),
        makeFraming("Unmatched Outlet", null),
      ]),
    ).toBe(false);
  });

  it("counts only bucketed framings toward the ≥3 threshold", () => {
    // 2 bucketed (Vox, WSJ) + 2 unbucketed = only 2 bucketed, fails the ≥3
    // threshold even though 4 framings total and 2 buckets occupied.
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("WSJ", "right"),
        makeFraming("Mixed Outlet", "mixed"),
        makeFraming("Unmatched Outlet", null),
      ]),
    ).toBe(false);
  });

  it("returns false for an empty array", () => {
    expect(shouldRenderCrossSpectrum([])).toBe(false);
  });

  it("ignores duplicate-source framings (caller is responsible for dedup)", () => {
    // The function bucketizes whatever it's given; StoryCard dedupes by
    // sourceName upstream. Confirms we don't re-validate that here.
    expect(
      shouldRenderCrossSpectrum([
        makeFraming("Vox", "left"),
        makeFraming("Vox", "left"),
        makeFraming("WSJ", "right"),
      ]),
    ).toBe(true);
  });
});
