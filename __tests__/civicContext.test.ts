/**
 * Tests for the JSONB parser shared by `lib/civicContext` and the
 * politician dossier route (Phase 3.G.3 enrichment).
 *
 * The bulk of `enrichLinksWithContext` is a DB batch query; the only
 * non-trivial pure logic is the JSONB parser (`asTopIndustries`), which
 * has to tolerate malformed rows without crashing the feed. Cover that
 * here. The DB code path is covered by tsc + live verification.
 */
import { asTopIndustries as parseTopIndustries } from "@/lib/politician";

describe("asTopIndustries (civic-context parser)", () => {
  it("returns empty array for null/undefined", () => {
    expect(parseTopIndustries(null)).toEqual([]);
    expect(parseTopIndustries(undefined)).toEqual([]);
  });

  it("returns empty array when not an array", () => {
    expect(parseTopIndustries("not-an-array")).toEqual([]);
    expect(parseTopIndustries({ industry: "x" })).toEqual([]);
    expect(parseTopIndustries(42)).toEqual([]);
  });

  it("parses a valid array of {industry, amount_usd}", () => {
    const out = parseTopIndustries([
      { industry: "Attorneys & law firms", amount_usd: 573700 },
      { industry: "Democratic leadership PAC", amount_usd: 193900 },
    ]);
    expect(out).toEqual([
      { industry: "Attorneys & law firms", amount_usd: 573700 },
      { industry: "Democratic leadership PAC", amount_usd: 193900 },
    ]);
  });

  it("preserves null amount_usd", () => {
    const out = parseTopIndustries([
      { industry: "Some industry", amount_usd: null },
    ]);
    expect(out).toEqual([
      { industry: "Some industry", amount_usd: null },
    ]);
  });

  it("treats missing amount_usd as null", () => {
    const out = parseTopIndustries([{ industry: "Some industry" }]);
    expect(out).toEqual([{ industry: "Some industry", amount_usd: null }]);
  });

  it("treats non-numeric amount_usd as null", () => {
    const out = parseTopIndustries([
      { industry: "Some industry", amount_usd: "lots" },
    ]);
    expect(out[0].amount_usd).toBeNull();
  });

  it("treats NaN/Infinity amount_usd as null", () => {
    const out = parseTopIndustries([
      { industry: "A", amount_usd: NaN },
      { industry: "B", amount_usd: Infinity },
    ]);
    expect(out[0].amount_usd).toBeNull();
    expect(out[1].amount_usd).toBeNull();
  });

  it("drops entries with non-string industry", () => {
    const out = parseTopIndustries([
      { industry: 42, amount_usd: 1000 },
      { industry: "Valid", amount_usd: 2000 },
    ]);
    expect(out).toEqual([{ industry: "Valid", amount_usd: 2000 }]);
  });

  it("drops entries with empty/whitespace-only industry", () => {
    const out = parseTopIndustries([
      { industry: "", amount_usd: 1000 },
      { industry: "   ", amount_usd: 1000 },
      { industry: "Valid", amount_usd: 2000 },
    ]);
    expect(out).toEqual([{ industry: "Valid", amount_usd: 2000 }]);
  });

  it("drops non-object entries gracefully", () => {
    const out = parseTopIndustries([
      null,
      "not-an-object",
      42,
      { industry: "Valid", amount_usd: 1000 },
    ]);
    expect(out).toEqual([{ industry: "Valid", amount_usd: 1000 }]);
  });
});
