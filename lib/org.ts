// Org-provenance helpers — civic-literacy MVP Phase 3.D.
//
// Parses curated rows from `org_profiles` into the typed `OrgProfile` shape
// the UI consumes, plus label formatters for type / political-lean / funding
// budget. Pure functions only; trivially unit-testable.

import type {
  OrgExternalLinks,
  OrgPoliticalLean,
  OrgProfile,
  OrgType,
} from "./types";

// ─── Enums (in sync with sift-api/scripts/seed_org_profiles.py) ──────

const ORG_TYPES: ReadonlySet<string> = new Set([
  "think-tank",
  "advocacy",
  "union",
  "pac",
  "super-pac",
  "foundation",
  "industry-group",
  "agency",
  "other",
]);

const ORG_LEAN_VALUES: ReadonlySet<string> = new Set([
  "left",
  "lean-left",
  "center",
  "lean-right",
  "right",
  "mixed",
  "nonpartisan",
]);

// ─── Display labels ───────────────────────────────────────────────────

const ORG_TYPE_LABELS: Record<OrgType, string> = {
  "think-tank": "Think tank",
  advocacy: "Advocacy organization",
  union: "Labor union",
  pac: "Political action committee",
  "super-pac": "Super PAC",
  foundation: "Foundation",
  "industry-group": "Industry group",
  agency: "Federal agency",
  other: "Organization",
};

/** Human label for an org-type enum value, e.g. `"think-tank"` → `"Think tank"`. */
export function formatOrgTypeLabel(
  type: OrgType | null | undefined,
): string | null {
  if (!type) return null;
  return ORG_TYPE_LABELS[type] ?? null;
}

const ORG_LEAN_LABELS: Record<OrgPoliticalLean, string> = {
  left: "Left",
  "lean-left": "Lean Left",
  center: "Center",
  "lean-right": "Lean Right",
  right: "Right",
  mixed: "Mixed",
  nonpartisan: "Nonpartisan",
};

/** Human label for an org political-lean enum, e.g. `"lean-left"` → `"Lean Left"`. */
export function formatOrgLeanLabel(
  lean: OrgPoliticalLean | null | undefined,
): string | null {
  if (!lean) return null;
  return ORG_LEAN_LABELS[lean] ?? null;
}

/**
 * Compact USD formatter for org budgets.
 *   1_200_000_000 → "$1.2B"
 *   120_000_000   → "$120M"
 *   9_000_000     → "$9M"
 *   500_000       → "$500K"
 *   9_000         → "$9K"
 *   500           → "$500"
 *
 * Returns null for null/undefined or non-finite numbers.
 */
export function formatBudgetUsd(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const a = Math.abs(amount);
  if (a >= 1_000_000_000) {
    const v = amount / 1_000_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (a >= 1_000_000) {
    const v = amount / 1_000_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (a >= 1_000) {
    const v = amount / 1_000;
    return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

// ─── DB-row parsing ───────────────────────────────────────────────────

/**
 * Shape of a row from `org_profiles`. Numerics arrive as JS numbers from
 * `pg`; JSONB columns arrive parsed; we re-validate everything.
 *
 * `updated_at` is internal-only and intentionally omitted.
 */
export interface DbOrgProfileRow {
  slug: string;
  name: string;
  type: string | null;
  political_lean: string | null;
  founded_year: number | null;
  annual_budget_usd: number | string | null;  // pg returns NUMERIC as string sometimes
  major_funders: unknown;  // expected: string[]
  fara_registered: boolean | null;
  fara_countries: unknown;  // expected: string[]
  external_links: unknown;  // expected: OrgExternalLinks
  notes: string | null;
}

function asOrgType(v: string | null): OrgType | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return ORG_TYPES.has(lower) ? (lower as OrgType) : null;
}

function asOrgLean(v: string | null): OrgPoliticalLean | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return ORG_LEAN_VALUES.has(lower) ? (lower as OrgPoliticalLean) : null;
}

/**
 * Coerce pg's NUMERIC representation (often returned as string to preserve
 * precision) into a JS number. Returns null for invalid inputs rather than
 * NaN — the dossier conditionally skips the budget section on null.
 */
function asNumeric(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function asExternalLinks(v: unknown): OrgExternalLinks {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: OrgExternalLinks = {};
  for (const [key, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Validate + shape a raw `org_profiles` row. Returns null when the
 * required identity fields (slug, name) are missing. Unknown enum values
 * null out (UI tolerates absence rather than rendering bad labels).
 * Malformed JSONB degrades to empty list/object so the dossier renders
 * partial sections cleanly.
 */
export function parseDbOrgProfile(
  row: DbOrgProfileRow | null | undefined,
): OrgProfile | null {
  if (!row) return null;
  const slug = (row.slug ?? "").trim().toLowerCase();
  const name = (row.name ?? "").trim();
  if (!slug || !name) return null;

  return {
    slug,
    name,
    type: asOrgType(row.type),
    politicalLean: asOrgLean(row.political_lean),
    foundedYear:
      typeof row.founded_year === "number" && Number.isFinite(row.founded_year)
        ? row.founded_year
        : null,
    annualBudgetUsd: asNumeric(row.annual_budget_usd),
    majorFunders: asStringArray(row.major_funders),
    faraRegistered: row.fara_registered === true,
    faraCountries: asStringArray(row.fara_countries),
    externalLinks: asExternalLinks(row.external_links),
    notes: row.notes?.trim() || null,
  };
}
