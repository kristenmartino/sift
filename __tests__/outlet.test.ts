import {
  formatAllSidesLabel,
  formatFundingLabel,
  formatMbfcLabel,
  parseDbOutletProfile,
  type DbOutletProfileRow,
} from "@/lib/outlet";

describe("formatAllSidesLabel", () => {
  it("formats every valid AllSides bucket", () => {
    expect(formatAllSidesLabel("left")).toBe("Left");
    expect(formatAllSidesLabel("lean-left")).toBe("Lean Left");
    expect(formatAllSidesLabel("center")).toBe("Center");
    expect(formatAllSidesLabel("lean-right")).toBe("Lean Right");
    expect(formatAllSidesLabel("right")).toBe("Right");
    expect(formatAllSidesLabel("mixed")).toBe("Mixed");
  });

  it("returns null for null/undefined input", () => {
    expect(formatAllSidesLabel(null)).toBeNull();
    expect(formatAllSidesLabel(undefined)).toBeNull();
  });
});

describe("formatMbfcLabel", () => {
  it("formats every valid MBFC tier", () => {
    expect(formatMbfcLabel("very-high")).toBe("Very High");
    expect(formatMbfcLabel("high")).toBe("High");
    expect(formatMbfcLabel("mostly-factual")).toBe("Mostly Factual");
    expect(formatMbfcLabel("mixed")).toBe("Mixed");
    expect(formatMbfcLabel("low")).toBe("Low");
    expect(formatMbfcLabel("very-low")).toBe("Very Low");
  });

  it("returns null for null/undefined input", () => {
    expect(formatMbfcLabel(null)).toBeNull();
    expect(formatMbfcLabel(undefined)).toBeNull();
  });
});

describe("formatFundingLabel", () => {
  it("formats every valid funding model", () => {
    expect(formatFundingLabel("subscription")).toBe("Subscription");
    expect(formatFundingLabel("advertising")).toBe("Advertising");
    expect(formatFundingLabel("foundation")).toBe("Foundation");
    expect(formatFundingLabel("donations")).toBe("Reader donations");
    expect(formatFundingLabel("mixed")).toBe("Mixed");
    expect(formatFundingLabel("public-service")).toBe("Public service");
  });

  it("returns null for null/undefined input", () => {
    expect(formatFundingLabel(null)).toBeNull();
    expect(formatFundingLabel(undefined)).toBeNull();
  });
});

describe("parseDbOutletProfile", () => {
  const fullRow: DbOutletProfileRow = {
    slug: "reuters",
    name: "Reuters",
    parent_company: "Thomson Reuters Corporation",
    parent_company_url: "https://en.wikipedia.org/wiki/Thomson_Reuters",
    founded_year: 1851,
    funding_model: "subscription",
    allsides_rating: "center",
    allsides_url: "https://www.allsides.com/news-source/reuters",
    allsides_last_checked: new Date("2026-05-06T00:00:00.000Z"),
    mbfc_factual: "very-high",
    mbfc_url: "https://mediabiasfactcheck.com/reuters/",
    mbfc_last_checked: new Date("2026-05-02T00:00:00.000Z"),
    major_funders: [],
    external_links: { wikipedia: "https://en.wikipedia.org/wiki/Reuters" },
    notes: null,
  };

  describe("happy path", () => {
    it("maps a fully populated row to OutletProfile shape", () => {
      const profile = parseDbOutletProfile(fullRow);
      expect(profile).toEqual({
        slug: "reuters",
        name: "Reuters",
        parentCompany: "Thomson Reuters Corporation",
        parentCompanyUrl: "https://en.wikipedia.org/wiki/Thomson_Reuters",
        foundedYear: 1851,
        fundingModel: "subscription",
        allSidesRating: "center",
        allSidesUrl: "https://www.allsides.com/news-source/reuters",
        allSidesLastChecked: "2026-05-06",
        mbfcFactual: "very-high",
        mbfcUrl: "https://mediabiasfactcheck.com/reuters/",
        mbfcLastChecked: "2026-05-02",
        majorFunders: [],
        externalLinks: { wikipedia: "https://en.wikipedia.org/wiki/Reuters" },
        notes: null,
      });
    });

    it("trims whitespace on identity fields", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        slug: "  reuters  ",
        name: "  Reuters  ",
      });
      expect(profile?.slug).toBe("reuters");
      expect(profile?.name).toBe("Reuters");
    });
  });

  describe("null-returning inputs", () => {
    it("returns null for null/undefined", () => {
      expect(parseDbOutletProfile(null)).toBeNull();
      expect(parseDbOutletProfile(undefined)).toBeNull();
    });

    it("returns null when slug is missing or empty", () => {
      expect(parseDbOutletProfile({ ...fullRow, slug: "" })).toBeNull();
      expect(parseDbOutletProfile({ ...fullRow, slug: "   " })).toBeNull();
    });

    it("returns null when name is missing or empty", () => {
      expect(parseDbOutletProfile({ ...fullRow, name: "" })).toBeNull();
      expect(parseDbOutletProfile({ ...fullRow, name: "   " })).toBeNull();
    });
  });

  describe("partial rows + graceful degradation", () => {
    it("nulls out unknown allsides_rating values rather than passing them through", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_rating: "very-left", // not in our enum
      });
      expect(profile?.allSidesRating).toBeNull();
    });

    it("nulls out unknown mbfc_factual values", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        mbfc_factual: "perfect", // not in our enum
      });
      expect(profile?.mbfcFactual).toBeNull();
    });

    it("nulls out unknown funding_model values", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        funding_model: "vibes", // not in our enum
      });
      expect(profile?.fundingModel).toBeNull();
    });

    it("accepts uppercase enum values (case-insensitive)", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_rating: "LEAN-LEFT",
        mbfc_factual: "HIGH",
        funding_model: "ADVERTISING",
      });
      expect(profile?.allSidesRating).toBe("lean-left");
      expect(profile?.mbfcFactual).toBe("high");
      expect(profile?.fundingModel).toBe("advertising");
    });

    it("preserves null on optional metadata fields", () => {
      const profile = parseDbOutletProfile({
        slug: "the-bulwark",
        name: "The Bulwark",
        parent_company: null,
        parent_company_url: null,
        founded_year: null,
        funding_model: null,
        allsides_rating: null,
        allsides_url: null,
        allsides_last_checked: null,
        mbfc_factual: "high",
        mbfc_url: "https://mediabiasfactcheck.com/the-bulwark/",
        mbfc_last_checked: null,
        major_funders: null,
        external_links: null,
        notes: null,
      });
      expect(profile).toEqual({
        slug: "the-bulwark",
        name: "The Bulwark",
        parentCompany: null,
        parentCompanyUrl: null,
        foundedYear: null,
        fundingModel: null,
        allSidesRating: null,
        allSidesUrl: null,
        allSidesLastChecked: null,
        mbfcFactual: "high",
        mbfcUrl: "https://mediabiasfactcheck.com/the-bulwark/",
        mbfcLastChecked: null,
        majorFunders: [],
        externalLinks: {},
        notes: null,
      });
    });

    it("normalizes empty-string optional fields to null", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        parent_company: "",
        parent_company_url: "   ",
        allsides_url: "",
        notes: "   ",
      });
      expect(profile?.parentCompany).toBeNull();
      expect(profile?.parentCompanyUrl).toBeNull();
      expect(profile?.allSidesUrl).toBeNull();
      expect(profile?.notes).toBeNull();
    });
  });

  describe("date column normalization", () => {
    it("converts Date instances to YYYY-MM-DD strings", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_last_checked: new Date("2026-04-01T18:30:00.000Z"),
        mbfc_last_checked: new Date("2026-04-15T00:00:00.000Z"),
      });
      expect(profile?.allSidesLastChecked).toBe("2026-04-01");
      expect(profile?.mbfcLastChecked).toBe("2026-04-15");
    });

    it("accepts pre-formatted ISO date strings", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_last_checked: "2026-04-01",
        mbfc_last_checked: "2026-04-15",
      });
      expect(profile?.allSidesLastChecked).toBe("2026-04-01");
      expect(profile?.mbfcLastChecked).toBe("2026-04-15");
    });

    it("returns null for malformed date strings", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_last_checked: "not a date",
      });
      expect(profile?.allSidesLastChecked).toBeNull();
    });

    it("returns null for invalid Date instances", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        allsides_last_checked: new Date("invalid"),
      });
      expect(profile?.allSidesLastChecked).toBeNull();
    });
  });

  describe("JSONB field validation", () => {
    it("accepts a string array for major_funders", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        major_funders: ["MacArthur Foundation", "Knight Foundation"],
      });
      expect(profile?.majorFunders).toEqual([
        "MacArthur Foundation",
        "Knight Foundation",
      ]);
    });

    it("filters non-string entries from major_funders", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        major_funders: ["MacArthur", 42, null, { foo: "bar" }, "Knight"],
      });
      expect(profile?.majorFunders).toEqual(["MacArthur", "Knight"]);
    });

    it("returns [] for non-array major_funders", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        major_funders: "not an array",
      });
      expect(profile?.majorFunders).toEqual([]);
    });

    it("trims and drops empty strings from major_funders", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        major_funders: ["  MacArthur  ", "", "   "],
      });
      expect(profile?.majorFunders).toEqual(["MacArthur"]);
    });

    it("accepts an object with string values for external_links", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        external_links: {
          wikipedia: "https://en.wikipedia.org/wiki/Reuters",
          official: "https://www.reuters.com",
        },
      });
      expect(profile?.externalLinks).toEqual({
        wikipedia: "https://en.wikipedia.org/wiki/Reuters",
        official: "https://www.reuters.com",
      });
    });

    it("drops non-string values from external_links", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        external_links: {
          wikipedia: "https://en.wikipedia.org/wiki/Reuters",
          weird: 42,
          nested: { foo: "bar" },
        },
      });
      expect(profile?.externalLinks).toEqual({
        wikipedia: "https://en.wikipedia.org/wiki/Reuters",
      });
    });

    it("returns {} for an array passed as external_links", () => {
      // Arrays are objects in JS but should not be treated as link maps.
      const profile = parseDbOutletProfile({
        ...fullRow,
        external_links: ["a", "b"],
      });
      expect(profile?.externalLinks).toEqual({});
    });
  });
});
