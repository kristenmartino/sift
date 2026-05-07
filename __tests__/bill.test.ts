import {
  formatBillIdDisplay,
  formatBillStatusLabel,
  formatLobbyingUsd,
  parseDbBillProfile,
  type DbBillProfileRow,
} from "@/lib/bill";

// ─── Fixtures ──────────────────────────────────────────────

const fullRow: DbBillProfileRow = {
  bill_id: "hr-5376-117",
  congress: 117,
  title: "An Act to provide for reconciliation pursuant to title II of S. Con. Res. 14.",
  short_title: "Inflation Reduction Act of 2022",
  sponsor_bioguide: "J000295",
  cosponsors: ["A001234", "B001234", "C001234"],
  status: "enacted",
  introduced_date: new Date("2021-09-27T00:00:00.000Z"),
  lobbying_for_usd: 14_000_000,
  lobbying_against_usd: 8_500_000,
  external_links: {
    govtrack: "https://www.govtrack.us/congress/bills/117/hr5376",
    congress: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
  },
  notes: "Signed into law August 2022. Climate and tax-policy package.",
};

// ─── formatBillStatusLabel ─────────────────────────────────

describe("formatBillStatusLabel", () => {
  it("formats every valid status", () => {
    expect(formatBillStatusLabel("introduced")).toBe("Introduced");
    expect(formatBillStatusLabel("committee")).toBe("In committee");
    expect(formatBillStatusLabel("passed-chamber")).toBe("Passed chamber");
    expect(formatBillStatusLabel("enacted")).toBe("Enacted into law");
    expect(formatBillStatusLabel("vetoed")).toBe("Vetoed");
    expect(formatBillStatusLabel("failed")).toBe("Failed");
  });

  it("returns null for null/undefined", () => {
    expect(formatBillStatusLabel(null)).toBeNull();
    expect(formatBillStatusLabel(undefined)).toBeNull();
  });
});

// ─── formatBillIdDisplay ───────────────────────────────────

describe("formatBillIdDisplay", () => {
  it("formats House and Senate bill IDs canonically", () => {
    expect(formatBillIdDisplay("hr-5376-117")).toBe("H.R. 5376 (117th Congress)");
    expect(formatBillIdDisplay("s-1234-119")).toBe("S. 1234 (119th Congress)");
  });

  it("formats resolution variants", () => {
    expect(formatBillIdDisplay("hres-42-118")).toBe("H.Res. 42 (118th Congress)");
    expect(formatBillIdDisplay("sres-7-119")).toBe("S.Res. 7 (119th Congress)");
    expect(formatBillIdDisplay("hjres-99-118")).toBe("H.J.Res. 99 (118th Congress)");
    expect(formatBillIdDisplay("sjres-12-119")).toBe("S.J.Res. 12 (119th Congress)");
    expect(formatBillIdDisplay("hconres-1-118")).toBe("H.Con.Res. 1 (118th Congress)");
    expect(formatBillIdDisplay("sconres-2-119")).toBe("S.Con.Res. 2 (119th Congress)");
  });

  it("handles ordinal suffixes correctly across edge cases", () => {
    expect(formatBillIdDisplay("hr-1-1")).toBe("H.R. 1 (1st Congress)");
    expect(formatBillIdDisplay("hr-1-2")).toBe("H.R. 1 (2nd Congress)");
    expect(formatBillIdDisplay("hr-1-3")).toBe("H.R. 1 (3rd Congress)");
    expect(formatBillIdDisplay("hr-1-4")).toBe("H.R. 1 (4th Congress)");
    expect(formatBillIdDisplay("hr-1-11")).toBe("H.R. 1 (11th Congress)");
    expect(formatBillIdDisplay("hr-1-12")).toBe("H.R. 1 (12th Congress)");
    expect(formatBillIdDisplay("hr-1-13")).toBe("H.R. 1 (13th Congress)");
    expect(formatBillIdDisplay("hr-1-21")).toBe("H.R. 1 (21st Congress)");
    expect(formatBillIdDisplay("hr-1-22")).toBe("H.R. 1 (22nd Congress)");
    expect(formatBillIdDisplay("hr-1-23")).toBe("H.R. 1 (23rd Congress)");
    expect(formatBillIdDisplay("hr-1-100")).toBe("H.R. 1 (100th Congress)");
  });

  it("normalizes case and trims whitespace", () => {
    expect(formatBillIdDisplay("  HR-5376-117  ")).toBe("H.R. 5376 (117th Congress)");
  });

  it("falls back to the raw input on malformed slugs (forward-compat)", () => {
    expect(formatBillIdDisplay("not-a-bill")).toBe("not-a-bill");
    expect(formatBillIdDisplay("hr-abc-117")).toBe("hr-abc-117");
    expect(formatBillIdDisplay("just-two")).toBe("just-two");
  });

  it("returns empty string for empty/null/undefined", () => {
    expect(formatBillIdDisplay("")).toBe("");
    expect(formatBillIdDisplay(null)).toBe("");
    expect(formatBillIdDisplay(undefined)).toBe("");
  });

  it("uses uppercase chamber when chamber is unrecognized", () => {
    // Forward-compat: a future chamber type renders as its uppercase form.
    expect(formatBillIdDisplay("hcon-1-118")).toBe("HCON 1 (118th Congress)");
  });
});

// ─── formatLobbyingUsd ─────────────────────────────────────

describe("formatLobbyingUsd", () => {
  it("formats millions (the typical scale)", () => {
    expect(formatLobbyingUsd(14_000_000)).toBe("$14M");
    expect(formatLobbyingUsd(8_500_000)).toBe("$8.5M");
    expect(formatLobbyingUsd(1_200_000)).toBe("$1.2M");
  });

  it("formats billions for outlier bills", () => {
    expect(formatLobbyingUsd(2_500_000_000)).toBe("$2.5B");
  });

  it("formats thousands at the low end", () => {
    expect(formatLobbyingUsd(500_000)).toBe("$500K");
    expect(formatLobbyingUsd(9_500)).toBe("$9.5K");
  });

  it("falls through to plain locale string under $1k", () => {
    expect(formatLobbyingUsd(500)).toBe("$500");
    expect(formatLobbyingUsd(0)).toBe("$0");
  });

  it("returns null for null/undefined/non-finite", () => {
    expect(formatLobbyingUsd(null)).toBeNull();
    expect(formatLobbyingUsd(undefined)).toBeNull();
    expect(formatLobbyingUsd(NaN)).toBeNull();
    expect(formatLobbyingUsd(Infinity)).toBeNull();
  });
});

// ─── parseDbBillProfile ────────────────────────────────────

describe("parseDbBillProfile", () => {
  describe("happy path", () => {
    it("maps a fully populated row to BillProfile shape", () => {
      const profile = parseDbBillProfile(fullRow);
      expect(profile).toEqual({
        billId: "hr-5376-117",
        congress: 117,
        title: "An Act to provide for reconciliation pursuant to title II of S. Con. Res. 14.",
        shortTitle: "Inflation Reduction Act of 2022",
        sponsorBioguide: "J000295",
        cosponsors: ["A001234", "B001234", "C001234"],
        status: "enacted",
        introducedDate: "2021-09-27",
        lobbyingForUsd: 14_000_000,
        lobbyingAgainstUsd: 8_500_000,
        externalLinks: {
          govtrack: "https://www.govtrack.us/congress/bills/117/hr5376",
          congress: "https://www.congress.gov/bill/117th-congress/house-bill/5376",
        },
        notes: "Signed into law August 2022. Climate and tax-policy package.",
      });
    });

    it("lowercases the bill_id for stable URL routing", () => {
      const profile = parseDbBillProfile({ ...fullRow, bill_id: "HR-5376-117" });
      expect(profile?.billId).toBe("hr-5376-117");
    });
  });

  describe("null-returning inputs", () => {
    it("returns null for null/undefined", () => {
      expect(parseDbBillProfile(null)).toBeNull();
      expect(parseDbBillProfile(undefined)).toBeNull();
    });

    it("returns null when bill_id, title, or congress missing", () => {
      expect(parseDbBillProfile({ ...fullRow, bill_id: "" })).toBeNull();
      expect(parseDbBillProfile({ ...fullRow, title: "  " })).toBeNull();
      // @ts-expect-error — congress null isn't a normal type, but exercises the guard
      expect(parseDbBillProfile({ ...fullRow, congress: null })).toBeNull();
      expect(parseDbBillProfile({ ...fullRow, congress: NaN })).toBeNull();
    });
  });

  describe("graceful degradation", () => {
    it("nulls out unknown status values", () => {
      const profile = parseDbBillProfile({ ...fullRow, status: "vibing" });
      expect(profile?.status).toBeNull();
    });

    it("normalizes empty-string optional fields to null", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        short_title: "  ",
        sponsor_bioguide: "",
        notes: "   ",
      });
      expect(profile?.shortTitle).toBeNull();
      expect(profile?.sponsorBioguide).toBeNull();
      expect(profile?.notes).toBeNull();
    });
  });

  describe("introduced_date normalization", () => {
    it("converts Date instances to YYYY-MM-DD", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        introduced_date: new Date("2024-04-15T18:30:00.000Z"),
      });
      expect(profile?.introducedDate).toBe("2024-04-15");
    });

    it("accepts pre-formatted ISO strings", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        introduced_date: "2024-04-15",
      });
      expect(profile?.introducedDate).toBe("2024-04-15");
    });

    it("returns null for malformed strings + invalid Date", () => {
      expect(
        parseDbBillProfile({ ...fullRow, introduced_date: "not a date" })?.introducedDate,
      ).toBeNull();
      expect(
        parseDbBillProfile({
          ...fullRow,
          introduced_date: new Date("invalid"),
        })?.introducedDate,
      ).toBeNull();
    });
  });

  describe("NUMERIC type coercion", () => {
    it("accepts numeric and string forms for lobbying spend", () => {
      const a = parseDbBillProfile({ ...fullRow, lobbying_for_usd: 14_000_000 });
      const b = parseDbBillProfile({ ...fullRow, lobbying_for_usd: "14000000" });
      expect(a?.lobbyingForUsd).toBe(14_000_000);
      expect(b?.lobbyingForUsd).toBe(14_000_000);
    });

    it("returns null for unparseable strings, null, NaN", () => {
      expect(
        parseDbBillProfile({ ...fullRow, lobbying_for_usd: "lots" })?.lobbyingForUsd,
      ).toBeNull();
      expect(
        parseDbBillProfile({ ...fullRow, lobbying_for_usd: null })?.lobbyingForUsd,
      ).toBeNull();
      expect(
        parseDbBillProfile({ ...fullRow, lobbying_for_usd: NaN })?.lobbyingForUsd,
      ).toBeNull();
    });
  });

  describe("JSONB validation", () => {
    it("accepts a string array for cosponsors", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        cosponsors: ["A001234", "  B001234  ", 42, null, "C001234"],
      });
      expect(profile?.cosponsors).toEqual(["A001234", "B001234", "C001234"]);
    });

    it("returns [] for non-array cosponsors", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        cosponsors: "A001234,B001234",
      });
      expect(profile?.cosponsors).toEqual([]);
    });

    it("accepts external_links object with strings only", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        external_links: { govtrack: "https://...", weird: 42 },
      });
      expect(profile?.externalLinks).toEqual({ govtrack: "https://..." });
    });

    it("returns {} for an array passed as external_links", () => {
      const profile = parseDbBillProfile({
        ...fullRow,
        external_links: ["a", "b"],
      });
      expect(profile?.externalLinks).toEqual({});
    });
  });
});
