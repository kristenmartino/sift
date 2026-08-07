import { COPY } from "@/lib/copy";

describe("COPY strings", () => {
  describe("search.resultsFor", () => {
    it("wraps query in curly quotes", () => {
      expect(COPY.search.resultsFor("AI")).toBe("Results for \u201cAI\u201d");
    });
  });

  describe("stories.sourcesBadge", () => {
    it("returns singular for 1 source", () => {
      expect(COPY.stories.sourcesBadge(1)).toBe("1 source");
    });

    it("returns plural for multiple sources", () => {
      expect(COPY.stories.sourcesBadge(3)).toBe("3 sources");
    });
  });

  describe("stories.expand", () => {
    it("returns singular for 1 article", () => {
      expect(COPY.stories.expand(1)).toBe("View 1 article");
    });

    it("returns plural for multiple articles", () => {
      expect(COPY.stories.expand(5)).toBe("View 5 articles");
    });
  });

  describe("stories.framing", () => {
    it("returns singular phrasing for 1 outlet", () => {
      expect(COPY.stories.framing(1)).toBe("How one outlet framed it");
    });

    it("uses 'framed it' phrasing for small groups (≤3)", () => {
      expect(COPY.stories.framing(2)).toBe("How 2 outlets framed it");
      expect(COPY.stories.framing(3)).toBe("How 3 outlets framed it");
    });

    it("uses 'covered this' phrasing for larger groups (>3)", () => {
      expect(COPY.stories.framing(4)).toBe("How 4 outlets covered this");
      expect(COPY.stories.framing(14)).toBe("How 14 outlets covered this");
    });
  });

  describe("stories.expandedMeta", () => {
    it("returns singular for 1 source", () => {
      expect(COPY.stories.expandedMeta("12 min ago", 1)).toBe(
        "Updated 12 min ago · 1 source"
      );
    });

    it("returns plural for multiple sources", () => {
      expect(COPY.stories.expandedMeta("just now", 14)).toBe(
        "Updated just now · 14 sources"
      );
    });
  });

  describe("stories.toneLabels", () => {
    it("provides editorial labels for every framing tone", () => {
      expect(COPY.stories.toneLabels.neutral).toBe("Straight");
      expect(COPY.stories.toneLabels.urgent).toBe("Pressing");
      expect(COPY.stories.toneLabels.analytical).toBe("Deep read");
      expect(COPY.stories.toneLabels.critical).toBe("Skeptical");
      expect(COPY.stories.toneLabels.optimistic).toBe("Hopeful");
    });
  });

  describe("static strings", () => {
    it("has header tagline", () => {
      expect(COPY.header.tagline).toBeTruthy();
    });

    it("has footer text", () => {
      expect(COPY.footer.main()).toBeTruthy();
    });

    it("has error strings", () => {
      expect(COPY.error.title).toBeTruthy();
      expect(COPY.error.body).toBeTruthy();
      expect(COPY.error.button).toBeTruthy();
    });

    it("has loading strings", () => {
      expect(COPY.loading.slow).toBeTruthy();
      expect(COPY.loading.slowTopic).toBeTruthy();
      expect(COPY.loading.refresh).toBeTruthy();
    });

    it("has topic modal strings", () => {
      expect(COPY.topics.modalTitle).toBeTruthy();
      expect(COPY.topics.modalPlaceholder).toBeTruthy();
      expect(COPY.topics.generating).toBeTruthy();
      expect(COPY.topics.previewTitle).toBeTruthy();
      expect(COPY.topics.confirm).toBeTruthy();
      expect(COPY.topics.cancel).toBeTruthy();
      expect(COPY.topics.edit).toBeTruthy();
      expect(COPY.topics.maxReached).toBeTruthy();
    });

    it("has compare strings", () => {
      expect(COPY.compare.button).toBeTruthy();
      expect(COPY.compare.placeholder).toBeTruthy();
    });

    it("has bookmark strings", () => {
      expect(COPY.bookmarks.title).toBeTruthy();
      expect(COPY.bookmarks.emptyTitle).toBeTruthy();
    });
  });

  describe("dynamic outlet-count copy (issue #153)", () => {
    const R = COPY.landingReskin;

    it("renders the live count as 'N curated outlets'", () => {
      expect(R.hero.foot(77)).toContain("77 curated outlets");
      expect(R.strip(77)[0]).toBe("77 curated outlets");
      expect(R.sources.titleIt(77)).toBe("77 curated outlets.");
      expect(R.cta.body(77)).toContain("77 curated outlets");
      expect(R.hero.lede(77)).toContain("77 outlets");
      expect(COPY.methodology.sections.includes.body(77)).toContain(
        "77 curated outlets",
      );
    });

    it("drops the number on a DB miss (n<=0) — never prints '0'", () => {
      const fallbacks = [
        R.hero.foot(0),
        R.strip(0)[0],
        R.sources.titleIt(0),
        R.cta.body(0),
        R.hero.lede(0),
        R.footer.blurb(0),
        COPY.footer.main(),
        COPY.methodology.sections.includes.body(0),
      ];
      for (const s of fallbacks) {
        expect(s).not.toMatch(/\b0\b/);
        expect(s.toLowerCase()).toContain("outlets");
      }
    });

    it("no surface hardcodes the stale '~50 outlets' or 'reads from'", () => {
      const all = [
        R.hero.lede(77),
        R.hero.foot(77),
        R.strip(77).join(" "),
        R.sources.titleIt(77),
        R.cta.body(77),
        R.footer.blurb(77),
        COPY.footer.main(77),
        COPY.methodology.sections.includes.body(77),
      ].join(" | ");
      expect(all).not.toMatch(/~?50\s+(vetted\s+)?outlets/);
      expect(all).not.toContain("reads from");
    });

    it("the /news footer and the landing footer share one builder", () => {
      expect(COPY.footer.main(77)).toBe(R.footer.blurb(77));
      // /news renders it count-free (hot path, no outlet fetch).
      expect(COPY.footer.main()).toContain("curates outlets");
    });

    it("manifesto spectrum reflects live bucket counts", () => {
      expect(
        R.manifesto.spectrum({ left: 22, center: 24, right: 11, specialty: 20 }),
      ).toEqual([
        { label: "Left", count: 22 },
        { label: "Center", count: 24 },
        { label: "Right", count: 11 },
        { label: "Specialty", count: 20 },
      ]);
    });
  });
});

describe("org budget labels name the record they came from", () => {
  const { annualBudgetLabel, budgetSourceLabel } = COPY.orgDossier;

  it("calls a 990 figure total expenses", () => {
    expect(annualBudgetLabel("$107.7M", "FY ending June 2025", "form990"))
      .toBe("Total expenses $107.7M · FY ending June 2025");
    expect(budgetSourceLabel("form990")).toContain("Form 990");
  });

  it("calls an OMB figure net outlays", () => {
    expect(annualBudgetLabel("$37.0B", "FY2025", "ombOutlays"))
      .toBe("Net outlays $37.0B · FY2025");
    expect(budgetSourceLabel("ombOutlays")).toContain("OMB Historical Tables");
  });

  it("never calls an OMB figure a Form 990", () => {
    // 23 agency pages did exactly this until 2026-08-07.
    expect(budgetSourceLabel("ombOutlays")).not.toContain("990");
    expect(annualBudgetLabel("$37.0B", "FY2025", "ombOutlays")).not.toContain("expenses");
  });

  it("names neither when the record is unidentified", () => {
    expect(annualBudgetLabel("$1", "FY2025", null)).toBe("$1 · FY2025");
    expect(budgetSourceLabel(null)).toBe("Per the cited source");
  });

  it("reads correctly for a negative net outlay (GSA, FY2025)", () => {
    expect(annualBudgetLabel("-$379.0M", "FY2025", "ombOutlays"))
      .toBe("Net outlays -$379.0M · FY2025");
  });
});
