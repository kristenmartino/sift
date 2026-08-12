/**
 * Predicates for the one class of Postgres error this app deliberately
 * tolerates: a schema object that hasn't been migrated into prod yet.
 *
 * Why these exist: several readers here degrade to empty/null when sift-api's
 * migration for a table or column hasn't landed. That tolerance used to be
 * expressed as `String(err).includes("does not exist")`, which matches far more
 * than intended — `role "sift" does not exist`, `database "sift" does not
 * exist`, `password authentication failed for role ... does not exist` and any
 * app-level message containing the phrase all took the degrade path. A bad
 * DATABASE_URL therefore rendered as a silently empty site instead of a 500.
 *
 * SQLSTATE is the precise signal: 42P01 undefined_table, 42703 undefined_column.
 * Anything else propagates.
 */

/** SQLSTATE undefined_table (also raised for undefined views). */
export const PG_UNDEFINED_TABLE = "42P01";
/** SQLSTATE undefined_column. */
export const PG_UNDEFINED_COLUMN = "42703";

/** SQLSTATE of a `pg` error, or null for anything without one. */
export function pgErrorCode(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function errorMessage(err: unknown): string {
  if (typeof err !== "object" || err === null) return "";
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

/**
 * True when `err` is Postgres complaining about a missing schema object.
 *
 * Pass `names` to additionally require that the error names one of the objects
 * you expect to be missing (matched against the quoted identifier Postgres puts
 * in the message, e.g. `relation "search_queries" does not exist`). Without
 * `names`, any undefined-table/undefined-column error qualifies.
 */
export function isMissingSchemaObject(
  err: unknown,
  names?: string | readonly string[],
): boolean {
  const code = pgErrorCode(err);
  if (code !== PG_UNDEFINED_TABLE && code !== PG_UNDEFINED_COLUMN) return false;
  if (names === undefined) return true;

  const wanted = typeof names === "string" ? [names] : names;
  const message = errorMessage(err).toLowerCase();
  return wanted.some((name) => message.includes(`"${name.toLowerCase()}"`));
}

/** True when `err` is `relation "<table>" does not exist`. */
export function isMissingTable(
  err: unknown,
  names?: string | readonly string[],
): boolean {
  return (
    pgErrorCode(err) === PG_UNDEFINED_TABLE && isMissingSchemaObject(err, names)
  );
}

/** True when `err` is `column "<column>" does not exist`. */
export function isMissingColumn(
  err: unknown,
  names?: string | readonly string[],
): boolean {
  return (
    pgErrorCode(err) === PG_UNDEFINED_COLUMN && isMissingSchemaObject(err, names)
  );
}
