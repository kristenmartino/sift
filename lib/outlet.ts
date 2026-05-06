// Outlet-provenance helpers — civic-literacy MVP Phase 2.B.
//
// Parses curated rows from `outlet_profiles` into the typed `OutletProfile`
// shape the UI consumes, and provides label formatters for AllSides + MBFC
// values. Everything here is pure-function so it's trivial to unit test.

import type {
  OutletAllSidesRating,
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
 * Shape of a row from `outlet_profiles`. Fields are TEXT/INT/JSONB at the DB
 * layer; `parseDbOutletProfile` validates and maps them onto the typed
 * `OutletProfile` shape the client consumes.
 *
 * Extra DB columns (notes, external_links, major_funders, *_last_checked,
 * updated_at) are intentionally omitted here — they're rendered on the
 * dossier page (Phase 2.C) but irrelevant to feed-card badges.
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
  mbfc_factual: string | null;
  mbfc_url: string | null;
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
    mbfcFactual: asMbfc(row.mbfc_factual),
    mbfcUrl: row.mbfc_url?.trim() || null,
  };
}
