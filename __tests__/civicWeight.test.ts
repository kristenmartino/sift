import { CIVIC_BOOST, civicBoost, weightedCivicLinks } from "@/lib/civicWeight";
import type { EntityLink, EntityLinkType } from "@/lib/types";

function link(type: EntityLinkType, canonicalId: string): EntityLink {
  return { type, canonicalId, surfaceForm: canonicalId };
}

describe("weightedCivicLinks", () => {
  it("weights bills and politicians fully, orgs half, outlets not at all", () => {
    expect(
      weightedCivicLinks([
        link("bill", "hr-1234"),
        link("politician", "S000148"),
        link("org", "aclu"),
        link("outlet", "nytimes"),
      ]),
    ).toBe(2.5);
  });

  it("counts distinct (type, canonicalId) pairs once", () => {
    // The linker can emit the same entity for multiple surface forms
    // ("Schumer", "Chuck Schumer") — density means distinct entities,
    // not mention count.
    expect(
      weightedCivicLinks([
        link("politician", "S000148"),
        link("politician", "S000148"),
        link("politician", "P000197"),
      ]),
    ).toBe(2);
  });

  it("returns 0 for missing or empty links", () => {
    expect(weightedCivicLinks(undefined)).toBe(0);
    expect(weightedCivicLinks([])).toBe(0);
  });
});

describe("civicBoost", () => {
  it("is 1.0 at zero weight and caps at +30%", () => {
    expect(civicBoost(0)).toBe(1);
    expect(civicBoost(3)).toBeCloseTo(1 + CIVIC_BOOST * 3);
    // The cap is the safety property: no amount of civic density may
    // promote a routine item over a disaster.
    expect(civicBoost(50)).toBeCloseTo(1.3);
  });

  it("scales linearly below the cap", () => {
    expect(civicBoost(1.5)).toBeCloseTo(1.15);
  });
});
