import {
  entityHref,
  entityTypeLabel,
  parseEntityLinks,
} from "@/lib/entityLinks";
import type { EntityLink } from "@/lib/types";

// ─── parseEntityLinks ───────────────────────────────────────

describe("parseEntityLinks", () => {
  describe("happy path", () => {
    it("parses a well-formed JSONB array into typed EntityLinks", () => {
      const input = [
        { type: "politician", canonical_id: "S000148", surface_form: "Chuck Schumer" },
        { type: "org", canonical_id: "brookings-institution", surface_form: "Brookings Institution" },
        { type: "bill", canonical_id: "hr-5376-117", surface_form: "Inflation Reduction Act" },
        { type: "outlet", canonical_id: "reuters", surface_form: "Reuters" },
      ];
      expect(parseEntityLinks(input)).toEqual([
        { type: "politician", canonicalId: "S000148", surfaceForm: "Chuck Schumer" },
        { type: "org", canonicalId: "brookings-institution", surfaceForm: "Brookings Institution" },
        { type: "bill", canonicalId: "hr-5376-117", surfaceForm: "Inflation Reduction Act" },
        { type: "outlet", canonicalId: "reuters", surfaceForm: "Reuters" },
      ]);
    });

    it("trims whitespace on canonical_id and surface_form", () => {
      const input = [
        { type: "politician", canonical_id: "  S000148  ", surface_form: "  Chuck Schumer  " },
      ];
      expect(parseEntityLinks(input)).toEqual([
        { type: "politician", canonicalId: "S000148", surfaceForm: "Chuck Schumer" },
      ]);
    });
  });

  describe("empty / invalid inputs", () => {
    it.each([
      [null],
      [undefined],
      [42],
      ["not an array"],
      [{ type: "politician" }],  // non-array object
      [true],
    ])("returns [] for %p", (input) => {
      expect(parseEntityLinks(input)).toEqual([]);
    });

    it("returns [] for an empty array", () => {
      expect(parseEntityLinks([])).toEqual([]);
    });
  });

  describe("entry-level filtering", () => {
    it("drops entries missing required fields", () => {
      const input = [
        { type: "politician", canonical_id: "S000148", surface_form: "Schumer" }, // ok
        { type: "politician", canonical_id: "S000149" },                            // no surface
        { type: "politician", surface_form: "Cruz" },                               // no id
        { canonical_id: "C001", surface_form: "Cruz" },                             // no type
        {},                                                                         // empty
      ];
      expect(parseEntityLinks(input)).toEqual([
        { type: "politician", canonicalId: "S000148", surfaceForm: "Schumer" },
      ]);
    });

    it("drops entries with unknown types", () => {
      const input = [
        { type: "politician", canonical_id: "S000148", surface_form: "Schumer" },
        { type: "celebrity", canonical_id: "C001", surface_form: "Bono" },  // not in enum
        { type: "outlet", canonical_id: "reuters", surface_form: "Reuters" },
      ];
      const out = parseEntityLinks(input);
      expect(out.map((e) => e.type)).toEqual(["politician", "outlet"]);
    });

    it("drops entries where canonical_id or surface_form trims to empty", () => {
      const input = [
        { type: "politician", canonical_id: "  ", surface_form: "Schumer" },
        { type: "politician", canonical_id: "S000148", surface_form: "" },
      ];
      expect(parseEntityLinks(input)).toEqual([]);
    });

    it("drops entries with non-string fields", () => {
      const input = [
        { type: "politician", canonical_id: 12345, surface_form: "Schumer" },  // numeric id
        { type: 42, canonical_id: "S000148", surface_form: "Schumer" },        // numeric type
        { type: "politician", canonical_id: "S000148", surface_form: ["Schumer"] }, // array surface
      ];
      expect(parseEntityLinks(input)).toEqual([]);
    });

    it("preserves valid entries even when others are malformed", () => {
      const input = [
        null,
        { type: "politician", canonical_id: "S000148", surface_form: "Schumer" },  // ok
        "string",
        { type: "org", canonical_id: "brookings-institution", surface_form: "Brookings" }, // ok
        { junk: "field" },
      ];
      expect(parseEntityLinks(input)).toEqual([
        { type: "politician", canonicalId: "S000148", surfaceForm: "Schumer" },
        { type: "org", canonicalId: "brookings-institution", surfaceForm: "Brookings" },
      ]);
    });
  });
});

// ─── entityHref ─────────────────────────────────────────────

describe("entityHref", () => {
  const cases: Array<[EntityLink, string]> = [
    [
      { type: "outlet", canonicalId: "reuters", surfaceForm: "Reuters" },
      "/outlet/reuters",
    ],
    [
      { type: "politician", canonicalId: "S000148", surfaceForm: "Schumer" },
      "/politician/S000148",
    ],
    [
      { type: "org", canonicalId: "brookings-institution", surfaceForm: "Brookings" },
      "/org/brookings-institution",
    ],
    [
      { type: "bill", canonicalId: "hr-5376-117", surfaceForm: "IRA" },
      "/bill/hr-5376-117",
    ],
  ];

  it.each(cases)("returns the correct dossier href for %j", (link, expected) => {
    expect(entityHref(link)).toBe(expected);
  });
});

// ─── entityTypeLabel ────────────────────────────────────────

describe("entityTypeLabel", () => {
  it("returns human labels for each type", () => {
    expect(entityTypeLabel("outlet")).toBe("Outlet");
    expect(entityTypeLabel("politician")).toBe("Politician");
    expect(entityTypeLabel("org")).toBe("Organization");
    expect(entityTypeLabel("bill")).toBe("Bill");
  });
});
