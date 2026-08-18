import { isAcronym, parseDbTermProfile, termPatterns } from "@/lib/term";
import type { DbTermProfileRow } from "@/lib/term";
import type { TermProfile } from "@/lib/types";

/**
 * Two rules are pinned here, and they are the two that decide what a term page
 * is allowed to say:
 *
 * 1. **A definition renders only with its source.** The whole reason
 *    `term_profiles` exists rather than reading the ~11,900 primer definitions
 *    already in the corpus is that those have `source: null`. If the parser
 *    lets an unsourced pair through, the table is pointless.
 * 2. **What counts as a mention.** `termPatterns` decides which articles the
 *    page claims to cover, so a loose rule here silently inflates the number
 *    the page prints. See the #40 note in lib/term.ts.
 */

const row = (over: Partial<DbTermProfileRow> = {}): DbTermProfileRow => ({
  slug: "temporary-protected-status",
  term: "Temporary Protected Status",
  definition: "A federal designation that lets nationals of a named country stay.",
  definition_source: "https://www.law.cornell.edu/uscode/text/8/1254a",
  definition_checked: "2026-08-10",
  aliases: ["TPS"],
  category: "immigration",
  notes: null,
  article_count: 146,
  coverage_computed_at: "2026-08-18",
  ...over,
});

const profile = (over: Partial<TermProfile> = {}): TermProfile => ({
  slug: "temporary-protected-status",
  term: "Temporary Protected Status",
  definition: "A federal designation.",
  definitionSource: "https://www.law.cornell.edu/uscode/text/8/1254a",
  definitionChecked: "2026-08-10",
  aliases: ["TPS"],
  category: "immigration",
  notes: null,
  coverageArticleCount: 146,
  coverageComputedAt: "2026-08-18",
  ...over,
});

describe("parseDbTermProfile", () => {
  it("parses a fully sourced row", () => {
    const t = parseDbTermProfile(row())!;
    expect(t.slug).toBe("temporary-protected-status");
    expect(t.definition).toContain("federal designation");
    expect(t.definitionSource).toContain("law.cornell.edu");
    expect(t.definitionChecked).toBe("2026-08-10");
    expect(t.aliases).toEqual(["TPS"]);
  });

  it("drops the definition when its source is missing", () => {
    // The primer shape: good prose, no citation. This is the case the whole
    // table exists to keep off the page.
    const t = parseDbTermProfile(row({ definition_source: null }))!;
    expect(t.definition).toBeNull();
    expect(t.definitionSource).toBeNull();
  });

  it("drops the source when the definition is missing", () => {
    const t = parseDbTermProfile(row({ definition: "   " }))!;
    expect(t.definition).toBeNull();
    expect(t.definitionSource).toBeNull();
  });

  it("drops definitionChecked along with an unsourced definition", () => {
    // A "last verified 2026-08-10" line under nothing would imply someone
    // checked a citation that isn't there.
    const t = parseDbTermProfile(row({ definition_source: "" }))!;
    expect(t.definitionChecked).toBeNull();
  });

  it("keeps the row when the definition is dropped", () => {
    // Coverage is reportage about Sift's own index and stands on its own; the
    // publish floor decides separately whether the page is worth indexing.
    const t = parseDbTermProfile(row({ definition: null }));
    expect(t).not.toBeNull();
    expect(t!.term).toBe("Temporary Protected Status");
  });

  it("returns null without slug or term", () => {
    expect(parseDbTermProfile(row({ slug: "" }))).toBeNull();
    expect(parseDbTermProfile(row({ term: "  " }))).toBeNull();
    expect(parseDbTermProfile(null)).toBeNull();
  });

  it("normalizes malformed aliases to an empty list rather than throwing", () => {
    for (const bad of ["TPS", { a: 1 }, null, [1, 2], undefined]) {
      expect(parseDbTermProfile(row({ aliases: bad }))!.aliases).toEqual([]);
    }
  });

  it("keeps only the string entries of a mixed alias array", () => {
    const t = parseDbTermProfile(row({ aliases: ["TPS", 7, "", "  x  "] }))!;
    expect(t.aliases).toEqual(["TPS", "x"]);
  });

  it("accepts a Date or an ISO string for definition_checked", () => {
    expect(
      parseDbTermProfile(row({ definition_checked: new Date("2026-08-10T00:00:00Z") }))!
        .definitionChecked,
    ).toBe("2026-08-10");
    expect(
      parseDbTermProfile(row({ definition_checked: "not-a-date" }))!.definitionChecked,
    ).toBeNull();
  });
});

describe("isAcronym", () => {
  it("treats a single all-caps token as an acronym", () => {
    expect(isAcronym("TPS")).toBe(true);
    expect(isAcronym("FISA")).toBe(true);
  });

  it("does not treat multi-word or mixed-case forms as acronyms", () => {
    expect(isAcronym("Temporary Protected Status")).toBe(false);
    expect(isAcronym("habeas corpus")).toBe(false);
    expect(isAcronym("McCarthy")).toBe(false);
  });

  it("is false for a token with no letters", () => {
    expect(isAcronym("2026")).toBe(false);
    expect(isAcronym("")).toBe(false);
  });
});

describe("termPatterns", () => {
  it("emits the term first, then its aliases", () => {
    const p = termPatterns(profile());
    expect(p.map((x) => x.phrase)).toEqual(["Temporary Protected Status", "TPS"]);
  });

  it("matches an acronym case-sensitively and a phrase case-insensitively", () => {
    // The #40 rule. A context-free matcher run over the corpus turned ordinary
    // prose into chips ("the nation's fuel" → the-nation, 1,523 articles).
    // Multi-word phrases disambiguate themselves; one-token acronyms don't, and
    // lowercase is where they collide with English.
    const [phrase, acronym] = termPatterns(profile());
    expect(phrase.caseSensitive).toBe(false);
    expect(acronym.caseSensitive).toBe(true);
  });

  it("wraps every surface form in POSIX word boundaries", () => {
    // \m and \M, not \b — Postgres reads \b as a backspace character, so a
    // page built on \b would match substrings and overstate its coverage.
    for (const p of termPatterns(profile())) {
      expect(p.regex.startsWith("\\m")).toBe(true);
      expect(p.regex.endsWith("\\M")).toBe(true);
    }
  });

  it("escapes regex metacharacters in a surface form", () => {
    const p = termPatterns(profile({ term: "Section 230 (c)(1)", aliases: [] }));
    expect(p[0].regex).toBe("\\mSection 230 \\(c\\)\\(1\\)\\M");
  });

  it("deduplicates a surface form repeated as an alias", () => {
    const p = termPatterns(
      profile({ term: "Habeas Corpus", aliases: ["habeas corpus", "HABEAS CORPUS"] }),
    );
    expect(p).toHaveLength(1);
    expect(p[0].phrase).toBe("Habeas Corpus");
  });

  it("skips blank aliases", () => {
    expect(termPatterns(profile({ aliases: ["", "   "] }))).toHaveLength(1);
  });

  it("returns nothing for a term with no usable surface form", () => {
    // The coverage queries short-circuit on this rather than building a
    // `WHERE ()` that Postgres rejects.
    expect(termPatterns(profile({ term: "", aliases: [] }))).toEqual([]);
  });
});

describe("parseDbTermProfile — stored coverage (migration 034)", () => {
  it("carries the stored count and stamp through to the profile", () => {
    const t = parseDbTermProfile(row())!;
    expect(t.coverageArticleCount).toBe(146);
    expect(t.coverageComputedAt).toBe("2026-08-18");
  });

  it("keeps a never-measured term as null rather than coercing to 0", () => {
    // The floor treats null as zero, but the PARSER must not — "never
    // measured" and "measured, found nothing" are different facts, and only
    // the parser can still tell them apart.
    const t = parseDbTermProfile(
      row({ article_count: null, coverage_computed_at: null }),
    )!;
    expect(t.coverageArticleCount).toBeNull();
    expect(t.coverageComputedAt).toBeNull();
  });

  it("keeps a measured zero distinct from never-measured", () => {
    const t = parseDbTermProfile(row({ article_count: 0 }))!;
    expect(t.coverageArticleCount).toBe(0);
    expect(t.coverageComputedAt).toBe("2026-08-18");
  });
});
