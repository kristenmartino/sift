import {
  formatBudgetUsd,
  formatOrgLeanLabel,
  formatOrgTypeLabel,
  parseDbOrgProfile,
  type DbOrgProfileRow,
} from "@/lib/org";

// ─── Fixtures ──────────────────────────────────────────────

const fullRow: DbOrgProfileRow = {
  slug: "brookings-institution",
  name: "Brookings Institution",
  type: "think-tank",
  political_lean: "center",
  founded_year: 1916,
  annual_budget_usd: 120_000_000,
  major_funders: [
    "Hutchins Family",
    "Rockefeller Foundation",
    "Bloomberg Philanthropies",
  ],
  fara_registered: true,
  fara_countries: ["Qatar"],
  external_links: {
    propublica: "https://projects.propublica.org/nonprofits/organizations/530196577",
    official: "https://www.brookings.edu",
    wikipedia: "https://en.wikipedia.org/wiki/Brookings_Institution",
  },
  notes: "Centrist policy think tank. Qatar funding (Brookings Doha Center) is publicly disclosed.",
};

// ─── formatOrgTypeLabel ──────────────────────────────────

describe("formatOrgTypeLabel", () => {
  it("formats every valid org type", () => {
    expect(formatOrgTypeLabel("think-tank")).toBe("Think tank");
    expect(formatOrgTypeLabel("advocacy")).toBe("Advocacy organization");
    expect(formatOrgTypeLabel("union")).toBe("Labor union");
    expect(formatOrgTypeLabel("pac")).toBe("Political action committee");
    expect(formatOrgTypeLabel("super-pac")).toBe("Super PAC");
    expect(formatOrgTypeLabel("foundation")).toBe("Foundation");
    expect(formatOrgTypeLabel("industry-group")).toBe("Industry group");
    expect(formatOrgTypeLabel("other")).toBe("Organization");
  });

  it("returns null for null/undefined", () => {
    expect(formatOrgTypeLabel(null)).toBeNull();
    expect(formatOrgTypeLabel(undefined)).toBeNull();
  });
});

// ─── formatOrgLeanLabel ──────────────────────────────────

describe("formatOrgLeanLabel", () => {
  it("formats every valid lean (incl. nonpartisan)", () => {
    expect(formatOrgLeanLabel("left")).toBe("Left");
    expect(formatOrgLeanLabel("lean-left")).toBe("Lean Left");
    expect(formatOrgLeanLabel("center")).toBe("Center");
    expect(formatOrgLeanLabel("lean-right")).toBe("Lean Right");
    expect(formatOrgLeanLabel("right")).toBe("Right");
    expect(formatOrgLeanLabel("mixed")).toBe("Mixed");
    expect(formatOrgLeanLabel("nonpartisan")).toBe("Nonpartisan");
  });

  it("returns null for null/undefined", () => {
    expect(formatOrgLeanLabel(null)).toBeNull();
    expect(formatOrgLeanLabel(undefined)).toBeNull();
  });
});

// ─── formatBudgetUsd ─────────────────────────────────────

describe("formatBudgetUsd", () => {
  it("formats billions with 1 decimal unless whole", () => {
    expect(formatBudgetUsd(1_000_000_000)).toBe("$1B");
    expect(formatBudgetUsd(2_500_000_000)).toBe("$2.5B");
  });

  it("formats millions with 1 decimal unless whole", () => {
    expect(formatBudgetUsd(120_000_000)).toBe("$120M");
    expect(formatBudgetUsd(9_000_000)).toBe("$9M");
    expect(formatBudgetUsd(1_200_000)).toBe("$1.2M");
  });

  it("formats thousands with 1 decimal unless whole", () => {
    expect(formatBudgetUsd(500_000)).toBe("$500K");
    expect(formatBudgetUsd(9_000)).toBe("$9K");
    expect(formatBudgetUsd(1_500)).toBe("$1.5K");
  });

  it("falls through to plain locale string under $1k", () => {
    expect(formatBudgetUsd(500)).toBe("$500");
    expect(formatBudgetUsd(0)).toBe("$0");
  });

  it("handles negative values for completeness", () => {
    // Not expected in practice, but the function shouldn't crash.
    expect(formatBudgetUsd(-1_500_000)).toBe("$-1.5M");
  });

  it("returns null for null/undefined/non-finite", () => {
    expect(formatBudgetUsd(null)).toBeNull();
    expect(formatBudgetUsd(undefined)).toBeNull();
    expect(formatBudgetUsd(NaN)).toBeNull();
    expect(formatBudgetUsd(Infinity)).toBeNull();
  });
});

// ─── parseDbOrgProfile ───────────────────────────────────

describe("parseDbOrgProfile", () => {
  describe("happy path", () => {
    it("maps a fully populated row to OrgProfile shape", () => {
      const profile = parseDbOrgProfile(fullRow);
      expect(profile).toEqual({
        slug: "brookings-institution",
        name: "Brookings Institution",
        type: "think-tank",
        politicalLean: "center",
        foundedYear: 1916,
        annualBudgetUsd: 120_000_000,
        majorFunders: [
          "Hutchins Family",
          "Rockefeller Foundation",
          "Bloomberg Philanthropies",
        ],
        faraRegistered: true,
        faraCountries: ["Qatar"],
        externalLinks: {
          propublica: "https://projects.propublica.org/nonprofits/organizations/530196577",
          official: "https://www.brookings.edu",
          wikipedia: "https://en.wikipedia.org/wiki/Brookings_Institution",
        },
        notes: "Centrist policy think tank. Qatar funding (Brookings Doha Center) is publicly disclosed.",
      });
    });

    it("lowercases the slug for stable URL routing", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        slug: "BROOKINGS-INSTITUTION",
      });
      expect(profile?.slug).toBe("brookings-institution");
    });

    it("trims whitespace on identity fields", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        slug: "  brookings-institution  ",
        name: "  Brookings Institution  ",
      });
      expect(profile?.slug).toBe("brookings-institution");
      expect(profile?.name).toBe("Brookings Institution");
    });
  });

  describe("null-returning inputs", () => {
    it("returns null for null/undefined", () => {
      expect(parseDbOrgProfile(null)).toBeNull();
      expect(parseDbOrgProfile(undefined)).toBeNull();
    });

    it("returns null when slug or name missing", () => {
      expect(parseDbOrgProfile({ ...fullRow, slug: "" })).toBeNull();
      expect(parseDbOrgProfile({ ...fullRow, name: "   " })).toBeNull();
    });
  });

  describe("graceful degradation on malformed rows", () => {
    it("nulls out unknown type values", () => {
      const profile = parseDbOrgProfile({ ...fullRow, type: "rogue-type" });
      expect(profile?.type).toBeNull();
    });

    it("nulls out unknown political_lean values", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        political_lean: "very-left",
      });
      expect(profile?.politicalLean).toBeNull();
    });

    it("normalizes empty-string optional fields to null", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        notes: "  ",
      });
      expect(profile?.notes).toBeNull();
    });

    it("treats non-true fara_registered as false", () => {
      // pg returns Postgres BOOLEAN as true/false/null; we want false default.
      expect(parseDbOrgProfile({ ...fullRow, fara_registered: false })?.faraRegistered).toBe(false);
      expect(parseDbOrgProfile({ ...fullRow, fara_registered: null })?.faraRegistered).toBe(false);
    });
  });

  describe("annual_budget_usd type coercion", () => {
    it("accepts numeric input as-is", () => {
      const profile = parseDbOrgProfile({ ...fullRow, annual_budget_usd: 9_000_000 });
      expect(profile?.annualBudgetUsd).toBe(9_000_000);
    });

    it("accepts pg's NUMERIC string representation", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        annual_budget_usd: "120000000.00",
      });
      expect(profile?.annualBudgetUsd).toBe(120_000_000);
    });

    it("returns null for null", () => {
      const profile = parseDbOrgProfile({ ...fullRow, annual_budget_usd: null });
      expect(profile?.annualBudgetUsd).toBeNull();
    });

    it("returns null for unparseable strings", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        annual_budget_usd: "lots and lots",
      });
      expect(profile?.annualBudgetUsd).toBeNull();
    });

    it("returns null for non-finite numbers", () => {
      const profile = parseDbOrgProfile({ ...fullRow, annual_budget_usd: NaN });
      expect(profile?.annualBudgetUsd).toBeNull();
    });
  });

  describe("JSONB validation", () => {
    it("accepts string arrays for major_funders + fara_countries", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        major_funders: ["MacArthur", "Knight"],
        fara_countries: ["Qatar", "Saudi Arabia"],
      });
      expect(profile?.majorFunders).toEqual(["MacArthur", "Knight"]);
      expect(profile?.faraCountries).toEqual(["Qatar", "Saudi Arabia"]);
    });

    it("filters non-string + empty entries from list fields", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        major_funders: ["MacArthur", 42, null, "  Knight  ", "", "   "],
      });
      expect(profile?.majorFunders).toEqual(["MacArthur", "Knight"]);
    });

    it("returns [] for non-array list fields", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        major_funders: "MacArthur, Knight",
      });
      expect(profile?.majorFunders).toEqual([]);
    });

    it("accepts an object with string values for external_links", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        external_links: { propublica: "https://...", official: "https://..." },
      });
      expect(profile?.externalLinks).toEqual({
        propublica: "https://...",
        official: "https://...",
      });
    });

    it("drops non-string values from external_links", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        external_links: { propublica: "https://...", weird: 42 },
      });
      expect(profile?.externalLinks).toEqual({ propublica: "https://..." });
    });

    it("returns {} for an array passed as external_links", () => {
      const profile = parseDbOrgProfile({
        ...fullRow,
        external_links: ["a", "b"],
      });
      expect(profile?.externalLinks).toEqual({});
    });
  });
});
