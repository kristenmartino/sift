import {
  formatChamberLabel,
  formatPartyLabel,
  formatPoliticianLede,
  parseDbPoliticianProfile,
  type DbPoliticianProfileRow,
} from "@/lib/politician";

// ─── Fixtures ──────────────────────────────────────────────

const fullRow: DbPoliticianProfileRow = {
  bioguide_id: "S000148",
  name: "Charles E. Schumer",
  party: "D",
  state: "NY",
  chamber: "senate",
  committees: ["Finance", "Judiciary", "Rules and Administration"],
  top_industries_current_cycle: [
    { industry: "Securities & investment", amount_usd: 1_200_000 },
    { industry: "Real estate", amount_usd: 620_000 },
  ],
  interest_group_ratings: [{
    rater: "LCV",
    rater_name: "League of Conservation Voters",
    score: 92,
    unit: "percent",
    year: 2025,
    lifetime_score: 88,
    source_url: "https://www.lcv.org/moc/chuck-schumer/",
  }],
  external_links: {
    govtrack: "https://www.govtrack.us/congress/members/charles_schumer/300087",
    opensecrets: "https://www.opensecrets.org/members-of-congress/charles-schumer/summary",
    wikipedia: "https://en.wikipedia.org/wiki/Chuck_Schumer",
  },
  notes: "Senate Majority Leader (119th Congress).",
};

// ─── formatPartyLabel ────────────────────────────────────

describe("formatPartyLabel", () => {
  it("expands the three primary single-letter codes", () => {
    expect(formatPartyLabel("D")).toBe("Democrat");
    expect(formatPartyLabel("R")).toBe("Republican");
    expect(formatPartyLabel("I")).toBe("Independent");
  });

  it("normalizes case", () => {
    expect(formatPartyLabel("d")).toBe("Democrat");
    expect(formatPartyLabel("  R  ")).toBe("Republican");
  });

  it("returns the input verbatim for unknown codes (forward-compat)", () => {
    // L (Libertarian), G (Green), DFL (Minnesota's branch of D), etc.
    expect(formatPartyLabel("L")).toBe("L");
    expect(formatPartyLabel("DFL")).toBe("DFL");
  });

  it("returns null for null/undefined/empty", () => {
    expect(formatPartyLabel(null)).toBeNull();
    expect(formatPartyLabel(undefined)).toBeNull();
    expect(formatPartyLabel("")).toBeNull();
    expect(formatPartyLabel("   ")).toBeNull();
  });
});

// ─── formatChamberLabel ──────────────────────────────────

describe("formatChamberLabel", () => {
  it("formats every valid chamber", () => {
    expect(formatChamberLabel("senate")).toBe("U.S. Senate");
    expect(formatChamberLabel("house")).toBe("U.S. House of Representatives");
    expect(formatChamberLabel("former")).toBe("Former member of Congress");
    expect(formatChamberLabel("executive")).toBe("Executive branch");
  });

  it("returns null for null/undefined", () => {
    expect(formatChamberLabel(null)).toBeNull();
    expect(formatChamberLabel(undefined)).toBeNull();
  });
});

// ─── formatPoliticianLede ────────────────────────────────

describe("formatPoliticianLede", () => {
  it("builds the canonical 'Senator (D-NY)' shape", () => {
    expect(formatPoliticianLede("senate", "D", "NY")).toBe("Senator (D-NY)");
  });

  it("uses 'Representative' for House members", () => {
    expect(formatPoliticianLede("house", "R", "LA")).toBe("Representative (R-LA)");
  });

  it("falls back to role-only when party/state are absent", () => {
    expect(formatPoliticianLede("senate", null, null)).toBe("Senator");
  });

  it("falls back to party/state-only when chamber is absent", () => {
    expect(formatPoliticianLede(null, "D", "NY")).toBe("(D-NY)");
  });

  it("renders party-only or state-only correctly when one is missing", () => {
    expect(formatPoliticianLede(null, "D", null)).toBe("(D)");
    expect(formatPoliticianLede(null, null, "NY")).toBe("(NY)");
  });

  it("returns null when chamber/party/state are all absent", () => {
    expect(formatPoliticianLede(null, null, null)).toBeNull();
    expect(formatPoliticianLede(undefined, undefined, undefined)).toBeNull();
  });

  it("trims whitespace on party/state", () => {
    expect(formatPoliticianLede("senate", " D ", " NY ")).toBe("Senator (D-NY)");
  });

  it("uses the right role for non-Congress chambers", () => {
    expect(formatPoliticianLede("former", "D", "VT")).toBe(
      "Former member of Congress (D-VT)",
    );
    expect(formatPoliticianLede("executive", "R", null)).toBe(
      "Executive branch official (R)",
    );
  });
});

// ─── parseDbPoliticianProfile ────────────────────────────

describe("parseDbPoliticianProfile", () => {
  describe("happy path", () => {
    it("maps a fully populated row to PoliticianProfile shape", () => {
      const profile = parseDbPoliticianProfile(fullRow);
      expect(profile).toEqual({
        bioguideId: "S000148",
        name: "Charles E. Schumer",
        party: "D",
        state: "NY",
        chamber: "senate",
        committees: ["Finance", "Judiciary", "Rules and Administration"],
        topIndustriesCurrentCycle: [
          { industry: "Securities & investment", amount_usd: 1_200_000 },
          { industry: "Real estate", amount_usd: 620_000 },
        ],
        interestGroupRatings: [{
          rater: "LCV",
          raterName: "League of Conservation Voters",
          score: 92,
          unit: "percent",
          year: 2025,
          lifetimeScore: 88,
          sourceUrl: "https://www.lcv.org/moc/chuck-schumer/",
        }],
        externalLinks: {
          govtrack: "https://www.govtrack.us/congress/members/charles_schumer/300087",
          opensecrets: "https://www.opensecrets.org/members-of-congress/charles-schumer/summary",
          wikipedia: "https://en.wikipedia.org/wiki/Chuck_Schumer",
        },
        notes: "Senate Majority Leader (119th Congress).",
        // Migration 015 columns are absent on a sitting-Congress row, so the
        // whole provenance block parses to nulls rather than being omitted.
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
      });
    });

    it("trims whitespace on identity fields", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        bioguide_id: "  S000148  ",
        name: "  Charles E. Schumer  ",
      });
      expect(profile?.bioguideId).toBe("S000148");
      expect(profile?.name).toBe("Charles E. Schumer");
    });
  });

  describe("null-returning inputs", () => {
    it("returns null for null/undefined", () => {
      expect(parseDbPoliticianProfile(null)).toBeNull();
      expect(parseDbPoliticianProfile(undefined)).toBeNull();
    });

    it("returns null when bioguide_id is missing or empty", () => {
      expect(parseDbPoliticianProfile({ ...fullRow, bioguide_id: "" })).toBeNull();
      expect(parseDbPoliticianProfile({ ...fullRow, bioguide_id: "   " })).toBeNull();
    });

    it("returns null when name is missing or empty", () => {
      expect(parseDbPoliticianProfile({ ...fullRow, name: "" })).toBeNull();
    });
  });

  describe("graceful degradation on partial / malformed rows", () => {
    it("nulls out unknown chamber values", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        chamber: "lobbyist",
      });
      expect(profile?.chamber).toBeNull();
    });

    it("normalizes empty-string optional fields to null", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        party: "",
        state: "   ",
        notes: "",
      });
      expect(profile?.party).toBeNull();
      expect(profile?.state).toBeNull();
      expect(profile?.notes).toBeNull();
    });

    it("returns [] for non-array committees", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        committees: "Finance",
      });
      expect(profile?.committees).toEqual([]);
    });

    it("filters non-string entries from committees", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        committees: ["Finance", 42, null, "Judiciary"],
      });
      expect(profile?.committees).toEqual(["Finance", "Judiciary"]);
    });

    it("trims and drops empty strings from committees", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        committees: ["  Finance  ", "", "   ", "Judiciary"],
      });
      expect(profile?.committees).toEqual(["Finance", "Judiciary"]);
    });
  });

  describe("top_industries_current_cycle JSONB validation", () => {
    it("accepts well-formed industry entries", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        top_industries_current_cycle: [
          { industry: "Securities", amount_usd: 1000 },
          { industry: "Real estate", amount_usd: 500 },
        ],
      });
      expect(profile?.topIndustriesCurrentCycle).toEqual([
        { industry: "Securities", amount_usd: 1000 },
        { industry: "Real estate", amount_usd: 500 },
      ]);
    });

    it("preserves null amount_usd when absent or non-numeric", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        top_industries_current_cycle: [
          { industry: "Tech", amount_usd: null },
          { industry: "Pharma", amount_usd: "lots" },
          { industry: "Defense" }, // no amount_usd at all
        ],
      });
      expect(profile?.topIndustriesCurrentCycle).toEqual([
        { industry: "Tech", amount_usd: null },
        { industry: "Pharma", amount_usd: null },
        { industry: "Defense", amount_usd: null },
      ]);
    });

    it("drops entries without an industry name", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        top_industries_current_cycle: [
          { industry: "", amount_usd: 1000 },
          { industry: "   ", amount_usd: 1000 },
          { amount_usd: 1000 },
          { industry: "Real industry", amount_usd: 1000 },
        ],
      });
      expect(profile?.topIndustriesCurrentCycle).toEqual([
        { industry: "Real industry", amount_usd: 1000 },
      ]);
    });

    it("returns [] for non-array input", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        top_industries_current_cycle: "Securities",
      });
      expect(profile?.topIndustriesCurrentCycle).toEqual([]);
    });
  });

  describe("interest_group_ratings provenance (migration 019)", () => {
    // The column used to hold a bare { LCV: 92 } dict — a claim about a
    // living person's voting record with no year and no citation. These
    // cases pin the rule that replaced it: an entry renders only if it
    // carries score + year + an https source_url.
    const valid = {
    rater: "LCV",
    rater_name: "League of Conservation Voters",
    score: 20,
    unit: "percent",
    year: 2025,
    lifetime_score: 20,
    source_url: "https://www.lcv.org/moc/lisa-a-murkowski/",
  };

    it("parses a fully-formed entry", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        interest_group_ratings: [valid],
      });
      expect(profile!.interestGroupRatings).toEqual([{
        rater: "LCV",
        raterName: "League of Conservation Voters",
        score: 20,
        unit: "percent",
        year: 2025,
        lifetimeScore: 20,
        sourceUrl: "https://www.lcv.org/moc/lisa-a-murkowski/",
      }]);
    });

    it.each([
      ["score", { ...valid, score: undefined }],
      ["year", { ...valid, year: undefined }],
      ["source_url", { ...valid, source_url: undefined }],
      ["rater", { ...valid, rater: "  " }],
      ["a non-numeric score", { ...valid, score: "high" }],
      ["a non-http source", { ...valid, source_url: "javascript:alert(1)" }],
    ])("drops an entry missing %s", (_label, entry) => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        interest_group_ratings: [entry],
      });
      expect(profile!.interestGroupRatings).toEqual([]);
    });

    it("keeps the sound entries and drops the unsound ones together", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        interest_group_ratings: [valid, { ...valid, rater: "ACU", year: undefined }],
      });
      expect(profile!.interestGroupRatings.map((r) => r.rater)).toEqual(["LCV"]);
    });

    it("treats lifetime_score as optional", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        interest_group_ratings: [{ ...valid, lifetime_score: undefined }],
      });
      expect(profile!.interestGroupRatings[0].lifetimeScore).toBeNull();
    });

    it("returns [] for the pre-019 dict shape", () => {
      // An old { LCV: 92 } value carries no year and no source, so there is
      // nothing in it that may legally be rendered.
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        interest_group_ratings: { LCV: 92, NRA: "F" },
      });
      expect(profile!.interestGroupRatings).toEqual([]);
    });

    it.each([[null], [undefined], ["nope"], [42]])(
      "returns [] for %p", (v) => {
        const profile = parseDbPoliticianProfile({
          ...fullRow, interest_group_ratings: v,
        });
        expect(profile!.interestGroupRatings).toEqual([]);
      },
    );
  });
  describe("external_links JSONB validation", () => {
    it("accepts string URLs and trims whitespace", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        external_links: {
          govtrack: "  https://govtrack.us/...  ",
          wikipedia: "https://en.wikipedia.org/...",
        },
      });
      expect(profile?.externalLinks).toEqual({
        govtrack: "https://govtrack.us/...",
        wikipedia: "https://en.wikipedia.org/...",
      });
    });

    it("drops non-string values", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        external_links: {
          govtrack: "https://govtrack.us/...",
          weird: 42,
          nested: { foo: "bar" },
        },
      });
      expect(profile?.externalLinks).toEqual({
        govtrack: "https://govtrack.us/...",
      });
    });

    it("returns {} for an array passed as external_links", () => {
      const profile = parseDbPoliticianProfile({
        ...fullRow,
        external_links: ["a", "b"],
      });
      expect(profile?.externalLinks).toEqual({});
    });
  });
});

// ─── Role provenance (migration 015) ─────────────────────

/**
 * The executive rows are the reason migration 015 exists: all 102 carried
 * uncited biographical prose about living people in `notes`, which
 * `docs/OPERATING_CONTEXT.md` §5 forbids. The replacement is only an
 * improvement if a claim cannot outlive the record that backs it — so these
 * pin the drop-the-pair behaviour, not just the happy path.
 */
describe("parseDbPoliticianProfile — role provenance", () => {
  const execRow = {
    bioguide_id: "EXEC-AUSTIN-L",
    name: "Lloyd Austin",
    party: "D",
    state: "US",
    chamber: "executive",
    committees: [],
    top_industries_current_cycle: [],
    interest_group_ratings: {},
    external_links: { official: "https://www.defense.gov" },
    notes: null,
    id_source: "executive",
    role_title: "Secretary of Defense",
    role_title_source:
      "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title10-section113",
    role_start_date: null,
    role_end_date: "2025-01-24",
    role_dates_source:
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1191/vote_119_1_00011.htm",
    nomination_date: "2021-01-20",
    nomination_url: "https://www.congress.gov/nomination/117th-congress/78",
    confirmation_date: "2021-01-22",
    confirmation_vote_url:
      "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1171/vote_117_1_00005.htm",
    confirmation_vote_result: "Confirmed 93-2",
    predecessor_name: "Mark T. Esper",
    predecessor_source: "https://www.congress.gov/nomination/117th-congress/78",
  };

  it("maps a fully sourced executive row", () => {
    const role = parseDbPoliticianProfile(execRow)!.role;
    expect(role.roleTitle).toBe("Secretary of Defense");
    expect(role.confirmationDate).toBe("2021-01-22");
    expect(role.confirmationVoteResult).toBe("Confirmed 93-2");
    expect(role.predecessorName).toBe("Mark T. Esper");
    expect(role.roleEndDate).toBe("2025-01-24");
  });

  it("recognises foreign-executive as a chamber", () => {
    // 46 prod rows carry it; it used to null out here, so every foreign head
    // of state rendered with no chamber label.
    expect(
      parseDbPoliticianProfile({ ...execRow, chamber: "foreign-executive" })!
        .chamber,
    ).toBe("foreign-executive");
  });

  it("drops the office title when its source is missing", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      role_title_source: null,
    })!.role;
    expect(role.roleTitle).toBeNull();
    expect(role.roleTitleSource).toBeNull();
  });

  it("drops the source when the title is missing", () => {
    const role = parseDbPoliticianProfile({ ...execRow, role_title: "  " })!.role;
    expect(role.roleTitle).toBeNull();
    expect(role.roleTitleSource).toBeNull();
  });

  it("drops the confirmation date and tally without the roll-call URL", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      confirmation_vote_url: null,
    })!.role;
    expect(role.confirmationDate).toBeNull();
    expect(role.confirmationVoteResult).toBeNull();
  });

  it("drops the nomination date without the PN record", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      nomination_url: "",
    })!.role;
    expect(role.nominationDate).toBeNull();
  });

  it("drops the predecessor without its own source", () => {
    // predecessor_source, not nomination_url: an incoming administration's
    // en-bloc nominations carry no "vice <name>" clause, so most predecessors
    // are sourced to the prior roll-call instead.
    const role = parseDbPoliticianProfile({
      ...execRow,
      predecessor_source: null,
    })!.role;
    expect(role.predecessorName).toBeNull();
    // The nomination date is a separate fact with a separate record.
    expect(role.nominationDate).toBe("2021-01-20");
  });

  it("keeps a predecessor sourced to a roll-call rather than a PN record", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      predecessor_name: "Mark T. Esper",
      predecessor_source:
        "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1161/vote_116_1_00229.htm",
    })!.role;
    expect(role.predecessorName).toBe("Mark T. Esper");
    expect(role.predecessorSource).toContain("senate.gov");
  });

  it("drops role dates without their source", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      role_dates_source: null,
    })!.role;
    expect(role.roleStartDate).toBeNull();
    expect(role.roleEndDate).toBeNull();
  });

  it("normalises Date objects from pg to YYYY-MM-DD", () => {
    const role = parseDbPoliticianProfile({
      ...execRow,
      confirmation_date: new Date("2021-01-22T00:00:00Z"),
    })!.role;
    expect(role.confirmationDate).toBe("2021-01-22");
  });
});
