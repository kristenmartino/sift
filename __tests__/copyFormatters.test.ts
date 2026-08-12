/**
 * Tests for the computed strings in lib/copy.ts that `__tests__/copy.test.ts`
 * doesn't reach — every remaining formatter that branches.
 *
 * These read as trivial template literals, but each branch is a claim the
 * page makes to a reader who checks sources: a count that says "1 entries",
 * a citation that names a verification date it doesn't have, or a FARA line
 * that names one country when the filing lists three. Pluralization and
 * the null/empty branches are the whole surface area, so they're what's
 * asserted — the fixed prose is left alone.
 */
import { COPY } from "@/lib/copy";

describe("share.citation", () => {
  const { citation } = COPY.share;

  it("builds a works-cited line from the page's entry, address, and access date", () => {
    expect(
      citation("Chuck Schumer", "https://siftnews.io/politician/S000148", "August 12, 2026", []),
    ).toBe(
      "\u201cChuck Schumer.\u201d Sift, https://siftnews.io/politician/S000148. Accessed August 12, 2026.",
    );
  });

  it("appends the underlying data sources when the page has any", () => {
    expect(
      citation("Chuck Schumer", "https://siftnews.io/x", "August 12, 2026", [
        "GovTrack",
        "OpenSecrets",
      ]),
    ).toContain("Underlying data: GovTrack, OpenSecrets.");
  });

  it("omits the data sentence entirely rather than trailing an empty one", () => {
    expect(citation("A", "https://siftnews.io/x", "today", [])).not.toContain(
      "Underlying data",
    );
  });
});

describe("compare — progress and result meta", () => {
  it("pluralizes the outlet count in the search stage line", () => {
    expect(COPY.compare.stageSearch(1)).toBe("Searching 1 outlet\u2026");
    expect(COPY.compare.stageSearch(5)).toBe("Searching 5 outlets\u2026");
    expect(COPY.compare.stageSearch(0)).toBe("Searching 0 outlets\u2026");
  });

  it("lists the outlets being compared", () => {
    expect(COPY.compare.comparing("Reuters, Fox News")).toBe(
      "Comparing: Reuters, Fox News",
    );
  });

  it("pluralizes the result-meta counts independently", () => {
    expect(COPY.compare.metaSources(1)).toBe("1 source checked");
    expect(COPY.compare.metaSources(4)).toBe("4 sources checked");
    expect(COPY.compare.metaClaims(1)).toBe("1 claim analyzed");
    expect(COPY.compare.metaClaims(7)).toBe("7 claims analyzed");
  });

  it("dates the anonymous daily example rather than presenting it as live", () => {
    expect(COPY.compare.dailyBody("this morning")).toBe(
      "A real comparison from the tool, generated this morning.",
    );
  });
});

describe("stories.moreFromOutlet", () => {
  it("names the outlet the extra articles came from", () => {
    expect(COPY.stories.moreFromOutlet(3, "Reuters")).toBe("+3 more from Reuters");
  });
});

describe("orgDossier.fundingEdges", () => {
  const { grantsIntro, heldReviewNote, heldUnmatchedNote, sourceLink } =
    COPY.orgDossier.fundingEdges;

  it("pluralizes the grant count and attributes the figures to the filing", () => {
    expect(grantsIntro(1, "$5,000", "FY2023")).toContain("1 grant of $5,000 or more");
    expect(grantsIntro(12, "$4.2M", "FY2023")).toContain("12 grants of $5,000 or more");
    expect(grantsIntro(12, "$4.2M", "FY2023")).toContain(
      "the organization's own Form 990 for FY2023",
    );
  });

  it("keeps the two withholding reasons distinct and separately pluralized", () => {
    expect(heldReviewNote(1)).toContain("1 further entry is withheld");
    expect(heldReviewNote(4)).toContain("4 further entries are withheld");
    expect(heldReviewNote(4)).toContain("doesn't match the IRS record");

    expect(heldUnmatchedNote(1)).toContain("1 more recipient is not shown");
    expect(heldUnmatchedNote(3)).toContain("3 more recipients are not shown");
    expect(heldUnmatchedNote(3)).toContain("index of electronic filers");
  });

  it("never explains an unmatched EIN as a name mismatch", () => {
    // The defect this split exists to prevent: a confident wrong reason.
    expect(heldUnmatchedNote(2)).not.toContain("doesn't match the IRS record");
    expect(heldReviewNote(2)).not.toContain("electronic filers");
  });

  it("cites the tax period on the source link", () => {
    expect(sourceLink("FY2023")).toBe("Source: Form 990, tax period FY2023");
  });
});

describe("org self-description + FARA copy", () => {
  const { selfDescriptionCitation, faraRegisteredBody, foundedYearLabel } =
    COPY.orgDossier;

  it("names a verification date only when there is one", () => {
    expect(selfDescriptionCitation("2026-07-30")).toBe(
      "Source: the organization's own site \u00b7 last verified 2026-07-30",
    );
    expect(selfDescriptionCitation(null)).toBe(
      "Source: the organization's own site",
    );
  });

  it("states FARA registration without naming a client when none is listed", () => {
    expect(faraRegisteredBody([])).toBe(
      "This organization is registered with the U.S. Department of Justice under FARA.",
    );
  });

  it("names a single client inline and multiple clients as a list", () => {
    expect(faraRegisteredBody(["Japan"])).toBe(
      "This organization is registered with the U.S. Department of Justice under FARA on behalf of Japan.",
    );
    expect(faraRegisteredBody(["Japan", "Qatar", "Türkiye"])).toBe(
      "This organization is registered with the U.S. Department of Justice under FARA on behalf of: Japan, Qatar, Türkiye.",
    );
  });

  it("labels the founding year", () => {
    expect(foundedYearLabel(1973)).toBe("Founded 1973");
  });
});

describe("billDossier.cosponsorCount", () => {
  const { cosponsorCount } = COPY.billDossier;

  it("says so plainly when there are none", () => {
    expect(cosponsorCount(0)).toBe("No cosponsors recorded.");
  });

  it("pluralizes and thousands-separates", () => {
    expect(cosponsorCount(1)).toBe("1 cosponsor");
    expect(cosponsorCount(42)).toBe("42 cosponsors");
    expect(cosponsorCount(1234)).toBe("1,234 cosponsors");
  });
});

describe("dossier.citation", () => {
  it("appends the verification date only when the record carries one", () => {
    expect(COPY.dossier.citation("AllSides", "2026-06-01")).toBe(
      "Source: AllSides \u00b7 last verified 2026-06-01",
    );
    expect(COPY.dossier.citation("AllSides", null)).toBe("Source: AllSides");
  });
});

describe("agencies page — computed findings", () => {
  const { capLabel, capExplainer, countLine, incomplete } = COPY.agencies;

  it("states the party cap as the numbers the statute sets", () => {
    expect(capLabel(3, 6)).toBe("Max 3 of 6 from one party");
    expect(capLabel(2, 3)).toBe("Max 2 of 3 from one party");
  });

  it("opens the cap explainer with the live capped/total counts", () => {
    expect(capExplainer(14, 25)).toMatch(/^14 of these 25 agencies operate under/);
  });

  it("pluralizes the cited-law count line", () => {
    expect(countLine(1)).toBe("1 agency with cited governing law");
    expect(countLine(25)).toBe("25 agencies with cited governing law");
  });

  it("derives the omitted-agency count by subtraction", () => {
    expect(incomplete(25, 93)).toMatch(/^The other 68 agencies/);
    expect(incomplete(93, 93)).toMatch(/^The other 0 agencies/);
  });
});

describe("think-tanks page — computed findings", () => {
  const { countLine, faraBadge, finding } = COPY.thinkTanks;

  it("pluralizes the quoted-organization count", () => {
    expect(countLine(1)).toBe("1 organization, quoted and cited");
    expect(countLine(18)).toBe("18 organizations, quoted and cited");
  });

  it("lists the represented countries on the FARA badge when known", () => {
    expect(faraBadge(["Japan", "Qatar"])).toBe(
      "Registered foreign agent \u00b7 Japan, Qatar",
    );
    expect(faraBadge([])).toBe("Registered foreign agent");
  });

  it("opens the finding with the live claiming/total counts", () => {
    expect(finding(7, 18)).toMatch(/^7 of these 18 state an ideology/);
  });
});

describe("civicIndex — counts and filter state", () => {
  const C = COPY.civicIndex;

  it("puts each section's count in its eyebrow", () => {
    expect(C.politiciansEyebrow(536)).toBe("Politicians \u00b7 536");
    expect(C.orgsEyebrow(41)).toBe("Organizations \u00b7 41");
    expect(C.billsEyebrow(3)).toBe("Bills \u00b7 3");
  });

  it("builds the org subhead from live counts, in an Oxford-comma-free list", () => {
    expect(C.orgsSubhead(12, 4, 25)).toBe(
      "12 think tanks, 4 advocacy organizations and 25 federal agencies.",
    );
  });

  it("pluralizes each org bucket independently, including 'agency'", () => {
    expect(C.orgsSubhead(1, 1, 1)).toBe(
      "1 think tank, 1 advocacy organization and 1 federal agency.",
    );
  });

  it("drops empty buckets instead of printing a zero", () => {
    expect(C.orgsSubhead(12, 0, 25)).toBe(
      "12 think tanks and 25 federal agencies.",
    );
    expect(C.orgsSubhead(0, 0, 25)).toBe("25 federal agencies.");
  });

  it("returns an empty subhead when there are no orgs at all", () => {
    expect(C.orgsSubhead(0, 0, 0)).toBe("");
  });

  it("distinguishes the unfiltered total from a filtered subset", () => {
    expect(C.showingAll(1234)).toBe("1,234 total");
    expect(C.showingFiltered(100, 1234)).toBe("100 of 1,234");
  });
});

describe("landingReskin — live-example and outlet-count lines", () => {
  it("dates the live compare example and calls it one a day", () => {
    expect(COPY.landingReskin.compare.liveNote("August 12")).toContain(
      "Generated August 12 by the compare tool",
    );
  });

  it("drops the number from the sources title when the count is unknown", () => {
    expect(COPY.landingReskin.sources.titleIt(77)).toBe("77 curated outlets.");
    expect(COPY.landingReskin.sources.titleIt(0)).toBe("Curated outlets.");
  });
});
