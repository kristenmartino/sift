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

describe("term.coverageSummary", () => {
  const { coverageSummary } = COPY.term;

  it("pluralizes stories and outlets independently", () => {
    expect(coverageSummary(146, 23)).toBe(
      "146 stories in Sift's index, from 23 outlets.",
    );
    expect(coverageSummary(1, 1)).toBe("1 story in Sift's index, from 1 outlet.");
    expect(coverageSummary(2, 1)).toBe("2 stories in Sift's index, from 1 outlet.");
  });

  it("groups thousands, because the corpus is large enough to need it", () => {
    expect(coverageSummary(1234, 1002)).toBe(
      "1,234 stories in Sift's index, from 1,002 outlets.",
    );
  });

  it("scopes the count to Sift's index rather than the press at large", () => {
    // The corpus is a sample. "146 stories" unqualified reads as a claim
    // about how much coverage exists, which is not something Sift knows.
    expect(coverageSummary(146, 23)).toContain("in Sift's index");
  });
});

describe("term.dateSpan", () => {
  const { dateSpan } = COPY.term;

  it("collapses to one date when first and last are the same day", () => {
    expect(dateSpan("2026-08-15", "2026-08-15")).toBe("Filed 2026-08-15.");
  });

  it("prints a range otherwise", () => {
    expect(dateSpan("2026-04-08", "2026-08-15")).toBe(
      "Filed 2026-04-08 — 2026-08-15.",
    );
  });
});

describe("term.spreadNote", () => {
  const { spreadNote } = COPY.term;

  it("attributes the positions to AllSides, never to Sift", () => {
    // D37: a third-party rating is surfaced verbatim and attributed. The page
    // does not characterize an outlet's politics on its own authority.
    expect(spreadNote(0)).toContain("AllSides' published ratings");
  });

  it("says nothing about unplaced stories when every story is placed", () => {
    expect(spreadNote(0)).not.toContain("counted in the total above");
  });

  it("names BOTH reasons a story can go unplaced", () => {
    // This is the fix, and the reason it matters. The note used to say only
    // "outlets AllSides has not rated" — but AllSides rates The Guardian, the
    // NYT and the WaPo; Sift was failing to match their feed names. Blaming
    // the rater for our own join gap understated left coverage by 2.4x,
    // because the unmatched outlets skew left. Both causes must be named.
    const note = spreadNote(40);
    expect(note).toContain("no published rating");
    expect(note).toContain("not yet matched the name it files under");
  });

  it("pluralizes the unplaced count", () => {
    expect(spreadNote(1)).toContain("1 story is counted");
    expect(spreadNote(4)).toContain("4 stories are counted");
    expect(spreadNote(1500)).toContain("1,500 stories are counted");
  });
});

describe("term.definitionCitation", () => {
  const { definitionCitation } = COPY.term;

  it("names the source and the date it was last verified", () => {
    expect(definitionCitation("law.cornell.edu", "2026-08-10")).toBe(
      "Definition drawn from law.cornell.edu · last verified 2026-08-10",
    );
  });

  it("omits the verification clause rather than implying an unchecked date", () => {
    expect(definitionCitation("law.cornell.edu", null)).toBe(
      "Definition drawn from law.cornell.edu",
    );
  });
});

describe("term.coverageMethod", () => {
  it("tells the reader the count includes stories that never print the term", () => {
    // Not decoration. Once the primer counts, the story list contains pieces
    // whose headline and summary never use the term — a reader who clicks
    // through and finds one would otherwise conclude the count is wrong.
    const m = COPY.term.coverageMethod;
    expect(m).toContain("headline or summary");
    expect(m).toContain("reading notes");
    expect(m).toMatch(/never spell out|never print/);
  });

  it("does not describe the reading notes as a source or a definition", () => {
    // The primer is a coverage signal only. Every primer term in the corpus
    // carries source: null, which is the entire reason term_profiles exists.
    expect(COPY.term.coverageMethod).not.toMatch(/\bsource\b|\bcited\b|\bdefines\b/i);
  });
});

describe("termIndex formatters", () => {
  const c = COPY.termIndex;

  it("does not shadow COPY.glossary, which is the entity-chip layer", () => {
    // The first draft of this page used `glossary` for both. It type-checked
    // as a duplicate object key, silently shadowed the chip namespace, and
    // broke EntityChipTooltip and EntityLinksList. Pinning both shapes so a
    // future rename cannot quietly do it again.
    expect(COPY.glossary.eyebrow).toBe("Mentioned in this story");
    expect(COPY.glossary.typeGlyphs).toBeDefined();
    expect(c.eyebrow).toBe("Civic glossary");
  });

  it("states the finding with real numbers and names the starkest term", () => {
    const f = c.finding(1030, 4828, "Prior Restraint");
    expect(f).toContain("1,030");
    expect(f).toContain("4,828");
    expect(f).toContain("21 in every 100");
    expect(f).toContain("Prior Restraint");
  });

  it("says nothing about held-back terms when none are held back", () => {
    // A "0 further terms are held back" sentence is noise, and the negative
    // case would read as an error.
    expect(c.gapNote(24, 24)).toBe("");
    expect(c.gapNote(24, 20)).toBe("");
  });

  it("pluralizes the held-back note", () => {
    expect(c.gapNote(24, 25)).toContain("1 further term is");
    expect(c.gapNote(24, 27)).toContain("3 further terms are");
  });

  it("pluralizes the per-row coverage line", () => {
    expect(c.rowCoverage(1, 1)).toBe("1 story · 1 outlet");
    expect(c.rowCoverage(1234, 23)).toBe("1,234 stories · 23 outlets");
  });

  it("omits the never-named share when every story names the term", () => {
    expect(c.rowUnnamed(0, 100)).toBe("");
    expect(c.rowUnnamed(128, 128)).toBe("100% never name it");
    expect(c.rowUnnamed(69, 75)).toBe("92% never name it");
  });

  it("pluralizes the term count", () => {
    expect(c.countLabel(1)).toContain("1 term,");
    expect(c.countLabel(24)).toContain("24 terms,");
  });
});
