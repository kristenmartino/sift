// Term-dossier helpers — parses `term_profiles` rows into the typed
// `TermProfile` the UI consumes, and builds the match patterns the coverage
// query runs against article text.
//
// Everything here is a pure function, so the matching rules are unit-testable
// without a database — which matters more than usual, because those rules
// decide what a page claims to cover.

import type { TermProfile } from "./types";

// ─── DB-row parsing ───────────────────────────────────────────────────

/**
 * Shape of a row from `term_profiles` (sift-api migration 031).
 *
 * `definition` and `definition_source` are NOT NULL at the DB layer. They are
 * typed nullable here anyway: the parser is the enforcement point for the
 * render rule below, and a type that can't express the bad state can't be
 * tested against it.
 */
export interface DbTermProfileRow {
  slug: string;
  term: string;
  definition: string | null;
  definition_source: string | null;
  definition_checked: Date | string | null;
  aliases: unknown; // JSONB — validated below
  category: string | null;
  notes: string | null;
}

/** Coerce a Postgres DATE (Date | ISO string | null) to `YYYY-MM-DD`. */
function asIsoDate(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  const trimmed = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

/** Validate JSONB `aliases` (expected `string[]`); `[]` on anything else. */
function asAliases(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

function present(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/**
 * Validate + shape a raw `term_profiles` row. Returns null without slug+term.
 *
 * **The definition and its source travel as a pair or not at all.** A
 * definition of a legal term rendered without the authority behind it is a
 * claim on Sift's own authority — the thing this table exists to avoid, and
 * the reason the ~11,900 unsourced primer definitions can't be published as
 * pages. Enforcing it here rather than in JSX means the page, the JSON-LD,
 * and any future API response all inherit the rule, the same way
 * `lib/org.ts` nulls the whole budget triple.
 *
 * Note the row survives the drop. A term with coverage but no usable
 * definition still renders its coverage — which is reportage about Sift's own
 * index and needs no citation — and the publish floor decides separately
 * whether it's worth indexing.
 */
export function parseDbTermProfile(
  row: DbTermProfileRow | null | undefined,
): TermProfile | null {
  if (!row) return null;
  const slug = (row.slug ?? "").trim().toLowerCase();
  const term = (row.term ?? "").trim();
  if (!slug || !term) return null;

  const sourced = present(row.definition) && present(row.definition_source);

  return {
    slug,
    term,
    definition: sourced ? row.definition!.trim() : null,
    definitionSource: sourced ? row.definition_source!.trim() : null,
    definitionChecked: sourced ? asIsoDate(row.definition_checked) : null,
    aliases: asAliases(row.aliases),
    category: row.category?.trim() || null,
    notes: row.notes?.trim() || null,
  };
}

// ─── Match patterns for the coverage query ────────────────────────────

/** One surface form, and how strictly to match it. */
export interface TermPattern {
  /** The phrase, for `phraseto_tsquery` — the indexed prefilter. */
  phrase: string;
  /** Word-boundary regex, for the exact confirming predicate. */
  regex: string;
  /** True when the regex must run case-sensitively. See below. */
  caseSensitive: boolean;
}

/** Escape a surface form for safe interpolation into a POSIX regex. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * An all-caps token is matched case-sensitively; everything else isn't.
 *
 * This is the #40 lesson in one rule. A context-free matcher run over the
 * whole corpus turned ordinary prose into chips — `the-nation` fired on 1,523
 * articles about "the nation's fuel", `reason` on 596, `slate` on 412 — and
 * the fix was never "match harder", it was to stop matching things that are
 * also ordinary English.
 *
 * Multi-word terms ("temporary protected status") are safe case-insensitively:
 * the phrase itself does the disambiguating. Short acronyms are not — they are
 * one token, and lowercase is where they collide with words. Requiring
 * "TPS" to appear as "TPS" costs nothing (no publication writes it lowercase)
 * and closes the hole.
 */
export function isAcronym(surface: string): boolean {
  const t = surface.trim();
  return t.length > 0 && !/\s/.test(t) && t === t.toUpperCase() && /[A-Z]/.test(t);
}

/**
 * Every surface form for a term: the term itself plus its curated aliases,
 * deduplicated case-insensitively.
 *
 * Order is term-first so the caller can label the primary match, and the
 * caller is expected to OR these together — a match on any one is a match.
 */
export function termPatterns(term: TermProfile): TermPattern[] {
  const seen = new Set<string>();
  const out: TermPattern[] = [];
  for (const surface of [term.term, ...term.aliases]) {
    const trimmed = surface.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      phrase: trimmed,
      // \m and \M are POSIX word-boundary escapes, which is what Postgres
      // uses — \b would match a literal backspace here.
      regex: `\\m${escapeRegex(trimmed)}\\M`,
      caseSensitive: isAcronym(trimmed),
    });
  }
  return out;
}
