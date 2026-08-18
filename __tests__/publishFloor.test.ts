import {
  dossierRobotsMeta,
  isPublishableBill,
  isPublishableOrg,
  isPublishableOutlet,
  isPublishablePolitician,
  isPublishableTerm,
  ROLE_VERIFICATION_MAX_AGE_DAYS,
  TERM_MIN_ARTICLES,
} from "@/lib/publishFloor";
import type {
  BillProfile,
  OrgProfile,
  OutletProfile,
  PoliticianProfile,
  TermProfile,
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
  interestGroupRatings: [],
  externalLinks: {},
  notes: null,
  role: {
    idSource: null,
    roleTitle: null,
    roleTitleSource: null,
    roleStartDate: null,
    roleEndDate: null,
    roleDatesSource: null,
    nominationDate: null,
    nominationUrl: null,
    confirmationDate: null,
    confirmationVoteUrl: null,
    confirmationVoteResult: null,
    predecessorName: null,
    predecessorSource: null,
    roleVerifiedAt: null,
  },
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

  it("withholds an executive row with no sourced role (migration 015)", () => {
    // Pre-015 state: uncited `notes` prose plus a Wikipedia link. Also covers
    // the 46 foreign heads of state, which have no primary-record substitute.
    for (const chamber of [
      "executive",
      "foreign-executive",
      "former",
      null,
    ] as const) {
      expect(
        isPublishablePolitician({
          ...politician,
          chamber: chamber as PoliticianProfile["chamber"],
          committees: [],
          topIndustriesCurrentCycle: [],
        }),
      ).toBe(false);
    }
  });

  it("publishes an executive row once the office title carries its source", () => {
    expect(
      isPublishablePolitician({
        ...politician,
        chamber: "executive",
        committees: [],
        topIndustriesCurrentCycle: [],
        role: {
          ...politician.role,
          roleTitle: "Secretary of Defense",
          roleTitleSource:
            "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section113",
        },
      }),
    ).toBe(true);
  });

  it("withholds an executive role title that lost its source", () => {
    // parseDbPoliticianProfile should never produce this pair, but the floor
    // is the last line of defence for a claim about a living person.
    expect(
      isPublishablePolitician({
        ...politician,
        chamber: "executive",
        committees: [],
        topIndustriesCurrentCycle: [],
        role: {
          ...politician.role,
          roleTitle: "Secretary of Defense",
          roleTitleSource: null,
        },
      }),
    ).toBe(false);
  });

  it("does not let committees rescue an unsourced executive row", () => {
    // Executive rows have no committee assignments; if one ever appeared it
    // must not become a back door around the sourcing requirement.
    expect(
      isPublishablePolitician({
        ...politician,
        chamber: "executive",
        committees: ["Appropriations"],
      }),
    ).toBe(false);
  });
});

describe("isPublishablePolitician — foreign-executive expiry (017)", () => {
  const NOW = new Date("2026-08-07T12:00:00Z");
  const foreign = (roleVerifiedAt: string | null): PoliticianProfile => ({
    ...politician,
    chamber: "foreign-executive",
    committees: [],
    topIndustriesCurrentCycle: [],
    role: {
      ...politician.role,
      roleTitle: "Prime Minister",
      roleTitleSource: "https://www.gov.uk/government/people/keir-starmer",
      roleVerifiedAt,
    },
  });

  it("publishes a foreign row checked recently", () => {
    expect(isPublishablePolitician(foreign("2026-08-01"), NOW)).toBe(true);
  });

  it("withholds one never checked", () => {
    // A sourced title is not enough on its own here: the source is a live page
    // that names the person, so an unknown check date is an unknown claim.
    expect(isPublishablePolitician(foreign(null), NOW)).toBe(false);
  });

  it("withholds one checked longer ago than the window", () => {
    const stale = new Date(NOW);
    stale.setUTCDate(stale.getUTCDate() - (ROLE_VERIFICATION_MAX_AGE_DAYS + 1));
    expect(
      isPublishablePolitician(foreign(stale.toISOString().slice(0, 10)), NOW),
    ).toBe(false);
  });

  it("still publishes exactly at the boundary", () => {
    const edge = new Date(NOW);
    edge.setUTCDate(edge.getUTCDate() - ROLE_VERIFICATION_MAX_AGE_DAYS);
    expect(
      isPublishablePolitician(foreign(edge.toISOString().slice(0, 10)), NOW),
    ).toBe(true);
  });

  it("rejects an unparseable date rather than treating it as fresh", () => {
    expect(isPublishablePolitician(foreign("not-a-date"), NOW)).toBe(false);
  });

  it("does NOT expire US executive or scotus rows", () => {
    // Their title is a statute and their appointment a permanent roll-call;
    // departure is caught by the successor's confirmation, not by a recheck.
    // Expiring them would drop 56 correct rows for lack of a script run.
    for (const chamber of ["executive", "scotus"] as const) {
      expect(
        isPublishablePolitician(
          { ...foreign(null), chamber },
          NOW,
        ),
      ).toBe(true);
    }
  });

  it("does not expire sitting Congress, which has no role source at all", () => {
    expect(isPublishablePolitician(politician, NOW)).toBe(true);
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

// ─── Terms ──────────────────────────────────────────────────────────────

const term = (over: Partial<TermProfile> = {}): TermProfile => ({
  slug: "temporary-protected-status",
  term: "Temporary Protected Status",
  definition: "A federal designation that lets nationals of a named country stay.",
  definitionSource: "https://www.law.cornell.edu/uscode/text/8/1254a",
  definitionChecked: "2026-08-10",
  aliases: ["TPS"],
  category: "immigration",
  notes: null,
  coverageArticleCount: 146,
  coverageComputedAt: "2026-08-18",
  ...over,
});

describe("isPublishableTerm", () => {
  it("publishes a sourced definition with measured coverage", () => {
    expect(isPublishableTerm(term())).toBe(true);
  });

  it("withholds a term whose definition lost its source", () => {
    // lib/term.ts nulls the pair, so this is what an unsourced row looks like
    // by the time the floor sees it.
    expect(isPublishableTerm(term({ definition: null, definitionSource: null }))).toBe(false);
  });

  it("draws the line at TERM_MIN_ARTICLES", () => {
    expect(isPublishableTerm(term({ coverageArticleCount: TERM_MIN_ARTICLES - 1 }))).toBe(false);
    expect(isPublishableTerm(term({ coverageArticleCount: TERM_MIN_ARTICLES }))).toBe(true);
  });

  it("treats a never-measured term as zero, not as unknown", () => {
    // A freshly seeded term has no count until refresh_term_coverage.py runs.
    // Failing closed costs a term publishing one refresh late; failing open
    // would publish a page on a number nobody has looked at.
    expect(isPublishableTerm(term({ coverageArticleCount: null }))).toBe(false);
  });

  it("reads the STORED count, so it cannot disagree with the sitemap", () => {
    // The sitemap filters `article_count >= TERM_MIN_ARTICLES` on the same
    // column. This predicate previously took a freshly computed TermCoverage,
    // which meant two numbers for one decision — and a page emitting noindex
    // while the sitemap advertised it. There is now one source.
    expect(isPublishableTerm(term({ coverageArticleCount: 1000 }))).toBe(true);
    expect(isPublishableTerm(term({ coverageArticleCount: 0 }))).toBe(false);
  });
});
