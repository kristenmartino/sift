import { computeOutletStats, EMPTY_OUTLET_STATS } from "@/lib/outletStats";

describe("computeOutletStats", () => {
  it("buckets ratings into L/C/R, folding lean-left / lean-right", () => {
    expect(
      computeOutletStats([
        { allSidesRating: "left" },
        { allSidesRating: "lean-left" },
        { allSidesRating: "center" },
        { allSidesRating: "right" },
        { allSidesRating: "lean-right" },
      ]),
    ).toEqual({ total: 5, left: 2, center: 1, right: 2, specialty: 0 });
  });

  it("counts mixed / null / undefined / unknown / missing ratings as specialty", () => {
    expect(
      computeOutletStats([
        { allSidesRating: "mixed" },
        { allSidesRating: null },
        { allSidesRating: undefined },
        { allSidesRating: "not-a-real-rating" },
        {}, // no allSidesRating key at all
      ]),
    ).toEqual({ total: 5, left: 0, center: 0, right: 0, specialty: 5 });
  });

  it("returns all-zero stats for an empty list (DB miss / empty table)", () => {
    expect(computeOutletStats([])).toEqual(EMPTY_OUTLET_STATS);
  });

  it("total always equals the input length", () => {
    const outlets = Array.from({ length: 12 }, () => ({
      allSidesRating: "center" as const,
    }));
    expect(computeOutletStats(outlets).total).toBe(12);
  });
});
