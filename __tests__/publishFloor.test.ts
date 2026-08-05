import {
  dossierRobotsMeta,
  isPublishableBill,
  isPublishableOrg,
  isPublishableOutlet,
  isPublishablePolitician,
} from "@/lib/publishFloor";
import type {
  BillProfile,
  OrgProfile,
  OutletProfile,
  PoliticianProfile,
} from "@/lib/types";

/**
 * These tests pin the publish floor. The same rule is expressed a second time
 * as SQL in `listSitemapEntries` (lib/db.ts) — if you change a predicate,
 * change that query too, and update the "mirrors the SQL" cases below.
 */

const politician: PoliticianProfile = {
  bioguideId: "M001153",
  name: "Lisa Murkowski",
  party: "R",
  state: "AK",
  chamber: "senate",
  committees: ["Appropriations"],
  topIndustriesCurrentCycle: [],
  interestGroupRatings: {},
  externalLinks: {},
  notes: null,
};

const org = {
  slug: "epa",
  name: "Environmental Protection Agency",
  type: "agency",
  selfDescription: null,
  selfDescriptionSource: null,
  selfDescriptionChecked: null,
  governanceStructure: null,
  governanceSource: null,
  foundedYear: 1970,
  annualBudgetUsd: null,
  annualBudgetFy: null,
  annualBudgetSource: null,
  majorFunders: [],
  faraRegistered: false,
  faraCountries: [],
  externalLinks: {},
  notes: null,
} as unknown as OrgProfile;

const bill: BillProfile = {
  billId: "hr-5376-117",
  congress: 117,
  title: "An Act...",
  shortTitle: "Inflation Reduction Act of 2022",
  sponsorBioguide: null,
  cosponsors: [],
  status: "enacted",
  introducedDate: "2021-09-27",
  lobbyingForUsd: null,
  lobbyingAgainstUsd: null,
  externalLinks: { congress: "https://www.congress.gov/bill/117/hr5376" },
  notes: null,
};

const outlet = {
  slug: "npr",
  name: "NPR",
  parentCompany: null,
  parentCompanyUrl: null,
  foundedYear: null,
  fundingModel: null,
  allSidesRating: null,
  allSidesUrl: null,
  allSidesLastChecked: null,
  mbfcFactual: null,
  mbfcUrl: null,
  mbfcLastChecked: null,
  majorFunders: [],
  externalLinks: {},
  notes: null,
} as unknown as OutletProfile;

describe("isPublishablePolitician", () => {
  it("publishes sitting Congress with committees or PAC industries", () => {
    expect(isPublishablePolitician(politician)).toBe(true);
    expect(
      isPublishablePolitician({
        ...politician,
        committees: [],
        topIndustriesCurrentCycle: [{ industry: "Oil & Gas", amount_usd: 1 }],
      }),
    ).toBe(true);
  });

  it("withholds a sitting member with neither", () => {
    expect(
      isPublishablePolitician({
        ...politician,
        committees: [],
        topIndustriesCurrentCycle: [],
      }),
    ).toBe(false);
  });

  it("withholds executive and foreign-executive regardless of content", () => {
    // Their only substantive content is uncited notes plus a Wikipedia link.
    for (const chamber of ["executive", "former", null] as const) {
      expect(
        isPublishablePolitician({
          ...politician,
          chamber: chamber as PoliticianProfile["chamber"],
        }),
      ).toBe(false);
    }
  });
});

describe("isPublishableOrg", () => {
  it("withholds an org with no sourced substantive field", () => {
    expect(isPublishableOrg(org)).toBe(false);
  });

  it("publishes on any one sourced field", () => {
    expect(
      isPublishableOrg({
        ...org,
        governanceStructure: "Five commissioners...",
        governanceSource: "https://example.gov",
      }),
    ).toBe(true);
    expect(
      isPublishableOrg({
        ...org,
        selfDescription: "We do things.",
        selfDescriptionSource: "https://example.org/about",
      }),
    ).toBe(true);
    expect(
      isPublishableOrg({
        ...org,
        annualBudgetUsd: 1_000,
        annualBudgetSource: "https://example.gov/990",
      }),
    ).toBe(true);
  });

  it("requires the source, not just the value", () => {
    expect(
      isPublishableOrg({ ...org, governanceStructure: "Five commissioners..." }),
    ).toBe(false);
    expect(isPublishableOrg({ ...org, selfDescription: "We do things." })).toBe(false);
    expect(isPublishableOrg({ ...org, annualBudgetUsd: 1_000 })).toBe(false);
  });

  it("treats whitespace-only strings as absent", () => {
    expect(
      isPublishableOrg({
        ...org,
        governanceStructure: "   ",
        governanceSource: "https://example.gov",
      }),
    ).toBe(false);
  });
});

describe("isPublishableBill", () => {
  it("needs a status and at least one link", () => {
    expect(isPublishableBill(bill)).toBe(true);
    expect(isPublishableBill({ ...bill, status: null })).toBe(false);
    expect(isPublishableBill({ ...bill, externalLinks: {} })).toBe(false);
  });
});

describe("isPublishableOutlet", () => {
  it("withholds an outlet with no cited rating", () => {
    expect(isPublishableOutlet(outlet)).toBe(false);
  });

  it("publishes on either rating when it carries its URL", () => {
    expect(
      isPublishableOutlet({
        ...outlet,
        allSidesRating: "center",
        allSidesUrl: "https://allsides.com/npr",
      }),
    ).toBe(true);
    expect(
      isPublishableOutlet({
        ...outlet,
        mbfcFactual: "high",
        mbfcUrl: "https://mediabiasfactcheck.com/npr/",
      }),
    ).toBe(true);
  });

  it("withholds a rating with no source URL", () => {
    expect(isPublishableOutlet({ ...outlet, allSidesRating: "center" })).toBe(false);
    expect(isPublishableOutlet({ ...outlet, mbfcFactual: "high" })).toBe(false);
  });
});

describe("dossierRobotsMeta", () => {
  it("omits the robots key entirely when publishable", () => {
    // Regression guard. This first shipped as `robots: dossierRobots(x)`
    // returning undefined, on the assumption that undefined inherits. It does
    // not: Next merges metadata by key, and a key *present* in the child wins
    // even when its value is undefined. Every publishable dossier lost the
    // max-image-preview:large googlebot directive from app/layout.tsx, which
    // only showed up when the rendered HTML was inspected. An empty object is
    // what actually inherits.
    const meta = dossierRobotsMeta(true);
    expect(meta).toEqual({});
    expect("robots" in meta).toBe(false);
  });

  it("noindexes but still follows when below the floor", () => {
    // follow:true on purpose — the page's outbound links to public records
    // are still worth crawling even when the page shouldn't rank.
    expect(dossierRobotsMeta(false)).toEqual({
      robots: { index: false, follow: true },
    });
  });

  it("spreads into metadata without clobbering sibling keys", () => {
    const publishable = { title: "t", ...dossierRobotsMeta(true) };
    const withheld = { title: "t", ...dossierRobotsMeta(false) };
    expect("robots" in publishable).toBe(false);
    expect(withheld.robots).toEqual({ index: false, follow: true });
  });
});
