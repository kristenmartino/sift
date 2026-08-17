import {
  billJsonLd,
  jsonLdString,
  orgJsonLd,
  outletJsonLd,
  politicianJsonLd,
  termJsonLd,
} from "@/lib/structuredData";
import type {
  BillProfile,
  OrgProfile,
  OutletProfile,
  PoliticianProfile,
} from "@/lib/types";

const politician: PoliticianProfile = {
  bioguideId: "M001153",
  name: "Lisa Murkowski",
  party: "R",
  state: "AK",
  chamber: "senate",
  committees: ["Appropriations", "Indian Affairs"],
  topIndustriesCurrentCycle: [{ industry: "Oil & Gas", amount_usd: 250_000 }],
  // A real entry, not []. The assertion below is that JSON-LD never restates
  // an advocacy group's score as Sift's structured claim; an empty fixture
  // would make that test pass without proving anything.
  interestGroupRatings: [{
    rater: "LCV",
    raterName: "League of Conservation Voters",
    score: 92,
    unit: "percent",
    year: 2025,
    lifetimeScore: 88,
    sourceUrl: "https://www.lcv.org/moc/lisa-a-murkowski/",
  }],
  externalLinks: {
    govtrack: "https://www.govtrack.us/congress/members/lisa_murkowski/300075",
    wikipedia: "https://en.wikipedia.org/wiki/Lisa_Murkowski",
  },
  notes: "Uncited prose that must never reach structured data.",
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

const org: OrgProfile = {
  slug: "environmental-protection-agency",
  name: "Environmental Protection Agency",
  type: "agency",
  selfDescription: null,
  selfDescriptionSource: null,
  selfDescriptionChecked: null,
  governanceStructure: null,
  governanceSource: null,
  foundedYear: 1970,
  annualBudgetUsd: 36_970_000_000,
  annualBudgetFy: "FY2027",
  annualBudgetSource: "https://www.whitehouse.gov/example.xlsx",
  annualBudgetKind: "ombOutlays",
  majorFunders: [],
  faraRegistered: false,
  faraCountries: [],
  externalLinks: {
    official: "https://www.epa.gov/",
    wikipedia: "https://en.wikipedia.org/wiki/United_States_Environmental_Protection_Agency",
    // Provenance for the budget figure — NOT another identity for the EPA.
    budget_source: "https://www.whitehouse.gov/wp-content/uploads/hist04z1_fy2027.xlsx",
    budget_source_fiscal_year: "FY2027",
  },
  notes: null,
} as OrgProfile;

const bill: BillProfile = {
  billId: "hr-5376-117",
  congress: 117,
  title: "An Act to provide for reconciliation pursuant to title II of S. Con. Res. 14.",
  shortTitle: "Inflation Reduction Act of 2022",
  sponsorBioguide: "Y000065",
  cosponsors: [],
  status: "enacted",
  introducedDate: "2021-09-27",
  lobbyingForUsd: 1_000_000,
  lobbyingAgainstUsd: null,
  externalLinks: {
    congress: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
  },
  notes: null,
};

const outlet: OutletProfile = {
  slug: "npr",
  name: "NPR",
  parentCompany: "National Public Radio Inc.",
  parentCompanyUrl: null,
  foundedYear: 1970,
  fundingModel: "public-service",
  allSidesRating: "center",
  allSidesUrl: "https://www.allsides.com/news-source/npr-media-bias",
  allSidesLastChecked: "2026-01-01",
  mbfcFactual: "high",
  mbfcUrl: "https://mediabiasfactcheck.com/npr/",
  mbfcLastChecked: "2026-01-01",
  majorFunders: [],
  externalLinks: { wikipedia: "https://en.wikipedia.org/wiki/NPR" },
  notes: null,
};

describe("politicianJsonLd", () => {
  it("emits a Person with the canonical id and committee memberships", () => {
    const ld = politicianJsonLd(politician);
    expect(ld["@type"]).toBe("Person");
    expect(ld["@id"]).toBe("https://siftnews.io/politician/M001153");
    expect(ld.jobTitle).toBe("United States Senator");
    expect(ld.memberOf).toHaveLength(3); // Senate + 2 committees
  });

  it("never emits notes — uncited prose about a living person", () => {
    expect(JSON.stringify(politicianJsonLd(politician))).not.toContain("Uncited prose");
  });

  it("never emits PAC figures or advocacy-group scores", () => {
    // These are third-party assessments the page presents verbatim with a
    // link. Restating one as Sift's own machine-readable claim about a named
    // living person is the framing D37 rejects.
    const s = JSON.stringify(politicianJsonLd(politician));
    expect(s).not.toContain("250000");
    expect(s).not.toContain("LCV");
    expect(s).not.toContain("League of Conservation Voters");
    expect(s).not.toContain("92");
    expect(s).not.toContain("lcv.org");
  });

  it("omits jobTitle for a chamber with no defined role", () => {
    const ld = politicianJsonLd({ ...politician, chamber: null });
    expect(ld.jobTitle).toBeUndefined();
    expect(ld.memberOf).toHaveLength(2); // committees only
  });
});

describe("orgJsonLd", () => {
  it("uses GovernmentOrganization for agencies and Organization otherwise", () => {
    expect(orgJsonLd(org)["@type"]).toBe("GovernmentOrganization");
    expect(orgJsonLd({ ...org, type: "think-tank" })["@type"]).toBe("Organization");
  });

  it("excludes provenance links from sameAs", () => {
    const ld = orgJsonLd(org);
    expect(ld.sameAs).toEqual([
      "https://en.wikipedia.org/wiki/United_States_Environmental_Protection_Agency",
      "https://www.epa.gov/",
    ]);
    expect(JSON.stringify(ld)).not.toContain("hist04z1");
    expect(JSON.stringify(ld)).not.toContain("FY2027");
  });

  it("never emits foundingDate — founded_year is unsourced", () => {
    expect(orgJsonLd(org).foundingDate).toBeUndefined();
  });

  it("never emits the budget figure", () => {
    expect(JSON.stringify(orgJsonLd(org))).not.toContain("36970000000");
  });

  it("emits description only when the self-description carries its source", () => {
    expect(orgJsonLd(org).description).toBeUndefined();
    expect(
      orgJsonLd({ ...org, selfDescription: "We do things." }).description,
    ).toBeUndefined();
    expect(
      orgJsonLd({
        ...org,
        selfDescription: "We do things.",
        selfDescriptionSource: "https://example.org/about",
      }).description,
    ).toBe("We do things.");
  });
});

describe("billJsonLd", () => {
  it("emits Legislation with the display identifier", () => {
    const ld = billJsonLd(bill);
    expect(ld["@type"]).toBe("Legislation");
    expect(ld.legislationIdentifier).toBe("H.R. 5376 (117th Congress)");
    expect(ld.legislationDate).toBe("2021-09-27");
  });

  it("claims legislationPassedBy only for enacted bills", () => {
    expect(billJsonLd(bill).legislationPassedBy).toBeDefined();
    for (const status of ["introduced", "committee", "failed", "vetoed"] as const) {
      expect(billJsonLd({ ...bill, status }).legislationPassedBy).toBeUndefined();
    }
  });

  it("never emits lobbying figures", () => {
    expect(JSON.stringify(billJsonLd(bill))).not.toContain("1000000");
  });
});

describe("outletJsonLd", () => {
  it("emits NewsMediaOrganization with the parent company", () => {
    const ld = outletJsonLd(outlet);
    expect(ld["@type"]).toBe("NewsMediaOrganization");
    expect(ld.parentOrganization).toEqual({
      "@type": "Organization",
      name: "National Public Radio Inc.",
    });
  });

  it("never restates AllSides or MBFC ratings as Sift's own claim", () => {
    const s = JSON.stringify(outletJsonLd(outlet));
    expect(s).not.toContain("allsides");
    expect(s).not.toContain("mediabiasfactcheck");
    expect(s).not.toContain("center");
  });
});

describe("jsonLdString", () => {
  it("escapes < so a value cannot close the script tag early", () => {
    const out = jsonLdString({ name: "</script><img src=x onerror=alert(1)>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("round-trips to the same object once unescaped", () => {
    const ld = politicianJsonLd(politician);
    expect(JSON.parse(jsonLdString(ld).replace(/\\u003c/g, "<"))).toEqual(ld);
  });
});

// ─── Terms ──────────────────────────────────────────────────────────────

describe("termJsonLd", () => {
  const term = {
    slug: "temporary-protected-status",
    term: "Temporary Protected Status",
    definition: "A federal designation that lets nationals of a named country stay.",
    definitionSource: "https://www.law.cornell.edu/uscode/text/8/1254a",
    definitionChecked: "2026-08-10",
    aliases: ["TPS"],
    category: "immigration",
    notes: "133 corpus articles as of 2026-08-10.",
  };

  it("emits a DefinedTerm with the definition and its citation", () => {
    const ld = termJsonLd(term);
    expect(ld["@type"]).toBe("DefinedTerm");
    expect(ld.name).toBe("Temporary Protected Status");
    expect(ld.description).toContain("federal designation");
    expect(ld.citation).toBe("https://www.law.cornell.edu/uscode/text/8/1254a");
    expect(ld.alternateName).toEqual(["TPS"]);
  });

  it("emits neither description nor citation when the pair was dropped", () => {
    // The header rule: JSON-LD must never assert more than the row can
    // source. `description` is safe here *only* because lib/term.ts
    // guarantees it never survives without its source — so the unsourced
    // state has to produce neither half, not a bare definition.
    const ld = termJsonLd({ ...term, definition: null, definitionSource: null });
    expect("description" in ld).toBe(false);
    expect("citation" in ld).toBe(false);
    expect(ld.name).toBe("Temporary Protected Status");
  });

  it("never emits the coverage numbers or an invented term set", () => {
    // Coverage is true of Sift's index on the day it was computed. As prose
    // beside the articles it counts that is visible; as structured data it is
    // a bare number a crawler may restate long after it stopped being true.
    const ld = termJsonLd(term);
    for (const k of ["inDefinedTermSet", "interactionStatistic", "mentions"]) {
      expect(k in ld).toBe(false);
    }
    // `notes` is uncited prose, same as every other type.
    expect(JSON.stringify(ld)).not.toContain("133 corpus articles");
  });

  it("omits alternateName when there are no aliases", () => {
    expect("alternateName" in termJsonLd({ ...term, aliases: [] })).toBe(false);
  });

  it("points @id, url and mainEntityOfPage at the canonical route", () => {
    const ld = termJsonLd(term);
    const url = "https://siftnews.io/term/temporary-protected-status";
    expect(ld["@id"]).toBe(url);
    expect(ld.url).toBe(url);
    expect(ld.mainEntityOfPage).toBe(url);
  });
});
