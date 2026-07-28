import { claimsNonPartisanship, sortSelfDescribed } from "@/lib/thinkTanks";
import type { SelfDescribedOrg } from "@/lib/types";

// Real self_description strings from prod (migration 012), quoted from each
// organization's own site. Paraphrases would defeat the point: the matcher
// exists to read these organizations' actual wording.
const BROOKINGS =
  "Brookings equips decisionmakers with nonpartisan research and policy strategies to create a more prosperous and secure country and world.";
const CATO =
  "assiduously nonpartisan and independent public policy research organization—or think tank—that creates a presence for and promotes libertarian ideas";
const CAP =
  "independent, nonpartisan policy institute … As progressives, we believe America should be a land of boundless opportunity";
const EPI =
  "a nonprofit, nonpartisan think tank working for the last 30 years to counter rising inequality, low wages and weak benefits for working people … recognized as national leaders on breakthrough liberal economic policies";
const FEDSOC =
  "Founded in 1982, the Federalist Society for Law and Public Policy Studies is a group of conservatives and libertarians dedicated to reforming the current legal order … Beyond our statement of purpose the Federalist Society takes no public policy positions and does not participate in activism of any kind.";
const HERITAGE =
  "Heritage’s mission is to formulate and promote conservative public policies based on the principles of free enterprise, limited government, individual freedom, traditional American values, and a strong national defense.";
const ACS = "the nation's foremost progressive legal organization";
const MANHATTAN =
  "dedicated to advancing opportunity, individual liberty, and the rule of law in America and its great cities";

function org(
  name: string,
  selfDescription: string,
  extra: Partial<SelfDescribedOrg> = {}
): SelfDescribedOrg {
  return {
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    type: "think-tank",
    selfDescription,
    selfDescriptionSource: "https://example.org/about",
    selfDescriptionChecked: "2026-07-27",
    faraRegistered: false,
    faraCountries: [],
    claimsNonPartisanship: claimsNonPartisanship(selfDescription),
    ...extra,
  };
}

describe("claimsNonPartisanship", () => {
  it("catches the plain 'nonpartisan' claim across spellings", () => {
    expect(claimsNonPartisanship(BROOKINGS)).toBe(true);
    expect(claimsNonPartisanship(CATO)).toBe(true);
    expect(claimsNonPartisanship(CAP)).toBe(true);
    expect(claimsNonPartisanship(EPI)).toBe(true);
    expect(claimsNonPartisanship("an independent, non-partisan institute")).toBe(
      true
    );
  });

  it("catches a disclaimer of taking positions, not just the word", () => {
    // The Federalist Society never says "nonpartisan" — it says it takes no
    // public policy positions. Same claim, different words; missing it would
    // undercount the finding the page leads with.
    expect(FEDSOC.toLowerCase()).not.toContain("nonpartisan");
    expect(claimsNonPartisanship(FEDSOC)).toBe(true);
  });

  it("is false for organizations that make no such claim", () => {
    expect(claimsNonPartisanship(HERITAGE)).toBe(false);
    expect(claimsNonPartisanship(ACS)).toBe(false);
    expect(claimsNonPartisanship(MANHATTAN)).toBe(false);
  });

  it("does not fire on 'partisan' alone", () => {
    // "deeply partisan" is the opposite claim and must not be counted.
    expect(claimsNonPartisanship("a deeply partisan advocacy group")).toBe(
      false
    );
  });

  it("reproduces the page's headline count on the real ten", () => {
    const all = [
      BROOKINGS, CATO, CAP, EPI, FEDSOC,
      HERITAGE, ACS, MANHATTAN,
      "a public policy think tank dedicated to defending human dignity, expanding human potential, and building a freer and safer world",
      "Drawing on the legacy of Franklin and Eleanor Roosevelt, the Roosevelt Institute champions new ideas and new leaders to make our economy and democracy work for the many, not the few.",
    ];
    expect(all.filter(claimsNonPartisanship)).toHaveLength(5);
  });
});

describe("sortSelfDescribed", () => {
  it("puts non-partisanship claimants first, alphabetical within group", () => {
    const sorted = sortSelfDescribed([
      org("Heritage Foundation", HERITAGE),
      org("Cato Institute", CATO),
      org("American Constitution Society", ACS),
      org("Brookings Institution", BROOKINGS),
    ]);
    expect(sorted.map((o) => o.name)).toEqual([
      "Brookings Institution",
      "Cato Institute",
      "American Constitution Society",
      "Heritage Foundation",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [org("Heritage Foundation", HERITAGE), org("Cato", CATO)];
    const before = input.map((o) => o.name);
    sortSelfDescribed(input);
    expect(input.map((o) => o.name)).toEqual(before);
  });

  it("handles an empty list", () => {
    expect(sortSelfDescribed([])).toEqual([]);
  });
});
