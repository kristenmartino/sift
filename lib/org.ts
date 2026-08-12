// Org-provenance helpers — civic-literacy MVP Phase 3.D.
//
// Parses curated rows from `org_profiles` into the typed `OrgProfile` shape
// the UI consumes, plus label formatters for type / political-lean / funding
// budget. Pure functions only; trivially unit-testable.

import type {
  BudgetSourceKind,
  OrgExternalLinks,
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
  "igo",
  "other",
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
  igo: "International organization",
  other: "Organization",
};

/** Human label for an org-type enum value, e.g. `"think-tank"` → `"Think tank"`. */
export function formatOrgTypeLabel(
  type: OrgType | null | undefined,
): string | null {
  if (!type) return null;
  return ORG_TYPE_LABELS[type] ?? null;
}

/** Human label for an org political-lean enum, e.g. `"lean-left"` → `"Lean Left"`. */
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
  founded_year: number | null;
  annual_budget_usd: number | string | null;  // pg returns NUMERIC as string sometimes
  annual_budget_fy: string | null;
  annual_budget_source: string | null;
  major_funders: unknown;  // expected: string[]
  fara_registered: boolean | null;
  fara_countries: unknown;  // expected: string[]
  external_links: unknown;  // expected: OrgExternalLinks
  notes: string | null;
  self_description: string | null;
  self_description_source: string | null;
  self_description_checked: string | Date | null;
  governance_structure: string | null;
  governance_source: string | null;
}

/**
 * A quote is only publishable with the record it came from. Returns the pair
 * or nulls — never a bare characterization of a real organization.
 * (LAUNCH_DECISION_MEMO.md §5 B6; D37.)
 */
function asCitedText(
  text: string | null,
  source: string | null
): { text: string | null; source: string | null } {
  const t = text?.trim() || null;
  const s = source?.trim() || null;
  if (!t || !s) return { text: null, source: null };
  if (!/^https?:\/\//i.test(s)) return { text: null, source: null };
  return { text: t, source: s };
}

function asOrgType(v: string | null): OrgType | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  return ORG_TYPES.has(lower) ? (lower as OrgType) : null;
}

/**
 * Identify which kind of record a budget source points at, so the page can
 * name the figure correctly.
 *
 * Keyed on the source URL rather than on `org.type`, because the label
 * describes the *record*, not the organization — a nonprofit cited to a 990
 * and an agency cited to OMB are different claims even when both are typed
 * `foundation`. Before this, `copy.ts` hardcoded "Per the Form 990 on
 * ProPublica Nonprofit Explorer" for every row, so 23 federal agencies cited
 * to an OMB spreadsheet rendered under the name of a filing they do not have.
 *
 * Host-matched, not substring-matched: a bare `includes("propublica.org")`
 * would also match `evil.com/?u=propublica.org`. Unknown hosts return null and
 * the UI falls back to naming neither.
 */
function budgetSourceKind(src: string): BudgetSourceKind | null {
  let host: string;
  try {
    host = new URL(src).hostname.toLowerCase();
  } catch {
    return null;
  }
  const matches = (domain: string) =>
    host === domain || host.endsWith(`.${domain}`);

  if (matches("propublica.org")) return "form990";
  // OMB publishes the Historical Tables on whitehouse.gov; govinfo carries the
  // same series for prior administrations.
  if (matches("whitehouse.gov") || matches("govinfo.gov")) return "ombOutlays";
  return null;
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
    foundedYear:
      typeof row.founded_year === "number" && Number.isFinite(row.founded_year)
        ? row.founded_year
        : null,
    // Budget renders only with its fiscal year AND source — same rule as
    // self_description. An unsourced figure is what migration 013 removed.
    ...(() => {
      const usd = asNumeric(row.annual_budget_usd);
      const fy = row.annual_budget_fy?.trim() || null;
      const src = row.annual_budget_source?.trim() || null;
      const cited = usd !== null && fy !== null && !!src && /^https?:\/\//i.test(src);
      return {
        annualBudgetUsd: cited ? usd : null,
        annualBudgetFy: cited ? fy : null,
        annualBudgetSource: cited ? src : null,
        annualBudgetKind: cited ? budgetSourceKind(src) : null,
      };
    })(),
    majorFunders: asStringArray(row.major_funders),
    faraRegistered: row.fara_registered === true,
    faraCountries: asStringArray(row.fara_countries),
    externalLinks: asExternalLinks(row.external_links),
    notes: row.notes?.trim() || null,
    ...(() => {
      const self = asCitedText(row.self_description, row.self_description_source);
      const gov = asCitedText(row.governance_structure, row.governance_source);
      const checked =
        row.self_description_checked instanceof Date
          ? row.self_description_checked.toISOString().slice(0, 10)
          : row.self_description_checked?.trim() || null;
      return {
        selfDescription: self.text,
        selfDescriptionSource: self.source,
        selfDescriptionChecked: self.text ? checked : null,
        governanceStructure: gov.text,
        governanceSource: gov.source,
      };
    })(),
  };
}

/**
 * The org's EIN, recovered from its ProPublica link.
 *
 * `org_profiles` has no EIN column — the identifier lives inside the
 * Nonprofit Explorer URL (`/nonprofits/organizations/530196577`), which the
 * curation pass already records. Parsing it here keeps the funding-edge join
 * working without a schema change in the sibling repo, and returns null for
 * every org that has no such link (agencies, IGOs) so the caller skips them.
 *
 * Host-matched like `budgetSourceKind` above: a bare substring test would
 * accept `evil.com/?u=projects.propublica.org/nonprofits/organizations/1`.
 */
export function einFromOrgLinks(
  links: OrgProfile["externalLinks"] | null | undefined,
): string | null {
  const url = links?.propublica;
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "projects.propublica.org" && !host.endsWith(".propublica.org")) {
    return null;
  }
  const match = parsed.pathname.match(/\/organizations\/(\d{9})(?:\/|$)/);
  return match ? match[1] : null;
}
