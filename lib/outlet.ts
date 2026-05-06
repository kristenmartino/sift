// Outlet-provenance helpers — civic-literacy MVP Phase 2.B.
//
// Parses curated rows from `outlet_profiles` into the typed `OutletProfile`
// shape the UI consumes, and provides label formatters for AllSides + MBFC
// values. Everything here is pure-function so it's trivial to unit test.

import type {
  OutletAllSidesRating,
  OutletExternalLinks,
  OutletFundingModel,
  OutletMbfcRating,
  OutletProfile,
} from "./types";

// ─── Enums (kept in sync with sift-api's seed_outlet_profiles.py) ─────

const ALLSIDES_VALUES: ReadonlySet<string> = new Set([
  "left",
  "lean-left",
  "center",
  "lean-right",
  "right",
  "mixed",
]);

const MBFC_VALUES: ReadonlySet<string> = new Set([
  "very-high",
  "high",
  "mostly-factual",
  "mixed",
  "low",
  "very-low",
]);

const FUNDING_VALUES: ReadonlySet<string> = new Set([
  "subscription",
  "advertising",
  "foundation",
  "donations",
  "mixed",
  "public-service",
]);

// ─── Display labels ───────────────────────────────────────────────────

const ALLSIDES_LABELS: Record<OutletAllSidesRating, string> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
  mixed: "Mixed",
};

const MBFC_LABELS: Record<OutletMbfcRating, string> = {
  "very-high": "Very High",
  high: "High",
  "mostly-factual": "Mostly Factual",
  mixed: "Mixed",
  low: "Low",
  "very-low": "Very Low",
};

/** Human label for an AllSides rating, e.g. `"lean-left"` → `"Lean Left"`. */
export function formatAllSidesLabel(
  rating: OutletAllSidesRating | null | undefined,
): string | null {
  if (!rating) return null;
  return ALLSIDES_LABELS[rating] ?? null;
}

/** Human label for an MBFC factual rating, e.g. `"mostly-factual"` → `"Mostly Factual"`. */
export function formatMbfcLabel(
  rating: OutletMbfcRating | null | undefined,
): string | null {
  if (!rating) return null;
  return MBFC_LABELS[rating] ?? null;
}

// ─── DB-row parsing ───────────────────────────────────────────────────

/**
 * Shape of a row from `outlet_profiles`. Fields are TEXT/INT/JSONB/DATE at the
 * DB layer; `parseDbOutletProfile` validates + normalizes them onto the
 * typed `OutletProfile` shape the client consumes.
 *
 * Date columns arrive as `Date` instances from `pg`; we serialize to ISO
 * YYYY-MM-DD so server→client transit is plain JSON.
 *
 * `updated_at` is intentionally omitted — internal-only, never surfaced.
 */
export interface DbOutletProfileRow {
  slug: string;
  name: string;
  parent_company: string | null;
  parent_company_url: string | null;
  founded_year: number | null;
  funding_model: string | null;
  allsides_rating: string | null;
  allsides_url: string | null;
  allsides_last_checked: Date | string | null;
  mbfc_factual: string | null;
  mbfc_url: string | null;
  mbfc_last_checked: Date | string | null;
  major_funders: unknown; // JSONB — validated below
  external_links: unknown; // JSONB — validated below
  notes: string | null;
}

function asAllSides(v: string | null): OutletAllSidesRating | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return ALLSIDES_VALUES.has(lower) ? (lower as OutletAllSidesRating) : null;
}

function asMbfc(v: string | null): OutletMbfcRating | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return MBFC_VALUES.has(lower) ? (lower as OutletMbfcRating) : null;
}

function asFunding(v: string | null): OutletFundingModel | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return FUNDING_VALUES.has(lower) ? (lower as OutletFundingModel) : null;
}

/**
 * Coerce a Postgres date column value (Date | ISO string | null) to a stable
 * `YYYY-MM-DD` string for serialization to Client Components. Returns null
 * for invalid or missing values rather than throwing.
 */
function asIsoDate(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    return v.toISOString().slice(0, 10);
  }
  // pg may return DATE columns as plain "YYYY-MM-DD" strings depending on
  // type-parser config. Trust the prefix if it's well-formed, else null.
  const trimmed = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return null;
}

/**
 * Validate JSONB `major_funders` (expected shape: `string[]`). Drops any
 * non-string entries, normalizes whitespace, returns `[]` for malformed
 * inputs rather than throwing — the dossier renders nothing on `[]`.
 */
function asMajorFunders(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Validate JSONB `external_links` (expected shape: `Record<string, string>`).
 * Drops non-string values; returns `{}` for malformed inputs.
 */
function asExternalLinks(v: unknown): OutletExternalLinks {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: OutletExternalLinks = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Validate + shape a raw `outlet_profiles` row. Returns null if the row is
 * missing the two required identity fields (slug, name); unknown enum values
 * are silently dropped to null so the UI degrades gracefully rather than
 * rendering garbage labels.
 */
export function parseDbOutletProfile(
  row: DbOutletProfileRow | null | undefined,
): OutletProfile | null {
  if (!row) return null;
  const slug = (row.slug ?? "").trim();
  const name = (row.name ?? "").trim();
  if (!slug || !name) return null;

  return {
    slug,
    name,
    parentCompany: row.parent_company?.trim() || null,
    parentCompanyUrl: row.parent_company_url?.trim() || null,
    foundedYear: typeof row.founded_year === "number" ? row.founded_year : null,
    fundingModel: asFunding(row.funding_model),
    allSidesRating: asAllSides(row.allsides_rating),
    allSidesUrl: row.allsides_url?.trim() || null,
    allSidesLastChecked: asIsoDate(row.allsides_last_checked),
    mbfcFactual: asMbfc(row.mbfc_factual),
    mbfcUrl: row.mbfc_url?.trim() || null,
    mbfcLastChecked: asIsoDate(row.mbfc_last_checked),
    majorFunders: asMajorFunders(row.major_funders),
    externalLinks: asExternalLinks(row.external_links),
    notes: row.notes?.trim() || null,
  };
}

// ─── Display labels for the rest of the dossier ─────────

const FUNDING_LABELS: Record<OutletFundingModel, string> = {
  subscription: "Subscription",
  advertising: "Advertising",
  foundation: "Foundation",
  donations: "Reader donations",
  mixed: "Mixed",
  "public-service": "Public service",
};

/** Human label for a funding-model enum value. */
export function formatFundingLabel(
  model: OutletFundingModel | null | undefined,
): string | null {
  if (!model) return null;
  return FUNDING_LABELS[model] ?? null;
}
