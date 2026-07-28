import {
  hasPartisanBalanceCap,
  sortAgencies,
  sourceLabel,
} from "@/lib/agencies";
import type { AgencyGovernance } from "@/lib/types";

// Real strings from prod org_profiles.governance_structure (migration 012).
// Using the actual text matters: the matcher exists to read Congress's own
// phrasings, which vary across statutes, and a paraphrase would not test that.
const FTC =
  "Independent regulatory commission. Five commissioners appointed by the President with the advice and consent of the Senate, serving seven-year terms. Not more than three commissioners may be members of the same political party.";
const FCC =
  "Independent regulatory commission. Five commissioners appointed by the President with the advice and consent of the Senate, serving five-year terms. No more than three commissioners may belong to the same political party.";
const CPSC =
  "Independent regulatory commission. Five commissioners appointed by the President with the advice and consent of the Senate, serving seven-year terms. Not more than three commissioners may be affiliated with the same political party.";
const NTSB =
  "Independent board of five members appointed by the President with the advice and consent of the Senate, serving five-year terms. Not more than three members may be appointed from the same political party.";
const NCUA =
  "Governed by a three-member Board appointed by the President with the advice and consent of the Senate, serving six-year terms. Not more than two Board members may be of the same political party.";
const NLRB =
  "Independent agency. Five members appointed by the President with the advice and consent of the Senate, serving five-year terms. The statute sets no partisan-balance requirement.";
const TREASURY =
  "Executive department. The Secretary of the Treasury is appointed by the President with the advice and consent of the Senate.";

function agency(
  name: string,
  governanceStructure: string,
  slug = name.toLowerCase().replace(/\s+/g, "-")
): AgencyGovernance {
  return {
    slug,
    name,
    governanceStructure,
    governanceSource: "https://www.law.cornell.edu/uscode/text/15/41",
    hasPartisanBalanceCap: hasPartisanBalanceCap(governanceStructure),
  };
}

describe("hasPartisanBalanceCap", () => {
  it("matches every phrasing Congress actually uses across these statutes", () => {
    // "may be members of" / "may belong to" / "may be affiliated with" /
    // "may be appointed from" / "may be of" — five different verbs, one fact.
    expect(hasPartisanBalanceCap(FTC)).toBe(true);
    expect(hasPartisanBalanceCap(FCC)).toBe(true);
    expect(hasPartisanBalanceCap(CPSC)).toBe(true);
    expect(hasPartisanBalanceCap(NTSB)).toBe(true);
    expect(hasPartisanBalanceCap(NCUA)).toBe(true);
  });

  it("is false when a statute sets no cap — the absence is the finding", () => {
    // The NLRB text mentions partisan balance only to say there isn't one.
    // A naive /partisan/ matcher would get this backwards and badge it.
    expect(hasPartisanBalanceCap(NLRB)).toBe(false);
  });

  it("is false for executive departments, which have no such concept", () => {
    expect(hasPartisanBalanceCap(TREASURY)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(hasPartisanBalanceCap("NOT MORE THAN THREE ... SAME POLITICAL PARTY"))
      .toBe(true);
  });

  it("does not fire on unrelated mentions of politics", () => {
    expect(
      hasPartisanBalanceCap("A nonpartisan agency with no political appointees.")
    ).toBe(false);
  });
});

describe("sortAgencies", () => {
  it("puts capped agencies first, alphabetical within each group", () => {
    const sorted = sortAgencies([
      agency("Treasury", TREASURY),
      agency("Federal Trade Commission", FTC),
      agency("National Labor Relations Board", NLRB),
      agency("Consumer Product Safety Commission", CPSC),
    ]);
    expect(sorted.map((a) => a.name)).toEqual([
      "Consumer Product Safety Commission",
      "Federal Trade Commission",
      "National Labor Relations Board",
      "Treasury",
    ]);
    // Capped block is contiguous and leads.
    expect(sorted.slice(0, 2).every((a) => a.hasPartisanBalanceCap)).toBe(true);
    expect(sorted.slice(2).every((a) => !a.hasPartisanBalanceCap)).toBe(true);
  });

  it("does not mutate its input", () => {
    const input = [agency("Treasury", TREASURY), agency("FTC", FTC)];
    const before = input.map((a) => a.name);
    sortAgencies(input);
    expect(input.map((a) => a.name)).toEqual(before);
  });

  it("handles an empty list", () => {
    expect(sortAgencies([])).toEqual([]);
  });
});

describe("sourceLabel", () => {
  it("returns a short checkable host", () => {
    expect(sourceLabel("https://www.law.cornell.edu/uscode/text/15/41")).toBe(
      "law.cornell.edu"
    );
    expect(sourceLabel("https://www.epa.gov/archive/epa/aboutepa/x.html")).toBe(
      "epa.gov"
    );
  });

  it("degrades to a neutral label on an unparseable URL", () => {
    expect(sourceLabel("not a url")).toBe("source");
  });
});
