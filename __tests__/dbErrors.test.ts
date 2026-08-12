/**
 * The point of these predicates is what they *don't* match.
 *
 * The pattern they replace — `String(err).includes("does not exist")` — took the
 * degrade path for `role "sift" does not exist` and `database "sift" does not
 * exist`, i.e. exactly the credentials/config failures that should surface as a
 * 500. Those cases are pinned below alongside the ones that should still degrade.
 */
import {
  isMissingColumn,
  isMissingSchemaObject,
  isMissingTable,
  pgErrorCode,
  PG_UNDEFINED_COLUMN,
  PG_UNDEFINED_TABLE,
} from "@/lib/dbErrors";

/** A `pg` error carries the SQLSTATE on `.code` and the server text on `.message`. */
function pgError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

const undefinedTable = pgError(
  PG_UNDEFINED_TABLE,
  'relation "search_queries" does not exist',
);
const undefinedColumn = pgError(
  PG_UNDEFINED_COLUMN,
  'column "entity_links" does not exist',
);

describe("pgErrorCode", () => {
  it("reads the SQLSTATE off a pg error", () => {
    expect(pgErrorCode(undefinedTable)).toBe("42P01");
  });

  it("returns null for anything without a string code", () => {
    expect(pgErrorCode(new Error("boom"))).toBeNull();
    expect(pgErrorCode({ code: 42 })).toBeNull();
    expect(pgErrorCode("relation does not exist")).toBeNull();
    expect(pgErrorCode(null)).toBeNull();
    expect(pgErrorCode(undefined)).toBeNull();
  });
});

describe("isMissingSchemaObject", () => {
  it("matches undefined_table and undefined_column", () => {
    expect(isMissingSchemaObject(undefinedTable)).toBe(true);
    expect(isMissingSchemaObject(undefinedColumn)).toBe(true);
  });

  it("requires the named object when names are given", () => {
    expect(isMissingSchemaObject(undefinedTable, "search_queries")).toBe(true);
    expect(isMissingSchemaObject(undefinedTable, "SEARCH_QUERIES")).toBe(true);
    expect(isMissingSchemaObject(undefinedTable, "articles")).toBe(false);
    expect(
      isMissingSchemaObject(undefinedTable, ["articles", "search_queries"]),
    ).toBe(true);
  });

  it("does not match a substring of a different identifier", () => {
    // "story" must not satisfy a guard written for the "stories" table.
    expect(isMissingSchemaObject(undefinedTable, "search")).toBe(false);
  });

  // The regression this module exists for.
  it.each([
    ["28000", 'role "sift" does not exist'],
    ["3D000", 'database "sift_prod" does not exist'],
    ["28P01", 'password authentication failed for user "sift"'],
    ["57P03", "the database system is starting up"],
    ["53300", "too many clients already"],
  ])("does not swallow %s (%s)", (code, message) => {
    expect(isMissingSchemaObject(pgError(code, message))).toBe(false);
  });

  it("does not match errors with no SQLSTATE at all", () => {
    expect(isMissingSchemaObject(new Error("relation does not exist"))).toBe(
      false,
    );
    expect(isMissingSchemaObject("relation does not exist")).toBe(false);
  });
});

describe("isMissingTable / isMissingColumn", () => {
  it("discriminates table from column", () => {
    expect(isMissingTable(undefinedTable, "search_queries")).toBe(true);
    expect(isMissingTable(undefinedColumn, "entity_links")).toBe(false);
    expect(isMissingColumn(undefinedColumn, "entity_links")).toBe(true);
    expect(isMissingColumn(undefinedTable, "search_queries")).toBe(false);
  });

  it("matches without a name filter", () => {
    expect(isMissingTable(undefinedTable)).toBe(true);
    expect(isMissingColumn(undefinedColumn)).toBe(true);
  });
});
