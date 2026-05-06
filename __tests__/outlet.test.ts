import {
  formatAllSidesLabel,
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
    mbfc_factual: "very-high",
    mbfc_url: "https://mediabiasfactcheck.com/reuters/",
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
        mbfcFactual: "very-high",
        mbfcUrl: "https://mediabiasfactcheck.com/reuters/",
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
        mbfc_factual: "high",
        mbfc_url: "https://mediabiasfactcheck.com/the-bulwark/",
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
        mbfcFactual: "high",
        mbfcUrl: "https://mediabiasfactcheck.com/the-bulwark/",
      });
    });

    it("normalizes empty-string optional fields to null", () => {
      const profile = parseDbOutletProfile({
        ...fullRow,
        parent_company: "",
        parent_company_url: "   ",
        allsides_url: "",
      });
      expect(profile?.parentCompany).toBeNull();
      expect(profile?.parentCompanyUrl).toBeNull();
      expect(profile?.allSidesUrl).toBeNull();
    });
  });
});
