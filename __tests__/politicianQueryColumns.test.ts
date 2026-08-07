import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The politician dossier query and the row parser are two lists that must
 * agree, and nothing type-checks them against each other: `pg` returns
 * `undefined` for a column that was not selected, and every migration-015/017
 * field on `DbPoliticianProfileRow` is optional (so a pre-015 database still
 * parses). A column missing from the SELECT is therefore invisible — it
 * type-checks, every unit test passes, and the field silently reads null in
 * production.
 *
 * That is not hypothetical. `predecessor_source` shipped in the parser and the
 * seeder but never made it into the SELECT, so `predecessorName` — which the
 * parser deliberately gates on its source — was null on every rendered dossier
 * from #198 until this test was written. The component and parser tests all
 * passed, because they build rows by hand rather than through the query.
 */
const DB_TS = readFileSync(join(process.cwd(), "lib/db.ts"), "utf8");
const POLITICIAN_TS = readFileSync(join(process.cwd(), "lib/politician.ts"), "utf8");

function politicianSelectColumns(): Set<string> {
  const start = DB_TS.indexOf("SELECT bioguide_id, name, party, state, chamber,");
  expect(start).toBeGreaterThan(-1);
  const end = DB_TS.indexOf("FROM politician_profiles", start);
  const body = DB_TS.slice(start + "SELECT".length, end);
  return new Set(
    body
      .split(",")
      .map((c) => c.trim().replace(/\s+AS\s+\w+$/i, ""))
      .filter((c) => /^[a-z_]+$/.test(c)),
  );
}

/** Every `row.<column>` the parser reads out of a DB row. */
function columnsParserReads(): Set<string> {
  const out = new Set<string>();
  for (const m of POLITICIAN_TS.matchAll(/\browf?\.([a-z_]+)/g)) out.add(m[1]);
  for (const m of POLITICIAN_TS.matchAll(/\brow\.([a-z_]+)/g)) out.add(m[1]);
  return out;
}

describe("getPoliticianByBioguide SELECT vs parseDbPoliticianProfile", () => {
  it("selects every column the parser reads", () => {
    const selected = politicianSelectColumns();
    const missing = [...columnsParserReads()].filter((c) => !selected.has(c)).sort();
    expect(missing).toEqual([]);
  });

  it("selects the columns the publish floor and provenance depend on", () => {
    // Named explicitly so a future edit to either list is a deliberate act.
    const selected = politicianSelectColumns();
    for (const column of [
      "role_title",
      "role_title_source",
      "role_verified_at",
      "predecessor_name",
      "predecessor_source",
      "nomination_date",
      "nomination_url",
      "confirmation_date",
      "confirmation_vote_url",
      "confirmation_vote_result",
      "role_start_date",
      "role_end_date",
      "role_dates_source",
      "id_source",
    ]) {
      expect(selected.has(column)).toBe(true);
    }
  });
});
