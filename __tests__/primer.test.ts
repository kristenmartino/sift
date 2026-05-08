import { parseContextPrimer, attachPrimerTermLinks } from "@/lib/primer";
import type { ContextPrimer, EntityLink } from "@/lib/types";

describe("parseContextPrimer", () => {
  describe("null-returning inputs", () => {
    it("returns null for null", () => {
      expect(parseContextPrimer(null)).toBeNull();
    });

    it("returns null for undefined", () => {
      expect(parseContextPrimer(undefined)).toBeNull();
    });

    it("returns null for non-object primitives", () => {
      expect(parseContextPrimer("not an object")).toBeNull();
      expect(parseContextPrimer(42)).toBeNull();
      expect(parseContextPrimer(true)).toBeNull();
    });

    it("returns null for an empty object (no background, no terms)", () => {
      expect(parseContextPrimer({})).toBeNull();
    });

    it("returns null when background is empty AND terms is empty", () => {
      expect(parseContextPrimer({ background: "", terms: [] })).toBeNull();
    });

    it("returns null when background is whitespace-only AND terms is empty", () => {
      expect(parseContextPrimer({ background: "   \n  ", terms: [] })).toBeNull();
    });

    it("returns null when terms is malformed (all entries dropped) and background is empty", () => {
      expect(
        parseContextPrimer({
          background: "",
          terms: [{ term: "" }, { foo: "bar" }, "string-not-object"],
        })
      ).toBeNull();
    });
  });

  describe("happy path", () => {
    it("parses a primer with background + terms", () => {
      const result = parseContextPrimer({
        background: "The Federal Reserve is the central bank of the United States.",
        terms: [
          { term: "FOMC", definition: "Federal Open Market Committee." },
          { term: "basis points", definition: "One-hundredth of a percentage point." },
        ],
      });
      expect(result).not.toBeNull();
      expect(result?.background).toBe(
        "The Federal Reserve is the central bank of the United States."
      );
      expect(result?.terms).toHaveLength(2);
      expect(result?.terms[0].term).toBe("FOMC");
      expect(result?.terms[0].definition).toBe("Federal Open Market Committee.");
    });

    it("parses a primer with only background (no terms)", () => {
      const result = parseContextPrimer({
        background: "Some context.",
        terms: [],
      });
      expect(result?.background).toBe("Some context.");
      expect(result?.terms).toEqual([]);
    });

    it("parses a primer with only terms (no background)", () => {
      const result = parseContextPrimer({
        background: "",
        terms: [{ term: "X", definition: "Y" }],
      });
      expect(result?.background).toBe("");
      expect(result?.terms).toHaveLength(1);
    });

    it("preserves generated_at when present and a string", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [],
        generated_at: "2026-05-05T12:00:00Z",
      });
      expect(result?.generated_at).toBe("2026-05-05T12:00:00Z");
    });

    it("omits generated_at when missing or non-string", () => {
      const a = parseContextPrimer({ background: "x", terms: [] });
      expect(a?.generated_at).toBeUndefined();

      const b = parseContextPrimer({
        background: "x",
        terms: [],
        generated_at: 12345 as unknown as string,
      });
      expect(b?.generated_at).toBeUndefined();
    });
  });

  describe("LLM short-key tolerance", () => {
    it("accepts `def` as an alias for `definition`", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [{ term: "FOMC", def: "Federal Open Market Committee." }],
      });
      expect(result?.terms).toHaveLength(1);
      expect(result?.terms[0].definition).toBe("Federal Open Market Committee.");
    });

    it("prefers `definition` over `def` when both present", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          { term: "FOMC", definition: "canonical", def: "short-key" },
        ],
      });
      expect(result?.terms[0].definition).toBe("canonical");
    });
  });

  describe("malformed term filtering", () => {
    it("drops terms missing the term field", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          { definition: "no term" },
          { term: "ok", definition: "valid" },
        ],
      });
      expect(result?.terms).toHaveLength(1);
      expect(result?.terms[0].term).toBe("ok");
    });

    it("drops terms missing the definition field", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [{ term: "FOMC" }, { term: "ok", definition: "valid" }],
      });
      expect(result?.terms).toHaveLength(1);
    });

    it("drops non-object term entries", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          "not an object",
          null,
          42,
          { term: "ok", definition: "valid" },
        ],
      });
      expect(result?.terms).toHaveLength(1);
    });

    it("drops terms with whitespace-only strings", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          { term: "   ", definition: "valid" },
          { term: "ok", definition: "  " },
          { term: "good", definition: "fine" },
        ],
      });
      expect(result?.terms).toHaveLength(1);
      expect(result?.terms[0].term).toBe("good");
    });
  });

  describe("HTML stripping", () => {
    it("strips HTML tags from background", () => {
      const result = parseContextPrimer({
        background: "<script>alert(1)</script>Real context.",
        terms: [],
      });
      expect(result?.background).toBe("alert(1)Real context.");
    });

    it("strips HTML tags from term + definition", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          { term: "<b>FOMC</b>", definition: "<i>federal</i> committee" },
        ],
      });
      expect(result?.terms[0].term).toBe("FOMC");
      expect(result?.terms[0].definition).toBe("federal committee");
    });
  });

  describe("source field", () => {
    it("preserves source on terms when present", () => {
      const result = parseContextPrimer({
        background: "x",
        terms: [
          { term: "FOMC", definition: "committee", source: "Federal Reserve" },
        ],
      });
      expect(result?.terms[0].source).toBe("Federal Reserve");
    });

    it("omits source when absent or non-string", () => {
      const a = parseContextPrimer({
        background: "x",
        terms: [{ term: "ok", definition: "fine" }],
      });
      expect(a?.terms[0].source).toBeUndefined();

      const b = parseContextPrimer({
        background: "x",
        terms: [
          { term: "ok", definition: "fine", source: 123 as unknown as string },
        ],
      });
      expect(b?.terms[0].source).toBeUndefined();
    });
  });

  describe("non-array terms tolerance", () => {
    it("treats non-array terms as empty", () => {
      const result = parseContextPrimer({
        background: "real background here",
        terms: "not an array" as unknown as [],
      });
      expect(result?.terms).toEqual([]);
      expect(result?.background).toBe("real background here");
    });

    it("treats missing terms field as empty", () => {
      const result = parseContextPrimer({ background: "x" });
      expect(result?.terms).toEqual([]);
    });
  });

  describe("non-string background tolerance", () => {
    it("treats non-string background as empty", () => {
      const result = parseContextPrimer({
        background: 123 as unknown as string,
        terms: [{ term: "ok", definition: "fine" }],
      });
      expect(result?.background).toBe("");
    });
  });
});

// ─── attachPrimerTermLinks (Phase 3.G.4) ──────────────────────────

describe("attachPrimerTermLinks", () => {
  const primer: ContextPrimer = {
    background: "background text",
    terms: [
      { term: "FCC petition", definition: "A formal request to the agency." },
      { term: "filibuster", definition: "Senate procedure requiring 60 votes." },
      { term: "Schumer's stance", definition: "His position on the bill." },
    ],
  };

  const links: EntityLink[] = [
    { type: "org", canonicalId: "fcc", surfaceForm: "FCC" },
    {
      type: "politician",
      canonicalId: "S000148",
      surfaceForm: "Chuck Schumer",
    },
    // Note: surfaceForm is "Schumer" alone — should match "Schumer's stance"
    { type: "politician", canonicalId: "S000148", surfaceForm: "Schumer" },
  ];

  it("returns null primer untouched when input is null", () => {
    expect(attachPrimerTermLinks(null, links)).toBeNull();
  });

  it("returns primer untouched when there are no entity links", () => {
    const out = attachPrimerTermLinks(primer, []);
    expect(out).toBe(primer);
    expect(out?.terms.every((t) => t.link === undefined)).toBe(true);
  });

  it("attaches link when surface form is a substring of the term", () => {
    const out = attachPrimerTermLinks(primer, links);
    const fccTerm = out?.terms.find((t) => t.term === "FCC petition");
    expect(fccTerm?.link).toEqual({ type: "org", canonicalId: "fcc" });
  });

  it("matches case-insensitively", () => {
    const out = attachPrimerTermLinks(
      { background: "", terms: [{ term: "fcc rule", definition: "x" }] },
      [{ type: "org", canonicalId: "fcc", surfaceForm: "FCC" }],
    );
    expect(out?.terms[0].link).toEqual({ type: "org", canonicalId: "fcc" });
  });

  it("does not attach a link to terms that don't contain any surface form", () => {
    const out = attachPrimerTermLinks(primer, links);
    const filibuster = out?.terms.find((t) => t.term === "filibuster");
    expect(filibuster?.link).toBeUndefined();
  });

  it("uses word boundaries — 'abcd' does NOT match surface 'abc'", () => {
    const out = attachPrimerTermLinks(
      { background: "", terms: [{ term: "abcdefg", definition: "x" }] },
      [{ type: "org", canonicalId: "abc", surfaceForm: "ABC" }],
    );
    expect(out?.terms[0].link).toBeUndefined();
  });

  it("matches at word boundary — 'FCC's authority' matches 'FCC'", () => {
    const out = attachPrimerTermLinks(
      { background: "", terms: [{ term: "FCC authority", definition: "x" }] },
      [{ type: "org", canonicalId: "fcc", surfaceForm: "FCC" }],
    );
    expect(out?.terms[0].link).toEqual({ type: "org", canonicalId: "fcc" });
  });

  it("prefers the longer surface form when multiple links could match", () => {
    // 'Federal Reserve' is longer than 'Reserve'; should win.
    const out = attachPrimerTermLinks(
      {
        background: "",
        terms: [{ term: "Federal Reserve action", definition: "x" }],
      },
      [
        { type: "org", canonicalId: "reserve", surfaceForm: "Reserve" },
        { type: "org", canonicalId: "federal-reserve", surfaceForm: "Federal Reserve" },
      ],
    );
    expect(out?.terms[0].link).toEqual({
      type: "org",
      canonicalId: "federal-reserve",
    });
  });

  it("escapes regex metacharacters in surface forms", () => {
    // Period-containing name like 'J.D. Vance' should match literally,
    // not interpret '.' as regex any-char.
    const out = attachPrimerTermLinks(
      { background: "", terms: [{ term: "J.D. Vance memo", definition: "x" }] },
      [{ type: "politician", canonicalId: "V000137", surfaceForm: "J.D. Vance" }],
    );
    expect(out?.terms[0].link).toEqual({
      type: "politician",
      canonicalId: "V000137",
    });
  });

  it("ignores single-character surface forms (would over-match)", () => {
    const out = attachPrimerTermLinks(
      { background: "", terms: [{ term: "a single word", definition: "x" }] },
      [{ type: "outlet", canonicalId: "x", surfaceForm: "a" }],
    );
    expect(out?.terms[0].link).toBeUndefined();
  });

  it("does not mutate the input primer", () => {
    const input: ContextPrimer = {
      background: "bg",
      terms: [{ term: "FCC rule", definition: "x" }],
    };
    const inputTermsRef = input.terms;
    attachPrimerTermLinks(input, [
      { type: "org", canonicalId: "fcc", surfaceForm: "FCC" },
    ]);
    expect(input.terms).toBe(inputTermsRef);
    expect(input.terms[0].link).toBeUndefined();
  });

  it("preserves other primer fields (background, generated_at)", () => {
    const out = attachPrimerTermLinks(
      {
        background: "bg paragraph",
        terms: [{ term: "FCC rule", definition: "x" }],
        generated_at: "2026-05-08T12:00:00Z",
      },
      [{ type: "org", canonicalId: "fcc", surfaceForm: "FCC" }],
    );
    expect(out?.background).toBe("bg paragraph");
    expect(out?.generated_at).toBe("2026-05-08T12:00:00Z");
  });
});
